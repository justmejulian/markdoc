'use strict';
const parser = require('../app/src/js/parser.js');
const { Lexer, Parser } = parser;

describe('Lexer', () => {
  it('should tokenize correctly', () => {
    console.log(parser);
    console.log(Lexer);
    var tokens = Lexer.tokenize('Test `this`!');
    expect(tokens.length).toEqual(5);
  });
});
