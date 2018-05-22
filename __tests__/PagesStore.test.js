import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import PagesStore from '../app/src/stores/PagesStore.js';

Enzyme.configure({ adapter: new Adapter() });

// needed to test Date
import { DOM } from '../app/src/js/markdown.js';

describe('This test in PageStore tests the Action Handler and ', () => {
  it('should handle SET_MARKDOWN.', function() {
    // Mock the action
    var action = {
      type: 'SET_MARKDOWN',
      text: '#Test'
    };
    PagesStore.setMarkdown = jest.fn();

    PagesStore.handleActions(action);
    expect(PagesStore.markdown).toEqual('#Test');
  });

  it('should handle SET_HTML.', function() {
    // Mock the action
    var action = {
      type: 'SET_HTML'
    };

    PagesStore.markdown = '#Test';
    PagesStore.setHTML = jest.fn();

    PagesStore.handleActions(action);

    expect(PagesStore.setHTML).toHaveBeenCalled();
    expect(PagesStore.setHTML).toHaveBeenCalledWith('#Test');
  });

  it('should handle ZOOM_IN.', function() {
    // Mock the action
    var action = {
      type: 'ZOOM_IN'
    };
    PagesStore.handleZoomIn = jest.fn();

    PagesStore.handleActions(action);

    expect(PagesStore.handleZoomIn).toHaveBeenCalled();
  });

  it('should handle ZOOM_OUT.', function() {
    // Mock the action
    var action = {
      type: 'ZOOM_OUT'
    };
    PagesStore.handleZoomOut = jest.fn();

    PagesStore.handleActions(action);

    expect(PagesStore.handleZoomOut).toHaveBeenCalled();
  });

  it('should handle ZOOM_RESET.', function() {
    // Mock the action
    var action = {
      type: 'ZOOM_RESET'
    };
    PagesStore.handleZoomReset = jest.fn();

    PagesStore.handleActions(action);

    expect(PagesStore.handleZoomReset).toHaveBeenCalled();
  });
});

describe('This test in SidebarActions', () => {
  it('should set and return HTML.', function() {
    PagesStore.html = '<h1> Julian </h1>';
    const value = PagesStore.getHTML();
    expect(value).toEqual('<h1> Julian </h1>');
  });

  it('should set and return markdown.', function() {
    PagesStore.markdown = '# Julian';
    const value = PagesStore.getMarkdown();
    expect(value).toEqual('# Julian');
  });

  it('should set and return HTML.', function() {
    PagesStore.zoom = 1;
    const value = PagesStore.getZoom();
    expect(value).toEqual(1);
  });
});
