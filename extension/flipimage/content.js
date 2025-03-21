// Run scraping when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    runScraping();
  });
  
  // -------------------
  // Image Extraction
  // -------------------
  function extractProductImages() {
    // Try to get product name from <span class="VU-ZEz"> or fallback to <a class="wjcEIp AbG6iz">
    const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("a.wjcEIp.AbG6iz");
    const productName = productNameElem ? productNameElem.innerText.trim() : "N/A";
  
    // Main product image
    const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
    const mainImage = mainImageElement ? mainImageElement.src : "N/A";
  
    // All thumbnail images
    const thumbnailElements = document.querySelectorAll("img._0DkuPH");
    const thumbnailImages = Array.from(thumbnailElements).map(img => img.src);
  
    return {
      product_name: productName,
      main_image: mainImage,
      thumbnails: thumbnailImages
    };
  }
  
  // -------------------
  // Specification Extraction
  // -------------------
  function extractProductSpecifications() {
    // Select the specification container using the classes from the reference
    const specContainer = document.querySelector("div._1OjC5I.pKBIUH");
    let specifications = {};
  
    if (specContainer) {
      // Each specification section is inside a div with class "GNDEQ-"
      const specSections = specContainer.querySelectorAll("div.GNDEQ-");
      specSections.forEach(section => {
        try {
          // Attempt to get the section title
          // Using the adjacent sibling selector from an element with class "_4BJ2V"
          let sectionTitle = "Untitled Section";
          const sectionTitleElem = section.querySelector("div._4BJ2V + *");
          if (sectionTitleElem && sectionTitleElem.textContent) {
            sectionTitle = sectionTitleElem.textContent.trim();
          } else {
            // Fallback: check if a div with class _4BJ2V exists inside the section
            const altTitleElem = section.querySelector("div._4BJ2V");
            if (altTitleElem && altTitleElem.textContent) {
              sectionTitle = altTitleElem.textContent.trim();
            }
          }
  
          // Get all rows in the section
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
  
  // -------------------
  // Save Data Function
  // -------------------
  function saveData(data) {
    const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: "application/json" });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const a = document.createElement("a");
    a.href = jsonUrl;
    a.download = "product_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(jsonUrl);
  }
  
  // -------------------
  // Main Scraping Function
  // -------------------
  function runScraping() {
    const imagesData = extractProductImages();
    const specsData = extractProductSpecifications();
    const productData = {
      images: imagesData,
      specifications: specsData
    };
    console.log("Combined scraped data:", productData);
    saveData(productData);
  }
  
  // Execute the scraper
  runScraping();
  