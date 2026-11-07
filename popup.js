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
    { name: 'Reddit', url: 'reddit.com' },
    { name: 'Bluesky', url: 'bsky.app' },
    { name: 'Discord', url: 'discord.com' }
];

let isAndroid = false;

browser.runtime.getPlatformInfo().then(info => {
    isAndroid = info.os === 'android';

    if (isAndroid) {
        document.body.classList.add('android-device');
    }
}).catch(error => {
    console.error("Error detecting platform:", error);
});

// Display status message
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

// Load blocked sites and update the interface
function updateBlockedList() {
    browser.storage.local.get(['blockedSites'], function (result) {
        if (browser.runtime.lastError) {
            console.error("Error loading blocked sites:", browser.runtime.lastError);
            showStatusMessage("Failed to load blocked sites", true);
            return;
        }

        const blockedSites = result.blockedSites || [];
        const listElement = document.getElementById('blocked-list');
        listElement.innerHTML = '';

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

        if (blockedSites.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No websites currently blocked';
            listElement.appendChild(emptyMessage);
        }

        document.querySelectorAll('.predefined-checkbox').forEach(checkbox => {
            const siteUrl = checkbox.getAttribute('data-url');
            checkbox.checked = blockedSites.includes(siteUrl);
        });
    });
}

// Validate domain
function isValidDomain(domain) {
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(domain);
}

// Toggle predefined site
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

        browser.storage.local.set({ blockedSites }, function () {
            if (browser.runtime.lastError) {
                console.error("Error saving blocked sites:", browser.runtime.lastError);
                showStatusMessage("Failed to save changes", true);
                return;
            }

            updateBlockedList();
        });
    });
}

// Add custom site
function addBlockedSite() {
    const websiteInput = document.getElementById('website-input').value.trim();

    let cleanUrl = websiteInput
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '');

    cleanUrl = cleanUrl.split('/')[0].split('?')[0].split('#')[0];

    if (!cleanUrl) {
        showStatusMessage("Please enter a website URL", true);
        return;
    }

    if (!isValidDomain(cleanUrl)) {
        showStatusMessage("Please enter a valid domain name", true);
        return;
    }

    browser.storage.local.get(['blockedSites'], function (result) {
        if (browser.runtime.lastError) {
            console.error("Error loading blocked sites:", browser.runtime.lastError);
            showStatusMessage("Failed to update settings", true);
            return;
        }

        const blockedSites = result.blockedSites || [];

        if (blockedSites.includes(cleanUrl)) {
            showStatusMessage("This website is already blocked");
            document.getElementById('website-input').value = '';
            return;
        }

        blockedSites.push(cleanUrl);

        browser.storage.local.set({ blockedSites }, function () {
            if (browser.runtime.lastError) {
                console.error("Error saving blocked sites:", browser.runtime.lastError);
                showStatusMessage("Failed to save changes", true);
                return;
            }

            document.getElementById('website-input').value = '';
            updateBlockedList();
            showStatusMessage(`${cleanUrl} has been blocked`);

            if (isAndroid) {
                document.getElementById('website-input').blur();
            }
        });
    });
}

// Remove blocked site
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

        browser.storage.local.set({ blockedSites }, function () {
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

// Existing popup controls
document.addEventListener('DOMContentLoaded', function () {
    updateBlockedList();

    document.getElementById('add-website').addEventListener(
        'click',
        addBlockedSite
    );

    document.getElementById('website-input').addEventListener(
        'keypress',
        function (event) {
            if (event.key === 'Enter') {
                addBlockedSite();
            }
        }
    );

    document.querySelectorAll('.predefined-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', togglePredefinedSite);
    });

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.querySelectorAll('.predefined-checkbox').forEach(checkbox => {
            const label = document.querySelector(
                `label[for="${checkbox.id}"]`
            );

            if (label) {
                label.addEventListener('touchstart', function (e) {
                    e.preventDefault();
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                });
            }
        });

        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('touchstart', function () {
                this.classList.add('touch-active');
            });

            button.addEventListener('touchend', function () {
                this.classList.remove('touch-active');
            });
        });
    }
});

// Productivity dashboard
// Only the background script writes focusStats.
let dashboardSession = null;
let dashboardTimer = null;
let dashboardRevision = 0;

function renderFocusStats(stats = {}) {
    const count = Number.isSafeInteger(stats.blockedAttempts) &&
        stats.blockedAttempts >= 0
        ? stats.blockedAttempts
        : 0;

    const seconds = Number.isSafeInteger(stats.timeSavedSeconds) &&
        stats.timeSavedSeconds >= 0
        ? stats.timeSavedSeconds
        : 0;

    document.getElementById('blocked-attempts').textContent =
        count.toLocaleString();

    const minutes = Math.floor(seconds / 60);

    document.getElementById('time-saved').textContent = minutes >= 60
        ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
        : `${minutes} min`;
}

function renderFocusSession() {
    const session = dashboardSession;

    const valid = session &&
        Number.isFinite(session.startedAt) &&
        Number.isFinite(session.durationMs) &&
        session.durationMs > 0;

    const elapsed = valid
        ? Math.max(0, Date.now() - session.startedAt)
        : 0;

    const remaining = valid
        ? Math.max(0, session.durationMs - elapsed)
        : 0;

    const active = valid && !session.endedAt && remaining > 0;
    const ended = valid && Number.isFinite(session.endedAt);

    const shownElapsed = ended
        ? Math.max(0, session.endedAt - session.startedAt)
        : elapsed;

    const progress = valid
        ? Math.min(100, shownElapsed / session.durationMs * 100)
        : 0;

    const progressEl = document.getElementById('session-progress');
    progressEl.value = progress;
    progressEl.textContent = `${Math.floor(progress)}%`;

    document.getElementById('session-status').textContent = active
        ? 'Focus in progress'
        : ended
            ? 'Session ended'
            : valid
                ? 'Session complete!'
                : 'Ready to focus';

    const seconds = Math.ceil(remaining / 1000);

    document.getElementById('session-remaining').textContent = active
        ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} remaining · ${Math.floor(progress)}%`
        : valid
            ? `${Math.floor(progress)}% of session completed`
            : 'Choose a duration and start your session.';

    document.getElementById('start-session').hidden = active;
    document.getElementById('end-session').hidden = !active;
    document.getElementById('session-duration').disabled = active;

    if (active) {
        document.getElementById('session-duration').value =
            Math.round(session.durationMs / 60000);
    }
}

async function saveFocusSession(endSession = false) {
    const startButton = document.getElementById('start-session');
    const endButton = document.getElementById('end-session');

    const minutes = Number(
        document.getElementById('session-duration').value
    );

    if (
        !endSession &&
        (!Number.isInteger(minutes) || minutes < 1 || minutes > 180)
    ) {
        showStatusMessage(
            'Choose a whole number from 1 to 180 minutes.',
            true
        );
        return;
    }

    startButton.disabled = true;
    endButton.disabled = true;

    try {
        const focusSession = endSession
            ? {
                ...dashboardSession,
                endedAt: Date.now()
            }
            : {
                startedAt: Date.now(),
                durationMs: minutes * 60000
            };

        await browser.storage.local.set({ focusSession });

        dashboardSession = focusSession;
        renderFocusSession();
    } catch (error) {
        console.error('Failed to save focus session:', error);
        showStatusMessage(
            'Could not save your focus session. Please try again.',
            true
        );
    } finally {
        startButton.disabled = false;
        endButton.disabled = false;
    }
}

function onDashboardStorageChanged(changes, areaName) {
    if (areaName !== 'local') return;

    dashboardRevision++;

    if (changes.focusStats) {
        renderFocusStats(changes.focusStats.newValue || {});
    }

    if (changes.focusSession) {
        dashboardSession = changes.focusSession.newValue || null;
        renderFocusSession();
    }

    if (changes.blockedSites) {
        updateBlockedList();
    }
}

async function initializeDashboard() {
    const startButton = document.getElementById('start-session');
    startButton.disabled = true;

    browser.storage.onChanged.addListener(onDashboardStorageChanged);

    startButton.addEventListener('click', () => saveFocusSession());

    document.getElementById('end-session').addEventListener(
        'click',
        () => saveFocusSession(true)
    );

    try {
        // Retry if a storage event overtakes the initial read.
        let revision;
        let saved;

        do {
            revision = dashboardRevision;
            saved = await browser.storage.local.get([
                'focusStats',
                'focusSession'
            ]);
        } while (revision !== dashboardRevision);

        renderFocusStats(saved.focusStats || {});
        dashboardSession = saved.focusSession || null;
        renderFocusSession();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showStatusMessage(
            'Could not load productivity statistics.',
            true
        );
    } finally {
        startButton.disabled = false;
    }

    // Timestamp-based progress continues while the popup is closed.
    dashboardTimer = setInterval(renderFocusSession, 1000);
}

document.addEventListener('DOMContentLoaded', initializeDashboard);

window.addEventListener('unload', () => {
    clearInterval(dashboardTimer);
    browser.storage.onChanged.removeListener(onDashboardStorageChanged);
});