import React, { Component } from 'react';
import Page from './Page.jsx';
import Store from '../stores/Store.js';

class Preview extends React.Component {
  constructor(props) {
    super(props);
    this.setPreview = this.setPreview.bind(this);
    this.handleZoomIn = this._handleZoomIn.bind(this);
    this.handleZoomOut = this._handleZoomOut.bind(this);
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
    if (this.state.zoom < 1.7) {
      //If not: Silently do nothing.
      var newState = this.state;
      newState.zoom += 0.1;
      this.setState(newState);
    }
  }

  _handleZoomOut() {
    if (this.state.zoom > 0.5) {
      //If not: Silently do nothing.
      var newState = this.state;
      newState.zoom -= 0.1;
      this.setState(newState);
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
      <div id="preview">
        <div id="zoomButtonContainer">
          <button className="zoomButton" onClick={this.handleZoomIn}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm2.5-4h-2v2H9v-2H7V9h2V7h1v2h2v1z" />
            </svg>
          </button>
          <button className="zoomButton" onClick={this.handleZoomOut}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z" />
            </svg>
          </button>
        </div>
        <div style={{ zoom: this.state.zoom }}>
          {this.state.pages.map(page => (
            <Page
              id={page.key}
              key={page.key}
              html={page.html}
              handleHeight={this.handleHeight.bind(this)}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default Preview;