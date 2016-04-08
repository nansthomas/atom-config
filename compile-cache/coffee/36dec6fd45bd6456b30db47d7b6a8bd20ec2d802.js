(function() {
  var defaultIndentChar, defaultIndentSize, defaultIndentWithTabs, scope, softTabs, tabLength, _ref, _ref1;

  scope = ['text.jade'];

  tabLength = (_ref = typeof atom !== "undefined" && atom !== null ? atom.config.get('editor.tabLength', {
    scope: scope
  }) : void 0) != null ? _ref : 4;

  softTabs = (_ref1 = typeof atom !== "undefined" && atom !== null ? atom.config.get('editor.softTabs', {
    scope: scope
  }) : void 0) != null ? _ref1 : true;

  defaultIndentSize = (softTabs ? tabLength : 1);

  defaultIndentChar = (softTabs ? " " : "\t");

  defaultIndentWithTabs = !softTabs;

  module.exports = {
    name: "Jade",
    namespace: "jade",
    fallback: ['html'],

    /*
    Supported Grammars
     */
    grammars: ["Jade"],

    /*
    Supported extensions
     */
    extensions: ["jade"],
    options: [
      {
        indent_size: {
          type: 'integer',
          "default": defaultIndentSize,
          minimum: 0,
          description: "Indentation size/length"
        },
        indent_char: {
          type: 'string',
          "default": defaultIndentChar,
          description: "Indentation character"
        },
        omit_div: {
          type: 'boolean',
          "default": false,
          description: "Whether to omit/remove the 'div' tags."
        }
      }
    ],
    defaultBeautifier: "Pug Beautify"
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvYXRvbS1iZWF1dGlmeS9zcmMvbGFuZ3VhZ2VzL2phZGUuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQ0E7QUFBQSxNQUFBLG9HQUFBOztBQUFBLEVBQUEsS0FBQSxHQUFRLENBQUMsV0FBRCxDQUFSLENBQUE7O0FBQUEsRUFDQSxTQUFBOztnQ0FBaUUsQ0FEakUsQ0FBQTs7QUFBQSxFQUVBLFFBQUE7O2lDQUErRCxJQUYvRCxDQUFBOztBQUFBLEVBR0EsaUJBQUEsR0FBb0IsQ0FBSSxRQUFILEdBQWlCLFNBQWpCLEdBQWdDLENBQWpDLENBSHBCLENBQUE7O0FBQUEsRUFJQSxpQkFBQSxHQUFvQixDQUFJLFFBQUgsR0FBaUIsR0FBakIsR0FBMEIsSUFBM0IsQ0FKcEIsQ0FBQTs7QUFBQSxFQUtBLHFCQUFBLEdBQXdCLENBQUEsUUFMeEIsQ0FBQTs7QUFBQSxFQU9BLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBQUEsSUFFZixJQUFBLEVBQU0sTUFGUztBQUFBLElBR2YsU0FBQSxFQUFXLE1BSEk7QUFBQSxJQUlmLFFBQUEsRUFBVSxDQUFDLE1BQUQsQ0FKSztBQU1mO0FBQUE7O09BTmU7QUFBQSxJQVNmLFFBQUEsRUFBVSxDQUNSLE1BRFEsQ0FUSztBQWFmO0FBQUE7O09BYmU7QUFBQSxJQWdCZixVQUFBLEVBQVksQ0FDVixNQURVLENBaEJHO0FBQUEsSUFvQmYsT0FBQSxFQUFTO01BQ1A7QUFBQSxRQUFBLFdBQUEsRUFDRTtBQUFBLFVBQUEsSUFBQSxFQUFNLFNBQU47QUFBQSxVQUNBLFNBQUEsRUFBUyxpQkFEVDtBQUFBLFVBRUEsT0FBQSxFQUFTLENBRlQ7QUFBQSxVQUdBLFdBQUEsRUFBYSx5QkFIYjtTQURGO0FBQUEsUUFLQSxXQUFBLEVBQ0U7QUFBQSxVQUFBLElBQUEsRUFBTSxRQUFOO0FBQUEsVUFDQSxTQUFBLEVBQVMsaUJBRFQ7QUFBQSxVQUVBLFdBQUEsRUFBYSx1QkFGYjtTQU5GO0FBQUEsUUFTQSxRQUFBLEVBQ0U7QUFBQSxVQUFBLElBQUEsRUFBTSxTQUFOO0FBQUEsVUFDQSxTQUFBLEVBQVMsS0FEVDtBQUFBLFVBRUEsV0FBQSxFQUFhLHdDQUZiO1NBVkY7T0FETztLQXBCTTtBQUFBLElBb0NmLGlCQUFBLEVBQW1CLGNBcENKO0dBUGpCLENBQUE7QUFBQSIKfQ==

//# sourceURL=/Users/nansthomas/.atom/packages/atom-beautify/src/languages/jade.coffee
