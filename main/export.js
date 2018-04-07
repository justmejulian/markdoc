const electron = require('electron');
const { dialog, BrowserWindow, ipcMain } = electron;

// import constants
const {
  GET_DOCUMENT_CONTENT,
  FILETYPE_HTML
} = require('../app/utils/constants');
// import actions
const { saveFileDialog } = require('./actions');

function exportAsHtml(currentHTMLContent, currentFilePath, currentWindow) {
  if (currentFilePath === '' || currentFilePath === null) {
    showSaveFirstMessage(currentWindow);
    return;
  }
  var directoryPath = require('path').dirname(currentFilePath);
  saveFileDialog(
    FILETYPE_HTML,
    directoryPath,
    currentHTMLContent,
    '',
    currentWindow
  );
}

function showSaveFirstMessage(currentWindow) {
  dialog.showMessageBox(
    BrowserWindow.fromId(currentWindow),
    {
      type: 'info',
      message: 'Please save the file before exporting...',
      buttons: ['Save File']
    },
    BrowserWindow.fromId(currentWindow).send(GET_DOCUMENT_CONTENT, 'save')
  );
}

module.exports = {
  exportAsHtml: exportAsHtml
};
