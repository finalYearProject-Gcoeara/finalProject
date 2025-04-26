// // // // // // (async function () {
// // // // // //   async function fetchHTML(url) {
// // // // // //     console.log("Fetching URL:", url);
// // // // // //     const response = await fetch(url, {
// // // // // //       headers: {
// // // // // //         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
// // // // // //         "Accept-Language": "en-IN,en;q=0.5",
// // // // // //         "Accept-Encoding": "gzip, deflate, br",
// // // // // //         "Referer": "https://www.flipkart.com/"
// // // // // //       }
// // // // // //     });
// // // // // //     if (!response.ok) {
// // // // // //       throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
// // // // // //     }
// // // // // //     const text = await response.text();
// // // // // //     console.log("Fetched HTML length:", text.length);
// // // // // //     return text;
// // // // // //   }

// // // // // //   function wait(ms) {
// // // // // //     return new Promise(resolve => setTimeout(resolve, ms));
// // // // // //   }

// // // // // //   function sanitizeFilename(name, maxLength = 40) {
// // // // // //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength) || "product";
// // // // // //   }

// // // // // //   function extractData(html) {
// // // // // //     const parser = new DOMParser();
// // // // // //     const doc = parser.parseFromString(html, 'text/html');

// // // // // //     const productName = doc.querySelector("div.Vu3-9u.eCtPz5") 
// // // // // //       ? doc.querySelector("div.Vu3-9u.eCtPz5").innerText.trim() 
// // // // // //       : "N/A";
// // // // // //     const productName_New = doc.querySelector("p.VU-ZEz") 
// // // // // //       ? doc.querySelector("p.VU-ZEz").innerText.trim() 
// // // // // //       : "N/A";
// // // // // //     const salePrice = doc.querySelector("div.hl05eU")
// // // // // //       ? doc.querySelector("div.hl05eU").innerText.trim()
// // // // // //       : "N/A";
// // // // // //     const originalPrice = doc.querySelector("div.yRaY8j")
// // // // // //       ? doc.querySelector("div.yRaY8j").innerText.trim()
// // // // // //       : "N/A";
// // // // // //     const discount = doc.querySelector("div.UkUFwK span")
// // // // // //       ? doc.querySelector("div.UkUFwK span").innerText.trim()
// // // // // //       : "N/A";

// // // // // //     const reviewsData = [];
// // // // // //     const reviewContainers = doc.querySelectorAll("div.col.EPCmJX");

// // // // // //     console.log("Found", reviewContainers.length, "review containers on", productName);
// // // // // //     reviewContainers.forEach(review => {
// // // // // //       try {
// // // // // //         const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K");
// // // // // //         const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

// // // // // //         const reviewTitleElem = review.querySelector("p.z9E0IG");
// // // // // //         const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

// // // // // //         const reviewDescElem = review.querySelector("div.ZmyHeo");
// // // // // //         let reviewDesc = reviewDescElem ? reviewDescElem.innerText.trim() : null;
// // // // // //         if (reviewDesc && reviewDesc.includes("READ MORE")) {
// // // // // //           reviewDesc = reviewDesc.replace("READ MORE", "").trim();
// // // // // //         }

// // // // // //         const reviewerName = review.querySelector("p.AwS1CA") 
// // // // // //           ? review.querySelector("p.AwS1CA").innerText.trim() 
// // // // // //           : null;
// // // // // //         const reviewDate = review.querySelector("p._2NsDsF") 
// // // // // //           ? review.querySelector("p._2NsDsF").innerText.trim() 
// // // // // //           : null;
// // // // // //         const reviewLocation = review.querySelector("span.MztJPv > span:nth-child(2)") 
// // // // // //           ? review.querySelector("span.MztJPv > span:nth-child(2)").innerText.trim() 
// // // // // //           : null;
// // // // // //         const upvotes = review.querySelector("div._6kK6mk > span.tl9VpF") 
// // // // // //           ? review.querySelector("div._6kK6mk > span.tl9VpF").innerText.trim() 
// // // // // //           : "0";
// // // // // //         const downvotes = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF") 
// // // // // //           ? review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF").innerText.trim() 
// // // // // //           : "0";

// // // // // //         reviewsData.push({
// // // // // //           rating,
// // // // // //           review_title: reviewTitle,
// // // // // //           review_desc: reviewDesc,
// // // // // //           reviewer_name: reviewerName,
// // // // // //           review_date: reviewDate,
// // // // // //           review_location: reviewLocation,
// // // // // //           upvotes,
// // // // // //           downvotes
// // // // // //         });
// // // // // //       } catch (e) {
// // // // // //         console.error("Error parsing a review:", e);
// // // // // //       }
// // // // // //     });

// // // // // //     const nextPageElement = doc.querySelector("a._9QVEpD");
// // // // // //     const nextPageUrl = nextPageElement ? nextPageElement.href : null;
// // // // // //     if (nextPageUrl) {
// // // // // //       console.log("Next page URL found:", nextPageUrl);
// // // // // //     } else {
// // // // // //       console.log("No next page URL found.");
// // // // // //     }

// // // // // //     return {
// // // // // //       product_name: productName,
// // // // // //       product_title: productName_New,
// // // // // //       sale_price: salePrice,
// // // // // //       original_price: originalPrice,
// // // // // //       discount: discount,
// // // // // //       reviews: reviewsData,
// // // // // //       next_page: nextPageUrl
// // // // // //     };
// // // // // //   }

// // // // // //   async function scrapeAllPages() {
// // // // // //     const currentUrl = window.location.href;
// // // // // //     const pageUrls = await getAllPageUrls(currentUrl);
// // // // // //     console.log("Page URLs to scrape:", pageUrls);
// // // // // //     const allProductsData = [];

// // // // // //     for (let url of pageUrls) {
// // // // // //       console.log("Scraping URL:", url);
// // // // // //       try {
// // // // // //         const html = await fetchHTML(url);
// // // // // //         const productData = extractData(html);
// // // // // //         allProductsData.push(productData);
// // // // // //         await wait(1000);
// // // // // //       } catch (err) {
// // // // // //         console.error("Error fetching URL:", url, err);
// // // // // //       }
// // // // // //     }
// // // // // //     console.log("Scraping complete. Total pages scraped:", allProductsData.length);
// // // // // //     return allProductsData;
// // // // // //   }

// // // // // //   async function getAllPageUrls(currentUrl) {
// // // // // //     const totalPages = 10; // You can adjust here
// // // // // //     const urlObj = new URL(currentUrl);
// // // // // //     urlObj.searchParams.delete("page");

// // // // // //     const urls = [];
// // // // // //     for (let i = 1; i <= totalPages; i++) {
// // // // // //       const newUrl = new URL(urlObj.toString());
// // // // // //       newUrl.searchParams.set("page", i);
// // // // // //       urls.push(newUrl.toString());
// // // // // //     }
// // // // // //     return urls;
// // // // // //   }

// // // // // //   function convertToCSV(data) {
// // // // // //     const headers = [
// // // // // //       "rating", "review_title", "review_desc", "reviewer_name", 
// // // // // //       "review_date", "review_location", "upvotes", "downvotes",
// // // // // //       "product_name", "sale_price", "original_price", "discount"
// // // // // //     ];
// // // // // //     const rows = [headers.join(",")];

// // // // // //     data.forEach(product => {
// // // // // //       product.reviews.forEach(review => {
// // // // // //         const row = [
// // // // // //           review.rating,
// // // // // //           review.review_title,
// // // // // //           review.review_desc,
// // // // // //           review.reviewer_name,
// // // // // //           review.review_date,
// // // // // //           review.review_location,
// // // // // //           review.upvotes,
// // // // // //           review.downvotes,
// // // // // //           product.product_name,
// // // // // //           product.sale_price,
// // // // // //           product.original_price,
// // // // // //           product.discount
// // // // // //         ];
// // // // // //         rows.push(row.join(","));
// // // // // //       });
// // // // // //     });
// // // // // //     return rows.join("\n");
// // // // // //   }

// // // // // //   function saveData(data) {
// // // // // //     const baseFilename = data.length > 0 ? sanitizeFilename(data[0].product_name, 40) : "product";

// // // // // //     const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// // // // // //     const jsonUrl = URL.createObjectURL(jsonBlob);
// // // // // //     const jsonLink = document.createElement('a');
// // // // // //     jsonLink.href = jsonUrl;
// // // // // //     jsonLink.download = `${baseFilename}_info.json`;
// // // // // //     jsonLink.click();
// // // // // //     URL.revokeObjectURL(jsonUrl);

// // // // // //     const csvData = convertToCSV(data);
// // // // // //     const csvBlob = new Blob([csvData], { type: 'text/csv' });
// // // // // //     const csvUrl = URL.createObjectURL(csvBlob);
// // // // // //     const csvLink = document.createElement('a');
// // // // // //     csvLink.href = csvUrl;
// // // // // //     csvLink.download = `${baseFilename}_reviews.csv`;
// // // // // //     csvLink.click();
// // // // // //     URL.revokeObjectURL(csvUrl);
// // // // // //   }

// // // // // //   async function main() {
// // // // // //     console.log("Starting scraping using pagination URL construction...");
// // // // // //     const allPagesData = await scrapeAllPages();
// // // // // //     console.log("Combined scraped data:", allPagesData);

// // // // // //     saveData(allPagesData);

// // // // // //     alert(`Scraping done! Product: ${allPagesData[0]?.product_name || "unknown"}`);
// // // // // //   }

// // // // // //   main();
// // // // // // })();
// // // // // (async function() {
// // // // //   function wait(ms) {
// // // // //     return new Promise(resolve => setTimeout(resolve, ms));
// // // // //   }

// // // // //   function sanitizeFilename(name, maxLength = 40) {
// // // // //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength) || "product";
// // // // //   }

// // // // //   function extractProductInfo() {
// // // // //     const info = {};

// // // // //     // Product Title
// // // // //     const titleElem = document.querySelector("span.VU-ZEz");
// // // // //     info.product_name = titleElem ? titleElem.innerText.trim() : "N/A";

// // // // //     // Price
// // // // //     const priceElem = document.querySelector("div.Nx9bqj");
// // // // //     info.price = priceElem ? priceElem.innerText.trim() : "N/A";

// // // // //     // Rating
// // // // //     const ratingElem = document.querySelector("div.XQDdHH");
// // // // //     info.rating = ratingElem ? ratingElem.innerText.trim() : "N/A";

// // // // //     // Ratings and Reviews
// // // // //     const reviewStatElem = document.querySelector("span.Wphh3N");
// // // // //     info.rating_summary = reviewStatElem ? reviewStatElem.innerText.trim() : "N/A";

// // // // //     // Seller Name
// // // // //     const sellerElem = document.querySelector("#sellerName span span");
// // // // //     info.seller_name = sellerElem ? sellerElem.innerText.trim() : "N/A";

// // // // //     // Seller Rating
// // // // //     const sellerRatingElem = document.querySelector("#sellerName div.XQDdHH");
// // // // //     info.seller_rating = sellerRatingElem ? sellerRatingElem.innerText.trim() : "N/A";

// // // // //     // Highlights (like Type, Food Preference etc)
// // // // //     const highlights = [];
// // // // //     document.querySelectorAll("div.xFVion li").forEach(li => {
// // // // //       highlights.push(li.innerText.trim());
// // // // //     });
// // // // //     info.highlights = highlights;

// // // // //     // Description
// // // // //     const descElem = document.querySelector("div._4gvKMe p");
// // // // //     info.description = descElem ? descElem.innerText.trim() : "N/A";

// // // // //     // Specifications (General)
// // // // //     const specifications = {};
// // // // //     document.querySelectorAll("div.GNDEQ- table._0ZhAN9 tbody tr").forEach(tr => {
// // // // //       const keyElem = tr.querySelector("td.col-3-12");
// // // // //       const valElem = tr.querySelector("td.col-9-12 li");
// // // // //       if (keyElem && valElem) {
// // // // //         const key = keyElem.innerText.trim();
// // // // //         const value = valElem.innerText.trim();
// // // // //         specifications[key] = value;
// // // // //       }
// // // // //     });
// // // // //     info.specifications = specifications;

// // // // //     // Main Image
// // // // //     const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // // //     info.main_image = mainImgElem ? mainImgElem.src : "N/A";

// // // // //     return info;
// // // // //   }

// // // // //   function saveToFile(data) {
// // // // //     const filename = `${sanitizeFilename(data.product_name)}_info.json`;
// // // // //     const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// // // // //     const url = URL.createObjectURL(blob);

// // // // //     const a = document.createElement('a');
// // // // //     a.href = url;
// // // // //     a.download = filename;
// // // // //     document.body.appendChild(a);
// // // // //     a.click();
// // // // //     document.body.removeChild(a);
// // // // //     URL.revokeObjectURL(url);
// // // // //   }

// // // // //   async function main() {
// // // // //     console.log("Extracting full product info...");
// // // // //     await wait(500);

// // // // //     const productData = extractProductInfo();
// // // // //     console.log("Extracted Product Data:", productData);

// // // // //     saveToFile(productData);
// // // // //     alert(`Extraction Done! Product: ${productData.product_name}`);
// // // // //   }

// // // // //   main();
// // // // // })();
// // // // (async function () {
// // // //   function wait(ms) {
// // // //     return new Promise(resolve => setTimeout(resolve, ms));
// // // //   }

// // // //   function sanitizeFilename(name, maxLength = 40) {
// // // //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength) || "product";
// // // //   }

// // // //   function extractProductInfo() {
// // // //     const info = {};

// // // //     // Product Title
// // // //     const titleElem = document.querySelector("span.VU-ZEz");
// // // //     info.product_name = titleElem ? titleElem.innerText.trim() : "N/A";

// // // //     // Price
// // // //     const priceElem = document.querySelector("div.Nx9bqj");
// // // //     info.price = priceElem ? priceElem.innerText.trim() : "N/A";

// // // //     // Rating
// // // //     const ratingElem = document.querySelector("div.XQDdHH");
// // // //     info.rating = ratingElem ? ratingElem.innerText.trim() : "N/A";

// // // //     // Ratings and Reviews
// // // //     const reviewStatElem = document.querySelector("span.Wphh3N");
// // // //     info.rating_summary = reviewStatElem ? reviewStatElem.innerText.trim() : "N/A";

// // // //     // Seller Name
// // // //     const sellerElem = document.querySelector("#sellerName span span");
// // // //     info.seller_name = sellerElem ? sellerElem.innerText.trim() : "N/A";

// // // //     // Seller Rating
// // // //     const sellerRatingElem = document.querySelector("#sellerName div.XQDdHH");
// // // //     info.seller_rating = sellerRatingElem ? sellerRatingElem.innerText.trim() : "N/A";

// // // //     // Highlights
// // // //     const highlights = [];
// // // //     document.querySelectorAll("div.xFVion li").forEach(li => {
// // // //       highlights.push(li.innerText.trim());
// // // //     });
// // // //     info.highlights = highlights;

// // // //     // Description
// // // //     const descElem = document.querySelector("div._4gvKMe p");
// // // //     info.description = descElem ? descElem.innerText.trim() : "N/A";

// // // //     // Specifications
// // // //     const specifications = {};
// // // //     document.querySelectorAll("div.GNDEQ- table._0ZhAN9 tbody tr").forEach(tr => {
// // // //       const keyElem = tr.querySelector("td.col-3-12");
// // // //       const valElem = tr.querySelector("td.col-9-12 li");
// // // //       if (keyElem && valElem) {
// // // //         const key = keyElem.innerText.trim();
// // // //         const value = valElem.innerText.trim();
// // // //         specifications[key] = value;
// // // //       }
// // // //     });
// // // //     info.specifications = specifications;

// // // //     // Main Image
// // // //     const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // // //     info.main_image = mainImgElem ? mainImgElem.src : "N/A";

// // // //     return info;
// // // //   }

// // // //   function extractReviews() {
// // // //     const allReviews = [];

// // // //     const reviewContainers = document.querySelectorAll("div.col.EPCmJX");
// // // //     console.log(`Found ${reviewContainers.length} reviews on this page.`);

// // // //     reviewContainers.forEach(review => {
// // // //       try {
// // // //         const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K");
// // // //         const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

// // // //         const reviewTitleElem = review.querySelector("p.z9E0IG");
// // // //         const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

// // // //         const reviewDescElem = review.querySelector("div.ZmyHeo");
// // // //         let reviewDesc = reviewDescElem ? reviewDescElem.innerText.trim() : null;
// // // //         if (reviewDesc && reviewDesc.includes("READ MORE")) {
// // // //           reviewDesc = reviewDesc.replace("READ MORE", "").trim();
// // // //         }

// // // //         const reviewerNameElem = review.querySelector("p.AwS1CA");
// // // //         const reviewerName = reviewerNameElem ? reviewerNameElem.innerText.trim() : null;

// // // //         const reviewDateElem = review.querySelector("p._2NsDsF");
// // // //         const reviewDate = reviewDateElem ? reviewDateElem.innerText.trim() : null;

// // // //         const reviewLocationElem = review.querySelector("span.MztJPv > span:nth-child(2)");
// // // //         const reviewLocation = reviewLocationElem ? reviewLocationElem.innerText.trim() : null;

// // // //         const upvotesElem = review.querySelector("div._6kK6mk > span.tl9VpF");
// // // //         const upvotes = upvotesElem ? upvotesElem.innerText.trim() : "0";

// // // //         const downvotesElem = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF");
// // // //         const downvotes = downvotesElem ? downvotesElem.innerText.trim() : "0";

// // // //         allReviews.push({
// // // //           rating,
// // // //           review_title: reviewTitle,
// // // //           review_desc: reviewDesc,
// // // //           reviewer_name: reviewerName,
// // // //           review_date: reviewDate,
// // // //           review_location: reviewLocation,
// // // //           upvotes,
// // // //           downvotes
// // // //         });

// // // //       } catch (e) {
// // // //         console.error("Error extracting one review:", e);
// // // //       }
// // // //     });

// // // //     return allReviews;
// // // //   }

// // // //   function saveToFile(data, filename) {
// // // //     const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// // // //     const url = URL.createObjectURL(blob);

// // // //     const a = document.createElement('a');
// // // //     a.href = url;
// // // //     a.download = filename;
// // // //     document.body.appendChild(a);
// // // //     a.click();
// // // //     document.body.removeChild(a);
// // // //     URL.revokeObjectURL(url);
// // // //   }

// // // //   async function main() {
// // // //     console.log("Starting full extraction (product info + reviews)...");
// // // //     await wait(500);

// // // //     const productData = extractProductInfo();
// // // //     const reviewsData = extractReviews();

// // // //     const fullData = {
// // // //       product_info: productData,
// // // //       reviews: reviewsData
// // // //     };

// // // //     console.log("Extracted Full Data:", fullData);

// // // //     const filename = `${sanitizeFilename(productData.product_name)}_full.json`;
// // // //     saveToFile(fullData, filename);

// // // //     alert(`Full extraction done! Product: ${productData.product_name}, Reviews: ${reviewsData.length}`);
// // // //   }

// // // //   main();
// // // // })();
// // // (async function () {
// // //   function wait(ms) {
// // //     return new Promise(resolve => setTimeout(resolve, ms));
// // //   }

// // //   function sanitizeFilename(name, maxLength = 40) {
// // //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength) || "product";
// // //   }

// // //   function extractProductInfo() {
// // //     const info = {};

// // //     // Product Title
// // //     const titleElem = document.querySelector("span.VU-ZEz");
// // //     console.log("Title Element:", titleElem); // Debug log
// // //     info.product_name = titleElem ? titleElem.innerText.trim() : "N/A";

// // //     // Price
// // //     const priceElem = document.querySelector("div.Nx9bqj");
// // //     console.log("Price Element:", priceElem); // Debug log
// // //     info.price = priceElem ? priceElem.innerText.trim() : "N/A";

// // //     // Rating
// // //     const ratingElem = document.querySelector("div.XQDdHH");
// // //     console.log("Rating Element:", ratingElem); // Debug log
// // //     info.rating = ratingElem ? ratingElem.innerText.trim() : "N/A";

// // //     // Ratings and Reviews
// // //     const reviewStatElem = document.querySelector("span.Wphh3N");
// // //     console.log("Review Stat Element:", reviewStatElem); // Debug log
// // //     info.rating_summary = reviewStatElem ? reviewStatElem.innerText.trim() : "N/A";

// // //     // Seller Name
// // //     const sellerElem = document.querySelector("#sellerName span span");
// // //     console.log("Seller Name Element:", sellerElem); // Debug log
// // //     info.seller_name = sellerElem ? sellerElem.innerText.trim() : "N/A";

// // //     // Seller Rating
// // //     const sellerRatingElem = document.querySelector("#sellerName div.XQDdHH");
// // //     console.log("Seller Rating Element:", sellerRatingElem); // Debug log
// // //     info.seller_rating = sellerRatingElem ? sellerRatingElem.innerText.trim() : "N/A";

// // //     // Highlights
// // //     const highlights = [];
// // //     document.querySelectorAll("div.xFVion li").forEach(li => {
// // //       highlights.push(li.innerText.trim());
// // //     });
// // //     console.log("Highlights:", highlights); // Debug log
// // //     info.highlights = highlights;

// // //     // Description
// // //     const descElem = document.querySelector("div._4gvKMe p");
// // //     console.log("Description Element:", descElem); // Debug log
// // //     info.description = descElem ? descElem.innerText.trim() : "N/A";

// // //     // Specifications
// // //     const specifications = {};
// // //     document.querySelectorAll("div.GNDEQ- table._0ZhAN9 tbody tr").forEach(tr => {
// // //       const keyElem = tr.querySelector("td.col-3-12");
// // //       const valElem = tr.querySelector("td.col-9-12 li");
// // //       if (keyElem && valElem) {
// // //         const key = keyElem.innerText.trim();
// // //         const value = valElem.innerText.trim();
// // //         specifications[key] = value;
// // //       }
// // //     });
// // //     console.log("Specifications:", specifications); // Debug log
// // //     info.specifications = specifications;

// // //     // Main Image
// // //     const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
// // //     console.log("Main Image Element:", mainImgElem); // Debug log
// // //     info.main_image = mainImgElem ? mainImgElem.src : "N/A";

// // //     return info;
// // //   }

// // //   function extractReviewsFromPage() {
// // //     const pageReviews = [];

// // //     const reviewContainers = document.querySelectorAll("div.col.EPCmJX");
// // //     console.log(`Found ${reviewContainers.length} reviews on this page.`);

// // //     reviewContainers.forEach(review => {
// // //       try {
// // //         const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K");
// // //         const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

// // //         const reviewTitleElem = review.querySelector("p.z9E0IG");
// // //         const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

// // //         const reviewDescElem = review.querySelector("div.ZmyHeo");
// // //         let reviewDesc = reviewDescElem ? reviewDescElem.innerText.trim() : null;
// // //         if (reviewDesc && reviewDesc.includes("READ MORE")) {
// // //           reviewDesc = reviewDesc.replace("READ MORE", "").trim();
// // //         }

// // //         const reviewerNameElem = review.querySelector("p.AwS1CA");
// // //         const reviewerName = reviewerNameElem ? reviewerNameElem.innerText.trim() : null;

// // //         const reviewDateElem = review.querySelector("p._2NsDsF");
// // //         const reviewDate = reviewDateElem ? reviewDateElem.innerText.trim() : null;

// // //         const reviewLocationElem = review.querySelector("span.MztJPv > span:nth-child(2)");
// // //         const reviewLocation = reviewLocationElem ? reviewLocationElem.innerText.trim() : null;

// // //         const upvotesElem = review.querySelector("div._6kK6mk > span.tl9VpF");
// // //         const upvotes = upvotesElem ? upvotesElem.innerText.trim() : "0";

// // //         const downvotesElem = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF");
// // //         const downvotes = downvotesElem ? downvotesElem.innerText.trim() : "0";

// // //         pageReviews.push({
// // //           rating,
// // //           review_title: reviewTitle,
// // //           review_desc: reviewDesc,
// // //           reviewer_name: reviewerName,
// // //           review_date: reviewDate,
// // //           review_location: reviewLocation,
// // //           upvotes,
// // //           downvotes
// // //         });

// // //       } catch (e) {
// // //         console.error("Error extracting one review:", e);
// // //       }
// // //     });

// // //     console.log(`Extracted ${pageReviews.length} reviews from this page.`); // Debug log
// // //     return pageReviews;
// // //   }

// // //   async function scrapeReviews(minReviews = 10, maxReviews = 50) {
// // //     const collectedReviews = [];

// // //     while (true) {
// // //       await wait(3000); // Adjust wait time for content to load
// // //       const newReviews = extractReviewsFromPage();
// // //       console.log(`Reviews collected this round: ${newReviews.length}`); // Debug log
// // //       collectedReviews.push(...newReviews);

// // //       console.log(`Total reviews collected: ${collectedReviews.length}`);

// // //       if (collectedReviews.length >= maxReviews) break;

// // //       const nextBtn = document.querySelector('a._9QVEpD'); // "Next" button
// // //       if (nextBtn && !nextBtn.getAttribute('aria-disabled')) {
// // //         nextBtn.scrollIntoView({ behavior: "smooth", block: "center" });
// // //         await wait(500);
// // //         nextBtn.click();
// // //         await wait(3000);
// // //       } else {
// // //         console.log("No more next page available.");
// // //         break;
// // //       }

// // //       if (collectedReviews.length >= minReviews && !nextBtn) {
// // //         break;
// // //       }
// // //     }

// // //     return collectedReviews.slice(0, maxReviews); // Limit max if more
// // //   }

// // //   function saveToFile(data, filename) {
// // //     const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// // //     const url = URL.createObjectURL(blob);

// // //     const a = document.createElement('a');
// // //     a.href = url;
// // //     a.download = filename;
// // //     document.body.appendChild(a);
// // //     a.click();
// // //     document.body.removeChild(a);
// // //     URL.revokeObjectURL(url);
// // //   }

// // //   async function main() {
// // //     console.log("Starting full extraction (product info + reviews)...");

// // //     await wait(3000); // Wait for page to load before extracting data

// // //     const productData = extractProductInfo();
// // //     console.log("Product Data:", productData); // Debug log

// // //     const reviewsData = await scrapeReviews(10, 50);
// // //     console.log("Reviews Data:", reviewsData); // Debug log

// // //     const fullData = {
// // //       product_info: productData,
// // //       reviews: reviewsData
// // //     };

// // //     console.log("Extracted Full Data:", fullData);

// // //     const filename = `${sanitizeFilename(productData.product_name)}_full.json`;
// // //     saveToFile(fullData, filename);

// // //     alert(`Full extraction done! Product: ${productData.product_name}, Reviews: ${reviewsData.length}`);
// // //   }

// // //   main();
// // // })();

// // (async function () {
// //   function wait(ms) {
// //     return new Promise(resolve => setTimeout(resolve, ms));
// //   }

// //   function sanitizeFilename(name, maxLength = 40) {
// //     return name.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength) || "reviews";
// //   }

// //   function extractReviews() {
// //     const allReviews = [];

// //     const reviewContainers = document.querySelectorAll("div.col.EPCmJX");
// //     console.log(`Found ${reviewContainers.length} reviews on this page.`);

// //     reviewContainers.forEach(review => {
// //       try {
// //         const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K");
// //         const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

// //         const reviewTitleElem = review.querySelector("p.z9E0IG");
// //         const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

// //         const reviewDescElem = review.querySelector("div.ZmyHeo");
// //         let reviewDesc = reviewDescElem ? reviewDescElem.innerText.trim() : null;
// //         if (reviewDesc && reviewDesc.includes("READ MORE")) {
// //           reviewDesc = reviewDesc.replace("READ MORE", "").trim();
// //         }

// //         const reviewerNameElem = review.querySelector("p.AwS1CA");
// //         const reviewerName = reviewerNameElem ? reviewerNameElem.innerText.trim() : null;

// //         const reviewDateElem = review.querySelector("p._2NsDsF");
// //         const reviewDate = reviewDateElem ? reviewDateElem.innerText.trim() : null;

// //         const reviewLocationElem = review.querySelector("span.MztJPv > span:nth-child(2)");
// //         const reviewLocation = reviewLocationElem ? reviewLocationElem.innerText.trim() : null;

// //         const upvotesElem = review.querySelector("div._6kK6mk > span.tl9VpF");
// //         const upvotes = upvotesElem ? upvotesElem.innerText.trim() : "0";

// //         const downvotesElem = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF");
// //         const downvotes = downvotesElem ? downvotesElem.innerText.trim() : "0";

// //         allReviews.push({
// //           rating,
// //           review_title: reviewTitle,
// //           review_desc: reviewDesc,
// //           reviewer_name: reviewerName,
// //           review_date: reviewDate,
// //           review_location: reviewLocation,
// //           upvotes,
// //           downvotes
// //         });

// //       } catch (e) {
// //         console.error("Error extracting one review:", e);
// //       }
// //     });

// //     return allReviews;
// //   }

// //   function saveToFile(data, filename) {
// //     const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// //     const url = URL.createObjectURL(blob);

// //     const a = document.createElement('a');
// //     a.href = url;
// //     a.download = filename;
// //     document.body.appendChild(a);
// //     a.click();
// //     document.body.removeChild(a);
// //     URL.revokeObjectURL(url);
// //   }

// //   async function main() {
// //     console.log("Starting review extraction...");
// //     await wait(500);

// //     const productNameElem = document.querySelector("span.VU-ZEz") || document.querySelector("p.VU-ZEz");
// //     const productName = productNameElem ? productNameElem.innerText.trim() : "product";

// //     const reviewsData = extractReviews();
// //     console.log("Extracted Reviews:", reviewsData);

// //     const filename = `${sanitizeFilename(productName)}_reviews.json`;
// //     saveToFile(reviewsData, filename);

// //     alert(`Review extraction done! Extracted ${reviewsData.length} reviews for "${productName}"`);
// //   }

// //   main();
// // })();
// (async function () {
//   function wait(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }

//   function sanitizeFilename(name, maxLength = 40) {
//     return name.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength) || "product";
//   }

//   function extractProductInfo() {
//     const info = {};

//     // Product Title
//     const titleElem = document.querySelector("span.VU-ZEz");
//     info.product_name = titleElem ? titleElem.innerText.trim() : "N/A";

//     // Price
//     const priceElem = document.querySelector("div.Nx9bqj");
//     info.price = priceElem ? priceElem.innerText.trim() : "N/A";

//     // Rating
//     const ratingElem = document.querySelector("div.XQDdHH");
//     info.rating = ratingElem ? ratingElem.innerText.trim() : "N/A";

//     // Ratings and Reviews
//     const reviewStatElem = document.querySelector("span.Wphh3N");
//     info.rating_summary = reviewStatElem ? reviewStatElem.innerText.trim() : "N/A";

//     // Seller Name
//     const sellerElem = document.querySelector("#sellerName span span");
//     info.seller_name = sellerElem ? sellerElem.innerText.trim() : "N/A";

//     // Seller Rating
//     const sellerRatingElem = document.querySelector("#sellerName div.XQDdHH");
//     info.seller_rating = sellerRatingElem ? sellerRatingElem.innerText.trim() : "N/A";

//     // Highlights
//     const highlights = [];
//     document.querySelectorAll("div.xFVion li").forEach(li => {
//       highlights.push(li.innerText.trim());
//     });
//     info.highlights = highlights;

//     // Description
//     const descElem = document.querySelector("div._4gvKMe p");
//     info.description = descElem ? descElem.innerText.trim() : "N/A";

//     // Specifications
//     const specifications = {};
//     document.querySelectorAll("div.GNDEQ- table._0ZhAN9 tbody tr").forEach(tr => {
//       const keyElem = tr.querySelector("td.col-3-12");
//       const valElem = tr.querySelector("td.col-9-12 li");
//       if (keyElem && valElem) {
//         const key = keyElem.innerText.trim();
//         const value = valElem.innerText.trim();
//         specifications[key] = value;
//       }
//     });
//     info.specifications = specifications;

//     // Main Image
//     const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
//     info.main_image = mainImgElem ? mainImgElem.src : "N/A";

//     return info;
//   }

//   function extractReviews() {
//     const allReviews = [];

//     const reviewContainers = document.querySelectorAll("div.col.EPCmJX");
//     console.log(`Found ${reviewContainers.length} reviews on this page.`);

//     reviewContainers.forEach(review => {
//       try {
//         const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K");
//         const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

//         const reviewTitleElem = review.querySelector("p.z9E0IG");
//         const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

//         const reviewDescElem = review.querySelector("div.ZmyHeo");
//         let reviewDesc = reviewDescElem ? reviewDescElem.innerText.trim() : null;
//         if (reviewDesc && reviewDesc.includes("READ MORE")) {
//           reviewDesc = reviewDesc.replace("READ MORE", "").trim();
//         }

//         const reviewerNameElem = review.querySelector("p.AwS1CA");
//         const reviewerName = reviewerNameElem ? reviewerNameElem.innerText.trim() : null;

//         const reviewDateElem = review.querySelector("p._2NsDsF");
//         const reviewDate = reviewDateElem ? reviewDateElem.innerText.trim() : null;

//         const reviewLocationElem = review.querySelector("span.MztJPv > span:nth-child(2)");
//         const reviewLocation = reviewLocationElem ? reviewLocationElem.innerText.trim() : null;

//         const upvotesElem = review.querySelector("div._6kK6mk > span.tl9VpF");
//         const upvotes = upvotesElem ? upvotesElem.innerText.trim() : "0";

//         const downvotesElem = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF");
//         const downvotes = downvotesElem ? downvotesElem.innerText.trim() : "0";

//         allReviews.push({
//           rating,
//           review_title: reviewTitle,
//           review_desc: reviewDesc,
//           reviewer_name: reviewerName,
//           review_date: reviewDate,
//           review_location: reviewLocation,
//           upvotes,
//           downvotes
//         });

//       } catch (e) {
//         console.error("Error extracting one review:", e);
//       }
//     });

//     return allReviews;
//   }

//   function saveToFile(data, filename) {
//     const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);

//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   }

//   async function main() {
//     console.log("Starting full extraction (product info + reviews)...");
//     await wait(500);

//     const productData = extractProductInfo();
//     const reviewsData = extractReviews();

//     const fullData = {
//       product_info: productData,
//       reviews: reviewsData
//     };

//     console.log("Extracted Full Data:", fullData);

//     const filename = `${sanitizeFilename(productData.product_name)}_full.json`;
//     saveToFile(fullData, filename);

//     alert(`Full extraction done! Product: ${productData.product_name}, Reviews: ${reviewsData.length}`);
//   }

//   main();
// })();
// (async function () {
//   function wait(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }

//   function sanitizeFilename(name, maxLength = 40) {
//     return name.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength) || "product";
//   }

//   function extractProductInfo() {
//     const info = {};

//     const titleElem = document.querySelector("span.VU-ZEz");
//     info.product_name = titleElem ? titleElem.innerText.trim() : "N/A";

//     const priceElem = document.querySelector("div.Nx9bqj");
//     info.price = priceElem ? priceElem.innerText.trim() : "N/A";

//     const ratingElem = document.querySelector("div.XQDdHH");
//     info.rating = ratingElem ? ratingElem.innerText.trim() : "N/A";

//     const reviewStatElem = document.querySelector("span.Wphh3N");
//     info.rating_summary = reviewStatElem ? reviewStatElem.innerText.trim() : "N/A";

//     const sellerElem = document.querySelector("#sellerName span span");
//     info.seller_name = sellerElem ? sellerElem.innerText.trim() : "N/A";

//     const sellerRatingElem = document.querySelector("#sellerName div.XQDdHH");
//     info.seller_rating = sellerRatingElem ? sellerRatingElem.innerText.trim() : "N/A";

//     const highlights = [];
//     document.querySelectorAll("div.xFVion li").forEach(li => {
//       highlights.push(li.innerText.trim());
//     });
//     info.highlights = highlights;

//     const descElem = document.querySelector("div._4gvKMe p");
//     info.description = descElem ? descElem.innerText.trim() : "N/A";

//     const specifications = {};
//     document.querySelectorAll("div.GNDEQ- table._0ZhAN9 tbody tr").forEach(tr => {
//       const keyElem = tr.querySelector("td.col-3-12");
//       const valElem = tr.querySelector("td.col-9-12 li");
//       if (keyElem && valElem) {
//         const key = keyElem.innerText.trim();
//         const value = valElem.innerText.trim();
//         specifications[key] = value;
//       }
//     });
//     info.specifications = specifications;

//     const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H");
//     info.main_image = mainImgElem ? mainImgElem.src : "N/A";

//     return info;
//   }

//   function extractReviews() {
//     const allReviews = [];

//     const reviewContainers = document.querySelectorAll("div.col.EPCmJX");
//     console.log(`Found ${reviewContainers.length} reviews on this page.`);

//     reviewContainers.forEach(review => {
//       try {
//         const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K");
//         const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

//         const reviewTitleElem = review.querySelector("p.z9E0IG");
//         const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

//         const reviewDescElem = review.querySelector("div.ZmyHeo");
//         let reviewDesc = reviewDescElem ? reviewDescElem.innerText.trim() : null;
//         if (reviewDesc && reviewDesc.includes("READ MORE")) {
//           reviewDesc = reviewDesc.replace("READ MORE", "").trim();
//         }

//         const reviewerNameElem = review.querySelector("p.AwS1CA");
//         const reviewerName = reviewerNameElem ? reviewerNameElem.innerText.trim() : null;

//         const reviewDateElem = review.querySelector("p._2NsDsF");
//         const reviewDate = reviewDateElem ? reviewDateElem.innerText.trim() : null;

//         const reviewLocationElem = review.querySelector("span.MztJPv > span:nth-child(2)");
//         const reviewLocation = reviewLocationElem ? reviewLocationElem.innerText.trim() : null;

//         const upvotesElem = review.querySelector("div._6kK6mk > span.tl9VpF");
//         const upvotes = upvotesElem ? upvotesElem.innerText.trim() : "0";

//         const downvotesElem = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF");
//         const downvotes = downvotesElem ? downvotesElem.innerText.trim() : "0";

//         allReviews.push({
//           rating,
//           review_title: reviewTitle,
//           review_desc: reviewDesc,
//           reviewer_name: reviewerName,
//           review_date: reviewDate,
//           review_location: reviewLocation,
//           upvotes,
//           downvotes
//         });

//       } catch (e) {
//         console.error("Error extracting one review:", e);
//       }
//     });

//     return allReviews;
//   }

//   async function sendDataToFlask(productData, reviewsData) {
//     try {
//       const response = await fetch('http://127.0.0.1:5000/receive_data', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           product_info: productData,
//           reviews: reviewsData,
//         }),
//       });

//       const result = await response.json();
//       console.log("Server response: ", result);
//     } catch (error) {
//       console.error('Error sending data to Flask:', error);
//     }
//   }

//   async function main() {
//     console.log("Starting full extraction (product info + reviews)...");

//     const productData = extractProductInfo();
//     const reviewsData = extractReviews();

//     console.log("Extracted Data:", { productData, reviewsData });

//     // Send the extracted data to Flask
//     await sendDataToFlask(productData, reviewsData);

//     alert(`Full extraction done! Product: ${productData.product_name}, Reviews: ${reviewsData.length}`);
//   }

//   main();
// })();
(async function () {
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function sanitizeFilename(name, maxLength = 40) {
    return name.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength) || "product";
  }

  function extractProductInfo() {
    const info = {};

    const titleElem = document.querySelector("span.VU-ZEz");
    info.product_name = titleElem ? titleElem.innerText.trim() : "N/A";

    const priceElem = document.querySelector("div.Nx9bqj");
    info.price = priceElem ? priceElem.innerText.trim() : "N/A";

    const ratingElem = document.querySelector("div.XQDdHH");
    info.rating = ratingElem ? ratingElem.innerText.trim() : "N/A";

    const reviewStatElem = document.querySelector("span.Wphh3N");
    info.rating_summary = reviewStatElem ? reviewStatElem.innerText.trim() : "N/A";

    const sellerElem = document.querySelector("#sellerName span span");
    info.seller_name = sellerElem ? sellerElem.innerText.trim() : "N/A";

    const sellerRatingElem = document.querySelector("#sellerName div.XQDdHH");
    info.seller_rating = sellerRatingElem ? sellerRatingElem.innerText.trim() : "N/A";

    const highlights = [];
    document.querySelectorAll("div.xFVion li").forEach(li => {
      highlights.push(li.innerText.trim());
    });
    info.highlights = highlights;

    const descElem = document.querySelector("div._4gvKMe p");
    info.description = descElem ? descElem.innerText.trim() : "N/A";

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

    const reviewContainers = document.querySelectorAll("div.col.EPCmJX");
    console.log(`Found ${reviewContainers.length} reviews on this page.`);

    reviewContainers.forEach(review => {
      try {
        const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K");
        const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

        const reviewTitleElem = review.querySelector("p.z9E0IG");
        const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

        const reviewDescElem = review.querySelector("div.ZmyHeo");
        let reviewDesc = reviewDescElem ? reviewDescElem.innerText.trim() : null;
        if (reviewDesc && reviewDesc.includes("READ MORE")) {
          reviewDesc = reviewDesc.replace("READ MORE", "").trim();
        }

        const reviewerNameElem = review.querySelector("p.AwS1CA");
        const reviewerName = reviewerNameElem ? reviewerNameElem.innerText.trim() : null;

        const reviewDateElem = review.querySelector("p._2NsDsF");
        const reviewDate = reviewDateElem ? reviewDateElem.innerText.trim() : null;

        const reviewLocationElem = review.querySelector("span.MztJPv > span:nth-child(2)");
        const reviewLocation = reviewLocationElem ? reviewLocationElem.innerText.trim() : null;

        const upvotesElem = review.querySelector("div._6kK6mk > span.tl9VpF");
        const upvotes = upvotesElem ? upvotesElem.innerText.trim() : "0";

        const downvotesElem = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF");
        const downvotes = downvotesElem ? downvotesElem.innerText.trim() : "0";

        allReviews.push({
          rating,
          review_title: reviewTitle,
          review_desc: reviewDesc,
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

    return allReviews;
  }

  async function sendDataToFlask(productData, reviewsData) {
    try {
      console.log("Sending data to Flask...");
      const response = await fetch('http://127.0.0.1:5000/receive_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_info: productData,
          reviews: reviewsData,
        }),
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

  async function main() {
    console.log("Starting full extraction (product info + reviews)...");

    const productData = extractProductInfo();
    const reviewsData = extractReviews();

    console.log("Extracted Data:", { productData, reviewsData });

    // Send the extracted data to Flask
    await sendDataToFlask(productData, reviewsData);

    alert(`Full extraction done! Product: ${productData.product_name}, Reviews: ${reviewsData.length}`);
  }

  main();
})();