const electron = require('electron');
const fs = require('fs');
const path = require('path');
const { dialog, BrowserWindow } = electron;

function saveFileDialog(content, currentWindow) {
  var filePath = '';
  dialog.showSaveDialog(
    currentWindow,
    {
      filters: [
        {
          name: 'Markdoc',
          extensions: ['mdoc']
        }
      ]
    },
    newPath => {
      if (newPath === undefined) {
        console.log("You didn't save the file");
        return;
      }
      writeFileToPath(newPath, content);
    }
  );
}

function writeFileToPath(filePath, content) {
  fs.writeFile(filePath, content, err => {
    if (err) {
      console.log('An error ocurred creating the file ' + err.message);
    }
  });
}

module.exports = {
  saveFileDialog: saveFileDialog,
  writeFileToPath: writeFileToPath
};
