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
  