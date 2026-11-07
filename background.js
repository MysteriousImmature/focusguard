let blockedSites = [];
let blockingEnabled = true;
let isAndroid = false;
let settingsRevision = 0;

// Estimate only: five minutes per cancelled navigation.
const ESTIMATED_SECONDS_PER_ATTEMPT = 5 * 60;
let statsWriteQueue = Promise.resolve();

browser.runtime.getPlatformInfo().then(info => {
    isAndroid = info.os === 'android';

    if (isAndroid) {
        browser.browserAction.setPopup({ popup: '' });

        browser.browserAction.onClicked.addListener(() => {
            browser.runtime.openOptionsPage();
        });

        setInterval(loadSettings, 60000);
    }

    updateBlockingRules();
}).catch(error => {
    console.error('Error detecting platform:', error);
});

async function loadSettings() {
    try {
        // Retry if settings changed while a read was in flight.
        let revision;
        let saved;

        do {
            revision = settingsRevision;

            saved = await browser.storage.local.get([
                'blockedSites',
                'blockingEnabled'
            ]);
        } while (revision !== settingsRevision);

        blockedSites = Array.isArray(saved.blockedSites)
            ? saved.blockedSites
            : [];

        // Existing installations remain enabled unless explicitly paused.
        blockingEnabled = saved.blockingEnabled !== false;

        updateBlockingRules();
    } catch (error) {
        console.error('Failed to load blocking settings:', error);
    }
}

function createUrlPattern(domain) {
    if (typeof domain !== 'string') return null;

    let cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '');

    cleanDomain = cleanDomain.split('/')[0].split('?')[0].split('#')[0];

    const valid = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(cleanDomain);

    return valid ? `*://*.${cleanDomain}/*` : null;
}

function updateBlockingRules() {
    try {
        const requests = browser.webRequest.onBeforeRequest;

        if (requests.hasListener(blockRequest)) {
            requests.removeListener(blockRequest);
        }

        const patterns = blockedSites
            .map(createUrlPattern)
            .filter(Boolean);

        // Paused mode keeps the saved list but removes blocking.
        if (blockingEnabled && patterns.length > 0) {
            requests.addListener(
                blockRequest,
                {
                    urls: patterns,
                    types: ['main_frame']
                },
                ['blocking']
            );
        }

        browser.browserAction.setTitle({
            title: blockingEnabled
                ? 'FocusGuard: Blocking on'
                : 'FocusGuard: Paused'
        }).catch(error => {
            console.error('Could not update title:', error);
        });

        browser.browserAction.setBadgeText({
            text: !blockingEnabled
                ? 'OFF'
                : isAndroid && patterns.length
                    ? String(patterns.length)
                    : ''
        }).catch(error => {
            console.error('Could not update badge:', error);
        });

        browser.browserAction.setBadgeBackgroundColor({
            color: blockingEnabled ? '#4f46e5' : '#6b7280'
        }).catch(error => {
            console.error('Could not update badge color:', error);
        });
    } catch (error) {
        console.error('Error updating blocking rules:', error);
    }
}

function recordBlockedAttempt() {
    statsWriteQueue = statsWriteQueue.then(async () => {
        const saved = await browser.storage.local.get('focusStats');
        const stats = saved.focusStats || {};

        const count = Number.isSafeInteger(stats.blockedAttempts) &&
            stats.blockedAttempts >= 0
            ? stats.blockedAttempts
            : 0;

        const seconds = Number.isSafeInteger(stats.timeSavedSeconds) &&
            stats.timeSavedSeconds >= 0
            ? stats.timeSavedSeconds
            : 0;

        await browser.storage.local.set({
            focusStats: {
                blockedAttempts: count + 1,
                timeSavedSeconds:
                    seconds + ESTIMATED_SECONDS_PER_ATTEMPT
            }
        });
    }).catch(error => {
        console.error('Failed to save focus statistics:', error);
    });
}

function blockRequest() {
    // Also protect requests dispatched immediately before pausing.
    if (!blockingEnabled) {
        return { cancel: false };
    }

    recordBlockedAttempt();
    return { cancel: true };
}

browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    if (!changes.blockedSites && !changes.blockingEnabled) {
        return;
    }

    settingsRevision++;

    if (changes.blockedSites) {
        blockedSites = Array.isArray(changes.blockedSites.newValue)
            ? changes.blockedSites.newValue
            : [];
    }

    if (changes.blockingEnabled) {
        blockingEnabled =
            changes.blockingEnabled.newValue !== false;
    }

    updateBlockingRules();
});

browser.runtime.onStartup.addListener(loadSettings);
browser.runtime.onInstalled.addListener(loadSettings);

loadSettings();