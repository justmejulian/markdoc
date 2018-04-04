import React, { Component } from 'react';
import Store from '../stores/Store.js';

class Footer extends React.Component {
  constructor() {
    super();
    this.getFooterInfo = this.getFooterInfo.bind(this);
    this.state = {
      headerLeft: '',
      headerMiddle: '',
      headerRight: '',
      pageNumber: 0
    };
  }

  componentWillMount() {
    Store.on('Footer_changed', this.getFooterInfo);
  }

  getFooterInfo() {
    this.setState({
      footerLeft: Store.getFooterLeft(),
      footerMiddle: Store.getFooterMiddle(),
      footerRight: Store.getFooterRight()
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      pageNumber: nextProps.pageNumber + 1
    });
  }

  render() {
    return (
      <div className="footer">
        <div className="hfLeft"> {this.state.footerLeft} </div>
        <div className="hfCenter"> {this.state.pageNumber} </div>
        <div className="hfRight"> {this.state.footerRight} </div>
      </div>
    );
  }
}

export default Footer;
