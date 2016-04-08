(function() {
  "use strict";
  var $, Beautifiers, CompositeDisposable, LoadingView, Promise, async, beautifier, beautify, beautifyDirectory, beautifyFile, beautifyFilePath, debug, defaultLanguageOptions, dir, fs, getCursors, handleSaveEvent, loadingView, logger, path, pkg, plugin, setCursors, showError, strip, yaml, _;

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
    if (!atom.config.get("atom-beautify.muteAllErrors")) {
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
    var allOptions, beautifyCompleted, detail, e, editedFilePath, editor, forceEntireFile, grammarName, isSelection, oldText, onSave, text;
    onSave = _arg.onSave;
    if (atom.config.get("atom-beautify.beautifyOnSave") === true) {
      detail = "See issue https://github.com/Glavin001/atom-beautify/issues/308\n\nTo stop seeing this message:\n- Uncheck (disable) the deprecated \"Beautify On Save\" option\n\nTo enable Beautify on Save for a particular language:\n- Go to Atom Beautify's package settings\n- Find option for \"Language Config - <Your Language> - Beautify On Save\"\n- Check (enable) Beautify On Save option for that particular language\n";
      if (typeof atom !== "undefined" && atom !== null) {
        atom.notifications.addWarning("The option \"atom-beautify.beautifyOnSave\" has been deprecated", {
          detail: detail,
          dismissable: true
        });
      }
    }
    if (path == null) {
      path = require("path");
    }
    forceEntireFile = onSave && atom.config.get("atom-beautify.beautifyEntireFileOnSave");
    beautifyCompleted = function(text) {
      var origScrollTop, posArray, selectedBufferRange;
      if (text == null) {

      } else if (text instanceof Error) {
        showError(text);
      } else if (typeof text === "string") {
        if (oldText !== text) {
          posArray = getCursors(editor);
          origScrollTop = editor.getScrollTop();
          if (!forceEntireFile && isSelection) {
            selectedBufferRange = editor.getSelectedBufferRange();
            editor.setTextInBufferRange(selectedBufferRange, text);
          } else {
            editor.setText(text);
          }
          setCursors(editor, posArray);
          setTimeout((function() {
            editor.setScrollTop(origScrollTop);
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
        key = "atom-beautify.language_" + language.namespace + "_beautify_on_save";
        beautifyOnSave = atom.config.get(key);
        logger.verbose('save editor positions', key, beautifyOnSave);
        if (beautifyOnSave) {
          posArray = getCursors(editor);
          origScrollTop = editor.getScrollTop();
          return beautifyFilePath(filePath, function() {
            if (editor.isAlive() === true) {
              buffer.reload();
              logger.verbose('restore editor positions', posArray, origScrollTop);
              return setTimeout((function() {
                setCursors(editor, posArray);
                editor.setScrollTop(origScrollTop);
              }), 0);
            }
          });
        }
      });
      return plugin.subscriptions.add(disposable);
    });
  };

  plugin.config = _.merge(require('./config.coffee'), defaultLanguageOptions);

  plugin.activate = function() {
    this.subscriptions = new CompositeDisposable;
    this.subscriptions.add(handleSaveEvent());
    this.subscriptions.add(atom.config.observe("atom-beautify.beautifyOnSave", handleSaveEvent));
    this.subscriptions.add(atom.commands.add("atom-workspace", "atom-beautify:beautify-editor", beautify));
    this.subscriptions.add(atom.commands.add("atom-workspace", "atom-beautify:help-debug-editor", debug));
    this.subscriptions.add(atom.commands.add(".tree-view .file .name", "atom-beautify:beautify-file", beautifyFile));
    return this.subscriptions.add(atom.commands.add(".tree-view .directory .name", "atom-beautify:beautify-directory", beautifyDirectory));
  };

  plugin.deactivate = function() {
    return this.subscriptions.dispose();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvYXRvbS1iZWF1dGlmeS9zcmMvYmVhdXRpZnkuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQ0E7QUFBQSxFQUFBLFlBQUEsQ0FBQTtBQUFBLE1BQUEsNlJBQUE7O0FBQUEsRUFDQSxHQUFBLEdBQU0sT0FBQSxDQUFRLGlCQUFSLENBRE4sQ0FBQTs7QUFBQSxFQUlBLE1BQUEsR0FBUyxNQUFNLENBQUMsT0FKaEIsQ0FBQTs7QUFBQSxFQUtDLHNCQUF1QixPQUFBLENBQVEsV0FBUixFQUF2QixtQkFMRCxDQUFBOztBQUFBLEVBTUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBTkosQ0FBQTs7QUFBQSxFQU9BLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUixDQVBkLENBQUE7O0FBQUEsRUFRQSxVQUFBLEdBQWlCLElBQUEsV0FBQSxDQUFBLENBUmpCLENBQUE7O0FBQUEsRUFTQSxzQkFBQSxHQUF5QixVQUFVLENBQUMsT0FUcEMsQ0FBQTs7QUFBQSxFQVVBLE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUixDQUFBLENBQW9CLFVBQXBCLENBVlQsQ0FBQTs7QUFBQSxFQVdBLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUixDQVhWLENBQUE7O0FBQUEsRUFjQSxFQUFBLEdBQUssSUFkTCxDQUFBOztBQUFBLEVBZUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSLENBZlAsQ0FBQTs7QUFBQSxFQWdCQSxLQUFBLEdBQVEsSUFoQlIsQ0FBQTs7QUFBQSxFQWlCQSxJQUFBLEdBQU8sSUFqQlAsQ0FBQTs7QUFBQSxFQWtCQSxLQUFBLEdBQVEsSUFsQlIsQ0FBQTs7QUFBQSxFQW1CQSxHQUFBLEdBQU0sSUFuQk4sQ0FBQTs7QUFBQSxFQW9CQSxXQUFBLEdBQWMsSUFwQmQsQ0FBQTs7QUFBQSxFQXFCQSxXQUFBLEdBQWMsSUFyQmQsQ0FBQTs7QUFBQSxFQXNCQSxDQUFBLEdBQUksSUF0QkosQ0FBQTs7QUFBQSxFQTRCQSxVQUFBLEdBQWEsU0FBQyxNQUFELEdBQUE7QUFDWCxRQUFBLG1EQUFBO0FBQUEsSUFBQSxPQUFBLEdBQVUsTUFBTSxDQUFDLFVBQVAsQ0FBQSxDQUFWLENBQUE7QUFBQSxJQUNBLFFBQUEsR0FBVyxFQURYLENBQUE7QUFFQSxTQUFBLDhDQUFBOzJCQUFBO0FBQ0UsTUFBQSxjQUFBLEdBQWlCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQWpCLENBQUE7QUFBQSxNQUNBLFFBQVEsQ0FBQyxJQUFULENBQWMsQ0FDWixjQUFjLENBQUMsR0FESCxFQUVaLGNBQWMsQ0FBQyxNQUZILENBQWQsQ0FEQSxDQURGO0FBQUEsS0FGQTtXQVFBLFNBVFc7RUFBQSxDQTVCYixDQUFBOztBQUFBLEVBc0NBLFVBQUEsR0FBYSxTQUFDLE1BQUQsRUFBUyxRQUFULEdBQUE7QUFHWCxRQUFBLDJCQUFBO0FBQUEsU0FBQSx1REFBQTttQ0FBQTtBQUNFLE1BQUEsSUFBRyxDQUFBLEtBQUssQ0FBUjtBQUNFLFFBQUEsTUFBTSxDQUFDLHVCQUFQLENBQStCLGNBQS9CLENBQUEsQ0FBQTtBQUNBLGlCQUZGO09BQUE7QUFBQSxNQUdBLE1BQU0sQ0FBQyx5QkFBUCxDQUFpQyxjQUFqQyxDQUhBLENBREY7QUFBQSxLQUhXO0VBQUEsQ0F0Q2IsQ0FBQTs7QUFBQSxFQWlEQSxVQUFVLENBQUMsRUFBWCxDQUFjLGlCQUFkLEVBQWlDLFNBQUEsR0FBQTs7TUFDL0IsY0FBZSxPQUFBLENBQVEsc0JBQVI7S0FBZjs7TUFDQSxjQUFtQixJQUFBLFdBQUEsQ0FBQTtLQURuQjtXQUVBLFdBQVcsQ0FBQyxJQUFaLENBQUEsRUFIK0I7RUFBQSxDQUFqQyxDQWpEQSxDQUFBOztBQUFBLEVBc0RBLFVBQVUsQ0FBQyxFQUFYLENBQWMsZUFBZCxFQUErQixTQUFBLEdBQUE7aUNBQzdCLFdBQVcsQ0FBRSxJQUFiLENBQUEsV0FENkI7RUFBQSxDQUEvQixDQXREQSxDQUFBOztBQUFBLEVBMERBLFNBQUEsR0FBWSxTQUFDLEtBQUQsR0FBQTtBQUNWLFFBQUEsbUJBQUE7QUFBQSxJQUFBLElBQUcsQ0FBQSxJQUFRLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNkJBQWhCLENBQVA7QUFFRSxNQUFBLEtBQUEsR0FBUSxLQUFLLENBQUMsS0FBZCxDQUFBO0FBQUEsTUFDQSxNQUFBLEdBQVMsS0FBSyxDQUFDLFdBQU4sSUFBcUIsS0FBSyxDQUFDLE9BRHBDLENBQUE7dURBRWtCLENBQUUsUUFBcEIsQ0FBNkIsS0FBSyxDQUFDLE9BQW5DLEVBQTRDO0FBQUEsUUFDMUMsT0FBQSxLQUQwQztBQUFBLFFBQ25DLFFBQUEsTUFEbUM7QUFBQSxRQUMzQixXQUFBLEVBQWMsSUFEYTtPQUE1QyxXQUpGO0tBRFU7RUFBQSxDQTFEWixDQUFBOztBQUFBLEVBa0VBLFFBQUEsR0FBVyxTQUFDLElBQUQsR0FBQTtBQUVULFFBQUEsa0lBQUE7QUFBQSxJQUZXLFNBQUQsS0FBQyxNQUVYLENBQUE7QUFBQSxJQUFBLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDhCQUFoQixDQUFBLEtBQW1ELElBQXREO0FBQ0UsTUFBQSxNQUFBLEdBQVMseVpBQVQsQ0FBQTs7UUFZQSxJQUFJLENBQUUsYUFBYSxDQUFDLFVBQXBCLENBQStCLGlFQUEvQixFQUFrRztBQUFBLFVBQUMsUUFBQSxNQUFEO0FBQUEsVUFBUyxXQUFBLEVBQWMsSUFBdkI7U0FBbEc7T0FiRjtLQUFBOztNQWdCQSxPQUFRLE9BQUEsQ0FBUSxNQUFSO0tBaEJSO0FBQUEsSUFpQkEsZUFBQSxHQUFrQixNQUFBLElBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHdDQUFoQixDQWpCN0IsQ0FBQTtBQUFBLElBNEJBLGlCQUFBLEdBQW9CLFNBQUMsSUFBRCxHQUFBO0FBRWxCLFVBQUEsNENBQUE7QUFBQSxNQUFBLElBQU8sWUFBUDtBQUFBO09BQUEsTUFHSyxJQUFHLElBQUEsWUFBZ0IsS0FBbkI7QUFDSCxRQUFBLFNBQUEsQ0FBVSxJQUFWLENBQUEsQ0FERztPQUFBLE1BRUEsSUFBRyxNQUFBLENBQUEsSUFBQSxLQUFlLFFBQWxCO0FBQ0gsUUFBQSxJQUFHLE9BQUEsS0FBYSxJQUFoQjtBQUdFLFVBQUEsUUFBQSxHQUFXLFVBQUEsQ0FBVyxNQUFYLENBQVgsQ0FBQTtBQUFBLFVBR0EsYUFBQSxHQUFnQixNQUFNLENBQUMsWUFBUCxDQUFBLENBSGhCLENBQUE7QUFNQSxVQUFBLElBQUcsQ0FBQSxlQUFBLElBQXdCLFdBQTNCO0FBQ0UsWUFBQSxtQkFBQSxHQUFzQixNQUFNLENBQUMsc0JBQVAsQ0FBQSxDQUF0QixDQUFBO0FBQUEsWUFHQSxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsbUJBQTVCLEVBQWlELElBQWpELENBSEEsQ0FERjtXQUFBLE1BQUE7QUFRRSxZQUFBLE1BQU0sQ0FBQyxPQUFQLENBQWUsSUFBZixDQUFBLENBUkY7V0FOQTtBQUFBLFVBaUJBLFVBQUEsQ0FBVyxNQUFYLEVBQW1CLFFBQW5CLENBakJBLENBQUE7QUFBQSxVQXVCQSxVQUFBLENBQVcsQ0FBRSxTQUFBLEdBQUE7QUFHWCxZQUFBLE1BQU0sQ0FBQyxZQUFQLENBQW9CLGFBQXBCLENBQUEsQ0FIVztVQUFBLENBQUYsQ0FBWCxFQUtHLENBTEgsQ0F2QkEsQ0FIRjtTQURHO09BQUEsTUFBQTtBQWtDSCxRQUFBLFNBQUEsQ0FBZSxJQUFBLEtBQUEsQ0FBTyxxQ0FBQSxHQUFxQyxJQUFyQyxHQUEwQyxJQUFqRCxDQUFmLENBQUEsQ0FsQ0c7T0FQYTtJQUFBLENBNUJwQixDQUFBO0FBQUEsSUE4RUEsTUFBQSxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQSxDQTlFVCxDQUFBO0FBa0ZBLElBQUEsSUFBTyxjQUFQO0FBQ0UsYUFBTyxTQUFBLENBQWUsSUFBQSxLQUFBLENBQU0sMkJBQU4sRUFDcEIsZ0RBRG9CLENBQWYsQ0FBUCxDQURGO0tBbEZBO0FBQUEsSUFxRkEsV0FBQSxHQUFjLENBQUEsQ0FBQyxNQUFPLENBQUMsZUFBUCxDQUFBLENBckZoQixDQUFBO0FBQUEsSUF5RkEsY0FBQSxHQUFpQixNQUFNLENBQUMsT0FBUCxDQUFBLENBekZqQixDQUFBO0FBQUEsSUE2RkEsVUFBQSxHQUFhLFVBQVUsQ0FBQyxpQkFBWCxDQUE2QixjQUE3QixFQUE2QyxNQUE3QyxDQTdGYixDQUFBO0FBQUEsSUFpR0EsSUFBQSxHQUFPLE1BakdQLENBQUE7QUFrR0EsSUFBQSxJQUFHLENBQUEsZUFBQSxJQUF3QixXQUEzQjtBQUNFLE1BQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxlQUFQLENBQUEsQ0FBUCxDQURGO0tBQUEsTUFBQTtBQUdFLE1BQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBUCxDQUhGO0tBbEdBO0FBQUEsSUFzR0EsT0FBQSxHQUFVLElBdEdWLENBQUE7QUFBQSxJQTBHQSxXQUFBLEdBQWMsTUFBTSxDQUFDLFVBQVAsQ0FBQSxDQUFtQixDQUFDLElBMUdsQyxDQUFBO0FBOEdBO0FBQ0UsTUFBQSxVQUFVLENBQUMsUUFBWCxDQUFvQixJQUFwQixFQUEwQixVQUExQixFQUFzQyxXQUF0QyxFQUFtRCxjQUFuRCxFQUFtRTtBQUFBLFFBQUEsTUFBQSxFQUFTLE1BQVQ7T0FBbkUsQ0FDQSxDQUFDLElBREQsQ0FDTSxpQkFETixDQUVBLENBQUMsT0FBRCxDQUZBLENBRU8saUJBRlAsQ0FBQSxDQURGO0tBQUEsY0FBQTtBQUtFLE1BREksVUFDSixDQUFBO0FBQUEsTUFBQSxTQUFBLENBQVUsQ0FBVixDQUFBLENBTEY7S0FoSFM7RUFBQSxDQWxFWCxDQUFBOztBQUFBLEVBMExBLGdCQUFBLEdBQW1CLFNBQUMsUUFBRCxFQUFXLFFBQVgsR0FBQTtBQUdqQixRQUFBLE9BQUE7O01BQUEsSUFBSyxPQUFBLENBQVEsc0JBQVIsQ0FBK0IsQ0FBQztLQUFyQztBQUFBLElBQ0EsR0FBQSxHQUFNLENBQUEsQ0FBRyw4QkFBQSxHQUE4QixRQUE5QixHQUF1QyxLQUExQyxDQUROLENBQUE7QUFBQSxJQUVBLEdBQUcsQ0FBQyxRQUFKLENBQWEsYUFBYixDQUZBLENBQUE7QUFBQSxJQUtBLEVBQUEsR0FBSyxTQUFDLEdBQUQsRUFBTSxNQUFOLEdBQUE7QUFDSCxNQUFBLEdBQUEsR0FBTSxDQUFBLENBQUcsOEJBQUEsR0FBOEIsUUFBOUIsR0FBdUMsS0FBMUMsQ0FBTixDQUFBO0FBQUEsTUFDQSxHQUFHLENBQUMsV0FBSixDQUFnQixhQUFoQixDQURBLENBQUE7QUFFQSxhQUFPLFFBQUEsQ0FBUyxHQUFULEVBQWMsTUFBZCxDQUFQLENBSEc7SUFBQSxDQUxMLENBQUE7O01BV0EsS0FBTSxPQUFBLENBQVEsSUFBUjtLQVhOO1dBWUEsRUFBRSxDQUFDLFFBQUgsQ0FBWSxRQUFaLEVBQXNCLFNBQUMsR0FBRCxFQUFNLElBQU4sR0FBQTtBQUNwQixVQUFBLHlEQUFBO0FBQUEsTUFBQSxJQUFrQixHQUFsQjtBQUFBLGVBQU8sRUFBQSxDQUFHLEdBQUgsQ0FBUCxDQUFBO09BQUE7QUFBQSxNQUNBLEtBQUEsa0JBQVEsSUFBSSxDQUFFLFFBQU4sQ0FBQSxVQURSLENBQUE7QUFBQSxNQUVBLE9BQUEsR0FBVSxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWQsQ0FBNEIsUUFBNUIsRUFBc0MsS0FBdEMsQ0FGVixDQUFBO0FBQUEsTUFHQSxXQUFBLEdBQWMsT0FBTyxDQUFDLElBSHRCLENBQUE7QUFBQSxNQU1BLFVBQUEsR0FBYSxVQUFVLENBQUMsaUJBQVgsQ0FBNkIsUUFBN0IsQ0FOYixDQUFBO0FBQUEsTUFTQSxhQUFBLEdBQWdCLFNBQUMsTUFBRCxHQUFBO0FBQ2QsUUFBQSxJQUFHLE1BQUEsWUFBa0IsS0FBckI7QUFDRSxpQkFBTyxFQUFBLENBQUcsTUFBSCxFQUFXLElBQVgsQ0FBUCxDQURGO1NBQUEsTUFFSyxJQUFHLE1BQUEsQ0FBQSxNQUFBLEtBQWlCLFFBQXBCO0FBRUgsVUFBQSxJQUEyQixNQUFBLEtBQVUsRUFBckM7QUFBQSxtQkFBTyxFQUFBLENBQUcsSUFBSCxFQUFTLE1BQVQsQ0FBUCxDQUFBO1dBQUE7aUJBRUEsRUFBRSxDQUFDLFNBQUgsQ0FBYSxRQUFiLEVBQXVCLE1BQXZCLEVBQStCLFNBQUMsR0FBRCxHQUFBO0FBQzdCLFlBQUEsSUFBa0IsR0FBbEI7QUFBQSxxQkFBTyxFQUFBLENBQUcsR0FBSCxDQUFQLENBQUE7YUFBQTtBQUNBLG1CQUFPLEVBQUEsQ0FBSSxJQUFKLEVBQVcsTUFBWCxDQUFQLENBRjZCO1VBQUEsQ0FBL0IsRUFKRztTQUFBLE1BQUE7QUFTSCxpQkFBTyxFQUFBLENBQVEsSUFBQSxLQUFBLENBQU8sZ0NBQUEsR0FBZ0MsTUFBaEMsR0FBdUMsR0FBOUMsQ0FBUixFQUEyRCxNQUEzRCxDQUFQLENBVEc7U0FIUztNQUFBLENBVGhCLENBQUE7QUFzQkE7ZUFDRSxVQUFVLENBQUMsUUFBWCxDQUFvQixLQUFwQixFQUEyQixVQUEzQixFQUF1QyxXQUF2QyxFQUFvRCxRQUFwRCxDQUNBLENBQUMsSUFERCxDQUNNLGFBRE4sQ0FFQSxDQUFDLE9BQUQsQ0FGQSxDQUVPLGFBRlAsRUFERjtPQUFBLGNBQUE7QUFLRSxRQURJLFVBQ0osQ0FBQTtBQUFBLGVBQU8sRUFBQSxDQUFHLENBQUgsQ0FBUCxDQUxGO09BdkJvQjtJQUFBLENBQXRCLEVBZmlCO0VBQUEsQ0ExTG5CLENBQUE7O0FBQUEsRUF3T0EsWUFBQSxHQUFlLFNBQUMsSUFBRCxHQUFBO0FBQ2IsUUFBQSxnQkFBQTtBQUFBLElBRGUsU0FBRCxLQUFDLE1BQ2YsQ0FBQTtBQUFBLElBQUEsUUFBQSxHQUFXLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBMUIsQ0FBQTtBQUNBLElBQUEsSUFBQSxDQUFBLFFBQUE7QUFBQSxZQUFBLENBQUE7S0FEQTtBQUFBLElBRUEsZ0JBQUEsQ0FBaUIsUUFBakIsRUFBMkIsU0FBQyxHQUFELEVBQU0sTUFBTixHQUFBO0FBQ3pCLE1BQUEsSUFBeUIsR0FBekI7QUFBQSxlQUFPLFNBQUEsQ0FBVSxHQUFWLENBQVAsQ0FBQTtPQUR5QjtJQUFBLENBQTNCLENBRkEsQ0FEYTtFQUFBLENBeE9mLENBQUE7O0FBQUEsRUFpUEEsaUJBQUEsR0FBb0IsU0FBQyxJQUFELEdBQUE7QUFDbEIsUUFBQSxvQkFBQTtBQUFBLElBRG9CLFNBQUQsS0FBQyxNQUNwQixDQUFBO0FBQUEsSUFBQSxPQUFBLEdBQVUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUF6QixDQUFBO0FBQ0EsSUFBQSxJQUFBLENBQUEsT0FBQTtBQUFBLFlBQUEsQ0FBQTtLQURBO0FBR0EsSUFBQSxvREFBVSxJQUFJLENBQUUsT0FBTixDQUNSO0FBQUEsTUFBQSxPQUFBLEVBQVUsNEVBQUEsR0FDNEIsT0FENUIsR0FDb0MsNkJBRDlDO0FBQUEsTUFHQSxPQUFBLEVBQVMsQ0FBQyxnQkFBRCxFQUFrQixhQUFsQixDQUhUO0tBRFEsV0FBQSxLQUl3QyxDQUpsRDtBQUFBLFlBQUEsQ0FBQTtLQUhBOztNQVVBLElBQUssT0FBQSxDQUFRLHNCQUFSLENBQStCLENBQUM7S0FWckM7QUFBQSxJQVdBLEdBQUEsR0FBTSxDQUFBLENBQUcsbUNBQUEsR0FBbUMsT0FBbkMsR0FBMkMsS0FBOUMsQ0FYTixDQUFBO0FBQUEsSUFZQSxHQUFHLENBQUMsUUFBSixDQUFhLGFBQWIsQ0FaQSxDQUFBOztNQWVBLE1BQU8sT0FBQSxDQUFRLFVBQVI7S0FmUDs7TUFnQkEsUUFBUyxPQUFBLENBQVEsT0FBUjtLQWhCVDtBQUFBLElBaUJBLEdBQUcsQ0FBQyxLQUFKLENBQVUsT0FBVixFQUFtQixTQUFDLEdBQUQsRUFBTSxLQUFOLEdBQUE7QUFDakIsTUFBQSxJQUF5QixHQUF6QjtBQUFBLGVBQU8sU0FBQSxDQUFVLEdBQVYsQ0FBUCxDQUFBO09BQUE7YUFFQSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsRUFBa0IsU0FBQyxRQUFELEVBQVcsUUFBWCxHQUFBO2VBRWhCLGdCQUFBLENBQWlCLFFBQWpCLEVBQTJCLFNBQUEsR0FBQTtpQkFBRyxRQUFBLENBQUEsRUFBSDtRQUFBLENBQTNCLEVBRmdCO01BQUEsQ0FBbEIsRUFHRSxTQUFDLEdBQUQsR0FBQTtBQUNBLFFBQUEsR0FBQSxHQUFNLENBQUEsQ0FBRyxtQ0FBQSxHQUFtQyxPQUFuQyxHQUEyQyxLQUE5QyxDQUFOLENBQUE7ZUFDQSxHQUFHLENBQUMsV0FBSixDQUFnQixhQUFoQixFQUZBO01BQUEsQ0FIRixFQUhpQjtJQUFBLENBQW5CLENBakJBLENBRGtCO0VBQUEsQ0FqUHBCLENBQUE7O0FBQUEsRUFpUkEsS0FBQSxHQUFRLFNBQUEsR0FBQTtBQUdOLFFBQUEsOEtBQUE7QUFBQSxJQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsQ0FBVCxDQUFBO0FBQUEsSUFFQSxZQUFBLEdBQWUsU0FBQyxLQUFELEdBQUE7QUFDYixVQUFBLE1BQUE7QUFBQSxNQUFBLEtBQUEsR0FBUSxLQUFLLENBQUMsV0FBTixDQUFBLENBQVIsQ0FBQTtBQUFBLE1BQ0EsQ0FBQSxHQUFJLEtBQUssQ0FBQyxLQUFOLENBQVkscUJBQVosQ0FESixDQUFBO0FBQUEsTUFFQSxHQUFBLEdBQU0sR0FGTixDQUFBO2FBR0EsQ0FBQyxDQUFDLElBQUYsQ0FBTyxHQUFQLEVBSmE7SUFBQSxDQUZmLENBQUE7QUFTQSxJQUFBLElBQU8sY0FBUDtBQUNFLGFBQU8sT0FBQSxDQUFRLDRCQUFBLEdBQ2YsZ0RBRE8sQ0FBUCxDQURGO0tBVEE7QUFZQSxJQUFBLElBQUEsQ0FBQSxPQUFjLENBQVEsMkNBQUEsR0FDdEIsNERBRGMsQ0FBZDtBQUFBLFlBQUEsQ0FBQTtLQVpBO0FBQUEsSUFjQSxTQUFBLEdBQVksRUFkWixDQUFBO0FBQUEsSUFlQSxPQUFBLEdBQVUsRUFmVixDQUFBO0FBQUEsSUFnQkEsS0FBQSxHQUFRLG9CQWhCUixDQUFBO0FBQUEsSUFpQkEsT0FBQSxHQUFVLFNBQUMsR0FBRCxFQUFNLEdBQU4sR0FBQTtBQUNSLE1BQUEsSUFBRyxXQUFIO2VBQ0UsU0FBQSxJQUFjLElBQUEsR0FBSSxHQUFKLEdBQVEsTUFBUixHQUFjLEdBQWQsR0FBa0IsT0FEbEM7T0FBQSxNQUFBO2VBR0UsU0FBQSxJQUFhLEVBQUEsR0FBRyxHQUFILEdBQU8sT0FIdEI7T0FEUTtJQUFBLENBakJWLENBQUE7QUFBQSxJQXNCQSxTQUFBLEdBQVksU0FBQyxLQUFELEVBQVEsS0FBUixHQUFBO0FBQ1YsTUFBQSxTQUFBLElBQWEsRUFBQSxHQUFFLENBQUMsS0FBQSxDQUFNLEtBQUEsR0FBTSxDQUFaLENBQWMsQ0FBQyxJQUFmLENBQW9CLEdBQXBCLENBQUQsQ0FBRixHQUE0QixHQUE1QixHQUErQixLQUEvQixHQUFxQyxNQUFsRCxDQUFBO2FBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYTtBQUFBLFFBQ1gsT0FBQSxLQURXO0FBQUEsUUFDSixPQUFBLEtBREk7T0FBYixFQUZVO0lBQUEsQ0F0QlosQ0FBQTtBQUFBLElBMkJBLFNBQUEsQ0FBVSxDQUFWLEVBQWEsdUNBQWIsQ0EzQkEsQ0FBQTtBQUFBLElBNEJBLFNBQUEsSUFBYSwwQ0FBQSxHQUNiLENBQUMsbUNBQUEsR0FBa0MsQ0FBSyxJQUFBLElBQUEsQ0FBQSxDQUFMLENBQWxDLEdBQThDLElBQS9DLENBRGEsR0FFYixhQUZhLEdBR2IsS0FIYSxHQUliLGFBaENBLENBQUE7QUFBQSxJQW1DQSxPQUFBLENBQVEsVUFBUixFQUFvQixPQUFPLENBQUMsUUFBNUIsQ0FuQ0EsQ0FBQTtBQUFBLElBb0NBLFNBQUEsQ0FBVSxDQUFWLEVBQWEsVUFBYixDQXBDQSxDQUFBO0FBQUEsSUF3Q0EsT0FBQSxDQUFRLGNBQVIsRUFBd0IsSUFBSSxDQUFDLFVBQTdCLENBeENBLENBQUE7QUFBQSxJQTRDQSxPQUFBLENBQVEsdUJBQVIsRUFBaUMsR0FBRyxDQUFDLE9BQXJDLENBNUNBLENBQUE7QUFBQSxJQTZDQSxTQUFBLENBQVUsQ0FBVixFQUFhLGdDQUFiLENBN0NBLENBQUE7QUFBQSxJQW1EQSxRQUFBLEdBQVcsTUFBTSxDQUFDLE9BQVAsQ0FBQSxDQW5EWCxDQUFBO0FBQUEsSUFzREEsT0FBQSxDQUFRLG9CQUFSLEVBQStCLEdBQUEsR0FBRyxRQUFILEdBQVksR0FBM0MsQ0F0REEsQ0FBQTtBQUFBLElBeURBLFdBQUEsR0FBYyxNQUFNLENBQUMsVUFBUCxDQUFBLENBQW1CLENBQUMsSUF6RGxDLENBQUE7QUFBQSxJQTREQSxPQUFBLENBQVEsdUJBQVIsRUFBaUMsV0FBakMsQ0E1REEsQ0FBQTtBQUFBLElBK0RBLFFBQUEsR0FBVyxVQUFVLENBQUMsV0FBWCxDQUF1QixXQUF2QixFQUFvQyxRQUFwQyxDQS9EWCxDQUFBO0FBQUEsSUFnRUEsT0FBQSxDQUFRLHdCQUFSLHFCQUFrQyxRQUFRLENBQUUsYUFBNUMsQ0FoRUEsQ0FBQTtBQUFBLElBaUVBLE9BQUEsQ0FBUSxvQkFBUixxQkFBOEIsUUFBUSxDQUFFLGtCQUF4QyxDQWpFQSxDQUFBO0FBQUEsSUFvRUEsV0FBQSxHQUFjLFVBQVUsQ0FBQyxjQUFYLENBQTBCLFFBQVEsQ0FBQyxJQUFuQyxDQXBFZCxDQUFBO0FBQUEsSUFxRUEsT0FBQSxDQUFRLHVCQUFSLEVBQWlDLENBQUMsQ0FBQyxHQUFGLENBQU0sV0FBTixFQUFtQixNQUFuQixDQUEwQixDQUFDLElBQTNCLENBQWdDLElBQWhDLENBQWpDLENBckVBLENBQUE7QUFBQSxJQXNFQSxrQkFBQSxHQUFxQixVQUFVLENBQUMsd0JBQVgsQ0FBb0MsUUFBcEMsQ0F0RXJCLENBQUE7QUFBQSxJQXVFQSxPQUFBLENBQVEscUJBQVIsRUFBK0Isa0JBQWtCLENBQUMsSUFBbEQsQ0F2RUEsQ0FBQTtBQUFBLElBMEVBLElBQUEsR0FBTyxNQUFNLENBQUMsT0FBUCxDQUFBLENBMUVQLENBQUE7QUFBQSxJQTZFQSxlQUFBLEdBQWtCLHFFQUFrQixXQUFsQixDQUE4QixDQUFDLFdBQS9CLENBQUEsQ0FBNEMsQ0FBQyxLQUE3QyxDQUFtRCxHQUFuRCxDQUF3RCxDQUFBLENBQUEsQ0E3RTFFLENBQUE7QUFBQSxJQThFQSxTQUFBLENBQVUsQ0FBVixFQUFhLHdCQUFiLENBOUVBLENBQUE7QUFBQSxJQStFQSxPQUFBLENBQVEsSUFBUixFQUFlLE9BQUEsR0FBTyxlQUFQLEdBQXVCLElBQXZCLEdBQTJCLElBQTNCLEdBQWdDLE9BQS9DLENBL0VBLENBQUE7QUFBQSxJQWlGQSxTQUFBLENBQVUsQ0FBVixFQUFhLGtCQUFiLENBakZBLENBQUE7QUFBQSxJQWtGQSxPQUFBLENBQVEsSUFBUixFQUNFLG9DQUFBLEdBQ0EsQ0FBQyxXQUFBLEdBQVUsQ0FBQyxJQUFJLENBQUMsU0FBTCxDQUFlLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixlQUFoQixDQUFmLEVBQWlELE1BQWpELEVBQTRELENBQTVELENBQUQsQ0FBVixHQUEwRSxPQUEzRSxDQUZGLENBbEZBLENBQUE7QUFBQSxJQXVGQSxTQUFBLENBQVUsQ0FBVixFQUFhLHdCQUFiLENBdkZBLENBQUE7QUFBQSxJQXlGQSxVQUFBLEdBQWEsVUFBVSxDQUFDLGlCQUFYLENBQTZCLFFBQTdCLEVBQXVDLE1BQXZDLENBekZiLENBQUE7V0EyRkEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxVQUFaLENBQ0EsQ0FBQyxJQURELENBQ00sU0FBQyxVQUFELEdBQUE7QUFFSixVQUFBLGdLQUFBO0FBQUEsTUFDSSw2QkFESixFQUVJLDZCQUZKLEVBR0ksMkJBSEosRUFJSSxtQ0FKSixDQUFBO0FBQUEsTUFNQSxjQUFBLEdBQWlCLFVBQVcsU0FONUIsQ0FBQTtBQUFBLE1BUUEscUJBQUEsR0FBd0IsVUFBVSxDQUFDLHFCQUFYLENBQWlDLFVBQWpDLEVBQTZDLFFBQTdDLENBUnhCLENBQUE7QUFVQSxNQUFBLElBQUcsa0JBQUg7QUFDRSxRQUFBLFlBQUEsR0FBZSxVQUFVLENBQUMsZ0JBQVgsQ0FBNEIsa0JBQTVCLEVBQWdELFFBQVEsQ0FBQyxJQUF6RCxFQUErRCxxQkFBL0QsQ0FBZixDQURGO09BVkE7QUFBQSxNQWlCQSxPQUFBLENBQVEsZ0JBQVIsRUFBMEIsSUFBQSxHQUMxQixxQ0FEMEIsR0FFMUIsQ0FBQyxXQUFBLEdBQVUsQ0FBQyxJQUFJLENBQUMsU0FBTCxDQUFlLGFBQWYsRUFBOEIsTUFBOUIsRUFBeUMsQ0FBekMsQ0FBRCxDQUFWLEdBQXVELE9BQXhELENBRkEsQ0FqQkEsQ0FBQTtBQUFBLE1Bb0JBLE9BQUEsQ0FBUSxnQkFBUixFQUEwQixJQUFBLEdBQzFCLCtDQUQwQixHQUUxQixDQUFDLFdBQUEsR0FBVSxDQUFDLElBQUksQ0FBQyxTQUFMLENBQWUsYUFBZixFQUE4QixNQUE5QixFQUF5QyxDQUF6QyxDQUFELENBQVYsR0FBdUQsT0FBeEQsQ0FGQSxDQXBCQSxDQUFBO0FBQUEsTUF1QkEsT0FBQSxDQUFRLGNBQVIsRUFBd0IsSUFBQSxHQUN4QixDQUFDLGdCQUFBLEdBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTCxDQUFhLFVBQVUsQ0FBQyxXQUFYLENBQUEsQ0FBYixFQUF1QyxlQUF2QyxDQUFELENBQWYsR0FBd0UsS0FBekUsQ0FEd0IsR0FFeEIsQ0FBQyxXQUFBLEdBQVUsQ0FBQyxJQUFJLENBQUMsU0FBTCxDQUFlLFdBQWYsRUFBNEIsTUFBNUIsRUFBdUMsQ0FBdkMsQ0FBRCxDQUFWLEdBQXFELE9BQXRELENBRkEsQ0F2QkEsQ0FBQTtBQUFBLE1BMEJBLE9BQUEsQ0FBUSxzQkFBUixFQUFnQyxJQUFBLEdBQ2hDLDhEQURnQyxHQUVoQyxDQUFDLFdBQUEsR0FBVSxDQUFDLElBQUksQ0FBQyxTQUFMLENBQWUsbUJBQWYsRUFBb0MsTUFBcEMsRUFBK0MsQ0FBL0MsQ0FBRCxDQUFWLEdBQTZELE9BQTlELENBRkEsQ0ExQkEsQ0FBQTtBQUFBLE1BNkJBLE9BQUEsQ0FBUSxpQkFBUixFQUEyQixJQUFBLEdBQzNCLENBQUMsOERBQUEsR0FBNkQsQ0FBQyxJQUFJLENBQUMsT0FBTCxDQUFhLFFBQWIsQ0FBRCxDQUE3RCxHQUFxRiwwQkFBdEYsQ0FEMkIsR0FFM0IsQ0FBQyxXQUFBLEdBQVUsQ0FBQyxJQUFJLENBQUMsU0FBTCxDQUFlLGNBQWYsRUFBK0IsTUFBL0IsRUFBMEMsQ0FBMUMsQ0FBRCxDQUFWLEdBQXdELE9BQXpELENBRkEsQ0E3QkEsQ0FBQTtBQUFBLE1BZ0NBLE9BQUEsQ0FBUSx5QkFBUixFQUFtQyxJQUFBLEdBQ25DLGlGQURtQyxHQUVuQyxDQUFDLFdBQUEsR0FBVSxDQUFDLElBQUksQ0FBQyxTQUFMLENBQWUscUJBQWYsRUFBc0MsTUFBdEMsRUFBaUQsQ0FBakQsQ0FBRCxDQUFWLEdBQStELE9BQWhFLENBRkEsQ0FoQ0EsQ0FBQTtBQW1DQSxNQUFBLElBQUcsa0JBQUg7QUFDRSxRQUFBLFNBQUEsQ0FBVSxDQUFWLEVBQWEsZUFBYixDQUFBLENBQUE7QUFBQSxRQUNBLE9BQUEsQ0FBUSxJQUFSLEVBQ0Usd0RBQUEsR0FDQSxDQUFDLFdBQUEsR0FBVSxDQUFDLElBQUksQ0FBQyxTQUFMLENBQWUsWUFBZixFQUE2QixNQUE3QixFQUF3QyxDQUF4QyxDQUFELENBQVYsR0FBc0QsT0FBdkQsQ0FGRixDQURBLENBREY7T0FuQ0E7QUFBQSxNQTBDQSxJQUFBLEdBQU8sRUExQ1AsQ0FBQTtBQUFBLE1BMkNBLGdCQUFBLEdBQXVCLElBQUEsTUFBQSxDQUFPLGdCQUFQLENBM0N2QixDQUFBO0FBQUEsTUE0Q0EsWUFBQSxHQUFlLE1BQU0sQ0FBQyxTQUFQLENBQWlCLFNBQUMsR0FBRCxHQUFBO0FBRTlCLFlBQUEsR0FBQTtBQUFBLFFBQUEsR0FBQSxHQUFNLElBQUksQ0FBQyxHQUFYLENBQUE7ZUFDQSxJQUFBLElBQVEsR0FBRyxDQUFDLE9BQUosQ0FBWSxnQkFBWixFQUE4QixTQUFDLENBQUQsRUFBRyxDQUFILEdBQUE7QUFDcEMsY0FBQSxPQUFBO0FBQUEsVUFBQSxDQUFBLEdBQUksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxHQUFSLENBQUosQ0FBQTtBQUFBLFVBQ0EsQ0FBQSxHQUFJLENBQUMsQ0FBQyxPQUFGLENBQVUsZUFBVixDQURKLENBQUE7QUFBQSxVQUVBLENBQUEsR0FBSSxDQUFDLENBQUMsS0FBRixDQUFRLENBQUEsR0FBRSxDQUFWLENBQVksQ0FBQyxJQUFiLENBQWtCLEdBQWxCLENBRkosQ0FBQTtBQUlBLGlCQUFPLEtBQUEsR0FBTSxDQUFOLEdBQVEsR0FBZixDQUxvQztRQUFBLENBQTlCLEVBSHNCO01BQUEsQ0FBakIsQ0E1Q2YsQ0FBQTtBQUFBLE1BdURBLEVBQUEsR0FBSyxTQUFDLE1BQUQsR0FBQTtBQUNILFlBQUEsOERBQUE7QUFBQSxRQUFBLFlBQVksQ0FBQyxPQUFiLENBQUEsQ0FBQSxDQUFBO0FBQUEsUUFDQSxTQUFBLENBQVUsQ0FBVixFQUFhLFNBQWIsQ0FEQSxDQUFBO0FBQUEsUUFJQSxPQUFBLENBQVEsMEJBQVIsRUFBcUMsT0FBQSxHQUFPLGVBQVAsR0FBdUIsSUFBdkIsR0FBMkIsTUFBM0IsR0FBa0MsT0FBdkUsQ0FKQSxDQUFBO0FBQUEsUUFNQSxNQUFBLEdBQVMsT0FBQSxDQUFRLE1BQVIsQ0FOVCxDQUFBO0FBQUEsUUFPQSxJQUFBLEdBQU8sTUFBTSxDQUFDLFdBQVAsQ0FBbUIsUUFBbkIsRUFBNkIsSUFBN0IsRUFDTCxNQURLLEVBQ0csVUFESCxFQUNlLFlBRGYsQ0FQUCxDQUFBO0FBQUEsUUFTQSxPQUFBLENBQVEsOEJBQVIsRUFBeUMsT0FBQSxHQUFPLGVBQVAsR0FBdUIsSUFBdkIsR0FBMkIsSUFBM0IsR0FBZ0MsT0FBekUsQ0FUQSxDQUFBO0FBQUEsUUFXQSxTQUFBLENBQVUsQ0FBVixFQUFhLE1BQWIsQ0FYQSxDQUFBO0FBQUEsUUFZQSxPQUFBLENBQVEsSUFBUixFQUFlLE9BQUEsR0FBTyxJQUFQLEdBQVksT0FBM0IsQ0FaQSxDQUFBO0FBQUEsUUFlQSxHQUFBLEdBQU0sd0JBZk4sQ0FBQTtBQWdCQSxhQUFBLDhDQUFBOytCQUFBO0FBQ0U7QUFBQTs7O2FBQUE7QUFBQSxVQUlBLE1BQUEsR0FBUyxJQUpULENBQUE7QUFBQSxVQUtBLE1BQUEsR0FBUyxHQUxULENBQUE7QUFBQSxVQU1BLFNBQUEsR0FBWSxNQUFNLENBQUMsS0FBUCxHQUFlLENBTjNCLENBQUE7QUFPQSxVQUFBLElBQUcsU0FBQSxJQUFhLENBQWhCO0FBQ0UsWUFBQSxHQUFBLElBQVEsRUFBQSxHQUFFLENBQUMsS0FBQSxDQUFNLFNBQUEsR0FBVSxDQUFoQixDQUFrQixDQUFDLElBQW5CLENBQXdCLE1BQXhCLENBQUQsQ0FBRixHQUFxQyxNQUFyQyxHQUE0QyxJQUE1QyxHQUFnRCxNQUFNLENBQUMsS0FBdkQsR0FBNkQsTUFBN0QsR0FBa0UsQ0FBQyxZQUFBLENBQWEsTUFBTSxDQUFDLEtBQXBCLENBQUQsQ0FBbEUsR0FBOEYsS0FBdEcsQ0FERjtXQVJGO0FBQUEsU0FoQkE7QUFBQSxRQTJCQSxTQUFBLEdBQVksU0FBUyxDQUFDLE9BQVYsQ0FBa0IsS0FBbEIsRUFBeUIsR0FBekIsQ0EzQlosQ0FBQTtBQUFBLFFBOEJBLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBZixDQUFxQixTQUFyQixDQTlCQSxDQUFBO2VBK0JBLE9BQUEsQ0FBUSxpRUFBQSxHQUNSLCtEQURRLEdBRVIsd0RBRlEsR0FHUixzREFIUSxHQUlSLDRFQUpRLEdBS1IsbUVBTFEsR0FNUixnRUFOQSxFQWhDRztNQUFBLENBdkRMLENBQUE7QUErRkE7ZUFDRSxVQUFVLENBQUMsUUFBWCxDQUFvQixJQUFwQixFQUEwQixVQUExQixFQUFzQyxXQUF0QyxFQUFtRCxRQUFuRCxDQUNBLENBQUMsSUFERCxDQUNNLEVBRE4sQ0FFQSxDQUFDLE9BQUQsQ0FGQSxDQUVPLEVBRlAsRUFERjtPQUFBLGNBQUE7QUFLRSxRQURJLFVBQ0osQ0FBQTtBQUFBLGVBQU8sRUFBQSxDQUFHLENBQUgsQ0FBUCxDQUxGO09BakdJO0lBQUEsQ0FETixFQTlGTTtFQUFBLENBalJSLENBQUE7O0FBQUEsRUF5ZEEsZUFBQSxHQUFrQixTQUFBLEdBQUE7V0FDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxTQUFDLE1BQUQsR0FBQTtBQUNoQyxVQUFBLGtCQUFBO0FBQUEsTUFBQSxNQUFBLEdBQVMsTUFBTSxDQUFDLFNBQVAsQ0FBQSxDQUFULENBQUE7QUFBQSxNQUNBLFVBQUEsR0FBYSxNQUFNLENBQUMsU0FBUCxDQUFpQixTQUFDLElBQUQsR0FBQTtBQUM1QixZQUFBLG1HQUFBO0FBQUEsUUFEcUMsV0FBUixLQUFDLElBQzlCLENBQUE7O1VBQUEsT0FBUSxPQUFBLENBQVEsTUFBUjtTQUFSO0FBQUEsUUFFQSxPQUFBLEdBQVUsTUFBTSxDQUFDLFVBQVAsQ0FBQSxDQUFtQixDQUFDLElBRjlCLENBQUE7QUFBQSxRQUlBLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLE9BQUwsQ0FBYSxRQUFiLENBSmhCLENBQUE7QUFBQSxRQU1BLGFBQUEsR0FBZ0IsYUFBYSxDQUFDLE1BQWQsQ0FBcUIsQ0FBckIsQ0FOaEIsQ0FBQTtBQUFBLFFBUUEsU0FBQSxHQUFZLFVBQVUsQ0FBQyxTQUFTLENBQUMsWUFBckIsQ0FBa0M7QUFBQSxVQUFDLFNBQUEsT0FBRDtBQUFBLFVBQVUsU0FBQSxFQUFXLGFBQXJCO1NBQWxDLENBUlosQ0FBQTtBQVNBLFFBQUEsSUFBRyxTQUFTLENBQUMsTUFBVixHQUFtQixDQUF0QjtBQUNFLGdCQUFBLENBREY7U0FUQTtBQUFBLFFBWUEsUUFBQSxHQUFXLFNBQVUsQ0FBQSxDQUFBLENBWnJCLENBQUE7QUFBQSxRQWNBLEdBQUEsR0FBTyx5QkFBQSxHQUF5QixRQUFRLENBQUMsU0FBbEMsR0FBNEMsbUJBZG5ELENBQUE7QUFBQSxRQWVBLGNBQUEsR0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLEdBQWhCLENBZmpCLENBQUE7QUFBQSxRQWdCQSxNQUFNLENBQUMsT0FBUCxDQUFlLHVCQUFmLEVBQXdDLEdBQXhDLEVBQTZDLGNBQTdDLENBaEJBLENBQUE7QUFpQkEsUUFBQSxJQUFHLGNBQUg7QUFDRSxVQUFBLFFBQUEsR0FBVyxVQUFBLENBQVcsTUFBWCxDQUFYLENBQUE7QUFBQSxVQUNBLGFBQUEsR0FBZ0IsTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQURoQixDQUFBO2lCQUVBLGdCQUFBLENBQWlCLFFBQWpCLEVBQTJCLFNBQUEsR0FBQTtBQUN6QixZQUFBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBQSxDQUFBLEtBQW9CLElBQXZCO0FBQ0UsY0FBQSxNQUFNLENBQUMsTUFBUCxDQUFBLENBQUEsQ0FBQTtBQUFBLGNBQ0EsTUFBTSxDQUFDLE9BQVAsQ0FBZSwwQkFBZixFQUEyQyxRQUEzQyxFQUFvRCxhQUFwRCxDQURBLENBQUE7cUJBS0EsVUFBQSxDQUFXLENBQUUsU0FBQSxHQUFBO0FBQ1gsZ0JBQUEsVUFBQSxDQUFXLE1BQVgsRUFBbUIsUUFBbkIsQ0FBQSxDQUFBO0FBQUEsZ0JBQ0EsTUFBTSxDQUFDLFlBQVAsQ0FBb0IsYUFBcEIsQ0FEQSxDQURXO2NBQUEsQ0FBRixDQUFYLEVBS0csQ0FMSCxFQU5GO2FBRHlCO1VBQUEsQ0FBM0IsRUFIRjtTQWxCNEI7TUFBQSxDQUFqQixDQURiLENBQUE7YUFxQ0EsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFyQixDQUF5QixVQUF6QixFQXRDZ0M7SUFBQSxDQUFsQyxFQURnQjtFQUFBLENBemRsQixDQUFBOztBQUFBLEVBaWdCQSxNQUFNLENBQUMsTUFBUCxHQUFnQixDQUFDLENBQUMsS0FBRixDQUFRLE9BQUEsQ0FBUSxpQkFBUixDQUFSLEVBQW9DLHNCQUFwQyxDQWpnQmhCLENBQUE7O0FBQUEsRUFrZ0JBLE1BQU0sQ0FBQyxRQUFQLEdBQWtCLFNBQUEsR0FBQTtBQUNoQixJQUFBLElBQUMsQ0FBQSxhQUFELEdBQWlCLEdBQUEsQ0FBQSxtQkFBakIsQ0FBQTtBQUFBLElBQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLGVBQUEsQ0FBQSxDQUFuQixDQURBLENBQUE7QUFBQSxJQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQVosQ0FBb0IsOEJBQXBCLEVBQW9ELGVBQXBELENBQW5CLENBRkEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsK0JBQXBDLEVBQXFFLFFBQXJFLENBQW5CLENBSEEsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsaUNBQXBDLEVBQXVFLEtBQXZFLENBQW5CLENBSkEsQ0FBQTtBQUFBLElBS0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQix3QkFBbEIsRUFBNEMsNkJBQTVDLEVBQTJFLFlBQTNFLENBQW5CLENBTEEsQ0FBQTtXQU1BLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsNkJBQWxCLEVBQWlELGtDQUFqRCxFQUFxRixpQkFBckYsQ0FBbkIsRUFQZ0I7RUFBQSxDQWxnQmxCLENBQUE7O0FBQUEsRUEyZ0JBLE1BQU0sQ0FBQyxVQUFQLEdBQW9CLFNBQUEsR0FBQTtXQUNsQixJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQSxFQURrQjtFQUFBLENBM2dCcEIsQ0FBQTtBQUFBIgp9

//# sourceURL=/Users/nansthomas/.atom/packages/atom-beautify/src/beautify.coffee
