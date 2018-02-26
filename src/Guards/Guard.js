import React, { Component } from 'react';

export class Guard extends Component {

  constructor(props) {
    super(props);
    this.path = '/login';
  }

  componentWillMount() {
    if ( this.canActive ) {
      this.canActive();
    }
  }

  render() {
    return this.props.children;
  }

}

export default Guard;
