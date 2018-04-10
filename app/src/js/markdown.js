'use strict';

const commonmark = require('commonmark');

class MDComponent {
  constructor() {
    this.parent = null;
    this.children = [];
  }

  add(component) {
    component.parent = this;
    this.children.push(component);
  }

  insert(component, index) {
    component.parent = this;
    this.children.splice(index, 0, component);
  }

  remove(component) {
    if (this.children.includes(component)) {
      this.removeAt(this.children.indexOf(component));
    }
  }

  removeAt(index) {
    if (this.children[index]) {
      this.children.splice(index);
      component.parent = null;
    }
  }

  // Replace current component with a new one if parsable
  _parseReplace() {
    return this;
  }

  // Make some post parse actions if necessary
  _aftermath() {
    return;
  }

  toHtml() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toHtml());
    }
    return tags.join('');
  }

  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('');
  }

  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return tags.join('');
  }
}

// text components:
class MDText extends MDComponent {
  toHtml() {
    if (this.value) return this.value;
    return super.toHtml();
  }
  toString() {
    return this.value;
  }
  toMarkDown() {
    return this.value;
  }
}

class MDTextBold extends MDText {
  toHtml() {
    return `<strong>${super.toHtml()}</strong>`;
  }
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('');
  }
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return `**${tags.join('')}**`;
  }
}
class MDTextItalics extends MDText {
  toHtml() {
    return `<em>${super.toHtml()}</em>`;
  }
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('');
  }
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return `_${tags.join('')}_`;
  }
}
class MDTextCode extends MDText {
  toHtml() {
    return `<code>${this.value}</code>`;
  }
  toString() {
    return this.value;
  }
  toMarkDown() {
    return `\`${this.value}\``;
  }
}
class MDTextMath extends MDText {
  toHtml() {
    return `<span>${super.toHtml()}</span>`;
  }
  toString() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toString());
    }
    return tags.join('');
  }
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return `\$${tags.join('')}\$`;
  }
}

class MDLink extends MDComponent {
  toHtml() {
    if (this.title) {
      return `<a href="${this.destination}" title="${
        this.title
      }">${super.toHtml()}</a>`;
    }
    return `<a href="${this.destination}">${super.toHtml()}</a>`;
  }
  toMarkDown() {
    if (this.title)
      return `[${super.toMarkDown()}](${this.destination} "${this.title}")`;
    return `[${super.toMarkDown()}](${this.destination})`;
  }
}

class MDImage extends MDComponent {
  toHtml() {
    return `<img src="${this.destination}" alt="${super.toHtml()}" title="${
      this.title
    }"/>`;
  }
  toMarkDown() {
    return `![${super.toMarkDown()}](${this.destination} "${this.title}")`;
  }
}

class MDSoftBreak extends MDComponent {
  toHtml() {
    return ` <br/> `;
  }
  toString() {
    return '\n';
  }
  toMarkDown() {
    return '\n';
  }
}

// per line components:

class MDParagraph extends MDComponent {
  _parseReplace() {
    var obj = this;
    obj = MDTOC._test(this.toString()) ? MDTOC._parse(this) : obj;
    return obj;
  }
  toHtml() {
    return `<p>${super.toHtml()}</p>`;
  }
  toString() {
    return super.toString();
  }
  toMarkDown() {
    return super.toMarkDown();
  }
}

class MDHeader extends MDComponent {
  toHtml() {
    if (this.id)
      return `<h${this.level} id="${this.id}">${super.toHtml()}</h${
        this.level
      }>`;
    return `<h${this.level}>${super.toHtml()}</h${this.level}>`;
  }
  toMarkDown() {
    return `${'#'.repeat(this.level)} ${super.toMarkDown()}`;
  }
}

class MDListBase extends MDComponent {
  _aftermath() {
    this._scoutNestedLevels(0);
  }

  _scoutNestedLevels(level) {
    this.level = level;
    for (const child of this.children) {
      for (const subItem of child.children) {
        if (subItem instanceof MDListBase) {
          subItem._scoutNestedLevels(this.level + 1);
        }
      }
    }
  }
}

class MDOrderedList extends MDListBase {
  toHtml() {
    if (this.start != 1) {
      return `<ol start="${this.start}">${super.toHtml()}</ol>`;
    }
    return `<ol>${super.toHtml()}</ol>`;
  }
  toString() {
    var index = this.start || 1;
    var tags = [];
    if (this.level != 0) tags.push('');
    for (var component of this.children) {
      tags.push('\t'.repeat(this.level) + component.toString());
      index++;
    }
    return tags.join('\n');
  }
  toMarkDown() {
    var index = this.start || 1;
    var tags = [];
    if (this.level != 0) tags.push('');
    for (var component of this.children) {
      tags.push(
        '\t'.repeat(this.level) + index + '. ' + component.toMarkDown()
      );
      index++;
    }
    return tags.join('\n') + '\n';
  }
}

class MDBulletList extends MDListBase {
  toHtml() {
    return `<ul>${super.toHtml()}</ul>`;
  }
  toString() {
    var tags = [];
    if (this.level != 0) tags.push('');
    for (var component of this.children) {
      tags.push('\t'.repeat(this.level) + component.toString());
    }
    return tags.join('\n');
  }
  toMarkDown() {
    var tags = [];
    if (this.level != 0) tags.push('');
    for (var component of this.children) {
      tags.push('\t'.repeat(this.level) + '- ' + component.toMarkDown());
    }
    return tags.join('\n') + '\n';
  }
}

class MDItem extends MDComponent {
  toHtml() {
    return `<li>${super.toHtml()}</li>`;
  }
}

class MDBlockQuote extends MDComponent {
  toHtml() {
    return `<blockquote>${super.toHtml()}</blockquote>`;
  }
  toString() {
    return super.toString();
  }
  toMarkDown() {
    var tags = [];
    for (var component of this.children) {
      tags.push(component.toMarkDown());
    }
    return '> ' + tags.join('\n> ') + '\n';
  }
}

class MDCodeBlock extends MDComponent {
  toHtml() {
    if (this.language) return `<pre><code>${this.value}</code></pre>`;
    return `<pre><code class="${this.language} language-${this.language}">${
      this.value
    }</code></pre>`;
  }
  toString() {
    return `Math: ${this.value}`;
  }
  toMarkDown() {
    return '```' + this.language + '\n' + this.value + '```\n';
  }
}

// New elements

class MDTOC extends MDComponent {
  compile(candidates) {
    this.children = [];
    var headercount = 0;
    var list = new MDOrderedList();
    for (var component of candidates) {
      if (component instanceof MDHeader) {
        headercount++;
        component.id = 'header' + headercount;
        var item = new MDItem();
        var text = new MDText();
        text.value = component.toString();
        var link = new MDLink();
        link.title = text.value;
        link.destination = `#${component.id}`;
        link.add(text);
        item.add(link);
        list.add(item);
      }
    }
    this.add(list);
  }
  static _test(string) {
    return /^\[TOC\]$/gm.test(string);
  }
  static _parse(component) {
    var toc = new MDTOC();
    toc.parent = component.parent;
    toc.compile(component.parent.children);
    return toc;
  }
  toHtml() {
    //TODO: Decide on a proper HTML tag
    return `<div id="toc" class="toc">${super.toHtml()}</div>`;
  }
  toString() {
    return '\n';
  }
  toMarkDown() {
    return '[TOC]\n';
  }
}

class MDThematicBreak extends MDComponent {
  toHtml() {
    return '<hr/>';
  }
  toString() {
    return '';
  }
  toMarkDown() {
    return '---';
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
      dom.add(dom._translateNode(child));
      while ((child = child.next)) {
        dom.add(dom._translateNode(child));
      }
    }
    for (let index = 0; index < dom.children.length; index++) {
      const component = dom.children[index];
      dom.children[index] = dom.children[index]._parseReplace();
      dom.children[index]._aftermath();
    }
    return dom;
  }
  _translateNode(node) {
    var translated;
    switch (node.type) {
      case 'text':
        translated = new MDText();
        break;
      case 'strong':
        translated = new MDTextBold();
        break;
      case 'emph':
        translated = new MDTextItalics();
        break;
      case 'code':
        translated = new MDTextCode();
        break;
      case 'link':
        translated = new MDLink();
        translated.destination = node.destination;
        translated.title = node.title;
        break;
      case 'image':
        translated = new MDImage();
        translated.destination = node.destination;
        translated.title = node.title;
        break;
      case 'softbreak':
        translated = new MDSoftBreak();
        break;
      case 'thematic_break':
        translated = new MDThematicBreak();
        break;
      case 'paragraph':
        translated = new MDParagraph();
        break;
      case 'heading':
        translated = new MDHeader();
        translated.level = node.level;
        break;
      case 'block_quote':
        translated = new MDBlockQuote();
        break;
      case 'code_block':
        translated = new MDCodeBlock();
        translated.language = node.info;
        break;
      case 'list':
        switch (node.listType) {
          case 'ordered':
            translated = new MDOrderedList();
            translated.start = node.listStart;
            break;
          case 'bullet':
            translated = new MDBulletList();
            break;
          default:
            throw `Unknown list sub type: ${node.listType}`;
            return;
        }
        break;
      case 'item':
        translated = new MDItem();
        break;
      default:
        throw `Unknown token type: ${node.type}`;
        return;
    }
    if (node.literal) translated.value = node.literal;
    if (node.sourcepos) {
      translated.from = new SourcePosition(node.sourcepos[0]);
      translated.to = new SourcePosition(node.sourcepos[1]);
    }
    var child = node.firstChild;
    if (child) {
      translated.add(this._translateNode(child));
      while ((child = child.next)) {
        translated.add(this._translateNode(child));
      }
    }
    return translated;
  }
  toHtml() {
    var lines = [];
    for (var component of this.children) {
      lines.push(component.toHtml());
    }
    return lines.join('\n').trim();
  }
  toString() {
    var lines = [];
    for (var component of this.children) {
      lines.push(component.toString());
    }
    return lines.join('\n').trim();
  }
  toMarkDown() {
    var lines = [];
    for (var component of this.children) {
      lines.push(component.toMarkDown());
    }
    return lines.join('\n').trim();
  }
}

class SourcePosition {
  constructor(array) {
    this.row = array[0];
    this.column = array[1];
  }
}

// var dom = MDDOM.parse(
//   '# Testheader 1\n' +
//     'Bla**blabla**.\n' +
//     '## Second test header\n' +
//     '[TOC]\n' +
//     '\n' +
//     '1. first\n' +
//     '2. second\n' +
//     '    - sub1\n' +
//     '    - sub2'
// );
// console.log(dom.toString());

module.exports = {
  MDComponent: MDComponent,
  MDDOM: MDDOM,
  MDText: MDText,
  MDTextBold: MDTextBold,
  MDTextItalics: MDTextItalics,
  MDTextCode: MDTextCode,
  MDTextMath: MDTextMath,
  MDParagraph: MDParagraph,
  MDHeader: MDHeader,
  MDTOC: MDTOC,
  MDOrderedList: MDOrderedList,
  MDBulletList: MDBulletList,
  MDItem: MDItem,
  MDLink: MDLink,
  MDImage: MDImage,
  MDSoftBreak: MDSoftBreak,
  MDBlockQuote: MDBlockQuote,
  MDCodeBlock: MDCodeBlock,
  SourcePosition: SourcePosition
};
