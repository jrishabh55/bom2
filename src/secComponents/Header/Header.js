import React, {Component} from 'react';
import { Container, Row, Col, Button, Form, FormGroup, Label, Input } from 'reactstrap';
import '../main.css';
import './header.css';
import {StorageService} from '../../services/storage.service';
import {AuthService} from '../../services/auth.service';

export class Header extends Component {
    constructor() {
        super();
    }
    render() {
        return([
            <Row className="">
                <Col md="6">
                    <span className="text-left font-sm2 clr-primary">Call: +91 9222 666 999 | Email us at: shop@shopelect.com  </span>
                </Col>
                <Col md="6">
                    {AuthService.isAuthenticated() ? (<span className="ml-3 float-right font-sm2 clr-primary"><a href="javascript:void" onClick={AuthService.logout.bind(this)}>Logout</a></span>) : ''}
                    <span className="float-right font-sm2 clr-primary">Customer ABC</span>
                </Col>
            </Row>,
            <Row className="searchHeader align-items-center">
                <Col md="4">
                    <span className="logo"><img src="/assets/media/logo.png" /></span>
                </Col>
                <Col md>
                    <input type="text" name='search' placeholder="Search by Part no or keyword" />
                </Col>
            </Row>]

        )
    }
}
