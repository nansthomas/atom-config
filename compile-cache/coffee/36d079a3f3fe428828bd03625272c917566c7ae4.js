
/*
Language Support and default options.
 */

(function() {
  "use strict";
  var Languages, extend, _;

  _ = require('lodash');

  extend = null;

  module.exports = Languages = (function() {
    Languages.prototype.languageNames = ["arduino", "c-sharp", "c", "coffeescript", "cpp", "css", "csv", "d", "ejs", "elm", "erb", "gherkin", "go", "fortran", "handlebars", "haskell", "html", "java", "javascript", "json", "jsx", "less", "markdown", 'marko', "mustache", "objective-c", "pawn", "perl", "php", "puppet", "python", "ruby", "rust", "sass", "scss", "spacebars", "sql", "svg", "swig", "tss", "twig", "typescript", "vala", "visualforce", "xml"];


    /*
    Languages
     */

    Languages.prototype.languages = null;


    /*
    Namespaces
     */

    Languages.prototype.namespaces = null;


    /*
    Constructor
     */

    function Languages() {
      this.languages = _.map(this.languageNames, function(name) {
        return require("./" + name);
      });
      this.namespaces = _.map(this.languages, function(language) {
        return language.namespace;
      });
    }


    /*
    Get language for grammar and extension
     */

    Languages.prototype.getLanguages = function(_arg) {
      var extension, grammar, name, namespace;
      name = _arg.name, namespace = _arg.namespace, grammar = _arg.grammar, extension = _arg.extension;
      return _.union(_.filter(this.languages, function(language) {
        return _.isEqual(language.name, name);
      }), _.filter(this.languages, function(language) {
        return _.isEqual(language.namespace, namespace);
      }), _.filter(this.languages, function(language) {
        return _.contains(language.grammars, grammar);
      }), _.filter(this.languages, function(language) {
        return _.contains(language.extensions, extension);
      }));
    };

    return Languages;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvYXRvbS1iZWF1dGlmeS9zcmMvbGFuZ3VhZ2VzL2luZGV4LmNvZmZlZSIKICBdLAogICJuYW1lcyI6IFtdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBQUE7O0dBQUE7QUFBQTtBQUFBO0FBQUEsRUFHQSxZQUhBLENBQUE7QUFBQSxNQUFBLG9CQUFBOztBQUFBLEVBS0EsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBTEosQ0FBQTs7QUFBQSxFQU1BLE1BQUEsR0FBUyxJQU5ULENBQUE7O0FBQUEsRUFTQSxNQUFNLENBQUMsT0FBUCxHQUF1QjtBQUlyQix3QkFBQSxhQUFBLEdBQWUsQ0FDYixTQURhLEVBRWIsU0FGYSxFQUdiLEdBSGEsRUFJYixjQUphLEVBS2IsS0FMYSxFQU1iLEtBTmEsRUFPYixLQVBhLEVBUWIsR0FSYSxFQVNiLEtBVGEsRUFVYixLQVZhLEVBV2IsS0FYYSxFQVliLFNBWmEsRUFhYixJQWJhLEVBY2IsU0FkYSxFQWViLFlBZmEsRUFnQmIsU0FoQmEsRUFpQmIsTUFqQmEsRUFrQmIsTUFsQmEsRUFtQmIsWUFuQmEsRUFvQmIsTUFwQmEsRUFxQmIsS0FyQmEsRUFzQmIsTUF0QmEsRUF1QmIsVUF2QmEsRUF3QmIsT0F4QmEsRUF5QmIsVUF6QmEsRUEwQmIsYUExQmEsRUEyQmIsTUEzQmEsRUE0QmIsTUE1QmEsRUE2QmIsS0E3QmEsRUE4QmIsUUE5QmEsRUErQmIsUUEvQmEsRUFnQ2IsTUFoQ2EsRUFpQ2IsTUFqQ2EsRUFrQ2IsTUFsQ2EsRUFtQ2IsTUFuQ2EsRUFvQ2IsV0FwQ2EsRUFxQ2IsS0FyQ2EsRUFzQ2IsS0F0Q2EsRUF1Q2IsTUF2Q2EsRUF3Q2IsS0F4Q2EsRUF5Q2IsTUF6Q2EsRUEwQ2IsWUExQ2EsRUEyQ2IsTUEzQ2EsRUE0Q2IsYUE1Q2EsRUE2Q2IsS0E3Q2EsQ0FBZixDQUFBOztBQWdEQTtBQUFBOztPQWhEQTs7QUFBQSx3QkFtREEsU0FBQSxHQUFXLElBbkRYLENBQUE7O0FBcURBO0FBQUE7O09BckRBOztBQUFBLHdCQXdEQSxVQUFBLEdBQVksSUF4RFosQ0FBQTs7QUEwREE7QUFBQTs7T0ExREE7O0FBNkRhLElBQUEsbUJBQUEsR0FBQTtBQUNYLE1BQUEsSUFBQyxDQUFBLFNBQUQsR0FBYSxDQUFDLENBQUMsR0FBRixDQUFNLElBQUMsQ0FBQSxhQUFQLEVBQXNCLFNBQUMsSUFBRCxHQUFBO2VBQ2pDLE9BQUEsQ0FBUyxJQUFBLEdBQUksSUFBYixFQURpQztNQUFBLENBQXRCLENBQWIsQ0FBQTtBQUFBLE1BR0EsSUFBQyxDQUFBLFVBQUQsR0FBYyxDQUFDLENBQUMsR0FBRixDQUFNLElBQUMsQ0FBQSxTQUFQLEVBQWtCLFNBQUMsUUFBRCxHQUFBO2VBQWMsUUFBUSxDQUFDLFVBQXZCO01BQUEsQ0FBbEIsQ0FIZCxDQURXO0lBQUEsQ0E3RGI7O0FBbUVBO0FBQUE7O09BbkVBOztBQUFBLHdCQXNFQSxZQUFBLEdBQWMsU0FBQyxJQUFELEdBQUE7QUFFWixVQUFBLG1DQUFBO0FBQUEsTUFGYyxZQUFBLE1BQU0saUJBQUEsV0FBVyxlQUFBLFNBQVMsaUJBQUEsU0FFeEMsQ0FBQTthQUFBLENBQUMsQ0FBQyxLQUFGLENBQ0UsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFDLENBQUEsU0FBVixFQUFxQixTQUFDLFFBQUQsR0FBQTtlQUFjLENBQUMsQ0FBQyxPQUFGLENBQVUsUUFBUSxDQUFDLElBQW5CLEVBQXlCLElBQXpCLEVBQWQ7TUFBQSxDQUFyQixDQURGLEVBRUUsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFDLENBQUEsU0FBVixFQUFxQixTQUFDLFFBQUQsR0FBQTtlQUFjLENBQUMsQ0FBQyxPQUFGLENBQVUsUUFBUSxDQUFDLFNBQW5CLEVBQThCLFNBQTlCLEVBQWQ7TUFBQSxDQUFyQixDQUZGLEVBR0UsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFDLENBQUEsU0FBVixFQUFxQixTQUFDLFFBQUQsR0FBQTtlQUFjLENBQUMsQ0FBQyxRQUFGLENBQVcsUUFBUSxDQUFDLFFBQXBCLEVBQThCLE9BQTlCLEVBQWQ7TUFBQSxDQUFyQixDQUhGLEVBSUUsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFDLENBQUEsU0FBVixFQUFxQixTQUFDLFFBQUQsR0FBQTtlQUFjLENBQUMsQ0FBQyxRQUFGLENBQVcsUUFBUSxDQUFDLFVBQXBCLEVBQWdDLFNBQWhDLEVBQWQ7TUFBQSxDQUFyQixDQUpGLEVBRlk7SUFBQSxDQXRFZCxDQUFBOztxQkFBQTs7TUFiRixDQUFBO0FBQUEiCn0=

//# sourceURL=/Users/nansthomas/.atom/packages/atom-beautify/src/languages/index.coffee
