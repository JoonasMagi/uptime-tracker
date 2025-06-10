# Mailgun Email Service Setup

This document provides a complete step-by-step guide to configure the uptime tracker to send emails using Mailgun.

## Step 1: Create a Mailgun Account

1. **Visit Mailgun website**
   - Go to https://www.mailgun.com/
   - Click "Sign up for free"

2. **Create your account**
   - Enter your email address and create a password
   - Verify your email address when you receive the confirmation email

3. **Choose your plan**
   - Select the free plan (includes 5,000 emails/month for first 3 months)
   - After the trial: 1,000 emails/month free forever

## Step 2: Set Up Your Domain

### Option A: Use a Subdomain (Recommended)

1. **Add a new domain**
   - In Mailgun dashboard, go to "Sending" → "Domains"
   - Click "Add New Domain"
   - Enter a subdomain like `mg.yourdomain.com` or `mail.yourdomain.com`
   - Choose your region (US or EU)

2. **Configure DNS records**
   - Copy the provided DNS records from Mailgun
   - Add these records to your domain's DNS settings:

   ```
   Type: TXT
   Name: mg (or your subdomain)
   Value: v=spf1 include:mailgun.org ~all

   Type: TXT  
   Name: k1._domainkey.mg
   Value: [Mailgun will provide this DKIM record]

   Type: CNAME
   Name: mg
   Value: mailgun.org

   Type: MX
   Name: mg
   Value: mxa.mailgun.org (priority 10)
   Value: mxb.mailgun.org (priority 10)
   ```

3. **Wait for verification**
   - DNS propagation can take up to 48 hours
   - Check the domain status in Mailgun dashboard
   - Status should show "Active" when ready

### Option B: Use Mailgun's Sandbox Domain (Testing Only)

For testing purposes, you can use Mailgun's sandbox domain:
- Domain: `sandboxXXXXXXXX.mailgun.org` (provided by Mailgun)
- Limited to 300 emails per day
- Can only send to authorized recipients

## Step 3: Get Your API Credentials

1. **Find your API key**
   - Go to "Settings" → "API Keys" in Mailgun dashboard
   - Copy your "Private API key" (starts with "key-")
   - **Never share or commit this key to version control**

2. **Note your domain**
   - Go to "Sending" → "Domains"
   - Copy your verified domain name

## Step 4: Configure Your Application

1. **Copy the environment file**
   ```fish
   cp .env.example .env
   ```

2. **Edit the .env file**
   ```fish
   nano .env
   ```

3. **Add your Mailgun configuration**
   ```bash
   # Set Mailgun as the email provider
   EMAIL_PROVIDER=mailgun
   
   # Your Mailgun credentials
   MAILGUN_API_KEY=key-1234567890abcdef1234567890abcdef
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAILGUN_FROM_EMAIL=noreply@mg.yourdomain.com
   MAILGUN_FROM_NAME=Your Website Monitor
   MAILGUN_REGION=us
   ```

4. **Configure the region**
   - Set `MAILGUN_REGION=us` for US data centers (default)
   - Set `MAILGUN_REGION=eu` for European data centers

## Step 5: Test Your Configuration

1. **Install dependencies**
   ```fish
   npm install
   ```

2. **Start the application**
   ```fish
   npm start
   ```

3. **Check the console output**
   You should see:
   ```
   📧 Mailgun mode enabled - emails will be sent via Mailgun API
   📧 Domain: mg.yourdomain.com
   📧 From: Your Website Monitor <noreply@mg.yourdomain.com>
   ✅ Mailgun configuration verified
   ```

4. **Test email sending**
   - Add a website to monitor in the dashboard
   - Set up email notifications
   - Wait for a monitoring check to trigger an email

## Step 6: Production Considerations

### Security
- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file
- Use environment variables in production deployments
- Rotate your API keys regularly

### Email Best Practices
- Use a dedicated subdomain (e.g., `mg.yourdomain.com`)
- Set up proper SPF, DKIM, and DMARC records
- Monitor your sending reputation
- Implement proper bounce and complaint handling

### Monitoring
- Check Mailgun's logs regularly for delivery issues
- Monitor your sending quotas
- Set up webhooks for delivery tracking (optional)

## Troubleshooting

### Common Issues

**Domain not verified**
```
Error: Domain not found or not verified
```
- Solution: Wait for DNS propagation (up to 48 hours)
- Check DNS records are correctly configured
- Verify domain status in Mailgun dashboard

**Invalid API key**
```
Error: Forbidden - Invalid API key
```
- Solution: Double-check your API key
- Ensure you're using the Private API key, not Public
- Make sure there are no extra spaces in the .env file

**Wrong region**
```
Error: The requested URL was not found
```
- Solution: Check if you need to set `MAILGUN_REGION=eu`
- EU accounts must use the EU region setting

**Emails not being delivered**
```
Email sent successfully but not received
```
- Check Mailgun logs in the dashboard
- Verify the recipient email address
- Check spam/junk folders
- Ensure your domain is fully verified

### Getting Help

1. **Check Mailgun logs**
   - Go to "Sending" → "Logs" in Mailgun dashboard
   - Look for delivery status and error messages

2. **Mailgun documentation**
   - Visit https://documentation.mailgun.com/
   - Check the API documentation for troubleshooting

3. **Application logs**
   - Check the console output for error messages
   - Look for specific Mailgun error details

## Alternative Providers

If you prefer different email providers:

- **SendGrid**: Set `EMAIL_PROVIDER=sendgrid`
- **Gmail SMTP**: Set `EMAIL_PROVIDER=gmail`
- **Local testing**: Set `EMAIL_PROVIDER=mailhog`

See the respective setup guides for configuration details.
