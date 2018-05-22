import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Store from '../app/src/stores/PagesStore.js';

Enzyme.configure({ adapter: new Adapter() });

describe('This test in SidebarActions tests the Action Handler and ', () => {
  it('should handle ZOOM_IN and ZOOM_RESET.', function() {
    // Mock the action
    var action = {
      type: 'ZOOM_IN'
    };
    Store.handleActions(action);
    expect(Store.zoom).toBeCloseTo(1.1);
    action = {
      type: 'ZOOM_RESET'
    };

    Store.handleActions(action);

    expect(Store.zoom).toBeCloseTo(1.0);
  });

  it('should handle ZOOM_OUT and ZOOM_RESET.', function() {
    // Mock the action
    var action = {
      type: 'ZOOM_OUT'
    };

    Store.handleActions(action);

    expect(Store.zoom).toBeCloseTo(0.9);

    action = {
      type: 'ZOOM_RESET'
    };

    Store.handleActions(action);

    expect(Store.zoom).toEqual(1.0);
  });

  it('should not go below zoom 0.5.', function() {
    // Mock the action
    var action = {
      type: 'ZOOM_OUT'
    };
    for (var i = 0; i < 20; i++) {
      Store.handleActions(action);
    }

    expect(Store.zoom).toBeCloseTo(0.5);
  });

  it('should not go above zoom 1.7.', function() {
    // Mock the action
    var action = {
      type: 'ZOOM_IN'
    };
    for (var i = 0; i < 20; i++) {
      Store.handleActions(action);
    }

    expect(Store.zoom).toBeCloseTo(1.7);
  });
});
