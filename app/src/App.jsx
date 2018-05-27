import React, { Component } from 'react';
import ReactDOMServer from 'react-dom/server';
import { ipcRenderer } from 'electron';
import moment from 'moment';
import './styles/App.sass';
import './styles/reset.scss';
import './font/font.scss';

import {
  GET_DOCUMENT_CONTENT,
  GET_MD_CONTENT,
  GET_PDF_CONTENT,
  OPEN_FILE_FROM_PATH,
  SET_FILE_PATH,
  HANDLE_PREVIEW_ZOOM,
  TRIGGER_SIDEBAR,
  TRIGGER_TABLEMAKER
} from '../utils/constants';

import Sidebar from './components/Sidebar.jsx';
import Editor from './components/Editor.jsx';
import Preview from './components/Preview.jsx';
import TitleBar from './components/Titlebar.jsx';
import SidebarStore from './stores/SidebarStore.js';
import PageStore from './stores/PagesStore.js';
import * as Actions from './actions/Actions.js';
import * as SidebarActions from './actions/SidebarActions.js';

// Old
//var marked = require('marked');

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      filePath: ''
    };

    // bind to this
    this.getDocumentContent = (event, data) =>
      this._getDocumentContent(event, data);
    this.setDocumentContent = (event, data) =>
      this._setDocumentContent(event, data);
    this.setFilePath = (event, data) => this._setFilePath(event, data);
    this.getMDContent = (event, data) => this._getMDContent(event, data);
    this.getPDFContent = (event, data) => this._getPDFContent(event, data);
    this.handlePreviewZoom = (event, data) =>
      this._handlePreviewZoom(event, data);
    this.triggerSidebar = (event, data) => this._triggerSidebar(event, data);
    this.triggerTableMaker = (event, data) =>
      this._triggerTableMaker(event, data);

    // prepare metadata helpers
    this.metaDataHelpers = [
      new MetaDataHelper('hasTitlepage', val => {
        SidebarActions.setHasTitlepage(val);
      }),
      new MetaDataHelper('hasHeader', val => {
        SidebarActions.setHasHeader(val);
      }),
      new MetaDataHelper('hasFooter', val => {
        SidebarActions.setHasFooter(val);
      }),
      new MetaDataHelper('title', val => {
        SidebarActions.setTitle(val);
      }),
      new MetaDataHelper('author', val => {
        SidebarActions.setAuthor(val);
      }),
      new MetaDataHelper('date', value => {
        SidebarActions.setDate(moment(this._prepareDate(value)));
      }),
      new MetaDataHelper('headerLeft', val => {
        SidebarActions.setHeaderLeft(val);
      }),
      new MetaDataHelper('headerMiddle', val => {
        SidebarActions.setHeaderMiddle(val);
      }),
      new MetaDataHelper('headerRight', val => {
        SidebarActions.setHeaderRight(val);
      }),
      new MetaDataHelper('footerLeft', val => {
        SidebarActions.setFooterLeft(val);
      }),
      new MetaDataHelper('footerMiddle', val => {
        SidebarActions.setFooterMiddle(val);
      }),
      new MetaDataHelper('footerRight', val => {
        SidebarActions.setFooterRight(val);
      })
    ];
  }

  // IPC event listeners
  componentDidMount() {
    ipcRenderer.on(GET_DOCUMENT_CONTENT, this.getDocumentContent);
    ipcRenderer.on(GET_MD_CONTENT, this.getMDContent);
    ipcRenderer.on(GET_PDF_CONTENT, this.getPDFContent);
    ipcRenderer.on(OPEN_FILE_FROM_PATH, this.setDocumentContent);
    ipcRenderer.on(SET_FILE_PATH, this.setFilePath);
    ipcRenderer.on(HANDLE_PREVIEW_ZOOM, this.handlePreviewZoom);
    ipcRenderer.on(TRIGGER_SIDEBAR, this.triggerSidebar);
    ipcRenderer.on(TRIGGER_TABLEMAKER, this.triggerTableMaker);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(GET_DOCUMENT_CONTENT, this.getDocumentContent);
    ipcRenderer.removeListener(GET_MD_CONTENT, this.getMDContent);
    ipcRenderer.removeListener(GET_PDF_CONTENT, this.getPDFContent);
    ipcRenderer.removeListener(OPEN_FILE_FROM_PATH, this.setDocumentContent);
    ipcRenderer.removeListener(SET_FILE_PATH, this.setFilePath);
    ipcRenderer.removeListener(HANDLE_PREVIEW_ZOOM, this.handlePreviewZoom);
    ipcRenderer.removeListener(TRIGGER_SIDEBAR, this.triggerSidebar);
    ipcRenderer.removeListener(TRIGGER_TABLEMAKER, this.triggerTableMaker);
  }

  _getDocumentContent(event, data) {
    // Set Html to Preview
    Actions.setHTML();
    var currentWindow = require('electron').remote.getCurrentWindow().id;
    var currentFilePath = this.state.filePath;
    var currentContent = this._prepareMDOC();
    ipcRenderer.send(GET_DOCUMENT_CONTENT, {
      currentWindow,
      currentFilePath,
      currentContent
    });
  }

  _getMDContent(event, data) {
    var currentWindow = require('electron').remote.getCurrentWindow().id;
    var currentFilePath = this.state.filePath;
    //TODO: generate valid HTML and apply CSS from the preview
    var currentContent = PageStore.getMarkdown();
    ipcRenderer.send(GET_MD_CONTENT, {
      currentFilePath,
      currentContent,
      currentWindow
    });
  }

  _getPDFContent(event, data) {
    var currentWindow = require('electron').remote.getCurrentWindow().id;
    var currentFilePath = this.state.filePath;
    var currentPages = document.getElementsByClassName('page');
    var pagesAsString = '';
    for (var div of currentPages) {
      pagesAsString = pagesAsString.concat(
        new XMLSerializer().serializeToString(div)
      );
    }

    ipcRenderer.send(GET_PDF_CONTENT, {
      currentWindow,
      currentFilePath,
      pagesAsString
    });
  }

  // prepare document content: adds markdown metadata from the sidebar & content from editor
  _prepareMDOC() {
    var out = ['---'];
    for (const metaDataHelper of this.metaDataHelpers) {
      out.push(metaDataHelper.toString());
    }
    out.push('---');
    out.push(PageStore.getMarkdown());
    return out.join('\n');
  }

  _setDocumentContent(event, data) {
    //check if fileType is .mdoc
    if (this._isMdoc(data.currentFilePath)) {
      this._processMdocContent(data.currentContent, data.currentFilePath);
      this._setSidebarContent(data.currentContent);
      this._setFilePath(SET_FILE_PATH, data.currentFilePath);
    } else {
      // does not set/clears filePath to avoid metadata conflicts when saving,
      // otherwise the markdoc metadata would be saved to any text file
      this._showContent(data.currentContent);
      this._setFilePath(SET_FILE_PATH, '');
    }
  }

  _processMdocContent(currentContent, currentFilePath) {
    // prepare editor content
    var editorContent = currentContent.slice(4, currentContent.size);
    var indexOfMetadataEnd = editorContent.indexOf('---');

    // slice off metadata to get editor Content
    editorContent = editorContent.slice(
      indexOfMetadataEnd + 4,
      editorContent.size
    );
    this._showContent(editorContent);
  }

  _showContent(editorContent) {
    Actions.setMarkdown(editorContent);
    Actions.setHTML();
  }

  _setSidebarContent(currentContent) {
    var splitContent = currentContent.split('---');
    for (const metaDataHelper of this.metaDataHelpers) {
      if (!metaDataHelper.consume(splitContent[1])) {
        metaDataHelper.setDefault();
      }
    }
  }

  _setFilePath(event, data) {
    this.setState({
      filePath: data
    });
  }

  _handlePreviewZoom(event, data) {
    if (data == 'zoom-in') {
      Actions.zoomIn();
    } else if (data == 'zoom-out') {
      Actions.zoomOut();
    } else {
      Actions.zoomReset();
    }
  }

  _triggerSidebar(event, data) {
    SidebarActions.setIsCollapsed();
  }

  _triggerTableMaker(event, data) {
    SidebarActions.setPopupClosed();
  }

  _isMdoc(currentFilePath) {
    var fileExtension = currentFilePath.slice(
      currentFilePath.indexOf('.'),
      currentFilePath.size
    );
    if (fileExtension === '.mdoc') {
      return true;
    } else {
      return false;
    }
  }

  _prepareDate(strDate) {
    var splitDate = strDate.split('/');
    return splitDate[2] + '-' + splitDate[1] + '-' + splitDate[0];
  }

  render() {
    return (
      <div>
        <Sidebar />
        <TitleBar />
        <Editor />
        <Preview />
      </div>
    );
  }
}

class MetaDataHelper {
  constructor(name, setter) {
    this.name = name;
    this.setter = setter;
    this.default = 'default';
  }
  toString() {
    var value = '';
    switch (this.name) {
      case 'hasTitlepage':
        value = SidebarStore.getHasTitlepage();
        break;
      case 'hasHeader':
        value = SidebarStore.getHasHeader();
        break;
      case 'hasFooter':
        value = SidebarStore.getHasFooter();
        break;
      case 'title':
        value = SidebarStore.getTitle();
        break;
      case 'author':
        value = SidebarStore.getAuthor();
        break;
      case 'date':
        value = SidebarStore.getDate();
        break;
      case 'headerLeft':
        value = SidebarStore.getHeaderLeft();
        break;
      case 'headerMiddle':
        value = SidebarStore.getHeaderMiddle();
        break;
      case 'headerRight':
        value = SidebarStore.getHeaderRight();
        break;
      case 'footerLeft':
        value = SidebarStore.getFooterLeft();
        break;
      case 'footerMiddle':
        value = SidebarStore.getFooterMiddle();
        break;
      case 'footerRight':
        value = SidebarStore.getFooterRight();
        break;
      default:
        break;
    }
    return '\t' + this.name + ': "' + value + '"';
  }
  consume(string) {
    var regex = new RegExp('^\\s*' + this.name + ':\\s"(.*)"$', 'm');
    var match = regex.exec(string);
    if (match == null) return false;
    var value = match[1];
    if (value == 'true') {
      this.setter(true);
    } else if (value == 'false') {
      this.setter(false);
    } else {
      this.setter(value);
    }
    return true;
  }
  setDefault() {
    this.setter(this.default);
  }
}

export default App;
