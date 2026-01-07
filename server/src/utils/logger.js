import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
});

export default logger;

// Named exports for convenience
export const info = (msg, obj) => logger.info(obj, msg);
export const error = (msg, obj) => logger.error(obj, msg);
export const warn = (msg, obj) => logger.warn(obj, msg);
export const debug = (msg, obj) => logger.debug(obj, msg);
