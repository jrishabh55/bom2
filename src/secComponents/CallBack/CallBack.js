import React, {Component} from 'react';
import {Auth0} from '../../services/auth0.service';
import history from '../../helpers/history';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';

export class CallBack extends Component {
    componentDidMount() {
        this.handleAuthentication();
    }

    handleAuthentication() {
		Auth0.auth0.parseHash((err, authResult) => {
			if (authResult && authResult.accessToken) {
				this.setSession(authResult);
			}
            else if (err) {
				history.replace('/');
			}
		});
	}

    setSession(authResult) {
        const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
        StorageService.setItem('access_token', authResult.accessToken);
        StorageService.setItem('expires_at', expiresAt);
        AuthService.fetchUser().then(() => {
            history.replace('/bom');
        });
    }

    render() {
        return (<div>Loading</div>)
    }
}

export default CallBack;
