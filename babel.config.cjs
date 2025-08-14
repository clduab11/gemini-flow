module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: '18'
      },
      modules: 'auto'
    }],
    ['@babel/preset-typescript', {
      allowNamespaces: true,
      allowDeclareFields: true
    }]
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: '18'
          },
          modules: 'commonjs'
        }],
        ['@babel/preset-typescript', {
          allowNamespaces: true,
          allowDeclareFields: true
        }]
      ]
    }
  }
};