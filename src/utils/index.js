const Utils = {
  logMessage: (message) => {
    console.log(`Scraper: ${message}`);
  },
  throwError(message, args = null) {
    if (args) {
      throw new Error(`Scraper": ${message} ${JSON.stringify(args)}`);
    }
    throw new Error(message);
  },
  isInteger(value) {
    if (Number(value) === Math.round(value)) return true;
    return false;
  },
  isString(value) {
    return typeof value === 'string';
  },
  isBool(value) {
    return typeof value === 'boolean';
  },
  isNumber(value) {
    return typeof value === 'number';
  },
  isUrl(value) {
    try {
      const parseUrl = new URL(value);
      if (parseUrl) return true;
    } catch (error) {
      return false;
    }
    return false;
  },
};

export default Utils;
