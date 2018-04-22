import React, { Component } from 'react';
import Store from '../stores/Store.js';
import { WordCounter } from '../js/wordcount.js';

class TitleBar extends React.Component {
  constructor() {
    super();
    this.state = {
      words: 0
    };
    this.getWords = this.getWords.bind(this);
  }

  componentWillMount() {
    Store.on('HTML_changed', this.getWords);
  }

  getWords() {
    var markdown = Store.getMarkdown();
    var countedWords = WordCounter.countWords(markdown);

    this.setState({
      words: countedWords
    });
  }

  render() {
    return (
      <div className="titleBar">
        <div className="words"> Words: {this.state.words} </div>
      </div>
    );
  }
}

export default TitleBar;
