const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      main: './src/index.js',
      room: './src/room.js',
      debug: './src/debug.js'
    },
    output: {
      path: path.resolve(__dirname, 'public/dist'),
      filename: isProduction 
        ? 'js/[name].[contenthash].bundle.js' 
        : 'js/[name].bundle.js',
      clean: true,
    },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/templates/index.html',
      filename: '../index.html',
      chunks: ['main'],
      title: '游戏大厅 - 在线聚会游戏平台'
    }),
    new HtmlWebpackPlugin({
      template: './src/templates/room.html',
      filename: '../room.html',
      chunks: ['room'],
      title: '游戏房间 - 在线聚会游戏平台'
    }),
    new HtmlWebpackPlugin({
      template: './src/templates/debug.html',
      filename: '../debug.html',
      chunks: ['debug'],
      title: '甜梦小酒馆 - 调试工具'
    })
  ],
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    devtool: 'source-map',
  };
}; 