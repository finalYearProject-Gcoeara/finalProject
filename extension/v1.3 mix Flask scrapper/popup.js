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

// document.addEventListener("DOMContentLoaded", () => {
//   const scrapeImagesBtn = document.getElementById("scrapeImages");
//   const scrapeReviewsBtn = document.getElementById("scrapeReviews");
//   const downloadDataBtn = document.getElementById("downloadData");

//   // Execute the content script for images.
//   scrapeImagesBtn.addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       chrome.scripting.executeScript({
//         target: { tabId: tabs[0].id },
//         files: ["content_images.js"]
//       }, () => {
//         console.log("Images script executed");
//       });
//     });
//   });

//   // Execute the content script for reviews.
//   scrapeReviewsBtn.addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       chrome.scripting.executeScript({
//         target: { tabId: tabs[0].id },
//         files: ["content_reviews.js"]
//       }, () => {
//         console.log("Reviews script executed");
//       });
//     });
//   });

//   // Helper function to sanitize and truncate product name for filename.
//   function sanitizeFilename(name) {
//     return name.replace(/[^a-z0-9]/gi, '_').substring(0, 20) || "product";
//   }

//   // Download combined data (images and reviews) as a JSON file.
//   downloadDataBtn.addEventListener("click", () => {
//     chrome.storage.local.get(["imagesData", "reviewsData"], (result) => {
//       console.log("Retrieved data from storage:", result);

//       const combinedData = {
//         images: result.imagesData || {},
//         reviews: result.reviewsData || {}
//       };

//       // Check if imagesData has a valid product name.
//       let baseFilename = "scraped_data";
//       if (result.imagesData && result.imagesData.product_name && result.imagesData.product_name !== "N/A") {
//         baseFilename = sanitizeFilename(result.imagesData.product_name);
//       } else {
//         console.warn("Valid product name not found. Using default filename.");
//       }

//       const jsonBlob = new Blob([JSON.stringify(combinedData, null, 4)], { type: "application/json" });
//       const jsonUrl = URL.createObjectURL(jsonBlob);
//       const a = document.createElement("a");
//       a.href = jsonUrl;
//       a.download = `${baseFilename}.json`;
//       a.click();
//       URL.revokeObjectURL(jsonUrl);
//     });
//   });
// // });
// document.addEventListener("DOMContentLoaded", () => {
//   const scrapeImagesBtn = document.getElementById("scrapeImages");
//   const scrapeReviewsBtn = document.getElementById("scrapeReviews");
//   const downloadDataBtn = document.getElementById("downloadData");

//   // Execute the content script for images.
//   scrapeImagesBtn.addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       chrome.scripting.executeScript({
//         target: { tabId: tabs[0].id },
//         files: ["content_images.js"]
//       }, () => {
//         console.log("Images script executed");
//       });
//     });
//   });

//   // Execute the content script for reviews.
//   scrapeReviewsBtn.addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       chrome.scripting.executeScript({
//         target: { tabId: tabs[0].id },
//         files: ["content_reviews.js"]
//       }, () => {
//         console.log("Reviews script executed");
//       });
//     });
//   });

//   // Download combined data (images and reviews) as a JSON file.
//   downloadDataBtn.addEventListener("click", () => {
//     chrome.storage.local.get(["imagesData", "reviewsData"], (result) => {
//       console.log("Retrieved data from storage:", result);

//       const combinedData = {
//         images: result.imagesData || {},
//         reviews: result.reviewsData || {}
//       };

//       // Use the product name from imagesData to generate the filename.
//       // This snippet sanitizes and truncates the name to 20 characters.
//       let filename = (result.imagesData && result.imagesData.product_name)
//                        ? result.imagesData.product_name.replace(/[^a-z0-9]/gi, '_').substring(0, 20)
//                        : 'product';
//       filename += '.json';

//       const jsonBlob = new Blob([JSON.stringify(combinedData, null, 4)], { type: "application/json" });
//       const jsonUrl = URL.createObjectURL(jsonBlob);
//       const a = document.createElement("a");
//       a.href = jsonUrl;
//       a.download = filename;
//       a.click();
//       URL.revokeObjectURL(jsonUrl);

//       console.log(`Data saved to file: ${filename}`);
//     });
//   });
// });
// document.addEventListener("DOMContentLoaded", () => {
//   const scrapeImagesBtn = document.getElementById("scrapeImages");
//   const scrapeReviewsBtn = document.getElementById("scrapeReviews");
//   const downloadDataBtn = document.getElementById("downloadData");

//   // Execute the content script for images.
//   scrapeImagesBtn.addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       chrome.scripting.executeScript({
//         target: { tabId: tabs[0].id },
//         files: ["content_images.js"]
//       }, () => {
//         console.log("Images script executed");
//       });
//     });
//   });

//   // Execute the content script for reviews.
//   scrapeReviewsBtn.addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       chrome.scripting.executeScript({
//         target: { tabId: tabs[0].id },
//         files: ["content_reviews.js"]
//       }, () => {
//         console.log("Reviews script executed");
//       });
//     });
//   });

//   // Download combined data using the product name retrieved from the active tab.
//   downloadDataBtn.addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       // Execute a small script in the active tab to extract the product name.
//       chrome.scripting.executeScript({
//         target: { tabId: tabs[0].id },
//         function: () => {
//           // Try to get product name from <span class="VU-ZEz">, fallback to <a class="wjcEIp.AbG6iz">
//           const productNameElem = document.querySelector("span.VU-ZEz") ||
//                                   document.querySelector("a.wjcEIp.AbG6iz");
//           return productNameElem ? productNameElem.innerText.trim() : "N_A";
//         }
//       }, (injectionResults) => {
//         // Retrieve the product name from the injection results.
//         let productName = injectionResults[0].result;
//         // Sanitize and truncate the product name to use as a filename.
//         const sanitizedName = productName.replace(/[^a-z0-9]/gi, '_').substring(0, 20) || "product";
//         const filename = `${sanitizedName}.json`;

//         // Retrieve the stored imagesData and reviewsData from chrome.storage.local.
//         chrome.storage.local.get(["imagesData", "reviewsData"], (result) => {
//           console.log("Retrieved data from storage:", result);

//           const combinedData = {
//             images: result.imagesData || {},
//             reviews: result.reviewsData || {}
//           };

//           // Create a JSON blob and trigger the download using the filename based on the product name.
//           const jsonBlob = new Blob([JSON.stringify(combinedData, null, 4)], { type: "application/json" });
//           const jsonUrl = URL.createObjectURL(jsonBlob);
//           const a = document.createElement("a");
//           a.href = jsonUrl;
//           a.download = filename;
//           a.click();
//           URL.revokeObjectURL(jsonUrl);

//           console.log(`Data saved to file: ${filename}`);
//         });
//       });
//     });
//   });
// });

