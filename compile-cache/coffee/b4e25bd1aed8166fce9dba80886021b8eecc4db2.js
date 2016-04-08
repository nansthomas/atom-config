(function() {
  "use strict";
  var $, Beautifiers, CompositeDisposable, LoadingView, Promise, async, beautifier, beautify, beautifyDirectory, beautifyFile, beautifyFilePath, debug, defaultLanguageOptions, dir, fs, getCursors, getScrollTop, getUnsupportedOptions, handleSaveEvent, loadingView, logger, path, pkg, plugin, setCursors, setScrollTop, showError, strip, yaml, _;

  pkg = require('../package.json');

  plugin = module.exports;

  CompositeDisposable = require('event-kit').CompositeDisposable;

  _ = require("lodash");

  Beautifiers = require("./beautifiers");

  beautifier = new Beautifiers();

  defaultLanguageOptions = beautifier.options;

  logger = require('./logger')(__filename);

  Promise = require('bluebird');

  fs = null;

  path = require("path");

  strip = null;

  yaml = null;

  async = null;

  dir = null;

  LoadingView = null;

  loadingView = null;

  $ = null;

  getScrollTop = function(editor) {
    var view;
    view = editor.viewRegistry.getView(editor);
    return view.getScrollTop();
  };

  setScrollTop = function(editor, value) {
    var view;
    view = editor.viewRegistry.getView(editor);
    return view.setScrollTop(value);
  };

  getCursors = function(editor) {
    var bufferPosition, cursor, cursors, posArray, _i, _len;
    cursors = editor.getCursors();
    posArray = [];
    for (_i = 0, _len = cursors.length; _i < _len; _i++) {
      cursor = cursors[_i];
      bufferPosition = cursor.getBufferPosition();
      posArray.push([bufferPosition.row, bufferPosition.column]);
    }
    return posArray;
  };

  setCursors = function(editor, posArray) {
    var bufferPosition, i, _i, _len;
    for (i = _i = 0, _len = posArray.length; _i < _len; i = ++_i) {
      bufferPosition = posArray[i];
      if (i === 0) {
        editor.setCursorBufferPosition(bufferPosition);
        continue;
      }
      editor.addCursorAtBufferPosition(bufferPosition);
    }
  };

  beautifier.on('beautify::start', function() {
    if (LoadingView == null) {
      LoadingView = require("./views/loading-view");
    }
    if (loadingView == null) {
      loadingView = new LoadingView();
    }
    return loadingView.show();
  });

  beautifier.on('beautify::end', function() {
    return loadingView != null ? loadingView.hide() : void 0;
  });

  showError = function(error) {
    var detail, stack, _ref;
    if (!atom.config.get("atom-beautify.general.muteAllErrors")) {
      stack = error.stack;
      detail = error.description || error.message;
      return (_ref = atom.notifications) != null ? _ref.addError(error.message, {
        stack: stack,
        detail: detail,
        dismissable: true
      }) : void 0;
    }
  };

  beautify = function(_arg) {
    var allOptions, beautifyCompleted, e, editedFilePath, editor, forceEntireFile, grammarName, isSelection, oldText, onSave, text;
    onSave = _arg.onSave;
    plugin.checkUnsupportedOptions();
    if (path == null) {
      path = require("path");
    }
    forceEntireFile = onSave && atom.config.get("atom-beautify.general.beautifyEntireFileOnSave");
    beautifyCompleted = function(text) {
      var origScrollTop, posArray, selectedBufferRange;
      if (text == null) {

      } else if (text instanceof Error) {
        showError(text);
      } else if (typeof text === "string") {
        if (oldText !== text) {
          posArray = getCursors(editor);
          origScrollTop = getScrollTop(editor);
          if (!forceEntireFile && isSelection) {
            selectedBufferRange = editor.getSelectedBufferRange();
            editor.setTextInBufferRange(selectedBufferRange, text);
          } else {
            editor.setText(text);
          }
          setCursors(editor, posArray);
          setTimeout((function() {
            setScrollTop(editor, origScrollTop);
          }), 0);
        }
      } else {
        showError(new Error("Unsupported beautification result '" + text + "'."));
      }
    };
    editor = atom.workspace.getActiveTextEditor();
    if (editor == null) {
      return showError(new Error("Active Editor not found. ", "Please select a Text Editor first to beautify."));
    }
    isSelection = !!editor.getSelectedText();
    editedFilePath = editor.getPath();
    allOptions = beautifier.getOptionsForPath(editedFilePath, editor);
    text = void 0;
    if (!forceEntireFile && isSelection) {
      text = editor.getSelectedText();
    } else {
      text = editor.getText();
    }
    oldText = text;
    grammarName = editor.getGrammar().name;
    try {
      beautifier.beautify(text, allOptions, grammarName, editedFilePath, {
        onSave: onSave
      }).then(beautifyCompleted)["catch"](beautifyCompleted);
    } catch (_error) {
      e = _error;
      showError(e);
    }
  };

  beautifyFilePath = function(filePath, callback) {
    var $el, cb;
    if ($ == null) {
      $ = require("atom-space-pen-views").$;
    }
    $el = $(".icon-file-text[data-path=\"" + filePath + "\"]");
    $el.addClass('beautifying');
    cb = function(err, result) {
      $el = $(".icon-file-text[data-path=\"" + filePath + "\"]");
      $el.removeClass('beautifying');
      return callback(err, result);
    };
    if (fs == null) {
      fs = require("fs");
    }
    return fs.readFile(filePath, function(err, data) {
      var allOptions, completionFun, e, grammar, grammarName, input;
      if (err) {
        return cb(err);
      }
      input = data != null ? data.toString() : void 0;
      grammar = atom.grammars.selectGrammar(filePath, input);
      grammarName = grammar.name;
      allOptions = beautifier.getOptionsForPath(filePath);
      completionFun = function(output) {
        if (output instanceof Error) {
          return cb(output, null);
        } else if (typeof output === "string") {
          if (output === '') {
            return cb(null, output);
          }
          return fs.writeFile(filePath, output, function(err) {
            if (err) {
              return cb(err);
            }
            return cb(null, output);
          });
        } else {
          return cb(new Error("Unknown beautification result " + output + "."), output);
        }
      };
      try {
        return beautifier.beautify(input, allOptions, grammarName, filePath).then(completionFun)["catch"](completionFun);
      } catch (_error) {
        e = _error;
        return cb(e);
      }
    });
  };

  beautifyFile = function(_arg) {
    var filePath, target;
    target = _arg.target;
    filePath = target.dataset.path;
    if (!filePath) {
      return;
    }
    beautifyFilePath(filePath, function(err, result) {
      if (err) {
        return showError(err);
      }
    });
  };

  beautifyDirectory = function(_arg) {
    var $el, dirPath, target;
    target = _arg.target;
    dirPath = target.dataset.path;
    if (!dirPath) {
      return;
    }
    if ((typeof atom !== "undefined" && atom !== null ? atom.confirm({
      message: "This will beautify all of the files found recursively in this directory, '" + dirPath + "'. Do you want to continue?",
      buttons: ['Yes, continue!', 'No, cancel!']
    }) : void 0) !== 0) {
      return;
    }
    if ($ == null) {
      $ = require("atom-space-pen-views").$;
    }
    $el = $(".icon-file-directory[data-path=\"" + dirPath + "\"]");
    $el.addClass('beautifying');
    if (dir == null) {
      dir = require("node-dir");
    }
    if (async == null) {
      async = require("async");
    }
    dir.files(dirPath, function(err, files) {
      if (err) {
        return showError(err);
      }
      return async.each(files, function(filePath, callback) {
        return beautifyFilePath(filePath, function() {
          return callback();
        });
      }, function(err) {
        $el = $(".icon-file-directory[data-path=\"" + dirPath + "\"]");
        return $el.removeClass('beautifying');
      });
    });
  };

  debug = function() {
    var addHeader, addInfo, allOptions, beautifiers, codeBlockSyntax, debugInfo, editor, filePath, grammarName, headers, language, linkifyTitle, selectedBeautifier, text, tocEl, _ref;
    plugin.checkUnsupportedOptions();
    editor = atom.workspace.getActiveTextEditor();
    linkifyTitle = function(title) {
      var p, sep;
      title = title.toLowerCase();
      p = title.split(/[\s,+#;,\/?:@&=+$]+/);
      sep = "-";
      return p.join(sep);
    };
    if (editor == null) {
      return confirm("Active Editor not found.\n" + "Please select a Text Editor first to beautify.");
    }
    if (!confirm('Are you ready to debug Atom Beautify?\n\n' + 'Warning: This will change your current clipboard contents.')) {
      return;
    }
    debugInfo = "";
    headers = [];
    tocEl = "<TABLEOFCONTENTS/>";
    addInfo = function(key, val) {
      if (key != null) {
        return debugInfo += "**" + key + "**: " + val + "\n\n";
      } else {
        return debugInfo += "" + val + "\n\n";
      }
    };
    addHeader = function(level, title) {
      debugInfo += "" + (Array(level + 1).join('#')) + " " + title + "\n\n";
      return headers.push({
        level: level,
        title: title
      });
    };
    addHeader(1, "Atom Beautify - Debugging information");
    debugInfo += "The following debugging information was " + ("generated by `Atom Beautify` on `" + (new Date()) + "`.") + "\n\n---\n\n" + tocEl + "\n\n---\n\n";
    addInfo('Platform', process.platform);
    addHeader(2, "Versions");
    addInfo('Atom Version', atom.appVersion);
    addInfo('Atom Beautify Version', pkg.version);
    addHeader(2, "Original file to be beautified");
    filePath = editor.getPath();
    addInfo('Original File Path', "`" + filePath + "`");
    grammarName = editor.getGrammar().name;
    addInfo('Original File Grammar', grammarName);
    language = beautifier.getLanguage(grammarName, filePath);
    addInfo('Original File Language', language != null ? language.name : void 0);
    addInfo('Language namespace', language != null ? language.namespace : void 0);
    beautifiers = beautifier.getBeautifiers(language.name);
    addInfo('Supported Beautifiers', _.map(beautifiers, 'name').join(', '));
    selectedBeautifier = beautifier.getBeautifierForLanguage(language);
    addInfo('Selected Beautifier', selectedBeautifier.name);
    text = editor.getText();
    codeBlockSyntax = ((_ref = language != null ? language.name : void 0) != null ? _ref : grammarName).toLowerCase().split(' ')[0];
    addHeader(3, 'Original File Contents');
    addInfo(null, "\n```" + codeBlockSyntax + "\n" + text + "\n```");
    addHeader(3, 'Package Settings');
    addInfo(null, "The raw package settings options\n" + ("```json\n" + (JSON.stringify(atom.config.get('atom-beautify'), void 0, 4)) + "\n```"));
    addHeader(2, "Beautification options");
    allOptions = beautifier.getOptionsForPath(filePath, editor);
    return Promise.all(allOptions).then(function(allOptions) {
      var cb, configOptions, e, editorConfigOptions, editorOptions, finalOptions, homeOptions, logFilePathRegex, logs, preTransformedOptions, projectOptions, subscription;
      editorOptions = allOptions[0], configOptions = allOptions[1], homeOptions = allOptions[2], editorConfigOptions = allOptions[3];
      projectOptions = allOptions.slice(4);
      preTransformedOptions = beautifier.getOptionsForLanguage(allOptions, language);
      if (selectedBeautifier) {
        finalOptions = beautifier.transformOptions(selectedBeautifier, language.name, preTransformedOptions);
      }
      addInfo('Editor Options', "\n" + "Options from Atom Editor settings\n" + ("```json\n" + (JSON.stringify(editorOptions, void 0, 4)) + "\n```"));
      addInfo('Config Options', "\n" + "Options from Atom Beautify package settings\n" + ("```json\n" + (JSON.stringify(configOptions, void 0, 4)) + "\n```"));
      addInfo('Home Options', "\n" + ("Options from `" + (path.resolve(beautifier.getUserHome(), '.jsbeautifyrc')) + "`\n") + ("```json\n" + (JSON.stringify(homeOptions, void 0, 4)) + "\n```"));
      addInfo('EditorConfig Options', "\n" + "Options from [EditorConfig](http://editorconfig.org/) file\n" + ("```json\n" + (JSON.stringify(editorConfigOptions, void 0, 4)) + "\n```"));
      addInfo('Project Options', "\n" + ("Options from `.jsbeautifyrc` files starting from directory `" + (path.dirname(filePath)) + "` and going up to root\n") + ("```json\n" + (JSON.stringify(projectOptions, void 0, 4)) + "\n```"));
      addInfo('Pre-Transformed Options', "\n" + "Combined options before transforming them given a beautifier's specifications\n" + ("```json\n" + (JSON.stringify(preTransformedOptions, void 0, 4)) + "\n```"));
      if (selectedBeautifier) {
        addHeader(3, 'Final Options');
        addInfo(null, "Final combined and transformed options that are used\n" + ("```json\n" + (JSON.stringify(finalOptions, void 0, 4)) + "\n```"));
      }
      logs = "";
      logFilePathRegex = new RegExp('\\: \\[(.*)\\]');
      subscription = logger.onLogging(function(msg) {
        var sep;
        sep = path.sep;
        return logs += msg.replace(logFilePathRegex, function(a, b) {
          var i, p, s;
          s = b.split(sep);
          i = s.indexOf('atom-beautify');
          p = s.slice(i + 2).join(sep);
          return ': [' + p + ']';
        });
      });
      cb = function(result) {
        var JsDiff, bullet, diff, header, indent, indentNum, toc, _i, _len;
        subscription.dispose();
        addHeader(2, "Results");
        addInfo('Beautified File Contents', "\n```" + codeBlockSyntax + "\n" + result + "\n```");
        JsDiff = require('diff');
        diff = JsDiff.createPatch(filePath, text, result, "original", "beautified");
        addInfo('Original vs. Beautified Diff', "\n```" + codeBlockSyntax + "\n" + diff + "\n```");
        addHeader(3, "Logs");
        addInfo(null, "```\n" + logs + "\n```");
        toc = "## Table Of Contents\n";
        for (_i = 0, _len = headers.length; _i < _len; _i++) {
          header = headers[_i];

          /*
          - Heading 1
            - Heading 1.1
           */
          indent = "  ";
          bullet = "-";
          indentNum = header.level - 2;
          if (indentNum >= 0) {
            toc += "" + (Array(indentNum + 1).join(indent)) + bullet + " [" + header.title + "](\#" + (linkifyTitle(header.title)) + ")\n";
          }
        }
        debugInfo = debugInfo.replace(tocEl, toc);
        atom.clipboard.write(debugInfo);
        return confirm('Atom Beautify debugging information is now in your clipboard.\n' + 'You can now paste this into an Issue you are reporting here\n' + 'https://github.com/Glavin001/atom-beautify/issues/\n\n' + 'Please follow the contribution guidelines found at\n' + 'https://github.com/Glavin001/atom-beautify/blob/master/CONTRIBUTING.md\n\n' + 'Warning: Be sure to look over the debug info before you send it, ' + 'to ensure you are not sharing undesirable private information.');
      };
      try {
        return beautifier.beautify(text, allOptions, grammarName, filePath).then(cb)["catch"](cb);
      } catch (_error) {
        e = _error;
        return cb(e);
      }
    });
  };

  handleSaveEvent = function() {
    return atom.workspace.observeTextEditors(function(editor) {
      var buffer, disposable;
      buffer = editor.getBuffer();
      disposable = buffer.onDidSave(function(_arg) {
        var beautifyOnSave, fileExtension, filePath, grammar, key, language, languages, origScrollTop, posArray;
        filePath = _arg.path;
        if (path == null) {
          path = require('path');
        }
        grammar = editor.getGrammar().name;
        fileExtension = path.extname(filePath);
        fileExtension = fileExtension.substr(1);
        languages = beautifier.languages.getLanguages({
          grammar: grammar,
          extension: fileExtension
        });
        if (languages.length < 1) {
          return;
        }
        language = languages[0];
        key = "atom-beautify." + language.namespace + ".beautify_on_save";
        beautifyOnSave = atom.config.get(key);
        logger.verbose('save editor positions', key, beautifyOnSave);
        if (beautifyOnSave) {
          posArray = getCursors(editor);
          origScrollTop = getScrollTop(editor);
          return beautifyFilePath(filePath, function() {
            if (editor.isAlive() === true) {
              buffer.reload();
              logger.verbose('restore editor positions', posArray, origScrollTop);
              return setTimeout((function() {
                setCursors(editor, posArray);
                setScrollTop(editor, origScrollTop);
              }), 0);
            }
          });
        }
      });
      return plugin.subscriptions.add(disposable);
    });
  };

  getUnsupportedOptions = function() {
    var schema, settings, unsupportedOptions;
    settings = atom.config.get('atom-beautify');
    schema = atom.config.getSchema('atom-beautify');
    unsupportedOptions = _.filter(_.keys(settings), function(key) {
      return schema.properties[key] === void 0;
    });
    return unsupportedOptions;
  };

  plugin.checkUnsupportedOptions = function() {
    var unsupportedOptions;
    unsupportedOptions = getUnsupportedOptions();
    if (unsupportedOptions.length !== 0) {
      return atom.notifications.addWarning("You have unsupported options: " + (unsupportedOptions.join(', ')) + " <br> Please run Atom command 'Atom-Beautify: Migrate Settings'.");
    }
  };

  plugin.migrateSettings = function() {
    var namespaces, rename, rex, unsupportedOptions;
    unsupportedOptions = getUnsupportedOptions();
    namespaces = beautifier.languages.namespaces;
    if (unsupportedOptions.length === 0) {
      return atom.notifications.addSuccess("No options to migrate.");
    } else {
      rex = new RegExp("(" + (namespaces.join('|')) + ")_(.*)");
      rename = _.toPairs(_.zipObject(unsupportedOptions, _.map(unsupportedOptions, function(key) {
        var m;
        m = key.match(rex);
        if (m === null) {
          return "general." + key;
        } else {
          return "" + m[1] + "." + m[2];
        }
      })));
      _.each(rename, function(_arg) {
        var key, newKey, val;
        key = _arg[0], newKey = _arg[1];
        val = atom.config.get("atom-beautify." + key);
        atom.config.set("atom-beautify." + newKey, val);
        return atom.config.set("atom-beautify." + key, void 0);
      });
      return atom.notifications.addSuccess("Successfully migrated options: " + (unsupportedOptions.join(', ')));
    }
  };

  plugin.config = _.merge(require('./config.coffee'), defaultLanguageOptions);

  plugin.activate = function() {
    this.subscriptions = new CompositeDisposable;
    this.subscriptions.add(handleSaveEvent());
    this.subscriptions.add(atom.commands.add("atom-workspace", "atom-beautify:beautify-editor", beautify));
    this.subscriptions.add(atom.commands.add("atom-workspace", "atom-beautify:help-debug-editor", debug));
    this.subscriptions.add(atom.commands.add(".tree-view .file .name", "atom-beautify:beautify-file", beautifyFile));
    this.subscriptions.add(atom.commands.add(".tree-view .directory .name", "atom-beautify:beautify-directory", beautifyDirectory));
    return this.subscriptions.add(atom.commands.add("atom-workspace", "atom-beautify:migrate-settings", plugin.migrateSettings));
  };

  plugin.deactivate = function() {
    return this.subscriptions.dispose();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvYXRvbS1iZWF1dGlmeS9zcmMvYmVhdXRpZnkuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQ0E7QUFBQSxFQUFBLFlBQUEsQ0FBQTtBQUFBLE1BQUEsZ1ZBQUE7O0FBQUEsRUFDQSxHQUFBLEdBQU0sT0FBQSxDQUFRLGlCQUFSLENBRE4sQ0FBQTs7QUFBQSxFQUlBLE1BQUEsR0FBUyxNQUFNLENBQUMsT0FKaEIsQ0FBQTs7QUFBQSxFQUtDLHNCQUF1QixPQUFBLENBQVEsV0FBUixFQUF2QixtQkFMRCxDQUFBOztBQUFBLEVBTUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBTkosQ0FBQTs7QUFBQSxFQU9BLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUixDQVBkLENBQUE7O0FBQUEsRUFRQSxVQUFBLEdBQWlCLElBQUEsV0FBQSxDQUFBLENBUmpCLENBQUE7O0FBQUEsRUFTQSxzQkFBQSxHQUF5QixVQUFVLENBQUMsT0FUcEMsQ0FBQTs7QUFBQSxFQVVBLE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUixDQUFBLENBQW9CLFVBQXBCLENBVlQsQ0FBQTs7QUFBQSxFQVdBLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUixDQVhWLENBQUE7O0FBQUEsRUFjQSxFQUFBLEdBQUssSUFkTCxDQUFBOztBQUFBLEVBZUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSLENBZlAsQ0FBQTs7QUFBQSxFQWdCQSxLQUFBLEdBQVEsSUFoQlIsQ0FBQTs7QUFBQSxFQWlCQSxJQUFBLEdBQU8sSUFqQlAsQ0FBQTs7QUFBQSxFQWtCQSxLQUFBLEdBQVEsSUFsQlIsQ0FBQTs7QUFBQSxFQW1CQSxHQUFBLEdBQU0sSUFuQk4sQ0FBQTs7QUFBQSxFQW9CQSxXQUFBLEdBQWMsSUFwQmQsQ0FBQTs7QUFBQSxFQXFCQSxXQUFBLEdBQWMsSUFyQmQsQ0FBQTs7QUFBQSxFQXNCQSxDQUFBLEdBQUksSUF0QkosQ0FBQTs7QUFBQSxFQTRCQSxZQUFBLEdBQWUsU0FBQyxNQUFELEdBQUE7QUFDYixRQUFBLElBQUE7QUFBQSxJQUFBLElBQUEsR0FBTyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQXBCLENBQTRCLE1BQTVCLENBQVAsQ0FBQTtXQUNBLElBQUksQ0FBQyxZQUFMLENBQUEsRUFGYTtFQUFBLENBNUJmLENBQUE7O0FBQUEsRUErQkEsWUFBQSxHQUFlLFNBQUMsTUFBRCxFQUFTLEtBQVQsR0FBQTtBQUNiLFFBQUEsSUFBQTtBQUFBLElBQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBcEIsQ0FBNEIsTUFBNUIsQ0FBUCxDQUFBO1dBQ0EsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsS0FBbEIsRUFGYTtFQUFBLENBL0JmLENBQUE7O0FBQUEsRUFtQ0EsVUFBQSxHQUFhLFNBQUMsTUFBRCxHQUFBO0FBQ1gsUUFBQSxtREFBQTtBQUFBLElBQUEsT0FBQSxHQUFVLE1BQU0sQ0FBQyxVQUFQLENBQUEsQ0FBVixDQUFBO0FBQUEsSUFDQSxRQUFBLEdBQVcsRUFEWCxDQUFBO0FBRUEsU0FBQSw4Q0FBQTsyQkFBQTtBQUNFLE1BQUEsY0FBQSxHQUFpQixNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUFqQixDQUFBO0FBQUEsTUFDQSxRQUFRLENBQUMsSUFBVCxDQUFjLENBQ1osY0FBYyxDQUFDLEdBREgsRUFFWixjQUFjLENBQUMsTUFGSCxDQUFkLENBREEsQ0FERjtBQUFBLEtBRkE7V0FRQSxTQVRXO0VBQUEsQ0FuQ2IsQ0FBQTs7QUFBQSxFQTZDQSxVQUFBLEdBQWEsU0FBQyxNQUFELEVBQVMsUUFBVCxHQUFBO0FBR1gsUUFBQSwyQkFBQTtBQUFBLFNBQUEsdURBQUE7bUNBQUE7QUFDRSxNQUFBLElBQUcsQ0FBQSxLQUFLLENBQVI7QUFDRSxRQUFBLE1BQU0sQ0FBQyx1QkFBUCxDQUErQixjQUEvQixDQUFBLENBQUE7QUFDQSxpQkFGRjtPQUFBO0FBQUEsTUFHQSxNQUFNLENBQUMseUJBQVAsQ0FBaUMsY0FBakMsQ0FIQSxDQURGO0FBQUEsS0FIVztFQUFBLENBN0NiLENBQUE7O0FBQUEsRUF3REEsVUFBVSxDQUFDLEVBQVgsQ0FBYyxpQkFBZCxFQUFpQyxTQUFBLEdBQUE7O01BQy9CLGNBQWUsT0FBQSxDQUFRLHNCQUFSO0tBQWY7O01BQ0EsY0FBbUIsSUFBQSxXQUFBLENBQUE7S0FEbkI7V0FFQSxXQUFXLENBQUMsSUFBWixDQUFBLEVBSCtCO0VBQUEsQ0FBakMsQ0F4REEsQ0FBQTs7QUFBQSxFQTZEQSxVQUFVLENBQUMsRUFBWCxDQUFjLGVBQWQsRUFBK0IsU0FBQSxHQUFBO2lDQUM3QixXQUFXLENBQUUsSUFBYixDQUFBLFdBRDZCO0VBQUEsQ0FBL0IsQ0E3REEsQ0FBQTs7QUFBQSxFQWlFQSxTQUFBLEdBQVksU0FBQyxLQUFELEdBQUE7QUFDVixRQUFBLG1CQUFBO0FBQUEsSUFBQSxJQUFHLENBQUEsSUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHFDQUFoQixDQUFQO0FBRUUsTUFBQSxLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQWQsQ0FBQTtBQUFBLE1BQ0EsTUFBQSxHQUFTLEtBQUssQ0FBQyxXQUFOLElBQXFCLEtBQUssQ0FBQyxPQURwQyxDQUFBO3VEQUVrQixDQUFFLFFBQXBCLENBQTZCLEtBQUssQ0FBQyxPQUFuQyxFQUE0QztBQUFBLFFBQzFDLE9BQUEsS0FEMEM7QUFBQSxRQUNuQyxRQUFBLE1BRG1DO0FBQUEsUUFDM0IsV0FBQSxFQUFjLElBRGE7T0FBNUMsV0FKRjtLQURVO0VBQUEsQ0FqRVosQ0FBQTs7QUFBQSxFQXlFQSxRQUFBLEdBQVcsU0FBQyxJQUFELEdBQUE7QUFFVCxRQUFBLDBIQUFBO0FBQUEsSUFGVyxTQUFELEtBQUMsTUFFWCxDQUFBO0FBQUEsSUFBQSxNQUFNLENBQUMsdUJBQVAsQ0FBQSxDQUFBLENBQUE7O01BR0EsT0FBUSxPQUFBLENBQVEsTUFBUjtLQUhSO0FBQUEsSUFJQSxlQUFBLEdBQWtCLE1BQUEsSUFBVyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsZ0RBQWhCLENBSjdCLENBQUE7QUFBQSxJQWVBLGlCQUFBLEdBQW9CLFNBQUMsSUFBRCxHQUFBO0FBRWxCLFVBQUEsNENBQUE7QUFBQSxNQUFBLElBQU8sWUFBUDtBQUFBO09BQUEsTUFHSyxJQUFHLElBQUEsWUFBZ0IsS0FBbkI7QUFDSCxRQUFBLFNBQUEsQ0FBVSxJQUFWLENBQUEsQ0FERztPQUFBLE1BRUEsSUFBRyxNQUFBLENBQUEsSUFBQSxLQUFlLFFBQWxCO0FBQ0gsUUFBQSxJQUFHLE9BQUEsS0FBYSxJQUFoQjtBQUdFLFVBQUEsUUFBQSxHQUFXLFVBQUEsQ0FBVyxNQUFYLENBQVgsQ0FBQTtBQUFBLFVBR0EsYUFBQSxHQUFnQixZQUFBLENBQWEsTUFBYixDQUhoQixDQUFBO0FBTUEsVUFBQSxJQUFHLENBQUEsZUFBQSxJQUF3QixXQUEzQjtBQUNFLFlBQUEsbUJBQUEsR0FBc0IsTUFBTSxDQUFDLHNCQUFQLENBQUEsQ0FBdEIsQ0FBQTtBQUFBLFlBR0EsTUFBTSxDQUFDLG9CQUFQLENBQTRCLG1CQUE1QixFQUFpRCxJQUFqRCxDQUhBLENBREY7V0FBQSxNQUFBO0FBUUUsWUFBQSxNQUFNLENBQUMsT0FBUCxDQUFlLElBQWYsQ0FBQSxDQVJGO1dBTkE7QUFBQSxVQWlCQSxVQUFBLENBQVcsTUFBWCxFQUFtQixRQUFuQixDQWpCQSxDQUFBO0FBQUEsVUF1QkEsVUFBQSxDQUFXLENBQUUsU0FBQSxHQUFBO0FBR1gsWUFBQSxZQUFBLENBQWEsTUFBYixFQUFxQixhQUFyQixDQUFBLENBSFc7VUFBQSxDQUFGLENBQVgsRUFLRyxDQUxILENBdkJBLENBSEY7U0FERztPQUFBLE1BQUE7QUFrQ0gsUUFBQSxTQUFBLENBQWUsSUFBQSxLQUFBLENBQU8scUNBQUEsR0FBcUMsSUFBckMsR0FBMEMsSUFBakQsQ0FBZixDQUFBLENBbENHO09BUGE7SUFBQSxDQWZwQixDQUFBO0FBQUEsSUFpRUEsTUFBQSxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQSxDQWpFVCxDQUFBO0FBcUVBLElBQUEsSUFBTyxjQUFQO0FBQ0UsYUFBTyxTQUFBLENBQWUsSUFBQSxLQUFBLENBQU0sMkJBQU4sRUFDcEIsZ0RBRG9CLENBQWYsQ0FBUCxDQURGO0tBckVBO0FBQUEsSUF3RUEsV0FBQSxHQUFjLENBQUEsQ0FBQyxNQUFPLENBQUMsZUFBUCxDQUFBLENBeEVoQixDQUFBO0FBQUEsSUE0RUEsY0FBQSxHQUFpQixNQUFNLENBQUMsT0FBUCxDQUFBLENBNUVqQixDQUFBO0FBQUEsSUFnRkEsVUFBQSxHQUFhLFVBQVUsQ0FBQyxpQkFBWCxDQUE2QixjQUE3QixFQUE2QyxNQUE3QyxDQWhGYixDQUFBO0FBQUEsSUFvRkEsSUFBQSxHQUFPLE1BcEZQLENBQUE7QUFxRkEsSUFBQSxJQUFHLENBQUEsZUFBQSxJQUF3QixXQUEzQjtBQUNFLE1BQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxlQUFQLENBQUEsQ0FBUCxDQURGO0tBQUEsTUFBQTtBQUdFLE1BQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBUCxDQUhGO0tBckZBO0FBQUEsSUF5RkEsT0FBQSxHQUFVLElBekZWLENBQUE7QUFBQSxJQTZGQSxXQUFBLEdBQWMsTUFBTSxDQUFDLFVBQVAsQ0FBQSxDQUFtQixDQUFDLElBN0ZsQyxDQUFBO0FBaUdBO0FBQ0UsTUFBQSxVQUFVLENBQUMsUUFBWCxDQUFvQixJQUFwQixFQUEwQixVQUExQixFQUFzQyxXQUF0QyxFQUFtRCxjQUFuRCxFQUFtRTtBQUFBLFFBQUEsTUFBQSxFQUFTLE1BQVQ7T0FBbkUsQ0FDQSxDQUFDLElBREQsQ0FDTSxpQkFETixDQUVBLENBQUMsT0FBRCxDQUZBLENBRU8saUJBRlAsQ0FBQSxDQURGO0tBQUEsY0FBQTtBQUtFLE1BREksVUFDSixDQUFBO0FBQUEsTUFBQSxTQUFBLENBQVUsQ0FBVixDQUFBLENBTEY7S0FuR1M7RUFBQSxDQXpFWCxDQUFBOztBQUFBLEVBb0xBLGdCQUFBLEdBQW1CLFNBQUMsUUFBRCxFQUFXLFFBQVgsR0FBQTtBQUdqQixRQUFBLE9BQUE7O01BQUEsSUFBSyxPQUFBLENBQVEsc0JBQVIsQ0FBK0IsQ0FBQztLQUFyQztBQUFBLElBQ0EsR0FBQSxHQUFNLENBQUEsQ0FBRyw4QkFBQSxHQUE4QixRQUE5QixHQUF1QyxLQUExQyxDQUROLENBQUE7QUFBQSxJQUVBLEdBQUcsQ0FBQyxRQUFKLENBQWEsYUFBYixDQUZBLENBQUE7QUFBQSxJQUtBLEVBQUEsR0FBSyxTQUFDLEdBQUQsRUFBTSxNQUFOLEdBQUE7QUFDSCxNQUFBLEdBQUEsR0FBTSxDQUFBLENBQUcsOEJBQUEsR0FBOEIsUUFBOUIsR0FBdUMsS0FBMUMsQ0FBTixDQUFBO0FBQUEsTUFDQSxHQUFHLENBQUMsV0FBSixDQUFnQixhQUFoQixDQURBLENBQUE7QUFFQSxhQUFPLFFBQUEsQ0FBUyxHQUFULEVBQWMsTUFBZCxDQUFQLENBSEc7SUFBQSxDQUxMLENBQUE7O01BV0EsS0FBTSxPQUFBLENBQVEsSUFBUjtLQVhOO1dBWUEsRUFBRSxDQUFDLFFBQUgsQ0FBWSxRQUFaLEVBQXNCLFNBQUMsR0FBRCxFQUFNLElBQU4sR0FBQTtBQUNwQixVQUFBLHlEQUFBO0FBQUEsTUFBQSxJQUFrQixHQUFsQjtBQUFBLGVBQU8sRUFBQSxDQUFHLEdBQUgsQ0FBUCxDQUFBO09BQUE7QUFBQSxNQUNBLEtBQUEsa0JBQVEsSUFBSSxDQUFFLFFBQU4sQ0FBQSxVQURSLENBQUE7QUFBQSxNQUVBLE9BQUEsR0FBVSxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWQsQ0FBNEIsUUFBNUIsRUFBc0MsS0FBdEMsQ0FGVixDQUFBO0FBQUEsTUFHQSxXQUFBLEdBQWMsT0FBTyxDQUFDLElBSHRCLENBQUE7QUFBQSxNQU1BLFVBQUEsR0FBYSxVQUFVLENBQUMsaUJBQVgsQ0FBNkIsUUFBN0IsQ0FOYixDQUFBO0FBQUEsTUFTQSxhQUFBLEdBQWdCLFNBQUMsTUFBRCxHQUFBO0FBQ2QsUUFBQSxJQUFHLE1BQUEsWUFBa0IsS0FBckI7QUFDRSxpQkFBTyxFQUFBLENBQUcsTUFBSCxFQUFXLElBQVgsQ0FBUCxDQURGO1NBQUEsTUFFSyxJQUFHLE1BQUEsQ0FBQSxNQUFBLEtBQWlCLFFBQXBCO0FBRUgsVUFBQSxJQUEyQixNQUFBLEtBQVUsRUFBckM7QUFBQSxtQkFBTyxFQUFBLENBQUcsSUFBSCxFQUFTLE1BQVQsQ0FBUCxDQUFBO1dBQUE7aUJBRUEsRUFBRSxDQUFDLFNBQUgsQ0FBYSxRQUFiLEVBQXVCLE1BQXZCLEVBQStCLFNBQUMsR0FBRCxHQUFBO0FBQzdCLFlBQUEsSUFBa0IsR0FBbEI7QUFBQSxxQkFBTyxFQUFBLENBQUcsR0FBSCxDQUFQLENBQUE7YUFBQTtBQUNBLG1CQUFPLEVBQUEsQ0FBSSxJQUFKLEVBQVcsTUFBWCxDQUFQLENBRjZCO1VBQUEsQ0FBL0IsRUFKRztTQUFBLE1BQUE7QUFTSCxpQkFBTyxFQUFBLENBQVEsSUFBQSxLQUFBLENBQU8sZ0NBQUEsR0FBZ0MsTUFBaEMsR0FBdUMsR0FBOUMsQ0FBUixFQUEyRCxNQUEzRCxDQUFQLENBVEc7U0FIUztNQUFBLENBVGhCLENBQUE7QUFzQkE7ZUFDRSxVQUFVLENBQUMsUUFBWCxDQUFvQixLQUFwQixFQUEyQixVQUEzQixFQUF1QyxXQUF2QyxFQUFvRCxRQUFwRCxDQUNBLENBQUMsSUFERCxDQUNNLGFBRE4sQ0FFQSxDQUFDLE9BQUQsQ0FGQSxDQUVPLGFBRlAsRUFERjtPQUFBLGNBQUE7QUFLRSxRQURJLFVBQ0osQ0FBQTtBQUFBLGVBQU8sRUFBQSxDQUFHLENBQUgsQ0FBUCxDQUxGO09BdkJvQjtJQUFBLENBQXRCLEVBZmlCO0VBQUEsQ0FwTG5CLENBQUE7O0FBQUEsRUFrT0EsWUFBQSxHQUFlLFNBQUMsSUFBRCxHQUFBO0FBQ2IsUUFBQSxnQkFBQTtBQUFBLElBRGUsU0FBRCxLQUFDLE1BQ2YsQ0FBQTtBQUFBLElBQUEsUUFBQSxHQUFXLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBMUIsQ0FBQTtBQUNBLElBQUEsSUFBQSxDQUFBLFFBQUE7QUFBQSxZQUFBLENBQUE7S0FEQTtBQUFBLElBRUEsZ0JBQUEsQ0FBaUIsUUFBakIsRUFBMkIsU0FBQyxHQUFELEVBQU0sTUFBTixHQUFBO0FBQ3pCLE1BQUEsSUFBeUIsR0FBekI7QUFBQSxlQUFPLFNBQUEsQ0FBVSxHQUFWLENBQVAsQ0FBQTtPQUR5QjtJQUFBLENBQTNCLENBRkEsQ0FEYTtFQUFBLENBbE9mLENBQUE7O0FBQUEsRUEyT0EsaUJBQUEsR0FBb0IsU0FBQyxJQUFELEdBQUE7QUFDbEIsUUFBQSxvQkFBQTtBQUFBLElBRG9CLFNBQUQsS0FBQyxNQUNwQixDQUFBO0FBQUEsSUFBQSxPQUFBLEdBQVUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUF6QixDQUFBO0FBQ0EsSUFBQSxJQUFBLENBQUEsT0FBQTtBQUFBLFlBQUEsQ0FBQTtLQURBO0FBR0EsSUFBQSxvREFBVSxJQUFJLENBQUUsT0FBTixDQUNSO0FBQUEsTUFBQSxPQUFBLEVBQVUsNEVBQUEsR0FDNEIsT0FENUIsR0FDb0MsNkJBRDlDO0FBQUEsTUFHQSxPQUFBLEVBQVMsQ0FBQyxnQkFBRCxFQUFrQixhQUFsQixDQUhUO0tBRFEsV0FBQSxLQUl3QyxDQUpsRDtBQUFBLFlBQUEsQ0FBQTtLQUhBOztNQVVBLElBQUssT0FBQSxDQUFRLHNCQUFSLENBQStCLENBQUM7S0FWckM7QUFBQSxJQVdBLEdBQUEsR0FBTSxDQUFBLENBQUcsbUNBQUEsR0FBbUMsT0FBbkMsR0FBMkMsS0FBOUMsQ0FYTixDQUFBO0FBQUEsSUFZQSxHQUFHLENBQUMsUUFBSixDQUFhLGFBQWIsQ0FaQSxDQUFBOztNQWVBLE1BQU8sT0FBQSxDQUFRLFVBQVI7S0FmUDs7TUFnQkEsUUFBUyxPQUFBLENBQVEsT0FBUjtLQWhCVDtBQUFBLElBaUJBLEdBQUcsQ0FBQyxLQUFKLENBQVUsT0FBVixFQUFtQixTQUFDLEdBQUQsRUFBTSxLQUFOLEdBQUE7QUFDakIsTUFBQSxJQUF5QixHQUF6QjtBQUFBLGVBQU8sU0FBQSxDQUFVLEdBQVYsQ0FBUCxDQUFBO09BQUE7YUFFQSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsRUFBa0IsU0FBQyxRQUFELEVBQVcsUUFBWCxHQUFBO2VBRWhCLGdCQUFBLENBQWlCLFFBQWpCLEVBQTJCLFNBQUEsR0FBQTtpQkFBRyxRQUFBLENBQUEsRUFBSDtRQUFBLENBQTNCLEVBRmdCO01BQUEsQ0FBbEIsRUFHRSxTQUFDLEdBQUQsR0FBQTtBQUNBLFFBQUEsR0FBQSxHQUFNLENBQUEsQ0FBRyxtQ0FBQSxHQUFtQyxPQUFuQyxHQUEyQyxLQUE5QyxDQUFOLENBQUE7ZUFDQSxHQUFHLENBQUMsV0FBSixDQUFnQixhQUFoQixFQUZBO01BQUEsQ0FIRixFQUhpQjtJQUFBLENBQW5CLENBakJBLENBRGtCO0VBQUEsQ0EzT3BCLENBQUE7O0FBQUEsRUEyUUEsS0FBQSxHQUFRLFNBQUEsR0FBQTtBQUVOLFFBQUEsOEtBQUE7QUFBQSxJQUFBLE1BQU0sQ0FBQyx1QkFBUCxDQUFBLENBQUEsQ0FBQTtBQUFBLElBR0EsTUFBQSxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQSxDQUhULENBQUE7QUFBQSxJQUtBLFlBQUEsR0FBZSxTQUFDLEtBQUQsR0FBQTtBQUNiLFVBQUEsTUFBQTtBQUFBLE1BQUEsS0FBQSxHQUFRLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FBUixDQUFBO0FBQUEsTUFDQSxDQUFBLEdBQUksS0FBSyxDQUFDLEtBQU4sQ0FBWSxxQkFBWixDQURKLENBQUE7QUFBQSxNQUVBLEdBQUEsR0FBTSxHQUZOLENBQUE7YUFHQSxDQUFDLENBQUMsSUFBRixDQUFPLEdBQVAsRUFKYTtJQUFBLENBTGYsQ0FBQTtBQVlBLElBQUEsSUFBTyxjQUFQO0FBQ0UsYUFBTyxPQUFBLENBQVEsNEJBQUEsR0FDZixnREFETyxDQUFQLENBREY7S0FaQTtBQWVBLElBQUEsSUFBQSxDQUFBLE9BQWMsQ0FBUSwyQ0FBQSxHQUN0Qiw0REFEYyxDQUFkO0FBQUEsWUFBQSxDQUFBO0tBZkE7QUFBQSxJQWlCQSxTQUFBLEdBQVksRUFqQlosQ0FBQTtBQUFBLElBa0JBLE9BQUEsR0FBVSxFQWxCVixDQUFBO0FBQUEsSUFtQkEsS0FBQSxHQUFRLG9CQW5CUixDQUFBO0FBQUEsSUFvQkEsT0FBQSxHQUFVLFNBQUMsR0FBRCxFQUFNLEdBQU4sR0FBQTtBQUNSLE1BQUEsSUFBRyxXQUFIO2VBQ0UsU0FBQSxJQUFjLElBQUEsR0FBSSxHQUFKLEdBQVEsTUFBUixHQUFjLEdBQWQsR0FBa0IsT0FEbEM7T0FBQSxNQUFBO2VBR0UsU0FBQSxJQUFhLEVBQUEsR0FBRyxHQUFILEdBQU8sT0FIdEI7T0FEUTtJQUFBLENBcEJWLENBQUE7QUFBQSxJQXlCQSxTQUFBLEdBQVksU0FBQyxLQUFELEVBQVEsS0FBUixHQUFBO0FBQ1YsTUFBQSxTQUFBLElBQWEsRUFBQSxHQUFFLENBQUMsS0FBQSxDQUFNLEtBQUEsR0FBTSxDQUFaLENBQWMsQ0FBQyxJQUFmLENBQW9CLEdBQXBCLENBQUQsQ0FBRixHQUE0QixHQUE1QixHQUErQixLQUEvQixHQUFxQyxNQUFsRCxDQUFBO2FBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYTtBQUFBLFFBQ1gsT0FBQSxLQURXO0FBQUEsUUFDSixPQUFBLEtBREk7T0FBYixFQUZVO0lBQUEsQ0F6QlosQ0FBQTtBQUFBLElBOEJBLFNBQUEsQ0FBVSxDQUFWLEVBQWEsdUNBQWIsQ0E5QkEsQ0FBQTtBQUFBLElBK0JBLFNBQUEsSUFBYSwwQ0FBQSxHQUNiLENBQUMsbUNBQUEsR0FBa0MsQ0FBSyxJQUFBLElBQUEsQ0FBQSxDQUFMLENBQWxDLEdBQThDLElBQS9DLENBRGEsR0FFYixhQUZhLEdBR2IsS0FIYSxHQUliLGFBbkNBLENBQUE7QUFBQSxJQXNDQSxPQUFBLENBQVEsVUFBUixFQUFvQixPQUFPLENBQUMsUUFBNUIsQ0F0Q0EsQ0FBQTtBQUFBLElBdUNBLFNBQUEsQ0FBVSxDQUFWLEVBQWEsVUFBYixDQXZDQSxDQUFBO0FBQUEsSUEyQ0EsT0FBQSxDQUFRLGNBQVIsRUFBd0IsSUFBSSxDQUFDLFVBQTdCLENBM0NBLENBQUE7QUFBQSxJQStDQSxPQUFBLENBQVEsdUJBQVIsRUFBaUMsR0FBRyxDQUFDLE9BQXJDLENBL0NBLENBQUE7QUFBQSxJQWdEQSxTQUFBLENBQVUsQ0FBVixFQUFhLGdDQUFiLENBaERBLENBQUE7QUFBQSxJQXNEQSxRQUFBLEdBQVcsTUFBTSxDQUFDLE9BQVAsQ0FBQSxDQXREWCxDQUFBO0FBQUEsSUF5REEsT0FBQSxDQUFRLG9CQUFSLEVBQStCLEdBQUEsR0FBRyxRQUFILEdBQVksR0FBM0MsQ0F6REEsQ0FBQTtBQUFBLElBNERBLFdBQUEsR0FBYyxNQUFNLENBQUMsVUFBUCxDQUFBLENBQW1CLENBQUMsSUE1RGxDLENBQUE7QUFBQSxJQStEQSxPQUFBLENBQVEsdUJBQVIsRUFBaUMsV0FBakMsQ0EvREEsQ0FBQTtBQUFBLElBa0VBLFFBQUEsR0FBVyxVQUFVLENBQUMsV0FBWCxDQUF1QixXQUF2QixFQUFvQyxRQUFwQyxDQWxFWCxDQUFBO0FBQUEsSUFtRUEsT0FBQSxDQUFRLHdCQUFSLHFCQUFrQyxRQUFRLENBQUUsYUFBNUMsQ0FuRUEsQ0FBQTtBQUFBLElBb0VBLE9BQUEsQ0FBUSxvQkFBUixxQkFBOEIsUUFBUSxDQUFFLGtCQUF4QyxDQXBFQSxDQUFBO0FBQUEsSUF1RUEsV0FBQSxHQUFjLFVBQVUsQ0FBQyxjQUFYLENBQTBCLFFBQVEsQ0FBQyxJQUFuQyxDQXZFZCxDQUFBO0FBQUEsSUF3RUEsT0FBQSxDQUFRLHVCQUFSLEVBQWlDLENBQUMsQ0FBQyxHQUFGLENBQU0sV0FBTixFQUFtQixNQUFuQixDQUEwQixDQUFDLElBQTNCLENBQWdDLElBQWhDLENBQWpDLENBeEVBLENBQUE7QUFBQSxJQXlFQSxrQkFBQSxHQUFxQixVQUFVLENBQUMsd0JBQVgsQ0FBb0MsUUFBcEMsQ0F6RXJCLENBQUE7QUFBQSxJQTBFQSxPQUFBLENBQVEscUJBQVIsRUFBK0Isa0JBQWtCLENBQUMsSUFBbEQsQ0ExRUEsQ0FBQTtBQUFBLElBNkVBLElBQUEsR0FBTyxNQUFNLENBQUMsT0FBUCxDQUFBLENBN0VQLENBQUE7QUFBQSxJQWdGQSxlQUFBLEdBQWtCLHFFQUFrQixXQUFsQixDQUE4QixDQUFDLFdBQS9CLENBQUEsQ0FBNEMsQ0FBQyxLQUE3QyxDQUFtRCxHQUFuRCxDQUF3RCxDQUFBLENBQUEsQ0FoRjFFLENBQUE7QUFBQSxJQWlGQSxTQUFBLENBQVUsQ0FBVixFQUFhLHdCQUFiLENBakZBLENBQUE7QUFBQSxJQWtGQSxPQUFBLENBQVEsSUFBUixFQUFlLE9BQUEsR0FBTyxlQUFQLEdBQXVCLElBQXZCLEdBQTJCLElBQTNCLEdBQWdDLE9BQS9DLENBbEZBLENBQUE7QUFBQSxJQW9GQSxTQUFBLENBQVUsQ0FBVixFQUFhLGtCQUFiLENBcEZBLENBQUE7QUFBQSxJQXFGQSxPQUFBLENBQVEsSUFBUixFQUNFLG9DQUFBLEdBQ0EsQ0FBQyxXQUFBLEdBQVUsQ0FBQyxJQUFJLENBQUMsU0FBTCxDQUFlLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixlQUFoQixDQUFmLEVBQWlELE1BQWpELEVBQTRELENBQTVELENBQUQsQ0FBVixHQUEwRSxPQUEzRSxDQUZGLENBckZBLENBQUE7QUFBQSxJQTBGQSxTQUFBLENBQVUsQ0FBVixFQUFhLHdCQUFiLENBMUZBLENBQUE7QUFBQSxJQTRGQSxVQUFBLEdBQWEsVUFBVSxDQUFDLGlCQUFYLENBQTZCLFFBQTdCLEVBQXVDLE1BQXZDLENBNUZiLENBQUE7V0E4RkEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxVQUFaLENBQ0EsQ0FBQyxJQURELENBQ00sU0FBQyxVQUFELEdBQUE7QUFFSixVQUFBLGdLQUFBO0FBQUEsTUFDSSw2QkFESixFQUVJLDZCQUZKLEVBR0ksMkJBSEosRUFJSSxtQ0FKSixDQUFBO0FBQUEsTUFNQSxjQUFBLEdBQWlCLFVBQVcsU0FONUIsQ0FBQTtBQUFBLE1BUUEscUJBQUEsR0FBd0IsVUFBVSxDQUFDLHFCQUFYLENBQWlDLFVBQWpDLEVBQTZDLFFBQTdDLENBUnhCLENBQUE7QUFVQSxNQUFBLElBQUcsa0JBQUg7QUFDRSxRQUFBLFlBQUEsR0FBZSxVQUFVLENBQUMsZ0JBQVgsQ0FBNEIsa0JBQTVCLEVBQWdELFFBQVEsQ0FBQyxJQUF6RCxFQUErRCxxQkFBL0QsQ0FBZixDQURGO09BVkE7QUFBQSxNQWlCQSxPQUFBLENBQVEsZ0JBQVIsRUFBMEIsSUFBQSxHQUMxQixxQ0FEMEIsR0FFMUIsQ0FBQyxXQUFBLEdBQVUsQ0FBQyxJQUFJLENBQUMsU0FBTCxDQUFlLGFBQWYsRUFBOEIsTUFBOUIsRUFBeUMsQ0FBekMsQ0FBRCxDQUFWLEdBQXVELE9BQXhELENBRkEsQ0FqQkEsQ0FBQTtBQUFBLE1Bb0JBLE9BQUEsQ0FBUSxnQkFBUixFQUEwQixJQUFBLEdBQzFCLCtDQUQwQixHQUUxQixDQUFDLFdBQUEsR0FBVSxDQUFDLElBQUksQ0FBQyxTQUFMLENBQWUsYUFBZixFQUE4QixNQUE5QixFQUF5QyxDQUF6QyxDQUFELENBQVYsR0FBdUQsT0FBeEQsQ0FGQSxDQXBCQSxDQUFBO0FBQUEsTUF1QkEsT0FBQSxDQUFRLGNBQVIsRUFBd0IsSUFBQSxHQUN4QixDQUFDLGdCQUFBLEdBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTCxDQUFhLFVBQVUsQ0FBQyxXQUFYLENBQUEsQ0FBYixFQUF1QyxlQUF2QyxDQUFELENBQWYsR0FBd0UsS0FBekUsQ0FEd0IsR0FFeEIsQ0FBQyxXQUFBLEdBQVUsQ0FBQyxJQUFJLENBQUMsU0FBTCxDQUFlLFdBQWYsRUFBNEIsTUFBNUIsRUFBdUMsQ0FBdkMsQ0FBRCxDQUFWLEdBQXFELE9BQXRELENBRkEsQ0F2QkEsQ0FBQTtBQUFBLE1BMEJBLE9BQUEsQ0FBUSxzQkFBUixFQUFnQyxJQUFBLEdBQ2hDLDhEQURnQyxHQUVoQyxDQUFDLFdBQUEsR0FBVSxDQUFDLElBQUksQ0FBQyxTQUFMLENBQWUsbUJBQWYsRUFBb0MsTUFBcEMsRUFBK0MsQ0FBL0MsQ0FBRCxDQUFWLEdBQTZELE9BQTlELENBRkEsQ0ExQkEsQ0FBQTtBQUFBLE1BNkJBLE9BQUEsQ0FBUSxpQkFBUixFQUEyQixJQUFBLEdBQzNCLENBQUMsOERBQUEsR0FBNkQsQ0FBQyxJQUFJLENBQUMsT0FBTCxDQUFhLFFBQWIsQ0FBRCxDQUE3RCxHQUFxRiwwQkFBdEYsQ0FEMkIsR0FFM0IsQ0FBQyxXQUFBLEdBQVUsQ0FBQyxJQUFJLENBQUMsU0FBTCxDQUFlLGNBQWYsRUFBK0IsTUFBL0IsRUFBMEMsQ0FBMUMsQ0FBRCxDQUFWLEdBQXdELE9BQXpELENBRkEsQ0E3QkEsQ0FBQTtBQUFBLE1BZ0NBLE9BQUEsQ0FBUSx5QkFBUixFQUFtQyxJQUFBLEdBQ25DLGlGQURtQyxHQUVuQyxDQUFDLFdBQUEsR0FBVSxDQUFDLElBQUksQ0FBQyxTQUFMLENBQWUscUJBQWYsRUFBc0MsTUFBdEMsRUFBaUQsQ0FBakQsQ0FBRCxDQUFWLEdBQStELE9BQWhFLENBRkEsQ0FoQ0EsQ0FBQTtBQW1DQSxNQUFBLElBQUcsa0JBQUg7QUFDRSxRQUFBLFNBQUEsQ0FBVSxDQUFWLEVBQWEsZUFBYixDQUFBLENBQUE7QUFBQSxRQUNBLE9BQUEsQ0FBUSxJQUFSLEVBQ0Usd0RBQUEsR0FDQSxDQUFDLFdBQUEsR0FBVSxDQUFDLElBQUksQ0FBQyxTQUFMLENBQWUsWUFBZixFQUE2QixNQUE3QixFQUF3QyxDQUF4QyxDQUFELENBQVYsR0FBc0QsT0FBdkQsQ0FGRixDQURBLENBREY7T0FuQ0E7QUFBQSxNQTBDQSxJQUFBLEdBQU8sRUExQ1AsQ0FBQTtBQUFBLE1BMkNBLGdCQUFBLEdBQXVCLElBQUEsTUFBQSxDQUFPLGdCQUFQLENBM0N2QixDQUFBO0FBQUEsTUE0Q0EsWUFBQSxHQUFlLE1BQU0sQ0FBQyxTQUFQLENBQWlCLFNBQUMsR0FBRCxHQUFBO0FBRTlCLFlBQUEsR0FBQTtBQUFBLFFBQUEsR0FBQSxHQUFNLElBQUksQ0FBQyxHQUFYLENBQUE7ZUFDQSxJQUFBLElBQVEsR0FBRyxDQUFDLE9BQUosQ0FBWSxnQkFBWixFQUE4QixTQUFDLENBQUQsRUFBRyxDQUFILEdBQUE7QUFDcEMsY0FBQSxPQUFBO0FBQUEsVUFBQSxDQUFBLEdBQUksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxHQUFSLENBQUosQ0FBQTtBQUFBLFVBQ0EsQ0FBQSxHQUFJLENBQUMsQ0FBQyxPQUFGLENBQVUsZUFBVixDQURKLENBQUE7QUFBQSxVQUVBLENBQUEsR0FBSSxDQUFDLENBQUMsS0FBRixDQUFRLENBQUEsR0FBRSxDQUFWLENBQVksQ0FBQyxJQUFiLENBQWtCLEdBQWxCLENBRkosQ0FBQTtBQUlBLGlCQUFPLEtBQUEsR0FBTSxDQUFOLEdBQVEsR0FBZixDQUxvQztRQUFBLENBQTlCLEVBSHNCO01BQUEsQ0FBakIsQ0E1Q2YsQ0FBQTtBQUFBLE1BdURBLEVBQUEsR0FBSyxTQUFDLE1BQUQsR0FBQTtBQUNILFlBQUEsOERBQUE7QUFBQSxRQUFBLFlBQVksQ0FBQyxPQUFiLENBQUEsQ0FBQSxDQUFBO0FBQUEsUUFDQSxTQUFBLENBQVUsQ0FBVixFQUFhLFNBQWIsQ0FEQSxDQUFBO0FBQUEsUUFJQSxPQUFBLENBQVEsMEJBQVIsRUFBcUMsT0FBQSxHQUFPLGVBQVAsR0FBdUIsSUFBdkIsR0FBMkIsTUFBM0IsR0FBa0MsT0FBdkUsQ0FKQSxDQUFBO0FBQUEsUUFNQSxNQUFBLEdBQVMsT0FBQSxDQUFRLE1BQVIsQ0FOVCxDQUFBO0FBQUEsUUFPQSxJQUFBLEdBQU8sTUFBTSxDQUFDLFdBQVAsQ0FBbUIsUUFBbkIsRUFBNkIsSUFBN0IsRUFDTCxNQURLLEVBQ0csVUFESCxFQUNlLFlBRGYsQ0FQUCxDQUFBO0FBQUEsUUFTQSxPQUFBLENBQVEsOEJBQVIsRUFBeUMsT0FBQSxHQUFPLGVBQVAsR0FBdUIsSUFBdkIsR0FBMkIsSUFBM0IsR0FBZ0MsT0FBekUsQ0FUQSxDQUFBO0FBQUEsUUFXQSxTQUFBLENBQVUsQ0FBVixFQUFhLE1BQWIsQ0FYQSxDQUFBO0FBQUEsUUFZQSxPQUFBLENBQVEsSUFBUixFQUFlLE9BQUEsR0FBTyxJQUFQLEdBQVksT0FBM0IsQ0FaQSxDQUFBO0FBQUEsUUFlQSxHQUFBLEdBQU0sd0JBZk4sQ0FBQTtBQWdCQSxhQUFBLDhDQUFBOytCQUFBO0FBQ0U7QUFBQTs7O2FBQUE7QUFBQSxVQUlBLE1BQUEsR0FBUyxJQUpULENBQUE7QUFBQSxVQUtBLE1BQUEsR0FBUyxHQUxULENBQUE7QUFBQSxVQU1BLFNBQUEsR0FBWSxNQUFNLENBQUMsS0FBUCxHQUFlLENBTjNCLENBQUE7QUFPQSxVQUFBLElBQUcsU0FBQSxJQUFhLENBQWhCO0FBQ0UsWUFBQSxHQUFBLElBQVEsRUFBQSxHQUFFLENBQUMsS0FBQSxDQUFNLFNBQUEsR0FBVSxDQUFoQixDQUFrQixDQUFDLElBQW5CLENBQXdCLE1BQXhCLENBQUQsQ0FBRixHQUFxQyxNQUFyQyxHQUE0QyxJQUE1QyxHQUFnRCxNQUFNLENBQUMsS0FBdkQsR0FBNkQsTUFBN0QsR0FBa0UsQ0FBQyxZQUFBLENBQWEsTUFBTSxDQUFDLEtBQXBCLENBQUQsQ0FBbEUsR0FBOEYsS0FBdEcsQ0FERjtXQVJGO0FBQUEsU0FoQkE7QUFBQSxRQTJCQSxTQUFBLEdBQVksU0FBUyxDQUFDLE9BQVYsQ0FBa0IsS0FBbEIsRUFBeUIsR0FBekIsQ0EzQlosQ0FBQTtBQUFBLFFBOEJBLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBZixDQUFxQixTQUFyQixDQTlCQSxDQUFBO2VBK0JBLE9BQUEsQ0FBUSxpRUFBQSxHQUNSLCtEQURRLEdBRVIsd0RBRlEsR0FHUixzREFIUSxHQUlSLDRFQUpRLEdBS1IsbUVBTFEsR0FNUixnRUFOQSxFQWhDRztNQUFBLENBdkRMLENBQUE7QUErRkE7ZUFDRSxVQUFVLENBQUMsUUFBWCxDQUFvQixJQUFwQixFQUEwQixVQUExQixFQUFzQyxXQUF0QyxFQUFtRCxRQUFuRCxDQUNBLENBQUMsSUFERCxDQUNNLEVBRE4sQ0FFQSxDQUFDLE9BQUQsQ0FGQSxDQUVPLEVBRlAsRUFERjtPQUFBLGNBQUE7QUFLRSxRQURJLFVBQ0osQ0FBQTtBQUFBLGVBQU8sRUFBQSxDQUFHLENBQUgsQ0FBUCxDQUxGO09BakdJO0lBQUEsQ0FETixFQWhHTTtFQUFBLENBM1FSLENBQUE7O0FBQUEsRUFxZEEsZUFBQSxHQUFrQixTQUFBLEdBQUE7V0FDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxTQUFDLE1BQUQsR0FBQTtBQUNoQyxVQUFBLGtCQUFBO0FBQUEsTUFBQSxNQUFBLEdBQVMsTUFBTSxDQUFDLFNBQVAsQ0FBQSxDQUFULENBQUE7QUFBQSxNQUNBLFVBQUEsR0FBYSxNQUFNLENBQUMsU0FBUCxDQUFpQixTQUFDLElBQUQsR0FBQTtBQUM1QixZQUFBLG1HQUFBO0FBQUEsUUFEcUMsV0FBUixLQUFDLElBQzlCLENBQUE7O1VBQUEsT0FBUSxPQUFBLENBQVEsTUFBUjtTQUFSO0FBQUEsUUFFQSxPQUFBLEdBQVUsTUFBTSxDQUFDLFVBQVAsQ0FBQSxDQUFtQixDQUFDLElBRjlCLENBQUE7QUFBQSxRQUlBLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLE9BQUwsQ0FBYSxRQUFiLENBSmhCLENBQUE7QUFBQSxRQU1BLGFBQUEsR0FBZ0IsYUFBYSxDQUFDLE1BQWQsQ0FBcUIsQ0FBckIsQ0FOaEIsQ0FBQTtBQUFBLFFBUUEsU0FBQSxHQUFZLFVBQVUsQ0FBQyxTQUFTLENBQUMsWUFBckIsQ0FBa0M7QUFBQSxVQUFDLFNBQUEsT0FBRDtBQUFBLFVBQVUsU0FBQSxFQUFXLGFBQXJCO1NBQWxDLENBUlosQ0FBQTtBQVNBLFFBQUEsSUFBRyxTQUFTLENBQUMsTUFBVixHQUFtQixDQUF0QjtBQUNFLGdCQUFBLENBREY7U0FUQTtBQUFBLFFBWUEsUUFBQSxHQUFXLFNBQVUsQ0FBQSxDQUFBLENBWnJCLENBQUE7QUFBQSxRQWNBLEdBQUEsR0FBTyxnQkFBQSxHQUFnQixRQUFRLENBQUMsU0FBekIsR0FBbUMsbUJBZDFDLENBQUE7QUFBQSxRQWVBLGNBQUEsR0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLEdBQWhCLENBZmpCLENBQUE7QUFBQSxRQWdCQSxNQUFNLENBQUMsT0FBUCxDQUFlLHVCQUFmLEVBQXdDLEdBQXhDLEVBQTZDLGNBQTdDLENBaEJBLENBQUE7QUFpQkEsUUFBQSxJQUFHLGNBQUg7QUFDRSxVQUFBLFFBQUEsR0FBVyxVQUFBLENBQVcsTUFBWCxDQUFYLENBQUE7QUFBQSxVQUNBLGFBQUEsR0FBZ0IsWUFBQSxDQUFhLE1BQWIsQ0FEaEIsQ0FBQTtpQkFFQSxnQkFBQSxDQUFpQixRQUFqQixFQUEyQixTQUFBLEdBQUE7QUFDekIsWUFBQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBQSxLQUFvQixJQUF2QjtBQUNFLGNBQUEsTUFBTSxDQUFDLE1BQVAsQ0FBQSxDQUFBLENBQUE7QUFBQSxjQUNBLE1BQU0sQ0FBQyxPQUFQLENBQWUsMEJBQWYsRUFBMkMsUUFBM0MsRUFBb0QsYUFBcEQsQ0FEQSxDQUFBO3FCQUtBLFVBQUEsQ0FBVyxDQUFFLFNBQUEsR0FBQTtBQUNYLGdCQUFBLFVBQUEsQ0FBVyxNQUFYLEVBQW1CLFFBQW5CLENBQUEsQ0FBQTtBQUFBLGdCQUNBLFlBQUEsQ0FBYSxNQUFiLEVBQXFCLGFBQXJCLENBREEsQ0FEVztjQUFBLENBQUYsQ0FBWCxFQUtHLENBTEgsRUFORjthQUR5QjtVQUFBLENBQTNCLEVBSEY7U0FsQjRCO01BQUEsQ0FBakIsQ0FEYixDQUFBO2FBcUNBLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBckIsQ0FBeUIsVUFBekIsRUF0Q2dDO0lBQUEsQ0FBbEMsRUFEZ0I7RUFBQSxDQXJkbEIsQ0FBQTs7QUFBQSxFQThmQSxxQkFBQSxHQUF3QixTQUFBLEdBQUE7QUFDdEIsUUFBQSxvQ0FBQTtBQUFBLElBQUEsUUFBQSxHQUFXLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixlQUFoQixDQUFYLENBQUE7QUFBQSxJQUNBLE1BQUEsR0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVosQ0FBc0IsZUFBdEIsQ0FEVCxDQUFBO0FBQUEsSUFFQSxrQkFBQSxHQUFxQixDQUFDLENBQUMsTUFBRixDQUFTLENBQUMsQ0FBQyxJQUFGLENBQU8sUUFBUCxDQUFULEVBQTJCLFNBQUMsR0FBRCxHQUFBO2FBRzlDLE1BQU0sQ0FBQyxVQUFXLENBQUEsR0FBQSxDQUFsQixLQUEwQixPQUhvQjtJQUFBLENBQTNCLENBRnJCLENBQUE7QUFPQSxXQUFPLGtCQUFQLENBUnNCO0VBQUEsQ0E5ZnhCLENBQUE7O0FBQUEsRUF3Z0JBLE1BQU0sQ0FBQyx1QkFBUCxHQUFpQyxTQUFBLEdBQUE7QUFDL0IsUUFBQSxrQkFBQTtBQUFBLElBQUEsa0JBQUEsR0FBcUIscUJBQUEsQ0FBQSxDQUFyQixDQUFBO0FBQ0EsSUFBQSxJQUFHLGtCQUFrQixDQUFDLE1BQW5CLEtBQStCLENBQWxDO2FBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFuQixDQUErQixnQ0FBQSxHQUErQixDQUFDLGtCQUFrQixDQUFDLElBQW5CLENBQXdCLElBQXhCLENBQUQsQ0FBL0IsR0FBOEQsa0VBQTdGLEVBREY7S0FGK0I7RUFBQSxDQXhnQmpDLENBQUE7O0FBQUEsRUE2Z0JBLE1BQU0sQ0FBQyxlQUFQLEdBQXlCLFNBQUEsR0FBQTtBQUN2QixRQUFBLDJDQUFBO0FBQUEsSUFBQSxrQkFBQSxHQUFxQixxQkFBQSxDQUFBLENBQXJCLENBQUE7QUFBQSxJQUNBLFVBQUEsR0FBYSxVQUFVLENBQUMsU0FBUyxDQUFDLFVBRGxDLENBQUE7QUFHQSxJQUFBLElBQUcsa0JBQWtCLENBQUMsTUFBbkIsS0FBNkIsQ0FBaEM7YUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQW5CLENBQThCLHdCQUE5QixFQURGO0tBQUEsTUFBQTtBQUdFLE1BQUEsR0FBQSxHQUFVLElBQUEsTUFBQSxDQUFRLEdBQUEsR0FBRSxDQUFDLFVBQVUsQ0FBQyxJQUFYLENBQWdCLEdBQWhCLENBQUQsQ0FBRixHQUF3QixRQUFoQyxDQUFWLENBQUE7QUFBQSxNQUNBLE1BQUEsR0FBUyxDQUFDLENBQUMsT0FBRixDQUFVLENBQUMsQ0FBQyxTQUFGLENBQVksa0JBQVosRUFBZ0MsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxrQkFBTixFQUEwQixTQUFDLEdBQUQsR0FBQTtBQUMzRSxZQUFBLENBQUE7QUFBQSxRQUFBLENBQUEsR0FBSSxHQUFHLENBQUMsS0FBSixDQUFVLEdBQVYsQ0FBSixDQUFBO0FBQ0EsUUFBQSxJQUFHLENBQUEsS0FBSyxJQUFSO0FBR0UsaUJBQVEsVUFBQSxHQUFVLEdBQWxCLENBSEY7U0FBQSxNQUFBO0FBS0UsaUJBQU8sRUFBQSxHQUFHLENBQUUsQ0FBQSxDQUFBLENBQUwsR0FBUSxHQUFSLEdBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBcEIsQ0FMRjtTQUYyRTtNQUFBLENBQTFCLENBQWhDLENBQVYsQ0FEVCxDQUFBO0FBQUEsTUFjQSxDQUFDLENBQUMsSUFBRixDQUFPLE1BQVAsRUFBZSxTQUFDLElBQUQsR0FBQTtBQUdiLFlBQUEsZ0JBQUE7QUFBQSxRQUhlLGVBQUssZ0JBR3BCLENBQUE7QUFBQSxRQUFBLEdBQUEsR0FBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBaUIsZ0JBQUEsR0FBZ0IsR0FBakMsQ0FBTixDQUFBO0FBQUEsUUFDQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBaUIsZ0JBQUEsR0FBZ0IsTUFBakMsRUFBMkMsR0FBM0MsQ0FEQSxDQUFBO2VBR0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWlCLGdCQUFBLEdBQWdCLEdBQWpDLEVBQXdDLE1BQXhDLEVBTmE7TUFBQSxDQUFmLENBZEEsQ0FBQTthQXNCQSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQW5CLENBQStCLGlDQUFBLEdBQWdDLENBQUMsa0JBQWtCLENBQUMsSUFBbkIsQ0FBd0IsSUFBeEIsQ0FBRCxDQUEvRCxFQXpCRjtLQUp1QjtFQUFBLENBN2dCekIsQ0FBQTs7QUFBQSxFQTRpQkEsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxPQUFBLENBQVEsaUJBQVIsQ0FBUixFQUFvQyxzQkFBcEMsQ0E1aUJoQixDQUFBOztBQUFBLEVBNmlCQSxNQUFNLENBQUMsUUFBUCxHQUFrQixTQUFBLEdBQUE7QUFDaEIsSUFBQSxJQUFDLENBQUEsYUFBRCxHQUFpQixHQUFBLENBQUEsbUJBQWpCLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixlQUFBLENBQUEsQ0FBbkIsQ0FEQSxDQUFBO0FBQUEsSUFFQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQywrQkFBcEMsRUFBcUUsUUFBckUsQ0FBbkIsQ0FGQSxDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxpQ0FBcEMsRUFBdUUsS0FBdkUsQ0FBbkIsQ0FIQSxDQUFBO0FBQUEsSUFJQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLHdCQUFsQixFQUE0Qyw2QkFBNUMsRUFBMkUsWUFBM0UsQ0FBbkIsQ0FKQSxDQUFBO0FBQUEsSUFLQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLDZCQUFsQixFQUFpRCxrQ0FBakQsRUFBcUYsaUJBQXJGLENBQW5CLENBTEEsQ0FBQTtXQU1BLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGdDQUFwQyxFQUFzRSxNQUFNLENBQUMsZUFBN0UsQ0FBbkIsRUFQZ0I7RUFBQSxDQTdpQmxCLENBQUE7O0FBQUEsRUFzakJBLE1BQU0sQ0FBQyxVQUFQLEdBQW9CLFNBQUEsR0FBQTtXQUNsQixJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQSxFQURrQjtFQUFBLENBdGpCcEIsQ0FBQTtBQUFBIgp9

//# sourceURL=/Users/nansthomas/.atom/packages/atom-beautify/src/beautify.coffee
