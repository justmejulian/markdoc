import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Titlepage from '../app/src/components/Titlepage.jsx';

import SidebarStore from '../app/src/stores/SidebarStore.js';

// Needed for tests
import { WordCounter } from '../app/src/js/wordcounter.js';
import * as SidebarActions from '../app/src/actions/SidebarActions';

Enzyme.configure({ adapter: new Adapter() });

describe('Test Titlepage', () => {
  it('should render without crashing', () => {
    const wrapper = shallow(<Titlepage visibility="true" />);
  });

  it('should get style on load', () => {
    const wrapper = shallow(<Titlepage visibility="none" />);
    const instance = wrapper.instance();
    instance.getStyle = jest.fn(); // make mock/spy
    wrapper.setProps({ visibility: 'none' });

    expect(instance.getStyle).toHaveBeenCalled();
  });

  it('should handleExpandOrCollapse on click in div', () => {
    const wrapper = shallow(<Titlepage visibility="none" />);
    const instance = wrapper.instance();
    SidebarActions.setIsCollapsed = jest.fn(); // make mock/spy

    const button = wrapper.find('#titlepage');

    button.simulate('click');

    expect(SidebarActions.setIsCollapsed).toHaveBeenCalled();
  });

  it('should add/remove listeners', () => {
    const wrapper = shallow(<Titlepage visibility="none" />);
    const instance = wrapper.instance();
    SidebarStore.on = jest.fn(); // make mock/spy
    SidebarStore.removeListener = jest.fn();

    instance.componentWillMount();
    expect(SidebarStore.on).toHaveBeenCalled();

    instance.componentWillUnmount();
    expect(SidebarStore.removeListener).toHaveBeenCalled();
  });

  it('should set new Info', () => {
    SidebarStore.getTitle = jest.fn(() => {
      return 'Test';
    });
    SidebarStore.getAuthor = jest.fn(() => {
      return 'Julian Visser';
    });
    SidebarStore.getDate = jest.fn(() => {
      return '17.07.1994';
    });
    const wrapper = shallow(<Titlepage visibility="none" />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.setInfo();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      author: 'Julian Visser',
      date: '17.07.1994',
      title: 'Test'
    });
  });
});
