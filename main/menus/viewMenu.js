const electron = require('electron');
const { ipcMain, BrowserWindow } = electron;

// import constants
const { HANDLE_PREVIEW_ZOOM } = require('../../app/utils/constants');

module.exports = {
  label: 'View',
  submenu: [
    { role: 'reload' },
    { role: 'forcereload' },
    { role: 'toggledevtools' },
    { type: 'separator' },
    {
      label: 'Actual Size',
      accelerator: process.platform === 'darwin' ? 'Command+0' : 'Ctrl+0',
      click() {
        BrowserWindow.getFocusedWindow().send(
          HANDLE_PREVIEW_ZOOM,
          'zoom-reset'
        );
      }
    },
    {
      label: 'Zoom In',
      accelerator: process.platform === 'darwin' ? 'Command+Plus' : 'Ctrl+Plus',
      click() {
        BrowserWindow.getFocusedWindow().send(HANDLE_PREVIEW_ZOOM, 'zoom-in');
      }
    },
    {
      label: 'Zoom Out',
      accelerator: process.platform === 'darwin' ? 'Command+-' : 'Ctrl+-',
      click() {
        BrowserWindow.getFocusedWindow().send(HANDLE_PREVIEW_ZOOM, 'zoom-out');
      }
    },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  ]
};
