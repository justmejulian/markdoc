import React, { Component } from 'react';
import ReactDOMServer from 'react-dom/server';
import { ipcRenderer } from 'electron';
import moment from 'moment';
import './styles/App.sass';
import './styles/Preview.scss';
import './styles/reset.scss';
import './styles/Sidebar.sass';
import 'react-datepicker/dist/react-datepicker-cssmodules.css';
import './font/font.scss';

import {
  GET_DOCUMENT_CONTENT,
  GET_HTML_CONTENT,
  GET_PDF_CONTENT,
  OPEN_FILE_FROM_PATH,
  SET_FILE_PATH
} from '../utils/constants';

import Sidebar from './components/Sidebar.jsx';
import Editor from './components/Editor.jsx';
import Preview from './components/Preview.jsx';
import TitleBar from './components/Titlebar.jsx';
import Store from './stores/Store.js';
import PageStore from './stores/PagesStore.js';
import * as Actions from './actions/Actions';
import * as SidebarActions from './actions/SidebarActions';

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
    this.getHTMLContent = (event, data) => this._getHTMLContent(event, data);
    this.getPDFContent = (event, data) => this._getPDFContent(event, data);

    // prepare metadata helpers
    this.metaDataHelpers = [
      new MetaDataHelper(
        'hasTitlepage',
        SidebarActions.getHasTitlepage,
        SidebarActions.setHasTitlepage
      ),
      new MetaDataHelper(
        'hasHeader',
        SidebarActions.getHasHeader,
        SidebarActions.setHasHeader
      ),
      new MetaDataHelper(
        'hasFooter',
        SidebarActions.getHasFooter,
        SidebarActions.setHasFooter
      ),
      new MetaDataHelper(
        'title',
        SidebarActions.getTitle,
        SidebarActions.setTitle
      ),
      new MetaDataHelper(
        'author',
        SidebarActions.getAuthor,
        SidebarActions.setAuthor
      ),
      new MetaDataHelper(
        'date',
        value => {
          SidebarActions.setDate(moment(this._prepareDate(value)));
        },
        SidebarActions.setAuthor
      ),
      new MetaDataHelper(
        'headerLeft',
        SidebarActions.getHeaderLeft,
        SidebarActions.setHeaderLeft
      ),
      new MetaDataHelper(
        'headerMiddle',
        SidebarActions.getHeaderMiddle,
        SidebarActions.setHeaderMiddle
      ),
      new MetaDataHelper(
        'headerRight',
        SidebarActions.getHeaderRight,
        SidebarActions.setHeaderRight
      ),
      new MetaDataHelper(
        'footerLeft',
        SidebarActions.getFooterLeft,
        SidebarActions.setFooterLeft
      ),
      new MetaDataHelper(
        'footerMiddle',
        SidebarActions.getFooterMiddle,
        SidebarActions.setFooterMiddle
      ),
      new MetaDataHelper(
        'footerRight',
        SidebarActions.getFooterRight,
        SidebarActions.setFooterRight
      )
    ];
  }

  // IPC event listeners
  componentDidMount() {
    ipcRenderer.on(GET_DOCUMENT_CONTENT, this.getDocumentContent);
    ipcRenderer.on(GET_HTML_CONTENT, this.getHTMLContent);
    ipcRenderer.on(GET_PDF_CONTENT, this.getPDFContent);
    ipcRenderer.on(OPEN_FILE_FROM_PATH, this.setDocumentContent);
    ipcRenderer.on(SET_FILE_PATH, this.setFilePath);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(GET_DOCUMENT_CONTENT, this.getDocumentContent);
    ipcRenderer.removeListener(GET_HTML_CONTENT, this.getHTMLContent);
    ipcRenderer.removeListener(GET_PDF_CONTENT, this.getPDFContent);
    ipcRenderer.removeListener(OPEN_FILE_FROM_PATH, this.setDocumentContent);
    ipcRenderer.removeListener(SET_FILE_PATH, this.setFilePath);
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

  _getHTMLContent(event, data) {
    var currentWindow = require('electron').remote.getCurrentWindow().id;
    var currentFilePath = this.state.filePath;
    //TODO: generate valid HTML and apply CSS from the preview
    var currentContent = PageStore.getHTML();
    ipcRenderer.send(GET_HTML_CONTENT, {
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

    console.log('Test: ' + pagesAsString);
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
      this._processMdocMetadata(data.currentContent);
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
    console.log(editorContent);
    var indexOfMetadataEnd = editorContent.indexOf('---\n');

    // slice off metadata to get editor Content
    editorContent = editorContent.slice(
      indexOfMetadataEnd + 4,
      editorContent.size
    );
    this._showContent(editorContent);
  }

  _processMdocMetadata(currentContent) {
    // split metadata off currentContent
    var splitContent = currentContent.replace(/[\"\']/g, '').split('---\n');
    console.log(splitContent[1]);

    // split metadata lines
    var splitMetadata = splitContent[1].split('\n');
    // remove last empty array element
    splitMetadata.splice(splitMetadata.length - 1, 1);
    console.log(splitMetadata);

    // set sidebar Content
    this._setSidebarContent(splitMetadata);
  }

  _showContent(editorContent) {
    Actions.setMarkdown(editorContent);
    Actions.setHTML();
  }

  _setSidebarContent(splitMetadata) {
    for (var metString of splitMetadata) {
      for (const metaDataHelper of this.metaDataHelpers) {
        metaDataHelper.consume(metString);
      }
    }
  }

  _setFilePath(event, data) {
    this.setState({
      filePath: data
    });
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
  constructor(name, getter, setter) {
    this.name = name;
    this.getter = getter;
    this.setter = setter;
  }
  toString() {
    return '\t' + this.name + ': "' + getter() + '"';
  }
  consume(string) {
    var regex = new RegExp('^\t' + this.name + ': "([^"]+)"$');
    var match = regex.compile().exec(string);
    if (match == null)
      error('Expected key value pair "' + this.name + '" - found: ' + string);
    var value = match[1];
    setter(value);
    return true;
  }
}

export default App;
