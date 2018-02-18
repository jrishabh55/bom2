import React, {Component} from 'react';
import {ApiService} from '../../services/api.service';
import {StorageService} from '../../services/storage.service';
import {Link} from 'react-router-dom';
import { Button } from 'reactstrap';

export class BomList extends Component {
    constructor() {
        super();
        this.state = {
            bomList: []
        };

    }

    componentDidMount() {
        ApiService.get(`/customer/${this.getContactId()}/bom`).then(res => {
            console.log(res)
            this.setState({ bomList: res.estimates });
        })
        ApiService.get(`/contacts/${this.getContactId()}`).then(res1 => {
            const prefVendors = res1.contact.cf_preferred_vendors;
            prefVendors ? StorageService.setItem('prefVendors', prefVendors) : ''
        })
    }

    getContactId() {
        return localStorage.getItem('contactId');
    }

    render() {
        return (<div>
            <Button>
                <Link to="/bom/new">Add New</Link>
            </Button>
            <ul className="list-group">
                {
                    this.state.bomList.map(($data, $index) => {
                        return (<li className="list-group-item" key={$index}>
                            <Link to={`/bom/${$data.estimate_id}`}>Bom Id: {$data.estimate_id}</Link>
                        </li>)
                    })
                }
            </ul>
        </div>)
    }
}
