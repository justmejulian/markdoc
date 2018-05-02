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
 * Parses Markdown input to an object representation
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
   * @param {TokenStream} tokenStream The token stream to use as source.
   * @param {MDDOM} [dom=null] The dom to use as a reference.
   * @returns {MDDOM} The completed DOM
   */
  static parseToDOM(tokenStream, dom) {
    if (!dom) dom = new MDDOM();
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
    var parser = new Parser(tokenStream, dom);
    return parser.parse(dom);
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
      var token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.HEADER:
          out.push(this.parseHeader());
          break;
        case TokenTypes.BLOCKQUOTE:
          out.push(this.parseBlockquote());
          break;
        case TokenTypes.LIST:
          out.push(this.parseList());
          break;
        case TokenTypes.LATEXBLOCK:
          for (const sub of this.parseLatexblock()) {
            out.push(this.parseLatexblock());
          }
          break;
        case TokenTypes.CODEBLOCK:
          for (const sub of this.parseCodeblock()) {
            out.push(sub);
          }
          break;
        case TokenTypes.REFERENCE:
          for (const sub of this.parseReference()) {
            out.push(sub);
          }
          break;
        case TokenTypes.TOC:
          for (const sub of this.parseTOC()) {
            out.push(sub);
          }
          break;
        case TokenTypes.TOF:
          for (const sub of this.parseTOF()) {
            out.push(sub);
          }
          break;
        case TokenTypes.PAGEBREAK:
          for (const sub of this.parsePagebreak()) {
            out.push(sub);
          }
          break;
        case TokenTypes.RULE:
          for (const sub of this.parseRule()) {
            out.push(sub);
          }
          break;
        case TokenTypes.NEWLINE: // Ignore empty line
          this.tokenStream.read();
          break;
        default:
          for (const sub of this.parseParagraph()) {
            out.push(sub);
          }
          break;
      }
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
    var component = new MDHeader();
    component.level = token.value.split('#').length - 1;
    component.from = token.from;
    for (const sub of this.parseText()) {
      component.add(sub);
    }
    component.to = component.last().to;
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
    var component = new MDBlockQuote();
    component.from = token.from;
    while (!this.tokenStream.eof()) {
      for (const sub of this.parseText()) component.add(sub);
      if (this.tokenStream.eof()) break;
      if (this.tokenStream.peek().type != TokenTypes.BLOCKQUOTE) break;
      component.add(this.appendSoftBreak(component.last()));
      this.tokenStream.read(); // "> "
    }
    component.to = component.last().to;
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
    var item = new MDItem();
    item.from = token.from;
    this.tokenStream.read(); // Skip the list token
    while (!this.tokenStream.eof()) {
      token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.LIST:
          if (item.isEmpty()) {
            for (const sub of this.parseText()) item.add(sub);
            break;
          }
          var listHead = this.peekListHead();
          if (listHead.level > daddy.level) {
            // Sublist
            item.add(this.appendSoftBreak(item.last()));
            item.add(this.parseList());
          } else if (listHead.level < daddy.level) {
            // Parent list
            item.to = item.last().to;
            return item;
          } else {
            // List of same parent
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
          for (const sub of this.parseText()) item.add(sub);
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
      component = new MDOrderedList();
      component.start = 1 * token.match[2].split('.')[0];
    } else {
      component = new MDBulletList();
    }
    var indentStr = token.match[0].split(token.match[2])[0];
    component.level = indentStr.replace(/(    |\t)/g, '_').length;
    component.from = token.from;
    return component;
  }

  /**
   * Parses a LaTeX block from the token stream.
   * @access private
   * @returns {MDComponent[]} A code block element or a list of substitute paragraphs.
   */
  parseLatexblock() {
    var component = new MDLatexBlock();
    component.value = '';
    var token = this.tokenStream.read(); // $$
    var cache = [token];
    component.from = token.from;
    while (!this.tokenStream.eof()) {
      token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.LATEXBLOCK:
          cache.push(this.tokenStream.read()); // $$
          component.to = token.to;
          token = this.tokenStream.peek();
          if (token && token.type == TokenTypes.NEWLINE) {
            this.tokenStream.read(); // Skip trailing newline
          }
          return [component];
        default:
          token = this.tokenStream.read();
          cache.push(token);
          component.value += token.value;
          break;
      }
    }
    cache = cache.concat(component.children);
    this.reinterpretAsText(cache);
    return cache;
  }

  /**
   * Parses a paragraph from the token stream.
   * @access private
   * @param {Token} token Peeked token that triggered this parsing method.
   * @returns {MDParagraph[]}
   */
  parseParagraph() {
    var component = new MDParagraph();
    component.from = this.tokenStream.peek().from;
    for (const sub of this.parseText()) {
      component.add(sub);
    }
    component.to = component.last().to;
    return [component];
  }

  /**
   * Parses a code block from the token stream.
   * @access private
   * @returns {MDComponent[]} A code block element or a list of substitute paragraphs.
   */
  parseCodeblock() {
    var component = new MDCodeBlock();
    component.value = '';
    var token = this.tokenStream.read(); // ```
    var cache = [token];
    component.from = token.from;
    token = this.tokenStream.read(); // {language|\n|null}
    cache.push(token);
    if (this.tokenStream.eof()) {
      this.reinterpretAsText(cache);
      return cache;
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
          this.tokenStream.read(); // ```
          component.to = token.to;
          return [component];
        default:
          token = this.tokenStream.read();
          cache.push(token);
          component.value += token.value;
          break;
      }
    }
    cache = cache.concat(component.children);
    this.reinterpretAsText(cache);
    return cache;
  }

  // Inline elements:

  /**
   * Parses Text until next newline. Converts unexpected tokens to text as well.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseText() {
    var out = [];
    while (!this.tokenStream.eof()) {
      var token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.BOLD:
          for (const sub of this.parseBold()) {
            out.push(sub);
          }
          break;
        case TokenTypes.ITALICS:
          for (const sub of this.parseItalics()) {
            out.push(sub);
          }
          break;
        case TokenTypes.STRIKETHROUGH:
          for (const sub of this.parseStrikethrough()) {
            out.push(sub);
          }
          break;
        case TokenTypes.IMAGESTART:
          for (const sub of this.parseImage()) {
            out.push(sub);
          }
          break;
        case TokenTypes.LINKSTART:
          for (const sub of this.parseLink()) {
            out.push(sub);
          }
          break;
        case TokenTypes.CODE:
          for (const sub of this.parseCode()) {
            out.push(sub);
          }
          break;
        case TokenTypes.LATEX:
          for (const sub of this.parseLatex()) {
            out.push(sub);
          }
          break;
        case TokenTypes.NEWLINE:
          this.tokenStream.read(); // Skip the newline
          return out;
          break;
        default:
          // Unexpected token(or text) detected. Reinterpret as text.
          this.reinterpretAsText(out);
          break;
      }
    }
    return out;
  }

  /**
   * Parses the token stream for bold text.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseBold() {
    this.tokenStream.read();
    var component = new MDTextBold();
    component.from = token.from;
    while (!this.tokenStream.eof()) {
      var token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.TEXT:
          for (const sub of this.parseText()) {
            component.add(sub);
          }
          break;
        case TokenTypes.BOLD:
          component.to = token.to;
          this.tokenStream.read();
          return [component];
          break;
        case TokenTypes.ITALICS:
          for (const sub of this.parseItalics()) {
            component.add(sub);
          }
          break;
        case TokenTypes.STRIKETHROUGH:
          for (const sub of this.parseStrikethrough()) {
            component.add(sub);
          }
          break;
        case TokenTypes.LATEXTOGGLE:
          for (const sub of this.parseLatex()) {
            component.add(sub);
          }
          break;
        case TokenTypes.CODETOGGLE:
          for (const sub of this.parseCode()) {
            component.add(sub);
          }
          break;
        case TokenTypes.LINK:
          for (const sub of this.parseLink()) {
            component.add(sub);
          }
          break;
        case TokenTypes.IMAGE:
          for (const sub of this.parseImage()) {
            component.add(sub);
          }
          break;
        case TokenTypes.NEWLINE: // Failed to complete sequence
          this.reinterpretAsText(component.children);
          return component.children;
        default:
          this.reinterpretAsText(component.children);
          break;
      }
    }
    return component.children;
  }

  /**
   * Parses the token stream for italicalised text.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseItalics() {
    this.tokenStream.read();
    var component = new MDTextItalics();
    component.from = token.from;
    while (!this.tokenStream.eof()) {
      var token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.TEXT:
          for (const sub of this.parseText()) {
            component.add(sub);
          }
          break;
        case TokenTypes.BOLD:
          for (const sub of this.parseBold()) {
            component.add(sub);
          }
          break;
        case TokenTypes.ITALICS:
          component.to = token.to;
          this.tokenStream.read();
          return [component];
          break;
        case TokenTypes.STRIKETHROUGH:
          for (const sub of this.parseStrikethrough()) {
            component.add(sub);
          }
          break;
        case TokenTypes.LATEXTOGGLE:
          for (const sub of this.parseLatex()) {
            component.add(sub);
          }
          break;
        case TokenTypes.CODETOGGLE:
          for (const sub of this.parseCode()) {
            component.add(sub);
          }
          break;
        case TokenTypes.LINK:
          for (const sub of this.parseLink()) {
            component.add(sub);
          }
          break;
        case TokenTypes.IMAGE:
          for (const sub of this.parseImage()) {
            component.add(sub);
          }
          break;
        case TokenTypes.NEWLINE: // Failed to complete sequence
          this.reinterpretAsText(component.children);
          return component.children;
        default:
          this.reinterpretAsText(component.children);
          break;
      }
    }
    return component.children;
  }

  /**
   * Parses the token stream for strikethrough text.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseStrikethrough() {
    this.tokenStream.read();
    var component = new MDTextStrikethrough();
    component.from = token.from;
    while (!this.tokenStream.eof()) {
      var token = this.tokenStream.peek();
      switch (token.type) {
        case TokenTypes.TEXT:
          for (const sub of this.parseText()) {
            component.add(sub);
          }
          break;
        case TokenTypes.BOLD:
          for (const sub of this.parseBold()) {
            component.add(sub);
          }
          break;
        case TokenTypes.ITALICS:
          for (const sub of this.parseItalics()) {
            component.add(sub);
          }
          break;
        case TokenTypes.STRIKETHROUGH:
          component.to = token.to;
          this.tokenStream.read();
          return [component];
          break;
        case TokenTypes.LATEXTOGGLE:
          for (const sub of this.parseLatex()) {
            component.add(sub);
          }
          break;
        case TokenTypes.CODETOGGLE:
          for (const sub of this.parseCode()) {
            component.add(sub);
          }
          break;
        case TokenTypes.LINK:
          for (const sub of this.parseLink()) {
            component.add(sub);
          }
          break;
        case TokenTypes.IMAGE:
          for (const sub of this.parseImage()) {
            component.add(sub);
          }
          break;
        case TokenTypes.NEWLINE: // Failed to complete sequence
          this.reinterpretAsText(component.children);
          return component.children;
        default:
          this.reinterpretAsText(component.children);
          break;
      }
    }
    return component.children;
  }

  /**
   * Parses the token stream for inline LaTeX.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseLatex() {}

  /**
   * Parses the token stream for inline code.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseCode() {}

  /**
   * Parses the token stream for a link.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseLink() {
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

  /**
   * Parses the token stream for an image.
   * @access private
   * @returns {MDComponent[]} Either a one-element-array or a sequence of as
   *                          text reinterpreted elements.
   */
  parseImage() {
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

  // Helpers:

  /**
   * Turns failed blocks into paragraphs instead
   * @param {MDComponent[]} chached The elements chached for the failed block
   */
  blockFail(chached) {
    var paragraph = new MDParagraph();
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
   * Reinterprets unexpected tokens as text and appends them to either the last
   * text element or as a new element to the list.
   * @access private
   * @param {MDComponent[]} list The existing list of components
   */
  reinterpretAsText(list) {
    var text = null;
    var token = this.tokenStream.read();
    if (list.length > 0 && list[list.length - 1].type == TokenTypes.TEXT) {
      text = list[list.length - 1];
    } else {
      text = new MDText();
      text.value = '';
      text.from = token.from;
      list.push(text);
    }
    text.value += token.value;
    text.to = token.to;
  }

  /**
   * Returns a soft break with the correct coordinates according to the given
   * token.
   * @access private
   * @param {MDComponent} component Reference token
   * @returns {MDSoftBreak}
   */
  appendSoftBreak(component) {
    var softBreak = new MDSoftBreak();
    softBreak.from = component.to;
    softBreak.from[1]++;
    softBreak.to = softBreak.from;
    return softBreak;
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
  LIST: new Token(TokenTypes.LIST, /( |\t)*([1-9]\d*?\.|\*)[\ \t]+(?=[^\s])/),
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

const ComponentTypes = Object.freeze({
  DOM: 'DOM',
  HEADER: 'Header',
  BLOCKQUOTE: 'Block Quote',
  NUMBEREDLIST: 'Numbered List',
  UNNUMBEREDLIST: 'Unnumbered List',
  LATEXBLOCK: 'LaTeX Block',
  CODEBLOCK: 'Code Block',
  REFERENCE: 'Reference',
  TOC: 'Table Of Contents',
  TOF: 'Table Of Figures',
  PAGEBREAK: 'Page Break',
  RULE: 'Rule',
  PARAGRAPH: 'Paragraph',
  TEXT: 'Text',
  BOLD: 'Bold',
  ITALICS: 'Italics',
  STRIKETHROUGH: 'Strike Through',
  IMAGE: 'Image',
  LINK: 'Link',
  INLINECODE: 'Inline Code',
  INLINELATEX: 'Inline LaTeX'
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
const katex = require('katex');
var toc_found = false;
var tof_found = false;

class MDComponent {
  constructor(type) {
    this.type = type;
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
  isEmpty() {
    return this.children.length == 0;
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
  constructor() {
    super(ComponentTypes.TEXT);
  }
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
  constructor() {
    super(ComponentTypes.BOLD);
  }
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
  constructor() {
    super(ComponentTypes.ITALICS);
  }
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
  constructor() {
    super(ComponentTypes.STRIKETHROUGH);
  }
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
  constructor() {
    super(ComponentTypes.INLINECODE);
  }
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
  constructor() {
    super(ComponentTypes.INLINELATEX);
  }
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
  constructor() {
    super(ComponentTypes.LINK);
  }
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
  constructor() {
    super(ComponentTypes.IMAGE);
  }
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
  constructor() {
    super(ComponentTypes.HEADER);
  }
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
  constructor() {
    super(ComponentTypes.PARAGRAPH);
  }
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
  constructor(type) {
    super(type);
  }
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
  constructor() {
    super(ComponentTypes.NUMBEREDLIST);
  }
  toHtml() {
    if (this.start != 1) {
      return `<ol start="${this.start}">${super.toHtml()}</ol>`;
    }
    return `<ol>${super.toHtml()}</ol>`;
  }
  toString() {
    var index = this.start || 1;
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
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
  constructor() {
    super(ComponentTypes.UNNUMBEREDLIST);
  }
  toHtml() {
    return `<ul>${super.toHtml()}</ul>`;
  }
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
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
  constructor() {
    super(ComponentTypes.BLOCKQUOTE);
  }
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
  constructor() {
    super(ComponentTypes.CODEBLOCK);
  }
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
  constructor() {
    super(ComponentTypes.RULE);
  }
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
  constructor() {
    super(ComponentTypes.TOC);
  }
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
  constructor() {
    super(ComponentTypes.TOF);
  }
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
  constructor() {
    super(ComponentTypes.PAGEBREAK);
  }
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
  constructor() {
    super(ComponentTypes.DOM);
  }
  static parse(source) {
    var dom = new MDDOM();

    // Parse LaTeX
    var match;
    while ((match = /\$\$.+?\$\$/gm.exec(source))) {
      var math = match[0].substring(2, match[0].length - 2);
      var rendered = katex.renderToString(math);
      source = source.replace(match[0], rendered);
    }
    while ((match = /\$.+?\$/gm.exec(source))) {
      var math = match[0].substring(1, match[0].length - 1);
      var rendered = katex.renderToString(math);
      source = source.replace(match[0], rendered);
    }

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
      case 'html_inline':
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

class MDLatexBlock extends MDComponent {
  constructor() {
    super(ComponentTypes.LATEXBLOCK);
  }
}

class MDReference extends MDComponent {
  constructor() {
    super(ComponentTypes.REFERENCE);
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
    CharacterStream: CharacterStream,
    TokenStream: TokenStream,
    Token: Token,
    Tokens,
    TokenTypes: TokenTypes,
    Parser: Parser
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

// var tokenStream = new TokenStream(new CharacterStream('Check:\n\nx=y\n'));
// var token = null;
// while (token = tokenStream.read()) {
//   console.log(token);
// }
var tokenStream = new TokenStream(
  new CharacterStream(
    // '1. One\n' +
    // '3. Two\n' +
    // '3. Three\n' +
    // 'still three\n' +
    // '4. Four\n' +
    // '    3. Sublist starting at 3\n' +
    // '	2. nonsensical numbering and tyb instead of spaces\n' +
    // '5.   Five\n' +
    // '		* Sublist 2 levels deeper and different type\n' +
    // '6. Last element\n' +
    // '\n' +
    '* New type\n' +
      'Extra text\n' +
      '```js\n' +
      'var a = 0;\n' +
      '```\n' +
      '* Test\n'
  )
);
var parser = new Parser(tokenStream);
var list = parser.parseList();
//var listItem = parser.parseListItem(parser.peekListHead());
//var components = parser.parse();
//console.log(components[0].toString());

module.exports = markdown;
