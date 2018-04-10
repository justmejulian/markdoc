const electron = require('electron');
const fs = require('fs');
const { dialog, BrowserWindow, ipcMain } = electron;

const {
  HOME_DIRECTORY,
  OPEN_FILE_FROM_PATH,
  SET_FILE_PATH,
  EXTENSIONS
} = require('../app/utils/constants');

function openFileDialog() {
  var currentWindow = BrowserWindow.getFocusedWindow();
  var currentFilePath;
  dialog.showOpenDialog(
    currentWindow,
    {
      defaultPath: HOME_DIRECTORY,
      properties: ['openFile'],
      filters: [{ name: 'Text', extensions: EXTENSIONS }]
    },
    tempFilePath => {
      // tempFilePath is an array that contains all the selected
      if (tempFilePath === undefined) {
        console.log('No file selected');
        return;
      }

      currentFilePath = tempFilePath[0];

      fs.readFile(currentFilePath, 'utf-8', (err, currentContent) => {
        if (err) {
          console.log('An error ocurred reading the file :' + err.message);
          return;
        }

        currentWindow.send(OPEN_FILE_FROM_PATH, {
          currentFilePath,
          currentContent
        });
      });
    }
  );
}

function saveFileDialog(
  fileType,
  directoryPath,
  currentContent,
  currentFilePath,
  currentWindow
) {
  if (currentFilePath === null || currentFilePath === '') {
    dialog.showSaveDialog(
      BrowserWindow.fromId(currentWindow),
      {
        defaultPath: directoryPath === '' ? HOME_DIRECTORY : directoryPath,
        filters: [fileType]
      },
      newPath => {
        if (newPath === undefined) {
          console.log("You didn't save the file");
          return;
        }
        writeFileToPath(currentContent, newPath, currentWindow);
      }
    );
  } else {
    writeFileToPath(currentContent, currentFilePath, currentWindow);
  }
}
// TODO: don't update filepath when exporting to html/pdf
function writeFileToPath(currentContent, currentFilePath, currentWindow) {
  BrowserWindow.fromId(currentWindow).send(SET_FILE_PATH, currentFilePath);
  fs.writeFile(currentFilePath, currentContent, err => {
    if (err) {
      console.log('An error ocurred creating the file ' + err.message);
    }
  });
}

module.exports = {
  openFileDialog: openFileDialog,
  saveFileDialog: saveFileDialog,
  writeFileToPath: writeFileToPath
};
