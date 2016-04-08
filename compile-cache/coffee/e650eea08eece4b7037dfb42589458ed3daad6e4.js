(function() {
  var Helper, fs, path, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  path = require('path');

  _ = require('underscore-plus');

  module.exports = Helper = (function() {
    Helper.prototype.projectRoot = null;

    Helper.prototype.manager = null;

    Helper.prototype.accessKey = 'altKey';

    Helper.prototype.platform = {
      darwin: false,
      linux: false,
      windows: false
    };

    Helper.prototype.checkpointsDefinition = [];

    Helper.prototype.tags = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    };

    function Helper(manager) {
      this.replaceTag = __bind(this.replaceTag, this);
      this.manager = manager;
      this.initPlatform();
    }

    Helper.prototype.initPlatform = function() {
      var classList;
      classList = document.getElementsByTagName('body')[0].classList.toString();
      this.platform.darwin = classList.indexOf('platform-darwin') > -1;
      this.platform.linux = classList.indexOf('platform-linux') > -1;
      return this.platform.windows = classList.indexOf('platform-win') > -1;
    };

    Helper.prototype.updateTernFile = function(content, restartServer) {
      var _ref;
      this.projectRoot = (_ref = this.manager.server) != null ? _ref.projectDir : void 0;
      if (!this.projectRoot) {
        return;
      }
      return this.writeFile(path.resolve(__dirname, this.projectRoot + '/.tern-project'), content, restartServer);
    };

    Helper.prototype.fileExists = function(path) {
      var e;
      try {
        return fs.accessSync(path, fs.F_OK, (function(_this) {
          return function(err) {
            return console.log(err);
          };
        })(this));
      } catch (_error) {
        e = _error;
        return false;
      }
    };

    Helper.prototype.isDirectory = function(dir) {
      try {
        return fs.statSync(dir).isDirectory();
      } catch (_error) {
        return false;
      }
    };

    Helper.prototype.writeFile = function(filePath, content, restartServer) {
      return fs.writeFile(filePath, content, (function(_this) {
        return function(err) {
          var message;
          atom.workspace.open(filePath);
          if (!err && restartServer) {
            _this.manager.restartServer();
          }
          if (!err) {
            return;
          }
          message = 'Could not create/update .tern-project file. Use the README to manually create a .tern-project file.';
          return atom.notifications.addInfo(message, {
            dismissable: true
          });
        };
      })(this));
    };

    Helper.prototype.readFile = function(path) {
      return fs.readFileSync(path, 'utf8');
    };

    Helper.prototype.getFileContent = function(filePath, projectRoot) {
      var resolvedPath, _ref;
      this.projectRoot = (_ref = this.manager.server) != null ? _ref.projectDir : void 0;
      if (!this.projectRoot) {
        return false;
      }
      if (projectRoot) {
        filePath = this.projectRoot + filePath;
      }
      resolvedPath = path.resolve(__dirname, filePath);
      if (this.fileExists(resolvedPath) !== void 0) {
        return false;
      }
      return this.readFile(resolvedPath);
    };

    Helper.prototype.markerCheckpointBack = function() {
      var checkpoint;
      if (!this.checkpointsDefinition.length) {
        return;
      }
      checkpoint = this.checkpointsDefinition.pop();
      return this.openFileAndGoToPosition(checkpoint.marker.getRange().start, checkpoint.editor.getURI());
    };

    Helper.prototype.setMarkerCheckpoint = function() {
      var buffer, cursor, editor, marker;
      editor = atom.workspace.getActiveTextEditor();
      buffer = editor.getBuffer();
      cursor = editor.getLastCursor();
      if (!cursor) {
        return;
      }
      marker = buffer.markPosition(cursor.getBufferPosition(), {});
      return this.checkpointsDefinition.push({
        marker: marker,
        editor: editor
      });
    };

    Helper.prototype.openFileAndGoToPosition = function(position, file) {
      return atom.workspace.open(file).then(function(textEditor) {
        var buffer, cursor;
        buffer = textEditor.getBuffer();
        cursor = textEditor.getLastCursor();
        return cursor.setBufferPosition(position);
      });
    };

    Helper.prototype.openFileAndGoTo = function(start, file) {
      return atom.workspace.open(file).then((function(_this) {
        return function(textEditor) {
          var buffer, cursor;
          buffer = textEditor.getBuffer();
          cursor = textEditor.getLastCursor();
          cursor.setBufferPosition(buffer.positionForCharacterIndex(start));
          return _this.markDefinitionBufferRange(cursor, textEditor);
        };
      })(this));
    };

    Helper.prototype.replaceTag = function(tag) {
      return this.tags[tag];
    };

    Helper.prototype.replaceTags = function(str) {
      if (!str) {
        return '';
      }
      return str.replace(/[&<>]/g, this.replaceTag);
    };

    Helper.prototype.formatType = function(data) {
      if (!data.type) {
        return '';
      }
      data.type = data.type.replace(/->/g, ':').replace('<top>', 'window');
      if (!data.exprName) {
        return data.type;
      }
      return data.type = data.type.replace(/^fn/, data.exprName);
    };

    Helper.prototype.prepareType = function(data) {
      var type;
      if (!data.type) {
        return;
      }
      return type = data.type.replace(/->/g, ':').replace('<top>', 'window');
    };

    Helper.prototype.formatTypeCompletion = function(obj) {
      var params, _ref;
      if (obj.isKeyword) {
        obj._typeSelf = 'keyword';
      }
      if (!obj.type) {
        return obj;
      }
      if (!obj.type.startsWith('fn')) {
        obj._typeSelf = 'variable';
      }
      if (obj.type === 'string') {
        obj.name = (_ref = obj.name) != null ? _ref.replace(/(^"|"$)/g, '') : void 0;
      }
      obj.type = obj.rightLabel = this.prepareType(obj);
      if (obj.type.replace(/fn\(.+\)/, '').length === 0) {
        obj.leftLabel = '';
      } else {
        if (obj.type.indexOf('fn') === -1) {
          obj.leftLabel = obj.type;
        } else {
          obj.leftLabel = obj.type.replace(/fn\(.{0,}\)/, '').replace(' : ', '');
        }
      }
      if (obj.rightLabel.startsWith('fn')) {
        params = this.extractParams(obj.rightLabel);
        if (this.manager.packageConfig.options.useSnippets || this.manager.packageConfig.options.useSnippetsAndFunction) {
          obj._snippet = this.buildSnippet(params, obj.name);
          obj._hasParams = params.length ? true : false;
        } else {
          obj._snippet = params.length ? "" + obj.name + "(${" + 0 + ":" + "})" : "" + obj.name + "()";
          obj._displayText = this.buildDisplayText(params, obj.name);
        }
        obj._typeSelf = 'function';
      }
      if (obj.name) {
        if (obj.leftLabel === obj.name) {
          obj.leftLabel = null;
          obj.rightLabel = null;
        }
      }
      if (obj.leftLabel === obj.rightLabel) {
        obj.rightLabel = null;
      }
      return obj;
    };

    Helper.prototype.buildDisplayText = function(params, name) {
      var i, param, suggestionParams, _i, _len;
      if (params.length === 0) {
        return "" + name + "()";
      }
      suggestionParams = [];
      for (i = _i = 0, _len = params.length; _i < _len; i = ++_i) {
        param = params[i];
        param = param.replace('}', '\\}');
        suggestionParams.push("" + param);
      }
      return "" + name + "(" + (suggestionParams.join(',')) + ")";
    };

    Helper.prototype.buildSnippet = function(params, name) {
      var i, param, suggestionParams, _i, _len;
      if (params.length === 0) {
        return "" + name + "()";
      }
      suggestionParams = [];
      for (i = _i = 0, _len = params.length; _i < _len; i = ++_i) {
        param = params[i];
        param = param.replace('}', '\\}');
        suggestionParams.push("${" + (i + 1) + ":" + param + "}");
      }
      return "" + name + "(" + (suggestionParams.join(',')) + ")";
    };

    Helper.prototype.extractParams = function(type) {
      var i, inside, param, params, start, _i, _ref;
      if (!type) {
        return [];
      }
      start = type.indexOf('(') + 1;
      params = [];
      inside = 0;
      for (i = _i = start, _ref = type.length - 1; start <= _ref ? _i <= _ref : _i >= _ref; i = start <= _ref ? ++_i : --_i) {
        if (type[i] === ':' && inside === -1) {
          params.push(type.substring(start, i - 2));
          break;
        }
        if (i === type.length - 1) {
          param = type.substring(start, i);
          if (param.length) {
            params.push(param);
          }
          break;
        }
        if (type[i] === ',' && inside === 0) {
          params.push(type.substring(start, i));
          start = i + 1;
          continue;
        }
        if (type[i].match(/[{\[\(]/)) {
          inside++;
          continue;
        }
        if (type[i].match(/[}\]\)]/)) {
          inside--;
        }
      }
      return params;
    };

    Helper.prototype.markDefinitionBufferRange = function(cursor, editor) {
      var decoration, marker, range;
      range = cursor.getCurrentWordBufferRange();
      marker = editor.markBufferRange(range, {
        invalidate: 'touch'
      });
      decoration = editor.decorateMarker(marker, {
        type: 'highlight',
        "class": 'atom-ternjs-definition-marker',
        invalidate: 'touch'
      });
      setTimeout((function() {
        return decoration != null ? decoration.setProperties({
          type: 'highlight',
          "class": 'atom-ternjs-definition-marker active',
          invalidate: 'touch'
        }) : void 0;
      }), 1);
      setTimeout((function() {
        return decoration != null ? decoration.setProperties({
          type: 'highlight',
          "class": 'atom-ternjs-definition-marker',
          invalidate: 'touch'
        }) : void 0;
      }), 1501);
      return setTimeout((function() {
        return marker.destroy();
      }), 2500);
    };

    Helper.prototype.focusEditor = function() {
      var editor, view;
      editor = atom.workspace.getActiveTextEditor();
      if (!editor) {
        return;
      }
      view = atom.views.getView(editor);
      return view != null ? typeof view.focus === "function" ? view.focus() : void 0 : void 0;
    };

    Helper.prototype.destroy = function() {
      var checkpoint, _i, _len, _ref, _ref1, _results;
      _ref = this.checkpointsDefinition;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        checkpoint = _ref[_i];
        _results.push((_ref1 = checkpoint.marker) != null ? _ref1.destroy() : void 0);
      }
      return _results;
    };

    return Helper;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLWhlbHBlci5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsbUJBQUE7SUFBQSxrRkFBQTs7QUFBQSxFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUixDQUFMLENBQUE7O0FBQUEsRUFDQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVIsQ0FEUCxDQUFBOztBQUFBLEVBRUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUixDQUZKLENBQUE7O0FBQUEsRUFJQSxNQUFNLENBQUMsT0FBUCxHQUNNO0FBRUoscUJBQUEsV0FBQSxHQUFhLElBQWIsQ0FBQTs7QUFBQSxxQkFDQSxPQUFBLEdBQVMsSUFEVCxDQUFBOztBQUFBLHFCQUVBLFNBQUEsR0FBVyxRQUZYLENBQUE7O0FBQUEscUJBR0EsUUFBQSxHQUNFO0FBQUEsTUFBQSxNQUFBLEVBQVEsS0FBUjtBQUFBLE1BQ0EsS0FBQSxFQUFPLEtBRFA7QUFBQSxNQUVBLE9BQUEsRUFBUyxLQUZUO0tBSkYsQ0FBQTs7QUFBQSxxQkFPQSxxQkFBQSxHQUF1QixFQVB2QixDQUFBOztBQUFBLHFCQVFBLElBQUEsR0FDRTtBQUFBLE1BQUEsR0FBQSxFQUFLLE9BQUw7QUFBQSxNQUNBLEdBQUEsRUFBSyxNQURMO0FBQUEsTUFFQSxHQUFBLEVBQUssTUFGTDtLQVRGLENBQUE7O0FBYWEsSUFBQSxnQkFBQyxPQUFELEdBQUE7QUFDWCxxREFBQSxDQUFBO0FBQUEsTUFBQSxJQUFDLENBQUEsT0FBRCxHQUFXLE9BQVgsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQURBLENBRFc7SUFBQSxDQWJiOztBQUFBLHFCQWlCQSxZQUFBLEdBQWMsU0FBQSxHQUFBO0FBQ1os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

//# sourceURL=/Users/nansthomas/.atom/packages/atom-ternjs/lib/atom-ternjs-helper.coffee
