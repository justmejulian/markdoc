import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Titlepage from '../app/src/components/Titlepage.jsx';

import PagesStore from '../app/src/stores/PagesStore.js';

import { WordCounter } from '../app/src/js/wordcounter.js';

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
});
