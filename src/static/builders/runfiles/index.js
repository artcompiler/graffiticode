import React from 'react';
import ReactDOM from 'react-dom';

import './before';
import './language-viewer.js';
import './language-style.css';

import data from './data.json';
import obj from './obj.json';

ReactDOM.render(
  <window.gcexports.viewer.Viewer id="graff-view" className="viewer" data={data} obj={obj} />,
  document.body.appendChild(document.createElement('div'))
);
