// import menus
const editMenu = require('./menus/editMenu');
const viewMenu = require('./menus/viewMenu');
const windowMenu = require('./menus/windowMenu');
const helpMenu = require('./menus/helpMenu');
const fileMenu = require('./menus/fileMenu');

function configureMenu({ app }) {
  const mainMenuTemplate = [fileMenu, editMenu, viewMenu, windowMenu, helpMenu];

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

  return mainMenuTemplate;
}

module.exports = {
  configureMenu: configureMenu
};
