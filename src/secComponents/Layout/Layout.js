import React, {Component} from 'react';
import { Container } from 'reactstrap';
import { Header } from '../Header/Header';
import '../main.css';

export class Layout extends Component {

    render() {
        console.log(process.env.NODE_ENV);
        return (<div className="layout">
            <Container fluid="true">
                    <Header/>
            </Container>
        </div>)
    }
}
