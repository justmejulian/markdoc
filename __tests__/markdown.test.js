'use strict';
const markdown = require('../app/src/js/markdown');
const {
  Parser,
  Token,
  TokenStream,
  TokenTypes,
  Tokens,
  CharacterStream
} = markdown.parser;
const { DOM, TOC } = markdown;

describe('InputStream', () => {
  it('should read strings correctly', () => {
    var stream = new CharacterStream();
    var charStream = new CharacterStream('ab\n c');
    expect(charStream.read()).toEqual('a');
    expect(charStream.read()).toEqual('b');
    expect(charStream.read()).toEqual('\n');
    expect(charStream.read()).toEqual(' ');
    expect(charStream.read()).toEqual('c');
    expect(charStream.read()).toEqual('');
  });
  it('should peek characters correctly', () => {
    var charStream = new CharacterStream('ab\n c');
    expect(charStream.peek()).toEqual('a');
    expect(charStream.peek()).toEqual('a');
    charStream.read();
    expect(charStream.peek()).toEqual('b');
    charStream.read();
    expect(charStream.peek()).toEqual('\n');
    charStream.read();
    charStream.read();
    expect(charStream.peek()).toEqual('c');
    charStream.read();
    expect(charStream.peek()).toEqual('');
  });
  it('should detect the end of the string correctly', () => {
    var charStream = new CharacterStream('ab\n c');
    expect(charStream.eof()).toBeFalsy();
    charStream.read();
    expect(charStream.eof()).toBeFalsy();
    charStream.read();
    expect(charStream.eof()).toBeFalsy();
    charStream.read();
    expect(charStream.eof()).toBeFalsy();
    charStream.read();
    expect(charStream.eof()).toBeFalsy();
    charStream.read();
    expect(charStream.eof()).toBeTruthy();
  });
  it('should keep track of the string position', () => {
    var charStream = new CharacterStream('ab\n c');
    expect(charStream.pos).toEqual(0);
    charStream.read();
    expect(charStream.pos).toEqual(1);
    charStream.read();
    expect(charStream.pos).toEqual(2);
    charStream.read();
    expect(charStream.pos).toEqual(3);
    charStream.read();
    expect(charStream.pos).toEqual(4);
    charStream.read();
    expect(charStream.pos).toEqual(5);
    charStream.read();
    expect(charStream.pos).toEqual(5);
  });
  it('should keep track of the current line and column', () => {
    var charStream = new CharacterStream('ab\n c');
    expect(charStream.row).toEqual(0);
    expect(charStream.column).toEqual(0);
    charStream.read();
    expect(charStream.row).toEqual(0);
    expect(charStream.column).toEqual(1);
    charStream.read();
    expect(charStream.row).toEqual(0);
    expect(charStream.column).toEqual(2);
    charStream.read();
    expect(charStream.row).toEqual(1);
    expect(charStream.column).toEqual(0);
    charStream.read();
    expect(charStream.row).toEqual(1);
    expect(charStream.column).toEqual(1);
    charStream.read();
    expect(charStream.row).toEqual(1);
    expect(charStream.column).toEqual(2);
    charStream.read();
    expect(charStream.row).toEqual(1);
    expect(charStream.column).toEqual(2);
  });
  it('should test regex', () => {
    var charStream = new CharacterStream('# header\n> quote');
    expect(charStream.test(/\#\s/)).toEqual(0);
    expect(charStream.test(/d/)).toEqual(5);
    expect(charStream.test(/>\s/)).toEqual(9);
    expect(charStream.test(/1.\s/)).toEqual(-1);
  });
  it('should match regex', () => {
    var charStream = new CharacterStream('# header\n> quote');
    expect(charStream.match(/\#\s/)[0]).toEqual('# ');
    expect(charStream.match(/d/)[0]).toEqual('d');
    expect(charStream.match(/>\s/)[0]).toEqual('> ');
    expect(charStream.match(/1.\s/)).toBeNull();
  });
  it('should skip a certain amount of characters', () => {
    var charStream = new CharacterStream('# header\n> quote');
    expect(charStream.skip(0)).toEqual('');
    expect(charStream.skip(1)).toEqual('#');
    expect(charStream.skip(7)).toEqual(' header');
    var distance = charStream.test(/>\s/);
    expect(charStream.skip(distance)).toEqual('\n');
    expect(charStream.skip(20)).toEqual('> quote');
    expect(charStream.skip(20)).toEqual('');
    expect(charStream.pos).toEqual(16);
  });
});

describe('Token Regex', () => {
  it('should match headers appropriately', () => {
    var pattern = Tokens.HEADER.pattern;
    // Matches:
    expect(pattern.test('# Header')).toBeTruthy();
    expect(pattern.test('#     Header')).toBeTruthy();
    expect(pattern.test('#	Header')).toBeTruthy();
    expect(pattern.test('###### Header')).toBeTruthy();
    expect(pattern.test(' ###### Header')).toBeTruthy();
    expect(pattern.test('####### Header')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('####### ')).toBeFalsy();
    expect(pattern.test('###### ')).toBeFalsy();
    expect(pattern.test('# ')).toBeFalsy();
    expect(pattern.test('#Header')).toBeFalsy();
    expect(pattern.test('# \ntest')).toBeFalsy();
  });
  it('should match blockquotes appropriately', () => {
    var pattern = Tokens.BLOCKQUOTE.pattern;
    // Matches:
    expect(pattern.test('> Header')).toBeTruthy();
    expect(pattern.test('>> Header')).toBeTruthy();
    expect(pattern.test('>   Header')).toBeTruthy();
    expect(pattern.test('\n> Header')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('>   ')).toBeFalsy();
    expect(pattern.test('>  \n ')).toBeFalsy();
    expect(pattern.test('>')).toBeFalsy();
  });
  it('should match rules appropriately', () => {
    var pattern = Tokens.RULE.pattern;
    // Matches:
    expect(pattern.test('***')).toBeTruthy();
    expect(pattern.test('---')).toBeTruthy();
    expect(pattern.test('___')).toBeTruthy();
    expect(pattern.test('asd***')).toBeTruthy();
    expect(pattern.test('asd---')).toBeTruthy();
    expect(pattern.test('asd___')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('***daws')).toBeFalsy();
    expect(pattern.test('---daws')).toBeFalsy();
    expect(pattern.test('___daws')).toBeFalsy();
    expect(pattern.test('**')).toBeFalsy();
    expect(pattern.test('--')).toBeFalsy();
    expect(pattern.test('__')).toBeFalsy();
  });
  it('should match lists appropriately', () => {
    var pattern = Tokens.LIST.pattern;
    // Matches:
    expect(pattern.test('1. one')).toBeTruthy();
    expect(pattern.test('* one')).toBeTruthy();
    expect(pattern.test('	1. one')).toBeTruthy();
    expect(pattern.test('	* one')).toBeTruthy();
    expect(pattern.test('    1. one')).toBeTruthy();
    expect(pattern.test('    * one')).toBeTruthy();
    expect(pattern.test('   1. one')).toBeTruthy();
    expect(pattern.test('   * one')).toBeTruthy();
    expect(pattern.test('1.      one')).toBeTruthy();
    expect(pattern.test('*      one')).toBeTruthy();
    expect(pattern.test('486528. one')).toBeTruthy();
    expect(pattern.test('** one')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('1.      \none')).toBeFalsy();
    expect(pattern.test('*      \none')).toBeFalsy();
    expect(pattern.test('1. \none')).toBeFalsy();
    expect(pattern.test('* \none')).toBeFalsy();
    expect(pattern.test('0. one')).toBeFalsy();
    expect(pattern.test('0 one')).toBeFalsy();
    expect(pattern.test('1 one')).toBeFalsy();
    expect(pattern.test('. one')).toBeFalsy();
    expect(pattern.test('*. one')).toBeFalsy();
    expect(pattern.test('- one')).toBeFalsy();
  });
  it('should match code blocks appropriately', () => {
    var pattern = Tokens.CODEBLOCK.pattern;
    // Matches:
    expect(pattern.test('```')).toBeTruthy();
    expect(pattern.test('awdw```')).toBeTruthy();
    expect(pattern.test('```sadwad')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('`')).toBeFalsy();
  });
  it('should match TOCs appropriately', () => {
    var pattern = Tokens.TOC.pattern;
    // Matches:
    expect(pattern.test('[TOC]')).toBeTruthy();
    expect(pattern.test('asd[TOC]')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('[TOF]')).toBeFalsy();
    expect(pattern.test('[TOC]]')).toBeFalsy();
  });
  it('should match TOFs appropriately', () => {
    var pattern = Tokens.TOF.pattern;
    // Matches:
    expect(pattern.test('[TOF]')).toBeTruthy();
    expect(pattern.test('asd[TOF]')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('[TOC]')).toBeFalsy();
    expect(pattern.test('[TOF]]')).toBeFalsy();
  });
  it('should match pagebreaks appropriately', () => {
    var pattern = Tokens.PAGEBREAK.pattern;
    // Matches:
    expect(pattern.test('[PB]')).toBeTruthy();
    expect(pattern.test('asd[PB]')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('[PBB]')).toBeFalsy();
    expect(pattern.test('[PB]]')).toBeFalsy();
  });
  it('should match references appropriately', () => {
    var pattern = Tokens.REFERENCE.pattern;
    // Matches:
    expect(pattern.test('[a]: dawd')).toBeTruthy();
    expect(pattern.test('[q2fwa4  34wd]: dafa22')).toBeTruthy();
    expect(
      pattern.test('[adw sa]: https://duckduckgo.com/ "DuckDuckGo Homepage"')
    ).toBeTruthy();
    expect(pattern.test('[2]: file://test.png')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('[PBB]: d d d\nhi')).toBeFalsy();
    expect(pattern.test('[PBB]')).toBeFalsy();
  });
  it('should match latex blocks appropriately', () => {
    var pattern = Tokens.LATEXBLOCK.pattern;
    // Matches:
    expect(pattern.test('$$test$$')).toBeTruthy();
    expect(pattern.test('fds$$test$$')).toBeTruthy();
    expect(pattern.test('fds$$$$')).toBeTruthy();
    expect(pattern.test('fds$$\n$')).toBeTruthy();
    expect(pattern.test('\n$$\n$')).toBeTruthy();
    expect(pattern.test('\n$$\n')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('$ $')).toBeFalsy();
    expect(pattern.test('$ $x = y$ $')).toBeFalsy();
  });
  it('should match newlines appropriately', () => {
    var pattern = Tokens.NEWLINE.pattern;
    // Matches:
    expect(pattern.test('\n')).toBeTruthy();
    expect(pattern.test(' \n')).toBeTruthy();
    expect(pattern.test('\n ')).toBeTruthy();
    expect(pattern.test('a\nc')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('\r')).toBeFalsy();
    expect(pattern.test('\t')).toBeFalsy();
  });
  it('should match bold text indicators appropriately', () => {
    var pattern = Tokens.BOLD.pattern;
    // Matches:
    expect(pattern.test('**')).toBeTruthy();
    expect(pattern.test(' **')).toBeTruthy();
    expect(pattern.test('** ')).toBeTruthy();
    expect(pattern.test('a**c')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('* *')).toBeFalsy();
    expect(pattern.test('__')).toBeFalsy();
  });
  it('should match italics text indicators appropriately', () => {
    var pattern = Tokens.ITALICS.pattern;
    // Matches:
    expect(pattern.test('_')).toBeTruthy();
    expect(pattern.test(' _')).toBeTruthy();
    expect(pattern.test('_ ')).toBeTruthy();
    expect(pattern.test('a_c')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('-')).toBeFalsy();
    expect(pattern.test('**')).toBeFalsy();
  });
  it('should match strikethrough text indicators appropriately', () => {
    var pattern = Tokens.STRIKETHROUGH.pattern;
    // Matches:
    expect(pattern.test('~~')).toBeTruthy();
    expect(pattern.test(' ~~')).toBeTruthy();
    expect(pattern.test('~~ ')).toBeTruthy();
    expect(pattern.test('a~~c')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('~ ~')).toBeFalsy();
    expect(pattern.test('~')).toBeFalsy();
    expect(pattern.test('- -')).toBeFalsy();
    expect(pattern.test('_ _')).toBeFalsy();
    expect(pattern.test('__ __')).toBeFalsy();
  });
  it('should match image start indicators appropriately', () => {
    var pattern = Tokens.IMAGESTART.pattern;
    // Matches:
    expect(pattern.test('![alt text](test.jpg)')).toBeTruthy();
    expect(pattern.test('![alt text](test.jpg "hi there")')).toBeTruthy();
    expect(pattern.test('![alt text][1]')).toBeTruthy();
    expect(pattern.test('sad![alt text](test.jpg)')).toBeTruthy();
    expect(pattern.test('sad![al')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('[alt text](test.jpg)')).toBeFalsy();
    expect(pattern.test('!(test)')).toBeFalsy();
  });
  it('should match link start indicators appropriately', () => {
    var pattern = Tokens.LINKSTART.pattern;
    // Matches:
    expect(pattern.test('![alt text](test.jpg)')).toBeTruthy();
    expect(pattern.test('![alt text](test.jpg "hi there")')).toBeTruthy();
    expect(pattern.test('![alt text][1]')).toBeTruthy();
    expect(pattern.test('sad![alt text](test.jpg)')).toBeTruthy();
    expect(pattern.test('sad![al')).toBeTruthy();
    expect(pattern.test('[alt text](test.jpg)')).toBeTruthy();
    expect(pattern.test('[alt text](test.jpg "hi there")')).toBeTruthy();
    expect(pattern.test('[alt text][1]')).toBeTruthy();
    expect(pattern.test('[alt text][ [alt text][1]')).toBeTruthy();
    expect(pattern.test('sad[alt text](test.jpg)')).toBeTruthy();
    expect(pattern.test('sad[al')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('{alt text](test.jpg)')).toBeFalsy();
    expect(pattern.test('!(test)')).toBeFalsy();
  });
  it('should match image-/link-inline indicators appropriately', () => {
    var pattern = Tokens.IMGLINKINLINE.pattern;
    // Matches:
    expect(pattern.test('![alt text](test.jpg)')).toBeTruthy();
    expect(pattern.test('![alt text](test.jpg "')).toBeTruthy();
    expect(pattern.test('text](test.jpg)')).toBeTruthy();
    expect(pattern.test('lt text](test.jp "')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('![alt text]( test.jpg)')).toBeFalsy();
    expect(pattern.test('text](test.jpg"')).toBeFalsy();
    expect(pattern.test('text](tes[]')).toBeFalsy();
    expect(pattern.test('text](tes()')).toBeFalsy();
    expect(pattern.test('![alt text][1]')).toBeFalsy();
    expect(pattern.test('![alt text][1 ]')).toBeFalsy();
    expect(pattern.test('![alt text][ 1]')).toBeFalsy();
    expect(pattern.test('![alt text][link// text]')).toBeFalsy();
    expect(pattern.test('![alt text][li[]]')).toBeFalsy();
    expect(pattern.test('![alt text][li()')).toBeFalsy();
    expect(pattern.test('[alt text]: test.jpg')).toBeFalsy();
    expect(pattern.test('!(test)')).toBeFalsy();
  });
  it('should match image-/link-inline indicators appropriately', () => {
    var pattern = Tokens.IMGLINKREFERENCE.pattern;
    // Matches:
    expect(pattern.test('![alt text][1]')).toBeTruthy();
    expect(pattern.test('![alt text][1022]')).toBeTruthy();
    expect(pattern.test('![alt text][logo]')).toBeTruthy();
    expect(pattern.test('![alt text][logo 3]')).toBeTruthy();
    expect(pattern.test('![alt text][link// text]')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('![alt text][1 ]')).toBeFalsy();
    expect(pattern.test('![alt text][ 1]')).toBeFalsy();
    expect(pattern.test('sad![alt text](test.jpg)')).toBeFalsy();
    expect(pattern.test('![alt text](test.jpg)')).toBeFalsy();
    expect(pattern.test('![alt text](test.jpg "hi there")')).toBeFalsy();
    expect(pattern.test('[alt text]: test.jpg')).toBeFalsy();
    expect(pattern.test('!(test)')).toBeFalsy();
  });
  it('should match image-/link-end indicators appropriately', () => {
    var pattern = Tokens.IMGLINKEND.pattern;
    // Matches:
    expect(pattern.test('alt text(test.jpg)')).toBeTruthy();
    expect(pattern.test('!alt text(test.jpg "hi there")')).toBeTruthy();
    expect(pattern.test('!alt text[1]')).toBeTruthy();
    expect(pattern.test('sa(test.jpg)')).toBeTruthy();
    // Mismatches:
    expect(pattern.test('alt text: test.jpg')).toBeFalsy();
    expect(pattern.test('!(test')).toBeFalsy();
  });
  it('should match code indicators appropriately', () => {
    var pattern = Tokens.CODE.pattern;
    // Matches:
    expect(pattern.test('Let ` x = 5`')).toBeTruthy();
    expect(pattern.test('Let `x = 5`')).toBeTruthy();
    expect(pattern.test('Let `x = 5')).toBeTruthy();
    expect(pattern.test('Let`x = 5')).toBeTruthy();
    expect(pattern.test('Let` x = 5')).toBeTruthy();
    // Mismatches:
  });
  it('should match latex indicators appropriately', () => {
    var pattern = Tokens.LATEX.pattern;
    // Matches:
    expect(pattern.test('Let $ x = 5$')).toBeTruthy();
    expect(pattern.test('Let $x = 5$')).toBeTruthy();
    expect(pattern.test('Let $x = 5')).toBeTruthy();
    expect(pattern.test('Let$x = 5')).toBeTruthy();
    expect(pattern.test('Let$ x = 5')).toBeTruthy();
    // Mismatches:
  });
  it('should match latex indicators appropriately', () => {
    var pattern = Tokens.LATEX.pattern;
    // Matches:
    expect(pattern.test('Let $ x = 5$')).toBeTruthy();
    expect(pattern.test('Let $x = 5$')).toBeTruthy();
    expect(pattern.test('Let $x = 5')).toBeTruthy();
    expect(pattern.test('Let$x = 5')).toBeTruthy();
    expect(pattern.test('Let$ x = 5')).toBeTruthy();
    // Mismatches:
  });
});

describe('TokenStream', () => {
  it('should tokenize strings', () => {
    var tokenStream = new TokenStream(new CharacterStream('ab\n c'));
    expect(tokenStream.read()).not.toBeNull();
    expect(tokenStream.read()).not.toBeNull();
    expect(tokenStream.read()).not.toBeNull();
    expect(tokenStream.read()).toBeNull();
  });
  it('should tokenize headers', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('# true header ## false header\n### true header')
    );
    tokenStream.rea;
  });

  it('should tokenize correctly', () => {
    var tokenStream = new TokenStream(new CharacterStream('Test `this`!'));
    expect(tokenStream.read().type).toEqual(TokenTypes.TEXT);
    expect(tokenStream.read().type).toEqual(TokenTypes.CODE);
    expect(tokenStream.read().type).toEqual(TokenTypes.TEXT);
    expect(tokenStream.read().type).toEqual(TokenTypes.CODE);
    expect(tokenStream.read().type).toEqual(TokenTypes.TEXT);
  });
  it('should find proper header tokens', () => {
    // Matches:
    var tokenStream = new TokenStream(new CharacterStream('# Header'));
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.HEADER);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 1]);
    tokenStream = new TokenStream(new CharacterStream('## Header'));
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.HEADER);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 2]);
    tokenStream = new TokenStream(new CharacterStream('### Header'));
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.HEADER);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 3]);
    tokenStream = new TokenStream(new CharacterStream('#### Header'));
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.HEADER);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 4]);
    tokenStream = new TokenStream(new CharacterStream('##### Header'));
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.HEADER);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 5]);
    tokenStream = new TokenStream(new CharacterStream('###### Header'));
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.HEADER);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 6]);
    tokenStream = new TokenStream(new CharacterStream('######  Header'));
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.HEADER);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 7]);

    // No matches:
    tokenStream = new TokenStream(new CharacterStream('####### Header'));
    token = tokenStream.read();
    expect(token.type).not.toEqual(TokenTypes.HEADER);
    tokenStream = new TokenStream(new CharacterStream('\\# Header'));
    token = tokenStream.read();
    expect(token.type).not.toEqual(TokenTypes.HEADER);
    tokenStream = new TokenStream(new CharacterStream(' # Header'));
    token = tokenStream.read();
    expect(token.type).not.toEqual(TokenTypes.HEADER);

    // Multiple:
    //                       XX(text)()XXXXX( text  )
    tokenStream = new TokenStream(new CharacterStream('# 0\n## Subheader'));
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.HEADER);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 1]);
    tokenStream.read();
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.HEADER);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 2]);
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
    var dom = DOM.parse('# Header');
    expect(dom.toString()).toEqual('Header');
  });
  it('should parse formatted paragraphs correctly', () => {
    var dom = DOM.parse(
      '**Hi *th`ere`***! Image: ![alt text](./img.png); Ref: [alt text2](https://duckduckgo.com/)'
    );
    expect(dom.toString()).toEqual('Hi there! Image: alt text; Ref: alt text2');
  });
  it('should parse an ordered list correctly', () => {
    var dom = DOM.parse(
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
    var dom = DOM.parse('- first\n' + '- second\n' + '- third');
    expect(dom.toString()).toEqual('first\nsecond\nthird');
  });
  it('should parse nested lists correctly', () => {
    var dom = DOM.parse(
      '1. item one\n' + '2. item two\n' + '	- sublist\n' + '	- sublist'
    );
    expect(dom.toMarkDown()).toEqual(
      '1. item one\n' + '2. item two\n' + '	- sublist\n' + '	- sublist'
    );
  });
  it('should output Html code correctly', () => {
    var dom = DOM.parse(
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
    var dom = DOM.parse(source);
    expect(dom.toMarkDown()).toEqual(source);
  });
  it('should correctly convert markdown to formatless string', () => {
    var dom = DOM.parse(source);
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
    var dom = DOM.parse(source);
    var header = dom.children[0];
    expect(header.from.row).toEqual(1);
    expect(header.from.column).toEqual(1);
    expect(header.to.row).toEqual(1);
    expect(header.to.column).toEqual(14);
  });
  it('should parse one TOC and only one', () => {
    var dom = DOM.parse('# Header\n' + '[TOC]\n' + '\n' + '[TOC]');
    var count = 0;
    for (const child of dom.children) {
      if (child instanceof TOC) count++;
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
