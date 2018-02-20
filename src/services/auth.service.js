import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { Redirect } from 'react-router';

class AuthService {

    constructor() {
        this.checkUser.bind(this);
        this.register.bind(this);
    }

    async checkUser(value = '', type = 'number') {
        return fetch(ApiService.buildUrl(`/login`, { [type]: value })).then(ApiService.parse);
    }

    async register(data) {
        return fetch(ApiService.buildUrl(`/contacts`), {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(ApiService.parse);
    }

    user () {
        return { id: StorageService.getItem('contactId') };
    }

    isAuthenticated() {
        return StorageService.getItem('access_token') && StorageService.getItem('expires_at') > Date.now();
    }

    logout() {
        
        return StorageService.clear();
    }
}

const instance = new AuthService();
export { instance as AuthService };
