const path = require('path');
const dist = path.resolve(__dirname, 'dist');

module.exports = {
    entry: './src/Main.ts',
    module: {
        rules: [{
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: [
                /node_modules/,
                /Labs/
            ]
        }]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'galileo.js',
        path: dist,
        library: 'Main'
    },
    devServer: {
        contentBase: dist,
        compress: true,
        overlay: true,
        port: 1234
    }
};