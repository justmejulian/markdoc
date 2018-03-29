'use strict';
const { WordCounter } = require('../app/src/js/wordcount');

describe('WordCounter', () => {
  it('Should count words in the document', () => {
    expect(WordCounter.countWords('hello this is a test')).toEqual(5);
  });

  it('Should count double distance as word', () => {
    expect(WordCounter.countWords('  ')).toEqual(1);
  });

  it('Should count a lot of words', () => {
    expect(
      WordCounter.countWords(
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.'
      )
    ).toEqual(100);
  });

  it('Should count numbers', () => {
    expect(WordCounter.countWords('5')).toEqual(1);
  });

  it('Should count as one word', () => {
    expect(WordCounter.countWords('')).toEqual(1);
  });
});
