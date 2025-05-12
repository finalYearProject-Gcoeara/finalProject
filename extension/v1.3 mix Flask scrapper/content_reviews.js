(async function () {
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function sanitizeFilename(name, maxLength = 40) {
    return name.replace(/[^a-z0-9]/gi, '_').substring(0, maxLength) || "product";
  }

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

    // Modified part to correctly extract the description from the Xbd0Sd class
    const descriptionElem = document.querySelector(".Xbd0Sd");  // Target the Xbd0Sd class directly
info.description = descriptionElem ? descriptionElem.innerText.trim().replace(/^\S+\s*/, '') : info.description; // Remove the first word

    const specifications = {};
    document.querySelectorAll("div.GNDEQ- table._0ZhAN9 tbody tr, table._14cfVK tbody tr").forEach(tr => {
      const keyElem = tr.querySelector("td.col-3-12");
      const valElem = tr.querySelector("td.col-9-12 li") || tr.querySelector("td.col-9-12");
      if (keyElem && valElem) {
        const key = keyElem.innerText.trim();
        const value = valElem.innerText.trim();
        specifications[key] = value;
      }
    });
    info.specifications = specifications;

    const mainImgElem = document.querySelector("img.DByuf4.IZexXJ.jLEJ7H") || document.querySelector("img._396cs4");
    info.main_image = mainImgElem ? mainImgElem.src : "N/A";

    return info;
  }

  function extractReviews() {
    const allReviews = [];

    // These selectors for review containers seem to align with the structure you provided
    const reviewContainers = document.querySelectorAll("div.col.EPCmJX, div._16PBlm, div.RcXBOT.QmfTqT"); // Added the class from your snippet
    console.log(`Found ${reviewContainers.length} reviews on this page.`);

    reviewContainers.forEach(review => {
      try {
        // Selectors for existing fields (keep these, they seem to work based on your initial code)
        const ratingElem = review.querySelector("div.XQDdHH.Ga3i8K") || review.querySelector("div._3LWZlK._1BLPMq");
        const rating = ratingElem ? ratingElem.firstChild.textContent.trim() : null;

        const reviewTitleElem = review.querySelector("p.z9E0IG") || review.querySelector("p._2-N8zT");
        const reviewTitle = reviewTitleElem ? reviewTitleElem.innerText.trim() : null;

        // --- ADD THIS SECTION TO EXTRACT THE REVIEW BODY TEXT ---
        // Based on the HTML you provided, the review text is in a div with class "_11pzQk"
        const reviewBodyElem = review.querySelector('div._11pzQk');
        const reviewDesc = reviewBodyElem ? reviewBodyElem.innerText.trim() : '';

        if (!reviewDesc) {
            console.warn("Could not find review body text (div._11pzQk) for a review.");
            // This might happen if the review is very short or just a title?
            // Or if Flipkart changes the class name again.
        }
        // --- END ADD SECTION ---

        const reviewerNameElem = review.querySelector("p.AwS1CA") || review.querySelector("p._2sc7ZR._2V5EHH");
        const reviewerName = reviewerNameElem ? reviewerNameElem.innerText.trim() : null;

        const reviewDateElem = review.querySelector("p._2NsDsF") || review.querySelector("p._2sc7ZR");
        const reviewDate = reviewDateElem ? reviewDateElem.innerText.trim() : null;

        const reviewLocationElem = review.querySelector("span.MztJPv > span:nth-child(2)") || review.querySelector("p._2mcZGG");
        const reviewLocation = reviewLocationElem ? reviewLocationElem.innerText.trim() : null;

        // Adjusted upvote/downvote selectors slightly based on your previous code pattern
        const upvotesElem = review.querySelector("div._6kK6mk > span.tl9VpF") || review.querySelector("div._3c3Px5 > span:first-child"); // Often count is first span
        const upvotes = upvotesElem ? upvotesElem.innerText.trim() : "0";

        const downvotesElem = review.querySelector("div._6kK6mk.aQymJL > span.tl9VpF") || review.querySelector("div._3c3Px5 > span:last-child"); // Often count is last span
        const downvotes = downvotesElem ? downvotesElem.innerText.trim() : "0";


        // Push the dictionary including the review_desc
        allReviews.push({
          rating,
          review_title: reviewTitle,
          review_desc: reviewDesc, // <--- Make sure this key is added here!
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

    await sendDataToFlask(productData, reviewsData);

    alert(`Full extraction done! Product: ${productData.product_name}, Reviews: ${reviewsData.length}`);
  }

  main();
})();

