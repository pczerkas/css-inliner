'use strict';
const assert     = require('assert');
const CSSInliner = require('../');
const File       = require('fs');


describe('Critical CSS', function() {

  let actual;

  before(function() {
    const inliner = new CSSInliner({
      directory: __dirname
    });
    const source  = File.readFileSync(`${__dirname}/critical.html`, 'utf-8');
    return inliner
      .criticalPathAsync(source)
      .then(function(result) {
        actual = result;
      });
  });

  it('should produced critical path document', function() {
    const expected = File.readFileSync(`${__dirname}/critical.expected.html`, 'utf-8');
    assert.equal(actual, expected);
  });


  it('should add CSS styles at top of document', function() {
    const regexp = /<head><style>(.|\n)*<\/style>(.|\n)*<\/head>/;
    assert( regexp.test(actual) );
  });

  it('should include media query in critical CSS', function() {
    const regexp = /<head><style>(.|\n)*@media screen{body{/;
    assert( regexp.test(actual) );
  });

  it('should include pseudo element selectors in critical CSS', function() {
    const regexp = /<head><style>(.|\n)*h1:hover{text-decoration/;
    assert( regexp.test(actual) );
  });

  it('should include regular selectors in critical CSS', function() {
    const regexp = /<head><style>(.|\n)*h1{font-weight/;
    assert( regexp.test(actual) );
  });

  it('should remove other style elements', function() {
    const regexp = /<style>(.|\n)*?<\/style>/g;
    let   count = 0;
    actual.replace(regexp, function(match) {
      ++count;
      assert(count === 1, match);
    });
  });

  it('should keep external link reference', function() {
    const regexp = /<link rel="stylesheet" href="(.*)">/g;
    actual.replace(regexp, function(match, url) {
      assert.equal(url, 'http://example.com/style.css');
    });
  });

  it('should leave body intact', function() {
    const regexp = /<body>\s+<h1>Hello World!<\/h1>\s+<\/body>/;
    assert( regexp.test(actual) );
  });

});

