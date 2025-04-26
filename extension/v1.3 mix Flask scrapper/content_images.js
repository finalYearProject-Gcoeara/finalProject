// // // // // // // // // // // // // // (function() {
// // // // // // // // // // // // // //     // Extract images and specifications from the page.
// // // // // // // // // // // // // //     function extractProductImages() {
// // // // // // // // // // // // // //       // Try to get product name from <span class="VU-ZEz">, fallback to <a class="wjcEIp AbG6iz">
// // // // // // // // // // // // // //       const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
// // // // // // // // // // // // // //       const productName = productNameElem ? productNameElem.innerText.trim() : "N/A";
    
// // // // // // // // // // // // // //       const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // // // // // // // // // // // //       const mainImage = mainImageElement ? mainImageElement.src : "N/A";
    
// // // // // // // // // // // // // //       const thumbnailElements = document.querySelectorAll("img._0DkuPH");
// // // // // // // // // // // // // //       const thumbnailImages = Array.from(thumbnailElements).map(img => img.src);
    
// // // // // // // // // // // // // //       return {
// // // // // // // // // // // // // //         product_name: productName,
// // // // // // // // // // // // // //         main_image: mainImage,
// // // // // // // // // // // // // //         thumbnails: thumbnailImages
// // // // // // // // // // // // // //       };
// // // // // // // // // // // // // //     }
    
// // // // // // // // // // // // // //     function extractProductSpecifications() {
// // // // // // // // // // // // // //       // Select the specification container using the classes provided in your reference.
// // // // // // // // // // // // // //       const specContainer = document.querySelector("div._1OjC5I.pKBIUH");
// // // // // // // // // // // // // //       let specifications = {};
    
// // // // // // // // // // // // // //       if (specContainer) {
// // // // // // // // // // // // // //         const specSections = specContainer.querySelectorAll("div.GNDEQ-");
// // // // // // // // // // // // // //         specSections.forEach(section => {
// // // // // // // // // // // // // //           try {
// // // // // // // // // // // // // //             // Attempt to get the section title; use adjacent sibling of element with class _4BJ2V.
// // // // // // // // // // // // // //             let sectionTitle = "Untitled Section";
// // // // // // // // // // // // // //             const sectionTitleElem = section.querySelector("div._4BJ2V + *");
// // // // // // // // // // // // // //             if (sectionTitleElem && sectionTitleElem.textContent) {
// // // // // // // // // // // // // //               sectionTitle = sectionTitleElem.textContent.trim();
// // // // // // // // // // // // // //             }
    
// // // // // // // // // // // // // //             const rows = section.querySelectorAll("tr.WJdYP6.row");
// // // // // // // // // // // // // //             let sectionData = {};
// // // // // // // // // // // // // //             rows.forEach(row => {
// // // // // // // // // // // // // //               const keyElem = row.querySelector("td.+fFi1w.col-3-12");
// // // // // // // // // // // // // //               const valueElem = row.querySelector("td.Izz52n.col-9-12 li.HPETK2");
// // // // // // // // // // // // // //               const key = keyElem ? keyElem.textContent.trim() : null;
// // // // // // // // // // // // // //               const value = valueElem ? valueElem.textContent.trim() : null;
// // // // // // // // // // // // // //               if (key && value) {
// // // // // // // // // // // // // //                 sectionData[key] = value;
// // // // // // // // // // // // // //               }
// // // // // // // // // // // // // //             });
// // // // // // // // // // // // // //             specifications[sectionTitle] = sectionData;
// // // // // // // // // // // // // //           } catch (e) {
// // // // // // // // // // // // // //             console.error("Error parsing specifications:", e);
// // // // // // // // // // // // // //           }
// // // // // // // // // // // // // //         });
// // // // // // // // // // // // // //       } else {
// // // // // // // // // // // // // //         console.log("Specification container not found.");
// // // // // // // // // // // // // //       }
// // // // // // // // // // // // // //       return specifications;
// // // // // // // // // // // // // //     }
    
// // // // // // // // // // // // // //     function scrapeImagesAndSpecs() {
// // // // // // // // // // // // // //       const imagesData = extractProductImages();
// // // // // // // // // // // // // //       const specsData = extractProductSpecifications();
// // // // // // // // // // // // // //       return {
// // // // // // // // // // // // // //         images: imagesData,
// // // // // // // // // // // // // //         specifications: specsData
// // // // // // // // // // // // // //       };
// // // // // // // // // // // // // //     }
    
// // // // // // // // // // // // // //     const data = scrapeImagesAndSpecs();
// // // // // // // // // // // // // //     console.log("Scraped images and specifications:", data);
    
// // // // // // // // // // // // // //     // Save the data to chrome.storage.local under the key "imagesData"
// // // // // // // // // // // // // //     chrome.storage.local.set({ imagesData: data }, () => {
// // // // // // // // // // // // // //       console.log("Images and specifications data saved to storage");
// // // // // // // // // // // // // //     });
// // // // // // // // // // // // // //   })();
// // // // // // // // // // // // // // (function() {
// // // // // // // // // // // // // //   // Helper: sanitize and truncate the product name for use as a file name.
// // // // // // // // // // // // // //   function sanitizeFilename(name) {
// // // // // // // // // // // // // //     // Replace non-alphanumeric characters with underscores and truncate to 20 characters.
// // // // // // // // // // // // // //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
// // // // // // // // // // // // // //   }

// // // // // // // // // // // // // //   // Extract images from the page.
// // // // // // // // // // // // // //   function extractProductImages() {
// // // // // // // // // // // // // //     // Try to get product name from <span class="VU-ZEz">, fallback to <a class="wjcEIp AbG6iz">
// // // // // // // // // // // // // //     const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
// // // // // // // // // // // // // //     const productName = productNameElem ? productNameElem.innerText.trim() : "N/A";

// // // // // // // // // // // // // //     const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // // // // // // // // // // // //     const mainImage = mainImageElement ? mainImageElement.src : "N/A";

// // // // // // // // // // // // // //     const thumbnailElements = document.querySelectorAll("img._0DkuPH");
// // // // // // // // // // // // // //     const thumbnailImages = Array.from(thumbnailElements).map(img => img.src);

// // // // // // // // // // // // // //     return {
// // // // // // // // // // // // // //       product_name: productName,
// // // // // // // // // // // // // //       main_image: mainImage,
// // // // // // // // // // // // // //       thumbnails: thumbnailImages
// // // // // // // // // // // // // //     };
// // // // // // // // // // // // // //   }

// // // // // // // // // // // // // //   // Extract specifications from the page.
// // // // // // // // // // // // // //   function extractProductSpecifications() {
// // // // // // // // // // // // // //     // Select the specification container using the provided classes.
// // // // // // // // // // // // // //     const specContainer = document.querySelector("div._1OjC5I.pKBIUH");
// // // // // // // // // // // // // //     let specifications = {};

// // // // // // // // // // // // // //     if (specContainer) {
// // // // // // // // // // // // // //       const specSections = specContainer.querySelectorAll("div.GNDEQ-");
// // // // // // // // // // // // // //       specSections.forEach(section => {
// // // // // // // // // // // // // //         try {
// // // // // // // // // // // // // //           // Attempt to get the section title; using an element adjacent to one with the class _4BJ2V.
// // // // // // // // // // // // // //           let sectionTitle = "Untitled Section";
// // // // // // // // // // // // // //           const sectionTitleElem = section.querySelector("div._4BJ2V + *");
// // // // // // // // // // // // // //           if (sectionTitleElem && sectionTitleElem.textContent) {
// // // // // // // // // // // // // //             sectionTitle = sectionTitleElem.textContent.trim();
// // // // // // // // // // // // // //           }

// // // // // // // // // // // // // //           const rows = section.querySelectorAll("tr.WJdYP6.row");
// // // // // // // // // // // // // //           let sectionData = {};
// // // // // // // // // // // // // //           rows.forEach(row => {
// // // // // // // // // // // // // //             const keyElem = row.querySelector("td.+fFi1w.col-3-12");
// // // // // // // // // // // // // //             const valueElem = row.querySelector("td.Izz52n.col-9-12 li.HPETK2");
// // // // // // // // // // // // // //             const key = keyElem ? keyElem.textContent.trim() : null;
// // // // // // // // // // // // // //             const value = valueElem ? valueElem.textContent.trim() : null;
// // // // // // // // // // // // // //             if (key && value) {
// // // // // // // // // // // // // //               sectionData[key] = value;
// // // // // // // // // // // // // //             }
// // // // // // // // // // // // // //           });
// // // // // // // // // // // // // //           specifications[sectionTitle] = sectionData;
// // // // // // // // // // // // // //         } catch (e) {
// // // // // // // // // // // // // //           console.error("Error parsing specifications:", e);
// // // // // // // // // // // // // //         }
// // // // // // // // // // // // // //       });
// // // // // // // // // // // // // //     } else {
// // // // // // // // // // // // // //       console.log("Specification container not found.");
// // // // // // // // // // // // // //     }
// // // // // // // // // // // // // //     return specifications;
// // // // // // // // // // // // // //   }

// // // // // // // // // // // // // //   // Combine the images and specifications.
// // // // // // // // // // // // // //   function scrapeImagesAndSpecs() {
// // // // // // // // // // // // // //     const imagesData = extractProductImages();
// // // // // // // // // // // // // //     const specsData = extractProductSpecifications();
// // // // // // // // // // // // // //     return {
// // // // // // // // // // // // // //       images: imagesData,
// // // // // // // // // // // // // //       specifications: specsData
// // // // // // // // // // // // // //     };
// // // // // // // // // // // // // //   }

// // // // // // // // // // // // // //   // Save the scraped data as a JSON file using a filename generated from the product name.
// // // // // // // // // // // // // //   function saveToFile(data) {
// // // // // // // // // // // // // //     // Use the product name from images data to name the file.
// // // // // // // // // // // // // //     const baseFilename = data.images && data.images.product_name
// // // // // // // // // // // // // //                          ? sanitizeFilename(data.images.product_name)
// // // // // // // // // // // // // //                          : "product";
// // // // // // // // // // // // // //     const filename = `${baseFilename}.json`;
    
// // // // // // // // // // // // // //     const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// // // // // // // // // // // // // //     const jsonUrl = URL.createObjectURL(jsonBlob);
// // // // // // // // // // // // // //     const downloadLink = document.createElement('a');
// // // // // // // // // // // // // //     downloadLink.href = jsonUrl;
// // // // // // // // // // // // // //     downloadLink.download = filename;
    
// // // // // // // // // // // // // //     // Trigger the download.
// // // // // // // // // // // // // //     document.body.appendChild(downloadLink);
// // // // // // // // // // // // // //     downloadLink.click();
// // // // // // // // // // // // // //     document.body.removeChild(downloadLink);
// // // // // // // // // // // // // //     URL.revokeObjectURL(jsonUrl);
    
// // // // // // // // // // // // // //     console.log(`Data saved to file: ${filename}`);
// // // // // // // // // // // // // //   }

// // // // // // // // // // // // // //   // Main scraping function.
// // // // // // // // // // // // // //   function runScrape() {
// // // // // // // // // // // // // //     const data = scrapeImagesAndSpecs();
// // // // // // // // // // // // // //     console.log("Scraped images and specifications:", data);
    
// // // // // // // // // // // // // //     // Optionally, save the data to chrome.storage.local if needed.
// // // // // // // // // // // // // //     if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
// // // // // // // // // // // // // //       chrome.storage.local.set({ imagesData: data }, () => {
// // // // // // // // // // // // // //         console.log("Images and specifications data saved to chrome.storage.local");
// // // // // // // // // // // // // //       });
// // // // // // // // // // // // // //     }
    
// // // // // // // // // // // // // //     // Save the data as a JSON file.
// // // // // // // // // // // // // //     saveToFile(data);
// // // // // // // // // // // // // //   }

// // // // // // // // // // // // // //   // Run the scraping script.
// // // // // // // // // // // // // //   runScrape();
// // // // // // // // // // // // // // })();
// // // // // // // // // // // // // // // document.addEventListener("DOMContentLoaded", () => {
// // // // // // // // // // // // // // //   // Create a button for triggering the scrape if it doesn't already exist.
// // // // // // // // // // // // // // //   let scrapeBtn = document.getElementById("scrapeData");
// // // // // // // // // // // // // // //   if (!scrapeBtn) {
// // // // // // // // // // // // // // //     scrapeBtn = document.createElement("button");
// // // // // // // // // // // // // // //     scrapeBtn.id = "scrapeData";
// // // // // // // // // // // // // // //     scrapeBtn.innerText = "Scrape Data";
// // // // // // // // // // // // // // //     // Position the button in a fixed location on the page.
// // // // // // // // // // // // // // //     scrapeBtn.style.position = "fixed";
// // // // // // // // // // // // // // //     scrapeBtn.style.top = "10px";
// // // // // // // // // // // // // // //     scrapeBtn.style.right = "10px";
// // // // // // // // // // // // // // //     scrapeBtn.style.zIndex = "10000";
// // // // // // // // // // // // // // //     document.body.appendChild(scrapeBtn);
// // // // // // // // // // // // // // //   }

// // // // // // // // // // // // // // //   // When the button is clicked, execute the scraping and save the data.
// // // // // // // // // // // // // // //   scrapeBtn.addEventListener("click", () => {
// // // // // // // // // // // // // // //     // Extract images from the page.
// // // // // // // // // // // // // // //     function extractProductImages() {
// // // // // // // // // // // // // // //       // Try to get product name from <span class="VU-ZEz">, fallback to <a class="wjcEIp AbG6iz">
// // // // // // // // // // // // // // //       const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
// // // // // // // // // // // // // // //       const productName = productNameElem ? productNameElem.innerText.trim() : "N/A";

// // // // // // // // // // // // // // //       const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // // // // // // // // // // // // //       const mainImage = mainImageElement ? mainImageElement.src : "N/A";

// // // // // // // // // // // // // // //       const thumbnailElements = document.querySelectorAll("img._0DkuPH");
// // // // // // // // // // // // // // //       const thumbnailImages = Array.from(thumbnailElements).map(img => img.src);

// // // // // // // // // // // // // // //       return {
// // // // // // // // // // // // // // //         product_name: productName,
// // // // // // // // // // // // // // //         main_image: mainImage,
// // // // // // // // // // // // // // //         thumbnails: thumbnailImages
// // // // // // // // // // // // // // //       };
// // // // // // // // // // // // // // //     }

// // // // // // // // // // // // // // //     // Extract specifications from the page.
// // // // // // // // // // // // // // //     function extractProductSpecifications() {
// // // // // // // // // // // // // // //       // Select the specification container using the provided classes.
// // // // // // // // // // // // // // //       const specContainer = document.querySelector("div._1OjC5I.pKBIUH");
// // // // // // // // // // // // // // //       let specifications = {};

// // // // // // // // // // // // // // //       if (specContainer) {
// // // // // // // // // // // // // // //         const specSections = specContainer.querySelectorAll("div.GNDEQ-");
// // // // // // // // // // // // // // //         specSections.forEach(section => {
// // // // // // // // // // // // // // //           try {
// // // // // // // // // // // // // // //             // Attempt to get the section title; use the element adjacent to one with class _4BJ2V.
// // // // // // // // // // // // // // //             let sectionTitle = "Untitled Section";
// // // // // // // // // // // // // // //             const sectionTitleElem = section.querySelector("div._4BJ2V + *");
// // // // // // // // // // // // // // //             if (sectionTitleElem && sectionTitleElem.textContent) {
// // // // // // // // // // // // // // //               sectionTitle = sectionTitleElem.textContent.trim();
// // // // // // // // // // // // // // //             }

// // // // // // // // // // // // // // //             const rows = section.querySelectorAll("tr.WJdYP6.row");
// // // // // // // // // // // // // // //             let sectionData = {};
// // // // // // // // // // // // // // //             rows.forEach(row => {
// // // // // // // // // // // // // // //               const keyElem = row.querySelector("td.+fFi1w.col-3-12");
// // // // // // // // // // // // // // //               const valueElem = row.querySelector("td.Izz52n.col-9-12 li.HPETK2");
// // // // // // // // // // // // // // //               const key = keyElem ? keyElem.textContent.trim() : null;
// // // // // // // // // // // // // // //               const value = valueElem ? valueElem.textContent.trim() : null;
// // // // // // // // // // // // // // //               if (key && value) {
// // // // // // // // // // // // // // //                 sectionData[key] = value;
// // // // // // // // // // // // // // //               }
// // // // // // // // // // // // // // //             });
// // // // // // // // // // // // // // //             specifications[sectionTitle] = sectionData;
// // // // // // // // // // // // // // //           } catch (e) {
// // // // // // // // // // // // // // //             console.error("Error parsing specifications:", e);
// // // // // // // // // // // // // // //           }
// // // // // // // // // // // // // // //         });
// // // // // // // // // // // // // // //       } else {
// // // // // // // // // // // // // // //         console.log("Specification container not found.");
// // // // // // // // // // // // // // //       }
// // // // // // // // // // // // // // //       return specifications;
// // // // // // // // // // // // // // //     }

// // // // // // // // // // // // // // //     // Combine both images and specifications into one data object.
// // // // // // // // // // // // // // //     function scrapeImagesAndSpecs() {
// // // // // // // // // // // // // // //       const imagesData = extractProductImages();
// // // // // // // // // // // // // // //       const specsData = extractProductSpecifications();
// // // // // // // // // // // // // // //       return {
// // // // // // // // // // // // // // //         images: imagesData,
// // // // // // // // // // // // // // //         specifications: specsData
// // // // // // // // // // // // // // //       };
// // // // // // // // // // // // // // //     }

// // // // // // // // // // // // // // //     const data = scrapeImagesAndSpecs();
// // // // // // // // // // // // // // //     console.log("Scraped images and specifications:", data);

// // // // // // // // // // // // // // //     // Save the data to chrome.storage.local under the key "imagesData"
// // // // // // // // // // // // // // //     chrome.storage.local.set({ imagesData: data }, () => {
// // // // // // // // // // // // // // //       console.log("Images and specifications data saved to chrome.storage.local");
// // // // // // // // // // // // // // //     });
// // // // // // // // // // // // // // //   });
// // // // // // // // // // // // // // // });

// // // // // // // // // // // // // (async function extractFlipkartImages() {
// // // // // // // // // // // // //   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// // // // // // // // // // // // //   const imageUrls = [];

// // // // // // // // // // // // //   // Select all thumbnail images
// // // // // // // // // // // // //   const thumbnails = document.querySelectorAll('img._0DkuPH');

// // // // // // // // // // // // //   for (let i = 0; i < thumbnails.length; i++) {
// // // // // // // // // // // // //     const thumbnail = thumbnails[i];

// // // // // // // // // // // // //     // Scroll the thumbnail into view
// // // // // // // // // // // // //     thumbnail.scrollIntoView({ behavior: 'smooth', block: 'center' });

// // // // // // // // // // // // //     // Create and dispatch a mouseover event to simulate hover
// // // // // // // // // // // // //     const mouseOverEvent = new MouseEvent('mouseover', {
// // // // // // // // // // // // //       bubbles: true,
// // // // // // // // // // // // //       cancelable: true,
// // // // // // // // // // // // //       view: window,
// // // // // // // // // // // // //     });
// // // // // // // // // // // // //     thumbnail.dispatchEvent(mouseOverEvent);

// // // // // // // // // // // // //     // Wait briefly to allow the main image to update
// // // // // // // // // // // // //     await delay(500);

// // // // // // // // // // // // //     // Select the main image container
// // // // // // // // // // // // //     const mainImageContainer = document.querySelector('div.HXf4Qp.SibU2y');

// // // // // // // // // // // // //     if (mainImageContainer) {
// // // // // // // // // // // // //       const mainImage = mainImageContainer.querySelector('img');

// // // // // // // // // // // // //       if (mainImage && mainImage.src) {
// // // // // // // // // // // // //         imageUrls.push(mainImage.src);
// // // // // // // // // // // // //         console.log(`Image ${i + 1}: ${mainImage.src}`);
// // // // // // // // // // // // //       } else {
// // // // // // // // // // // // //         console.warn(`Main image not found for thumbnail ${i + 1}`);
// // // // // // // // // // // // //       }
// // // // // // // // // // // // //     } else {
// // // // // // // // // // // // //       console.warn(`Main image container not found for thumbnail ${i + 1}`);
// // // // // // // // // // // // //     }

// // // // // // // // // // // // //     // Optional: Wait before moving to the next thumbnail
// // // // // // // // // // // // //     await delay(300);
// // // // // // // // // // // // //   }

// // // // // // // // // // // // //   console.log('Extracted Image URLs:', imageUrls);
// // // // // // // // // // // // // })();
// // // // // // // // // // // // (async function extractFlipkartImagesWithClass() {
// // // // // // // // // // // //   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// // // // // // // // // // // //   const imageData = [];

// // // // // // // // // // // //   // Select all thumbnail images
// // // // // // // // // // // //   const thumbnails = document.querySelectorAll('img._0DkuPH');

// // // // // // // // // // // //   for (let i = 0; i < thumbnails.length; i++) {
// // // // // // // // // // // //     const thumbnail = thumbnails[i];

// // // // // // // // // // // //     // Scroll the thumbnail into view
// // // // // // // // // // // //     thumbnail.scrollIntoView({ behavior: 'smooth', block: 'center' });

// // // // // // // // // // // //     // Create and dispatch a mouseover event to simulate hover
// // // // // // // // // // // //     const mouseOverEvent = new MouseEvent('mouseover', {
// // // // // // // // // // // //       bubbles: true,
// // // // // // // // // // // //       cancelable: true,
// // // // // // // // // // // //       view: window,
// // // // // // // // // // // //     });
// // // // // // // // // // // //     thumbnail.dispatchEvent(mouseOverEvent);

// // // // // // // // // // // //     // Wait briefly to allow the main image to update
// // // // // // // // // // // //     await delay(500);

// // // // // // // // // // // //     // Select the main image container
// // // // // // // // // // // //     const mainImageContainer = document.querySelector('div.HXf4Qp.SibU2y');

// // // // // // // // // // // //     if (mainImageContainer) {
// // // // // // // // // // // //       const mainImage = mainImageContainer.querySelector('img');

// // // // // // // // // // // //       if (mainImage && mainImage.src) {
// // // // // // // // // // // //         // Extract the class name from the main image
// // // // // // // // // // // //         const className = mainImage.className;
// // // // // // // // // // // //         imageData.push({ src: mainImage.src, className });
// // // // // // // // // // // //         console.log(`Image ${i + 1}: src = ${mainImage.src}, class = ${className}`);
// // // // // // // // // // // //       } else {
// // // // // // // // // // // //         console.warn(`Main image not found for thumbnail ${i + 1}`);
// // // // // // // // // // // //       }
// // // // // // // // // // // //     } else {
// // // // // // // // // // // //       console.warn(`Main image container not found for thumbnail ${i + 1}`);
// // // // // // // // // // // //     }

// // // // // // // // // // // //     // Optional: Wait before moving to the next thumbnail
// // // // // // // // // // // //     await delay(300);
// // // // // // // // // // // //   }

// // // // // // // // // // // //   console.log('Extracted Image Data:', imageData);
// // // // // // // // // // // // })();
// // // // // // // // // // // (async function extractFlipkartImagesWithClass() {
// // // // // // // // // // //   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// // // // // // // // // // //   const imageData = [];

// // // // // // // // // // //   // Select all thumbnail images
// // // // // // // // // // //   const thumbnails = document.querySelectorAll('img._0DkuPH');

// // // // // // // // // // //   for (let i = 0; i < thumbnails.length; i++) {
// // // // // // // // // // //     const thumbnail = thumbnails[i];

// // // // // // // // // // //     // Scroll the thumbnail into view
// // // // // // // // // // //     thumbnail.scrollIntoView({ behavior: 'smooth', block: 'center' });

// // // // // // // // // // //     // Create and dispatch a mouseover event to simulate hover
// // // // // // // // // // //     const mouseOverEvent = new MouseEvent('mouseover', {
// // // // // // // // // // //       bubbles: true,
// // // // // // // // // // //       cancelable: true,
// // // // // // // // // // //       view: window,
// // // // // // // // // // //     });
// // // // // // // // // // //     thumbnail.dispatchEvent(mouseOverEvent);

// // // // // // // // // // //     // Wait 2 seconds to allow the main image to update
// // // // // // // // // // //     await delay(2000);

// // // // // // // // // // //     // Select the main image container
// // // // // // // // // // //     const mainImageContainer = document.querySelector('div.HXf4Qp.SibU2y');

// // // // // // // // // // //     if (mainImageContainer) {
// // // // // // // // // // //       const mainImage = mainImageContainer.querySelector('img');

// // // // // // // // // // //       if (mainImage && mainImage.src) {
// // // // // // // // // // //         // Extract the class name from the main image
// // // // // // // // // // //         const className = mainImage.className;
// // // // // // // // // // //         imageData.push({ src: mainImage.src, className });
// // // // // // // // // // //         console.log(`Image ${i + 1}: src = ${mainImage.src}, class = ${className}`);
// // // // // // // // // // //       } else {
// // // // // // // // // // //         console.warn(`Main image not found for thumbnail ${i + 1}`);
// // // // // // // // // // //       }
// // // // // // // // // // //     } else {
// // // // // // // // // // //       console.warn(`Main image container not found for thumbnail ${i + 1}`);
// // // // // // // // // // //     }

// // // // // // // // // // //     // Wait 2 seconds before moving to the next thumbnail
// // // // // // // // // // //     await delay(2000);
// // // // // // // // // // //   }

// // // // // // // // // // //   console.log('Extracted Image Data:', imageData);
// // // // // // // // // // // })();
// // // // // // // // // // (async function extractFlipkartImagesWithClass() {
// // // // // // // // // //   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// // // // // // // // // //   const imageData = [];

// // // // // // // // // //   // Select all thumbnail images
// // // // // // // // // //   const thumbnails = document.querySelectorAll('img._0DkuPH');

// // // // // // // // // //   for (let i = 0; i < thumbnails.length; i++) {
// // // // // // // // // //     const thumbnail = thumbnails[i];

// // // // // // // // // //     // Scroll the thumbnail into view
// // // // // // // // // //     thumbnail.scrollIntoView({ behavior: 'smooth', block: 'center' });

// // // // // // // // // //     // Create and dispatch a mouseover event to simulate hover
// // // // // // // // // //     const mouseOverEvent = new MouseEvent('mouseover', {
// // // // // // // // // //       bubbles: true,
// // // // // // // // // //       cancelable: true,
// // // // // // // // // //       view: window,
// // // // // // // // // //     });
// // // // // // // // // //     thumbnail.dispatchEvent(mouseOverEvent);

// // // // // // // // // //     // Wait 2 seconds to allow the main image to update
// // // // // // // // // //     await delay(2000);

// // // // // // // // // //     // Select the main image container
// // // // // // // // // //     const mainImageContainer = document.querySelector('div.HXf4Qp.SibU2y');

// // // // // // // // // //     if (mainImageContainer) {
// // // // // // // // // //       const mainImage = mainImageContainer.querySelector('img');

// // // // // // // // // //       if (mainImage && mainImage.src) {
// // // // // // // // // //         // Extract the class name from the main image
// // // // // // // // // //         const className = mainImage.className;
// // // // // // // // // //         imageData.push({ src: mainImage.src, className });
// // // // // // // // // //         console.log(`Image ${i + 1}: src = ${mainImage.src}, class = ${className}`);
// // // // // // // // // //       } else {
// // // // // // // // // //         console.warn(`Main image not found for thumbnail ${i + 1}`);
// // // // // // // // // //       }
// // // // // // // // // //     } else {
// // // // // // // // // //       console.warn(`Main image container not found for thumbnail ${i + 1}`);
// // // // // // // // // //     }

// // // // // // // // // //     // Wait 2 seconds before moving to the next thumbnail
// // // // // // // // // //     await delay(2000);
// // // // // // // // // //   }


// // // // // // // // // //   console.log('Extracted Image Data:', imageData);
// // // // // // // // // // })();
// // // // // // // // // (async function extractImagesOnHover() {
// // // // // // // // //   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// // // // // // // // //   const imageData = [];

// // // // // // // // //   // Select all thumbnail images
// // // // // // // // //   const thumbnails = document.querySelectorAll('img._0DkuPH');

// // // // // // // // //   for (let i = 0; i < thumbnails.length; i++) {
// // // // // // // // //     const thumbnail = thumbnails[i];

// // // // // // // // //     // Scroll the thumbnail into view
// // // // // // // // //     thumbnail.scrollIntoView({ behavior: 'smooth', block: 'center' });

// // // // // // // // //     // Create and dispatch a mouseover event to simulate hover
// // // // // // // // //     const mouseOverEvent = new MouseEvent('mouseover', {
// // // // // // // // //       bubbles: true,
// // // // // // // // //       cancelable: true,
// // // // // // // // //       view: window,
// // // // // // // // //     });
// // // // // // // // //     thumbnail.dispatchEvent(mouseOverEvent);

// // // // // // // // //     // Wait 2 seconds to allow the main image to update
// // // // // // // // //     await delay(2000);

// // // // // // // // //     // Select the main image element
// // // // // // // // //     const mainImage = document.querySelector('img.DByuf4.IZexXJ.jLEJ7H');

// // // // // // // // //     if (mainImage && mainImage.src) {
// // // // // // // // //       // Extract the class name from the main image
// // // // // // // // //       const className = mainImage.className;
// // // // // // // // //       imageData.push({ src: mainImage.src, className });
// // // // // // // // //       console.log(`Image ${i + 1}: src = ${mainImage.src}, class = ${className}`);
// // // // // // // // //     } else {
// // // // // // // // //       console.warn(`Main image not found for thumbnail ${i + 1}`);
// // // // // // // // //     }

// // // // // // // // //     // Wait 2 seconds before moving to the next thumbnail
// // // // // // // // //     await delay(2000);
// // // // // // // // //   }

// // // // // // // // //   console.log('Extracted Image Data:', imageData);
// // // // // // // // // })();
// // // // // // // // (function() {
// // // // // // // //   // Helper: sanitize and truncate the product name for use as a file name.
// // // // // // // //   function sanitizeFilename(name) {
// // // // // // // //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
// // // // // // // //   }

// // // // // // // //   // Extract images from the page.
// // // // // // // //   function extractProductImages() {
// // // // // // // //     const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
// // // // // // // //     const productName = productNameElem ? productNameElem.innerText.trim() : "N/A";

// // // // // // // //     const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // // // // // //     const mainImage = mainImageElement ? mainImageElement.src : "N/A";

// // // // // // // //     const thumbnailElements = document.querySelectorAll("img._0DkuPH");
// // // // // // // //     const thumbnailImages = Array.from(thumbnailElements).map(img => img.src);

// // // // // // // //     return {
// // // // // // // //       product_name: productName,
// // // // // // // //       main_image: mainImage,
// // // // // // // //       thumbnails: thumbnailImages
// // // // // // // //     };
// // // // // // // //   }

// // // // // // // //   // Extract specifications from the page.
// // // // // // // //   function extractProductSpecifications() {
// // // // // // // //     const specContainer = document.querySelector("div._1OjC5I.pKBIUH");
// // // // // // // //     let specifications = {};

// // // // // // // //     if (specContainer) {
// // // // // // // //       const specSections = specContainer.querySelectorAll("div.GNDEQ-");
// // // // // // // //       specSections.forEach(section => {
// // // // // // // //         try {
// // // // // // // //           let sectionTitle = "Untitled Section";
// // // // // // // //           const sectionTitleElem = section.querySelector("div._4BJ2V + *");
// // // // // // // //           if (sectionTitleElem && sectionTitleElem.textContent) {
// // // // // // // //             sectionTitle = sectionTitleElem.textContent.trim();
// // // // // // // //           }

// // // // // // // //           const rows = section.querySelectorAll("tr.WJdYP6.row");
// // // // // // // //           let sectionData = {};
// // // // // // // //           rows.forEach(row => {
// // // // // // // //             const keyElem = row.querySelector("td.+fFi1w.col-3-12");
// // // // // // // //             const valueElem = row.querySelector("td.Izz52n.col-9-12 li.HPETK2");
// // // // // // // //             const key = keyElem ? keyElem.textContent.trim() : null;
// // // // // // // //             const value = valueElem ? valueElem.textContent.trim() : null;
// // // // // // // //             if (key && value) {
// // // // // // // //               sectionData[key] = value;
// // // // // // // //             }
// // // // // // // //           });
// // // // // // // //           specifications[sectionTitle] = sectionData;
// // // // // // // //         } catch (e) {
// // // // // // // //           console.error("Error parsing specifications:", e);
// // // // // // // //         }
// // // // // // // //       });
// // // // // // // //     } else {
// // // // // // // //       console.log("Specification container not found.");
// // // // // // // //     }
// // // // // // // //     return specifications;
// // // // // // // //   }

// // // // // // // //   // Combine the images and specifications.
// // // // // // // //   function scrapeImagesAndSpecs() {
// // // // // // // //     const imagesData = extractProductImages();
// // // // // // // //     const specsData = extractProductSpecifications();
// // // // // // // //     return {
// // // // // // // //       images: imagesData,
// // // // // // // //       specifications: specsData
// // // // // // // //     };
// // // // // // // //   }

// // // // // // // //   // Save the scraped data as a JSON file using a filename generated from the product name.
// // // // // // // //   function saveToFile(data) {
// // // // // // // //     const baseFilename = data.images && data.images.product_name
// // // // // // // //                          ? sanitizeFilename(data.images.product_name)
// // // // // // // //                          : "product";
// // // // // // // //     const filename = `${baseFilename}.json`;

// // // // // // // //     const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// // // // // // // //     const jsonUrl = URL.createObjectURL(jsonBlob);
// // // // // // // //     const downloadLink = document.createElement('a');
// // // // // // // //     downloadLink.href = jsonUrl;
// // // // // // // //     downloadLink.download = filename;

// // // // // // // //     document.body.appendChild(downloadLink);
// // // // // // // //     downloadLink.click();
// // // // // // // //     document.body.removeChild(downloadLink);
// // // // // // // //     URL.revokeObjectURL(jsonUrl);

// // // // // // // //     console.log(`Data saved to file: ${filename}`);
// // // // // // // //   }

// // // // // // // //   // Main scraping function.
// // // // // // // //   function runScrape() {
// // // // // // // //     const data = scrapeImagesAndSpecs();
// // // // // // // //     console.log("Scraped images and specifications:", data);

// // // // // // // //     if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
// // // // // // // //       chrome.storage.local.set({ imagesData: data }, () => {
// // // // // // // //         console.log("Images and specifications data saved to chrome.storage.local");
// // // // // // // //       });
// // // // // // // //     }

// // // // // // // //     saveToFile(data);
// // // // // // // //   }

// // // // // // // //   // Set up mouseover event listener with a 2-second delay.
// // // // // // // //   const targetElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // // // // // //   if (targetElement) {
// // // // // // // //     let hoverTimer;
// // // // // // // //     targetElement.addEventListener('mouseover', () => {
// // // // // // // //       hoverTimer = setTimeout(() => {
// // // // // // // //         runScrape();
// // // // // // // //       }, 2000);
// // // // // // // //     });

// // // // // // // //     targetElement.addEventListener('mouseout', () => {
// // // // // // // //       clearTimeout(hoverTimer);
// // // // // // // //     });
// // // // // // // //   } else {
// // // // // // // //     console.warn("Target image element not found.");
// // // // // // // //   }
// // // // // // // // })();
// // // // // // // (function() {
// // // // // // //   // Select all elements with the specified classes
// // // // // // //   const imageElements = document.querySelectorAll('img.DByuf4.IZexXJ.jLEJ7H');

// // // // // // //   imageElements.forEach(img => {
// // // // // // //     let hoverTimer = null;
// // // // // // //     let extractionInterval = null;

// // // // // // //     img.addEventListener('mouseenter', () => {
// // // // // // //       // Start a 2-second timer on mouse enter
// // // // // // //       hoverTimer = setTimeout(() => {
// // // // // // //         // Extract immediately after 2 seconds
// // // // // // //         extractImageSrc(img);

// // // // // // //         // Set up interval to extract every 2 seconds
// // // // // // //         extractionInterval = setInterval(() => {
// // // // // // //           extractImageSrc(img);
// // // // // // //         }, 2000);
// // // // // // //       }, 2000);
// // // // // // //     });

// // // // // // //     img.addEventListener('mouseleave', () => {
// // // // // // //       // Clear the initial hover timer if it hasn't fired yet
// // // // // // //       if (hoverTimer) {
// // // // // // //         clearTimeout(hoverTimer);
// // // // // // //         hoverTimer = null;
// // // // // // //       }

// // // // // // //       // Clear the extraction interval if it's running
// // // // // // //       if (extractionInterval) {
// // // // // // //         clearInterval(extractionInterval);
// // // // // // //         extractionInterval = null;
// // // // // // //       }
// // // // // // //     });
// // // // // // //   });

// // // // // // //   // Function to extract and log the image source
// // // // // // //   function extractImageSrc(imageElement) {
// // // // // // //     const src = imageElement.src;
// // // // // // //     console.log('Extracted image source:', src);

// // // // // // //     // If you want to store this data, you can use chrome.storage.local
// // // // // // //     if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
// // // // // // //       chrome.storage.local.get({ extractedImages: [] }, (result) => {
// // // // // // //         const images = result.extractedImages;
// // // // // // //         images.push(src);
// // // // // // //         chrome.storage.local.set({ extractedImages: images }, () => {
// // // // // // //           console.log('Image source saved to storage');
// // // // // // //         });
// // // // // // //       });
// // // // // // //     }
// // // // // // //   }
// // // // // // // })();
// // // // // // (async function() {
// // // // // //   // Helper: Wait for a specified number of milliseconds.
// // // // // //   function delay(ms) {
// // // // // //     return new Promise(resolve => setTimeout(resolve, ms));
// // // // // //   }
  
// // // // // //   // Helper: Sanitize a string for use as a filename.
// // // // // //   function sanitizeFilename(name) {
// // // // // //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
// // // // // //   }
  
// // // // // //   // Extract the product name from the page.
// // // // // //   function extractProductName() {
// // // // // //     const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
// // // // // //     return productNameElem ? productNameElem.innerText.trim() : "N/A";
// // // // // //   }
  
// // // // // //   // Main extraction: iterate over each thumbnail, hover, then extract the main image URL.
// // // // // //   const thumbnails = Array.from(document.querySelectorAll('img._0DkuPH'));
// // // // // //   const extractedImages = [];
  
// // // // // //   console.log("Total thumbnails found:", thumbnails.length);
  
// // // // // //   for (let i = 0; i < thumbnails.length; i++) {
// // // // // //     const thumb = thumbnails[i];

// // // // // //     // Bring the thumbnail into view.
// // // // // //     thumb.scrollIntoView({ behavior: "smooth", block: "center" });
// // // // // //     await delay(500);
    
// // // // // //     // Simulate a hover (mouseover) on the thumbnail.
// // // // // //     thumb.dispatchEvent(new MouseEvent("mouseover", {
// // // // // //       bubbles: true,
// // // // // //       cancelable: true,
// // // // // //       view: window
// // // // // //     }));
// // // // // //     console.log(`Hovered over thumbnail ${i + 1}`);
    
// // // // // //     // Wait 1 second for the main image to update.
// // // // // //     await delay(1000);
    
// // // // // //     // Extract the main image from the main container.
// // // // // //     const mainImage = document.querySelector('img.DByuf4.IZexXJ.jLEJ7H');
// // // // // //     if (mainImage && mainImage.src) {
// // // // // //       extractedImages.push(mainImage.src);
// // // // // //       console.log(`Extracted image ${i + 1}: ${mainImage.src}`);
// // // // // //     } else {
// // // // // //       console.warn(`Main image not found for thumbnail ${i + 1}`);
// // // // // //     }
    
// // // // // //     // Additional wait 1 second before moving to the next thumbnail.
// // // // // //     await delay(1000);
// // // // // //   }
  
// // // // // //   console.log("Final extracted images:", extractedImages);
  
// // // // // //   // Construct data object with product name and extracted images.
// // // // // //   const productName = extractProductName();
// // // // // //   const data = { product_name: productName, images: extractedImages };

// // // // // //   // Create a filename using the product name.
// // // // // //   const filename = `${sanitizeFilename(productName)}.json`;

// // // // // //   // Save the data as a JSON file.
// // // // // //   const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
// // // // // //   const jsonUrl = URL.createObjectURL(jsonBlob);
// // // // // //   const downloadLink = document.createElement("a");
// // // // // //   downloadLink.href = jsonUrl;
// // // // // //   downloadLink.download = filename;
// // // // // //   document.body.appendChild(downloadLink);
// // // // // //   downloadLink.click();
// // // // // //   document.body.removeChild(downloadLink);
// // // // // //   URL.revokeObjectURL(jsonUrl);

// // // // // //   console.log(`Data saved to ${filename}`);
// // // // // // })();
// // // // // // // 
// // // // // (async function() {
// // // // //   // Helper: Wait for a specified number of milliseconds.
// // // // //   const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// // // // //   // Helper: Sanitize a string for use as a filename.
// // // // //   function sanitizeFilename(name) {
// // // // //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
// // // // //   }
  
// // // // //   // Helper: Extract the best resolution image from an img element.
// // // // //   // This function checks for a srcset attribute and selects the variant marked "2x".
// // // // //   // If no srcset is available, it falls back to the src attribute.
// // // // //   function getBestResolutionSrc(imgElement) {
// // // // //     if (!imgElement) return "N/A";
// // // // //     const srcset = imgElement.getAttribute('srcset');
// // // // //     if (srcset) {
// // // // //       // Split by commas and check each variant.
// // // // //       const variants = srcset.split(',').map(item => item.trim());
// // // // //       // Try to find the URL with the "2x" descriptor.
// // // // //       for (const variant of variants) {
// // // // //         if (variant.includes("2x")) {
// // // // //           // The variant format is like: "https://...jpeg?q=70&crop=false 2x"
// // // // //           return variant.split(' ')[0];
// // // // //         }
// // // // //       }
// // // // //       // If no "2x" is found, return the first variant URL.
// // // // //       return variants[0].split(' ')[0];
// // // // //     }
// // // // //     // Fallback to src
// // // // //     return imgElement.src;
// // // // //   }
  
// // // // //   // Function to simulate a mouseover event.
// // // // //   function simulateHover(element) {
// // // // //     if (!element) return;
// // // // //     const event = new MouseEvent('mouseover', {
// // // // //       bubbles: true,
// // // // //       cancelable: true,
// // // // //       view: window
// // // // //     });
// // // // //     element.dispatchEvent(event);
// // // // //   }
  
// // // // //   // Extract the product name from the page.
// // // // //   function extractProductName() {
// // // // //     const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
// // // // //     return productNameElem ? productNameElem.innerText.trim() : "N/A";
// // // // //   }
  
// // // // //   // Main extraction routine: For each thumbnail, simulate a hover and after a 1-second delay extract the best resolution main image URL.
// // // // //   async function extractHighResImages() {
// // // // //     const images = [];
// // // // //     const thumbnails = Array.from(document.querySelectorAll("img._0DkuPH"));
// // // // //     console.log("Found", thumbnails.length, "thumbnails.");
    
// // // // //     // Get the main image element initially.
// // // // //     const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
    
// // // // //     for (let i = 0; i < thumbnails.length; i++) {
// // // // //       const thumb = thumbnails[i];
// // // // //       thumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
// // // // //       await delay(500);
      
// // // // //       // Simulate hover on the thumbnail.
// // // // //       simulateHover(thumb);
// // // // //       console.log(`Hovered thumbnail ${i + 1}`);
      
// // // // //       // Wait 1 second for the main image to update.
// // // // //       await delay(1000);
      
// // // // //       // Re-select the main image element (it might have updated)
// // // // //       const updatedMainImage = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // // //       const extractedSrc = getBestResolutionSrc(updatedMainImage);
// // // // //       console.log(`Extracted image from thumbnail ${i + 1}: ${extractedSrc}`);
// // // // //       if (extractedSrc && extractedSrc !== "N/A" && !images.includes(extractedSrc)) {
// // // // //         images.push(extractedSrc);
// // // // //       }
      
// // // // //       // Wait 1 second before processing the next thumbnail.
// // // // //       await delay(1000);
// // // // //     }
// // // // //     return images;
// // // // //   }
  
// // // // //   // Combine the extracted images and specifications into a data object.
// // // // //   function scrapeImagesAndSpecs() {
// // // // //     const productName = extractProductName();
    
// // // // //     // For specifications, using your previous code:
// // // // //     function extractProductSpecifications() {
// // // // //       const specContainer = document.querySelector("div._1OjC5I.pKBIUH");
// // // // //       let specifications = {};
// // // // //       if (specContainer) {
// // // // //         const specSections = specContainer.querySelectorAll("div.GNDEQ-");
// // // // //         specSections.forEach(section => {
// // // // //           try {
// // // // //             let sectionTitle = "Untitled Section";
// // // // //             const sectionTitleElem = section.querySelector("div._4BJ2V + *");
// // // // //             if (sectionTitleElem && sectionTitleElem.textContent) {
// // // // //               sectionTitle = sectionTitleElem.textContent.trim();
// // // // //             }
// // // // //             const rows = section.querySelectorAll("tr.WJdYP6.row");
// // // // //             let sectionData = {};
// // // // //             rows.forEach(row => {
// // // // //               const keyElem = row.querySelector("td.+fFi1w.col-3-12");
// // // // //               const valueElem = row.querySelector("td.Izz52n.col-9-12 li.HPETK2");
// // // // //               const key = keyElem ? keyElem.textContent.trim() : null;
// // // // //               const value = valueElem ? valueElem.textContent.trim() : null;
// // // // //               if (key && value) {
// // // // //                 sectionData[key] = value;
// // // // //               }
// // // // //             });
// // // // //             specifications[sectionTitle] = sectionData;
// // // // //           } catch (e) {
// // // // //             console.error("Error parsing specifications:", e);
// // // // //           }
// // // // //         });
// // // // //       } else {
// // // // //         console.log("Specification container not found.");
// // // // //       }
// // // // //       return specifications;
// // // // //     }
    
// // // // //     // Use the original main image as initially extracted:
// // // // //     const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // // //     const mainImage = mainImageElement ? getBestResolutionSrc(mainImageElement) : "N/A";
    
// // // // //     return {
// // // // //       images: {
// // // // //         product_name: productName,
// // // // //         main_image: mainImage,
// // // // //         thumbnails: [] // We'll fill this using our async extraction.
// // // // //       },
// // // // //       specifications: extractProductSpecifications()
// // // // //     };
// // // // //   }
  
// // // // //   async function runScrape() {
// // // // //     const data = scrapeImagesAndSpecs();
// // // // //     // Extract high-resolution images after hover from thumbnails.
// // // // //     data.images.thumbnails = await extractHighResImages();
    
// // // // //     console.log("Scraped images and specifications:", data);
    
// // // // //     // Save data to chrome.storage.local (if available)
// // // // //     if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
// // // // //       chrome.storage.local.set({ imagesData: data }, () => {
// // // // //         console.log("Images and specifications data saved to chrome.storage.local");
// // // // //       });
// // // // //     }
    
// // // // //     // Save data as JSON file.
// // // // //     const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// // // // //     const jsonUrl = URL.createObjectURL(jsonBlob);
// // // // //     const downloadLink = document.createElement('a');
// // // // //     downloadLink.href = jsonUrl;
// // // // //     downloadLink.download = `${sanitizeFilename(data.images.product_name)}.json`;
// // // // //     document.body.appendChild(downloadLink);
// // // // //     downloadLink.click();
// // // // //     document.body.removeChild(downloadLink);
// // // // //     URL.revokeObjectURL(jsonUrl);
    
// // // // //     console.log("Data saved successfully.");
// // // // //   }
  
// // // // //   runScrape();
// // // // // })();
// // // // (async function() {
 
// // // //   const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// // // //   function sanitizeFilename(name) {
// // // //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
// // // //   }
  
 
// // // //   function getBestResolutionSrc(imgElement) {
// // // //     if (!imgElement) return "N/A";
// // // //     const srcset = imgElement.getAttribute('srcset');
// // // //     if (srcset) {
      
// // // //       const variants = srcset.split(',').map(item => item.trim());
      
// // // //       for (const variant of variants) {
// // // //         if (variant.includes("2x")) {
// // // //           return variant.split(" ")[0];
// // // //         }
// // // //       }
    
// // // //       return variants[0].split(" ")[0];
// // // //     }
// // // //     return imgElement.src;
// // // //   }
  
 
// // // //   function simulateHover(element) {
// // // //     if (!element) return;
// // // //     const event = new MouseEvent('mouseover', {
// // // //       bubbles: true,
// // // //       cancelable: true,
// // // //       view: window
// // // //     });
// // // //     element.dispatchEvent(event);
// // // //   }

// // // //   function extractProductName() {
// // // //     const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
// // // //     return productNameElem ? productNameElem.innerText.trim() : "N/A";
// // // //   }
  
  
// // // //   async function extractHighResImages() {
// // // //     const images = [];
// // // //     const thumbnails = Array.from(document.querySelectorAll("img._0DkuPH"));
// // // //     console.log("Found", thumbnails.length, "thumbnails.");
    
// // // //     for (let i = 0; i < thumbnails.length; i++) {
// // // //       const thumb = thumbnails[i];
      
    
// // // //       thumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
// // // //       await delay(500);
      
    
// // // //       simulateHover(thumb);
// // // //       console.log(`Hovered on thumbnail ${i + 1}`);
      
      
// // // //       await delay(1000);
      
      
// // // //       const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // //       const extractedSrc = getBestResolutionSrc(mainImageElement);
// // // //       console.log(`Extracted image ${i + 1}: ${extractedSrc}`);
      
// // // //       if (extractedSrc && extractedSrc !== "N/A" && !images.includes(extractedSrc)) {
// // // //         images.push(extractedSrc);
// // // //       }
      

// // // //       await delay(1000);
// // // //     }
// // // //     return images;
// // // //   }
  
// // // //   async function scrapeImages() {
// // // //     const productName = extractProductName();
    
    
// // // //     const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // //     const mainImage = mainImgElem ? getBestResolutionSrc(mainImgElem) : "N/A";
    

// // // //     const highResThumbnails = await extractHighResImages();
    
// // // //     return {
// // // //       images: {
// // // //         product_name: productName,
// // // //         main_image: mainImage,
// // // //         thumbnails: highResThumbnails
// // // //       }
// // // //     };
// // // //   }
  
// // // //   function saveToFile(data) {
// // // //     const baseFilename = data.images && data.images.product_name
// // // //                          ? sanitizeFilename(data.images.product_name)
// // // //                          : "product";
// // // //     const filename = `${baseFilename}.json`;
    
// // // //     const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// // // //     const jsonUrl = URL.createObjectURL(jsonBlob);
// // // //     const downloadLink = document.createElement('a');
// // // //     downloadLink.href = jsonUrl;
// // // //     downloadLink.download = filename;
    
// // // //     document.body.appendChild(downloadLink);
// // // //     downloadLink.click();
// // // //     document.body.removeChild(downloadLink);
// // // //     URL.revokeObjectURL(jsonUrl);
    
// // // //     console.log(`Data saved to file: ${filename}`);
// // // //   }
  
// // // //   async function runScrape() {
// // // //     const data = await scrapeImages();
// // // //     console.log("Scraped images data:", data);
    
  
// // // //     if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
// // // //       chrome.storage.local.set({ imagesData: data }, () => {
// // // //         console.log("Images data saved to chrome.storage.local");
// // // //       });
// // // //     }
    
// // // //     saveToFile(data);
// // // //   }
  
// // // //   runScrape();
// // // // })();
// // // (async function() {
 
// // //   const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// // //   function sanitizeFilename(name) {
// // //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
// // //   }

// // //   function getBestResolutionSrc(imgElement) {
// // //     if (!imgElement) return "N/A";
// // //     const srcset = imgElement.getAttribute('srcset');
// // //     if (srcset) {
// // //       const variants = srcset.split(',').map(item => item.trim());
// // //       for (const variant of variants) {
// // //         if (variant.includes("2x")) {
// // //           return variant.split(" ")[0];
// // //         }
// // //       }
// // //       return variants[0].split(" ")[0];
// // //     }
// // //     return imgElement.src;
// // //   }

// // //   function simulateHover(element) {
// // //     if (!element) return;
// // //     const event = new MouseEvent('mouseover', {
// // //       bubbles: true,
// // //       cancelable: true,
// // //       view: window
// // //     });
// // //     element.dispatchEvent(event);
// // //   }

// // //   function extractProductName() {
// // //     const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
// // //     return productNameElem ? productNameElem.innerText.trim() : "N/A";
// // //   }

// // //   async function extractHighResImages() {
// // //     const images = [];
// // //     const thumbnails = Array.from(document.querySelectorAll("img._0DkuPH"));
// // //     console.log("Found", thumbnails.length, "thumbnails.");
    
// // //     for (let i = 0; i < thumbnails.length; i++) {
// // //       const thumb = thumbnails[i];
// // //       thumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
// // //       await delay(500);
// // //       simulateHover(thumb);
// // //       console.log(`Hovered on thumbnail ${i + 1}`);
// // //       await delay(1000);
// // //       const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // //       const extractedSrc = getBestResolutionSrc(mainImageElement);
// // //       console.log(`Extracted image ${i + 1}: ${extractedSrc}`);
// // //       if (extractedSrc && extractedSrc !== "N/A" && !images.includes(extractedSrc)) {
// // //         images.push(extractedSrc);
// // //       }
// // //       await delay(1000);
// // //     }
// // //     return images;
// // //   }

// // //   async function scrapeImages() {
// // //     const productName = extractProductName();
// // //     const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // //     const mainImage = mainImgElem ? getBestResolutionSrc(mainImgElem) : "N/A";
// // //     const highResThumbnails = await extractHighResImages();
// // //     return {
// // //       images: {
// // //         product_name: productName,
// // //         main_image: mainImage,
// // //         thumbnails: highResThumbnails
// // //       }
// // //     };
// // //   }

// // //   function saveToFile(data) {
// // //     const baseFilename = data.images && data.images.product_name
// // //                          ? sanitizeFilename(data.images.product_name)
// // //                          : "product";
// // //     const filename = `${baseFilename}.json`;
// // //     const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// // //     const jsonUrl = URL.createObjectURL(jsonBlob);
// // //     const downloadLink = document.createElement('a');
// // //     downloadLink.href = jsonUrl;
// // //     downloadLink.download = filename;
// // //     document.body.appendChild(downloadLink);
// // //     downloadLink.click();
// // //     document.body.removeChild(downloadLink);
// // //     URL.revokeObjectURL(jsonUrl);
// // //     console.log(`Data saved to file: ${filename}`);
// // //   }

// // //   async function runScrape() {
// // //     const data = await scrapeImages();
// // //     console.log("Scraped images data:", data);
// // //     if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
// // //       chrome.storage.local.set({ imagesData: data }, () => {
// // //         console.log("Images data saved to chrome.storage.local");
// // //       });
// // //     }
// // //     chrome.runtime.sendMessage({ type: "SCRAPING_DONE", data });
// // //     saveToFile(data);
// // //     alert("Scraping done!");
// // //   }

// // //   runScrape();
// // // })();
// // (async function() {
 
// //   const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// //   function sanitizeFilename(name) {
// //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
// //   }
  
// //   function getBestResolutionSrc(imgElement) {
// //     if (!imgElement) return "N/A";
// //     const srcset = imgElement.getAttribute('srcset');
// //     if (srcset) {
// //       const variants = srcset.split(',').map(item => item.trim());
// //       for (const variant of variants) {
// //         if (variant.includes("2x")) {
// //           return variant.split(" ")[0];
// //         }
// //       }
// //       return variants[0].split(" ")[0];
// //     }
// //     return imgElement.src;
// //   }
  
// //   function simulateHover(element) {
// //     if (!element) return;
// //     const event = new MouseEvent('mouseover', {
// //       bubbles: true,
// //       cancelable: true,
// //       view: window
// //     });
// //     element.dispatchEvent(event);
// //   }

// //   function extractProductName() {
// //     const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
// //     return productNameElem ? productNameElem.innerText.trim() : "N/A";
// //   }
  
// //   async function extractHighResImages() {
// //     const images = [];
// //     const thumbnails = Array.from(document.querySelectorAll("img._0DkuPH"));
// //     console.log("Found", thumbnails.length, "thumbnails.");
    
// //     for (let i = 0; i < thumbnails.length; i++) {
// //       const thumb = thumbnails[i];
// //       thumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
// //       await delay(500);
// //       simulateHover(thumb);
// //       console.log(`Hovered on thumbnail ${i + 1}`);
// //       await delay(1000);
// //       const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// //       const extractedSrc = getBestResolutionSrc(mainImageElement);
// //       console.log(`Extracted image ${i + 1}: ${extractedSrc}`);
// //       if (extractedSrc && extractedSrc !== "N/A" && !images.includes(extractedSrc)) {
// //         images.push(extractedSrc);
// //       }
// //       await delay(1000);
// //     }
// //     return images;
// //   }
  
// //   async function scrapeImages() {
// //     const productName = extractProductName();
// //     const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// //     const mainImage = mainImgElem ? getBestResolutionSrc(mainImgElem) : "N/A";
// //     const highResThumbnails = await extractHighResImages();
// //     return {
// //       images: {
// //         product_name: productName,
// //         main_image: mainImage,
// //         thumbnails: highResThumbnails
// //       }
// //     };
// //   }
  
// //   function saveToFile(data) {
// //     const baseFilename = data.images && data.images.product_name
// //                          ? sanitizeFilename(data.images.product_name)
// //                          : "product";
// //     const filename = `${baseFilename}.json`;
// //     const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// //     const jsonUrl = URL.createObjectURL(jsonBlob);
// //     const downloadLink = document.createElement('a');
// //     downloadLink.href = jsonUrl;
// //     downloadLink.download = filename;
// //     document.body.appendChild(downloadLink);
// //     downloadLink.click();
// //     document.body.removeChild(downloadLink);
// //     URL.revokeObjectURL(jsonUrl);
// //     console.log(`Data saved to file: ${filename}`);
// //   }

// //   async function runScrape() {
// //     const data = await scrapeImages();
// //     console.log("Scraped images data:", data);
// //     if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
// //       chrome.storage.local.set({ imagesData: data }, () => {
// //         console.log("Images data saved to chrome.storage.local");
// //       });
// //     }
// //     saveToFile(data);
// //     alert(`Scraping done! Product: ${data.images.product_name}`);
// //   }

// //   runScrape();
// // })();

// (async function() {
//   const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//   function sanitizeFilename(name) {
//     return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
//   }
  
//   function getBestResolutionSrc(imgElement) {
//     if (!imgElement) return "N/A";
//     const srcset = imgElement.getAttribute('srcset');
//     if (srcset) {
//       const variants = srcset.split(',').map(item => item.trim());
//       for (const variant of variants) {
//         if (variant.includes("2x")) {
//           return variant.split(" ")[0];
//         }
//       }
//       return variants[0].split(" ")[0];
//     }
//     return imgElement.src;
//   }
  
//   function simulateHover(element) {
//     if (!element) return;
//     const event = new MouseEvent('mouseover', {
//       bubbles: true,
//       cancelable: true,
//       view: window
//     });
//     element.dispatchEvent(event);
//   }

//   function extractProductName() {
//     const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
//     return productNameElem ? productNameElem.innerText.trim() : "N/A";
//   }
  
//   async function extractHighResImages() {
//     const images = [];
//     const thumbnails = Array.from(document.querySelectorAll("img._0DkuPH"));
//     console.log("Found", thumbnails.length, "thumbnails.");
    
//     for (let i = 0; i < thumbnails.length; i++) {
//       const thumb = thumbnails[i];
//       thumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
//       await delay(500);
//       simulateHover(thumb);
//       console.log(`Hovered on thumbnail ${i + 1}`);
//       await delay(1000);
//       const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
//       const extractedSrc = getBestResolutionSrc(mainImageElement);
//       console.log(`Extracted image ${i + 1}: ${extractedSrc}`);
//       if (extractedSrc && extractedSrc !== "N/A" && !images.includes(extractedSrc)) {
//         images.push(extractedSrc);
//       }
//       await delay(1000);
//     }
//     return images;
//   }
  
//   async function scrapeImages() {
//     const productName = extractProductName();
//     const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
//     const mainImage = mainImgElem ? getBestResolutionSrc(mainImgElem) : "N/A";
//     const highResThumbnails = await extractHighResImages();
//     return {
//       images: {
//         product_name: productName,
//         main_image: mainImage,
//         thumbnails: highResThumbnails
//       }
//     };
//   }
  
//   // ← NEW: send scraped JSON to Flask instead of saving locally
//   function sendToFlaskServer(data) {
//     fetch('http://localhost:5000/receive_images', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     })
//     .then(res => res.json())
//     .then(result => console.log('Flask server response:', result))
//     .catch(err => console.error('Error sending to Flask:', err));
//   }

//   async function runScrape() {
//     const data = await scrapeImages();
//     console.log("Scraped images data:", data);

//     // still save to chrome.storage.local
//     if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
//       chrome.storage.local.set({ imagesData: data }, () => {
//         console.log("Images data saved to chrome.storage.local");
//       });
//     }

//     // instead of saveToFile + alert, POST to Flask:
//     sendToFlaskServer(data);
//   }

//   runScrape();
// })();
(async function() {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
  }
  
  function getBestResolutionSrc(imgElement) {
    if (!imgElement) return "N/A";
    const srcset = imgElement.getAttribute('srcset');
    if (srcset) {
      const variants = srcset.split(',').map(item => item.trim());
      for (const variant of variants) {
        if (variant.includes("2x")) {
          return variant.split(" ")[0];
        }
      }
      return variants[0].split(" ")[0];
    }
    return imgElement.src;
  }
  
  function simulateHover(element) {
    if (!element) return;
    const event = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
  }

  function extractProductName() {
    const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
    return productNameElem ? productNameElem.innerText.trim() : "N/A";
  }
  
  async function extractHighResImages() {
    const images = [];
    const thumbnails = Array.from(document.querySelectorAll("img._0DkuPH"));
    console.log("Found", thumbnails.length, "thumbnails.");
    
    for (let i = 0; i < thumbnails.length; i++) {
      const thumb = thumbnails[i];
      thumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(500);
      simulateHover(thumb);
      console.log(`Hovered on thumbnail ${i + 1}`);
      await delay(1000);
      const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
      const extractedSrc = getBestResolutionSrc(mainImageElement);
      console.log(`Extracted image ${i + 1}: ${extractedSrc}`);
      if (extractedSrc && extractedSrc !== "N/A" && !images.includes(extractedSrc)) {
        images.push(extractedSrc);
      }
      await delay(1000);
    }
    return images;
  }
  
  async function scrapeImages() {
    const productName = extractProductName();
    const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
    const mainImage = mainImgElem ? getBestResolutionSrc(mainImgElem) : "N/A";
    const highResThumbnails = await extractHighResImages();
    return {
      images: {
        product_name: productName,
        main_image: mainImage,
        thumbnails: highResThumbnails
      }
    };
  }
  
  function sendToFlaskServer(data) {
    fetch('http://localhost:5000/receive_images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => console.log('Flask server response:', result))
    .catch(err => console.error('Error sending to Flask:', err));
  }

  async function runScrape() {
    const data = await scrapeImages();
    console.log("Scraped images data:", data);

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ imagesData: data }, () => {
        console.log("Images data saved to chrome.storage.local");
      });
    }

    sendToFlaskServer(data);

    // ← put alert back so you know it's done
    alert(`Scraping done! Product: ${data.images.product_name}`);
  }

  runScrape();
})();
