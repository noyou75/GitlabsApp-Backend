const glob = require('glob');
const loaderUtils = require('loader-utils');
const path = require('path');

const jsValidJson = value =>
  JSON.stringify(value)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

module.exports = function(source) {
  const exports = this.exec(source, this.resource);

  // loadFileClasses is copied from TypeORM, MIT License, Copyright (c) 2015-2016 Yakdu. http://typeorm.github.io
  // https://github.com/typeorm/typeorm/blob/master/src/util/DirectoryExportedClassesLoader.ts#L9
  return `
      var typeorm = require('typeorm');
      function loadFileClasses(exported, allLoaded) {
        if (typeof exported === "function" || exported instanceof typeorm.EntitySchema) {
            allLoaded.push(exported);
        }
        else if (Array.isArray(exported)) {
            exported.forEach(function (i) { return loadFileClasses(i, allLoaded); });
        }
        else if (typeof exported === "object") {
            Object.keys(exported).forEach(function (key) { return loadFileClasses(exported[key], allLoaded); });
        }
        return allLoaded;
      }
      module.exports = { ${Object.keys(exports)
        .map(key => {
          let value = exports[key];
          let stringified = false;
          // if (key === 'entities') {
          if (['entities', 'subscribers'].includes(key)) {
            let array = [];
            value.forEach(pattern =>
              glob.sync(pattern).forEach(entity => {
                this.addDependency(path.normalize(entity));
                array.push(`require(${loaderUtils.stringifyRequest(this, loaderUtils.urlToRequest(entity))})`);
              }),
            );
            value = `loadFileClasses([${array.join(', ')}], [])`;
            stringified = true;
          }

          if (!stringified) {
            value = jsValidJson(value);
          }
          return `${jsValidJson(key)}: ${value}`;
        })
        .join(', ')} };`;
};
