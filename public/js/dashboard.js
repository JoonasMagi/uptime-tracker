/**
 * Dashboard JavaScript functionality
 * Handles auto-refresh timer and real-time updates
 */

document.addEventListener('DOMContentLoaded', function () {
    const refreshTimer = document.querySelector('[data-testid="refresh-timer"]');

    if (!refreshTimer) {
        return; // No timer on empty state
    }

    let timeLeft = 30; // 30 seconds

    function updateTimer() {
        refreshTimer.textContent = timeLeft;

        if (timeLeft <= 0) {
            // Refresh the page
            window.location.reload();
        } else {
            timeLeft--;
        }
    }

    // Update timer every second
    const timerInterval = setInterval(updateTimer, 1000);

    // Optional: Pause timer when page is not visible
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            clearInterval(timerInterval);
        } else {
            // Resume timer when page becomes visible again
            timeLeft = 30;
            const newTimerInterval = setInterval(updateTimer, 1000);
        }
    });

    // Initialize timer display
    updateTimer();

    // Add click handlers for website items to navigate to statistics
    const websiteItems = document.querySelectorAll('[data-testid="website-item"]');
    websiteItems.forEach(item => {
        item.addEventListener('click', function () {
            const websiteId = this.getAttribute('data-website-id');
            if (websiteId) {
                window.location.href = `/statistics/${websiteId}`;
            }
        });
    });
});

/**
 * Future: Add real-time status checking via WebSocket or polling
 * This would update website statuses without full page refresh
 */