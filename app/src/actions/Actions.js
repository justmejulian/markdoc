import dispatcher from '../dispatcher';

export function setHTML(text) {
  dispatcher.dispatch({
    type: 'SET_HTML',
    text
  });
}

export function setMarkdown(text) {
  dispatcher.dispatch({
    type: 'SET_MARKDOWN',
    text
  });
}
