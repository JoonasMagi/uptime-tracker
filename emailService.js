const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.isTestMode = false;
    this.isSendGrid = false;
    this.fromEmail = '';
    this.fromName = '';
  }

  // Configure email service with SMTP settings
  async configure(emailConfig) {
    try {
      // Support for different email providers
      let transportConfig;

      // Check if this is SendGrid mode
      if (emailConfig.apiKey !== undefined) {
        this.isSendGrid = true;
        sgMail.setApiKey(emailConfig.apiKey);
        this.fromEmail = emailConfig.fromEmail;
        this.fromName = emailConfig.fromName || 'Uptime Tracker';
        this.isConfigured = true;
        console.log('📧 SendGrid mode enabled - emails will be sent via SendGrid API');
        console.log(`📧 From: ${this.fromName} <${this.fromEmail}>`);
        return true;
      }
      // Check if this is MailHog mode
      else if (emailConfig.host === 'localhost' && emailConfig.port === 1025) {
        this.isTestMode = true;
        transportConfig = {
          host: 'localhost',
          port: 1025,
          secure: false,
          ignoreTLS: true,
          auth: null // MailHog doesn't require authentication
        };
        this.fromEmail = 'uptime-tracker@localhost';
        console.log('📧 MailHog mode enabled - emails will be captured locally');
        console.log('📧 View emails at: http://localhost:8025');
      } else if (emailConfig.host === 'smtp.ethereal.email' || process.env.EMAIL_PROVIDER === 'test') {
        this.isTestMode = true;
        // Create test account for Ethereal Email
        const testAccount = await nodemailer.createTestAccount();
        transportConfig = {
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        };
        this.fromEmail = testAccount.user;
        console.log('📧 Test mode enabled - using Ethereal Email');
      } else if (emailConfig.service) {
        // Use predefined service (Gmail, Outlook, etc.)
        transportConfig = {
          service: emailConfig.service,
          auth: {
            user: emailConfig.user,
            pass: emailConfig.password
          }
        };
        this.fromEmail = emailConfig.user;
      } else {
        // Use custom SMTP settings
        transportConfig = {
          host: emailConfig.host,
          port: emailConfig.port || 587,
          secure: emailConfig.secure || false,
          auth: {
            user: emailConfig.user,
            pass: emailConfig.password
          }
        };
        this.fromEmail = emailConfig.user;
      }

      this.transporter = nodemailer.createTransport(transportConfig);
      this.isConfigured = true;

      console.log('📧 Email service configured successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to configure email service:', error.message);
      this.isConfigured = false;
      return false;
    }
  }

  // Verify email configuration
  async verifyConfiguration() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      if (this.isSendGrid) {
        // SendGrid doesn't have a direct verify method, but we can check if API key is set
        console.log('✅ SendGrid configuration verified');
        return true;
      } else if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email configuration verified');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Email configuration verification failed:', error.message);
      return false;
    }
  }

  // Send site down notification
  async sendDownNotification(toEmail, site, consecutiveFailures) {
    if (!this.isConfigured) {
      console.log('📧 Email service not configured, skipping email send');
      return false;
    }

    const subject = `🚨 Site Down Alert: ${site.name}`;
    const htmlContent = this.generateDownEmailHTML(site, consecutiveFailures);
    const textContent = this.generateDownEmailText(site, consecutiveFailures);

    return await this.sendEmail(toEmail, subject, textContent, htmlContent);
  }

  // Send site recovery notification
  async sendRecoveryNotification(toEmail, site) {
    if (!this.isConfigured) {
      console.log('📧 Email service not configured, skipping email send');
      return false;
    }

    const subject = `✅ Site Recovered: ${site.name}`;
    const htmlContent = this.generateRecoveryEmailHTML(site);
    const textContent = this.generateRecoveryEmailText(site);

    return await this.sendEmail(toEmail, subject, textContent, htmlContent);
  }

  // Generic email sending method
  async sendEmail(to, subject, text, html) {
    try {
      if (this.isSendGrid) {
        // Use SendGrid API
        const msg = {
          to: to,
          from: {
            email: this.fromEmail,
            name: this.fromName
          },
          subject: subject,
          text: text,
          html: html
        };

        const response = await sgMail.send(msg);
        console.log(`📧 Email sent successfully via SendGrid to ${to}: ${subject}`);
        console.log(`📧 SendGrid Response: ${response[0].statusCode}`);
        return true;
      } else {
        // Use SMTP (nodemailer)
        const mailOptions = {
          from: this.fromEmail,
          to: to,
          subject: subject,
          text: text,
          html: html
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log(`📧 Email sent successfully to ${to}: ${subject}`);
        console.log(`📧 Message ID: ${info.messageId}`);

        // In test mode, show preview URL
        if (this.isTestMode && info.messageId) {
          const previewUrl = nodemailer.getTestMessageUrl(info);
          if (previewUrl) {
            console.log(`🔗 Preview email: ${previewUrl}`);
          }
        }

        return true;
      }
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      if (error.response && error.response.body) {
        console.error('❌ SendGrid error details:', error.response.body);
      }
      return false;
    }
  }

  // Generate HTML content for site down notification
  generateDownEmailHTML(site, consecutiveFailures) {
    const timestamp = new Date().toLocaleString();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }
          .alert-icon { font-size: 24px; margin-right: 10px; }
          .site-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="alert-icon">🚨</span>
            <strong>Site Down Alert</strong>
          </div>
          
          <h2>Website Monitoring Alert</h2>
          <p>Your monitored website is currently experiencing problems and is not accessible.</p>
          
          <div class="site-info">
            <strong>Site Name:</strong> ${site.name}<br>
            <strong>URL:</strong> <a href="${site.url}">${site.url}</a><br>
            <strong>Detection Time:</strong> ${timestamp}<br>
            <strong>Consecutive Failures:</strong> ${consecutiveFailures}
          </div>
          
          <p><strong>What this means:</strong></p>
          <ul>
            <li>Your website failed to respond ${consecutiveFailures} times in a row</li>
            <li>Visitors may not be able to access your site</li>
            <li>You should investigate the issue immediately</li>
          </ul>
          
          <p><strong>Recommended actions:</strong></p>
          <ul>
            <li>Check your server status</li>
            <li>Verify your hosting provider's status</li>
            <li>Check for any recent changes to your website</li>
            <li>Contact your hosting provider if needed</li>
          </ul>
          
          <div class="footer">
            This alert was sent by your Uptime Tracker monitoring system.<br>
            You will receive a recovery notification when your site is back online.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate text content for site down notification
  generateDownEmailText(site, consecutiveFailures) {
    const timestamp = new Date().toLocaleString();
    return `
SITE DOWN ALERT: ${site.name}

Your monitored website is currently experiencing problems and is not accessible.

Site Details:
- Name: ${site.name}
- URL: ${site.url}
- Detection Time: ${timestamp}
- Consecutive Failures: ${consecutiveFailures}

What this means:
- Your website failed to respond ${consecutiveFailures} times in a row
- Visitors may not be able to access your site
- You should investigate the issue immediately

Recommended actions:
- Check your server status
- Verify your hosting provider's status
- Check for any recent changes to your website
- Contact your hosting provider if needed

This alert was sent by your Uptime Tracker monitoring system.
You will receive a recovery notification when your site is back online.
    `;
  }

  // Generate HTML content for site recovery notification
  generateRecoveryEmailHTML(site) {
    const timestamp = new Date().toLocaleString();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #28a745; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }
          .success-icon { font-size: 24px; margin-right: 10px; }
          .site-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="success-icon">✅</span>
            <strong>Site Recovered</strong>
          </div>
          
          <h2>Good News!</h2>
          <p>Your website is back online and responding normally.</p>
          
          <div class="site-info">
            <strong>Site Name:</strong> ${site.name}<br>
            <strong>URL:</strong> <a href="${site.url}">${site.url}</a><br>
            <strong>Recovery Time:</strong> ${timestamp}
          </div>
          
          <p>Your website is now accessible to visitors again. The monitoring system will continue to check your site regularly.</p>
          
          <div class="footer">
            This recovery notification was sent by your Uptime Tracker monitoring system.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate text content for site recovery notification
  generateRecoveryEmailText(site) {
    const timestamp = new Date().toLocaleString();
    return `
SITE RECOVERED: ${site.name}

Good news! Your website is back online and responding normally.

Site Details:
- Name: ${site.name}
- URL: ${site.url}
- Recovery Time: ${timestamp}

Your website is now accessible to visitors again. The monitoring system will continue to check your site regularly.

This recovery notification was sent by your Uptime Tracker monitoring system.
    `;
  }
}

module.exports = new EmailService();
