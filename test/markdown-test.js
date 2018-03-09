'use strict';
const MD = require("../src/js/markdown");
const {MDDOM, MDHeader} = MD;
// import {MDDOM} from '../src/js/markdown.js';

describe("Markdown parser", () => {
    it("should parse classic Markdown correctly",() => {
        var dom = MDDOM.parse("# Header");
        expect(dom.children.length).toBe(1);
        
    });
});