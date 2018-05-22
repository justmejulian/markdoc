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
    this.popupClosed = true;
    this.isCollapsed = true;
  }

  setIsCollapsed() {
    this.isCollapsed = !this.isCollapsed;
  }

  setPopupClosed() {
    this.popupClosed = !this.popupClosed;
  }

  getPopupClosed() {
    return this.popupClosed;
  }

  getIsCollapsed() {
    return this.isCollapsed;
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
        this.hasTitlepage = action.text;
        this.emit('hasTitlepage_changed');
        break;
      case 'SET_HASHEADER':
        this.hasHeader = action.text;
        this.emit('hasHeader_changed');
        break;
      case 'SET_HASFOOTER':
        this.hasFooter = action.text;
        this.emit('hasFooter_changed');
        break;
      case 'SET_TITLE':
        this.title = action.text;
        this.emit('Title_changed');
        break;
      case 'SET_AUTHOR':
        this.author = action.text;
        this.emit('Author_changed');
        break;
      case 'SET_DATE':
        this.date = action.text.format('DD/MM/YYYY');
        this.emit('Date_changed');
        break;
      case 'SET_HEADER_LEFT':
        this.headerLeft = action.text;
        this.emit('Header_changed');
        break;
      case 'SET_HEADER_MIDDLE':
        this.headerMiddle = action.text;
        this.emit('Header_changed');
        break;
      case 'SET_HEADER_RIGHT':
        this.headerRight = action.text;
        this.emit('Header_changed');
        break;
      case 'SET_FOOTER_LEFT':
        this.footerLeft = action.text;
        this.emit('Footer_changed');
        break;
      case 'SET_FOOTER_MIDDLE':
        this.footerMiddle = action.text;
        this.emit('Footer_changed');
        break;
      case 'SET_FOOTER_RIGHT':
        this.footerRight = action.text;
        this.emit('Footer_changed');
        break;
      case 'SET_IS_COLLAPSED':
        this.setIsCollapsed();
        this.emit('isCollapsed_changed');
        break;
      case 'SET_POPUP_CLOSED':
        this.setPopupClosed();
        this.emit('popupClosed_changed');
        break;
    }
  }
}

const sidebarStore = new SidebarStore();
dispatcher.register(sidebarStore.handleActions.bind(sidebarStore));

export default sidebarStore;
