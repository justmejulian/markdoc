import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import TableMaker from './TableMaker.jsx';

import SidebarStore from '../stores/SidebarStore.js';
import * as SidebarActions from '../actions/SidebarActions';

export default class Sidebar extends Component {
  //🐘
  //TODO: Send field values to appropriate places, meaning header and footer and I imagine the other fields have to be queried somewhere.

  constructor(props) {
    super(props);
    this.handleDateChange = date => this._handleDateChange(date);
    this.handleCheckboxChange = target => this._handleCheckboxChange(target);
    this.handleFieldChange = target => this._handleFieldChange(target);
    this.handleExpandOrCollapse = () => this._handleExpandOrCollapse();
    this.handleMouseHover = () => this._handleMouseHover();

    // Setter
    this.setHasTitlepage = this._setHasTitlepage.bind(this);
    this.setHasHeader = this._setHasHeader.bind(this);
    this.setHasFooter = this._setHasFooter.bind(this);
    this.setTitle = this._setTitle.bind(this);
    this.setAuthor = this._setAuthor.bind(this);
    this.setHeaderInfo = this._setHeaderInfo.bind(this);
    this.setFooterInfo = this._setFooterInfo.bind(this);
    this.setDate = this._setDate.bind(this);
    this.setIsCollapsed = this._setIsCollapsed.bind(this);

    this.state = {
      isCollapsed: true,
      hasTitlepage: SidebarStore.getHasTitlepage(),
      hasHeader: SidebarStore.getHasHeader(),
      hasFooter: SidebarStore.getHasFooter(),
      title: SidebarStore.getTitle(),
      author: SidebarStore.getAuthor(),
      date: moment(this._prepareDate(SidebarStore.getDate())),
      headerLeft: SidebarStore.getHeaderLeft(),
      headerMiddle: SidebarStore.getHeaderMiddle(),
      headerRight: SidebarStore.getHeaderRight(),
      footerLeft: SidebarStore.getFooterLeft(),
      footerMiddle: '',
      footerRight: SidebarStore.getFooterRight(),
      isHovering: false
    };
  }

  componentWillMount() {
    SidebarStore.on('hasTitlepage_changed', this.setHasTitlepage);
    SidebarStore.on('hasHeader_changed', this.setHasHeader);
    SidebarStore.on('hasFooter_changed', this.setHasFooter);
    SidebarStore.on('Header_changed', this.setHeaderInfo);
    SidebarStore.on('Footer_changed', this.setFooterInfo);
    SidebarStore.on('Title_changed', this.setTitle);
    SidebarStore.on('Author_changed', this.setAuthor);
    SidebarStore.on('Date_changed', this.setDate);
    SidebarStore.on('isCollapsed_changed', this.setIsCollapsed);
  }

  // Unbind change listener
  componentWillUnmount() {
    SidebarStore.removeListener('hasTitlepage_changed', this.setHasTitlepage);
    SidebarStore.removeListener('hasHeader_changed', this.setHasHeader);
    SidebarStore.removeListener('hasFooter_changed', this.setHasFooter);
    SidebarStore.removeListener('Header_changed', this.setHeaderInfo);
    SidebarStore.removeListener('Footer_changed', this.setFooterInfo);
    SidebarStore.removeListener('Title_changed', this.setTitle);
    SidebarStore.removeListener('Author_changed', this.setAuthor);
    SidebarStore.removeListener('Date_changed', this.setDate);
    SidebarStore.removeListener('isCollapsed_changed', this.setIsCollapsed);
  }

  _setTitle() {
    this.setState({
      title: SidebarStore.getTitle()
    });
  }

  _setAuthor() {
    this.setState({
      author: SidebarStore.getAuthor()
    });
  }

  _setHasTitlepage() {
    this.setState({
      hasTitlepage: SidebarStore.getHasTitlepage()
    });
  }

  _setHasHeader() {
    this.setState({
      hasHeader: SidebarStore.getHasHeader()
    });
  }

  _setHasFooter() {
    this.setState({
      hasFooter: SidebarStore.getHasFooter()
    });
  }

  _setHeaderInfo() {
    this.setState({
      headerLeft: SidebarStore.getHeaderLeft(),
      headerMiddle: SidebarStore.getHeaderMiddle(),
      headerRight: SidebarStore.getHeaderRight()
    });
  }

  _setFooterInfo() {
    this.setState({
      footerLeft: SidebarStore.getFooterLeft(),
      footerMiddle: SidebarStore.getFooterMiddle(),
      footerRight: SidebarStore.getFooterRight()
    });
  }

  _setIsCollapsed() {
    this.setState({ isCollapsed: SidebarStore.getIsCollapsed() });
  }

  _setDate() {
    this.setState({
      date: moment(this._prepareDate(SidebarStore.getDate()))
    });
  }

  _prepareDate(strDate) {
    var splitDate = strDate.split('/');
    return splitDate[2] + '-' + splitDate[1] + '-' + splitDate[0];
  }

  _handleDateChange(date) {
    SidebarActions.setDate(date);
    this.setState({ date: date });
  }

  _handleExpandOrCollapse() {
    SidebarActions.setIsCollapsed();
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

  _handleCheckboxChange(target) {
    var name = target.name;
    var isChecked = target.checked;
    this.setState({ [name]: isChecked });
    switch (name) {
      case 'hasTitlepage':
        SidebarActions.setHasTitlepage(isChecked);
        break;
      case 'hasHeader':
        SidebarActions.setHasHeader(isChecked);
        break;
      case 'hasFooter':
        SidebarActions.setHasFooter(isChecked);
        break;
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
              <div className="input-container">
                <label>Titlepage:</label>
                <input
                  type="checkbox"
                  onChange={evt => this.handleCheckboxChange(evt.target)}
                  name="hasTitlepage"
                  checked={this.state.hasTitlepage}
                />
                <label>Header:</label>
                <input
                  type="checkbox"
                  onChange={evt => this.handleCheckboxChange(evt.target)}
                  name="hasHeader"
                  checked={this.state.hasHeader}
                />
                <label>Footer:</label>
                <input
                  type="checkbox"
                  onChange={evt => this.handleCheckboxChange(evt.target)}
                  name="hasFooter"
                  checked={this.state.hasFooter}
                />
              </div>
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
                  maxLength={38}
                />
                <input
                  type="text"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  name="headerMiddle"
                  value={this.state.headerMiddle}
                  placeholder="Middle"
                  maxLength={38}
                />
                <input
                  type="text"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  name="headerRight"
                  value={this.state.headerRight}
                  placeholder="Right"
                  maxLength={38}
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
                  maxLength={38}
                />
                {/* A Is hidden because we want it to be page number */}

                <input
                  style={{ visibility: 'hidden' }}
                  type="text"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  name="footerMiddle"
                  value={this.state.footerMiddle}
                  maxLength={38}
                  placeholder="PageNumber"
                />
                <input
                  type="text"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  name="footerRight"
                  value={this.state.footerRight}
                  placeholder="Right"
                  maxLength={38}
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
            <TableMaker />
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
