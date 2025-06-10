#!/usr/bin/env node

// DNS verification script for email deliverability
const { execSync } = require('child_process');

function checkDNSRecord(domain, recordType, expectedValue = null) {
    try {
        const command = `dig +short ${recordType} ${domain}`;
        const result = execSync(command, { encoding: 'utf8' }).trim();

        console.log(`\n${recordType} record for ${domain}:`);
        if (result) {
            console.log(`✅ Found: ${result}`);
            if (expectedValue && result.includes(expectedValue)) {
                console.log(`✅ Contains expected value: ${expectedValue}`);
            }
        } else {
            console.log(`❌ Not found`);
        }

        return result;
    } catch (error) {
        console.log(`❌ Error checking ${recordType}: ${error.message}`);
        return null;
    }
}

function checkEmailDeliverability() {
    console.log('🔍 Checking DNS records for email deliverability...');
    console.log('Domain: up.eerovallistu.site');

    // Check SPF record
    const spf = checkDNSRecord('up.eerovallistu.site', 'TXT');
    const hasSpf = spf && spf.includes('v=spf1');

    // Check DKIM (we know this exists from the screenshot)
    const dkim = checkDNSRecord('email._domainkey.up.eerovallistu.site', 'TXT');
    const hasDkim = dkim && dkim.includes('k=rsa');

    // Check DMARC
    const dmarc = checkDNSRecord('_dmarc.up.eerovallistu.site', 'TXT');
    const hasDmarc = dmarc && dmarc.includes('v=DMARC1');

    // Check MX records
    const mx = checkDNSRecord('up.eerovallistu.site', 'MX');

    console.log('\n📊 Email Authentication Summary:');
    console.log(`SPF Record: ${hasSpf ? '✅ Present' : '❌ Missing - CRITICAL'}`);
    console.log(`DKIM Record: ${hasDkim ? '✅ Present' : '❌ Missing'}`);
    console.log(`DMARC Record: ${hasDmarc ? '✅ Present' : '❌ Missing'}`);
    console.log(`MX Records: ${mx ? '✅ Present' : '❌ Missing'}`);

    if (!hasSpf) {
        console.log('\n🚨 CRITICAL: Missing SPF Record!');
        console.log('Add this TXT record to up.eerovallistu.site:');
        console.log('Value: "v=spf1 include:mailgun.org ~all"');
    }

    if (!hasDmarc) {
        console.log('\n⚠️  Missing DMARC Record (Recommended)');
        console.log('Add this TXT record to _dmarc.up.eerovallistu.site:');
        console.log('Value: "v=DMARC1; p=quarantine; rua=mailto:eero.vallistu@vikk.ee; pct=100"');
    }

    console.log('\n🔧 After adding DNS records:');
    console.log('1. Wait 24-48 hours for DNS propagation');
    console.log('2. Test with: https://www.mail-tester.com');
    console.log('3. Monitor Mailgun delivery logs');
    console.log('4. Consider domain warming (send 10-50 emails/day initially)');
}

if (require.main === module) {
    checkEmailDeliverability();
}

module.exports = { checkEmailDeliverability };
