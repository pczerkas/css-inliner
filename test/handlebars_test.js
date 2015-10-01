'use strict';
const assert        = require('assert');
const CSSInliner    = require('../');


describe('Handlebar templates', function() {

  function replaceTags(template) {

    function substitute(string, tag, index) {
      const marker = `$${index + 1}`;
      return string.split(tag).join(marker);
    }

    const tags          = CSSInliner.handlebars(template);
    const tagsReplaced  = tags.reduce(substitute, template);
    return tagsReplaced;
  }

  it('should not escape expressions', function() {
    const template  = '<h1>{{message}}</h1><input value="{{time}}">';
    const expected  = '<h1>$1</h1><input value="$2">';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape expressions (complex case)', function() {
    const template  = '{{#each articles.[10].[#comments]}}{{/each}}';
    const expected  = '$1';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape un-encoded expressions', function() {
    const template  = '<h1>{{{raw}}}</h1>';
    const expected  = '<h1>$1</h1>';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape helpers (with quoted args)', function() {
    const template  = '{{{link "See more..." href=story.url class="story"}}}';
    const expected  = '$1';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape sub-expressions (with quoted args)', function() {
    const template  = '{{outer-helper (inner-helper "abc") "def"}}';
    const expected  = '$1';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should escape raw blocks (special tag)', function() {
    const template  = '{{{{raw}}}}{{escaped}}{{{{/raw}}}}';
    const expected  = '$1{{escaped}}$2';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should escape raw blocks (escape)', function() {
    const template  = '\\{{escaped "foo"}}';
    const expected  = '\\{{escaped "foo"}}';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape blocks around elements (no inverse)', function() {
    const template  = '{{#if user}}<h1>Welcome back</h1>{{/if}}';
    const expected  = '$1<h1>Welcome back</h1>$2';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape blocks around elements (empty inverse)', function() {
    const template  = '{{#if user}}<h1>Welcome back</h1>{{else}}{{/if}}';
    const expected  = '$1<h1>Welcome back</h1>$2';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape blocks around elements (inverse only)', function() {
    const template  = '{{#if user}}{{else}}Login{{/if}}';
    const expected  = '$1Login$2';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape blocks around elements (with inverse)', function() {
    const template  = '{{#if user}}<h1>Welcome back</h1>{{else}}Login{{/if}}';
    const expected  = '$1<h1>Welcome back</h1>$2Login$3';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape blocks around elements (empty everything)', function() {
    const template  = '{{#if user}}{{else}}{{/if}}';
    const expected  = '$1';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape blocks in attribute values', function() {
    const template  = '<input value="{{#if user}}{{user}}{{else}}Login{{/if}}">';
    const expected  = '<input value="$1$2$3Login$4">';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape blocks in attribute values (with quoted args)', function() {
    const template  = '<input value="{{#if user}}{{format user "f.L"}}{{else}}Login{{/if}}">';
    const expected  = '<input value="$1$2$3Login$4">';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape blocks with parameters', function() {
    const template  = '{{#each users as |user userId|}}\nId: {{userId}} Name: {{user.name}}\n{{/each}}';
    const expected  = '$1\nId: $2 Name: $3\n$4';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape comments', function() {
    const template  = '{{! This comment will not be in the output }}\n<!-- This comment will be in the output -->';
    const expected  = '$1\n<!-- This comment will be in the output -->';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not escape partials (with quoted args)', function() {
    const template  = '{{> userMessage tagName="h1" }}';
    const expected  = '$1';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should not fail on multiple line tags', function() {
    const template  = '{{userMessage\ntag="h1"\nname="assaf"}}';
    const expected  = '$1';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should deal with quoted braces', function() {
    const template  = '{{userMessage single=\'}}\' double="}}" }}';
    const expected  = '$1';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should deal with duplicate tags', function() {
    const tag       = '{{userMessage tag="h1"}}';
    const template  = `${tag}${tag}`;
    const expected  = '$1$1';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });

  it('should deal with arbitrary nesting', function() {
    const template  = '{{#foo}}a{{#bar}}b{{else}}c{{/bar}}d{{/foo}}e';
    const expected  = '$1a$2b$3c$4d$5e';
    const actual    = replaceTags(template);
    assert.equal(actual, expected);
  });


  describe('inline CSS', function() {

    const inliner = new CSSInliner({ template: CSSInliner.handlebars });

    it('should retain template tags', function() {
      const template  = '<style>.foo{color:red}</style><div class="foo">{{userMessage tagName="h1"}}</div>';
      const expected  = '<div class="foo" style="color:red">{{userMessage tagName="h1"}}</div>';
      return inliner
        .inlineCSSAsync(template)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });

    it('should deal with tags in style element', function() {
      const template  = '<style>.foo{color:red}</style><div class="foo" style="{{style "foo"}}"></div>';
      const expected  = '<div class="foo" style="{{style "foo"}};color:red"></div>';
      return inliner
        .inlineCSSAsync(template)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });

    it('should deal with nested template tags', function() {
      const template  = '{{foo}}<!--skip-->{{bar tag="{{foo}}"}}';
      const expected  = '{{foo}}{{bar tag="{{foo}}"}}';
      return inliner
        .inlineCSSAsync(template)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });

  });


  describe('critical path', function() {

    const inliner = new CSSInliner({ template: CSSInliner.handlebars });

    it('should retain template tags', function() {
      const template  = '<style>.foo{color:red}</style><div class="foo">{{userMessage tagName="h1"}}</div>';
      const expected  = template;
      return inliner
        .criticalPathAsync(template)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });
  });


  describe('without tag extraction', function() {

    const inliner = new CSSInliner();

    it('should treat them as HTML content', function() {
      const template  = '<div class="foo">{{userMessage tagName="h1"}}</div>';
      const expected  = '<div class="foo">{{userMessage tagName=&quot;h1&quot;}}</div>';
      return inliner
        .inlineCSSAsync(template)
        .then(function(actual) {
          assert.equal(actual, expected);
        });
    });

  });

});

