import React, { Component } from 'react';
import DatePicker from 'react-date-picker';

export default class Sidebar extends Component {
  //🐘
  //TODO: Send field values to appropriate places, meaning header and footer and I imagine the other fields have to be queried somewhere.

  constructor(props) {
    super(props);
    this.handleDateChange = date => this._handleDateChange(date);
    this.handleFieldChange = target => this._handleFieldChange(target);
    this.handleExpandOrCollapse = () => this._handleExpandOrCollapse();
    this.handleMouseHover = () => this._handleMouseHover();
    this.state = {
      isCollapsed: true,
      title: '',
      author: '',
      date: new Date(),
      headerLeft: '',
      headerMiddle: '',
      headerRight: '',
      footerLeft: '',
      footerMiddle: '',
      footerRight: '',
      isHovering: false
    };
  }

  _handleDateChange(date) {
    this.setState({ date });
  }

  _handleExpandOrCollapse() {
    this.setState({ isCollapsed: !this.state.isCollapsed });
  }

  _handleFieldChange(target) {
    this.setState({ [target.name]: [target.value] });
  }

  _handleMouseHover() {
    this.setState({ isHovering: !this.state.isHovering });
    this.setState({ isCollapsed: true });
  }

  render() {
    var content;
    var boundHandleFieldChange = this.handleFieldChange.bind(this);
    if (!this.state.isCollapsed) {
      content = (
        <div id="sidebar-content-container">
          <p>Title:</p>
          <input
            type="text"
            onChange={evt => this.handleFieldChange(evt.target)}
            name="title"
            value={this.state.title}
          />
          <p>
            <br />Author:
          </p>
          <input
            type="text"
            onChange={evt => this.handleFieldChange(evt.target)}
            name="author"
            value={this.state.author}
          />
          <p>
            <br />Header:
          </p>
          <div className="sidebar-input-container">
            <input
              type="text"
              onChange={evt => this.handleFieldChange(evt.target)}
              name="headerLeft"
              value={this.state.headerLeft}
            />
            <input
              type="text"
              onChange={evt => this.handleFieldChange(evt.target)}
              name="headerMiddle"
              value={this.state.headerMiddle}
            />
            <input
              type="text"
              onChange={evt => this.handleFieldChange(evt.target)}
              name="headerRight"
              value={this.state.headerRight}
            />
          </div>
          <p>
            <br />Footer:
          </p>
          <div className="sidebar-input-container">
            <input
              type="text"
              onChange={evt => this.handleFieldChange(evt.target)}
              name="footerLeft"
              value={this.state.footerLeft}
            />
            <input
              type="text"
              onChange={evt => this.handleFieldChange(evt.target)}
              name="footerMiddle"
              value={this.state.footerMiddle}
            />
            <input
              type="text"
              onChange={evt => this.handleFieldChange(evt.target)}
              name="footerRight"
              value={this.state.footerRight}
            />
          </div>
          <p>
            <br />Date:
          </p>
          <DatePicker
            onChange={this.handleDateChange}
            value={this.state.date}
          />
        </div>
      );
    }
    var expandOrCollapse = this.state.isCollapsed ? '>' : '<';
    var style = this.state.isCollapsed ? { width: '3vw' } : { width: '45vw' };
    var buttonStyle = this.state.isHovering
      ? {}
      : { visibility: 'hidden', width: '0' };
    if (this.state.isCollapsed) {
      buttonStyle.position = 'relative';
      buttonStyle.top = '43vh';
    }

    return (
      <div
        id="sidebar"
        style={style}
        onMouseEnter={this.handleMouseHover}
        onMouseLeave={this.handleMouseHover}
      >
        {
          <div>
            <button
              onClick={this.handleExpandOrCollapse}
              style={buttonStyle}
              id="sidebar-expand-button"
            >
              {expandOrCollapse}
            </button>
          </div>
        }
        {content}
      </div>
    );
  }
}
