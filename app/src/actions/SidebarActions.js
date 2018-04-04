import dispatcher from '../dispatcher';

export function setTitle(text) {
  dispatcher.dispatch({
    type: 'SET_TITLE',
    text
  });
}

export function setAuthor(text) {
  dispatcher.dispatch({
    type: 'SET_AUHTOR',
    text
  });
}

export function setDate(text) {
  dispatcher.dispatch({
    type: 'SET_DATE',
    text
  });
}

export function setHeaderLeft(text) {
  dispatcher.dispatch({
    type: 'SET_HEADER_LEFT',
    text
  });
}
export function setHeaderMiddle(text) {
  dispatcher.dispatch({
    type: 'SET_HEADER_MIDDLE',
    text
  });
}
export function setHeaderRight(text) {
  dispatcher.dispatch({
    type: 'SET_HEADER_RIGHT',
    text
  });
}

export function setFooterLeft(text) {
  dispatcher.dispatch({
    type: 'SET_FOOTER_LEFT',
    text
  });
}

export function setFooterMiddle(text) {
  dispatcher.dispatch({
    type: 'SET_FOOTER_MIDDLE',
    text
  });
}
export function setFooterRight(text) {
  dispatcher.dispatch({
    type: 'SET_FOOTER_RIGHT',
    text
  });
}
