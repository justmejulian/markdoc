import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Sidebar from '../app/src/components/Sidebar.jsx';

Enzyme.configure({ adapter: new Adapter() });

// Needed to test the setters
import SidebarStore from '../app/src/stores/SidebarStore.js';
import * as SidebarActions from '../app/src/actions/SidebarActions.js';
import moment from 'moment';
import DatePicker from 'react-datepicker';

describe('Test Sidebar', () => {
  it('should render without crashing', () => {
    const wrapper = shallow(<Sidebar />);
  });

  it('prepare the date so you can pass is to moemnt', () => {
    SidebarStore.getDate = jest.fn(() => {
      return '17/07/1994';
    });
    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    const value = instance._prepareDate('17/07/1994');

    expect(value).toEqual('1994-07-17');
  });

  it('should handle when title field changes', () => {
    SidebarActions.setAuthor = jest.fn();
    // Mock a target
    var target = {
      name: 'author',
      value: 'Julian'
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleFieldChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      author: ['Julian']
    });
    expect(SidebarActions.setAuthor).toHaveBeenCalled();
    expect(SidebarActions.setAuthor).toHaveBeenCalledWith('Julian');
  });

  it('should handle when author field changes', () => {
    SidebarActions.setTitle = jest.fn();
    // Mock a target
    var target = {
      name: 'title',
      value: 'PSIT'
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleFieldChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      title: ['PSIT']
    });
    expect(SidebarActions.setTitle).toHaveBeenCalled();
    expect(SidebarActions.setTitle).toHaveBeenCalledWith('PSIT');
  });

  it('should handle when HeaderRight field changes', () => {
    SidebarActions.setHeaderRight = jest.fn();
    // Mock a target
    var target = {
      name: 'headerRight',
      value: 'Right'
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleFieldChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      headerRight: ['Right']
    });
    expect(SidebarActions.setHeaderRight).toHaveBeenCalled();
    expect(SidebarActions.setHeaderRight).toHaveBeenCalledWith('Right');
  });

  it('should handle when headerMiddle field changes', () => {
    SidebarActions.setHeaderMiddle = jest.fn();
    // Mock a target
    var target = {
      name: 'headerMiddle',
      value: 'Middle'
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleFieldChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      headerMiddle: ['Middle']
    });
    expect(SidebarActions.setHeaderMiddle).toHaveBeenCalled();
    expect(SidebarActions.setHeaderMiddle).toHaveBeenCalledWith('Middle');
  });

  it('should handle when headerLeft field changes', () => {
    SidebarActions.setHeaderLeft = jest.fn();
    // Mock a target
    var target = {
      name: 'headerLeft',
      value: 'Left'
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleFieldChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      headerLeft: ['Left']
    });
    expect(SidebarActions.setHeaderLeft).toHaveBeenCalled();
    expect(SidebarActions.setHeaderLeft).toHaveBeenCalledWith('Left');
  });

  it('should handle when footerRight field changes', () => {
    SidebarActions.setFooterRight = jest.fn();
    // Mock a target
    var target = {
      name: 'footerRight',
      value: 'Right'
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleFieldChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      footerRight: ['Right']
    });
    expect(SidebarActions.setFooterRight).toHaveBeenCalled();
    expect(SidebarActions.setFooterRight).toHaveBeenCalledWith('Right');
  });

  it('should handle when footerMiddle field changes', () => {
    SidebarActions.setFooterMiddle = jest.fn();
    // Mock a target
    var target = {
      name: 'footerMiddle',
      value: 'Middle'
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleFieldChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      footerMiddle: ['Middle']
    });
    expect(SidebarActions.setFooterMiddle).toHaveBeenCalled();
    expect(SidebarActions.setFooterMiddle).toHaveBeenCalledWith('Middle');
  });

  it('should handle when footerLeft field changes', () => {
    SidebarActions.setFooterLeft = jest.fn();
    // Mock a target
    var target = {
      name: 'footerLeft',
      value: 'Left'
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleFieldChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      footerLeft: ['Left']
    });
    expect(SidebarActions.setFooterLeft).toHaveBeenCalled();
    expect(SidebarActions.setFooterLeft).toHaveBeenCalledWith('Left');
  });

  it('should handle Checkbox changes for hasTitlepage', () => {
    SidebarActions.setHasTitlepage = jest.fn();
    // Mock a target
    var target = {
      name: 'hasTitlepage',
      checked: true
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleCheckboxChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      hasTitlepage: true
    });
    expect(SidebarActions.setHasTitlepage).toHaveBeenCalled();
    expect(SidebarActions.setHasTitlepage).toHaveBeenCalledWith(true);

    target = {
      name: 'hasTitlepage',
      checked: false
    };

    instance.handleCheckboxChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      hasTitlepage: false
    });
    expect(SidebarActions.setHasTitlepage).toHaveBeenCalled();
    expect(SidebarActions.setHasTitlepage).toHaveBeenCalledWith(false);
  });

  it('should handle Checkbox changes for hasHeader', () => {
    SidebarActions.setHasHeader = jest.fn();
    // Mock a target
    var target = {
      name: 'hasHeader',
      checked: true
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleCheckboxChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      hasHeader: true
    });
    expect(SidebarActions.setHasHeader).toHaveBeenCalled();
    expect(SidebarActions.setHasHeader).toHaveBeenCalledWith(true);

    target = {
      name: 'hasHeader',
      checked: false
    };

    instance.handleCheckboxChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      hasHeader: false
    });
    expect(SidebarActions.setHasHeader).toHaveBeenCalled();
    expect(SidebarActions.setHasHeader).toHaveBeenCalledWith(false);
  });

  it('should handle Checkbox changes for hasFooter', () => {
    SidebarActions.setHasFooter = jest.fn();
    // Mock a target
    var target = {
      name: 'hasFooter',
      checked: true
    };

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleCheckboxChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      hasFooter: true
    });
    expect(SidebarActions.setHasFooter).toHaveBeenCalled();
    expect(SidebarActions.setHasFooter).toHaveBeenCalledWith(true);

    target = {
      name: 'hasFooter',
      checked: false
    };

    instance.handleCheckboxChange(target);

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      hasFooter: false
    });
    expect(SidebarActions.setHasFooter).toHaveBeenCalled();
    expect(SidebarActions.setHasFooter).toHaveBeenCalledWith(false);
  });

  it('should handle Hover', () => {
    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.handleMouseHover();

    // Get the current state
    var isHovering = instance.state.isHovering;

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      isHovering: !isHovering
    });
  });

  it('should set hasHeader', () => {
    SidebarStore.getHasHeader = jest.fn(() => {
      return true;
    });
    const wrapper = shallow(<Sidebar />);
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
    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setHasFooter();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      hasFooter: true
    });
  });

  it('should set Title', () => {
    SidebarStore.getTitle = jest.fn(() => {
      return 'PSIT';
    });
    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setTitle();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      title: 'PSIT'
    });
  });

  it('should set Author', () => {
    SidebarStore.getAuthor = jest.fn(() => {
      return 'Julian';
    });
    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setAuthor();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      author: 'Julian'
    });
  });

  it('should set HasTitlepage', () => {
    SidebarStore.getHasTitlepage = jest.fn(() => {
      return true;
    });
    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setHasTitlepage();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      hasTitlepage: true
    });
  });

  it('should handle when to Expand / Collapse', () => {
    SidebarActions.setIsCollapsed = jest.fn(() => {
      return true;
    });

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy

    instance.handleExpandOrCollapse();

    expect(SidebarActions.setIsCollapsed).toHaveBeenCalled();
  });

  it('should set HeaderInfo', () => {
    SidebarStore.getHeaderLeft = jest.fn(() => {
      return 'Left';
    });
    SidebarStore.getHeaderMiddle = jest.fn(() => {
      return 'Middle';
    });
    SidebarStore.getHeaderRight = jest.fn(() => {
      return 'Right';
    });

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setHeaderInfo();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      headerLeft: 'Left',
      headerMiddle: 'Middle',
      headerRight: 'Right'
    });
  });

  it('should set FooterInfo', () => {
    SidebarStore.getFooterLeft = jest.fn(() => {
      return 'Left';
    });
    SidebarStore.getFooterMiddle = jest.fn(() => {
      return 'Middle';
    });
    SidebarStore.getFooterRight = jest.fn(() => {
      return 'Right';
    });

    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setFooterInfo();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      footerLeft: 'Left',
      footerMiddle: 'Middle',
      footerRight: 'Right'
    });
  });

  it('should set IsCollapsed', () => {
    SidebarStore.getIsCollapsed = jest.fn(() => {
      return true;
    });
    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setIsCollapsed();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      isCollapsed: true
    });
  });

  it('should set date', () => {
    SidebarStore.getDate = jest.fn(() => {
      return '17/07/1994';
    });
    const wrapper = shallow(<Sidebar />);
    const instance = wrapper.instance();
    instance.setState = jest.fn(); // make mock/spy
    instance.setDate();

    expect(instance.setState).toHaveBeenCalled();
    expect(instance.setState).toHaveBeenCalledWith({
      date: moment('1994-07-17')
    });
  });
});
