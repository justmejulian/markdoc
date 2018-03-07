import React, { Component } from 'react';
import './styles/App.sass';
import './styles/Preview.scss';

import Editor from './models/Editor';
import Preview from './models/Preview';
import HtmlDOM from './js/htmlDom.js';

// Old
//var marked = require('marked');

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      value: ""
    }
    this.createMarkup = this.createMarkup.bind(this);
  }

  handleChange (value) {
    this.setState({
      value: HtmlDOM.fromSource(value).toHtml()
    });
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
        <Preview _html={this.createMarkup()} />
      </div>
    )
  }
}

export default App;
