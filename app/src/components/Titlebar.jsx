import React, { Component } from 'react';

import PagesStore from '../stores/PagesStore.js';
import { WordCounter } from '../js/wordcounter.js';

class TitleBar extends React.Component {
  constructor() {
    super();
    this.state = {
      words: 0
    };

    this.getWords = this.getWords.bind(this);
  }

  componentWillMount() {
    PagesStore.on('HTML_changed', this.getWords);
  }

  getWords() {
    var markdown = PagesStore.getMarkdown();
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
