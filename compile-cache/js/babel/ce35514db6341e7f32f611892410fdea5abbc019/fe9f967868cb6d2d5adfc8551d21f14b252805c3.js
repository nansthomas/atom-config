Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jscsLibCliConfig = require('jscs/lib/cli-config');

var _jscsLibCliConfig2 = _interopRequireDefault(_jscsLibCliConfig);

var _jscsLibExtractJs = require('jscs/lib/extract-js');

var _jscsLibExtractJs2 = _interopRequireDefault(_jscsLibExtractJs);

var _globule = require('globule');

var _globule2 = _interopRequireDefault(_globule);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _atom = require('atom');

'use babel';

var grammarScopes = ['source.js', 'source.js.jsx', 'text.html.basic'];

var LinterJSCS = (function () {
  function LinterJSCS() {
    _classCallCheck(this, LinterJSCS);
  }

  _createClass(LinterJSCS, null, [{
    key: 'activate',
    value: function activate() {
      var _this = this;

      // Install dependencies using atom-package-deps
      require('atom-package-deps').install('linter-jscs');

      this.subscriptions = new _atom.CompositeDisposable();

      this.subscriptions.add(atom.config.observe('linter-jscs.preset', function (preset) {
        _this.preset = preset;
      }));

      this.subscriptions.add(atom.config.observe('linter-jscs.esnext', function (esnext) {
        _this.esnext = esnext;
      }));

      this.subscriptions.add(atom.config.observe('linter-jscs.onlyConfig', function (onlyConfig) {
        _this.onlyConfig = onlyConfig;
      }));

      this.subscriptions.add(atom.config.observe('linter-jscs.fixOnSave', function (fixOnSave) {
        _this.fixOnSave = fixOnSave;
      }));

      this.subscriptions.add(atom.config.observe('linter-jscs.displayAs', function (displayAs) {
        _this.displayAs = displayAs;
      }));

      this.subscriptions.add(atom.config.observe('linter-jscs.configPath', function (configPath) {
        _this.configPath = configPath;
      }));

      this.subscriptions.add(atom.workspace.observeTextEditors(function (editor) {
        editor.getBuffer().onWillSave(function () {
          if (grammarScopes.indexOf(editor.getGrammar().scopeName) !== -1 || _this.testFixOnSave) {
            // Exclude `excludeFiles` for fix on save
            var config = _this.getConfig(editor.getPath());
            var exclude = _globule2['default'].isMatch(config && config.excludeFiles, _this.getFilePath(editor.getPath()));

            if (_this.fixOnSave && !exclude || _this.testFixOnSave) {
              _this.fixString(editor);
            }
          }
        });
      }));

      this.subscriptions.add(atom.commands.add('atom-text-editor', {
        'linter-jscs:fix-file': function linterJscsFixFile() {
          var textEditor = atom.workspace.getActiveTextEditor();

          if (!textEditor) {
            atom.notifications.addError('Linter-jscs: invalid textEditor received, aborting.');
            return;
          }

          _this.fixString(textEditor);
        }
      }));
    }
  }, {
    key: 'deactivate',
    value: function deactivate() {
      this.subscriptions.dispose();
    }
  }, {
    key: 'provideLinter',
    value: function provideLinter() {
      var _this2 = this;

      var helpers = require('atom-linter');
      return {
        name: 'JSCS',
        grammarScopes: grammarScopes,
        scope: 'file',
        lintOnFly: true,
        lint: function lint(editor, opts, overrideOptions, testFixOnSave) {
          var JSCS = require('jscs');

          _this2.testFixOnSave = testFixOnSave;

          var filePath = editor.getPath();

          // We need re-initialize JSCS before every lint
          // or it will looses the errors, didn't trace the error
          // must be something with new 2.0.0 JSCS
          _this2.jscs = new JSCS();
          _this2.jscs.registerDefaultRules();
          var config = _this2.getConfig(filePath);

          // We don't have a config file present in project directory
          // let's return an empty array of errors
          if (!config) return Promise.resolve([]);

          var jscsConfig = overrideOptions || config;
          _this2.jscs.configure(jscsConfig);

          var text = editor.getText();
          var scope = editor.getGrammar().scopeName;

          var errors = undefined;
          // text.plain.null-grammar is temp for tests
          if (scope === 'text.html.basic' || scope === 'text.plain.null-grammar') {
            (function () {
              var result = (0, _jscsLibExtractJs2['default'])(filePath, text);

              result.sources.forEach(function (script) {
                _this2.jscs.checkString(script.source, filePath).getErrorList().forEach(function (error) {
                  var err = error;
                  err.line += script.line;
                  err.column += script.offset;
                  result.addError(err);
                });
              }, _this2);

              errors = result.errors.getErrorList();
            })();
          } else {
            errors = _this2.jscs.checkString(text, filePath).getErrorList();
          }

          // Exclude `excludeFiles` for errors
          var exclude = _globule2['default'].isMatch(config && config.excludeFiles, _this2.getFilePath(editor.getPath()));
          if (exclude) {
            return Promise.resolve([]);
          }

          return Promise.resolve(errors.map(function (_ref) {
            var rule = _ref.rule;
            var message = _ref.message;
            var line = _ref.line;
            var column = _ref.column;

            var type = _this2.displayAs;
            var html = '<span class=\'badge badge-flexible\'>' + rule + '</span> ' + message;

            /* Work around a bug in esprima causing jscs to report columns past
             * the end of the line. This is fixed in esprima@2.7.2, but as jscs
             * only depends on "~2.7.0" we need to wait on a jscs release depending
             * on a later version till this can be removed.
             * Ref: https://github.com/jquery/esprima/issues/1457
             * TODO: Remove when jscs updates
             */
            var col = column;
            var maxCol = editor.getBuffer().lineLengthForRow(line - 1);
            if (col - 1 > maxCol) {
              col = maxCol + 1;
            }

            var range = helpers.rangeFromLineNumber(editor, line - 1, col - 1);

            return { type: type, html: html, filePath: filePath, range: range };
          }));
        }
      };
    }
  }, {
    key: 'getFilePath',
    value: function getFilePath(file) {
      var relative = atom.project.relativizePath(file);
      return relative[1];
    }
  }, {
    key: 'getConfig',
    value: function getConfig(filePath) {
      var config = undefined;
      if (_path2['default'].isAbsolute(this.configPath)) {
        config = _jscsLibCliConfig2['default'].load(false, this.configPath);
      } else {
        config = _jscsLibCliConfig2['default'].load(false, _path2['default'].join(_path2['default'].dirname(filePath), this.configPath));
      }

      if (!config && this.onlyConfig) {
        return undefined;
      }

      // Options passed to `jscs` from package configuration
      var options = { esnext: this.esnext };
      var newConfig = (0, _objectAssign2['default'])(options, config || { preset: this.preset });
      // `configPath` is non-enumerable so `Object.assign` won't copy it.
      // Without a proper `configPath` JSCS plugs cannot be loaded. See #175.
      if (!newConfig.configPath && config && config.configPath) {
        newConfig.configPath = config.configPath;
      }
      return newConfig;
    }
  }, {
    key: 'fixString',
    value: function fixString(editor) {
      var editorPath = editor.getPath();
      var editorText = editor.getText();

      var config = this.getConfig(editorPath);
      if (!config) {
        return;
      }

      var JSCS = require('jscs');

      // We need re-initialize JSCS before every lint
      // or it will looses the errors, didn't trace the error
      // must be something with new 2.0.0 JSCS
      this.jscs = new JSCS();
      this.jscs.registerDefaultRules();
      this.jscs.configure(config);

      var fixedText = this.jscs.fixString(editorText, editorPath).output;
      if (editorText === fixedText) {
        return;
      }

      var cursorPosition = editor.getCursorScreenPosition();
      editor.setText(fixedText);
      editor.setCursorScreenPosition(cursorPosition);
    }
  }, {
    key: 'config',
    value: {
      preset: {
        title: 'Preset',
        description: 'Preset option is ignored if a config file is found for the linter.',
        type: 'string',
        'default': 'airbnb',
        'enum': ['airbnb', 'crockford', 'google', 'grunt', 'idiomatic', 'jquery', 'mdcs', 'node-style-guide', 'wikimedia', 'wordpress', 'yandex']
      },
      esnext: {
        description: 'Attempts to parse your code as ES6+, JSX, and Flow using ' + 'the babel-jscs package as the parser.',
        type: 'boolean',
        'default': false
      },
      onlyConfig: {
        title: 'Only Config',
        description: 'Disable linter if there is no config file found for the linter.',
        type: 'boolean',
        'default': false
      },
      fixOnSave: {
        title: 'Fix on save',
        description: 'Fix JavaScript on save',
        type: 'boolean',
        'default': false
      },
      displayAs: {
        title: 'Display errors as',
        type: 'string',
        'default': 'error',
        'enum': ['error', 'warning']
      },
      configPath: {
        title: 'Config file path (Absolute or relative path to your project)',
        type: 'string',
        'default': ''
      }
    },
    enumerable: true
  }]);

  return LinterJSCS;
})();

exports['default'] = LinterJSCS;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9uYW5zdGhvbWFzLy5hdG9tL3BhY2thZ2VzL2xpbnRlci1qc2NzL3NyYy9saW50ZXItanNjcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O29CQUVpQixNQUFNOzs7O2dDQUNBLHFCQUFxQjs7OztnQ0FDdEIscUJBQXFCOzs7O3VCQUN2QixTQUFTOzs7OzRCQUNKLGVBQWU7Ozs7b0JBQ0osTUFBTTs7QUFQMUMsV0FBVyxDQUFDOztBQVNaLElBQU0sYUFBYSxHQUFHLENBQUMsV0FBVyxFQUFFLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDOztJQUVuRCxVQUFVO1dBQVYsVUFBVTswQkFBVixVQUFVOzs7ZUFBVixVQUFVOztXQTJDZCxvQkFBRzs7OztBQUVoQixhQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7O0FBRXBELFVBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXVCLENBQUM7O0FBRTdDLFVBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLG9CQUFvQixFQUFFLFVBQUMsTUFBTSxFQUFLO0FBQzNFLGNBQUssTUFBTSxHQUFHLE1BQU0sQ0FBQztPQUN0QixDQUFDLENBQUMsQ0FBQzs7QUFFSixVQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsRUFBRSxVQUFDLE1BQU0sRUFBSztBQUMzRSxjQUFLLE1BQU0sR0FBRyxNQUFNLENBQUM7T0FDdEIsQ0FBQyxDQUFDLENBQUM7O0FBRUosVUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsd0JBQXdCLEVBQUUsVUFBQyxVQUFVLEVBQUs7QUFDbkYsY0FBSyxVQUFVLEdBQUcsVUFBVSxDQUFDO09BQzlCLENBQUMsQ0FBQyxDQUFDOztBQUVKLFVBQUksQ0FB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RSxRQUFRLENBQ3ZEO09BQ0Y7QUFDRCxZQUFNLEVBQUU7QUFDTixtQkFBVyxFQUFFLDJEQUEyRCxHQUN0RSx1Q0FBdUM7QUFDekMsWUFBSSxFQUFFLFNBQVM7QUFDZixtQkFBUyxLQUFLO09BQ2Y7QUFDRCxnQkFBVSxFQUFFO0FBQ1YsYUFBSyxFQUFFLGFBQWE7QUFDcEIsbUJBQVcsRUFBRSxpRUFBaUU7QUFDOUUsWUFBSSxFQUFFLFNBQVM7QUFDZixtQkFBUyxLQUFLO09BQ2Y7QUFDRCxlQUFTLEVBQUU7QUFDVCxhQUFLLEVBQUUsYUFBYTtBQUNwQixtQkFBVyxFQUFFLHdCQUF3QjtBQUNyQyxZQUFJLEVBQUUsU0FBUztBQUNmLG1CQUFTLEtBQUs7T0FDZjtBQUNELGVBQVMsRUFBRTtBQUNULGFBQUssRUFBRSxtQkFBbUI7QUFDMUIsWUFBSSxFQUFFLFFBQVE7QUFDZCxtQkFBUyxPQUFPO0FBQ2hCLGdCQUFNLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQztPQUMzQjtBQUNELGdCQUFVLEVBQUU7QUFDVixhQUFLLEVBQUUsOERBQThEO0FBQ3JFLFlBQUksRUFBRSxRQUFRO0FBQ2QsbUJBQVMsRUFBRTtPQUNaO0tBQ0Y7Ozs7U0F6Q2tCLFVBQVU7OztxQkFBVixVQUFVIiwiZmlsZSI6Ii9Vc2Vycy9uYW5zdGhvbWFzLy5hdG9tL3BhY2thZ2VzL2xpbnRlci1qc2NzL3NyYy9saW50ZXItanNjcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBjb25maWdGaWxlIGZyb20gJ2pzY3MvbGliL2NsaS1jb25maWcnO1xuaW1wb3J0IGV4dHJhY3RKcyBmcm9tICdqc2NzL2xpYi9leHRyYWN0LWpzJztcbmltcG9ydCBnbG9idWxlIGZyb20gJ2dsb2J1bGUnO1xuaW1wb3J0IG9iamVjdEFzc2lnbiBmcm9tICdvYmplY3QtYXNzaWduJztcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJztcblxuY29uc3QgZ3JhbW1hclNjb3BlcyA9IFsnc291cmNlLmpzJywgJ3NvdXJjZS5qcy5qc3gnLCAndGV4dC5odG1sLmJhc2ljJ107XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbnRlckpTQ1Mge1xuICBzdGF0aWMgY29uZmlnID0ge1xuICAgIHByZXNldDoge1xuICAgICAgdGl0bGU6ICdQcmVzZXQnLFxuICAgICAgZGVzY3JpcHRpb246ICdQcmVzZXQgb3B0aW9uIGlzIGlnbm9yZWQgaWYgYSBjb25maWcgZmlsZSBpcyBmb3VuZCBmb3IgdGhlIGxpbnRlci4nLFxuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZWZhdWx0OiAnYWlyYm5iJyxcbiAgICAgIGVudW06IFtcbiAgICAgICAgJ2FpcmJuYicsICdjcm9ja2ZvcmQnLCAnZ29vZ2xlJywgJ2dydW50JywgJ2lkaW9tYXRpYycsICdqcXVlcnknLCAnbWRjcycsXG4gICAgICAgICdub2RlLXN0eWxlLWd1aWRlJywgJ3dpa2ltZWRpYScsICd3b3JkcHJlc3MnLCAneWFuZGV4JyxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBlc25leHQ6IHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnQXR0ZW1wdHMgdG8gcGFyc2UgeW91ciBjb2RlIGFzIEVTNissIEpTWCwgYW5kIEZsb3cgdXNpbmcgJyArXG4gICAgICAgICd0aGUgYmFiZWwtanNjcyBwYWNrYWdlIGFzIHRoZSBwYXJzZXIuJyxcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgb25seUNvbmZpZzoge1xuICAgICAgdGl0bGU6ICdPbmx5IENvbmZpZycsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Rpc2FibGUgbGludGVyIGlmIHRoZXJlIGlzIG5vIGNvbmZpZyBmaWxlIGZvdW5kIGZvciB0aGUgbGludGVyLicsXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIGZpeE9uU2F2ZToge1xuICAgICAgdGl0bGU6ICdGaXggb24gc2F2ZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0ZpeCBKYXZhU2NyaXB0IG9uIHNhdmUnLFxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgICBkaXNwbGF5QXM6IHtcbiAgICAgIHRpdGxlOiAnRGlzcGxheSBlcnJvcnMgYXMnLFxuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZWZhdWx0OiAnZXJyb3InLFxuICAgICAgZW51bTogWydlcnJvcicsICd3YXJuaW5nJ10sXG4gICAgfSxcbiAgICBjb25maWdQYXRoOiB7XG4gICAgICB0aXRsZTogJ0NvbmZpZyBmaWxlIHBhdGggKEFic29sdXRlIG9yIHJlbGF0aXZlIHBhdGggdG8geW91ciBwcm9qZWN0KScsXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIGRlZmF1bHQ6ICcnLFxuICAgIH0sXG4gIH07XG5cbiAgc3RhdGljIGFjdGl2YXRlKCkge1xuICAgIC8vIEluc3RhbGwgZGVwZW5kZW5jaWVzIHVzaW5nIGF0b20tcGFja2FnZS1kZXBzXG4gICAgcmVxdWlyZSgnYXRvbS1wYWNrYWdlLWRlcHMnKS5pbnN0YWxsKCdsaW50ZXItanNjcycpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci1qc2NzLnByZXNldCcsIChwcmVzZXQpID0+IHtcbiAgICAgIHRoaXMucHJlc2V0ID0gcHJlc2V0O1xuICAgIH0pKTtcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLWpzY3MuZXNuZXh0JywgKGVzbmV4dCkgPT4ge1xuICAgICAgdGhpcy5lc25leHQgPSBlc25leHQ7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItanNjcy5vbmx5Q29uZmlnJywgKG9ubHlDb25maWcpID0+IHtcbiAgICAgIHRoaXMub25seUNvbmZpZyA9IG9ubHlDb25maWc7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItanNjcy5maXhPblNhdmUnLCAoZml4T25TYXZlKSA9PiB7XG4gICAgICB0aGlzLmZpeE9uU2F2ZSA9IGZpeE9uU2F2ZTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci1qc2NzLmRpc3BsYXlBcycsIChkaXNwbGF5QXMpID0+IHtcbiAgICAgIHRoaXMuZGlzcGxheUFzID0gZGlzcGxheUFzO1xuICAgIH0pKTtcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLWpzY3MuY29uZmlnUGF0aCcsIChjb25maWdQYXRoKSA9PiB7XG4gICAgICB0aGlzLmNvbmZpZ1BhdGggPSBjb25maWdQYXRoO1xuICAgIH0pKTtcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3IpID0+IHtcbiAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5vbldpbGxTYXZlKCgpID0+IHtcbiAgICAgICAgaWYgKGdyYW1tYXJTY29wZXMuaW5kZXhPZihlZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZSkgIT09IC0xIHx8IHRoaXMudGVzdEZpeE9uU2F2ZSkge1xuICAgICAgICAgIC8vIEV4Y2x1ZGUgYGV4Y2x1ZGVGaWxlc2AgZm9yIGZpeCBvbiBzYXZlXG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRDb25maWcoZWRpdG9yLmdldFBhdGgoKSk7XG4gICAgICAgICAgY29uc3QgZXhjbHVkZSA9IGdsb2J1bGUuaXNNYXRjaChcbiAgICAgICAgICAgIGNvbmZpZyAmJiBjb25maWcuZXhjbHVkZUZpbGVzLCB0aGlzLmdldEZpbGVQYXRoKGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGlmICgodGhpcy5maXhPblNhdmUgJiYgIWV4Y2x1ZGUpIHx8IHRoaXMudGVzdEZpeE9uU2F2ZSkge1xuICAgICAgICAgICAgdGhpcy5maXhTdHJpbmcoZWRpdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pKTtcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCB7XG4gICAgICAnbGludGVyLWpzY3M6Zml4LWZpbGUnOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG5cbiAgICAgICAgaWYgKCF0ZXh0RWRpdG9yKSB7XG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdMaW50ZXItanNjczogaW52YWxpZCB0ZXh0RWRpdG9yIHJlY2VpdmVkLCBhYm9ydGluZy4nKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZpeFN0cmluZyh0ZXh0RWRpdG9yKTtcbiAgICAgIH0sXG4gICAgfSkpO1xuICB9XG5cbiAgc3RhdGljIGRlYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIHN0YXRpYyBwcm92aWRlTGludGVyKCkge1xuICAgIGNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCdhdG9tLWxpbnRlcicpO1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiAnSlNDUycsXG4gICAgICBncmFtbWFyU2NvcGVzLFxuICAgICAgc2NvcGU6ICdmaWxlJyxcbiAgICAgIGxpbnRPbkZseTogdHJ1ZSxcbiAgICAgIGxpbnQ6IChlZGl0b3IsIG9wdHMsIG92ZXJyaWRlT3B0aW9ucywgdGVzdEZpeE9uU2F2ZSkgPT4ge1xuICAgICAgICBjb25zdCBKU0NTID0gcmVxdWlyZSgnanNjcycpO1xuXG4gICAgICAgIHRoaXMudGVzdEZpeE9uU2F2ZSA9IHRlc3RGaXhPblNhdmU7XG5cbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpO1xuXG4gICAgICAgIC8vIFdlIG5lZWQgcmUtaW5pdGlhbGl6ZSBKU0NTIGJlZm9yZSBldmVyeSBsaW50XG4gICAgICAgIC8vIG9yIGl0IHdpbGwgbG9vc2VzIHRoZSBlcnJvcnMsIGRpZG4ndCB0cmFjZSB0aGUgZXJyb3JcbiAgICAgICAgLy8gbXVzdCBiZSBzb21ldGhpbmcgd2l0aCBuZXcgMi4wLjAgSlNDU1xuICAgICAgICB0aGlzLmpzY3MgPSBuZXcgSlNDUygpO1xuICAgICAgICB0aGlzLmpzY3MucmVnaXN0ZXJEZWZhdWx0UnVsZXMoKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRDb25maWcoZmlsZVBhdGgpO1xuXG4gICAgICAgIC8vIFdlIGRvbid0IGhhdmUgYSBjb25maWcgZmlsZSBwcmVzZW50IGluIHByb2plY3QgZGlyZWN0b3J5XG4gICAgICAgIC8vIGxldCdzIHJldHVybiBhbiBlbXB0eSBhcnJheSBvZiBlcnJvcnNcbiAgICAgICAgaWYgKCFjb25maWcpIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuXG4gICAgICAgIGNvbnN0IGpzY3NDb25maWcgPSBvdmVycmlkZU9wdGlvbnMgfHwgY29uZmlnO1xuICAgICAgICB0aGlzLmpzY3MuY29uZmlndXJlKGpzY3NDb25maWcpO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBlZGl0b3IuZ2V0VGV4dCgpO1xuICAgICAgICBjb25zdCBzY29wZSA9IGVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lO1xuXG4gICAgICAgIGxldCBlcnJvcnM7XG4gICAgICAgIC8vIHRleHQucGxhaW4ubnVsbC1ncmFtbWFyIGlzIHRlbXAgZm9yIHRlc3RzXG4gICAgICAgIGlmIChzY29wZSA9PT0gJ3RleHQuaHRtbC5iYXNpYycgfHwgc2NvcGUgPT09ICd0ZXh0LnBsYWluLm51bGwtZ3JhbW1hcicpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBleHRyYWN0SnMoZmlsZVBhdGgsIHRleHQpO1xuXG4gICAgICAgICAgcmVzdWx0LnNvdXJjZXMuZm9yRWFjaCgoc2NyaXB0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmpzY3MuY2hlY2tTdHJpbmcoc2NyaXB0LnNvdXJjZSwgZmlsZVBhdGgpLmdldEVycm9yTGlzdCgpLmZvckVhY2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGVyciA9IGVycm9yO1xuICAgICAgICAgICAgICBlcnIubGluZSArPSBzY3JpcHQubGluZTtcbiAgICAgICAgICAgICAgZXJyLmNvbHVtbiArPSBzY3JpcHQub2Zmc2V0O1xuICAgICAgICAgICAgICByZXN1bHQuYWRkRXJyb3IoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgICAgZXJyb3JzID0gcmVzdWx0LmVycm9ycy5nZXRFcnJvckxpc3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlcnJvcnMgPSB0aGlzLmpzY3NcbiAgICAgICAgICAgIC5jaGVja1N0cmluZyh0ZXh0LCBmaWxlUGF0aClcbiAgICAgICAgICAgIC5nZXRFcnJvckxpc3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEV4Y2x1ZGUgYGV4Y2x1ZGVGaWxlc2AgZm9yIGVycm9yc1xuICAgICAgICBjb25zdCBleGNsdWRlID0gZ2xvYnVsZS5pc01hdGNoKFxuICAgICAgICAgIGNvbmZpZyAmJiBjb25maWcuZXhjbHVkZUZpbGVzLCB0aGlzLmdldEZpbGVQYXRoKGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChleGNsdWRlKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVycm9ycy5tYXAoKHsgcnVsZSwgbWVzc2FnZSwgbGluZSwgY29sdW1uIH0pID0+IHtcbiAgICAgICAgICBjb25zdCB0eXBlID0gdGhpcy5kaXNwbGF5QXM7XG4gICAgICAgICAgY29uc3QgaHRtbCA9IGA8c3BhbiBjbGFzcz0nYmFkZ2UgYmFkZ2UtZmxleGlibGUnPiR7cnVsZX08L3NwYW4+ICR7bWVzc2FnZX1gO1xuXG4gICAgICAgICAgLyogV29yayBhcm91bmQgYSBidWcgaW4gZXNwcmltYSBjYXVzaW5nIGpzY3MgdG8gcmVwb3J0IGNvbHVtbnMgcGFzdFxuICAgICAgICAgICAqIHRoZSBlbmQgb2YgdGhlIGxpbmUuIFRoaXMgaXMgZml4ZWQgaW4gZXNwcmltYUAyLjcuMiwgYnV0IGFzIGpzY3NcbiAgICAgICAgICAgKiBvbmx5IGRlcGVuZHMgb24gXCJ+Mi43LjBcIiB3ZSBuZWVkIHRvIHdhaXQgb24gYSBqc2NzIHJlbGVhc2UgZGVwZW5kaW5nXG4gICAgICAgICAgICogb24gYSBsYXRlciB2ZXJzaW9uIHRpbGwgdGhpcyBjYW4gYmUgcmVtb3ZlZC5cbiAgICAgICAgICAgKiBSZWY6IGh0dHBzOi8vZ2l0aHViLmNvbS9qcXVlcnkvZXNwcmltYS9pc3N1ZXMvMTQ1N1xuICAgICAgICAgICAqIFRPRE86IFJlbW92ZSB3aGVuIGpzY3MgdXBkYXRlc1xuICAgICAgICAgICAqL1xuICAgICAgICAgIGxldCBjb2wgPSBjb2x1bW47XG4gICAgICAgICAgY29uc3QgbWF4Q29sID0gZWRpdG9yLmdldEJ1ZmZlcigpLmxpbmVMZW5ndGhGb3JSb3cobGluZSAtIDEpO1xuICAgICAgICAgIGlmICgoY29sIC0gMSkgPiBtYXhDb2wpIHtcbiAgICAgICAgICAgIGNvbCA9IG1heENvbCArIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgcmFuZ2UgPSBoZWxwZXJzLnJhbmdlRnJvbUxpbmVOdW1iZXIoZWRpdG9yLCBsaW5lIC0gMSwgY29sIC0gMSk7XG5cbiAgICAgICAgICByZXR1cm4geyB0eXBlLCBodG1sLCBmaWxlUGF0aCwgcmFuZ2UgfTtcbiAgICAgICAgfSkpO1xuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgc3RhdGljIGdldEZpbGVQYXRoKGZpbGUpIHtcbiAgICBjb25zdCByZWxhdGl2ZSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChmaWxlKTtcbiAgICByZXR1cm4gcmVsYXRpdmVbMV07XG4gIH1cblxuICBzdGF0aWMgZ2V0Q29uZmlnKGZpbGVQYXRoKSB7XG4gICAgbGV0IGNvbmZpZztcbiAgICBpZiAocGF0aC5pc0Fic29sdXRlKHRoaXMuY29uZmlnUGF0aCkpIHtcbiAgICAgIGNvbmZpZyA9IGNvbmZpZ0ZpbGUubG9hZChmYWxzZSwgdGhpcy5jb25maWdQYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uZmlnID0gY29uZmlnRmlsZS5sb2FkKGZhbHNlLFxuICAgICAgICBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSwgdGhpcy5jb25maWdQYXRoKSk7XG4gICAgfVxuXG4gICAgaWYgKCFjb25maWcgJiYgdGhpcy5vbmx5Q29uZmlnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIE9wdGlvbnMgcGFzc2VkIHRvIGBqc2NzYCBmcm9tIHBhY2thZ2UgY29uZmlndXJhdGlvblxuICAgIGNvbnN0IG9wdGlvbnMgPSB7IGVzbmV4dDogdGhpcy5lc25leHQgfTtcbiAgICBjb25zdCBuZXdDb25maWcgPSBvYmplY3RBc3NpZ24oXG4gICAgICBvcHRpb25zLFxuICAgICAgY29uZmlnIHx8IHsgcHJlc2V0OiB0aGlzLnByZXNldCB9XG4gICAgKTtcbiAgICAvLyBgY29uZmlnUGF0aGAgaXMgbm9uLWVudW1lcmFibGUgc28gYE9iamVjdC5hc3NpZ25gIHdvbid0IGNvcHkgaXQuXG4gICAgLy8gV2l0aG91dCBhIHByb3BlciBgY29uZmlnUGF0aGAgSlNDUyBwbHVncyBjYW5ub3QgYmUgbG9hZGVkLiBTZWUgIzE3NS5cbiAgICBpZiAoIW5ld0NvbmZpZy5jb25maWdQYXRoICYmIGNvbmZpZyAmJiBjb25maWcuY29uZmlnUGF0aCkge1xuICAgICAgbmV3Q29uZmlnLmNvbmZpZ1BhdGggPSBjb25maWcuY29uZmlnUGF0aDtcbiAgICB9XG4gICAgcmV0dXJuIG5ld0NvbmZpZztcbiAgfVxuXG4gIHN0YXRpYyBmaXhTdHJpbmcoZWRpdG9yKSB7XG4gICAgY29uc3QgZWRpdG9yUGF0aCA9IGVkaXRvci5nZXRQYXRoKCk7XG4gICAgY29uc3QgZWRpdG9yVGV4dCA9IGVkaXRvci5nZXRUZXh0KCk7XG5cbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldENvbmZpZyhlZGl0b3JQYXRoKTtcbiAgICBpZiAoIWNvbmZpZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IEpTQ1MgPSByZXF1aXJlKCdqc2NzJyk7XG5cbiAgICAvLyBXZSBuZWVkIHJlLWluaXRpYWxpemUgSlNDUyBiZWZvcmUgZXZlcnkgbGludFxuICAgIC8vIG9yIGl0IHdpbGwgbG9vc2VzIHRoZSBlcnJvcnMsIGRpZG4ndCB0cmFjZSB0aGUgZXJyb3JcbiAgICAvLyBtdXN0IGJlIHNvbWV0aGluZyB3aXRoIG5ldyAyLjAuMCBKU0NTXG4gICAgdGhpcy5qc2NzID0gbmV3IEpTQ1MoKTtcbiAgICB0aGlzLmpzY3MucmVnaXN0ZXJEZWZhdWx0UnVsZXMoKTtcbiAgICB0aGlzLmpzY3MuY29uZmlndXJlKGNvbmZpZyk7XG5cbiAgICBjb25zdCBmaXhlZFRleHQgPSB0aGlzLmpzY3MuZml4U3RyaW5nKGVkaXRvclRleHQsIGVkaXRvclBhdGgpLm91dHB1dDtcbiAgICBpZiAoZWRpdG9yVGV4dCA9PT0gZml4ZWRUZXh0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY3Vyc29yUG9zaXRpb24gPSBlZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKTtcbiAgICBlZGl0b3Iuc2V0VGV4dChmaXhlZFRleHQpO1xuICAgIGVkaXRvci5zZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbihjdXJzb3JQb3NpdGlvbik7XG4gIH1cbn1cbiJdfQ==
//# sourceURL=/Users/nansthomas/.atom/packages/linter-jscs/src/linter-jscs.js
