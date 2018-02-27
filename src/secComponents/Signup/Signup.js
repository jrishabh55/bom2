import React, { Component } from 'react';
import $ from 'jquery';
import {Link} from 'react-router-dom';
import {
    Container,
    Row,
    Col,
    Button,
    Form,
    FormGroup,
    Label,
    Input
} from 'reactstrap';
import {AuthService} from '../../services/auth.service';
import {ApiService} from '../../services/api.service';
import '../main.css';
import './signup.css';
import toastr from 'toastr';

export class SignUp extends Component {


    constructor(props) {
        super(props);
        this.signupHeight = '300';
        this.nextScreen = this.nextScreen.bind(this);
        this.getFormField = this.getFormField.bind(this);
        this.setFormField = this.setFormField.bind(this);
        this.register = this.register.bind(this);
        this.newVendor = this.newVendor.bind(this);
        this.state = {
            activeCard: 1,
            invalidFields: [],
            name: '',
            email: '',
            phone: '',
            companyName: '',
            typeOfCompany: '',
            noOfEmployes: '',
            city: '',
            ref: '',
            purpose: '',
            orderDate: '',
            vendorData: [
                {
                    name: '',
                    email: ''
                }
            ]
        };

        this.invalidFields = [];

        this.form = {
            name: '',
            email: '',
            phone: '',
            companyName: '',
            typeOfCompany: '',
            noOfEmployes: '',
            city: '',
            ref: '',
            purpose: '',
            orderDate: ''
        };

    }

    nextScreen(e) {
        if (!this.validateScreen()) {
            return console.log(this.invalidFields);
        }
        this.setState({
            activeCard: this.state.activeCard + 1
        });
    }

    validateScreen() {
        const screen = this.state.activeCard;
        this.invalidFields = [];
        if (screen === 1) {
            return this.checkFormFields('name', 'email', 'phone');
        } else if (screen === 2) {
            return this.checkFormFields('companyName', 'typeOfCompany', 'noOfEmployes', 'city');
        } else if (screen === 3) {
            return this.checkFormFields('purpose', 'orderDate');
        } else if (screen === 4) {
            return true;
        }
    }

    getFormField(key) {
        return this.state[key];
    }

    getFormData() {
        return this.form;
    }

    checkFormField(key) {
        const val = this.getFormField(key);
        const ref = $(`[name=${key}]`);

        if (val.length === 0) {
            this.invalidFields.push(key);
            if (!ref.hasClass('is-invalid')) {
                $(`[name=${key}]`).addClass('is-invalid');
            }
            return false;
        }
        if (ref.hasClass('is-invalid')) {
            $(`[name=${key}]`).removeClass('is-invalid');
        }
        return true;
    }

    checkFormFields(...keys) {
        let res = true;
        keys.forEach(key => {
            if (!this.checkFormField(key)) {
                res = false;
            }
        });
        return res;
    }

    setFormField(event) {
        const value = event.target.value;
        const key = event.target.getAttribute('name');
        this.setState({
            [key]: value
        }, () => console.log(this.state[key]));
    }

    setVendorFormField($index, event) {
        let data = this.state.vendorData;
        const value = event.target.value;
        const key = event.target.getAttribute('name');
        if(key === `vendorName-${$index}`){
            data[$index].name = value;
            this.setState({
                vendorData: data
            }, () => console.log(this.state.vendorData));
        }
        else if(key === `vendorEmail-${$index}`){
            data[$index].email = value;
            this.setState({
                vendorData: data
            }, () => console.log(this.state.vendorData));
        }
    }

    componentDidMount() {
        this.signupHeight = $('#signup1')[0].clientHeight + 'px';
    }

    render() {
        let card = null;

        switch (this.state.activeCard) {
            case 1:
                card = this.firstScreen();
                break;
            case 2:
                card = this.secondScreen();
                break;
            case 3:
                card = this.thirdScreen();
                break;
            case 4:
                card = this.fourthScreen();
                break;
            default:
                card = this.fourthScreen();
        }

        return (<div className="signUp">
            <Container fluid={true} className="signUpCont">
                <Row className="justify-content-center">
                    <Col md="4" className="stepCont">
                        {card}
                    </Col>
                </Row>
            </Container>
        </div>);
    }

    firstScreen() {
        return (<div className="signUpStep" id="signup1">
            <div className="clearfix signUpHead">
                <Col md="6" className="s-bg-secondary clr-primary">
                    <Link to="/login">
                        <p>SIGN IN</p>
                    </Link>
                </Col>
                <Col md="6">
                    <Link to="/signup">
                        <p>SIGN UP</p>
                    </Link>
                </Col>
            </div>
            <Form>
                <FormGroup>
                    <Label>NAME</Label>
                    <Input type="text" name="name" value={this.getFormField('name')} onChange={this.setFormField.bind(this)} placeholder="Enter Your Name"/>
                </FormGroup>
                <FormGroup>
                    <Label>EMAIL ADDRESS</Label>
                    <Input type="email" name="email" value={this.getFormField('email')} onChange={this.setFormField.bind(this)} placeholder="Enter email address"/>
                </FormGroup>
                <FormGroup>
                    <Label>PHONE NUMBER</Label>
                    <Input type="number" name="phone" value={this.getFormField('phone')} onChange={this.setFormField} placeholder="Enter phone number"/>
                </FormGroup>
                <div className="clearfix">
                    <Button onClick={this.nextScreen} className="s-bg-primary s-btn float-right" style={{
                            marginTop: '73px'
                        }}>Next</Button>
                </div>
            </Form>
            <hr/>
            <Link to="/login">
                <p className="text-center clr-primary font-sm2">HAVE AN ACCOUNT? SIGN IN</p>
            </Link>
        </div>);
    }

    secondScreen() {
        return (<div className="signUpStep" style={{
                height: this.signupHeight
            }}>
            <div className="clearfix signUpHead">
                <Col md="12">
                    <p>Company Details</p>
                </Col>
            </div>
            <Form>
                <FormGroup>
                    <Label>YOUR COMPANY NAME</Label>
                    <Input type="text" name="companyName" value={this.getFormField('companyName')} onChange={this.setFormField} placeholder="Enter Company Name"/>
                </FormGroup>
                <FormGroup>
                    <Label>TYPE OF COMPANY</Label>
                    <div className="selectCont">
                        <Input type="select" name="typeOfCompany" onChange={this.setFormField}>
                            <option>Select from the following</option>
                            <option>OEM</option>
                            <option>End User</option>
                            <option>Trader</option>
                            <option>Contractor</option>
                            <option>Panel Builder</option>
                        </Input>
                    </div>
                </FormGroup>
                <FormGroup>
                    <Label>NO. OF EMPLOYEES</Label>
                    <div className="selectCont">
                        <Input type="select" name="noOfEmployes" onChange={this.setFormField}>
                            <option>Select from the following</option>
                            <option>1 to 10</option>
                            <option>11 to 50</option>
                            <option>51 to 200</option>
                            <option>More than 200</option>
                        </Input>
                    </div>
                </FormGroup>
                <FormGroup>
                    <Label>CITY OF SUPPLY</Label>
                    <Input type="text" name="city" value={this.getFormField('city')} placeholder="Enter City Name" onChange={this.setFormField}/>
                </FormGroup>
                <div className="clearfix">
                    <Button onClick={this.nextScreen} className="s-bg-primary s-btn float-right">Next</Button>
                </div>
            </Form>
        </div>);
    }

    thirdScreen() {
        return (<div className="signUpStep" style={{
                height: this.signupHeight
            }}>
            <div className="clearfix signUpHead">
                <Col md="12">
                    <p>BOM Details</p>
                </Col>
            </div>
            <Form>
                <FormGroup>
                    <Label>YOUR REFERENCE</Label>
                    <Input type="text" name="ref" value={this.getFormField('ref')} onChange={this.setFormField} placeholder="Enter Your Reference"/>
                </FormGroup>
                <FormGroup>
                    <Label>PURPOSE</Label>
                    <div className="selectCont">
                        <Input type="select" name="purpose" value={this.getFormField('purpose')} onChange={this.setFormField}>
                            <option>Select from the following</option>
                            <option value="Budgetary">Budgetary</option>
                            <option value="To Quote Further">To Quote Further</option>
                            <option value="To Order Immediately">To Order Immediately</option>
                        </Input>
                    </div>
                </FormGroup>
                <FormGroup>
                    <Label>TENTATIVE ORDER DATE</Label>
                    <div className="orderDate">
                        <Input type="select" name="orderDate" value={this.getFormField('orderDate')} onChange={this.setFormField}>
                            <option>Select from the following</option>
                            <option value="At the Earliest">At the Earliest</option>
                            <option value="2-3 Weeks">2-3 Weeks</option>
                            <option value="Not sure">Not sure</option>
                        </Input>
                    </div>
                </FormGroup>
                <div className="clearfix">
                    <Button onClick={this.nextScreen} className="s-bg-primary s-btn float-right" style={{
                            marginTop: '73px'
                        }}>Next</Button>
                </div>
            </Form>
        </div>);
    }

    fourthScreen() {
        return (<div className="signUpStep" style={{
                height: this.signupHeight
            }}>
            <div className="clearfix signUpHead">
                <Col md="12">
                    <p>Add your Preferred Vendors</p>
                </Col>
            </div>
            <Form>
                <div className="formGroupCont">
                {
                    this.state.vendorData.map(($vendor, $index) => {
                        return ([
                            <FormGroup>
                                <Label>VENDOR NAME</Label>
                                <Input required type="text" name={`vendorName-${$index}`} onChange={this.setVendorFormField.bind(this, $index)} placeholder="Enter Vendor Name"/>
                            </FormGroup>,
                            <FormGroup>
                                <Label>VENDOR EMAIL ADDRESS</Label>
                                <Input required type="email" name={`vendorEmail-${$index}`} onChange={this.setVendorFormField.bind(this, $index)} placeholder="Enter Vendor email address"/>
                            </FormGroup>])
                    })
                }
                </div>
                <div className="clearfix">
                    <Button className="s-bg-primary s-btn float-left" onClick={this.newVendor} style={{marginTop: '73px'}}>Add New</Button>
                    <Button className="s-bg-primary s-btn float-right" onClick={this.register} style={{marginTop: '73px'}}>Finish</Button>
                </div>
            </Form>
        </div>);
    }

    newVendor() {
        let data = this.state.vendorData;
        let newData = {
            name: '',
            email: ''
        }
        if (data.length < 6) {
            data.push(newData);
            console.log(data)
            this.setState({vendorData: data});
        }
        else {
            alert('you can add six suppliers')
        }

    }

    register(e) {
        let vendorId = [];
        const proms = this.state.vendorData.map(($vendor, $index) => {
            const data = {
                company_name: $vendor.name,
                contact_name: $vendor.name,
                contact_type: "vendor",
                contact_persons: [ { email: $vendor.email } ]
            };
            return ApiService.post('/contacts', data).then(res => {

                if(res.code == 3062) {
                    toastr.error('Vendor Already Exist')
                }
                if(res.code == 0) {
                    vendorId.push(res.contact.contact_id);
                    if(vendorId.length == this.state.vendorData.length) {
                        vendorId = vendorId.toString();
                        if (!this.validateScreen()) {
                            return false;
                        }
                    }
                }
            });
        });

        Promise.all( proms ).then( () => {
          AuthService.register({
            contact_name: this.getFormField('name'),
            company_name: this.getFormField('companyName'),
            contact_persons: [
              {
                first_name: this.getFormField('name'),
                email: this.getFormField('email'),
                phone: this.getFormField('phone'),
                is_primary_contact: true
              }
            ],
            custom_fields: [
              {
                index: 6,
                value: this.getFormField('typeOfCompany')
              }, {
                index: 7,
                value: this.getFormField('noOfEmployes')
              }, {
                index: 8,
                value: this.getFormField('city')
              }, {
                index: 9,
                value: this.getFormField('purpose')
              }, {
                index: 10,
                value: this.getFormField('orderDate')
              }, {
                index: 12,
                value: vendorId
              }
            ]
          }).then(response => toastr.success(response.message))
          .catch(error => toastr.error(error.message));
        } );
    }
}
