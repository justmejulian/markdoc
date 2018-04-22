function countWords(str) {
  var strs = str.trim().split(' ');
  var count = strs.length;
  return count;
}

function countCharacters(str) {
  var count = str.length;
  return count;
}

module.exports = {
  countWords: countWords,
  countCharacters: countCharacters
};
