'use strict';
let currentTest = {};
const axios = require('axios');
const loadReporterConfig = require('../config/config');
const configure = loadReporterConfig();
const SlackMessage = require('../slackReporter/slackReporter');
const { emojis } = require('../constants/emojis');
const moment = require('moment');
const async =  require('async');

const info = {};
const tests = [];

const reportTaskStart = async (startTime, userAgents, testCount) => {
    console.log('JSON file content ', configure);
    const startTimeFormatted = moment(this.startTime).format('M/D/YYYY h:mm:ss a');

    if (configure.slackNotification.toUpperCase() === 'ON') {
        this.slack = new SlackMessage(configure);
        this.startTime = startTime;
        this.testCount = testCount;
        this.slack.sendMessage(`${emojis.rocket} ${'Starting TestRun Time:'} ${`*${startTimeFormatted}*`} \n ${emojis.running} Running ${`*${testCount}*`} test case \n ${emojis.customer} Customer Name : ${`*${configure.customerName}*`} \n ${emojis.jenkins} Triggered By : ${`*${configure.ExecutorName}*`} \n ${emojis.computer} Test Agent : ${`*${userAgents}*`}\n`);
    }
};

const reportTestDone = async (name, testRunInfo, testMeta) => {
    const testStartDate = new Date();

    let testStatus = 'UNDEFINED';

    currentTest.testKey = testMeta.testID;
    if (!testRunInfo.skipped && JSON.stringify(testRunInfo.errs).replace(/[[\]]/g, '').length > 0) {
        testStatus = 'FAILED';
        testRunInfo = 'Execution failed.';
    }
    else {
        testRunInfo = 'Test executed without any error';
        testStatus = 'PASSED';
    }
    currentTest.comment = testRunInfo;
    currentTest.status = testStatus;
    currentTest.start =  moment(testStartDate).format('YYYY-MM-DDThh:mm:ssZ');
    currentTest.finish = moment(testStartDate).add('ms', testRunInfo.durationMs).format('YYYY-MM-DDThh:mm:ssZ');
    tests.push(JSON.parse(JSON.stringify(currentTest)));
    currentTest = {};
    let hasErr = false;

    if (configure.Slack_Notification === 'ON') {
        if (testRunInfo.errs.length) {
            console.log(`testRunInfo.errs.length ${testRunInfo.errs.length}`);
            hasErr = !!testRunInfo.errs.length;
        }
        let message = null;

        if (testRunInfo.skipped) 
            message = `${emojis.fastForward} ${name} - ${'skipped'}`;
    
        else if (hasErr) {
            message = `${emojis.fire} ${name} - ${'failed'}`;
            this.renderErrors(testRunInfo.errs);
        }
        else 
            message = `${emojis.checkMark} ${name}`;
    
        this.slack.addMessage(message);
    }
};

const reportFixtureStart = async ( /*name, path */) =>{};

const reportTestStart = async ( /*name, testMeta*/) => {};

const reportTaskDone = async (endTime, passed, /*warnings,*/ result) =>{

    info.summary = 'Automated test result';

    if (!await configure.BuildID.includes('Automation') ) {
        info.description = `This execution is automatically generated using our Testcafe framework
    Total number of test case executed : ${this.testCount} \n 
    \n 
    Triggered By : ${configure.ExecutorName}`;
    }
    else {
        info.description = `This execution is automatically generated using our Testcafe framework
    Total number of test case executed : ${this.testCount}
    \n 
    Triggered By : ${configure.ExecutorName}`;
    }
  
    const report = {
        info,
        tests
    };
    const bodyValue = JSON.stringify(report, null, 2);
    const startTime = this.startTime;
    const slack = this.slack;
    const testCount = this.testCount;

    let authenticationResponse;

    let urlKey;

    let executionID;

    let testExecutionResponse;

    let linkingToTestPlanMessage;

    /*
  *@Require: Xray authentication endpoint
  * Xray client ID, Xray client secret
  */
    if (configure.xrayNotification.toUpperCase() === 'ON') {
        async.waterfall([

            async function getAuthenticationToken () {
                console.log('Getting authentication token');
                authenticationResponse = await axios.post(await configure.xrayAuthenticationEndPoint,
                    {
                        'client_id':     await configure.xray_client_id,
                        'client_secret': await configure.xray_client_secret
                    });

                return authenticationResponse;
            },
            /*
      *@Require: Authentication token from previous api interaction
      */
            async function createTestExecution (authenticationTokenResult) {
                console.log(`Authentication Token ${JSON.stringify(authenticationTokenResult.data)}`);
                testExecutionResponse =  await axios.post(await configure.xrayImportExecutionEndPoint, bodyValue,
                    {
                        headers: {
                            Authorization:  `Bearer ${authenticationTokenResult.data}`,
                            'Content-Type': 'application/json' }
                    });

                return testExecutionResponse;
            },

            /*
      *@Require: Authentication key, Test execution key, XrayLinkToTestPlanEndPoint,
      * Xray Test Plan Key, Xray Test Plan ID
      */
            async function linkingToTestPlan (testExecution) {
                console.log(`\nTestExecution Result ${JSON.stringify(testExecution.data)}`);
                urlKey = testExecution.data.key;
                executionID = testExecution.data.id;
                await axios({
                    method: 'post',
                    url:    configure.xrayLinkToTestPlanEndPoint,
                    data:   {
                        query:
              `mutation {
                addTestExecutionsToTestPlan(
                    issueId: "${configure.xrayTestPlanID}",
                    testExecIssueIds: ["${executionID}"]
                ) {
                    addedTestExecutions
                    warning
                }
              }`
                    },
                    headers: {
                        Authorization:                  `Bearer ${authenticationResponse.data}`,
                        'Content-Type':                 'application/json',
                        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' }
                }).then((response) => {
                    console.log(`Linking test execution to test plan - ${JSON.stringify(response.data)}`);
                    linkingToTestPlanMessage = `${emojis.customer} Customer Name : ${`*${configure.customerName}*`} \n ${emojis.jenkinsParty} Triggered By : ${`*${configure.ExecutorName}*`} \n Successfully linked test execution ${`*${urlKey}*`} to test plan ${`*${configure.xrayTestPlanKey}*`}`;
                }).catch(err => {
                    console.error(`Failed to link Test Execution to Test Plan ${err}`);
                    linkingToTestPlanMessage = `${emojis.customer} Customer Name : ${`*${configure.customerName}*`} \n ${emojis.jenkinsAngry} Triggered By : ${`*${configure.ExecutorName}*`} \n *${emojis.wrong} Failed to link Test execution - ${urlKey}, id ${executionID} to test plan ${configure.xrayTestPlanKey}* `;
                });
            },

            async function reportToSlack () {
                if (configure.slackNotification.toUpperCase() === 'ON') {
                    const results = {
                        passed:   passed,
                        skipped:  result.skippedCount,
                        failed:   result.failedCount,
                        finished: testCount
                    };

                    slack.sendTestReport(results, startTime, endTime, urlKey, linkingToTestPlanMessage);
                }
            }
        ],
        function (err) {
            if (err) 
                throw new Error(err);
      
            else 
                console.log('No error occured in any steps, operation done!');
      
        });
    }
};

module.exports = function () {
    return {
        reportTaskStart,
        reportTestDone,
        reportFixtureStart,
        reportTestStart,
        reportTaskDone
    };
};
