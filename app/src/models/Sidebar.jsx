import React, { Component } from 'react';
import DatePicker from 'react-date-picker';
import ReportingInput from './ReportingInput.jsx';

export default class Sidebar extends Component {
	//🐘
	//TODO: Send field values to appropriate places, meaning header and footer and I imagine the other fields have to be queried somewhere.
	
	constructor(props) {
		super(props);
		this.handleDateChange = (date) => this._handleDateChange(date);
		this.handleFieldChange = (index, evt) => this._handleFieldChange(index, evt);
		this.handleExpandOrCollapse = () => this._handleExpandOrCollapse();
		this.handleMouseHover = () => this._handleMouseHover();
		this.state = {
			date: new Date(),
			isCollapsed: true,
			values: ["", "", "", "", "", "", ""],
			isHovering: false,
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
	
	_handleMouseHover(){
		this.setState({isHovering: !this.state.isHovering});
		this.setState({isCollapsed: true});
	}

  render() {
    var content;
	var boundHandleFieldChange = this.handleFieldChange.bind(this);
	if(!this.state.isCollapsed){
		content = (
			<div>
				<h1>Sidebar of sidebariness!</h1> {/* Note: This provides necessary space for the datepicker to display. Do not remove without replacement! */}
				<p>Title:</p>
				<ReportingInput handleFieldChange = {boundHandleFieldChange} index = {0} value={this.state.values[0]}/>
				<p><br></br>Author:</p>
				<ReportingInput handleFieldChange = {boundHandleFieldChange} index = {1} value={this.state.values[1]}/>
				<p><br></br>Date:</p><DatePicker onChange={this.handleDateChange} value={this.state.date} />
				<p>Header:</p>
				<ReportingInput handleFieldChange = {boundHandleFieldChange} index = {2} value={this.state.values[2]}/>
				<ReportingInput handleFieldChange = {boundHandleFieldChange} index = {3} value={this.state.values[3]}/>
				<ReportingInput handleFieldChange = {boundHandleFieldChange} index = {4} value={this.state.values[4]}/>
				<p>Footer:</p>
				<ReportingInput handleFieldChange = {boundHandleFieldChange} index = {5} value={this.state.values[5]}/>
				<ReportingInput handleFieldChange = {boundHandleFieldChange} index = {6} value={this.state.values[6]}/>
				<ReportingInput handleFieldChange = {boundHandleFieldChange} index = {7} value={this.state.values[7]}/>
			</div>
			);
	}
	var expandOrCollapse = this.state.isCollapsed ? '>>' : '<<';
	var style = this.state.isCollapsed ? {width: '5vw'} : {width: '45vw'};
	return (
			<div id='sidebar' style={style} onMouseEnter={this.handleMouseHover} onMouseLeave={this.handleMouseHover}>
					{this.state.isHovering &&
						<div>
						<button onClick={this.handleExpandOrCollapse} id='sidebar-expand-button'>{expandOrCollapse}</button>
						{content}
						</div>
					}
			</div>
		)
  }
}