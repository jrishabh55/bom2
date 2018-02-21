import React from 'react';
import { Redirect } from 'react-router-dom';
import { Guard } from '../index';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';

export class Private extends Guard {

  canActive() {
    if ( AuthService.isAuthenticated() ) {
      return this.props.children;
    }
    StorageService.clear();
    return <Redirect to='/login'/>;
  }
}
