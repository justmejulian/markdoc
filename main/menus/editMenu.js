const electron = require('electron');
const { ipcMain, BrowserWindow } = electron;

// import constants
const { TRIGGER_TABLEMAKER } = require('../../app/utils/constants');

module.exports = {
  label: 'Edit',
  submenu: [
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'delete' },
    { role: 'selectall' },
    { type: 'separator' },
    {
      label: 'Insert Table',
      accelerator:
        process.platform === 'darwin' ? 'Command+Shift+T' : 'Ctrl+Shift+T',
      click() {
        // Get File Content to save from renderer process
        BrowserWindow.getFocusedWindow().send(
          TRIGGER_TABLEMAKER,
          'trigger-tablemaker'
        );
      }
    }
  ]
};
