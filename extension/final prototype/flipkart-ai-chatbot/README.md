# Flipkart AI Chatbot Extension

## Installation Guide (For a Fresh Windows Laptop/PC)

### 1. Prerequisites
- **Google Chrome** (for the extension)
- **Node.js & npm** (for JavaScript dependencies)
- **Python 3** (for the Flask backend)
- **Git** (optional, for cloning the repository)

---

### 2. Install Google Chrome
Download and install from:  
https://www.google.com/chrome/

---

### 3. Install Node.js and npm
Download and install from:  
https://nodejs.org/  
After installation, verify in Command Prompt:
```cmd
node -v
npm -v
```

---

### 4. Install Python 3
Download and install from:  
https://www.python.org/downloads/  
During installation, check the box to "Add Python to PATH".  
Verify installation:
```cmd
python --version
```

---

### 5. Clone or Download the Project
If you have Git:
```cmd
git clone <repo-url>
cd flipkart-ai-chatbot
```
Or download as ZIP from GitHub and extract.

---

### 6. Install Node.js Dependencies
In the project directory:
```cmd
npm install
```

---

### 7. Install Python Dependencies
In the project directory (or backend folder if separated):
```cmd
pip install flask flask-cors
```

---

### 8. Set Up the Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension` folder inside your project

---

### 9. Start the Flask Backend
In the backend directory (where your `app.py` is located):
```cmd
python app.py
```
Make sure it runs at `http://127.0.0.1:5000`

---

### 10. Use the Chatbot
- Go to any Flipkart product page in Chrome.
- The chatbot widget will appear in the bottom-right corner.
- Ask questions about the product, price, offers, or reviews.

---

### Notes
- If you want to use OpenAI GPT features, you’ll need an OpenAI API key and to install the `openai` npm package:
  ```cmd
  npm install openai
  ```
- For any issues, ensure all dependencies are installed and the backend server is running.

---

This project is licensed under the MIT License. See the `LICENSE` file for details.
