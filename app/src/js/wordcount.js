class WordCounter {
  static countWords(str) {
    return str.trim().split(/\s+/).length;
  }
}

module.exports = {
  WordCounter: WordCounter
};
