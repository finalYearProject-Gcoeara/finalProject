(function() {
    // Extract images and specifications from the page.
    function extractProductImages() {
      // Try to get product name from <span class="VU-ZEz">, fallback to <a class="wjcEIp AbG6iz">
      const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
      const productName = productNameElem ? productNameElem.innerText.trim() : "N/A";
    
      const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
      const mainImage = mainImageElement ? mainImageElement.src : "N/A";
    
      const thumbnailElements = document.querySelectorAll("img._0DkuPH");
      const thumbnailImages = Array.from(thumbnailElements).map(img => img.src);
    
      return {
        product_name: productName,
        main_image: mainImage,
        thumbnails: thumbnailImages
      };
    }
    
    function extractProductSpecifications() {
      // Select the specification container using the classes provided in your reference.
      const specContainer = document.querySelector("div._1OjC5I.pKBIUH");
      let specifications = {};
    
      if (specContainer) {
        const specSections = specContainer.querySelectorAll("div.GNDEQ-");
        specSections.forEach(section => {
          try {
            // Attempt to get the section title; use adjacent sibling of element with class _4BJ2V.
            let sectionTitle = "Untitled Section";
            const sectionTitleElem = section.querySelector("div._4BJ2V + *");
            if (sectionTitleElem && sectionTitleElem.textContent) {
              sectionTitle = sectionTitleElem.textContent.trim();
            }
    
            const rows = section.querySelectorAll("tr.WJdYP6.row");
            let sectionData = {};
            rows.forEach(row => {
              const keyElem = row.querySelector("td.+fFi1w.col-3-12");
              const valueElem = row.querySelector("td.Izz52n.col-9-12 li.HPETK2");
              const key = keyElem ? keyElem.textContent.trim() : null;
              const value = valueElem ? valueElem.textContent.trim() : null;
              if (key && value) {
                sectionData[key] = value;
              }
            });
            specifications[sectionTitle] = sectionData;
          } catch (e) {
            console.error("Error parsing specifications:", e);
          }
        });
      } else {
        console.log("Specification container not found.");
      }
      return specifications;
    }
    
    function scrapeImagesAndSpecs() {
      const imagesData = extractProductImages();
      const specsData = extractProductSpecifications();
      return {
        images: imagesData,
        specifications: specsData
      };
    }
    
    const data = scrapeImagesAndSpecs();
    console.log("Scraped images and specifications:", data);
    
    // Save the data to chrome.storage.local under the key "imagesData"
    chrome.storage.local.set({ imagesData: data }, () => {
      console.log("Images and specifications data saved to storage");
    });
  })();
(function() {
  // Helper: sanitize and truncate the product name for use as a file name.
  function sanitizeFilename(name) {
    // Replace non-alphanumeric characters with underscores and truncate to 20 characters.
    return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
  }

  // Extract images from the page.
  function extractProductImages() {
    // Try to get product name from <span class="VU-ZEz">, fallback to <a class="wjcEIp AbG6iz">
    const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
    const productName = productNameElem ? productNameElem.innerText.trim() : "N/A";

    const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
    const mainImage = mainImageElement ? mainImageElement.src : "N/A";

    const thumbnailElements = document.querySelectorAll("img._0DkuPH");
    const thumbnailImages = Array.from(thumbnailElements).map(img => img.src);

    return {
      product_name: productName,
      main_image: mainImage,
      thumbnails: thumbnailImages
    };
  }

  // Extract specifications from the page.
  function extractProductSpecifications() {
    // Select the specification container using the provided classes.
    const specContainer = document.querySelector("div._1OjC5I.pKBIUH");
    let specifications = {};

    if (specContainer) {
      const specSections = specContainer.querySelectorAll("div.GNDEQ-");
      specSections.forEach(section => {
        try {
          // Attempt to get the section title; using an element adjacent to one with the class _4BJ2V.
          let sectionTitle = "Untitled Section";
          const sectionTitleElem = section.querySelector("div._4BJ2V + *");
          if (sectionTitleElem && sectionTitleElem.textContent) {
            sectionTitle = sectionTitleElem.textContent.trim();
          }

          const rows = section.querySelectorAll("tr.WJdYP6.row");
          let sectionData = {};
          rows.forEach(row => {
            const keyElem = row.querySelector("td.+fFi1w.col-3-12");
            const valueElem = row.querySelector("td.Izz52n.col-9-12 li.HPETK2");
            const key = keyElem ? keyElem.textContent.trim() : null;
            const value = valueElem ? valueElem.textContent.trim() : null;
            if (key && value) {
              sectionData[key] = value;
            }
          });
          specifications[sectionTitle] = sectionData;
        } catch (e) {
          console.error("Error parsing specifications:", e);
        }
      });
    } else {
      console.log("Specification container not found.");
    }
    return specifications;
  }

  // Combine the images and specifications.
  function scrapeImagesAndSpecs() {
    const imagesData = extractProductImages();
    const specsData = extractProductSpecifications();
    return {
      images: imagesData,
      specifications: specsData
    };
  }

  // Save the scraped data as a JSON file using a filename generated from the product name.
  function saveToFile(data) {
    // Use the product name from images data to name the file.
    const baseFilename = data.images && data.images.product_name
                         ? sanitizeFilename(data.images.product_name)
                         : "product";
    const filename = `${baseFilename}.json`;
    
    const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = jsonUrl;
    downloadLink.download = filename;
    
    // Trigger the download.
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(jsonUrl);
    
    console.log(`Data saved to file: ${filename}`);
  }

  // Main scraping function.
  function runScrape() {
    const data = scrapeImagesAndSpecs();
    console.log("Scraped images and specifications:", data);
    
    // Optionally, save the data to chrome.storage.local if needed.
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ imagesData: data }, () => {
        console.log("Images and specifications data saved to chrome.storage.local");
      });
    }
    
    // Save the data as a JSON file.
    saveToFile(data);
  }

  // Run the scraping script.
  runScrape();
})();
// document.addEventListener("DOMContentLoaded", () => {
//   // Create a button for triggering the scrape if it doesn't already exist.
//   let scrapeBtn = document.getElementById("scrapeData");
//   if (!scrapeBtn) {
//     scrapeBtn = document.createElement("button");
//     scrapeBtn.id = "scrapeData";
//     scrapeBtn.innerText = "Scrape Data";
//     // Position the button in a fixed location on the page.
//     scrapeBtn.style.position = "fixed";
//     scrapeBtn.style.top = "10px";
//     scrapeBtn.style.right = "10px";
//     scrapeBtn.style.zIndex = "10000";
//     document.body.appendChild(scrapeBtn);
//   }

//   // When the button is clicked, execute the scraping and save the data.
//   scrapeBtn.addEventListener("click", () => {
//     // Extract images from the page.
//     function extractProductImages() {
//       // Try to get product name from <span class="VU-ZEz">, fallback to <a class="wjcEIp AbG6iz">
//       const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
//       const productName = productNameElem ? productNameElem.innerText.trim() : "N/A";

//       const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
//       const mainImage = mainImageElement ? mainImageElement.src : "N/A";

//       const thumbnailElements = document.querySelectorAll("img._0DkuPH");
//       const thumbnailImages = Array.from(thumbnailElements).map(img => img.src);

//       return {
//         product_name: productName,
//         main_image: mainImage,
//         thumbnails: thumbnailImages
//       };
//     }

//     // Extract specifications from the page.
//     function extractProductSpecifications() {
//       // Select the specification container using the provided classes.
//       const specContainer = document.querySelector("div._1OjC5I.pKBIUH");
//       let specifications = {};

//       if (specContainer) {
//         const specSections = specContainer.querySelectorAll("div.GNDEQ-");
//         specSections.forEach(section => {
//           try {
//             // Attempt to get the section title; use the element adjacent to one with class _4BJ2V.
//             let sectionTitle = "Untitled Section";
//             const sectionTitleElem = section.querySelector("div._4BJ2V + *");
//             if (sectionTitleElem && sectionTitleElem.textContent) {
//               sectionTitle = sectionTitleElem.textContent.trim();
//             }

//             const rows = section.querySelectorAll("tr.WJdYP6.row");
//             let sectionData = {};
//             rows.forEach(row => {
//               const keyElem = row.querySelector("td.+fFi1w.col-3-12");
//               const valueElem = row.querySelector("td.Izz52n.col-9-12 li.HPETK2");
//               const key = keyElem ? keyElem.textContent.trim() : null;
//               const value = valueElem ? valueElem.textContent.trim() : null;
//               if (key && value) {
//                 sectionData[key] = value;
//               }
//             });
//             specifications[sectionTitle] = sectionData;
//           } catch (e) {
//             console.error("Error parsing specifications:", e);
//           }
//         });
//       } else {
//         console.log("Specification container not found.");
//       }
//       return specifications;
//     }

//     // Combine both images and specifications into one data object.
//     function scrapeImagesAndSpecs() {
//       const imagesData = extractProductImages();
//       const specsData = extractProductSpecifications();
//       return {
//         images: imagesData,
//         specifications: specsData
//       };
//     }

//     const data = scrapeImagesAndSpecs();
//     console.log("Scraped images and specifications:", data);

//     // Save the data to chrome.storage.local under the key "imagesData"
//     chrome.storage.local.set({ imagesData: data }, () => {
//       console.log("Images and specifications data saved to chrome.storage.local");
//     });
//   });
// });
