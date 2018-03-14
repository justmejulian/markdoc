'use strict';
const MD = require("../app/src/js/markdown");
const {MDDOM} = MD;
// import {MDDOM} from '../src/js/markdown.js';

describe("Markdown parser", () => {
    const source = 
        "# Testheader 1\n" +
        "Bla**blabla**.\n" +
        "## Second test header\n" +
        "[TOC]\n" +
        "\n" +
        "1. first\n" +
        "2. second";
    it("should parse headers correctly", () => {
        var dom = MDDOM.parse("# Header");
        expect(dom.toString()).toEqual("Header");
    });
    it("should parse formatted paragraphs correctly", () => {
        var dom = MDDOM.parse("**Hi *th`ere`***! Image: ![alt text](./img.png); Ref: [alt text2](https://duckduckgo.com/)");
        expect(dom.toString()).toEqual("Hi there! Image: alt text; Ref: alt text2");
    });
    it("should parse an ordered list correctly", () => {
        var dom = MDDOM.parse(
            "1. first\n" +
            "3. second!\n" +
            "2. third though!\n" +
            "\n" +
            "5. fourth\n" +
            "6. fifth"
        );
        expect(dom.toString()).toEqual(
            "first\n" +
            "second!\n" +
            "third though!\n" +
            "fourth\n" +
            "fifth"
        );
        expect(dom.toMarkDown()).toEqual(
            "1. first\n" +
            "2. second!\n" +
            "3. third though!\n" +
            "4. fourth\n" +
            "5. fifth"
        );
    });
    it("should parse an unordered list correctly", () => {
        var dom = MDDOM.parse(
            "- first\n" +
            "- second\n" +
            "- third"
        );
        expect(dom.toString()).toEqual("first\nsecond\nthird");
    });
    it("should parse nested lists correctly", () => {
        var dom = MDDOM.parse(
            "1. item one\n" +
            "2. item two\n" +
            "	- sublist\n" +
            "	- sublist"
        );
        expect(dom.toMarkDown()).toEqual(
            "1. item one\n" +
            "2. item two\n" +
            "	- sublist\n" +
            "	- sublist"
        );
    });
    it("should output Html code correctly", () => {
        var dom = MDDOM.parse(
            "# Testheader 1\n" +
            "Bla**blabla**.\n" +
            "## Second test header\n" +
            "1. first\n" +
            "2. second"
        );
        expect(dom.toHtml()).toEqual(
            "<h1>Testheader 1</h1>\n" +
            "<p>Bla<strong>blabla</strong>.</p>\n" +
            "<h2>Second test header</h2>\n" +
            "<ol><li><p>first</p></li><li><p>second</p></li></ol>"
        );
    });
    it("should output the same source when calling toMarkDown() after parsing", () => {
        var dom = MDDOM.parse(source);
        expect(dom.toMarkDown()).toEqual(source);
    });
    it("should correctly convert markdown to formatless string", () => {
        var dom = MDDOM.parse(source);
        expect(dom.toString()).toEqual(
            "Testheader 1\n" +
            "Blablabla.\n" +
            "Second test header\n" +
            "\n" +
            "\n" +
            "first\n" +
            "second"
        );
    });
});