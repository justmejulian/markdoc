// Basic init
const electron = require('electron')
const {app, BrowserWindow, Menu} = electron

// Let electron reloads by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname)

// To avoid being garbage collected
let mainWindow

app.on('ready', () => {

    let mainWindow = new BrowserWindow({width: 1400, height: 1000, titleBarStyle: 'hiddenInset'})

    mainWindow.loadURL(`file://${__dirname}/app/index.html`)

    // Build Menu from mainMenuTemplate
    const menu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(menu)

});

function newMainWindow() {
  let newMainWindow = new BrowserWindow({width: 1400, height: 1000, titleBarStyle: 'hiddenInset'})
  newMainWindow.loadURL(`file://${__dirname}/app/index.html`)
}

// Create menu template
const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New',
        accelerator: process.platform === 'darwin' ? 'Command+N' : 'Ctrl+N',
        click() {
          console.log('New');
          newMainWindow()
        }
      },
      {
        label: 'Open...',
        accelerator: process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
        click() {
          console.log('Open...');
        }
      },
      {
        label: 'Save',
        accelerator: process.platform === 'darwin' ? 'Command+S' : 'Ctrl+S',
        click() {
          console.log('Save');
        }
      },
      {type: 'separator'},
      {
        label: 'Export as...',
        accelerator: process.platform === 'darwin' ? 'Command+E' : 'Ctrl+E',
        click() {
          console.log('Export as...');
          createExportWindow();
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
