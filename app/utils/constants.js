const os = require('os');

module.exports = {
  HOME_DIRECTORY: os.homedir(),
  GET_DOCUMENT_CONTENT: 'get-document-content',
  GET_MD_CONTENT: 'get-md-content',
  GET_PDF_CONTENT: 'get-pdf-content',
  READY_TO_PRINT: 'ready-to-print',
  OPEN_FILE_FROM_PATH: 'open-file-from-path',
  SET_FILE_PATH: 'set-file-path',
  HANDLE_PREVIEW_ZOOM: 'handle-preview-zoom',
  TRIGGER_SIDEBAR: 'trigger-sidebar',
  TRIGGER_TABLEMAKER: 'trigger-tablemaker',
  DEFAULT_URL: `file://${__dirname}/../index.html`,
  PRINT_URL: `file://${__dirname}/../../main/print/print.html`,
  FILETYPE_MDOC: {
    name: 'Markdoc',
    extensions: ['mdoc']
  },
  FILETYPE_PDF: {
    name: 'PDF',
    extensions: ['pdf']
  },
  FILETYPE_MD: {
    name: 'Markdown',
    extensions: ['md']
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
