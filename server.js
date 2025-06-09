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

// Dashboard route
app.get('/dashboard', (req, res) => {
  const { empty } = req.query;

  if (empty === 'true') {
    return res.render('dashboard', {
      title: 'Dashboard - Monitooring',
      empty: true,
      isDashboard: true
    });
  }

  // Mock data for testing - in real implementation this would come from database
  const mockWebsites = [
    {
      id: 1,
      name: 'Google',
      url: 'https://google.com',
      status: 'online',
      statusText: 'ONLINE',
      lastCheck: '12:34:56',
      responseTime: '120 ms'
    },
    {
      id: 2,
      name: 'Example Site',
      url: 'https://example.com',
      status: 'offline',
      statusText: 'OFFLINE',
      lastCheck: '12:33:45',
      responseTime: 'N/A'
    },
    {
      id: 3,
      name: 'Test Website',
      url: 'https://test.example.org',
      status: 'unknown',
      statusText: 'UNKNOWN',
      lastCheck: 'Mitte kunagi',
      responseTime: 'N/A'
    }
  ];

  res.render('dashboard', {
    title: 'Dashboard - Monitooring',
    websites: mockWebsites,
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
