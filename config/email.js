// Email configuration
// You can configure this for different email providers

const emailConfig = {
  // Gmail configuration (recommended for testing)
  gmail: {
    service: 'gmail',
    user: process.env.EMAIL_USER || '', // Your Gmail address
    password: process.env.EMAIL_PASSWORD || '' // Your Gmail app password (not regular password)
  },

  // Outlook/Hotmail configuration
  outlook: {
    service: 'hotmail',
    user: process.env.EMAIL_USER || '', // Your Outlook address
    password: process.env.EMAIL_PASSWORD || '' // Your Outlook password
  },

  // Custom SMTP configuration
  custom: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || ''
  },

  // SendGrid configuration (recommended for production)
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || '',
    fromName: process.env.SENDGRID_FROM_NAME || 'Uptime Tracker'
  },

  // MailHog configuration (recommended for local testing)
  mailhog: {
    host: 'localhost',
    port: 1025,
    secure: false,
    user: '', // MailHog doesn't require authentication
    password: ''
  },

  // Test configuration (for development - uses Ethereal Email)
  test: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    user: 'ethereal.user@ethereal.email', // Will be replaced with generated test account
    password: 'ethereal.pass' // Will be replaced with generated test account
  }
};

// Get the active configuration based on environment
function getEmailConfig() {
  const provider = process.env.EMAIL_PROVIDER || 'sendgrid';

  if (emailConfig[provider]) {
    return emailConfig[provider];
  }

  console.warn(`Unknown email provider: ${provider}, falling back to sendgrid configuration`);
  return emailConfig.sendgrid;
}

// Validate email configuration
function validateEmailConfig(config) {
  // SendGrid validation
  if (config.apiKey !== undefined) {
    return config.apiKey && config.fromEmail;
  }

  // MailHog doesn't require authentication
  if (config.host === 'localhost' && config.port === 1025) {
    return true;
  }

  if (!config.user || !config.password) {
    return false;
  }

  if (!config.service && (!config.host || !config.port)) {
    return false;
  }

  return true;
}

module.exports = {
  getEmailConfig,
  validateEmailConfig,
  emailConfig
};
