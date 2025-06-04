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
    </div>
    `
  },
  {
    content: `
      <h1>Project Extensions</h1>
      <div class="mission-text">
        <p>Explore powerful browser extensions that harness deep learning and intelligent scraping to enhance
          your shopping experience on e-commerce platforms like Flipkart.</p>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; color: darkblue;">
  <!-- Card 1 -->
  <div style="width: 300px; padding: 15px; border: 1px solid #ccc; border-radius: 10px; background: #fff; color: darkblue;">
    <h3>Flipkart AI Chatbot</h3>
    <p>NLP chatbot for helping users choose the best products on Flipkart.</p>
    <a href="https://github.com/finalYearProject-Gcoeara/finalProject/tree/main/extension/final%20prototype%20/%20flipkart-ai-chatbot" style="color: white; background: #28a745; padding: 10px 15px; border-radius: 5px; text-decoration: none;">Try It</a>
  </div>

  <!-- Card 2 -->
  <div style="width: 300px; padding: 15px; border: 1px solid #ccc; border-radius: 10px; background: #fff;">
    <h3>Flask Scraper v1.3</h3>
    <p>Scrapes product data and prices for BI and analytics using Python + Flask.</p>
    <a href="https://github.com/finalYearProject-Gcoeara/finalProject/tree/main/extension/final%20prototype%20/%20flipkart-ai-chatbot" style="color: white; background: #17a2b8; padding: 10px 15px; border-radius: 5px; text-decoration: none;">Download</a>
  </div>
</div>

      </div>
    `
  },
  {
    content: `<h1>Key Features</h1>
<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; font-family: 'Segoe UI', sans-serif; color: darkblue">

  <div style="flex: 1 1 200px; max-width: 250px; background: #e3f2fd; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
    <div style="font-size: 2.5rem;">🧠</div>
    <p><strong>AI-Powered Summarization</strong></p>
  </div>

  <div style="flex: 1 1 200px; max-width: 250px; background: #fce4ec; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
    <div style="font-size: 2.5rem;">🔍</div>
    <p><strong>Sentiment-Aware Insights</strong></p>
  </div>

  <div style="flex: 1 1 200px; max-width: 250px; background: #ede7f6; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
    <div style="font-size: 2.5rem;">🖼️</div>
    <p><strong>Image-Based Tag Extraction</strong></p>
  </div>

  <div style="flex: 1 1 200px; max-width: 250px; background: #fff9c4; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
    <div style="font-size: 2.5rem;">⚡</div>
    <p><strong>Real-time Summaries</strong></p>
  </div>

  <div style="flex: 1 1 200px; max-width: 250px; background: #c8e6c9; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
    <div style="font-size: 2.5rem;">🌐</div>
    <p><strong>Works with Major E-Commerce Sites</strong></p>
  </div>

</div>

    `
  },
  {
    content: `
      
    <h1>How It Works</h1>
<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: space-around; font-family: 'Segoe UI', sans-serif; color: darkblue">

  <div style="flex: 1 1 200px; max-width: 250px; background: #f0f8ff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
    <div style="font-size: 2.5rem;">🛍️</div>
    <h3>Step 1</h3>
    <p>User visits a product page</p>
  </div>

  <div style="flex: 1 1 200px; max-width: 250px; background: #e6fffa; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
    <div style="font-size: 2.5rem;">🧲</div>
    <h3>Step 2</h3>
    <p>Extension scrapes product data (reviews, images)</p>
  </div>

  <div style="flex: 1 1 200px; max-width: 250px; background: #fff4e6; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
    <div style="font-size: 2.5rem;">🧠</div>
    <h3>Step 3</h3>
    <p>Deep learning model processes the data</p>
  </div>

  <div style="flex: 1 1 200px; max-width: 250px; background: #f3e8ff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
    <div style="font-size: 2.5rem;">📊</div>
    <h3>Step 4</h3>
    <p>Summarized insight is shown on the extension popup</p>
  </div>

</div>

    `
  },
  {
    content: `
    <h1>Tech Stack</h1>

<div class="tech-stack-container">

  <div class="stack-box orange">
    <div class="icon-circle">01</div>
    <div class="stack-content">
      <h3>🐍 Python, TensorFlow/Keras</h3>
      <p>Used for model building and training deep learning models for NLP and image categorization.</p>
    </div>
  </div>

  <div class="stack-box red">
    <div class="icon-circle">02</div>
    <div class="stack-content">
      <h3>🤖 NLP (BERT/transformers)</h3>
      <p>Processes textual reviews to extract sentiment and summarize product feedback intelligently.</p>
    </div>
  </div>

  <div class="stack-box purple">
    <div class="icon-circle">03</div>
    <div class="stack-content">
      <h3>🖼️ CNNs for Image Categorization</h3>
      <p>CNN classifies product images data to identify tags or product type from visual features.</p>
    </div>
  </div>

  <div class="stack-box blue">
    <div class="icon-circle">04</div>
    <div class="stack-content">
      <h3>📦 Chrome Extension API</h3>
      <p>Facilitates data scraping and interaction with product pages in the browser(Flipkart).</p>
    </div>
  </div>

  <div class="stack-box green">
    <div class="icon-circle">05</div>
    <div class="stack-content">
      <h3>🔄 Backend (Flask/Firebase?)</h3>
      <p>Handles API requests, ML model integration, and possibly cloud-based storage.</p>
    </div>
  </div>

  <div class="stack-box teal">
    <div class="icon-circle">06</div>
    <div class="stack-content">
      <h3>🎨 HTML, CSS, Bootstrap, jQuery</h3>
      <p>Used to build a responsive and visually appealing front-end interface and dashboard.</p>
    </div>
  </div>

</div>

    `
  },
  {
    content: `
      <h1 >
  👥 Our Team
</h1>

<div style="max-width: 1100px; margin: auto; font-family: Arial, sans-serif;">
  <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 25px;">

    <!-- Member 1 -->
    <div style="background: linear-gradient(135deg, #f3f4f6, #ffffff); border-radius: 15px; padding: 25px; width: 240px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); text-align: center; transition: transform 0.3s ease;">
      <div style="font-size: 55px; margin-bottom: 10px;">👨‍💻</div>
      <h4 style="margin: 10px 0 5px; font-size: 20px; color: #333;">Aditya Vikas Pawar</h4>
      <p style="font-size: 13.5px; color: #777;">NLP, Review Analysis & API</p>
      <p style="font-size: 13px; color: #555; margin-top: 8px;">📧 aditya.pawar122020@gcoeara.ac.in</p>
    </div>

    <!-- Member 2 -->
    <div style="background: linear-gradient(135deg, #f0f7ff, #ffffff); border-radius: 15px; padding: 25px; width: 240px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); text-align: center; transition: transform 0.3s ease;">
      <div style="font-size: 55px; margin-bottom: 10px;">👨‍💻</div>
      <h4 style="margin: 10px 0 5px; font-size: 20px; color: #333;">Swastik Gupta</h4>
      <p style="font-size: 13.5px; color: #777;">Deep Learning & Full Stack</p>
      <p style="font-size: 13px; color: #555; margin-top: 8px;">📧 swastik.gupta122020@gcoeara.ac.in</p>
    </div>


    <!-- Member 4 -->
    <div style="background: linear-gradient(135deg, #f0fff0, #ffffff); border-radius: 15px; padding: 25px; width: 240px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); text-align: center; transition: transform 0.3s ease;">
      <div style="font-size: 55px; margin-bottom: 10px;">👨‍💻</div>
      <h4 style="margin: 10px 0 5px; font-size: 20px; color: #333;">Atharva Pawar</h4>
      <p style="font-size: 13.5px; color: #777;">Chatbot & Chrome Extension</p>
      <p style="font-size: 13px; color: #555; margin-top: 8px;">📧 atharva.pawar122020@gcoeara.ac.in</p>
    </div>

    
    <!-- Member 3 -->
    <div style="background: linear-gradient(135deg, #fff7f0, #ffffff); border-radius: 15px; padding: 25px; width: 240px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); text-align: center; transition: transform 0.3s ease;">
      <div style="font-size: 55px; margin-bottom: 10px;">👨‍💻</div>
      <h4 style="margin: 10px 0 5px; font-size: 20px; color: #333;">Atmaram Kambli</h4>
      <p style="font-size: 13.5px; color: #777;">UI/UX & full stack</p>
      <p style="font-size: 13px; color: #555; margin-top: 8px;">atmaram.kambli122020@gcoeara.ac.in</p>
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
