import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// Import other files
import Hello from './models/Hello';

var marked = require('marked');

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      text: ""
    }
    this.createMarkup = this.createMarkup.bind(this);
  }

  update(e) {
    this.setState({
      text: marked(e.target.value)
    });
  }

  createMarkup() {
    return {
      __html: this.state.text
    };
  }

  render() {
    return (
      <div>
        <textarea id="editor" onChange={this.update.bind(this)} />
        <p id="preview" dangerouslySetInnerHTML={this.createMarkup()}></p>
      </div>
    )
  }
}

export default App;
