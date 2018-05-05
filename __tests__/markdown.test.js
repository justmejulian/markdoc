'use strict';
const markdown = require('../app/src/js/markdown');
const {
  CharacterStream,
  TokenStream,
  Token,
  Tokens,
  TokenTypes,
  Parser,
  LatexParser
} = markdown.parser;
const {
  ComponentTypes,
  Component,
  DOM,
  Header,
  BlockQuote,
  NumberedList,
  UnnumberedList,
  LatexBlock,
  CodeBlock,
  Reference,
  TOC,
  TOF,
  Pagebreak,
  Rule,
  Paragraph,
  Text,
  Bold,
  Italics,
  Strikethrough,
  Image,
  Link,
  InlineCode,
  InlineLatex
} = markdown;

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
    charStream.read(); // a
    expect(charStream.row).toEqual(0);
    expect(charStream.column).toEqual(1);
    charStream.read(); // b
    expect(charStream.row).toEqual(0);
    expect(charStream.column).toEqual(2);
    charStream.read(); // \n
    expect(charStream.row).toEqual(1);
    expect(charStream.column).toEqual(0);
    charStream.read(); // " "
    expect(charStream.row).toEqual(1);
    expect(charStream.column).toEqual(1);
    charStream.read(); // c
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
  it('should skip to the next row(for testing purposes)', () => {
    var charStream = new CharacterStream('# header\n> quote\nanother line');
    expect(charStream.pos).toBe(0);
    expect(charStream.column).toBe(0);
    expect(charStream.row).toBe(0);
    var skipped = charStream.skipToNextRow();
    expect(skipped).toEqual('# header\n');
    expect(charStream.pos).toBe(9);
    expect(charStream.column).toBe(0);
    expect(charStream.row).toBe(1);
    skipped = charStream.skipToNextRow();
    expect(skipped).toEqual('> quote\n');
    expect(charStream.pos).toBe(17);
    expect(charStream.column).toBe(0);
    expect(charStream.row).toBe(2);
    skipped = charStream.skipToNextRow();
    expect(skipped).toEqual('another line');
    expect(charStream.pos).toBe(29);
    expect(charStream.column).toBe(12);
    expect(charStream.row).toBe(2);
    expect(charStream.eof()).toBeTruthy();
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
  it('should match image-/link-end indicators appropriately', () => {
    var pattern = Tokens.IMGLINKEND.pattern;
    // Matches:
    expect(pattern.test('[alt text](test.jpg)')).toBeTruthy();
    expect(pattern.test('![alt text](test.jpg "hi there")')).toBeTruthy();
    expect(pattern.test('![alt text][1]')).toBeTruthy();
    expect(pattern.test('sa](test.jpg)')).toBeTruthy();
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
  it('should find the correct amount of tokens', () => {
    var tokenStream = new TokenStream(new CharacterStream('# ab\n c'));
    expect(tokenStream.read()).not.toBeNull();
    expect(tokenStream.read()).not.toBeNull();
    expect(tokenStream.read()).not.toBeNull();
    expect(tokenStream.read()).not.toBeNull();
    expect(tokenStream.read()).toBeNull();
  });
  it('should tokenize to the correct types', () => {
    var tokenStream = new TokenStream(new CharacterStream('Test `this`!'));
    expect(tokenStream.read().type).toEqual(TokenTypes.TEXT);
    expect(tokenStream.read().type).toEqual(TokenTypes.CODE);
    expect(tokenStream.read().type).toEqual(TokenTypes.TEXT);
    expect(tokenStream.read().type).toEqual(TokenTypes.CODE);
    expect(tokenStream.read().type).toEqual(TokenTypes.TEXT);
  });
  it('should record the correct columns and rows', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('```js\nhi```\n\n# test header')
    );
    var token = tokenStream.read(); // ```
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 2]);
    token = tokenStream.read(); // js
    expect(token.from).toEqual([0, 3]);
    expect(token.to).toEqual([0, 4]);
    token = tokenStream.read(); // \n
    expect(token.from).toEqual([0, 5]);
    expect(token.to).toEqual([0, 5]);
    token = tokenStream.read(); // hi
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 1]);
    token = tokenStream.read(); // ```
    expect(token.from).toEqual([1, 2]);
    expect(token.to).toEqual([1, 4]);
    token = tokenStream.read(); // \n
    expect(token.from).toEqual([1, 5]);
    expect(token.to).toEqual([1, 5]);
    token = tokenStream.read(); // \n
    expect(token.from).toEqual([2, 0]);
    expect(token.to).toEqual([2, 0]);
    token = tokenStream.read(); // "# "
    expect(token.from).toEqual([3, 0]);
    expect(token.to).toEqual([3, 1]);
    token = tokenStream.read(); // test header
    expect(token.from).toEqual([3, 2]);
    expect(token.to).toEqual([3, 12]);
    expect(tokenStream.read()).toBeNull();
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
  it('should find proper blockquotes', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('>   Hey there\n> How are you?')
    );
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.BLOCKQUOTE);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 3]);
    tokenStream.read();
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.BLOCKQUOTE);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 1]);
    tokenStream.read();
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper rules', () => {
    var tokenStream = new TokenStream(new CharacterStream('---\n___\n***'));
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.RULE);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 2]);
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.RULE);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 2]);
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.RULE);
    expect(token.from).toEqual([2, 0]);
    expect(token.to).toEqual([2, 2]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper lists', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('1. one\n2. two\n* three')
    );
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.LIST);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 2]);
    tokenStream.read();
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.LIST);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 2]);
    tokenStream.read();
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.LIST);
    expect(token.from).toEqual([2, 0]);
    expect(token.to).toEqual([2, 1]);
    tokenStream.read();
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper code blocks', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('```js\nvar i = 0;\n```')
    );
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.CODEBLOCK);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 2]);
    tokenStream.read();
    tokenStream.read();
    tokenStream.read();
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.CODEBLOCK);
    expect(token.from).toEqual([2, 0]);
    expect(token.to).toEqual([2, 2]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper TOCs', () => {
    var tokenStream = new TokenStream(new CharacterStream('[TOC] \n[TOC]'));
    var token = tokenStream.read();
    while (token.type != TokenTypes.NEWLINE) {
      token = tokenStream.read();
      expect(token.type).not.toEqual(TokenTypes.TOC);
      if (token == null) throw new Error('Utter failure');
    }
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.TOC);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 4]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper TOFs', () => {
    var tokenStream = new TokenStream(new CharacterStream('[TOF] \n[TOF]'));
    var token = tokenStream.read();
    while (token.type != TokenTypes.NEWLINE) {
      token = tokenStream.read();
      expect(token.type).not.toEqual(TokenTypes.TOF);
      if (token == null) throw new Error('Utter failure');
    }
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.TOF);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 4]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper pagebreaks', () => {
    var tokenStream = new TokenStream(new CharacterStream('[PB] \n[PB]'));
    var token = tokenStream.read();
    while (token.type != TokenTypes.NEWLINE) {
      token = tokenStream.read();
      expect(token.type).not.toEqual(TokenTypes.PAGEBREAK);
      if (token == null) throw new Error('Utter failure');
    }
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.PAGEBREAK);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 3]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper references', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        '[alt text]: file://test.jpg "random pic" \n' +
          '[alt text]: file://test.jpg "random pic"'
      )
    );
    var token = tokenStream.read();
    while (token.type != TokenTypes.NEWLINE) {
      token = tokenStream.read();
      expect(token.type).not.toEqual(TokenTypes.REFERENCE);
      if (token == null) throw new Error('Utter failure');
    }
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.REFERENCE);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 39]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper LaTeX blocks', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('Check:\n$$\nx=y\n$$')
    );
    tokenStream.read();
    tokenStream.read();
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.LATEXBLOCK);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 1]);
    tokenStream.read();
    tokenStream.read();
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.LATEXBLOCK);
    expect(token.from).toEqual([3, 0]);
    expect(token.to).toEqual([3, 1]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper newlines', () => {
    var tokenStream = new TokenStream(new CharacterStream('Check:\n\nx=y\n'));
    tokenStream.read();
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.NEWLINE);
    expect(token.from).toEqual([0, 6]);
    expect(token.to).toEqual([0, 6]);
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.NEWLINE);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 0]);
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.NEWLINE);
    expect(token.from).toEqual([2, 3]);
    expect(token.to).toEqual([2, 3]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper bold indicators', () => {
    var tokenStream = new TokenStream(new CharacterStream(' ** gl\n**'));
    tokenStream.read();
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.BOLD);
    expect(token.from).toEqual([0, 1]);
    expect(token.to).toEqual([0, 2]);
    tokenStream.read();
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.BOLD);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 1]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper italics indicators', () => {
    var tokenStream = new TokenStream(new CharacterStream(' _ gl\n_'));
    tokenStream.read();
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.ITALICS);
    expect(token.from).toEqual([0, 1]);
    expect(token.to).toEqual([0, 1]);
    tokenStream.read();
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.ITALICS);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 0]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper strikethrough indicators', () => {
    var tokenStream = new TokenStream(new CharacterStream(' ~~ gl\n~~'));
    tokenStream.read();
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.STRIKETHROUGH);
    expect(token.from).toEqual([0, 1]);
    expect(token.to).toEqual([0, 2]);
    tokenStream.read();
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.STRIKETHROUGH);
    expect(token.from).toEqual([1, 0]);
    expect(token.to).toEqual([1, 1]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper image start indicators', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        'Pic: ![alt text](test.jpg)\n![alt text][1]\n![alt text][ref]'
      )
    );
    tokenStream.read();
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.IMAGESTART);
    expect(token.from).toEqual([0, 5]);
    expect(token.to).toEqual([0, 6]);
  });
  it('should find proper link start indicators', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        'Pic: [alt text](test.jpg)\n![alt text][1]\n![alt text][ref]'
      )
    );
    tokenStream.read();
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.LINKSTART);
    expect(token.from).toEqual([0, 5]);
    expect(token.to).toEqual([0, 5]);
  });
  it('should find proper image-/link end indicators', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        'Pic: ![alt text](test.jpg)\n![alt text](test.jpg "label")'
      )
    );
    tokenStream.read(); // "Pic: "
    tokenStream.read(); // ![
    tokenStream.read(); // "alt text"
    var token = tokenStream.read(); // ](test.jpg)
    expect(token.type).toEqual(TokenTypes.IMGLINKEND);
    expect(token.from).toEqual([0, 15]);
    expect(token.to).toEqual([0, 25]);
    tokenStream.read(); // \n
    tokenStream.read(); // ![
    tokenStream.read(); // "alt text"
    token = tokenStream.read(); // ](test.jpg "label")
    expect(token.type).toEqual(TokenTypes.IMGLINKEND);
    expect(token.from).toEqual([1, 10]);
    expect(token.to).toEqual([1, 28]);
  });
  it('should find proper code indicators', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('code: `var i = 1`.')
    );
    tokenStream.read();
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.CODE);
    expect(token.from).toEqual([0, 6]);
    expect(token.to).toEqual([0, 6]);
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.CODE);
    expect(token.from).toEqual([0, 16]);
    expect(token.to).toEqual([0, 16]);
    tokenStream.read();
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper latex indicators', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('math: $x=\\dot{x}$.')
    );
    tokenStream.read();
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.LATEX);
    expect(token.from).toEqual([0, 6]);
    expect(token.to).toEqual([0, 6]);
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.LATEX);
    expect(token.from).toEqual([0, 16]);
    expect(token.to).toEqual([0, 16]);
    tokenStream.read();
    expect(tokenStream.read()).toBeNull();
  });
  it('should find proper latex indicators', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('math: $x=\\dot{x}$.')
    );
    var token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.TEXT);
    expect(token.from).toEqual([0, 0]);
    expect(token.to).toEqual([0, 5]);
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.TEXT);
    expect(token.from).toEqual([0, 7]);
    expect(token.to).toEqual([0, 15]);
    tokenStream.read();
    token = tokenStream.read();
    expect(token.type).toEqual(TokenTypes.TEXT);
    expect(token.from).toEqual([0, 17]);
    expect(token.to).toEqual([0, 17]);
    expect(tokenStream.read()).toBeNull();
  });
  it('should skip to the next row(for testing purposes)', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('# header\n> quote\nanother line')
    );
    var skipped = tokenStream.skipToNextRow();
    expect(skipped[0].type).toEqual(TokenTypes.HEADER);
    expect(skipped[1].type).toEqual(TokenTypes.TEXT);
    expect(skipped[2].type).toEqual(TokenTypes.NEWLINE);
    skipped = tokenStream.skipToNextRow();
    expect(skipped[0].type).toEqual(TokenTypes.BLOCKQUOTE);
    expect(skipped[1].type).toEqual(TokenTypes.TEXT);
    expect(skipped[2].type).toEqual(TokenTypes.NEWLINE);
    skipped = tokenStream.skipToNextRow();
    expect(skipped[0].type).toEqual(TokenTypes.TEXT);
    expect(tokenStream.eof()).toBeTruthy();
  });
});

describe('Parser', () => {
  it('should parse the right amount of components', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        '# Testheader\n' +
          'Some text\n' +
          '\n' +
          '## Subheader\n' +
          'Some more text.\n' +
          '\n' +
          '```js\n' +
          'var a = 3;\n' +
          '```'
      )
    );
    var parser = new Parser(tokenStream);
    var components = parser.parse();
    expect(components.length).toBe(5);
  });
  it('should parse headers', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('# First header\n' + '## Sub header')
    );
    var parser = new Parser(tokenStream);
    var header = parser.parseHeader();
    expect(header.level).toBe(1);
    expect(header.toString()).toEqual('First header');
    expect(tokenStream.eof()).toBeFalsy();
    expect(tokenStream.peek().type).toEqual(TokenTypes.HEADER);
    header = parser.parseHeader();
    expect(header.level).toBe(2);
    expect(header.toString()).toEqual('Sub header');
    expect(tokenStream.eof()).toBeTruthy();

    tokenStream = new TokenStream(new CharacterStream('Non-Header'));
    parser = new Parser(tokenStream);
    expect(() => {
      parser.parseHeader();
    }).toThrow();
  });
  it('should parse block quotes', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        '> First quote\n' +
          '> Second quote\n' +
          '\n' +
          '>       Third quote\n' +
          '>   '
      )
    );
    var parser = new Parser(tokenStream);
    var quote = parser.parseBlockquote();
    expect(quote.toString()).toEqual('First quote\nSecond quote');
    expect(tokenStream.eof()).toBeFalsy();
    expect(tokenStream.peek().type).toEqual(TokenTypes.NEWLINE);
    tokenStream.read(); // Skip newline
    quote = parser.parseBlockquote();
    expect(quote.toString()).toEqual('Third quote');
    expect(tokenStream.eof()).toBeFalsy();
    expect(tokenStream.read().type).toEqual(TokenTypes.TEXT);
    expect(tokenStream.eof()).toBeTruthy();

    tokenStream = new TokenStream(new CharacterStream('# Header'));
    parser = new Parser(tokenStream);
    expect(() => {
      parser.parseBlockquote();
    }).toThrow();
  });
  it('should parse rules', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('# Header\n' + '---\n' + '---')
    );
    var parser = new Parser(tokenStream);
    tokenStream.skipToNextRow();
    var rule = parser.parseRule();
    expect(rule).not.toBeNull();
    expect(rule.type).toEqual(ComponentTypes.RULE);
    rule = parser.parseRule();
    expect(rule.type).toEqual(ComponentTypes.RULE);
    expect(tokenStream.eof()).toBeTruthy();
  });
  const listText =
    '1. One\n' +
    '3. Two\n' +
    '3. Three\n' +
    'still three\n' +
    '4. Four\n' +
    '    3. Sublist starting at 3\n' +
    '	2. nonsensical numbering and tab instead of spaces\n' +
    '5.   Five\n' +
    '		* Sublist 2 levels deeper and different type\n' +
    '6. Last element\n' +
    '\n' +
    '* New type\n' +
    'Extra text\n' +
    '```js\n' +
    'var a = 0;\n' +
    '```\n' +
    '* Test\n';
  it('should parse list heads', () => {
    var tokenStream = new TokenStream(new CharacterStream(listText));
    var parser = new Parser(tokenStream);
    var listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.NUMBEREDLIST);
    expect(listHead.start).toBe(1);
    expect(listHead.level).toBe(0);
    tokenStream.read(); // List token
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.NUMBEREDLIST);
    expect(listHead.start).toBe(3);
    expect(listHead.level).toBe(0);
    tokenStream.read(); // List token
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.NUMBEREDLIST);
    expect(listHead.start).toBe(3);
    expect(listHead.level).toBe(0);
    tokenStream.read(); // List token
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.NUMBEREDLIST);
    expect(listHead.start).toBe(4);
    expect(listHead.level).toBe(0);
    tokenStream.read(); // List token
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.NUMBEREDLIST);
    expect(listHead.start).toBe(3);
    expect(listHead.level).toBe(1);
    tokenStream.read(); // List token
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.NUMBEREDLIST);
    expect(listHead.start).toBe(2);
    expect(listHead.level).toBe(1);
    tokenStream.read(); // List token
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.NUMBEREDLIST);
    expect(listHead.start).toBe(5);
    expect(listHead.level).toBe(0);
    tokenStream.read(); // List token
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.UNNUMBEREDLIST);
    expect(listHead.level).toBe(2);
    tokenStream.read(); // List token
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.NUMBEREDLIST);
    expect(listHead.start).toBe(6);
    expect(listHead.level).toBe(0);
    tokenStream.read(); // List token
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    tokenStream.read(); // Newline
    listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.UNNUMBEREDLIST);
    expect(listHead.level).toBe(0);
    tokenStream.read(); // List token
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    tokenStream.read(); // Code block
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    tokenStream.read(); // Text
    tokenStream.read(); // Newline
    tokenStream.read(); // Code block
    tokenStream.read(); // Newline
    listHead = parser.peekListHead();
    expect(listHead.type).toEqual(ComponentTypes.UNNUMBEREDLIST);
    expect(listHead.level).toBe(0);

    tokenStream = new TokenStream(new CharacterStream('# Header'));
    parser = new Parser(tokenStream);
    expect(() => {
      parser.peekListHead();
    }).toThrow();
  });
  it('should parse list items', () => {
    var tokenStream = new TokenStream(new CharacterStream(listText));
    var parser = new Parser(tokenStream);
    var listItem = parser.parseListItem(parser.peekListHead());
    expect(listItem.children.length).toBe(1);
    expect(listItem.toString()).toEqual('One');
    listItem = parser.parseListItem(parser.peekListHead());
    expect(listItem.children.length).toBe(1);
    expect(listItem.toString()).toEqual('Two');
    listItem = parser.parseListItem(parser.peekListHead());
    expect(listItem.children.length).toBe(3);
    expect(listItem.toString()).toEqual('Three\nstill three');
    listItem = parser.parseListItem(parser.peekListHead());
    expect(listItem.children.length).toBe(3);
    expect(listItem.toString()).toEqual(
      'Four\nSublist starting at 3\nnonsensical numbering and tab instead of spaces'
    );

    tokenStream = new TokenStream(new CharacterStream('# Header'));
    parser = new Parser(tokenStream);
    expect(() => {
      parser.parseListItem(parser.peekListHead());
    }).toThrow();
  });
  it('should parse lists', () => {
    var tokenStream = new TokenStream(new CharacterStream(listText));
    var parser = new Parser(tokenStream);
    var list = parser.parseList();
    expect(list.type).toEqual(ComponentTypes.NUMBEREDLIST);
    expect(list.children.length).toBe(6);
    expect(list.children[0].toString()).toEqual('One');
    expect(list.children[3].children[2].type).toEqual(
      ComponentTypes.NUMBEREDLIST
    );
    expect(list.children[3].children[2].children.length).toBe(2);
    tokenStream.read(); // \n
    list = parser.parseList();
    expect(list.type).toEqual(ComponentTypes.UNNUMBEREDLIST);
    expect(list.children.length).toBe(1);
    expect(list.children[0].toString()).toEqual('New type\nExtra text');
    tokenStream.read(); // Code block
    tokenStream.read(); // Text
    tokenStream.read(); // \n
    tokenStream.read(); // Text
    tokenStream.read(); // \n
    tokenStream.read(); // Code block
    tokenStream.read(); // \n
    list = parser.parseList();
    expect(list.type).toEqual(ComponentTypes.UNNUMBEREDLIST);
    expect(list.children.length).toBe(1);
    expect(list.children[0].toString()).toEqual('Test');
  });
  it('should parse Code blocks', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        '```bash\n' +
          '$ bash -c "$(curl -fsSL https://test.com/start.sh)"\n' +
          '```\n' +
          '```\n' +
          'var reason = 42;```\n' +
          '```\n' +
          'end'
      )
    );
    var parser = new Parser(tokenStream);
    var code = parser.parseCodeblock()[0];
    expect(code.value).toEqual(
      '$ bash -c "$(curl -fsSL https://test.com/start.sh)"'
    );
    code = parser.parseCodeblock()[0];
    expect(code.value).toEqual('var reason = 42;');
    var substitutes = parser.parseCodeblock()[0];
    expect(substitutes.type).not.toEqual(ComponentTypes.CODEBLOCK);
    expect(tokenStream.eof()).toBeTruthy();

    parser = new Parser(new TokenStream(new CharacterStream('# Header')));
    expect(() => {
      parser.parseCodeblock();
    }).toThrow();
  });
  it('should parse TOCs', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('# Header\n' + '[TOC]\n' + '[TOC]')
    );
    var parser = new Parser(tokenStream);
    tokenStream.skipToNextRow();
    var parsed = parser.parse();
    var toc = parsed[0];
    expect(toc).not.toBeNull();
    expect(toc.type).toEqual(ComponentTypes.TOC);
    expect(parser.dom.toc).toEqual(toc);
    toc = parsed[1];
    expect(toc).not.toBeNull();
    expect(toc.type).not.toEqual(ComponentTypes.TOC);
    expect(parser.dom.toc).not.toEqual(toc);
  });
  it('should parse TOFs', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('# Header\n' + '[TOF]\n' + '[TOF]')
    );
    var parser = new Parser(tokenStream);
    tokenStream.skipToNextRow();
    var parsed = parser.parse();
    var tof = parsed[0];
    expect(tof).not.toBeNull();
    expect(tof.type).toEqual(ComponentTypes.TOF);
    expect(parser.dom.tof).toEqual(tof);
    tof = parsed[1];
    expect(tof).not.toBeNull();
    expect(tof.type).not.toEqual(ComponentTypes.TOF);
    expect(parser.dom.tof).not.toEqual(tof);
  });
  it('should parse pagebreaks', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('# Header\n' + '[PB]\n' + '[PB]')
    );
    var parser = new Parser(tokenStream);
    tokenStream.skipToNextRow();
    var parsed = parser.parse();
    var pagebreak = parsed[0];
    expect(pagebreak).not.toBeNull();
    expect(pagebreak.type).toEqual(ComponentTypes.PAGEBREAK);
    pagebreak = parsed[1];
    expect(pagebreak).not.toBeNull();
    expect(pagebreak.type).toEqual(ComponentTypes.PAGEBREAK);
  });
  it('should parse references', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        '# References:\n' +
          '[ref id 1]: https://duckduckgo.com/index.html\n' +
          '[ref id 2]: https://duckduckgo.com/ "alt text"'
      )
    );
    var parser = new Parser(tokenStream);
    tokenStream.skipToNextRow();
    var parsed = parser.parse();
    var reference = parsed[0];
    expect(reference).not.toBeNull();
    expect(reference.type).toEqual(ComponentTypes.REFERENCE);
    expect(reference.referenceId).toEqual('ref id 1');
    expect(reference.url).toEqual('https://duckduckgo.com/index.html');
    expect(reference).toEqual(parser.dom.references[0]);
    reference = parsed[1];
    expect(reference).not.toBeNull();
    expect(reference.type).toEqual(ComponentTypes.REFERENCE);
    expect(reference.referenceId).toEqual('ref id 2');
    expect(reference.url).toEqual('https://duckduckgo.com/');
    expect(reference.alt).toEqual('alt text');
    expect(reference).toEqual(parser.dom.references[1]);
  });
  it('should parse LaTeX blocks', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        '$$\\mathcal L\\left(f\\cdot g\\right)$$\n' +
          '$$\n' +
          '\\int_0^\\infty f(x)\\cdot g(x)\\mathrm dx\n' +
          '$$\n' +
          '$$end'
      )
    );
    var parser = new Parser(tokenStream);
    var latex = parser.parseLatexblock()[0];
    expect(latex.value).toEqual('\\mathcal L\\left(f\\cdot g\\right)');
    expect(
      parser.dom.latexParser.has('\\mathcal L\\left(f\\cdot g\\right)')
    ).toBeTruthy();

    latex = parser.parseLatexblock()[0];
    expect(latex.value).toEqual('\\int_0^\\infty f(x)\\cdot g(x)\\mathrm dx');
    expect(
      parser.dom.latexParser.has('\\int_0^\\infty f(x)\\cdot g(x)\\mathrm dx')
    ).toBeTruthy();
    var substitutes = parser.parseLatexblock()[0];
    expect(substitutes.type).not.toEqual(ComponentTypes.LATEXBLOCK);
    expect(tokenStream.eof()).toBeTruthy();
  });
  it('should parse softbreaks', () => {
    var tokenStream = new TokenStream(new CharacterStream('ABC\n' + '\n'));
    var parser = new Parser(tokenStream);
    tokenStream.read(); // ABC
    var softbreak = parser.parseSoftbreak();
    expect(softbreak).not.toBeNull();
    expect(softbreak.type).toEqual(ComponentTypes.SOFTBREAK);
    expect(softbreak.from).toEqual([0, 3]);
    expect(softbreak.to).toEqual([0, 3]);
    softbreak = parser.parseSoftbreak();
    expect(softbreak).not.toBeNull();
    expect(softbreak.type).toEqual(ComponentTypes.SOFTBREAK);
    expect(softbreak.from).toEqual([1, 0]);
    expect(softbreak.to).toEqual([1, 0]);
    expect(tokenStream.eof()).toBeTruthy();
  });
  it('should parse paragraphs', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        'Paragraph 1\n' + '\n' + 'Paragraph 2\n' + 'Still paragraph 2'
      )
    );
    var parser = new Parser(tokenStream);
    var paragraph = parser.parseParagraph();
    expect(paragraph).not.toBeNull();
    expect(paragraph.type).toEqual(ComponentTypes.PARAGRAPH);
    expect(paragraph.children.length).toBe(1);
    tokenStream.skipToNextRow(); // \n
    paragraph = parser.parseParagraph();
    expect(paragraph).not.toBeNull();
    expect(paragraph.type).toEqual(ComponentTypes.PARAGRAPH);
    expect(paragraph.children.length).toBe(3);
    expect(tokenStream.eof()).toBeTruthy();
  });
  it('should parse any string sequence', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        'Lorem Ipsum.\n' +
          '**bold text**\n' +
          '_Italics_\n' +
          '~~strikethrough~~\n' +
          '$x = \\dot y$\n' +
          '`var a = 42;`'
      )
    );
    var parser = new Parser(tokenStream);
    var element = parser.parseAnyString();
    expect(element).not.toBeNull();
    expect(element.type).toEqual(ComponentTypes.TEXT);
    expect(element.value).toEqual('Lorem Ipsum.');
    expect(element.from).toEqual([0, 0]);
    expect(element.to).toEqual([0, 11]);

    tokenStream.skipToNextRow();
    element = parser.parseAnyString();
    expect(element).not.toBeNull();
    expect(element.type).toEqual(ComponentTypes.BOLD);
    expect(element.from).toEqual([1, 0]);
    expect(element.to).toEqual([1, 12]);
    expect(element.children.length).toBe(1);
    expect(element.first().type).toEqual(ComponentTypes.TEXT);
    expect(element.first().value).toEqual('bold text');
    expect(element.first().from).toEqual([1, 2]);
    expect(element.first().to).toEqual([1, 10]);

    tokenStream.skipToNextRow();
    element = parser.parseAnyString();
    expect(element).not.toBeNull();
    expect(element.type).toEqual(ComponentTypes.ITALICS);
    expect(element.from).toEqual([2, 0]);
    expect(element.to).toEqual([2, 8]);
    expect(element.children.length).toBe(1);
    expect(element.first().type).toEqual(ComponentTypes.TEXT);
    expect(element.first().value).toEqual('Italics');
    expect(element.first().from).toEqual([2, 1]);
    expect(element.first().to).toEqual([2, 7]);

    tokenStream.skipToNextRow();
    element = parser.parseAnyString();
    expect(element).not.toBeNull();
    expect(element.type).toEqual(ComponentTypes.STRIKETHROUGH);
    expect(element.from).toEqual([3, 0]);
    expect(element.to).toEqual([3, 16]);
    expect(element.children.length).toBe(1);
    expect(element.first().type).toEqual(ComponentTypes.TEXT);
    expect(element.first().value).toEqual('strikethrough');
    expect(element.first().from).toEqual([3, 2]);
    expect(element.first().to).toEqual([3, 14]);

    tokenStream.skipToNextRow();
    element = parser.parseAnyString();
    expect(element).not.toBeNull();
    expect(element.type).toEqual(ComponentTypes.INLINELATEX);
    expect(element.from).toEqual([4, 0]);
    expect(element.to).toEqual([4, 11]);
    expect(element.children.length).toBe(0);
    expect(element.value).toEqual('x = \\dot y');

    tokenStream.skipToNextRow();
    element = parser.parseAnyString();
    expect(element).not.toBeNull();
    expect(element.type).toEqual(ComponentTypes.INLINECODE);
    expect(element.from).toEqual([5, 0]);
    expect(element.to).toEqual([5, 12]);
    expect(element.children.length).toBe(0);
    expect(element.value).toEqual('var a = 42;');
  });
  it('should parse text rows', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('Lorem Ipsum.\n`inline code`')
    );
    var parser = new Parser(tokenStream);
    var row = parser.parseRow();
    expect(row.length).toBe(1);
    expect(row[0].type).toEqual(ComponentTypes.TEXT);
    tokenStream.skipToNextRow();
    row = parser.parseRow();
    expect(row.length).toBe(1);
    expect(row[0].type).toEqual(ComponentTypes.INLINECODE);
  });
  it('should parse a text token', () => {
    var tokenStream = new TokenStream(new CharacterStream('Lorem Ipsum.'));
    var parser = new Parser(tokenStream);
    var text = parser.parseText();
    expect(text).not.toBeNull();
    expect(text.type).toEqual(ComponentTypes.TEXT);
    expect(text.from).toEqual([0, 0]);
    expect(text.to).toEqual([0, 11]);
    expect(text.value).toEqual('Lorem Ipsum.');
  });
  it('should reinterpret failed formatting as text', () => {
    var tokenStream = new TokenStream(new CharacterStream('**Failed\n'));
    var parser = new Parser(tokenStream);
    var bold = tokenStream.read();
    var text = tokenStream.read();
    var cache = [bold, text];
    var reinterpreted = parser.reinterpretAsText(cache);
    expect(reinterpreted).not.toBeNull();
    expect(reinterpreted.type).toEqual(ComponentTypes.TEXT);
    expect(reinterpreted.value).toEqual('**Failed');
    expect(reinterpreted.from).toEqual([0, 0]);
    expect(reinterpreted.to).toEqual([0, 7]);
  });
  it('should parse bold text', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('**Lorem Ipsum.**\n**Failed 1\n**Failed 2')
    );
    var parser = new Parser(tokenStream);
    var bold = parser.parseBold();
    expect(bold).not.toBeNull();
    expect(bold.type).toEqual(ComponentTypes.BOLD);
    expect(bold.from).toEqual([0, 0]);
    expect(bold.to).toEqual([0, 15]);
    expect(bold.children.length).toBe(1);
    expect(bold.first().value).toEqual('Lorem Ipsum.');

    tokenStream.skipToNextRow();
    bold = parser.parseBold();
    expect(bold).not.toBeNull();
    expect(bold.type).toEqual(ComponentTypes.TEXT);
    expect(bold.value).toEqual('**Failed 1');
    expect(bold.from).toEqual([1, 0]);
    expect(bold.to).toEqual([1, 9]);

    tokenStream.skipToNextRow();
    bold = parser.parseBold();
    expect(bold).not.toBeNull();
    expect(bold.type).toEqual(ComponentTypes.TEXT);
    expect(bold.value).toEqual('**Failed 2');
    expect(bold.from).toEqual([2, 0]);
    expect(bold.to).toEqual([2, 9]);
  });
  it('should parse italicized text', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('_Lorem Ipsum._\n_Failed 1\n_Failed 2')
    );
    var parser = new Parser(tokenStream);
    var italics = parser.parseItalics();
    expect(italics).not.toBeNull();
    expect(italics.type).toEqual(ComponentTypes.ITALICS);
    expect(italics.from).toEqual([0, 0]);
    expect(italics.to).toEqual([0, 13]);
    expect(italics.children.length).toBe(1);
    expect(italics.first().value).toEqual('Lorem Ipsum.');

    tokenStream.skipToNextRow();
    italics = parser.parseItalics();
    expect(italics).not.toBeNull();
    expect(italics.type).toEqual(ComponentTypes.TEXT);
    expect(italics.value).toEqual('_Failed 1');
    expect(italics.from).toEqual([1, 0]);
    expect(italics.to).toEqual([1, 8]);

    tokenStream.skipToNextRow();
    italics = parser.parseItalics();
    expect(italics).not.toBeNull();
    expect(italics.type).toEqual(ComponentTypes.TEXT);
    expect(italics.value).toEqual('_Failed 2');
    expect(italics.from).toEqual([2, 0]);
    expect(italics.to).toEqual([2, 8]);
  });
  it('should parse strikethrough text', () => {
    var tokenStream = new TokenStream(
      new CharacterStream('~~Lorem Ipsum.~~\n~~Failed 1\n~~Failed 2')
    );
    var parser = new Parser(tokenStream);
    var strike = parser.parseStrikethrough();
    expect(strike).not.toBeNull();
    expect(strike.type).toEqual(ComponentTypes.STRIKETHROUGH);
    expect(strike.from).toEqual([0, 0]);
    expect(strike.to).toEqual([0, 15]);
    expect(strike.children.length).toBe(1);
    expect(strike.first().value).toEqual('Lorem Ipsum.');

    tokenStream.skipToNextRow();
    strike = parser.parseStrikethrough();
    expect(strike).not.toBeNull();
    expect(strike.type).toEqual(ComponentTypes.TEXT);
    expect(strike.value).toEqual('~~Failed 1');
    expect(strike.from).toEqual([1, 0]);
    expect(strike.to).toEqual([1, 9]);

    tokenStream.skipToNextRow();
    strike = parser.parseStrikethrough();
    expect(strike).not.toBeNull();
    expect(strike.type).toEqual(ComponentTypes.TEXT);
    expect(strike.value).toEqual('~~Failed 2');
    expect(strike.from).toEqual([2, 0]);
    expect(strike.to).toEqual([2, 9]);
  });
  it('should parse inline latex', () => {
    var tokenStream = new TokenStream(new CharacterStream('$z_n=z_{n-1}^2+c$'));
    var parser = new Parser(tokenStream);
    var latex = parser.parseLatex();
    expect(latex.value).toEqual('z_n=z_{n-1}^2+c');
    expect(parser.dom.latexParser.has('z_n=z_{n-1}^2+c')).toBeTruthy();
  });
  it('should parse links', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        '[linktext](https://duckduckgo.com/)\n' +
          '[link text](https://duckduckgo.com/ "tooltip")\n' +
          '[link **text**](https://duckduckgo.com/ "tooltip 2")\n' +
          '[link reference][ref id]\n' +
          '[single ref]'
      )
    );
    var parser = new Parser(tokenStream);
    var link = parser.parseLink();
    expect(link).not.toBeNull();
    expect(link.type).toEqual(ComponentTypes.LINK);
    expect(link.children.length).toBe(1);
    expect(link.children[0].value).toEqual('linktext');
    expect(link.url).toEqual('https://duckduckgo.com/');

    tokenStream.skipToNextRow();
    link = parser.parseLink();
    expect(link).not.toBeNull();
    expect(link.type).toEqual(ComponentTypes.LINK);
    expect(link.children.length).toBe(1);
    expect(link.children[0].value).toEqual('link text');
    expect(link.url).toEqual('https://duckduckgo.com/');
    expect(link.alt).toEqual('tooltip');

    tokenStream.skipToNextRow();
    link = parser.parseLink();
    expect(link).not.toBeNull();
    expect(link.type).toEqual(ComponentTypes.LINK);
    expect(link.children.length).toBe(2);
    expect(link.url).toEqual('https://duckduckgo.com/');
    expect(link.alt).toEqual('tooltip 2');

    tokenStream.skipToNextRow();
    link = parser.parseLink();
    expect(link).not.toBeNull();
    expect(link.type).toEqual(ComponentTypes.LINK);
    expect(link.children.length).toBe(1);
    expect(link.children[0].value).toEqual('link reference');
    expect(link.referenceId).toEqual('ref id');

    tokenStream.skipToNextRow();
    link = parser.parseLink();
    expect(link).not.toBeNull();
    expect(link.type).toEqual(ComponentTypes.LINK);
    expect(link.children.length).toBe(0);
    expect(link.referenceId).toEqual('single ref');
  });
  it('should parse images', () => {
    var tokenStream = new TokenStream(
      new CharacterStream(
        '![linktext](https://duckduckgo.com/)\n' +
          '![link text](https://duckduckgo.com/ "tooltip")\n' +
          '![link **text**](https://duckduckgo.com/ "tooltip 2")\n' +
          '![link reference][ref id]\n' +
          '![single ref]'
      )
    );
    var parser = new Parser(tokenStream);
    var image = parser.parseImage();
    expect(image).not.toBeNull();
    expect(image.type).toEqual(ComponentTypes.IMAGE);
    expect(image.children.length).toBe(1);
    expect(image.children[0].value).toEqual('linktext');
    expect(image.url).toEqual('https://duckduckgo.com/');
    expect(parser.dom.images.includes(image)).toBeTruthy();

    tokenStream.skipToNextRow();
    image = parser.parseImage();
    expect(image).not.toBeNull();
    expect(image.type).toEqual(ComponentTypes.IMAGE);
    expect(image.children.length).toBe(1);
    expect(image.children[0].value).toEqual('link text');
    expect(image.url).toEqual('https://duckduckgo.com/');
    expect(image.alt).toEqual('tooltip');
    expect(parser.dom.images.includes(image)).toBeTruthy();

    tokenStream.skipToNextRow();
    image = parser.parseImage();
    expect(image).not.toBeNull();
    expect(image.type).toEqual(ComponentTypes.IMAGE);
    expect(image.children.length).toBe(2);
    expect(image.url).toEqual('https://duckduckgo.com/');
    expect(image.alt).toEqual('tooltip 2');
    expect(parser.dom.images.includes(image)).toBeTruthy();

    tokenStream.skipToNextRow();
    image = parser.parseImage();
    expect(image).not.toBeNull();
    expect(image.type).toEqual(ComponentTypes.IMAGE);
    expect(image.children.length).toBe(1);
    expect(image.children[0].value).toEqual('link reference');
    expect(image.referenceId).toEqual('ref id');
    expect(parser.dom.images.includes(image)).toBeTruthy();

    tokenStream.skipToNextRow();
    image = parser.parseImage();
    expect(image).not.toBeNull();
    expect(image.type).toEqual(ComponentTypes.IMAGE);
    expect(image.children.length).toBe(0);
    expect(image.referenceId).toEqual('single ref');
    expect(parser.dom.images.includes(image)).toBeTruthy();
  });
  it('Should parse a document to an array', () => {
    var arr = Parser.parseToArray(
      '# Introduction\n' +
        'Even though a day too late; **May the fourth be with you!**\n' +
        "Now let's get back to _buisness_:\n" +
        '\n' +
        '```js\n' +
        'var content = "...";\n' +
        'var dom = Parser.parseToDOM(content);\n' +
        '```\n' +
        '\n' +
        'Will parse the `content`-variable as a markdown source to an ' +
        'object-oriented representation.\n' +
        'The resulting `dom`-object provides:\n' +
        '\n' +
        '* **headers**: A list of the headers found in the document.\n' +
        '* **toc**: The table of contents, if found.\n' +
        '* **tof**: The table of figures, if found.\n' +
        '* **references**: A list of the references found in the document.\n' +
        '* **images**: A list of the images found in the document.\n' +
        '* **latexParser**: The latex parser with cache, which was used ' +
        'during the parsing.\n'
    );
    expect(arr.length).toBe(5);
    expect(arr[0].type).toEqual(ComponentTypes.HEADER);
    expect(arr[1].type).toEqual(ComponentTypes.PARAGRAPH);
    expect(arr[2].type).toEqual(ComponentTypes.CODEBLOCK);
    expect(arr[3].type).toEqual(ComponentTypes.PARAGRAPH);
    expect(arr[4].type).toEqual(ComponentTypes.UNNUMBEREDLIST);
  });
  it('Should parse a document to a DOM', () => {
    var dom = Parser.parseToDOM(
      '# Introduction\n' +
        'Even though a day too late; **May the fourth be with you!**\n' +
        "Now let's get back to _buisness_:\n" +
        '\n' +
        '```js\n' +
        'var content = "...";\n' +
        'var dom = Parser.parseToDOM(content);\n' +
        '```\n' +
        '\n' +
        'Will parse the `content`-variable as a markdown source to an ' +
        'object-oriented representation.\n' +
        'The resulting `dom`-object provides:\n' +
        '\n' +
        '* **headers**: A list of the headers found in the document.\n' +
        '* **toc**: The table of contents, if found.\n' +
        '* **tof**: The table of figures, if found.\n' +
        '* **references**: A list of the references found in the document.\n' +
        '* **images**: A list of the images found in the document.\n' +
        '* **latexParser**: The latex parser with cache, which was used ' +
        'during the parsing.\n'
    );
    expect(dom.children.length).toBe(5);
    expect(dom.children[0].type).toEqual(ComponentTypes.HEADER);
    expect(dom.children[1].type).toEqual(ComponentTypes.PARAGRAPH);
    expect(dom.children[2].type).toEqual(ComponentTypes.CODEBLOCK);
    expect(dom.children[3].type).toEqual(ComponentTypes.PARAGRAPH);
    expect(dom.children[4].type).toEqual(ComponentTypes.UNNUMBEREDLIST);
    expect(dom.headers.length).toBe(1);
  });
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
      '**Hi _th`ere`_**! Image: ![alt text](./img.png); Ref: [alt text2](https://duckduckgo.com/)'
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
        '\n' +
        '5. fourth\n' +
        '6. fifth'
    );
  });
  it('should parse an unordered list correctly', () => {
    var dom = DOM.parse('* first\n* second\n* third');
    expect(dom.toString()).toEqual('first\nsecond\nthird');
  });
  it('should parse nested lists correctly', () => {
    var dom = DOM.parse('1. item one\n2. item two\n	* sublist\n	* sublist');
    expect(dom.toMarkDown()).toEqual(
      '1. item one\n2. item two\n	* sublist\n	* sublist'
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
        '<ol><li>first</li><li>second</li></ol>'
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
    expect(header.from).toEqual([0, 0]);
    expect(header.to).toEqual([0, 13]);
  });
  it('should parse one TOC and only one', () => {
    var dom = DOM.parse('# Header\n' + '[TOC]\n' + '\n' + '[TOC]');
    var count = 0;
    for (const child of dom.children) {
      if (child instanceof TOC) count++;
    }
    expect(count).toEqual(1);
    expect(dom.toc).toBeDefined();
  });
  it('should parse one TOF and only one', () => {
    var dom = DOM.parse(
      '![alt text](./img.png)\n' + '[TOF]\n' + '\n' + '[TOF]'
    );
    var count = 0;
    for (const child of dom.children) {
      if (child instanceof TOF) count++;
    }
    expect(count).toEqual(1);
    expect(dom.tof).toBeDefined();
  });
});

describe('LaTeX Parser', () => {
  it('should parse latex', () => {
    var latexParser = new LatexParser();
    expect(latexParser.parse('x = \\dot x')).toMatch(/^<.+>$/);
  });
  it('should know if an expression has been parsed before', () => {
    var latexParser = new LatexParser();
    var math = 'x = \\dot x';
    expect(latexParser.has(math)).toBeFalsy();
    var result = latexParser.parse(math);
    expect(latexParser.has(math)).toBeTruthy();
  });
  it('should return cached expressions', () => {
    var latexParser = new LatexParser();
    var math = 'x = \\dot x';
    var result = latexParser.parse(math);
    expect(latexParser.get(math)).toEqual(result);
  });
  it('should cache expression-html-pairs', () => {
    var latexParser = new LatexParser();
    var math = 'x = \\dot x';
    var result = '<makeshifthtml/>';
    expect(latexParser.has(math)).toBeFalsy();
    latexParser.add(math, result);
    expect(latexParser.has(math)).toBeTruthy();
  });
  it('should throw out cached expressions when limit reached', () => {
    var cacheSize = 2;
    var latexParser = new LatexParser(cacheSize);
    var math = 'x = \\dot x';
    var parsed = latexParser.parse(math);
    expect(parsed).not.toEqual(math);
    expect(latexParser.has(math));
    expect(latexParser.keys.length).toBe(1);
    expect(latexParser.values.length).toBe(1);
    expect(latexParser.keys.includes(math)).toBeTruthy();
    expect(latexParser.values.includes(parsed)).toBeTruthy();

    var math2 = '\\int_0^\\infty';
    parsed = latexParser.parse(math2);
    expect(parsed).not.toEqual(math2);
    expect(latexParser.has(math2)).toBeTruthy();
    expect(latexParser.has(math)).toBeTruthy();
    expect(latexParser.keys.length).toBe(cacheSize);
    expect(latexParser.values.length).toBe(cacheSize);
    expect(latexParser.keys.includes(math2)).toBeTruthy();
    expect(latexParser.values.includes(parsed)).toBeTruthy();

    parsed = latexParser.parse(math2);
    expect(parsed).not.toEqual(math2);
    expect(latexParser.has(math2)).toBeTruthy();
    expect(latexParser.has(math)).toBeTruthy();
    expect(latexParser.keys.length).toBe(cacheSize);
    expect(latexParser.values.length).toBe(cacheSize);
    expect(latexParser.keys.includes(math2)).toBeTruthy();
    expect(latexParser.values.includes(parsed)).toBeTruthy();

    var math3 = '\\mathcal L';
    parsed = latexParser.parse(math3);
    expect(parsed).not.toEqual(math3);
    expect(latexParser.has(math3)).toBeTruthy();
    expect(latexParser.has(math2)).toBeTruthy();
    expect(latexParser.has(math)).toBeFalsy();
    expect(latexParser.keys.length).toBe(cacheSize);
    expect(latexParser.values.length).toBe(cacheSize);
    expect(latexParser.keys.includes(math3)).toBeTruthy();
    expect(latexParser.values.includes(parsed)).toBeTruthy();
  });
});
