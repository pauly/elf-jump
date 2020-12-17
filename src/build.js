const metalsmith = require('metalsmith')
const assets = require('./lib/assets')
const inplace = require('metalsmith-in-place')
const layouts = require('metalsmith-layouts')
const markdown = require('metalsmith-markdown')
const nunjucks = require('nunjucks')
const inline = require('./lib/inline')
const path = require('path')
const metalsmithPath = require('metalsmith-path')

nunjucks.configure('./', { watch: false, noCache: true })

metalsmith(__dirname)
  .source(process.env.CONTENT || './content')
  .destination('../dist')
  .clean(Boolean(process.env.CLEAN))
  .use(assets({
    source: 'assets',
    destination: './'
  }))
  .use(metalsmithPath({ directoryIndex: 'index.html' }))
  .use(markdown())
  .use(inplace({
    engine: 'nunjucks',
    pattern: '**/*.html'
  }))
  .use(layouts({
    engine: 'nunjucks',
    pattern: '**/*.html',
    directory: 'views'
  }))
  .use(inline({
    rootpath: path.resolve('src/content')
  }))
  .build(err => {
    if (err) throw err
    console.log('🍺 Build ok')
  })
