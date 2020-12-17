const comments = false
const presets = [
  ['minify', {
    mangle: {
      exclude: {
        img: true
      }
    },
    // false, // process.env.NODE_ENV !== 'development',
    builtIns: false,
    evaluate: false
  }],
  [
    '@babel/env',
    {
      targets: {
        ie: '9',
        edge: '17',
        firefox: '60',
        chrome: '67',
        safari: '11.1'
      },
      modules: false,
      exclude: [
        '@babel/plugin-transform-typeof-symbol'
      ],
      useBuiltIns: false // 'usage'
    }
  ]
]
const plugins = [
  'transform-inline-environment-variables'
]

if (process.env.NODE_ENV !== 'development') {
  plugins.push('transform-remove-console')
}

module.exports = { comments, presets, plugins }
