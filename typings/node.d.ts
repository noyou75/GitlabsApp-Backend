declare global {
  namespace NodeJS {
    interface Global {
      __basedir: string;
    }
  }
}
