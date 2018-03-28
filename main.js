// Basic init
const electron = require('electron');
const fs = require('fs');
const path = require('path');
const { app, dialog, ipcMain, BrowserWindow, Menu } = electron;

const {
  GET_DOCUMENT_CONTENT,
  OPEN_FILE_FROM_PATH
} = require('./app/utils/constants');

// Let electron reloads by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname);

// To avoid being garbage collected
let mainWindow;

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
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    titleBarStyle: 'hidden'
  });

  mainWindow.loadURL(`file://${__dirname}/app/index.html`);

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object & clear file variables
    mainWindow = null;
    filePath = null;
    fileName = null;
    content = null;
  });
}

// TODO: Refactor once save application state is implemented.
// save opened windows to array, remove duplicated code from above
function newWindow() {
  let newWindow = new BrowserWindow({ width: 1400, height: 1000 });
  newWindow.loadURL(`file://${__dirname}/app/index.html`);
}

// Save open dialog stuff
// TODO: once application state saving is implemented, save path/content per window
var filePath = null;
var fileName = null;
let content = null;

function openFileDialog() {
  dialog.showOpenDialog(
    // TODO: once multi-window is implemented, replace mainWindow with current window
    mainWindow,
    {
      properties: ['openFile'],
      filters: [{ name: 'Text', extensions: ['txt', 'md', 'mdoc'] }]
    },
    tempFilePath => {
      // tempFilePath is an array that contains all the selected
      if (tempFilePath === undefined) {
        console.log('No file selected');
        return;
      }

      // Save FilePath
      // TODO: once application state saving is implemented, save path per window
      filePath = tempFilePath[0];
      fileName = path.posix.basename(filePath);

      fs.readFile(tempFilePath[0], 'utf-8', (err, data) => {
        if (err) {
          console.log('An error ocurred reading the file :' + err.message);
          return;
        }

        mainWindow.send(OPEN_FILE_FROM_PATH, data);
      });
    }
  );
}

// TODO: attach save dialog to app window (=> macOS only)
function saveFileDialog() {
  if (filePath === null) {
    dialog.showSaveDialog(
      // TODO: once multi-window is implemented, replace mainWindow with current window
      mainWindow,
      {
        filters: [{
          name: 'Markdoc',
          extensions: ['mdoc']
        }]
      }, newPath => {
        if (newPath === undefined) {
          console.log("You didn't save the file");
          return;
        }
        // save FilePath
        filePath = newPath;
        writeFileToPath(filePath, content);
    });
  } else {
    writeFileToPath(filePath, content);
  }
}

function writeFileToPath(filePath, content) {
  fs.writeFile(filePath, content, err => {
    if (err) {
      console.log('An error ocurred creating the file ' + err.message);
    }
  });
}

// IPC event listener
ipcMain.on(GET_DOCUMENT_CONTENT, (event, arg) => {
  content = arg;
  saveFileDialog();
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
          mainWindow.send(GET_DOCUMENT_CONTENT, 'save');
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
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'window',
    submenu: [{ role: 'minimize' }, { role: 'close' }]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click() {
          require('electron').shell.openExternal(
            'https://github.engineering.zhaw.ch/vissejul/markdoc'
          );
        }
      }
    ]
  }
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
