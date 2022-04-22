# testcafe-wdio-xray-slack-reporter

[![Build Status](https://travis-ci.org/vishal494/testcafe-wdio-xray-slack-reporter.svg)](https://travis-ci.org/vramesh/testcafe-wdio-xray-slack-reporter)

This is the **testcafe-wdio-xray-slack-reporter** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe).

<p align="center">
    <img src="https://github.com/vishal494/testcafe-wdio-xray-slack-reporter/master/media/preview.png" alt="preview" />
</p>

## Install

```
npm install testcafe-wdio-xray-slack-reporter
```

## Pre-requisite

Make sure you create a file named "reporterCustomData.json" in your testcafe or wdio project repository.
Sample reporterCustomData.json file is linked in this project for your reference.

If you want your report to show executor name pass it to your reporterCustomData.json file as
<key> : <Value>
ExecutorName : "name";

## Usage

When you run tests from the command line, specify the reporter name by using the `--reporter` option:

```
testcafe chrome 'path/to/test/file.js' --reporter testcafe-wdio-xray-slack-reporter
```

When you use API, pass the reporter name to the `reporter()` method:

```js
const reporter = require('testcafe-wdio-xray-slack-reporter);
testCafe
    .createRunner()
    .src("path/to/test/file.js")
    .browsers("chrome")
    .reporter(reporter) // <-
    .run();
```

Usage in wdio framework,

```js
const wdioReporter = require('reporter name/wdioReporter');
const wdioService = require('reporter name/wdioService');
 reporters: [
    'spec',
    ['allure', {
      outputDir: 'allure-results/',
      disableWebdriverStepsReporting: true,
      disableWebdriverScreenshotsReporting: false,}
    ],
    wdioReporter
  ],
  plugins: {
    'wdio-screenshot': {}
  },
  services: [[wdioService, {}]],

```



## Author

vishal494
