import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import moment from 'moment';

import Store from '../stores/Store.js';
import * as SidebarActions from '../actions/SidebarActions';

export default class Sidebar extends Component {
  //🐘
  //TODO: Send field values to appropriate places, meaning header and footer and I imagine the other fields have to be queried somewhere.

  constructor(props) {
    super(props);
    this.handleDateChange = date => this._handleDateChange(date);
    this.handleFieldChange = target => this._handleFieldChange(target);
    this.handleExpandOrCollapse = () => this._handleExpandOrCollapse();
    this.handleMouseHover = () => this._handleMouseHover();
    this.getTitle = this.getTitle.bind(this);
    this.state = {
      isCollapsed: true,
      title: '',
      author: '',
      date: moment(),
      headerLeft: '',
      headerMiddle: '',
      headerRight: '',
      footerLeft: '',
      footerMiddle: '',
      footerRight: '',
      isHovering: false
    };
  }

  componentWillMount() {
    Store.on('Title_changed', this.getTitle);
  }

  getTitle() {
    this.setState({
      title: Store.getTitle()
    });
  }

  _handleDateChange(date) {
    SidebarActions.setDate(date);
    this.setState({ date: date });
  }

  _handleExpandOrCollapse() {
    this.setState({ isCollapsed: !this.state.isCollapsed });
  }

  _handleFieldChange(target) {
    this.setState({ [target.name]: [target.value] });
    switch (target.name) {
      case 'title':
        SidebarActions.setTitle(target.value);
        break;
      case 'author':
        SidebarActions.setAuthor(target.value);
        break;
      case 'headerRight':
        SidebarActions.setHeaderRight(target.value);
        break;
      case 'headerMiddle':
        SidebarActions.setHeaderMiddle(target.value);
        break;
      case 'headerLeft':
        SidebarActions.setHeaderLeft(target.value);
        break;
      case 'footerLeft':
        SidebarActions.setFooterLeft(target.value);
        break;
      case 'footerMiddle':
        SidebarActions.setFooterMiddle(target.value);
        break;
      case 'footerRight':
        SidebarActions.setFooterRight(target.value);
        break;
      default:
    }
  }

  _handleMouseHover() {
    this.setState({ isHovering: !this.state.isHovering });
  }

  render() {
    var sidebarContentStyle = this.state.isCollapsed
      ? { marginLeft: '-47vw' }
      : { background: '#FDFDFD' };
    var expandOrCollapse = this.state.isCollapsed ? '❯' : '❮';
    var contentCoverStyle = this.state.isCollapsed
      ? {}
      : { opacity: '1', pointerEvents: 'all' };
    var sidebarStyle = this.state.isCollapsed
      ? { width: '3vw' }
      : { width: '52vw' };
    var buttonStyle = this.state.isCollapsed ? {} : { marginLeft: '47vw' };
    if (!this.state.isHovering && this.state.isCollapsed) {
      buttonStyle = { visibility: 'hidden', width: '0', marginLeft: '-15px' };
    }

    return (
      <div>
        <div
          id="sidebar-content-cover"
          style={contentCoverStyle}
          onClick={this.handleExpandOrCollapse}
        >
          {' '}
        </div>

        <div
          id="sidebar"
          style={sidebarStyle}
          onMouseEnter={this.handleMouseHover}
          onMouseLeave={this.handleMouseHover}
        >
          <div style={sidebarContentStyle} id="sidebar-content">
            <div className="sidebar-header">
              <h1> Markdoc </h1>
            </div>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                onChange={evt => this.handleFieldChange(evt.target)}
                name="title"
                value={this.state.title}
              />
            </div>

            <div className="form-group">
              <label>Author:</label>
              <input
                type="text"
                onChange={evt => this.handleFieldChange(evt.target)}
                name="author"
                value={this.state.author}
              />
            </div>

            <div className="form-group">
              <label>Header:</label>
              <div className="input-container">
                <input
                  type="text"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  name="headerLeft"
                  value={this.state.headerLeft}
                  placeholder="Left"
                />
                <input
                  type="text"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  name="headerMiddle"
                  value={this.state.headerMiddle}
                  placeholder="Middle"
                />
                <input
                  type="text"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  name="headerRight"
                  value={this.state.headerRight}
                  placeholder="Right"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Footer:</label>
              <div className="input-container">
                <input
                  type="text"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  name="footerLeft"
                  value={this.state.footerLeft}
                  placeholder="Left"
                />
                <input
                  type="text"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  name="footerMiddle"
                  value={this.state.footerMiddle}
                  placeholder="Isch im mom. page zahl"
                />
                <input
                  type="text"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  name="footerRight"
                  value={this.state.footerRight}
                  placeholder="Right"
                />
              </div>
            </div>

            <div className="date-group">
              <label>Date:</label>
              <DatePicker
                dateFormat="DD/MM/YYYY"
                onChange={this.handleDateChange}
                selected={this.state.date}
              />
            </div>
          </div>
          <button
            onClick={this.handleExpandOrCollapse}
            style={buttonStyle}
            id="sidebar-expand-button"
          >
            {expandOrCollapse}
          </button>
        </div>
      </div>
    );
  }
}
