require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const swig = require("swig");
const path = require("path");
//Database Connection
const connect_db = async () => {
  try {
    await mongoose.connect(process.env.DB_CONN);
    console.log("database connected !");
  } catch (error) {
    console.log(error);
  }
};
connect_db();

// Define the schema for our URLs
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});
// Define the URL model using the schema
const Url = mongoose.model("Url", urlSchema);

// Initializing express server
const app = express();

const PORT = process.env.PORT;
app.engine("html", swig.renderFile);
app.set("views", path.join(__dirname, "views")); // Set the template folder to an empty string to use the root directory
app.set("view engine", "html");
app.use(express.urlencoded({ extended: true }));

// Getting home page
app.get("/", (req, res) => {
  res.render("home.html");
});

//Create and store short url in database
app.post("/shorten", async (req, res) => {
  const originalUrl = req.body.url;
  const shortUrl = await shorten(originalUrl);
  res.render("result.html", { shortUrl });
});

// Define the function to generate a shortened URL and insert it into the database
async function shorten(originalUrl) {
  let shortUrl = generateShortUrl();
  while (await Url.findOne({ short_url: shortUrl })) {
    shortUrl = generateShortUrl();
  }
  const url = new Url({ original_url: originalUrl, short_url: shortUrl });
  await url.save();
  return shortUrl;
}

function generateShortUrl() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 7; i++) {
    const index = Math.floor(Math.random() * chars.length);
    code += chars[index];
  }
  return code;
}

app.get("/:shortUrl", async (req, res) => {
  const shortUrl = req.params.shortUrl;
  const originalUrl = await getUrl(shortUrl);
  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.send("URL not found");
  }
});

// Define the function to retrieve the original URL from the database
async function getUrl(shortUrl) {
  const url = await Url.findOne({ short_url: shortUrl });
  return url ? url.original_url : null;
}

app.listen(process.env.PORT, () => {
  console.log(`server started on port ${PORT} `);
});
