require("dotenv").config();

const express = require("express");

const app = express();

const PORT = process.env.PORT || 3001;

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "WorkVibes API is running",
  });
});

app.listen(PORT, () => {
  console.log(`WorkVibes API running on port ${PORT}`);
});
