/**
 * File for parsing markdown documents.
 *
 * This file provides functionality to parse markdown documents and convert
 * them into a DOM.
 *
 * @file   This files defines the markdown and markdown.parser namespace.
 * @author Raphael Emberger
 */

'use strict';

/**
 * Provides a character stream based on a string.
 */
class CharacterStream {
  /**
   * Creates a stream of characters.
   * @constructs CharacterStream
   * @static
   * @access public
   * @param {string} source The string to use as source.
   * @returns {CharacterStream} An instance of a CharacterStream.
   */
  constructor(source) {
    /**
     * String to stream.
     * @access private
     * @type {string}
     */
    this.source = source;
    /**
     * Current position in the string.
     * @access private
     * @type {number}
     */
    this.pos = 0;
    /**
     * Current row in the string.
     * @access public
     * @readonly
     * @type {number}
     */
    this.row = 0;
    /**
     * Current column in the string.
     * @access public
     * @readonly
     * @type {number}
     */
    this.column = 0;
  }
  /**
   * Returns the character of the current position, increments the position
   * and also updates the column and row properties of the class.
   * @access public
   * @returns {string} One character on the current position. The string is
   *                  empty if the end of the string has been reached.
   * @see eof()
   */
  read() {
    var char = this.source.charAt(this.pos);
    if (char != '') {
      if (char == '\n') {
        this.row++;
        this.column = 0;
      } else {
        this.column++;
      }
      this.pos++;
    }
    return char;
  }
  /**
   * Returns the match of the regex starting from the current position.
   * @access public
   * @param {RegExp} regex Regex to search for(floating: No leading ^).
   * @returns {RegExpMatchArray} The found match. null if no match.
   * @see test()
   */
  match(regex) {
    var substr = this.source.substr(this.pos);
    return substr.match(regex);
  }
  /**
   * Returns the position of the regex match from the current position
   * @access public
   * @param {RegExp} regex Regex to search for(floating: No leading ^).
   * @returns {number} The index of the first match. -1 if no match.
   */
  test(regex) {
    var match = this.match(regex);
    if (match) {
      return match.index;
    }
    return -1;
  }
  /**
   * Skips the position over the given distance and returns the skipped part.
   * @access public
   * @param {number} distance The zero-based distance to skip.
   * @returns {string} The skipped part.
   * @see test()
   */
  skip(distance) {
    if (distance < 0) this.croak('Distance to skip cannot be negative!');
    var value = this.source.substr(this.pos, distance);
    this.pos += value.length;
    var lines = value.split('\n');
    var newLines = lines.length - 1;
    this.row += newLines;
    if (newLines > 0) {
      this.column = lines[newLines].length;
    } else {
      this.column += value.length;
    }
    return value;
  }
  /**
   * Peeks the current character without incrementing the position.
   * @access public
   * @returns {string} The current character. The string is
   *                  empty if the end of the string has been reached.
   * @see eof()
   */
  peek() {
    return this.source.charAt(this.pos);
  }
  /**
   * Returns whether the end of the string has been reached.
   * @access public
   * @returns {boolean}
   */
  eof() {
    return this.peek() == '';
  }
  /**
   * Throws an error with a message and an indication of the current position.
   * @access private
   * @param {string} msg Error message to display.
   */
  croak(msg) {
    throw new Error(
      `${msg} (${this.row}:${this.column}): ${this.source.substr(this.pos)}`
    );
  }
}

/**
 * Provides a token stream based on an character stream
 */
class TokenStream {
  /**
   * Creates a stream of characters.
   * @constructs TokenStream
   * @static
   * @access public
   * @param {string} source The string to use as source.
   * @returns {TokenStream} An instance of a TokenStream.
   */
  constructor(charStream) {
    /**
     * Character stream.
     * @access private
     * @type {CharacterStream}
     */
    this.charStream = charStream;
    /**
     * Tokens to match.
     * @access private
     * @type {Token[]}
     */
    this.tokens = Tokens.all();
  }
  /**
   * Returns the token of the current position and increments the position.
   * @access private
   * @returns {Token} The Token on the current position. Null if the end of the
   *                  string has been reached.
   * @see eof()
   */
  read_next() {
    if (this.charStream.eof() && this.next == null) return null;
    var out = null;
    if (this.next) {
      // Leftover token from last match with prepended text
      out = this.next;
      this.next = null;
      return out;
    }
    var lowestDistance = this.charStream.source.length;
    var lowestBidder = null;
    for (const token of this.tokens) {
      var distance = 0;
      if ((distance = this.charStream.test(token.pattern)) >= 0) {
        if (distance < lowestDistance) {
          lowestDistance = distance;
          lowestBidder = token;
        }
      }
    }
    if (lowestBidder == null) {
      // No more tokens to be matches EXCEPT text.
      // So give it enough distance to parse it as text
      lowestDistance = this.charStream.source.length - this.charStream.pos;
    }
    if (lowestDistance > 0) {
      // There's text before the closest match. Capture it
      var textToken = new Token(TokenTypes.TEXT, /.+/);
      textToken.from = [this.charStream.row, this.charStream.column];
      textToken.value = this.charStream.skip(lowestDistance);
      textToken.to = [
        this.charStream.row,
        Math.max(this.charStream.column - 1, 0)
      ];
      out = textToken;
    }
    if (lowestBidder == null) return out;
    // Now store the already found Token for the next read_next()
    var newToken = lowestBidder.createNew();
    newToken.match = this.charStream.match(newToken.pattern);
    newToken.value = newToken.match[0];
    newToken.from = [this.charStream.row, this.charStream.column];
    this.charStream.skip(newToken.value.length);
    if (newToken.type == TokenTypes.NEWLINE) {
      newToken.to = newToken.from;
    } else {
      newToken.to = [
        this.charStream.row,
        Math.max(this.charStream.column - 1, 0)
      ];
    }
    if (lowestDistance > 0) {
      this.next = newToken;
    } else {
      out = newToken;
    }
    return out;
  }
  /**
   * Peeks the current token without incrementing the position.
   * @access public
   * @returns {Token} The current token. null if the end of the string has been
   *                  reached.
   * @see eof()
   */
  peek() {
    return this.current || (this.current = this.read());
  }
  /**
   * Returns the token of the current position if it hasn't been peeked before
   * and increments the position.
   * @access public
   * @returns {Token} The Token on the current position. Null if the end of the
   *                  string has been reached.
   * @see eof()
   * @see peek()
   */
  read() {
    var tok = this.current;
    this.current = null;
    return tok || this.read_next();
  }
  /**
   * Returns whether the end of the string has been reached.
   * @access public
   * @returns {boolean}
   */
  eof() {
    return this.peek() == null;
  }
  /**
   * Throws an error with a message and an indication of the current position.
   * @access private
   * @param {string} msg Error message to display.
   */
  croak(msg) {
    this.charStream.croak(msg);
  }
}

/**
 * Parses Markdown input to an object representation
 */
class Parser {
  /**
   * Creates a stream of characters.
   * @constructs Parser
   * @static
   * @access public
   * @param {MDDOM} dom The dom to construct the model in.
   * @returns {Parser} An instance of a Parser.
   */
  constructor(tokenStream) {
    /**
     * Token stream.
     * @access private
     * @type {TokenStream}
     */
    this.tokenStream = tokenStream;
    /**
     * DOM for reference.
     * @access private
     * @type {MDDOM}
     */
    this.dom = null;
  }
  /**
   * Parses a token stream and returns a DOM containing the parsed elements.
   * @access public
   * @static
   * @param {TokenStream} tokenStream The token stream to use as source.
   * @param {MDDOM} [dom=null] The dom to use as a reference.
   * @returns {MDDOM} The completed DOM
   */
  static parseToDOM(tokenStream, dom) {
    for (const component of Parser.parseToArray(tokenStream, dom)) {
      dom.add(component);
    }
    return dom;
  }
  /**
   * Parses a token stream and returns an array of the parsed elements.
   * @access public
   * @static
   * @param {TokenStream} tokenStream The token stream to use as source.
   * @param {MDDOM} [dom=null] The dom to use as a reference.
   * @returns {MDComponent[]} The parsed elements
   */
  static parseToArray(tokenStream, dom) {
    var parser = new Parser(tokenStream);
    parser.dom = dom;
    return parser.parse();
  }
  /**
   * Parses the token stream and prepares the parsed elements before returning
   * them.
   * @access public
   * @returns {MDComponent[]} The parsed elements
   */
  parse() {
    var out = [];
    var comp = null;
    while (!this.tokenStream.eof()) {
      var token = this.tokenStream.read();
      switch (token.type) {
        case TokenTypes.HEADER:
          out.push(this.parse_header(token));
          break;
        case TokenTypes.BLOCKQUOTE:
          out.push(this.parse_blockquote(token));
          break;
        case TokenTypes.LIST:
          out.push(this.parse_list(token));
          break;
        case TokenTypes.LATEXBLOCKSTART:
          out.push(this.parse_latexblock(token));
          break;
        case TokenTypes.CODEBLOCKSTART:
          out.push(this.parse_codeblock(token));
          break;
        case TokenTypes.REFERENCE:
          out.push(this.parse_reference(token));
          break;
        case TokenTypes.TOC:
          out.push(this.parse_toc(token));
          break;
        case TokenTypes.TOF:
          out.push(this.parse_tof(token));
          break;
        case TokenTypes.PAGEBREAK:
          out.push(this.parse_pagebreak(token));
          break;
        case TokenTypes.RULE:
          out.push(this.parse_rule(token));
          break;
        default:
          out.push(this.parse_paragraph(token));
          break;
      }
    }
    return out;
  }

  parse_header(token) {
    var header = new MDHeader();
    header.level = token.value.split('#').length - 1;
    header.from = token.from;
    for (const sub of this.parseUntilEOFOr(
      TokenTypes.NEWLINE,
      Tokens.fullRow()
    )) {
      header.add(sub);
    }
    header.to = header.last().to;
    return header;
  }
  /**
   * Parses until either EOF or the given token type has been reached.
   * @access private
   * @param {TokenTypes} stopType The type of token before which to stop.
   * @param {TokenTypes[]} [toText=[]] The types to ignore and to convert to
   *                                   text.
   * @returns {MDComponent[]} The parsed components.
   */
  parseUntilEOFOr(stopType, toText) {
    if (!toText) toText = [];
    var out = [];
    while (!checkForStopType(stopType)) {
      var token = this.tokenStream.read();
      if (toText.includes(token.type)) {
      }
    }
    return out;
  }
  /**
   * Checks if EOF or the specified token type has been reached.
   * @access private
   * @param {TokenTypes} type The token type to check for.
   * @returns {boolean}
   */
  checkForStopType(type) {
    return this.tokenStream.eof() || this.tokenStream.peek().type == type;
  }
  _parse_text_line() {
    var out = [];
    var conditions = [
      TokenTypes.TEXT,
      TokenTypes.BOLD,
      TokenTypes.ITALICS,
      TokenTypes.STRIKETHROUGH,
      TokenTypes.LATEXTOGGLE,
      TokenTypes.CODETOGGLE,
      TokenTypes.LINK,
      TokenTypes.IMAGE
    ];
    var finished = false;
    while (!finished && conditions.indexOf(this.tokenStream.peek().type) >= 0) {
      var token = this.tokenStream.read();
      var comp = null;
      switch (token.type) {
        case TokenTypes.TEXT:
          comp = this._parse_text(token);
          break;
        case TokenTypes.BOLD:
          comp = this._parse_bold(token);
          break;
        case TokenTypes.ITALICS:
          comp = this._parse_italics(token);
          break;
        case TokenTypes.STRIKETHROUGH:
          comp = this._parse_strikethrough(token);
          break;
        case TokenTypes.LATEXTOGGLE:
          comp = this._parse_inline_latex(token);
          break;
        case TokenTypes.CODETOGGLE:
          comp = this._parse_inline_code(token);
          break;
        case TokenTypes.LINK:
          comp = this._parse_link(token);
          break;
        case TokenTypes.IMAGE:
          comp = this._parse_image(token);
          break;
        default:
          finished = true;
          break;
      }
      out.push(comp);
      if (this.tokenStream.peek() == null) break;
    }
    return out;
  }
  _parse_text(token) {
    var comp = new MDText();
    comp.from = token.from;
    comp.to = token.to;
    comp.value = token.value;
    return comp;
  }
  _parse_bold(token) {
    var bold = new MDTextBold();
    bold.from = token.from;
    while ((token = this.tokenStream.peek())) {
      var comp = null;
      switch (token.type) {
        case TokenTypes.TEXT:
          comp = this._parse_text(this.tokenStream.read());
          break;
        case TokenTypes.BOLD:
          bold.to = token.to;
          this.tokenStream.read();
          return bold;
          break;
        case TokenTypes.ITALICS:
          comp = this._parse_italics(this.tokenStream.read());
          break;
        case TokenTypes.STRIKETHROUGH:
          comp = this._parse_strikethrough(this.tokenStream.read());
          break;
        case TokenTypes.LATEXTOGGLE:
          comp = this._parse_inline_latex(this.tokenStream.read());
          break;
        case TokenTypes.CODETOGGLE:
          comp = this._parse_inline_code(this.tokenStream.read());
          break;
        case TokenTypes.LINK:
          comp = this._parse_link(this.tokenStream.read());
          break;
        case TokenTypes.IMAGE:
          comp = this._parse_image(this.tokenStream.read());
          break;
        default:
          error('Unexpected Token: ' + token.type);
          break;
      }
      bold.add(comp);
    }
    this.tokenStream.croak('Unexpected end of string');
  }
  _parse_italics(token) {
    var italics = new MDTextItalics();
    italics.from = token.from;
    while ((token = this.tokenStream.peek())) {
      var comp = null;
      switch (token.type) {
        case TokenTypes.TEXT:
          comp = this._parse_text(this.tokenStream.read());
          break;
        case TokenTypes.BOLD:
          comp = this._parse_bold(this.tokenStream.read());
          break;
        case TokenTypes.ITALICS:
          italics.to = token.to;
          this.tokenStream.read();
          return italics;
        case TokenTypes.STRIKETHROUGH:
          comp = this._parse_strikethrough(this.tokenStream.read());
          break;
        case TokenTypes.LATEXTOGGLE:
          comp = this._parse_inline_latex(this.tokenStream.read());
          break;
        case TokenTypes.CODETOGGLE:
          comp = this._parse_inline_code(this.tokenStream.read());
          break;
        case TokenTypes.LINK:
          comp = this._parse_link(this.tokenStream.read());
          break;
        case TokenTypes.IMAGE:
          comp = this._parse_image(this.tokenStream.read());
          break;
        default:
          this.tokenStream.croak('Unexpected Token: ' + token.type);
          break;
      }
      italics.add(comp);
    }
    this.tokenStream.croak('Unexpected end of string');
  }
  _parse_strikethrough(token) {
    var strike = new MDTextStrikethrough();
    strike.from = token.from;
    while ((token = this.tokenStream.peek())) {
      var comp = null;
      switch (token.type) {
        case TokenTypes.TEXT:
          comp = this._parse_text(this.tokenStream.read());
          break;
        case TokenTypes.BOLD:
          comp = this._parse_bold(this.tokenStream.read());
          break;
        case TokenTypes.ITALICS:
          comp = this._parse_italics(this.tokenStream.read());
          break;
        case TokenTypes.STRIKETHROUGH:
          strike.to = token.to;
          this.tokenStream.read();
          return strike;
        case TokenTypes.LATEXTOGGLE:
          comp = this._parse_inline_latex(this.tokenStream.read());
          break;
        case TokenTypes.CODETOGGLE:
          comp = this._parse_inline_code(this.tokenStream.read());
          break;
        case TokenTypes.LINK:
          comp = this._parse_link(this.tokenStream.read());
          break;
        case TokenTypes.IMAGE:
          comp = this._parse_image(this.tokenStream.read());
          break;
        default:
          this.tokenStream.croak('Unexpected Token: ' + token.type);
          break;
      }
      strike.add(comp);
    }
    this.tokenStream.croak('Unexpected end of string');
  }
  _parse_inline_latex(token) {
    var latex = new MDTextLaTeX();
    var text = new MDText();
    text.value = '';
    latex.from = token.from;
    latex.add(text);
    while ((token = this.tokenStream.peek())) {
      switch (token.type) {
        case TokenTypes.LATEXTOGGLE:
          latex.to = token.to;
          this.tokenStream.read();
          return latex;
        case (TokenTypes.HEADER,
        TokenTypes.PARAGRAPH,
        TokenTypes.BLOCKQUOTE,
        TokenTypes.NUMBEREDLIST,
        TokenTypes.UNNUMBEREDLIST,
        TokenTypes.CODEBLOCKSTART,
        TokenTypes.CODEBLOCKEND,
        TokenTypes.LATEXBLOCKSTART,
        TokenTypes.LATEXBLOCKEND,
        TokenTypes.RULE,
        TokenTypes.TOC,
        TokenTypes.TOF,
        TokenTypes.PAGEBREAK,
        TokenTypes.NEWLINE):
          this.tokenStream.croak('Unexpected Token: ' + token.type);
          break;
        default:
          text.value += this.tokenStream.read().value;
          break;
      }
    }
    this.tokenStream.croak('Unexpected end of string');
  }
  _parse_inline_code(token) {
    var code = new MDTextCode();
    var text = new MDText();
    code.from = token.from;
    code.add(text);
    while ((token = this.tokenStream.peek())) {
      switch (token.type) {
        case TokenTypes.CODETOGGLE:
          code.to = token.to;
          this.tokenStream.read();
          return code;
        case (TokenTypes.HEADER,
        TokenTypes.PARAGRAPH,
        TokenTypes.BLOCKQUOTE,
        TokenTypes.NUMBEREDLIST,
        TokenTypes.UNNUMBEREDLIST,
        TokenTypes.CODEBLOCKSTART,
        TokenTypes.CODEBLOCKEND,
        TokenTypes.LATEXBLOCKSTART,
        TokenTypes.LATEXBLOCKEND,
        TokenTypes.RULE,
        TokenTypes.TOC,
        TokenTypes.TOF,
        TokenTypes.PAGEBREAK,
        TokenTypes.NEWLINE):
          this.tokenStream.croak('Unexpected Token: ' + token.type);
          break;
        default:
          text += this.tokenStream.read().value;
          break;
      }
    }
    this.tokenStream.croak('Unexpected end of string');
  }
  _parse_link(token) {
    var link = new MDLink();
    link.from = token.from;
    link.destination = token.match[4].value;
    link.add(this._parse_text(token.match[4]));
    if (token.match.length - 1 > 4 && token.match[5]) {
      link.title = token.match[5];
    }
    link.to = link.last().from;
    return link;
  }
  _parse_image(token) {
    var img = new MDImage();
    img.from = token.from;
    img.to = token.to;
    if (token.match[1].startsWith('[')) {
      img.alt = token.match[2];
      img.link = token.match[3];
      if (token.match[4].length > 0) {
        img.text = token.match[5];
      }
    } else {
      img.link = token.match[2];
      if (token.match[3].length > 0) {
        img.text = token.match[4];
      }
    }
    return img;
  }
  parse_paragraph(token) {
    var paragraph = new MDParagraph();
    paragraph.from = token.from;
    while ((token = this.tokenStream.peek())) {
      for (const sub of this._parse_text_line()) {
        paragraph.add(sub);
      }
      token = this.tokenStream.peek();
      if (token == null) break;
      if (token.type == TokenTypes.NEWLINE) {
        // Still going
        this.tokenStream.read();
        paragraph.add(this._create_softbreak(paragraph.last().to));
        continue;
      }
      break;
    }
    // if (paragraph.last() instanceof MDSoftBreak) {
    //   paragraph.remove(paragraph.last());
    // }
    paragraph.to = paragraph.last().to;
    return paragraph;
  }
  _parse_newline(token) {
    return this._create_softbreak(token.to);
  }
  _create_softbreak(from) {
    var softbreak = new MDSoftBreak();
    softbreak.from = from;
    softbreak.to = [from[0] + 1, 0];
    return softbreak;
  }
  parse_blockquote(token) {
    var quote = new MDBlockQuote();
    quote.from = token.from;
    while (token.type == TokenTypes.BLOCKQUOTE) {
      for (const sub of this._parse_text_line()) {
        quote.add(sub);
      }
      token = this.tokenStream.peek();
      if (token == null) break;
      var newline = new MDSoftBreak();
      newline.from = quote.last().to;
      newline.from[1]++;
      newline.to = newline.from;
      newline.to[0]++;
      newline.from[1] = 0;
      quote.add(new MDSoftBreak());
      token = this.tokenStream.read();
    }
    quote.to = quote.last().to;
    return quote;
  }
  parse_codeblock(token) {
    var code = new MDCodeBlock();
    code.from = token.from;
    while ((token = this.tokenStream.peek())) {
      for (const sub of this._parse_text_line()) {
        code.add(sub);
      }
      token = this.tokenStream.peek();
      if (token && token.type == NEWLINE) {
        // Still going
        this.tokenStream.read();
        code.add(this._parse_newline(token));
      } else {
        break;
      }
    }
  }
}

/**
 * Representation of a Token
 */
class Token {
  /**
   * Creates a stream of characters.
   * @constructs TokenStream
   * @static
   * @access public
   * @param {string} type The type of the token.
   * @see TokenTypes
   * @param {string} pattern The regex pattern.
   * @returns {Token} An instance of a Token.
   */
  constructor(type, pattern) {
    /**
     * Type identifier of the Token.
     * @access public
     * @readonly
     * @type {string}
     */
    this.type = type;
    /**
     * Pattern of the Token.
     * @access public
     * @readonly
     * @type {RegExp}
     */
    this.pattern = pattern;
    /**
     * Value of the matched string.
     * @access public
     * @readonly
     * @type {string}
     */
    this.value = '';
    /**
     * Match of the the pattern.
     * @access public
     * @readonly
     * @type {RegExpMatchArray}
     */
    this.match = null;
    /**
     * Start of the Token. First value corresponds to the row, the second one
     * to the column.
     * @access public
     * @readonly
     * @type {number[]}
     */
    this.from = [];
    /**
     * End of the Token. First value corresponds to the row, the second one
     * to the column.
     * @access public
     * @readonly
     * @type {number[]}
     */
    this.to = [];
  }
  /**
   * Creates a new Token of the same type with the same pattern.
   * @access public
   * @returns {Token}
   */
  createNew() {
    return new Token(this.type, this.pattern);
  }
}
/**
 * Enum of all the available Token types.
 */
const TokenTypes = Object.freeze({
  HEADER: 'Header',
  BLOCKQUOTE: 'Blockquote',
  RULE: 'Rule',
  LIST: 'List',
  REFERENCE: 'Reference',
  CODEBLOCK: 'Codeblock',
  TOC: 'TOC',
  TOF: 'TOF',
  PAGEBREAK: 'Pagebreak',
  LATEXBLOCK: 'LaTeXblock',
  NEWLINE: 'Newline',
  BOLD: 'Bold',
  ITALICS: 'Italics',
  STRIKETHROUGH: 'Strikethrough',
  IMAGESTART: 'ImageStart',
  LINKSTART: 'LinkStart',
  IMGLINKINLINE: 'Image/LinkInline',
  IMGLINKREFERENCE: 'Image-/LinkReference',
  IMGLINKEND: 'Image-/LinkEnd',
  CODE: 'Code',
  LATEX: 'LaTeX',
  TEXT: 'Text'
});
/**
 * Enum of all the available Tokens.
 */
const Tokens = Object.freeze({
  HEADER: new Token(TokenTypes.HEADER, /#{1,6}[\ \t]+(?=[^\s])/),
  BLOCKQUOTE: new Token(TokenTypes.BLOCKQUOTE, />[\ \t]+(?=[^\s])/),
  RULE: new Token(TokenTypes.RULE, /(\*\*\*|---|___)$/m),
  LIST: new Token(
    TokenTypes.LIST,
    /(    |\t)*([1-9]\d*?\.|\*)[\ \t]+(?=[^\s])/
  ),
  CODEBLOCK: new Token(TokenTypes.CODEBLOCK, /```/),
  TOC: new Token(TokenTypes.TOC, /\[TOC\]$/m),
  TOF: new Token(TokenTypes.TOF, /\[TOF\]$/m),
  PAGEBREAK: new Token(TokenTypes.PAGEBREAK, /\[PB\]$/m),
  REFERENCE: new Token(
    TokenTypes.REFERENCE,
    /\[([^\[\]]+?)\]\:[\ \t]+([^\s]+)([\ \t]+\"([^\"]+)\"|)$/m
  ),
  LATEXBLOCK: new Token(TokenTypes.LATEXBLOCK, /\$\$/),
  NEWLINE: new Token(TokenTypes.NEWLINE, /\n/),
  BOLD: new Token(TokenTypes.BOLD, /\*\*/),
  ITALICS: new Token(TokenTypes.ITALICS, /_/),
  STRIKETHROUGH: new Token(TokenTypes.STRIKETHROUGH, /~~/),
  IMAGESTART: new Token(TokenTypes.IMAGESTART, /!\[/),
  LINKSTART: new Token(TokenTypes.LINKSTART, /\[/),
  IMGLINKINLINE: new Token(
    TokenTypes.IMGLINKINLINE,
    /\]\([^\s\(\)\[\]]+((?=\))| ")/
  ),
  IMGLINKREFERENCE: new Token(
    TokenTypes.IMGLINKREFERENCE,
    /\]\[([^\s\(\)\[\]]([^\(\)\[\]]+[^\s\(\)\[\]]|)(?=\]))/
  ),
  IMGLINKEND: new Token(TokenTypes.IMGLINKEND, /("\)|\)|\])/),
  CODE: new Token(TokenTypes.CODE, /`/),
  LATEX: new Token(TokenTypes.LATEX, /\$/),
  TEXT: new Token(TokenTypes.TEXT, /.+/),
  /**
   * Filters for those Tokens that are only to be found at the beginning of the
   * line.
   * @access public
   * @returns {Token[]}
   */
  fullRow() {
    return [
      this.HEADER,
      this.BLOCKQUOTE,
      this.RULE,
      this.LIST,
      this.CODEBLOCK,
      this.TOC,
      this.TOF,
      this.PAGEBREAK,
      this.REFERENCE,
      this.LATEXBLOCK,
      this.NEWLINE
    ];
  },
  /**
   * Filters for those Tokens which are normally found inside a single row.
   * @access public
   * @returns {Token[]}
   */
  inline() {
    return [
      this.BOLD,
      this.ITALICS,
      this.STRIKETHROUGH,
      this.IMAGESTART,
      this.LINKSTART,
      this.IMGLINKINLINE,
      this.IMGLINKREFERENCE,
      this.IMGLINKEND,
      this.CODE,
      this.LATEX
    ];
  },
  /**
   * Filters for all the tokens for tokenizing except the TEST-Token.
   * @access public
   * @returns {Token[]}
   * @see this.allWithText()
   */
  all() {
    return this.fullRow().concat(this.inline());
  },
  /**
   * Filters for all the tokens including the TEST-Token.
   * @access public
   * @returns {Token[]}
   */
  allInclText() {
    return this.all().concat(this.TEXT);
  }
});

class TokenFilter {
  constructor() {}
  oneOf(tokenArray) {}
  nOf(number, tokenArray) {}
  anyNOf(tokenArray) {}
  noneOf(tokenArray) {}
}

// old system:
const commonmark = require('commonmark');
var toc_found = false;
var tof_found = false;

class MDComponent {
  constructor() {
    this.parent = null;
    this.children = [];
  }

  add(component) {
    component.parent = this;
    this.children.push(component);
  }

  insert(component, index) {
    component.parent = this;
    this.children.splice(index, 0, component);
  }

  remove(component) {
    if (this.children.includes(component)) {
      this.removeAt(this.children.indexOf(component));
    }
  }

  removeAt(index) {
    if (this.children[index]) {
      this.children[index].parent = null;
      this.children.splice(index);
    }
  }
  first() {
    if (this.children.length == 0) return null;
    return this.children[0];
  }
  last() {
    if (this.children.length == 0) return null;
    return this.children[this.children.length - 1];
  }

  // Consume token to check for a prematch
  prematch(tokens, index) {
    var prematchIndex = 0;
    for (const prematchFilter of this.prematchFilters) {
      if (prematchFilter.matches.includes(EOF)) {
      }
      if (prematchFilter.match(tokens[index + prematchIndex])) {
        this.prematchIndex++;
      } else {
        this.prematchIndex = 0;
      }
    }
    return this.prematchIndex == this.prematchFilters.length;
  }

  // Check for match and if not invalidated by escaping or nesting exclusions
  match(tokens, index, stack) {
    if (!this._couldMatch(tokens, index)) return false;
    if (!this._isNotEscaped(tokens, index)) return false;
    if (!this._isNotInsideExcludingComponents(stack)) return false;
    return true;
  }

  // Check if this could be a match
  _couldMatch(tokens, index) {}

  // Check for leading escape
  _isNotEscaped(tokens, index) {
    if (this.escapable && index > 0) {
      if (tokens[index - 1].type == ESCAPE) return false;
    }
    return true;
  }

  // Check for elements in a higher hierarchy excluding this component
  _isNotInsideExcludingComponents(stack) {
    return !stack.includes(this.nestedExclusions);
  }

  // Replace current component with a new one if parsable
  _parseReplace() {
    return this;
  }

  // Make some post parse actions if necessary
  _aftermath(dom) {
    return;
  }

  toHtml() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toHtml());
    }
    return tags.join('');
  }

  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('');
  }

  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return tags.join('');
  }
}

// text components:
class MDText extends MDComponent {
  toHtml() {
    if (this.value) return this.value;
    return super.toHtml();
  }
  toString() {
    return this.value;
  }
  toMarkDown() {
    return this.value;
  }
}

class MDTextBold extends MDText {
  toHtml() {
    return `<strong>${super.toHtml()}</strong>`;
  }
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('');
  }
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return `**${tags.join('')}**`;
  }
}

class MDTextItalics extends MDText {
  toHtml() {
    return `<em>${super.toHtml()}</em>`;
  }
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('');
  }
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return `_${tags.join('')}_`;
  }
}

class MDTextStrikethrough extends MDText {
  toHtml() {
    return `<s>${super.toHtml()}</s>`;
  }
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('');
  }
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return `~~${tags.join('')}~~`;
  }
}

class MDTextCode extends MDText {
  toHtml() {
    return `<code>${this.value}</code>`;
  }
  toString() {
    return this.value;
  }
  toMarkDown() {
    return `\`${this.value}\``;
  }
}

class MDTextLaTeX extends MDText {
  toHtml() {
    return `<span>${super.toHtml()}</span>`;
  }
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('');
  }
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return `\$${tags.join('')}\$`;
  }
}

class MDLink extends MDComponent {
  toHtml() {
    if (this.title) {
      return `<a href="${this.destination}" title="${
        this.title
      }">${super.toHtml()}</a>`;
    }
    return `<a href="${this.destination}">${super.toHtml()}</a>`;
  }
  toMarkDown() {
    if (this.title)
      return `[${super.toMarkDown()}](${this.destination} "${this.title}")`;
    return `[${super.toMarkDown()}](${this.destination})`;
  }
}

class MDImage extends MDComponent {
  toHtml() {
    if (this.id) {
      return `<img src="${this.destination}" id="${
        this.id
      }" alt="${super.toHtml()}"/>`;
    }
    return `<img src="${this.destination}" alt="${super.toHtml()}"/>`;
  }
  toMarkDown() {
    return `![${super.toMarkDown()}](${this.destination} "${this.title}")`;
  }
}

class MDSoftBreak extends MDComponent {
  toHtml() {
    return ` <br/> `;
  }
  toString() {
    return '\n';
  }
  toMarkDown() {
    return '\n';
  }
}

// per line components:

class MDHeader extends MDComponent {
  toHtml() {
    if (this.id) {
      return `<h${this.level} id="${this.id}">${super.toHtml()}</h${
        this.level
      }>`;
    }
    return `<h${this.level}>${super.toHtml()}</h${this.level}>`;
  }
  toMarkDown() {
    return `${'#'.repeat(this.level)} ${super.toMarkDown()}`;
  }
}

class MDParagraph extends MDComponent {
  _parseReplace() {
    var obj = this;
    obj = MDTOC._test(this.toString()) ? MDTOC._parse(this) : obj;
    obj = MDTOF._test(this.toString()) ? MDTOF._parse(this) : obj;
    return obj;
  }
  toHtml() {
    return `<p>${super.toHtml()}</p>`;
  }
  toString() {
    return super.toString();
  }
  toMarkDown() {
    return super.toMarkDown();
  }
}

class MDListBase extends MDComponent {
  _aftermath(dom) {
    this._scoutNestedLevels(0);
  }
  _scoutNestedLevels(level) {
    this.level = level;
    for (const child of this.children) {
      for (const subItem of child.children) {
        if (subItem instanceof MDListBase) {
          subItem._scoutNestedLevels(this.level + 1);
        }
      }
    }
  }
}

class MDOrderedList extends MDListBase {
  toHtml() {
    if (this.start != 1) {
      return `<ol start="${this.start}">${super.toHtml()}</ol>`;
    }
    return `<ol>${super.toHtml()}</ol>`;
  }
  toString() {
    var index = this.start || 1;
    var tags = [];
    if (this.level != 0) tags.push('');
    for (var component of this.children) {
      tags.push('\t'.repeat(this.level) + component.toString());
      index++;
    }
    return tags.join('\n');
  }
  toMarkDown() {
    var index = this.start || 1;
    var tags = [];
    if (this.level != 0) tags.push('');
    for (var component of this.children) {
      tags.push(
        '\t'.repeat(this.level) + index + '. ' + component.toMarkDown()
      );
      index++;
    }
    return tags.join('\n') + '\n';
  }
}

class MDBulletList extends MDListBase {
  toHtml() {
    return `<ul>${super.toHtml()}</ul>`;
  }
  toString() {
    var tags = [];
    if (this.level != 0) tags.push('');
    for (var component of this.children) {
      tags.push('\t'.repeat(this.level) + component.toString());
    }
    return tags.join('\n');
  }
  toMarkDown() {
    var tags = [];
    if (this.level != 0) tags.push('');
    for (var component of this.children) {
      tags.push('\t'.repeat(this.level) + '- ' + component.toMarkDown());
    }
    return tags.join('\n') + '\n';
  }
}

class MDItem extends MDComponent {
  toHtml() {
    return `<li>${super.toHtml()}</li>`;
  }
}

class MDBlockQuote extends MDComponent {
  toHtml() {
    return `<blockquote>${super.toHtml()}</blockquote>`;
  }
  toString() {
    return super.toString();
  }
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return '> ' + tags.join('\n> ') + '\n';
  }
}

class MDCodeBlock extends MDComponent {
  toHtml() {
    if (this.language) return `<pre><code>${this.value}</code></pre>`;
    return `<pre><code class="${this.language} language-${this.language}">${
      this.value
    }</code></pre>`;
  }
  toString() {
    return `Math: ${this.value}`;
  }
  toMarkDown() {
    return '```' + this.language + '\n' + this.value + '```\n';
  }
}

class MDThematicBreak extends MDComponent {
  toHtml() {
    return '<hr/>';
  }
  toString() {
    return '';
  }
  toMarkDown() {
    return '---';
  }
}

// New elements

class MDTOC extends MDComponent {
  _aftermath(dom) {
    this._compile(dom.children);
  }
  _compile(candidates) {
    this.children = [];
    var figurecount = 0;
    var list = new MDOrderedList();
    for (var component of candidates) {
      if (component instanceof MDHeader) {
        figurecount++;
        component.id = 'header' + figurecount;
        var item = new MDItem();
        var text = new MDText();
        text.value = component.toString();
        var link = new MDLink();
        link.title = text.value;
        link.destination = `#${component.id}`;
        link.add(text);
        item.add(link);
        list.add(item);
      }
    }
    this.add(list);
  }
  static _test(string) {
    return /^\[TOC\]$/gm.test(string) && !toc_found;
  }
  static _parse(daddy) {
    var toc = new MDTOC();
    toc.parent = daddy.parent;
    toc_found = true;
    return toc;
  }
  toHtml() {
    //TODO: Decide on a proper HTML tag
    return `<div id="toc" class="toc">${super.toHtml()}</div>`;
  }
  toString() {
    return '\n';
  }
  toMarkDown() {
    return '[TOC]\n';
  }
}

class MDTOF extends MDComponent {
  _aftermath(dom) {
    this._compile(dom);
  }
  _compile(candidates) {
    this.children = [];
    var figurecount = 0;
    var list = new MDOrderedList();
    this._compile_recursive(candidates, 0, list);
    this.add(list);
  }
  _compile_recursive(currentparent, figurecount, list) {
    for (const child of currentparent.children) {
      if (child instanceof MDImage) {
        const image = child;
        var title = image.toString();
        if (/\*$/gm.test(title)) {
          figurecount++;
          image.id = 'figure' + figurecount;
          var item = new MDItem();
          var text = new MDText();
          text.value = title.substring(0, title.length - 1);
          var link = new MDLink();
          link.title = image.name;
          link.destination = `#${image.id}`;
          link.add(text);
          item.add(link);
          list.add(item);
        }
      } else {
        if (
          child instanceof MDText ||
          child instanceof MDBlockQuote ||
          child instanceof MDCodeBlock ||
          child instanceof MDPageBreak ||
          child instanceof MDSoftBreak ||
          child instanceof MDThematicBreak ||
          child instanceof MDTOC ||
          child instanceof MDTOF
        )
          continue;
        this._compile_recursive(child, figurecount, list);
      }
    }
  }

  static _test(string) {
    return /^\[TOF\]$/gm.test(string) && !tof_found;
  }
  static _parse(daddy) {
    var tof = new MDTOF();
    tof.parent = daddy.parent;
    tof_found = true;
    return tof;
  }
  toHtml() {
    //TODO: Decide on a proper HTML tag
    return `<div id="tof" class="tof">${super.toHtml()}</div>`;
  }
  toString() {
    return '\n';
  }
  toMarkDown() {
    return '[TOF]\n';
  }
}

class MDPageBreak extends MDComponent {
  static _test(string) {
    return /^\[PB\]$/gm.test(string);
  }
  static _parse(daddy) {
    var pb = new MDPageBreak();
    pb.parent = daddy.parent;
    return pb;
  }
  toHtml() {
    return `<div class="pagebreak"/>`;
  }
  toString() {
    return '\n';
  }
  toMarkDown() {
    return '[PB]\n';
  }
}

// Central class
class MDDOM extends MDComponent {
  static parse(source) {
    var dom = new MDDOM();

    toc_found = false;
    dom.toc = null;
    tof_found = false;
    dom.tof = null;
    var reader = new commonmark.Parser();
    var parsed = reader.parse(source);
    var child = parsed.firstChild;
    if (child) {
      dom.add(dom._translateNode(child));
      while ((child = child.next)) {
        dom.add(dom._translateNode(child));
      }
    }
    for (let index = 0; index < dom.children.length; index++) {
      const component = dom.children[index]._parseReplace();
      component._aftermath(dom);
      if (component instanceof MDTOC) dom.toc = component;
      if (component instanceof MDTOF) dom.tof = component;
      dom.children[index] = component;
    }
    return dom;
  }
  _translateNode(node) {
    var translated;
    switch (node.type) {
      case 'text':
        translated = new MDText();
        break;
      case 'strong':
        translated = new MDTextBold();
        break;
      case 'emph':
        translated = new MDTextItalics();
        break;
      case 'code':
        translated = new MDTextCode();
        break;
      case 'link':
        translated = new MDLink();
        translated.destination = node.destination;
        translated.title = node.title;
        break;
      case 'image':
        translated = new MDImage();
        translated.destination = node.destination;
        translated.title = node.title;
        break;
      case 'softbreak':
        translated = new MDSoftBreak();
        break;
      case 'thematic_break':
        translated = new MDThematicBreak();
        break;
      case 'paragraph':
        translated = new MDParagraph();
        break;
      case 'heading':
        translated = new MDHeader();
        translated.level = node.level;
        break;
      case 'block_quote':
        translated = new MDBlockQuote();
        break;
      case 'code_block':
        translated = new MDCodeBlock();
        translated.language = node.info;
        break;
      case 'list':
        switch (node.listType) {
          case 'ordered':
            translated = new MDOrderedList();
            translated.start = node.listStart;
            break;
          case 'bullet':
            translated = new MDBulletList();
            break;
          default:
            throw new Error(`Unknown list sub type: ${node.listType}`);
            return;
        }
        break;
      case 'item':
        translated = new MDItem();
        break;
      default:
        throw new Error(`Unknown token type: ${node.type}`);
        return;
    }
    if (node.literal) translated.value = node.literal;
    if (node.sourcepos) {
      translated.from = new SourcePosition(node.sourcepos[0]);
      translated.to = new SourcePosition(node.sourcepos[1]);
    }
    var child = node.firstChild;
    if (child) {
      translated.add(this._translateNode(child));
      while ((child = child.next)) {
        translated.add(this._translateNode(child));
      }
    }
    return translated;
  }
  toHtml() {
    var lines = [];
    for (var component of this.children) {
      lines.push(component.toHtml());
    }
    return lines.join('\n').trim();
  }
  toString() {
    var lines = [];
    for (var component of this.children) {
      lines.push(component.toString());
    }
    return lines.join('\n').trim();
  }
  toMarkDown() {
    var lines = [];
    for (var component of this.children) {
      lines.push(component.toMarkDown());
    }
    return lines.join('\n').trim();
  }
}

class SourcePosition {
  constructor(array) {
    this.row = array[0];
    this.column = array[1];
  }
}

// var dom = MDDOM.parse(
//   '![alt text*](./img.png)\n\n' + '[TOF]\n' + '\n' + '[TOF]\n'
// );
// console.log(dom.toHtml());

// var tokens = Lexer.tokenize('# **Header!**');
// var input = new InputStream('\nHi there!\n\n# **Header!**');
// var ast = Parser.parse('# **Header!**');
// ast = Parser.parse(
//   'Hi there!\nnext line\n\nand another one\n\n# **Header!**\nMath be like: $\\int_0^\\infty f(x)\\mathrm dx = F(\\infity)$\n> May the heavens smite me if I ever let go!\n> This Lasagne belongs to me!\n> Badumm tzz!'
// );

const markdown = {
  parser: {
    Parser: Parser,
    TokenStream: TokenStream,
    CharacterStream: CharacterStream,
    Token: Token,
    TokenTypes: TokenTypes,
    Tokens
  },
  Component: MDComponent,
  DOM: MDDOM,
  Text: MDText,
  TextBold: MDTextBold,
  TextItalics: MDTextItalics,
  TextCode: MDTextCode,
  TextLaTeX: MDTextLaTeX,
  Paragraph: MDParagraph,
  Header: MDHeader,
  TOC: MDTOC,
  OrderedList: MDOrderedList,
  BulletList: MDBulletList,
  Item: MDItem,
  Link: MDLink,
  Image: MDImage,
  SoftBreak: MDSoftBreak,
  BlockQuote: MDBlockQuote,
  CodeBlock: MDCodeBlock
};

// var tokenStream = new TokenStream(new CharacterStream('Check:\n\nx=y\n'));
// var token = null;
// while (token = tokenStream.read()) {
//   console.log(token);
// }
module.exports = markdown;
