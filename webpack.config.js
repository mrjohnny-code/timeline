const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  entry: './src/index.tsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev ? 'bundle.js' : '[name].[contenthash].js',
    clean: true
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    ...(!isDev
      ? [new MiniCssExtractPlugin({ filename: isDev ? 'styles.css' : '[name].[contenthash].css' })]
      : [])
  ],

  optimization: {
    minimize: !isDev,
    minimizer: [
      '...', // оставляем дефолтный JS минификатор
      new CssMinimizerPlugin()
    ],
    splitChunks: {
      chunks: 'all'
    }
  },

  devServer: {
    static: './dist',
    port: 3000,
    open: true,
    hot: true
  },

  devtool: isDev ? 'source-map' : false,

  mode: isDev ? 'development' : 'production'
}