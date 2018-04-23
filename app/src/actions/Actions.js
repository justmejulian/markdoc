import dispatcher from '../dispatcher';

export function setHTML() {
  dispatcher.dispatch({
    type: 'SET_HTML'
  });
}

export function setMarkdown(text) {
  dispatcher.dispatch({
    type: 'SET_MARKDOWN',
    text
  });
}
