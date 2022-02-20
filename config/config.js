const helper = require('../util/fileHelper');
const configFilePath = helper.resolvePath('reporterCustomData.json');

let config = {};

const loadReporterConfig = () => {

    if (helper.isFileExists(configFilePath)) {
        try {
            const reporterConfiguration = helper.readFile(configFilePath);

            config = JSON.parse(reporterConfiguration);
            return config;
        }
        catch (err) {
            return 'reporterCustomData.json is not a valid file format';
        }
    }
    else 
        return new Error('File Not defined');
  
};

module.exports = loadReporterConfig;
