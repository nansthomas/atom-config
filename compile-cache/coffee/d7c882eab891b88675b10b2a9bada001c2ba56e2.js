(function() {
  var Client;

  module.exports = Client = (function() {
    Client.prototype.port = null;

    Client.prototype.manager = null;

    Client.prototype.projectDir = null;

    function Client(manager, projectDir) {
      this.manager = manager;
      this.projectDir = projectDir;
    }

    Client.prototype.completions = function(file, end) {
      return this.post(JSON.stringify({
        query: {
          type: 'completions',
          file: file,
          end: end,
          types: true,
          includeKeywords: true,
          sort: this.manager.packageConfig.options.sort,
          guess: this.manager.packageConfig.options.guess,
          docs: this.manager.packageConfig.options.documentation,
          urls: this.manager.packageConfig.options.urls,
          origins: this.manager.packageConfig.options.origins,
          lineCharPositions: true,
          caseInsensitive: this.manager.packageConfig.options.caseInsensitive
        }
      }));
    };

    Client.prototype.documentation = function(file, end) {
      return this.post(JSON.stringify({
        query: {
          type: 'documentation',
          file: file,
          end: end
        }
      }));
    };

    Client.prototype.refs = function(file, end) {
      return this.post(JSON.stringify({
        query: {
          type: 'refs',
          file: file,
          end: end
        }
      }));
    };

    Client.prototype.update = function(editor) {
      var _editor;
      _editor = this.manager.getEditor(editor);
      return this.files().then((function(_this) {
        return function(data) {
          var promise, registered;
          registered = data.files.indexOf(atom.project.relativizePath(editor.getURI())[1].replace(/\\/g, '/')) > -1;
          if (_editor && _editor.diffs.length === 0 && registered) {
            return Promise.resolve({});
          }
          if (_editor != null) {
            _editor.diffs = [];
          }
          promise = _this.post(JSON.stringify({
            files: [
              {
                type: 'full',
                name: atom.project.relativizePath(editor.getURI())[1],
                text: editor.getText()
              }
            ]
          }));
          if (registered) {
            return promise;
          } else {
            return Promise.resolve({
              isQueried: true
            });
          }
        };
      })(this));
    };

    Client.prototype.rename = function(file, end, newName) {
      return this.post(JSON.stringify({
        query: {
          type: 'rename',
          file: file,
          end: end,
          newName: newName
        }
      }));
    };

    Client.prototype.lint = function(file, text) {
      return this.post(JSON.stringify({
        query: {
          type: 'lint',
          file: file,
          files: [
            {
              type: 'full',
              name: file,
              text: text
            }
          ]
        }
      }));
    };

    Client.prototype.type = function(editor, position) {
      var end, file;
      file = atom.project.relativizePath(editor.getURI())[1];
      end = {
        line: position.row,
        ch: position.column
      };
      return this.post(JSON.stringify({
        query: {
          type: 'type',
          file: file,
          end: end,
          preferFunction: true
        }
      }));
    };

    Client.prototype.definition = function() {
      var cursor, editor, end, file, position;
      editor = atom.workspace.getActiveTextEditor();
      cursor = editor.getLastCursor();
      position = cursor.getBufferPosition();
      file = atom.project.relativizePath(editor.getURI())[1];
      end = {
        line: position.row,
        ch: position.column
      };
      return this.post(JSON.stringify({
        query: {
          type: 'definition',
          file: file,
          end: end
        }
      })).then((function(_this) {
        return function(data) {
          var _ref, _ref1;
          if (data != null ? data.start : void 0) {
            if ((_ref = _this.manager.helper) != null) {
              _ref.setMarkerCheckpoint();
            }
            return (_ref1 = _this.manager.helper) != null ? _ref1.openFileAndGoTo(data.start, data.file) : void 0;
          }
        };
      })(this), function(err) {
        return console.log(err);
      });
    };

    Client.prototype.files = function() {
      return this.post(JSON.stringify({
        query: {
          type: 'files'
        }
      })).then((function(_this) {
        return function(data) {
          return data;
        };
      })(this));
    };

    Client.prototype.post = function(data) {
      return fetch("http://localhost:" + this.port, {
        method: 'post',
        body: data
      }).then(function(response) {
        if (response.ok) {
          return response.json().then(function(data) {
            return data || {};
          });
        }
      });
    };

    return Client;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLWNsaWVudC5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsTUFBQTs7QUFBQSxFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ007QUFFSixxQkFBQSxJQUFBLEdBQU0sSUFBTixDQUFBOztBQUFBLHFCQUNBLE9BQUEsR0FBUyxJQURULENBQUE7O0FBQUEscUJBRUEsVUFBQSxHQUFZLElBRlosQ0FBQTs7QUFJYSxJQUFBLGdCQUFDLE9BQUQsRUFBVSxVQUFWLEdBQUE7QUFDWCxNQUFBLElBQUMsQ0FBQSxPQUFELEdBQVcsT0FBWCxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsVUFBRCxHQUFjLFVBRGQsQ0FEVztJQUFBLENBSmI7O0FBQUEscUJBUUEsV0FBQSxHQUFhLFNBQUMsSUFBRCxFQUFPLEdBQVAsR0FBQTthQUNYLElBQUMsQ0FBQSxJQUFELENBQU0sSUFBSSxDQUFDLFNBQUwsQ0FDSjtBQUFBLFFBQUEsS0FBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sYUFBTjtBQUFBLFVBQ0EsSUFBQSxFQUFNLElBRE47QUFBQSxVQUVBLEdBQUEsRUFBSyxHQUZMO0FBQUEsVUFHQSxLQUFBLEVBQU8sSUFIUDtBQUFBLFVBSUEsZUFBQSxFQUFpQixJQUpqQjtBQUFBLFVBS0EsSUFBQSxFQUFNLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUxyQztBQUFBLFVBTUEsS0FBQSxFQUFPLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQU50QztBQUFBLFVBT0EsSUFBQSxFQUFNLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxhQVByQztBQUFBLFVB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

//# sourceURL=/Users/nansthomas/.atom/packages/atom-ternjs/lib/atom-ternjs-client.coffee
