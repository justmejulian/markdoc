
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
        var toc = null;
        for (const line of source.split(/\r?\n/g)) {
            if (HtmlHeader.test(line)) {
                dom.addChild(HtmlHeader.parse(line));
                continue;
            }
            if (!toc && HtmlTOC.test(line)) {
                toc = HtmlTOC.parse(line);
                dom.addChild(toc);
                continue;
            }
            //TODO: insert lists, quotes, codeblocks etc.
            if (HtmlTextLine.test(line)) {
                dom.addChild(HtmlTextLine.parse(line));
                continue;
            }
        }
        toc && toc.compile();
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

    // TODO: Make a more sophisticated parser for text elements
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
        this.id = null;
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

class HtmlTOC extends HtmlComponent {

    static test(line) {
        return /^\[TOC\]$/gm.test(line);
    }

    static parse(line) {
        return new HtmlTOC();
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
        var list = new HtmlNumberedList();
        for (var component of this.parent.children) {
            if (component instanceof HtmlHeader) {
                headercount++;
                component.id = "header" + headercount;
                list.addChild(new HtmlText(
                    "<li><a href=\"#" + component.id + "\">" + 
                    component.toHtml() + 
                    "</a></li>"
                ));
            }
        }
        this.addChild(list);
    }
}

class HtmlNumberedList extends HtmlComponent {
    
    test(line) {
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



// For testing:
console.log(HtmlDOM.fromSource(
    "## t_~~e~~**st**_\n" +
    "Hi **there**!\n" +
    "[TOC]"
).toHtml());


// export default {
//     HtmlComponent, HtmlDOM,
//     HtmlText,
//     HtmlHeader, HtmlTextLine, HtmlTOC
// }
