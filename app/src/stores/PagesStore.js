import { EventEmitter } from 'events';
import { MDDOM } from '../js/markdown.js';

import dispatcher from '../dispatcher';

class PagesStore extends EventEmitter {
  constructor() {
    super();
    this.markdown = '';
    this.html = '';
    this.zoom = 1;
  }

  setMarkdown(text) {
    this.markdown = text;
  }

  setHTML(markdown) {
    this.html = MDDOM.parse(markdown).toHtml();
  }

  setZoom(newZoom) {
    this.zoom = newZoom;
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
      var newZoom = this.zoom;
      newZoom += 0.1;
      this.setZoom(newZoom);
    }
  }

  handleZoomOut() {
    if (this.zoom > 0.5) {
      //If not: Silently do nothing.
      var newZoom = this.zoom;
      newZoom -= 0.1;
      this.setZoom(newZoom);
    }
  }

  handleActions(action) {
    switch (action.type) {
      case 'SET_HTML':
        this.setHTML(this.markdown);
        this.emit('HTML_changed');
        break;
      case 'SET_MARKDOWN':
        this.setMarkdown(action.text);
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
    }
  }
}

const pagesStore = new PagesStore();
dispatcher.register(pagesStore.handleActions.bind(pagesStore));

export default pagesStore;
