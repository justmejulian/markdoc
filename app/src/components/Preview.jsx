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
    var html = PagesStore.getHTML();
    console.log(html);
    var words = html.split(/\n| /g);

    copyArray[0].html = words[0];

    console.log(words);

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

  _setZoom() {
    this.setState({ zoom: PagesStore.getZoom() });
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
      console.log('Current height: ' + copyArray[currentPage].height);
      if (copyArray[currentPage].height < 950) {
        currentWord = currentWord + 1;
        //console.log('Current Word: ' + currentWord);
        console.log('The word: ' + this.state.words[currentWord]);
        if (this.state.words[currentWord] == '[newpage]') {
          console.log('new page found');
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
        //console.log('Page to big');
        //console.log(this.state.pages);
      }
    }
    //console.log(this.state.pages);
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
