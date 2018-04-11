const electron = require('electron');
const { BrowserWindow } = electron;

// To avoid being garbage collected
const _markdocWindows = {};

// import default window settings
const defaultWindow = require('./defaultWindow');

function _createWindow() {
  const window = new BrowserWindow(defaultWindow);

  _markdocWindows[window.id] = window;

  return window;
}

// should not need to be called directly, but just in case
// window.destroy() is called
function _unref() {
  delete _markdocWindows[this.id];
}

function createWindow(url) {
  const window = _createWindow();
  window.unref = _unref.bind(window);
  window.once('close', window.unref);
  window.loadURL(url);

  // Don't show until we are ready and loaded
  window.once('ready-to-show', () => {
    window.show();
  });

  return window;
}

module.exports = {
  markdocWindows: _markdocWindows,
  createWindow: createWindow,
  _unref: _unref
};
