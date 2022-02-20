'use strict';
const WDIOReporter = require('@wdio/reporter').default;
const moment = require('moment');
const fs = require('fs');
const reportsFile = 'mergedResults.txt';

class JsonReporter extends WDIOReporter {

    onTestPass (testStats) {
        const testRunInfo = 'Test executed without any error';

        this.writeToFile(testStats, testRunInfo);
    }

    onTestFail (testStats) {
        const testRunInfo = 'Execution failed.';

        this.writeToFile(testStats, testRunInfo);
    }

    onTestSkip (testStats) {
        const testRunInfo = 'Test execution skipped';

        this.writeToFile(testStats, testRunInfo);
    }

    writeToFile (testStats, testRunInfo) {
        const currentTest = {
            testKey: testStats.title.split(':')[0].trim(),
            comment: testRunInfo,
            status:  testStats.state.toUpperCase(),
            start:   moment(testStats.start).format('YYYY-MM-DDThh:mm:ssZ'),
            finish:  moment(testStats.end).format('YYYY-MM-DDThh:mm:ssZ')
        };
        // creating a merged result file

        fs.appendFile(reportsFile, JSON.stringify(currentTest) + '\n', function (err) {
            if (err) console.log('error', err);
        });
    }
}
module.exports = JsonReporter;
