require("dotenv").config();
const express = require("express");

const honeypotRoutes = require("./routes/honeypot");

const app = express();
app.use(express.json());

// API KEY MIDDLEWARE
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.use("/honeypot", honeypotRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Honeypot API running on port ${process.env.PORT}`);
});
