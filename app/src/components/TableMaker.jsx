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
    this.state = {
      rows: 3,
      columns: 3,
      topRowIsHeader: false
    };
  }

  _handleFieldChange(target) {
    this.setState({ [target.name]: [target.value] });
  }

  _handleCheckboxChange(target) {
    this.setState({ [target.name]: [target.checked] });
  }

  _resetState() {
    this.setState({
      rows: 3,
      columns: 3,
      topRowIsHeader: false
    });
  }

  _createTable() {
    var tableHTML = '<table>';
    for (var i = 0; i < this.state.rows; i++) {
      tableHTML = tableHTML + '<tr>';
      for (var j = 0; j < this.state.columns; j++) {
        if (this.state.topRowIsHeader && i == 0) {
          tableHTML = tableHTML + '<th>' + (i + 1) + ':' + (j + 1) + '</th>';
        } else {
          tableHTML = tableHTML + '<td>' + (i + 1) + ':' + (j + 1) + '</td>';
        }
      }
      tableHTML = tableHTML + '</tr>';
    }
    tableHTML = tableHTML + '</table>';
    Actions.setMarkdown(PagesStore.getMarkdown() + tableHTML);
    this.resetState();
  }

  render() {
    return (
      <Popup
        trigger={<button className="button"> Insert table </button>}
        modal
        closeOnDocumentClick
      >
        {close => (
          <div className="modal">
            <div className="header"> Choose table size </div>
            <div className="content">
              <p>Rows: </p>
              <input
                type="text"
                value={this.state.rows}
                name="rows"
                onChange={evt => this.handleFieldChange(evt.target)}
              />
              <p> Columns: </p>
              <input
                type="text"
                value={this.state.columns}
                name="columns"
                onChange={evt => this.handleFieldChange(evt.target)}
              />
              <p> Use top row as header </p>
              <input
                type="checkbox"
                checked={this.state.topRowIsHeader}
                name="topRowIsHeader"
                onChange={evt => this.handleCheckboxChange(evt.target)}
              />
            </div>
            <div className="actions">
              <button
                className="button"
                onClick={() => {
                  this.createTable();
                  close();
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
