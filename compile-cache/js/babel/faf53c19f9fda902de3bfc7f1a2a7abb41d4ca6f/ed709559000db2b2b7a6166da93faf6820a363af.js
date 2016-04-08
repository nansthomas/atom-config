"use babel";

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Function = require('loophole').Function;
var _ = require('underscore-plus');

var REGEXP_LINE = /(([\$\w]+[\w-]*)|([.:;'"[{( ]+))$/g;

var Provider = (function () {
  function Provider(manager) {
    _classCallCheck(this, Provider);

    this.manager = undefined;
    this.force = false;

    // automcomplete-plus
    this.selector = '.source.js';
    this.disableForSelector = '.source.js .comment';
    this.inclusionPriority = 1;
    this.excludeLowerPriority = false;

    this.line = undefined;
    this.lineMatchResult = undefined;
    this.tempPrefix = undefined;
    this.suggestionsArr = undefined;
    this.suggestion = undefined;
    this.suggestionClone = undefined;
  }

  _createClass(Provider, [{
    key: 'init',
    value: function init(manager) {

      this.manager = manager;
      this.excludeLowerPriority = this.manager.packageConfig.options.excludeLowerPriorityProviders;

      if (this.manager.packageConfig.options.displayAboveSnippets) {

        this.suggestionPriority = 2;
      }
    }
  }, {
    key: 'isValidPrefix',
    value: function isValidPrefix(prefix, prefixLast) {

      if (prefixLast === undefined) {

        return false;
      }

      if (prefixLast === '\.') {

        return true;
      }

      if (prefixLast.match(/;|\s/)) {

        return false;
      }

      if (prefix.length > 1) {

        prefix = '_' + prefix;
      }

      try {

        new Function('var ' + prefix)();
      } catch (e) {

        return false;
      }

      return true;
    }
  }, {
    key: 'checkPrefix',
    value: function checkPrefix(prefix) {

      if (prefix.match(/(\s|;|\.|\"|\')$/) || prefix.replace(/\s/g, '').length === 0) {

        return '';
      }

      return prefix;
    }
  }, {
    key: 'getPrefix',
    value: function getPrefix(editor, bufferPosition) {

      this.line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      this.lineMatchResult = this.line.match(REGEXP_LINE);

      if (this.lineMatchResult) {

        return this.lineMatchResult[0];
      }
    }
  }, {
    key: 'getSuggestions',
    value: function getSuggestions(_ref) {
      var _this = this;

      var editor = _ref.editor;
      var bufferPosition = _ref.bufferPosition;
      var scopeDescriptor = _ref.scopeDescriptor;
      var prefix = _ref.prefix;
      var activatedManually = _ref.activatedManually;

      return new Promise(function (resolve) {

        if (!_this.manager.client) {

          return resolve([]);
        }

        _this.tempPrefix = _this.getPrefix(editor, bufferPosition) || prefix;

        if (!_this.isValidPrefix(_this.tempPrefix, _this.tempPrefix[_this.tempPrefix.length - 1]) && !_this.force && !activatedManually) {

          return resolve([]);
        }

        prefix = _this.checkPrefix(_this.tempPrefix);

        _this.manager.client.update(editor).then(function (data) {

          if (data.isQueried) {

            return resolve([]);
          }

          _this.manager.client.completions(atom.project.relativizePath(editor.getURI())[1], {

            line: bufferPosition.row,
            ch: bufferPosition.column

          }).then(function (data) {

            if (!data) {

              return resolve([]);
            }

            if (!data.completions.length) {

              return resolve([]);
            }

            _this.suggestionsArr = [];

            for (var obj of data.completions) {

              obj = _this.manager.helper.formatTypeCompletion(obj);

              _this.suggestion = {

                text: obj.name,
                replacementPrefix: prefix,
                className: null,
                type: obj._typeSelf,
                leftLabel: obj.leftLabel,
                snippet: obj._snippet,
                displayText: obj._displayText,
                description: obj.doc || null,
                descriptionMoreURL: obj.url || null
              };

              if (_this.manager.packageConfig.options.useSnippetsAndFunction && obj._hasParams) {

                _this.suggestionClone = _.clone(_this.suggestion);
                _this.suggestionClone.type = 'snippet';

                if (obj._hasParams) {

                  _this.suggestion.snippet = obj.name + '(${0:})';
                } else {

                  _this.suggestion.snippet = obj.name + '()';
                }

                _this.suggestionsArr.push(_this.suggestion);
                _this.suggestionsArr.push(_this.suggestionClone);
              } else {

                _this.suggestionsArr.push(_this.suggestion);
              }
            }

            resolve(_this.suggestionsArr);
          });
        });
      });
    }
  }, {
    key: 'forceCompletion',
    value: function forceCompletion() {

      this.force = true;
      atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'autocomplete-plus:activate');
      this.force = false;
    }
  }]);

  return Provider;
})();

exports['default'] = Provider;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9uYW5zdGhvbWFzLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1wcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7QUFFWixJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQzVDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDOztBQUVuQyxJQUFNLFdBQVcsR0FBRyxvQ0FBb0MsQ0FBQzs7SUFFcEMsUUFBUTtBQUVoQixXQUZRLFFBQVEsQ0FFZixPQUFPLEVBQUU7MEJBRkYsUUFBUTs7QUFJekIsUUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7QUFDekIsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7OztBQUduQixRQUFJLENBQUMsUUFBUSxHQUFHLFlBQVksQ0FBQztBQUM3QixRQUFJLENBQUMsa0JBQWtCLEdBQUcscUJBQXFCLENBQUM7QUFDaEQsUUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztBQUMzQixRQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDOztBQUVsQyxRQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztBQUN0QixRQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztBQUNqQyxRQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztBQUM1QixRQUFJLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQztBQUNoQyxRQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztBQUM1QixRQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztHQUNsQzs7ZUFuQmtCLFFBQVE7O1dBcUJ2QixjQUFDLE9BQU8sRUFBRTs7QUFFWixVQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUN2QixVQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLE9B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aWxlIjoiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgYmFiZWxcIjtcblxubGV0IEZ1bmN0aW9uID0gcmVxdWlyZSgnbG9vcGhvbGUnKS5GdW5jdGlvbjtcbmxldCBfID0gcmVxdWlyZSgndW5kZXJzY29yZS1wbHVzJyk7XG5cbmNvbnN0IFJFR0VYUF9MSU5FID0gLygoW1xcJFxcd10rW1xcdy1dKil8KFsuOjsnXCJbeyggXSspKSQvZztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvdmlkZXIge1xuXG4gIGNvbnN0cnVjdG9yKG1hbmFnZXIpIHtcblxuICAgIHRoaXMubWFuYWdlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmZvcmNlID0gZmFsc2U7XG5cbiAgICAvLyBhdXRvbWNvbXBsZXRlLXBsdXNcbiAgICB0aGlzLnNlbGVjdG9yID0gJy5zb3VyY2UuanMnO1xuICAgIHRoaXMuZGlzYWJsZUZvclNlbGVjdG9yID0gJy5zb3VyY2UuanMgLmNvbW1lbnQnO1xuICAgIHRoaXMuaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xuICAgIHRoaXMuZXhjbHVkZUxvd2VyUHJpb3JpdHkgPSBmYWxzZTtcblxuICAgIHRoaXMubGluZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmxpbmVNYXRjaFJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnRlbXBQcmVmaXggPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5zdWdnZXN0aW9uc0FyciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnN1Z2dlc3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5zdWdnZXN0aW9uQ2xvbmUgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBpbml0KG1hbmFnZXIpIHtcblxuICAgIHRoaXMubWFuYWdlciA9IG1hbmFnZXI7XG4gICAgdGhpcy5leGNsdWRlTG93ZXJQcmlvcml0eSA9IHRoaXMubWFuYWdlci5wYWNrYWdlQ29uZmlnLm9wdGlvbnMuZXhjbHVkZUxvd2VyUHJpb3JpdHlQcm92aWRlcnM7XG5cbiAgICBpZiAodGhpcy5tYW5hZ2VyLnBhY2thZ2VDb25maWcub3B0aW9ucy5kaXNwbGF5QWJvdmVTbmlwcGV0cykge1xuXG4gICAgICB0aGlzLnN1Z2dlc3Rpb25Qcmlvcml0eSA9IDI7XG4gICAgfVxuICB9XG5cbiAgaXNWYWxpZFByZWZpeChwcmVmaXgsIHByZWZpeExhc3QpIHtcblxuICAgIGlmIChwcmVmaXhMYXN0ID09PSB1bmRlZmluZWQpIHtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChwcmVmaXhMYXN0ID09PSAnXFwuJykge1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAocHJlZml4TGFzdC5tYXRjaCgvO3xcXHMvKSkge1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHByZWZpeC5sZW5ndGggPiAxKSB7XG5cbiAgICAgIHByZWZpeCA9IGBfJHtwcmVmaXh9YDtcbiAgICB9XG5cbiAgICB0cnkge1xuXG4gICAgICAobmV3IEZ1bmN0aW9uKGB2YXIgJHtwcmVmaXh9YCkpKCk7XG5cbiAgICB9IGNhdGNoIChlKSB7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGNoZWNrUHJlZml4KHByZWZpeCkge1xuXG4gICAgaWYgKHByZWZpeC5tYXRjaCgvKFxcc3w7fFxcLnxcXFwifFxcJykkLykgfHwgcHJlZml4LnJlcGxhY2UoL1xccy9nLCAnJykubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gcHJlZml4O1xuICB9XG5cbiAgZ2V0UHJlZml4KGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIHtcblxuICAgIHRoaXMubGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSk7XG4gICAgdGhpcy5saW5lTWF0Y2hSZXN1bHQgPSB0aGlzLmxpbmUubWF0Y2goUkVHRVhQX0xJTkUpO1xuXG4gICAgaWYgKHRoaXMubGluZU1hdGNoUmVzdWx0KSB7XG5cbiAgICAgIHJldHVybiB0aGlzLmxpbmVNYXRjaFJlc3VsdFswXTtcbiAgICB9XG4gIH1cblxuICBnZXRTdWdnZXN0aW9ucyh7ZWRpdG9yLCBidWZmZXJQb3NpdGlvbiwgc2NvcGVEZXNjcmlwdG9yLCBwcmVmaXgsIGFjdGl2YXRlZE1hbnVhbGx5fSkge1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cbiAgICAgIGlmICghdGhpcy5tYW5hZ2VyLmNsaWVudCkge1xuXG4gICAgICAgIHJldHVybiByZXNvbHZlKFtdKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy50ZW1wUHJlZml4ID0gdGhpcy5nZXRQcmVmaXgoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikgfHwgcHJlZml4O1xuXG4gICAgICBpZiAoIXRoaXMuaXNWYWxpZFByZWZpeCh0aGlzLnRlbXBQcmVmaXgsIHRoaXMudGVtcFByZWZpeFt0aGlzLnRlbXBQcmVmaXgubGVuZ3RoIC0gMV0pICYmICF0aGlzLmZvcmNlICYmICFhY3RpdmF0ZWRNYW51YWxseSkge1xuXG4gICAgICAgIHJldHVybiByZXNvbHZlKFtdKTtcbiAgICAgIH1cblxuICAgICAgcHJlZml4ID0gdGhpcy5jaGVja1ByZWZpeCh0aGlzLnRlbXBQcmVmaXgpO1xuXG4gICAgICB0aGlzLm1hbmFnZXIuY2xpZW50LnVwZGF0ZShlZGl0b3IpLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgICBpZiAoZGF0YS5pc1F1ZXJpZWQpIHtcblxuICAgICAgICAgIHJldHVybiByZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubWFuYWdlci5jbGllbnQuY29tcGxldGlvbnMoYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGVkaXRvci5nZXRVUkkoKSlbMV0sIHtcblxuICAgICAgICAgIGxpbmU6IGJ1ZmZlclBvc2l0aW9uLnJvdyxcbiAgICAgICAgICBjaDogYnVmZmVyUG9zaXRpb24uY29sdW1uXG5cbiAgICAgICAgfSkudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICAgICAgaWYgKCFkYXRhKSB7XG5cbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKFtdKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWRhdGEuY29tcGxldGlvbnMubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKFtdKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zQXJyID0gW107XG5cbiAgICAgICAgICBmb3IgKGxldCBvYmogb2YgZGF0YS5jb21wbGV0aW9ucykge1xuXG4gICAgICAgICAgICBvYmogPSB0aGlzLm1hbmFnZXIuaGVscGVyLmZvcm1hdFR5cGVDb21wbGV0aW9uKG9iaik7XG5cbiAgICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbiA9IHtcblxuICAgICAgICAgICAgICB0ZXh0OiBvYmoubmFtZSxcbiAgICAgICAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IHByZWZpeCxcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiBudWxsLFxuICAgICAgICAgICAgICB0eXBlOiBvYmouX3R5cGVTZWxmLFxuICAgICAgICAgICAgICBsZWZ0TGFiZWw6IG9iai5sZWZ0TGFiZWwsXG4gICAgICAgICAgICAgIHNuaXBwZXQ6IG9iai5fc25pcHBldCxcbiAgICAgICAgICAgICAgZGlzcGxheVRleHQ6IG9iai5fZGlzcGxheVRleHQsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBvYmouZG9jIHx8IG51bGwsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogb2JqLnVybCB8fCBudWxsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5tYW5hZ2VyLnBhY2thZ2VDb25maWcub3B0aW9ucy51c2VTbmlwcGV0c0FuZEZ1bmN0aW9uICYmIG9iai5faGFzUGFyYW1zKSB7XG5cbiAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9uQ2xvbmUgPSBfLmNsb25lKHRoaXMuc3VnZ2VzdGlvbik7XG4gICAgICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbkNsb25lLnR5cGUgPSAnc25pcHBldCc7XG5cbiAgICAgICAgICAgICAgaWYgKG9iai5faGFzUGFyYW1zKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb24uc25pcHBldCA9IGAke29iai5uYW1lfSgkXFx7MDpcXH0pYDtcblxuICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9uLnNuaXBwZXQgPSBgJHtvYmoubmFtZX0oKWA7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zQXJyLnB1c2godGhpcy5zdWdnZXN0aW9uKTtcbiAgICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9uc0Fyci5wdXNoKHRoaXMuc3VnZ2VzdGlvbkNsb25lKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zQXJyLnB1c2godGhpcy5zdWdnZXN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKHRoaXMuc3VnZ2VzdGlvbnNBcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZm9yY2VDb21wbGV0aW9uKCkge1xuXG4gICAgdGhpcy5mb3JjZSA9IHRydWU7XG4gICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKSwgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJyk7XG4gICAgdGhpcy5mb3JjZSA9IGZhbHNlO1xuICB9XG59XG4iXX0=
//# sourceURL=/Users/nansthomas/.atom/packages/atom-ternjs/lib/atom-ternjs-provider.js
