import React, { Component } from 'react';

export default class Sidebar extends Component {
	
	constructor(props){
		super(props);
		this.handleChange = props.handleChange;
		this.state = {
			index: props.index,
		}
	}
	
	render(){
		return (
			<input type='text' onChange={evt => this.handleChange(this.state.index, evt)} />
		)
	}
}