import React from 'react';
import { Redirect } from 'react-router-dom';
import { Guard } from './Guard';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { history } from '../helpers';

export class UserType extends Guard {

  canActive() {
    const user = AuthService.user();
    if (user.type.toLowerCase() !== this.props.type.toLowerCase()) {
      this.path = AuthService.user().type === 'customer' ? '/bom' : '/vendor';
      // return history.push( this.path );
    }
    return true;
  }
}
