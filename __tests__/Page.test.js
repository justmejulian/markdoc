import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Page from '../app/src/components/Page.jsx';

import SidebarStore from '../app/src/stores/SidebarStore.js';

Enzyme.configure({ adapter: new Adapter() });

describe('Test Page', () => {
  it('should render without crashing', () => {
    const wrapper = shallow(<Page id="1" html="<h1> Julian <h1>" />);
  });

  it('should change id and __html on componentWillReceiveProps', () => {
    const wrapper = shallow(<Page id="1" html="<h1> Julian <h1>" />);

    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    wrapper.setProps({ html: '<h1> Visser <h1>', id: 2 });

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      __html: { __html: '<h1> Visser <h1>' },
      id: 2
    });
  });

  it('should create __html out of html using createMarkup', () => {
    const wrapper = shallow(<Page id="1" html="<h1> Julian <h1>" />);

    const instance = wrapper.instance();
    const __html = instance.createMarkup('<h1> Visser <h1>');
    expect(__html).toEqual({ __html: '<h1> Visser <h1>' });
  });

  it('should change the height value using callback', () => {
    // Mock the callback function
    const handleHeight = jest.fn();
    const wrapper = shallow(
      <Page
        id="1"
        html="<h1> Julian <h1>"
        handleHeight={handleHeight.bind(this)}
      />
    );

    const instance = wrapper.instance();

    instance.handleHeight('42', '1');

    expect(handleHeight).toHaveBeenCalled();
    expect(handleHeight).toHaveBeenCalledWith('42', '1');
  });

  it('should set hasHeader', () => {
    SidebarStore.getHasHeader = jest.fn(() => {
      return true;
    });
    const wrapper = shallow(<Page id="1" html="<h1> Julian <h1>" />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setHasHeader();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      hasHeader: true
    });
  });

  it('should set hasFooter', () => {
    SidebarStore.getHasFooter = jest.fn(() => {
      return true;
    });
    const wrapper = shallow(<Page id="1" html="<h1> Julian <h1>" />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setHasFooter();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      hasFooter: true
    });
  });
});
