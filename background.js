let blockedSites = [];
let isAndroid = false;

// Five minutes is an estimate, not measured browsing time.
const ESTIMATED_SECONDS_PER_ATTEMPT = 5 * 60;
let statsWriteQueue = Promise.resolve();

// Detect Android before configuring Android-specific behavior.
browser.runtime.getPlatformInfo().then(info => {
    isAndroid = info.os === 'android';

    if (isAndroid) {
        browser.browserAction.setPopup({ popup: "" });

        browser.browserAction.onClicked.addListener(() => {
            browser.runtime.openOptionsPage();
        });

        // Start the refresh timer after platform detection finishes.
        setInterval(loadBlockedSites, 60000);

        // Refresh the badge after detecting Android.
        updateBlockingRules();
    }
}).catch(error => {
    console.error("Error detecting platform:", error);
});

function loadBlockedSites() {
    browser.storage.local.get(['blockedSites'], function (result) {
        if (browser.runtime.lastError) {
            console.error(
                "Error loading blocked sites:",
                browser.runtime.lastError
            );
            return;
        }

        blockedSites = result.blockedSites || [];
        updateBlockingRules();
    });
}

function isValidDomain(domain) {
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(domain);
}

function createUrlPattern(domain) {
    let cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '');

    cleanDomain = cleanDomain.split('/')[0].split('?')[0].split('#')[0];

    if (!isValidDomain(cleanDomain)) {
        console.warn("Invalid domain:", domain);
        return null;
    }

    return `*://*.${cleanDomain}/*`;
}

function updateBlockingRules() {
    try {
        if (browser.webRequest.onBeforeRequest.hasListener(blockRequest)) {
            browser.webRequest.onBeforeRequest.removeListener(blockRequest);
        }

        const urlPatterns = [];

        blockedSites.forEach(site => {
            const pattern = createUrlPattern(site);

            if (pattern) {
                urlPatterns.push(pattern);
            }
        });

        if (urlPatterns.length > 0) {
            browser.webRequest.onBeforeRequest.addListener(
                blockRequest,
                {
                    urls: urlPatterns,
                    types: ["main_frame"]
                },
                ["blocking"]
            );
        }

        if (isAndroid) {
            try {
                // Clear the badge when no sites remain blocked.
                browser.browserAction.setBadgeText({
                    text: urlPatterns.length
                        ? String(urlPatterns.length)
                        : ""
                });

                browser.browserAction.setBadgeBackgroundColor({
                    color: "#4f46e5"
                });
            } catch (error) {
                console.log("Badge not supported:", error);
            }
        }
    } catch (error) {
        console.error("Error updating blocking rules:", error);
    }
}

// Queue writes to avoid losing counts during simultaneous requests.
function recordBlockedAttempt() {
    statsWriteQueue = statsWriteQueue.then(async () => {
        const savedStats = await browser.storage.local.get('focusStats');
        const focusStats = savedStats.focusStats || {};

        const count = Number.isSafeInteger(focusStats.blockedAttempts) &&
            focusStats.blockedAttempts >= 0
            ? focusStats.blockedAttempts
            : 0;

        const saved = Number.isSafeInteger(focusStats.timeSavedSeconds) &&
            focusStats.timeSavedSeconds >= 0
            ? focusStats.timeSavedSeconds
            : 0;

        await browser.storage.local.set({
            focusStats: {
                blockedAttempts: count + 1,
                timeSavedSeconds: saved + ESTIMATED_SECONDS_PER_ATTEMPT
            }
        });
    }).catch(error => {
        console.error("Failed to save focus statistics:", error);
    });
}

function blockRequest() {
    recordBlockedAttempt();

    // Cancel synchronously; statistics save independently.
    return { cancel: true };
}

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.blockedSites) {
        blockedSites = changes.blockedSites.newValue || [];
        updateBlockingRules();
    }
});

browser.runtime.onStartup.addListener(loadBlockedSites);
browser.runtime.onInstalled.addListener(loadBlockedSites);

loadBlockedSites();