'use strict';
const axios = require('axios');
const request = require('sync-request');
const { emojis } = require('../constants/emojis');
const loadReporterConfig = require('../config/config');

let configure;

const getAuthenticationToken = () => {
    configure = loadReporterConfig();
    console.log('Getting authentication token');
    const response = request('POST', configure.xrayAuthenticationEndPoint, { json: {
        // eslint-disable-next-line camelcase
        client_id:     configure.xray_client_id,
        // eslint-disable-next-line camelcase
        client_secret: configure.xray_client_secret
    } });

    return JSON.parse(response.getBody('utf8'));
};

const createTestExecution = (report, authenticationToken) => {
    const testExecutionResponse =  request('POST', configure.xrayImportExecutionEndPoint,
        {
            headers: {
                Authorization:  `Bearer ${authenticationToken}`,
                'Content-Type': 'application/json' },
            json: report
        });

    return testExecutionResponse;
};

const linkingToTestPlan = async (authenticationToken, urlKey, executionID) => {
    let linkingToTestPlanMessage;

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
            Authorization:
      `Bearer ${authenticationToken}`,
            'Content-Type':                 'application/json',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' }
    }).then((response) => {
        console.log(`Linking test execution to test plan - ${JSON.stringify(response.data)}`);
        linkingToTestPlanMessage = `Successfully linked test execution ${`*${urlKey}*`} to test plan ${`*${configure.xrayTestPlanID}*`}`;
    }).catch(err => {
        console.error(`Failed to link Test Execution to Test Plan ${err}`);
        linkingToTestPlanMessage = `*${emojis.wrong} Failed to link Test execution - ${urlKey}, id ${executionID} to test plan ${configure.xrayTestPlanID}*`;
    });
    return linkingToTestPlanMessage;
};

module.exports = {
    getAuthenticationToken,
    createTestExecution,
    linkingToTestPlan
};
