const moment = require('moment');
const SlackMessage = require('../slackReporter/slackReporter');
const { getAuthenticationToken, createTestExecution, linkingToTestPlan } = require('../xrayReporter/xrayReporter');
const loadReporterConfig = require('../config/config');
const configure = loadReporterConfig();
const reportsFile = 'mergedResults.txt';
const helper = require('../util/fileHelper');

class ReporterService {
    async onPrepare (config, capabilities) {
        if (helper.isFileExists(reportsFile)) helper.removeFile(reportsFile);
        console.log('JSON file content ', configure);
        const startTime = moment.now();

        config.startTime = startTime;
        // in ios.local capabilities devicename is mentined as 'appium:deviceName'
        // in android.local capabilities devicename is mentined as 'deviceName'
        // in remote config files capabilities devicename is mentined as 'device'
        let deviceName = capabilities[0].deviceName ? capabilities[0].deviceName : capabilities[0]['appium:deviceName'];

        deviceName = deviceName ? deviceName : capabilities[0].device;
        const userAgents = `${capabilities[0].platformName}/${deviceName}`;
        const testCount = this.getCountOfSpecFiles(config);
        const slack = new SlackMessage(configure);

        slack.sendTestStart(startTime, testCount, userAgents);
    }
    getCountOfSpecFiles (config) {
        let specFiles = [];

        let excludedFiles = [];

        for (let i = 0; i < config.specs.length; i++) 
            specFiles = specFiles.concat(helper.getFilesInAPath(config.specs[i].substring(2)));
    
        for (let i = 0; i < config.exclude.length; i++) 
            excludedFiles = excludedFiles.concat(helper.getFilesInAPath(config.exclude[i].substring(2)));
    
        const runningFiles = specFiles.filter(val => !excludedFiles.includes(val));

        return runningFiles.length;
    }

    async onComplete (exitCode, config) {
        const results = {
            passed:   0,
            skipped:  0,
            failed:   0,
            finished: 0
        };

        let urlKey;

        let authenticationToken;
        const tests = [];

        if (configure.xrayNotification.toUpperCase() === 'ON') {
            authenticationToken = getAuthenticationToken();
            // reading merged Results file
            if (helper.isFileExists(reportsFile)) {
                const uniqueTests = {};

                helper.readFileByLine(reportsFile).split(/\r?\n/).forEach(function (line) {
                    if (line !== '') {
                        const test = JSON.parse(line);

                        uniqueTests[test.testKey] = test;
                    }
                });
                for (const test of Object.values(uniqueTests)) {
                    if (test.status === 'PASSED') results.passed++;
                    if (test.status === 'SKIPPED') results.skipped++;
                    if (test.status === 'FAILED') results.failed++;
                    results.finished++;
                    tests.push(test);
                }
            }
            const info = {};

            info.summary = 'Automated test result';
            info.description = `This execution is automatically generated using our webdriverIO framework
      Total number of test case executed : ${results.finished}`;
            const report = { info, tests };
            const testExecutionResponse = createTestExecution(report, authenticationToken);

            console.log(testExecutionResponse);
            const testExecution = JSON.parse(testExecutionResponse.getBody('utf8'));

            console.log(`\nTestExecution Result ${JSON.stringify(testExecution)}`);
            urlKey = testExecution.key;
            const executionID = testExecution.id;
            const linkingToTestPlanMessage = await linkingToTestPlan(authenticationToken, urlKey, executionID);

            if (configure.slackNotification.toUpperCase() === 'ON') {
                const slack = new SlackMessage(configure);
                const startTime = config.startTime;
                const endTime = moment.now();

                slack.sendTestReport(results, startTime, endTime, urlKey, linkingToTestPlanMessage);
            }
        }
    }
}

module.exports = ReporterService;
