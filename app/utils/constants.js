const os = require('os');

module.exports = {
  HOME_DIRECTORY: os.homedir(),
  GET_DOCUMENT_CONTENT: 'get-document-content',
  GET_HTML_CONTENT: 'get-html-content',
  GET_PDF_CONTENT: 'get-pdf-content',
  READY_TO_PRINT: 'ready-to-print',
  OPEN_FILE_FROM_PATH: 'open-file-from-path',
  SET_FILE_PATH: 'set-file-path',
  HANDLE_PREVIEW_ZOOM: 'handle-preview-zoom',
  OPEN_SIDEBAR: 'open-sidebar',
  DEFAULT_URL: `file://${__dirname}/../index.html`,
  PRINT_URL: `file://${__dirname}/../../main/print.html`,
  FILETYPE_MDOC: {
    name: 'Markdoc',
    extensions: ['mdoc']
  },
  FILETYPE_PDF: {
    name: 'PDF',
    extensions: ['pdf']
  },
  FILETYPE_HTML: {
    name: 'HTML',
    extensions: ['html']
  },
  EXTENSIONS: [
    'mdoc',
    'markdown',
    'mdown',
    'mkdn',
    'md',
    'mkd',
    'mdwn',
    'mdtxt',
    'mdtext',
    'text',
    'txt'
  ]
};
