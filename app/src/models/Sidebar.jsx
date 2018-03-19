import React, { Component } from 'react';
import DatePicker from 'react-date-picker';
import ReportingInput from './ReportingInput.jsx';

export default class Sidebar extends Component {
	//🐘
	//TODO: Send field values to appropriate places, meaning header and footer and I imagine the other fields have to be queried somewhere.
	
	constructor() {
		super();
		this.handleDateChange = (date) => this._handleDateChange(date);
		this.handleFieldChange = (index, evt) => this._handleFieldChange(index, evt);
		this.handleExpandOrCollapse = () => this._handleExpandOrCollapse();
		this.state = {
			date: new Date(),
			isCollapsed: true,
			values: ["", "", "", "", "", "", "",]
		};
	}
	
	_handleDateChange(date) {
		this.setState({date});
	}
	
	_handleExpandOrCollapse(){
		this.setState({isCollapsed: !this.state.isCollapsed});
	}
	
	_handleFieldChange(index, evt) {
		//TODO: Probably split this function into multiple to distinguish which field was changed.
		//Also TODO: Actually send the changed value someplace.
		var value = evt.target.value;
		var newValues = this.state.values.slice();
		newValues[index] = value;
		this.setState({values: newValues});
	}

  render() {
    let content;
	var boundHandleFieldChange = this.handleFieldChange.bind(this);
	
	if(!this.state.isCollapsed){
		content = (
			<div>
				<h1>Sidebar of sidebariness!</h1> {/* Note: This provides necessary space for the datepicker to display. Do not remove without replacement! */}
				<p>Title:</p><ReportingInput handleChange = {boundHandleFieldChange} index = {0} />
				<p><br></br>Author:</p><ReportingInput handleChange = {boundHandleFieldChange} index = {1} />
				<p><br></br>Date:</p><DatePicker onChange={this.handleDateChange} value={this.state.date} />
				<p>Header:</p><ReportingInput handleChange = {boundHandleFieldChange} index = {2} /><ReportingInput handleChange = {boundHandleFieldChange} index = {3} /><ReportingInput handleChange = {boundHandleFieldChange} index = {4} />
				<p>Footer:</p><ReportingInput handleChange = {boundHandleFieldChange} index = {5} /><ReportingInput handleChange = {boundHandleFieldChange} index = {6} /><ReportingInput handleChange = {boundHandleFieldChange} index = {7} />
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