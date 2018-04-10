import React, { Component } from 'react';
import { ReactHeight } from 'react-height';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

class Page extends React.Component {
  constructor() {
    super();
    this.state = {
      _html: null,
      id: null
    };
  }

  handleHeight(height) {
    this.props.handleHeight(height, this.props.id);
  }

  componentWillReceiveProps(nextProps) {
    //console.log("Got the props in page " + nextProps.id);
    this.setState({
      __html: this.createMarkup(nextProps.html),
      id: nextProps.id
    });
  }

  createMarkup(html) {
    return {
      __html: html
    };
  }

  render() {
    return (
      <div className={'page page_' + this.state.id}>
        <Header pageNumber={this.state.id} />
        <ReactHeight onHeightReady={height => this.handleHeight(height)}>
          <div id={this.state.id} dangerouslySetInnerHTML={this.state.__html} />
        </ReactHeight>
        <Footer pageNumber={this.state.id} />
      </div>
    );
  }
}

export default Page;
