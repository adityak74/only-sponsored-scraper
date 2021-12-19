/* eslint-disable no-console */
/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
import cheerio from 'cheerio';
import invert from 'lodash/invert';
import Scraper from './scraper';

const selectionMap = {
  'Computer Programming': 11,
  'IT, Telecoms and Internet': 19,
  'Software Publishing': 36,
};

const invertedSelectionMap = invert(selectionMap);

// eslint-disable-next-line func-names
(async function () {
  const scraper = new Scraper({
    url: 'https://uktiersponsors.co.uk/',
    headless: false,
    devtools: false,
    slowRate: 150,
    viewportWidth: 1920,
    viewportHeight: 1080,
  });

  await scraper.setup();

  const scrapeForOptions = async (page, dataVariable, location, category) => {
    console.log(`Scraping ${location} ${invertedSelectionMap[category]}`);
    await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] });
    await page.click('#root > div > div:nth-child(2) > div.jss115 > form > div > div:nth-child(5) > button');
    await page.waitForTimeout(300);
    await page.type('#town-search', location);
    await page.click('#select-industry');
    await page.waitForSelector('#menu-industry > div.jss16.jss280.jss26.jss17.jss281 > ul');
    await page.click(`#menu-industry > div.jss16.jss280.jss26.jss17.jss281 > ul > li:nth-child(${category})`);
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
      companyResults[0].childNodes.forEach((c) => {
        $(c).each((idx, company) => {
          const companyName = $($(company).find('td')[1]).text();
          const linkTd = $($(company).find('td')[3]);
          const linkHref = linkTd.find('div > a').attr('href');
          const companyLocation = $($(company).find('td')[7]).text();
          dataVariable.push({
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
      scraper.progressPrettyPrint();
    }
  };

  scraper.scrape(async (err, page) => {
    if (err) {
      console.log(err);
    } else {
      const companyWebsiteData = [];

      await scrapeForOptions(page, companyWebsiteData, 'London', selectionMap['Computer Programming']);
      await scrapeForOptions(page, companyWebsiteData, 'London', selectionMap['IT, Telecoms and Internet']);
      await scrapeForOptions(page, companyWebsiteData, 'London', selectionMap['Software Publishing']);
      // write all data to JSON file
      scraper.writeScrapedData('company-computer-programming-tier2', companyWebsiteData);
      await scraper.close();
    }
  });
}());
