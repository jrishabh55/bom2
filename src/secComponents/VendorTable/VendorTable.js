import React, {Component} from 'react';
import { Container, Row, Col, Button, Form, FormGroup, Label, Input, Table } from 'reactstrap';
import { ApiService } from '../../services/api.service';
import { StorageService } from '../../services/storage.service';
import { VendorContract } from '../../services/vendor.contract';
import * as $ from 'jquery';
import * as _ from 'lodash';
import toastr from 'toastr';

import '../main.css';
import './vendorTable.css';

export class VendorTable extends Component {

    orderAsc = true;

    constructor(props) {
        super(props);
        this.vendorId = this.props.match.params.vendorId;
        this.currTableData = [];
        this.allBom;
        this.bomIndex = 0;
        this.bomsToFetch = 10;
        this.manuIndex = '';
        // this.test = [
        //     {
        //         description: 'aa',
        //         estimate: {
        //             estimate_id: 46546845,
        //             date: 'Jan 18, 2018'
        //         }
        //
        //     }
        // ];
        this.headWidth = [];
        let comment = [];
        let history = [];

        this.state = {
            currData: [],
            showFooter: true,
            editable: true,
            modalDescData: '',
            bomList: [],
            manuDetails: [],
            showDetails: ''
        };
    }

    componentDidMount() {

        $(window).scroll( () => {
           if($(window).scrollTop() + $(window).height() == $(document).height()) {
               this.fetchBom();
           }
        });


        /* @Note: not sure e.pageX will work in IE8 */
        // (function(window){
        //
        //   let supportPageOffset = window.pageXOffset !== undefined;
        //   let isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
        //
        //   let demoItem2 = document.getElementById("clone-head");
        //   window.addEventListener("scroll", function(e) {
        //
        //     let x = supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft;
        //     let y = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
        //     demoItem2.style.left = -x + 0 + "px";
        //   });
        //
        // })(window);


        // $(window).scroll(function(){
        //      if ($(this).scrollTop() > 197) {
        //          $('#vendorTable thead').addClass('fixed');
        //      } else {
        //          $('#vendorTable thead').removeClass('fixed');
        //      }
        //  });

        ApiService.get(`/bom`).then(res => {
            this.setState({ bomList: res.estimates }, this.fetchBom.bind(this));
        });
        $(window).on('scroll', () => {
            if ($(window).scrollTop() >= $(document).height() - $(window).height() - 10) {
                  // this.fetchBom();

               }
        })

        $(window).scroll(function() {
            if ($(this).scrollTop() == 0) {

            }
        });

    }

    hideManuDetails() {
        console.log(this.state.showDetails)
        this.setState({showDetails: false});
    }

    addComment($event, index) {
        $event.preventDefault();
        const $id = $event.target.getAttribute('data');
        const comment = $(`[data="comment-${$id}"]`).val();
        ApiService.addComment({ bom_id: this.bomId, item_id: $id, msg: comment }).then(() => {
            const date = new Date(Date.now());
            const timestamp = date.toDateString() + ", " + date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
            toastr.success("Comment added.");
        });
    }

    getComments($id, index) {
        ApiService.fetchComments({ bom_id: this.bomId, item_id: $id })
            .then(res => {
                if (!res.found) {
                    return;
                }
                const comments = res._source.comments.map(comment => {
                    const date = new Date(comment.timestamp);
                    const timestamp = date.toDateString() + ", " + date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                    return `${timestamp} ${comment.text}`;
                });
                const push = this.state.currData;
                push[index].comments = comments;
                this.setState({ currData: push });
            });
    }

    updateBomFields($field, $index) {
        let value = $(`[name=${$field}-${$index}]`)[0].value;
        let newData = this.state.currData;
        if($field == 'manuName'){
            newData[$index]['item_custom_fields'][0] ? newData[$index]['item_custom_fields'][0].value_formatted = value : '';
        }
        else if($field == 'manuPart'){
            newData[$index]['item_custom_fields'][1] ? newData[$index]['item_custom_fields'][1].value_formatted = value : '';
        }
        else {
            newData[$index][$field] = value;
        }
        this.setState({currData: newData})
    }

    fetchBom() {
        let a = this.state.currData;
        for(let i = (this.bomIndex); i < (this.bomIndex + this.bomsToFetch); i++) {
            const url = `/customer/${VendorContract.getCustomerId}/bom/${this.state.bomList[i][`estimate_id`]}`;
            let data = this.state.currData;
            ApiService.get(url).then(res => {
                res.estimate.line_items.map(($dat) => {
                    const est = Object.assign($dat, {comments: []}, {estimate: res.estimate});
                    delete est.line_items;
                    a.push(est)
                })
                this.setState({currData: a});
            });
        }
        this.headWidth = [];
        let col = $('#vendorTable > thead .mainTableHead th');
        for( let i = 0; i < col.length; i++ ) {
            this.headWidth.push(col[i].offsetWidth);
        }
        // let e = $('#clone-head > thead .mainTableHead th'[]);
        // e[0].css('width', '200px')
        console.log(this.headWidth)
        this.bomIndex += this.bomsToFetch;
    }

    edit() {
        this.setState({editable: !this.state.editable}, () => {})
    }

    toggleFooter(index, expand = false, $id, $index) {
        this.setState({
            showFooter: !this.state.showFooter
        }, () => {
            if (expand) {
                this.getComments($id, $index);
            }
        });
    }

    sorting($colIndex) {
        let $orderPar = this.orderAsc ? 'asc' : 'desc';
        let currTableData = this.state.currData;
        console.log(this.state.currData)
        currTableData = _.orderBy(currTableData, $colIndex, $orderPar);
        this.setState({currData: currTableData}, () => console.log(this.state.currData));
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

    // makeQuote() {
    //     this.state.currData['data'].map(($data2, $i) => {
    //         $data2.map(($data, $index) => {
    //
    //             const url = `/vendor/${StorageService.getItem('contactId')}/bom/${this.state.currData['details'].estimate_id}/quote/${$data.line_item_id}`;
    //             const data =  this.quotedData($i, $index);
    //             ApiService.post(url, data);
    //         });
    //     });
    // }

    saveOrder($data, $index) {
        let url = `/vendor/${StorageService.getItem('contactId')}/bom/${$data.estimate.estimate_id}/quote/${$data.line_item_id}`;
        let data = {
                list_price: $data.item_total || '',
                discount: $data.discount || '',
                time_to_ship: $data.time_to_ship || '',
                current_stock: $data.current_stock || '',
                HSN: $data.hsn_or_sac || '',
                GST: $data.tax_percentage || '',
                delivery_city: $data.delivery_city || '',
                remarks: $data.remarks || ''
            };
        ApiService.post(url, data).then(res => toastr.success(`Your bid has been placed for ${$data.line_item_id}`))
    }

    descModal($data) {
        this.setState({modalDescData: $data});
    }

    manuDetails($data, $index) {
        this.setState({showDetails: true});
        this.manuIndex = $index;
        ApiService.get(`/contacts/${$data.customer_id}`).then(res => {
            this.setState({manuDetails: res.contact});
        });
    }

    render() {
        let manuDetails = (
                <div className="manuDetails">
                    <div className="clearfix detailHead">
                        <Col md="12">
                            <span className="clr-secondary font-lg">Customer Details</span>
                            <button type="button" className="close">
                              <span onClick={this.hideManuDetails.bind(this)}>&times;</span>
                            </button>
                        </Col>
                    </div>
                    <div className="detailBody">
                        <div className="detailGroup">
                            <Label>YOUR COMPANY NAME</Label>
                            <p>{this.state.manuDetails.contact_name}</p>
                            <hr />
                        </div>
                        <div className="detailGroup">
                            <Label>CUSTOMER PHONE NUMBER</Label>
                            <p>{this.state.manuDetails.contact_persons ? this.state.manuDetails.contact_persons[0].phone || '-' : '-'}</p>
                            <hr />
                        </div>
                        <div className="detailGroup">
                            <Label>CUSTOMER TYPE</Label>
                            <p>{this.state.manuDetails.cf_type_of_company || '-'}</p>
                            <hr />
                        </div>
                        <div className="detailGroup">
                            <Label>CUSTOMER STATE</Label>
                            <p>{this.state.manuDetails.shipping_address ? this.state.manuDetails.shipping_address.state || '-' : '-'}</p>
                            <hr />
                        </div>
                        <div className="detailGroup">
                            <Label>PURPOSE</Label>
                            <p>{this.state.manuDetails.cf_purpose || '-'}</p>
                            <hr />
                        </div>
                        <div className="detailGroup">
                            <Label>TENTATIVE ORDER DATE</Label>
                            <p>{this.state.manuDetails.cf_tentative_order_date || '-'}</p>
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
                            <span className="btn fill-btn ml-3">Save Order</span>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col>
                    <Table id="vendorTable" bordered>
                            <thead>
                                <tr className="tableCaption">
                                <td colSpan="9">Customer details</td>
                                <td colSpan="8">Quotation details</td>
                                <td colSpan="2">Shopelect Commission</td>
                                <td colSpan="4">Customer Custom Columns</td>
                                </tr>
                                <tr className="mainTableHead">
                                <th className="clr-primary" onClick={this.edit.bind(this)}><a href="javascript:void()">{this.state.editable ? 'Save' : 'Edit'}</a></th>
                                <th>Call Customer</th>
                                <th className="lg-width">Description</th>
                                <th className="sort lg-width" onClick={this.sorting.bind(this, '["estimate"].estimate_id')}>Customer BOM NO AND DATE</th>
                                <th className="lg-width sort" onClick={this.sorting.bind(this, '["estimate"].customer_name')}>Customer Name</th>
                                <th className="sort" onClick={this.sorting.bind(this, '["item_custom_fields"][0].value')}>Manufacturer</th>
                                <th className="sort" onClick={this.sorting.bind(this, '["item_custom_fields"][1].value')}>Manufacturer Part No</th>
                                <th className="sort lg-width" onClick={this.sorting.bind(this, 'product_type')}>Item Group (Sub Brand)</th>
                                <th className="sort" onClick={this.sorting.bind(this, 'quantity')}>Qty</th>
                                <th>Current Stock</th>
                                <th>GST%</th>
                                <th>HSN</th>
                                <th>List Price</th>
                                <th>Discount</th>
                                <th>Time in days to complete all Qty</th>
                                <th>Free Delivery to</th>
                                <th>Quote to Customer</th>
                                <th>ShopElect Commission</th>
                                <th>ShopElect NET Payment to you</th>
                                <th>Remarks</th>
                                <th>Attachment</th>
                                <th>Customer Notes</th>
                                <th>Place Bid</th>
                                </tr>
                            </thead>
                            {/*<div id="clone-head">
                            <thead>
                                <tr className="tableCaption">
                                <td colSpan="9">Customer details</td>
                                <td colSpan="8">Quotation details</td>
                                <td colSpan="2">Shopelect Commission</td>
                                <td colSpan="4">Customer Custom Columns</td>
                                </tr>
                                <tr className="mainTableHead">
                                <th className="clr-primary" onClick={this.edit.bind(this)}><a href="javascript:void()">{this.state.editable ? 'Save' : 'Edit'}</a></th>
                                <th>Call Customer</th>
                                <th className="lg-width">Description</th>
                                <th className="sort lg-width" onClick={this.sorting.bind(this, '["estimate"].estimate_id')}>Customer BOM NO AND DATE</th>
                                <th className="lg-width sort" onClick={this.sorting.bind(this, '["estimate"].customer_name')}>Customer Name</th>
                                <th className="sort" onClick={this.sorting.bind(this, '["item_custom_fields"][0].value')}>Manufacturer</th>
                                <th className="sort" onClick={this.sorting.bind(this, '["item_custom_fields"][1].value')}>Manufacturer Part No</th>
                                <th className="sort lg-width" onClick={this.sorting.bind(this, 'product_type')}>Item Group (Sub Brand)</th>
                                <th className="sort" onClick={this.sorting.bind(this, 'quantity')}>Qty</th>
                                <th>Current Stock</th>
                                <th>GST%</th>
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
                                <th>Place Bid</th>
                                </tr>
                            </thead>
                            </div>*/}
                            <tbody>
                            {
                                this.state.currData.map(($data, $index) => {
                                    return ([<tr className="tableRow">
                                        <td onClick={() => toastr.info("The following operation is not available as of now.")}><i className="fas fa-times cancel"></i></td>
                                        <td onClick={() => toastr.info("The following operation is not available as of now.")}><i className="fas fa-phone"></i></td>
                                        <td className="clip-content"><span onClick={this.descModal.bind(this,$data.description)} data-toggle="modal" data-target="#descModal">{$data.description || '-'}</span></td>
                                        <td>
                                            {$data.estimate.estimate_id || '-'}<br />
                                            <span className="clr-form-2 font-xs">{$data.estimate.date || '-'}</span>
                                        </td>
                                        <td className="custName" onClick={this.manuDetails.bind(this, $data.estimate, $index)}><span className="clr-primary">{$data.estimate.customer_name || '-'} <i className="float-right fas fa-info-circle"></i></span>{((this.state.showDetails) && (this.manuIndex === $index)) ? manuDetails : ''}</td>
                                        <td><Input name={`manuName-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data['item_custom_fields'][0] ? $data['item_custom_fields'][0].value : ''} onChange={this.updateBomFields.bind(this, 'manuName', $index)} /></td>
                                        <td><Input name={`manuPart-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data['item_custom_fields'][1] ? $data['item_custom_fields'][1].value : ''} onChange={this.updateBomFields.bind(this, 'manuPart', $index)} /></td>
                                        <td><Input name={`product_type-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data.product_type || ''} onChange={this.updateBomFields.bind(this, 'product_type', $index)} /></td>
                                        <td>{$data.quantity || '-'}</td>
                                        <td className="sm-width"><Input name={`current_stock-${$index}`} type="number" disabled={this.state.editable ? null : 'disabled'} value={$data.current_stock || ''} onChange={this.updateBomFields.bind(this, 'current_stock', $index)} /></td>
                                        <td className="sm-width"><Input name={`tax_percentage-${$index}`} type="number" disabled={this.state.editable ? null : 'disabled'} value={$data.tax_percentage || ''} onChange={this.updateBomFields.bind(this, 'tax_percentage', $index)} /></td>
                                        <td className="md-width"><Input name={`hsn_or_sac-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data.hsn_or_sac || ''} onChange={this.updateBomFields.bind(this, 'hsn_or_sac', $index)} /></td>
                                        <td className="sm-width"><Input name={`item_total-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data.item_total || ''} onChange={this.updateBomFields.bind(this, 'item_total', $index)} /></td>
                                        <td className="sm-width"><Input name={`discount-${$index}`} type="number" disabled={this.state.editable ? null : 'disabled'} value={$data.discount || ''} onChange={this.updateBomFields.bind(this, 'discount', $index)} /></td>
                                        <td className="lg-width"><Input name={`time_to_ship-${$index}`} type="number" disabled={this.state.editable ? null : 'disabled'} value={$data.time_to_ship || ''} onChange={this.updateBomFields.bind(this, 'time_to_ship', $index)} /></td>
                                        <td className="sm-width"><Input name={`delivery_city-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data.delivery_city || ''} onChange={this.updateBomFields.bind(this, 'delivery_city', $index)} /></td>
                                        <td><Input type="number" disabled={this.state.editable ? null : 'disabled'} defaultValue={'--'} /></td>
                                        <td>{'-'}</td>
                                        <td className="lg-width">{'-'}</td>
                                        <td><Input name={`remarks-${$index}`} type="text" disabled={this.state.editable ? null : 'disabled'} value={$data.remarks ||''} onChange={this.updateBomFields.bind(this, 'remarks', $index)} /></td>
                                        <td className="attachment">
                                        <i className="fas fa-plus-circle"></i>
                                        <i className="far fa-file-pdf"></i>
                                        </td>
                                        <td>{'-'}</td>
                                        <td><span onClick={this.saveOrder.bind(this,$data,$index)}><i className="fas fa-check"></i></span></td>
                                            </tr>,
                                                <tr>
                                                <td colSpan="23" className="tableFooter">
                                                {
                                                    this.state.showFooter ? (
                                                        <div>
                                                            <Col md="6">
                                                                <a onClick={this.toggleFooter.bind(this, $index, true, $data.line_item_id, $index)} className="viewActivityLog text-right" href=";" role="button" data-toggle="collapse" data-target={`#collapse-${$data.line_item_id}`} aria-expanded="true" aria-controls={`collapse-${$data.line_item_id}`}>
                                                                    <i className="mr-1 far fa-plus-square"></i> Add Comment to Customer
                                                                </a>
                                                                <span className="lastAct ml-3">Comment from Customer</span>
                                                            </Col>
                                                            <Col>
                                                                <div className="float-right">
                                                                    <span className="lastAct">Quantity changes dony by Customer 18th Jan 2018, 12.30pm</span>
                                                                    <a onClick={this.toggleFooter.bind(this)} className="ml-3 viewActivityLog text-right" href=";" role="button" data-toggle="collapse" data-target={`#collapse-${$data.line_item_id}`} aria-expanded="true" aria-controls={`collapse-${$data.line_item_id}`}>
                                                                        View Full activity log <i className="ml-1 far fa-plus-square"></i>
                                                                    </a>
                                                                </div>
                                                            </Col>
                                                        </div>
                                                    ) : null
                                                }

                                                    <div id={`collapse-${$data.line_item_id}`} className="collapse" aria-labelledby={`heading${$index}`} data-parent="#accordion">
                                                        <div className="card-body text-left">
                                                            <div>
                                                                <Col md="4" className="text-left">
                                                                        <div style={{ display: 'inline-block' }} className="viewActivityLog">
                                                                            <a onClick={this.toggleFooter.bind(this, $index)} className="viewActivityLog" href=";" role="button" data-toggle="collapse" data-target={`#collapse-${$data.line_item_id}`} aria-expanded="true" aria-controls={`collapse-${$data.line_item_id}`}>
                                                                                Hide Comments log
                                                                                <i className="ml-1 far fa-minus-square"></i>
                                                                            </a>
                                                                        </div>
                                                                        <ul className="ml-3 commentLog">
                                                                            {$data.comments.map(comment => <li>{comment}</li>)}
                                                                        </ul>
                                                                        <br />
                                                                        <input type="text" name="comment" data={`comment-${$data.line_item_id}`} placeholder="Add comments or Chat" />
                                                                        <a className="ml-1 commentSub" href=";" data={$data.line_item_id} onClick={this.addComment.bind(this)}>Submit</a>
                                                                </Col>
                                                                <Col md="6" className="text-right">
                                                                    <ul className="commentLog lg-space">
                                                                        { /*<li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                        <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                        <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li>
                                                                        <li>Quantity changes to 10 done by Customer - 18th Jan 2018 , 12.30pm</li> */}
                                                                    </ul>
                                                                </Col>
                                                                <Col md="2" className="text-right" style={{ paddingRight: '0' }}>
                                                                    <a onClick={this.toggleFooter.bind(this)} className="viewActivityLog" href=";" role="button" data-toggle="collapse" data-target={`#collapse-${$data.line_item_id}`} aria-expanded="true" aria-controls={`collapse-${$data.line_item_id}`}>
                                                                        Hide activity log <i className="far fa-minus-square"></i>
                                                                    </a>
                                                                </Col>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>])
                                        })
                                }
                            </tbody>

                        </Table>
                        <div className="modal fade" id="descModal">
                          <div className="modal-dialog" role="document">
                            <div className="modal-content">
                              <div className="modal-header">
                                <h5 className="modal-title">Description</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                  <span aria-hidden="true">&times;</span>
                                </button>
                              </div>
                              <div className="modal-body">
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
