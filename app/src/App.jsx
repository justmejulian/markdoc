import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import './styles/App.sass';
import './styles/Preview.scss';
import './styles/reset.scss';

import {
  GET_DOCUMENT_CONTENT,
  OPEN_FILE_FROM_PATH,
} from '../utils/constants';

import Editor from './models/Editor.jsx';
import Preview from './models/Preview.jsx';
import {MDDOM} from './js/markdown.js';

// Old
//var marked = require('marked');

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      html: "",
      value: "Test"
    }

    // bind to this
    this.getDocumentContent = (event, data) => this._getDocumentContent(event, data);
    this.receiveDocumentContent = (event, data) => this._receiveDocumentContent(event, data);
  }

  handleChange (value) {
    this.setState({
      html: MDDOM.parse(value).toHtml(),
      value: value
    });
  }

  // IPC event listeners
  componentDidMount() {
    ipcRenderer.on(GET_DOCUMENT_CONTENT, this.getDocumentContent)
    ipcRenderer.on(OPEN_FILE_FROM_PATH, this.receiveDocumentContent)
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(GET_DOCUMENT_CONTENT, this.getDocumentContent)
    ipcRenderer.removeListener(OPEN_FILE_FROM_PATH, this.receiveDocumentContent)
  }

  _getDocumentContent(event, data) {
    ipcRenderer.send(GET_DOCUMENT_CONTENT, this.state.value)
  }

  _receiveDocumentContent(event, data) {
    this.handleChange(data)
  }

  // ToDo: Move this to the Preview or some other class
  createMarkup() {
    return {
      __html: this.state.value
    };
  }

  render() {
    return (
      <div>
        <Editor handleChange={this.handleChange.bind(this)} value={this.state.value} />
        <Preview html={this.state.html} />
      </div>
    )
  }
}

export default App;
