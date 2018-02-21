import React, { Component } from 'react';
import $ from 'jquery';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Form, FormGroup, Label, Input } from 'reactstrap';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { Auth0 } from '../../services/auth0.service';
import { env } from '../../helpers';
import toastr from 'toastr';
import './login.css';

export class Login extends Component {


    constructor() {
        super();
        this.phoneNumber = 0;
        this.otp = 0;
        this.email = '';
        this.state = { loginType: '' };
    }

    fetchOtp() {
        this.otp = $('input[name=otp]').val();
    }

    doLogin() {
        if(this.otp.length === 4) {
            if(this.state.loginType === 'sms') {
                Auth0.loginWithSms(this.phoneNumber, this.otp)
            }
            else if(this.state.loginType === 'email') {
                Auth0.login(this.email, this.otp);
            }
        }
        else {
            toastr.error('Enter 4 digit OTP');
        }
    }

    sendOtp() {
        let $val = $('input[name=email]').val();
        let reEmail = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        let reMobile = /^([0|+[0-9]{1,5})?([7-9][0-9]{9})$/;
        if (reEmail.test($val)){
            this.setState({loginType: 'email'},() => {} );
            this.email = $val;
            AuthService.checkUser(this.email, 'email').then(res => {
                if( res.success ) {
                    console.log(res)
                    this.setContactId(res.contactId);
                    Auth0.sendMail(this.email).then(res => {
                        $('input[name=otp], #signinBtn').removeAttr('disabled').removeClass('disabled');
                        toastr.success('OTP has been sent')
                    });
                }
                else {
                    toastr.error('User does not exist')
                }
            });

        }
        else if (reMobile.test($val)) {
            this.setState({loginType: 'sms'},() => {} );
            this.phoneNumber = $val;
            AuthService.checkUser(this.phoneNumber, 'mobile').then(res => {
                if( res.success ) {
                    this.setContactId(res.contactId);
                    Auth0.sendSms(this.phoneNumber).then(res => {
                        $('input[name=otp], #signinBtn').removeAttr('disabled').removeClass('disabled');
                        toastr.success('OTP has been sent')
                    });
                }
                else {
                    toastr.error('User does not exist')
                }
            });
        }
        else{
            toastr.error('Email or Mobile No invalid')
        }
    }

    setContactId(contactId) {
		StorageService.setItem('contactId', contactId);
	}

    render() {
        return (
            <div className="login">
                <Container fluid={true} className="loginCont">
                    <Row className="justify-content-center">
                        <Col md="4" lg="3" className="stepCont">
                            <div className="loginStep">
                                <div className="clearfix loginHead">
                                    <Col md="6">
                                        <Link to="/login"><p>SIGN IN</p></Link>
                                    </Col>
                                    <Col md="6" className="s-bg-secondary clr-primary">
                                        <Link to="/signup"><p>SIGN UP</p></Link>
                                    </Col>
                                </div>
                                <Form>
                                    <FormGroup>
                                        <Label>EMAIL ADDRESS / MOBILE</Label>
                                        <Input type="text" name="email" placeholder="Enter Your Email or Mobile Number" />
                                    </FormGroup>
                                    <FormGroup style={{marginTop:'-10px'}}>

                                    <p className="text-right clr-primary font-sm"><a onClick={this.sendOtp.bind(this)} href="javascript:void()">Send OTP</a></p>
                                    </FormGroup>
                                    <FormGroup>
                                        <Input type="text" name="otp" disabled onChange={this.fetchOtp.bind(this)} placeholder="Enter Your OTP" />
                                    </FormGroup>
                                    {/*<FormGroup>
                                    <label className="checkContainer">
                                        <Input type="checkbox" name="signedIn" />
                                        <span className="checkmark"></span>
                                    </label>
                                        <Label className="font-sm clr-primary">
                                            <span className="ml-3">Keep me signed in </span>
                                        </Label>
                                    </FormGroup>*/}
                                    <div className="clearfix">
                                        <Row className="justify-content-center">
                                            <Button id="signinBtn" onClick={this.doLogin.bind(this)} className="mt-4 s-bg-primary s-btn">SIGN IN</Button>
                                        </Row>
                                    </div>
                                </Form>
                                <hr />
                                <Link to="/signup"><p className="text-center clr-primary font-sm2">DON'T HAVE AN ACCOUNT? SIGN UP</p></Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        )
    }
}
