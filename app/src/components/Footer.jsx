import React, { Component } from 'react';
import SidebarStore from '../stores/SidebarStore.js';
import * as SidebarActions from '../actions/SidebarActions';

class Footer extends React.Component {
  constructor() {
    super();
    this.setFooterInfo = this.setFooterInfo.bind(this);
    this.state = {
      footerLeft: SidebarStore.getFooterLeft(),
      footerMiddle: SidebarStore.getFooterMiddle(),
      footerRight: SidebarStore.getFooterRight(),
      pageNumber: ''
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      pageNumber: nextProps.pageNumber + 1
    });
  }

  componentWillMount() {
    SidebarStore.on('Footer_changed', this.setFooterInfo);
  }

  componentWillUnmount() {
    SidebarStore.removeListener('Footer_changed', this.setFooterInfo);
  }

  setFooterInfo() {
    this.setState({
      footerLeft: SidebarStore.getFooterLeft(),
      footerMiddle: SidebarStore.getFooterMiddle(),
      footerRight: SidebarStore.getFooterRight()
    });
  }

  getStyle() {
    return {
      visibility: this.props.visibility ? 'visible' : 'hidden'
    };
  }

  handleExpandOrCollapse() {
    SidebarActions.setIsCollapsed();
  }

  render() {
    return (
      <div
        className="footer"
        style={this.getStyle()}
        onClick={this.handleExpandOrCollapse}
      >
        <div className="hfLeft"> {this.state.footerLeft} </div>
        <div className="hfCenter"> {this.state.pageNumber} </div>
        <div className="hfRight"> {this.state.footerRight} </div>
      </div>
    );
  }
}

export default Footer;
