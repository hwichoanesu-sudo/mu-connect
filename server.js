```javascript
require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

app.disable("x-powered-by");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Muconnect's frontend files.
app.use(express.static(PUBLIC_DIR));

// Health check for Render.
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    application: "Muconnect",
    message: "Muconnect server is running."
  });
});

// Serve the homepage.
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"), (error) => {
    if (error && !res.headersSent) {
      console.error("Homepage could not be loaded:", error.message);
      res.status(500).send(
        "Muconnect is running, but public/index.html could not be loaded."
      );
    }
  });
});

// Return a clear response for unknown routes.
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Muconnect server running on port ${PORT}`);
  console.log(`Serving frontend from: ${PUBLIC_DIR}`);
});
```
