VANTA.NET({
  el: "#your-element-selector",
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  minHeight: 200.00,
  minWidth: 200.00,
  scale: 1.00,
  scaleMobile: 1.00,
  color: 0x63ff3f,
  backgroundColor: 0x0b021a
});

const sections = [
  {
    content: `
      
    <h1>About Project</h1>
    <div class="card">
    <p><strong>Title:</strong> Product Review and Visual Categorization using Deep Learning</p>
    <!-- <img src="https://via.placeholder.com/400x200" alt="About Image"> -->
    <p>This project focuses on analyzing textual product reviews using Natural Language Processing (NLP) and classifying product images using Convolutional Neural Networks (CNNs). Our goal is to build a unified system that understands both visual and textual product data.</p>
    <h3>Institution</h3>
    <p>
        Government College of Engineering and Research, Avasari Khurd<br />
        Under the guidance of <strong>Prof. K. B. Sadafale</strong><br />
        Affiliated to <strong>Savitribai Phule Pune University (SPPU)</strong>
    </p>
    <h3>Key Features</h3>
    <ul>
        <li>Sentiment analysis using pretrained transformers and LSTM-based models</li>
        <li>Image classification with custom CNN architecture and transfer learning</li>
        <li>Web scrapers for review collection from Amazon/Flipkart</li>
        <li>Visualizations for model outputs and predictions</li>
        <li>Custom chatbot extension for interacting with the system</li>
    </ul>
    </div>
    `
  },
  {
    content: `
      <h1>Project Extensions</h1>
      <div class="mission-text">
        <p>Explore powerful browser extensions that harness deep learning and intelligent scraping to enhance
          your shopping experience on e-commerce platforms like Flipkart.</p>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
  <!-- Card 1 -->
  <div style="width: 300px; padding: 15px; border: 1px solid #ccc; border-radius: 10px; background: #fff;">
    <h3>Flipkart AI Chatbot</h3>
    <p>NLP chatbot for helping users choose the best products on Flipkart.</p>
    <a href="#" style="color: white; background: #28a745; padding: 10px 15px; border-radius: 5px; text-decoration: none;">Try It</a>
  </div>

  <!-- Card 2 -->
  <div style="width: 300px; padding: 15px; border: 1px solid #ccc; border-radius: 10px; background: #fff;">
    <h3>Flask Scraper v1.3</h3>
    <p>Scrapes product data and prices for BI and analytics using Python + Flask.</p>
    <a href="#" style="color: white; background: #17a2b8; padding: 10px 15px; border-radius: 5px; text-decoration: none;">Download</a>
  </div>
</div>

      </div>
    `
  },
  {
    content: `
      <h1>Our Team</h1>
      <div style="max-width: 1000px; margin: auto; text-align: center; font-family: Arial, sans-serif;">
  <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; color: #666">
    
    <div style="background-color: #fff; border-radius: 10px; padding: 20px; width: 220px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.2s ease;">
      <div style="font-size: 50px; margin-bottom: 10px;">👤</div>
      <h4 style="margin: 10px 0 5px; font-size: 18px;">Aditya Vikas Pawar</h4>
      <p style="font-size: 14px; color: #666;">aditya.pawar122020@gcoeara.ac.in</p>
    </div>

    <div style="background-color: #fff; border-radius: 10px; padding: 20px; width: 220px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.2s ease;">
      <div style="font-size: 50px; margin-bottom: 10px;">👤</div>
      <h4 style="margin: 10px 0 5px; font-size: 18px;">Swastik Gupta</h4>
      <p style="font-size: 14px; color: #666;">swastik.gupta122020@gcoeara.ac.in</p>
    </div>

    <div style="background-color: #fff; border-radius: 10px; padding: 20px; width: 220px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.2s ease;">
      <div style="font-size: 50px; margin-bottom: 10px;">👤</div>
      <h4 style="margin: 10px 0 5px; font-size: 18px;">Atmaram Kambli</h4>
      <p style="font-size: 14px; color: #666;">atmaram.kambli122020@gcoeara.ac.in</p>
    </div>

    <div style="background-color: #fff; border-radius: 10px; padding: 20px; width: 220px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.2s ease;">
      <div style="font-size: 50px; margin-bottom: 10px;">👤</div>
      <h4 style="margin: 10px 0 5px; font-size: 18px;">Atharva Pawar</h4>
      <p style="font-size: 14px; color: #666;">atharva.pawar122020@gcoeara.ac.in</p>
    </div>
  </div>
</div>

    `
  }
];

let current = -1;

function showSection(index) {
  const content = document.getElementById("content");
  const heading = document.getElementById("home-heading");

  if (index === -1) {
    heading.style.display = "block";
    content.style.display = "none";
  } else {
    heading.style.display = "none";
    content.innerHTML = sections[index].content;
    content.style.display = "block";
  }
}

function nextSection() {
  current = (current + 1) % (sections.length + 1);
  showSection(current - 1);
}

function prevSection() {
  current = (current - 1 + sections.length + 1) % (sections.length + 1);
  showSection(current - 1);
}

showSection(-1);
