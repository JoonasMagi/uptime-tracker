#!/usr/bin/env node

// Simple test script to send emails via Mailgun
const emailService = require('./emailService');

async function testMailgun() {
    console.log('🧪 Testing Mailgun email service...');

    // Configure Mailgun directly
    const mailgunConfig = {
        apiKey: process.env.MAILGUN_API_KEY || '',
        domain: process.env.MAILGUN_DOMAIN || 'up.eerovallistu.site',
        fromEmail: process.env.MAILGUN_FROM_EMAIL || 'eero.vallistu@vikk.ee',
        fromName: 'Uptime Tracker',
        region: 'eu'
    };

    console.log('📧 Configuring Mailgun...');
    const configured = await emailService.configure(mailgunConfig);

    if (!configured) {
        console.error('❌ Failed to configure email service');
        return;
    }

    console.log('📧 Verifying configuration...');
    const verified = await emailService.verifyConfiguration();

    if (!verified) {
        console.warn('⚠️ Verification failed, but continuing with test...');
    }

    // Test data
    const testEmail = 'eero.vallistu@vikk.ee';
    const testSite = {
        id: 999,
        name: 'Test Website for Mailgun',
        url: 'https://test.example.org',
        status: 'down',
        lastChecked: new Date(),
        responseTime: null,
        error: 'Connection timeout - testing Mailgun email service'
    };

    console.log('📬 Sending test failure notification via Mailgun...');

    try {
        // Send down notification
        const downResult = await emailService.sendDownNotification(testEmail, testSite, 3);
        if (downResult) {
            console.log('✅ Test failure notification sent successfully via Mailgun!');
        } else {
            console.log('❌ Failed to send test failure notification');
        }

        // Wait 2 seconds
        console.log('⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Send recovery notification
        console.log('📬 Sending test recovery notification via Mailgun...');
        testSite.status = 'online';
        testSite.responseTime = 250;
        testSite.error = null;

        const recoveryResult = await emailService.sendRecoveryNotification(testEmail, testSite);
        if (recoveryResult) {
            console.log('✅ Test recovery notification sent successfully via Mailgun!');
        } else {
            console.log('❌ Failed to send test recovery notification');
        }

        console.log('🎉 Mailgun email test completed!');
        console.log('📧 Check your inbox: eero.vallistu@vikk.ee');
        console.log('📊 Check your Mailgun dashboard at: https://app.mailgun.com');

    } catch (error) {
        console.error('❌ Error during email test:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

// Run the test
if (require.main === module) {
    testMailgun().then(() => {
        console.log('👋 Test script finished');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Test script failed:', error);
        process.exit(1);
    });
}

module.exports = { testMailgun };
