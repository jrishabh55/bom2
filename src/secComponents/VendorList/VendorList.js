import React, {Component} from 'react';
import {ApiService} from '../../services/api.service';
import {VendorContract} from '../../services/vendor.contract';
import {Link} from 'react-router-dom';
import { Button } from 'reactstrap';

export class VendorList extends Component {
    constructor() {
        super();
        this.state = {
            vendorList: []
        };
    }

    componentDidMount() {
        ApiService.get(`/bom`).then(res => {
            console.log(res.estimates)
            this.setState({ vendorList: res.estimates });
        })
    }

    render() {
        return (<div>
            <Button>Add Quote</Button>
            <ul className="list-group">
                {
                    this.state.vendorList.map(($data, $index) => {
                        return (<li className="list-group-item" key={$index}>
                            <Link onClick={VendorContract.setCustomerId.bind(this, $data.customer_id)} to={`/vendor/${$data.estimate_id}`}>Bom Id: {$data.estimate_id} <small>{$data.customer_name}</small></Link>
                        </li>)
                    })
                }
            </ul>
        </div>)
    }
}
