// Load environment variables
require('dotenv').config();

const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const axios = require('axios');
const emailService = require('./emailService');
const { getEmailConfig, validateEmailConfig } = require('./config/email');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Handlebars
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: function (a, b) {
      return a === b;
    },
    contains: function (array, value) {
      console.log('🔧 contains() called with:', { array, value, valueToString: value.toString() });
      if (!array || !Array.isArray(array)) {
        console.log('🔧 contains() returning false - array is invalid');
        return false;
      }
      const result = array.includes(value.toString());
      console.log('🔧 contains() returning:', result);
      return result;
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// In-memory storage for websites
let websites = [];
let nextId = 1;
let statisticsCache = {};

// Monitoring data storage
let monitoringHistory = {}; // Store monitoring results per site
let activeMonitors = new Map(); // Store active monitoring intervals

// Notification storage
let notificationSettings = {
  email: '',
  consecutiveFailures: 3,
  enabledSites: []
};
let notificationLog = [];
let siteFailureCounts = {}; // Track consecutive failures per site
let lastNotificationStatus = {}; // Track last notification status per site

// Initialize email service
async function initializeEmailService() {
  const emailConfig = getEmailConfig();

  if (validateEmailConfig(emailConfig) || process.env.EMAIL_PROVIDER === 'test') {
    try {
      const success = await emailService.configure(emailConfig);
      if (success) {
        // Verify configuration in background
        emailService.verifyConfiguration().catch(err => {
          console.warn('⚠️ Email verification failed:', err.message);
        });
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  } else {
    console.warn('⚠️ Email configuration is incomplete. Email notifications will be disabled.');
    console.warn('⚠️ Set EMAIL_USER and EMAIL_PASSWORD environment variables to enable email notifications.');
    console.warn('⚠️ Or set EMAIL_PROVIDER=test to use test mode.');
  }
}

// Initialize with some mock data for testing
function initializeMockData() {
  websites = [
    {
      id: 1,
      name: 'Google',
      url: 'https://google.com',
      interval: '5',
      description: 'Search engine',
      status: 'up',
      statusText: 'ONLINE',
      lastCheck: '12:34:56',
      responseTime: '120 ms',
      createdAt: new Date()
    },
    {
      id: 2,
      name: 'Example Site',
      url: 'https://example.com',
      interval: '15',
      description: 'Example website',
      status: 'down',
      statusText: 'OFFLINE',
      lastCheck: '12:33:45',
      responseTime: 'N/A',
      createdAt: new Date()
    },
    {
      id: 3,
      name: 'Test Website',
      url: 'https://test.example.org',
      interval: '30',
      description: 'Test site',
      status: 'unknown',
      statusText: 'UNKNOWN',
      lastCheck: 'Mitte kunagi',
      responseTime: 'N/A',
      createdAt: new Date()
    }
  ];
  nextId = 4;

  // Reset notification data
  notificationSettings = {
    email: '',
    consecutiveFailures: 3,
    enabledSites: []
  };
  notificationLog = [];
  siteFailureCounts = {};
  lastNotificationStatus = {};

  // Reset monitoring data
  monitoringHistory = {};
  stopAllMonitoring();

  // Add some mock monitoring history for statistics testing
  const now = new Date();
  websites.forEach(website => {
    monitoringHistory[website.id] = [];    // Generate monitoring history for the last 30 days
    for (let i = 0; i < 30 * 24; i++) { // 30 days * 24 hours
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // Each hour
      const isOnline = Math.random() > 0.05; // 95% uptime

      monitoringHistory[website.id].push({
        timestamp: timestamp,
        status: isOnline ? 'up' : 'down',
        responseTime: isOnline ? Math.floor(Math.random() * 500) + 50 : 0,
        statusCode: isOnline ? 200 : 0,
        success: isOnline,
        error: isOnline ? null : 'Connection timeout'
      });
    }
  });

  // Start monitoring for all websites
  setTimeout(() => {
    startAllMonitoring();
  }, 1000); // Delay to ensure server is ready
}

// Initialize mock data
initializeMockData();

// Helper function to get current timestamp
function getCurrentTime() {
  return new Date().toLocaleTimeString('et-EE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Helper function to simulate website status check (for demo purposes)
function getRandomStatus() {
  const statuses = ['online', 'offline', 'unknown'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Helper functions for notifications
function detectSiteDown(siteId, status) {
  console.log(`🔍 Detecting site status: siteId=${siteId}, status=${status}, failCount=${siteFailureCounts[siteId] || 0}, threshold=${notificationSettings.consecutiveFailures}`);
  console.log(`🔍 EnabledSites:`, notificationSettings.enabledSites);
  console.log(`🔍 Email configured:`, notificationSettings.email);

  if (status === 'offline' || status === 'down') {
    // Don't increment if already at threshold (from simulation)
    if (!siteFailureCounts[siteId] || siteFailureCounts[siteId] < notificationSettings.consecutiveFailures) {
      siteFailureCounts[siteId] = (siteFailureCounts[siteId] || 0) + 1;
    }

    if (siteFailureCounts[siteId] >= notificationSettings.consecutiveFailures) {
      const site = websites.find(w => w.id == siteId);
      console.log(`🚨 Site failure threshold reached for site ${siteId}`);
      console.log(`🚨 Site found:`, !!site);
      console.log(`🚨 Site enabled:`, notificationSettings.enabledSites.includes(siteId.toString()));
      console.log(`🚨 Not already notified:`, lastNotificationStatus[siteId] !== 'down');

      if (site && notificationSettings.enabledSites.includes(siteId.toString()) &&
        lastNotificationStatus[siteId] !== 'down') {
        sendDownNotification(site).catch(err => {
          console.error('Error in sendDownNotification:', err);
        });
        lastNotificationStatus[siteId] = 'down';
      }
    }
  } else if (status === 'online' || status === 'up') {
    console.log(`🟢 Processing recovery for site ${siteId}`);
    console.log(`🟢 Failure count check: ${siteFailureCounts[siteId]} >= ${notificationSettings.consecutiveFailures}: ${siteFailureCounts[siteId] >= notificationSettings.consecutiveFailures}`);
    console.log(`🟢 Last status check: ${lastNotificationStatus[siteId]} === 'down': ${lastNotificationStatus[siteId] === 'down'}`);

    if (siteFailureCounts[siteId] >= notificationSettings.consecutiveFailures &&
      lastNotificationStatus[siteId] === 'down') {
      const site = websites.find(w => w.id == siteId);
      console.log(`🟢 Site found for recovery: ${!!site}`);
      console.log(`🟢 Site enabled for notifications: ${notificationSettings.enabledSites.includes(siteId.toString())}`);

      if (site && notificationSettings.enabledSites.includes(siteId.toString())) {
        console.log(`🟢 Sending recovery notification for site ${siteId}`);
        sendRecoveryNotification(site).catch(err => {
          console.error('Error in sendRecoveryNotification:', err);
        });
        lastNotificationStatus[siteId] = 'up';
      }
    }
    siteFailureCounts[siteId] = 0;
  }
}

async function sendDownNotification(site) {
  const timestamp = new Date();
  const notification = {
    id: Date.now(),
    type: 'down',
    siteId: site.id,
    siteName: site.name,
    siteUrl: site.url,
    message: `Site ${site.name} (${site.url}) is experiencing problems and is currently down. Problem detected after ${notificationSettings.consecutiveFailures} consecutive failures.`,
    detectionTime: timestamp.toISOString(),
    notificationTime: timestamp.toISOString(),
    timestamp: timestamp.toLocaleString()
  };

  notificationLog.unshift(notification);

  // Send real email notification
  if (notificationSettings.email) {
    try {
      const emailSent = await emailService.sendDownNotification(
        notificationSettings.email,
        site,
        notificationSettings.consecutiveFailures
      );

      if (emailSent) {
        console.log(`📧 Email notification sent successfully to ${notificationSettings.email}`);
        notification.emailSent = true;
      } else {
        console.log(`❌ Failed to send email notification to ${notificationSettings.email}`);
        notification.emailSent = false;
      }
    } catch (error) {
      console.error(`❌ Error sending email notification:`, error.message);
      notification.emailSent = false;
    }
  } else {
    console.log(`⚠️ No email address configured for notifications`);
    notification.emailSent = false;
  }

  console.log(`📋 Notification logged:`, notification);
}

async function sendRecoveryNotification(site) {
  const timestamp = new Date();
  const notification = {
    id: Date.now() + 1,
    type: 'recovery',
    siteId: site.id,
    siteName: site.name,
    siteUrl: site.url,
    message: `Site ${site.name} (${site.url}) has recovered and is now available again.`,
    detectionTime: timestamp.toISOString(),
    notificationTime: timestamp.toISOString(),
    timestamp: timestamp.toLocaleString()
  };

  notificationLog.unshift(notification);

  // Send real email notification
  if (notificationSettings.email) {
    try {
      const emailSent = await emailService.sendRecoveryNotification(
        notificationSettings.email,
        site
      );

      if (emailSent) {
        console.log(`📧 Recovery notification sent successfully to ${notificationSettings.email}`);
        notification.emailSent = true;
      } else {
        console.log(`❌ Failed to send recovery notification to ${notificationSettings.email}`);
        notification.emailSent = false;
      }
    } catch (error) {
      console.error(`❌ Error sending recovery notification:`, error.message);
      notification.emailSent = false;
    }
  } else {
    console.log(`⚠️ No email address configured for notifications`);
    notification.emailSent = false;
  }

  console.log(`📋 Recovery notification logged:`, notification);
}

// Helper function to calculate statistics using real monitoring data
function calculateStatistics(websiteId, period = '24h') {
  const history = monitoringHistory[websiteId] || [];
  const now = new Date();
  let hoursBack;

  switch (period) {
    case '24h':
      hoursBack = 24;
      break;
    case '7d':
      hoursBack = 24 * 7;
      break;
    case '30d':
      hoursBack = 24 * 30;
      break;
    default:
      hoursBack = 24;
  }

  const cutoffTime = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000));
  const periodData = history.filter(record => record.timestamp >= cutoffTime);

  if (periodData.length === 0) {
    return {
      uptimePercentage: 0,
      avgResponseTime: 0,
      outageCount: 0,
      totalOutageDuration: 0,
      period
    };
  }
  const totalChecks = periodData.length;
  const onlineChecks = periodData.filter(record => record.status === 'up' || record.status === 'online').length;
  const uptimePercentage = totalChecks > 0 ? ((onlineChecks / totalChecks) * 100).toFixed(1) : 0;

  // Calculate average response time
  const onlineRecords = periodData.filter(record => record.responseTime !== null);
  const avgResponseTime = onlineRecords.length > 0
    ? Math.round(onlineRecords.reduce((sum, record) => sum + record.responseTime, 0) / onlineRecords.length)
    : 0;

  // Calculate outages
  const outages = [];
  let currentOutage = null;
  periodData.forEach(record => {
    if (record.status === 'down' || record.status === 'offline') {
      if (!currentOutage) {
        currentOutage = {
          start: record.timestamp,
          end: record.timestamp,
          duration: 1
        };
      } else {
        currentOutage.end = record.timestamp;
        currentOutage.duration++;
      }
    } else if (currentOutage) {
      outages.push(currentOutage);
      currentOutage = null;
    }
  });

  if (currentOutage) {
    outages.push(currentOutage);
  }

  const totalOutageDuration = outages.reduce((sum, outage) => sum + outage.duration, 0);

  return {
    uptimePercentage: parseFloat(uptimePercentage),
    avgResponseTime,
    outageCount: outages.length,
    totalOutageDuration: Math.round(totalOutageDuration), // in hours
    period
  };
}

// Real Website Monitoring System
async function checkWebsite(website) {
  const startTime = Date.now();

  try {
    // Configure axios request with timeout
    const response = await axios.get(website.url, {
      timeout: 10000, // 10 second timeout
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept 2xx and 3xx status codes
      },
      headers: {
        'User-Agent': 'Uptime-Tracker/1.0'
      }
    });

    const responseTime = Date.now() - startTime;    const checkResult = {
      timestamp: new Date(),
      status: 'up',
      responseTime: responseTime,
      statusCode: response.status,
      success: true
    };

    // Store in monitoring history
    if (!monitoringHistory[website.id]) {
      monitoringHistory[website.id] = [];
    }
    monitoringHistory[website.id].unshift(checkResult);

    // Keep only last 1000 results per site
    if (monitoringHistory[website.id].length > 1000) {
      monitoringHistory[website.id] = monitoringHistory[website.id].slice(0, 1000);
    }    // Update website status
    website.status = 'up';
    website.statusText = 'ONLINE';
    website.lastCheck = getCurrentTime();
    website.responseTime = `${responseTime} ms`;

    // Reset failure count and trigger recovery notification if needed
    detectSiteUp(website.id);

    console.log(`✅ ${website.name} (${website.url}) - Online - ${responseTime}ms`);

  } catch (error) {
    const responseTime = Date.now() - startTime;    const checkResult = {
      timestamp: new Date(),
      status: 'down',
      responseTime: responseTime,
      error: error.message,
      success: false
    };

    // Store in monitoring history
    if (!monitoringHistory[website.id]) {
      monitoringHistory[website.id] = [];
    }
    monitoringHistory[website.id].unshift(checkResult);

    // Keep only last 1000 results per site
    if (monitoringHistory[website.id].length > 1000) {
      monitoringHistory[website.id] = monitoringHistory[website.id].slice(0, 1000);
    }    // Update website status
    website.status = 'down';
    website.statusText = 'OFFLINE';
    website.lastCheck = getCurrentTime();
    website.responseTime = 'N/A';    // Increment failure count and trigger down notification if needed
    detectSiteDown(website.id, 'down');

    console.log(`❌ ${website.name} (${website.url}) - Offline - Error: ${error.message}`);
  }
}

function startMonitoring(website) {
  // Convert interval from minutes to milliseconds
  const intervalMinutes = parseInt(website.interval) || 5;
  const intervalMs = intervalMinutes * 60000; // Convert to milliseconds

  // Stop existing monitor if any
  if (activeMonitors.has(website.id)) {
    clearInterval(activeMonitors.get(website.id));
  }

  // Initial check
  checkWebsite(website);

  // Set up periodic monitoring
  const intervalId = setInterval(() => {
    checkWebsite(website);
  }, intervalMs);

  activeMonitors.set(website.id, intervalId);

  console.log(`🔄 Started monitoring ${website.name} every ${website.interval} minutes`);
}

function stopMonitoring(websiteId) {
  if (activeMonitors.has(websiteId)) {
    clearInterval(activeMonitors.get(websiteId));
    activeMonitors.delete(websiteId);
    console.log(`⏹️ Stopped monitoring website ${websiteId}`);
  }
}

function startAllMonitoring() {
  websites.forEach(website => {
    startMonitoring(website);
  });
}

function stopAllMonitoring() {
  activeMonitors.forEach((intervalId, websiteId) => {
    clearInterval(intervalId);
  });
  activeMonitors.clear();
  console.log('⏹️ Stopped all monitoring');
}

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.render('home', {
    title: 'Uptime Tracker',
    heading: 'Website Monitoring'
  });
});

// Handle form submission
app.post('/add-website', (req, res) => {
  const { url, name, interval, description } = req.body;

  // Basic validation
  const errors = {};

  if (!url) {
    errors.urlRequired = true;
  } else if (!isValidUrl(url)) {
    errors.urlInvalid = true;
  }

  if (!name) {
    errors.nameRequired = true;
  }

  if (Object.keys(errors).length > 0) {
    return res.render('home', {
      title: 'Uptime Tracker',
      heading: 'Website Monitoring',
      errors,
      formData: { url, name, interval, description }
    });
  }
  // Save the website to in-memory storage
  const status = getRandomStatus();
  const newWebsite = {
    id: nextId++,
    name: name,
    url: url,
    interval: interval || '5',
    description: description || '',
    status: status === 'online' ? 'up' : status === 'offline' ? 'down' : 'unknown',
    statusText: status.toUpperCase(),
    lastCheck: getCurrentTime(),
    responseTime: status === 'online' ? `${Math.floor(Math.random() * 500) + 50} ms` : 'N/A',
    createdAt: new Date()
  };

  websites.push(newWebsite);

  // Start monitoring for the new website
  startMonitoring(newWebsite);

  // Success - redirect to success page or dashboard
  res.redirect('/success?name=' + encodeURIComponent(name) + '&url=' + encodeURIComponent(url));
});

// Success page
app.get('/success', (req, res) => {
  const { name, url } = req.query;
  res.render('success', {
    title: 'Monitoring Added',
    websiteName: name,
    websiteUrl: url
  });
});

// Test route to reset data (for testing purposes)
app.post('/reset-data', (req, res) => {
  initializeMockData();
  res.json({ success: true, message: 'Data reset successfully' });
});

// Route to clear all data (for testing empty state)
app.post('/clear-data', (req, res) => {
  websites = [];
  nextId = 1;
  res.json({ message: 'All data cleared' });
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  const { empty } = req.query;

  // If no websites are stored, show empty state
  if (empty === 'true' || websites.length === 0) {
    return res.render('dashboard', {
      title: 'Dashboard - Monitooring',
      empty: true,
      isDashboard: true
    });
  }

  // Show real websites data
  res.render('dashboard', {
    title: 'Dashboard - Monitooring',
    websites: websites,
    empty: false,
    isDashboard: true
  });
});

// Statistics page route
app.get('/statistics/:id', (req, res) => {
  const websiteId = parseInt(req.params.id);
  const website = websites.find(w => w.id === websiteId);

  if (!website) {
    return res.status(404).send('Website not found');
  }

  // Calculate statistics for all periods
  const stats24h = calculateStatistics(websiteId, '24h');
  const stats7d = calculateStatistics(websiteId, '7d');
  const stats30d = calculateStatistics(websiteId, '30d');

  res.render('statistics', {
    title: `Statistics - ${website.name}`,
    website,
    stats24h,
    stats7d,
    stats30d,
    isDashboard: true
  });
});

// API endpoint for statistics data
app.get('/api/statistics/:id', (req, res) => {
  const websiteId = parseInt(req.params.id);
  const website = websites.find(w => w.id === websiteId);

  if (!website) {
    return res.status(404).json({ error: 'Website not found' });
  }

  const stats24h = calculateStatistics(websiteId, '24h');
  const stats7d = calculateStatistics(websiteId, '7d');
  const stats30d = calculateStatistics(websiteId, '30d');

  res.json({
    website,
    uptime24h: stats24h.uptimePercentage,
    uptime7d: stats7d.uptimePercentage,
    uptime30d: stats30d.uptimePercentage,
    avgResponse24h: stats24h.avgResponseTime,
    avgResponse7d: stats7d.avgResponseTime,
    avgResponse30d: stats30d.avgResponseTime,
    outageCount24h: stats24h.outageCount,
    outageCount7d: stats7d.outageCount,
    outageCount30d: stats30d.outageCount,
    outageDuration24h: stats24h.totalOutageDuration,
    outageDuration7d: stats7d.totalOutageDuration,
    outageDuration30d: stats30d.totalOutageDuration
  });
});

// Notification settings page
app.get('/settings/notifications', (req, res) => {
  const { success } = req.query;

  console.log('🔧 GET /settings/notifications');
  console.log('🔧 Current notificationSettings:', notificationSettings);
  console.log('🔧 Available websites:', websites.map(w => ({ id: w.id, name: w.name })));

  res.render('notification-settings', {
    title: 'Notification Settings',
    notificationSettings,
    websites,
    isDashboard: true,
    showSuccess: success === 'true'
  });
});

// Save notification settings
app.post('/settings/notifications', (req, res) => {
  const { email, consecutiveFailures, enabledSites } = req.body;

  console.log('🔧 Form submission received:', req.body);
  console.log('🔧 Email:', email);
  console.log('🔧 Consecutive failures:', consecutiveFailures);
  console.log('🔧 Enabled sites raw:', enabledSites);

  notificationSettings.email = email || '';
  notificationSettings.consecutiveFailures = parseInt(consecutiveFailures) || 3;
  notificationSettings.enabledSites = Array.isArray(enabledSites) ? enabledSites : (enabledSites ? [enabledSites] : []);

  console.log('🔧 Settings after processing:', notificationSettings);

  console.log('Settings saved:', notificationSettings);

  // Redirect back to the settings page with success message
  res.redirect('/settings/notifications?success=true');
});

// Notification log page
app.get('/notifications/log', (req, res) => {
  res.render('notification-log', {
    title: 'Notification Log',
    notifications: notificationLog,
    isDashboard: true
  });
});

// API endpoints for website management

// Get website status
app.get('/api/website/:id/status', (req, res) => {
  const websiteId = parseInt(req.params.id);
  const website = websites.find(w => w.id === websiteId);

  if (!website) {
    return res.status(404).json({ error: 'Website not found' });
  }

  res.json({
    id: website.id,
    name: website.name,
    status: website.status,
    isActive: website.status !== 'paused'
  });
});

// Update website (name and interval)
app.put('/api/website/:id', (req, res) => {
  const websiteId = parseInt(req.params.id);
  const { name, checkInterval } = req.body;
  
  const website = websites.find(w => w.id === websiteId);
  
  if (!website) {
    return res.status(404).json({ error: 'Website not found' });
  }

  // Update website properties
  if (name) {
    website.name = name;
  }
    if (checkInterval) {
    // Store interval as numeric string (minutes)
    website.interval = checkInterval.toString();
    
    // Restart monitoring with new interval if not paused
    if (website.status !== 'paused') {
      stopMonitoring(websiteId);
      startMonitoring(website);
    }
  }

  res.json({
    success: true,
    website: website
  });
});

// Pause website monitoring
app.post('/api/website/:id/pause', (req, res) => {
  const websiteId = parseInt(req.params.id);
  const website = websites.find(w => w.id === websiteId);

  if (!website) {
    return res.status(404).json({ error: 'Website not found' });
  }

  // Stop monitoring
  stopMonitoring(websiteId);
  
  // Update status
  website.status = 'paused';
  website.statusText = 'Peatatud';

  res.json({
    success: true,
    message: 'Monitoring paused',
    website: website
  });
});

// Resume website monitoring
app.post('/api/website/:id/resume', (req, res) => {
  const websiteId = parseInt(req.params.id);
  const website = websites.find(w => w.id === websiteId);

  if (!website) {
    return res.status(404).json({ error: 'Website not found' });
  }

  // Resume monitoring
  website.status = 'up'; // Will be updated by the first check
  website.statusText = 'ONLINE';
  
  startMonitoring(website);

  res.json({
    success: true,
    message: 'Monitoring resumed',
    website: website
  });
});

// Delete website
app.delete('/api/website/:id', (req, res) => {
  const websiteId = parseInt(req.params.id);
  const websiteIndex = websites.findIndex(w => w.id === websiteId);

  if (websiteIndex === -1) {
    return res.status(404).json({ error: 'Website not found' });
  }

  // Stop monitoring
  stopMonitoring(websiteId);
  
  // Remove from websites array
  websites.splice(websiteIndex, 1);
  
  // Clean up monitoring history
  delete monitoringHistory[websiteId];
  delete siteFailureCounts[websiteId];
  delete lastNotificationStatus[websiteId];

  res.json({
    success: true,
    message: 'Website deleted successfully'
  });
});

// API endpoint for simulating downtime (for testing)
app.post('/api/test/simulate-downtime', (req, res) => {
  const { siteId, consecutiveFailures, timestamp } = req.body;

  // Find the site - support both numeric and string 'test-site-X' format
  let site;
  if (siteId === 'test-site-1') {
    site = websites[0]; // First site
  } else if (siteId === 'test-site-2') {
    site = websites[1]; // Second site  
  } else if (siteId === 'test-site-3') {
    site = websites[2]; // Third site
  } else {
    site = websites.find(w => w.id == siteId);
  }
  
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }
  // Update site status to offline
  site.status = 'down';
  site.statusText = 'OFFLINE';
  site.lastCheck = getCurrentTime();
  site.responseTime = 'N/A';

  // Add offline entries to monitoring history for testing
  if (!monitoringHistory[site.id]) {
    monitoringHistory[site.id] = [];
  }
  // Add consecutive failure entries
  const failures = consecutiveFailures || notificationSettings.consecutiveFailures;
  for (let i = 0; i < failures; i++) {
    const checkTime = new Date(Date.now() - (i * 60000)); // 1 minute apart
    monitoringHistory[site.id].unshift({
      timestamp: checkTime,
      status: 'down',
      responseTime: 0,
      error: 'Simulated downtime',
      success: false
    });
  }

  siteFailureCounts[site.id] = failures;

  // For testing: ensure email is configured but DO NOT automatically enable sites
  if (!notificationSettings.email) {
    notificationSettings.email = 'test@example.com';
  }
  // Only auto-enable if no sites are enabled at all (fresh test setup)
  if (notificationSettings.enabledSites.length === 0) {
    notificationSettings.enabledSites.push(site.id.toString());
  }

  console.log(`🔧 After simulation setup:`);
  console.log(`🔧 Site ID: ${site.id}`);
  console.log(`🔧 Failure count: ${siteFailureCounts[site.id]}`);
  console.log(`🔧 Threshold: ${notificationSettings.consecutiveFailures}`);
  console.log(`🔧 Enabled sites: ${notificationSettings.enabledSites}`);
  console.log(`🔧 Email: ${notificationSettings.email}`);
  // Trigger notification detection
  detectSiteDown(site.id, 'down');

  res.json({
    success: true,
    message: 'Downtime simulated',
    siteId: site.id,
    failures: siteFailureCounts[site.id]
  });
});

// API endpoint for simulating recovery (for testing)
app.post('/api/test/simulate-recovery', (req, res) => {
  const { siteId } = req.body;

  // Find the site - support both numeric and string 'test-site-X' format
  let site;
  if (siteId === 'test-site-1') {
    site = websites[0]; // First site
  } else if (siteId === 'test-site-2') {
    site = websites[1]; // Second site  
  } else if (siteId === 'test-site-3') {
    site = websites[2]; // Third site
  } else {
    site = websites.find(w => w.id == siteId);
  }
  
  if (!site) {
    return res.status(404).json({ error: 'Site not found' });
  }
  // Update site status to online
  site.status = 'up';
  site.statusText = 'ONLINE';
  site.lastCheck = getCurrentTime();
  const responseTime = Math.floor(Math.random() * 500) + 50;
  site.responseTime = `${responseTime} ms`;

  // Add online entry to monitoring history for testing
  if (!monitoringHistory[site.id]) {
    monitoringHistory[site.id] = [];
  }
  monitoringHistory[site.id].unshift({
    timestamp: new Date(),
    status: 'up',
    responseTime: responseTime,
    statusCode: 200,
    success: true
  });

  // Trigger recovery notification detection
  detectSiteUp(site.id);

  res.json({
    success: true,
    message: 'Recovery simulated',
    siteId: site.id
  });
});

// Helper function to validate URL
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Initialize email service and start server
async function startServer() {
  await initializeEmailService();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/dashboard`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

module.exports = app;

function detectSiteUp(siteId) {
  console.log(`🟢 detectSiteUp called for siteId: ${siteId}`);
  console.log(`🟢 Current failure count: ${siteFailureCounts[siteId] || 0}`);
  console.log(`🟢 Last notification status: ${lastNotificationStatus[siteId] || 'none'}`);
  console.log(`🟢 Enabled sites: ${notificationSettings.enabledSites}`);
  detectSiteDown(siteId, 'online');
}
