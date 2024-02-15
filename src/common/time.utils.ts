export const microtime = () => {
  const hrtime = process.hrtime();
  return parseInt((hrtime[0] * 1e9 + hrtime[1]).toString().slice(0, -3), 10);
};
