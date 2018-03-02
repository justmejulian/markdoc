import React, { Component } from 'react';

class Editor extends React.Component {
    render() {
        return (
            <textarea id="editor"  onChange={this.props.handleChange} />
        )
    }
}

export default Editor;
