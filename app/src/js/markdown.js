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
const katex = require('katex');

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
   * Skips to the next row of the source string and returns the skpped part
   * @access public
   * @returns {string}
   */
  skipToNextRow() {
    var out = '';
    while (!this.eof()) {
      var char = this.read();
      out += char;
      if (char == '\n') break;
    }
    return out;
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
      `${msg} (${this.row}:${this.column}): "${this.source.substr(
        this.pos,
        15
      )}"`
    );
  }
}

/**
 * Provides a token stream based on an character stream.
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
   * Skips to the next row and returns the tokens in between
   * @access public
   * @returns {Token[]}
   */
  skipToNextRow() {
    var out = [];
    while (!this.eof()) {
      var token = this.read();
      out.push(token);
      if (token.type == TokenTypes.NEWLINE) break;
    }
    return out;
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
 * Parses Markdown input to an object representation.
 */
class Parser {
  /**
   * Creates a stream of characters.
   * @constructs Parser
   * @static
   * @access public
   * @param {TokenStream} tokenStream The token stream to use as source.
   * @param {MDDOM} [dom=null] The dom to construct the model in.
   * @returns {Parser} An instance of a Parser.
   */
  constructor(tokenStream, dom) {
    if (!dom) dom = new MDDOM();
    /**
     * Token stream.
     * @access private
     * @type {TokenStream}
     */
    this.tokenStream = tokenStream;
    /**
     * DOM for reference.
     * @access public
     * @type {MDDOM}
     */
    this.dom = dom;
  }

  /**
   * Parses a token stream and returns a DOM containing the parsed elements.
   * @access public
   * @static
   * @param {string} string The string to use as source.
   * @param {MDDOM} [dom=null] The dom to use as a reference.
   * @returns {MDDOM} The completed DOM
   */
  static parseToDOM(string, dom) {
    if (!dom) dom = new MDDOM();
    for (const component of Parser.parseToArray(string, dom)) {
      dom.add(component);
    }
    return dom;
  }

  /**
   * Parses a token stream and returns an array of the parsed elements.
   * @access public
   * @static
   * @param {string} string The string to use as source.
   * @param {MDDOM} [dom=null] The dom to use as a reference.
   * @returns {MDComponent[]} The parsed elements
   */
  static parseToArray(string, dom) {
    var tokenStream = new TokenStream(new CharacterStream(string));
    var parser = new Parser(tokenStream, dom);
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
    this.dom.headers = [];
    this.dom.toc = null;
    this.dom.tof = null;
    this.dom.references = [];
    while (!this.tokenStream.eof()) {
      var token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.HEADER:
          out.push(this.parseHeader());
          break;
        case TokenTypes.BLOCKQUOTE:
          out.push(this.parseBlockquote());
          break;
        case TokenTypes.RULE:
          out.push(this.parseRule());
          break;
        case TokenTypes.LIST:
          out.push(this.parseList());
          break;
        case TokenTypes.CODEBLOCK:
          out.push(this.parseCodeblock());
          break;
        case TokenTypes.TOC:
          if (!this.dom.toc) {
            this.dom.toc = this.parseTOC();
            out.push(this.dom.toc);
          } else {
            out.push(this.parseParagraph());
          }
          break;
        case TokenTypes.TOF:
          if (!this.dom.tof) {
            this.dom.tof = this.parseTOF();
            out.push(this.dom.tof);
          } else {
            out.push(this.parseParagraph());
          }
          break;
        case TokenTypes.PAGEBREAK:
          out.push(this.parsePagebreak());
          break;
        case TokenTypes.REFERENCE:
          out.push(this.parseReference());
          break;
        case TokenTypes.LATEXBLOCK:
          out.push(this.parseLatexblock());
          break;
        case TokenTypes.NEWLINE: // Ignore empty line
          this.tokenStream.read();
          break;
        default:
          out.push(this.parseParagraph());
          break;
      }
    }
    for (const link of this.dom.links) {
    }
    return out;
  }

  // Full row elements:

  /**
   * Parses a header from the token stream.
   * @access private
   * @param {Token} token Peeked token that triggered this parsing method.
   * @returns {MDHeader}
   */
  parseHeader() {
    var token = this.tokenStream.read();
    if (token.type != TokenTypes.HEADER) {
      this.tokenStream.croak(`Cannot parse header from ${token.type}`);
    }
    var component = new MDHeader(this.dom);
    component.level = token.value.split('#').length - 1;
    component.from = token.from;
    for (const sub of this.parseRow()) {
      component.add(sub);
    }
    if (!this.tokenStream.eof()) this.tokenStream.read(); // Skip \n
    component.to = component.last().to;
    component.id = 'Header ' + (this.dom.headers.length + 1);
    this.dom.headers.push(component);
    return component;
  }

  /**
   * Parses a block quote from the token stream.
   * @access private
   * @param {Token} token Peeked token that triggered this parsing method.
   * @returns {MDBlockQuote}
   */
  parseBlockquote() {
    var token = this.tokenStream.read();
    if (token.type != TokenTypes.BLOCKQUOTE) {
      this.tokenStream.croak(`Cannot parse block quote from ${token.type}`);
    }
    var component = new MDBlockQuote(this.dom);
    component.from = token.from;
    while (!this.tokenStream.eof()) {
      for (const sub of this.parseRow()) component.add(sub);
      if (!this.tokenStream.eof()) this.tokenStream.read(); // Skip \n
      if (this.tokenStream.eof()) break;
      if (this.tokenStream.peek().type != TokenTypes.BLOCKQUOTE) break;
      component.add(this.appendSoftBreak(component.last()));
      this.tokenStream.read(); // "> "
    }
    component.to = component.last().to;
    return component;
  }

  /**
   * Parses a rule from the token stream.
   * @access private
   * @returns {MDThematicBreak}
   */
  parseRule() {
    var token = this.tokenStream.read(); // ---
    var component = new MDThematicBreak(this.dom);
    component.from = token.from;
    component.to = token.to;
    this.tokenStream.read(); // \n
    return component;
  }

  /**
   * Parses a list from the token stream.
   * @access private
   * @param {Token} token Peeked token that triggered this parsing method.
   * @returns {MDListBase}
   */
  parseList() {
    var component = this.peekListHead();
    while (!this.tokenStream.eof()) {
      var token = this.tokenStream.peek();
      if (token.type != Tokens.LIST.type) break;
      // Definitely a list
      var listHead = this.peekListHead();
      if (listHead.level < component.level || listHead.type != component.type) {
        break;
      }
      var item = this.parseListItem(component);
      component.add(item);
    }
    component.to = component.last().to;
    return component;
  }

  /**
   * Parses a list item
   * @access private
   * @param {MDListBase} daddy Parent list
   * @returns {MDItem}
   */
  parseListItem(daddy) {
    var token = this.tokenStream.peek();
    if (token.type != TokenTypes.LIST) {
      this.tokenStream.croak(`Cannot parse list item from ${token.type}`);
    }
    var item = new MDItem(this.dom);
    item.from = token.from;
    this.tokenStream.read(); // Skip the list token
    while (!this.tokenStream.eof()) {
      token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.LIST:
          if (item.isEmpty()) {
            for (const sub of this.parseRow()) item.add(sub);
            if (!this.tokenStream.eof()) this.tokenStream.read(); // Skip \n
            break;
          }
          var listHead = this.peekListHead();
          if (listHead.level > daddy.level) {
            // Sublist
            item.add(this.appendSoftBreak(item.last()));
            item.add(this.parseList());
          } else {
            item.to = item.last().to;
            return item;
          }
          break;
        // Uncomment if those blocks should be allowed to be nested within lists:
        case TokenTypes.BLOCKQUOTE:
        // if (!item.isEmpty()) item.add(this.appendSoftBreak(item.last()));
        // item.add(this.parseBlockquote());
        // break;
        case TokenTypes.CODEBLOCK:
        // if (!item.isEmpty()) item.add(this.appendSoftBreak(item.last()));
        // item.add(this.parseCodeblock());
        // break;
        case TokenTypes.LATEXBLOCK:
        // if (!item.isEmpty()) item.add(this.appendSoftBreak(item.last()));
        // item.add(this.parseLatexblock());
        // break;
        case TokenTypes.NEWLINE:
          item.to = item.last().to;
          return item;
        default:
          if (!item.isEmpty()) item.add(this.appendSoftBreak(item.last()));
          for (const sub of this.parseRow()) item.add(sub);
          if (!this.tokenStream.eof()) this.tokenStream.read(); // Skip \n
          break;
      }
    }
    item.to = item.last().to;
    return item;
  }

  /**
   * Peeks a list token and returns a list instance of the right type and
   * indentation level.
   * @access private
   * @returns {MDListBase}
   */
  peekListHead() {
    var token = this.tokenStream.peek();
    if (token.type != TokenTypes.LIST) {
      this.tokenStream.croak(`Cannot parse list head from ${token.type}`);
    }
    var component = null;
    if (token.match[2].endsWith('.')) {
      component = new MDOrderedList(this.dom);
      component.start = 1 * token.match[2].split('.')[0];
    } else {
      component = new MDBulletList(this.dom);
    }
    var indentStr = token.match[0].split(token.match[2])[0];
    component.level = indentStr.replace(/(    |\t)/g, '_').length;
    component.from = token.from;
    return component;
  }

  /**
   * Parses a code block from the token stream.
   * @access private
   * @returns {MDComponent} A code block element or a substitute paragraph.
   */
  parseCodeblock() {
    var component = new MDCodeBlock(this.dom);
    component.value = '';
    var token = this.tokenStream.peek();
    if (token.type != TokenTypes.CODEBLOCK) {
      throw new Error(`${token.type} is not a code block token.`);
    }
    this.tokenStream.read(); // ```
    var cache = [token];
    component.from = token.from;
    token = this.tokenStream.read(); // {language|\n|null}
    cache.push(token);
    if (token.type == TokenTypes.CODEBLOCK) {
      return this.reinterpretAsText(cache);
    }
    if (this.tokenStream.eof()) {
      return this.reinterpretAsText(cache);
    }
    if (token.type == TokenTypes.TEXT) {
      // Language specified
      component.language = token.value;
      cache.push(this.tokenStream.read()); // Skip newline
    }
    // Ready to collect the code content
    while (!this.tokenStream.eof()) {
      token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.CODEBLOCK:
          token = this.tokenStream.read(); // ```
          component.to = token.to;
          component.value = component.value.replace(/^\n+|\n+$/g, '');
          token = this.tokenStream.peek();
          if (token && token.type == TokenTypes.NEWLINE) {
            this.tokenStream.read(); // Skip trailing newline
          }
          return component;
        default:
          token = this.tokenStream.read();
          cache.push(token);
          component.value += token.value;
          break;
      }
    }
    cache = cache.concat(component.children);
    return this.reinterpretAsText(cache);
  }

  /**
   * Parses a TOC from the token stream.
   * @access private
   * @returns {MDComponent} Either the TOC of a paragraph if the toc has
   *                        already been parsed
   */
  parseTOC() {
    if (!this.dom.toc) {
      var token = this.tokenStream.read(); // [TOC]
      var component = new MDTOC(this.dom);
      this.dom.toc = component;
      component.from = token.from;
      component.to = token.to;
      this.tokenStream.read(); // \n|EOF
      return component;
    } else {
      return this.parseParagraph();
    }
  }

  /**
   * Parses a TOF from the token stream.
   * @access private
   * @returns {MDComponent} Either the TOF of a paragraph if the tof has
   *                        already been parsed
   */
  parseTOF() {
    if (!this.dom.tof) {
      var token = this.tokenStream.read(); // [TOF]
      var component = new MDTOF(this.dom);
      this.dom.tof = component;
      component.from = token.from;
      component.to = token.to;
      this.tokenStream.read(); // \n|EOF
      return component;
    } else {
      return this.parseParagraph();
    }
  }

  /**
   * Parses a pagebreak from the token stream.
   * @access private
   * @returns {MDPageBreak}
   */
  parsePagebreak() {
    var token = this.tokenStream.read(); // [PB]
    var component = new MDPageBreak(this.dom);
    component.from = token.from;
    component.to = token.to;
    this.tokenStream.read(); // \n
    return component;
  }

  /**
   * Parses a reference from the token stream.
   * @access private
   * @returns {MDReference}
   */
  parseReference() {
    var token = this.tokenStream.read();
    var component = new MDReference(this.dom);
    component.from = token.from;
    component.to = token.to;
    component.referenceId = token.match[1];
    component.url = token.match[2];
    if (token.match[4]) {
      component.alt = token.match[4];
    }
    this.tokenStream.read(); // Skip \n
    this.dom.references.push(component);
    return component;
  }

  /**
   * Parses a LaTeX block from the token stream.
   * @access private
   * @returns {MDComponent} A code block element or a list of substitute paragraphs.
   */
  parseLatexblock() {
    var component = new MDLatexBlock(this.dom);
    component.value = '';
    var token = this.tokenStream.read(); // $$
    var cache = [token];
    if (this.tokenStream.eof()) {
      return this.reinterpretAsText(cache);
    }
    component.from = token.from;
    while (!this.tokenStream.eof()) {
      token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.LATEXBLOCK:
          this.tokenStream.read(); // $$
          component.to = token.to;
          component.value = component.value.replace(/^\n+|\n+$/g, '');
          component.html = this.dom.latexParser.parse(component.value);
          token = this.tokenStream.peek();
          if (token && token.type == TokenTypes.NEWLINE) {
            this.tokenStream.read(); // Skip trailing newline
          }
          return component;
        default:
          token = this.tokenStream.read();
          cache.push(token);
          component.value += token.value;
          break;
      }
    }
    cache = cache.concat(component.children);
    return this.reinterpretAsText(cache);
  }

  /**
   * Parses a paragraph from the token stream.
   * @access private
   * @param {Token} token Peeked token that triggered this parsing method.
   * @returns {MDParagraph}
   */
  parseParagraph() {
    var component = new MDParagraph(this.dom);
    component.from = this.tokenStream.peek().from;
    while (true) {
      for (const sub of this.parseRow()) {
        component.add(sub);
      }
      if (this.tokenStream.eof()) break;
      var softBreak = this.parseSoftbreak();
      if (!this.paragraphContinues()) break;
      component.add(softBreak);
    }
    component.to = component.last().to;
    return component;
  }

  /**
   * Checks if the paragraph still continues based on the first token of the
   * current row.
   * @access private
   * @returns {boolean}
   */
  paragraphContinues() {
    if (this.tokenStream.eof()) return false;
    var token = this.tokenStream.peek();
    var textTypes = Tokens.inline().map((tkn, i, arr) => {
      return tkn.type;
    });
    textTypes.push(TokenTypes.TEXT);
    return textTypes.includes(token.type);
  }

  // Inline elements:

  /**
   * Parses a soft break from the token stream.
   * @access private
   * @returns {MDSoftBreak}
   */
  parseSoftbreak() {
    var token = this.tokenStream.read();
    var softBreak = new MDSoftBreak(this.dom);
    softBreak.from = token.from;
    softBreak.to = token.to;
    return softBreak;
  }

  /**
   * Parses Text until next newline. Converts unexpected tokens to text as well.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseRow() {
    var out = [];
    while (!this.tokenStream.eof()) {
      var token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.NEWLINE:
          return out;
          break;
        default:
          out.push(this.parseAnyString());
          break;
      }
    }
    return out;
  }

  /**
   * Parses a text based element and decides on the procedure.
   * @access private
   * @returns {MDComponent}
   */
  parseAnyString() {
    if (this.tokenStream.eof())
      this.tokenStream.croak('Unexpected end of stream');
    var token = this.tokenStream.peek();
    var component = null;
    switch (token.type) {
      case TokenTypes.BOLD:
        component = this.parseBold();
        break;
      case TokenTypes.ITALICS:
        component = this.parseItalics();
        break;
      case TokenTypes.STRIKETHROUGH:
        component = this.parseStrikethrough();
        break;
      case TokenTypes.LATEX:
        component = this.parseLatex();
        break;
      case TokenTypes.CODE:
        component = this.parseCode();
        break;
      case TokenTypes.LINKSTART:
        component = this.parseLink();
        break;
      case TokenTypes.IMAGESTART:
        component = this.parseImage();
        break;
      default:
        component = this.parseText();
        break;
    }
    return component;
  }

  /**
   * Parses a text token from the token stream.
   * @access private
   * @returns {MDText}
   */
  parseText() {
    var token = this.tokenStream.read();
    var text = new MDText(this.dom);
    text.from = token.from;
    text.to = token.to;
    text.value = token.value;
    return text;
  }

  /**
   * Parses a format which starts and ends with the `delimiter` element.
   * @access private
   * @param {MDComponent} component The component to parse for.
   * @param {TokenTypes} delimiter The token to delimit the format.
   * @returns {MDComponent}
   */
  parseFormat(component, delimiter) {
    if (this.tokenStream.eof())
      this.tokenStream.croak('Unexpected end of stream');
    var token = this.tokenStream.read(); // delimiter
    if (token.type != delimiter)
      this.tokenStream.croak(`Token mismatch. ${token.type} != ${delimiter}`);
    var cache = [token];
    component.from = token.from;
    while (!this.tokenStream.eof()) {
      token = this.tokenStream.peek();
      if (token.type == delimiter) {
        this.tokenStream.read(); // delimiter
        component.to = token.to;
        return component;
      } else if (token.type == TokenTypes.NEWLINE) {
        return this.reinterpretAsText(cache);
      } else {
        cache.push(token);
        component.add(this.parseAnyString());
      }
    }
    return this.reinterpretAsText(cache);
  }

  /**
   * Parses the token stream for bold text.
   * @access private
   * @returns {MDComponent} Either a bold element or a text replacement
   */
  parseBold() {
    return this.parseFormat(new MDTextBold(this.dom), TokenTypes.BOLD);
  }

  /**
   * Parses the token stream for italicized text.
   * @access private
   * @returns {MDComponent} Either an italics element or a text replacement.
   */
  parseItalics() {
    return this.parseFormat(new MDTextItalics(this.dom), TokenTypes.ITALICS);
  }

  /**
   * Parses the token stream for strikethrough text.
   * @access private
   * @returns {MDComponent} Either an strikethrough element or a text replacement.
   */
  parseStrikethrough() {
    return this.parseFormat(
      new MDTextStrikethrough(this.dom),
      TokenTypes.STRIKETHROUGH
    );
  }

  /**
   * Parses the token stream for inline LaTeX.
   * @access private
   * @returns {MDComponent} Either a inline latex element or a as text
   *                        reinterpreted element.
   */
  parseLatex() {
    if (this.tokenStream.eof())
      this.tokenStream.croak('Unexpected end of stream');
    var token = this.tokenStream.read(); // delimiter
    if (token.type != TokenTypes.LATEX)
      this.tokenStream.croak(
        `Token mismatch. ${token.type} != ${TokenTypes.LATEX}`
      );
    var cache = [token];
    var component = new MDTextLaTeX(this.dom);
    component.value = '';
    component.from = token.from;
    while (!this.tokenStream.eof()) {
      token = this.tokenStream.peek();
      if (token.type == TokenTypes.LATEX) {
        this.tokenStream.read(); // delimiter
        component.to = token.to;
        component.html = this.dom.latexParser.parse(component.value);
        return component;
      } else if (token.type == TokenTypes.NEWLINE) {
        return this.reinterpretAsText(cache);
      } else {
        token = this.tokenStream.read();
        cache.push(token);
        component.value += token.value;
      }
    }
    return this.reinterpretAsText(cache);
  }

  /**
   * Parses the token stream for inline code.
   * @access private
   * @returns {MDComponent} Either a code latex element or a as text
   *                        reinterpreted element.
   */
  parseCode() {
    if (this.tokenStream.eof())
      this.tokenStream.croak('Unexpected end of stream');
    var token = this.tokenStream.read(); // delimiter
    if (token.type != TokenTypes.CODE)
      this.tokenStream.croak(
        `Token mismatch. ${token.type} != ${TokenTypes.CODE}`
      );
    var cache = [token];
    var component = new MDTextCode(this.dom);
    component.value = '';
    component.from = token.from;
    while (!this.tokenStream.eof()) {
      token = this.tokenStream.peek();
      if (token.type == TokenTypes.CODE) {
        this.tokenStream.read(); // delimiter
        component.to = token.to;
        return component;
      } else if (token.type == TokenTypes.NEWLINE) {
        return this.reinterpretAsText(cache);
      } else {
        token = this.tokenStream.read();
        cache.push(token);
        component.value += token.value;
      }
    }
    return this.reinterpretAsText(cache);
  }

  /**
   * Parses the second half or a link/image.
   * @access private
   * @param {MDComponent} component The image or link component to use as base.
   * @returns {MDComponent}
   */
  parseImageOrLinkEnd(component) {
    var token = this.tokenStream.read(); // [|![
    var cache = [token];
    component.from = token.from;
    token = this.tokenStream.peek();
    if (this.tokenStream.eof() || token.type == TokenTypes.IMGLINKEND) {
      return this.reinterpretAsText(cache);
    }
    while (!this.tokenStream.eof()) {
      token = this.tokenStream.peek();
      if (token.type == TokenTypes.IMGLINKEND) {
        if (token.match[1] == '') {
          // Plain reference
          component.children = [];
          cache.shift(); // [|![
          var textEl = this.reinterpretAsText(cache);
          component.referenceId = textEl.value;
        } else if (token.match[5]) {
          // Reference
          component.referenceId = token.match[5];
        } else {
          // Link provided
          component.url = token.match[2];
          if (token.match[4]) {
            // Tooltip
            component.alt = token.match[4];
          }
        }
        this.tokenStream.read(); // end token
        break;
      }
      cache.push(token);
      if (this.paragraphContinues()) {
        component.add(this.parseAnyString());
      } else {
        return this.reinterpretAsText(cache);
      }
    }
    return component;
  }

  /**
   * Parses the token stream for a link.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseLink() {
    var link = this.parseImageOrLinkEnd(new MDLink(this.dom));
    if (link.type == ComponentTypes.IMAGE) {
      link.id = 'Link ' + (this.dom.links.length + 1);
      this.dom.links.push(link);
    }
    return link;
  }

  /**
   * Parses the token stream for an image.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseImage() {
    var image = this.parseImageOrLinkEnd(new MDImage(this.dom));
    if (image.type == ComponentTypes.IMAGE) {
      image.id = 'Figure ' + (this.dom.images.length + 1);
      this.dom.images.push(image);
    }
    return image;
  }

  // Helpers:

  /**
   * Turns failed blocks into paragraphs instead
   * @param {MDComponent[]} chached The elements chached for the failed block
   */
  blockFail(chached) {
    var paragraph = new MDParagraph(this.dom);
    paragraph.from = chached.from;
    for (const component of chached) {
      paragraph.add(component);
    }
    if (paragraph.children.length == 0) {
      paragraph.to = paragraph.from;
    } else {
      paragraph.to = paragraph.last().to;
    }
    return paragraph;
  }

  /**
   * Reinterprets a token list as text after a failed format parsing.
   * @access private
   * @param {Token[]} tokens The existing list of components.
   * @returns {MDText}
   */
  reinterpretAsText(tokens) {
    var text = new MDText(this.dom);
    text.value = '';
    text.from = tokens[0].from;
    for (const token of tokens) {
      text.value += token.value;
    }
    text.to = tokens[tokens.length - 1].to;
    return text;
  }

  /**
   * Returns a soft break with the correct coordinates according to the given
   * token.
   * @access private
   * @param {MDComponent} component Reference token
   * @returns {MDSoftBreak}
   */
  appendSoftBreak(component) {
    var softBreak = new MDSoftBreak(this.dom);
    softBreak.from = component.to;
    softBreak.from[1]++;
    softBreak.to = softBreak.from;
    return softBreak;
  }
}

/**
 * Representation of a Token.
 */
class Token {
  /**
   * Creates a stream of characters.
   * @constructs TokenStream
   * @static
   * @access public
   * @param {TokenType} type The type of the token.
   * @see TokenTypes,TokenTypes
   * @param {string} pattern The regex pattern.
   * @returns {Token} An instance of a Token.
   */
  constructor(type, pattern) {
    /**
     * Type identifier of the Token.
     * @access public
     * @readonly
     * @type {TokenType}
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
 * A representation of the type of a token.
 */
class TokenType {
  /**
   * Creates a new component type
   * @constructs TokenType
   * @static
   * @access private
   * @param {string} name Name of the type
   * @returns {TokenType}
   */
  constructor(name) {
    /**
     * The string representation of the type. Has to be unique.
     * @access public
     * @readonly
     * @type {string}
     */
    this.name = name;
  }
}

/**
 * Enum of all the available Token types.
 */
const TokenTypes = Object.freeze({
  HEADER: new TokenType('Header'),
  BLOCKQUOTE: new TokenType('Blockquote'),
  RULE: new TokenType('Rule'),
  LIST: new TokenType('List'),
  REFERENCE: new TokenType('Reference'),
  CODEBLOCK: new TokenType('Codeblock'),
  TOC: new TokenType('TOC'),
  TOF: new TokenType('TOF'),
  PAGEBREAK: new TokenType('Pagebreak'),
  LATEXBLOCK: new TokenType('LaTeXblock'),
  NEWLINE: new TokenType('Newline'),
  BOLD: new TokenType('Bold'),
  ITALICS: new TokenType('Italics'),
  STRIKETHROUGH: new TokenType('Strikethrough'),
  IMAGESTART: new TokenType('ImageStart'),
  LINKSTART: new TokenType('LinkStart'),
  IMGLINKEND: new TokenType('Image-/LinkEnd'),
  CODE: new TokenType('Code'),
  LATEX: new TokenType('LaTeX'),
  TEXT: new TokenType('Text')
});

/**
 * Enum of all the available Tokens.
 */
const Tokens = Object.freeze({
  HEADER: new Token(TokenTypes.HEADER, /#{1,6}[\ \t]+(?=[^\s])/),
  BLOCKQUOTE: new Token(TokenTypes.BLOCKQUOTE, />[\ \t]+(?=[^\s])/),
  RULE: new Token(TokenTypes.RULE, /(\*\*\*|---|___)$/m),
  LIST: new Token(TokenTypes.LIST, /( |\t)*([1-9]\d*?\.|\*)[\ \t]+(?=[^\s])/),
  CODEBLOCK: new Token(TokenTypes.CODEBLOCK, /```/),
  TOC: new Token(TokenTypes.TOC, /\[TOC\]$/m),
  TOF: new Token(TokenTypes.TOF, /\[TOF\]$/m),
  PAGEBREAK: new Token(TokenTypes.PAGEBREAK, /\[newpage\]$/m),
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
  IMGLINKEND: new Token(
    TokenTypes.IMGLINKEND,
    /\](\(([^\s\(\)\[\]]+)(\)| "([^"]+)"\))|\[([^\[\]"]+)\]|)/
  ),
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

/**
 * A representation of the type of a markdown component.
 */
class ComponentType {
  /**
   * Creates a new component type
   * @constructs ComponentType
   * @static
   * @access private
   * @param {string} name Name of the type
   * @param {boolean} inline Whether this type can only be found inline.
   * @returns {ComponentType}
   */
  constructor(name, inline) {
    /**
     * The string representation of the type. Has to be unique.
     * @access public
     * @readonly
     * @type {string}
     */
    this.name = name;
    /**
     * Whether this type can only be found inline.
     * @access public
     * @readonly
     * @type {boolean}
     */
    this.inline = inline;
  }
}

/**
 * Enum of available component types.
 */
const ComponentTypes = Object.freeze({
  DOM: new ComponentType('DOM', false),
  HEADER: new ComponentType('Header', false),
  BLOCKQUOTE: new ComponentType('Block Quote', false),
  NUMBEREDLIST: new ComponentType('Numbered List', false),
  UNNUMBEREDLIST: new ComponentType('Unnumbered List', false),
  ITEM: new ComponentType('List Item', false),
  LATEXBLOCK: new ComponentType('LaTeX Block', false),
  CODEBLOCK: new ComponentType('Code Block', false),
  REFERENCE: new ComponentType('Reference', false),
  TOC: new ComponentType('Table Of Contents', false),
  TOF: new ComponentType('Table Of Figures', false),
  PAGEBREAK: new ComponentType('Page Break', false),
  RULE: new ComponentType('Rule', false),
  PARAGRAPH: new ComponentType('Paragraph', false),
  SOFTBREAK: new ComponentType('Soft Break', true),
  TEXT: new ComponentType('Text', true),
  BOLD: new ComponentType('Bold', true),
  ITALICS: new ComponentType('Italics', true),
  STRIKETHROUGH: new ComponentType('Strike Through', true),
  IMAGE: new ComponentType('Image', true),
  LINK: new ComponentType('Link', true),
  INLINECODE: new ComponentType('Inline Code', true),
  INLINELATEX: new ComponentType('Inline LaTeX', true)
});

/**
 * Parser for LaTeX code.
 */
class LatexParser {
  /**
   * Creates a handle for the katex parser.
   * @constructs LatexParser
   * @static
   * @access public
   * @param {number} [cacheSize=100] Size for the queue to cache the parsed
   *                                 expressions. Defaults to 100.
   * @returns {LatexParser}
   */
  constructor(cacheSize) {
    /**
     * List of the expressions that have been parsed.
     * @access private
     * @type {string[]}
     */
    this.keys = [];
    /**
     * List of the parsed expressions.
     * @access private
     * @type {string[]}
     */
    this.values = [];
    /**
     * Size of the cache.
     * @access public
     * @readonly
     * @type {number}
     */
    this.cacheSize = cacheSize ? cacheSize : 100;
  }
  /**
   * Checks if this expression has been parsed before. If so, it returns the
   * cached result. Otherwise it parses the expression, caches it and returns
   * result.
   * @access public
   * @param {string} latex The latex expression to parse.
   * @returns {string} Html expression.
   */
  parse(latex) {
    if (this.has(latex)) {
      return this.get(latex);
    }
    var html = katex.renderToString(latex);
    this.add(latex, html);
    return html;
  }
  /**
   * Checks if the expression is already cached or not.
   * @access private
   * @param {string} latex The latex expression to check for.
   * @returns {boolean}
   */
  has(latex) {
    return this.keys.includes(latex);
  }
  /**
   * Gets the cached result of the provided latex expression.
   * @access private
   * @param {string} latex The latex expression.
   * @returns {string}
   */
  get(latex) {
    return this.values[this.keys.indexOf(latex)];
  }
  /**
   * Caches an expression-html-pair. If the maximum cache size has been reached,
   * it throws out the oldest parsed pair.
   * @param {string} latex The latex expression.
   * @param {string} html The parsed result.
   */
  add(latex, html) {
    while (this.keys.length >= this.cacheSize) {
      this.keys.shift();
      this.values.shift();
    }
    this.keys.push(latex);
    this.values.push(html);
  }
}

//################
// DOM Components:

/**
 * Object representation of a markdown element.
 */
class MDComponent {
  /**
   * Creates a new component.
   * @constructs MDComponent
   * @static
   * @access private
   * @param {ComponentType} type The ComponentType.
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDComponent}
   */
  constructor(type, dom) {
    /**
     * The type of the component.
     * @access public
     * @readonly
     * @type {ComponentType}
     */
    this.type = type;
    /**
     * The DOM for reference.
     * @access public
     * @readonly
     * @type {MDDOM}
     */
    this.dom = dom;
    /**
     * The parent component.
     * @access public
     * @readonly
     * @type {MDComponent}
     */
    this.parent = null;
    /**
     * The children components.
     * @access public
     * @readonly
     * @type {MDComponent[]}
     */
    this.children = [];
  }

  /**
   * Adds a component as child to this component.
   * @access public
   * @param {MDComponent} component The component to add.
   */
  add(component) {
    component.parent = this;
    this.children.push(component);
  }

  /**
   * Inserts a child component at the specified index.
   * @access public
   * @param {MDComponent} component The component to insert.
   * @param {number} index The index on which to insert the component.
   */
  insert(component, index) {
    component.parent = this;
    this.children.splice(index, 0, component);
  }

  /**
   * Removes a child component from the children list.
   * @access public
   * @param {MDComponent} component The component to remove.
   */
  remove(component) {
    if (this.children.includes(component)) {
      this.removeAt(this.children.indexOf(component));
    }
  }

  /**
   * Removes the child component at the specified index.
   * @access public
   * @param {number} index The index of the child component.
   */
  removeAt(index) {
    if (this.children[index]) {
      this.children[index].parent = null;
      this.children.splice(index);
    }
  }

  /**
   * Returns the first item of the children list.
   * @access public
   * @returns {MDComponent}
   */
  first() {
    if (this.children.length == 0) return null;
    return this.children[0];
  }

  /**
   * Returns the last item of the children list.
   * @access public
   * @returns {MDComponent}
   */
  last() {
    if (this.children.length == 0) return null;
    return this.children[this.children.length - 1];
  }

  /**
   * Returns whether the children list is empty or not.
   * @access public
   * @returns {boolean}
   */
  isEmpty() {
    return this.children.length == 0;
  }

  /**
   * Converts the component into an HTML-string.
   * @access public
   * @abstract
   * @returns {string}
   */
  toHtml() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toHtml());
    }
    return tags.join('');
  }

  /**
   * Converts the component into a string.
   * @access public
   * @abstract
   * @returns {string}
   */
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('');
  }

  /**
   * Converts the component into a markdown formatted string.
   * @access public
   * @abstract
   * @returns {string}
   */
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return tags.join('');
  }
}

// text components:

/**
 * A component for simple strings.
 */
class MDText extends MDComponent {
  /**
   * Creates a new text component.
   * @constructs MDText
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDText}
   */
  constructor(dom) {
    super(ComponentTypes.TEXT, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return this.value;
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    return this.value;
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return this.value;
  }
}

/**
 * A component for bold text.
 */
class MDTextBold extends MDComponent {
  /**
   * Creates a new bold component.
   * @constructs MDTextBold
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDTextBold}
   */
  constructor(dom) {
    super(ComponentTypes.BOLD, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `<strong>${super.toHtml()}</strong>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return `**${super.toMarkDown()}**`;
  }
}

/**
 * A component for italicised text.
 */
class MDTextItalics extends MDComponent {
  /**
   * Creates a new italics component.
   * @constructs MDTextItalics
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDTextItalics}
   */
  constructor(dom) {
    super(ComponentTypes.ITALICS, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `<em>${super.toHtml()}</em>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return `_${super.toMarkDown()}_`;
  }
}

/**
 * A component for strikethrough text.
 */
class MDTextStrikethrough extends MDComponent {
  /**
   * Creates a new strikethrough component.
   * @constructs MDTextStrikethrough
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDTextStrikethrough}
   */
  constructor(dom) {
    super(ComponentTypes.STRIKETHROUGH, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `<s>${super.toHtml()}</s>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return `~~${super.toMarkDown()}~~`;
  }
}

/**
 * A component for inline code.
 */
class MDTextCode extends MDComponent {
  /**
   * Creates a new inline code component.
   * @constructs MDTextCode
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDTextCode}
   */
  constructor(dom) {
    super(ComponentTypes.INLINECODE, dom);
    /**
     * The literal code enclosed within this component.
     * @access public
     * @readonly
     * @type {string}
     */
    this.value = '';
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `<code>${this.value}</code>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    return this.value;
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return `\`${this.value}\``;
  }
}

/**
 * A component for inline LaTeX.
 */
class MDTextLaTeX extends MDComponent {
  /**
   * Creates a new inline LaTeX component.
   * @constructs MDTextLaTeX
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDTextLaTeX}
   */
  constructor(dom) {
    super(ComponentTypes.INLINELATEX, dom);
    /**
     * The literal code enclosed within this component.
     * @access public
     * @readonly
     * @type {string}
     */
    this.value = '';
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `<span>${super.toHtml()}</span>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return `\$${super.toMarkDown()}\$`;
  }
}

/**
 * A component for links.
 */
class MDLink extends MDComponent {
  /**
   * Creates a new link component.
   * @constructs MDLink
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDLink}
   */
  constructor(dom) {
    super(ComponentTypes.LINK, dom);
    /**
     * The tooltip text. Optional.
     * @access public
     * @readonly
     * @type {string}
     */
    this.alt = '';
    /**
     * The url to direct to.
     * @access public
     * @readonly
     * @type {string}
     */
    this.url = '';
    /**
     * The reference the component points to. Optional.
     * @access public
     * @readonly
     * @type {string}
     */
    this.referenceId = '';
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    if (this.alt) {
      return `<a href="${this.url}" title="${this.alt}">${super.toHtml()}</a>`;
    }
    return `<a href="${this.url}">${super.toHtml()}</a>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    if (this.referenceId) {
      return `[${super.toMarkDown()}][${this.referenceId}]`;
    }
    if (this.alt) {
      return `[${super.toMarkDown()}](${this.url} "${this.alt}")`;
    }
    return `[${super.toMarkDown()}](${this.url})`;
  }
}

/**
 * A component for image.
 */
class MDImage extends MDComponent {
  /**
   * Creates a new image component.
   * @constructs MDImage
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDImage}
   */
  constructor(dom) {
    super(ComponentTypes.IMAGE, dom);
    /**
     * The tooltip text. Optional.
     * @access public
     * @readonly
     * @type {string}
     */
    this.alt = '';
    /**
     * The url to direct to.
     * @access public
     * @readonly
     * @type {string}
     */
    this.url = '';
    /**
     * The reference the component points to. Optional.
     * @access public
     * @readonly
     * @type {string}
     */
    this.referenceId = '';
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    if (this.id) {
      return `<img src="${this.url}" id="${
        this.id
      }" alt="${super.toHtml()}" title="${this.alt}"/>`;
    }
    return `<img src="${this.url}" alt="${super.toHtml()}" title="${
      this.alt
    }"/>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    if (this.referenceId) {
      return `![${super.toMarkDown()}][${this.referenceId}]`;
    }
    if (this.alt) {
      return `![${super.toMarkDown()}](${this.url} "${this.alt}")`;
    }
    return `![${super.toMarkDown()}](${this.url})`;
  }
}

/**
 * A component for a soft break.
 */
class MDSoftBreak extends MDComponent {
  /**
   * Creates a new soft break component.
   * @constructs MDSoftBreak
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDSoftBreak}
   */
  constructor(dom) {
    super(ComponentTypes.SOFTBREAK, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return '<br/>';
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    return '\n';
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return '\n';
  }
}

// per line components:

/**
 * A component for a header.
 */
class MDHeader extends MDComponent {
  /**
   * Creates a new header component.
   * @constructs MDHeader
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDHeader}
   */
  constructor(dom) {
    super(ComponentTypes.HEADER, dom);
    /**
     * Level of the header. 0 = Highest level header, 6 = lowest level header.
     * @access public
     * @readonly
     * @type {number}
     */
    this.level = 0;
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    if (this.id) {
      return `<h${this.level} id="${this.id}">${super.toHtml()}</h${
        this.level
      }>`;
    }
    return `<h${this.level}>${super.toHtml()}</h${this.level}>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return `${'#'.repeat(this.level)} ${super.toMarkDown()}`;
  }
}

/**
 * A component for a paragraph.
 */
class MDParagraph extends MDComponent {
  /**
   * Creates a new paragraph component.
   * @constructs MDParagraph
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDParagraph}
   */
  constructor(dom) {
    super(ComponentTypes.PARAGRAPH, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `<p>${super.toHtml()}</p>`;
  }
}

/**
 * A component for a list.
 */
class MDListBase extends MDComponent {
  /**
   * Creates a list component.
   * @constructs MDListBase
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDListBase}
   */
  constructor(type, dom) {
    super(type, dom);
  }
}

/**
 * A component for a numbered list.
 */
class MDOrderedList extends MDListBase {
  /**
   * Creates a numbered list component.
   * @constructs MDOrderedList
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDOrderedList}
   */
  constructor(dom) {
    super(ComponentTypes.NUMBEREDLIST, dom);
    /**
     * The indentation level of the list. Defaults to 0.
     * @access public
     * @readonly
     * @type {number}
     */
    this.level = 0;
    /**
     * The start number of the list. Defaults to 1.
     * @access public
     * @readonly
     * @type {number}
     */
    this.start = 1;
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    if (this.start != 1) {
      return `<ol start="${this.start}">${super.toHtml()}</ol>`;
    }
    return `<ol>${super.toHtml()}</ol>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('\n');
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    var index = this.start;
    var tags = [];
    for (var component of this.children) {
      tags.push(
        '\t'.repeat(this.level) + index + '. ' + component.toMarkDown()
      );
      index++;
    }
    return tags.join('\n') + '\n';
  }
}

/**
 * A component for an unnumbered list.
 */
class MDBulletList extends MDListBase {
  /**
   * Creates an unnumbered list component.
   * @constructs MDBulletList
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDBulletList}
   */
  constructor(dom) {
    super(ComponentTypes.UNNUMBEREDLIST, dom);
    /**
     * The indentation level of the list. Defaults to 0.
     * @access public
     * @readonly
     * @type {number}
     */
    this.level = 0;
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `<ul>${super.toHtml()}</ul>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('\n');
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push('\t'.repeat(this.level) + '* ' + component.toMarkDown());
    }
    return tags.join('\n') + '\n';
  }
}

/**
 * A component for a list item.
 */
class MDItem extends MDComponent {
  /**
   * Creates a list item component.
   * @constructs MDItem
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDItem}
   */
  constructor(dom) {
    super(ComponentTypes.ITEM, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `<li>${super.toHtml().replace(/^\n+|\n+$/, '')}</li>`;
  }
}

/**
 * A component for a block quote.
 */
class MDBlockQuote extends MDComponent {
  /**
   * Creates a block quote component.
   * @constructs MDBlockQuote
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDBlockQuote}
   */
  constructor(dom) {
    super(ComponentTypes.BLOCKQUOTE, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `<blockquote>${super.toHtml()}</blockquote>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return '> ' + tags.join('\n> ') + '\n';
  }
}

/**
 * A component for a code block.
 */
class MDCodeBlock extends MDComponent {
  /**
   * Creates a code block component.
   * @constructs MDCodeBlock
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDCodeBlock}
   */
  constructor(dom) {
    super(ComponentTypes.CODEBLOCK, dom);
    /**
     * The language of the code snippet. Defaults to "".
     * @access public
     * @readonly
     * @type {string}
     */
    this.language = '';
    /**
     * The content of the code block.
     * @access public
     * @readonly
     * @type {string}
     */
    this.value = '';
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    var classStr = '';
    if (this.language) {
      classStr = ` class="${this.language} language-${this.language}"`;
    }
    return `<pre><code"${classStr}>${this.value}</code></pre>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    return '';
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return '```' + this.language + '\n' + this.value + '```\n';
  }
}

/**
 * A component for a rule.
 */
class MDThematicBreak extends MDComponent {
  /**
   * Creates a rule component.
   * @constructs MDThematicBreak
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDThematicBreak}
   */
  constructor(dom) {
    super(ComponentTypes.RULE, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return '<hr/>';
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    return '';
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return '---';
  }
}

/**
 * A component for a reference.
 */
class MDReference extends MDComponent {
  /**
   * Creates a reference component.
   * @constructs MDReference
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDReference}
   */
  constructor(dom) {
    super(ComponentTypes.REFERENCE, dom);
    /**
     * The tooltip text. Optional.
     * @access public
     * @readonly
     * @type {string}
     */
    this.alt = '';
    /**
     * The url to direct to.
     * @access public
     * @readonly
     * @type {string}
     */
    this.url = '';
    /**
     * The id through which this reference can be found with.
     * @access public
     * @readonly
     * @type {string}
     */
    this.referenceId = '';
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return ``;
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    return '';
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    if (this.alt) return `[${this.referenceId}]: ${this.url} "${this.alt}"`;
    return `[${this.referenceId}]: ${this.url}`;
  }
}

// New elements

/**
 * A component for a table of contents.
 */
class MDTOC extends MDComponent {
  /**
   * Creates a table of contents component.
   * @constructs MDTOC
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDTOC}
   */
  constructor(dom) {
    super(ComponentTypes.TOC, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    //TODO: resolve header list
    return `<div id="toc" class="toc">${super.toHtml()}</div>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    return '\n';
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return '[TOC]\n';
  }
}

/**
 * A component for a table of figures.
 */
class MDTOF extends MDComponent {
  /**
   * Creates a table of figures component.
   * @constructs MDTOF
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDTOF}
   */
  constructor(dom) {
    super(ComponentTypes.TOF, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    var tags = [];
    for (var image of this.children) {
      tags.push(`<li>${image.id} - ${image.alt}</li>`);
    }
    return `<ol id="tof" class="tof">${tags.join('\n')}</ol>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    return '\n';
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return '[TOF]\n';
  }
}

/**
 * A component for a page break.
 */
class MDPageBreak extends MDComponent {
  /**
   * Creates a table of page break.
   * @constructs MDPageBreak
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDPageBreak}
   */
  constructor(dom) {
    super(ComponentTypes.PAGEBREAK, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `[newpage]`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    return '\n';
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return '[newpage]\n';
  }
}

/**
 * A component for a LaTeX block.
 */
class MDLatexBlock extends MDComponent {
  /**
   * Creates a LaTeX block component.
   * @constructs MDLatexBlock
   * @static
   * @access private
   * @param {MDDOM} dom The DOM for reference.
   * @returns {MDLatexBlock}
   */
  constructor(dom) {
    super(ComponentTypes.LATEXBLOCK, dom);
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    return `<div class="katex">${this.dom.latexParser.parse(this.value)}</div>`;
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    return '';
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    return `$$${this.dom.latexParser.parse(this.value)}$$`;
  }
}

/**
 * DOM holding all the markdown components in a tree structure.
 */
class MDDOM extends MDComponent {
  /**
   * Creates a new instance of a DOM.
   * @constructs MDDOM
   * @static
   * @access public
   * @returns {MDDOM}
   */
  constructor() {
    super(ComponentTypes.DOM, null);
    /**
     * List of headers to be used by the TOC.
     * @access public
     * @readonly
     * @type {MDHeader[]}
     */
    this.headers = [];
    /**
     * Table of contents of the parsed markdown document.
     * @access public
     * @readonly
     * @type {MDTOC}
     */
    this.toc = null;
    /**
     * Table of figures of the parsed markdown document.
     * @access public
     * @readonly
     * @type {MDTOF}
     */
    this.tof = null;
    /**
     * References within the document.
     * @access public
     * @readonly
     * @type {MDReference[]}
     */
    this.references = [];
    /**
     * List of images in the document
     * @access public
     * @readonly
     * @type {MDImage[]}
     */
    this.images = [];
    /**
     * List of links in the document
     * @access public
     * @readonly
     * @type {MDLink[]}
     */
    this.links = [];
    /**
     * A handler for latex parse requests.
     * @access public
     * @readonly
     * @type {LatexParser}
     */
    this.latexParser = new LatexParser();
  }
  /**
   * Parses a string to a DOM representation.
   * @access public
   * @param {string} source Source to parse.
   * @returns {MDDOM}
   */
  static parse(source) {
    var dom = Parser.parseToDOM(source);
    // Resolve references for links and images
    for (const link of dom.links) {
      if (link.referenceId != '') {
        var ref = dom.references.find((val, i, lst) => {
          return val.referenceId == link.referenceId;
        });
        if (ref) {
          link.url = ref.url;
          link.alt = ref.alt;
        }
      }
    }
    for (const image of dom.images) {
      if (image.referenceId != '') {
        var ref = dom.references.find((val, i, lst) => {
          return val.referenceId == image.referenceId;
        });
        if (ref) {
          image.url = ref.url;
          image.alt = ref.alt;
        }
      }
    }
    // Build the TOF and TOC
    if (dom.tof) {
      while (dom.images.length > 0) {
        dom.tof.add(dom.images.shift());
      }
    }
    if (dom.toc) {
      while (dom.headers.length > 0) {
        dom.toc.add(dom.headers.shift());
      }
    }
    return dom;
  }

  /**
   * @access public
   * @returns {string}
   */
  toHtml() {
    var lines = [];
    for (var component of this.children) {
      lines.push(component.toHtml());
    }
    return lines.join('\n').trim();
  }

  /**
   * @access public
   * @returns {string}
   */
  toString() {
    var lines = [];
    for (var component of this.children) {
      lines.push(component.toString());
    }
    return lines.join('\n').trim();
  }

  /**
   * @access public
   * @returns {string}
   */
  toMarkDown() {
    var lines = [];
    for (var component of this.children) {
      lines.push(component.toMarkDown());
    }
    return lines.join('\n').trim();
  }
}

const markdown = {
  parser: {
    CharacterStream: CharacterStream,
    TokenStream: TokenStream,
    Token: Token,
    Tokens,
    TokenTypes: TokenTypes,
    Parser: Parser,
    LatexParser: LatexParser
  },
  ComponentTypes: ComponentTypes,
  Component: MDComponent,
  DOM: MDDOM,
  Header: MDHeader,
  BlockQuote: MDBlockQuote,
  NumberedList: MDOrderedList,
  UnnumberedList: MDBulletList,
  LatexBlock: MDLatexBlock,
  CodeBlock: MDCodeBlock,
  Reference: MDReference,
  TOC: MDTOC,
  TOF: MDTOF,
  Pagebreak: MDPageBreak,
  Rule: MDThematicBreak,
  Paragraph: MDParagraph,
  Text: MDText,
  Bold: MDTextBold,
  Italics: MDTextItalics,
  Strikethrough: MDTextStrikethrough,
  Image: MDImage,
  Link: MDLink,
  InlineCode: MDTextCode,
  InlineLatex: MDTextLaTeX
};

module.exports = markdown;
