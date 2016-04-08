(function() {
  var SassAutocompileOptions;

  module.exports = SassAutocompileOptions = (function() {
    SassAutocompileOptions.OPTIONS_PREFIX = 'sass-autocompile.';

    SassAutocompileOptions.get = function(name) {
      return atom.config.get(SassAutocompileOptions.OPTIONS_PREFIX + name);
    };

    SassAutocompileOptions.set = function(name, value) {
      return atom.config.set(SassAutocompileOptions.OPTIONS_PREFIX + name, value);
    };

    SassAutocompileOptions.unset = function(name) {
      return atom.config.unset(SassAutocompileOptions.OPTIONS_PREFIX + name);
    };

    function SassAutocompileOptions() {
      this.initialize();
    }

    SassAutocompileOptions.prototype.initialize = function() {
      var _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      this.compileOnSave = SassAutocompileOptions.get('compileOnSave');
      this.compileEverySassFiles = SassAutocompileOptions.get('compileFiles') === 'Every SASS file';
      this.compileOnlyFirstLineCommentFiles = SassAutocompileOptions.get('compileFiles') === 'Only with first-line-comment';
      this.compilePartials = SassAutocompileOptions.get('compilePartials');
      this.checkOutputFileAlreadyExists = SassAutocompileOptions.get('checkOutputFileAlreadyExists');
      this.directlyJumpToError = SassAutocompileOptions.get('directlyJumpToError');
      this.showCompileSassItemInTreeViewContextMenu = SassAutocompileOptions.get('showCompileSassItemInTreeViewContextMenu');
      this.compileCompressed = SassAutocompileOptions.get('compileCompressed');
      this.compileCompact = SassAutocompileOptions.get('compileCompact');
      this.compileNested = SassAutocompileOptions.get('compileNested');
      this.compileExpanded = SassAutocompileOptions.get('compileExpanded');
      this.compressedFilenamePattern = SassAutocompileOptions.get('compressedFilenamePattern');
      this.compactFilenamePattern = SassAutocompileOptions.get('compactFilenamePattern');
      this.nestedFilenamePattern = SassAutocompileOptions.get('nestedFilenamePattern');
      this.expandedFilenamePattern = SassAutocompileOptions.get('expandedFilenamePattern');
      this.indentType = SassAutocompileOptions.get('indentType');
      this.indentWidth = SassAutocompileOptions.get('indentWidth');
      this.linefeed = SassAutocompileOptions.get('linefeed');
      this.sourceMap = SassAutocompileOptions.get('sourceMap');
      this.sourceMapEmbed = SassAutocompileOptions.get('sourceMapEmbed');
      this.sourceMapContents = SassAutocompileOptions.get('sourceMapContents');
      this.sourceComments = SassAutocompileOptions.get('sourceComments');
      this.includePath = SassAutocompileOptions.get('includePath');
      this.precision = SassAutocompileOptions.get('precision');
      this.importer = SassAutocompileOptions.get('importer');
      this.functions = SassAutocompileOptions.get('functions');
      this.showInfoNotification = (_ref = SassAutocompileOptions.get('notifications')) === 'Notifications' || _ref === 'Panel, Notifications';
      this.showSuccessNotification = (_ref1 = SassAutocompileOptions.get('notifications')) === 'Notifications' || _ref1 === 'Panel, Notifications';
      this.showWarningNotification = (_ref2 = SassAutocompileOptions.get('notifications')) === 'Notifications' || _ref2 === 'Panel, Notifications';
      this.showErrorNotification = (_ref3 = SassAutocompileOptions.get('notifications')) === 'Notifications' || _ref3 === 'Panel, Notifications';
      this.autoHideInfoNotification = (_ref4 = SassAutocompileOptions.get('autoHideNotifications')) === 'Info, Success' || _ref4 === 'Info, Success, Error';
      this.autoHideSuccessNotification = (_ref5 = SassAutocompileOptions.get('autoHideNotifications')) === 'Info, Success' || _ref5 === 'Info, Success, Error';
      this.autoHideErrorNotification = (_ref6 = SassAutocompileOptions.get('autoHideNotifications')) === 'Error' || _ref6 === 'Info, Success, Error';
      this.showPanel = (_ref7 = SassAutocompileOptions.get('notifications')) === 'Panel' || _ref7 === 'Panel, Notifications';
      this.autoHidePanelOnSuccess = (_ref8 = SassAutocompileOptions.get('autoHidePanel')) === 'Success' || _ref8 === 'Success, Error';
      this.autoHidePanelOnError = (_ref9 = SassAutocompileOptions.get('autoHidePanel')) === 'Error' || _ref9 === 'Success, Error';
      this.autoHidePanelDelay = SassAutocompileOptions.get('autoHidePanelDelay');
      this.showStartCompilingNotification = SassAutocompileOptions.get('showStartCompilingNotification');
      this.showAdditionalCompilationInfo = SassAutocompileOptions.get('showAdditionalCompilationInfo');
      this.showNodeSassOutput = SassAutocompileOptions.get('showNodeSassOutput');
      this.showOldParametersWarning = SassAutocompileOptions.get('showOldParametersWarning');
      return this.nodeSassPath = SassAutocompileOptions.get('nodeSassPath');
    };

    return SassAutocompileOptions;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvc2Fzcy1hdXRvY29tcGlsZS9saWIvb3B0aW9ucy5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsc0JBQUE7O0FBQUEsRUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNO0FBRUYsSUFBQSxzQkFBQyxDQUFBLGNBQUQsR0FBa0IsbUJBQWxCLENBQUE7O0FBQUEsSUFHQSxzQkFBQyxDQUFBLEdBQUQsR0FBTSxTQUFDLElBQUQsR0FBQTtBQUNGLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHNCQUFzQixDQUFDLGNBQXZCLEdBQXdDLElBQXhELENBQVAsQ0FERTtJQUFBLENBSE4sQ0FBQTs7QUFBQSxJQU9BLHNCQUFDLENBQUEsR0FBRCxHQUFNLFNBQUMsSUFBRCxFQUFPLEtBQVAsR0FBQTthQUNGLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixzQkFBc0IsQ0FBQyxjQUF2QixHQUF3QyxJQUF4RCxFQUE4RCxLQUE5RCxFQURFO0lBQUEsQ0FQTixDQUFBOztBQUFBLElBV0Esc0JBQUMsQ0FBQSxLQUFELEdBQVEsU0FBQyxJQUFELEdBQUE7YUFDSixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQVosQ0FBa0Isc0JBQXNCLENBQUMsY0FBdkIsR0FBd0MsSUFBMUQsRUFESTtJQUFBLENBWFIsQ0FBQTs7QUFlYSxJQUFBLGdDQUFBLEdBQUE7QUFDVCxNQUFBLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBQSxDQURTO0lBQUEsQ0FmYjs7QUFBQSxxQ0FtQkEsVUFBQSxHQUFZLFNBQUEsR0FBQTtBQUVSLFVBQUEsbUVBQUE7QUFBQSxNQUFBLElBQUMsQ0FBQSxhQUFELEdBQWlCLHNCQUFzQixDQUFDLEdBQXZCLENBQTJCLGVBQTNCLENBQWpCLENBQUE7QUFB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

//# sourceURL=/Users/nansthomas/.atom/packages/sass-autocompile/lib/options.coffee
