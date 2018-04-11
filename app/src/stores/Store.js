import { EventEmitter } from 'events';
import { MDDOM } from '../js/markdown.js';

import dispatcher from '../dispatcher';

class Store extends EventEmitter {
  constructor() {
    super();
    this.markdown = '';
    this.html = '';
    this.title = '';
    this.author = '';
    this.date = '';
    this.headerLeft = 'Zusammenfassung';
    this.headerMiddle = 'PSIT';
    this.headerRight = 'Max Muster';
    this.footerLeft = '';
    this.footerMiddle = '';
    this.footerRight = '';
  }

  setMarkdown(text) {
    this.markdown = text;
  }

  setHTML(markdown) {
    this.html = MDDOM.parse(markdown).toHtml();
  }

  setTitle(title) {
    this.title = title;
  }

  setAuthor(author) {
    this.author = author;
  }

  setDate(date) {
    this.date = date;
  }

  setHeaderLeft(tex) {
    this.headerLeft = tex;
  }

  setHeaderMiddle(text) {
    this.headerMiddle = text;
  }

  setHeaderRight(text) {
    this.headerRight = text;
  }

  setFooterLeft(tex) {
    this.footerLeft = tex;
  }

  setFooterMiddle(text) {
    this.footerMiddle = text;
  }

  setFooterRight(text) {
    this.footerRight = text;
  }

  getHTML() {
    return this.html;
  }

  getTitle() {
    return this.title;
  }

  getMarkdown() {
    return this.markdown;
  }

  getAuthor() {
    return this.author;
  }

  getDate() {
    return this.date;
  }

  getHeaderLeft() {
    return this.headerLeft;
  }

  getHeaderMiddle() {
    return this.headerMiddle;
  }

  getHeaderRight() {
    return this.headerRight;
  }

  getFooterLeft() {
    return this.footerLeft;
  }

  getFooterMiddle() {
    return this.footerMiddle;
  }

  getFooterRight() {
    return this.footerRight;
  }

  handleActions(action) {
    switch (action.type) {
      case 'SET_HTML':
        this.setMarkdown(action.text);
        this.setHTML(this.markdown);
        this.emit('HTML_changed');
        break;
      case 'SET_TITLE':
        this.setTitle(action.text);
        this.emit('Title_changed');
        break;
      case 'SET_AUHTOR':
        this.setAuthor(action.text);
        this.emit('Author_changed');
        break;
      case 'SET_DATE':
        this.setDate(action.text);
        this.setHTML(this.markdown);
        this.emit('Date_changed');
        break;
      case 'SET_HEADER_LEFT':
        this.setHeaderLeft(action.text);
        this.emit('Header_changed');
        break;
      case 'SET_HEADER_MIDDLE':
        this.setHeaderMiddle(action.text);
        this.emit('Header_changed');
        break;
      case 'SET_HEADER_RIGHT':
        this.setHeaderRight(action.text);
        this.emit('Header_changed');
        break;
      case 'SET_FOOTER_LEFT':
        this.setFooterLeft(action.text);
        this.emit('Footer_changed');
        break;
      case 'SET_FOOTER_MIDDLE':
        this.setFooterMiddle(action.text);
        this.emit('Footer_changed');
        break;
      case 'SET_FOOTER_RIGHT':
        this.setFooterRight(action.text);
        this.emit('Footer_changed');
        break;
    }
  }
}

const store = new Store();
dispatcher.register(store.handleActions.bind(store));

export default store;
