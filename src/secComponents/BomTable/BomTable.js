import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import * as $ from 'jquery';
import * as _ from 'lodash';
import toastr from 'toastr';
import { Container, Row, Col, FormGroup, Label, Input, Table } from 'reactstrap';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { BomService } from '../../services/bom.service';
import { StorageService } from '../../services/storage.service';
import { BomContract } from '../../services/bom.contract';
import { currencyService } from '../../services/currency.service';
import { getProp, toCSV, download } from '../../helpers';

import '../main.css';
import './BomTable.css';

export class BomTable extends Component {

  constructor( props ) {
    super( props );
    this.quantity = 0;
    this.bomId = 0;
    this.appendData = '';
    this.orderAsc = true;
    this.thisSupplier;
    this.searchProdList = [];
    this.currencyRates = {
      USD: 0.015535,
      GBP: 0.011232
    };
    this.saveBtn;
    this.totalAmount = [];
    this.userDetails;
    this.currTableData;
    this.supplierDataCaption = '';
    this.supplierDataBody = '';
    this.bomId = this.props.match.params.bomId;
    this.isNew = this.bomId === 'new';
    this.isImport = this.bomId === 'import';
    // Array for prices to be selected by customer.
    this.selectedPrices = [];

    let comment = [];
    let history = [];

    for ( let i = 0; i < 100; i++ ) {
      comment.push( [] );
      history.push( [] );
    }

    this.state = {
      currData: [],
      hiddenFooter: true,
      editable: true,
      supp: false,
      addProd: false,
      searchProd: this.searchProdList,
      temp_bom_title: "Untitled",
      bom_title: "Untitled",
      comments: comment,
      history: history,
      supplierData: false,
      currencySymbol: '₹',
      currencyRate: 1,
      orderAmount: 0,
      vendorData: [],
      vendorQuotes: [],
      modalDescData: {},
      searchItemValue: '',
      bomTitleEditable: false
    }
  }

  addMultiple( e ) {
    let val = e.target.value;
    this.setState( { searchItemValue: val } )
    this.addProduct( val );
    this.fetchPartDetails( val );
  }

  fetchPartDetails( $partNo ) {
    let data = {
      "query": {
        "match_phrase_prefix": {
          "company_sku": $partNo
        }
      }
    };

    BomContract.searchPart( data ).then( res => {
      this.setState( { searchProd: res } );
    } );
  }

  paste() {
  }

  componentWillMount() {
    if ( this.isImport ) {
      const bom = BomService.last();
      if ( !bom ) {
        this.props.history.push('/bom');
        return;
      }
      const title = bom.title;
      const listItems = bom.items.map( ( item, $index ) => ( {
        "name": item.Name || item[ "Customer Manufacturer Part No" ],
        "description": item.description,
        "item_order": $index,
        "bcy_rate": item.Price,
        "rate": item.Price,
        "quantity": item.Quantity,
        "item_total": ( ( item.Quantity || 1 ) * ( item.Price ) ),
        "item_custom_fields": [
          {
            "label": "Customer Manufacturer",
            "value": item["Customer Manufacturer"]
          }, {
            "label": "Customer Manufacturer Part No",
            "value": item["Customer Manufacturer Part No"]
          }
        ]
      } ) );
      this.setState( { bom_title: title, currData: listItems} );
    }
  }

  componentDidMount() {
    if ( !this.isNew && !this.isImport ) {
      ApiService.get( `/contacts/${ this.getContactId() }` ).then( res => {
        this.userDetails = res.contact;
      } );
      let prefVend = StorageService.getItem( 'prefVendors' );
      prefVend = prefVend.trim().split( ',' ).map( vendor => vendor.trim() );
      ApiService.get( `/customer/${ this.getContactId()}/bom/${ this.bomId }` ).then( res => {
        this.setState( { bom_title: res.estimate.custom_field_hash.cf_title, temp_bom_title: res.estimate.custom_field_hash.cf_title } );
        this.currBomData = res.estimate.line_items;
        this.setState( {
          currData: this.currBomData
        }, () => {
          let data = this.state.vendorQuotes;
          this.calOrderAmount();
          ApiService.get( `/customer/${ this.getContactId()}/bom/${ this.bomId }/vendor/lowest_quotes` ).then( lowest => {
            if ( lowest.aggregations.lowest_quotes.buckets.length > 0 ) {
              data.push( lowest );
              this.setState( { vendorQuotes: data } )
              this.quotedCurrData( 0 );
              prefVend.map( ( $vend, $i ) => {
                data = this.state.vendorQuotes;
                ApiService.get( `/customer/${ this.getContactId()}/bom/${ this.bomId}/vendor/${ $vend }` ).then( qRes => {
                  if ( qRes.hits.hits.length > 0 ) {
                    data.push( qRes );
                    this.setState( { vendorQuotes: data } );
                    this.quotedCurrData( ( $i + 1 ) );
                  }
                } )
              } )
            }
          } );

        } );
      } );
      currencyService.currencyData().then( res => {
        this.currencyRates.USD = res.rates.USD;
        this.currencyRates.GBP = res.rates.GBP;
      } );

      this.saveBtn = <span className="btn fill-btn ml-3" onClick={this.po.bind( this )}>Place Order</span>;
    } else {
      this.saveBtn = <span className="btn fill-btn ml-3" onClick={this.placeOrder.bind( this )}>Create BOM</span>;
    }

    $( "#bomTitle" ).on( 'focus', () => {
      this.setState( { bomTitleEditable: true } )
    } )

  }

  quotedCurrData( $i ) {
    let quote;
    let vData = this.state.vendorQuotes;
    let temp = this.state.vendorData;
    if ( $i == 0 ) {
      quote = vData[ temp.length ].aggregations.lowest_quotes.buckets.reduce( ( ittr, item ) => {
        ittr[ item.key ] = item.min_quotes.hits.hits[ 0 ]._source.quote;
        return ittr;
      }, {} );
    } else {
      quote = vData[ temp.length ].hits.hits.reduce( ( itttr, item ) => {
        itttr[ item['_source'].line_item_id ] = item._source.quote;
        return itttr;
      }, {} );
    }
    temp.push( quote );
    this.setState( { vendorData: temp } );
  }

  saveBOM() {
    const cb = this.isNew || this.isImport ? this.placeOrder : this.updateOrder;
    this.updateBomTitle(cb);
  }

  getContactId() {
    return AuthService.user().id;
  }

  addProduct( $val ) {
    if ( $val.length > 0 ) {
      this.setState( { addProd: true } );
      this.appendData = $val;
    } else {
      this.setState( { addProd: false } );
    }
  }

  currency() {
    let currency = $( '#currency' )[ 0 ].value;
    if ( currency == 'INR' ) {
      this.setState( { currencySymbol: '₹', currencyRate: '1' } )
    } else if ( currency == 'USD' ) {
      this.setState( { currencySymbol: '$', currencyRate: this.currencyRates.USD } )
    } else if ( currency == 'GBP' ) {
      this.setState( { currencySymbol: '£', currencyRate: this.currencyRates.GBP } )
    }
  }

  placeOrder() {
    let data = {
      items: this.state.currData.map( ( $data, $index ) => {
        let qty = $( `[name=quantity-${ $index }]` )[ 0 ].value;
        $data = $data._source || $data;
        return ( {
          "name": $data.name,
          "description": $data.description,
          "item_order": $index,
          "bcy_rate": $data.msrp,
          "rate": $data.msrp,
          "quantity": $data.quantity,
          "item_total": ( ( $data.quantity || 0 ) * ( $data.rate || $data.msrp ) ),
          "item_custom_fields": [
            {
              "label": "Customer Manufacturer Part No",
              "value": $data.company_sku
            }, {
              "label": "Customer Manufacturer",
              "value": $data.manufacturer
            }
          ]
        } );
      } ),
      title: this.state.bom_title
    };

    console.log( `/customer/${ this.getContactId() }/bom` );

    ApiService.post( `/customer/${ this.getContactId() }/bom`, data ).then( res => {
      if ( res.message === "The estimate has been created." ) {
        toastr.success( `${ res.message}: ${ res.estimate.estimate_id }` );
        this.props.history.push( '/bom' );
      } else {
        toastr.error( res.message );
      }
    } );
  }

  removeByAttr(arr, key, val){
      for( let i = 0; i < arr.length; i++ ) {
          if(arr[i][key] == val)
          {
              console.log(i);
              arr.splice(i,1)
              console.log(arr)
          }
      }

  }

  updateOrder( redirect = true ) {
    const data = {
      items: this.state.currData.map( ( $data, $index ) => {
        $data = $data._source || $data;
        const qty = $( `[name=quantity-${ $index }]` )[ 0 ].value;
        return ( {
          "description": $data.description,
          "item_order": $index,
          "bcy_rate": $data.msrp || $data.bcy_rate,
          "rate": $data.msrp || $data.rate,
          "quantity": $data.quantity,
          "item_total": $data.item_total || ( ( $data.quantity || 0 ) * ( $data.rate || $data.msrp ) ),
          "line_item_id": $data.line_item_id,
          "item_custom_fields": [
            {
              "label": "Customer Manufacturer",
              "value": $data.manufacturer || getProp( $data.item_custom_fields[0], 'value' )
            }, {
              "label": "Customer Manufacturer Part No",
              "value": $data.company_sku || getProp( $data.item_custom_fields[1], 'value' )
            }
          ]

        } );
      } ),
      title: this.state.bom_title
    };

    return ApiService.put( `/customer/${ StorageService.getItem( 'contactId' )}/bom/${ this.bomId }`, data ).then( res => {
      if ( redirect ) {
        this.props.history.push( '/bom' );
      }
      toastr.success( res.message );
    } );
  }

  po( redirect = true ) {

    const items = [];

    this.state.currData.forEach(($data, $index) => {

      // Please update this to supplier price and not list price
      $data = $data._source || $data;
      let rate;
      this.state.vendorData.forEach(($d, $in) => {
          rate = $d[$data.line_item_id] ? $d[$data.line_item_id].bid_price : '';
          console.log(rate)
          return;
      })
      console.log(this.selectedPrices.find(o=>o.line_item==$data.line_item_id))
      if (this.selectedPrices.find(o=>o.line_item==$data.line_item_id) && rate ) {
        const qty = $( `[name=quantity-${ $index }]` )[ 0 ].value;
        const data =  ( {
          "description": $data.description,
          "item_order": $index,
          "bcy_rate": $data.msrp || $data.bcy_rate,
          "rate": $data.msrp || $data.rate,
          "quantity": $data.quantity,
          "item_total": $data.item_total || ( ( $data.quantity || 0 ) * ( $data.rate || $data.msrp ) ),
          // "line_item_id": $data.line_item_id,
          "item_custom_fields": [
            {
              "label": "Customer Manufacturer",
              "value": $data.manufacturer || getProp( $data.item_custom_fields[0], 'value' )
            }, {
              "label": "Customer Manufacturer Part No",
              "value": $data.company_sku || getProp( $data.item_custom_fields[1], 'value' )
            }, {
              'label': 'vendor_id',
              "value": this.selectedPrices.find(o=>o.line_item==$data.line_item_id)['vendorId']
            }
          ]

        } );
        items.push(data);
      }
    });
    console.log(this.state.currData)
    const data = { vendor_id: '759865000001201229', line_items: items };
    console.log(data)
    return ApiService.put( `/customer/${ StorageService.getItem( 'contactId' )}/po/${ this.bomId }`, data ).then( res => {
      if ( redirect ) {
        this.props.history.push( '/bom' );
      }
      console.log(res)
      if(res.code == 29009) {
          toastr.error( res.message );
      }
      else {
          toastr.success( res.message );
      }
    } );
  }

  selectSupp($i) {
      if($(`#suppInput-${$i}`).prop('checked')===true) {
          this.state.currData.map(($data, $index) => {
              this.state.vendorData.map(($data2, $it) => {
                  $(`#suppQ-${$index}-${$it}`).prop('checked', false);
                  this.removeByAttr(this.selectedPrices, 'line_item', $data.line_item_id);
                  console.log(this.selectedPrices)
                  $(`#suppInput-${$it}`).prop('checked', false)
              })
              $(`#suppQ-${$index}-${$i}`).prop('checked', true);
              let vId = this.state.vendorQuotes[$i].aggregations ?
              (this.state.vendorQuotes[$i].aggregations.lowest_quotes.buckets.find(o => o.key == $data.line_item_id).min_quotes.hits.hits[0]._id)
              :
              (this.state.vendorQuotes[$i].hits.hits.find(o=>o._source.line_item_id==$data.line_item_id)._id)
              vId = vId.substr(19);
              let bid_price = this.state.vendorData[$i][$data.line_item_id].bid_price;
              const bidder = { line_item: $data.line_item_id, vendorId: vId, price: bid_price };
              this.selectedPrices.push(bidder)
              console.log(this.selectedPrices)
          })
          $(`#suppInput-${$i}`).prop('checked', true)
      }
      else {
          this.state.currData.map(($data, $index) => {
              $(`#suppQ-${$index}-${$i}`).prop('checked', false);
              this.removeByAttr(this.selectedPrices, 'line_item', $data.line_item_id);
              console.log(this.selectedPrices)
          })
          $(`#suppInput-${$i}`).prop('checked', false)
      }
  }

  appendInput( $index ) {
    this.state.searchItemValue = '';
    let currTableData = this.state.currData;
    const data = this.state.searchProd[ $index ];
    data._source.quantity = 1;
    currTableData.push( data );
    this.setState( { currData: currTableData }, () => {
      this.calOrderAmount( this.state.currData.length - 1 );
    } );
    this.fetchPartDetails( '' );
  }

  edit() {
    this.setState( { editable: !this.state.editable } );
  }

  toggleDetailSupplier() {
    this.setState( { supp: !this.state.supp } );
  }

  toggleFooter( index, expand, $id ) {
    this.setState( { hiddenFooter: index === this.state.hiddenFooter ? -1 : index } );
    if ( expand === true ) {
      this.getComments( $id, index );
    }
  }

  sorting( $colIndex ) {
    const $orderPar = this.orderAsc ? 'asc' : 'desc';
    const currTableData = _.orderBy( this.state.currData, $colIndex, $orderPar );
    this.setState( { currData: currTableData } );
    this.orderAsc = !this.orderAsc;
  }

  updateBomFields( $field, $index ) {
    let value = $( `[name=${ $field}-${ $index }]` )[ 0 ].value;
    if ( $field == 'description' ) {
      let data = {};
      data[ 'text' ] = value;
      data[ 'index' ] = $index;
      this.setState( { modalDescData: data } );
    } else {}
    let newData = this.state.currData;

    if ( newData[ $index ]._source ) {
      newData[ $index ]._source[ $field ] = value;
    } else {
      newData[ $index ][ $field ] = value;
    }
    this.setState( { currData: newData } );
  }

  calOrderAmount( $index = 0 ) {
    let amount = 0;
    let value = $( `[name=quantity-${ $index }]` )[ 0 ].value;
    let newData = this.state.currData;
    newData[ $index ][ 'quantity' ] = value;
    this.setState( { currData: newData } )
    this.state.currData.map( ( $data, $i ) => {
      amount = amount + ( ( $data.quantity || 0 ) * ( $data.rate || ( $data._source ? $data._source.msrp : 0) || 0 ) );
      this.setState( { orderAmount: amount } );
    } )
  }

  addComment( $event, index ) {
    $event.preventDefault();
    const $id = $event.target.getAttribute( 'data' );
    const comment = $( `[data="comment-${ $id }"]` ).val();
    ApiService.addComment( { bom_id: this.bomId, item_id: $id, msg: comment } ).then( () => {
      const push = this.state.comments;

      const date = new Date( Date.now() );
      const timestamp = date.toDateString() + ", " + date.toLocaleString( 'en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      } );
      push[ index ].push( `${ timestamp} ${ comment }` );
      this.setState( { comments: push } );
      toastr.success( "Comment added." );
    } );
  }

  getComments( $id, index ) {
    ApiService.fetchComments( { bom_id: this.bomId, item_id: $id } ).then( res => {
      if ( !res.found ) {
        return;
      }
      const comments = res._source.comments.map( comment => {
        const date = new Date( comment.timestamp );
        const timestamp = date.toDateString() + ", " + date.toLocaleString( 'en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        } );
        return `${ timestamp} ${ comment.text }`;
      } );

      const push = this.state.comments;
      push[ index ] = comments;
      this.setState( { comments: push } );
    } );
  }

  lowestQuoteSupplier( $data, $index, thisSupplier, $i ) {
    let a = $data;
    return ( this.supplierDataBody = [
      <td className="stock">
        <label className="checkContainer">
          <Input onChange={this.particularSupp.bind(this,$index, $i, $data.line_item_id)} id={`suppQ-${$index}-${$i}`} type="checkbox" name={`suppQ-${$index}-${$i}`} />
          <span className="checkmark"></span>
        </label>
        &#8377;{getProp( this.state.vendorData[ $i ][$data.line_item_id], 'bid_price' ) || '-'}<br/>
        <span className="stockLeft">{getProp( this.state.vendorData[ $i ][$data.line_item_id], 'current_stock' ) || '-'}</span>
        <span> in stock</span>
      </td>,
      (
        this.state.supp
        ? ( [
          <td>{'-'}</td>,
          <td>{getProp( this.state.vendorData[ $i ][$data.line_item_id], 'list_price' ) || '-'}</td>,
          <td>{'-'}</td>,
          <td>{'-'}</td>,
          <td>{getProp( this.state.vendorData[ $i ][$data.line_item_id], 'discount' ) || '-'}</td>,
          <td>{getProp( this.state.vendorData[ $i ][$data.line_item_id], 'current_stock' ) || '-'}</td>,
          <td>{getProp( this.state.vendorData[ $i ][$data.line_item_id], 'time_to_ship' ) || '-'}</td>,
          <td>{getProp( this.state.vendorData[ $i ][$data.line_item_id], 'delivery_city' ) || '-'}</td>,
          <td>{getProp( this.state.vendorData[ $i ][$data.line_item_id], '-' ) || '-'}</td>
        ] )
        : null),

      (
        this.state.supp
        ? ( <td className="attachment">
          <i className="fas fa-plus-circle"></i>
          <i className="far fa-file-pdf"></i>
        </td> )
        : null)
    ] )
  }

  dataCaption( $i ) {
    return ( <td colSpan={this.state.supp
        ? '11'
        : 1} onClick={this.toggleDetailSupplier.bind( this )}>
      {
        !this.state.supp
          ? <span>
              <i className="fas fa-eye"></i>
              Unhide</span>
          : <span>
              <i className="far fa-eye-slash"></i>
              Hide</span>
      }
    </td> )
  }

  updatetempBomTitle() {
    this.setState( {
      temp_bom_title: $( '#bomTitle' )[ 0 ].value
    } )
  }

  updateBomTitle( cb ) {
    this.setState( {
      bom_title: $( '#bomTitle' )[ 0 ].value,
      bomTitleEditable: false
    }, cb );
  }

  cancelBomEdit() {
    this.setState( { bomTitleEditable: false, temp_bom_title: this.state.bom_title } );
  }

  removeLineItem( $index ) {
    const data = [
      ...this.state.currData.slice( 0, $index ),
      ...this.state.currData.slice( $index + 1 )
    ];
    this.setState( {
      'currData': data
    }, () => {
      if ( !this.isNew ) {
        this.updateOrder( false ).then( () => {
          toastr.success( "Item has been removed" );
        } );
      } else {
        toastr.success( "Item has been removed" );
      }
    } );
  }

  particularSupp($index, $i, $id) {
      let vId = this.state.vendorQuotes[$i].aggregations ?
                (this.state.vendorQuotes[$i].aggregations.lowest_quotes.buckets.find(o => o.key == $id).min_quotes.hits.hits[0]._id)
                :
                (this.state.vendorQuotes[$i].hits.hits.find(o=>o._source.line_item_id==$id)._id)
      vId = vId.substr(19);
      let bid_price = this.state.vendorData[$i][$id].bid_price;
      const bidder = { line_item: $id, vendorId: vId, price: bid_price };

      if($(`#suppQ-${$index}-${$i}`).prop('checked')===false) {
          $(`#suppQ-${$index}-${$i}`).prop('checked', false);
          this.removeByAttr(this.selectedPrices, 'line_item', $id)
      }
      else {
          this.state.vendorData.map(($data, $itr) => {
              $(`#suppQ-${$index}-${$itr}`).prop('checked', false);
              this.removeByAttr(this.selectedPrices, 'line_item', $id)
          })
          $(`#suppQ-${$index}-${$i}`).prop('checked', true);

          this.selectedPrices.push(bidder)
      }
      console.log(this.selectedPrices)
  }

  exportBom() {
    const title = this.state.bom_title.trim();
    const data = this.state.currData.map( ( $data, $index ) => {
      $data = $data._source || $data;
      return ( {
        "Name": $data.name,
        "Customer Manufacturer": $data.manufacturer || getProp( $data.item_custom_fields[0], 'value' ),
        "Customer Manufacturer Part No": $data.company_sku || getProp( $data.item_custom_fields[1], 'value' ),
        "description": $data.description,
        "Price": $data.msrp || $data.rate,
        "Quantity": $data.quantity
      } );
    } );
    const csv = ( toCSV( data, title ) );
    download( `${ title }.csv`, csv );
  }

  descModal( $data, $index ) {
    let data = {};
    data[ 'text' ] = $data;
    data[ 'index' ] = $index;
    this.setState( { modalDescData: data } );
  }

  render() {
    let thisSupplier = '';
    thisSupplier = [
      <th>Qty.</th>,
      <th className="lg-width">Supplier (total Amount)</th>,
      <th>Offered Manufacturer</th>,
      <th className="lg-width">Offered Manufacturer Part No</th>,
      <th>Discount %</th>,
      <th>Current Stock</th>,
      <th className="lg-width">Time in days to arrange all Qty</th>,
      <th>Stock Location</th>,
      <th>Remarks</th>,
      <th>Supplier Attachment</th>
    ];

    return ( <div className="bomTable">
      <Row id="bomHead">
          <Col md="6">
            <span className="font-md clr-blue">
              <Link to="/bom">Saved BOM</Link>
            </span>
          </Col>
          <Col md="6">
            <div className="float-right">
              <FormGroup>
                <div className="selectCont alt-dd">
                  <select className="empty-input" name="export" onChange={this.exportBom.bind( this )}>
                    <option>Export</option>
                    <option>Export CSV/EXCEL</option>
                  </select>
                </div>
              </FormGroup>
              <span className="ml-1 clr-secondary font-xs mr-1">
                Currency
              </span>
              <FormGroup>
                <div className="selectCont alt-dd">
                  <Input id="currency" className="empty-input" type="select" name="timeline" onChange={this.currency.bind( this )}>
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
            <span className="font-xl clr-grey">
              <Input id="bomTitle" type="text" value={this.state.temp_bom_title} onChange={this.updatetempBomTitle.bind( this )}/>
            </span>
          </Col>
          {
            ( () => {
              if ( this.state.bomTitleEditable ) {
                return ( <Col md="2">
                  <span className="font-md clr-blue" onClick={this.saveBOM.bind( this )}>Save</span>
                  <span onClick={this.cancelBomEdit.bind( this )} className="ml-1 font-md clr-blue">
                    Cancel</span>
                </Col> )
              }
            } )()
          }
          <Col md="md" className="float-right">
            <div className="float-right">
              <FormGroup>
                <Label>PURPOSE</Label>
                <div className="selectCont">
                  <Input type="select" name="purpose">
                    <option defaultValue={this.userDetails ? this.userDetails.cf_purpose : ''}>{ this.userDetails ? this.userDetails.cf_purpose : 'Select Purpose' }</option>
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
                    <option defaultValue={this.userDetails
                        ? this.userDetails.cf_tentative_order_date
                        : ''}>{
                        this.userDetails
                          ? this.userDetails.cf_tentative_order_date
                          : 'Select Timeline'
                      }</option>
                    <option value="At the Earliest">At the Earliest</option>
                    <option value="2-3 Weeks">2-3 Weeks</option>
                    <option value="Not sure">Not sure</option>
                  </Input>
                </div>
              </FormGroup>
              <span className="font-xs clr-secondary ml-3">Order Amount</span>
              <span className="font-l clr-grey ml-2">
                {this.state.currencySymbol + ( this.state.orderAmount * this.state.currencyRate ).toFixed( 2 )}
              </span>
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
            <Table bordered={true}>
              <thead>
                <tr className="tableCaption">
                  <td colSpan="10" className="clr-form-2 mainCaption">ShopElect Webiste</td>
                  {this.state.vendorData.map( ( $vData, $i ) => this.dataCaption( $i ) )}
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <th className="clr-primary" onClick={this.edit.bind( this )}>
                    <a href="javascript:void()">{ this.state.editable ? 'Save' : 'Edit' }</a>
                  </th>
                  <th className="sNo">S No</th>
                  <th className="sort" onClick={this.sorting.bind( this, '[item_custom_fields][0].value' )}>Manufacturer</th>
                  <th className="sort" onClick={this.sorting.bind( this, '[item_custom_fields][1].value' )}>Manufacturer Part No</th>
                  <th>Description</th>
                  <th className="sort" onClick={this.sorting.bind( this, 'quantity' )}>Qty</th>
                  <th>GST %</th>
                  <th>HSN</th>
                  <th className="sort" onClick={this.sorting.bind( this, 'rate' )}>Price</th>
                  <th>Attachment</th>
                  { this.state.vendorData.map( ( $vData, $i ) => {
                      return (
                          [
                            <th className="supplier">
                            <label className="checkContainer">
                              <Input id={`suppInput-${$i}`} onChange={this.selectSupp.bind(this, $i)} type="checkbox" name={`suppInput-${$i}`} />
                              <span className="checkmark"></span>
                            </label>
                              <span className="ml-3 sort" onClick={this.sorting.bind( this, 'supplierA.price' )}>{$i==0 ? 'ShopElect' : `Supplier ${$i}`}</span>
                            </th>,
                            (
                              this.state.supp
                              ? thisSupplier
                              : null)
                          ]
                      )
                  }  ) }
                  <th>Customer Notes</th>
                  <th>Bid Status</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.currData.map( ( $data, $index ) => {
                    $data = $data._source || $data;
                    return ( () => {
                      let d = [ ( <tr className="tableRow" key={$index}>
                        <td onClick={this.removeLineItem.bind( this, $index )}>
                          <span>
                            <i className="fas fa-times cancel"></i>
                          </span>
                          {/* <label className="checkContainer">
                              <Input type="checkbox" name="signedIn"/>
                              <span className="checkmark"></span>
                          </label> */}
                        </td>
                        <td>{$index + 1}</td>
                        <td>{$data.manufacturer || getProp( $data[ 'item_custom_fields' ][0], 'value' )}</td>
                        <td>{$data.company_sku || getProp( $data[ 'item_custom_fields' ][1], 'value' )}</td>
                        <td className="clip-content">
                          <span onClick={this.descModal.bind( this, $data.description || '-', $index )} data-toggle="modal" data-target="#bomDescModal">{ $data.description }</span>
                        </td>
                        <td className="qty"><Input type="number" name={`quantity-${ $index }`} value={$data.quantity} onChange={() => {
                          this.updateBomFields.call( this, 'quantity', $index );
                          this.calOrderAmount.call( this, $index );
                        }}/>
                        </td>
                        <td>{getProp( this.state.vendorData[$data.line_item_id], 'GST' ) || $data.tax_percentage}</td>
                        <td>{getProp( this.state.vendorData[$data.line_item_id], 'HSN' )}</td>
                        <td>
                          {this.state.currencySymbol + ( ( $data.msrp || $data.rate || 0 ) * this.state.currencyRate ).toFixed( 2 )}
                        </td>
                        <td className="attachment">
                          <i className="fas fa-plus-circle"></i>
                          <i className="far fa-file-pdf"></i>
                        </td>
                        { this.state.vendorData.map( ( $vData, $i ) =>  this.lowestQuoteSupplier( $data, $index, thisSupplier, $i ) ) }
                        <td>{$data.custNotes}</td>
                        <td>{$data.bidSts}</td>
                      </tr> ) ];
                      if ( false ) {

                        d.push( <tr>
                          <td colSpan={this.state.supp ? 27 : 15} className="tableFooter">
                            {
                              this.state.hiddenFooter !== $index
                                ? ( <span>
                                  <span className="lastAct">{/* Quantity changes dony by Customer 18th Jan 2018, 12.30pm */}</span>
                                  <a onClick={this.toggleFooter.bind( this, $index, true, $data.line_item_id )} className="viewActivityLog text-right" href=";" role="button" data-toggle="collapse" data-target={`#collapse${ $index }`} aria-expanded="true" aria-controls={`collapse${ $index }`}>
                                    View Full activity log
                                    <i className="ml-1 far fa-plus-square"></i>
                                  </a>
                                </span> )
                                : null
                            }

                            <div id={`collapse${ $index }`} className="collapse" aria-labelledby={`heading${ $index }`} data-parent="#accordion">
                              <div className="card-body text-left">
                                <div>
                                  <Col md="6">
                                    <div style={{
                                        display: 'inline-block'
                                      }} className="viewActivityLog">
                                      <a onClick={this.toggleFooter.bind( this, $index )} className="viewActivityLog" href=";" role="button" data-toggle="collapse" data-target={`#collapse${ $index }`} aria-expanded="true" aria-controls={`collapse${ $index }`}>
                                        Hide Comments log
                                        <i className="ml-1 far fa-minus-square"></i>
                                      </a>
                                    </div>
                                    <ul className="ml-3 commentLog">
                                      {this.state.comments[ $index ].map( comment => <li>{comment}</li> )}
                                    </ul>
                                    <br/>
                                    <input type="text" name="comment" data={`comment-${ $data.line_item_id }`} placeholder="Add comments or Chat"/>
                                    <a className="ml-1 commentSub" href=";" data={$data.line_item_id} onClick={this.addComment.bind( this )}>Submit</a>
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
                                          */}
                                        </ul>
                                      </span>
                                      <span>
                                        <a onClick={this.toggleFooter.bind( this, $index )} className="viewActivityLog" href=";" role="button" data-toggle="collapse" data-target={`#collapse${ $index }`} aria-expanded="true" aria-controls={`collapse${ $index }`}>
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
                        </tr> );
                      }
                      return d;
                    } )()
                  } )
                }
              </tbody>
            </Table>
            <Col md="4">
              <div id="copyMPN">
                <Input id="searchItm" value={this.state.searchItemValue} onChange={this.addMultiple.bind( this )} type="text" placeholder="Add MPN or SKU"/>
                <span id="btnMPN" onClick={this.paste.bind()}>Paste</span>
              </div>
              <table className="table table-sm">

                <tbody>
                  {
                    this.state.searchProd.map( ( $prod, $index ) => {
                      return ( <tr>
                        <td onClick={this.appendInput.bind( this, $index )}>
                          <a href="javascript:void()">{$prod._source.company_sku}</a>
                        </td>
                        <td>{$prod._source.name}</td>
                      </tr> );
                    } )
                  }
                </tbody>
              </table>
              <div className="modal fade" id="bomDescModal">
                <div className="modal-dialog" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Description</h5>
                      <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <p>
                        <Input type="textarea" rows="5" name={`description-${ this.state.modalDescData.index }`} value={this.state.modalDescData.text} onChange={this.updateBomFields.bind( this, 'description', this.state.modalDescData.index )}/>
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn fill-btn" data-dismiss="modal">Save changes</button>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

          </Col>
        </Row>
    </div> )
  }
}
