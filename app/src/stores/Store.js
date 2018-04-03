import { EventEmitter } from 'events';
import { MDDOM } from '../js/markdown.js';

import dispatcher from '../dispatcher';

class Store extends EventEmitter {
  constructor() {
    super();
    this.markdown = 'Test';
    this.html = '';
    this.pages = [{ key: 0, html: '', height: 0 }];
    this.words = [];
    this.currentWord = 0;
    this.currentPage = 0;
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

  getWords() {
    return this.words;
  }

  getMarkdown() {
    return this.markdown;
  }

  handleActions(action) {
    switch (action.type) {
      case 'SET_HTML': {
        this.setMarkdown(action.text);
        this.setHTML(this.markdown);
        this.words = this.html.split(' ');
        console.log(this.words);
        this.emit('HTML_changed');
        break;
      }
    }
  }
}

const store = new Store();
dispatcher.register(store.handleActions.bind(store));

export default store;
