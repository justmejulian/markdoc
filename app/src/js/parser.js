'use strict';

const NEWLINE = 'Newline';
const HEADER = 'Header';
const BOLD = 'Bold';
const ITALICS = 'Italics';
const STRIKETHROUGH = 'Strikethrough';
const BLOCKQUOTE = 'Blockquote';
const NUMBEREDLIST = 'NumberedList';
const UNNUMBEREDLIST = 'UnnumberedList';
const RULE = 'Rule';
const LINK = 'Link';
const IMAGE = 'Image';
const CODE = 'Code';
const CODEBLOCK = 'Codeblock';
const INDENT = 'Indentation';
const TOC = 'TOC';
const TOF = 'TOF';
const PAGEBREAK = 'Pagebreak';
const LATEX = 'LaTeX';
const LATEXBLOCK = 'LaTeXBlock';
const ESCAPE = 'Escape';
const TEXT = 'Text';

class Lexer {
  static tokenize(string) {
    var tokens = [
      new Token(NEWLINE, /^\n/),
      new Token(HEADER, /^#{1,6}\s/),
      new Token(BOLD, /^\*\*/),
      new Token(ITALICS, /^_/),
      new Token(STRIKETHROUGH, /^~~/),
      new Token(BLOCKQUOTE, /^> /),
      new Token(NUMBEREDLIST, /^\d+?\. /),
      new Token(UNNUMBEREDLIST, /^\* /),
      new Token(RULE, /^(\*\*\*|---|___)\s*/),
      new Token(
        LINK,
        /^(\[([^\[\]]+?)\]|)(\(([^\(\) ]+?)( "([^\(\)]+?)"|)\)|\[([^\[\]]+?)\])/
      ),
      new Token(IMAGE, /^!(\[([^\[\]]+?)\]|)\(([^\(\) ]+?)( "([^\(\)]+?)"|)\)/),
      new Token(CODEBLOCK, /^```/),
      new Token(CODE, /^`/),
      new Token(INDENT, /^(    |\t)/),
      new Token(TOC, /^\[TOC\]/),
      new Token(TOF, /^\[TOF\]/),
      new Token(PAGEBREAK, /^\[PB\]/),
      new Token(LATEX, /^\$/),
      new Token(LATEXBLOCK, /^\$\$/),
      new Token(ESCAPE, /^\\/)
    ];
    var out = [];
    var foundToken = false;
    while (string.length) {
      for (const token of tokens) {
        if (token.test(string)) {
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
    return out;
  }
}

class Token {
  constructor(type, pattern) {
    this.type = type;
    this.pattern = pattern;
  }
  test(string) {
    return this.pattern.test(string);
  }
  apply(string) {
    this.match = string.match(this.pattern);
    this.value = this.match[0];
    return string.substr(this.value.length);
  }
  createNew() {
    return new Token(this.type, this.pattern);
  }
}

class Parser {
  static parse(tokens) {
    var levelStack = [];
  }
}

var tokens = Lexer.tokenize('# **Header!**');

module.exports = {
  Lexer: Lexer,
  Parser: Parser
};
