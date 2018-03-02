import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import 'typeface-roboto'
import { getData, getPrefix, getInfo } from './api';
import { Card, Icon, Image } from 'semantic-ui-react';
import 'bootstrap/dist/css/bootstrap.css';

import ToolTip from './components/ToolTip.js';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import Autosuggest from 'react-autosuggest';

const renderSuggestionsContainer = ({ containerProps, children, query }) => {
	return (
		<div
			{...containerProps}
			style={{
				position: 'absolute',
				borderStyle: 'solid',
				width: '90%',
				zIndex: 99,
				borderColor: 'black',
				backgroundColor: 'lightgrey'
			}}
		>
			{children}
		</div>
	);
};
//
class App extends Component {
	setState(prop) {
		super.setState(prop, this.saveBom);
	}

	constructor(props) {
		super(props);
		this.setState = this.setState.bind(this);
		var bomData = localStorage.getItem('boms');
		var boms = [];
		if (bomData == 'null' || bomData == undefined || bomData == null) {
			console.log('No Bom Here');
			boms = [];
		} else {
			console.log('Bom Here');
			boms = JSON.parse(bomData);
			console.log(boms);
		}
		var bomID = props.location.state.bomID;
		var bomArray = [];
		console.log('BomID=', bomID);
		var _done = false;
		var _totalCount = 0;
		var _total = 0;
		if (!isNaN(bomID)) {
			bomArray = boms[bomID].data;
			_totalCount = boms[bomID].totalCount;
			_total = boms[bomID].total;
			_done = true;
		} else {
			bomArray = props.location.state.data;
		}
		var data = [];
		if (isNaN(bomID))
			for (let i = 1; i < bomArray.length; i++) {
				let arr = bomArray[i];
				let temp = {};
				for (let j = 0; j < arr.length; j++) {
					temp[bomArray[0][j]] = arr[j];
				}
				data.push(temp);
			}
		else data = bomArray.slice(1);
		let bNew = false;
		if (isNaN(bomID)) {
			bNew = true;
			bomID = boms.length;
			boms.push({
				title: 'Untitled',
				data: props.location.state.data,
				date: new Date().toISOString().slice(0, 10),
				total: 0,
			});
		}

		this.getDataFromServer(data);
		console.log('FieldArray=', bomArray[0]);
		this.state = {
			showLine: true,
			showPreferred: true,
			showShopping: true,
			showNotes: true,
			showToggle: false,
			showStockList: false,
			showMatchList: false,
			caption: boms[bomID].title,
			captionEdit: false,
			new: bNew,
			bomID: bomID,
			field: bomArray[0],
			title: bomArray[0],
			boms: boms,
			open: false,
			data: [],
			id: 1,
			done: _done,
			propertyName: bomArray[0][0],
			totalCount: _totalCount,
			editCaption: 'Schematic Reference',
			showEdit: false,
			suggestions: [],
			newSku: '',
			total: _total
		};
	}

	addMulti = () => {
		var str = this.state.multiAdd;
		var arr = str.split('\n');
		for (let i = 0; i < arr.length; i++) {
			let chunk = arr[i].split(',');
			this.getInfo(-1, chunk[0], parseInt(chunk[1]));
		}
	};
	
	saveBom = () => {
		let bomTemp = this.state.boms.slice(0);
		bomTemp[this.state.bomID].title = this.state.caption;
		bomTemp[this.state.bomID].totalCount = this.state.totalCount;
		bomTemp[this.state.bomID].total = this.state.total;
		bomTemp[this.state.bomID].date = new Date().toISOString().slice(0, 10);
		var _boms = [this.state.title].concat(this.state.data);

		bomTemp[this.state.bomID].data = _boms;
		localStorage.setItem('boms', JSON.stringify(bomTemp));
	};

	componentWillUnmount() {
		console.log('UNMOUNT');

		//this.saveBom();
		console.log(this.state.data);
	}

	async getDataFromServer(data) {
		var skus = [];
		for (let i = 0; i < data.length; i++) {
			// 	console.log(data[i]['part no']);
			skus[i] = await getData(data[i]['part no']);
		}
		this.setState({ data: data, skus: skus });
		this.getTotalScore.bind(this);
	}

	handleOpen = () => {
		this.setState({ open: true });
	};

	done = () => {
		//Format Datas
		var _data = this.state.data.slice(0);
		var _total = 0;
		for (var i = 0; i < this.state.data.length; i++) {
			for (var j = this.state.id; j < this.state.title.length; j++) {
				_data[i][this.state.title[j]] = j == 1 ? 1 : '';
			}
			_total += parseInt(this.state.data[i][this.state.title[1]]);
		}
		this.setState({ data: _data, open: false, done: true, totalCount: _total });
		this.getTotalScore.bind(this);
		for (var i = 0; i < this.state.data.length; i++) {
			this.getInfo(i, this.state.data[i][this.state.title[0]]);
		}
	};

	reset = () => {
		this.setState({ open: false, id: 1, propertyName: this.state.title[0] });
	};

	onNext = () => {
		if (this.state.id == 5) return;
		this.setState({ id: this.state.id + 1, propertyName: this.state.title[this.state.id] });
	};
	onBack = () => {
		this.setState({ id: this.state.id - 1, propertyName: this.state.title[this.state.id - 2] });
	};
	onDone = () => {
		this.setState({ open: true });
	};
	onChange = (propertyName) => {
		var _title = this.state.title.slice(0);
		_title[this.state.id - 1] = propertyName;
		this.setState({
			propertyName: propertyName,
			title: _title
		});
		return;
	};

	getVal = (str, strSel, ind) => {
		if (this.state.done) return str;
		if (this.state.done && ind == 2 && this.state.id == 1) return '1';

		if (this.state.id == ind) return strSel;
		if (this.state.id > ind) return str;
		return '';
	};
	getBorder = (num) => {
		if (this.state.done) return 'grey';
		if (this.state.id == num) return 'red';
		if (this.state.id < num) return 'white';
		return 'grey';
	};
	_remove = (ind) => {
		var v = this.state.data.slice(0);
		v.splice(ind, 1);
		let _totalCount = this.state.totalCount - parseInt(this.state.data[ind][this.state.title[1]]);
		let _total=this.state.total;
		if (
			!isNaN(this.state.data[ind][this.state.title[3]]) &&
			this.state.data[ind][this.state.title[3]] != '' &&
			this.state.data[ind][this.state.title[3]] != undefined
		)
			_total =
				this.state.total -
				parseInt(this.state.data[ind][this.state.title[1]]) *
				parseInt(this.state.data[ind][this.state.title[3]]);
		this.setState({ data: v, totalCount: _totalCount, total: _total });
		//this.getTotalScore();
	};
	handleInputChange(index, event) {
		const target = event.target;
		let value = target.value;
		const name = target.name;
		var _data = this.state.data.slice(0);
		var _prevVal = _data[index][name];
		if (name == this.state.title[0]) this.onSuggestionsFetchRequested(value);
		if (name == this.state.title[1] && parseInt(value) < 1) {
		} else {
			var _total = this.state.totalCount;
			if (name == this.state.title[1]) {
				if (value == '') {
					value = 1;
				}

				_total = parseInt(_total) - parseInt(_prevVal) + parseInt(value);
			}
			_data[index][name] = value;
			this.setState({ data: _data, totalCount: _total });
		}
		this.getTotalScore();
	}
	getTotalScore = () => {
		let total = 0;
		for (var i = 0; i < this.state.data.length; i++) {
			console.log('Val', this.state.data[i]);
			if (
				!isNaN(this.state.data[i][this.state.title[3]]) &&
				this.state.data[i][this.state.title[3]] != undefined &&
				this.state.data[i][this.state.title[3]] != ''
			) {
				total +=
					parseInt(this.state.data[i][this.state.title[3]]) *
					parseInt(this.state.data[i][this.state.title[1]]);
				console.log(
					'Val',
					parseInt(this.state.data[i][this.state.title[3]]) *
					parseInt(this.state.data[i][this.state.title[1]])
				);
			}
		}
		this.setState({ total: total });
	};
	getSuggestionValue = (suggestion) => suggestion;

	renderSuggestion = (suggestion) =>
		suggestion != this.state.highlighted ? (
			<div>{suggestion}</div>
		) : (
				<div style={{ backgroundColor: 'grey' }}>{suggestion}</div>
			);
	onSuggestionsFetchRequested = async ({ value }) => {
		if (value == undefined) return;
		let _suggestion = await getPrefix(value);
		console.log('_sugges', _suggestion);
		this.setState({
			suggestions: _suggestion
		});
	};

	// Autosuggest will call this function every time you need to clear suggestions.
	onSuggestionsClearRequested = () => {
		this.setState({
			suggestions: []
		});
	};
	getInfo = async (index, string, count = 1) => {
		console.log(index, ':', string);

		var _data = await getInfo(string);
		let data = this.state.data.splice(0);
		if (index == -1) {
			this.setState({ newSku: '', totalCount: this.state.totalCount + count });
			var obj = {};
			obj[this.state.title[0]] = string;
			obj[this.state.title[1]] = count;
			obj[this.state.title[2]] = '';
			obj[this.state.title[3]] = '';
			obj[this.state.title[4]] = '';

			data.push(obj);
			console.log(data, 'data.length=', data.length);
			index = data.length - 1;
		}
		data[index][this.state.title[0]] = string;
		console.log('newIndex=', index);
		console.log('hit=', _data);
		if (_data.length == 0) {
			data[index]['hit'] = [];
			data[index][this.state.title[2]] = data[index][this.state.title[3]] = data[index][this.state.title[4]] = '';
			this.setState({ data: data });
			this.getTotalScore();
			return;
		}

		if (_data.length == 1) {
			data[index][this.state.title[2]] = _data[0]._source.manufacturer;
			data[index][this.state.title[3]] = _data[0]._source.price;
			data[index][this.state.title[4]] = _data[0]._source.description;
			data[index]['hit'] = _data;
			this.setState({ data: data });
			this.getTotalScore();
			return;
		}
		data[index][this.state.title[2]] = data[index][this.state.title[3]] = data[index][this.state.title[4]] = '';
		data[index]['hit'] = _data;
		this.setState({ data: data });
		this.getTotalScore();
	};
	addExtra = (sku, count) => { };
	onSuggestionSelected = (index, event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) => {
		event.preventDefault();
		this.getInfo(index, suggestionValue);
	};
	onSuggestionHighlighted = (v) => {
		this.setState({ highlighted: v.suggestion });
	};
	render() {
		var Popup = (
			<ToolTip
				downOption={this.state.field}
				onNext={this.onNext}
				onBack={this.onBack}
				onChange={this.onChange}
				onDone={this.onDone}
				num={this.state.id}
			/>
		);
		var datas = [];
		let total = 0;

		for (let ids = 0; ids < this.state.data.length; ids++) {
			let i = ids;
			let candidates = [];
			if (this.state.data[i]['hit'] != undefined) console.log('HITS=', this.state.data[i]['hit']);
			for (
				let j1 = 0;
				this.state.data[i]['hit'] != undefined && j1 < this.state.data[i]['hit'].length - 1;
				j1++
			) {
				let j = j1;
				candidates.push(
					<li
						class="part-option availability-good selected"
						onClick={() => {
							//set hit to data
							let _data = this.state.data.splice(0);

							_data[i][this.state.title[2]] = _data[i]['hit'][j]._source.manufacturer;
							_data[i][this.state.title[0]] = _data[i]['hit'][j]._source.company_sku;
							_data[i][this.state.title[3]] = _data[i]['hit'][j]._source.price;
							_data[i][this.state.title[4]] = _data[i]['hit'][j]._source.description;

							let _total = this.state.total;
							if (
								!isNaN(_data[i]['hit'][j]._source.price) &&
								_data[i]['hit'][j]._source.price != undefined &&
								_data[i]['hit'][j]._source.price != ''
							)
								_total +=
									parseInt(_data[i]['hit'][j]._source.price) *
									parseInt(_data[i][this.state.title[1]]);
							_data[i]['hit'] = [_data[i]['hit'][j]];
							this.setState({ data: _data, showMatchList: false, total: _total });
						}}
					>
						<div>
							<div class="manufacturer-name-mpn-description">
								<div class="manufacturer-name">{this.state.data[i]['hit'][j]._source.manufacturer}</div>
								<div class="mpn"> {this.state.data[i]['hit'][j]._source.company_sku} </div>
								<div class="description">{this.state.data[i]['hit'][j]._source.description}</div>
							</div>
							<div class="details-image">
								<a
									href="https://octopart.com/ina114ap-texas+instruments-414192"
									target="_blank"
									class="details"
									style={{ position: 'relative', textTransform: 'inherit' }}
								>
									<span>Details</span>
								</a>
								<div class="image">
									<img
										src={this.state.data[i]['hit'][j]._source.image}
										alt="Image for INA114AP"
									/>{' '}
								</div>
							</div>
						</div>
					</li>
				);
			}
			datas.push(
				<tr className="lineitem" id="uploaded0">
					<td className="closer">
						<div>
							<a href="#">
								<img
									style={{ width: '15px', height: '15px' }}
									src="/assets/close.png"
									onClick={() => this._remove(i)}
								/>
							</a>
						</div>
					</td>
					<td className="line-number-handle">
						<div>
							<div className="line-number">{i + 1}</div>
							<div className="handle">|||</div>
						</div>
					</td>
					<td className="query">
						<div>
							<Autosuggest
								theme={{ suggestionHighlighted: true }}
								onSuggestionHighlighted={this.onSuggestionHighlighted}
								style={{ position: 'absolute', marginTop: 5 }}
								suggestions={this.state.suggestions}
								onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
								onSuggestionsClearRequested={this.onSuggestionsClearRequested}
								getSuggestionValue={this.getSuggestionValue}
								renderSuggestionsContainer={renderSuggestionsContainer}
								renderSuggestion={this.renderSuggestion}
								onSuggestionSelected={this.onSuggestionSelected.bind(this, i)}
								inputProps={{
									style: { borderWidth: 1, borderColor: this.getBorder(1) },
									onSubmitEditing: () => { },
									onKeyPress: (ev) => {
										console.log(`Pressed keyCode ${ev.key}`);
										if (ev.key === 'Enter') {
											console.log('Enter Pressed');
											this.getInfo(i, this.state.data[i][this.state.title[0]]);
											// Do code here
											ev.preventDefault();
										}
									},
									value: this.getVal(
										this.state.data[i][this.state.title[0]],
										this.state.data[i][this.state.propertyName],
										1
									),
									name: this.state.title[0],
									onChange: this.handleInputChange.bind(this, i)
								}}
							/>
						</div>
					</td>
					<td className="undo-delete" colspan="2">
						<div>
							<div>Row deleted</div>
							<a href="#">Undo</a>
						</div>
					</td>
					<td className="quantity">
						<div
							style={{
								overflow: 'hidden'
							}}
						>
							<input
								className="form-control"
								style={{ overflow: 'hidden', borderWidth: 1, borderColor: this.getBorder(2) }}
								type="number"
								value={this.getVal(
									this.state.data[i][this.state.title[1]],
									this.state.data[i][this.state.propertyName],
									2
								)}
								name={this.state.title[1]}
								onChange={this.handleInputChange.bind(this, i)}
							/>
						</div>
					</td>

					{this.state.showLine && <td className="matched-parts lineitem-details">
						<table>
							<tbody>
								<tr style={{ marginLeft: 20 }}>
									{!this.state.done ? (
										<td className="lineitem-details-column lineitem-details-column-schematicReference">
											<div
												style={{
													overflow: 'hidden'
												}}
											>
												<a
													href="#"
													onClick={() =>
														this.setState({
															editIndex: i,
															editField: this.state.title[2],
															editShow: true,
															editCaption: 'Schemaic Reference'
														})}
													className="edit-link"
												>
													Edit
												</a>
												<div
													style={{
														overflow: 'hidden',
														borderWidth: 1,
														borderColor: this.getBorder(3)
													}}
												>
													{this.getVal(
														this.state.data[i][this.state.title[2]],
														this.state.data[i][this.state.propertyName],
														3
													)}
												</div>
												<a href="#" className="more-link">
													More...
												</a>
											</div>
										</td>
									) : this.state.data[i]['hit'] == undefined ||
										this.state.data[i]['hit'].length == 0 ? (
												<td  className="lineitem-details-column lineitem-details-column-schematicReference">
													<div style={{ paddingLeft: '20px' }}>No matches found</div>
													<a style={{ paddingLeft: '20px' }} href="#" className="create-custom-lineitem">
														Create custom row
													</a>
												</td>
											) : this.state.data[i]['hit'].length > 1 ? (
												<td   class="lineitem-details-column lineitem-details-column-schematicReference">
													<div style={{ paddingLeft: '20px' }}>
														<div>
															<a
																href="https://octopart.com/ina114ap-texas+instruments-414192"
																target="_blank"
																class="selected-part"
															>
																<div class="manufacturer-name">
																	{this.state.data[i]['hit'][0]._source.manufacturer}
																</div>
																<div class="mpn"> </div>
															</a>
															<noscript />
														</div>
														<a
															href="#"
															class="caution"
															onClick={(e) => {e.stopPropagation();
																this.setState({ showMatchList: true });
															}}
														>
															<img alt="Multiple matches found" src="/assets/caution.png" /> {' '}
														</a>
														{this.state.showMatchList && (
															<div class="all-parts has-caution" style={{ padding: 0 }}>
																<h4>Multiple matches found</h4>
																<ul>{candidates}</ul>
															</div>
														)}
													</div>
												</td>
											) : (
													<td  className="lineitem-details-column lineitem-details-column-schematicReference ">
														<div style={{ paddingLeft: '20px' }} class="manufacturer-name">
															{this.state.data[i][this.state.title[2]]}
														</div>
													</td>
												)}
									<td className="lineitem-details-column lineitem-details-column-internalPartNumber">
										<div
											style={{
												overflow: 'hidden'
											}}
										>
											<a
												href="#"
												className="edit-link"
												onClick={() =>
													this.setState({
														editIndex: i,
														editField: this.state.title[3],
														editShow: true,
														editCaption: 'Internal Part Number'
													})}
											>
												Edit
											</a>
											<div
												style={{
													overflow: 'hidden',
													borderWidth: 1,
													borderColor: this.getBorder(4)
												}}
											>
												{this.getVal(
													this.state.data[i][this.state.title[3]],
													this.state.data[i][this.state.propertyName],
													4
												)}
											</div>
											<a href="#" className="more-link">
												More...
											</a>
										</div>
									</td>
									<td className="lineitem-details-column lineitem-details-column-description">
										<div
											style={{
												overflow: 'hidden'
											}}
										>
											<a
												href="#"
												className="edit-link"
												onClick={() =>
													this.setState({
														editIndex: i,
														editField: this.state.title[4],
														editShow: true,
														editCaption: 'Description'
													})}
											>
												Edit
											</a>
											<div
												style={{
													overflow: 'hidden',
													borderWidth: 1,
													borderColor: this.getBorder(5)
												}}
											>
												{this.getVal(
													this.state.data[i][this.state.title[4]],
													this.state.data[i][this.state.propertyName],
													5
												)}
											</div>
											<a href="#" className="more-link">
												More...
											</a>
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</td>}
					{this.state.showPreferred && <td className="selected-distributors">
						<table>
							<tbody>
								<tr>
									<td className="selected-distributor has-cart">
										<div>
											<div className="selected-offer">
												<div className="no-price">--</div>
											</div>
										</div>
									</td>
									<td className="selected-distributor has-cart">
										<div>
											<div className="selected-offer">
												<div className="no-price">--</div>
											</div>
										</div>
									</td>
									<td className="selected-distributor has-cart">
										<div>
											<div className="selected-offer">
												<div className="no-price">--</div>
											</div>
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</td>}
					{this.state.showShopping && <td className="distributor-sku empty">
						<div>N/A</div>
					</td>}
					{this.state.showShopping &&
						<td className="unit-price empty">
							<div>
								{!isNaN(this.state.data[i][this.state.title[3]]) &&
									this.state.data[i][this.state.title[3]] != '' &&
									this.state.data[i][this.state.title[3]]}
							</div>
						</td>}
					{this.state.showShopping &&
						<td className="line-total empty">
							<div>
								{!isNaN(this.state.data[i][this.state.title[3]]) &&
									this.state.data[i][this.state.title[3]] != '' &&
									parseInt(this.state.data[i][this.state.title[3]]) *
									parseInt(this.state.data[i][this.state.title[1]])}
							</div>
						</td>}
					{this.state.showShopping &&
						<td className="batch-total empty">
							<div>N/A</div>
						</td>
					}
					{this.state.showNotes &&
						<td className="notes">
							<div>
								<a href="#" className="edit-link">
									Edit
							</a>
								<div />
								<a href="#" className="more-link">
									More...
							</a>
							</div>
						</td>}
				</tr>
			);
		}
		return (
			<div className="body" onClick={() => { console.log('BIG'); this.setState({ showToggle: false, showMatchList: false }) }} style={{ paddingTop: 120 }}>
				<Dialog
					modal={true}
					open={this.state.open}
					bodyStyle={{ backgroundColor: 'black', color: 'white', alignItems: 'center' }}
				>
					Everything look okay?
					<button style={{ marginLeft: 250, marginRight: 20 }} onClick={this.reset}>
						Re-set columns
					</button>
					<button onClick={this.done}>Done importing</button>
				</Dialog>
				<div className="page bom-tool show">
					<div id="bombom">
						<div className="bombom"  >
							<h1>
								{!this.state.captionEdit ? (
									<button
										style={{
											backgroundColor: 'transparent',
											borderWidth: 0,
											color: 'rgb(41,92,174)',

											fontSize: 30
										}}
										onClick={() => {
											this.setState({ captionEdit: true, caption1: this.state.caption });
										}}
									>
										{this.state.caption}
									</button>
								) : (
										<div>
											<input
												type="text"
												value={this.state.caption1}
												onChange={(val) => {
													this.setState({ caption1: val.target.value });
												}}
												ref={(r) => (this.title = r)}
												style={{ width: '200px', color: 'rgb(41,92,174)', fontSize: 30 }}
											/>
											<label
												onClick={() =>
													this.setState({ caption: this.state.caption1, captionEdit: false })}
												style={{ marginLeft: 20, marginRight: 20, color: 'grey', fontSize: 10 }}
											>
												OK
										</label>
											<label
												onClick={() => this.setState({ captionEdit: false })}
												style={{ color: 'grey', fontSize: 10 }}
											>
												Cancel
										</label>
										</div>
									)}
							</h1>
							<div className="batch-size-pricing">
								<div className="batch-size">
									<label>Batch size:</label>
									<input type="number" value="" />
								</div>
								<div className="pricing">
									<h3 className="bom-total">
										<small className="currency-code">INR</small>
										<span> </span>
										<span className="amount">{this.state.total}</span>
										<span> each</span>
									</h3>
									<h4 className="batch-total-bom-coverage">
										<div className="batch-total">
											<small className="currency-code">INR</small>
											<span> </span>
											<span className="amount">{this.state.total}</span>
											<span> total</span>
										</div>
										<div className="bom-coverage">
											<span>0</span>
											<span>% BOM coverage</span>
										</div>
									</h4>
								</div>
							</div>
							<div className="frozen-thead">
								<table style={{width: "initial"}}>
									<thead className="bom-head"  >
										<tr className="top">
											<th className="column-group-selector-heading" colspan="2">
												<div>
													<div className="column-group-selector" onClick={(e) => { e.stopPropagation(); console.log('SMALL');  this.setState({ showToggle: true });   }}>
														<a href="#" class="opener" >
														<FontAwesome
															name='cog'
															style={{ fontSize: 20, position: "absolute", left: "5px", top: "5px", textShadow: '0 1px 0 rgba(0, 0, 0, 0.1)' }}
														/>
															<i class="fa fa-angle-down" style={{ position: "absolute", right: "2px", top: "-2px" }} size={2} aria-hidden="true"></i>
														</a>
														{
															this.state.showToggle &&
															<div class="selector">
															<div class="label">Show these column groups:</div>
															<ul>
																	<li><label><input type="checkbox" checked={this.state.showLine} onChange={() => {this.setState({showLine: !this.state.showLine})}}/><span >Line Item Details</span></label></li>
																<li><label><input type="checkbox"   checked={this.state.showPreferred} onChange={() => {this.setState({showPreferred: !this.state.showPreferred})}}/><span>Preferred Distributors</span></label></li>
																<li><label><input type="checkbox"  checked={this.state.showShopping} onChange={() => {this.setState({showShopping: !this.state.showShopping})}}/><span>Shopping List</span></label></li>
																<li><label><input type="checkbox"   checked={this.state.showNotes} onChange={() => {this.setState({showNotes: !this.state.showNotes})}}/><span>Notes</span></label></li>
															</ul>
														</div> }
													</div>
												</div>
											</th>
											<th className="item-and-quantity" colspan="2">
												<div>Part Number &amp; Qty</div>
											</th>
											{this.state.showLine &&
												<th className="lineitem-details-heading-top">
													<div>
														<div className="heading">Line Item Details</div>
														<a className="" href="#" onClick={() => this.setState({ showLine: false })}>
															Hide
													</a>
													</div>
												</th>
											}
											{this.state.showPreferred &&
												<th className="selected-distributors-heading-top">
													<div>
														<div className="heading">Preferred Distributors</div>
														<a className="" href="#" onClick={() => this.setState({ showPreferred: false })}>
															Hide
													</a>
													</div>
												</th>
											}
											{this.state.showShopping &&
											<th colspan="4" className="cart-pricing-select">
												<div>
													<div className="cart">
														<div>Shopping List</div>
													</div>

													<a className="" href="#" onClick={() => this.setState({ showShopping: false })}>
														Hide
													</a>
												</div>
											</th>
										}
											{this.state.showNotes && <th className="notes-heading">
												<div>
													<a className="heading" href="#">
														Notes
													</a>

													<a href="#" onClick={() => this.setState({ showNotes: false })}>Hide</a>
												</div>
											</th>}
										</tr>
										<tr className="bottom">
											<th className="edit" colspan="2">
												<div>
													<a href="#">
														<span>Edit</span>
													</a>
												</div>
											</th>
											<th className="item">
												{!this.state.done && this.state.id == 1 ? (
													<div>
														<div>Part Number</div>
														{Popup}
													</div>
												) : (
														<div>Part Number</div>
													)}
											</th>
											<th className="quantity">
												{!this.state.done && this.state.id == 2 ? (
													<div>
														<div>Qty</div>
														{Popup}
													</div>
												) : (
														<div>Qty</div>
													)}
											</th>

											{this.state.showLine && <th className="lineitem-details-heading-bottom">
												<div>
													<table>
														<thead>
															<tr>
																<th className="lineitem-details-column schematic-reference">
																	<div>
																		{!this.state.done && this.state.id == 3 ? (
																			<div>
																				<div>Manufacturer/MPN</div>
																				{Popup}
																			</div>
																		) : (
																				<div>Manufacturer/MPN</div>
																			)}
																	</div>
																</th>
																<th className="lineitem-details-column internal-part-number">
																	<div>
																		{!this.state.done && this.state.id == 4 ? (
																			<div>
																				<div>Internal Part Number</div>
																				{Popup}
																			</div>
																		) : (
																				<div>Internal Part Number</div>
																			)}
																	</div>
																</th>
																<th className="lineitem-details-column description">
																	<div>
																		{!this.state.done && this.state.id == 5 ? (
																			<div>
																				<div>Description</div>
																				{Popup}
																			</div>
																		) : (
																				<div>Description</div>
																			)}
																	</div>
																</th>
															</tr>
														</thead>
													</table>
												</div>
											</th>}
											{this.state.showPreferred &&
											<th className="selected-distributors-heading-bottom">
												<div>
													<table>
														<thead>
															<tr>
																<th className="selected-distributor has-cart">
																	<div>
																		<div className="name">Digi-Key</div>

																	</div>
																</th>
																<th className="selected-distributor has-cart">
																	<div>
																		<div className="name">Mouser</div>

																	</div>
																</th>
																<th className="selected-distributor has-cart">
																	<div>
																		<div className="name">Newark</div>

																	</div>
																</th>
															</tr>
														</thead>
													</table>
												</div>
												</th>}
											{this.state.showShopping &&
												 <th className="distributor-sku">
													<div>
														<a href="#">Distributor/SKU</a>
													</div>
												</th>
											}
											{this.state.showShopping &&
												<th className="unit-price">
													<div>
														<a href="#">Unit Price</a>
													</div>
												</th>}
												{this.state.showShopping &&
											<th className="line-total">
												<div>Line Total</div>
											</th>}
												{this.state.showShopping &&
											<th className="batch-total">
												<div>Batch Total</div>
											</th>
										}
											{this.state.showNotes &&
												<th className="notes-heading-bottom" />}
										</tr>

									</thead>
								</table>
							</div>
							<table>
								<tbody className="bom-body ui-sortable">{datas}</tbody>
								<tfoot className="bom-foot">
									<tr>
										<td className="closer" />
										<td />
										<td colspan="2" className="add-line-item">
											<div>
												{
													<Autosuggest
														theme={{ suggestionHighlighted: true }}
														onSuggestionHighlighted={this.onSuggestionHighlighted}
														style={{ position: 'absolute', marginTop: 5 }}
														suggestions={this.state.suggestions}
														onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
														onSuggestionsClearRequested={this.onSuggestionsClearRequested}
														getSuggestionValue={this.getSuggestionValue}
														renderSuggestionsContainer={renderSuggestionsContainer}
														renderSuggestion={this.renderSuggestion}
														onSuggestionSelected={this.onSuggestionSelected.bind(this, -1)}
														inputProps={{
															style: { borderWidth: 1, borderColor: this.getBorder(1) },

															placeholder: 'Add NPM or SKU',
															onKeyPress: (ev) => {
																console.log(`Pressed keyCode ${ev.key}`);
																if (ev.key === 'Enter') {
																	this.getInfo(-1, this.state.newSku);

																	ev.preventDefault();
																}
															},
															value: this.state.newSku,
															onChange: (event, { newValue }) => {
																this.setState({ newSku: newValue });
															}
														}}
													/>
												}
												<a
													href="#"
													className="pastebox-trigger"
													onClick={() => {
														this.setState({ showPaste: true });
													}}
												>
													Paste
												</a>
												{this.state.showPaste && (
													<div class="pastebox">
														<a
															href="#"
															class="cancel"
															onClick={() => {
																this.setState({ showPaste: false });
															}}
														>
															<img
																style={{ width: '15px', height: '15px' }}
																src="/assets/close.png"
															/>
														</a>
														<textarea
															placeholder="MAX232DR, 10"
															onChange={(v) =>
																this.setState({ multiAdd: v.target.value })}
														/>
														<div class="instructions">
															Paste in multiple part numbers and quantities (optional)
														</div>
														<a
															href="#"
															class="ok"
															onClick={() => {
																this.addMulti();
																this.setState({ showPaste: false });
															}}
														>
															OK
														</a>
													</div>
												)}
											</div>
										</td>
										<td colspan="8" />
									</tr>
									<tr>
										<td className="closer" />
										<td />
										<td className="component-count-label">
											<div>Component count:</div>
										</td>
										<td className="component-count">
											<div>{this.state.totalCount}</div>
										</td>
										<td colspan="8" />
									</tr>
								</tfoot>
							</table>
							{this.state.editShow && (
								<div class="modals">
									<div class="lineitem-details modal" style={{ display: 'block' }}>
										<div class="modal-dialog">
											<div class="modal-content">
												<div class="modal-header">
													<a
														href="#"
														class="closer"
														onClick={() => this.setState({ editShow: false })}
													>
														<img
															style={{ width: '15px', height: '15px' }}
															src="/assets/close.png"
														/>
													</a>
													<h3>{this.state.editCaption}</h3>
												</div>
												<div class="modal-body">
													<textarea id="editArea">
														{this.state.data[this.state.editIndex][this.state.editField]}
													</textarea>
												</div>
												<div class="modal-footer">
													<a
														href="#"
														class="button button-primary"
														onClick={() => {
															var _data = this.state.data;
															_data[this.state.editIndex][
																this.state.editField
															] = document.getElementById('editArea').value;

															this.setState({ dat: _data, editShow: false });
														}}
													>
														Save changes
													</a>
													<a
														href="#"
														class="button"
														onClick={() => this.setState({ editShow: false })}
													>
														Cancel
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}
}
export default App;
