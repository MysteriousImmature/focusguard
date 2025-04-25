// Initialize predefined sites and display them with checkboxes
const predefinedSites = [
    { name: 'Facebook', url: 'facebook.com' },
    { name: 'YouTube', url: 'youtube.com' },
    { name: 'WhatsApp', url: 'web.whatsapp.com' },
    { name: 'Instagram', url: 'instagram.com' },
    { name: 'WeChat', url: 'weixin.qq.com' },
    { name: 'TikTok', url: 'tiktok.com' },
    { name: 'Twitter (X)', url: 'x.com' },
    { name: 'LinkedIn', url: 'linkedin.com' },
    { name: 'Pinterest', url: 'pinterest.com' },
    { name: 'Reddit', url: 'reddit.com' }
];

// Flag to detect if we're on Android
let isAndroid = false;

// Detect platform for specific adjustments
browser.runtime.getPlatformInfo().then(info => {
    isAndroid = info.os === 'android';
    if (isAndroid) {
        document.body.classList.add('android-device');
    }
}).catch(error => {
    console.error("Error detecting platform:", error);
});

// Display status message to user
function showStatusMessage(message, isError = false) {
    const statusEl = document.getElementById('status-message');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = isError ? 'status error' : 'status success';
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// Load blocked sites and update checkboxes based on saved state
function updateBlockedList() {
    browser.storage.local.get(['blockedSites'], function (result) {
        if (browser.runtime.lastError) {
            console.error("Error loading blocked sites:", browser.runtime.lastError);
            showStatusMessage("Failed to load blocked sites", true);
            return;
        }
        
        const blockedSites = result.blockedSites || [];
        const listElement = document.getElementById('blocked-list');
        listElement.innerHTML = ''; // Clear current list

        // Populate blocked list with user-added sites
        blockedSites.forEach((site, index) => {
            const li = document.createElement('li');
            li.className = 'blocked-item';
            
            const siteText = document.createElement('span');
            siteText.textContent = site;
            siteText.className = 'site-url';
            li.appendChild(siteText);
            
            const removeButton = document.createElement('button');
            removeButton.textContent = "Unblock";
            removeButton.className = 'unblock-button';
            removeButton.onclick = function () {
                removeBlockedSite(index);
            };
            li.appendChild(removeButton);
            
            listElement.appendChild(li);
        });

        // Show empty state message if no sites are blocked
        if (blockedSites.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No websites currently blocked';
            listElement.appendChild(emptyMessage);
        }

        // Update predefined list checkboxes based on blockedSites
        document.querySelectorAll('.predefined-checkbox').forEach(checkbox => {
            const siteUrl = checkbox.getAttribute('data-url');
            checkbox.checked = blockedSites.includes(siteUrl);
        });
    });
}

// Validate if a string is a properly formatted domain
function isValidDomain(domain) {
    // Use the same validation pattern as background.js for consistency
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(domain);
}

// Add or remove predefined site based on checkbox state
function togglePredefinedSite(event) {
    const siteUrl = event.target.getAttribute('data-url');

    browser.storage.local.get(['blockedSites'], function (result) {
        if (browser.runtime.lastError) {
            console.error("Error loading blocked sites:", browser.runtime.lastError);
            showStatusMessage("Failed to update settings", true);
            return;
        }
        
        const blockedSites = result.blockedSites || [];
        const siteIndex = blockedSites.indexOf(siteUrl);

        if (event.target.checked) {
            if (siteIndex === -1) blockedSites.push(siteUrl);
        } else {
            if (siteIndex !== -1) blockedSites.splice(siteIndex, 1);
        }

        browser.storage.local.set({ blockedSites: blockedSites }, function() {
            if (browser.runtime.lastError) {
                console.error("Error saving blocked sites:", browser.runtime.lastError);
                showStatusMessage("Failed to save changes", true);
                return;
            }
            updateBlockedList();
        });
    });
}

// Add custom site from user input
function addBlockedSite() {
    const websiteInput = document.getElementById('website-input').value.trim();
    // Clean the URL more thoroughly to match background.js
    let cleanUrl = websiteInput.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Remove any paths, queries or fragments
    cleanUrl = cleanUrl.split('/')[0].split('?')[0].split('#')[0];

    if (!cleanUrl) {
        showStatusMessage("Please enter a website URL", true);
        return;
    }
    
    if (!isValidDomain(cleanUrl)) {
        showStatusMessage("Please enter a valid domain name", true);
        return;
    }

    // Check if maximum sites limit reached (Firefox limit is not as strict as Chrome's)
    browser.storage.local.get(['blockedSites'], function (result) {
        if (browser.runtime.lastError) {
            console.error("Error loading blocked sites:", browser.runtime.lastError);
            showStatusMessage("Failed to update settings", true);
            return;
        }
        
        const blockedSites = result.blockedSites || [];
        
        // Check for duplicate
        if (blockedSites.includes(cleanUrl)) {
            showStatusMessage("This website is already blocked");
            document.getElementById('website-input').value = '';
            return;
        }
        
        blockedSites.push(cleanUrl);
        
        browser.storage.local.set({ blockedSites: blockedSites }, function() {
            if (browser.runtime.lastError) {
                console.error("Error saving blocked sites:", browser.runtime.lastError);
                showStatusMessage("Failed to save changes", true);
                return;
            }
            
            document.getElementById('website-input').value = '';
            updateBlockedList();
            showStatusMessage(`${cleanUrl} has been blocked`);
            
            // On Android, blur the input field to hide keyboard
            if (isAndroid) {
                document.getElementById('website-input').blur();
            }
        });
    });
}

// Remove site from blocked list
function removeBlockedSite(index) {
    browser.storage.local.get(['blockedSites'], function (result) {
        if (browser.runtime.lastError) {
            console.error("Error loading blocked sites:", browser.runtime.lastError);
            showStatusMessage("Failed to unblock website", true);
            return;
        }
        
        const blockedSites = result.blockedSites || [];
        const removedSite = blockedSites[index];
        blockedSites.splice(index, 1);
        
        browser.storage.local.set({ blockedSites: blockedSites }, function() {
            if (browser.runtime.lastError) {
                console.error("Error saving blocked sites:", browser.runtime.lastError);
                showStatusMessage("Failed to save changes", true);
                return;
            }
            
            updateBlockedList();
            showStatusMessage(`${removedSite} has been unblocked`);
        });
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load blocked sites on popup open
    updateBlockedList();
    
    // Button click event for adding sites
    document.getElementById('add-website').addEventListener('click', addBlockedSite);
    
    // Listen for Enter key in the input field
    document.getElementById('website-input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addBlockedSite();
        }
    });
    
    // Add event listeners to predefined site checkboxes
    document.querySelectorAll('.predefined-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', togglePredefinedSite);
    });
    
    // Add touch-specific events for mobile
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        // Improve touch experience for checkboxes
        document.querySelectorAll('.predefined-checkbox').forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            if (label) {
                label.addEventListener('touchstart', function(e) {
                    // Prevent the default touch behavior to avoid delay
                    e.preventDefault();
                    checkbox.checked = !checkbox.checked;
                    // Manually trigger the change event
                    const event = new Event('change');
                    checkbox.dispatchEvent(event);
                });
            }
        });
        
        // Add active state for buttons on touch
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            });
            button.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            });
        });
    }
});
