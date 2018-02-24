import React from 'react';
import { Redirect } from 'react-router-dom';
import { Guard } from './Guard';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { history } from '../helpers';

export class Private extends Guard {

  canActive() {
    if (!AuthService.isAuthenticated()) {
      StorageService.clear();
        return history.push(this.path);;
    }
  }
}
