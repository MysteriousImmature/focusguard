let blockedSites = [];
let elapsedTime = 0;  // Total time spent on blocked sites (in seconds)
let lastUpdateTime = Date.now();  // Track the last update time for saving elapsed time

// Load blocked sites from storage and previous elapsed time
function loadBlockedSites() {
    chrome.storage.local.get(['blockedSites', 'elapsedTime'], function (result) {
        blockedSites = result.blockedSites || [];
        elapsedTime = result.elapsedTime || 0;
        updateBlockingRules();
    });
}

// Sanitize the user's input to create a valid URL pattern
function sanitizeUrlForPattern(url) {
    // Remove "http://" or "https://" if present
    url = url.replace(/^https?:\/\//, '');
    return `*://*.${url}/*`;  // Ensure subdomains are also blocked
}

// Update blocking rules based on the blocked sites
function updateBlockingRules() {
    const blockedPatterns = blockedSites.map(site => sanitizeUrlForPattern(site));

    // Remove previous listeners to avoid duplicates
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

// Block the request and increment elapsed time
function blockRequest(details) {
    const currentTime = Date.now();
    const timeBlocked = Math.round((currentTime - lastUpdateTime) / 1000);  // Time blocked in seconds
    elapsedTime += timeBlocked;  // Add time blocked to the total elapsed time
    lastUpdateTime = currentTime;  // Update the last update time to current time
    return { cancel: true };  // Block the request
}

// Periodically update storage with the accumulated time (every 30 seconds)
setInterval(function() {
    chrome.storage.local.set({ elapsedTime: elapsedTime });
}, 30000);  // Update every 30 seconds

// Listen for changes to the blocked websites and update the rules
chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (changes.blockedSites) {
        blockedSites = changes.blockedSites.newValue || [];
        updateBlockingRules();
    }
});

// Load the blocked sites and elapsed time when the extension starts
chrome.runtime.onStartup.addListener(loadBlockedSites);
chrome.runtime.onInstalled.addListener(loadBlockedSites);
