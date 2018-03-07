'use strict';

const electron = require('electron');
const { app, BrowserWindow, crashReporter, ipcMain, dialog } = electron;
const fs = require('fs');

ipcMain.on('synchronous-message', (event, arg) => {
  console.info('ipcMain', arg);
  saveFile('my_testfile.txt', arg);
  event.returnValue = 'done'
});

const saveFile = (defaultPath, fileContent) => {
  dialog.showSaveDialog({ defaultPath }, fileName => {
    if (fileName) {
      fs.writeFile(fileName, fileContent, 'utf8', err => {

      });
    }
  });
}

// Report crashes to our server.
crashReporter.start({
  productName: 'timeTracker',
  companyName: 'kgde',
  submitURL: '',
  uploadToServer: false
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Only open dev tools in dev environment
  //if(process.env.ENVIRONMENT === 'DEV') {
    // Open the DevTools.
    mainWindow.openDevTools();
  //}

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});