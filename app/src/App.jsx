import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import './styles/App.sass';
import './styles/Preview.scss';
import './styles/reset.scss';
import './font/font.scss';

import { GET_DOCUMENT_CONTENT, OPEN_FILE_FROM_PATH } from '../utils/constants';

import Sidebar from './components/Sidebar.jsx';
import Editor from './components/Editor.jsx';
import Preview from './components/Preview.jsx';
import TitleBar from './components/Titlebar.jsx';
import { MDDOM } from './js/markdown.js';
import Store from './stores/Store.js';
import * as Actions from './actions/Actions';

// Old
//var marked = require('marked');

class App extends React.Component {
  constructor() {
    super();
    this.state = {};

    // bind to this
    this.getDocumentContent = (event, data) =>
      this._getDocumentContent(event, data);
    this.setDocumentContent = (event, data) =>
      this._setDocumentContent(event, data);
  }

  // IPC event listeners
  componentDidMount() {
    ipcRenderer.on(GET_DOCUMENT_CONTENT, this.getDocumentContent);
    ipcRenderer.on(OPEN_FILE_FROM_PATH, this.setDocumentContent);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(GET_DOCUMENT_CONTENT, this.getDocumentContent);
    ipcRenderer.removeListener(OPEN_FILE_FROM_PATH, this.setDocumentContent);
  }

  _getDocumentContent(event, data) {
    ipcRenderer.send(GET_DOCUMENT_CONTENT, Store.getMarkdown());
  }

  _setDocumentContent(event, data) {
    Actions.setHTML(data);
  }

  render() {
    return (
      <div>
        <Sidebar />
        <TitleBar />
        <Editor />
        <Preview html={this.state.html} />
      </div>
    );
  }
}

export default App;
