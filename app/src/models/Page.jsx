import React, { Component } from 'react';
import {ReactHeight} from 'react-height';

class Page extends React.Component {
    constructor() {
      super();
      this.state = {
      }
    }

    handleChange(height){
        this.props.handleChange(height, this.props.id);
    }


    render() {
        return (
            <ReactHeight onHeightReady={height => this.handleChange(height)}>
              <div id="page" dangerouslySetInnerHTML={this.props._html} />
            </ReactHeight>
        )
    }
}

export default Page;
