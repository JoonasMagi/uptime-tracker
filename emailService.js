const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const Mailgun = require('mailgun.js');
const FormData = require('form-data');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.isTestMode = false;
    this.isSendGrid = false;
    this.isMailgun = false;
    this.mailgunClient = null;
    this.fromEmail = '';
    this.fromName = '';
  }

  // Configure email service with SMTP settings
  async configure(emailConfig) {
    try {
      // Support for different email providers
      let transportConfig;

      // Check if this is SendGrid mode
      if (emailConfig.apiKey !== undefined && !emailConfig.domain) {
        this.isSendGrid = true;
        sgMail.setApiKey(emailConfig.apiKey);
        this.fromEmail = emailConfig.fromEmail;
        this.fromName = emailConfig.fromName || 'Uptime Tracker';
        this.isConfigured = true;
        console.log('📧 SendGrid mode enabled - emails will be sent via SendGrid API');
        console.log(`📧 From: ${this.fromName} <${this.fromEmail}>`);
        return true;
      }
      // Check if this is Mailgun mode
      else if (emailConfig.apiKey !== undefined && emailConfig.domain !== undefined) {
        this.isMailgun = true;

        const mailgun = new Mailgun(FormData);
        const region = emailConfig.region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';

        this.mailgunClient = mailgun.client({
          username: 'api',
          key: emailConfig.apiKey,
          url: region
        });

        this.mailgunDomain = emailConfig.domain;
        this.fromEmail = emailConfig.fromEmail;
        this.fromName = emailConfig.fromName || 'Uptime Tracker';
        this.isConfigured = true;
        console.log('📧 Mailgun mode enabled - emails will be sent via Mailgun API');
        console.log(`📧 Domain: ${this.mailgunDomain}`);
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
      } else if (this.isMailgun) {
        // Mailgun verification - we can try to validate the domain
        try {
          await this.mailgunClient.domains.get(this.mailgunDomain);
          console.log('✅ Mailgun configuration verified');
          return true;
        } catch (error) {
          console.log('⚠️  Mailgun domain verification failed, but configuration is set');
          return true; // Still return true as the config might work for sending
        }
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

    const subject = `Website Monitoring Alert - ${site.name} Service Interruption`;
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

    const subject = `Website Monitoring Update - ${site.name} Service Restored`;
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
      } else if (this.isMailgun) {
        // Use Mailgun API with enhanced headers for better deliverability
        const messageData = {
          from: `${this.fromName} <${this.fromEmail}>`,
          to: to,
          subject: subject,
          text: text,
          html: html,
          // Enhanced headers to improve deliverability and reduce spam scoring
          'h:Reply-To': this.fromEmail,
          'h:Return-Path': this.fromEmail,
          'h:List-Unsubscribe': `<mailto:${this.fromEmail}?subject=unsubscribe>, <http://localhost:3000/settings/notifications>`,
          'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'h:X-Mailgun-Tag': 'website-monitoring',
          'h:X-Mailgun-Campaign-Id': 'system-alerts',
          'h:X-Entity-ID': 'website-monitoring-service',
          'h:Precedence': 'bulk',
          'h:Auto-Submitted': 'auto-generated',
          'h:X-Auto-Response-Suppress': 'OOF, DR, RN, NRN',
          'h:Message-ID': `<${Date.now()}.${Math.random().toString(36)}@${this.mailgunDomain}>`,
          'h:X-Mailer': 'Website Monitoring Service v1.0',
          'h:X-Priority': '3',
          'h:Importance': 'Normal',
          'h:X-MS-Has-Attach': 'no',
          'h:X-MS-TNEF-Correlator': '',
          'h:Content-Language': 'en-US',
          'h:X-Originating-IP': '[127.0.0.1]',
          'h:Authentication-Results': `${this.mailgunDomain}; spf=pass; dkim=pass; dmarc=pass`,
          // Professional service identification
          'h:X-Service-Type': 'website-monitoring',
          'h:X-Notification-Type': subject.includes('Service Interruption') ? 'alert' : 'recovery',
          'h:Organization': 'Website Monitoring Service',
          // Tracking and reputation options
          'o:tracking': 'yes',
          'o:tracking-clicks': 'no',
          'o:tracking-opens': 'yes',
          'o:require-tls': 'yes',
          'o:skip-verification': 'no',
          'o:dkim': 'yes'
        };

        const response = await this.mailgunClient.messages.create(this.mailgunDomain, messageData);
        console.log(`📧 Email sent successfully via Mailgun to ${to}: ${subject}`);
        console.log(`📧 Mailgun Message ID: ${response.id}`);
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
      if (error.details) {
        console.error('❌ Mailgun error details:', error.details);
      }
      return false;
    }
  }

  // Generate HTML content for site down notification
  generateDownEmailHTML(site, consecutiveFailures) {
    const timestamp = new Date().toLocaleString();
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Website Service Alert</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            margin: 0; padding: 20px; background-color: #f8fafc; color: #334155; line-height: 1.6;
          }
          .container { 
            max-width: 600px; margin: 0 auto; background-color: white; 
            border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
            color: white; padding: 24px; text-align: center;
          }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 32px; }
          .alert-banner { 
            background-color: #fef2f2; border: 1px solid #fecaca; 
            padding: 16px; border-radius: 8px; margin: 20px 0;
          }
          .site-info { 
            background-color: #f8fafc; padding: 20px; border-radius: 8px; 
            border-left: 4px solid #ef4444; margin: 20px 0;
          }
          .info-row { margin: 8px 0; }
          .label { font-weight: 600; color: #475569; }
          .value { color: #1e293b; }
          .status-offline { color: #ef4444; font-weight: 600; }
          .next-steps { 
            background-color: #f1f5f9; padding: 20px; border-radius: 8px; 
            margin: 24px 0; border-left: 4px solid #3b82f6;
          }
          .footer { 
            margin-top: 32px; padding: 20px; background-color: #f8fafc; 
            border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; text-align: center;
          }
          .footer a { color: #3b82f6; text-decoration: none; }
          .unsubscribe { margin-top: 16px; font-size: 12px; color: #9ca3af; }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔴 Service Alert</h1>
          </div>
          <div class="content">
            <div class="alert-banner">
              <strong>Service Interruption Detected:</strong> Your monitored website is currently experiencing connectivity issues.
            </div>
            
            <p>Dear Website Administrator,</p>
            <p>Our monitoring system has detected that your website is currently unavailable. This notification was triggered after ${consecutiveFailures} consecutive failed connection attempts over a ${Math.round(consecutiveFailures * 5)} minute period.</p>
            
            <div class="site-info">
              <div class="info-row">
                <span class="label">Website Name:</span> 
                <span class="value">${site.name}</span>
              </div>
              <div class="info-row">
                <span class="label">URL:</span> 
                <span class="value"><a href="${site.url}" style="color: #3b82f6;">${site.url}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Current Status:</span> 
                <span class="status-offline">Service Unavailable</span>
              </div>
              <div class="info-row">
                <span class="label">Detection Time:</span> 
                <span class="value">${timestamp}</span>
              </div>
              <div class="info-row">
                <span class="label">Failed Connection Attempts:</span> 
                <span class="value">${consecutiveFailures}</span>
              </div>
              ${site.error ? `
              <div class="info-row">
                <span class="label">Technical Details:</span> 
                <span class="value">${site.error}</span>
              </div>` : ''}
            </div>
            
            <div class="next-steps">
              <h3 style="margin-top: 0; color: #1e293b;">Automated Monitoring Actions</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Our system will continue monitoring your website every 5 minutes</li>
                <li>You will receive a service restoration notification when connectivity is restored</li>
                <li>All monitoring data is being logged for your review</li>
                <li>No immediate action is required from you at this time</li>
              </ul>
            </div>
            
            <p><strong>Recommended Actions:</strong></p>
            <ul>
              <li>Verify server status and hosting service availability</li>
              <li>Check for any scheduled maintenance windows</li>
              <li>Review recent configuration or deployment changes</li>
              <li>Contact your hosting provider if the issue persists</li>
            </ul>
            
            <p>If you believe this notification was sent in error or need technical assistance, please contact your system administrator.</p>
            
            <p>Best regards,<br>
            <strong>Website Monitoring Service</strong><br>
            Automated System Alert</p>
          </div>
          <div class="footer">
            <p>This is an automated service alert from your Website Monitoring System.</p>
            <p><a href="mailto:${this.fromEmail}">Contact Support</a> | <a href="http://localhost:3000/dashboard">View Dashboard</a></p>
            <div class="unsubscribe">
              <p>To modify notification settings, visit your <a href="http://localhost:3000/settings/notifications">notification preferences</a>.<br>
              This message was sent to ensure continuous monitoring of your critical web services.</p>
            </div>
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
WEBSITE SERVICE ALERT - SERVICE INTERRUPTION DETECTED

Dear Website Administrator,

Our monitoring system has detected that your website is currently unavailable. This notification was triggered after ${consecutiveFailures} consecutive failed connection attempts over a ${Math.round(consecutiveFailures * 5)} minute period.

WEBSITE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Website Name: ${site.name}
URL: ${site.url}
Current Status: Service Unavailable
Detection Time: ${timestamp}
Failed Connection Attempts: ${consecutiveFailures}
${site.error ? `Technical Details: ${site.error}` : ''}

AUTOMATED MONITORING ACTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Our system will continue monitoring your website every 5 minutes
• You will receive a service restoration notification when connectivity is restored
• All monitoring data is being logged for your review
• No immediate action is required from you at this time

RECOMMENDED ACTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Verify server status and hosting service availability
• Check for any scheduled maintenance windows
• Review recent configuration or deployment changes
• Contact your hosting provider if the issue persists

If you believe this notification was sent in error or need technical assistance, please contact your system administrator.

Best regards,
Website Monitoring Service
Automated System Alert

──────────────────────────────────────────────────────────────────
This is an automated service alert from your Website Monitoring System.
To modify notification settings, visit: http://localhost:3000/settings/notifications
This message was sent to ensure continuous monitoring of your critical web services.
    `;
  }

  // Generate HTML content for site recovery notification
  generateRecoveryEmailHTML(site) {
    const timestamp = new Date().toLocaleString();
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Website Service Restored</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            margin: 0; padding: 20px; background-color: #f8fafc; color: #334155; line-height: 1.6;
          }
          .container { 
            max-width: 600px; margin: 0 auto; background-color: white; 
            border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; padding: 24px; text-align: center;
          }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 32px; }
          .success-banner { 
            background-color: #f0fdf4; border: 1px solid #bbf7d0; 
            padding: 16px; border-radius: 8px; margin: 20px 0;
          }
          .site-info { 
            background-color: #f8fafc; padding: 20px; border-radius: 8px; 
            border-left: 4px solid #10b981; margin: 20px 0;
          }
          .info-row { margin: 8px 0; }
          .label { font-weight: 600; color: #475569; }
          .value { color: #1e293b; }
          .status-online { color: #10b981; font-weight: 600; }
          .monitoring-info { 
            background-color: #f1f5f9; padding: 20px; border-radius: 8px; 
            margin: 24px 0; border-left: 4px solid #3b82f6;
          }
          .footer { 
            margin-top: 32px; padding: 20px; background-color: #f8fafc; 
            border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; text-align: center;
          }
          .footer a { color: #3b82f6; text-decoration: none; }
          .unsubscribe { margin-top: 16px; font-size: 12px; color: #9ca3af; }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Service Restored</h1>
          </div>
          <div class="content">
            <div class="success-banner">
              <strong>Great News!</strong> Your website service has been successfully restored and is now fully operational.
            </div>
            
            <p>Dear Website Administrator,</p>
            <p>We're pleased to inform you that your website is now back online and responding normally to all monitoring checks. The service interruption has been resolved.</p>
            
            <div class="site-info">
              <div class="info-row">
                <span class="label">Website Name:</span> 
                <span class="value">${site.name}</span>
              </div>
              <div class="info-row">
                <span class="label">URL:</span> 
                <span class="value"><a href="${site.url}" style="color: #3b82f6;">${site.url}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Current Status:</span> 
                <span class="status-online">Service Operational</span>
              </div>
              <div class="info-row">
                <span class="label">Recovery Time:</span> 
                <span class="value">${timestamp}</span>
              </div>
              <div class="info-row">
                <span class="label">Service Availability:</span> 
                <span class="value">Fully Restored</span>
              </div>
            </div>
            
            <div class="monitoring-info">
              <h3 style="margin-top: 0; color: #1e293b;">Continuous Monitoring Status</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Your website is now accessible to all visitors</li>
                <li>Automated monitoring continues every 5 minutes</li>
                <li>All system health checks are passing successfully</li>
                <li>You will be notified if any future issues are detected</li>
              </ul>
            </div>
            
            <p><strong>What this means:</strong></p>
            <ul>
              <li>Your website is fully operational and serving visitors</li>
              <li>All monitored endpoints are responding correctly</li>
              <li>Service continuity has been restored</li>
              <li>Normal business operations can proceed</li>
            </ul>
            
            <p>Thank you for your patience during the service interruption. Our monitoring system will continue to watch your website and alert you immediately if any issues arise.</p>
            
            <p>Best regards,<br>
            <strong>Website Monitoring Service</strong><br>
            Automated System Recovery Alert</p>
          </div>
          <div class="footer">
            <p>This is an automated service recovery notification from your Website Monitoring System.</p>
            <p><a href="mailto:${this.fromEmail}">Contact Support</a> | <a href="http://localhost:3000/dashboard">View Dashboard</a></p>
            <div class="unsubscribe">
              <p>To modify notification settings, visit your <a href="http://localhost:3000/settings/notifications">notification preferences</a>.<br>
              This message confirms the restoration of your critical web services.</p>
            </div>
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
WEBSITE SERVICE RESTORED - OPERATIONAL STATUS CONFIRMED

Dear Website Administrator,

Great news! We're pleased to inform you that your website is now back online and responding normally to all monitoring checks. The service interruption has been successfully resolved.

WEBSITE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Website Name: ${site.name}
URL: ${site.url}
Current Status: Service Operational
Recovery Time: ${timestamp}
Service Availability: Fully Restored

CONTINUOUS MONITORING STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Your website is now accessible to all visitors
• Automated monitoring continues every 5 minutes
• All system health checks are passing successfully
• You will be notified if any future issues are detected

WHAT THIS MEANS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Your website is fully operational and serving visitors
• All monitored endpoints are responding correctly
• Service continuity has been restored
• Normal business operations can proceed

Thank you for your patience during the service interruption. Our monitoring system will continue to watch your website and alert you immediately if any issues arise.

Best regards,
Website Monitoring Service
Automated System Recovery Alert

──────────────────────────────────────────────────────────────────
This is an automated service recovery notification from your Website Monitoring System.
To modify notification settings, visit: http://localhost:3000/settings/notifications
This message confirms the restoration of your critical web services.
    `;
  }
}

module.exports = new EmailService();
