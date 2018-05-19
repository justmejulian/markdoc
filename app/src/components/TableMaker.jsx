import React, { Component } from 'react';
import Popup from 'reactjs-popup';
import PagesStore from '../stores/PagesStore.js';
import SidebarStore from '../stores/SidebarStore.js';
import * as Actions from '../actions/Actions';

export default class TableMaker extends Component {
  constructor(props) {
    super(props);
    this.handleFieldChange = target => this._handleFieldChange(target);
    this.handleCheckboxChange = target => this._handleCheckboxChange(target);
    this.createTable = () => this._createTable();
    this.resetState = () => this._resetState();
    this.handlePopupClosing = () => this._handlePopupClosing();
    this.refreshComponent = () => this._refreshComponent();
    this.state = {
      rows: 3,
      columns: 3,
      topRowIsHeader: false,
      tableHTML: '' //This is a huge waste of space, but required for testing. Also, we live in 2018 and the space this wastes is negligible.
    };
    if (!(undefined === props.popupClosed)) {
      this.state.popupClosed = props.popupClosed;
    }
  }

  componentWillMount() {
    SidebarStore.on('popupClosed_changed', this.refreshComponent);
  }

  componentWillUnmount() {
    SidebarStore.removeListener('popupClosed_changed', this.refreshComponent);
  }

  _refreshComponent() {
    this.setState({});
  }

  _handleFieldChange(target) {
    this.setState({ [target.name]: [target.value] });
  }

  _handleCheckboxChange(target) {
    this.setState({ [target.name]: [target.checked] });
  }

  _handlePopupClosing() {
    this.createTable();
    this.resetState();
  }

  _resetState() {
    this.setState({
      rows: 3,
      columns: 3,
      topRowIsHeader: false
    });
    SidebarStore.setPopupClosed();
  }

  _createTable() {
    if (this.state.columns > 0 && this.state.rows > 0) {
      var tableHTML = '<table>';
      for (var i = 1; i <= this.state.rows; i++) {
        tableHTML = tableHTML + '<tr>';
        for (var j = 1; j <= this.state.columns; j++) {
          if (this.state.topRowIsHeader && i == 1) {
            tableHTML = tableHTML + '<th>' + i + ':' + j + '</th>';
          } else {
            tableHTML = tableHTML + '<td>' + i + ':' + j + '</td>';
          }
        }
        tableHTML = tableHTML + '</tr>';
      }
      tableHTML = tableHTML + '</table>';
      this.setState({ tableHTML: tableHTML });
      Actions.setMarkdown(PagesStore.getMarkdown() + tableHTML);
      Actions.setHTML();
    }
  }

  render() {
    return (
      <Popup
        modal
        closeOnDocumentClick
        id="tableMaker"
        open={!SidebarStore.getPopupClosed()}
        onClose={() => this.resetState()}
      >
        {close => (
          <div className="modal">
            <div className="tablePopupHeader"> Choose table size </div>
            <div className="tablePopupContent">
              <span>
                {' '}
                {/*Extremely important never-referenced span! In all seriousness, these are required to ensure input and description wrap together.*/}
                <p>Rows: </p>
                <input
                  type="number"
                  value={this.state.rows}
                  min="1"
                  name="rows"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  ref={input => {
                    this.state.popupClosed && input && input.focus();
                  }}
                  onKeyPress={evt => {
                    if (evt.key === 'Enter') {
                      close();
                      this.handlePopupClosing();
                    }
                  }}
                />
              </span>
              <span>
                <p> Columns: </p>
                <input
                  type="number"
                  value={this.state.columns}
                  min="1"
                  name="columns"
                  onChange={evt => this.handleFieldChange(evt.target)}
                  onKeyPress={evt => {
                    if (evt.key === 'Enter') {
                      close();
                      this.handlePopupClosing();
                    }
                  }}
                />
              </span>
              <span>
                <p> Use top row as header </p>
                <input
                  type="checkbox"
                  checked={this.state.topRowIsHeader}
                  name="topRowIsHeader"
                  onChange={evt => this.handleCheckboxChange(evt.target)}
                />
              </span>
              <button
                className="button"
                onClick={() => {
                  close();
                  this.handlePopupClosing();
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </Popup>
    );
  }
}
