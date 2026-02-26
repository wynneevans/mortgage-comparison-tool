/**
 * Logger utility for conditional logging based on environment
 */

const isDev = import.meta.env.DEV;

// Set to true to see detailed App Check logs in development
const VERBOSE_LOGGING = false;

export const logger = {
  debug: (...args: any[]) => {
    if (isDev && VERBOSE_LOGGING) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDev && VERBOSE_LOGGING) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    console.warn(...args);
  },

  error: (...args: any[]) => {
    console.error(...args);
  },
};
