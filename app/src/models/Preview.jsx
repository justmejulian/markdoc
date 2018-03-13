import React, { Component } from 'react';
import Pages from './Pages.jsx'

class Preview extends React.Component {
  render() {
    return (
        <div id="preview" >
            <Pages _html={this.props._html}/>
        </div>
    )
  }
}

export default Preview;
