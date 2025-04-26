// Flag to detect if we're on Android
let isAndroid = false;

// Initialize predefined sites for easy reference
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

// Detect platform for specific adjustments
browser.runtime.getPlatformInfo().then(info => {
    isAndroid = info.os === 'android';
    console.log("Running on platform:", info.os);
    
    // If on Android, automatically check all social media sites
    if (isAndroid) {
        document.body.classList.add('android-device');
        
        // First load saved settings to avoid overwriting other custom sites
        browser.storage.local.get(['blockedSites'], function(result) {
            let blockedSites = result.blockedSites || [];
            
            // Add all predefined sites to blocked list if not already present
            predefinedSites.forEach(site => {
                if (!blockedSites.includes(site.url)) {
                    blockedSites.push(site.url);
                }
            });
            
            // Save the updated blocked sites
            browser.storage.local.set({ blockedSites: blockedSites }, function() {
                if (browser.runtime.lastError) {
                    console.error("Error saving blocked sites:", browser.runtime.lastError);
                    showStatusMessage("Failed to save settings", true);
                    return;
                }
                updateUIFromSettings();
                showStatusMessage("Default social sites blocked on Android");
            });
        });
    } else {
        // Regular behavior for desktop - just load saved settings
        updateUIFromSettings();
    }
}).catch(error => {
    console.error("Error detecting platform:", error);
    // Default to desktop behavior if detection fails
    updateUIFromSettings();
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

// Update UI checkboxes and lists based on saved settings
function updateUIFromSettings() {
    browser.storage.local.get(['blockedSites'], function(result) {
        if (browser.runtime.lastError) {
            console.error("Error loading blocked sites:", browser.runtime.lastError);
            showStatusMessage("Failed to load settings", true);
            return;
        }
        
        const blockedSites = result.blockedSites || [];
        
        // Update predefined checkboxes
        document.querySelectorAll('.site-checkbox').forEach(checkbox => {
            const siteUrl = checkbox.getAttribute('data-url');
            checkbox.checked = blockedSites.includes(siteUrl);
        });
        
        // Update custom blocked sites list
        updateBlockedList(blockedSites);
    });
}

// Update the custom blocked sites list
function updateBlockedList(blockedSites) {
    const listElement = document.getElementById('blocked-list');
    listElement.innerHTML = ''; // Clear current list
    
    // Get all predefined site URLs
    const predefinedUrls = Array.from(document.querySelectorAll('.site-checkbox')).map(
        checkbox => checkbox.getAttribute('data-url')
    );
    
    // Filter to show only custom sites (not in predefined list)
    const customSites = blockedSites.filter(site => !predefinedUrls.includes(site));
    
    if (customSites.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No custom websites blocked';
        listElement.appendChild(emptyMessage);
        return;
    }
    
    // Add custom sites to the list
    customSites.forEach((site, index) => {
        const li = document.createElement('li');
        li.className = 'blocked-item';
        
        const siteText = document.createElement('span');
        siteText.textContent = site;
        siteText.className = 'site-url';
        li.appendChild(siteText);
        
        const removeButton = document.createElement('button');
        removeButton.textContent = "Unblock";
        removeButton.className = 'unblock-button';
        removeButton.onclick = function() {
            removeBlockedSite(site);
        };
        li.appendChild(removeButton);
        
        listElement.appendChild(li);
    });
}

// Validate if a string is a properly formatted domain
function isValidDomain(domain) {
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(domain);
}

// Add custom site from user input
function addBlockedSite() {
    const websiteInput = document.getElementById('website-input').value.trim();
    // Clean the URL more thoroughly
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
    
    browser.storage.local.get(['blockedSites'], function(result) {
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
            updateUIFromSettings();
            showStatusMessage(`${cleanUrl} has been blocked`);
            
            // On Android, blur the input field to hide keyboard
            if (isAndroid) {
                document.getElementById('website-input').blur();
            }
        });
    });
}

// Remove site from blocked list
function removeBlockedSite(siteToRemove) {
    browser.storage.local.get(['blockedSites'], function(result) {
        if (browser.runtime.lastError) {
            console.error("Error loading blocked sites:", browser.runtime.lastError);
            showStatusMessage("Failed to unblock website", true);
            return;
        }
        
        const blockedSites = result.blockedSites || [];
        const siteIndex = blockedSites.indexOf(siteToRemove);
        
        if (siteIndex !== -1) {
            blockedSites.splice(siteIndex, 1);
            
            browser.storage.local.set({ blockedSites: blockedSites }, function() {
                if (browser.runtime.lastError) {
                    console.error("Error saving blocked sites:", browser.runtime.lastError);
                    showStatusMessage("Failed to save changes", true);
                    return;
                }
                
                updateUIFromSettings();
                showStatusMessage(`${siteToRemove} has been unblocked`);
            });
        }
    });
}

// Toggle predefined site based on checkbox state
function togglePredefinedSite(event) {
    const siteUrl = event.target.getAttribute('data-url');
    
    browser.storage.local.get(['blockedSites'], function(result) {
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
            
            updateUIFromSettings();
        });
    });
}

// Save all settings
function saveSettings() {
    // The individual toggles already save themselves, so we just need to show confirmation
    showStatusMessage("Settings saved successfully");
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for predefined checkboxes
    document.querySelectorAll('.site-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', togglePredefinedSite);
    });
    
    // Add event listener for the add website button
    document.getElementById('add-website').addEventListener('click', addBlockedSite);
    
    // Add event listener for the save button
    document.getElementById('save-button').addEventListener('click', saveSettings);
    
    // Add event listener for the enter key in the website input
    document.getElementById('website-input').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            addBlockedSite();
        }
    });
}); 