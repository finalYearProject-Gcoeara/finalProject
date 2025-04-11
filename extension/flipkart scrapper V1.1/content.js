// async function fetchHTML(url) {
//   console.log("Fetching URL:", url);
//   const response = await fetch(url, {
//     headers: {
//       "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
//       "Accept-Language": "en-IN,en;q=0.5",
//       "Accept-Encoding": "gzip, deflate, br",
//       "Referer": "https://www.flipkart.com/"
//     }
//   });

//   if (!response.ok) {
//     throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
//   }
//   const text = await response.text();
//   console.log("Fetched HTML length:", text.length);
//   return text;
// }

// function extractProductImages(html) {
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(html, 'text/html');

//   // Extract product name
//   const productName = doc.querySelector("a.wjcEIp.AbG6iz")
//                           ? doc.querySelector("a.wjcEIp.AbG6iz").innerText.trim()
//                           : "N/A";

//   // Extract main product image
//   const mainImageElement = doc.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
//   const mainImage = mainImageElement ? mainImageElement.src : null;

//   // Extract all images from thumbnail list
//   const thumbnailElements = doc.querySelectorAll("img._0DkuPH");
//   const thumbnailImages = Array.from(thumbnailElements).map(img => img.src);

//   return {
//     product_name: productName,
//     main_image: mainImage,
//     thumbnails: thumbnailImages
//   };
// }

// async function scrapeProductImages() {
//   const currentUrl = window.location.href;
//   console.log("Scraping images from:", currentUrl);

//   try {
//     const html = await fetchHTML(currentUrl);
//     const productData = extractProductImages(html);
    
//     console.log("Scraped product images:", productData);
//     saveData(productData);
//   } catch (error) {
//     console.error("Error scraping images:", error);
//   }
// }

// function saveData(data) {
//   const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
//   const jsonUrl = URL.createObjectURL(jsonBlob);
//   const jsonA = document.createElement('a');
//   jsonA.href = jsonUrl;
//   jsonA.download = 'product_images.json';
//   jsonA.click();
//   URL.revokeObjectURL(jsonUrl);
// }

// scrapeProductImages();
async function fetchHTML(url) {
  console.log("Fetching URL:", url);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      "Accept-Language": "en-IN,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://www.flipkart.com/"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  console.log("Fetched HTML length:", text.length);
  return text;
}

function extractProductImages(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract product name
  const productName = doc.querySelector("a.wjcEIp.AbG6iz")
                          ? doc.querySelector("a.wjcEIp.AbG6iz").innerText.trim()
                          : "N/A";

  // Extract main product image
  const mainImageElement = doc.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
  const mainImage = mainImageElement ? mainImageElement.src : null;

  // Extract all images from thumbnail list
  const thumbnailElements = doc.querySelectorAll("img._0DkuPH");
  const thumbnailImages = Array.from(thumbnailElements).map(img => img.src);

  return {
    product_name: productName,
    main_image: mainImage,
    thumbnails: thumbnailImages
  };
}

async function scrapeProductImages() {
  const currentUrl = window.location.href;
  console.log("Scraping images from:", currentUrl);

  try {
    const html = await fetchHTML(currentUrl);
    const productData = extractProductImages(html);
    
    console.log("Scraped product images:", productData);
    saveData(productData);
  } catch (error) {
    console.error("Error scraping images:", error);
  }
}

function saveData(data) {
  // Sanitize and truncate product name for filename
  let filename = data.product_name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || 'product';
  filename += '.json';

  const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const jsonA = document.createElement('a');
  jsonA.href = jsonUrl;
  jsonA.download = filename;
  jsonA.click();
  URL.revokeObjectURL(jsonUrl);
}

// Start the scraping process
scrapeProductImages();
