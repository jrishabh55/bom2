import React, { Component } from 'react';
import Dialog from 'material-ui/Dialog';

var FontAwesome = require('react-fontawesome');

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
		);
	}
}

export default ToolTip;
