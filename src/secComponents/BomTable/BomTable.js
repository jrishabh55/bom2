import React, {Component} from 'react';
import * as $ from 'jquery';
import * as _ from 'lodash';
import { Container, Row, Col, FormGroup, Label, Input, Table } from 'reactstrap';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { BomContract } from '../../services/bom.contract';
import { currencyService } from '../../services/currency.service';
import toastr from 'toastr';
import { getProp } from '../../helpers';

import '../main.css';
import './BomTable.css';

export class BomTable extends Component {

    constructor(props) {
        super(props);
        this.quantity = 0;
        this.bomId = 0;
        this.appendData = '';
        this.orderAsc = true;
        this.searchProdList = [];
        this.currencyRates = {
            USD: 0.015535,
            GBP: 0.011232
        };
        this.saveBtn;
        this.quantity;
        this.totalAmount = [];
        this.userDetails;
        this.currTableData;
        this.supplierDataCaption = '';
        this.supplierDataBody = '';
        this.bomId = this.props.match.params.bomId;
        this.isNew = this.bomId === 'new';
        let comment = [];
        let history = [];

        for (let i = 0; i < 100; i++) {
            comment.push([]);
            history.push([]);
        }

        this.state = {
            currData: [],
            hiddenFooter: true,
            editable: false,
            supp: false,
            addProd: false,
            searchProd: this.searchProdList,
            bom_title: "Untitled",
            comments: comment,
            history: history,
            supplierData: false,
            currencySymbol: '₹',
            currencyRate: 1,
            orderAmount: 0,
            vendorData: [],
            vendorQuotes: [],
            }
    }

    addMultiple(e) {
        let val = e.target.value;
        this.addProduct(val);
        this.fetchPartDetails(val);
    }

    fetchPartDetails($partNo) {
        let data = {
            "query": {
                "match_phrase_prefix": {
                    "company_sku": $partNo
                }
            }
        };

        BomContract.searchPart(data)
        .then(res => {
            this.setState({searchProd: res});
        });
    }

    componentDidMount() {
        if (!this.isNew) {
            ApiService.get(`/contacts/${this.getContactId()}`).then(res => {
                this.userDetails = res.contact;
            });
            let prefVend = StorageService.getItem('prefVendors');
            prefVend = prefVend.trim().split(',').map(vendor => vendor.trim());
            ApiService.get(`/customer/${this.getContactId()}/bom/${this.bomId}`).then(res => {
                this.setState({bom_title: res.estimate.custom_field_hash.cf_title});
                this.currBomData = res.estimate.line_items;
                this.setState({currData: this.currBomData}, () => {
                    let data = this.state.vendorQuotes;
                    this.calOrderAmount();
                    ApiService.get(`/customer/${this.getContactId()}/bom/${this.bomId}/vendor/lowest_quotes`).then(lowest => {
                        if( lowest.aggregations.lowest_quotes.buckets.length > 0 ) {
                            data.push(lowest);
                            this.setState({vendorQuotes: data})
                            this.quotedCurrData(0);
                            prefVend.map(($vend, $i) => {
                                data = this.state.vendorQuotes;
                                ApiService.get(`/customer/${this.getContactId()}/bom/${this.bomId}/vendor/${$vend}`).then(qRes => {
                                    if(qRes.hits.hits.length > 0) {
                                        data.push(qRes);
                                        this.setState({vendorQuotes: data});
                                        this.quotedCurrData(($i + 1));
                                    }
                                })
                            })
                        }
                    });

                });
            });
            currencyService.currencyData().then(res => {
                this.currencyRates.USD = res.rates.USD;
                this.currencyRates.GBP = res.rates.GBP;
            });

             this.saveBtn = <span className="btn fill-btn ml-3" onClick={this.updateOrder.bind(this)}>Update</span>;
        }
        else {
            this.saveBtn = <span className="btn fill-btn ml-3" onClick={this.placeOrder.bind(this)}>Place Order</span>;
        }

    }

    quotedCurrData($i) {
        let quote;
        let vData = this.state.vendorQuotes;
        let temp = this.state.vendorData;
        if($i == 0) {
            quote = vData[temp.length].aggregations.lowest_quotes.buckets.reduce((ittr, item) => {
                ittr[item.key] = item.min_quotes.hits.hits[0]._source.quote;
                return ittr;
            }, {});
        }
        else {
            quote = vData[temp.length].hits.hits.reduce((ittr, item) => {
                ittr[item.key] = item._source;
                return ittr;
            }, {});
        }
        temp.push(quote);
        this.setState({ vendorData: temp });
    }

    getContactId() {
        return AuthService.user().id;
    }

    addProduct($val) {
        if ($val.length > 0) {
            this.setState({ addProd: true });
            this.appendData = $val;
        } else {
            this.setState({ addProd: false });
        }
    }

    currency(){
        let currency= $('#currency')[0].value;
        if(currency == 'INR') {
            this.setState({currencySymbol: '₹', currencyRate: '1'})
        }
        else if(currency == 'USD') {
            this.setState({currencySymbol: '$', currencyRate: this.currencyRates.USD})
        }
        else if(currency == 'GBP') {
            this.setState({currencySymbol: '£', currencyRate: this.currencyRates.GBP})
        }
    }

    placeOrder() {
        let data = {
            items: this.state.currData.map(($data, $index) => {
                let qty = $(`[name=quantity-${$index}]`)[0].value;
                return ({
                    "name": $data._source.name,
                    "description": $data._source.description,
                    "item_order": $index,
                    "bcy_rate": $data._source.msrp,
                    "rate": $data._source.msrp,
                    "quantity": $data.quantity,
                    "item_total": (($data.quantity || 0) * ($data.rate || $data._source.msrp)),
                    "item_custom_fields": [
                        {
                            "label": "Customer Manufacturer Part No",
                            "value": $data._source.company_sku
                        },
                        {
                            "label": "Customer Manufacturer",
                            "value": $data._source.manufacturer
                        }
                    ]
                });
            }),
            title: this.state.bom_title
        };

        ApiService.post(`/customer/${this.getContactId()}/bom`, data).then(res => {
            if (res.message === "The estimate has been created.") {
                toastr.success(`${res.message}: ${res.estimate.estimate_id}`);
                this.props.history.push('/bom');
            } else {
                toastr.error(res.message);
            }
        });
    }

    updateOrder() {
        let data = {
            items: this.state.currData.map(($data, $index) => {
                let qty = $(`[name=quantity-${$index}]`)[0].value;
                return ({
                    "description": $data.description,
                    "item_order": $index,
                    "bcy_rate": $data.bcy_rate,
                    "rate": $data.msrp || $data.rate,
                    "quantity": $data.quantity,
                    "item_total": $data.item_total,
                    "item_custom_fields": [
                        {
                            "label": "Customer Manufacturer Part No",
                            "value": $data.item_custom_fields[0].value
                        },
                        {
                            "label": "Customer Manufacturer",
                            "value": $data.item_custom_fields[1].value
                        }
                    ]
                });
            }),
            title: this.state.bom_title
        }
        ApiService.post(`/customer/${StorageService.getItem('contactId')}/bom/${this.bomId}`, data).then(res => {
            toastr.success(res.message);
            this.props.history.push('/bom');
        });
    }

    appendInput($index) {
        let currTableData = this.state.currData;
        currTableData.push(this.state.searchProd[$index]);
        this.setState({ currData: currTableData });
    }

    edit() {
        this.setState({ editable: !this.state.editable });
    }

    toggleDetailSupplier() {
        this.setState({supp: !this.state.supp});
    }

    toggleFooter(index, expand, $id) {
        this.setState({ hiddenFooter: index === this.state.hiddenFooter ? -1 : index });
        if (expand === true) {
            this.getComments($id, index);
        }
    }

    sorting($colIndex) {
        const $orderPar = this.orderAsc ? 'asc' : 'desc';
        const currTableData = _.orderBy(this.state.currData, $colIndex, $orderPar);
        this.setState({currData: currTableData});
        this.orderAsc = !this.orderAsc;
    }

    updateBomFields($field, $index) {
        let value = $(`[name=${$field}-${$index}]`)[0].value;
        let newData = this.state.currData;
        console.log(newData);
        newData[$index]._source[$field] = value;
        this.setState({currData: newData})
    }

    calOrderAmount($index = 0) {
        let amount = 0;
        let value = $(`[name=quantity-${$index}]`)[0].value;
        let newData = this.state.currData;
        newData[$index]['quantity'] = value;
        this.setState({currData: newData})
        this.state.currData.map(($data, $i) => {
            amount = amount + (($data.quantity || 0) * ($data.rate || $data._source.msrp));
            this.setState({orderAmount: amount})
        })
    }

    addComment($event) {
        $event.preventDefault();
        const $id = $event.target.getAttribute('data');
        const comment = $(`[data="comment-${$id}"]`).val();
        ApiService.addComment({ bom_id: this.bomId, item_id: $id, msg: comment }).then(() => {
            alert("Comment added.");
        });
    }

    getComments($id, index) {
        ApiService.fetchComments({bom_id: this.bomId, item_id: $id})
        .then(res => {
            if (!res.found) {
                return;
            }
            const comments = res._source.comments.map(comment => {
                const date = new Date(comment.timestamp);
                const timestamp = date.toDateString() + ", " + date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                return `${timestamp} ${comment.text}`;
            });

            const push = this.state.comments;
            push[index] = comments;
            this.setState({comments: push});
        });
    }

    lowestQuoteSupplier($data, $index, thisSupplier, $i) {
        let a = $data;
        return (this.supplierDataBody = [
            <td className="stock">
                <label className="checkContainer">
                    <Input type="checkbox" name="signedIn"/>
                    <span className="checkmark"></span>
                </label>
                &#8377;{getProp(this.state.vendorData[$i][$data.line_item_id], 'bid_price') || '-'}<br/>
                <span className="stockLeft">{getProp(this.state.vendorData[$i][$data.line_item_id], 'current_stock') || '-'}</span>
                <span> in stock</span>
            </td>,
        (this.state.supp ? (
            [
                <td>{'-'}</td>,
                <td>{getProp(this.state.vendorData[$i][$data.line_item_id], 'list_price') || '-'}</td>,
                <td>{'-'}</td>,
                <td>{'-'}</td>,
                <td>{'-'}</td>,
                <td>{getProp(this.state.vendorData[$i][$data.line_item_id], 'list_price') - getProp(this.state.vendorData[$i][$data.line_item_id], 'bid_price') || '-'}</td>,
                <td>{getProp(this.state.vendorData[$i][$data.line_item_id], 'discount') || '-'}</td>,
                <td>{getProp(this.state.vendorData[$i][$data.line_item_id], 'current_stock') || '-'}</td>,
                <td>{getProp(this.state.vendorData[$i][$data.line_item_id], '-') || '-'}</td>,
                <td>{getProp(this.state.vendorData[$i][$data.line_item_id], 'delivery_city') || '-'}</td>,
                <td>{getProp(this.state.vendorData[$i][$data.line_item_id], '-') || '-'}</td>,
            ]
        ) : null),

                (this.state.supp
                    ? (<td className="attachment">
                        <i className="fas fa-plus-circle"></i>
                        <i className="far fa-file-pdf"></i>
                    </td>)
                    : null)
        ])
    }

    dataCaption($i) {
        return (
            <td colSpan={this.state.supp ? '13' : 1} onClick={this.toggleDetailSupplier.bind(this)}>
            { !this.state.supp ? <span> <i className="fas fa-eye"></i> Unhide</span>
            : <span> <i className="far fa-eye-slash"></i> Hide</span> }
            </td>
        )
    }

    updateBomTitle() {
        this.setState({bom_title: $('#bomTitle')[0].value})
    }



    render() {
        let thisSupplier = '';
        thisSupplier = [
            <th>Qty.</th>,
            <th className="lg-width">Supplier (total Amount)</th>,
            <th>Offered Manufacturer</th>,
            <th className="lg-width">Offered Manufacturer Part No</th>,
            <th>Payment Terms</th>,
            <th>Cash Discount</th>,
            <th>Discount %</th>,
            <th>Current Stock</th>,
            <th className="lg-width">Time in days to arrange all Qty</th>,
            <th>Stock Location</th>,
            <th>Remarks</th>,
            <th>Supplier Attachment</th>
        ];
        this.supplierDataHead = [
            <th className="supplier">
            <label className="checkContainer">
            <Input type="checkbox" name="signedIn"/>
            <span className="checkmark"></span>
            </label>
            <span className="ml-3 sort" onClick={this.sorting.bind(this, 'supplierA.price')}>Lowest Quote</span>
            </th>,
            (this.state.supp ? thisSupplier : null)
        ]

return (
        <div className="bomTable">
            <Container fluid={true}>
                <Row id="bomHead">
                    <Col md="6">
                        <span className="font-md clr-blue">Saved BOM</span>
                    </Col>
                    <Col md="6">
                        <div className="float-right">
                            <FormGroup>
                                <div className="selectCont alt-dd">
                                    <Input className="empty-input" type="select" name="timeline">
                                        <option>Export BOM</option>
                                    </Input>
                                </div>
                            </FormGroup>
                            <span className="ml-1 clr-secondary font-xs mr-1">
                                Currency
                            </span>
                            <FormGroup>
                                <div className="selectCont alt-dd">
                                    <Input id="currency" className="empty-input" type="select" name="timeline"  onChange={this.currency.bind(this)}>
                                        <option>INR</option>
                                        <option>USD</option>
                                        <option>GBP</option>
                                    </Input>
                                </div>
                            </FormGroup>
                        </div>
                    </Col>
                    <div className="clearfix"/>
                    <Col md="2">
                        <span className="font-xl clr-grey"><Input id="bomTitle" type="text" disabled={this.state.editable ? null : 'disabled'} value={this.state.bom_title} onChange={this.updateBomTitle.bind(this)} /></span>
                    </Col>
                    <Col md="md" className="float-right">
                        <div className="float-right">
                            <FormGroup>
                                <Label>PURPOSE</Label>
                                <div className="selectCont">
                                    <Input type="select" name="purpose">
                                        <option defaultValue = {this.userDetails ? this.userDetails.cf_purpose : ''}>{this.userDetails ? this.userDetails.cf_purpose : 'Select Purpose'}</option>
                                        <option value="Budgetory">Budgetory</option>
                                        <option value="To Quote Further">To Quote Further</option>
                                        <option value="To Order Immediately">To Order Immediately</option>
                                    </Input>
                                </div>
                            </FormGroup>
                            <FormGroup className="ml-2">
                                <Label>TENTATIVE ORDER DATE</Label>
                                <div className="selectCont">
                                    <Input type="select" name="timeline">
                                        <option defaultValue = {this.userDetails ? this.userDetails.cf_tentative_order_date : ''}>{this.userDetails ? this.userDetails.cf_tentative_order_date : 'Select Timeline'}</option>
                                        <option value="At the Earliest">At the Earliest</option>
                                        <option value="2-3 Weeks">2-3 Weeks</option>
                                        <option value="Not sure">Not sure</option>
                                    </Input>
                                </div>
                            </FormGroup>
                            <span className="font-xs clr-secondary ml-3">Order Amount</span>
                            <span className="font-l clr-grey ml-2">{this.state.currencySymbol}{this.state.orderAmount * this.state.currencyRate}</span>
                            {this.saveBtn}
                            <span className="clr-secondary font-xs ml-3">Auto fill</span>
                            <FormGroup className="ml-2">
                                <div className="selectCont alt-dd">
                                    <Input className="empty-input" type="select" name="timeline">
                                        <option>Lowest Price (Overall)</option>
                                    </Input>
                                </div>
                            </FormGroup>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Table bordered="true">
                            <thead>
                                <tr className="tableCaption">
                                    <td colSpan="10" className="clr-form-2 mainCaption">ShopElect Webiste</td>
                                    {this.state.vendorData.map(($vData, $i) => {return this.dataCaption($i)})}
                                    <td></td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th className="clr-primary" onClick={this.edit.bind(this)}>
                                        <a href="javascript:void()">{ this.state.editable ? 'Save' : 'Edit' }</a>
                                    </th>
                                    <th className="sNo">S No</th>
                                    <th className="sort" onClick={this.sorting.bind(this, '[item_custom_fields][0].value')}>Manufacturer</th>
                                    <th className="sort" onClick={this.sorting.bind(this, '[item_custom_fields][1].value')}>Manufacturer Part No</th>
                                    <th>Description</th>
                                    <th className="sort" onClick={this.sorting.bind(this, 'quantity')}>Qty</th>
                                    <th>GST %</th>
                                    <th>HSN</th>
                                    <th className="sort" onClick={this.sorting.bind(this, 'rate')}>Price</th>
                                    <th>Attachment</th>
                                    {this.state.vendorData.map(($vData, $i) => {
                                        return this.supplierDataHead;
                                        }
                                    )}
                                    <th>Customer Notes</th>
                                    <th>Bid Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    this.state.currData.map(($data, $index) => {
                                        $data = $data._source || $data;
                                        return ([
                                            <tr className="tableRow" key={$index}>
                                                <td>
                                                    <label className="checkContainer">
                                                        <Input type="checkbox" name="signedIn"/>
                                                        <span className="checkmark"></span>
                                                    </label>
                                                </td>
                                                <td>{$index + 1}</td>
                                                <td><Input type="text" name={`manufacturer-${$index}`} disabled={this.state.editable && this.isNew ? null : 'disabled'} value={$data.manufacturer || getProp($data['item_custom_fields'][0], 'value_formatted')} onChange={this.updateBomFields.bind(this, 'manufacturer', $index)}/></td>
                                                <td><Input type="text" name={`company_sku-${$index}`} disabled={this.state.editable && this.isNew ? null : 'disabled'} value={$data.company_sku || getProp($data['item_custom_fields'][1], 'value_formatted')} onChange={this.updateBomFields.bind(this, 'company_sku', $index)}/></td>
                                                <td><Input type="text" name={`description-${$index}`} disabled={this.state.editable ? null : 'disabled'} value={$data.description} onChange={this.updateBomFields.bind(this, 'description', $index)}/></td>
                                                <td><Input type="number" name={`quantity-${$index}`} disabled={this.state.editable ? null : 'disabled'} value={$data.quantity} onChange={this.calOrderAmount.bind(this, $index)}/></td>
                                                <td>{getProp(this.state.vendorData[$data.line_item_id], 'GST') || $data.tax_percentage}</td>
                                                <td>{getProp(this.state.vendorData[$data.line_item_id], 'HSN')}</td>
                                                <td>{this.state.currencySymbol}{$data.msrp || $data.rate * this.state.currencyRate}</td>
                                                <td className="attachment">
                                                    <i className="fas fa-plus-circle"></i>
                                                    <i className="far fa-file-pdf"></i>
                                                </td>
                                                {this.state.vendorData.map(($vData, $i) => {
                                                        return this.lowestQuoteSupplier($data, $index, thisSupplier, $i);
                                                    }
                                                )}
                                                <td>{$data.custNotes}</td>
                                                <td>{$data.bidSts}</td>
                                            </tr>,
                                            <tr>
                                                <td colSpan={this.state.supp ? 27 : 15} className="tableFooter">
                                                    {
                                                        this.state.hiddenFooter !== $index
                                                            ? (<span>
                                                                <span className="lastAct">{/* Quantity changes dony by Customer 18th Jan 2018, 12.30pm */}</span>
                                                                <a onClick={this.toggleFooter.bind(this, $index, true, $data.line_item_id)} className="viewActivityLog text-right" href=";" role="button" data-toggle="collapse" data-target={`#collapse${$index}`} aria-expanded="true" aria-controls={`collapse${$index}`}>
                                                                    View Full activity log
                                                                    <i className="ml-1 far fa-plus-square"></i>
                                                                </a>
                                                            </span>)
                                                            : null
                                                    }

                                                    <div id={`collapse${$index}`} className="collapse" aria-labelledby={`heading${$index}`} data-parent="#accordion">
                                                        <div className="card-body text-left">
                                                            <div>
                                                                <Col md="6">
                                                                    <div style={{ display: 'inline-block' }} className="viewActivityLog">
                                                                        <a onClick={this.toggleFooter.bind(this, $index)} className="viewActivityLog" href=";" role="button" data-toggle="collapse" data-target={`#collapse${$index}`} aria-expanded="true" aria-controls={`collapse${$index}`}>
                                                                            Hide Comments log
                                                                            <i className="ml-1 far fa-minus-square"></i>
                                                                        </a>
                                                                    </div>
                                                                    <ul className="ml-3 commentLog">
                                                                        {this.state.comments[$index].map(comment => <li>{comment}</li>)}
                                                                    </ul>
                                                                    <br/>
                                                                    <input type="text" name="comment" data={`comment-${$data.line_item_id}`} placeholder="Add comments or Chat"/>
                                                                    <a className="ml-1 commentSub" href=";" data={$data.line_item_id} onClick={this.addComment.bind(this)}>Submit</a>
                                                                </Col>
                                                                <Col md="6">
                                                                    <div className="float-right">
                                                                        <span>
                                                                            <ul className="commentLog lg-space">
                                                                            {/*
                                                                                <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                                <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                                <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                                <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                            */}</ul>
                                                                        </span>
                                                                        <span>
                                                                            <a onClick={this.toggleFooter.bind(this, $index)} className="viewActivityLog" href=";" role="button" data-toggle="collapse" data-target={`#collapse${$index}`} aria-expanded="true" aria-controls={`collapse${$index}`}>
                                                                                Hide activity log
                                                                                <i className="ml-1 far fa-minus-square"></i>
                                                                            </a>
                                                                        </span>
                                                                    </div>
                                                                </Col>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ])
                                    })
                                }
                            </tbody>
                        </Table>
                        <Col md="4">
                            <div id="copyMPN">
                                <Input onChange={this.addMultiple.bind(this)} type="text" placeholder="Add MPN or SKU"/>
                                <span id="btnMPN">Paste</span>
                            </div>
                            <table class="table table-sm">

                                <tbody>
                            {
                                this.state.searchProd.map(($prod, $index) => {
                                    return (
                                                <tr>
                                                    <td onClick={this.appendInput.bind(this, $index)}><a href="javascript:void()">{$prod._source.company_sku}</a></td>
                                                    <td>{$prod._source.name}</td>
                                                </tr>
                                    );
                                })
                            }
                                    </tbody>
                                </table>
                        </Col>

                    </Col>
                </Row>
            </Container>
        </div>)
    }
}
