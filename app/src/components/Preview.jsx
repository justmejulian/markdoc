import React, { Component } from 'react';
import Page from './Page.jsx';
import Store from '../stores/Store.js';

class Preview extends React.Component {
  constructor(props) {
    super(props);
    this.setPreview = this.setPreview.bind(this);
    this.handleZoomIn = this._handleZoomIn.bind(this);
    this.state = {
      pages: [{ key: 0, html: Store.getMarkdown(), height: 0 }],
      words: [],
      currentWord: 0,
      currentPage: 0,
      zoom: 1
    };
  }

  componentWillMount() {
    Store.on('HTML_changed', this.setPreview);
  }

  setPreview() {
    var copyArray = [{ key: 0, html: '', height: 0 }];
    var html = Store.getHTML();
    var words = html.split(' ');

    //console.log(words);

    copyArray[0].html = words[0];

    this.setState(
      {
        pages: copyArray,
        words: words,
        currentWord: 0,
        currentPage: 0
      },
      this.nextWord
    );
  }

  _handleZoomIn() {
    if (this.state.zoom < 2) {
      var newState = this.state;
      newState.zoom += 0.1;
      this.setState(newState);
    } else {
      alert('Maximum zoom has been reached!');
    }
  }

  handleHeight(height, id) {
    //console.log("Height changed new height :" + height + " of Page" + id);
    var copyArray = this.state.pages.slice();
    copyArray[id].height = height;
    this.setState({ pages: copyArray });
    //console.log("The pages height is now :" +this.state.pages[id].height);
  }

  nextWord() {
    //console.log("Change");
    var copyArray = this.state.pages;
    var currentWord = this.state.currentWord;
    var currentPage = this.state.currentPage;
    //console.log("currentWord: " + currentWord + " and words.length: " +this.state.words.length);
    if (currentWord < this.state.words.length - 1) {
      if (copyArray[currentPage].height < 700) {
        currentWord = currentWord + 1;
        //console.log("Current Word: " + currentWord);
        //console.log("The word: " + this.state.words[currentWord]);
        copyArray[currentPage].html =
          copyArray[currentPage].html + ' ' + this.state.words[currentWord];
        this.setState(
          {
            pages: copyArray,
            currentWord: currentWord
          },
          this.nextWord
        );
      } else {
        currentPage = currentPage + 1;
        copyArray[currentPage] = { key: currentPage, html: '', height: 0 };
        this.setState(
          {
            pages: copyArray,
            currentPage: currentPage
          },
          this.nextWord
        );
        //console.log("Page to big");
        //console.log(this.state.pages);
      }
    }
    //console.log(this.state.pages);
  }

  render() {
    return (
      <div id="preview" style={{ zoom: this.state.zoom }}>
        <button className="zoomButton" onClick={this.handleZoomIn}>
          Zoom in
        </button>
        {this.state.pages.map(page => (
          <Page
            id={page.key}
            key={page.key}
            html={page.html}
            handleHeight={this.handleHeight.bind(this)}
          />
        ))}
      </div>
    );
  }
}

export default Preview;
