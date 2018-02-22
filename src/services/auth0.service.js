import auth0 from 'auth0-js';
import { StorageService } from './storage.service';
import toastr from 'toastr';

class Auth0 {

  constructor() {

    this.isLocal = Boolean(
      window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      window.location.hostname === '[::1]' ||
      // 127.0.0.1/8 is considered localhost for IPv4.
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
    );

    this.auth0 = new auth0.WebAuth({
      domain: 'shopelect.auth0.com',
      clientID: 'Ppfj1JyyG8smHdYi2R1gPqSSCALD3F0L',
      redirectUri: this.isLocal ? 'http://localhost:3000/callback' : 'https://bomui.herokuapp.com/callback',
      audience: 'https://shopelect.auth0.com/api/v2/',
      responseType: 'token'
    });
  }

  login(email, code) {
    StorageService.setItem('email', email);
    this.auth0.passwordlessVerify({
      connection: 'email',
      verificationCode: code,
      email
    }, (err, res) => {
      if (err.statusCode === 400) {
        toastr.error('Invalid code entered');
      }
    });
  }


  loginWithSms(phoneNumber, code) {
    StorageService.setItem('phoneNumber', phoneNumber);
    this.auth0.passwordlessVerify({
      connection: 'sms',
      verificationCode: code,
      phoneNumber: `+${phoneNumber}`
    }, (err, res) => {
      if (err.statusCode === 400) {
        toastr.error('Invalid code entered');
      }
    });
  }

  sendMail(email) {
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
        } else {
          resolve(res);
        }
      });
    });
  }
}

const instance = new Auth0();
export { instance as Auth0 };