const electron = require('electron');
const { ipcMain, BrowserWindow } = electron;

// import constants
const {
  GET_DOCUMENT_CONTENT,
  DEFAULT_URL
} = require('../../app/utils/constants');

// import window manager
const { createWindow } = require('../windowManager');
// import actions
const { openFileDialog } = require('../actions');

module.exports = {
  label: 'File',
  submenu: [
    {
      label: 'New',
      accelerator: process.platform === 'darwin' ? 'Command+N' : 'Ctrl+N',
      click() {
        createWindow(DEFAULT_URL);
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
};
