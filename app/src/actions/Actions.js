import dispatcher from '../dispatcher';
import { ipcRenderer } from 'electron';

export function setHTML(text) {
  dispatcher.dispatch({
    type: 'SET_HTML',
    text
  });
}
