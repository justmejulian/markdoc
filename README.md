# Markdoc

*A beautiful, extended Markdown editor built for academic papers.*

#### Context

Markdown has its unique advantages: Its intuitive syntax is simple to learn yet powerful enough for a wide range of use cases. While it is supported by many applications, text remains readable even if opened as plaintext and can be converted easily into many other formats (such as HTML or LaTeX). However, it has its limitations when it comes to writing printable papers that require more advanced layout functionality. This is where Markdoc comes to play...

#### Objectives

While there are many Markdown editors available for a variety of platforms, none of them is suitable for producing printable, multi-page output. Traditional Markdown does not support basic functionality needed for academic purposes such as table of content, page numbering, footer and header. Markdoc tries to change that by extending the Markdown language with the most important missing functionality, filling the gap between Markdown only editors and future overloaded LaTeX editors, allowing the writer to concentrate what matters most: the content.

#### Constraints

Markdoc does not try to replace fully fledged LaTeX editors by implementing all (or even most) features, but instead focuses on only extending Markdown with the most commonly missed features needed to write and print multi-page documents.

#### Architecture

Markdoc is built with JavaScript, ReactJS, NodeJS and Electron. It is compatible with Windows, macOS and Linux.



## How get started

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) installed.

From your command line:

```bash
# Clone this repository
$ git clone https://github.engineering.zhaw.ch/vissejul/markdoc.git

# Go into the repository
$ cd markdoc

# Check node version(v8.10. or later)
$ node -v

# Install dependencies
$ npm install

# Run
$ npm start
```
