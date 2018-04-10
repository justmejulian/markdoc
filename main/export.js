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
  FILETYPE_HTML
} = require('../app/utils/constants');
// import actions
const { saveFileDialog } = require('./actions');
// import print window settings
const printWindow = require('./printWindow');

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

function exportAsPdf(currentFilePath, currentWindow, currentPages) {
  if (currentFilePath === '' || currentFilePath === null) {
    showSaveFirstMessage(currentWindow);
    return;
  }
  var directoryPath = require('path').dirname(currentFilePath);
  var pdfFilePath = path.join(directoryPath, 'print.pdf');
  const win = BrowserWindow.fromId(currentWindow);

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
    printToPDFWindow.webContents.printToPDF({}, function(printErr, data) {
      if (printErr) {
        return console.log(printErr.message);
      }

      fs.writeFile(pdfFilePath, data, function(writeErr) {
        if (writeErr) {
          return console.log(writeErr.message);
        }
        shell.openExternal('file://' + pdfFilePath);
      });
    });
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
