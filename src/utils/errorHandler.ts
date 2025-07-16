import { logger } from './logger';

export const handleError = (error: any, callback: (error: Error | null, response?: any) => void) => {
  logger.error(error.message);
  callback(new Error(error.message));
};