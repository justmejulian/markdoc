'use strict';
const commonmark = require('commonmark');

// TODO: complete existing classes and add missing ones

class MDComponent {
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

    toHtml() {
        var tags = [];
        for (var component of this.children) {
            tags.push(component.toHtml());
        }
        return tags.join("");
    }

    toString() {
        var tags = [];
        for (var component of this.children) {
            tags.push(component.toString());
        }
        return tags.join("");
    }
}

// text components:
class MDText extends MDComponent {
    toHtml() {
        if (this.value)
            return this.value;
        return super.toHtml();
    }
    toString() {
        return this.value;
    }
}

class MDTextBold extends MDText {
    toHtml() {
        return "<strong>" + super.toHtml() + "</strong>";
    }
}
class MDTextItalics extends MDText {
    toHtml() {
        return "<em>" + super.toHtml() + "</em>";
    }
}
class MDTextUnderscore extends MDText {
    toHtml() {
        return "<u>" + super.toHtml() + "</u>";
    }
}
class MDTextStrikeThrough extends MDText {
    toHtml() {
        return "<s>" + super.toHtml() + "</s>";
    }
}
class MDTextCode extends MDText {
    toHtml() {
        return "<code>" + super.toHtml() + "</code>";
    }
}
class MDTextMath extends MDText {
    toHtml() {
        return "<span>" + super.toHtml() + "</span>";
    }
}


// per line components:

class MDParagraph extends MDComponent {
    toHtml() {
        return `<p>${super.toHtml()}</p>`;
    }
}

class MDHeader extends MDComponent {
    toHtml() {
        return `<h${this.level}>${super.toHtml()}</h${this.level}>`;
    }
    toString() {
        return `H${this.level}: ${super.toString()}`;
    }
}

class MDTOC extends MDComponent {
    compile() {
        this.children = [];
        var headercount = 0;
        var list = new MDOrderedList();
        for (var component of this.parent.children) {
            if (component instanceof MDHeader) {
                headercount++;
                component.id = "header" + headercount;
                list.addChild(new MDText(
                    "<li><a href=\"#" + component.id + "\">" +
                    component.toString() +
                    "</a></li>"
                ));
            }
        }
        this.addChild(list);
    }
    toHtml() { //TODO: Decide on a proper HTML tag
        return `<div id="toc" class="toc">${super.toHtml()}</div>`;
    }
    toString() {
        var tags = [];
        for (var component of this.children) {
            tags.push(component.toString());
        }
        return `TOC: ${tags.join(", ")}`;
    }
}

class MDOrderedList extends MDComponent {
    toHtml() {
        if (this.start) {
            return `<ol start="${this.start}">${super.toHtml()}</ol>`
        }
        return `<ol>${super.toHtml()}</ol>`;
    }
    toString() {
        var tags = [];
        for (var component of this.children) {
            tags.push(component.toString());
        }
        return `NList: ${tags.join(", ")}`;
    }
}

class MDBulletList extends MDComponent {
    toHtml() {
        return `<ul>${super.toHtml()}</ul>`;
    }
    toString() {
        var tags = [];
        for (var component of this.children) {
            tags.push(component.toString());
        }
        return `UList: ${tags.join(", ")}`;
    }
}

class MDItem extends MDComponent {
    toHtml() {
        return `<li>${super.toHtml()}</li>`;
    }
}

class MDLink extends MDComponent {
    toHtml() {
        if (this.title) {
            return `<a href="${this.destination}" title="${this.title}">${super.toHtml()}</a>`;
        }
        return `<a href="${this.destination}">${super.toHtml()}</a>`;
    }
}

class MDImage extends MDComponent {
    toHtml() {
        return `<img src="${this.destination}" alt="${super.toHtml()}" title="${this.title}"/>`;
    }
}

class MDSoftBreak extends MDComponent {
    toHtml() {
        return `<br/>`;
    }
}

class MDBlockQuote extends MDComponent {
    toHtml() {
        return `<blockquote>${super.toHtml()}</blockquote>`;
    }
}

class MDCodeBlock extends MDComponent {
    toHtml() {
        if (this.language)
            return `<pre><code>${this.value}</code></pre>`;
        return `<pre><code class="${this.language} language-${this.language}">${this.value}</code></pre>`;
    }
    toString() {
        return `Math: ${this.value}`;
    }
}


// Central class
class MDDOM extends MDComponent {
    static parse(source) {
        var dom = new MDDOM();
        
        var reader = new commonmark.Parser();
        var parsed = reader.parse(source);
        var child = parsed.firstChild;
        if (child) {
            dom.addChild(dom._translateNode(child));
            while (child = child.next) {
                dom.addChild(dom._translateNode(child));
            }
        }

        for (var component of dom.children) {
            if (component instanceof MDTOC) {
                component.compile();
            }
            //TODO: Add compile call for glossary, literature, list of figures etc.
        }
        return dom;
    }
    _translateNode(node) {
        var translated;
        switch (node.type) {
            case "text":
                translated = new MDText();
                break;
            case "strong":
                translated = new MDTextBold();
                break;
            case "emph":
                translated = new MDTextItalics();
                break;
            case "code":
                translated = new MDTextCode();
                break;
            case "link":
                translated = new MDLink();
                translated.destination = node.destination;
                translated.title = node.title;
                break;
            case "image":
                translated = new MDImage();
                translated.destination = node.destination;
                translated.title = node.title;
                break;
            case "softbreak":
                translated = new MDSoftBreak();
                break;
            case "paragraph":
                translated = new MDParagraph();
                break;
            case "heading":
                translated = new MDHeader();
                translated.level = node.level;
                break;
            case "block_quote":
                translated = new MDBlockQuote();
                break;
            case "code_block":
                translated = new MDCodeBlock();
                translated.language = node.info;
                break;
            case "list":
                switch (node.listType) {
                    case "ordered":
                        translated = new MDOrderedList();
                        translated.start = node.listStart;
                        break;
                    case "bullet":
                        translated = new MDBulletList();
                        break;
                    default:
                        break;
                }
                break;
            case "item":
                translated = new MDItem();
                break;
            default:
                console.log(`--- UNKNOWN TOKEN TYPE: ${node.type} --`)
                break;
        }
        if (node.literal)
            translated.value = node.literal;
        var child = node.firstChild;
        if (child) {
            translated.addChild(this._translateNode(child));
            while (child = child.next) {
                translated.addChild(this._translateNode(child));
            }
        }
        return translated;
    }
    toHtml() {
        var lines = [];
        for (var component of this.children) {
            lines.push(component.toHtml());
        }
        return lines.join('\n');
    }
}
// var dom = MDDOM.parse("> This line is part of the same quote.");
// console.log(dom.toHtml());

//exports.MDComponent = MDComponent;
module.exports = {
    MDComponent: MDComponent,
    MDDOM: MDDOM
}