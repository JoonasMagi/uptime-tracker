#!/usr/bin/env node

// Test Mailgun with improved deliverability settings
const emailService = require('./emailService');

async function testDeliverability() {
    console.log('📧 Testing Mailgun with improved deliverability...');

    // Use domain-matching FROM address for better deliverability
    const mailgunConfig = {
        apiKey: process.env.MAILGUN_API_KEY || '',
        domain: process.env.MAILGUN_DOMAIN || 'up.eerovallistu.site',
        fromEmail: process.env.MAILGUN_FROM_EMAIL || 'alerts@up.eerovallistu.site', // Using same domain as Mailgun
        fromName: 'Website Monitoring Service',
        region: 'eu'
    };

    console.log('📧 Configuring with domain-matching FROM address...');
    console.log(`📧 FROM: ${mailgunConfig.fromName} <${mailgunConfig.fromEmail}>`);

    const configured = await emailService.configure(mailgunConfig);

    if (!configured) {
        console.error('❌ Failed to configure email service');
        return;
    }

    const verified = await emailService.verifyConfiguration();
    if (!verified) {
        console.warn('⚠️ Verification warning, continuing...');
    }

    // Test data
    const testEmail = 'eero.vallistu@vikk.ee';
    const testSite = {
        id: 888,
        name: 'Production Website',
        url: 'https://eerovallistu.site',
        status: 'down',
        lastChecked: new Date(),
        responseTime: null,
        error: 'Service temporarily unavailable'
    };

    console.log('📬 Sending improved deliverability test...');

    try {
        // Send professional alert
        const result = await emailService.sendDownNotification(testEmail, testSite, 1);
        if (result) {
            console.log('✅ Professional alert sent successfully!');
            console.log('📧 Check your inbox (should be less likely to go to spam)');
            console.log('💡 Key improvements:');
            console.log('   • FROM domain matches sending domain');
            console.log('   • Professional sender name');
            console.log('   • Business-like subject line');
            console.log('   • Proper email headers');
        } else {
            console.log('❌ Failed to send test');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('');
    console.log('📋 Next Steps to Improve Deliverability:');
    console.log('1. Add alerts@up.eerovallistu.site to your email contacts');
    console.log('2. Check spam folder and mark as "Not Spam" if found there');
    console.log('3. Set up email forwarding: alerts@up.eerovallistu.site → eero.vallistu@vikk.ee');
    console.log('4. Use mail-tester.com to check spam score');
    console.log('5. Send emails gradually to build domain reputation');
}

if (require.main === module) {
    testDeliverability().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}
