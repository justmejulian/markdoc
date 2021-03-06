import '../styles/Preview.scss';
import React, { Component } from 'react';
import * as Actions from '../actions/Actions';
import Page from './Page.jsx';
import Titlepage from './Titlepage.jsx';
import PagesStore from '../stores/PagesStore.js';
import SidebarStore from '../stores/SidebarStore.js';

class Preview extends React.Component {
  constructor(props) {
    super(props);
    this.pageRef = React.createRef();

    this.setPreview = this.setPreview.bind(this);
    this.setHasTitlepage = this.setHasTitlepage.bind(this);
    this.handleZoomIn = this._handleZoomIn.bind(this);
    this.handleZoomOut = this._handleZoomOut.bind(this);
    this.setZoom = this._setZoom.bind(this);

    // Default settings
    this.state = {
      pages: [{ key: 0, html: PagesStore.getMarkdown(), height: 0 }],
      words: [],
      currentWord: 0,
      currentPage: 0,
      hasTitlepage: SidebarStore.getHasTitlepage(),
      zoom: PagesStore.getZoom()
    };
  }

  componentWillMount() {
    PagesStore.on('HTML_changed', this.setPreview);
    PagesStore.on('Zoom_changed', this.setZoom);
    SidebarStore.on('hasTitlepage_changed', this.setHasTitlepage);
  }

  componentWillUnmount() {
    PagesStore.removeListener('HTML_changed', this.setPreview);
    PagesStore.removeListener('Zoom_changed', this.setZoom);
    SidebarStore.removeListener('hasTitlepage_changed', this.setHasTitlepage);
  }

  setHasTitlepage() {
    this.setState({
      hasTitlepage: SidebarStore.getHasTitlepage()
    });
  }

  setPreview() {
    var copyArray = [{ key: 0, html: '', height: 0 }];

    // Build an Array of all the words enter in the editor
    var html = PagesStore.getHTML();
    var words = html.split(/\n| /g);

    // Post first word to Preview
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

  // Post words to to Preview one at a time, always checking the height
  // When a page is too "tall" create a new page and carry on there
  nextWord() {
    var copyArray = this.state.pages;
    var currentWord = this.state.currentWord;
    var currentPage = this.state.currentPage;

    if (currentWord < this.state.words.length - 1) {
      if (copyArray[currentPage].height < 950) {
        currentWord = currentWord + 1;
        if (this.state.words[currentWord] == '[newpage]') {
          currentPage = currentPage + 1;
          copyArray[currentPage] = { key: currentPage, html: '', height: 0 };
          this.setState(
            {
              pages: copyArray,
              currentPage: currentPage,
              currentWord: currentWord
            },
            this.nextWord
          );
        } else {
          copyArray[currentPage].html =
            copyArray[currentPage].html +
            ' ' +
            this.state.words[currentWord].replace('><br/> ', '> ');
          this.setState(
            {
              pages: copyArray,
              currentWord: currentWord
            },
            this.nextWord
          );
        }
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
      }
    }
  }

  _setZoom() {
    this.setState({ zoom: PagesStore.getZoom() });
  }

  handleHeight(height, id) {
    var copyArray = this.state.pages.slice();
    copyArray[id].height = height;
    this.setState({ pages: copyArray });
  }

  _handleZoomIn() {
    Actions.zoomIn();
  }

  _handleZoomOut() {
    Actions.zoomOut();
  }

  render() {
    return (
      <div id="preview">
        <div style={{ zoom: this.state.zoom }}>
          <Titlepage visibility={this.state.hasTitlepage} />
          {this.state.pages.map(page => (
            <Page
              id={page.key}
              ref={this.pageRef}
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
