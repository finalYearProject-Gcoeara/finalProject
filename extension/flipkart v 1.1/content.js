// // // async function fetchHTML(url) {
// // //     console.log("Fetching URL:", url);
// // //     const response = await fetch(url, {
// // //       headers: {
// // //         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
// // //         "Accept-Language": "en-IN,en;q=0.5",
// // //         "Accept-Encoding": "gzip, deflate, br",
// // //         "Referer": "https://www.flipkart.com/"
// // //       }
// // //     });
// // //     if (!response.ok) {
// // //       throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
// // //     }
// // //     const text = await response.text();
// // //     console.log("Fetched HTML length:", text.length);
// // //     return text;
// // //   }
  
// // //   function extractData(html) {
// // //     const parser = new DOMParser();
// // //     const doc = parser.parseFromString(html, 'text/html');
  
// // //     // Extract product details dynamically from the current page
// // //     const productName = doc.querySelector("div.Vu3-9u.eCtPz5")
// // //                           ? doc.querySelector("div.Vu3-9u.eCtPz5").innerText.trim()
// // //                           : "N/A";
// // //     const productName_New = doc.querySelector("p.VU-ZEz")
// // //                           ? doc.querySelector("p.VU-ZEz").innerText.trim()
// // //                           :"N/A";
// // //     const salePrice = doc.querySelector("div.Nx9bqj")
// // //                           ? doc.querySelector("div.Nx9bqj").innerText.trim()
// // //                           : "N/A";
// // //     const originalPrice = doc.querySelector("div.yRaY8j")
// // //                           ? doc.querySelector("div.yRaY8j").innerText.trim()
// // //                           : "N/A";
// // //     const discount = doc.querySelector("div.UkUFwK span")
// // //                           ? doc.querySelector("div.UkUFwK span").innerText.trim()
// // //                           : "N/A";
  
// // //     const reviewsData = [];
// // //     const reviewContainers = doc.querySelectorAll("div.col.EPCmJX");
  
// // //     console.log("Found", reviewContainers.length, "review containers on", productName);
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
  
// // //         const reviewerName = review.querySelector("p.AwS1CA")
// // //                                ? review.querySelector("p.AwS1CA").innerText.trim()
// // //                                : null;
// // //         const reviewDate = review.querySelector("p._2NsDsF")
// // //                                ? review.querySelector("p._2NsDsF").innerText.trim()
// // //                                : null;
// // //         const reviewLocation = review.querySelector("span.MztJPv > span:nth-child(2)")
// // //                                ? review.querySelector("span.MztJPv > span:nth-child(2)").innerText.trim()
// // //                                : null;
// // //         const upvotes = review.querySelector("div._6kK6mk > span.tl9VpF")
// // //                                ? review.querySelector("div._6kK6mk > span.tl9VpF").innerText.trim()
// // //                                : "0";
// // //         const downvotes = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF")
// // //                                ? review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF").innerText.trim()
// // //                                : "0";
  
// // //         reviewsData.push({
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
// // //         console.error("Error parsing a review:", e);
// // //       }
// // //     });
  
// // //     // Look for a "Next" button dynamically (adjust selector if needed)
// // //     const nextPageElement = doc.querySelector("a._9QVEpD");
// // //     const nextPageUrl = nextPageElement ? nextPageElement.href : null;
// // //     if (nextPageUrl) {
// // //       console.log("Next page URL found:", nextPageUrl);
// // //     } else {
// // //       console.log("No next page URL found.");
// // //     }
  
// // //     return {
// // //       product_name: productName,
// // //       product_title:productName_New,
// // //       sale_price: salePrice,
// // //       original_price: originalPrice,
// // //       discount: discount,
// // //       reviews: reviewsData,
// // //       next_page: nextPageUrl
// // //     };
// // //   }
  
// // //   async function scrapeAllPages(startUrl) {
// // //     let currentPage = startUrl;
// // //     let allProducts = [];
// // //     let pageCount = 0;
  
// // //     // Continue scraping until no next page is found
// // //     while (currentPage) {
// // //       pageCount++;
// // //       console.log(`\n----- Fetching Page ${pageCount} -----`);
// // //       try {
// // //         const html = await fetchHTML(currentPage);
// // //         const productData = extractData(html);
// // //         allProducts.push(productData);
// // //         if (productData.next_page) {
// // //           currentPage = new URL(productData.next_page, currentPage).href;
// // //         } else {
// // //           currentPage = null;
// // //         }
// // //       } catch (error) {
// // //         // If an error occurs, break the loop
// // //         break;
// // //       }
// // //     }
// // //     console.log("Scraping complete. Total pages scraped:", pageCount);
// // //     return allProducts;
// // //   }
  
// // //   function convertToCSV(data) {
// // //     const rows = [];
// // //     const headers = [
// // //       "rating",
// // //       "review_title",
// // //       "review_desc",
// // //       "reviewer_name",
// // //       "review_date",
// // //       "review_location",
// // //       "upvotes",
// // //       "downvotes",
// // //       "product_name",
// // //       "sale_price",
// // //       "original_price",
// // //       "discount"
// // //     ];
// // //     rows.push(headers.join(","));
  
// // //     data.forEach(product => {
// // //       product.reviews.forEach(review => {
// // //         const row = [
// // //           review.rating,
// // //           review.review_title,
// // //           review.review_desc,
// // //           review.reviewer_name,
// // //           review.review_date,
// // //           review.review_location,
// // //           review.upvotes,
// // //           review.downvotes,
// // //           product.product_name,
// // //           product.sale_price,
// // //           product.original_price,
// // //           product.discount
// // //         ];
// // //         rows.push(row.join(","));
// // //       });
// // //     });
// // //     return rows.join("\n");
// // //   }
  
// // //   function saveData(data) {
// // //     const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// // //     const jsonUrl = URL.createObjectURL(jsonBlob);
// // //     const jsonA = document.createElement('a');
// // //     jsonA.href = jsonUrl;
// // //     jsonA.download = 'product_info.json';
// // //     jsonA.click();
// // //     URL.revokeObjectURL(jsonUrl);
  
// // //     const csvData = convertToCSV(data);
// // //     const csvBlob = new Blob([csvData], { type: 'text/csv' });
// // //     const csvUrl = URL.createObjectURL(csvBlob);
// // //     const csvA = document.createElement('a');
// // //     csvA.href = csvUrl;
// // //     csvA.download = 'product_reviews.csv';
// // //     csvA.click();
// // //     URL.revokeObjectURL(csvUrl);
// // //   }
  
// // //   async function main() {
// // //     // Use the current URL dynamically
// // //     const currentUrl = window.location.href;
// // //     console.log("Starting scrape from:", currentUrl);
  
// // //     const allProductsData = await scrapeAllPages(currentUrl);
// // //     saveData(allProductsData);
// // //   }
  
// // //   main();
// // async function fetchHTML(url) {
// //   console.log("Fetching URL:", url);
// //   const response = await fetch(url, {
// //     headers: {
// //       "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
// //         "Accept-Language": "en-IN,en;q=0.5",
// //         "Accept-Encoding": "gzip, deflate, br",
// //         "Referer": "https://www.flipkart.com/"
// //     }
// //   });
// //   if (!response.ok) {
// //     throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
// //   }
// //   const text = await response.text();
// //   console.log("Fetched HTML length:", text.length);
// //   return text;
// // }

// // function extractData(html) {
// //   const parser = new DOMParser();
// //   const doc = parser.parseFromString(html, 'text/html');

// //   // Extract product details dynamically from the current page
// //   const productName = doc.querySelector("div.Vu3-9u.eCtPz5")
// //                         ? doc.querySelector("div.Vu3-9u.eCtPz5").innerText.trim()
// //                         : "N/A";
// //   const productName_New = doc.querySelector("p.VU-ZEz")
// //                         ? doc.querySelector("p.VU-ZEz").innerText.trim()
// //                         : "N/A";
// //   const salePrice = doc.querySelector("div.Nx9bqj")
// //                         ? doc.querySelector("div.Nx9bqj").innerText.trim()
// //                         : "N/A";
// //   const originalPrice = doc.querySelector("div.yRaY8j")
// //                         ? doc.querySelector("div.yRaY8j").innerText.trim()
// //                         : "N/A";
// //   const discount = doc.querySelector("div.UkUFwK span")
// //                         ? doc.querySelector("div.UkUFwK span").innerText.trim()
// //                         : "N/A";

// //   // Extract reviews data
// //   const reviewsData = [];
// //   const reviewContainers = doc.querySelectorAll("div.col.EPCmJX");
// //   console.log("Found", reviewContainers.length, "review containers on", productName);
// //   reviewContainers.forEach(review => {
// //     try {
// //       const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K");
// //       const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

// //       const reviewTitleElem = review.querySelector("p.z9E0IG");
// //       const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

// //       const reviewDescElem = review.querySelector("div.ZmyHeo");
// //       let reviewDesc = reviewDescElem ? reviewDescElem.innerText.trim() : null;
// //       if (reviewDesc && reviewDesc.includes("READ MORE")) {
// //         reviewDesc = reviewDesc.replace("READ MORE", "").trim();
// //       }

// //       const reviewerName = review.querySelector("p.AwS1CA")
// //                              ? review.querySelector("p.AwS1CA").innerText.trim()
// //                              : null;
// //       const reviewDate = review.querySelector("p._2NsDsF")
// //                              ? review.querySelector("p._2NsDsF").innerText.trim()
// //                              : null;
// //       const reviewLocation = review.querySelector("span.MztJPv > span:nth-child(2)")
// //                              ? review.querySelector("span.MztJPv > span:nth-child(2)").innerText.trim()
// //                              : null;
// //       const upvotes = review.querySelector("div._6kK6mk > span.tl9VpF")
// //                              ? review.querySelector("div._6kK6mk > span.tl9VpF").innerText.trim()
// //                              : "0";
// //       const downvotes = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF")
// //                              ? review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF").innerText.trim()
// //                              : "0";

// //       reviewsData.push({
// //         rating,
// //         review_title: reviewTitle,
// //         review_desc: reviewDesc,
// //         reviewer_name: reviewerName,
// //         review_date: reviewDate,
// //         review_location: reviewLocation,
// //         upvotes,
// //         downvotes
// //       });
// //     } catch (e) {
// //       console.error("Error parsing a review:", e);
// //     }
// //   });

// //   // Look for a "Next" button dynamically (adjust selector if needed)
// //   const nextPageElement = doc.querySelector("a._9QVEpD");
// //   const nextPageUrl = nextPageElement ? nextPageElement.href : null;
// //   if (nextPageUrl) {
// //     console.log("Next page URL found:", nextPageUrl);
// //   } else {
// //     console.log("No next page URL found.");
// //   }

// //   return {
// //     product_name: productName,
// //     product_title: productName_New,
// //     sale_price: salePrice,
// //     original_price: originalPrice,
// //     discount: discount,
// //     reviews: reviewsData,
// //     next_page: nextPageUrl
// //   };
// // }

// // async function scrapeAllPages(startUrl) {
// //   let currentPage = startUrl;
// //   let allProducts = [];
// //   let pageCount = 0;

// //   // Continue scraping until no next page is found
// //   while (currentPage) {
// //     pageCount++;
// //     console.log(`\n----- Fetching Page ${pageCount} -----`);
// //     try {
// //       const html = await fetchHTML(currentPage);
// //       const productData = extractData(html);
// //       allProducts.push(productData);
// //       if (productData.next_page) {
// //         currentPage = new URL(productData.next_page, currentPage).href;
// //       } else {
// //         currentPage = null;
// //       }
// //     } catch (error) {
// //       console.error("Error during scraping:", error);
// //       break;
// //     }
// //   }
// //   console.log("Scraping complete. Total pages scraped:", pageCount);
// //   return allProducts;
// // }

// // function convertToCSV(data) {
// //   const rows = [];
// //   const headers = [
// //     "rating",
// //     "review_title",
// //     "review_desc",
// //     "reviewer_name",
// //     "review_date",
// //     "review_location",
// //     "upvotes",
// //     "downvotes",
// //     "product_name",
// //     "sale_price",
// //     "original_price",
// //     "discount"
// //   ];
// //   rows.push(headers.join(","));

// //   data.forEach(product => {
// //     product.reviews.forEach(review => {
// //       const row = [
// //         review.rating,
// //         review.review_title,
// //         review.review_desc,
// //         review.reviewer_name,
// //         review.review_date,
// //         review.review_location,
// //         review.upvotes,
// //         review.downvotes,
// //         product.product_name,
// //         product.sale_price,
// //         product.original_price,
// //         product.discount
// //       ];
// //       rows.push(row.join(","));
// //     });
// //   });
// //   return rows.join("\n");
// // }

// // // Helper function to sanitize and truncate product name for filenames
// // function sanitizeFilename(name) {
// //   return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
// // }

// // function saveData(data) {
// //   // Choose a base filename from the first product's name (if available)
// //   const baseFilename = data.length > 0 ? sanitizeFilename(data[0].product_name) : "product";

// //   // Save JSON file
// //   const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
// //   const jsonUrl = URL.createObjectURL(jsonBlob);
// //   const jsonA = document.createElement('a');
// //   jsonA.href = jsonUrl;
// //   jsonA.download = `${baseFilename}_info.json`;
// //   jsonA.click();
// //   URL.revokeObjectURL(jsonUrl);

// //   // Save CSV file
// //   const csvData = convertToCSV(data);
// //   const csvBlob = new Blob([csvData], { type: 'text/csv' });
// //   const csvUrl = URL.createObjectURL(csvBlob);
// //   const csvA = document.createElement('a');
// //   csvA.href = csvUrl;
// //   csvA.download = `${baseFilename}_reviews.csv`;
// //   csvA.click();
// //   URL.revokeObjectURL(csvUrl);
// // }

// // async function main() {
// //   // Use the current URL dynamically
// //   const currentUrl = window.location.href;
// //   console.log("Starting scrape from:", currentUrl);

// //   const allProductsData = await scrapeAllPages(currentUrl);
// //   saveData(allProductsData);
// // }

// // main();
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

// function extractData(html) {
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(html, 'text/html');

//   // Extract product details dynamically from the current page.
//   const productName = doc.querySelector("div.Vu3-9u.eCtPz5")
//                         ? doc.querySelector("div.Vu3-9u.eCtPz5").innerText.trim()
//                         : "N/A";
//   const productName_New = doc.querySelector("p.VU-ZEz")
//                         ? doc.querySelector("p.VU-ZEz").innerText.trim()
//                         : "N/A";
//   const salePrice = doc.querySelector("div.Nx9bqj")
//                         ? doc.querySelector("div.Nx9bqj").innerText.trim()
//                         : "N/A";
//   const originalPrice = doc.querySelector("div.yRaY8j")
//                         ? doc.querySelector("div.yRaY8j").innerText.trim()
//                         : "N/A";
//   const discount = doc.querySelector("div.UkUFwK span")
//                         ? doc.querySelector("div.UkUFwK span").innerText.trim()
//                         : "N/A";

//   // Extract reviews data from the page.
//   const reviewsData = [];
//   const reviewContainers = doc.querySelectorAll("div.col.EPCmJX");
//   console.log("Found", reviewContainers.length, "review containers on", productName);
//   reviewContainers.forEach(review => {
//     try {
//       const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K");
//       const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

//       const reviewTitleElem = review.querySelector("p.z9E0IG");
//       const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

//       const reviewDescElem = review.querySelector("div.ZmyHeo");
//       let reviewDesc = reviewDescElem ? reviewDescElem.innerText.trim() : null;
//       if (reviewDesc && reviewDesc.includes("READ MORE")) {
//         reviewDesc = reviewDesc.replace("READ MORE", "").trim();
//       }

//       const reviewerName = review.querySelector("p.AwS1CA")
//                              ? review.querySelector("p.AwS1CA").innerText.trim()
//                              : null;
//       const reviewDate = review.querySelector("p._2NsDsF")
//                              ? review.querySelector("p._2NsDsF").innerText.trim()
//                              : null;
//       const reviewLocation = review.querySelector("span.MztJPv > span:nth-child(2)")
//                              ? review.querySelector("span.MztJPv > span:nth-child(2)").innerText.trim()
//                              : null;
//       const upvotes = review.querySelector("div._6kK6mk > span.tl9VpF")
//                              ? review.querySelector("div._6kK6mk > span.tl9VpF").innerText.trim()
//                              : "0";
//       const downvotes = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF")
//                              ? review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF").innerText.trim()
//                              : "0";

//       reviewsData.push({
//         rating,
//         review_title: reviewTitle,
//         review_desc: reviewDesc,
//         reviewer_name: reviewerName,
//         review_date: reviewDate,
//         review_location: reviewLocation,
//         upvotes,
//         downvotes
//       });
//     } catch (e) {
//       console.error("Error parsing a review:", e);
//     }
//   });

//   // Look for a "Next" button dynamically (adjust selector if needed)
//   const nextPageElement = doc.querySelector("a._9QVEpD");
//   const nextPageUrl = nextPageElement ? nextPageElement.href : null;
//   if (nextPageUrl) {
//     console.log("Next page URL found:", nextPageUrl);
//   } else {
//     console.log("No next page URL found.");
//   }

//   return {
//     product_name: productName,
//     product_title: productName_New,
//     sale_price: salePrice,
//     original_price: originalPrice,
//     discount: discount,
//     reviews: reviewsData,
//     next_page: nextPageUrl
//   };
// }

// async function scrapeAllPages(startUrl) {
//   let currentPage = startUrl;
//   let allProducts = [];
//   let visitedUrls = new Set();
//   let pageCount = 0;

//   // Continue scraping until no next page is found or a duplicate URL is encountered.
//   while (currentPage) {
//     if (visitedUrls.has(currentPage)) {
//       console.warn("Duplicate page detected. Ending pagination loop:", currentPage);
//       break;
//     }
//     visitedUrls.add(currentPage);

//     pageCount++;
//     console.log(`\n----- Fetching Page ${pageCount} -----`);
//     try {
//       const html = await fetchHTML(currentPage);
//       const productData = extractData(html);
//       allProducts.push(productData);

//       // Use the next_page URL if it hasn't been visited.
//       if (productData.next_page) {
//         const nextUrl = new URL(productData.next_page, currentPage).href;
//         if (!visitedUrls.has(nextUrl)) {
//           currentPage = nextUrl;
//         } else {
//           console.warn("Next page URL has already been visited. Ending loop.");
//           currentPage = null;
//         }
//       } else {
//         currentPage = null;
//       }
//     } catch (error) {
//       console.error("Error during scraping:", error);
//       break;
//     }
//   }
//   console.log("Scraping complete. Total pages scraped:", pageCount);
//   return allProducts;
// }

// function convertToCSV(data) {
//   const rows = [];
//   const headers = [
//     "rating",
//     "review_title",
//     "review_desc",
//     "reviewer_name",
//     "review_date",
//     "review_location",
//     "upvotes",
//     "downvotes",
//     "product_name",
//     "sale_price",
//     "original_price",
//     "discount"
//   ];
//   rows.push(headers.join(","));

//   data.forEach(product => {
//     product.reviews.forEach(review => {
//       const row = [
//         review.rating,
//         review.review_title,
//         review.review_desc,
//         review.reviewer_name,
//         review.review_date,
//         review.review_location,
//         review.upvotes,
//         review.downvotes,
//         product.product_name,
//         product.sale_price,
//         product.original_price,
//         product.discount
//       ];
//       rows.push(row.join(","));
//     });
//   });
//   return rows.join("\n");
// }

// // Helper function to sanitize and truncate product name for filenames
// function sanitizeFilename(name) {
//   return name.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || "product";
// }

// function saveData(data) {
//   // Choose a base filename from the first product's name (if available)
//   const baseFilename = data.length > 0 ? sanitizeFilename(data[0].product_name) : "product";

//   // Save JSON file
//   const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
//   const jsonUrl = URL.createObjectURL(jsonBlob);
//   const jsonA = document.createElement('a');
//   jsonA.href = jsonUrl;
//   jsonA.download = `${baseFilename}_info.json`;
//   jsonA.click();
//   URL.revokeObjectURL(jsonUrl);

//   // Save CSV file
//   const csvData = convertToCSV(data);
//   const csvBlob = new Blob([csvData], { type: 'text/csv' });
//   const csvUrl = URL.createObjectURL(csvBlob);
//   const csvA = document.createElement('a');
//   csvA.href = csvUrl;
//   csvA.download = `${baseFilename}_reviews.csv`;
//   csvA.click();
//   URL.revokeObjectURL(csvUrl);
// }

// async function main() {
//   // Use the current URL dynamically
//   const currentUrl = window.location.href;
//   console.log("Starting scrape from:", currentUrl);

//   const allProductsData = await scrapeAllPages(currentUrl);
//   saveData(allProductsData);
// }

// main();
// ------------------ Helper Functions ------------------

// Fetch HTML from a URL with required headers.
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

// Helper wait function.
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Sanitize a string for use as a filename.
function sanitizeFilename(name, maxLength = 40) {
  return name.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength) || "product";
}

// ------------------ Data Extraction Functions ------------------

// Extract product and review data from HTML content.
function extractData(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract product details:
  const productName = doc.querySelector("div.Vu3-9u.eCtPz5")
                        ? doc.querySelector("div.Vu3-9u.eCtPz5").innerText.trim()
                        : "N/A";
  const productName_New = doc.querySelector("p.VU-ZEz")
                        ? doc.querySelector("p.VU-ZEz").innerText.trim()
                        : "N/A";
  const salePrice = doc.querySelector("div.Nx9bqj")
                        ? doc.querySelector("div.Nx9bqj").innerText.trim()
                        : "N/A";
  const originalPrice = doc.querySelector("div.yRaY8j")
                        ? doc.querySelector("div.yRaY8j").innerText.trim()
                        : "N/A";
  const discount = doc.querySelector("div.UkUFwK span")
                        ? doc.querySelector("div.UkUFwK span").innerText.trim()
                        : "N/A";

  // Extract reviews data.
  const reviewsData = [];
  const reviewContainers = doc.querySelectorAll("div.col.EPCmJX");
  console.log("Found", reviewContainers.length, "review containers on", productName);
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

      const reviewerName = review.querySelector("p.AwS1CA")
                             ? review.querySelector("p.AwS1CA").innerText.trim()
                             : null;
      const reviewDate = review.querySelector("p._2NsDsF")
                             ? review.querySelector("p._2NsDsF").innerText.trim()
                             : null;
      const reviewLocation = review.querySelector("span.MztJPv > span:nth-child(2)")
                             ? review.querySelector("span.MztJPv > span:nth-child(2)").innerText.trim()
                             : null;
      const upvotes = review.querySelector("div._6kK6mk > span.tl9VpF")
                             ? review.querySelector("div._6kK6mk > span.tl9VpF").innerText.trim()
                             : "0";
      const downvotes = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF")
                             ? review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF").innerText.trim()
                             : "0";

      reviewsData.push({
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
      console.error("Error parsing a review:", e);
    }
  });

  // Extract the "Next" button URL (optional; mainly for logging/debugging).
  const nextPageElement = doc.querySelector("a._9QVEpD");
  const nextPageUrl = nextPageElement ? nextPageElement.href : null;
  if (nextPageUrl) {
    console.log("Next page URL found:", nextPageUrl);
  } else {
    console.log("No next page URL found.");
  }

  return {
    product_name: productName,
    product_title: productName_New,
    sale_price: salePrice,
    original_price: originalPrice,
    discount: discount,
    reviews: reviewsData,
    next_page: nextPageUrl
  };
}

// ------------------ New Pagination-Based Scraping via URL Construction ------------------

// This function extracts total pages from the pagination element.

function extractTotalPages(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const paginationSpan = doc.querySelector("div._1G0WLw.mpIySA span");
  if (paginationSpan) {
    const match = paginationSpan.textContent.match(/Page\s+\d+\s+of\s+(\d+)/i);
    if (match) {
      return parseInt(match[1]);
    }
  }
  return 1;
}

// This function builds an array of URLs—from page 1 to total pages—by modifying the "page" query parameter.
// async function getAllPageUrls(currentUrl) {
//   // Fetch the current page HTML to extract total pages.
//   const html = await fetchHTML(currentUrl);
//   const totalPages = extractTotalPages(html);
//   console.log("Total pages from pagination:", totalPages);

//   const urlObj = new URL(currentUrl);
//   // Remove any existing page parameter.
//   urlObj.searchParams.delete("page");

//   const urls = [];
//   for (let i = 1; i <= totalPages; i++) {
//     const newUrl = new URL(urlObj.toString());
//     newUrl.searchParams.set("page", i);
//     urls.push(newUrl.toString());
//   }
//   return urls;
// }
async function getAllPageUrls(currentUrl) {
  const totalPages = 10; // Set the desired number of pages to scrape

  const urlObj = new URL(currentUrl);
  urlObj.searchParams.delete("page");

  const urls = [];
  for (let i = 1; i <= totalPages; i++) {
    const newUrl = new URL(urlObj.toString());
    newUrl.searchParams.set("page", i);
    urls.push(newUrl.toString());
  }
  return urls;
}

// This function fetches data from all pages.
async function scrapeAllPages() {
  const currentUrl = window.location.href;
  const pageUrls = await getAllPageUrls(currentUrl);
  console.log("Page URLs to scrape:", pageUrls);
  const allProductsData = [];
  for (let url of pageUrls) {
    console.log("Scraping URL:", url);
    try {
      const html = await fetchHTML(url);
      const productData = extractData(html);
      allProductsData.push(productData);
      // Wait briefly between requests.
      await wait(1000);
    } catch (err) {
      console.error("Error fetching URL:", url, err);
    }
  }
  console.log("Scraping complete. Total pages scraped:", allProductsData.length);
  return allProductsData;
}

// ------------------ Data Saving Functions ------------------

function convertToCSV(data) {
  const headers = [
    "rating",
    "review_title",
    "review_desc",
    "reviewer_name",
    "review_date",
    "review_location",
    "upvotes",
    "downvotes",
    "product_name",
    "sale_price",
    "original_price",
    "discount"
  ];
  const rows = [headers.join(",")];

  data.forEach(product => {
    product.reviews.forEach(review => {
      const row = [
        review.rating,
        review.review_title,
        review.review_desc,
        review.reviewer_name,
        review.review_date,
        review.review_location,
        review.upvotes,
        review.downvotes,
        product.product_name,
        product.sale_price,
        product.original_price,
        product.discount
      ];
      rows.push(row.join(","));
    });
  });
  return rows.join("\n");
}

function saveData(data) {
  // Use the product name from the first page for the filename.
  const baseFilename = data.length > 0 ? sanitizeFilename(data[0].product_name, 40) : "product";

  // Save JSON file.
  const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const jsonLink = document.createElement('a');
  jsonLink.href = jsonUrl;
  jsonLink.download = `${baseFilename}_info.json`;
  jsonLink.click();
  URL.revokeObjectURL(jsonUrl);

  // Save CSV file.
  const csvData = convertToCSV(data);
  const csvBlob = new Blob([csvData], { type: 'text/csv' });
  const csvUrl = URL.createObjectURL(csvBlob);
  const csvLink = document.createElement('a');
  csvLink.href = csvUrl;
  csvLink.download = `${baseFilename}_reviews.csv`;
  csvLink.click();
  URL.revokeObjectURL(csvUrl);
}

// ------------------ Main Execution ------------------

async function main() {
  console.log("Starting scraping using pagination URL construction...");
  const allPagesData = await scrapeAllPages();
  console.log("Combined scraped data:", allPagesData);
  saveData(allPagesData);
}

main();
