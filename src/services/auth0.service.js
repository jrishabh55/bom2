import auth0 from 'auth0-js';
import { StorageService } from './storage.service';
import toastr from 'toastr';

class Auth0 {
    auth0 = new auth0.WebAuth({
        domain: 'shopelect.auth0.com',
        clientID: 'Ppfj1JyyG8smHdYi2R1gPqSSCALD3F0L',
        redirectUri: 'https://bomui.herokuapp.com/callback',
        audience: 'https://shopelect.auth0.com/api/v2/',
        responseType: 'token'
    });

    login(email, code) {
        console.log(email, code)
        StorageService.setItem('email', email);
        this.auth0.passwordlessVerify({
            connection: 'email',
            verificationCode: code,
            email
        }, (err, res) => {
            if (err.statusCode === 400) {
                toastr.error('Invalid code entered');
            }
            console.log(res);
        });
    }


    loginWithSms(phoneNumber, code) {
        console.log(phoneNumber, code)
        StorageService.setItem('phoneNumber', phoneNumber);
        this.auth0.passwordlessVerify({
            connection: 'sms',
            verificationCode: code,
            phoneNumber: `+${phoneNumber}`
        }, (err, res) => {
            if (err.statusCode === 400) {
                toastr.error('Invalid code entered');
            }
            console.log(res);
        });
    }

    sendMail(email) {
        console.log(email)
        return new Promise((resolve, reject) => {
            this.auth0.passwordlessStart({
                connection: 'email',
                send: 'code',
                email: email
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        }).then((res) => {
            return res;
        });
    }

    async sendSms(phoneNumber) {
        return new Promise((resolve, reject) => {
            this.auth0.passwordlessStart({
                connection: 'sms',
                send: 'code',
                phoneNumber: `+${phoneNumber}`
            }, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        }).then((res) => {
            return res;
        });
    }
}

const instance = new Auth0();
export { instance as Auth0 };
