let blockedSites = [];
let startTime = Date.now();  // Start the timer when the extension is loaded
let elapsedTime = 0;  // Store elapsed time in seconds

// Load blocked sites and elapsed time from storage
function loadBlockedSites() {
    chrome.storage.local.get(['blockedSites', 'elapsedTime'], function (result) {
        blockedSites = result.blockedSites || [];
        elapsedTime = result.elapsedTime || 0;
        startTime = Date.now() - elapsedTime * 1000; // Adjust start time based on saved elapsed time
        updateBlockingRules();
        updateTimer();
    });
}

// Update blocking rules based on the blocked sites
function updateBlockingRules() {
    const blockedPatterns = blockedSites.map(site => sanitizeUrlForPattern(site.url));

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
    // Increment block count (similar to the previous version)
    const blockedSite = blockedSites.find(site => details.url.includes(site.url));
    if (blockedSite) {
        blockedSite.count++;  // Increment the block count for the site
        chrome.storage.local.set({ blockedSites: blockedSites });
    }
    return { cancel: true };  // Cancel the request (block the site)
}

// Update the timer and store elapsed time in storage
function updateTimer() {
    // Calculate elapsed time in seconds
    elapsedTime = Math.floor((Date.now() - startTime) / 1000); // in seconds

    // Save the elapsed time in Chrome storage
    chrome.storage.local.set({ elapsedTime: elapsedTime });

    // Update the timer every second
    setTimeout(updateTimer, 1000);  // Call this function again after 1 second
}

// Listen for changes to the blocked websites and update the rules
chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (changes.blockedSites) {
        blockedSites = changes.blockedSites.newValue || [];
        updateBlockingRules();
    }
});

// Load the blocked sites and timer when the extension starts
chrome.runtime.onStartup.addListener(loadBlockedSites);
chrome.runtime.onInstalled.addListener(loadBlockedSites);
