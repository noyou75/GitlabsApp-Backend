export const enumKeys = (e: object) => Object.keys(e);
export const enumValues = (e: object) => enumKeys(e).map(k => e[k as any]);
