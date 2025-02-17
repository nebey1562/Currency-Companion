const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5000;
const TARGET_URL = 'http://localhost:3000';
app.get('/scrape', async (req, res) => {
  try {
    const { data: html } = await axios.get(TARGET_URL);
    const $ = cheerio.load(html);
    const scrapedData = $('h1').first().text().trim();
    res.json({ scrapedData });
  } catch (error) {
    console.error('Error scraping website:', error);
    res.status(500).json({ error: 'Failed to scrape website' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
