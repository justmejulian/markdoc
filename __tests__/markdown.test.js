'use strict';
const MD = require('../app/src/js/markdown');
const {
  MDDOM,
  MDTOC,
  Lexer,
  Parser,
  Token,
  TokenStream,
  TokenTypes,
  InputStream
} = MD;

describe('Lexer', () => {
  it('should tokenize correctly', () => {
    var tokens = Lexer.tokenize('Test `this`!');
    expect(tokens.length).toEqual(6);
    expect(tokens[0].type).toEqual(TokenTypes.PARAGRAPH);
    expect(tokens[1].type).toEqual(TokenTypes.TEXT);
    expect(tokens[2].type).toEqual(TokenTypes.CODETOGGLE);
    expect(tokens[3].type).toEqual(TokenTypes.TEXT);
    expect(tokens[4].type).toEqual(TokenTypes.CODETOGGLE);
    expect(tokens[5].type).toEqual(TokenTypes.TEXT);
  });
  it('should find proper header tokens', () => {
    // Matches:
    var tokens = Lexer.tokenize('# Header');
    expect(tokens[0].type).toEqual(TokenTypes.HEADER);
    expect(tokens[0].from).toEqual([0, 0]);
    expect(tokens[0].to).toEqual([0, 1]);
    tokens = Lexer.tokenize('## Header');
    expect(tokens[0].type).toEqual(TokenTypes.HEADER);
    expect(tokens[0].from).toEqual([0, 0]);
    expect(tokens[0].to).toEqual([0, 2]);
    tokens = Lexer.tokenize('### Header');
    expect(tokens[0].type).toEqual(TokenTypes.HEADER);
    expect(tokens[0].from).toEqual([0, 0]);
    expect(tokens[0].to).toEqual([0, 3]);
    tokens = Lexer.tokenize('#### Header');
    expect(tokens[0].type).toEqual(TokenTypes.HEADER);
    expect(tokens[0].from).toEqual([0, 0]);
    expect(tokens[0].to).toEqual([0, 4]);
    tokens = Lexer.tokenize('##### Header');
    expect(tokens[0].type).toEqual(TokenTypes.HEADER);
    expect(tokens[0].from).toEqual([0, 0]);
    expect(tokens[0].to).toEqual([0, 5]);
    tokens = Lexer.tokenize('###### Header');
    expect(tokens[0].type).toEqual(TokenTypes.HEADER);
    expect(tokens[0].from).toEqual([0, 0]);
    expect(tokens[0].to).toEqual([0, 6]);

    // No matches:
    tokens = Lexer.tokenize('####### Header');
    expect(tokens[0].type).not.toEqual(TokenTypes.HEADER);
    tokens = Lexer.tokenize('\\# Header');
    expect(tokens[0].type).not.toEqual(TokenTypes.HEADER);
    tokens = Lexer.tokenize(' # Header');
    expect(tokens[0].type).not.toEqual(TokenTypes.HEADER);

    // Multiple:
    //                       XX(text)()XXXXX( text  )
    tokens = Lexer.tokenize('# Header\n\n## Subheader');
    expect(tokens.length).toEqual(5);
    expect(tokens[0].type).toEqual(TokenTypes.HEADER);
    expect(tokens[0].from).toEqual([0, 0]);
    expect(tokens[0].to).toEqual([0, 1]);
    expect(tokens[3].type).toEqual(TokenTypes.HEADER);
    expect(tokens[3].from).toEqual([2, 0]);
    expect(tokens[3].to).toEqual([2, 2]);
  });
  it('should find proper paragraphs', () => {
    // Matches:
    var tokens = Lexer.tokenize('This is an example Paragraph');
    expect(tokens[0].type).toEqual(TokenTypes.PARAGRAPH);
    expect(tokens[0].from).toEqual([0, 0]);
    expect(tokens[0].to).toEqual([0, 0]);
    tokens = Lexer.tokenize("'code'");
    expect(tokens[0].type).toEqual(TokenTypes.PARAGRAPH);
    expect(tokens[0].from).toEqual([0, 0]);
    expect(tokens[0].to).toEqual([0, 0]);

    // Multiple:
    tokens = Lexer.tokenize('This is an example\nParagraph');
    expect(tokens[0].type).toEqual(TokenTypes.PARAGRAPH);
    expect(tokens[0].from).toEqual([0, 0]);
    expect(tokens[0].to).toEqual([0, 0]);
    expect(tokens[2].type).toEqual(TokenTypes.PARAGRAPH);
    expect(tokens[2].from).toEqual([1, 0]);
    expect(tokens[2].to).toEqual([1, 0]);
  });
});

describe('Markdown parser', () => {
  const source =
    '# Testheader 1\n' +
    'Bla**blabla**.\n' +
    '## Second test header\n' +
    '[TOC]\n' +
    '\n' +
    '1. first\n' +
    '2. second';
  it('should parse headers correctly', () => {
    var dom = MDDOM.parse('# Header');
    expect(dom.toString()).toEqual('Header');
  });
  it('should parse formatted paragraphs correctly', () => {
    var dom = MDDOM.parse(
      '**Hi *th`ere`***! Image: ![alt text](./img.png); Ref: [alt text2](https://duckduckgo.com/)'
    );
    expect(dom.toString()).toEqual('Hi there! Image: alt text; Ref: alt text2');
  });
  it('should parse an ordered list correctly', () => {
    var dom = MDDOM.parse(
      '1. first\n' +
        '3. second!\n' +
        '2. third though!\n' +
        '\n' +
        '5. fourth\n' +
        '6. fifth'
    );
    expect(dom.toString()).toEqual(
      'first\n' + 'second!\n' + 'third though!\n' + 'fourth\n' + 'fifth'
    );
    expect(dom.toMarkDown()).toEqual(
      '1. first\n' +
        '2. second!\n' +
        '3. third though!\n' +
        '4. fourth\n' +
        '5. fifth'
    );
  });
  it('should parse an unordered list correctly', () => {
    var dom = MDDOM.parse('- first\n' + '- second\n' + '- third');
    expect(dom.toString()).toEqual('first\nsecond\nthird');
  });
  it('should parse nested lists correctly', () => {
    var dom = MDDOM.parse(
      '1. item one\n' + '2. item two\n' + '	- sublist\n' + '	- sublist'
    );
    expect(dom.toMarkDown()).toEqual(
      '1. item one\n' + '2. item two\n' + '	- sublist\n' + '	- sublist'
    );
  });
  it('should output Html code correctly', () => {
    var dom = MDDOM.parse(
      '# Testheader 1\n' +
        'Bla**blabla**.\n' +
        '## Second test header\n' +
        '1. first\n' +
        '2. second'
    );
    expect(dom.toHtml()).toEqual(
      '<h1>Testheader 1</h1>\n' +
        '<p>Bla<strong>blabla</strong>.</p>\n' +
        '<h2>Second test header</h2>\n' +
        '<ol><li><p>first</p></li><li><p>second</p></li></ol>'
    );
  });
  it('should output the same source when calling toMarkDown() after parsing', () => {
    var dom = MDDOM.parse(source);
    expect(dom.toMarkDown()).toEqual(source);
  });
  it('should correctly convert markdown to formatless string', () => {
    var dom = MDDOM.parse(source);
    expect(dom.toString()).toEqual(
      'Testheader 1\n' +
        'Blablabla.\n' +
        'Second test header\n' +
        '\n' +
        '\n' +
        'first\n' +
        'second'
    );
  });
  it('should parse the right source positions', () => {
    var dom = MDDOM.parse(source);
    var header = dom.children[0];
    expect(header.from.row).toEqual(1);
    expect(header.from.column).toEqual(1);
    expect(header.to.row).toEqual(1);
    expect(header.to.column).toEqual(14);
  });
  it('should parse one TOC and only one', () => {
    var dom = MDDOM.parse('# Header\n' + '[TOC]\n' + '\n' + '[TOC]');
    var count = 0;
    for (const child of dom.children) {
      if (child instanceof MDTOC) count++;
    }
    expect(count).toEqual(1);
    expect(dom.toc).toBeDefined();
    expect(dom.toc.children.length).toEqual(1);
  });
  // it('should parse one TOF and only one', () => {
  //   var dom = MDDOM.parse(
  //     '![alt text](./img.png)\n' + '[TOF]\n' + '\n' + '[TOF]'
  //   );
  //   var count = 0;
  //   for (const child of dom.children) {
  //     if (child instanceof MDTOC) count++;
  //   }
  //   expect(count).toEqual(1);
  //   expect(dom.tof).toBeDefined();
  //   expect(dom.tof.children.length).toEqual(1);
  // });
});
