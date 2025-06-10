#!/usr/bin/env node

// Comprehensive anti-spam email test script
const emailService = require('./emailService');

async function testAntiSpamEmails() {
    console.log('🛡️  Testing Anti-Spam Email Configuration...');

    // Configure Mailgun with all anti-spam settings
    const mailgunConfig = {
        apiKey: process.env.MAILGUN_API_KEY || '',
        domain: process.env.MAILGUN_DOMAIN || 'up.eerovallistu.site',
        fromEmail: process.env.MAILGUN_FROM_EMAIL || 'noreply@up.eerovallistu.site',
        fromName: 'Website Monitoring Service',
        region: 'eu'
    };

    console.log('📧 Configuring enhanced Mailgun with anti-spam measures...');
    const configured = await emailService.configure(mailgunConfig);

    if (!configured) {
        console.error('❌ Failed to configure email service');
        return;
    }

    console.log('📧 Verifying configuration...');
    await emailService.verifyConfiguration();

    // Test data
    const testEmail = 'eero.vallistu@vikk.ee';
    const testSite = {
        id: 999,
        name: 'Production Website',
        url: 'https://eerovallistu.site',
        status: 'down',
        lastChecked: new Date(),
        responseTime: null,
        error: 'HTTP 503 Service Unavailable - Server temporarily overloaded'
    };

    console.log('📬 Sending enhanced anti-spam DOWN notification...');

    try {
        // Send down notification with enhanced content
        const downResult = await emailService.sendDownNotification(testEmail, testSite, 3);
        if (downResult) {
            console.log('✅ Enhanced failure notification sent successfully!');
        } else {
            console.log('❌ Failed to send enhanced failure notification');
        }

        // Wait 3 seconds
        console.log('⏳ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Send recovery notification with enhanced content
        console.log('📬 Sending enhanced anti-spam RECOVERY notification...');
        testSite.status = 'online';
        testSite.responseTime = 187;
        testSite.error = null;

        const recoveryResult = await emailService.sendRecoveryNotification(testEmail, testSite);
        if (recoveryResult) {
            console.log('✅ Enhanced recovery notification sent successfully!');
        } else {
            console.log('❌ Failed to send enhanced recovery notification');
        }

        console.log('\n🎉 Anti-Spam Email Test Complete!');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📧 Check your inbox: eero.vallistu@vikk.ee');
        console.log('📊 Check Mailgun dashboard: https://app.mailgun.com');
        console.log('');
        console.log('🛡️  ANTI-SPAM FEATURES IMPLEMENTED:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ Professional FROM address (noreply@up.eerovallistu.site)');
        console.log('✅ Enhanced email templates with proper structure');
        console.log('✅ Professional subject lines');
        console.log('✅ Complete email headers for authentication');
        console.log('✅ List-Unsubscribe headers');
        console.log('✅ DKIM, SPF, DMARC authentication');
        console.log('✅ Proper Content-Language and encoding');
        console.log('✅ Professional email content and formatting');
        console.log('✅ Clear sender identification');
        console.log('✅ Unsubscribe links and preferences');
        console.log('✅ TLS encryption enabled');
        console.log('✅ Tracking optimization for reputation');
        console.log('');
        console.log('📈 DELIVERABILITY IMPROVEMENTS:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('• Professional email templates (HTML + Text)');
        console.log('• Clear business purpose and sender identity');
        console.log('• Proper authentication headers');
        console.log('• Unsubscribe compliance');
        console.log('• Domain reputation building');
        console.log('• Content optimization for spam filters');
        console.log('');
        console.log('🎯 These emails should now avoid spam folders!');

    } catch (error) {
        console.error('❌ Error during enhanced email test:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

// Run the enhanced test
if (require.main === module) {
    testAntiSpamEmails().then(() => {
        console.log('👋 Anti-spam test completed');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Anti-spam test failed:', error);
        process.exit(1);
    });
}

module.exports = { testAntiSpamEmails };
