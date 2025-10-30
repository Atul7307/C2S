const levels = ['info', 'warn', 'error', 'debug'];

const logger = levels.reduce((acc, level) => {
  acc[level] = (...args) => {
    if (level === 'debug' && process.env.NODE_ENV === 'production') {
      return;
    }
    // eslint-disable-next-line no-console
    console[level === 'info' ? 'log' : level](`[${level.toUpperCase()}]`, ...args);
  };
  return acc;
}, {});

module.exports = logger;
