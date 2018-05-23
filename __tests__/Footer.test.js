import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Footer from '../app/src/components/Footer.jsx';

import SidebarStore from '../app/src/stores/SidebarStore.js';

Enzyme.configure({ adapter: new Adapter() });

describe('Test Footer', () => {
  it('should render without crashing', () => {
    const wrapper = shallow(<Footer pageNumber="1" />);
  });
  it('should change pagenumber on componentWillReceiveProps', () => {
    const wrapper = shallow(<Footer pageNumber="1" />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    wrapper.setProps({ pageNumber: 2 });

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({ pageNumber: 3 });
  });

  it('should change footer text', () => {
    SidebarStore.getFooterLeft = jest.fn(() => {
      return 'Zusammenfassung';
    });
    SidebarStore.getFooterMiddle = jest.fn(() => {
      return 'PSIT';
    });
    SidebarStore.getFooterRight = jest.fn(() => {
      return 'Julian Visser';
    });
    const wrapper = shallow(<Footer pageNumber="1" />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setFooterInfo();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      footerLeft: 'Zusammenfassung',
      footerMiddle: 'PSIT',
      footerRight: 'Julian Visser'
    });
  });

  it('should add/remove listeners', () => {
    const wrapper = shallow(<Footer pageNumber="1" />);
    const instance = wrapper.instance();
    SidebarStore.on = jest.fn(); // make mock/spy
    SidebarStore.removeListener = jest.fn();

    instance.componentWillMount();
    expect(SidebarStore.on).toHaveBeenCalled();

    instance.componentWillUnmount();
    expect(SidebarStore.removeListener).toHaveBeenCalled();
  });
});
