import puppeteer from 'puppeteer';
import { writeFileSync } from 'jsonfile';

import Utils from '../utils';

let iter = 0;

class Scraper {
  constructor(opts) {
    this.opts = opts;
    this.browserContext = null;
    this.browserPageContext = null;

    const {
      logMessage,
      throwError,
      isInteger,
      isString,
      isBool,
      isNumber,
      isUrl,
    } = Utils;

    this.logMessage = logMessage;
    this.throwError = throwError;

    if (!this.opts) {
      this.throwError('No options provided');
    }

    const {
      url,
      headless,
      devtools,
      slowRate,
      viewportWidth,
      viewportHeight,
    } = this.opts;

    if (!isBool(headless)) {
      this.throwError('Headless should be boolean flag');
    }

    if (!isBool(devtools)) {
      this.throwError('Devtools should be boolean flag');
    }

    if (!isNumber(slowRate) || slowRate < 0 || !isInteger(slowRate)) {
      this.throwError('invalid slow rate');
    }

    if (!isNumber(viewportHeight) || !isInteger(viewportHeight)) {
      this.throwError('invalid slow rate', { originalValue: viewportWidth });
    }

    if (!isNumber(viewportWidth) || !isInteger(viewportWidth)) {
      this.throwError('invalid slow rate', { originalValue: viewportWidth });
    }

    if (!isString(url) || !isUrl(url)) {
      this.throwError('Invalid url', { originalValue: url });
    }

    this.urlToScrape = url;
    this.browserLaunchOpts = {
      headless,
      devtools,
      slowMo: Number(slowRate) || 0,
      defaultViewport: {
        width: Number(viewportWidth) || 1920,
        height: Number(viewportHeight) || 1080,
      },
    };

    process.on('SIGINT', () => {
      this.logMessage('Caught interrupt signal');
      process.exit(0);
    });
  }

  async setup() {
    this.logMessage(`Setting up browser, starting puppeteer, launching browser with options ${JSON.stringify(this.browserLaunchOpts)}`);
    this.logMessage('Press Ctrl+C to exit');
    this.browserContext = await puppeteer.launch(this.browserLaunchOpts);
    this.browserPageContext = await this.browserContext.newPage();
    await this.browserPageContext.goto(this.urlToScrape, {
      waitUntil: 'networkidle0',
    });
    this.logMessage('Loaded page');
    return this.browserPageContext;
  }

  scrape(callback) {
    if (!this.browserPageContext) {
      this.throwError('No browser page context');
    }
    return callback(null, this.browserPageContext);
  }

  async close() {
    if (!this.browserContext) {
      this.throwError('No browser context');
    }
    await this.browserContext.close();
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  progressPrettyPrint() {
    process.stdout.clearLine(); // clear current text
    process.stdout.cursorTo(0); // move cursor to beginning of line
    iter = (iter + 1) % 4;
    const dots = new Array(iter + 1).join('.');
    process.stdout.write(`Scraping${dots}`); // write text
  }

  writeScrapedData(filename, data) {
    if (!filename) {
      this.throwError('No filename provided');
    }
    if (!data) {
      this.throwError('No data provided');
    }
    const filenameWithTimestamp = `${filename}_scrapedData_${new Date().getTime()}.json`;
    writeFileSync(filenameWithTimestamp, data, { spaces: 2 });
    this.logMessage(`Wrote data to ${filenameWithTimestamp}`);
  }
}

export default Scraper;
