import React, { Component } from 'react';
import Page from './Page.jsx'

class Pages extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        _html: this.props._html,
        pages: [{"key":0, "_html":null, "height" : 0}],
        height: ""
      }
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ _html: nextProps._html });
        this.state.pages[0]._html = nextProps._html;
    }

    handleChange(height, id){
        console.log(height + " " + id);
        this.state.pages[0].height = height;
        console.log(this.state.pages[id].height);
    }



    render() {
        return (
            <div id="pages">
                {
                    this.state.pages.map(page => <Page id={page.key} key={page.key} _html={page._html} handleChange={this.handleChange.bind(this)} />)
                }
            </div>
        )
    }
}

export default Pages;
