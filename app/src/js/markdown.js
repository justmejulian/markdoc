'use strict';

class InputStream {
  constructor(string) {
    this.input = string;
    this.first = true;
    this.pos = 0;
    this.line = 0;
    this.col = 0;
  }
  next() {
    var ch = this.input.charAt(this.pos++);
    if (ch == '\n') {
      this.line++;
      this.col = 0;
    } else {
      this.col++;
    }
    if (this.first) this.first = false;
    return ch;
  }
  match(regex) {
    var substr = this.input.substr(this.pos);
    if (this.first) substr = '\n' + substr;
    return substr.match(regex);
  }
  skip(regex) {
    var substr = this.input.substr(this.pos);
    if (this.first) substr = '\n' + substr;
    var match = substr.match(regex);
    var value = match[0];
    this.pos += value.length;
    if (this.first) this.pos--;
    var lines = value.split('\n');
    var newLines = lines.length - 1;
    this.line += newLines;
    if (newLines > 0) {
      this.col = lines[newLines].length;
    } else {
      this.col += value.length;
    }
    if (this.first) this.first = false;
  }
  peek() {
    return this.input.charAt(this.pos);
  }
  eof() {
    return this.peek() == '';
  }
  croak(msg) {
    throw new Error(msg + ' (' + this.line + ':' + this.col + ')');
  }
}

class TokenStream {
  constructor(inputStream) {
    this.inputStream = inputStream;
    this.tokens = [
      new Token(TokenTypes.HEADER, /^\n#{1,6}\s/),
      new Token(TokenTypes.BOLD, /^\*\*/),
      new Token(TokenTypes.ITALICS, /^_/),
      new Token(TokenTypes.STRIKETHROUGH, /^~~/),
      new Token(TokenTypes.BLOCKQUOTE, /^\n> /),
      new Token(TokenTypes.NUMBEREDLIST, /^\n(    |\t)*\d+?\.\s/),
      new Token(TokenTypes.UNNUMBEREDLIST, /^\n(    |\t)*\*\s/),
      new Token(TokenTypes.RULE, /^\n(\*\*\*|---|___)\n*/),
      new Token(
        TokenTypes.IMAGE,
        /^!(\[([^\[\]]+?)\]|)\(([^\(\) ]+?)( "([^\(\)]+?)"|)\)/
      ),
      new Token(
        TokenTypes.LINK,
        /^(\[([^\[\]]+?)\]|)(\(([^\(\) ]+?)( "([^\(\)]+?)"|)\)|\[([^\[\]]+?)\])/
      ),
      new Token(TokenTypes.CODEBLOCKSTART, /^\n```(.+?)\n/),
      new Token(TokenTypes.CODEBLOCKEND, /^```\n/),
      new Token(TokenTypes.CODETOGGLE, /^`/),
      new Token(TokenTypes.TOC, /^\n\[TOC\]\n/),
      new Token(TokenTypes.TOF, /^\n\[TOF\]\n/),
      new Token(TokenTypes.PAGEBREAK, /^\n\[PB\]\n/),
      new Token(TokenTypes.LATEXTOGGLE, /^\$/),
      new Token(TokenTypes.LATEXBLOCKSTART, /^\n\$\$/),
      new Token(TokenTypes.LATEXBLOCKEND, /^\$\$\n/),
      new Token(TokenTypes.PARAGRAPH, /^\n(?=[^\n])/),
      new Token(TokenTypes.NEWLINE, /^\n/)
    ];
  }
  _read_next() {
    if (this.inputStream.eof()) return null;
    var match = null;
    for (const token of this.tokens) {
      if ((match = this.inputStream.match(token.pattern))) {
        var newToken = token.createNew();
        newToken.match = match;
        newToken.value = match[0];
        newToken.from = [this.inputStream.line, this.inputStream.col];
        if (
          [
            TokenTypes.HEADER,
            TokenTypes.PARAGRAPH,
            TokenTypes.BLOCKQUOTE,
            TokenTypes.CODEBLOCKSTART,
            TokenTypes.CODEBLOCKEND,
            TokenTypes.LATEXBLOCKSTART,
            TokenTypes.LATEXBLOCKEND,
            TokenTypes.NUMBEREDLIST,
            TokenTypes.UNNUMBEREDLIST,
            TokenTypes.RULE,
            TokenTypes.TOC,
            TokenTypes.TOF,
            TokenTypes.PAGEBREAK
          ].includes(newToken.type)
        ) {
          // Fix .from
          newToken.from[0]++;
          newToken.from[1] = 0;
        }
        this.inputStream.skip(token.pattern);
        newToken.to = [
          this.inputStream.line,
          Math.max(this.inputStream.col - 1, 0)
        ];
        return newToken;
      }
    }
    // No match => Assume text until next match
    // TODO: Make this sexier
    var textToken = new Token(TokenTypes.TEXT, /^./);
    textToken.from = [this.inputStream.line, this.inputStream.col];
    textToken.value = '';
    var foundToken = false;
    while (!foundToken) {
      if (this.inputStream.eof()) break;
      textToken.value += this.inputStream.next();
      for (const token of this.tokens) {
        foundToken = this.inputStream.match(token.pattern);
        textToken.to = [this.inputStream.line, this.inputStream.col - 1];
        if (foundToken) break;
      }
    }
    return textToken;
  }
  peek() {
    return this.current || (this.current = this._read_next());
  }
  next() {
    var tok = this.current;
    this.current = null;
    return tok || this._read_next();
  }
  eof() {
    return this.peek() == null;
  }
  croak(msg) {
    this.inputStream.croak(msg);
  }
}

class Parser {
  constructor(tokenStream) {
    this.tokenStream = tokenStream;
  }
  static parse(string) {
    return new Parser(new TokenStream(new InputStream(string))).parse();
  }
  parse() {
    var out = [];
    // Fix prepended newline
    var token = this.tokenStream.peek();
    if (token == null) return out;
    token.value = token.value.substr(1);

    var comp = null;
    while ((token = this.tokenStream.next())) {
      switch (token.type) {
        case TokenTypes.HEADER:
          comp = this._parse_header(token);
          break;
        case TokenTypes.PARAGRAPH:
          comp = this._parse_paragraph(token);
          break;
        case TokenTypes.BLOCKQUOTE:
          comp = this._parse_blockquote(token);
          break;
        case TokenTypes.NUMBEREDLIST:
          comp = this._parse_numberedlist(token);
          break;
        case TokenTypes.UNNUMBEREDLIST:
          comp = this._parse_unnumberedlist(token);
          break;
        case TokenTypes.CODEBLOCKSTART:
          comp = this._parse_codeblock(token);
          break;
        case TokenTypes.LATEXBLOCKSTART:
          comp = this._parse_latexblock(token);
          break;
        case TokenTypes.RULE:
          comp = this._parse_rule(token);
          break;
        case TokenTypes.TOC:
          comp = this._parse_toc(token);
          break;
        case TokenTypes.TOF:
          comp = this._parse_tof(token);
          break;
        case TokenTypes.PAGEBREAK:
          comp = this._parse_pagebreak(token);
          break;
        case TokenTypes.NEWLINE:
          // Ignore
          break;
        default:
          throw new Error('Unexpected Token: ' + token.type);
          break;
      }
      // These components require a leading newline. Fix the coordinates:
      comp.from[0]++;
      comp.from[1] = 0;
      out.push(comp);
    }
    return out;
  }

  _parse_header(token) {
    var header = new MDHeader();
    header.level = token.value.split('#').length - 1;
    header.from = token.from;
    for (const sub of this._parse_text_line()) {
      header.add(sub);
    }
    header.to = header.last().to;
    return header;
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
      var token = this.tokenStream.next();
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
          comp = this._parse_text(this.tokenStream.next());
          break;
        case TokenTypes.BOLD:
          bold.to = token.to;
          this.tokenStream.next();
          return bold;
          break;
        case TokenTypes.ITALICS:
          comp = this._parse_italics(this.tokenStream.next());
          break;
        case TokenTypes.STRIKETHROUGH:
          comp = this._parse_strikethrough(this.tokenStream.next());
          break;
        case TokenTypes.LATEXTOGGLE:
          comp = this._parse_inline_latex(this.tokenStream.next());
          break;
        case TokenTypes.CODETOGGLE:
          comp = this._parse_inline_code(this.tokenStream.next());
          break;
        case TokenTypes.LINK:
          comp = this._parse_link(this.tokenStream.next());
          break;
        case TokenTypes.IMAGE:
          comp = this._parse_image(this.tokenStream.next());
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
          comp = this._parse_text(this.tokenStream.next());
          break;
        case TokenTypes.BOLD:
          comp = this._parse_bold(this.tokenStream.next());
          break;
        case TokenTypes.ITALICS:
          italics.to = token.to;
          this.tokenStream.next();
          return italics;
        case TokenTypes.STRIKETHROUGH:
          comp = this._parse_strikethrough(this.tokenStream.next());
          break;
        case TokenTypes.LATEXTOGGLE:
          comp = this._parse_inline_latex(this.tokenStream.next());
          break;
        case TokenTypes.CODETOGGLE:
          comp = this._parse_inline_code(this.tokenStream.next());
          break;
        case TokenTypes.LINK:
          comp = this._parse_link(this.tokenStream.next());
          break;
        case TokenTypes.IMAGE:
          comp = this._parse_image(this.tokenStream.next());
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
          comp = this._parse_text(this.tokenStream.next());
          break;
        case TokenTypes.BOLD:
          comp = this._parse_bold(this.tokenStream.next());
          break;
        case TokenTypes.ITALICS:
          comp = this._parse_italics(this.tokenStream.next());
          break;
        case TokenTypes.STRIKETHROUGH:
          strike.to = token.to;
          this.tokenStream.next();
          return strike;
        case TokenTypes.LATEXTOGGLE:
          comp = this._parse_inline_latex(this.tokenStream.next());
          break;
        case TokenTypes.CODETOGGLE:
          comp = this._parse_inline_code(this.tokenStream.next());
          break;
        case TokenTypes.LINK:
          comp = this._parse_link(this.tokenStream.next());
          break;
        case TokenTypes.IMAGE:
          comp = this._parse_image(this.tokenStream.next());
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
          this.tokenStream.next();
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
          text.value += this.tokenStream.next().value;
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
          this.tokenStream.next();
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
          text += this.tokenStream.next().value;
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
  _parse_paragraph(token) {
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
        this.tokenStream.next();
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
  _parse_blockquote(token) {
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
      token = this.tokenStream.next();
    }
    quote.to = quote.last().to;
    return quote;
  }
  _parse_codeblock(token) {
    var code = new MDCodeBlock();
    code.from = token.from;
    while ((token = this.tokenStream.peek())) {
      for (const sub of this._parse_text_line()) {
        code.add(sub);
      }
      token = this.tokenStream.peek();
      if (token && token.type == NEWLINE) {
        // Still going
        this.tokenStream.next();
        code.add(this._parse_newline(token));
      } else {
        break;
      }
    }
  }
}

class Lexer {
  static tokenize(string) {
    var out = [];
    var tokenStream = new TokenStream(new InputStream(string));
    var token;
    while ((token = tokenStream.next())) out.push(token);
    return out;
  }
}

class Token {
  constructor(type, pattern) {
    this.type = type;
    this.pattern = pattern;
    this.value = '';
    this.escapable = false;
  }
  test(string) {
    return this.pattern.test(string);
  }
  apply(string) {
    this.match = string.match(this.pattern);
    this.value = this.match[0];
    return string.substr(this.value.length);
  }
  escapable() {
    this.escapable = true;
    return this;
  }
  createNew() {
    return new Token(this.type, this.pattern);
  }
  getRows() {
    return this.value.match(/\n/).length;
  }
  getColumns() {
    var split = this.value.split('\n');
    return split[split.length - 1].length;
  }
  containsNewline() {
    return this.value.test(/\n/);
  }
}
const TokenTypes = Object.freeze({
  HEADER: 'Header',
  PARAGRAPH: 'Paragraph',
  BLOCKQUOTE: 'Blockquote',
  NUMBEREDLIST: 'NumberedList',
  UNNUMBEREDLIST: 'UnnumberedList',
  CODEBLOCKSTART: 'Codeblockstart',
  CODEBLOCKEND: 'Codeblockend',
  LATEXBLOCKSTART: 'LaTeXBlockStart',
  LATEXBLOCKEND: 'LaTeXBlockEnd',
  RULE: 'Rule',
  TOC: 'TOC',
  TOF: 'TOF',
  PAGEBREAK: 'Pagebreak',
  NEWLINE: 'Newline',
  TEXT: 'Text',
  BOLD: 'Bold',
  ITALICS: 'Italics',
  STRIKETHROUGH: 'Strikethrough',
  LATEXTOGGLE: 'LaTeX',
  CODETOGGLE: 'Code',
  LINK: 'Link',
  IMAGE: 'Image'
});

class TokenArray {}
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
var ast = Parser.parse('# **Header!**');
ast = Parser.parse(
  'Hi there!\nnext line\n\nand another one\n\n# **Header!**\nMath be like: $\\int_0^\\infty f(x)\\mathrm dx = F(\\infity)$\n> May the heavens smite me if I ever let go!\n> This Lasagne belongs to me!\n> Badumm tzz!'
);

module.exports = {
  Lexer: Lexer,
  Parser: Parser,
  InputStream: InputStream,
  TokenStream: TokenStream,
  Token: Token,
  TokenTypes: TokenTypes,
  MDComponent: MDComponent,
  MDDOM: MDDOM,
  MDText: MDText,
  MDTextBold: MDTextBold,
  MDTextItalics: MDTextItalics,
  MDTextCode: MDTextCode,
  MDTextLaTeX: MDTextLaTeX,
  MDParagraph: MDParagraph,
  MDHeader: MDHeader,
  MDTOC: MDTOC,
  MDOrderedList: MDOrderedList,
  MDBulletList: MDBulletList,
  MDItem: MDItem,
  MDLink: MDLink,
  MDImage: MDImage,
  MDSoftBreak: MDSoftBreak,
  MDBlockQuote: MDBlockQuote,
  MDCodeBlock: MDCodeBlock
};
