// Initialize predefined sites and display them with checkboxes
const predefinedSites = [
    { name: 'Reddit', url: 'reddit.com' },
    { name: 'Snapchat', url: 'snapchat.com' },
    { name: 'Facebook', url: 'facebook.com' },
    { name: 'Instagram', url: 'instagram.com' },
    { name: 'Twitter (X)', url: 'x.com' },
    { name: 'YouTube', url: 'youtube.com' },
    { name: 'TikTok', url: 'tiktok.com' },
];

// Load blocked sites and elapsed time from storage
function updateBlockedList() {
    chrome.storage.local.get(['blockedSites', 'elapsedTime'], function (result) {
        const blockedSites = result.blockedSites || [];
        const elapsedTime = result.elapsedTime || 0;  // Time in seconds

        const listElement = document.getElementById('blocked-list');
        listElement.innerHTML = ''; // Clear current list

        // Populate blocked list with user-added sites
        blockedSites.forEach((site, index) => {
            const li = document.createElement('li');
            li.textContent = `${site.url} - Times blocked: ${site.count}`;
            const removeButton = document.createElement('button');
            removeButton.textContent = "Unblock";
            removeButton.onclick = function () {
                removeBlockedSite(index);
            };
            li.appendChild(removeButton);
            listElement.appendChild(li);
        });

        // Update predefined list checkboxes based on blockedSites
        document.querySelectorAll('.predefined-checkbox').forEach(checkbox => {
            const siteUrl = checkbox.getAttribute('data-url');
            checkbox.checked = blockedSites.some(site => site.url === siteUrl);
        });

        // Update elapsed time display
        document.getElementById('elapsed-time').textContent = formatTime(elapsedTime);
    });
}

// Format elapsed time into a readable string (HH:MM:SS)
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
}

// Add leading zero for single-digit hours, minutes, or seconds
function padZero(num) {
    return num < 10 ? '0' + num : num;
}

// Add or remove predefined site based on checkbox state
function togglePredefinedSite(event) {
    const siteUrl = event.target.getAttribute('data-url');

    chrome.storage.local.get(['blockedSites'], function (result) {
        const blockedSites = result.blockedSites || [];
        const siteIndex = blockedSites.findIndex(site => site.url === siteUrl);

        if (event.target.checked) {
            // If site is not already blocked, add it
            if (siteIndex === -1) {
                blockedSites.push({ url: siteUrl, count: 0 });
            }
        } else {
            // If site is checked and then unchecked, remove it
            if (siteIndex !== -1) {
                blockedSites.splice(siteIndex, 1);
            }
        }

        chrome.storage.local.set({ blockedSites: blockedSites }, updateBlockedList);
    });
}

// Add custom site from user input
function addBlockedSite() {
    const websiteInput = document.getElementById('website-input').value.trim();
    const cleanUrl = websiteInput.replace(/^https?:\/\//, '').replace(/^www\./, '');

    if (cleanUrl) {
        chrome.storage.local.get(['blockedSites'], function (result) {
            const blockedSites = result.blockedSites || [];
            const siteIndex = blockedSites.findIndex(site => site.url === cleanUrl);

            if (siteIndex === -1) {
                blockedSites.push({ url: cleanUrl, count: 0 });
                chrome.storage.local.set({ blockedSites: blockedSites }, updateBlockedList);
            }
            document.getElementById('website-input').value = '';
        });
    }
}

// Remove site from blocked list
function removeBlockedSite(index) {
    chrome.storage.local.get(['blockedSites'], function (result) {
        const blockedSites = result.blockedSites || [];
        blockedSites.splice(index, 1);
        chrome.storage.local.set({ blockedSites: blockedSites }, updateBlockedList);
    });
}

// Event listeners
document.getElementById('add-website').addEventListener('click', addBlockedSite);
document.querySelectorAll('.predefined-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', togglePredefinedSite);
});
window.onload = updateBlockedList;
