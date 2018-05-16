const electron = require('electron');
const { dialog, BrowserWindow, ipcMain, shell } = electron;

// pdf exports + shell see above
const os = require('os');
const fs = require('fs');
const path = require('path');

// import constants
const {
  GET_DOCUMENT_CONTENT,
  PRINT_URL,
  READY_TO_PRINT,
  FILETYPE_HTML,
  FILETYPE_PDF
} = require('../app/utils/constants');
// import actions
const { saveFile } = require('./actions');
// import print window settings
const printWindow = require('./print/printWindow');

function exportAsHtml(currentFilePath, currentHTMLContent, currentWindow) {
  if (currentFilePath === '' || currentFilePath === null) {
    showSaveFirstMessage(currentWindow);
    return;
  }
  saveFile(FILETYPE_HTML, currentFilePath, currentHTMLContent, currentWindow);
}

function exportAsPdf(currentFilePath, currentWindow, currentPages) {
  if (currentFilePath === '' || currentFilePath === null) {
    showSaveFirstMessage(currentWindow);
    return;
  }

  var printToPDFWindow = new BrowserWindow(printWindow);
  printToPDFWindow.loadURL(PRINT_URL);
  printToPDFWindow.webContents.openDevTools();
  // send pages to print window once its ready
  printToPDFWindow.webContents.on('did-finish-load', () => {
    printToPDFWindow.webContents.send('printPDF', currentPages);
  });

  printToPDFWindow.on('closed', () => {
    printToPDFWindow = undefined;
  });

  ipcMain.on(READY_TO_PRINT, (event, arg) => {
    printToPDFWindow.webContents.printToPDF(
      { pageSize: 'A4', printBackground: true },
      function(printErr, data) {
        if (printErr) {
          return console.log(printErr.message);
        }
        saveFile(FILETYPE_PDF, currentFilePath, data, currentWindow);
      }
    );
  });
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
  exportAsHtml: exportAsHtml,
  exportAsPdf: exportAsPdf
};
