export function filterNullish(obj: {}) {
  return Object.keys(obj).reduce((collector, objKey) => {
    if (typeof obj[objKey] !== 'undefined' && obj[objKey] !== null) {
      collector[objKey] = obj[objKey];
    }

    return collector;
  }, {});
}
