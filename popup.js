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

// Load blocked sites and update checkboxes based on saved state
function updateBlockedList() {
    chrome.storage.local.get(['blockedSites'], function (result) {
        const blockedSites = result.blockedSites || [];
        const listElement = document.getElementById('blocked-list');
        listElement.innerHTML = ''; // Clear current list

        // Populate blocked list with user-added sites
        blockedSites.forEach((site, index) => {
            const li = document.createElement('li');
            li.textContent = site;
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
            checkbox.checked = blockedSites.includes(siteUrl);
        });
    });
}

// Add or remove predefined site based on checkbox state
function togglePredefinedSite(event) {
    const siteUrl = event.target.getAttribute('data-url');

    chrome.storage.local.get(['blockedSites'], function (result) {
        const blockedSites = result.blockedSites || [];
        const siteIndex = blockedSites.indexOf(siteUrl);

        if (event.target.checked) {
            if (siteIndex === -1) blockedSites.push(siteUrl);
        } else {
            if (siteIndex !== -1) blockedSites.splice(siteIndex, 1);
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
            if (!blockedSites.includes(cleanUrl)) {
                blockedSites.push(cleanUrl);
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
