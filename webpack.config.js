const path = require('path');
const nodeExternals = require('webpack-node-externals');

const libraries = [
    'wdioReporter',
    'wdioService',
    'testcafeReporter'
];
const webpackConfigs = [];

libraries.forEach(library => {
    webpackConfigs.push({
        entry:  `./${library}/index.js`,
        output: {
            globalObject:  'this',
            filename:      'index.js',
            path:          path.resolve(__dirname, `build/${library}`),
            library:       'custom-reporter',
            libraryTarget: 'umd'
        },
        target:    'node',
        externals: [nodeExternals()],
    });
});

module.exports = webpackConfigs;

