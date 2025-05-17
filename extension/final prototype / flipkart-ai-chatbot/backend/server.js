require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "models/gemini-1.5-pro-001";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

app.post("/api/openai", async (req, res) => {
  try {
    const { question, product } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question" });

    let prompt;
    if (product && product.title && product.price) {
      prompt = `You are a data analyst. Product: ${product.title}, Price: ${product.price} from India. Question: ${question}`;
    } else if (product && product.title) {
      prompt = `You are a data analyst. Product: ${product.title} (price not available) from India. Question: ${question}`;
    } else if (product && product.price) {
      prompt = `You are a data analyst. Product price: ${product.price} from India. Question: ${question}`;
    } else {
      prompt = `You are a data analyst. Question: ${question}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [
        { role: "system", content: "You are a data analyst. " },
        { role: "user", content: prompt },
      ],
    });

    const result = completion.choices[0].message.content;

    if (!result) return res.status(500).json({ error: "OpenAI returned no valid answer." });
    res.json({ answer: result });
  } catch (err) {
    console.error("OpenAI API Error:", err); // Log the error details to the console
    res.status(500).json({ error: "OpenAI internal server error", details: err.message });
  }
});

app.post("/api/gemini", async (req, res) => {
  try {
    const { question, product } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question" });

    const context = product
      ? `Product: ${product.title}, Price: ${product.price}. Question: ${question}`
      : question;

    // Truncate context if too large
    const MAX_CONTEXT_LENGTH = 500;
    const truncatedContext = context.length > MAX_CONTEXT_LENGTH ? context.slice(0, MAX_CONTEXT_LENGTH) + '...' : context;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: truncatedContext }] }]
        })
      }
    );

    const data = await response.json();
    console.log("Gemini API Response:", data); // Log the API response for debugging

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) return res.status(500).json({ error: "Gemini returned no valid answer." });
    res.json({ answer });
  } catch (err) {
    console.error("Gemini API Error:", err); // Log the error details to the console
    res.status(500).json({ error: "Gemini internal server error", details: err.message });
  }
});

// Add a route to list available models
app.get("/api/gemini/models", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch models", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
