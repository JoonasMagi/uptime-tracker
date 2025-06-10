# Uptime Tracker - User Stories

## Project Overview
Uptime tracker application for monitoring website availability, developed using TDD (Test-Driven Development) methodology.

---

## User Story #1: Adding Website Monitoring

**As a user**, I want to add a website to monitoring so that I can track its availability.

### Acceptance Criteria:
- [x] I can enter a website URL (e.g., https://example.com)
- [x] I can set the check interval (1 min, 5 min, 15 min, 30 min, 1 hour)
- [x] I can provide a name/description for the site
- [x] The system validates URL format correctness
- [x] I can save the monitoring configuration
- [x] A confirmation of successful monitoring addition is displayed

---

## User Story #2: Real-time Status Viewing

**As a user**, I want to see the current status of all monitored sites so that I can quickly know what's working and what's not.

### Acceptance Criteria:
- [x] All monitored sites are displayed in a list
- [x] Current status is visible for each site (ONLINE/OFFLINE/UNKNOWN)
- [x] Last check time is displayed
- [x] Response time in milliseconds is shown
- [x] Online sites are marked in green
- [x] Offline sites are marked in red
- [x] The page auto-refreshes every 30 seconds

---

## User Story #3: Uptime Statistics Viewing

**As a user**, I want to see uptime statistics for a specific site over different time periods so that I can assess its reliability.

### Acceptance Criteria:
- [x] I can select a site by clicking to view its details
- [x] Uptime percentage is displayed for the last 24 hours, 7 days, and 30 days
- [x] Average response time for the selected period is shown
- [x] Number and total duration of outages are displayed
- [x] Statistics are calculated correctly based on monitoring data
- [x] Data is presented in a clearly readable format

---

## User Story #4: Site Down Notifications

**As a user**, I want to receive notifications when a monitored site becomes unavailable so that I can react quickly.

### Acceptance Criteria:
- [ ] The system detects when a site doesn't respond for 3 consecutive checks
- [ ] I can configure an email address for receiving notifications
- [ ] I can choose which sites I want to receive notifications for
- [ ] Notification is sent within 5 minutes after problem detection
- [ ] The notification includes site name, URL, and the problem
- [ ] I receive a notification later when the site is available again

---

## User Story #5: Monitoring Management

**As a user**, I want to manage existing monitors so that I can change configuration or remove unnecessary ones.

### Acceptance Criteria:
- [ ] I can view a list of all monitors
- [ ] I can modify monitor name and check interval
- [ ] I can temporarily pause and restart monitoring
- [ ] I can permanently delete a monitor
- [ ] Confirmation is requested when deleting
- [ ] Changes take effect immediately
- [ ] Confirmation of saved changes is displayed

---

## TDD Development Process

### Recommended Implementation Order:
1. **User Story #1: Adding Website Monitoring** - Core functionality
2. **User Story #2: Real-time Status Viewing** - User interface and data display
3. **User Story #5: Monitoring Management** - CRUD operations
4. **User Story #3: Uptime Statistics Viewing** - Data analysis and reporting
5. **User Story #4: Site Down Notifications** - Notification system

### TDD Steps for Each User Story:
1. **Red** - Write a test that fails
2. **Green** - Write minimal code to make the test pass
3. **Refactor** - Improve code quality while keeping tests green

---

## Email Configuration

The uptime tracker now supports real email notifications! Configure email settings to receive alerts when your sites go down or recover.

### Quick Setup

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Choose your email provider and configure:**

   **For SendGrid (Recommended for DigitalOcean):**
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=your-verified-email@yourdomain.com
   SENDGRID_FROM_NAME=Uptime Tracker
   ```

   **Why SendGrid?** DigitalOcean blocks SMTP ports (25, 587, 465) by default. SendGrid uses HTTP API instead of SMTP, so it works perfectly on DigitalOcean! See `SENDGRID_SETUP.md` for detailed setup instructions.

   **For Gmail:**
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

   **Important for Gmail:** You need to use an "App Password", not your regular password:
   - Enable 2-factor authentication on your Google account
   - Go to Google Account settings → Security → App passwords
   - Generate a new app password for "Mail"
   - Use this app password in the EMAIL_PASSWORD field

   **For Outlook/Hotmail:**
   ```env
   EMAIL_PROVIDER=outlook
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASSWORD=your-password
   ```

   **For MailHog (Recommended for Testing):**
   ```env
   EMAIL_PROVIDER=mailhog
   ```

   **MailHog Setup:**
   1. Install MailHog: `go install github.com/mailhog/MailHog@latest`
   2. Start MailHog: `MailHog`
   3. View emails at: http://localhost:8025
   4. All emails are captured locally, no real emails sent!

   **For Test Mode (Alternative):**
   ```env
   EMAIL_PROVIDER=test
   ```
   This uses Ethereal Email for testing - check the console for preview URLs of sent emails.

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Configure notifications in the app:**
   - Go to Settings → Notifications
   - Enter your email address
   - Select which sites to monitor
   - Set the failure threshold (default: 3 consecutive failures)

### Email Features

- **HTML formatted emails** with clear site information
- **Down alerts** when sites become unavailable
- **Recovery notifications** when sites come back online
- **Test mode** for development without sending real emails
- **Multiple provider support** (Gmail, Outlook, custom SMTP)

---

## Technical Notes

- All acceptance criteria should be covered by automated tests
- Use checkboxes to mark completed criteria
- Each user story can be broken down into smaller sub-tasks
- Document test cases and their results
- Consider edge cases and error handling for each criterion
- Maintain test coverage reports throughout development