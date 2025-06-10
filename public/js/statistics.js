/**
 * Statistics page JavaScript functionality
 * Handles period switching and dynamic data updates
 */

document.addEventListener('DOMContentLoaded', function () {
    const periodButtons = document.querySelectorAll('.period-btn');
    const activePeriodDisplay = document.querySelector('[data-testid="active-period"]');
    const uptimeValue = document.querySelector('[data-testid="uptime-value"]');

    // Period data mapping
    const periodData = {
        '24h': {
            label: '24 hours',
            labelEt: '24 tundi'
        },
        '7d': {
            label: '7 days',
            labelEt: '7 päeva'
        },
        '30d': {
            label: '30 days',
            labelEt: '30 päeva'
        }
    };

    // Handle period button clicks
    periodButtons.forEach(button => {
        button.addEventListener('click', function () {
            const period = this.getAttribute('data-period');

            // Remove active class from all buttons
            periodButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Update active period display
            const periodInfo = periodData[period];
            if (activePeriodDisplay && periodInfo) {
                activePeriodDisplay.innerHTML = `Showing statistics for: <strong>${periodInfo.label}</strong>`;
            }

            // Update statistics display based on selected period
            updateStatisticsDisplay(period);
        });
    });

    function updateStatisticsDisplay(period) {
        // Get the website ID from URL
        const websiteId = window.location.pathname.split('/').pop();

        // In a real implementation, you would fetch new data from the API
        // For now, we'll update the display with existing data

        const uptimeElements = {
            '24h': document.querySelector('[data-testid="uptime-24h"]'),
            '7d': document.querySelector('[data-testid="uptime-7d"]'),
            '30d': document.querySelector('[data-testid="uptime-30d"]')
        };

        const responseElements = {
            '24h': document.querySelector('[data-testid="avg-response-24h"]'),
            '7d': document.querySelector('[data-testid="avg-response-7d"]'),
            '30d': document.querySelector('[data-testid="avg-response-30d"]')
        };

        // Update the main uptime value display and chart
        if (uptimeElements[period] && uptimeValue) {
            const currentUptime = uptimeElements[period].getAttribute('data-value') ||
                uptimeElements[period].textContent.replace('%', '');
            uptimeValue.textContent = currentUptime + '%';

            // Update chart bar
            const uptimeFill = document.querySelector('.uptime-fill');
            if (uptimeFill) {
                uptimeFill.style.width = currentUptime + '%';
            }
        }

        // Update outage counts based on period (simplified for demo)
        const outageCount = document.querySelector('[data-testid="outage-count"]');
        const outageDuration = document.querySelector('[data-testid="outage-duration"]');

        if (outageCount && outageDuration) {
            // In real implementation, fetch from API
            // For demo, show different values based on period
            const outageData = {
                '24h': { count: '1', duration: '2 h' },
                '7d': { count: '3', duration: '8 h' },
                '30d': { count: '7', duration: '24 h' }
            };

            const data = outageData[period] || outageData['24h'];
            outageCount.textContent = data.count;
            outageDuration.textContent = data.duration;
        }
    }

    // Initialize with 24h period
    updateStatisticsDisplay('24h');
});
