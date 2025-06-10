#!/usr/bin/env node

// Test script to send failure notification emails via Mailgun
const emailService = require('./emailService');
const { getEmailConfig } = require('./config/email');

async function sendTestEmails() {
    console.log('🧪 Starting email test...');

    // Set environment variables for Mailgun
    process.env.EMAIL_PROVIDER = 'mailgun';
    process.env.MAILGUN_API_KEY = '';
    process.env.MAILGUN_DOMAIN = 'up.eerovallistu.site';
    process.env.MAILGUN_FROM_EMAIL = 'eero.vallistu@vikk.ee';
    process.env.MAILGUN_FROM_NAME = 'Uptime Tracker';
    process.env.MAILGUN_REGION = 'eu';

    // Configure email service
    const emailConfig = getEmailConfig();
    console.log('📧 Configuring email service...');

    const configured = await emailService.configure(emailConfig);
    if (!configured) {
        console.error('❌ Failed to configure email service');
        return;
    }

    // Verify configuration
    const verified = await emailService.verifyConfiguration();
    if (!verified) {
        console.error('❌ Failed to verify email configuration');
        return;
    }

    // Test email address
    const testEmail = 'eero.vallistu@vikk.ee';

    // Mock site data for testing
    const testSite = {
        id: 999,
        name: 'Test Website',
        url: 'https://test.example.org',
        status: 'down',
        lastChecked: new Date(),
        responseTime: null,
        error: 'Connection timeout - site appears to be down'
    };

    console.log('📬 Sending test failure notification...');

    try {
        // Send down notification
        const downResult = await emailService.sendDownNotification(testEmail, testSite, 3);
        if (downResult) {
            console.log('✅ Test failure notification sent successfully!');
        } else {
            console.log('❌ Failed to send test failure notification');
        }

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Send recovery notification
        console.log('📬 Sending test recovery notification...');
        testSite.status = 'online';
        testSite.responseTime = 250;
        testSite.error = null;

        const recoveryResult = await emailService.sendRecoveryNotification(testEmail, testSite);
        if (recoveryResult) {
            console.log('✅ Test recovery notification sent successfully!');
        } else {
            console.log('❌ Failed to send test recovery notification');
        }

        console.log('🎉 Email test completed!');
        console.log('📧 Check your inbox: eero.vallistu@vikk.ee');
        console.log('📊 You can also check your Mailgun dashboard for delivery logs');

    } catch (error) {
        console.error('❌ Error sending test emails:', error.message);
    }
}

// Run the test
sendTestEmails().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
