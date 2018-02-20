import React, {Component} from 'react';
import { Container, Row, Col, Button, Form, FormGroup, Label, Input, Table } from 'reactstrap';
import { ApiService } from '../../services/api.service';
import { StorageService } from '../../services/storage.service';
import { VendorContract } from '../../services/vendor.contract';
import '../main.css';
import './vendorTable.css';
import * as $ from 'jquery';
import * as _ from 'lodash';

export class VendorTable extends Component {

    currTableData = [];
    orderAsc = true;
    tableData = [
        {
            desc: 'Lorem Ipsum',
            bom: {
                no: 'Cust1010',
                date: '20th Jan 18'
            },
            custName: 'ABC Corp',
            manu: 'Schneider',
            manuPartNo: 'INA_465P465',
            itemGroup: 'NSX MCCB',
            qty: '5',
            currStock: '250',
            gst: '18',
            hsn: '8521485690',
            listPrice: '1000',
            discount: '20',
            timeEst: '30',
            freeDel: 'Pune',
            quote: '800',
            commision: '40',
            payment: '760',
            remarks: 'No Packing',
            notes: 'Lorem Ipsum'
        },
        {
            desc: 'Lorem Ipsum',
            bom: {
                no: 'Cust1020',
                date: '20th Jan 18'
            },
            custName: 'VBC Corp',
            manu: 'Zchneider',
            manuPartNo: 'ANA_465P465',
            itemGroup: 'MSX MCCB',
            qty: '15',
            currStock: '250',
            gst: '18',
            hsn: '8521485690',
            listPrice: '1000',
            discount: '20',
            timeEst: '30',
            freeDel: 'Pune',
            quote: '800',
            commision: '40',
            payment: '760',
            remarks: 'No Packing',
            notes: 'Lorem Ipsum'
        }
    ]

    constructor(props) {
        super(props);
        this.vendorId = this.props.match.params.vendorId;
        this.currTableData = this.tableData;
        this.currTableData = _.orderBy(this.tableData, 'sNo', 'asc');
        this.allBom;
        this.bomIndex = 0;
        this.bomsToFetch = 10;
        this.showManuDetails = false;
        this.state = {
            currData: [],
            currDataDetails: [],
            showFooter: true,
            editable: false,
            modalDescData: '',
            bomList: [],
            manuDetails: []
            };
            $(window).on('scroll', () => {
                var scrollHeight = $(document).height();
            	var scrollPosition = $(window).height() + $(window).scrollTop();
            	if ((scrollHeight - scrollPosition) / scrollHeight === 0) {
            	    this.fetchBom();
            	}
            })
    }

    componentDidMount() {
        ApiService.get(`/bom`).then(res => {
            console.log(res.estimates[0].estimate_id)
            this.setState({ bomList: res.estimates },()=>console.log(this.state.bomList));
            this.fetchBom();
        })
    };

    updateBomFields($field, $i, $index) {
        let value = $(`[name=${$field}-${$i}-${$index}]`)[0].value;
        let newData = this.state.currData;
        if($field == 'manuName'){
            newData[$i][$index]['item_custom_fields'][0] ? newData[$i][$index]['item_custom_fields'][0].value_formatted = value : '';
        }
        else if($field == 'manuPart'){
            newData[$i][$index]['item_custom_fields'][1] ? newData[$i][$index]['item_custom_fields'][1].value_formatted = value : '';
        }
        else {
            console.log(newData[$i][$index])
            newData[$i][$index][$field] = value;
        }
        this.setState({currData: newData})
    }

    fetchBom() {
        for(let i = (this.bomIndex); i < (this.bomIndex + this.bomsToFetch); i++) {
            const url = `/customer/${VendorContract.getCustomerId}/bom/${this.state.bomList[i][`estimate_id`]}`;
            let data = this.state.currData;
            let dataDetails = this.state.currDataDetails;
            ApiService.get(url).then(res => {
                data.push(res.estimate.line_items)
                dataDetails.push(res.estimate)
                this.setState({currData: data, currDataDetails: dataDetails},()=>{console.log(this.state.currData)})
            })
        }
        this.bomIndex += this.bomsToFetch;
    }

    edit() {
        this.setState({editable: !this.state.editable}, () => {})
    }

    toggleFooter() {
        this.setState({
            showFooter: !this.state.showFooter
        }, () => console.log(this.state.showFooter));
    }

    sorting($colIndex) {

        let $orderPar = this.orderAsc ? 'asc' : 'desc';
        this.currTableData = _.orderBy(this.state.currData, $colIndex, $orderPar);
        this.setState({currData: this.currTableData});
        this.orderAsc = !this.orderAsc;
    }

    quotedData($i, $index) {
        let data = {};
        data.list_price = $(`#list_price-${$i}-${$index}`)[0].valueAsNumber;
        data.discount = $(`#discount-${$i}-${$index}`)[0].valueAsNumber;
        data.time_to_ship = $(`#timeToShip-${$i}-${$index}`)[0].valueAsNumber;
        data.current_stock = $(`#stock-${$i}-${$index}`)[0].valueAsNumber;
        data.HSN = $(`#hsn-${$i}-${$index}`)[0].value;
        data.GST = $(`#gst-${$i}-${$index}`)[0].valueAsNumber;
        data.delivery_city = $(`#delivery_city-${$i}-${$index}`)[0].value;
        data.remarks = $(`#remarks-${$i}-${$index}`)[0].value;
        return data;
    }

    makeQuote() {
        this.state.currData.map(($data2, $i) => {
            $data2.map(($data, $index) => {

                const url = `/vendor/${StorageService.getItem('contactId')}/bom/${this.state.currDataDetails.estimate_id}/quote/${$data.line_item_id}`;
                const data =  this.quotedData($i, $index);
                ApiService.post(url, data).then(console.log);
            })
        });
    }

    descModal($data) {
        this.setState({modalDescData: $data});
    }

    manuDetails($data, $i) {
        ApiService.get(`/contacts/${$data.customer_id}`).then(res => {
            this.setState({manuDetails: res.contact});
            console.log(res.contact)
        });
        console.log($data)
    }

    render() {
        let manuDetails = (
                <div className="manuDetails">
                    <div className="clearfix detailHead">
                        <Col md="12">
                            <p className="clr-secondary font-lg">Customer Details</p>
                        </Col>
                    </div>
                    <div className="detailBody">
                        <div className="detailGroup">
                            <Label>YOUR COMPANY NAME</Label>
                            <p>{this.state.manuDetails.customer_name}</p>
                            <hr />
                        </div>
                        <div className="detailGroup">
                            <Label>CUSSTOMER PHONE NUMBER</Label>
                            <p>ABC Corp</p>
                            <hr />
                        </div>
                        <div className="detailGroup">
                            <Label>YOUR COMPANY NAME</Label>
                            <p>ABC Corp</p>
                            <hr />
                        </div>
                        <div className="detailGroup">
                            <Label>YOUR COMPANY NAME</Label>
                            <p>ABC Corp</p>
                            <hr />
                        </div>
                        <div className="detailGroup">
                            <Label>YOUR COMPANY NAME</Label>
                            <p>ABC Corp</p>
                            <hr />
                        </div>
                        <div className="detailGroup">
                            <Label>YOUR COMPANY NAME</Label>
                            <p>ABC Corp</p>
                        </div>
                    </div>
                </div>
        )
        return (<div className="vendorTable">
            <Container fluid={true}>
                <Row id="vendorHead">
                    <Col md="6">
                        <span className="font-md clr-grey">Order Details</span>
                    </Col>
                    <Col md="6">
                        <div className="float-right">
                            <span className="btn empty-btn">Export Orders as Excel</span>
                            <span className="ml-1 clr-secondary font-xs mr-1"> Currency </span>
                            <FormGroup>
                                <div className="selectCont alt-dd">
                                    <Input className="empty-input" type="select" name="timeline">
                                        <option>INR</option>
                                    </Input>
                                    </div>
                            </FormGroup>
                        </div>
                    </Col>
                    <div className="clearfix" />
                    <Col md className="float-right">
                        <div className="float-right">
                            <span className="font-xs clr-secondary ml-3">Order Amount</span>
                            <span className="font-l clr-grey ml-2">55310.50</span>
                            <span className="btn fill-btn ml-3" onClick={this.makeQuote.bind(this)}>Save Order</span>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col>
                    <Table bordered>
                            <thead>
                                <tr className="tableCaption">
                                <td colspan="9">Customer details</td>
                                <td colspan="8">Quotation details</td>
                                <td colspan="2">Shopelect Commission</td>
                                <td colspan="3">Customer Custom Columns</td>
                                </tr>
                                <tr>
                                <th className="clr-primary" onClick={this.edit.bind(this)}><a href="javascript:void()">{this.state.editable ? 'Save' : 'Edit'}</a></th>
                                <th>Call Customer</th>
                                <th className="lg-width">Description</th>
                                <th className="sort lg-width" onClick={this.sorting.bind(this, 'date')}>Customer BOM NO AND DATE</th>
                                <th className="lg-width sort" onClick={this.sorting.bind(this, 'customer_name')}>Customer Name</th>
                                <th className="sort" onClick={this.sorting.bind(this, 'manu')}>Manufacturer</th>
                                <th className="sort" onClick={this.sorting.bind(this, 'manuPartNo')}>Manufacturer Part No</th>
                                <th className="sort lg-width" onClick={this.sorting.bind(this, 'itemGroup')}>Item Group (Sub Brand)</th>
                                <th className="sort" onClick={this.sorting.bind(this, 'qty')}>Qty</th>
                                <th>Current Stock</th>
                                <th>GST %</th>
                                <th>HSN</th>
                                <th>List Price</th>
                                <th>Discount</th>
                                <th className="lg-width">Time in days to complete all Qty</th>
                                <th className="md-width">Free Delivery to</th>
                                <th>Quote to Customer</th>
                                <th>ShopElect Commission</th>
                                <th className="lg-width">ShopElect NET Payment to you</th>
                                <th>Remarks</th>
                                <th>Attachment</th>
                                <th>Customer Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                            {
                                this.state.currData.map(($data2, $i) => {
                                    return $data2.map(($data, $index) => {
                                        return ([<tr className="tableRow">
                                        <td><i className="fas fa-times cancel"></i></td>
                                        <td><i className="fas fa-phone"></i></td>
                                        <td><span onClick={this.descModal.bind(this,$data.description)} data-toggle="modal" data-target="#descModal">{$data.description.substr(0,50) + '...' || '-'}</span></td>
                                        <td>
                                            {this.state.currDataDetails[$i].estimate_id || '-'}<br />
                                            <span className="clr-form-2 font-xs">{this.state.currDataDetails[$i].date || '-'}</span>
                                        </td>
                                        <td className="custName" onClick={this.manuDetails.bind(this, this.state.currDataDetails[$i], $i)}><span className="clr-primary">{this.state.currDataDetails[$i].customer_name || '-'} <i class="float-right fas fa-info-circle"></i></span>{this.showManuDetails == $i ? manuDetails : ''}</td>
                                        <td><Input name={`manuName-${$i}-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data['item_custom_fields'][0] ? $data['item_custom_fields'][0].value_formatted : '-'} onChange={this.updateBomFields.bind(this, 'manuName', $i, $index)} /></td>
                                        <td><Input name={`manuPart-${$i}-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data['item_custom_fields'][1] ? $data['item_custom_fields'][1].value_formatted : '-'} onChange={this.updateBomFields.bind(this, 'manuPart', $i, $index)} /></td>
                                        <td><Input name={`product_type-${$i}-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data.product_type||'-'} onChange={this.updateBomFields.bind(this, 'product_type', $i, $index)} /></td>
                                        <td>{$data.quantity || '-'}</td>
                                        <td><Input type="number" disabled={this.state.editable ? null : 'disabled'} defaultValue={'-'} /></td>
                                        <td><Input name={`tax_percentage-${$i}-${$index}`} type="number" disabled={this.state.editable ? null : 'disabled'} value={$data.tax_percentage||'-'} onChange={this.updateBomFields.bind(this, 'tax_percentage', $i, $index)} /></td>
                                        <td><Input name={`hsn_or_sac-${$i}-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data.hsn_or_sac} onChange={this.updateBomFields.bind(this, 'hsn_or_sac', $i, $index)} /></td>
                                        <td><Input name={`item_total-${$i}-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data.item_total || '-'} onChange={this.updateBomFields.bind(this, 'item_total', $i, $index)} /></td>
                                        <td><Input name={`discount-${$i}-${$index}`} type="number" disabled={this.state.editable ? null : 'disabled'} value={$data.discount||'-'} onChange={this.updateBomFields.bind(this, 'discount', $i, $index)} /></td>
                                        <td><Input type="number" disabled={this.state.editable ? null : 'disabled'} defaultValue={'-'} /></td>
                                        <td><Input type="text" disabled={this.state.editable ? null : 'disabled'} defaultValue={'--'} /></td>
                                        <td><Input type="number" disabled={this.state.editable ? null : 'disabled'} defaultValue={'--'} /></td>
                                        <td>{'-'}</td>
                                        <td>{'-'}</td>
                                        <td><Input type="text" disabled={this.state.editable ? null : 'disabled'} defaultValue={'-'} /></td>
                                        <td className="attachment">
                                        <i className="fas fa-plus-circle"></i>
                                        <i className="far fa-file-pdf"></i>
                                        </td>
                                        <td>{'-'}</td>
                                            </tr>,
                                                <tr>
                                                <td colspan="22" className="tableFooter">
                                                {
                                                    this.state.showFooter ? (
                                                        <div>
                                                            <Col md="6">
                                                                <a onClick={this.toggleFooter.bind(this)} className="viewActivityLog text-right" href=";" role="button" data-toggle="collapse" data-target={`#collapse${$index}`} aria-expanded="true" aria-controls={`collapse${$index}`}>
                                                                    <i className="mr-1 far fa-plus-square"></i> Add Comment to Customer
                                                                </a>
                                                                <span className="lastAct ml-3">Comment from Customer</span>
                                                            </Col>
                                                            <Col className>
                                                                <div className="float-right">
                                                                    <span className="lastAct">Quantity changes dony by Customer 18th Jan 2018, 12.30pm</span>
                                                                    <a onClick={this.toggleFooter.bind(this)} className="ml-3 viewActivityLog text-right" href=";" role="button" data-toggle="collapse" data-target={`#collapse${$index}`} aria-expanded="true" aria-controls={`collapse${$index}`}>
                                                                        View Full activity log <i className="ml-1 far fa-plus-square"></i>
                                                                    </a>
                                                                </div>
                                                            </Col>
                                                        </div>
                                                    ) : null
                                                }


                                                    <div id={`collapse${$index}`} className="collapse" aria-labelledby={`heading${$index}`} data-parent="#accordion">
                                                        <div className="card-body text-left">
                                                            <div>
                                                                <Col md="4" className="text-left">
                                                                    <div style={{display: 'inline-block'}} className="viewActivityLog">
                                                                        <a onClick={this.toggleFooter.bind(this)} className="viewActivityLog" href=";" role="button" data-toggle="collapse" data-target={`#collapse${$index}`} aria-expanded="true" aria-controls={`collapse${$index}`}>
                                                                            Hide Comments log <i className="far fa-minus-square"></i>
                                                                        </a>
                                                                    </div>
                                                                    <ul className="ml-3 commentLog">
                                                                        <li>18th Jan 2018, 12.30pm Comment on Description</li>
                                                                        <li>18th Jan 2018, 12.30pm Comment on Description</li>
                                                                        <li>18th Jan 2018, 12.30pm Comment on Description</li>
                                                                    </ul>
                                                                    <br/>
                                                                    <input type="text" name="comment" placeholder="Add comments or chat"/>
                                                                    <a className="ml-1 commentSub" href="javascript:void()"> Submit</a>
                                                                </Col>
                                                                <Col md="6" className="text-right">
                                                                    <ul className="commentLog lg-space">
                                                                        <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                        <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                        <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                        <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                    </ul>
                                                                </Col>
                                                                <Col md="2" className="text-right" style={{
                                                                        paddingRight: '0'
                                                                    }}>
                                                                    <a onClick={this.toggleFooter.bind(this)} className="viewActivityLog" href=";" role="button" data-toggle="collapse" data-target={`#collapse${$index}`} aria-expanded="true" aria-controls={`collapse${$index}`}>
                                                                        Hide activity log <i className="far fa-minus-square"></i>
                                                                    </a>
                                                                </Col>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>])
                                    })

                                        })
                                }
                            </tbody>
                        </Table>
                        <div class="modal fade" id="descModal">
                          <div class="modal-dialog" role="document">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h5 class="modal-title">Description</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                  <span aria-hidden="true">&times;</span>
                                </button>
                              </div>
                              <div class="modal-body">
                                <p>{this.state.modalDescData}</p>
                              </div>
                             </div>
                          </div>
                        </div>


                        </Col>
                    </Row>
                </Container>
            </div>)
    }
}
