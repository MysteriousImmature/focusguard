const blockedSites = ["facebook.com", "twitter.com", "instagram.com", "linkedin.com"];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ blockedSites });
});

chrome.webNavigation.onBeforeNavigate.addListener(details => {
  const { url, tabId } = details;
  if (shouldBlockSite(url)) {
    chrome.tabs.update(tabId, { url: chrome.extension.getURL("blocked.html") });
  }
});

function shouldBlockSite(url) {
  return blockedSites.some(site => url.includes(site));
}
