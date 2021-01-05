
import { id } from './obj.json';
import ReactDOM from 'react-dom';
import { decodeID, encodeID } from './../../../id'

const [langId] = decodeID(id);
document.title = `L${langId}`;

window.gcexports = {
  ReactDOM,
  compileCode: () => { throw new Error('not implemented'); },
  compileSrc: () => { throw new Error('not implemented'); },
  decodeID,
  dispatcher: null, // Not sure what to do here yet
  doneLoading: true,
  encodeID,
  id,
  language: `L${langId}`,
  refresh: false,
  view: 'static',
};
