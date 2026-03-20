module.exports = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-react',
      {
        runtime: 'automatic'
      }
    ]
  ],
  plugins: [
    [
      'babel-plugin-react-compiler',
      {
        // React 19 doesn't need runtime, but we can specify target for clarity
        // target: '19' is optional for React 19
      }
    ]
  ]
}
