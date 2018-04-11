import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Editor from '../app/src/components/Editor.jsx';
import Preview from '../app/src/components/Preview.jsx';
import Header from '../app/src/components/Header.jsx';
import Footer from '../app/src/components/Footer.jsx';

Enzyme.configure({ adapter: new Adapter() });

jest.mock('../app/src/dispatcher.js');

describe('Test Footer', () => {
  it('should set pageNumber in Footer', () => {
    const footer = shallow(<Footer pageNumber="1" />);
    footer.setState({ pageNumber: 1 });
    expect(footer.find('.hfCenter').text()).toEqual(' 1 ');
  });
});

describe('Test Header', () => {
  it('should set left text in header', () => {
    const header = shallow(<Header pageNumber="1" />);
    header.setState({ hfLeft: 'Zusammenfassung' });
    expect(header.find('.hfLeft').text()).toEqual(' Zusammenfassung ');
  });
});
