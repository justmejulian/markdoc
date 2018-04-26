import React, { Component } from 'react';
import SidebarStore from '../stores/SidebarStore.js';

class Titlepage extends React.Component {
  constructor() {
    super();
    this.setInfo = this.setInfo.bind(this);
    this.state = {
      title: SidebarStore.getTitle(),
      author: SidebarStore.getAuthor(),
      date: SidebarStore.getDate()
    };
  }

  componentWillMount() {
    SidebarStore.on('Title_changed', this.setInfo);
    SidebarStore.on('Author_changed', this.setInfo);
    SidebarStore.on('Date_changed', this.setInfo);
  }

  componentWillUnmount() {
    SidebarStore.removeListener('Title_changed', this.setInfo);
    SidebarStore.removeListener('Author_changed', this.setInfo);
    SidebarStore.removeListener('Date_changed', this.setInfo);
  }

  setInfo() {
    this.setState({
      title: SidebarStore.getTitle(),
      author: SidebarStore.getAuthor(),
      date: SidebarStore.getDate()
    });
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
