
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "downloadJson") {
    const blob = new Blob([JSON.stringify(message.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: "flipkart_product.json",
      saveAs: true
    });
  }
});
