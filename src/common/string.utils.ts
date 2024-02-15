import { customAlphabet } from 'nanoid';

export const SecureIdAlphabets = {
  Standard: '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstwxyz',
  Conservative: '234679ACDEFGHJKMNPQRTUVWXYZ',
};

// Filter out look alike and non alphanumeric chars
export const secureid = (size?: number, alphabet?: string): string => {
  return customAlphabet(alphabet || SecureIdAlphabets.Standard, size || 21)();
};

export const numeric = (str: string) => String(str).replace(/\W/g, '');

interface DatabaseConnectionOptions {
  driver?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
}

export const parseDatabaseUrl = (str: string): DatabaseConnectionOptions => {
  const url = new URL(str);

  return {
    // Protocol comes with ':' at the end usually
    driver: String(url.protocol).split(':').shift(),
    host: url.hostname,
    port: Number(url.port),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    database: String(url.pathname).split('/').pop(),
  };
};

/**
 * Extends the DatabaseConnectionOptions interface by adding a path property.
 */
interface RedisConnectionOptions extends DatabaseConnectionOptions {
  path?: string;
}

/**
 * @description
 * Parses the supplied string into a RedisConnectionOptions object.  Can handle local path nodes, as well as fully-
 * qualified strings.
 */
export const parseRedisUrl = (str: string): RedisConnectionOptions => {
  /* Determine which type of URL we're dealing with - if it's a local path, then we simply return an object with the path parameter. */
  return str.indexOf(':') < 0 ? { path: str } : parseDatabaseUrl(str);
};
