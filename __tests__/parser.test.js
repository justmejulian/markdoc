'use strict';
const { Lexer } = require('./parser.js');

describe('Lexer', () => {
  it('should tokenize correctly', () => {
    var tokens = Lexer.tokenize('Test `this`!');
    expect(tokens.length).toEqual(5);
  });
});
