import React, { Component } from 'react';

export default class Sidebar extends Component {
	//🐘
	constructor() {
		super();
		
		this.handleFieldChange = () => this._handleFieldChange();
	}
	
	_handleFieldChange() {
		console.log('penis');
	}

  render() {
    return (
      <div>
        <input onChange={this.handleFieldChange} />
      </div>
    )
  }
}