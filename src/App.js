import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import Editor from './models/Editor';
import Preview from './models/Preview';

var marked = require('marked');

class App extends React.Component {
    constructor() {
      super();
      this.state = {
        value: ""
      }
      this.createMarkup = this.createMarkup.bind(this);
    }

    handleChange (event) {
      this.setState({
        value: marked(event.target.value)
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
