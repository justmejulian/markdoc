import { EventEmitter } from 'events';
import { MDDOM } from '../js/markdown.js';

import dispatcher from '../dispatcher';

class PagesStore extends EventEmitter {
  constructor() {
    super();
    this.markdown = '';
    this.html = '';
  }

  setMarkdown(text) {
    this.markdown = text;
  }

  setHTML(markdown) {
    this.html = MDDOM.parse(markdown).toHtml();
  }

  getHTML() {
    return this.html;
  }

  getMarkdown() {
    return this.markdown;
  }

  handleActions(action) {
    switch (action.type) {
      case 'SET_HTML':
        this.setMarkdown(action.text);
        this.setHTML(this.markdown);
        this.emit('HTML_changed');
        break;
    }
  }
}

const pagesStore = new PagesStore();
dispatcher.register(pagesStore.handleActions.bind(pagesStore));

export default pagesStore;
