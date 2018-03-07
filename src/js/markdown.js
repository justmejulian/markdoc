// New parser approach using the component pattern
// TODO: complete existing classes and add missing ones
// TODO: Solve problem of multiline encompassing elements(lists, quotes, code) - WIP, using state pattern(parser classes)

class MDComponent { // Base component for compound pattern
    constructor() {
        this.parent = null;
        this.children = [];
    }

    addChild(component) {
        component.parent = this;
        this.children.push(component);
    }
    removeChild(component) {
        if (this.children.includes(component)) {
            this.children.splice(this.children.indexOf(component));
            component.parent = null;
        }
    }
}
// Central class
class MDDOM extends MDComponent {
    static parse(source) {
        var dom = new MDDOM();
        var parser = new NormalParser(dom);
        for (const line of source.split(/\r?\n/g)) {
            //TODO: insert lists, quotes, codeblocks etc.
            parser = parser.parse(line);
        }
        for (var component of dom.children) {
            if (component instanceof MDTOC) {
                component.compile();
            }
            //TODO: Add compile call for glossary, literature, list of figures etc.
        }
        return dom;
    }
    toHtml() { // done
        var lines = [];
        for (var component of this.children) {
            lines.push(component.toHtml());
        }
        return lines.join('\n');
    }
}


// Parsers (using state pattern)

class Parser {
    constructor(dom) {
        this.dom = dom;
    }
    parse(line) {}
}

class NormalParser extends Parser{
    constructor(dom) {
        super(dom);
    }
    parse(line) {
        if (MDHeader.test(line)) {
            this.dom.addChild(MDHeader.parse(line));
            return this;
        }
        if (MDTOC.test(line)) {
            this.dom.addChild(MDTOC.parse(line));
            return this;
        }
        if (MDCodeBlock.test(line)) {
            var codeblock = new MDCodeBlock();
            codeblock.parse(line);
            return new CodeBlockParser(dom, codeblock);
        }
        if (MDTextLine.test(line)) {
            this.dom.addChild(MDTextLine.parse(line));
            return this;
        }
    }
}

class CodeBlockParser extends Parser {
    constructor(dom, codeblock) {
        super(dom);
        this.codeblock = codeblock;
    }
    parse(line) {
        if (this.codeblock.parse(line)) { // End of code block reached
            return this;
        }
        return new NormalParser();
    }
}


// text components:

class MDText extends MDComponent { // done
    constructor() {
        super();
        this.value = "";
    }

    static test(line) {
        return true;
    }

    // TODO: Make a more sophisticated parser for text elements
    parse(line) { // NOTE: Does not account for unbalanced parenthesis
        var daddy = this;
        var formatStack = [daddy];
        var current = null;
        var asterisks = 0;
        var underscores = 0;
        var tilde = 0;
        var slantedApostrophs = 0;
        var dollars = 0;
        for (var i = 0; i < line.length; i++) {
            var char = line.charAt(i);
            //TODO: Parse text
            switch (char) {
                case '\*':
                    asterisks++;
                    underscores = 0;
                    tilde = 0;
                    slantedApostrophs = 0;
                    dollars = 0;
                    break;
                case '_':
                    asterisks = 0;
                    underscores++;
                    tilde = 0;
                    slantedApostrophs = 0;
                    dollars = 0;
                    break;
                case '~':
                    asterisks = 0;
                    underscores = 0;
                    tilde++;
                    slantedApostrophs = 0;
                    dollars = 0;
                    break;
                case '`':
                    asterisks = 0;
                    underscores = 0;
                    tilde = 0;
                    slantedApostrophs++;
                    dollars = 0;
                    break;
                case '$':
                    asterisks = 0;
                    underscores = 0;
                    tilde = 0;
                    slantedApostrophs = 0;
                    dollars++;
                    break;
                default:
                    if (asterisks == 2 || underscores == 2) { // Bold
                        console.log("*BOLD*");
                        if (current == null) {
                            current = new MDTextBold();
                            daddy.addChild(current);
                            formatStack.push(current);
                        }
                        if (current instanceof MDTextBold) { // End of Bold block
                            formatStack.pop();
                            current = formatStack[formatStack.length];
                        } else { // Start of Bold block
                            var newObj = new MDTextBold();
                            formatStack.push(newObj);
                            current.addChild(newObj);
                        }
                    }
                    if (asterisks == 1) { // Italics
                        if (current == null) {
                            current = new MDTextItalics();
                            daddy.addChild(current);
                            formatStack.push(current);
                        }
                        if (current instanceof MDTextItalics) { // End of Italics block
                            formatStack.pop();
                            current = formatStack[formatStack.length];
                        } else { // Start of Italics block
                            var newObj = new MDTextItalics();
                            formatStack.push(newObj);
                            current.addChild(newObj);
                        }
                    }
                    if (underscores == 1) { // Underscore
                        if (current == null) {
                            current = new MDTextUnderscore();
                            daddy.addChild(current);
                            formatStack.push(current);
                        }
                        if (current instanceof MDTextUnderscore) { // End of Underscore block
                            formatStack.pop();
                            current = formatStack[formatStack.length];
                        } else { // Start of Underscore block
                            var newObj = new MDTextUnderscore();
                            formatStack.push(newObj);
                            current.addChild(newObj);
                        }
                    }
                    if (tilde == 2) { // Strikethrough
                        if (current == null) {
                            current = new MDTextStrikeThrough();
                            daddy.addChild(current);
                            formatStack.push(current);
                        }
                        if (current instanceof MDTextStrikeThrough) { // End of Strikethrough block
                            formatStack.pop();
                            current = formatStack[formatStack.length];
                        } else { // Start of Strikethrough block
                            var newObj = new MDTextStrikeThrough();
                            formatStack.push(newObj);
                            current.addChild(newObj);
                        }
                    }
                    if (slantedApostrophs == 2) { // Code
                        if (current == null) {
                            current = new MDTextCode();
                            daddy.addChild(current);
                            formatStack.push(current);
                        }
                        if (current instanceof MDTextCode) { // End of Code block
                            formatStack.pop();
                            current = formatStack[formatStack.length];
                        } else { // Start of Code block
                            var newObj = new MDTextCode();
                            formatStack.push(newObj);
                            current.addChild(newObj);
                        }
                    }
                    if (slantedApostrophs == 2) { // Math
                        if (current == null) {
                            current = new MDTextMath();
                            daddy.addChild(current);
                            formatStack.push(current);
                        }
                        if (current instanceof MDTextMath) { // End of Math block
                            formatStack.pop();
                            current = formatStack[formatStack.length];
                        } else { // Start of Math block
                            var newObj = new MDTextMath();
                            formatStack.push(newObj);
                            current.addChild(newObj);
                        }
                    }
                    if (current == null) {
                        current = new MDTextPlain();
                        daddy.addChild(current);
                        formatStack.push(current);
                    }
                    console.log(current.value);
                    current.value += char;
                    asterisks = 0;
                    underscores = 0;
                    tilde = 0;
                    slantedApostrophs = 0;
                    dollars = 0;
                    break;
            }
        }
        return this;
    }

    toHtml() {
        var tags = [];
        for (var component of this.children) {
            tags.push(component.toHtml());
        }
        return tags.join("");
    }
}

class MDTextPlain extends MDText {
    toHtml() {
        return this.value;
    }
}
class MDTextBold extends MDText {
    toHtml() {
        return "<strong>" + this.value + "</strong>";
    }
} // **,__
class MDTextItalics extends MDText {
    toHtml() {
        return "<em>" + this.value + "</em>";
    }
} // *
class MDTextUnderscore extends MDText {
    toHtml() {
        return "<u>" + this.value + "</u>";
    }
} // _
class MDTextStrikeThrough extends MDText {
    toHtml() {
        return "<s>" + this.value + "</s>";
    }
} // ~~
class MDTextCode extends MDText {
    toHtml() {
        return "<code>" + this.value + "</code>";
    }
} // `
class MDTextMath extends MDText {
    toHtml() {
        return "<span>" + this.value + "</span>";
    }
} // $


// per line components:

class MDTextLine extends MDComponent {
    constructor(value) {
        super();
        this.addChild(new MDText().parse(value));
    }

    static test(line) {
        return true;
    }

    static parse(line) {
        return new MDTextLine(line);
    }

    toHtml() {
        var tags = ["<p>"];
        for (var component of this.children) {
            tags.push(component.toHtml());
        }
        tags.push("</p>");
        return tags.join("");
    }
}

class MDHeader extends MDComponent {
    constructor(value, level) {
        super();
        this.level = level;
        this.id = null;
        this.addChild(new MDText().parse(value));
    }

    static test(line) {
        return /^#{1,6} .+?$/gm.test(line);
    }

    static parse(line) {
        var title = line.replace(/^#{1,6} (.+?)$/gm, "$1");
        var level = line.replace(/^(#{1,6}) .+?$/gm, "$1").length;
        return new MDHeader(title, level);
    }

    toHtml() {
        var pretag = "<h" + this.level + (this.id ? " id=\"" + this.id + "\">" : ">");
        var posttag = "</h" + this.level + ">";
        var tags = [pretag];
        for (var component of this.children) {
            tags.push(component.toHtml());
        }
        tags.push(posttag);
        return tags.join("");
    }
}

class MDTOC extends MDComponent {

    static test(line) {
        return /^\[TOC\]$/gm.test(line);
    }

    static parse(line) {
        return new MDTOC();
    }

    toHtml() { //TODO: Decide on a proper HTML tag
        var tags = ["<div id=\"toc\" class=\"toc\">"];
        for (var component of this.children) {
            tags.push(component.toHtml());
        }
        tags.push("</div>");
        return tags.join("");
    }

    compile() {
        this.children = [];
        var headercount = 0;
        var list = new MDNumberedList();
        for (var component of this.parent.children) {
            if (component instanceof MDHeader) {
                headercount++;
                component.id = "header" + headercount;
                list.addChild(new MDText(
                    "<li><a href=\"#" + component.id + "\">" +
                    component.toHtml() +
                    "</a></li>"
                ));
            }
        }
        this.addChild(list);
    }
}

class MDNumberedList extends MDComponent {

    static test(line) {
        return /^\d+?\. .*?$/gm.test(line);
    }

    toHtml() {
        var tags = ["<ol>"];
        for (var component of this.children) {
            tags.push(component.toHtml());
        }
        tags.push("</ol>");
        return tags.join("");
    }
}

class MDCodeBlock extends MDComponent {
    constructor() {
        super();
        this.language = null;
        this.headread = false;
        this.addChild(new MDTextLine(""));
        this.children[0].value = "";
    }
    static test(line) {
        return /^```.*?$/gm.test(line);
    }
    parse(line) {
        if (!this.headread && /^```.*?$/gm.test(line)) { // Beginning of code block
            this.language = line.replace(/^```(.*?)$/g, "$1");
            this.headread = true;
            return true;
        }
        if (/^```$/gm.test(line)) { // End of code block detected
            return false;
        }
        // new line of code block content
        this.children[0].value += line + '\n';
        return true;
    }
}



// For testing:
// console.log(MDDOM.parse(
//     "## t_~~e~~**st**_\n" +
//     "Hi **there**!\n" +
//     "[TOC]"
// ).toHtml());
console.log(MDDOM.parse(
    "this is a **Test**!"
).toHtml());

// export {
//     MDComponent,
//     MDDOM,
//     MDText, MDTextPlain, MDTextBold, MDTextItalics, MDTextUnderscore, MDTextStrikeThrough, MDTextMath, MDTextCode,
//     MDTextLine, MDHeader, MDTOC, MDNumberedList, MDCodeBlock
// }
