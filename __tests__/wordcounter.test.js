'use strict';
const { countWords, countCharacters } = require('../app/src/js/wordcount');

describe('WordCounter', () => {
  it('should count words in the document', () => {
    expect(countWords('hello this is a test')).toEqual(5);
  });

  it("shouldn't count newlines, spaces or tabs", () => {
    expect(countWords('How many newlines\n\n\n\n\n can you count?')).toEqual(6);
    expect(countWords('How many tabs\t\t\t\t\t can you count?')).toEqual(6);
    expect(countWords('How many spaces      can you count?')).toEqual(6);
  });

  it("shouldn't count punctuation or other symbols as words", () => {
    expect(countWords('Oops !')).toEqual(1);
    expect(countWords('I made.a.slight.mistake?')).toEqual(5);
    expect(countWords('... with punctuation there ...')).toEqual(3);
    expect(countWords('But what about this\n?')).toEqual(4);
    expect(countWords('YOU `SHALL ` PASS!!')).toEqual(3);
  });
});

describe('CharacterCounter', () => {
  it('should count every single character in the document', () => {
    expect(countCharacters('Hey, this is a test.')).toEqual(20);
    expect(countCharacters('Hello')).toEqual(5);
  });

  it('should not count spaces', () => {
    expect(countCharacters(' ')).toEqual(1);
    expect(countCharacters('    ')).toEqual(4);
  });

  it('should count special character', () => {
    expect(countCharacters('ü¨ö$ä+@^')).toEqual(8);
  });

  it('should show zero, if no it has no text', () => {
    expect(countCharacters('')).toEqual(0);
  });
});
