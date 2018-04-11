import React from 'react';
import { shallow, mount, render } from 'enzyme';
import App from '../app/src/App.jsx';

describe('Button', () => {
  it('should be defined', () => {
    expect(Button).toBeDefined();
  });
  it('should render correctly', () => {
    const tree = shallow(<Button name="button test" />);
    expect(tree).toMatchSnapshot();
  });
});
