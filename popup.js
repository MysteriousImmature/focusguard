// Load blocked sites, attempts, and time saved from storage
function updateBlockedList() {
    chrome.storage.local.get(['blockedSites', 'blockedAttempts', 'elapsedTime'], function (result) {
        const blockedSites = result.blockedSites || [];
        const blockedAttempts = result.blockedAttempts || 0;
        const elapsedTime = result.elapsedTime || 0;

        // Update blocked sites list
        const listElement = document.getElementById('blocked-list');
        listElement.innerHTML = '';  // Clear current list
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

        // Dynamically update blocked attempts and time saved
        document.getElementById('blocked-attempts').textContent = `Blocked Attempts: ${blockedAttempts}`;
        document.getElementById('time-saved').textContent = `Time Saved: ${Math.round(elapsedTime)} seconds`;
    });
}

// Event listeners for adding/removing blocked sites, etc.
window.onload = updateBlockedList;
