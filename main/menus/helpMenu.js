module.exports = {
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
};
