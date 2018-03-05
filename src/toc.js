// Funktion kann asserhalb mit htmlTableOfContents(); aufgerufen werden.

function htmlTableOfContents (documentRef) {
    var documentRef = documentRef || document;
    var toc = documentRef.getElementById('toc');
    var headings = [].slice.call(documentRef.body.querySelectorAll('h1, h2, h3, h4, h5, h6'));

// Index damit einzelne TOC Zeilen über CSS ansprechbar sind (untersuchbar in Browser).
    headings.forEach(function (heading, index) {
        var anchor = documentRef.createElement('a');
        anchor.setAttribute('name', 'toc' + index);
        anchor.setAttribute('id', 'toc' + index);

        //var index2 = document.querySelector("h2").innerText;
        var link = documentRef.createElement('a');
        link.setAttribute('href', '#'  + heading.innerText);
// TextContent (standard) statt innerText produziert Abstände, Grund unbekannt
        link.innerText = heading.innerText;

        var div = documentRef.createElement('div');
// Erstellt die Struktur
        div.appendChild(link);
        toc.appendChild(div);
        heading.parentNode.insertBefore(anchor, heading);
    });
}

try {
     module.exports = htmlTableOfContents;
} catch (e) {
    // module.exports is not defined
}
