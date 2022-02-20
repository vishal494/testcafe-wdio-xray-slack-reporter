const fs = require('fs');
const glob = require('glob');

exports.resolvePath = (path) => require('path').relative(process.cwd(), path);

exports.isFileExists = (path) => fs.existsSync(path);

exports.readFile = (filePath) => fs.readFileSync(filePath);

exports.readFileByLine = (filePath) => fs.readFileSync(filePath, 'utf-8');

exports.removeFile = (filePath) => fs.unlinkSync(filePath, (err) => {console.log(err);});

exports.getFilesInAPath = (path) => {
  // path indicating complete file name is returning as such.
  if (!path.includes('*')) return [path];
  const files = glob.sync(path);
  return files;
};