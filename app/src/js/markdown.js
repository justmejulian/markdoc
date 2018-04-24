'use strict';

const HEADER = 'Header';
const PARAGRAPH = 'Paragraph';
const BLOCKQUOTE = 'Blockquote';
const NUMBEREDLIST = 'NumberedList';
const UNNUMBEREDLIST = 'UnnumberedList';
const CODEBLOCKSTART = 'Codeblockstart';
const CODEBLOCKEND = 'Codeblockend';
const LATEXBLOCKSTART = 'LaTeXBlockStart';
const LATEXBLOCKEND = 'LaTeXBlockEnd';
const RULE = 'Rule';
const TOC = 'TOC';
const TOF = 'TOF';
const PAGEBREAK = 'Pagebreak';
const NEWLINE = 'Newline';
const TEXT = 'Text';
const BOLD = 'Bold';
const ITALICS = 'Italics';
const STRIKETHROUGH = 'Strikethrough';
const LATEXTOGGLE = 'LaTeX';
const CODETOGGLE = 'Code';
const LINK = 'Link';
const IMAGE = 'Image';

class InputStream {
  constructor(string) {
    this.input = string;
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
    return ch;
  }
  match(regex) {
    return this.input.substr(this.pos).match(regex);
  }
  skip(regex) {
    var match = this.input.substr(this.pos).match(regex);
    this.pos += match[0].length;
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
    this.input = inputStream;
    this.tokens = [
      new Token(HEADER, /^\n#{1,6}\s/),
      new Token(BOLD, /^\*\*/),
      new Token(ITALICS, /^_/),
      new Token(STRIKETHROUGH, /^~~/),
      new Token(BLOCKQUOTE, /^\n> /),
      new Token(NUMBEREDLIST, /^\n(    |\t)*\d+?\.\s/),
      new Token(UNNUMBEREDLIST, /^\n(    |\t)*\*\s/),
      new Token(RULE, /^\n(\*\*\*|---|___)\n*/),
      new Token(
        LINK,
        /^(\[([^\[\]]+?)\]|)(\(([^\(\) ]+?)( "([^\(\)]+?)"|)\)|\[([^\[\]]+?)\])/
      ),
      new Token(IMAGE, /^!(\[([^\[\]]+?)\]|)\(([^\(\) ]+?)( "([^\(\)]+?)"|)\)/),
      new Token(CODEBLOCKSTART, /^\n```/),
      new Token(CODEBLOCKEND, /^```\n/),
      new Token(CODETOGGLE, /^`/),
      new Token(TOC, /^\n\[TOC\]\n/),
      new Token(TOF, /^\n\[TOF\]\n/),
      new Token(PAGEBREAK, /^\n\[PB\]\n/),
      new Token(LATEXTOGGLE, /^\$/),
      new Token(LATEXBLOCKSTART, /^\n\$\$/),
      new Token(LATEXBLOCKEND, /^\$\$\n/),
      new Token(PARAGRAPH, /^\n(?=[^\s])/),
      new Token(NEWLINE, /^\n/)
    ];
  }
  _read_next() {
    if (this.input.eof()) return null;
    var match = null;
    for (const token of this.tokens) {
      if ((match = this.input.match(token.pattern))) {
        var newToken = token.createNew();
        newToken.match = match;
        newToken.value = match[0];
        this.input.skip(token.pattern);
        return newToken;
      }
    }
    // No match => Assume text until next match
    // TODO: Make this sexier
    var textToken = new Token(TEXT, /^./);
    textToken.value = '';
    var foundToken = false;
    while (!foundToken) {
      if (this.input.eof()) break;
      textToken.value += this.input.next();
      for (const token of this.tokens) {
        foundToken = this.input.match(token.pattern);
        if (foundToken) break;
      }
    }
    return textToken;
  }
  peek() {
    return this.current || (this.current = _read_next());
  }
  next() {
    var tok = this.current;
    this.current = null;
    return tok || this._read_next();
  }
  eof() {
    return this.peek() == null;
  }
}

class Lexer {
  static tokenize(string) {
    var tokens = [
      new Token(HEADER, /^\n#{1,6}\s/),
      new Token(BOLD, /^\*\*/),
      new Token(ITALICS, /^_/),
      new Token(STRIKETHROUGH, /^~~/),
      new Token(BLOCKQUOTE, /^\n> /),
      new Token(NUMBEREDLIST, /^\n(    |\t)*\d+?\.\s/),
      new Token(UNNUMBEREDLIST, /^\n(    |\t)*\*\s/),
      new Token(RULE, /^\n(\*\*\*|---|___)\n*/),
      new Token(
        LINK,
        /^(\[([^\[\]]+?)\]|)(\(([^\(\) ]+?)( "([^\(\)]+?)"|)\)|\[([^\[\]]+?)\])/
      ),
      new Token(IMAGE, /^!(\[([^\[\]]+?)\]|)\(([^\(\) ]+?)( "([^\(\)]+?)"|)\)/),
      new Token(CODEBLOCKSTART, /^\n```/),
      new Token(CODEBLOCKEND, /^```\n/),
      new Token(CODETOGGLE, /^`/),
      new Token(TOC, /^\n\[TOC\]\n/),
      new Token(TOF, /^\n\[TOF\]\n/),
      new Token(PAGEBREAK, /^\n\[PB\]\n/),
      new Token(LATEXTOGGLE, /^\$/),
      new Token(LATEXBLOCKSTART, /^\n\$\$/),
      new Token(LATEXBLOCKEND, /^\$\$\n/),
      new Token(PARAGRAPH, /^\n(?=[^\s])/),
      new Token(NEWLINE, /^\n/)
    ];
    var out = [];
    var foundToken = false;
    var escaped = false;
    string = '\n' + string + '\n';
    while (string.length) {
      for (const token of tokens) {
        if (token.test(string, escaped)) {
          var newToken = token.createNew();
          string = newToken.apply(string);
          out.push(newToken);
          foundToken = true;
        }
      }
      if (foundToken) {
        foundToken = false;
      } else {
        if (out.length !== 0 && out[out.length - 1].type == TEXT) {
          out[out.length - 1].value += string.substr(0, 1);
          string = string.substr(1);
        } else {
          var textToken = new Token(TEXT, /^./);
          string = textToken.apply(string);
          out.push(textToken);
        }
      }
    }
    if (out[out.length - 1].type == NEWLINE) out.pop();
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

class Parser {
  static parse(tokens) {
    var availableComponents = [
      new MDHeader(),
      new MDParagraph(),
      new MDBlockQuote(),
      new MDCodeBlock(),
      new MDOrderedList(),
      new MDBulletList(),
      new MDText(),
      new MDTextBold(),
      new MDTextItalics(),
      new MDTextCode(),
      new MDTextLaTeX(),
      new MDLink(),
      new MDImage(),
      new MDItem(),
      new MDThematicBreak(),
      new MDTOC(),
      new MDTOF(),
      new MDPageBreak()
    ];
    const header = new MDHeader();
    var row = 0;
    var column = 0;
    var out = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      var newRows = token.getRows();
      if (newRows != 0) {
        row += newRows;
        column = 0;
      }
      column += token.getColumns();
      switch (token.type) {
        case HEADER:
          out.push(header.createNew());
          break;

        default:
          break;
      }
    }
  }
}

class TokenArray {}
class TokenFilter {
  constructor() {}
  oneOf(tokenArray) {}
  nOf(number, tokenArray) {}
  anyNOf(tokenArray) {}
  noneOf(tokenArray) {}
}

const commonmark = require('commonmark');
var toc_found = false;
var tof_found = false;

class MDComponent {
  constructor() {
    this.parent = null;
    this.children = [];
    this.prematchFilters = [];
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
      this.children.splice(index);
      component.parent = null;
    }
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
  constructor() {
    super();
    this.prematchFilters.push(new TokenFilter(TEXT));
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
    super();
    this.prematchFilters.push(new TokenFilter(BOLD));
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
    super();
    this.prematchFilters.push(new TokenFilter(ITALICS));
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
class MDTextCode extends MDText {
  constructor() {
    super();
    this.prematchFilters.push(new TokenFilter(CODE));
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
    super();
    this.prematchFilters.push(new TokenFilter(LATEX));
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
    super();
    this.prematchFilters.push(new TokenFilter(LINK));
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
    super();
    this.prematchFilters.push(new TokenFilter(IMAGE));
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
    super();
    this.prematchFilters = [new TokenFilter(NEWLINE), new TokenFilter(HEADER)];
    this.unmatchers = [];
    this.matchFinisher = [new TokenFilter(NEWLINE)];
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
    super();
    this.prematchFilters.push(new TokenFilter(NEWLINE));
    this.unmatchers = [];
    this.matchFinisher = [];
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
    super();
    this.prematchFilters = [
      new TokenFilter(NEWLINE, BOF, INDENT),
      new TokenFilter(NUMBEREDLIST)
    ];
    this.unmatchers = [];
    this.matchFinisher = [
      new TokenFilter(NEWLINE, EOF).except(ESCAPE),
      new TokenFilter(
        NEWLINE,
        EOF,
        CODEBLOCK,
        HEADER,
        TOC,
        TOF,
        PAGEBREAK,
        LATEXBLOCK
      )
    ];
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
  constructor() {
    super();
    this.prematchFilters = [
      new TokenFilter(NEWLINE, BOF, INDENT),
      new TokenFilter(UNNUMBEREDLIST)
    ];
    this.unmatchers = [];
    this.matchFinisher = [
      new TokenFilter(NEWLINE, EOF).except(ESCAPE),
      new TokenFilter(
        NEWLINE,
        EOF,
        CODEBLOCK,
        HEADER,
        TOC,
        TOF,
        PAGEBREAK,
        LATEXBLOCK
      )
    ];
  }
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
  constructor() {
    super();
    this.prematchFilters = [
      new TokenFilter(NEWLINE, BOF, INDENT),
      new TokenFilter(NUMBEREDLIST, UNNUMBEREDLIST)
    ];
    this.unmatchers = [];
    this.matchFinisher = [new TokenFilter(NEWLINE, EOF)];
  }
  toHtml() {
    return `<li>${super.toHtml()}</li>`;
  }
}

class MDBlockQuote extends MDComponent {
  constructor() {
    super();
    this.prematchFilters = [
      new TokenFilter(NEWLINE, BOF),
      new TokenFilter(BLOCKQUOTE)
    ];
    this.unmatchers = [];
    this.matchFinisher = [
      new TokenFilter(NEWLINE, EOF).except(ESCAPE),
      new TokenFilter(
        NEWLINE,
        EOF,
        CODEBLOCK,
        HEADER,
        TOC,
        TOF,
        PAGEBREAK,
        LATEXBLOCK
      )
    ];
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
            throw `Unknown list sub type: ${node.listType}`;
            return;
        }
        break;
      case 'item':
        translated = new MDItem();
        break;
      default:
        throw `Unknown token type: ${node.type}`;
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

var tokens = Lexer.tokenize('# **Header!**');
var input = new InputStream('\n# **Header!**');
var tokens = new TokenStream(input);
var token;
while ((token = tokens.next())) {
  console.log(token);
}

module.exports = {
  Lexer: Lexer,
  Parser: Parser,
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
  MDCodeBlock: MDCodeBlock,
  SourcePosition: SourcePosition
};
