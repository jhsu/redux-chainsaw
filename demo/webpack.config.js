module.exports = {
  entry: './index.js',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel?stage=0'
      }
    ]
  },
};
