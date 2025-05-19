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
