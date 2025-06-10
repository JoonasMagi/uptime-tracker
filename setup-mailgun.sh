#!/bin/bash

# Mailgun Setup Script for Uptime Tracker
# This script helps you configure Mailgun email service

echo "🚀 Mailgun Setup for Uptime Tracker"
echo "=================================="
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created: .env.backup.$(date +%Y%m%d_%H%M%S)"
else
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
fi

echo ""
echo "📋 Please provide your Mailgun configuration:"
echo ""

# Get user input
read -p "🔑 Enter your Mailgun API Key (starts with 'key-'): " api_key
read -p "🌐 Enter your Mailgun domain (e.g., mg.yourdomain.com): " domain
read -p "📧 Enter your FROM email address (e.g., noreply@mg.yourdomain.com): " from_email
read -p "👤 Enter your FROM name (e.g., Website Monitor): " from_name
echo ""
echo "🌍 Select your region:"
echo "1) US (default)"
echo "2) EU"
read -p "Enter choice (1 or 2): " region_choice

# Set region based on choice
if [ "$region_choice" = "2" ]; then
    region="eu"
else
    region="us"
fi

echo ""
echo "⚙️  Updating .env file..."

# Update .env file
sed -i "s/EMAIL_PROVIDER=.*/EMAIL_PROVIDER=mailgun/" .env
sed -i "s/MAILGUN_API_KEY=.*/MAILGUN_API_KEY=$api_key/" .env
sed -i "s/MAILGUN_DOMAIN=.*/MAILGUN_DOMAIN=$domain/" .env
sed -i "s/MAILGUN_FROM_EMAIL=.*/MAILGUN_FROM_EMAIL=$from_email/" .env
sed -i "s/MAILGUN_FROM_NAME=.*/MAILGUN_FROM_NAME=$from_name/" .env
sed -i "s/MAILGUN_REGION=.*/MAILGUN_REGION=$region/" .env

echo "✅ Configuration saved to .env file"
echo ""

# Install mailgun.js if not already installed
echo "📦 Checking dependencies..."
if ! npm list mailgun.js >/dev/null 2>&1; then
    echo "📥 Installing mailgun.js..."
    npm install mailgun.js
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🧪 Testing configuration..."
echo ""

# Test the configuration by starting the app briefly
echo "Starting application to test email configuration..."
timeout 10s npm start 2>&1 | head -20

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Make sure your domain is verified in Mailgun dashboard"
echo "2. Check the DNS records are properly configured"
echo "3. Start the application with: npm start"
echo "4. Add a website to monitor and test email notifications"
echo ""
echo "📚 For detailed setup instructions, see: MAILGUN_SETUP.md"
echo "🐛 If you encounter issues, check the troubleshooting section in the guide"
echo ""
echo "⚠️  Security reminder:"
echo "   - Never commit your .env file to version control"
echo "   - Make sure .env is in your .gitignore file"
echo ""
