// Basic init
const electron = require('electron');
const fs = require('fs');
const { app, dialog, ipcMain, BrowserWindow, Menu } = electron;

// import constants
const {
  GET_DOCUMENT_CONTENT,
  GET_HTML_CONTENT,
  FILETYPE_MDOC,
  FILETYPE_HTML,
  DEFAULT_URL
} = require('./app/utils/constants');
// import actions
const { saveFileDialog } = require('./main/actions');
// import export functions
const { exportAsHtml } = require('./main/export');
// import window manager
const { markdocWindows, createWindow } = require('./main/windowManager');
// import menu configurator
const { configureMenu } = require('./main/menuConfigurator');

// Let electron reloads by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname);

// TODO: save and reload application state (opened windows/documents, window size etc.)
// maybe use https://github.com/sindresorhus/electron-store to store application state?
app.on('ready', () => {
  createWindow(DEFAULT_URL);

  // Add the React Devtools to help dev
  const {
    default: installExtension,
    REACT_DEVELOPER_TOOLS
  } = require('electron-devtools-installer');
  installExtension(REACT_DEVELOPER_TOOLS)
    .then(name => console.log(`Added Extension:  ${name}`))
    .catch(err => console.log('An error occurred: ', err));

  // Set application menu
  Menu.setApplicationMenu(Menu.buildFromTemplate(configureMenu({ app })));
});

// IPC event listener
ipcMain.on(GET_DOCUMENT_CONTENT, (event, arg) => {
  saveFileDialog(
    FILETYPE_MDOC,
    '',
    arg.currentContent,
    arg.currentFilePath,
    arg.currentWindow
  );
});

ipcMain.on(GET_HTML_CONTENT, (event, arg) => {
  exportAsHtml(arg.currentContent, arg.currentFilePath, arg.currentWindow);
});

// Quit when all windows are closed => non-macOS only
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Recreate mainWindow if app is not closed but no window exists => macOS only
app.on('activate', () => {
  if (Object.keys(markdocWindows).length === 0) {
    createWindow(DEFAULT_URL);
  }
});
