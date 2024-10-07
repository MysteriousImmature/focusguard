// Initialize blocked sites array
let blockedSites = [];

// Load blocked sites from storage
function loadBlockedSites() {
    chrome.storage.local.get(['blockedSites'], function (result) {
        blockedSites = result.blockedSites || [];
        updateBlockingRules();
    });
}

// Sanitize the user's input to create a valid URL pattern
function sanitizeUrlForPattern(url) {
    // Remove "http://" or "https://" if present
    url = url.replace(/^https?:\/\//, '');

    // Ensure the URL doesn't start with "www." and add wildcard for subdomains
    return `*://*.${url}/*`;
}

// Update blocking rules based on the blocked sites
function updateBlockingRules() {
    // Map blocked sites to URL patterns
    const blockedPatterns = blockedSites.map(site => sanitizeUrlForPattern(site));

    // Remove any previous listeners to avoid duplicates
    if (chrome.webRequest.onBeforeRequest.hasListener(blockRequest)) {
        chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
    }

    // Add listener to block the requests matching the user-defined websites
    if (blockedPatterns.length > 0) {
        chrome.webRequest.onBeforeRequest.addListener(
            blockRequest,
            { urls: blockedPatterns },
            ["blocking"]
        );
    }
}

// Block the request
function blockRequest(details) {
    return { cancel: true };  // Cancel the request (block the site)
}

// Listen for changes to the blocked websites and update the rules
chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (changes.blockedSites) {
        blockedSites = changes.blockedSites.newValue || [];
        updateBlockingRules();
    }
});

// Load the blocked sites when the extension starts
chrome.runtime.onStartup.addListener(loadBlockedSites);
chrome.runtime.onInstalled.addListener(loadBlockedSites);
