'use strict';
const { WordCounter } = require('../app/src/js/wordcount');

describe('WordCounter', () => {
  it('should count words in the document', () => {
    expect(WordCounter.countWords('hello this is a test')).toEqual(5);
  });
  it("shouldn't count newlines, spaces or tabs", () => {
    expect(
      WordCounter.countWords('How many newlines\n\n\n\n\ncan you count?')
    ).toEqual(6);
    expect(
      WordCounter.countWords('How many tabs\t\t\t\t\tcan you count?')
    ).toEqual(6);
    expect(
      WordCounter.countWords('How many spaces     can you count?')
    ).toEqual(6);
  });
  it("shouldn't count punctuation or other symbols as words", () => {
    expect(WordCounter.countWords('Oops !')).toEqual(1);
    expect(WordCounter.countWords('I made.a.slight.mistake?')).toEqual(5);
    expect(WordCounter.countWords('... with punctuation there ...')).toEqual(3);
    expect(WordCounter.countWords('But what about this\n?')).toEqual(4);
    expect(WordCounter.countWords('YOU `SHALL ` PASS!!')).toEqual(3);
  });
});
