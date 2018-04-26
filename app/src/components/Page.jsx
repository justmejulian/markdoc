import React, { Component } from 'react';
import { ReactHeight } from 'react-height';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import SidebarStore from '../stores/SidebarStore.js';

class Page extends React.Component {
  constructor() {
    super();
    this.setHasHeader = this.setHasHeader.bind(this);
    this.setHasFooter = this.setHasFooter.bind(this);
    this.state = {
      _html: null,
      id: null,
      hasHeader: SidebarStore.getHasHeader(),
      hasFooter: SidebarStore.getHasFooter()
    };
  }

  componentWillMount() {
    SidebarStore.on('hasHeader_changed', this.setHasHeader);
    SidebarStore.on('hasFooter_changed', this.setHasFooter);
  }

  componentWillUnmount() {
    SidebarStore.removeListener('hasHeader_changed', this.setHasHeader);
    SidebarStore.removeListener('hasFooter_changed', this.setHasFooter);
  }

  setHasHeader() {
    this.setState({
      hasHeader: SidebarStore.getHasHeader()
    });
  }

  setHasFooter() {
    this.setState({
      hasFooter: SidebarStore.getHasFooter()
    });
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
        <Header pageNumber={this.state.id} visibility={this.state.hasHeader} />
        <ReactHeight onHeightReady={height => this.handleHeight(height)}>
          <div id={this.state.id} dangerouslySetInnerHTML={this.state.__html} />
        </ReactHeight>
        <Footer pageNumber={this.state.id} visibility={this.state.hasFooter} />
      </div>
    );
  }
}

export default Page;
