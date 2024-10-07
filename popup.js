// Fetch the current blocked websites from Chrome storage and display them
function updateBlockedList() {
    chrome.storage.local.get(['blockedSites'], function (result) {
        const blockedSites = result.blockedSites || [];
        const listElement = document.getElementById('blocked-list');
        listElement.innerHTML = ''; // Clear current list

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
    });
}

// Add a website to the blocked list
function addBlockedSite() {
    const websiteInput = document.getElementById('website-input').value.trim();

    // Strip protocol if the user enters a full URL
    const cleanUrl = websiteInput.replace(/^https?:\/\//, '').replace(/^www\./, '');

    if (cleanUrl) {
        chrome.storage.local.get(['blockedSites'], function (result) {
            const blockedSites = result.blockedSites || [];
            blockedSites.push(cleanUrl);
            chrome.storage.local.set({ blockedSites: blockedSites }, function () {
                document.getElementById('website-input').value = '';
                updateBlockedList();
            });
        });
    }
}


// Remove a website from the blocked list
function removeBlockedSite(index) {
    chrome.storage.local.get(['blockedSites'], function (result) {
        const blockedSites = result.blockedSites || [];
        blockedSites.splice(index, 1);
        chrome.storage.local.set({ blockedSites: blockedSites }, function () {
            updateBlockedList();
        });
    });
}

document.getElementById('add-website').addEventListener('click', addBlockedSite);
window.onload = updateBlockedList;
