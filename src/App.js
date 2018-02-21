import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import Dropzone from 'react-dropzone';
import * as XLSX from 'xlsx';
import * as $ from 'jquery';
import { Button } from 'reactstrap';
import {Link} from 'react-router-dom';
import {ApiService} from './services/api.service';
import {StorageService} from './services/storage.service';

class App extends Component {
	constructor(props) {
		super(props);
		this.dropZone = null;
		this.state = {
            bomList: []
        };

		this.boms = [];
	}
	componentDidMount() {
		console.log(this.getContactId())
		ApiService.get(`/customer/${this.getContactId()}/bom`).then(res => {
            console.log(res)
            this.setState({ bomList: res.estimates });
			console.log(this.state.bomList)
			// this.test();
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
		for (var i = 0; i < this.state.bomList.length; i++) {
			let j = i;
			let _href = '/main/' + j.toString();
			this.boms.push(
				<ul>
					<li class="first-in-row">
						<Link to = {`/bom/${this.state.bomList[i].estimate_id}`}>
							<h3>{this.state.bomList[i].cf_title}</h3>

							<div class="last-updated">Last updated: {this.state.bomList[i].last_modified_time}</div>
						</Link>
					</li>
				</ul>
			);
		}

		return (
			<section className="content bom-tool manage" style={{ marginTop: '-60px' }}>
				<div className="inner">
					<h1>
						<i className="fa fa-list-ul" aria-hidden="true" /> BOM Tool
					</h1>
				</div>
				<div className="inner">
					<div className="create-or-upload container-fluid">
						<div className="row">
							<div className="col-sm-4">
								<Button className="create-button"><Link to="/bom/new">Create a New BOM</Link></Button>
							</div>
							<div className="col-sm-1">
								<div className="vertical-separator">
									<div className="top" />
									<div className="middle">or</div>
									<div className="bottom" />
								</div>
							</div>
							<div className="col-sm-7">
								<div className="upload">
									<div className="bom-dropzone">
										<Dropzone
											className="dropzone"
											ref={(node) => (this.dropZone = node)}
											onDrop={(acceptedFiles) => {
												this.loadFile(acceptedFiles);
											}}
										>
											<div className="droptext">
												<span>Drag a BOM file here </span>
												<span className="accepts">(.ods, Excel, .csv, .txt, Eagle 6 .sch)</span>
											</div>
										</Dropzone>
									</div>
									<div className="or-select-files">
										<div>
											<form method="post" action="/bom-tool/upload" encType="multipart/form-data">
												<input
													name="_authentication_token"
													type="hidden"
													value="211321901470595359153915695414268937302"
												/>
												<input type="hidden" name="from_where" value="bom_manager" />
												<input
													type="file"
													id="datafile-1wjsS4rm"
													name="datafile"
													className="datafile"
													onChange={(e) => this.loadFile(e.target.files)}
												/>
												<label htmlFor="datafile-1wjsS4rm">
													<span>or select a file...</span>
												</label>
											</form>
											<div className="accepts">(.xls, .xlsx, .csv, .txt, Eagle 6 .sch)</div>
										</div>
									</div>
									<div className="upload-bom-button">
										<div>
											<form method="post" action="/bom-tool/upload" encType="multipart/form-data">
												<input
													name="_authentication_token"
													type="hidden"
													value="211321901470595359153915695414268937302"
												/>
												<input type="hidden" name="from_where" value="bom_manager" />
												<input
													type="file"
													id="datafile-4WfBYlCI"
													name="datafile"
													className="datafile"
												/>
												<label htmlFor="datafile-4WfBYlCI">
													<span>Upload BOM</span>
												</label>
											</form>
											<div className="accepts">(.xls, .xlsx, .csv, .txt, Eagle 6 .sch)</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="hint">
						Not sure where to start?
						<a href="/bom-tool/or-try-this-sample-bom">Try a sample BOM</a> or see the{' '}
						<a href="/help#users-how-to-bom">BOM Tool Quickstart</a>.
					</div>
				</div>
				<div className="inner">
					<hr />
				</div>
				<div className="inner">
					<h2>Saved BOMs</h2>
					<div class="saved-boms">
						<div>
							<div class="saved-boms-list">{this.boms}</div>
						</div>
					</div>
					<div className="sign-in">
						<a href="/auth/login?continue_to=https://octopart.com/bom-tool&amp;sig=560745">Sign in</a> to
						view your Saved BOMs.
					</div>
				</div>
			</section>
		);
	}
}
export default App;
