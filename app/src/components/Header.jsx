import React, { Component } from 'react';
import Store from '../stores/Store.js';

class Header extends React.Component {
  constructor(props) {
    super();
    this.getHeaderInfo = this.getHeaderInfo.bind(this);
    this.state = {
      headerLeft: Store.getHeaderLeft(),
      headerMiddle: Store.getHeaderMiddle(),
      headerRight: Store.getHeaderRight(),
      pageNumber: props.pageNumber + 1
    };
  }

  componentWillMount() {
    Store.on('Header_changed', this.getHeaderInfo);
  }

  // Unbind change listener
  componentWillUnmount() {
    Store.removeListener('Header_changed', this.getHeaderInfo);
  }

  getHeaderInfo() {
    this.setState({
      headerLeft: Store.getHeaderLeft(),
      headerMiddle: Store.getHeaderMiddle(),
      headerRight: Store.getHeaderRight()
    });
  }

  getStyle() {
    return {
      borderBottom:
        this.state.headerLeft != '' ||
        this.state.headerMiddle != '' ||
        this.state.headerRight != ''
          ? '1px solid black'
          : '0px',
      visibility: this.props.visibility ? 'visible' : 'hidden'
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      pageNumber: nextProps.pageNumber + 1
    });
  }

  render() {
    return (
      <div className="header" style={this.getStyle()}>
        <div className="hfLeft"> {this.state.headerLeft} </div>
        <div className="hfCenter"> {this.state.headerMiddle} </div>
        <div className="hfRight"> {this.state.headerRight} </div>
      </div>
    );
  }
}

export default Header;
