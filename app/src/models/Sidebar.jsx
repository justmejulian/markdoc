import React, { Component } from 'react';
import DatePicker from 'react-date-picker';

export default class Sidebar extends Component {
	//🐘
	//TODO: Send field values to appropriate places, meaning header and footer and I imagine the other fields have to be queried somewhere.
	
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
		//TODO: Probably split this function into multiple to distinguish which field was changed.
		//Also TODO: Actually send the changed value someplace.
	}

  render() {
    let content;
	
	if(!this.state.isCollapsed){
		content = (
			<div>
				<h1>Sidebar of sidebariness!</h1> {/* Note: This provides necessary space for the datepicker to display. Do not remove without replacement! */}
				<p>Title:</p><input type='text' onChange={this.handleFieldChange} />
				<p><br></br>Author:</p><input type='text' onChange={this.handleFieldChange} />
				<p><br></br>Date:</p><DatePicker onChange={this.handleDateChange} value={this.state.date} />
				<p>Header:</p><input type='text' onChange={this.handleFieldChange} /><input type='text' onChange={this.handleFieldChange} /><input type='text' onChange={this.handleFieldChange} />
				<p>Footer:</p><input type='text' onChange={this.handleFieldChange} /><input type='text' onChange={this.handleFieldChange} /><input type='text' onChange	={this.handleFieldChange} />
			</div>
			);
	}
	let expandOrCollapse = this.state.isCollapsed ? '>>' : '<<';
	return (
      <div id='sidebar'>
		<button onClick={this.handleExpandOrCollapse} id='sidebar-expand-button'>{expandOrCollapse}</button>
		{content}
	  </div>
    )
  }
}