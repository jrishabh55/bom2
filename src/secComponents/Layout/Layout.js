import React, {Component} from 'react';
import { Container } from 'reactstrap';
import { Header } from '../Header/Header';
import { Redirect } from 'react-router-dom';
import '../main.css';

export class Layout extends Component {

    render() {
        return (<div className="layout">
            <Container fluid={true}>
                    <Header/>
                    <div className="clearfix" />
                    <div style={{marginBottom: '20px'}} />
                    { this.props.children }
            </Container>
        </div>)
    }
}
