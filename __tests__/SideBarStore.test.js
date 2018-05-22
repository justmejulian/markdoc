import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Store from '../app/src/stores/SidebarStore.js';

Enzyme.configure({ adapter: new Adapter() });

// needed to test Date
import moment from 'moment';

describe('This test in SidebarActions tests the Action Handler and ', () => {
  it('should handle SET_HASTITLEPAGE.', function() {
    // Mock the action
    var action = {
      type: 'SET_HASTITLEPAGE',
      text: true
    };
    Store.handleActions(action);
    expect(Store.hasTitlepage).toEqual(true);
  });

  it('should handle SET_HASHEADER.', function() {
    // Mock the action
    var action = {
      type: 'SET_HASHEADER',
      text: true
    };

    Store.handleActions(action);

    expect(Store.hasHeader).toEqual(true);
  });

  it('should handle SET_HASFOOTER.', function() {
    // Mock the action
    var action = {
      type: 'SET_HASFOOTER',
      text: true
    };
    Store.handleActions(action);

    expect(Store.hasFooter).toEqual(true);
  });

  it('should handle SET_TITLE.', function() {
    // Mock the action
    var action = {
      type: 'SET_TITLE',
      text: 'Julian Visser'
    };

    Store.handleActions(action);

    expect(Store.title).toEqual('Julian Visser');
  });

  it('should handle SET_AUTHOR.', function() {
    // Mock the action
    var action = {
      type: 'SET_AUTHOR',
      text: 'Julian Visser'
    };

    Store.handleActions(action);

    expect(Store.author).toEqual('Julian Visser');
  });

  it('should handle SET_DATE.', function() {
    // Mock the action
    var action = {
      type: 'SET_DATE',
      text: '17.07.1994'
    };

    Store.handleActions(action);

    expect(Store.date).toEqual('17.07.1994');
  });

  it('should handle SET_HEADER_LEFT.', function() {
    // Mock the action
    var action = {
      type: 'SET_HEADER_LEFT',
      text: 'Julian Visser'
    };

    Store.handleActions(action);

    expect(Store.headerLeft).toEqual('Julian Visser');
  });

  it('should handle SET_HEADER_RIGHT.', function() {
    // Mock the action
    var action = {
      type: 'SET_HEADER_RIGHT',
      text: 'Julian Visser'
    };

    Store.handleActions(action);

    expect(Store.headerRight).toEqual('Julian Visser');
  });

  it('should handle SET_HEADER_MIDDLE.', function() {
    // Mock the action
    var action = {
      type: 'SET_HEADER_MIDDLE',
      text: 'Julian Visser'
    };

    Store.handleActions(action);

    expect(Store.headerMiddle).toEqual('Julian Visser');
  });

  it('should handle SET_FOOTER_LEFT.', function() {
    // Mock the action
    var action = {
      type: 'SET_FOOTER_LEFT',
      text: 'Julian Visser'
    };

    Store.handleActions(action);

    expect(Store.footerLeft).toEqual('Julian Visser');
  });

  it('should handle SET_FOOTER_RIGHT.', function() {
    // Mock the action
    var action = {
      type: 'SET_FOOTER_RIGHT',
      text: 'Julian Visser'
    };

    Store.handleActions(action);

    expect(Store.footerRight).toEqual('Julian Visser');
  });

  it('should handle SET_FOOTER_MIDDLE.', function() {
    // Mock the action
    var action = {
      type: 'SET_FOOTER_MIDDLE',
      text: 'Julian Visser'
    };

    Store.handleActions(action);
    expect(Store.footerMiddle).toEqual('Julian Visser');
  });

  it('should handle SET_IS_COLLAPSED.', function() {
    // Mock the action
    var action = {
      type: 'SET_IS_COLLAPSED'
    };

    Store.setIsCollapsed = jest.fn();

    Store.handleActions(action);

    expect(Store.setIsCollapsed).toHaveBeenCalled();
  });

  it('should handle SET_POPUP_CLOSED.', function() {
    // Mock the action
    var action = {
      type: 'SET_POPUP_CLOSED'
    };

    Store.setPopupClosed = jest.fn();

    Store.handleActions(action);

    expect(Store.setPopupClosed).toHaveBeenCalled();
  });
});

describe('This test in SidebarActions', () => {
  it('should set and return HasTitlepage.', function() {
    Store.hasTitlepage = true;
    var value = Store.getHasTitlepage();
    expect(value).toEqual(true);
  });

  it('should set and return HasHeader.', function() {
    Store.hasHeader = true;
    var value = Store.getHasHeader();
    expect(value).toEqual(true);
  });

  it('should set and return HasFooter.', function() {
    Store.hasFooter = true;
    var value = Store.getHasFooter();
    expect(value).toEqual(true);
  });

  it('should set and return Title.', function() {
    Store.title = 'Test';
    var value = Store.getTitle();
    expect(value).toEqual('Test');
  });

  it('should set and return Author.', function() {
    Store.author = 'Julian Visser';
    var value = Store.getAuthor();
    expect(value).toEqual('Julian Visser');
  });

  it('should set and return Date.', function() {
    Store.date = '17.07.1994';
    var value = Store.getDate();
    expect(value).toEqual('17.07.1994');
  });

  it('should set and return HeaderLeft.', function() {
    Store.headerLeft = 'Julian Visser';
    var value = Store.getHeaderLeft();
    expect(value).toEqual('Julian Visser');
  });

  it('should set and return HeaderRight.', function() {
    Store.headerRight = 'Julian Visser';
    var value = Store.getHeaderRight();
    expect(value).toEqual('Julian Visser');
  });

  it('should set and return HeaderMiddle.', function() {
    Store.headerMiddle = 'Julian Visser';
    var value = Store.getHeaderMiddle();
    expect(value).toEqual('Julian Visser');
  });

  it('should set and return FooterLeft.', function() {
    Store.footerLeft = 'Julian Visser';
    var value = Store.getFooterLeft();
    expect(value).toEqual('Julian Visser');
  });

  it('should set and return FooterRight.', function() {
    Store.footerRight = 'Julian Visser';
    var value = Store.getFooterRight();
    expect(value).toEqual('Julian Visser');
  });

  it('should set and return FooterMiddle.', function() {
    Store.footerMiddle = 'Julian Visser';
    var value = Store.getFooterMiddle();
    expect(value).toEqual('Julian Visser');
  });

  it('should flip boolean and return IsCollapsed.', function() {
    this.isCollapsed = true;
    var value = Store.getIsCollapsed();
    expect(value).toEqual(true);
  });

  it('should flip boolean and return PopupClosed.', function() {
    this.popupClosed = true;
    var value = Store.getPopupClosed();
    expect(value).toEqual(true);
  });
});
