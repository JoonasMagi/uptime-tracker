const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

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
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// In-memory storage for websites
let websites = [];
let nextId = 1;
let statisticsCache = {};

// Initialize with some mock data for testing
function initializeMockData() {
  websites = [
    {
      id: 1,
      name: 'Google',
      url: 'https://google.com',
      interval: '5min',
      description: 'Search engine',
      status: 'online',
      statusText: 'ONLINE',
      lastCheck: '12:34:56',
      responseTime: '120 ms',
      createdAt: new Date()
    },
    {
      id: 2,
      name: 'Example Site',
      url: 'https://example.com',
      interval: '15min',
      description: 'Example website',
      status: 'offline',
      statusText: 'OFFLINE',
      lastCheck: '12:33:45',
      responseTime: 'N/A',
      createdAt: new Date()
    },
    {
      id: 3,
      name: 'Test Website',
      url: 'https://test.example.org',
      interval: '30min',
      description: 'Test site',
      status: 'unknown',
      statusText: 'UNKNOWN',
      lastCheck: 'Mitte kunagi',
      responseTime: 'N/A',
      createdAt: new Date()
    }
  ];
  nextId = 4;
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

// Helper function to generate mock monitoring data with history
function generateMockHistoryData(websiteId, days = 30) {
  const history = [];
  const now = new Date();
  
  // Use website ID as seed for consistent results
  const seed = websiteId * 1000;
  
  for (let i = days * 24; i >= 0; i--) {
    const checkTime = new Date(now.getTime() - (i * 60 * 60 * 1000)); // hourly checks
    // Use deterministic pseudo-random based on websiteId and time
    const randomValue = Math.sin(seed + i) * 10000;
    const normalizedRandom = Math.abs(randomValue - Math.floor(randomValue));
    // Ensure uptime is between 90-99% by adjusting threshold
    const isOnline = normalizedRandom > 0.08; // ~92% uptime roughly
    const responseTime = isOnline ? Math.floor(Math.abs(Math.sin(seed + i + 100) * 400)) + 50 : null;
    
    history.push({
      websiteId,
      timestamp: checkTime,
      status: isOnline ? 'online' : 'offline',
      responseTime,
      isOutage: !isOnline
    });
  }
  
  return history;
}

// Helper function to calculate statistics
function calculateStatistics(websiteId, period = '24h') {
  const history = generateMockHistoryData(websiteId, 30);
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
  
  const totalChecks = periodData.length;
  const onlineChecks = periodData.filter(record => record.status === 'online').length;
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
    if (record.status === 'offline') {
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
    interval: interval || '5min',
    description: description || '',
    status: status,
    statusText: status.toUpperCase(),
    lastCheck: getCurrentTime(),
    responseTime: status === 'online' ? `${Math.floor(Math.random() * 500) + 50} ms` : 'N/A',
    createdAt: new Date()
  };

  websites.push(newWebsite);

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
  statisticsCache = {}; // Clear statistics cache
  res.json({ message: 'Data reset to mock data' });
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

// Helper function to validate URL
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/dashboard`);
});

module.exports = app;
