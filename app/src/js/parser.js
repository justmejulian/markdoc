'use strict';

function isDigit(char) {
  return !isNaN(parseInt(char, 10));
}

class Lexer {
  static tokenize(string) {
    var tokens = [
      new TknCodeBlockDelimiter(),
      new TknCodeDelimiter(),
      new TknExclamationMark(),
      new TknOpeningBracket(),
      new TknCloseingBracket(),
      new TknOpeningSquareBracket(),
      new TknCloseingSquareBracket(),
      new TknHash(),
      new TknNewline(),
      new TknEOF(),
      new TknString()
    ];
    var out = [];
    while (string.length) {
      for (const token of tokens) {
        if (token.test(string)) {
          if (
            out[out.length - 1] instanceof TknString &&
            token instanceof TknString
          ) {
            string = out[out.length - 1].apply(string, out);
          } else {
            string = token.createNew().apply(string, out);
          }
        }
      }
    }
    return out;
  }
}

class Token {
  test(string) {
    return this.pattern.test(string);
  }
  apply(string, list) {
    var match = string.match(this.pattern);
    this.value = match[0];
    list.push(this);
    return string.substr(this.value.length);
  }
}
class TknCodeBlockDelimiter extends Token {
  constructor() {
    super();
    this.pattern = /^```/;
  }
  createNew() {
    return new TknCodeBlockDelimiter();
  }
}
class TknCodeDelimiter extends Token {
  constructor() {
    super();
    this.pattern = /^`/;
  }
  createNew() {
    return new TknCodeDelimiter();
  }
}
class TknExclamationMark extends Token {
  constructor() {
    super();
    this.pattern = /^!/;
  }
  createNew() {
    return new TknExclamationMark();
  }
}
class TknOpeningBracket extends Token {
  constructor() {
    super();
    this.pattern = /^\(/;
  }
  createNew() {
    return new TknOpeningBracket();
  }
}
class TknCloseingBracket extends Token {
  constructor() {
    super();
    this.pattern = /^\)/;
  }
  createNew() {
    return new TknCloseingBracket();
  }
}
class TknOpeningSquareBracket extends Token {
  constructor() {
    super();
    this.pattern = /^\[/;
  }
  createNew() {
    return new TknOpeningSquareBracket();
  }
}
class TknCloseingSquareBracket extends Token {
  constructor() {
    super();
    this.pattern = /^\]/;
  }
  createNew() {
    return new TknCloseingSquareBracket();
  }
}
class TknHash extends Token {
  constructor() {
    super();
    this.pattern = /^#/;
  }
  createNew() {
    return new TknHash();
  }
}
class TknNewline extends Token {
  constructor() {
    super();
    this.pattern = /^\n/;
  }
  createNew() {
    return new TknNewline();
  }
}
class TknEOF extends Token {
  constructor() {
    super();
    this.pattern = /^$/;
  }
  createNew() {
    return new TknEOF();
  }
}
class TknString extends Token {
  constructor() {
    super();
    this.pattern = /^./;
  }
  apply(string, list) {
    if (list.length > 0) {
      if (list[list.length - 1] instanceof TknString) {
        list[list.length - 1].value += string.substr(0, 1);
        return string.substr(1);
      }
    }
    this.value = string.substr(0, 1);
    list.push(this);
    return string.substr(1);
  }
  createNew() {
    return new TknString();
  }
}

module.export.push({ Lexer: Lexer });

class Parser {
  static parse(tokens) {
    var levelStack = [];
  }
}
class State {
  consume(tokens, index, dom) {
    return this;
  }
}

var tokens = Lexer.tokenize('## The Hash! ##');
console.log(JSON.stringify(tokens));
