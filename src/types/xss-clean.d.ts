declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  
  /**
   * Middleware to sanitize user input coming from POST body, GET queries, and url params
   */
  const xssClean: () => RequestHandler;
  export default xssClean;
}