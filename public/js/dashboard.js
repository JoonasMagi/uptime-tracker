/**
 * Dashboard JavaScript functionality
 * Handles auto-refresh timer, real-time updates, and website management
 */

document.addEventListener('DOMContentLoaded', function () {
    const refreshTimer = document.querySelector('[data-testid="refresh-timer"]');

    if (refreshTimer) {
        initializeAutoRefresh();
    }

    // Initialize management functionality
    initializeWebsiteManagement();

    function initializeAutoRefresh() {
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
    }

    function initializeWebsiteManagement() {
        // Add click handlers for website items to navigate to statistics (but not when clicking management controls)
        const websiteItems = document.querySelectorAll('[data-testid="website-item"]');
        websiteItems.forEach(item => {
            item.addEventListener('click', function (e) {
                // Don't navigate if clicked on management controls or edit form
                if (e.target.closest('[data-testid="management-controls"]') || 
                    e.target.closest('[data-testid="edit-form"]')) {
                    return;
                }
                
                const websiteId = this.getAttribute('data-website-id');
                if (websiteId) {
                    window.location.href = `/statistics/${websiteId}`;
                }
            });
        });

        // Edit functionality
        setupEditFunctionality();
        
        // Pause/Resume functionality
        setupPauseResumeFunctionality();
        
        // Delete functionality
        setupDeleteFunctionality();
    }

    function setupEditFunctionality() {
        const editButtons = document.querySelectorAll('[data-testid="edit-website-btn"]');
        
        editButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                
                const websiteItem = this.closest('[data-testid="website-item"]');
                const editForm = websiteItem.querySelector('[data-testid="edit-form"]');
                
                // Show the edit form
                editForm.classList.remove('hidden');
                
                // Hide management controls
                const managementControls = websiteItem.querySelector('[data-testid="management-controls"]');
                managementControls.style.display = 'none';
            });
        });

        // Save changes functionality
        const saveButtons = document.querySelectorAll('[data-testid="save-changes-btn"]');
        saveButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                
                const websiteId = this.getAttribute('data-id');
                const websiteItem = this.closest('[data-testid="website-item"]');
                const editForm = websiteItem.querySelector('[data-testid="edit-form"]');
                const nameInput = editForm.querySelector('[data-testid="edit-name-input"]');
                const intervalSelect = editForm.querySelector('[data-testid="edit-interval-select"]');
                
                const newName = nameInput.value;
                const newInterval = intervalSelect.value;
                
                // Send update request
                fetch(`/api/website/${websiteId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newName,
                        checkInterval: newInterval
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update the display
                        const nameElement = websiteItem.querySelector('[data-testid="website-name"]');
                        const intervalElement = websiteItem.querySelector('[data-testid="check-interval-info"]');
                        
                        nameElement.textContent = newName;
                        intervalElement.textContent = `${newInterval} min`;
                          // Hide edit form
                        editForm.classList.add('hidden');
                        
                        // Show management controls again
                        const managementControls = websiteItem.querySelector('[data-testid="management-controls"]');
                        managementControls.style.display = 'flex';
                        
                        // Show success message
                        showSuccessMessage('Veebisait edukalt uuendatud');
                    }
                })
                .catch(error => {
                    console.error('Error updating website:', error);
                    showErrorMessage('Viga veebisaidi uuendamisel');
                });
            });
        });

        // Cancel edit functionality
        const cancelButtons = document.querySelectorAll('[data-testid="cancel-edit-btn"]');
        cancelButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                  const websiteItem = this.closest('[data-testid="website-item"]');
                const editForm = websiteItem.querySelector('[data-testid="edit-form"]');
                
                // Hide edit form
                editForm.classList.add('hidden');
                
                // Show management controls again
                const managementControls = websiteItem.querySelector('[data-testid="management-controls"]');
                managementControls.style.display = 'flex';
            });
        });
    }

    function setupPauseResumeFunctionality() {
        // Pause functionality
        const pauseButtons = document.querySelectorAll('[data-testid="pause-website-btn"]');
        pauseButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                
                const websiteId = this.getAttribute('data-id');
                const websiteItem = this.closest('[data-testid="website-item"]');
                
                fetch(`/api/website/${websiteId}/pause`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update status display
                        const statusElement = websiteItem.querySelector('[data-testid="website-status"]');
                        statusElement.setAttribute('data-status', 'paused');
                        statusElement.textContent = 'Peatatud';
                        statusElement.className = 'status status-paused';
                        
                        // Update website item data-status
                        websiteItem.setAttribute('data-status', 'paused');
                        
                        // Replace pause button with resume button
                        this.outerHTML = `<button data-testid="resume-website-btn" class="btn btn-sm btn-success" data-id="${websiteId}" title="Resume monitoring">▶️ Jätka</button>`;
                        
                        // Re-setup resume functionality for the new button
                        setupResumeButton(websiteItem.querySelector('[data-testid="resume-website-btn"]'));
                        
                        showSuccessMessage('Monitooring peatatud');
                    }
                })
                .catch(error => {
                    console.error('Error pausing website:', error);
                    showErrorMessage('Viga monitooringu peatamisel');
                });
            });
        });

        // Resume functionality
        const resumeButtons = document.querySelectorAll('[data-testid="resume-website-btn"]');
        resumeButtons.forEach(button => {
            setupResumeButton(button);
        });
    }

    function setupResumeButton(button) {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const websiteId = this.getAttribute('data-id');
            const websiteItem = this.closest('[data-testid="website-item"]');
            
            fetch(`/api/website/${websiteId}/resume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {                    // Update status display
                    const statusElement = websiteItem.querySelector('[data-testid="website-status"]');
                    statusElement.setAttribute('data-status', 'online');
                    statusElement.textContent = 'ONLINE';
                    statusElement.className = 'status status-up status-online status-success';
                    
                    // Update website item data-status
                    websiteItem.setAttribute('data-status', 'online');
                    
                    // Replace resume button with pause button
                    this.outerHTML = `<button data-testid="pause-website-btn" class="btn btn-sm btn-warning" data-id="${websiteId}" title="Pause monitoring">⏸️ Peata</button>`;
                    
                    // Re-setup pause functionality for the new button
                    setupPauseButton(websiteItem.querySelector('[data-testid="pause-website-btn"]'));
                    
                    showSuccessMessage('Monitooring jätkatud');
                }
            })
            .catch(error => {
                console.error('Error resuming website:', error);
                showErrorMessage('Viga monitooringu jätkamisel');
            });
        });
    }

    function setupPauseButton(button) {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const websiteId = this.getAttribute('data-id');
            const websiteItem = this.closest('[data-testid="website-item"]');
            
            fetch(`/api/website/${websiteId}/pause`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update status display
                    const statusElement = websiteItem.querySelector('[data-testid="website-status"]');
                    statusElement.setAttribute('data-status', 'paused');
                    statusElement.textContent = 'Peatatud';
                    statusElement.className = 'status status-paused';
                    
                    // Update website item data-status
                    websiteItem.setAttribute('data-status', 'paused');
                    
                    // Replace pause button with resume button
                    this.outerHTML = `<button data-testid="resume-website-btn" class="btn btn-sm btn-success" data-id="${websiteId}" title="Resume monitoring">▶️ Jätka</button>`;
                    
                    // Re-setup resume functionality for the new button
                    setupResumeButton(websiteItem.querySelector('[data-testid="resume-website-btn"]'));
                    
                    showSuccessMessage('Monitooring peatatud');
                }
            })
            .catch(error => {
                console.error('Error pausing website:', error);
                showErrorMessage('Viga monitooringu peatamisel');
            });
        });
    }

    function setupDeleteFunctionality() {
        const deleteButtons = document.querySelectorAll('[data-testid="delete-website-btn"]');
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                
                const websiteId = this.getAttribute('data-id');
                
                // Show confirmation dialog
                const confirmDialog = document.querySelector('[data-testid="delete-confirmation-dialog"]');
                confirmDialog.classList.remove('hidden');
                
                // Set up confirm delete button
                const confirmButton = confirmDialog.querySelector('[data-testid="confirm-delete-btn"]');
                const cancelButton = confirmDialog.querySelector('[data-testid="cancel-delete-btn"]');
                
                // Remove existing event listeners by cloning
                const newConfirmButton = confirmButton.cloneNode(true);
                const newCancelButton = cancelButton.cloneNode(true);
                confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
                cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
                
                // Add new event listeners
                newConfirmButton.addEventListener('click', function () {
                    fetch(`/api/website/${websiteId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Remove website item from DOM
                            const websiteItem = document.querySelector(`[data-website-id="${websiteId}"]`);
                            websiteItem.remove();
                            
                            // Hide dialog
                            confirmDialog.classList.add('hidden');
                            
                            showSuccessMessage('Veebisait edukalt kustutatud');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting website:', error);
                        showErrorMessage('Viga veebisaidi kustutamisel');
                    });
                });
                
                newCancelButton.addEventListener('click', function () {
                    confirmDialog.classList.add('hidden');
                });
            });
        });
    }

    function showSuccessMessage(message) {
        const successMessage = document.querySelector('[data-testid="success-message"]');
        successMessage.textContent = message;
        successMessage.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);
    }

    function showErrorMessage(message) {
        // For now, use alert. Could be enhanced with a proper error message component
        alert(message);
    }
});

/**
 * Real-time status checking via WebSocket or polling could be added here
 */