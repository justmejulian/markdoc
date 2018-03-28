'use strict';
const { WordCounter } = require('../app/src/js/wordcount');

describe('WordCounter', () => {
  it('Should count words in the document', () => {
    expect(WordCounter.countWords('hello this is a test')).toEqual(5);
  });
});
