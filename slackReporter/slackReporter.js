const moment = require('moment');
const { emojis } = require('../constants/emojis');
//Modify the below URL with your project specific JIRA Url
const yourJiraURL = 'https://<org>.atlassian.net/browse/';

class SlackReporter {

    constructor (configure) {
        const SlackNode = require('slack-node');
        const slackStatus =  configure.slackNotification;

        if (slackStatus !== null) {
            this.slack = new SlackNode();
            this.slack.setWebhook(configure.slackWebhook);
            this.slackChannel = configure.slackChannel;
            this.slackUsername = configure.slackUsername;
            this.xrayStatus =  configure.slackNotification;
            this.messages = [];
            this.errorMessages = [];
        }
    }

    addMessage (message) {
        this.messages.push(message);
    }

    addErrorMessage (message) {
        this.errorMessages.push(message);
    }

    sendMessage (message, slackProperties = null, /*slackChannel, slackUsername, slackQuietMode*/) {
        this.slack.webhook(Object.assign({
            channel:  this.slackChannel,
            username: this.slackUsername,
            text:     message
        }, slackProperties), function (/*err, response*/) {
            console.log(`The following message is send to slack: \n ${message}`);
        });
    }

    sendTestReport (results, startTime, endTime, urlKey, linkingToTestPlanMessage) {
        const endTimeFormatted = moment(endTime).format('M/D/YYYY h:mm:ss a');
        const durationMs = endTime - startTime;
        const durationFormatted = moment.duration(durationMs).asMinutes();
        const finishedStr = `${emojis.finishFlag} Testing finished at *${endTimeFormatted}*\n`;
        const durationStr = `${emojis.stopWatch} Duration: *${Math.round(durationFormatted * 100) / 100}* minutes\n`;

        let summaryStr = '';

        if (results.skipped) 
            summaryStr += `${emojis.fastForward} ${`${results.skipped} skipped`}\n`;
    
        else if (results.failed) 
            summaryStr += `${emojis.noEntry} ${`${results.failed} failed / ${results.finished} test cases`}`;
    
        else {
            const status = `${results.passed} passed / ${results.finished} test cases`;

            summaryStr += results.passed === results.finished ? `${emojis.checkMark} ${status}` : `${emojis.noEntry} ${status}`;
        }
        const URL = `${yourJiraURL}${urlKey}`;
        const jiraID = this.xrayStatus.toUpperCase() === 'ON' ? `${URL}` : 'JIRA Xray updation turned off';
        const message = `\n\n\n *${'Test Result'}* \n ${finishedStr} ${durationStr} ${summaryStr} \n\n JIRA Test Exeuction URL : ${jiraID}`;

        this.addMessage(message);
        this.addMessage(linkingToTestPlanMessage);
        const nrFailedTests = results.finished - results.passed;

        this.sendMessage(this.getTestReportMessage(), nrFailedTests > 0 && this.loggingLevel === 'TEST'
            ? {
                'attachments': [{
                    color: 'danger',
                    text:  `${nrFailedTests} test failed`
                }]
            }
            : null
        );
    }

    sendTestStart (startTime, testCount, userAgents) {
        const startTimeFormatted = moment(startTime).format('M/D/YYYY h:mm:ss a');

        this.sendMessage(`${emojis.rocket} ${'Starting TestRun Time:'} ${`*${startTimeFormatted}*`} \n ${emojis.running} Running ${`*${testCount}*`} test case \n ${emojis.computer} Test Agent : ${`*${userAgents}*`} \n`);
    }

    getTestReportMessage () {
        let message = this.getSlackMessage();

        const errorMessage = this.getErrorMessage();

        if (errorMessage.length > 0 && this.loggingLevel === 'TEST') 
            message = message + '\n\n\n' + this.getErrorMessage() + '```';
    
        return message;
    }

    getErrorMessage () {
        return this.errorMessages.join('\n\n\n');
    }

    getSlackMessage () {
        return this.messages.join('\n');
    }
}

module.exports = SlackReporter;
