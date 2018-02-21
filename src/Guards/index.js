import React, { Component } from 'react';

export class Guard extends Component {
  render() {
    return this.canActive();
  }
}

export default Guard;
