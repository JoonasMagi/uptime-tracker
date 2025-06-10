const emailService = require('./emailService');

console.log('🧪 Simple deliverability test...');

// Mailgun config with domain-matching FROM
const config = {
    apiKey: process.env.MAILGUN_API_KEY || '',
    domain: process.env.MAILGUN_DOMAIN || 'up.eerovallistu.site',
    fromEmail: process.env.MAILGUN_FROM_EMAIL || 'alerts@up.eerovallistu.site',
    fromName: 'Website Monitoring Service',
    region: 'eu'
};

emailService.configure(config).then(success => {
    if (success) {
        console.log('✅ Configured successfully');

        // Send test email
        return emailService.sendEmail(
            'eero.vallistu@vikk.ee',
            'Website Monitoring Test - Improved Deliverability',
            'This is a test email with improved deliverability settings.',
            '<p>This is a test email with improved deliverability settings.</p>'
        );
    } else {
        throw new Error('Configuration failed');
    }
}).then(sent => {
    if (sent) {
        console.log('✅ Test email sent with improved settings!');
        console.log('📧 FROM: Website Monitoring Service <alerts@up.eerovallistu.site>');
        console.log('📧 This should be less likely to go to spam');
    } else {
        console.log('❌ Failed to send email');
    }
}).catch(error => {
    console.error('❌ Error:', error.message);
}).finally(() => {
    process.exit(0);
});
