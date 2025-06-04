console.log("✅ Flipkart Chatbot script injected");

if (!document.getElementById("flipkart-ai-chatbot")) {
  const box = document.createElement("div");
  box.id = "flipkart-ai-chatbot";
  box.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    background: rgba(255,255,255,0.1); /* Glass White glassmorphism */
    border: 1.5px solid #cccccc; /* Light Gray border */
    padding: 12px;
    border-radius: 18px;
    box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    z-index: 99999;
    font-family: Arial, sans-serif;
    color: #1c1c1e; /* Charcoal text */
  `;

  box.innerHTML = `
    <h4 style="margin: 0 0 8px; color: #1c1c1e;">AI Chatbot (Flipkart)</h4>
    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; width: 100%;">
      <input type="hidden" id="provider" value="openai" />
      <input id="question" type="text" placeholder="Ask about the product..." style="flex: 1; padding: 10px; font-size: 16px; height: 40px; box-sizing: border-box; border-radius: 8px; border: 1.2px solid #cccccc; min-width: 0; background: rgba(255,255,255,0.25); color: #1c1c1e; outline: none; transition: border 0.2s;" />
      <button id="askBtn" style="height: 40px; width: 40px; display: flex; align-items: center; justify-content: center; padding: 0; font-size: 16px; border-radius: 8px; background: #1c1c1e; color: #fff; border: none; cursor: pointer; box-shadow: 0 2px 8px rgba(31,38,135,0.10); transition: background 0.2s;">
        <svg id="sendIcon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s cubic-bezier(.4,2,.6,1);">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
    <div id="response" style="margin-top: 10px; font-size: 14px; min-height: 38px; background: rgba(255,255,255,0.18); border-radius: 10px; border: 1px solid #cccccc; color: #1c1c1e; box-shadow: 0 2px 8px rgba(31,38,135,0.08); padding: 10px 12px; word-break: break-word;"></div>
  `;

  document.body.appendChild(box);

  // Add minimize/maximize functionality to the chatbot box
  const minimizeButton = document.createElement("button");
  minimizeButton.textContent = "_";
  minimizeButton.style = "position: absolute; top: 5px; right: 5px; background: rgba(255,255,255,0.18); border: 1px solid #cccccc; color: #1c1c1e; border-radius: 6px; font-size: 16px; cursor: pointer; padding: 2px 8px; transition: background 0.2s;";
  box.appendChild(minimizeButton);

  minimizeButton.addEventListener("click", () => {
    const isMinimized = box.style.height === "30px";
    if (isMinimized) {
      box.style.height = "auto";
      box.style.overflow = "visible";
      minimizeButton.textContent = "_";
      // Restore full glassy look
      box.style.background = "rgba(255,255,255,0.1)";
      box.style.border = "1.5px solid #cccccc";
      box.style.boxShadow = "0 8px 32px 0 rgba(31,38,135,0.18)";
      box.style.backdropFilter = "blur(16px) saturate(180%)";
      box.style.webkitBackdropFilter = "blur(16px) saturate(180%)";
      box.style.color = "#1c1c1e";
    } else {
      box.style.height = "30px";
      box.style.overflow = "hidden";
      minimizeButton.textContent = "⬆";
      // More compact, semi-transparent, and visually distinct minimized look
      box.style.background = "rgba(255,255,255,0.45)";
      box.style.border = "1.5px solid #cccccc";
      box.style.boxShadow = "0 2px 8px rgba(31,38,135,0.10)";
      box.style.backdropFilter = "blur(6px) saturate(120%)";
      box.style.webkitBackdropFilter = "blur(6px) saturate(120%)";
      box.style.color = "#1c1c1e";
    }
  });

  // Add buttons to run scripts
  const runScriptsButton = document.createElement("button");
  runScriptsButton.textContent = "Do Analysis";
  runScriptsButton.style = "margin-top: 10px; width: 100%; background: #1c1c1e; color: #fff; border: none; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(31,38,135,0.10); font-weight: bold; letter-spacing: 0.5px; cursor: pointer; transition: background 0.2s;";
  box.appendChild(runScriptsButton);

  // Robust function to extract product name from Flipkart product pages
  function getProductNameText() {
    // Try all known selectors in order of reliability
    const selectors = [
      'span.VU-ZEz', // New Flipkart product title
      'span.B_NuCI', // Old Flipkart product title
      'a.wjcEIp.AbG6iz', // Some variants
      'h1.yhB1nd', // Some mobile/variant layouts
      'h1.product-title',
      '.product-title',
      '.product-name',
      'h1', // Generic fallback
      'title', // Page title
      'meta[property="og:title"]',
      'meta[name="og:title"]',
      'meta[name="twitter:title"]',
    ];
    for (const sel of selectors) {
      let elem = document.querySelector(sel);
      if (elem) {
        if (elem.tagName === 'META') {
          const content = elem.getAttribute('content');
          if (content && content.length > 5) return content.trim();
        } else if (elem.innerText && elem.innerText.length > 3) {
          return elem.innerText.trim();
        }
      }
    }
    // Fallback: try to find the first large/visible heading with enough text
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
    for (const h of headings) {
      if (h.offsetParent !== null && h.innerText && h.innerText.length > 5) {
        return h.innerText.trim();
      }
    }
    // Fallback: try to find any element with a likely product name (long, not price, not rating)
    const candidates = Array.from(document.querySelectorAll('span, div, a'));
    for (const el of candidates) {
      const txt = el.innerText?.trim();
      if (txt && txt.length > 8 && !txt.match(/\d{1,3}[,\d]*\s*₹|\d+(\.\d+)?\s*stars?/i)) {
        return txt;
      }
    }
    return "Unknown Product";
  }

  // Function to extract the product name (now uses robust getProductNameText)
  function extractProductName() {
    return getProductNameText();
  }

  // Function to get the best resolution source from an image element
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

  // Function to simulate hover events on an element
  function simulateHover(element) {
    const mouseOverEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(mouseOverEvent);

    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(mouseEnterEvent);
  }

  // Function to extract high-resolution images
  async function extractHighResImages() {
    const images = [];
    const thumbnails = Array.from(document.querySelectorAll("img._0DkuPH"));
    console.log("Found", thumbnails.length, "thumbnails.");

    for (let i = 0; i < thumbnails.length; i++) {
      const thumb = thumbnails[i];
      thumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 500));
      simulateHover(thumb);
      console.log(`Hovered on thumbnail ${i + 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mainImageElement = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
      const extractedSrc = getBestResolutionSrc(mainImageElement);
      console.log(`Extracted image ${i + 1}: ${extractedSrc}`);
      if (extractedSrc && extractedSrc !== "N/A" && !images.includes(extractedSrc)) {
        images.push(extractedSrc);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return images;
  }

  // Function to scrape images and additional product details
  async function scrapeImages() {
    const productName = getProductNameText();
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


  // Reverting to the original `extractProductInfo` and `extractReviews` functions

  function extractProductInfo() {
    const info = {};

    const titleElem = document.querySelector("span.VU-ZEz") || document.querySelector("span.B_NuCI");
    info.product_name = titleElem ? titleElem.innerText.trim() : "N/A";

    const priceElem = document.querySelector("div.Nx9bqj") || document.querySelector("div._30jeq3");
    info.price = priceElem ? priceElem.innerText.trim() : "N/A";

    const ratingElem = document.querySelector("div.XQDdHH") || document.querySelector("div._3LWZlK");
    info.rating = ratingElem ? ratingElem.innerText.trim() : "N/A";

    const reviewStatElem = document.querySelector("span.Wphh3N") || document.querySelector("span._2_R_DZ");
    info.rating_summary = reviewStatElem ? reviewStatElem.innerText.trim() : "N/A";

    const sellerElem = document.querySelector("#sellerName span span") || document.querySelector("._3KOdleg span");
    info.seller_name = sellerElem ? sellerElem.innerText.trim() : "N/A";

    const sellerRatingElem = document.querySelector("#sellerName div.XQDdHH") || document.querySelector("#sellerName ._3LWZlK");
    info.seller_rating = sellerRatingElem ? sellerRatingElem.innerText.trim() : "N/A";

    const highlights = [];
    document.querySelectorAll("div.xFVion li, ul._2418kt li").forEach(li => {
      highlights.push(li.innerText.trim());
    });
    info.highlights = highlights;

    const descElem = document.querySelector('meta[name="Description"]');
    info.description = descElem ? descElem.getAttribute('content').trim() : "N/A";

    const specifications = {};
    document.querySelectorAll("div.GNDEQ- table._0ZhAN9 tbody tr").forEach(tr => {
      const keyElem = tr.querySelector("td.col-3-12");
      const valElem = tr.querySelector("td.col-9-12 li");
      if (keyElem && valElem) {
        const key = keyElem.innerText.trim();
        const value = valElem.innerText.trim();
        specifications[key] = value;
      }
    });
    info.specifications = specifications;

    const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
    info.main_image = mainImgElem ? mainImgElem.src : "N/A";

    return info;
  }

  function extractReviews() {
    const allReviews = [];

    const reviewContainers = document.querySelectorAll("div.col.EPCmJX, div._16PBlm, div.RcXBOT.QmfTqT");
    console.log(`Found ${reviewContainers.length} reviews on this page.`);

    reviewContainers.forEach(review => {
      try {
        const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K") || review.querySelector("div._3LWZlK._1BLPMq");
        const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

        const reviewTitleElem = review.querySelector("p.z9E0IG") || review.querySelector("p._2-N8zT");
        const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

        // --- MODIFIED SECTION TO EXTRACT THE REVIEW BODY TEXT ---
        // Try the common 'ZmyHeo' selector first, then fallback to others if needed
        const reviewBodyElem = review.querySelector("div.ZmyHeo") || review.querySelector('div._11pzQk'); // Try ZmyHeo first
        let reviewDesc = '';

        if (reviewBodyElem) {
          // The actual text might be in a nested div inside ZmyHeo
          // Or ZmyHeo itself might contain the text.
          // Let's get all text content and clean it up.
          let fullText = reviewBodyElem.innerText;

          // Remove "READ MORE" if it exists (often at the end)
          // Using a regex to match "READ MORE" potentially with leading/trailing spaces at the end of the string
          fullText = fullText.replace(/\s*READ MORE\s*$/, "").trim();
          reviewDesc = fullText;
        }

        if (!reviewDesc && reviewBodyElem) { // If still no desc but element was found
             console.warn("Review body element found, but innerText is empty or only 'READ MORE'. Selector:", reviewBodyElem.className);
        } else if (!reviewBodyElem) {
             console.warn("Could not find review body text element using selectors 'div.ZmyHeo' or 'div._11pzQk' for a review.");
        }
        // --- END MODIFIED SECTION ---

        const reviewerNameElem = review.querySelector("p.AwS1CA") || review.querySelector("p._2sc7ZR._2V5EHH");
        const reviewerName = reviewerNameElem ? reviewerNameElem.innerText.trim() : null;

        // Potential issue: review_date might be picking up reviewer_name again if selectors are too similar
        // For the data you provided, review_date is the same as reviewer_name.
        // Let's assume the original selectors were intentional for now, but this is a common pitfall.
        const reviewDateElem = review.querySelector("p._2NsDsF") || review.querySelector("p._2sc7ZR");
        let reviewDate = reviewDateElem ? reviewDateElem.innerText.trim() : null;

        // If reviewDate is the same as reviewerName, it's likely the date selector grabbed the name.
        // This is a heuristic and might need adjustment based on actual page structure.
        if (reviewDate === reviewerName && review.querySelectorAll("p._2sc7ZR").length > 1) {
            const dateCanditates = review.querySelectorAll("p._2sc7ZR");
            if (dateCanditates.length > 1) { // If there are multiple p._2sc7ZR, the second one is often date
                reviewDate = dateCanditates[1].innerText.trim();
            } else {
                // If only one, and it's the name, then actual date might be missing or different selector needed
                reviewDate = "Date N/A";
            }
        } else if (!reviewDate && reviewerName) {
             reviewDate = "Date N/A"; // If no date found
        }


        const reviewLocationElem = review.querySelector("span.MztJPv > span:nth-child(2)") || review.querySelector("p._2mcZGG");
        const reviewLocation = reviewLocationElem ? reviewLocationElem.innerText.trim() : null;

        const upvotesElem = review.querySelector("div._6kK6mk > span.tl9VpF") || review.querySelector("div._3c3Px5 > span:first-child");
        const upvotes = upvotesElem ? upvotesElem.innerText.trim() : "0";

        const downvotesElem = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF") || review.querySelector("div._3c3Px5 > span:last-child");
        const downvotes = downvotesElem ? downvotesElem.innerText.trim() : "0";

        allReviews.push({
          rating,
          review_title: reviewTitle,
          review_desc: reviewDesc, // Ensure this is populated
          reviewer_name: reviewerName,
          review_date: reviewDate,
          review_location: reviewLocation,
          upvotes,
          downvotes
        });

      } catch (e) {
        console.error("Error extracting one review:", e);
      }
    });
    console.log("Extracted reviews objects:", allReviews); // Add this to see what's being collected
    return allReviews;
  }

  

  // Function to send data to Flask server
  async function sendDataToFlask(productData, reviewsData) {
    try {
      const response = await fetch('http://127.0.0.1:5000/receive_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_info: productData,
          reviews: reviewsData
        })
      });
      if (response.ok) {
        const result = await response.json();
        console.log("Server response: ", result);
      } else {
        console.error("Failed to send data to Flask. Status:", response.status);
      }
    } catch (error) {
      console.error('Error sending data to Flask:', error);
    }
  }

  // Function to send images data to Flask server
  async function sendImagesToFlask(imagesData) {
    console.log("Sending images data to Flask:", imagesData); // Debug log
    const response = await fetch("http://127.0.0.1:5000/receive_images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ images: imagesData }),
    });
    console.log("Flask response for images:", await response.json()); // Debug log
  }

  // Function to show a styled notification card
  function showNotificationCard(productData, reviewsData, imagesData) {
    console.log("Displaying notification card with data:", { productData, reviewsData, imagesData }); // Debug log

    const notificationCard = document.createElement("div");
    notificationCard.className = "notification-card";

    notificationCard.innerHTML = `
      <div class="notification-content">
        <h3>Scraping Complete!</h3>
        <p><strong>Product:</strong> ${productData.product_name}</p>
        <p><strong>Price:</strong> ${productData.price}</p>
        <p><strong>Reviews:</strong> ${reviewsData.length}</p>
        <p><strong>Images:</strong> ${imagesData?.highResThumbnails?.length || 0}</p>
        <button id="closeNotification">Close</button>
      </div>
    `;

    document.body.appendChild(notificationCard);

    document.getElementById("closeNotification").addEventListener("click", () => {
      notificationCard.remove();
    });
  }

  // Function to show a styled alert
  function showStyledAlert(type, message) {
    const alertCard = document.createElement("div");
    alertCard.className = `card ${type}`;

    alertCard.innerHTML = `
      <div class="icon icon-anim ${type}">${type === "success" ? "✔️" : "❌"}</div>
      <h2>${type === "success" ? "Success!" : "Oooops!"}</h2>
      <p>${message}</p>
      <button id="continueButton">Continue</button>
      <button id="closeButton">Close</button>
    `;

    document.body.appendChild(alertCard);

    const continueButton = alertCard.querySelector("#continueButton");
    const closeButton = alertCard.querySelector("#closeButton");

    continueButton.addEventListener("click", () => {
        window.open("http://127.0.0.1:5000/", "_blank", "width=800,height=600");
    });

    closeButton.addEventListener("click", () => {
        alertCard.remove();
    });
  }

  // Updated Run Scripts button to include sending images data
  runScriptsButton.addEventListener("click", async () => {
    console.log("Run Scripts button clicked. Starting scraping...");

    const productData = extractProductInfo();
    const reviewsData = extractReviews();
    const imagesData = await scrapeImages();

    console.log("Scraped Data:", { productData, reviewsData, imagesData });

    await sendDataToFlask(productData, reviewsData);
    await sendImagesToFlask(imagesData);

    showStyledAlert("success", "Scraping completed successfully! Check the results.");
  });

  // Utility function to wait for an element to appear in the DOM
  const waitForElement = async (selector, timeout = 1000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.warn(`Element with selector '${selector}' not found within ${timeout}ms.`);
    return null;
  };

  // Updated the `extractProductDetails` function to use getProductNameText for title
  const extractProductDetails = async () => {
    try {
      const titleElement = await waitForElement(".VU-ZEz") || await waitForElement("span.B_NuCI");
      const priceElement = await waitForElement("div._30jeq3._16Jk6d");
      const offersElement = document.querySelector("div.cPHDOP div._0gKdrZ");

      const fallbackTitleElement = document.querySelector("h1.product-title") || document.querySelector(".product-name");
      const fallbackPriceElement = document.querySelector(".price") || document.querySelector(".product-price");

      // Use robust product name extraction
      const title = getProductNameText();
      // Try multiple selectors for price
      let price = null;
      if (priceElement && priceElement.innerText) {
        price = priceElement.innerText;
      } else if (fallbackPriceElement && fallbackPriceElement.innerText) {
        price = fallbackPriceElement.innerText;
      } else {
        // Try additional selectors for price
        const altPriceSelectors = [
          'div._30jeq3',
          'div.Nx9bqj',
          'div._25b18c ._30jeq3',
          'div._1vC4OE',
          'div.product-price',
          'span.price',
          'span._30jeq3',
          'span._1vC4OE',
        ];
        for (const sel of altPriceSelectors) {
          const el = document.querySelector(sel);
          if (el && el.innerText) {
            price = el.innerText;
            break;
          }
        }
      }
      if (!price) price = "Price not available";

      let offers = [];
      if (offersElement) {
        const offerItems = offersElement.querySelectorAll("li.kF1Ml8.col");
        offers = Array.from(offerItems).map((offer) => {
          const offerType = offer.querySelector("span.ynXjOy")?.innerText || "Unknown Offer";
          const offerDetails = offer.querySelector("span:nth-child(2)")?.innerText || "Details not available";
          return { offerType, offerDetails };
        });
      }

      if (!title || title === "Unknown Product") {
        console.warn("⚠️ Product title might be missing or dynamically loaded. Please check the page structure.");
      }

      if (!priceElement && !fallbackPriceElement) {
        console.warn("⚠️ Product price might be missing or dynamically loaded. Please check the page structure.");
      }

      return { title, price, offers };
    } catch (error) {
      console.error("❌ Error extracting product details:", error);
      return { title: "Error", price: "Error", offers: [] };
    }
  };

  const fetchHTML = async (url) => {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-IN,en;q=0.5",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  };

  const extractData = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const reviewsData = [];
    const reviewContainers = doc.querySelectorAll("div.col.EPCmJX");
    reviewContainers.forEach((review) => {
      const rating = review.querySelector("div.XQDdHH.Ga3i8K")?.firstChild?.textContent?.trim() || null;
      const reviewTitle = review.querySelector("p.z9E0IG")?.innerText?.trim() || null;
      const reviewDesc = review.querySelector("div.ZmyHeo")?.innerText?.replace("READ MORE", "").trim() || null;
      const reviewerName = review.querySelector("p.AwS1CA")?.innerText?.trim() || null;
      const reviewDate = review.querySelector("p._2NsDsF")?.innerText?.trim() || null;

      reviewsData.push({
        rating,
        review_title: reviewTitle,
        review_desc: reviewDesc,
        reviewer_name: reviewerName,
        review_date: reviewDate,
      });
    });

    return reviewsData;
  };

  const scrapeAllPages = async () => {
    const currentUrl = window.location.href;
    const totalPages = 2; // Limit to 2 pages for performance
    const urls = Array.from({ length: totalPages }, (_, i) => `${currentUrl}&page=${i + 1}`);

    const allReviews = [];
    for (const url of urls) {
      try {
        const html = await fetchHTML(url);
        const reviews = extractData(html);
        allReviews.push(...reviews);
      } catch (err) {
        console.error("Error fetching reviews from URL:", url, err);
      }
    }
    return allReviews;
  };

  // Function to search for a product by name
  const searchProductByName = async (productName) => {
    try {
      const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`;
      const html = await fetchHTML(searchUrl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const firstProductLink = doc.querySelector("a._1fQZEK, a.IRpwTa")?.href;
      if (!firstProductLink) {
        console.warn("No exact match found for the product. Redirecting to search results page.");
        return searchUrl; // Return the search results page URL as a fallback
      }

      return `https://www.flipkart.com${firstProductLink}`;
    } catch (error) {
      console.error("Error searching for product:", error);
      throw new Error("Unable to search for the product. Please check your network connection or try again later.");
    }
  };

  // Enhanced scrapeReviewsAndDetails to include product search
  const scrapeReviewsAndDetails = async (productName) => {
    const productUrl = await searchProductByName(productName);
    window.history.pushState({}, "", productUrl); // Update the URL in the browser

    const productDetails = await extractProductDetails();
    const reviews = await scrapeAllPages();

    return { ...productDetails, reviews };
  };

  // Update the chatbot to remember previous chats and use context
  const chatContext = [];

  // Function to clear chat history
  const clearChatHistory = () => {
    // Clear the in-memory chat context
    chatContext.length = 0;

    // Remove chat history from localStorage
    localStorage.removeItem("chatHistory");

    // Update the response box UI efficiently
    const responseBox = document.getElementById("response");
    responseBox.innerHTML = "<p>Chat history cleared.</p>";
  };

  // Remove the history option to avoid doubling the answer section
  const loadChatHistory = () => {
    const responseBox = document.getElementById("response");
    responseBox.innerHTML = "<p>Chat history is disabled </p>";
  };

  // Add CSS for improved chat display
  const style = document.createElement("style");
  style.textContent = `
    .chat-entry {
      border-bottom: 1px solid #cccccc;
      padding: 10px 0;
      margin-bottom: 10px;
      background: rgba(255,255,255,0.08);
      border-radius: 8px;
    }
    .chat-question {
      font-weight: bold;
      color: #1c1c1e;
    }
    .chat-answer {
      margin-top: 5px;
      color: #1c1c1e;
    }
    .chat-entry:last-child {
      border-bottom: none;
    }
    .card {
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      padding: 20px;
      border-radius: 16px;
      box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      text-align: center;
      font-family: Arial, sans-serif;
      background: rgba(255,255,255,0.1);
      border: 1.5px solid #cccccc;
      color: #1c1c1e;
    }
    .card.success {
      background: rgba(208,255,208,0.18);
      color: #1c1c1e;
      border: 1.5px solid #28a745;
    }
    .card.error {
      background: rgba(255,208,208,0.18);
      color: #1c1c1e;
      border: 1.5px solid #dc3545;
    }
    .card .icon {
      font-size: 50px;
      margin-bottom: 10px;
    }
    .card button {
      margin-top: 10px;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      background: #1c1c1e;
      color: #fff;
      font-weight: bold;
      transition: background 0.2s, color 0.2s, transform 0.18s cubic-bezier(.4,2,.6,1);
      box-shadow: 0 2px 8px rgba(31,38,135,0.10);
    }
    .card.success button {
      background: #28a745;
      color: white;
    }
    .card.error button {
      background: #dc3545;
      color: white;
    }
    .card button:hover {
      background: #cccccc;
      color: #1c1c1e;
      transform: scale(1.08) translateY(-2px) rotate(-2deg);
      box-shadow: 0 4px 16px 0 rgba(31,38,135,0.18);
    }
    #clearBtn {
      margin-top: 5px;
      width: 100%;
      background: #1c1c1e;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px 0;
      font-weight: bold;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(31,38,135,0.10);
      cursor: pointer;
      transition: background 0.2s;
    }
    #clearBtn:hover, .card button:hover, #askBtn:hover, .minimizeButton:hover, .runScriptsButton:hover {
      background: #cccccc;
      color: #1c1c1e;
    }
    .thinking-animation .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #1c1c1e;
      opacity: 0.5;
      margin-left: 2px;
      animation: thinking-bounce 1.2s infinite both;
    }
    .thinking-animation .dot1 { animation-delay: 0s; }
    .thinking-animation .dot2 { animation-delay: 0.2s; }
    .thinking-animation .dot3 { animation-delay: 0.4s; }
    @keyframes thinking-bounce {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1.3); opacity: 1; }
    }
    .thinking-word .thinking-letter {
      display: inline-block;
      animation: thinking-wave 1.2s infinite both;
    }
    .thinking-word .t0 { animation-delay: 0s; }
    .thinking-word .t1 { animation-delay: 0.08s; }
    .thinking-word .t2 { animation-delay: 0.16s; }
    .thinking-word .t3 { animation-delay: 0.24s; }
    .thinking-word .t4 { animation-delay: 0.32s; }
    .thinking-word .t5 { animation-delay: 0.40s; }
    .thinking-word .t6 { animation-delay: 0.48s; }
    .thinking-word .t7 { animation-delay: 0.56s; }
    @keyframes thinking-wave {
      0%, 80%, 100% { transform: translateY(0); color: #111; }
      40% { transform: translateY(-6px); color: #1c1c1e; }
    }
    .icon-anim {
      animation: icon-pop 0.7s cubic-bezier(.4,2,.6,1);
      display: inline-block;
      filter: drop-shadow(0 0 8px rgba(40,167,69,0.25));
    }
    .icon-anim.success {
      color: #28a745;
      filter: drop-shadow(0 0 12px #28a74588);
    }
    .icon-anim.error {
      color: #dc3545;
      filter: drop-shadow(0 0 12px #dc354588);
    }
    @keyframes icon-pop {
      0% { transform: scale(0.2); opacity: 0; }
      60% { transform: scale(1.3); opacity: 1; }
      80% { transform: scale(0.95); }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  const updateChatHistoryUI = (question, answer) => {
    // Instead of appending, just update the response box with the latest answer only
    const responseBox = document.getElementById("response");
    responseBox.textContent = answer;
  };

  // Load chat history on chatbot initialization
  loadChatHistory();

  // Add a clear button to the chatbot UI
  const clearButton = document.createElement("button");
  clearButton.id = "clearBtn";
  clearButton.textContent = "Clear History";
  clearButton.style = "margin-top: 5px; width: 100%; background: #1c1c1e; color: #fff; border: none; border-radius: 8px; padding: 8px 0; font-weight: bold; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(31,38,135,0.10); cursor: pointer; transition: background 0.2s;";
  document.getElementById("flipkart-ai-chatbot").appendChild(clearButton);

  // Attach event listener to the clear button
  clearButton.addEventListener("click", clearChatHistory);

  // Update the API call to include the selected country
  document.getElementById("askBtn").addEventListener("click", async () => {
    const question = document.getElementById("question").value;
    const provider = document.getElementById("provider").value;
    const country = "IN"; // Always use India
    const responseBox = document.getElementById("response");
    // Show thinking animation
    responseBox.innerHTML = `
      <div class="thinking-animation" style="display: flex; align-items: center; gap: 10px;">
        <span class="thinking-word" style="font-size: 16px; color: #111; display: inline-block;">
          <span class="thinking-letter t0">T</span><span class="thinking-letter t1">h</span><span class="thinking-letter t2">i</span><span class="thinking-letter t3">n</span><span class="thinking-letter t4">k</span><span class="thinking-letter t5">i</span><span class="thinking-letter t6">n</span><span class="thinking-letter t7">g</span>
        </span>
        <span class="dot dot1"></span>
        <span class="dot dot2"></span>
        <span class="dot dot3"></span>
      </div>
    `;

    try {
      // Use the current page's context for the question instead of searching from chat history
      const productData = await extractProductDetails();

      const res = await fetch(`http://localhost:3000/api/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          product: productData,
          context: [], // Clear context to avoid using chat history
          country,
        }),
      });

      const data = await res.json();
      const answer = data.answer || "No response.";
      responseBox.textContent = answer;

      // Dynamically update the chat history in the UI
      updateChatHistoryUI(question, answer);
    } catch (err) {
      responseBox.textContent = "Error: " + err.message;
    }
  });

  // Add CSS for thinking animation dots
  style.textContent += `
    .thinking-animation .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #1c1c1e;
      opacity: 0.5;
      margin-left: 2px;
      animation: thinking-bounce 1.2s infinite both;
    }
    .thinking-animation .dot1 { animation-delay: 0s; }
    .thinking-animation .dot2 { animation-delay: 0.2s; }
    .thinking-animation .dot3 { animation-delay: 0.4s; }
    @keyframes thinking-bounce {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1.3); opacity: 1; }
    }
    .thinking-word .thinking-letter {
      display: inline-block;
      animation: thinking-wave 1.2s infinite both;
    }
    .thinking-word .t0 { animation-delay: 0s; }
    .thinking-word .t1 { animation-delay: 0.08s; }
    .thinking-word .t2 { animation-delay: 0.16s; }
    .thinking-word .t3 { animation-delay: 0.24s; }
    .thinking-word .t4 { animation-delay: 0.32s; }
    .thinking-word .t5 { animation-delay: 0.40s; }
    .thinking-word .t6 { animation-delay: 0.48s; }
    .thinking-word .t7 { animation-delay: 0.56s; }
    @keyframes thinking-wave {
      0%, 80%, 100% { transform: translateY(0); color: #111; }
      40% { transform: translateY(-6px); color: #1c1c1e; }
    }
  `;

  // Animate send icon on click
  document.getElementById("askBtn").addEventListener("mousedown", () => {
    const sendIcon = document.getElementById("sendIcon");
    if (sendIcon) {
      sendIcon.style.transform = "translateX(8px) scale(1.2) rotate(-15deg)";
      setTimeout(() => {
        sendIcon.style.transform = "";
      }, 350);
    }
  });
}