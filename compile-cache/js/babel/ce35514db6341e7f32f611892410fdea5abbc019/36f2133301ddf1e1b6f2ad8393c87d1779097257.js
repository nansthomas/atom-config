"use babel";

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Server = undefined;
var Client = undefined;
var Documentation = undefined;
var Helper = undefined;
var PackageConfig = undefined;
var Config = undefined;
var Type = undefined;
var Reference = undefined;
var Rename = undefined;
var _ = require('underscore-plus');

var Manager = (function () {
  function Manager(provider) {
    _classCallCheck(this, Manager);

    this.provider = provider;

    this.disposables = [];

    this.grammars = ['JavaScript'];

    this.clients = [];
    this.client = undefined;
    this.servers = [];
    this.server = undefined;

    this.editors = [];

    this.rename = undefined;
    this.type = undefined;
    this.reference = undefined;
    this.documentation = undefined;

    this.initialised = false;

    window.setTimeout(this.init.bind(this), 0);
  }

  _createClass(Manager, [{
    key: 'init',
    value: function init() {
      var _this = this;

      Helper = require('./atom-ternjs-helper');
      PackageConfig = require('./atom-ternjs-package-config');
      Config = require('./atom-ternjs-config');

      this.helper = new Helper(this);
      this.packageConfig = new PackageConfig(this);
      this.config = new Config(this);
      this.provider.init(this);
      this.initServers();

      this.registerHelperCommands();

      this.disposables.push(atom.project.onDidChangePaths(function (paths) {

        _this.destroyServer(paths);
        _this.checkPaths(paths);
        _this.setActiveServerAndClient();
      }));
    }
  }, {
    key: 'activate',
    value: function activate() {

      this.initialised = true;
      this.registerEvents();
      this.registerCommands();
    }
  }, {
    key: 'destroyObject',
    value: function destroyObject(object) {

      if (object) {

        object.destroy();
      }
      object = undefined;
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      for (var server of this.servers) {

        server.destroy();
        server = undefined;
      }
      this.servers = [];

      for (var client of this.clients) {

        client = undefined;
      }
      this.clients = [];

      this.server = undefined;
      this.client = undefined;
      this.unregisterEventsAndCommands();
      this.provider = undefined;

      this.destroyObject(this.config);
      this.destroyObject(this.packageConfig);
      this.destroyObject(this.reference);
      this.destroyObject(this.rename);
      this.destroyObject(this.type);
      this.destroyObject(this.helper);

      this.initialised = false;
    }
  }, {
    key: 'unregisterEventsAndCommands',
    value: function unregisterEventsAndCommands() {

      for (var disposable of this.disposables) {

        disposable.dispose();
      }

      this.disposables = [];
    }
  }, {
    key: 'initServers',
    value: function initServers() {

      var dirs = atom.project.getDirectories();

      if (dirs.length === 0) {

        return;
      }

      for (var dir of dirs) {

        dir = atom.project.relativizePath(dir.path)[0];

        if (this.helper.isDirectory(dir)) {

          this.startServer(dir);
        }
      }
    }
  }, {
    key: 'startServer',
    value: function startServer(dir) {

      if (!Server) {

        Server = require('./atom-ternjs-server');
      }

      if (this.getServerForProject(dir)) {

        return;
      }

      var client = this.getClientForProject(dir);

      if (!client) {

        if (!Client) {

          Client = require('./atom-ternjs-client');
        }

        var clientIdx = this.clients.push(new Client(this, dir)) - 1;
        client = this.clients[clientIdx];
      }

      this.servers.push(new Server(dir, client, this));

      if (this.servers.length === this.clients.length) {

        if (!this.initialised) {

          this.activate();
        }

        this.setActiveServerAndClient(dir);
      }
    }
  }, {
    key: 'setActiveServerAndClient',
    value: function setActiveServerAndClient(URI) {

      if (!URI) {

        var activePane = atom.workspace.getActivePaneItem();

        if (activePane && activePane.getURI) {

          URI = activePane.getURI();
        } else {

          this.server = undefined;
          this.client = undefined;

          return;
        }
      }

      var dir = atom.project.relativizePath(URI)[0];
      var server = this.getServerForProject(dir);
      var client = this.getClientForProject(dir);

      if (server && client) {

        this.server = server;
        this.config.gatherData();
        this.client = client;
      } else {

        this.server = undefined;
        this.config.clear();
        this.client = undefined;
      }
    }
  }, {
    key: 'checkPaths',
    value: function checkPaths(paths) {

      for (var path of paths) {

        var dir = atom.project.relativizePath(path)[0];

        if (this.helper.isDirectory(dir)) {

          this.startServer(dir);
        }
      }
    }
  }, {
    key: 'destroyServer',
    value: function destroyServer(paths) {

      if (this.servers.length === 0) {

        return;
      }

      var serverIdx = undefined;

      for (var i = 0; i < this.servers.length; i++) {

        if (paths.indexOf(this.servers[i].projectDir) === -1) {

          serverIdx = i;
          break;
        }
      }

      if (serverIdx === undefined) {

        return;
      }

      var server = this.servers[serverIdx];
      var client = this.getClientForProject(server.projectDir);
      client = undefined;

      server.destroy();
      server = undefined;

      this.servers.splice(serverIdx, 1);
    }
  }, {
    key: 'getServerForProject',
    value: function getServerForProject(projectDir) {

      for (var server of this.servers) {

        if (server.projectDir === projectDir) {

          return server;
        }
      }

      return false;
    }
  }, {
    key: 'getClientForProject',
    value: function getClientForProject(projectDir) {

      for (var client of this.clients) {

        if (client.projectDir === projectDir) {

          return client;
        }
      }

      return false;
    }
  }, {
    key: 'getEditor',
    value: function getEditor(editor) {

      for (var _editor of this.editors) {

        if (_editor.id === editor.id) {

          return _editor;
        }
      }
    }
  }, {
    key: 'isValidEditor',
    value: function isValidEditor(editor) {

      if (!editor || !editor.getGrammar || editor.mini) {

        return;
      }

      if (!editor.getGrammar()) {

        return;
      }

      if (this.grammars.indexOf(editor.getGrammar().name) === -1) {

        return false;
      }

      return true;
    }
  }, {
    key: 'onDidChangeCursorPosition',
    value: function onDidChangeCursorPosition(editor, e) {

      if (this.packageConfig.options.inlineFnCompletion) {

        if (!this.type) {

          Type = require('./atom-ternjs-type');
          this.type = new Type(this);
        }

        this.type.queryType(editor, e.cursor);
      }

      if (this.rename) {

        this.rename.hide();
      }
    }
  }, {
    key: 'registerEvents',
    value: function registerEvents() {
      var _this2 = this;

      this.disposables.push(atom.workspace.observeTextEditors(function (editor) {

        if (!_this2.isValidEditor(editor)) {

          return;
        }

        // Register valid editor
        _this2.editors.push({

          id: editor.id,
          diffs: []
        });

        if (!_this2.initCalled) {

          _this2.init();
        }

        var editorView = atom.views.getView(editor);

        _this2.disposables.push(editorView.addEventListener('click', function (e) {

          if (!e[_this2.helper.accessKey]) {

            return;
          }

          if (_this2.client) {

            _this2.client.definition();
          }
        }));

        var scrollView = undefined;

        if (!editorView.shadowRoot) {

          scrollView = editorView.querySelector('.scroll-view');
        } else {

          scrollView = editorView.shadowRoot.querySelector('.scroll-view');
        }

        _this2.disposables.push(scrollView.addEventListener('mousemove', function (e) {

          if (!e[_this2.helper.accessKey]) {

            return;
          }

          if (e.target.classList.contains('line')) {

            return;
          }

          e.target.classList.add('atom-ternjs-hover');
        }));

        _this2.disposables.push(scrollView.addEventListener('mouseout', function (e) {

          e.target.classList.remove('atom-ternjs-hover');
        }));

        _this2.disposables.push(editor.onDidChangeCursorPosition(function (e) {

          if (_this2.type) {

            _this2.type.destroyOverlay();
          }

          if (_this2.documentation) {

            _this2.documentation.destroyOverlay();
          }
        }));

        _this2.disposables.push(editor.onDidChangeCursorPosition(_.debounce(_this2.onDidChangeCursorPosition.bind(_this2, editor), 300)));

        _this2.disposables.push(editor.getBuffer().onDidSave(function (e) {

          if (_this2.client) {

            _this2.client.update(editor);
          }
        }));

        _this2.disposables.push(editor.getBuffer().onDidChange(function (e) {

          _this2.getEditor(editor).diffs.push(e);
        }));
      }));

      this.disposables.push(atom.workspace.onDidChangeActivePaneItem(function (item) {

        if (_this2.config) {

          _this2.config.clear();
        }

        if (_this2.type) {

          _this2.type.destroyOverlay();
        }

        if (_this2.rename) {

          _this2.rename.hide();
        }

        if (!_this2.isValidEditor(item)) {

          if (_this2.reference) {

            _this2.reference.hide();
          }
        } else {

          _this2.setActiveServerAndClient(item.getURI());
        }
      }));
    }
  }, {
    key: 'registerHelperCommands',
    value: function registerHelperCommands() {
      var _this3 = this;

      this.disposables.push(atom.commands.add('atom-workspace', 'tern:openConfig', function (e) {

        if (!_this3.config) {

          _this3.config = new Config(_this3);
        }

        _this3.config.show();
      }));
    }
  }, {
    key: 'registerCommands',
    value: function registerCommands() {
      var _this4 = this;

      this.disposables.push(atom.commands.add('atom-text-editor', 'core:cancel', function (e) {

        if (_this4.config) {

          _this4.config.hide();
        }

        if (_this4.type) {

          _this4.type.destroyOverlay();
        }

        if (_this4.rename) {

          _this4.rename.hide();
        }

        if (_this4.reference) {

          _this4.reference.hide();
        }

        if (_this4.documentation) {

          _this4.documentation.destroyOverlay();
        }
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'tern:listFiles', function (e) {

        if (_this4.client) {

          _this4.client.files().then(function (data) {

            console.dir(data);
          });
        }
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'tern:flush', function (e) {

        if (_this4.server) {

          _this4.server.flush();
        }
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'tern:documentation', function (e) {

        if (!_this4.documentation) {

          Documentation = require('./atom-ternjs-documentation');
          _this4.documentation = new Documentation(_this4);
        }

        _this4.documentation.request();
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'tern:references', function (e) {

        if (!_this4.reference) {

          Reference = require('./atom-ternjs-reference');
          _this4.reference = new Reference(_this4);
        }

        _this4.reference.findReference();
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'tern:rename', function (e) {

        if (!_this4.rename) {

          Rename = require('./atom-ternjs-rename');
          _this4.rename = new Rename(_this4);
        }

        _this4.rename.show();
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'tern:markerCheckpointBack', function (e) {

        if (_this4.helper) {

          _this4.helper.markerCheckpointBack();
        }
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'tern:startCompletion', function (e) {

        if (_this4.provider) {

          _this4.provider.forceCompletion();
        }
      }));

      this.disposables.push(atom.commands.add('atom-text-editor', 'tern:definition', function (e) {

        if (_this4.client) {

          _this4.client.definition();
        }
      }));

      this.disposables.push(atom.commands.add('atom-workspace', 'tern:restart', function (e) {

        _this4.restartServer();
      }));
    }
  }, {
    key: 'restartServer',
    value: function restartServer() {

      if (!this.server) {

        return;
      }

      var dir = this.server.projectDir;

      for (var i = 0; i < this.servers.length; i++) {

        if (dir === this.servers[i].projectDir) {

          serverIdx = i;
          break;
        }
      }

      if (this.server) {

        this.server.destroy();
      }

      this.server = undefined;
      this.servers.splice(serverIdx, 1);
      this.startServer(dir);
    }
  }]);

  return Manager;
})();

exports['default'] = Manager;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9uYW5zdGhvbWFzLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7OztBQUVaLElBQUksTUFBTSxZQUFBLENBQUM7QUFDWCxJQUFJLE1BQU0sWUFBQSxDQUFDO0FBQ1gsSUFBSSxhQUFhLFlBQUEsQ0FBQztBQUNsQixJQUFJLE1BQU0sWUFBQSxDQUFDO0FBQ1gsSUFBSSxhQUFhLFlBQUEsQ0FBQztBQUNsQixJQUFJLE1BQU0sWUFBQSxDQUFDO0FBQ1gsSUFBSSxJQUFJLFlBQUEsQ0FBQztBQUNULElBQUksU0FBUyxZQUFBLENBQUM7QUFDZCxJQUFJLE1BQU0sWUFBQSxDQUFDO0FBQ1gsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7O0lBRWQsT0FBTztBQUVmLFdBRlEsT0FBTyxDQUVkLFFBQVEsRUFBRTswQkFGSCxPQUFPOztBQUl4QixRQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQzs7QUFFekIsUUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7O0FBRXRCLFFBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQzs7QUFFL0IsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbEIsUUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7QUFDeEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbEIsUUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7O0FBRXhCLFFBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOztBQUVsQixRQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztBQUN4QixRQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztBQUN0QixRQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUMzQixRQUFJLENBQUMs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QUM7QUFDZCxnQkFBTTtTQUNQO09BQ0Y7O0FBRUQsVUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFOztBQUVmLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDdkI7O0FBRUQsVUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7QUFDeEIsVUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLFVBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDdkI7OztTQXpsQmtCLE9BQU87OztxQkFBUCxPQUFPIiwiZmlsZSI6Ii9Vc2Vycy9uYW5zdGhvbWFzLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgYmFiZWxcIjtcblxubGV0IFNlcnZlcjtcbmxldCBDbGllbnQ7XG5sZXQgRG9jdW1lbnRhdGlvbjtcbmxldCBIZWxwZXI7XG5sZXQgUGFja2FnZUNvbmZpZztcbmxldCBDb25maWc7XG5sZXQgVHlwZTtcbmxldCBSZWZlcmVuY2U7XG5sZXQgUmVuYW1lO1xubGV0IF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlLXBsdXMnKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWFuYWdlciB7XG5cbiAgY29uc3RydWN0b3IocHJvdmlkZXIpIHtcblxuICAgIHRoaXMucHJvdmlkZXIgPSBwcm92aWRlcjtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBbXTtcblxuICAgIHRoaXMuZ3JhbW1hcnMgPSBbJ0phdmFTY3JpcHQnXTtcblxuICAgIHRoaXMuY2xpZW50cyA9IFtdO1xuICAgIHRoaXMuY2xpZW50ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuc2VydmVycyA9IFtdO1xuICAgIHRoaXMuc2VydmVyID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5lZGl0b3JzID0gW107XG5cbiAgICB0aGlzLnJlbmFtZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnR5cGUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5yZWZlcmVuY2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5kb2N1bWVudGF0aW9uID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5pbml0aWFsaXNlZCA9IGZhbHNlO1xuXG4gICAgd2luZG93LnNldFRpbWVvdXQodGhpcy5pbml0LmJpbmQodGhpcyksIDApO1xuICB9XG5cbiAgaW5pdCgpIHtcblxuICAgIEhlbHBlciA9IHJlcXVpcmUoJy4vYXRvbS10ZXJuanMtaGVscGVyJyk7XG4gICAgUGFja2FnZUNvbmZpZyA9IHJlcXVpcmUoJy4vYXRvbS10ZXJuanMtcGFja2FnZS1jb25maWcnKTtcbiAgICBDb25maWcgPSByZXF1aXJlKCcuL2F0b20tdGVybmpzLWNvbmZpZycpO1xuXG4gICAgdGhpcy5oZWxwZXIgPSBuZXcgSGVscGVyKHRoaXMpO1xuICAgIHRoaXMucGFja2FnZUNvbmZpZyA9IG5ldyBQYWNrYWdlQ29uZmlnKHRoaXMpO1xuICAgIHRoaXMuY29uZmlnID0gbmV3IENvbmZpZyh0aGlzKTtcbiAgICB0aGlzLnByb3ZpZGVyLmluaXQodGhpcyk7XG4gICAgdGhpcy5pbml0U2VydmVycygpO1xuXG4gICAgdGhpcy5yZWdpc3RlckhlbHBlckNvbW1hbmRzKCk7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMoKHBhdGhzKSA9PiB7XG5cbiAgICAgIHRoaXMuZGVzdHJveVNlcnZlcihwYXRocyk7XG4gICAgICB0aGlzLmNoZWNrUGF0aHMocGF0aHMpO1xuICAgICAgdGhpcy5zZXRBY3RpdmVTZXJ2ZXJBbmRDbGllbnQoKTtcbiAgICB9KSk7XG4gIH1cblxuICBhY3RpdmF0ZSgpIHtcblxuICAgIHRoaXMuaW5pdGlhbGlzZWQgPSB0cnVlO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudHMoKTtcbiAgICB0aGlzLnJlZ2lzdGVyQ29tbWFuZHMoKTtcbiAgfVxuXG4gIGRlc3Ryb3lPYmplY3Qob2JqZWN0KSB7XG5cbiAgICBpZiAob2JqZWN0KSB7XG5cbiAgICAgIG9iamVjdC5kZXN0cm95KCk7XG4gICAgfVxuICAgIG9iamVjdCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG5cbiAgICBmb3IgKGxldCBzZXJ2ZXIgb2YgdGhpcy5zZXJ2ZXJzKSB7XG5cbiAgICAgIHNlcnZlci5kZXN0cm95KCk7XG4gICAgICBzZXJ2ZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMuc2VydmVycyA9IFtdO1xuXG4gICAgZm9yIChsZXQgY2xpZW50IG9mIHRoaXMuY2xpZW50cykge1xuXG4gICAgICBjbGllbnQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMuY2xpZW50cyA9IFtdO1xuXG4gICAgdGhpcy5zZXJ2ZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5jbGllbnQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy51bnJlZ2lzdGVyRXZlbnRzQW5kQ29tbWFuZHMoKTtcbiAgICB0aGlzLnByb3ZpZGVyID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5kZXN0cm95T2JqZWN0KHRoaXMuY29uZmlnKTtcbiAgICB0aGlzLmRlc3Ryb3lPYmplY3QodGhpcy5wYWNrYWdlQ29uZmlnKTtcbiAgICB0aGlzLmRlc3Ryb3lPYmplY3QodGhpcy5yZWZlcmVuY2UpO1xuICAgIHRoaXMuZGVzdHJveU9iamVjdCh0aGlzLnJlbmFtZSk7XG4gICAgdGhpcy5kZXN0cm95T2JqZWN0KHRoaXMudHlwZSk7XG4gICAgdGhpcy5kZXN0cm95T2JqZWN0KHRoaXMuaGVscGVyKTtcblxuICAgIHRoaXMuaW5pdGlhbGlzZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHVucmVnaXN0ZXJFdmVudHNBbmRDb21tYW5kcygpIHtcblxuICAgIGZvciAobGV0IGRpc3Bvc2FibGUgb2YgdGhpcy5kaXNwb3NhYmxlcykge1xuXG4gICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gW107XG4gIH1cblxuICBpbml0U2VydmVycygpIHtcblxuICAgIGxldCBkaXJzID0gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCk7XG5cbiAgICBpZiAoZGlycy5sZW5ndGggPT09IDApIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAobGV0IGRpciBvZiBkaXJzKSB7XG5cbiAgICAgIGRpciA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChkaXIucGF0aClbMF07XG5cbiAgICAgIGlmICh0aGlzLmhlbHBlci5pc0RpcmVjdG9yeShkaXIpKSB7XG5cbiAgICAgICAgdGhpcy5zdGFydFNlcnZlcihkaXIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0YXJ0U2VydmVyKGRpcikge1xuXG4gICAgaWYgKCFTZXJ2ZXIpIHtcblxuICAgICAgU2VydmVyID0gcmVxdWlyZSgnLi9hdG9tLXRlcm5qcy1zZXJ2ZXInKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5nZXRTZXJ2ZXJGb3JQcm9qZWN0KGRpcikpIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBjbGllbnQgPSB0aGlzLmdldENsaWVudEZvclByb2plY3QoZGlyKTtcblxuICAgIGlmICghY2xpZW50KSB7XG5cbiAgICAgIGlmICghQ2xpZW50KSB7XG5cbiAgICAgICAgQ2xpZW50ID0gcmVxdWlyZSgnLi9hdG9tLXRlcm5qcy1jbGllbnQnKTtcbiAgICAgIH1cblxuICAgICAgbGV0IGNsaWVudElkeCA9IHRoaXMuY2xpZW50cy5wdXNoKG5ldyBDbGllbnQodGhpcywgZGlyKSkgLSAxO1xuICAgICAgY2xpZW50ID0gdGhpcy5jbGllbnRzW2NsaWVudElkeF07XG4gICAgfVxuXG4gICAgdGhpcy5zZXJ2ZXJzLnB1c2gobmV3IFNlcnZlcihkaXIsIGNsaWVudCwgdGhpcykpO1xuXG4gICAgaWYgKHRoaXMuc2VydmVycy5sZW5ndGggPT09IHRoaXMuY2xpZW50cy5sZW5ndGgpIHtcblxuICAgICAgaWYgKCF0aGlzLmluaXRpYWxpc2VkKSB7XG5cbiAgICAgICAgdGhpcy5hY3RpdmF0ZSgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnNldEFjdGl2ZVNlcnZlckFuZENsaWVudChkaXIpO1xuICAgIH1cbiAgfVxuXG4gIHNldEFjdGl2ZVNlcnZlckFuZENsaWVudChVUkkpIHtcblxuICAgIGlmICghVVJJKSB7XG5cbiAgICAgIGxldCBhY3RpdmVQYW5lID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKTtcblxuICAgICAgaWYgKGFjdGl2ZVBhbmUgJiYgYWN0aXZlUGFuZS5nZXRVUkkpIHtcblxuICAgICAgICBVUkkgPSBhY3RpdmVQYW5lLmdldFVSSSgpO1xuXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIHRoaXMuc2VydmVyID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmNsaWVudCA9IHVuZGVmaW5lZDtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGRpciA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChVUkkpWzBdO1xuICAgIGxldCBzZXJ2ZXIgPSB0aGlzLmdldFNlcnZlckZvclByb2plY3QoZGlyKTtcbiAgICBsZXQgY2xpZW50ID0gdGhpcy5nZXRDbGllbnRGb3JQcm9qZWN0KGRpcik7XG5cbiAgICBpZiAoc2VydmVyICYmIGNsaWVudCkge1xuXG4gICAgICB0aGlzLnNlcnZlciA9IHNlcnZlcjtcbiAgICAgIHRoaXMuY29uZmlnLmdhdGhlckRhdGEoKTtcbiAgICAgIHRoaXMuY2xpZW50ID0gY2xpZW50O1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgdGhpcy5zZXJ2ZXIgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmNvbmZpZy5jbGVhcigpO1xuICAgICAgdGhpcy5jbGllbnQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgY2hlY2tQYXRocyhwYXRocykge1xuXG4gICAgZm9yIChsZXQgcGF0aCBvZiBwYXRocykge1xuXG4gICAgICBsZXQgZGlyID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKHBhdGgpWzBdO1xuXG4gICAgICBpZiAodGhpcy5oZWxwZXIuaXNEaXJlY3RvcnkoZGlyKSkge1xuXG4gICAgICAgIHRoaXMuc3RhcnRTZXJ2ZXIoZGlyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBkZXN0cm95U2VydmVyKHBhdGhzKSB7XG5cbiAgICBpZiAodGhpcy5zZXJ2ZXJzLmxlbmd0aCA9PT0gMCkge1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHNlcnZlcklkeDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zZXJ2ZXJzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgIGlmIChwYXRocy5pbmRleE9mKHRoaXMuc2VydmVyc1tpXS5wcm9qZWN0RGlyKSA9PT0gLTEpIHtcblxuICAgICAgICBzZXJ2ZXJJZHggPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc2VydmVySWR4ID09PSB1bmRlZmluZWQpIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBzZXJ2ZXIgPSB0aGlzLnNlcnZlcnNbc2VydmVySWR4XTtcbiAgICBsZXQgY2xpZW50ID0gdGhpcy5nZXRDbGllbnRGb3JQcm9qZWN0KHNlcnZlci5wcm9qZWN0RGlyKTtcbiAgICBjbGllbnQgPSB1bmRlZmluZWQ7XG5cbiAgICBzZXJ2ZXIuZGVzdHJveSgpO1xuICAgIHNlcnZlciA9IHVuZGVmaW5lZDtcblxuICAgIHRoaXMuc2VydmVycy5zcGxpY2Uoc2VydmVySWR4LCAxKTtcbiAgfVxuXG4gIGdldFNlcnZlckZvclByb2plY3QocHJvamVjdERpcikge1xuXG4gICAgZm9yIChsZXQgc2VydmVyIG9mIHRoaXMuc2VydmVycykge1xuXG4gICAgICBpZiAoc2VydmVyLnByb2plY3REaXIgPT09IHByb2plY3REaXIpIHtcblxuICAgICAgICByZXR1cm4gc2VydmVyO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGdldENsaWVudEZvclByb2plY3QocHJvamVjdERpcikge1xuXG4gICAgZm9yIChsZXQgY2xpZW50IG9mIHRoaXMuY2xpZW50cykge1xuXG4gICAgICBpZiAoY2xpZW50LnByb2plY3REaXIgPT09IHByb2plY3REaXIpIHtcblxuICAgICAgICByZXR1cm4gY2xpZW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGdldEVkaXRvcihlZGl0b3IpIHtcblxuICAgIGZvciAobGV0IF9lZGl0b3Igb2YgdGhpcy5lZGl0b3JzKSB7XG5cbiAgICAgIGlmIChfZWRpdG9yLmlkID09PSBlZGl0b3IuaWQpIHtcblxuICAgICAgICByZXR1cm4gX2VkaXRvcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpc1ZhbGlkRWRpdG9yKGVkaXRvcikge1xuXG4gICAgaWYgKCFlZGl0b3IgfHwgIWVkaXRvci5nZXRHcmFtbWFyIHx8IGVkaXRvci5taW5pKSB7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWVkaXRvci5nZXRHcmFtbWFyKCkpIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmdyYW1tYXJzLmluZGV4T2YoZWRpdG9yLmdldEdyYW1tYXIoKS5uYW1lKSA9PT0gLTEpIHtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihlZGl0b3IsIGUpIHtcblxuICAgIGlmICh0aGlzLnBhY2thZ2VDb25maWcub3B0aW9ucy5pbmxpbmVGbkNvbXBsZXRpb24pIHtcblxuICAgICAgaWYgKCF0aGlzLnR5cGUpIHtcblxuICAgICAgICBUeXBlID0gcmVxdWlyZSgnLi9hdG9tLXRlcm5qcy10eXBlJyk7XG4gICAgICAgIHRoaXMudHlwZSA9IG5ldyBUeXBlKHRoaXMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnR5cGUucXVlcnlUeXBlKGVkaXRvciwgZS5jdXJzb3IpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnJlbmFtZSkge1xuXG4gICAgICB0aGlzLnJlbmFtZS5oaWRlKCk7XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXJFdmVudHMoKSB7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3IpID0+IHtcblxuICAgICAgaWYgKCF0aGlzLmlzVmFsaWRFZGl0b3IoZWRpdG9yKSkge1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gUmVnaXN0ZXIgdmFsaWQgZWRpdG9yXG4gICAgICB0aGlzLmVkaXRvcnMucHVzaCh7XG5cbiAgICAgICAgaWQ6IGVkaXRvci5pZCxcbiAgICAgICAgZGlmZnM6IFtdXG4gICAgICB9KTtcblxuICAgICAgaWYgKCF0aGlzLmluaXRDYWxsZWQpIHtcblxuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgIH1cblxuICAgICAgbGV0IGVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcblxuICAgICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuXG4gICAgICAgIGlmICghZVt0aGlzLmhlbHBlci5hY2Nlc3NLZXldKSB7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5jbGllbnQpIHtcblxuICAgICAgICAgIHRoaXMuY2xpZW50LmRlZmluaXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuXG4gICAgICBsZXQgc2Nyb2xsVmlldztcblxuICAgICAgaWYgKCFlZGl0b3JWaWV3LnNoYWRvd1Jvb3QpIHtcblxuICAgICAgICBzY3JvbGxWaWV3ID0gZWRpdG9yVmlldy5xdWVyeVNlbGVjdG9yKCcuc2Nyb2xsLXZpZXcnKTtcblxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICBzY3JvbGxWaWV3ID0gZWRpdG9yVmlldy5zaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3IoJy5zY3JvbGwtdmlldycpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goc2Nyb2xsVmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4ge1xuXG4gICAgICAgIGlmICghZVt0aGlzLmhlbHBlci5hY2Nlc3NLZXldKSB7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdsaW5lJykpIHtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGUudGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2F0b20tdGVybmpzLWhvdmVyJyk7XG4gICAgICB9KSk7XG5cbiAgICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChzY3JvbGxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgKGUpID0+IHtcblxuICAgICAgICBlLnRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdhdG9tLXRlcm5qcy1ob3ZlcicpO1xuICAgICAgfSkpO1xuXG4gICAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oKGUpID0+IHtcblxuICAgICAgICBpZiAodGhpcy50eXBlKSB7XG5cbiAgICAgICAgICB0aGlzLnR5cGUuZGVzdHJveU92ZXJsYXkoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRvY3VtZW50YXRpb24pIHtcblxuICAgICAgICAgIHRoaXMuZG9jdW1lbnRhdGlvbi5kZXN0cm95T3ZlcmxheSgpO1xuICAgICAgICB9XG4gICAgICB9KSk7XG5cbiAgICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihfLmRlYm91bmNlKHRoaXMub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5iaW5kKHRoaXMsIGVkaXRvciksIDMwMCkpKTtcblxuICAgICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFNhdmUoKGUpID0+IHtcblxuICAgICAgICBpZiAodGhpcy5jbGllbnQpIHtcblxuICAgICAgICAgIHRoaXMuY2xpZW50LnVwZGF0ZShlZGl0b3IpO1xuICAgICAgICB9XG4gICAgICB9KSk7XG5cbiAgICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2UoKGUpID0+IHtcblxuICAgICAgICB0aGlzLmdldEVkaXRvcihlZGl0b3IpLmRpZmZzLnB1c2goZSk7XG4gICAgICB9KSk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0oKGl0ZW0pID0+IHtcblxuICAgICAgaWYgKHRoaXMuY29uZmlnKSB7XG5cbiAgICAgICAgdGhpcy5jb25maWcuY2xlYXIoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMudHlwZSkge1xuXG4gICAgICAgIHRoaXMudHlwZS5kZXN0cm95T3ZlcmxheSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5yZW5hbWUpIHtcblxuICAgICAgICB0aGlzLnJlbmFtZS5oaWRlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5pc1ZhbGlkRWRpdG9yKGl0ZW0pKSB7XG5cbiAgICAgICAgaWYgKHRoaXMucmVmZXJlbmNlKSB7XG5cbiAgICAgICAgICB0aGlzLnJlZmVyZW5jZS5oaWRlKCk7XG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICB0aGlzLnNldEFjdGl2ZVNlcnZlckFuZENsaWVudChpdGVtLmdldFVSSSgpKTtcbiAgICAgIH1cbiAgICB9KSk7XG4gIH1cblxuICByZWdpc3RlckhlbHBlckNvbW1hbmRzKCkge1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICd0ZXJuOm9wZW5Db25maWcnLCAoZSkgPT4ge1xuXG4gICAgICBpZiAoIXRoaXMuY29uZmlnKSB7XG5cbiAgICAgICAgdGhpcy5jb25maWcgPSBuZXcgQ29uZmlnKHRoaXMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmNvbmZpZy5zaG93KCk7XG4gICAgfSkpO1xuICB9XG5cbiAgcmVnaXN0ZXJDb21tYW5kcygpIHtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICdjb3JlOmNhbmNlbCcsIChlKSA9PiB7XG5cbiAgICAgIGlmICh0aGlzLmNvbmZpZykge1xuXG4gICAgICAgIHRoaXMuY29uZmlnLmhpZGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMudHlwZSkge1xuXG4gICAgICAgIHRoaXMudHlwZS5kZXN0cm95T3ZlcmxheSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5yZW5hbWUpIHtcblxuICAgICAgICB0aGlzLnJlbmFtZS5oaWRlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnJlZmVyZW5jZSkge1xuXG4gICAgICAgIHRoaXMucmVmZXJlbmNlLmhpZGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuZG9jdW1lbnRhdGlvbikge1xuXG4gICAgICAgIHRoaXMuZG9jdW1lbnRhdGlvbi5kZXN0cm95T3ZlcmxheSgpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICd0ZXJuOmxpc3RGaWxlcycsIChlKSA9PiB7XG5cbiAgICAgIGlmICh0aGlzLmNsaWVudCkge1xuXG4gICAgICAgIHRoaXMuY2xpZW50LmZpbGVzKCkudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICAgICAgY29uc29sZS5kaXIoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICd0ZXJuOmZsdXNoJywgKGUpID0+IHtcblxuICAgICAgaWYgKHRoaXMuc2VydmVyKSB7XG5cbiAgICAgICAgdGhpcy5zZXJ2ZXIuZmx1c2goKTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCAndGVybjpkb2N1bWVudGF0aW9uJywgKGUpID0+IHtcblxuICAgICAgaWYgKCF0aGlzLmRvY3VtZW50YXRpb24pIHtcblxuICAgICAgICBEb2N1bWVudGF0aW9uID0gcmVxdWlyZSgnLi9hdG9tLXRlcm5qcy1kb2N1bWVudGF0aW9uJyk7XG4gICAgICAgIHRoaXMuZG9jdW1lbnRhdGlvbiA9IG5ldyBEb2N1bWVudGF0aW9uKHRoaXMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmRvY3VtZW50YXRpb24ucmVxdWVzdCgpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICd0ZXJuOnJlZmVyZW5jZXMnLCAoZSkgPT4ge1xuXG4gICAgICBpZiAoIXRoaXMucmVmZXJlbmNlKSB7XG5cbiAgICAgICAgUmVmZXJlbmNlID0gcmVxdWlyZSgnLi9hdG9tLXRlcm5qcy1yZWZlcmVuY2UnKTtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2UgPSBuZXcgUmVmZXJlbmNlKHRoaXMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnJlZmVyZW5jZS5maW5kUmVmZXJlbmNlKCk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ3Rlcm46cmVuYW1lJywgKGUpID0+IHtcblxuICAgICAgICBpZiAoIXRoaXMucmVuYW1lKSB7XG5cbiAgICAgICAgICBSZW5hbWUgPSByZXF1aXJlKCcuL2F0b20tdGVybmpzLXJlbmFtZScpO1xuICAgICAgICAgIHRoaXMucmVuYW1lID0gbmV3IFJlbmFtZSh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVuYW1lLnNob3coKTtcbiAgICAgIH1cbiAgICApKTtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICd0ZXJuOm1hcmtlckNoZWNrcG9pbnRCYWNrJywgKGUpID0+IHtcblxuICAgICAgaWYgKHRoaXMuaGVscGVyKSB7XG5cbiAgICAgICAgdGhpcy5oZWxwZXIubWFya2VyQ2hlY2twb2ludEJhY2soKTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCAndGVybjpzdGFydENvbXBsZXRpb24nLCAoZSkgPT4ge1xuXG4gICAgICBpZiAodGhpcy5wcm92aWRlcikge1xuXG4gICAgICAgIHRoaXMucHJvdmlkZXIuZm9yY2VDb21wbGV0aW9uKCk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5wdXNoKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ3Rlcm46ZGVmaW5pdGlvbicsIChlKSA9PiB7XG5cbiAgICAgIGlmICh0aGlzLmNsaWVudCkge1xuXG4gICAgICAgIHRoaXMuY2xpZW50LmRlZmluaXRpb24oKTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICB0aGlzLmRpc3Bvc2FibGVzLnB1c2goYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ3Rlcm46cmVzdGFydCcsIChlKSA9PiB7XG5cbiAgICAgIHRoaXMucmVzdGFydFNlcnZlcigpO1xuICAgIH0pKTtcbiAgfVxuXG4gIHJlc3RhcnRTZXJ2ZXIoKSB7XG5cbiAgICBpZiAoIXRoaXMuc2VydmVyKSB7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgZGlyID0gdGhpcy5zZXJ2ZXIucHJvamVjdERpcjtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zZXJ2ZXJzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgIGlmIChkaXIgPT09IHRoaXMuc2VydmVyc1tpXS5wcm9qZWN0RGlyKSB7XG5cbiAgICAgICAgc2VydmVySWR4ID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2VydmVyKSB7XG5cbiAgICAgIHRoaXMuc2VydmVyLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICB0aGlzLnNlcnZlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnNlcnZlcnMuc3BsaWNlKHNlcnZlcklkeCwgMSk7XG4gICAgdGhpcy5zdGFydFNlcnZlcihkaXIpO1xuICB9XG59XG4iXX0=
//# sourceURL=/Users/nansthomas/.atom/packages/atom-ternjs/lib/atom-ternjs-manager.js
