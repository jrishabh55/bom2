import React, {Component} from 'react';
import { Container } from 'reactstrap';
import { Header } from '../Header/Header';
import '../main.css';

export class Layout extends Component {

    render() {
        return (<div className="layout">
            <Container fluid="true">
                    <Header/>
            </Container>
        </div>)
    }
}
