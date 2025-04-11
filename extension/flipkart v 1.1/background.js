// Keep service worker alive
let keepAlive = setInterval(chrome.runtime.getPlatformInfo, 20 * 1000);

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE_DATA") {
    // Forward data to popup or storage
    chrome.runtime.sendMessage({ type: "DATA_READY", data: message.data });
  }
});