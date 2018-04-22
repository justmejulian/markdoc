'use strict';
const { WordCounter } = require('../app/src/js/wordcounter');

describe('WordCounter', () => {
  it('should count words in the document', () => {
    expect(WordCounter.countWords('hello this is a test')).toEqual(5);
  });

  it("shouldn't count newlines, spaces or tabs", () => {
    expect(
      WordCounter.countWords('How many newlines \n\n\n\n\n can you count?')
    ).toEqual(6);
    expect(
      WordCounter.countWords('How many tabs \t\t\t\t\t can you count?')
    ).toEqual(6);
    expect(
      WordCounter.countWords('How many spaces      can you count?')
    ).toEqual(6);
  });

  it("shouldn't count punctuation or other symbols as words", () => {
    //expect(countWords('Oops !')).toEqual(1);
    expect(WordCounter.countWords('I made.a.slight.mistake?')).toEqual(5);
    expect(WordCounter.countWords('... with punctuation there ...')).toEqual(3);
    expect(WordCounter.countWords('But what about this\n?')).toEqual(4);
    expect(WordCounter.countWords('YOU `SHALL ` PASS!!')).toEqual(3);
  });
});

describe('CharacterCounter', () => {
  it('should count every single character in the document', () => {
    expect(WordCounter.countCharacters('Hey, this is a test.')).toEqual(20);
    expect(WordCounter.countCharacters('Hello')).toEqual(5);
  });

  it('should not count spaces', () => {
    expect(WordCounter.countCharacters(' ')).toEqual(0);
    expect(WordCounter.countCharacters('    ')).toEqual(0);
  });

  it('should count special character', () => {
    expect(WordCounter.countCharacters('ü¨ö$ä+@^')).toEqual(8);
  });

  it('should show zero, if no it has no text', () => {
    expect(WordCounter.countCharacters('')).toEqual(0);
  });
});
