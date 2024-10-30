const path = require('path');

module.exports = {
    entry: './src/example.ts', // Entry point of your application
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'example_bundle.js', // Output file name
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
    mode: 'production', // Set the mode to 'production' for minified output
}
