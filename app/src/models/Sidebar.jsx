import React, { Component } from 'react';
import DatePicker from 'react-date-picker';

export default class Sidebar extends Component {
	//🐘
	
	constructor() {
		super();
		this.handleDateChange = (date) => this._handleDateChange(date);
		this.handleFieldChange = () => this._handleFieldChange();
		this.handleExpandOrCollapse = () => this._handleExpandOrCollapse();
		this.state = {
			date: new Date(),
			isCollapsed: true,
		};
	}
	
	_handleDateChange(date) {
		this.setState({ date });
	}
	
	_handleExpandOrCollapse(){
		this.setState({isCollapsed: !this.state.isCollapsed});
	}
	
	_handleFieldChange() {
		console.log('penis');
	}

  render() {
    let content;
	
	if(!this.state.isCollapsed){
		content = (
			<div>
				<p>Title:</p><input type='text' onChange={this.handleFieldChange} />
				<p>Author:</p><input type='text' onChange={this.handleFieldChange} />
				<p>Date:</p><DatePicker onChange={this.handleDateChange} value={this.state.date} />
				<p>Header:</p><input type='text' onChange={this.handleFieldChange} /><input type='text' onChange={this.handleFieldChange} /><input type='text' onChange={this.handleFieldChange} />
				<p>Footer:</p><input type='text' onChange={this.handleFieldChange} /><input type='text' onChange={this.handleFieldChange} /><input type='text' onChange	={this.handleFieldChange} />
			</div>
			);
	}
	let expandOrCollapse = this.state.isCollapsed ? '>>' : '<<';
	return (
      <div>
		<button onClick={this.handleExpandOrCollapse}>{expandOrCollapse}</button>
		{content}
	  </div>
    )
  }
}