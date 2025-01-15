const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  const pageTitle = await page.title();
  const headers = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
    elements.map(el => el.textContent.trim())
  );
  const buttons = await page.$$eval('button', elements =>
    elements.map(el => el.textContent.trim())
  );
  const inputFields = await page.$$eval('input', elements =>
    elements.map(el => ({
      name: el.getAttribute('name'),
      placeholder: el.getAttribute('placeholder'),
      type: el.getAttribute('type'),
    }))
  );
  await browser.close();
  const extractedData = {
    pageTitle,
    headers,
    buttons,
    inputFields,
  };

  const jsonData = JSON.stringify(extractedData);
  const pythonProcess = spawn('python', ['./tts/tts_converter.py']);
  pythonProcess.stdin.write(jsonData);
  pythonProcess.stdin.end();
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python Output: ${data}`);
  });
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });
  pythonProcess.on('close', (code) => {
    console.log(`Python script exited with code ${code}`);
  });
})();