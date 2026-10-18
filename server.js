require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Muconnect API" });
});

app.post("/api/ai/store-design", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "put_your_groq_key_here") {
      return res.status(503).json({ error: "Groq is not connected yet. Add GROQ_API_KEY to your .env file." });
    }

    const { businessName, businessType, description, style } = req.body || {};
    const fields = [businessName, businessType, description, style];
    if (!fields.every(value => typeof value === "string" && value.trim().length > 0)) {
      return res.status(400).json({ error: "Please complete all four fields." });
    }

    const business = {
      businessName: businessName.trim().slice(0, 100),
      businessType: businessType.trim().slice(0, 100),
      description: description.trim().slice(0, 800),
      style: style.trim().slice(0, 120)
    };

    const prompt = `You are Muconnect's AI Store Designer. Create a professional, mobile-first storefront design concept for a business in a university marketplace. Use only supplied business details. Never invent products, prices, stock, reviews, contact details, or factual claims. Return ONLY valid JSON with this shape:
{
 "storeName":"string", "tagline":"short string",
 "theme":{"background":"#hex","surface":"#hex","primary":"#hex","accent":"#hex","text":"#hex"},
 "styleDescription":"two short sentences", "heroTitle":"string", "heroSubtitle":"string",
 "sectionOrder":["hero","about","featured"],
 "suggestedSections":["string","string","string"],
 "marketingIdeas":["string","string","string"]
}
Use readable contrast. Business details: ${JSON.stringify(business)}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Return valid JSON only, without markdown fences." },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Groq API error:", response.status, data);
      return res.status(502).json({ error: data?.error?.message || "Groq failed. Check the model name, API key, limits, and server logs." });
    }
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: "The AI returned an empty response." });
    let design;
    try { design = JSON.parse(content); }
    catch { return res.status(502).json({ error: "The AI response was not valid JSON. Please try again." }); }
    return res.json({ design });
  } catch (error) {
    console.error("Store designer error:", error);
    return res.status(500).json({ error: "Unexpected server error. Please try again." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`Muconnect is running on port ${PORT}`));
