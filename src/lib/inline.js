const { dirname, resolve } = require('path')
const { inlineSource } = require('inline-source')
const { transformSync } = require('@babel/core')

/*
 * Filter files to find HTML files.
 * Iterate through each file name and grab
 * the contents of each file and replace
 * with an inlined version.
 */

const replaceRequire = source => (_, importPath) => {
  try {
    const resolved = resolve(dirname(source.filepath), eval(importPath))
    const moduleToImport = require(resolved)
    return String(moduleToImport)
  } catch (err) {
    console.error(err)
  }
  return '{}'
}

const handler = (source, context) => {
  if (source.type === 'js') {
    if (source.fileContent) {
      if (!source.content) {
        if (/require/.test(source.fileContent)) {
          source.fileContent = source.fileContent.replace(/require\((.+?)\)/g, replaceRequire(source))
        }
        const result = transformSync(String(source.fileContent))
        if (result) source.content = result.code
      }
    }
  }
  return Promise.resolve()
}

module.exports = function (options = {}) {
  options.handlers = [handler]
  return function (files, metalsmith, done) {
    const htmlFiles = Object.keys(files).filter(file => /[.](?:html?)$/.test(file))
    htmlFiles.map(async function (file) {
      try {
        files[file].contents = Buffer.from(await inlineSource(String(files[file].contents), options), 'utf8')
        // compress: true,
        // ignore: ['css', 'png']
      } catch (err) {
        console.error(file, err)
      }
    })
    done()
  }
}
