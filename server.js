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
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
