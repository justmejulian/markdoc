import React, { Component } from 'react';
import Store from '../stores/Store.js';

class Footer extends React.Component {
  constructor(props) {
    super();
    this.getFooterInfo = this.getFooterInfo.bind(this);
    this.state = {
      headerLeft: Store.getFooterLeft(),
      headerMiddle: Store.getFooterMiddle(),
      headerRight: Store.getFooterRight(),
      pageNumber: props.pageNumber + 1
    };
  }

  componentWillMount() {
    Store.on('Footer_changed', this.getFooterInfo);
  }

  componentWillUnmount() {
    Store.removeListener('Footer_changed', this.getFooterInfo);
  }

  getFooterInfo() {
    this.setState({
      footerLeft: Store.getFooterLeft(),
      footerMiddle: Store.getFooterMiddle(),
      footerRight: Store.getFooterRight()
    });
  }

  getStyle() {
    return {
      visibility: this.props.visibility ? 'visible' : 'hidden'
    };
  }

  render() {
    return (
      <div className="footer" style={this.getStyle()}>
        <div className="hfLeft"> {this.state.footerLeft} </div>
        <div className="hfCenter"> {this.state.pageNumber} </div>
        <div className="hfRight"> {this.state.footerRight} </div>
      </div>
    );
  }
}

export default Footer;
