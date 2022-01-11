const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CssMin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const IsProd = !isDev;

module.exports = {
    mode: 'development',
    entry: {
        index: path.resolve(__dirname, './src/js'),
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
        clean: true,
    },
    devtool: isDev ? 'source-map': false,
    plugins: [
        new CleanWebpackPlugin(),
        new CssMin({
            filename: 'style.css',
        }),
        new HtmlWebpackPlugin({
            template: `./src/index.html`,
            filename: './index.html',
            inject: true
          }),
    ],
    module: {
        rules: [
            // CSS, PostCSS, Sass
            {
                test:/\.s[ac]ss$/i,
                use: [
                    CssMin.loader,
                    'css-loader',
                    'postcss-loader',
                    'sass-loader',
                ]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name][ext]'
                }
            },
            //Шрифты
            {
                test: /\.ttf$/,
                type: 'asset/resource',
                generator: {
                    filename: 'font/[name][ext]'
                }
            }
        ],
    },
}