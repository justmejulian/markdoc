import React, { Component } from 'react';
import SidebarStore from '../stores/SidebarStore.js';

class Header extends React.Component {
  constructor(props) {
    super();
    this.setHeaderInfo = this.setHeaderInfo.bind(this);
    this.state = {
      headerLeft: SidebarStore.getHeaderLeft(),
      headerMiddle: SidebarStore.getHeaderMiddle(),
      headerRight: SidebarStore.getHeaderRight(),
      pageNumber: props.pageNumber + 1
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      pageNumber: nextProps.pageNumber + 1
    });
  }

  componentWillMount() {
    SidebarStore.on('Header_changed', this.setHeaderInfo);
  }

  // Unbind change listener
  componentWillUnmount() {
    SidebarStore.removeListener('Header_changed', this.setHeaderInfo);
  }

  setHeaderInfo() {
    this.setState({
      headerLeft: SidebarStore.getHeaderLeft(),
      headerMiddle: SidebarStore.getHeaderMiddle(),
      headerRight: SidebarStore.getHeaderRight()
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
