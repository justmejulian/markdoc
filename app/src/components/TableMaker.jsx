import React, { Component } from 'react';
import Popup from 'reactjs-popup';
import PagesStore from '../stores/PagesStore.js';
import * as Actions from '../actions/Actions';

export default class TableMaker extends Component {
  constructor(props) {
    super(props);
    this.handleFieldChange = target => this._handleFieldChange(target);
    this.handleCheckboxChange = target => this._handleCheckboxChange(target);
    this.createTable = () => this._createTable();
    this.resetState = () => this._resetState();
    this.handlePopupClose = () => this._handlePopupClose();
    this.state = {
      rows: 3,
      columns: 3,
      topRowIsHeader: false,
      popupClosed: true,
      tableHTML: '' //This is a huge waste of space, but required for testing. Also, we live in 2018 and the space this wastes is negligible.
    };
    if (!(undefined === props.popupClosed)) {
      this.state.popupClosed = props.popupClosed;
    }
  }

  _handleFieldChange(target) {
    this.setState({ [target.name]: [target.value] });
  }

  _handleCheckboxChange(target) {
    this.setState({ [target.name]: [target.checked] });
  }

  _handlePopupClose() {
    this.createTable();
    this.resetState();
    this.state.popupClosed = true;
  }

  _handleKeyPress(e) {
    if (e.key === 'Enter') {
      close();
      this.handlePopupClose();
    }
  }

  _resetState() {
    this.setState({
      rows: 3,
      columns: 3,
      topRowIsHeader: false
    });
  }

  _createTable() {
    if (this.state.columns > 0 && this.state.rows > 0) {
      var tableHTML = '<table>';
      for (var i = 1; i <= this.state.rows; i++) {
        tableHTML = tableHTML + '<tr>';
        for (var j = 1; j <= this.state.columns; j++) {
          if (this.state.topRowIsHeader && i == 0) {
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
        trigger={<button className="button"> Insert table </button>}
        modal
        closeOnDocumentClick
        id="tableMaker"
        open={!this.state.popupClosed}
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
                    this.state.popUpClosed = false;
                  }}
                  onKeyPress={evt => {
                    if (evt.key === 'Enter') {
                      close();
                      this.handlePopupClose();
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
                      this.handlePopupClose();
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
                  this.handlePopupClose();
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
