(function() {
  var CompositeDisposable, File, NodeSassCompiler, SassAutocompileOptions, SassAutocompileView;

  CompositeDisposable = require('atom').CompositeDisposable;

  SassAutocompileOptions = require('./options');

  SassAutocompileView = require('./sass-autocompile-view');

  NodeSassCompiler = require('./compiler');

  File = require('./helper/file');

  module.exports = {
    config: {
      compileOnSave: {
        title: 'Compile on Save',
        description: 'This option en-/disables auto compiling on save',
        type: 'boolean',
        "default": true,
        order: 10
      },
      compileFiles: {
        title: 'Compile files ...',
        description: 'Choose which SASS files you want this package to compile',
        type: 'string',
        "enum": ['Only with first-line-comment', 'Every SASS file'],
        "default": 'Every SASS file',
        order: 11
      },
      compilePartials: {
        title: 'Compile Partials',
        description: 'Controls compilation of Partials (underscore as first character in filename) if there is no first-line-comment',
        type: 'boolean',
        "default": false,
        order: 12
      },
      checkOutputFileAlreadyExists: {
        title: 'Ask for overwriting already existent files',
        description: 'If target file already exists, sass-autocompile will ask you before overwriting',
        type: 'boolean',
        "default": false,
        order: 13
      },
      directlyJumpToError: {
        title: 'Directly jump to error',
        description: 'If enabled and you compile an erroneous SASS file, this file is opened and jumped to the problematic position.',
        type: 'boolean',
        "default": false,
        order: 14
      },
      showCompileSassItemInTreeViewContextMenu: {
        title: 'Show \'Compile SASS\' item in Tree View context menu',
        description: 'If enbaled, Tree View context menu contains a \'Compile SASS\' item that allows you to compile that file via context menu',
        type: 'string',
        type: 'boolean',
        "default": true,
        order: 15
      },
      compileCompressed: {
        title: 'Compile with \'compressed\' output style',
        description: 'If enabled SASS files are compiled with \'compressed\' output style. Please define a corresponding output filename pattern or use inline parameter \'compressedFilenamePattern\'',
        type: 'boolean',
        "default": true,
        order: 30
      },
      compressedFilenamePattern: {
        title: 'Filename pattern for \'compressed\' compiled files',
        description: 'Define the replacement pattern for compiled filenames with \'compressed\' output style. Placeholders are: \'$1\' for basename of file and \'$2\' for original file extension.',
        type: 'string',
        "default": '$1.min.css',
        order: 31
      },
      compileCompact: {
        title: 'Compile with \'compact\' output style',
        description: 'If enabled SASS files are compiled with \'compact\' output style. Please define a corresponding output filename pattern or use inline parameter \'compactFilenamePattern\'',
        type: 'boolean',
        "default": false,
        order: 32
      },
      compactFilenamePattern: {
        title: 'Filename pattern for \'compact\' compiled files',
        description: 'Define the replacement pattern for compiled filenames with \'compact\' output style. Placeholders are: \'$1\' for basename of file and \'$2\' for original file extension.',
        type: 'string',
        "default": '$1.compact.css',
        order: 33
      },
      compileNested: {
        title: 'Compile with \'nested\' output style',
        description: 'If enabled SASS files are compiled with \'nested\' output style. Please define a corresponding output filename pattern or use inline parameter \'nestedFilenamePattern\'',
        type: 'boolean',
        "default": false,
        order: 34
      },
      nestedFilenamePattern: {
        title: 'Filename pattern for \'nested\' compiled files',
        description: 'Define the replacement pattern for compiled filenames with \'nested\' output style. Placeholders are: \'$1\' for basename of file and \'$2\' for original file extension.',
        type: 'string',
        "default": '$1.nested.css',
        order: 35
      },
      compileExpanded: {
        title: 'Compile with \'expanded\' output style',
        description: 'If enabled SASS files are compiled with \'expanded\' output style. Please define a corresponding output filename pattern or use inline parameter \'expandedFilenamePattern\'',
        type: 'boolean',
        "default": false,
        order: 36
      },
      expandedFilenamePattern: {
        title: 'Filename pattern for \'expanded\' compiled files',
        description: 'Define the replacement pattern for compiled filenames with \'expanded\' output style. Placeholders are: \'$1\' for basename of file and \'$2\' for original file extension.',
        type: 'string',
        "default": '$1.css',
        order: 37
      },
      indentType: {
        title: 'Indent type',
        description: 'Indent type for output CSS',
        type: 'string',
        "enum": ['Space', 'Tab'],
        "default": 'Space',
        order: 38
      },
      indentWidth: {
        title: 'Indent width',
        description: 'Indent width; number of spaces or tabs',
        type: 'integer',
        "enum": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "default": 2,
        minimum: 0,
        maximum: 10,
        order: 39
      },
      linefeed: {
        title: 'Linefeed',
        description: 'Used to determine whether to use \'cr\', \'crlf\', \'lf\' or \'lfcr\' sequence for line break',
        type: 'string',
        "enum": ['cr', 'crlf', 'lf', 'lfcr'],
        "default": 'lf',
        order: 40
      },
      sourceMap: {
        title: 'Build source map',
        description: 'If enabled a source map is generated',
        type: 'boolean',
        "default": false,
        order: 41
      },
      sourceMapEmbed: {
        title: 'Embed source map',
        description: 'If enabled source map is embedded as a data URI',
        type: 'boolean',
        "default": false,
        order: 42
      },
      sourceMapContents: {
        title: 'Include contents in source map information',
        description: 'If enabled contents are included in source map information',
        type: 'boolean',
        "default": false,
        order: 43
      },
      sourceComments: {
        title: 'Include additional debugging information in the output CSS file',
        description: 'If enabled additional debugging information are added to the output file as CSS comments. If CSS is compressed this feature is disabled by SASS compiler',
        type: 'boolean',
        "default": false,
        order: 44
      },
      includePath: {
        title: 'Include paths',
        description: 'Paths to look for imported files (@import declarations); comma separated, each path surrounded by quotes',
        type: 'string',
        "default": '',
        order: 45
      },
      precision: {
        title: 'Precision',
        description: 'Used to determine how many digits after the decimal will be allowed. For instance, if you had a decimal number of 1.23456789 and a precision of 5, the result will be 1.23457 in the final CSS',
        type: 'integer',
        "default": 5,
        minimum: 0,
        order: 46
      },
      importer: {
        title: 'Filename to custom importer',
        description: 'Path to .js file containing custom importer',
        type: 'string',
        "default": '',
        order: 47
      },
      functions: {
        title: 'Filename to custom functions',
        description: 'Path to .js file containing custom functions',
        type: 'string',
        "default": '',
        order: 48
      },
      notifications: {
        title: 'Notification type',
        description: 'Select which types of notifications you wish to see',
        type: 'string',
        "enum": ['Panel', 'Notifications', 'Panel, Notifications'],
        "default": 'Panel',
        order: 60
      },
      autoHidePanel: {
        title: 'Automatically hide panel on ...',
        description: 'Select on which event the panel should automatically disappear',
        type: 'string',
        "enum": ['Never', 'Success', 'Error', 'Success, Error'],
        "default": 'Success',
        order: 61
      },
      autoHidePanelDelay: {
        title: 'Panel-auto-hide delay',
        description: 'Delay after which panel is automatically hidden',
        type: 'integer',
        "default": 3000,
        order: 62
      },
      autoHideNotifications: {
        title: 'Automatically hide notifications on ...',
        description: 'Select which types of notifications should automatically disappear',
        type: 'string',
        "enum": ['Never', 'Info, Success', 'Error', 'Info, Success, Error'],
        "default": 'Info, Success',
        order: 63
      },
      showStartCompilingNotification: {
        title: 'Show \'Start Compiling\' Notification',
        description: 'If enabled a \'Start Compiling\' notification is shown',
        type: 'boolean',
        "default": false,
        order: 64
      },
      showAdditionalCompilationInfo: {
        title: 'Show additional compilation info',
        description: 'If enabled additiona infos like duration or file size is presented',
        type: 'boolean',
        "default": true,
        order: 65
      },
      showNodeSassOutput: {
        title: 'Show node-sass output after compilation',
        description: 'If enabled detailed output of node-sass command is shown in a new tab so you can analyse output',
        type: 'boolean',
        "default": false,
        order: 66
      },
      showOldParametersWarning: {
        title: 'Show warning when using old paramters',
        description: 'If enabled any time you compile a SASS file und you use old inline paramters, an warning will be occur not to use them',
        type: 'boolean',
        "default": true,
        order: 66
      },
      nodeSassPath: {
        title: 'Path to \'node-sass\' command',
        description: 'Absolute path where \'node-sass\' executable is placed. Please read documentation before usage!',
        type: 'string',
        "default": '',
        order: 80
      }
    },
    sassAutocompileView: null,
    mainSubmenu: null,
    contextMenuItem: null,
    activate: function(state) {
      this.subscriptions = new CompositeDisposable;
      this.editorSubscriptions = new CompositeDisposable;
      this.sassAutocompileView = new SassAutocompileView(new SassAutocompileOptions(), state.sassAutocompileViewState);
      this.isProcessing = false;
      if (SassAutocompileOptions.get('enabled')) {
        SassAutocompileOptions.set('compileOnSave', SassAutocompileOptions.get('enabled'));
        SassAutocompileOptions.unset('enabled');
      }
      if (SassAutocompileOptions.get('outputStyle')) {
        SassAutocompileOptions.unset('outputStyle');
      }
      if (SassAutocompileOptions.get('macOsNodeSassPath')) {
        SassAutocompileOptions.set('nodeSassPath', SassAutocompileOptions.get('macOsNodeSassPath'));
        SassAutocompileOptions.unset('macOsNodeSassPath');
      }
      this.registerCommands();
      this.registerTextEditorSaveCallback();
      this.registerConfigObserver();
      return this.registerContextMenuItem();
    },
    deactivate: function() {
      this.subscriptions.dispose();
      this.editorSubscriptions.dispose();
      return this.sassAutocompileView.destroy();
    },
    serialize: function() {
      return {
        sassAutocompileViewState: this.sassAutocompileView.serialize()
      };
    },
    registerCommands: function() {
      return this.subscriptions.add(atom.commands.add('atom-workspace', {
        'sass-autocompile:compile-to-file': (function(_this) {
          return function(evt) {
            return _this.compileToFile(evt);
          };
        })(this),
        'sass-autocompile:compile-direct': (function(_this) {
          return function(evt) {
            return _this.compileDirect(evt);
          };
        })(this),
        'sass-autocompile:toggle-compile-on-save': (function(_this) {
          return function() {
            return _this.toggleCompileOnSave();
          };
        })(this),
        'sass-autocompile:toggle-output-style-nested': (function(_this) {
          return function() {
            return _this.toggleOutputStyle('Nested');
          };
        })(this),
        'sass-autocompile:toggle-output-style-compact': (function(_this) {
          return function() {
            return _this.toggleOutputStyle('Compact');
          };
        })(this),
        'sass-autocompile:toggle-output-style-expanded': (function(_this) {
          return function() {
            return _this.toggleOutputStyle('Expanded');
          };
        })(this),
        'sass-autocompile:toggle-output-style-compressed': (function(_this) {
          return function() {
            return _this.toggleOutputStyle('Compressed');
          };
        })(this),
        'sass-autocompile:compile-every-sass-file': (function(_this) {
          return function() {
            return _this.selectCompileFileType('every');
          };
        })(this),
        'sass-autocompile:compile-only-with-first-line-comment': (function(_this) {
          return function() {
            return _this.selectCompileFileType('first-line-comment');
          };
        })(this),
        'sass-autocompile:toggle-check-output-file-already-exists': (function(_this) {
          return function() {
            return _this.toggleCheckOutputFileAlreadyExists();
          };
        })(this),
        'sass-autocompile:toggle-directly-jump-to-error': (function(_this) {
          return function() {
            return _this.toggleDirectlyJumpToError();
          };
        })(this),
        'sass-autocompile:toggle-show-compile-sass-item-in-tree-view-context-menu': (function(_this) {
          return function() {
            return _this.toggleShowCompileSassItemInTreeViewContextMenu();
          };
        })(this),
        'sass-autocompile:close-message-panel': (function(_this) {
          return function(evt) {
            _this.closePanel();
            return evt.abortKeyBinding();
          };
        })(this)
      }));
    },
    compileToFile: function(evt) {
      var activeEditor, filename, isFileItem, target;
      if (evt.target.nodeName.toLowerCase() === 'atom-text-editor') {
        activeEditor = atom.workspace.getActiveTextEditor();
        filename = activeEditor.getURI();
      } else {
        target = evt.target;
        if (evt.target.nodeName.toLowerCase() === 'span') {
          target = evt.target.parentNode;
        }
        isFileItem = target.getAttribute('class').split(' ').indexOf('file') >= 0;
        if (isFileItem) {
          filename = target.firstElementChild.getAttribute('data-path');
        }
      }
      if (this.isSassFile(filename)) {
        return this.compile(NodeSassCompiler.MODE_FILE, filename, false);
      }
    },
    compileDirect: function(evt) {
      return this.compile(NodeSassCompiler.MODE_DIRECT);
    },
    toggleCompileOnSave: function() {
      SassAutocompileOptions.set('compileOnSave', !SassAutocompileOptions.get('compileOnSave'));
      if (SassAutocompileOptions.get('compileOnSave')) {
        atom.notifications.addInfo('SASS-AutoCompile: Enabled compile on save');
      } else {
        atom.notifications.addWarning('SASS-AutoCompile: Disabled compile on save');
      }
      return this.updateMenuItems();
    },
    toggleOutputStyle: function(outputStyle) {
      switch (outputStyle.toLowerCase()) {
        case 'compressed':
          SassAutocompileOptions.set('compileCompressed', !SassAutocompileOptions.get('compileCompressed'));
          break;
        case 'compact':
          SassAutocompileOptions.set('compileCompact', !SassAutocompileOptions.get('compileCompact'));
          break;
        case 'nested':
          SassAutocompileOptions.set('compileNested', !SassAutocompileOptions.get('compileNested'));
          break;
        case 'expanded':
          SassAutocompileOptions.set('compileExpanded', !SassAutocompileOptions.get('compileExpanded'));
      }
      return this.updateMenuItems();
    },
    selectCompileFileType: function(type) {
      if (type === 'every') {
        SassAutocompileOptions.set('compileFiles', 'Every SASS file');
      } else if (type === 'first-line-comment') {
        SassAutocompileOptions.set('compileFiles', 'Only with first-line-comment');
      }
      return this.updateMenuItems();
    },
    toggleCheckOutputFileAlreadyExists: function() {
      SassAutocompileOptions.set('checkOutputFileAlreadyExists', !SassAutocompileOptions.get('checkOutputFileAlreadyExists'));
      return this.updateMenuItems();
    },
    toggleDirectlyJumpToError: function() {
      SassAutocompileOptions.set('directlyJumpToError', !SassAutocompileOptions.get('directlyJumpToError'));
      return this.updateMenuItems();
    },
    toggleShowCompileSassItemInTreeViewContextMenu: function() {
      SassAutocompileOptions.set('showCompileSassItemInTreeViewContextMenu', !SassAutocompileOptions.get('showCompileSassItemInTreeViewContextMenu'));
      return this.updateMenuItems();
    },
    compile: function(mode, filename, minifyOnSave) {
      var options;
      if (filename == null) {
        filename = null;
      }
      if (minifyOnSave == null) {
        minifyOnSave = false;
      }
      if (this.isProcessing) {
        return;
      }
      options = new SassAutocompileOptions();
      this.isProcessing = true;
      this.sassAutocompileView.updateOptions(options);
      this.sassAutocompileView.hidePanel(false, true);
      this.compiler = new NodeSassCompiler(options);
      this.compiler.onStart((function(_this) {
        return function(args) {
          return _this.sassAutocompileView.startCompilation(args);
        };
      })(this));
      this.compiler.onWarning((function(_this) {
        return function(args) {
          return _this.sassAutocompileView.warning(args);
        };
      })(this));
      this.compiler.onSuccess((function(_this) {
        return function(args) {
          return _this.sassAutocompileView.successfullCompilation(args);
        };
      })(this));
      this.compiler.onError((function(_this) {
        return function(args) {
          return _this.sassAutocompileView.erroneousCompilation(args);
        };
      })(this));
      this.compiler.onFinished((function(_this) {
        return function(args) {
          _this.sassAutocompileView.finished(args);
          _this.isProcessing = false;
          _this.compiler.destroy();
          return _this.compiler = null;
        };
      })(this));
      return this.compiler.compile(mode, filename, minifyOnSave);
    },
    registerTextEditorSaveCallback: function() {
      return this.editorSubscriptions.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          return _this.subscriptions.add(editor.onDidSave(function() {
            if (!_this.isProcessing && editor && editor.getURI && _this.isSassFile(editor.getURI())) {
              return _this.compile(NodeSassCompiler.MODE_FILE, null, true);
            }
          }));
        };
      })(this)));
    },
    isSassFile: function(filename) {
      return File.hasFileExtension(filename, ['.scss', '.sass']);
    },
    registerConfigObserver: function() {
      this.subscriptions.add(atom.config.observe(SassAutocompileOptions.OPTIONS_PREFIX + 'compileOnSave', (function(_this) {
        return function(newValue) {
          return _this.updateMenuItems();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe(SassAutocompileOptions.OPTIONS_PREFIX + 'compileFiles', (function(_this) {
        return function(newValue) {
          return _this.updateMenuItems();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe(SassAutocompileOptions.OPTIONS_PREFIX + 'checkOutputFileAlreadyExists', (function(_this) {
        return function(newValue) {
          return _this.updateMenuItems();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe(SassAutocompileOptions.OPTIONS_PREFIX + 'directlyJumpToError', (function(_this) {
        return function(newValue) {
          return _this.updateMenuItems();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe(SassAutocompileOptions.OPTIONS_PREFIX + 'showCompileSassItemInTreeViewContextMenu', (function(_this) {
        return function(newValue) {
          return _this.updateMenuItems();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe(SassAutocompileOptions.OPTIONS_PREFIX + 'compileCompressed', (function(_this) {
        return function(newValue) {
          return _this.updateMenuItems();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe(SassAutocompileOptions.OPTIONS_PREFIX + 'compileCompact', (function(_this) {
        return function(newValue) {
          return _this.updateMenuItems();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe(SassAutocompileOptions.OPTIONS_PREFIX + 'compileNested', (function(_this) {
        return function(newValue) {
          return _this.updateMenuItems();
        };
      })(this)));
      return this.subscriptions.add(atom.config.observe(SassAutocompileOptions.OPTIONS_PREFIX + 'compileExpanded', (function(_this) {
        return function(newValue) {
          return _this.updateMenuItems();
        };
      })(this)));
    },
    registerContextMenuItem: function() {
      var menuItem;
      menuItem = this.getContextMenuItem();
      return menuItem.shouldDisplay = (function(_this) {
        return function(evt) {
          var child, filename, isFileItem, showItemOption, target;
          showItemOption = SassAutocompileOptions.get('showCompileSassItemInTreeViewContextMenu');
          if (showItemOption) {
            target = evt.target;
            if (target.nodeName.toLowerCase() === 'span') {
              target = target.parentNode;
            }
            isFileItem = target.getAttribute('class').split(' ').indexOf('file') >= 0;
            if (isFileItem) {
              child = target.firstElementChild;
              filename = child.getAttribute('data-name');
              return _this.isSassFile(filename);
            }
          }
          return false;
        };
      })(this);
    },
    updateMenuItems: function() {
      var compileFileMenu, menu, outputStylesMenu;
      menu = this.getMainMenuSubmenu().submenu;
      if (!menu) {
        return;
      }
      menu[3].label = (SassAutocompileOptions.get('compileOnSave') ? '✔' : '✕') + '  Compile on Save';
      menu[4].label = (SassAutocompileOptions.get('checkOutputFileAlreadyExists') ? '✔' : '✕') + '  Check output file already exists';
      menu[5].label = (SassAutocompileOptions.get('directlyJumpToError') ? '✔' : '✕') + '  Directly jump to error';
      menu[6].label = (SassAutocompileOptions.get('showCompileSassItemInTreeViewContextMenu') ? '✔' : '✕') + '  Show \'Compile SASS\' item in tree view context menu';
      compileFileMenu = menu[8].submenu;
      if (compileFileMenu) {
        compileFileMenu[0].checked = SassAutocompileOptions.get('compileFiles') === 'Every SASS file';
        compileFileMenu[1].checked = SassAutocompileOptions.get('compileFiles') === 'Only with first-line-comment';
      }
      outputStylesMenu = menu[9].submenu;
      if (outputStylesMenu) {
        outputStylesMenu[0].label = (SassAutocompileOptions.get('compileCompressed') ? '✔' : '✕') + '  Compressed';
        outputStylesMenu[1].label = (SassAutocompileOptions.get('compileCompact') ? '✔' : '✕') + '  Compact';
        outputStylesMenu[2].label = (SassAutocompileOptions.get('compileNested') ? '✔' : '✕') + '  Nested';
        outputStylesMenu[3].label = (SassAutocompileOptions.get('compileExpanded') ? '✔' : '✕') + '  Expanded';
      }
      return atom.menu.update();
    },
    getMainMenuSubmenu: function() {
      var found, menu, submenu, _i, _j, _len, _len1, _ref, _ref1;
      if (this.mainSubmenu === null) {
        found = false;
        _ref = atom.menu.template;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          menu = _ref[_i];
          if (menu.label === 'Packages' || menu.label === '&Packages') {
            found = true;
            _ref1 = menu.submenu;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              submenu = _ref1[_j];
              if (submenu.label === 'SASS Autocompile') {
                this.mainSubmenu = submenu;
                break;
              }
            }
          }
          if (found) {
            break;
          }
        }
      }
      return this.mainSubmenu;
    },
    getContextMenuItem: function() {
      var found, item, items, _i, _j, _len, _len1, _ref, _ref1;
      if (this.contextMenuItem === null) {
        found = false;
        _ref = atom.contextMenu.itemSets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          items = _ref[_i];
          if (items.selector === '.tree-view') {
            _ref1 = items.items;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              item = _ref1[_j];
              if (item.id === 'sass-autocompile-context-menu-compile') {
                found = true;
                this.contextMenuItem = item;
                break;
              }
            }
          }
          if (found) {
            break;
          }
        }
      }
      return this.contextMenuItem;
    },
    closePanel: function() {
      return this.sassAutocompileView.hidePanel();
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvc2Fzcy1hdXRvY29tcGlsZS9saWIvc2Fzcy1hdXRvY29tcGlsZS5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsd0ZBQUE7O0FBQUEsRUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVIsRUFBdkIsbUJBQUQsQ0FBQTs7QUFBQSxFQUVBLHNCQUFBLEdBQXlCLE9BQUEsQ0FBUSxXQUFSLENBRnpCLENBQUE7O0FBQUEsRUFHQSxtQkFBQSxHQUFzQixPQUFBLENBQVEseUJBQVIsQ0FIdEIsQ0FBQTs7QUFBQSxFQUlBLGdCQUFBLEdBQW1CLE9BQUEsQ0FBUSxZQUFSLENBSm5CLENBQUE7O0FBQUEsRUFNQSxJQUFBLEdBQU8sT0FBQSxDQUFRLGVBQVIsQ0FOUCxDQUFBOztBQUFBLEVBU0EsTUFBTSxDQUFDLE9BQVAsR0FFSTtBQUFBLElBQUEsTUFBQSxFQUlJO0FBQUEsTUFBQSxhQUFBLEVBQ0k7QUFBQSxRQUFBLEtBQUEsRUFBTyxpQkFBUDtBQUFBLFFBQ0EsV0FBQSxFQUFhLGlEQURiO0FBQUEsUUFFQSxJQUFBLEVBQU0sU0FGTjtBQUFBLFFBR0EsU0FBQSxFQUFTLElBSFQ7QUFBQSxRQUlBLEtBQUEsRUFBTyxFQUpQO09BREo7QUFBQSxNQU9BLFlBQUEsRUFDSTtBQUFBLFFBQUEsS0FBQSxFQUFPLG1CQUFQO0FBQUEsUUFDQSxXQUFBLEVBQWEsMERBRGI7QUFBQSxRQUVBLElBQUEsRUFBTSxRQUZOO0FBQUEsUUFHQSxNQUFBLEVBQU0sQ0FBQyw4QkFBRCxFQUFpQyxpQkFBakMsQ0FITjtBQUFBLFFBSUEsU0FBQSxFQUFTLGlCQUpUO0FBQUEsUUFLQSxLQUFBLEVBQU8sRUFMUDtPQVJKO0FBQUEsTUFlQSxlQUFBLEVBQ0k7QUFBQSxRQUFBLEtBQUEsRUFBTyxrQkFB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

//# sourceURL=/Users/nansthomas/.atom/packages/sass-autocompile/lib/sass-autocompile.coffee
