import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import TableMaker from '../app/src/components/TableMaker.jsx';

import Store from '../app/src/stores/SidebarStore.js';

Enzyme.configure({ adapter: new Adapter() });

describe('Test tableMaker', () => {
  var tableMaker;
  var instance;

  beforeEach(() => {
    tableMaker = shallow(<TableMaker popupClosed={false} />);
    instance = tableMaker.instance();
  });

  it('handles checkbox changes correctly', () => {
    expect(tableMaker.state().topRowIsHeader).toBeFalsy();
    var target = {
      name: 'topRowIsHeader',
      checked: true
    };
    instance.handleCheckboxChange(target);
    expect(tableMaker.state().topRowIsHeader).toBeTruthy();
  });

  it('handles field changes correctly', () => {
    var target = {
      name: 'rows',
      value: 274658732
    };
    instance.handleFieldChange(target);
    expect(tableMaker.state().rows).toEqual([274658732]);
    target = {
      name: 'columns',
      value: 999
    };
    instance.handleFieldChange(target);
    expect(tableMaker.state().columns).toEqual([999]);
  });

  it('sets popupClosed in store', () => {
    expect(Store.getPopupClosed()).toBeFalsy();
    Store.setPopupClosed();
    expect(Store.getPopupClosed()).toBeTruthy();
  });

  it('resets its state to 3, 3, false, and true with resetState()', () => {
    tableMaker.setState({
      rows: 309,
      columns: 201,
      topRowIsHeader: true
    });
    instance.resetState();
    expect(tableMaker.state()).toEqual({
      rows: 3,
      columns: 3,
      tableHTML: '',
      topRowIsHeader: false
    });
    expect(Store.getPopupClosed).toBeTruthy(); //This is the default value, but it's set to false as part of the test, so it too must be reset.
  });

  it('has default values 3, 3, no header, popup open', () => {
    expect(tableMaker.state().rows).toBe(3);
    expect(tableMaker.state().columns).toBe(3);
    expect(tableMaker.state().topRowIsHeader).toBeFalsy();
    expect(Store.getPopupClosed()).toBeFalsy();
  });

  it('properly generates a 3x3 table', () => {
    expect(tableMaker.state().tableHTML).toBe('');
    instance.createTable();
    expect(tableMaker.state().tableHTML).toBe(
      '<table><tr><td>1:1</td><td>1:2</td><td>1:3</td></tr><tr><td>2:1</td><td>2:2</td><td>2:3</td></tr><tr><td>3:1</td><td>3:2</td><td>3:3</td></tr></table>'
    );
  });

  it('does nothing if rows or columns field is 0', () => {
    expect(tableMaker.state().tableHTML).toBe('');
    tableMaker.setState({ rows: 0 });
    instance.createTable();
    expect(tableMaker.state().tableHTML).toBe('');
    tableMaker.setState({ rows: 3, columns: 0 });
    instance.createTable();
    expect(tableMaker.state().tableHTML).toBe('');
  });

  it('sets top row as header when that is selected', () => {
    expect(tableMaker.state().tableHTML).toBe('');
    tableMaker.setState({ topRowIsHeader: true });
    instance.createTable();
    expect(tableMaker.state().tableHTML).toBe(
      '<table><tr><th>1:1</th><th>1:2</th><th>1:3</th></tr><tr><td>2:1</td><td>2:2</td><td>2:3</td></tr><tr><td>3:1</td><td>3:2</td><td>3:3</td></tr></table>'
    );
  });

  it("does absolutely nothing on refreshComponent and this test is pointless because it's part of another function that is being tested.", () => {
    var state = tableMaker.state();
    instance.refreshComponent();
    expect(tableMaker.state()).toEqual(state);
  });

  it('sets up an event listener for popupClosed_changed on willMount', () => {
    Store.on = jest.fn();
    instance.componentWillMount();
    expect(Store.on).toHaveBeenCalled();
    expect(Store.on).toHaveBeenCalledWith(
      'popupClosed_changed',
      instance.refreshComponent
    );
  });

  it('removes the event listener for popupClosed_changed on willUnmount', () => {
    Store.removeListener = jest.fn();
    instance.componentWillUnmount();
    expect(Store.removeListener).toHaveBeenCalled();
    expect(Store.removeListener).toHaveBeenCalledWith(
      'popupClosed_changed',
      instance.refreshComponent
    );
  });

  it('handles the popup closing. This is the most useless test.', () => {
    instance.createTable = jest.fn();
    instance.resetState = jest.fn();
    instance.handlePopupClosing();
    expect(instance.createTable).toHaveBeenCalled();
    expect(instance.resetState).toHaveBeenCalled();
  });
});
