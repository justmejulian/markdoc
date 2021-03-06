const electron = require('electron');
const { ipcMain, BrowserWindow } = electron;

// import constants
const {
  GET_DOCUMENT_CONTENT,
  GET_MD_CONTENT,
  GET_PDF_CONTENT,
  DEFAULT_URL,
  TRIGGER_SIDEBAR
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
      submenu: [
        {
          label: 'Export as PDF',
          accelerator:
            process.platform === 'darwin' ? 'Command+Shift+P' : 'Ctrl+Shift+P',
          click() {
            BrowserWindow.getFocusedWindow().send(GET_PDF_CONTENT, 'pdf');
          }
        },
        {
          label: 'Export as Markdown',
          accelerator:
            process.platform === 'darwin' ? 'Command+Shift+M' : 'Ctrl+Shift+M',
          click() {
            BrowserWindow.getFocusedWindow().send(GET_MD_CONTENT, 'md');
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'File Settings',
      accelerator: process.platform === 'darwin' ? 'Command+,' : 'Ctrl+,',
      click() {
        // Get File Content to save from renderer process
        BrowserWindow.getFocusedWindow().send(
          TRIGGER_SIDEBAR,
          'trigger-sidebar'
        );
      }
    }
  ]
};
