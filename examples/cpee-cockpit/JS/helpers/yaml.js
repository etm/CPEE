// ---
// - yaml.js
// - Copyright:
//   - TJ Holowaychuk <tj@vision-media.ca>
//   - J. 'eTM' Mangler <juergen.mangler@gmail.com>
// - MIT Licensed

// Examples:
//   * YAML.eval("12");
//   * YAML.eval("a");
//   * YAML.eval("'a'");
//   * YAML.eval("['a','b','c']");
//   * YAML.eval("['a',:b,'c']");
//   * YAML.eval("{:a: 'b', 'b': :c, 'c': 'e'}");
//   * ... and nested stuff and document stuff

var YAML = {
  Parser: function(){
    var tokens = [
      ['comment', /^#[^\n]*/],
      ['indent', /^\n( *)/],
      ['space', /^ +/],
      ['true', /^(enabled|true|yes|on)/],
      ['false', /^(disabled|false|no|off)/],
      ['string', /^"(.*?)"/],
      ['string', /^'(.*?)'/],
      ['symbol', /^:([a-zA-Z][a-zA-Z0-9\_]*)/],
      ['doc', /^---/],
      ['float', /^(\d+\.\d+)(?=(\s|\r|\n|,|:))/],
      ['int', /^(\d+)(?=(\s|\r|\n|,|:))/],
      [',', /^,/],
      ['{', /^\{/],
      ['}', /^\}/],
      ['[', /^\[/],
      [']', /^\]/],
      ['-', /^\-/],
      [':', /^\:/],
      ['id', /^(([^,\n\r\}\]:]+(:(?!( |\n|\r)))?)+)/]
    ];
    var tstring = [];

    var context = function(str) {
      if (typeof str !== 'string') return ''
      str = str
        .slice(0, 25)
        .replace(/\n/g, '\\n')
        .replace(/"/g, '\\\"')
      return 'near "' + str + '"'
    }

    var tokenize = function (str) {
      var token, captures, ignore, input,
          indents = lastIndents = 0,
          stack = []
      while (str.length) {
        for (var i = 0, len = tokens.length; i < len; ++i)
          if (captures = tokens[i][1].exec(str)) {
            token = [tokens[i][0], captures],
            str = str.replace(tokens[i][1], '')
            switch (token[0]) {
              case 'comment':
                ignore = true
                break
              case 'indent':
                lastIndents = indents
                indents = token[1][1].length / 2
                if (indents === lastIndents)
                  ignore = true
                else if (indents > lastIndents + 1)
                  throw new SyntaxError('invalid indentation, got ' + indents + ' instead of ' + (lastIndents + 1))
                else if (indents < lastIndents) {
                  input = token[1].input
                  token = ['dedent']
                  token.input = input
                  while (--lastIndents > 0)
                    stack.push(token)
                }
            }
            break
          }
        if (!ignore)
          if (token)
            stack.push(token),
            token = null
          else 
            throw new SyntaxError(context(str))
        ignore = false
      }
      return stack
    }

    var peek = function() {
      return tstring[0]
    }
    var advance = function() {
      return tstring.shift()
    }
    var advanceValue = function() {
      return advance()[1][1]
    }
    var accept = function(type) {
      if (peekType(type))
        return advance()
    }
    var expect = function(type, msg) {
      if (accept(type)) return
      throw new Error(msg + ', ' + context(peek()[1].input))
    }
    var peekType = function(val) {
      return tstring[0] && tstring[0][0] === val
    }
    var ignoreSpace = function() {
      while (peekType('space'))
        advance()
    }
    var ignoreWhitespace = function() {
      while (peekType('space') ||
             peekType('indent') ||
             peekType('dedent'))
        advance()
    }
    var parse = function(plain) {
      if (typeof main == "undefined")
        main = false;
      switch (peek()[0]) {
        case 'doc':
          return parseDoc()
        case '-':
          return parseList()
        case '{':
          return parseInlineHash()
        case '[':
          return parseInlineList()
        case 'id':
          if (plain)
            return advanceValue()
          else
            return parseHash()
        case 'string':
          return advanceValue()
        case 'symbol':
          return advanceValue()
        case 'float':
          return parseFloat(advanceValue())
        case 'int':
          return parseInt(advanceValue())
        case 'true':
          return true
        case 'false':
          return false
      }
    }

    var parseDoc = function() {
      accept('doc')
      expect('indent', 'expected indent after document')
      var val = parse()
      expect('dedent', 'document not properly dedented')
      return val
    }
    var parseHash = function() {
      var id, hash = {}
      while (peekType('id') && (id = advanceValue())) {
        expect(':', 'expected semi-colon after id')
        ignoreSpace()
        if (accept('indent')) {
          hash[id] = parse(),
          expect('dedent', 'hash not properly dedented')
        } else {
          hash[id] = parse()
        }  
        ignoreSpace()
        console.log(tstring);
      }
      return hash
    }
    var parseInlineHash = function() {
      var hash = {}, id, i = 0
      accept('{')
      while (!accept('}')) {
        ignoreSpace()
        if (i) expect(',', 'expected comma')
        ignoreWhitespace()
        if ((peekType('id') || peekType('string') || peekType('symbol')) && (id = advanceValue())) {
          expect(':', 'expected semi-colon after id')
          ignoreSpace()
          hash[id] = parse(true)
          ignoreWhitespace()
        }
        ++i
      }
      return hash
    }
    var parseList = function() {
      var list = []
      while (accept('-')) {
        console.log(tstring);
        ignoreSpace()
        if (accept('indent')) {
          list.push(parse()),
          expect('dedent', 'list item not properly dedented')
        } else {
          list.push(parse())
        }  
        ignoreSpace()
      }
      return list
    }
    var parseInlineList = function() {
      var list = [], i = 0
      accept('[')
      while (!accept(']')) {
        ignoreSpace()
        if (i) expect(',', 'expected comma')
        ignoreSpace()
        list.push(parse(true))
        ignoreSpace()
        ++i
      }
      return list
    }

    this.load = function(str) {
      tstring = tokenize(str + '\n');
      return parse(true);
    }
  },
  eval: function(str) {
    y = new this.Parser();
    return y.load(str);
  }
};
