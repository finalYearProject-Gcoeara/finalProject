chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SCRAPING_DONE") {
      // Display a notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png", // Ensure this icon exists in your extension directory
        title: "Scraping Complete",
        message: "Image data has been successfully scraped and saved.",
        priority: 2
      });
    }
  });
  