declare module 'http' {
  export interface IncomingMessage {
    originalUrl: string;
    rawBody?: string;
  }
}
