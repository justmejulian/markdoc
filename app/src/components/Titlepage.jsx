import React, { Component } from 'react';
import Store from '../stores/Store.js';

class Titlepage extends React.Component {
  constructor() {
    super();
    this.setInfo = this.setInfo.bind(this);
    this.state = {
      title: Store.getTitle(),
      author: Store.getAuthor(),
      date: Store.getDate()
    };
  }

  componentWillMount() {
    Store.on('Title_changed', this.setInfo);
    Store.on('Author_changed', this.setInfo);
    Store.on('Date_changed', this.setInfo);
  }

  setInfo() {
    this.setState({
      title: Store.getTitle(),
      author: Store.getAuthor(),
      date: Store.getDate()
    });
  }

  componentWillUnmount() {
    Store.removeListener('Title_changed', this.setInfo);
    Store.removeListener('Author_changed', this.setInfo);
    Store.removeListener('Date_changed', this.setInfo);
  }

  getStyle() {
    return {
      display: this.props.visibility ? 'block' : 'none'
    };
  }

  render() {
    return (
      <div id="titlepage" className="page" style={this.getStyle()}>
        <div id="titlepageContens">
          <h1>{this.state.title}</h1>
          <p>{this.state.author}</p>
          <p>{this.state.date}</p>
        </div>
      </div>
    );
  }
}

export default Titlepage;
