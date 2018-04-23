import React, { Component } from 'react';
import ReactDOMServer from 'react-dom/server';
import { ipcRenderer } from 'electron';
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
    // TODO: change to generate markup from pages divs only -> how? I don't know.
    // refs on pages are set, I just need a way to access them and pass them to the ReactDOMServer
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
    return (
      '---\n' +
      'hasTitlepage: "' +
      Store.getHasTitlepage() +
      '"\n' +
      'hasHeader: "' +
      Store.getHasHeader() +
      '"\n' +
      'hasFooter: "' +
      Store.getHasFooter() +
      '"\n' +
      'title: "' +
      Store.getTitle() +
      '"\n' +
      'author: "' +
      Store.getAuthor() +
      '"\n' +
      'date: "' +
      Store.getDate() +
      '"\n' +
      'headerLeft: "' +
      Store.getHeaderLeft() +
      '"\n' +
      'headerMiddle: "' +
      Store.getHeaderMiddle() +
      '"\n' +
      'headerRight: "' +
      Store.getHeaderRight() +
      '"\n' +
      'footerLeft: "' +
      Store.getFooterLeft() +
      '"\n' +
      'footerMiddle: "' +
      Store.getFooterMiddle() +
      '"\n' +
      'footerRight: "' +
      Store.getFooterRight() +
      '"\n' +
      '---\n' +
      PageStore.getMarkdown()
    );
  }

  _setDocumentContent(event, data) {
    //TODO: fix opening/rendering
    var splitContent = data.currentContent.split('---\n');
    console.log(splitContent);
    var splitMetadata = splitContent[1].split('\n');
    console.log(splitMetadata);
    var editorContent = '';
    for (var i = 2; i < splitContent.length; i++) {
      editorContent = editorContent.concat(splitContent[i]);
    }
    console.log(editorContent);
    Actions.setMarkdown(editorContent);
    Actions.setHTML();
    this.setState({
      filePath: data.currentFilePath
    });
  }

  _setFilePath(event, data) {
    this.setState({
      filePath: data
    });
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

export default App;
