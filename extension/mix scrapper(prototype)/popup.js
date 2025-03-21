document.addEventListener("DOMContentLoaded", () => {
    const scrapeImagesBtn = document.getElementById("scrapeImages");
    const scrapeReviewsBtn = document.getElementById("scrapeReviews");
    const downloadDataBtn = document.getElementById("downloadData");
  
    scrapeImagesBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["content_images.js"]
        }, () => {
          console.log("Images script executed");
        });
      });
    });
  
    scrapeReviewsBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["content_reviews.js"]
        }, () => {
          console.log("Reviews script executed");
        });
      });
    });
  
    downloadDataBtn.addEventListener("click", () => {
      chrome.storage.local.get(["imagesData", "reviewsData"], (result) => {
        const combinedData = {
          images: result.imagesData || {},
          reviews: result.reviewsData || {}
        };
        const jsonBlob = new Blob([JSON.stringify(combinedData, null, 4)], { type: "application/json" });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const a = document.createElement("a");
        a.href = jsonUrl;
        a.download = "scraped_data.json";
        a.click();
        URL.revokeObjectURL(jsonUrl);
      });
    });
  });
  