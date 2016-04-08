(function() {
  var ArgumentParser, Emitter, File, InlineParameterParser, NodeSassCompiler, SassAutocompileOptions, exec, fs, path;

  Emitter = require('event-kit').Emitter;

  SassAutocompileOptions = require('./options');

  InlineParameterParser = require('./helper/inline-parameters-parser');

  File = require('./helper/file');

  ArgumentParser = require('./helper/argument-parser');

  fs = require('fs');

  path = require('path');

  exec = require('child_process').exec;

  module.exports = NodeSassCompiler = (function() {
    NodeSassCompiler.MODE_DIRECT = 'direct';

    NodeSassCompiler.MODE_FILE = 'to-file';

    function NodeSassCompiler(options) {
      this.options = options;
      this.emitter = new Emitter();
    }

    NodeSassCompiler.prototype.destroy = function() {
      this.emitter.dispose();
      return this.emitter = null;
    };

    NodeSassCompiler.prototype.compile = function(mode, filename, compileOnSave) {
      if (filename == null) {
        filename = null;
      }
      if (compileOnSave == null) {
        compileOnSave = false;
      }
      this.compileOnSave = compileOnSave;
      this.childFiles = {};
      return this._compile(mode, filename);
    };

    NodeSassCompiler.prototype._compile = function(mode, filename, compileOnSave) {
      var parameterParser, parameterTarget;
      if (filename == null) {
        filename = null;
      }
      if (compileOnSave == null) {
        compileOnSave = false;
      }
      this.mode = mode;
      this.targetFilename = filename;
      this.inputFile = void 0;
      this.outputFile = void 0;
      parameterParser = new InlineParameterParser();
      parameterTarget = this.getParameterTarget();
      return parameterParser.parse(parameterTarget, (function(_this) {
        return function(params, error) {
          var errorMessage;
          if (_this.compileOnSave && _this.prohibitCompilationOnSave(params)) {
            _this.emitFinished();
            return;
          }
          if (params === false && _this.options.compileOnlyFirstLineCommentFiles) {
            _this.emitFinished();
            return;
          }
          if (error) {
            _this.emitMessageAndFinish('error', error, true);
            return;
          }
          _this.setupInputFile(filename);
          if ((errorMessage = _this.validateInputFile()) !== void 0) {
            _this.emitMessageAndFinish('error', errorMessage, true);
            return;
          }
          if (params === false && _this.isPartial() && !_this.options.compilePartials) {
            _this.emitFinished();
            return;
          }
          if (typeof params.main === 'string') {
            if (params.main === _this.inputFile.path || _this.childFiles[params.main] !== void 0) {
              return _this.emitMessageAndFinish('error', 'Following the main parameter ends in a loop.');
            } else if (_this.inputFile.isTemporary) {
              return _this.emitMessageAndFinish('error', '\'main\' inline parameter is not supported in direct compilation.');
            } else {
              _this.childFiles[params.main] = true;
              return _this._compile(_this.mode, params.main);
            }
          } else {
            _this.emitStart();
            if (_this.isCompileToFile() && !_this.ensureFileIsSaved()) {
              _this.emitMessageAndFinish('warning', 'Compilation cancelled');
              return;
            }
            _this.updateOptionsWithInlineParameters(params);
            _this.outputStyles = _this.getOutputStylesToCompileTo();
            if (_this.outputStyles.length === 0) {
              _this.emitMessageAndFinish('warning', 'No output style defined! Please enable at least one style in options or use inline parameters.');
              return;
            }
            return _this.doCompile();
          }
        };
      })(this));
    };

    NodeSassCompiler.prototype.getParameterTarget = function() {
      if (typeof this.targetFilename === 'string') {
        return this.targetFilename;
      } else {
        return atom.workspace.getActiveTextEditor();
      }
    };

    NodeSassCompiler.prototype.prohibitCompilationOnSave = function(params) {
      var _ref;
      if (params && ((_ref = params.compileOnSave) === true || _ref === false)) {
        this.options.compileOnSave = params.compileOnSave;
      }
      return !this.options.compileOnSave;
    };

    NodeSassCompiler.prototype.isPartial = function() {
      var filename;
      filename = path.basename(this.inputFile.path);
      return filename[0] === '_';
    };

    NodeSassCompiler.prototype.setupInputFile = function(filename) {
      var activeEditor, syntax;
      if (filename == null) {
        filename = null;
      }
      this.inputFile = {
        isTemporary: false
      };
      if (filename) {
        return this.inputFile.path = filename;
      } else {
        activeEditor = atom.workspace.getActiveTextEditor();
        if (!activeEditor) {
          return;
        }
        if (this.isCompileDirect()) {
          syntax = this.askForInputSyntax();
          if (syntax) {
            this.inputFile.path = File.getTemporaryFilename('sass-autocompile.input.', null, syntax);
            this.inputFile.isTemporary = true;
            return fs.writeFileSync(this.inputFile.path, activeEditor.getText());
          } else {
            return this.inputFile.path = void 0;
          }
        } else {
          this.inputFile.path = activeEditor.getURI();
          if (!this.inputFile.path) {
            return this.inputFile.path = this.askForSavingUnsavedFileInActiveEditor();
          }
        }
      }
    };

    NodeSassCompiler.prototype.askForInputSyntax = function() {
      var dialogResultButton, syntax;
      dialogResultButton = atom.confirm({
        message: "Is the syntax if your inout SASS or SCSS?",
        buttons: ['SASS', 'SCSS', 'Cancel']
      });
      switch (dialogResultButton) {
        case 0:
          syntax = 'sass';
          break;
        case 1:
          syntax = 'scss';
          break;
        default:
          syntax = void 0;
      }
      return syntax;
    };

    NodeSassCompiler.prototype.askForSavingUnsavedFileInActiveEditor = function() {
      var activeEditor, dialogResultButton, error, filename;
      activeEditor = atom.workspace.getActiveTextEditor();
      dialogResultButton = atom.confirm({
        message: "In order to compile this SASS file to a CSS file, you have do save it before. Do you want to save this file?",
        detailedMessage: "Alternativly you can use 'Direct Compilation' for compiling without creating a CSS file.",
        buttons: ["Save", "Cancel"]
      });
      if (dialogResultButton === 0) {
        filename = atom.showSaveDialogSync();
        try {
          activeEditor.saveAs(filename);
        } catch (_error) {
          error = _error;
        }
        filename = activeEditor.getURI();
        return filename;
      }
      return void 0;
    };

    NodeSassCompiler.prototype.validateInputFile = function() {
      var errorMessage;
      errorMessage = void 0;
      if (!this.inputFile.path) {
        errorMessage = 'Invalid file: ' + this.inputFile.path;
      }
      if (!fs.existsSync(this.inputFile.path)) {
        errorMessage = 'File does not exist: ' + this.inputFile.path;
      }
      return errorMessage;
    };

    NodeSassCompiler.prototype.ensureFileIsSaved = function() {
      var dialogResultButton, editor, editors, filename, _i, _len;
      editors = atom.workspace.getTextEditors();
      for (_i = 0, _len = editors.length; _i < _len; _i++) {
        editor = editors[_i];
        if (editor && editor.getURI && editor.getURI() === this.inputFile.path && editor.isModified()) {
          filename = path.basename(this.inputFile.path);
          dialogResultButton = atom.confirm({
            message: "'" + filename + "' has changes, do you want to save them?",
            detailedMessage: "In order to compile SASS you have to save changes.",
            buttons: ["Save and compile", "Cancel"]
          });
          if (dialogResultButton === 0) {
            editor.save();
            break;
          } else {
            return false;
          }
        }
      }
      return true;
    };

    NodeSassCompiler.prototype.updateOptionsWithInlineParameters = function(params) {
      var outputStyle, _ref, _ref1;
      if (typeof params.out === 'string' || typeof params.outputStyle === 'string' || typeof params.compress === 'boolean') {
        if (this.options.showOldParametersWarning) {
          this.emitMessage('warning', 'Please don\'t use \'out\', \'outputStyle\' or \'compress\' parameter any more. Have a look at the documentation for newer parameters');
        }
        outputStyle = 'compressed';
        if (params.compress === false) {
          outputStyle = 'nested';
        }
        if (params.compress === true) {
          outputStyle = 'compressed';
        }
        if (params.outputStyle) {
          outputStyle = typeof params.outputStyle === 'string' ? params.outputStyle.toLowerCase() : 'compressed';
        }
        this.options.compileCompressed = outputStyle === 'compressed';
        if (outputStyle === 'compressed' && typeof params.out === 'string' && params.out.length > 0) {
          this.options.compressedFilenamePattern = params.out;
        }
        this.options.compileCompact = outputStyle === 'compact';
        if (outputStyle === 'compact' && typeof params.out === 'string' && params.out.length > 0) {
          this.options.compactFilenamePattern = params.out;
        }
        this.options.compileNested = outputStyle === 'nested';
        if (outputStyle === 'nested' && typeof params.out === 'string' && params.out.length > 0) {
          this.options.nestedFilenamePattern = params.out;
        }
        this.options.compileExpanded = outputStyle === 'expanded';
        if (outputStyle === 'expanded' && typeof params.out === 'string' && params.out.length > 0) {
          this.options.expandedFilenamePattern = params.out;
        }
      }
      if (params.compileCompressed || params.compileCompact || params.compileNested || params.compileExpanded) {
        this.options.compileCompressed = false;
        this.options.compileCompact = false;
        this.options.compileNested = false;
        this.options.compileExpanded = false;
      }
      if (params.compileCompressed === true || params.compileCompressed === false) {
        this.options.compileCompressed = params.compileCompressed;
      } else if (typeof params.compileCompressed === 'string') {
        this.options.compileCompressed = true;
        this.options.compressedFilenamePattern = params.compileCompressed;
      }
      if (typeof params.compressedFilenamePattern === 'string' && params.compressedFilenamePattern.length > 1) {
        this.options.compressedFilenamePattern = params.compressedFilenamePattern;
      }
      if (params.compileCompact === true || params.compileCompact === false) {
        this.options.compileCompact = params.compileCompact;
      } else if (typeof params.compileCompact === 'string') {
        this.options.compileCompact = true;
        this.options.compactFilenamePattern = params.compileCompact;
      }
      if (typeof params.compactFilenamePattern === 'string' && params.compactFilenamePattern.length > 1) {
        this.options.compactFilenamePattern = params.compactFilenamePattern;
      }
      if (params.compileNested === true || params.compileNested === false) {
        this.options.compileNested = params.compileNested;
      } else if (typeof params.compileNested === 'string') {
        this.options.compileNested = true;
        this.options.nestedFilenamePattern = params.compileNested;
      }
      if (typeof params.nestedFilenamePattern === 'string' && params.nestedFilenamePattern.length > 1) {
        this.options.nestedFilenamePattern = params.nestedFilenamePattern;
      }
      if (params.compileExpanded === true || params.compileExpanded === false) {
        this.options.compileExpanded = params.compileExpanded;
      } else if (typeof params.compileExpanded === 'string') {
        this.options.compileExpanded = true;
        this.options.expandedFilenamePattern = params.compileExpanded;
      }
      if (typeof params.expandedFilenamePattern === 'string' && params.expandedFilenamePattern.length > 1) {
        this.options.expandedFilenamePattern = params.expandedFilenamePattern;
      }
      if (typeof params.indentType === 'string' && ((_ref = params.indentType.toLowerCase()) === 'space' || _ref === 'tab')) {
        this.options.indentType = params.indentType.toLowerCase();
      }
      if (typeof params.indentWidth === 'number' && params.indentWidth <= 10 && indentWidth >= 0) {
        this.options.indentWidth = params.indentWidth;
      }
      if (typeof params.linefeed === 'string' && ((_ref1 = params.linefeed.toLowerCase()) === 'cr' || _ref1 === 'crlf' || _ref1 === 'lf' || _ref1 === 'lfcr')) {
        this.options.linefeed = params.linefeed.toLowerCase();
      }
      if (params.sourceMap === true || params.sourceMap === false || (typeof params.sourceMap === 'string' && params.sourceMap.length > 1)) {
        this.options.sourceMap = params.sourceMap;
      }
      if (params.sourceMapEmbed === true || params.sourceMapEmbed === false) {
        this.options.sourceMapEmbed = params.sourceMapEmbed;
      }
      if (params.sourceMapContents === true || params.sourceMapContents === false) {
        this.options.sourceMapContents = params.sourceMapContents;
      }
      if (params.sourceComments === true || params.sourceComments === false) {
        this.options.sourceComments = params.sourceComments;
      }
      if ((typeof params.includePath === 'string' && params.includePath.length > 1) || Array.isArray(params.includePath)) {
        this.options.includePath = params.includePath;
      } else if ((typeof params.includePaths === 'string' && params.includePaths.length > 1) || Array.isArray(params.includePaths)) {
        this.options.includePath = params.includePaths;
      }
      if (typeof params.precision === 'number' && params.precision >= 0) {
        this.options.precision = params.precision;
      }
      if (typeof params.importer === 'string' && params.importer.length > 1) {
        this.options.importer = params.importer;
      }
      if (typeof params.functions === 'string' && params.functions.length > 1) {
        return this.options.functions = params.functions;
      }
    };

    NodeSassCompiler.prototype.getOutputStylesToCompileTo = function() {
      var dialogResultButton, outputStyles;
      outputStyles = [];
      if (this.options.compileCompressed) {
        outputStyles.push('compressed');
      }
      if (this.options.compileCompact) {
        outputStyles.push('compact');
      }
      if (this.options.compileNested) {
        outputStyles.push('nested');
      }
      if (this.options.compileExpanded) {
        outputStyles.push('expanded');
      }
      if (this.isCompileDirect() && outputStyles.length > 1) {
        outputStyles.push('Cancel');
        dialogResultButton = atom.confirm({
          message: "For direction compilation you have to select a single output style. Which one do you want to use?",
          buttons: outputStyles
        });
        if (dialogResultButton < outputStyles.length - 1) {
          outputStyles = [outputStyles[dialogResultButton]];
        } else {
          outputStyles = [];
        }
      }
      return outputStyles;
    };

    NodeSassCompiler.prototype.getOutputFile = function(outputStyle) {
      var basename, fileExtension, filename, outputFile, outputPath, pattern;
      outputFile = {
        style: outputStyle,
        isTemporary: false
      };
      if (this.isCompileDirect()) {
        outputFile.path = File.getTemporaryFilename('sass-autocompile.output.', null, 'css');
        outputFile.isTemporary = true;
      } else {
        switch (outputFile.style) {
          case 'compressed':
            pattern = this.options.compressedFilenamePattern;
            break;
          case 'compact':
            pattern = this.options.compactFilenamePattern;
            break;
          case 'nested':
            pattern = this.options.nestedFilenamePattern;
            break;
          case 'expanded':
            pattern = this.options.expandedFilenamePattern;
            break;
          default:
            throw new Error('Invalid output style.');
        }
        basename = path.basename(this.inputFile.path);
        fileExtension = path.extname(basename).replace('.', '');
        filename = basename.replace(new RegExp('^(.*?)\.(' + fileExtension + ')$', 'gi'), pattern);
        if (!path.isAbsolute(path.dirname(filename))) {
          outputPath = path.dirname(this.inputFile.path);
          filename = path.join(outputPath, filename);
        }
        outputFile.path = filename;
      }
      return outputFile;
    };

    NodeSassCompiler.prototype.checkOutputFileAlreadyExists = function(outputFile) {
      var dialogResultButton;
      if (this.options.checkOutputFileAlreadyExists) {
        if (fs.existsSync(outputFile.path)) {
          dialogResultButton = atom.confirm({
            message: "The output file already exists. Do you want to overwrite it?",
            detailedMessage: "Output file: '" + outputFile.path + "'",
            buttons: ["Overwrite", "Skip", "Cancel"]
          });
          switch (dialogResultButton) {
            case 0:
              return 'overwrite';
            case 1:
              return 'skip';
            case 2:
              return 'cancel';
          }
        }
      }
      return 'overwrite';
    };

    NodeSassCompiler.prototype.ensureOutputDirectoryExists = function(outputFile) {
      var outputPath;
      if (this.isCompileToFile()) {
        outputPath = path.dirname(outputFile.path);
        return File.ensureDirectoryExists(outputPath);
      }
    };

    NodeSassCompiler.prototype.tryToFindNodeSassInstallation = function(callback) {
      var checkNodeSassExists, devNull, existanceCheckCommand, possibleNodeSassPaths;
      devNull = process.platform === 'win32' ? 'nul' : '/dev/null';
      existanceCheckCommand = "node-sass --version >" + devNull + " 2>&1 && (echo found) || (echo fail)";
      possibleNodeSassPaths = [''];
      if (typeof this.options.nodeSassPath === 'string' && this.options.nodeSassPath.length > 1) {
        possibleNodeSassPaths.push(this.options.nodeSassPath);
      }
      if (process.platform === 'win32') {
        possibleNodeSassPaths.push(path.join(process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'], 'AppData\\Roaming\\npm'));
      }
      if (process.platform === 'linux') {
        possibleNodeSassPaths.push('/usr/local/bin');
      }
      if (process.platform === 'darwin') {
        possibleNodeSassPaths.push('/usr/local/bin');
      }
      checkNodeSassExists = (function(_this) {
        return function(foundInPath) {
          var command, environment, searchPath;
          if (typeof foundInPath === 'string') {
            if (foundInPath === _this.options.nodeSassPath) {
              callback(true, false);
            } else if (_this.askAndFixNodeSassPath(foundInPath)) {
              callback(true, true);
            } else {
              callback(false, false);
            }
            return;
          }
          if (possibleNodeSassPaths.length === 0) {
            callback(false, false);
            return;
          }
          searchPath = possibleNodeSassPaths.shift();
          command = path.join(searchPath, existanceCheckCommand);
          environment = Object.create(process.env);
          if (typeof searchPath === 'string' && searchPath.length > 1) {
            environment.PATH += ":" + searchPath;
          }
          return exec(command, {
            env: environment
          }, function(error, stdout, stderr) {
            if (stdout.trim() === 'found') {
              return checkNodeSassExists(searchPath);
            } else {
              return checkNodeSassExists();
            }
          });
        };
      })(this);
      return checkNodeSassExists();
    };

    NodeSassCompiler.prototype.askAndFixNodeSassPath = function(nodeSassPath) {
      var detailedMessage, dialogResultButton;
      if (nodeSassPath === '' && this.options.nodeSassPath !== '') {
        detailedMessage = "'Path to node-sass command' option will be cleared, because node-sass is accessable without absolute path.";
      } else if (nodeSassPath !== '' && this.options.nodeSassPath === '') {
        detailedMessage = "'Path to node-sass command' option will be set to '" + nodeSassPath + "', because command was found there.";
      } else if (nodeSassPath !== '' && this.options.nodeSassPath !== '') {
        detailedMessage = "'Path to node-sass command' option will be replaced with '" + nodeSassPath + "', because command was found there.";
      }
      dialogResultButton = atom.confirm({
        message: "'node-sass' command could not be found with current configuration, but it can be automatically fixed. Fix it?",
        detailedMessage: detailedMessage,
        buttons: ["Fix it", "Cancel"]
      });
      switch (dialogResultButton) {
        case 0:
          SassAutocompileOptions.set('nodeSassPath', nodeSassPath);
          this.options.nodeSassPath = nodeSassPath;
          return true;
        case 1:
          return false;
      }
    };

    NodeSassCompiler.prototype.doCompile = function() {
      var child, emitterParameters, error, execParameters, outputFile, outputStyle;
      if (this.outputStyles.length === 0) {
        this.emitFinished();
        if (this.inputFile.isTemporary) {
          File["delete"](this.inputFile.path);
        }
        return;
      }
      outputStyle = this.outputStyles.pop();
      outputFile = this.getOutputFile(outputStyle);
      emitterParameters = this.getBasicEmitterParameters({
        outputFilename: outputFile.path,
        outputStyle: outputFile.style
      });
      try {
        if (this.isCompileToFile()) {
          switch (this.checkOutputFileAlreadyExists(outputFile)) {
            case 'overwrite':
              break;
            case 'cancel':
              throw new Error('Compilation cancelled');
              break;
            case 'skip':
              emitterParameters.message = 'Compilation skipped: ' + outputFile.path;
              this.emitter.emit('warning', emitterParameters);
              this.doCompile();
              return;
          }
        }
        this.ensureOutputDirectoryExists(outputFile);
        this.startCompilingTimestamp = new Date().getTime();
        execParameters = this.prepareExecParameters(outputFile);
        return child = exec(execParameters.command, {
          env: execParameters.environment
        }, (function(_this) {
          return function(error, stdout, stderr) {
            if (child.exitCode > 0) {
              return _this.tryToFindNodeSassInstallation(function(found, fixed) {
                if (fixed) {
                  return _this._compile(_this.mode, _this.targetFilename);
                } else {
                  _this.onCompiled(outputFile, error, stdout, stderr);
                  return _this.doCompile();
                }
              });
            } else {
              _this.onCompiled(outputFile, error, stdout, stderr);
              return _this.doCompile();
            }
          };
        })(this));
      } catch (_error) {
        error = _error;
        emitterParameters.message = error;
        this.emitter.emit('error', emitterParameters);
        this.outputStyles = [];
        return this.doCompile();
      }
    };

    NodeSassCompiler.prototype.onCompiled = function(outputFile, error, stdout, stderr) {
      var compiledCss, emitterParameters, errorJson, errorMessage, statistics;
      emitterParameters = this.getBasicEmitterParameters({
        outputFilename: outputFile.path,
        outputStyle: outputFile.style
      });
      statistics = {
        duration: new Date().getTime() - this.startCompilingTimestamp
      };
      try {
        emitterParameters.nodeSassOutput = stdout ? stdout : stderr;
        if (error !== null) {
          if (error.message.indexOf('"message":') > -1) {
            errorJson = error.message.match(/{\n(.*?(\n))+}/gm);
            errorMessage = JSON.parse(errorJson);
          } else {
            errorMessage = error.message;
          }
          emitterParameters.message = errorMessage;
          this.emitter.emit('error', emitterParameters);
          return this.outputStyles = [];
        } else {
          statistics.before = File.getFileSize(this.inputFile.path);
          statistics.after = File.getFileSize(outputFile.path);
          statistics.unit = 'Byte';
          if (this.isCompileDirect()) {
            compiledCss = fs.readFileSync(outputFile.path);
            atom.workspace.getActiveTextEditor().setText(compiledCss.toString());
          }
          emitterParameters.statistics = statistics;
          return this.emitter.emit('success', emitterParameters);
        }
      } finally {
        if (outputFile.isTemporary) {
          File["delete"](outputFile.path);
        }
      }
    };

    NodeSassCompiler.prototype.prepareExecParameters = function(outputFile) {
      var command, environment, nodeSassParameters;
      nodeSassParameters = this.buildNodeSassParameters(outputFile);
      command = 'node-sass ' + nodeSassParameters.join(' ');
      environment = Object.create(process.env);
      if (typeof this.options.nodeSassPath === 'string' && this.options.nodeSassPath.length > 1) {
        command = path.join(this.options.nodeSassPath, command);
        environment.PATH += ":" + this.options.nodeSassPath;
      }
      return {
        command: command,
        environment: environment
      };
    };

    NodeSassCompiler.prototype.buildNodeSassParameters = function(outputFile) {
      var argumentParser, basename, execParameters, fileExtension, functionsFilename, i, importerFilename, includePath, sourceMapFilename, workingDirectory, _i, _ref;
      execParameters = [];
      workingDirectory = path.dirname(this.inputFile.path);
      execParameters.push('--output-style ' + outputFile.style);
      if (typeof this.options.indentType === 'string' && this.options.indentType.length > 0) {
        execParameters.push('--indent-type ' + this.options.indentType.toLowerCase());
      }
      if (typeof this.options.indentWidth === 'number') {
        execParameters.push('--indent-width ' + this.options.indentWidth);
      }
      if (typeof this.options.linefeed === 'string' && this.options.linefeed.lenght > 0) {
        execParameters.push('--linefeed ' + this.options.linefeed);
      }
      if (this.options.sourceComments === true) {
        execParameters.push('--source-comments');
      }
      if (this.options.sourceMap === true || (typeof this.options.sourceMap === 'string' && this.options.sourceMap.length > 0)) {
        if (this.options.sourceMap === true) {
          sourceMapFilename = outputFile.path + '.map';
        } else {
          basename = path.basename(outputFile.path);
          fileExtension = path.extname(basename).replace('.', '');
          sourceMapFilename = basename.replace(new RegExp('^(.*?)\.(' + fileExtension + ')$', 'gi'), this.options.sourceMap);
        }
        execParameters.push('--source-map "' + sourceMapFilename + '"');
      }
      if (this.options.sourceMapEmbed === true) {
        execParameters.push('--source-map-embed');
      }
      if (this.options.sourceMapContents === true) {
        execParameters.push('--source-map-contents');
      }
      if (this.options.includePath) {
        includePath = this.options.includePath;
        if (typeof includePath === 'string') {
          argumentParser = new ArgumentParser();
          includePath = argumentParser.parseValue('[' + includePath + ']');
          if (!Array.isArray(includePath)) {
            includePath = [includePath];
          }
        }
        for (i = _i = 0, _ref = includePath.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (!path.isAbsolute(includePath[i])) {
            includePath[i] = path.join(workingDirectory, includePath[i]);
          }
          execParameters.push('--include-path "' + includePath[i] + '"');
        }
      }
      if (typeof this.options.precision === 'number') {
        execParameters.push('--precision ' + this.options.precision);
      }
      if (typeof this.options.importer === 'string' && this.options.importer.length > 0) {
        importerFilename = this.options.importer;
        if (!path.isAbsolute(importerFilename)) {
          importerFilename = path.join(workingDirectory, importerFilename);
        }
        execParameters.push('--importer "' + path.resolve(importerFilename) + '"');
      }
      if (typeof this.options.functions === 'string' && this.options.functions.length > 0) {
        functionsFilename = this.options.functions;
        if (!path.isAbsolute(functionsFilename)) {
          functionsFilename = path.join(workingDirectory, functionsFilename);
        }
        execParameters.push('--functions "' + path.resolve(functionsFilename) + '"');
      }
      execParameters.push('"' + this.inputFile.path + '"');
      execParameters.push('"' + outputFile.path + '"');
      return execParameters;
    };

    NodeSassCompiler.prototype.emitStart = function() {
      return this.emitter.emit('start', this.getBasicEmitterParameters());
    };

    NodeSassCompiler.prototype.emitFinished = function() {
      this.deleteTemporaryFiles();
      return this.emitter.emit('finished', this.getBasicEmitterParameters());
    };

    NodeSassCompiler.prototype.emitMessage = function(type, message) {
      return this.emitter.emit(type, this.getBasicEmitterParameters({
        message: message
      }));
    };

    NodeSassCompiler.prototype.emitMessageAndFinish = function(type, message, emitStartEvent) {
      if (emitStartEvent == null) {
        emitStartEvent = false;
      }
      if (emitStartEvent) {
        this.emitStart();
      }
      this.emitMessage(type, message);
      return this.emitFinished();
    };

    NodeSassCompiler.prototype.getBasicEmitterParameters = function(additionalParameters) {
      var key, parameters, value;
      if (additionalParameters == null) {
        additionalParameters = {};
      }
      parameters = {
        isCompileToFile: this.isCompileToFile(),
        isCompileDirect: this.isCompileDirect()
      };
      if (this.inputFile) {
        parameters.inputFilename = this.inputFile.path;
      }
      for (key in additionalParameters) {
        value = additionalParameters[key];
        parameters[key] = value;
      }
      return parameters;
    };

    NodeSassCompiler.prototype.deleteTemporaryFiles = function() {
      if (this.inputFile && this.inputFile.isTemporary) {
        File["delete"](this.inputFile.path);
      }
      if (this.outputFile && this.outputFile.isTemporary) {
        return File["delete"](this.outputFile.path);
      }
    };

    NodeSassCompiler.prototype.isCompileDirect = function() {
      return this.mode === NodeSassCompiler.MODE_DIRECT;
    };

    NodeSassCompiler.prototype.isCompileToFile = function() {
      return this.mode === NodeSassCompiler.MODE_FILE;
    };

    NodeSassCompiler.prototype.onStart = function(callback) {
      return this.emitter.on('start', callback);
    };

    NodeSassCompiler.prototype.onSuccess = function(callback) {
      return this.emitter.on('success', callback);
    };

    NodeSassCompiler.prototype.onWarning = function(callback) {
      return this.emitter.on('warning', callback);
    };

    NodeSassCompiler.prototype.onError = function(callback) {
      return this.emitter.on('error', callback);
    };

    NodeSassCompiler.prototype.onFinished = function(callback) {
      return this.emitter.on('finished', callback);
    };

    return NodeSassCompiler;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvc2Fzcy1hdXRvY29tcGlsZS9saWIvY29tcGlsZXIuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLDhHQUFBOztBQUFBLEVBQUMsVUFBVyxPQUFBLENBQVEsV0FBUixFQUFYLE9BQUQsQ0FBQTs7QUFBQSxFQUNBLHNCQUFBLEdBQXlCLE9BQUEsQ0FBUSxXQUFSLENBRHpCLENBQUE7O0FBQUEsRUFHQSxxQkFBQSxHQUF3QixPQUFBLENBQVEsbUNBQVIsQ0FIeEIsQ0FBQTs7QUFBQSxFQUlBLElBQUEsR0FBTyxPQUFBLENBQVEsZUFBUixDQUpQLENBQUE7O0FBQUEsRUFLQSxjQUFBLEdBQWlCLE9BQUEsQ0FBUSwwQkFBUixDQUxqQixDQUFBOztBQUFBLEVBT0EsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSLENBUEwsQ0FBQTs7QUFBQSxFQVFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUixDQVJQLENBQUE7O0FBQUEsRUFTQSxJQUFBLEdBQU8sT0FBQSxDQUFRLGVBQVIsQ0FBd0IsQ0FBQyxJQVRoQyxDQUFBOztBQUFBLEVBWUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtBQUVGLElBQUEsZ0JBQUMsQ0FBQSxXQUFELEdBQWUsUUFBZixDQUFBOztBQUFBLElBQ0EsZ0JBQUMsQ0FBQSxTQUFELEdBQWEsU0FEYixDQUFBOztBQUlhLElBQUEsMEJBQUMsT0FBRCxHQUFBO0FBQ1QsTUFBQSxJQUFDLENBQUEsT0FBRCxHQUFXLE9BQVgsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBZSxJQUFBLE9BQUEsQ0FBQSxDQURmLENBRFM7SUFBQSxDQUpiOztBQUFBLCtCQVNBLE9BQUEsR0FBUyxTQUFBLEdBQUE7QUFDTCxNQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FB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

//# sourceURL=/Users/nansthomas/.atom/packages/sass-autocompile/lib/compiler.coffee
