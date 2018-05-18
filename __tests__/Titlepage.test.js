import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Titlebar from '../app/src/components/Titlebar.jsx';

import PagesStore from '../app/src/stores/PagesStore.js';

import { WordCounter } from '../app/src/js/wordcounter.js';

Enzyme.configure({ adapter: new Adapter() });

describe('Test Titlepage', () => {
  it('should set words', () => {
    const wrapper = shallow(<Titlebar />);
    const instance = wrapper.instance();

    instance.setState = jest.fn(); // make mock/spy
    PagesStore.getHasFooter = jest.fn();
    WordCounter.countWords = jest.fn();
    instance.getWords();

    expect(instance.setState).toHaveBeenCalled();
  });
});
