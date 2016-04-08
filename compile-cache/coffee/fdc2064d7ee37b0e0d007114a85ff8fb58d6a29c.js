(function() {
  var ArgumentParser, InlineParameterParser, fs, path;

  path = require('path');

  fs = require('fs');

  ArgumentParser = require('./argument-parser');

  module.exports = InlineParameterParser = (function() {
    function InlineParameterParser() {}

    InlineParameterParser.prototype.parse = function(target, callback) {
      var firstLine, indexOfNewLine, text;
      if (typeof target === 'object' && target.constructor.name === 'TextEditor') {
        this.targetFilename = target.getURI();
        text = target.getText();
        indexOfNewLine = text.indexOf("\n");
        firstLine = text.substr(0, indexOfNewLine > -1 ? indexOfNewLine : void 0);
        return this.parseFirstLineParameter(firstLine, callback);
      } else if (typeof target === 'string') {
        this.targetFilename = target;
        return this.readFirstLine(this.targetFilename, (function(_this) {
          return function(firstLine, error) {
            if (error) {
              return callback(void 0, error);
            } else {
              return _this.parseFirstLineParameter(firstLine, callback);
            }
          };
        })(this));
      } else {
        return callback(false, 'Invalid parser call');
      }
    };

    InlineParameterParser.prototype.readFirstLine = function(filename, callback) {
      var called, line, reader;
      if (!fs.existsSync(filename)) {
        callback(null, "File does not exist: " + filename);
        return;
      }
      line = '';
      called = false;
      return reader = fs.createReadStream(filename).on('data', (function(_this) {
        return function(data) {
          var indexOfNewLine;
          line += data.toString();
          indexOfNewLine = line.indexOf("\n");
          if (indexOfNewLine > -1) {
            line = line.substr(0, indexOfNewLine);
            called = true;
            reader.close();
            return callback(line);
          }
        };
      })(this)).on('end', (function(_this) {
        return function() {
          if (!called) {
            return callback(line);
          }
        };
      })(this)).on('error', (function(_this) {
        return function(error) {
          return callback(null, error);
        };
      })(this));
    };

    InlineParameterParser.prototype.parseFirstLineParameter = function(line, callback) {
      var params;
      params = this.parseParameters(line);
      if (typeof params === 'object') {
        if (typeof params.main === 'string') {
          if (this.targetFilename && !path.isAbsolute(params.main)) {
            params.main = path.resolve(path.dirname(this.targetFilename), params.main);
          }
          return callback(params);
        } else {
          return callback(params);
        }
      } else {
        return callback(false);
      }
    };

    InlineParameterParser.prototype.parseParameters = function(str) {
      var argumentParser, i, key, match, params, regex, value, _i;
      regex = /^\s*(?:(?:\/\*\s*(.*?)\s*\*\/)|(?:\/\/\s*(.*)))/m;
      if ((match = regex.exec(str)) !== null) {
        str = match[2] ? match[2] : match[1];
      } else {
        return false;
      }
      argumentParser = new ArgumentParser();
      regex = /(?:(\!?[\w-\.]+)(?:\s*:\s*(?:(\[.*\])|({.*})|(?:'(.*?)')|(?:"(.*?)")|([^,;]+)))?)*/g;
      params = [];
      while ((match = regex.exec(str)) !== null) {
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
        if (match[1] !== void 0) {
          key = match[1].trim();
          for (i = _i = 2; _i <= 6; i = ++_i) {
            if (match[i]) {
              value = match[i];
              break;
            }
          }
          if (key[0] === '!') {
            key = key.substr(1);
            if (value === void 0) {
              value = 'false';
            }
          }
          params[key] = argumentParser.parseValue(value);
        }
      }
      return params;
    };

    return InlineParameterParser;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvc2Fzcy1hdXRvY29tcGlsZS9saWIvaGVscGVyL2lubGluZS1wYXJhbWV0ZXJzLXBhcnNlci5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsK0NBQUE7O0FBQUEsRUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVIsQ0FBUCxDQUFBOztBQUFBLEVBQ0EsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSLENBREwsQ0FBQTs7QUFBQSxFQUdBLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG1CQUFSLENBSGpCLENBQUE7O0FBQUEsRUFNQSxNQUFNLENBQUMsT0FBUCxHQUNNO3VDQUVGOztBQUFBLG9DQUFBLEtBQUEsR0FBTyxTQUFDLE1BQUQsRUFBUyxRQUFULEdBQUE7QUFDSCxVQUFBLCtCQUFBO0FBQUEsTUFBQSxJQUFHLE1BQUEsQ0FBQSxNQUFBLEtBQWlCLFFBQWpCLElBQThCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBbkIsS0FBMkIsWUFBNUQ7QUFDSSxRQUFBLElBQUMsQ0FBQSxjQUFELEdBQWtCLE1BQU0sQ0FBQyxNQUFQLENBQUEsQ0FBbEIsQ0FBQTtBQUFBLFFBR0EsSUFBQSxHQUFPLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FIUCxDQUFBO0FBQUEsUUFJQSxjQUFBLEdBQWlCLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBYixDQUpqQixDQUFBO0FBQUEsUUFLQSxTQUFBLEdBQVksSUFBSSxDQUFDLE1BQUwsQ0FBWSxDQUFaLEVBQWtCLGNBQUEsR0FBaUIsQ0FBQSxDQUFwQixHQUE0QixjQUE1QixHQUFnRCxNQUEvRCxDQUxaLENBQUE7ZUFNQSxJQUFDLENBQUEsdUJBQUQsQ0FBeUIsU0FBekIsRUFBb0MsUUFBcEMsRUFQSjtPQUFBLE1BU0ssSUFBRyxNQUFBLENBQUEs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

//# sourceURL=/Users/nansthomas/.atom/packages/sass-autocompile/lib/helper/inline-parameters-parser.coffee
