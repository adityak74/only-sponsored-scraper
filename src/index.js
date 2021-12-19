/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
import cheerio from 'cheerio';

import Scraper from './scraper';

(async function () {
  const scraper = new Scraper({
    url: 'https://uktiersponsors.co.uk/',
    headless: true,
    devtools: false,
    slowRate: 150,
    viewportWidth: 1920,
    viewportHeight: 1080,
  });

  await scraper.setup();

  scraper.scrape(async (err, page) => {
    if (err) {
      console.log(err);
    } else {
      const companyWebsiteData = [];
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
        companyResults[0].childNodes.forEach((c) => {
          $(c).each((idx, company) => {
            const companyName = $($(company).find('td')[1]).text();
            const linkTd = $($(company).find('td')[3]);
            const linkHref = linkTd.find('div > a').attr('href');
            const companyLocation = $($(company).find('td')[7]).text();
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
        scraper.progressPrettyPrint();
      }
      // write all data to JSON file
      scraper.writeScrapedData('company-computer-programming-tier2', companyWebsiteData);
      await scraper.close();
    }
  });
}());
