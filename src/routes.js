import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Layout } from './secComponents/Layout/Layout';
import { SignUp } from './secComponents/Signup/Signup';
import { Login } from './secComponents/Login/Login';
import { BomTable } from './secComponents/BomTable/BomTable';
import { BomList } from './secComponents/BomList/BomList';
import { VendorTable } from './secComponents/VendorTable/VendorTable';
import { VendorList } from './secComponents/VendorList/VendorList';
import { CallBack } from './secComponents/CallBack/CallBack';
import { Private } from './Guards/Private/Private.js';

export const Routes = () => (
	<Router>
		<Switch>
			<Route exact path="/" component={ Layout } />
			<Route exact path="/callback" component={ CallBack } />
			<Route exact path="/signup" component={ SignUp } />
			<Route exact path="/login" component={ Login } />
			<Private>
				<Route exact path="/bom" component={ BomList } />
				<Route exact path="/bom/:bomId" component={ BomTable } />
				<Route exact path="/vendor" component={ VendorList } />
				<Route exact path="/vendor/:vendorId" component={ VendorTable } />
			</Private>
		</Switch>
	</Router>
);
