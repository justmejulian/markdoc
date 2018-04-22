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
    var currentWindow = require('electron').remote.getCurrentWindow().id;
    var currentFilePath = this.state.filePath;
    var currentContent = PageStore.getMarkdown();
    ipcRenderer.send(GET_DOCUMENT_CONTENT, {
      currentWindow,
      currentFilePath,
      currentContent
    });
  }

  _getHTMLContent(event, data) {
    var currentWindow = require('electron').remote.getCurrentWindow().id;
    var currentFilePath = this.state.filePath;
    var currentContent = Store.getHTML();
    ipcRenderer.send(GET_HTML_CONTENT, {
      currentFilePath,
      currentContent,
      currentWindow
    });
  }

  _getPDFContent(event, data) {
    var currentWindow = require('electron').remote.getCurrentWindow().id;
    var currentFilePath = this.state.filePath;
    console.log(ReactDOMServer.renderToStaticMarkup());
    var currentPages =
      '<div class="page page_0"><div class="header" style="border-bottom: 1px solid black;"><div class="hfLeft">"Zusammenfassung"</div><div class="hfCenter">"PSIT"</div><div class="hfRight">"Max Muster"</div></div><div><div id="0"><p>I LOVE REACT</p></div></div><div class="footer"><div class="hfLeft"></div><div class="hfCenter">1</div><div class="hfRight"></div></div></div>'; //ReactDOMServer.renderToStaticMarkup(WTFGOPFERTAMMI);
    ipcRenderer.send(GET_PDF_CONTENT, {
      currentWindow,
      currentFilePath,
      currentPages
    });
  }

  _setDocumentContent(event, data) {
    Actions.setHTML(data.currentContent);
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
