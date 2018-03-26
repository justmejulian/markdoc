import React, { Component } from 'react';

class Editor extends React.Component {
<<<<<<< HEAD
    constructor() {
      super();
      this.state = {
        value: ""
      }
    }

    handleChange({target}){
        this.setState({ value: target.value})
        this.props.handleChange(target.value)
    }

    componentWillReceiveProps(nextProps) {
      this.setState({
        value: nextProps.value
      })
    }

    handleKeyUp(e) {
        // Enter pressed
        if(e.keyCode === 13){
                //console.log("Enter Pressed");
                this.checkIfList();
        }
=======
  constructor() {
    super();
    this.state = {
      value: ''
    };
  }
  handleChange({ target }) {
    this.setState({ value: target.value });
    this.props.handleChange(target.value);
  }

  handleKeyUp(e) {
    // Enter pressed
    if (e.keyCode === 13) {
      //console.log("Enter Pressed");
      this.checkIfList();
>>>>>>> master
    }
  }

  // Checks on enter if first char is - and if so adds - to new line
  // Todo : fix for when text under what writing
  checkIfList() {
    console.log('checking if -');
    var lines = this.state.value.split('\n');
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
