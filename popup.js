document.addEventListener('DOMContentLoaded', function () {
    const unblockButton = document.getElementById('unblockButton');
    unblockButton.addEventListener('click', unblockSite);
  });
  
  function unblockSite() {
    const siteToUnblock = document.getElementById("unblockSite").value.trim().toLowerCase();
  
    if (siteToUnblock === "") {
      alert("Please enter a site to unblock.");
      return;
    }
  
    chrome.storage.sync.get("blockedSites", (data) => {
      const blockedSites = data.blockedSites || []; // Ensure blockedSites is defined
  
      const index = blockedSites.indexOf(siteToUnblock);
  
      if (index !== -1) {
        blockedSites.splice(index, 1);
        chrome.storage.sync.set({ blockedSites }, () => {
          alert(`${siteToUnblock} unblocked successfully.`);
        });
      } else {
        alert(`${siteToUnblock} is not currently blocked.`);
      }
    });
  }
  