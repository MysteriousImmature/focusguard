// Global variable to store blocked sites
let blockedSites = [];

// Load blocked sites from storage
function loadBlockedSites() {
    browser.storage.local.get(['blockedSites'], function (result) {
        if (browser.runtime.lastError) {
            console.error("Error loading blocked sites:", browser.runtime.lastError);
            return;
        }
        
        blockedSites = result.blockedSites || [];
        updateBlockingRules();
    });
}

// Validate and sanitize a domain for use in rules
function isValidDomain(domain) {
    // Basic domain validation pattern
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(domain);
}

// Create URL pattern for blocking
function createUrlPattern(domain) {
    // Remove http/https and www if present
    let cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Remove any paths, queries or fragments to ensure we only have the domain
    cleanDomain = cleanDomain.split('/')[0].split('?')[0].split('#')[0];
    
    // Log the domain processing for debugging
    console.log(`Processing domain: ${domain} → cleaned to: ${cleanDomain}`);
    
    if (!isValidDomain(cleanDomain)) {
        console.warn(`Invalid domain format: ${domain} (cleaned: ${cleanDomain})`);
        return null;
    }
    
    // Create pattern matching both www and non-www versions
    return `*://*.${cleanDomain}/*`;
}

// Update blocking rules based on blocked sites
function updateBlockingRules() {
    // Remove any previous listeners to avoid duplicates
    if (browser.webRequest.onBeforeRequest.hasListener(blockRequest)) {
        browser.webRequest.onBeforeRequest.removeListener(blockRequest);
    }
    
    // Create URL patterns for all blocked sites
    const urlPatterns = [];
    
    blockedSites.forEach(site => {
        const pattern = createUrlPattern(site);
        if (pattern) {
            urlPatterns.push(pattern);
        }
    });
    
    // If we have patterns, add the blocking listener
    if (urlPatterns.length > 0) {
        browser.webRequest.onBeforeRequest.addListener(
            blockRequest,
            { urls: urlPatterns, types: ["main_frame"] },
            ["blocking"]
        );
    }
}

// Function to block requests
function blockRequest() {
    return { cancel: true };
}

// Listen for changes to the blocked websites
browser.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName === 'local' && changes.blockedSites) {
        blockedSites = changes.blockedSites.newValue || [];
        updateBlockingRules();
    }
});

// Initialize blocked sites on startup and installation
browser.runtime.onStartup.addListener(loadBlockedSites);
browser.runtime.onInstalled.addListener(loadBlockedSites);

// Load settings immediately to ensure blocking works
loadBlockedSites();
