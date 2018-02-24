import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';

import bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './secComponents/main.css';
import './lib/csv';

import { Routes } from './routes';


ReactDOM.render(<Routes />, document.getElementById('root'));
registerServiceWorker();
