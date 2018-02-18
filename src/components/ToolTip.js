import React, { Component } from 'react';

import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
var FontAwesome = require('react-fontawesome');
const options = [ 'Part Number', 'Qty', 'Schemantic Reference', 'Internal Part Number', 'Description' ];
const downOption = [ 'part no', 'qty', 'Manufacturer', 'Price', 'Description' ];
class ToolTip extends Component {
	constructor(props) {
		super(props);
		this.state = {
			value: props.num,
			downOption: props.downOption,
			num: props.num - 1,
			filename: 'sample octo.xslx'
		};
	}
	componentWillReceiveProps(props) {
		this.setState({ downOption: props.downOption, num: props.num - 1 });
	}

	handleChange = (event, index, value) => {
		if (value == 0) this.props.onChange('');
		else this.props.onChange(this.state.downOption[value - 1]);
		this.setState({ value });
	};
	render() {
		return (
			<div class="choose-column-tooltip">
				<div>
					<div class="prompt">
						<div class="instructions">
							<span>Choose the column from your file to use for the </span>
							<span class="column-name">{options[this.state.num]}</span>
							<span> column.</span>
						</div>
						<div class="filename">{this.state.filename}</div>
					</div>
					<form>
						<div class="column-select-container">
							<div class="column-select">
								<DropDownMenu
									style={{
										backgroundColor: 'rgb(85,85,85)',
										height: 25,
										border: '1px solid rgba(122, 122, 122, 1)'
									}}
									labelStyle={{ color: 'white', position: 'relative', top: '-15px' }}
									iconStyle={{ top: '-10px', width: '25px' }}
									underlineStyle={{ borderTop: '0px solid rgba(0, 0, 0, 0)' }}
									value={this.state.value}
									onChange={this.handleChange}
								>
									{this.state.num != 0 && <MenuItem value={0} primaryText="[skip this column]" />}
									{this.state.downOption.map((val, id) => (
										<MenuItem value={id + 1} primaryText={this.state.downOption[id]} />
									))}
								</DropDownMenu>
							</div>
						</div>
						<div class="step-controls">
							<div class="step">
								<span>Step </span>
								<span>{this.state.num + 1}</span>
								<span> of </span>
								<span>5</span>
							</div>
							<div class="controls">
								{this.state.num != 0 && (
									<a class="back" href="#" onClick={this.props.onBack}>
										<span>Back</span>
									</a>
								)}
								<a class="next" href="#" onClick={this.props.onNext}>
									<span>Next</span>
								</a>
								<a class="done" href="#" onClick={this.props.onDone}>
									Done
								</a>
							</div>
						</div>
					</form>
				</div>
			</div>
		);
	}
}

export default ToolTip;
