import dispatcher from '../dispatcher';

export function setHTML(text) {
  dispatcher.dispatch({
    type: 'SET_HTML',
    text
  });
}
