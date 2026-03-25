const puppeteer = require('puppeteer');

(async () => {
    console.log('Starting puppeteer...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));

    console.log('Navigating to PWA...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    console.log('Page loaded. Checking root element...');
    const appHtml = await page.evaluate(() => document.getElementById('app')?.innerHTML);
    console.log('App HTML length:', appHtml?.length || 'NULL');

    await browser.close();
})();
