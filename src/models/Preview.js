import React, { Component } from 'react';

class Preview extends React.Component {
  render() {
    return <div id="preview"  dangerouslySetInnerHTML={this.props._html}/>;
  }
}

export default Preview;
