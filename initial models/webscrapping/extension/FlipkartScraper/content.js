function fetchHTML(url) {
    return fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Accept-Language": "en-IN,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Referer": "https://www.flipkart.com/"
        }
    })
    .then(response => response.text());
}

function extractData(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const productName = doc.querySelector("span.VU-ZEz") ? doc.querySelector("span.VU-ZEz").innerText.trim() : "N/A";
    const price = doc.querySelector("div.Nx9bqj.CxhGGd") ? doc.querySelector("div.Nx9bqj.CxhGGd").innerText.trim() : "N/A";

    const reviewsData = [];
    const reviewContainer = doc.querySelectorAll("div.col.EPCmJX");

    reviewContainer.forEach(review => {
        try {
            const rating = review.querySelector("div.XQDdHH.Ga3i8K") ? review.querySelector("div.XQDdHH.Ga3i8K").innerText.trim() : null;
            const reviewTitle = review.querySelector("p.z9E0IG") ? review.querySelector("p.z9E0IG").innerText.trim() : null;
            const reviewDesc = review.querySelector("div.ZmyHeo") ? review.querySelector("div.ZmyHeo").innerText.trim() : null;

            reviewsData.push({
                rating,
                review_title: reviewTitle,
                review_desc: reviewDesc
            });
        } catch (e) {
            console.error("Error parsing review:", e);
        }
    });

    return {
        product_name: productName,
        price: price,
        reviews: reviewsData
    };
}

function convertToCSV(data) {
    const rows = [];
    const headers = ["rating", "review_title", "review_desc", "product_name"];
    rows.push(headers.join(","));

    data.forEach(product => {
        product.reviews.forEach(review => {
            const row = [
                review.rating,
                review.review_title,
                review.review_desc,
                product.product_name
            ];
            rows.push(row.join(","));
        });
    });

    return rows.join("\n");
}

function saveData(data) {
    const jsonBlob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonA = document.createElement('a');
    jsonA.href = jsonUrl;
    jsonA.download = 'product_info.json';  // Default filename for JSON
    jsonA.click();
    URL.revokeObjectURL(jsonUrl);

    const csvData = convertToCSV(data);
    const csvBlob = new Blob([csvData], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvA = document.createElement('a');
    csvA.href = csvUrl;
    csvA.download = 'product_reviews.csv';  // Default filename for CSV
    csvA.click();
    URL.revokeObjectURL(csvUrl);
}

function main() {
    const currentUrl = window.location.href;

    fetchHTML(currentUrl)
        .then(html => {
            const productData = extractData(html);
            saveData([productData]);
        })
        .catch(error => console.error("Error fetching HTML:", error));
}

main();
