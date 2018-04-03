import React, { Component } from 'react';

class Header extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    return (
      <div className="header">
        <div className="hfLeft"> Zusammenfassung</div>
        <div className="hfCenter"> PSIT4 </div>
        <div className="hfRight"> Max Muster </div>
      </div>
    );
  }
}

export default Header;
