import React, { Component } from 'react';
import DatePicker from 'react-date-picker';

export default class Sidebar extends Component {
	//🐘
	
	constructor() {
		super();
		this.handleDateChange = (date) => this._handleDateChange(date);
		this.handleFieldChange = () => this._handleFieldChange();
		this.state = {
			date: new Date(),
		}
	}
	
	_handleDateChange(date) {
		this.setState({ date });
	}
	
	_handleFieldChange() {
		console.log('penis');
	}

  render() {
    return (
      <div>
	  <p>Title:</p><input type='text' onChange={this.handleFieldChange} />
	  <p>Author:</p><input type='text' onChange={this.handleFieldChange} />
	  <p>Date:</p><DatePicker onChange={this.handleDateChange} value={this.state.date} />
      </div>
    )
  }
}