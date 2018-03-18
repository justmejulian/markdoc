// Basic init
const electron = require('electron')
const fs = require('fs')
const {app, dialog, ipcMain, BrowserWindow, Menu} = electron


// Let electron reloads by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname)

// To avoid being garbage collected
let mainWindow

// TODO: save and reload application state (opened windows/documents, window size etc.)
// maybe use https://github.com/sindresorhus/electron-store to store application state?
app.on('ready', () => {

    createWindow()

    // Build Menu from mainMenuTemplate
    const menu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(menu)

});

// TODO: save opened windows in array, dereference windows if closed
function createWindow() {
  mainWindow = new BrowserWindow({width: 1400, height: 1000, titleBarStyle: 'hiddenInset'})

  mainWindow.loadURL(`file://${__dirname}/app/index.html`)

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object
    mainWindow = null;
  });
}

// TODO: Refactor once save application state is implemented.
// save opened windows to array, remove duplicated code from above
function newWindow() {
  let newWindow = new BrowserWindow({width: 1400, height: 1000, titleBarStyle: 'hiddenInset'})
  newWindow.loadURL(`file://${__dirname}/app/index.html`)
}

// only brings up open dialog, does nothing so far...
// TODO: IPC to render process in react part of the app
function openFileDialog() {
  dialog.showOpenDialog(
    {
      properties: [ 'openFile'],
      filters: [
        { name: 'Text', extensions: ['txt', 'md', 'mdoc'] }
      ]
    }
  );
}

// only brings up save dialog, does nothing so far...
// TODO: IPC to render process in react part of the app
// TODO: attach save dialog to app window (=> macOS only)
function saveFileDialog() {
  dialog.showSaveDialog((fileName) => {
      if (fileName === undefined){
          console.log("You didn't save the file");
          return;
      }

      // fileName is a string that contains the path and filename created in the save file dialog.
      fs.writeFile(fileName, content, (err) => {
          if(err){
              alert("An error ocurred creating the file "+ err.message)
          }

          alert("The file has been succesfully saved");
      });
  });
}

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
          newWindow()
        }
      },
      {
        label: 'Open...',
        accelerator: process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
        click() {
          console.log('Open...');
          openFileDialog();
        }
      },
      {
        label: 'Save',
        accelerator: process.platform === 'darwin' ? 'Command+S' : 'Ctrl+S',
        click() {
          console.log('Save');
          saveFileDialog()
        }
      },
      {type: 'separator'},
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
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'delete'},
      {role: 'selectall'}
    ]
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {role: 'togglefullscreen'}
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'close'}
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () {
          require('electron').shell.openExternal('https://github.engineering.zhaw.ch/vissejul/markdoc')
        }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  mainMenuTemplate.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  })

  // Edit menu
  mainMenuTemplate[2].submenu.push(
    {type: 'separator'},
    {
      label: 'Speech',
      submenu: [
        {role: 'startspeaking'},
        {role: 'stopspeaking'}
      ]
    }
  )

  // Window menu
  mainMenuTemplate[4].submenu = [
    {role: 'close'},
    {role: 'minimize'},
    {role: 'zoom'},
    {type: 'separator'},
    {role: 'front'}
  ]
}
