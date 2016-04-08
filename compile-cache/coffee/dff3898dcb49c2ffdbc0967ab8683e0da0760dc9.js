(function() {
  var Beautifier, Beautifiers, Languages, Promise, beautifiers, fs, isWindows, path, temp, _;

  Beautifiers = require("../src/beautifiers");

  beautifiers = new Beautifiers();

  Beautifier = require("../src/beautifiers/beautifier");

  Languages = require('../src/languages/');

  _ = require('lodash');

  fs = require('fs');

  path = require('path');

  Promise = require("bluebird");

  temp = require('temp');

  temp.track();

  isWindows = process.platform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys';

  describe("Atom-Beautify", function() {
    beforeEach(function() {
      return waitsForPromise(function() {
        var activationPromise, pack;
        activationPromise = atom.packages.activatePackage('atom-beautify');
        pack = atom.packages.getLoadedPackage("atom-beautify");
        pack.activateNow();
        return activationPromise;
      });
    });
    afterEach(function() {
      return temp.cleanupSync();
    });
    describe("Beautifiers", function() {
      var beautifier;
      beautifier = null;
      beforeEach(function() {
        return beautifier = new Beautifier();
      });
      return describe("Beautifier::run", function() {
        it("should error when beautifier's program not found", function() {
          expect(beautifier).not.toBe(null);
          expect(beautifier instanceof Beautifier).toBe(true);
          return waitsForPromise({
            shouldReject: true
          }, function() {
            var cb, p;
            p = beautifier.run("program", []);
            expect(p).not.toBe(null);
            expect(p instanceof beautifier.Promise).toBe(true);
            cb = function(v) {
              expect(v).not.toBe(null);
              expect(v instanceof Error).toBe(true);
              expect(v.code).toBe("CommandNotFound");
              expect(v.description).toBe(void 0, 'Error should not have a description.');
              return v;
            };
            p.then(cb, cb);
            return p;
          });
        });
        it("should error with help description when beautifier's program not found", function() {
          expect(beautifier).not.toBe(null);
          expect(beautifier instanceof Beautifier).toBe(true);
          return waitsForPromise({
            shouldReject: true
          }, function() {
            var cb, help, p;
            help = {
              link: "http://test.com",
              program: "test-program",
              pathOption: "Lang - Test Program Path"
            };
            p = beautifier.run("program", [], {
              help: help
            });
            expect(p).not.toBe(null);
            expect(p instanceof beautifier.Promise).toBe(true);
            cb = function(v) {
              expect(v).not.toBe(null);
              expect(v instanceof Error).toBe(true);
              expect(v.code).toBe("CommandNotFound");
              expect(v.description).not.toBe(null);
              expect(v.description.indexOf(help.link)).not.toBe(-1);
              expect(v.description.indexOf(help.program)).not.toBe(-1);
              expect(v.description.indexOf(help.pathOption)).not.toBe(-1, "Error should have a description.");
              return v;
            };
            p.then(cb, cb);
            return p;
          });
        });
        it("should error with Windows-specific help description when beautifier's program not found", function() {
          expect(beautifier).not.toBe(null);
          expect(beautifier instanceof Beautifier).toBe(true);
          return waitsForPromise({
            shouldReject: true
          }, function() {
            var cb, help, p, terminal, whichCmd;
            help = {
              link: "http://test.com",
              program: "test-program",
              pathOption: "Lang - Test Program Path"
            };
            beautifier.isWindows = true;
            terminal = 'CMD prompt';
            whichCmd = "where.exe";
            p = beautifier.run("program", [], {
              help: help
            });
            expect(p).not.toBe(null);
            expect(p instanceof beautifier.Promise).toBe(true);
            cb = function(v) {
              expect(v).not.toBe(null);
              expect(v instanceof Error).toBe(true);
              expect(v.code).toBe("CommandNotFound");
              expect(v.description).not.toBe(null);
              expect(v.description.indexOf(help.link)).not.toBe(-1);
              expect(v.description.indexOf(help.program)).not.toBe(-1);
              expect(v.description.indexOf(help.pathOption)).not.toBe(-1, "Error should have a description.");
              expect(v.description.indexOf(terminal)).not.toBe(-1, "Error should have a description including '" + terminal + "' in message.");
              expect(v.description.indexOf(whichCmd)).not.toBe(-1, "Error should have a description including '" + whichCmd + "' in message.");
              return v;
            };
            p.then(cb, cb);
            return p;
          });
        });
        if (!isWindows) {
          return it("should error with Mac/Linux-specific help description when beautifier's program not found", function() {
            expect(beautifier).not.toBe(null);
            expect(beautifier instanceof Beautifier).toBe(true);
            return waitsForPromise({
              shouldReject: true
            }, function() {
              var cb, help, p, terminal, whichCmd;
              help = {
                link: "http://test.com",
                program: "test-program",
                pathOption: "Lang - Test Program Path"
              };
              beautifier.isWindows = false;
              terminal = "Terminal";
              whichCmd = "which";
              p = beautifier.run("program", [], {
                help: help
              });
              expect(p).not.toBe(null);
              expect(p instanceof beautifier.Promise).toBe(true);
              cb = function(v) {
                expect(v).not.toBe(null);
                expect(v instanceof Error).toBe(true);
                expect(v.code).toBe("CommandNotFound");
                expect(v.description).not.toBe(null);
                expect(v.description.indexOf(help.link)).not.toBe(-1);
                expect(v.description.indexOf(help.program)).not.toBe(-1);
                expect(v.description.indexOf(terminal)).not.toBe(-1, "Error should have a description including '" + terminal + "' in message.");
                expect(v.description.indexOf(whichCmd)).not.toBe(-1, "Error should have a description including '" + whichCmd + "' in message.");
                return v;
              };
              p.then(cb, cb);
              return p;
            });
          });
        }
      });
    });
    return describe("Options", function() {
      var beautifier, beautifyEditor, editor, workspaceElement;
      editor = null;
      beautifier = null;
      workspaceElement = atom.views.getView(atom.workspace);
      beforeEach(function() {
        beautifier = new Beautifiers();
        return waitsForPromise(function() {
          return atom.workspace.open().then(function(e) {
            editor = e;
            return expect(editor.getText()).toEqual("");
          });
        });
      });
      describe("Migrate Settings", function() {
        var migrateSettings;
        migrateSettings = function(beforeKey, afterKey, val) {
          atom.config.set("atom-beautify." + beforeKey, val);
          atom.commands.dispatch(workspaceElement, "atom-beautify:migrate-settings");
          expect(_.has(atom.config.get('atom-beautify'), beforeKey)).toBe(false);
          return expect(atom.config.get("atom-beautify." + afterKey)).toBe(val);
        };
        it("should migrate js_indent_size to js.indent_size", function() {
          return migrateSettings("js_indent_size", "js.indent_size", 10);
        });
        it("should migrate analytics to general.analytics", function() {
          return migrateSettings("analytics", "general.analytics", true);
        });
        return it("should migrate _analyticsUserId to general._analyticsUserId", function() {
          return migrateSettings("_analyticsUserId", "general._analyticsUserId", "userid");
        });
      });
      beautifyEditor = function(callback) {
        var beforeText, delay, isComplete;
        isComplete = false;
        beforeText = null;
        delay = 500;
        runs(function() {
          beforeText = editor.getText();
          atom.commands.dispatch(workspaceElement, "atom-beautify:beautify-editor");
          return setTimeout(function() {
            return isComplete = true;
          }, delay);
        });
        waitsFor(function() {
          return isComplete;
        });
        return runs(function() {
          var afterText;
          afterText = editor.getText();
          expect(typeof beforeText).toBe('string');
          expect(typeof afterText).toBe('string');
          return callback(beforeText, afterText);
        });
      };
      return describe("JavaScript", function() {
        beforeEach(function() {
          waitsForPromise(function() {
            var packName;
            packName = 'language-javascript';
            return atom.packages.activatePackage(packName);
          });
          return runs(function() {
            var code, grammar;
            code = "var hello='world';function(){console.log('hello '+hello)}";
            editor.setText(code);
            grammar = atom.grammars.selectGrammar('source.js');
            expect(grammar.name).toBe('JavaScript');
            editor.setGrammar(grammar);
            expect(editor.getGrammar().name).toBe('JavaScript');
            return jasmine.unspy(window, 'setTimeout');
          });
        });
        describe(".jsbeautifyrc", function() {
          return it("should look at directories above file", function() {
            var cb, isDone;
            isDone = false;
            cb = function(err) {
              isDone = true;
              return expect(err).toBe(void 0);
            };
            runs(function() {
              var err;
              try {
                return temp.mkdir('dir1', function(err, dirPath) {
                  var myData, myData1, rcPath;
                  if (err) {
                    return cb(err);
                  }
                  rcPath = path.join(dirPath, '.jsbeautifyrc');
                  myData1 = {
                    indent_size: 1,
                    indent_char: '\t'
                  };
                  myData = JSON.stringify(myData1);
                  return fs.writeFile(rcPath, myData, function(err) {
                    if (err) {
                      return cb(err);
                    }
                    dirPath = path.join(dirPath, 'dir2');
                    return fs.mkdir(dirPath, function(err) {
                      var myData2;
                      if (err) {
                        return cb(err);
                      }
                      rcPath = path.join(dirPath, '.jsbeautifyrc');
                      myData2 = {
                        indent_size: 2,
                        indent_char: ' '
                      };
                      myData = JSON.stringify(myData2);
                      return fs.writeFile(rcPath, myData, function(err) {
                        if (err) {
                          return cb(err);
                        }
                        return Promise.all(beautifier.getOptionsForPath(rcPath, null)).then(function(allOptions) {
                          var config1, config2, configOptions, editorConfigOptions, editorOptions, homeOptions, projectOptions, _ref;
                          editorOptions = allOptions[0], configOptions = allOptions[1], homeOptions = allOptions[2], editorConfigOptions = allOptions[3];
                          projectOptions = allOptions.slice(4);
                          _ref = projectOptions.slice(-2), config1 = _ref[0], config2 = _ref[1];
                          expect(_.get(config1, '_default.indent_size')).toBe(myData1.indent_size);
                          expect(_.get(config2, '_default.indent_size')).toBe(myData2.indent_size);
                          expect(_.get(config1, '_default.indent_char')).toBe(myData1.indent_char);
                          expect(_.get(config2, '_default.indent_char')).toBe(myData2.indent_char);
                          return cb();
                        });
                      });
                    });
                  });
                });
              } catch (_error) {
                err = _error;
                return cb(err);
              }
            });
            return waitsFor(function() {
              return isDone;
            });
          });
        });
        return describe("Package settings", function() {
          var getOptions;
          getOptions = function(callback) {
            var options;
            options = null;
            waitsForPromise(function() {
              var allOptions;
              allOptions = beautifier.getOptionsForPath(null, null);
              return Promise.all(allOptions).then(function(allOptions) {
                return options = allOptions;
              });
            });
            return runs(function() {
              return callback(options);
            });
          };
          it("should change indent_size to 1", function() {
            atom.config.set('atom-beautify.js.indent_size', 1);
            return getOptions(function(allOptions) {
              var configOptions;
              expect(typeof allOptions).toBe('object');
              configOptions = allOptions[1];
              expect(typeof configOptions).toBe('object');
              expect(configOptions.js.indent_size).toBe(1);
              return beautifyEditor(function(beforeText, afterText) {
                return expect(afterText).toBe("var hello = 'world';\n\nfunction() {\n console.log('hello ' + hello)\n}");
              });
            });
          });
          return it("should change indent_size to 10", function() {
            atom.config.set('atom-beautify.js.indent_size', 10);
            return getOptions(function(allOptions) {
              var configOptions;
              expect(typeof allOptions).toBe('object');
              configOptions = allOptions[1];
              expect(typeof configOptions).toBe('object');
              expect(configOptions.js.indent_size).toBe(10);
              return beautifyEditor(function(beforeText, afterText) {
                return expect(afterText).toBe("var hello = 'world';\n\nfunction() {\n          console.log('hello ' + hello)\n}");
              });
            });
          });
        });
      });
    });
  });

  describe("Languages", function() {
    var languages;
    languages = null;
    beforeEach(function() {
      return languages = new Languages();
    });
    return describe("Languages::namespace", function() {
      return it("should verify that multiple languages do not share the same namespace", function() {
        var namespaceGroups, namespaceOverlap, namespacePairs;
        namespaceGroups = _.groupBy(languages.languages, "namespace");
        namespacePairs = _.toPairs(namespaceGroups);
        namespaceOverlap = _.filter(namespacePairs, function(_arg) {
          var group, namespace;
          namespace = _arg[0], group = _arg[1];
          return group.length > 1;
        });
        return expect(namespaceOverlap.length).toBe(0, "Language namespaces are overlapping.\nNamespaces are unique: only one language for each namespace.\n" + _.map(namespaceOverlap, function(_arg) {
          var group, namespace;
          namespace = _arg[0], group = _arg[1];
          return "- '" + namespace + "': Check languages " + (_.map(group, 'name').join(', ')) + " for using namespace '" + namespace + "'.";
        }).join('\n'));
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvYXRvbS1iZWF1dGlmeS9zcGVjL2F0b20tYmVhdXRpZnktc3BlYy5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsc0ZBQUE7O0FBQUEsRUFBQSxXQUFBLEdBQWMsT0FBQSxDQUFRLG9CQUFSLENBQWQsQ0FBQTs7QUFBQSxFQUNBLFdBQUEsR0FBa0IsSUFBQSxXQUFBLENBQUEsQ0FEbEIsQ0FBQTs7QUFBQSxFQUVBLFVBQUEsR0FBYSxPQUFBLENBQVEsK0JBQVIsQ0FGYixDQUFBOztBQUFBLEVBR0EsU0FBQSxHQUFZLE9BQUEsQ0FBUSxtQkFBUixDQUhaLENBQUE7O0FBQUEsRUFJQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FKSixDQUFBOztBQUFBLEVBS0EsRUFBQSxHQUFPLE9BQUEsQ0FBUSxJQUFSLENBTFAsQ0FBQTs7QUFBQSxFQU1BLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUixDQU5QLENBQUE7O0FBQUEsRUFPQSxPQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVIsQ0FQVixDQUFBOztBQUFBLEVBUUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSLENBUlAsQ0FBQTs7QUFBQSxFQVNBLElBQUksQ0FBQyxLQUFMLENBQUEsQ0FUQSxDQUFBOztBQUFBLEVBaUJBLFNBQUEsR0FBWSxPQUFPLENBQUMsUUFBUixLQUFvQixPQUFwQixJQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBWixLQUFzQixRQURaLElBRVYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFaLEtBQXNCLE1BbkJ4QixDQUFBOztBQUFBLEVBcUJBLFFBQUEsQ0FBUyxlQUFULEVBQTBCLFNBQUEsR0FBQTtBQUV4QixJQUFBLFVBQUEsQ0FBVyxTQUFBLEdBQUE7YUFHVCxlQUFBLENBQWdCLFNBQUEs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

//# sourceURL=/Users/nansthomas/.atom/packages/atom-beautify/spec/atom-beautify-spec.coffee
