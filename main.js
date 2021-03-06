// Basic init
const electron = require('electron');
const fs = require('fs');
const { app, dialog, ipcMain, BrowserWindow, Menu } = electron;

// import constants
const {
  GET_DOCUMENT_CONTENT,
  GET_MD_CONTENT,
  GET_PDF_CONTENT,
  FILETYPE_MDOC,
  FILETYPE_MD,
  DEFAULT_URL
} = require('./app/utils/constants');
// import actions
const { saveFile } = require('./main/actions');
// import export functions
const { exportAsMarkdown, exportAsPdf } = require('./main/export');
// import window manager
const { markdocWindows, createWindow } = require('./main/windowManager');
// import menu configurator
const { configureMenu } = require('./main/menuConfigurator');

// Check if running in dev mode
if (process.defaultApp) {
  // Enable live reload for Electron too
  require('electron-reload')(__dirname, {
    // Note that the path to electron may vary according to the main file
    electron: require(`${__dirname}/node_modules/electron`)
  });
}

// TODO: save and reload application state (opened windows/documents, window size etc.)
// maybe use https://github.com/sindresorhus/electron-store to store application state?
app.on('ready', () => {
  createWindow(DEFAULT_URL);

  // Check if running in dev mode
  if (process.defaultApp) {
    // Add the React Devtools to help dev
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS
    } = require('electron-devtools-installer');
    installExtension(REACT_DEVELOPER_TOOLS)
      .then(name => console.log(`Added an Extension:  ${name}`))
      .catch(err => console.log('An error occurred: ', err));
  }
  // Set application menu
  Menu.setApplicationMenu(Menu.buildFromTemplate(configureMenu({ app })));
});

// IPC event listener
ipcMain.on(GET_DOCUMENT_CONTENT, (event, arg) => {
  saveFile(
    FILETYPE_MDOC,
    arg.currentFilePath,
    arg.currentContent,
    arg.currentWindow
  );
});

ipcMain.on(GET_MD_CONTENT, (event, arg) => {
  exportAsMarkdown(arg.currentFilePath, arg.currentContent, arg.currentWindow);
});

ipcMain.on(GET_PDF_CONTENT, (event, arg) => {
  exportAsPdf(arg.currentFilePath, arg.currentWindow, arg.pagesAsString);
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
