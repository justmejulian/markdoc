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

export function zoomIn() {
  dispatcher.dispatch({
    type: 'ZOOM_IN'
  });
}

export function zoomOut() {
  dispatcher.dispatch({
    type: 'ZOOM_OUT'
  });
}

export function zoomReset() {
  dispatcher.dispatch({
    type: 'ZOOM_RESET'
  });
}
