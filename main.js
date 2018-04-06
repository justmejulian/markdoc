// Basic init
const electron = require('electron');
const fs = require('fs');
const path = require('path');
const { app, dialog, ipcMain, BrowserWindow, Menu } = electron;

// Constants
const {
  GET_DOCUMENT_CONTENT,
  OPEN_FILE_FROM_PATH,
  SET_FILE_PATH,
  EXTENSIONS
} = require('./app/utils/constants');

// Menus
const editMenu = require('./main/menus/editMenu');
const viewMenu = require('./main/menus/viewMenu');
const windowMenu = require('./main/menus/windowMenu');
const helpMenu = require('./main/menus/helpMenu');

// Window Settings
const defaultWindow = require('./main/defaultWindow');

// Let electron reloads by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname);

// To avoid being garbage collected
let mainWindow;
var fileName = null;

// TODO: save and reload application state (opened windows/documents, window size etc.)
// maybe use https://github.com/sindresorhus/electron-store to store application state?
app.on('ready', () => {
  createWindow();

  // Add the React Devtools to help dev
  const {
    default: installExtension,
    REACT_DEVELOPER_TOOLS
  } = require('electron-devtools-installer');
  installExtension(REACT_DEVELOPER_TOOLS)
    .then(name => console.log(`Added Extension:  ${name}`))
    .catch(err => console.log('An error occurred: ', err));

  // Build Menu from mainMenuTemplate
  const menu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(menu);
});

// TODO: save opened windows/application state in array, dereference windows if closed
function createWindow() {
  mainWindow = new BrowserWindow(defaultWindow);

  mainWindow.loadURL(`file://${__dirname}/app/index.html`);

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object & clear file variables
    mainWindow = null;
    fileName = null;
  });
}

// TODO: Refactor once save application state is implemented.
// save opened windows to array, remove duplicated code from above
function newWindow() {
  let newWindow = new BrowserWindow(defaultWindow);
  newWindow.loadURL(`file://${__dirname}/app/index.html`);
}

function openFileDialog() {
  var currentWindow = BrowserWindow.getFocusedWindow();
  var currentFilePath;
  dialog.showOpenDialog(
    currentWindow,
    {
      properties: ['openFile'],
      filters: [{ name: 'Text', extensions: EXTENSIONS }]
    },
    tempFilePath => {
      // tempFilePath is an array that contains all the selected
      if (tempFilePath === undefined) {
        console.log('No file selected');
        return;
      }

      // Save FilePath
      currentFilePath = tempFilePath[0];
      fileName = path.posix.basename(currentFilePath);

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

function saveFileDialog(currentContent, currentFilePath, currentWindow) {
  if (currentFilePath === null || currentFilePath === '') {
    dialog.showSaveDialog(
      BrowserWindow.fromId(currentWindow),
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
        writeFileToPath(currentContent, newPath, currentWindow);
      }
    );
  } else {
    writeFileToPath(currentContent, currentFilePath, currentWindow);
  }
}

function writeFileToPath(currentContent, currentFilePath, currentWindow) {
  BrowserWindow.fromId(currentWindow).send(SET_FILE_PATH, currentFilePath);
  fs.writeFile(currentFilePath, currentContent, err => {
    if (err) {
      console.log('An error ocurred creating the file ' + err.message);
    }
  });
}

// IPC event listener
ipcMain.on(GET_DOCUMENT_CONTENT, (event, arg) => {
  saveFileDialog(arg.currentContent, arg.currentFilePath, arg.currentWindow);
});

// Quit when all windows are closed => non-macOS only
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Recreate mainWindow if app is not closed but no window exists
// => macOS only
// TODO: only do so if no window is open (right now opens a new window if mainWindow is closed
// but any additional window is still open -> check if saved window array is empty
// -> see todo for "createWindow" function )
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Markdoc Menubar Template
const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New',
        accelerator: process.platform === 'darwin' ? 'Command+N' : 'Ctrl+N',
        click() {
          console.log('New');
          newWindow();
        }
      },
      {
        label: 'Open...',
        accelerator: process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
        click() {
          openFileDialog();
        }
      },
      {
        label: 'Save',
        accelerator: process.platform === 'darwin' ? 'Command+S' : 'Ctrl+S',
        click() {
          // Get File Content to save from renderer process
          BrowserWindow.getFocusedWindow().send(GET_DOCUMENT_CONTENT, 'save');
        }
      },
      { type: 'separator' },
      {
        label: 'Export as...',
        accelerator: process.platform === 'darwin' ? 'Command+E' : 'Ctrl+E',
        click() {
          console.log('Export as...');
        }
      }
    ]
  },
  editMenu,
  viewMenu,
  windowMenu,
  helpMenu
];

if (process.platform === 'darwin') {
  mainMenuTemplate.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services', submenu: [] },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  });

  // Edit menu
  mainMenuTemplate[2].submenu.push(
    { type: 'separator' },
    {
      label: 'Speech',
      submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }]
    }
  );

  // Window menu
  mainMenuTemplate[4].submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    { role: 'front' }
  ];
}
