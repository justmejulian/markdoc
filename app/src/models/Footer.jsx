import React, { Component } from 'react';

class Footer extends React.Component {
  constructor() {
    super();
    this.state = {
      pageNumber: 0
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      pageNumber: nextProps.pageNumber + 1
    });
  }

  render() {
    return (
      <div className="footer">
        <div className="hfLeft"> </div>
        <div className="hfCenter"> {this.state.pageNumber} </div>
        <div className="hfRight"> </div>
      </div>
    );
  }
}

export default Footer;
