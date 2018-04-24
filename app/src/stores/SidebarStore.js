import { EventEmitter } from 'events';

import dispatcher from '../dispatcher';
import moment from 'moment';

class SidebarStore extends EventEmitter {
  constructor() {
    super();
    this.hasTitlepage = false;
    this.hasHeader = true;
    this.hasFooter = true;
    this.title = 'Title';
    this.author = 'Author';
    this.date = moment().format('DD/MM/YYYY');
    this.headerLeft = 'Zusammenfassung';
    this.headerMiddle = 'PSIT';
    this.headerRight = 'Max Muster';
    this.footerLeft = '';
    this.footerMiddle = '';
    this.footerRight = '';
  }

  setHasTitlepage(status) {
    this.hasTitlepage = status;
  }

  setHasHeader(status) {
    this.hasHeader = status;
  }

  setHasFooter(status) {
    this.hasFooter = status;
  }

  setTitle(title) {
    this.title = title;
  }

  setAuthor(author) {
    this.author = author;
  }

  setDate(date) {
    this.date = date.format('DD/MM/YYYY');
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

  getHasTitlepage() {
    return this.hasTitlepage;
  }

  getHasHeader() {
    return this.hasHeader;
  }

  getHasFooter() {
    return this.hasFooter;
  }

  getTitle() {
    return this.title;
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
      case 'SET_HASTITLEPAGE':
        this.setHasTitlepage(action.text);
        this.emit('hasTitlepage_changed');
        break;
      case 'SET_HASHEADER':
        this.setHasHeader(action.text);
        this.emit('hasHeader_changed');
        break;
      case 'SET_HASFOOTER':
        this.setHasFooter(action.text);
        this.emit('hasFooter_changed');
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

const sidebarStore = new SidebarStore();
dispatcher.register(sidebarStore.handleActions.bind(sidebarStore));

export default sidebarStore;
