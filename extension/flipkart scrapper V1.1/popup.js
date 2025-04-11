document.addEventListener("DOMContentLoaded", function() {
    const scrapeBtn = document.getElementById("scrape");
    if (scrapeBtn) {
        scrapeBtn.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.scripting && chrome.scripting.executeScript) {
                    // For Manifest V3
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        files: ['content.js']
                    });
                } else if (chrome.tabs && chrome.tabs.executeScript) {
                    // Fallback for Manifest V2
                    chrome.tabs.executeScript(tabs[0].id, { file: 'content.js' });
                } else {
                    console.error("No API available to execute script.");
                }
            });
        });
    } else {
        console.error("scrapeBtn not found in the DOM!");
    }
});
