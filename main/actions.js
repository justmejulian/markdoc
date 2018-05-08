const electron = require('electron');
const fs = require('fs');
const path = require('path');
const { dialog, BrowserWindow, ipcMain } = electron;

const {
  HOME_DIRECTORY,
  OPEN_FILE_FROM_PATH,
  SET_FILE_PATH,
  FILETYPE_MDOC,
  FILETYPE_HTML,
  FILETYPE_PDF,
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

function saveFile(fileType, currentFilePath, currentContent, currentWindow) {
  var defaultFilePathTitle = getDefaultTitle(
    currentFilePath,
    fileType,
    fileType.extensions[0]
  );
  switch (fileType) {
    case FILETYPE_MDOC:
      if (currentFilePath === null || currentFilePath === '') {
        openSaveDialog(
          fileType,
          defaultFilePathTitle,
          currentContent,
          currentWindow
        );
      } else {
        writeFileToPath(currentContent, currentFilePath);
      }
      break;
    default:
      openSaveDialog(
        fileType,
        defaultFilePathTitle,
        currentContent,
        currentWindow
      );
  }
}

// opens the save dialog and updates the filePath if fileType == FILETYPE_MDOC
function openSaveDialog(
  fileType,
  defaultFilePathTitle,
  currentContent,
  currentWindow
) {
  dialog.showSaveDialog(
    BrowserWindow.fromId(currentWindow),
    {
      defaultPath: defaultFilePathTitle
    },
    newPath => {
      if (newPath === undefined) {
        console.log("You didn't save the file");
        return;
      }
      // update filePath to prevent dialog to show up in the future
      if (fileType === FILETYPE_MDOC) {
        setFilePath(newPath, currentWindow);
      }
      writeFileToPath(currentContent, newPath);
    }
  );
}

function writeFileToPath(currentContent, currentFilePath) {
  fs.writeFile(currentFilePath, currentContent, err => {
    if (err) {
      console.log('An error ocurred creating the file ' + err.message);
    }
  });
}

function getDefaultTitle(filePath, fileType, extension) {
  if (filePath === undefined || filePath === '') {
    return path.join(HOME_DIRECTORY, 'Untitled') + '.' + extension;
  } else {
    var filename =
      path.join(getDirectoryName(filePath), getFilename(filePath)) +
      '.' +
      extension;
    return filename;
  }
}

function setFilePath(filePath, currentWindow) {
  BrowserWindow.fromId(currentWindow).send(SET_FILE_PATH, filePath);
}

// returns the filename without extension
function getFilename(filePath) {
  return path.posix.basename(filePath, path.extname(filePath));
}

// returns the user homedir if filePath is not defined
function getDirectoryName(filePath) {
  if (filePath === undefined || filePath === '') {
    return HOME_DIRECTORY;
  } else {
    return path.dirname(filePath);
  }
}

module.exports = {
  openFileDialog: openFileDialog,
  saveFile: saveFile,
  writeFileToPath: writeFileToPath,
  setFilePath: setFilePath,
  getFilename: getFilename,
  getDirectoryName: getDirectoryName
};
