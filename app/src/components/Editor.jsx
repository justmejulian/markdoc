import React, { Component } from 'react';
import Store from '../stores/Store.js';
import * as Actions from '../actions/Actions';

class Editor extends React.Component {
  constructor() {
    super();
    this.getMarkdown = this.getMarkdown.bind(this);
    this.state = {
      value: Store.getMarkdown()
    };
  }

  componentWillMount() {
    Store.on('HTML_changed', this.getMarkdown);
  }

  getMarkdown() {
    this.setState({
      value: Store.getMarkdown()
    });
  }

  handleChange({ target }) {
    Actions.setHTML(target.value);
    this.setState({
      value: target.value
    });
  }

  handleKeyUp(e) {
    // Enter pressed
    if (e.keyCode === 13) {
      //console.log("Enter Pressed");
      this.checkIfList();
    }
  }

  // Checks on enter if first char is - and if so adds - to new line
  // Todo : fix for when text under what writing
  checkIfList() {
    console.log('checking if -');
    var lines = Store.getMarkdown().split('\n');
    var length = lines.length;
    var lastLine = lines[length - 2];
    var firstChar = lastLine.charAt(0);
    // Todo check if second is " "
    if (firstChar == '-') {
      //console.log("found -");
      var value = this.state.value;
      value += '- ';
      this.setState({ value: value });
      console.log(this.state.value);
    }
  }

  render() {
    return (
      <textarea
        id="editor"
        onChange={this.handleChange.bind(this)}
        value={this.state.value}
        onKeyUp={this.handleKeyUp.bind(this)}
      />
    );
  }
}

export default Editor;