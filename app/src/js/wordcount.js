class WordCounter {
  static countWords(str) {
    var strs = str.trim().split(/[\s\n\r\.\?\!\(\)\[\]\{\}\`]+/);
    var count = 0;
    for (const string of strs) {
      count += string.length == 0 ? 0 : 1;
    }
    return count;
  }

  static countCharacters(str) {
    var strs = str.trim();
    var count = 0;
    for (const string of strs) {
      count += string.length == 0 ? 0 : 1;
    }
    return count;
  }
}

module.exports = {
  WordCounter: WordCounter
};
