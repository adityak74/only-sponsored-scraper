const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { writeFileSync } = require('jsonfile');

let iter = 0;

const companyWebsiteData = [];

const loadingWhileScrapingPrinter = () => {
    process.stdout.clearLine();  // clear current text
    process.stdout.cursorTo(0);  // move cursor to beginning of line
    iter = (iter + 1) % 4;
    var dots = new Array(iter + 1).join(".");
    process.stdout.write("Scraping" + dots);  // write text
};

(async () => {
  const browser = await puppeteer.launch({
      headless: true,
      devtools: false,
      slowMo: 100, // this is important as each click loads more js code
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });
  const page = await browser.newPage();
  await page.goto('https://uktiersponsors.co.uk/', {
      waitUntil: 'networkidle0',
  });
  console.log('Loaded page');
  await page.type('#town-search', 'London');
  await page.click('#select-industry');
  await page.waitForSelector('#menu-industry > div.jss16.jss280.jss26.jss17.jss281 > ul');
  await page.click('#menu-industry > div.jss16.jss280.jss26.jss17.jss281 > ul > li:nth-child(11)');
  await page.click('#root > div > div:nth-child(2) > div.jss115 > form > div > div.jss125.jss152 > button');
  console.log('Searching data on page...');
  await page.click('#pagination-rows');
  await page.click('#pagination-menu-list > li:nth-child(3)');
  console.log('Search complete');
  await page.waitForTimeout(500);
  console.log('Parsing now...');
  // get page content now
  const scrapeCompanyData = async () => {
    const content = await page.content();
    const $ = cheerio.load(content);
    const companyResults = $('#root > div > div:nth-child(2) > div:nth-child(2) > div > div.jss338 > table > tbody');
    companyResults[0].childNodes.forEach(c => {
        $(c).each((idx, company) => {
          let companyName = $($(company).find('td')[1]).text();
          let linkTd = $($(company).find('td')[3]);
          let linkHref = linkTd.find('div > a').attr('href');
          let companyLocation = $($(company).find('td')[7]).text();
          companyWebsiteData.push({
              companyName,
              companyUrl: linkHref,
              companyLocation,
          });
        });
    });
  };

  const waitAndScrape = async () => {
    await page.waitForTimeout(250);
    scrapeCompanyData();
  };

  let is_next_disabled = false;
  while (!is_next_disabled) {
    // load more results and wait for network request to complete
    try {
        is_next_disabled = await page.$('#pagination-next[disabled]') !== null;
        await waitAndScrape();
        await page.click('#pagination-next');
    } catch (error) {
        break;
    }
    loadingWhileScrapingPrinter();
  }
  console.log();
  // write all data to JSON file
  writeFileSync('company-computer-programming-tier2.json', companyWebsiteData, { spaces: 2 });
  console.log('Data written to JSON, closing scraper');
  // close the browser and exit
  await browser.close();
})();