import React, { Component } from 'react';

export default class Sidebar extends Component {
	
	constructor(props){
		super(props);
		this.handleFieldChange = props.handleFieldChange;
		this.handleChange = (index, evt) => this._handleChange(index, evt);
		this.state = {
			index: props.index,
			value: props.value,
		}
	}
	
	_handleChange(index, evt){
		this.setState({value: evt.target.value})
		this.handleFieldChange(this.state.index, evt);
	}
	
	render(){
		return (
		<input type='text' onChange={evt => this.handleChange(this.state.index, evt)} value={this.state.value}/>
		)
	}
}