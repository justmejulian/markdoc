
// New parser approach using the component pattern
// TODO: complete existing classes and add missing ones
// TODO: Solve problem of multiline encompassing elements(lists, quotes, code)
class HtmlComponent { // done
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

class HtmlDOM extends HtmlComponent {
    static fromSource(source) {
        var dom = new HtmlDOM();
        for (const line of source.split(/\r?\n/g)) {
            if (HtmlHeader.test(line)) {
                dom.addChild(HtmlHeader.parse(line));
                continue;
            }
            if (HtmlTOC.test(line)) {
                dom.addChild(HtmlTOC.parse(line));
            }
            //TODO: insert lists, quotes, codeblocks etc.
            if (HtmlTextLine.test(line)) {
                dom.addChild(HtmlTextLine.parse(line));
                continue;
            }
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

// text components:
class HtmlText extends HtmlComponent { // done
    constructor(value) {
        super();
        this.value = value;
    }

    static test(line) {
        return true;
    }

    static parse(line) { // NOTE: Does not account for unbalanced parenthesis
        line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        line = line.replace(/__(.+?)__/g, "<strong>$1</strong>");
        line = line.replace(/\*(.+?)\*/g, "<em>$1</em>");
        line = line.replace(/_(.+?)_/g, "<em>$1</em>");
        line = line.replace(/~~(.+?)~~/g, "<s>$1</s>");
        return new HtmlText(line);
    }

    toHtml() {
        return this.value;
    }
}

// per line components:
class HtmlTextLine extends HtmlComponent {
    constructor(value) {
        super();
        this.addChild(HtmlText.parse(value));
    }

    static test(line) {
        return true;
    }

    static parse(line) {
        return new HtmlTextLine(line);
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

class HtmlHeader extends HtmlComponent {
    constructor(value, level) {
        super();
        this.level = level;
        this.addChild(HtmlText.parse(value));
    }

    static test(line) {
        return /^#{1,6} .+?$/gm.test(line);
    }

    static parse(line) {
        var title = line.replace(/^#{1,6} (.+?)$/gm, "$1");
        var level = line.replace(/^(#{1,6}) .+?$/gm, "$1").length;
        return new HtmlHeader(title, level);
    }

    toHtml() {
        var pretag = "<h" + this.level + ">";
        var posttag = "</h" + this.level + ">";
        var tags = [pretag];
        for (var component of this.children) {
            tags.push(component.toHtml());
        }
        tags.push(posttag);
        return tags.join("");
    }
}

class HtmlTOC extends HtmlComponent {

    static test(line) {
        return /^@TOC$/gm.test(line);
    }

    static parse(line) {
        return new HtmlTOC();
    }

    toHtml() {
        var tags = ["<div id=\"toc\" class=\"toc\">"];
        for (var component of this.children) {
            tags.push(component.toHtml());
        }
        tags.push("</div>");
        return tags.join("");
    }

    compile() {
        this.children = [];
        for (var component of this.parent.children) {
            if (component instanceof HtmlHeader) {
                //TODO: Decide on how to make the TOC
            }
        }
    }
}

// For testing:
// console.log(HtmlDOM.fromSource(
//     "## t_~~e~~**st**_\n" +
//     "Hi **there**!"
// ).toHtml());


export default {
    HtmlComponent, HtmlDOM,
    HtmlText,
    HtmlHeader, HtmlTextLine, HtmlTOC
}
