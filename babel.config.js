module.exports = api => ({
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 10,
        },
      },
    ],
  ],
  ignore: api.env('production') ? ['**/*.test.js'] : [],
});
