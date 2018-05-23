import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Header from '../app/src/components/Header.jsx';

import SidebarStore from '../app/src/stores/SidebarStore.js';

Enzyme.configure({ adapter: new Adapter() });

describe('Test Header', () => {
  it('should render without crashing', () => {
    const wrapper = shallow(<Header pageNumber="1" />);
  });
  it('should change pagenumber on componentWillReceiveProps', () => {
    const wrapper = shallow(<Header pageNumber="1" />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    wrapper.setProps({ pageNumber: 2 });

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({ pageNumber: 3 });
  });

  it('should change header text', () => {
    SidebarStore.getHeaderLeft = jest.fn(() => {
      return 'Zusammenfassung';
    });
    SidebarStore.getHeaderMiddle = jest.fn(() => {
      return 'PSIT';
    });
    SidebarStore.getHeaderRight = jest.fn(() => {
      return 'Julian Visser';
    });
    const wrapper = shallow(<Header pageNumber="1" />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setHeaderInfo();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      headerLeft: 'Zusammenfassung',
      headerMiddle: 'PSIT',
      headerRight: 'Julian Visser'
    });
  });

  it('should add/remove listeners', () => {
    const wrapper = shallow(<Header pageNumber="1" />);
    const instance = wrapper.instance();
    SidebarStore.on = jest.fn(); // make mock/spy
    SidebarStore.removeListener = jest.fn();

    instance.componentWillMount();
    expect(SidebarStore.on).toHaveBeenCalled();

    instance.componentWillUnmount();
    expect(SidebarStore.removeListener).toHaveBeenCalled();
  });
});
