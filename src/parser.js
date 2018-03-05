function parser(src) {
    var parsed = src;
    // Headers
    parsed = parsed.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
    parsed = parsed.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    parsed = parsed.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
    parsed = parsed.replace(/^#### (.*?)$/gm, "<h4>$1</h4>");
    parsed = parsed.replace(/^##### (.*?)$/gm, "<h5>$1</h5>");
    parsed = parsed.replace(/^###### (.*?)$/gm, "<h6>$1</h6>");

    // Emphasis
    parsed = parsed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    parsed = parsed.replace(/__(.+?)__/g, "<strong>$1</strong>");
    parsed = parsed.replace(/\*(.+?)\*/g, "<em>$1</em>");
    parsed = parsed.replace(/_(.+?)_/g, "<em>$1</em>");
    parsed = parsed.replace(/~~(.+?)~~/g, "<s>$1</s>");
    return parsed;
}

export default parser
