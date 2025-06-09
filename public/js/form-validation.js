// Client-side form validation
document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form[data-testid="add-website-form"]');
    const urlInput = document.querySelector('input[data-testid="url-input"]');
    const nameInput = document.querySelector('input[data-testid="website-name"]');

    if (form) {
        // Disable HTML5 validation to use our custom validation
        form.setAttribute('novalidate', '');

        form.addEventListener('submit', function (e) {
            // Clear previous errors
            hideAllErrors();

            let hasErrors = false;

            // Validate URL
            const url = urlInput.value.trim();
            if (!url) {
                showError('url-required-error');
                hasErrors = true;
            } else if (!isValidUrl(url)) {
                showError('url-error');
                hasErrors = true;
            }

            // Validate name
            const name = nameInput.value.trim();
            if (!name) {
                showError('name-required-error');
                hasErrors = true;
            }

            if (hasErrors) {
                e.preventDefault();
                return false;
            }
        });

        // Real-time validation
        if (urlInput) {
            urlInput.addEventListener('input', function () {
                const url = this.value.trim();
                if (url && isValidUrl(url)) {
                    hideError('url-error');
                    hideError('url-required-error');
                }
            });
        }

        if (nameInput) {
            nameInput.addEventListener('input', function () {
                const name = this.value.trim();
                if (name) {
                    hideError('name-required-error');
                }
            });
        }
    }

    function showError(errorId) {
        const errorElement = document.querySelector(`[data-testid="${errorId}"]`);
        if (errorElement) {
            errorElement.style.display = 'block';
        }
    }

    function hideError(errorId) {
        const errorElement = document.querySelector(`[data-testid="${errorId}"]`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    function hideAllErrors() {
        const errors = document.querySelectorAll('[data-testid$="-error"]');
        errors.forEach(error => {
            error.style.display = 'none';
        });
    }

    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
});
