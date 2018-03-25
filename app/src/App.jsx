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
      value: ""
    }
  }

  handleChange (value) {
    this.setState({
      value: MDDOM.parse(value).toHtml()
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

  // TODO: replace text with editor content
  getDocumentContent(event, data) {
    console.log('getDocumentContent was called in renderer process by main process', data)
    ipcRenderer.send(GET_DOCUMENT_CONTENT, 'replace with actual text from document')
  }

  receiveDocumentContent(event, data) {
    console.log('receiveDocumentContent was called in renderer process by main process')
    console.log('the file content received was:', data)
    ipcRenderer.send(OPEN_FILE_FROM_PATH, 'The data was received succesfully')
    // TODO: put data into editor text field
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
        <Editor handleChange={this.handleChange.bind(this)} />
        <Preview html={this.state.value} />
      </div>
    )
  }
}

export default App;
