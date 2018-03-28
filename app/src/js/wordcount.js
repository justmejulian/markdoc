class WordCounter {
  static countWords(str) {
    return str.trim().split(/[\s\n\r]+/).length;
  }
}

module.exports = {
  WordCounter: WordCounter
};
