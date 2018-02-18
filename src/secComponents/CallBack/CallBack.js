import React, {Component} from 'react';
import {Auth0} from '../../services/auth0.service';
import history from '../../helpers/history';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';

export class CallBack extends Component {
    componentDidMount() {
        this.handleAuthentication();
    }

    handleAuthentication() {
		Auth0.auth0.parseHash((err, authResult) => {
            console.log('a')
			if (authResult && authResult.accessToken) {
				this.setSession(authResult);
			}
            else if (err) {
				history.replace('/');
				console.log(err);
			}
		});
	}

    setSession(authResult) {
        const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
        localStorage.setItem('access_token', authResult.accessToken);
        localStorage.setItem('expires_at', expiresAt);
        history.replace('/bom');
    }

    render() {
        return (<div>Loading</div>)
    }
}

export default CallBack;
