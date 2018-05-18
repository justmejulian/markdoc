import { EventEmitter } from 'events';
import { DOM } from '../js/markdown.js';

import dispatcher from '../dispatcher';

class PagesStore extends EventEmitter {
  constructor() {
    super();
    this.markdown = '';
    this.html = '';
    this.zoom = 1;
    this.handleZoomIn = this.handleZoomIn.bind(this);
  }

  setHTML(markdown) {
    this.html = DOM.parse(markdown).toHtml();
  }

  getHTML() {
    return this.html;
  }

  getMarkdown() {
    return this.markdown;
  }

  getZoom() {
    return this.zoom;
  }

  handleZoomIn() {
    if (this.zoom < 1.7) {
      //If not: Silently do nothing.
      this.zoom += 0.1;
    }
  }

  handleZoomOut() {
    if (this.zoom > 0.5) {
      //If not: Silently do nothing.
      this.zoom -= 0.1;
    }
  }

  handleZoomReset() {
    this.zoom = 1.0;
  }

  handleActions(action) {
    switch (action.type) {
      case 'SET_HTML':
        this.setHTML(this.markdown);
        this.emit('HTML_changed');
        break;
      case 'SET_MARKDOWN':
        this.markdown = action.text;
        this.emit('Markdown_changed');
        break;
      case 'ZOOM_IN':
        this.handleZoomIn();
        this.emit('Zoom_changed');
        break;
      case 'ZOOM_OUT':
        this.handleZoomOut();
        this.emit('Zoom_changed');
        break;
      case 'ZOOM_RESET':
        this.handleZoomReset();
        this.emit('Zoom_changed');
    }
  }
}

const pagesStore = new PagesStore();
dispatcher.register(pagesStore.handleActions.bind(pagesStore));

export default pagesStore;
