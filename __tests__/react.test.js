import React from 'react';
import Enzyme from 'enzyme';
import { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Editor from '../app/src/components/Editor.jsx';
import Preview from '../app/src/components/Preview.jsx';
import Sidebar from '../app/src/components/Sidebar.jsx';
import Header from '../app/src/components/Header.jsx';
import Footer from '../app/src/components/Footer.jsx';
import TableMaker from '../app/src/components/TableMaker.jsx';

Enzyme.configure({ adapter: new Adapter() });

jest.mock('../app/src/dispatcher.js');

//describe('Test Titlepage', () => {
//it('should set the title in the titlepage', () => {
//const header = shallow(<Header pageNumber="1" />);
//header.setState({ hfLeft: 'Zusammenfassung' });
//expect(header.find('.hfLeft').text()).toEqual(' Zusammenfassung ');
//});
//it('should set the author in the titlepage', () => {
//const header = shallow(<Header pageNumber="1" />);
//header.setState({ hfLeft: 'Zusammenfassung' });
//expect(header.find('.hfLeft').text()).toEqual(' Zusammenfassung ');
//});
//it('should set the date in the titlepage', () => {
//const header = shallow(<Header pageNumber="1" />);
//header.setState({ hfLeft: 'Zusammenfassung' });
//expect(header.find('.hfLeft').text()).toEqual(' Zusammenfassung ');
//});
//});

describe('Test Header', () => {
  it('should set left text in header', () => {
    const header = shallow(<Header pageNumber="1" />);
    header.setState({ hfLeft: 'Zusammenfassung' });
    expect(header.find('.hfLeft').text()).toEqual(' Zusammenfassung ');
  });

  it('should set middle text in header', () => {
    const header = shallow(<Header pageNumber="1" />);
    header.setState({ hfCenter: 'PSIT' });
    expect(header.find('.hfCenter').text()).toEqual(' PSIT ');
  });

  it('should set right text in header', () => {
    const header = shallow(<Header pageNumber="1" />);
    header.setState({ hfRight: 'Max Muster' });
    expect(header.find('.hfRight').text()).toEqual(' Max Muster ');
  });
});

describe('Test Footer', () => {
  it('should set left text in footer', () => {
    const footer = shallow(<Footer pageNumber="1" />);
    footer.setState({ hfLeft: 'Semester' });
    expect(footer.find('.hfLeft').text()).toEqual(' Semester ');
  });

  it('should set middle text in footer', () => {
    const footer = shallow(<Footer pageNumber="1" />);
    footer.setState({ hfCenter: '1' });
    expect(footer.find('.hfCenter').text()).toEqual(' 1 ');
  });

  it('should set right text in footer', () => {
    const footer = shallow(<Footer pageNumber="1" />);
    footer.setState({ hfRight: 'Kürzel' });
    expect(footer.find('.hfRight').text()).toEqual(' Kürzel ');
  });
});

describe('Test Zoom', () => {
  var preview;
  var inst;

  beforeEach(() => {
    preview = shallow(<Preview />);
    inst = preview.instance();
  });

  it('begins with zoom set to 1.0', () => {
    expect(preview.state().zoom).toBe(1);
    expect(preview.childAt(1).html()).toContain('zoom:1"');
  });

  it('does not zoom the zoom buttons', () => {
    expect(preview.find('#zoomButtonContainer').html()).not.toContain('zoom:');
  });

  it('can zoom in', () => {
    [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7].forEach(zoomLevel => {
      inst.handleZoomIn();
      preview.update();
      expect(preview.state().zoom).toBeCloseTo(zoomLevel);
      expect(preview.childAt(1).html()).toContain(
        'zoom:'.concat(zoomLevel.toString())
      );
    });
  });

  it('can zoom out', () => {
    [0.9, 0.8, 0.7, 0.6, 0.5].forEach(zoomLevel => {
      inst.handleZoomOut();
      preview.update();
      expect(preview.state().zoom).toBeCloseTo(zoomLevel);
      expect(preview.childAt(1).html()).toContain(
        'zoom:'.concat(zoomLevel.toString())
      );
    });
  });

  it("doesn't go below minimum zoom", () => {
    preview.setState({ zoom: 0.5 });
    inst.handleZoomOut();
    expect(preview.state().zoom).toBeCloseTo(0.5);
    expect(preview.childAt(1).html()).toContain('zoom:0.5');
  });

  it("doesn't go above maximum zoom", () => {
    preview.setState({ zoom: 1.7 });
    inst.handleZoomIn();
    expect(preview.state().zoom).toBeCloseTo(1.7);
    expect(preview.childAt(1).html()).toContain('zoom:1.7');
  });

  it('invokes handleZoomIn on zoom-in button click', () => {
    expect(preview.state().zoom).toBeCloseTo(1.0);
    preview
      .find('.zoomButton')
      .at(0)
      .simulate('click');
    expect(preview.state().zoom).toBeCloseTo(1.1);
  });

  it('invokes handleZoomOut on zoom-out button click', () => {
    expect(preview.state().zoom).toBeCloseTo(1.0);
    preview
      .find('.zoomButton')
      .at(1)
      .simulate('click');
    expect(preview.state().zoom).toBeCloseTo(0.9);
  });
});

describe('Test sidebar', () => {
  var sidebar;
  beforeEach(() => {
    sidebar = shallow(<Sidebar />);
  });

  it('opens and closes when clicked', () => {
    expect(sidebar.state().isCollapsed).toBeTruthy();
    sidebar.find('#sidebar-expand-button').simulate('click');
    expect(sidebar.state().isCollapsed).toBeFalsy();
    sidebar.find('#sidebar-expand-button').simulate('click');
    expect(sidebar.state().isCollapsed).toBeTruthy();
  });

  it('tracks mouse hovering and leaving the sidebar area', () => {
    expect(sidebar.state().isHovering).toBeFalsy();
    sidebar.find('#sidebar').simulate('mouseEnter');
    expect(sidebar.state().isHovering).toBeTruthy();
    sidebar.find('#sidebar').simulate('mouseLeave');
    expect(sidebar.state().isHovering).toBeFalsy();
  });

  it('updates state with info filled into fields', () => {
    var i = 0;
    var input;
    [
      'title',
      'author',
      'headerLeft',
      'headerMiddle',
      'headerRight',
      'footerLeft',
      'footerMiddle',
      'footerRight'
    ].forEach(field => {
      expect(sidebar.state(field)).toEqual('');
      input = sidebar.find('input').at(i + 3);
      input.value = 'Changed';
      input.name = field;
      input.simulate('change', { target: input });
      expect(sidebar.state(field)).toEqual(['Changed']);
      i++;
    });
  });
});

describe('Test tableMaker', () => {
  var tableMaker;

  beforeEach(() => {
    tableMaker = shallow(<TableMaker popupClosed={false} />);
  });

  it('has default values 3, 3, no header', () => {
    expect(tableMaker.state().rows).toBe(3);
    expect(tableMaker.state().columns).toBe(3);
    expect(tableMaker.state().topRowIsHeader).toBeFalsy();
  });

  it('properly generates a 3x3 table', () => {
    expect(tableMaker.state().tableHTML).toBe('');
    tableMaker.instance().createTable();
    expect(tableMaker.state().tableHTML).toBe(
      '<table><tr><td>1:1</td><td>1:2</td><td>1:3</td></tr><tr><td>2:1</td><td>2:2</td><td>2:3</td></tr><tr><td>3:1</td><td>3:2</td><td>3:3</td></tr></table>'
    );
  });

  it('does nothing if rows or columns field is 0', () => {
    expect(tableMaker.state().tableHTML).toBe('');
    tableMaker.setState({ rows: 0 });
    expect(tableMaker.state().tableHTML).toBe('');
    tableMaker.setState({ rows: 3, columns: 0 });
    expect(tableMaker.state().tableHTML).toBe('');
  });
});
