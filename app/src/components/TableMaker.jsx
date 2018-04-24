import React, { Component } from 'react';
import Popup from 'reactjs-popup';

export default class TableMaker extends Component {
  constructor(props) {
    super(props);
    this.handleFieldChange = target => this._handleFieldChange(target);
    this.state = {
      rows: 3,
      columns: 4
    };
  }

  _handleFieldChange(target) {
    this.setState({ [target.name]: [target.value] });
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
            </div>
            <div className="actions">
              <button
                className="button"
                onClick={() => {
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
