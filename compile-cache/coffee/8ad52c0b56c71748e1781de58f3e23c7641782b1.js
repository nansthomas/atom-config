(function() {
  describe('Commands', function() {
    var getMessage, linter;
    linter = null;
    beforeEach(function() {
      return waitsForPromise(function() {
        return atom.packages.activatePackage('linter').then(function() {
          linter = atom.packages.getActivePackage('linter').mainModule.instance;
          return atom.workspace.open(__dirname + '/fixtures/file.txt');
        });
      });
    });
    getMessage = require('./common').getMessage;
    describe('linter:togglePanel', function() {
      return it('toggles the panel visibility', function() {
        var visibility;
        linter.views.bottomPanel.scope = 'Project';
        linter.getActiveEditorLinter().addMessage(getMessage('Error'));
        linter.views.render({
          added: [getMessage('Error')],
          removed: [],
          messages: []
        });
        visibility = linter.views.bottomPanel.getVisibility();
        expect(visibility).toBe(true);
        linter.commands.togglePanel();
        expect(linter.views.bottomPanel.getVisibility()).toBe(!visibility);
        linter.commands.togglePanel();
        return expect(linter.views.bottomPanel.getVisibility()).toBe(visibility);
      });
    });
    return describe('linter:toggle', function() {
      return it('relint when enabled', function() {
        return waitsForPromise(function() {
          return atom.workspace.open(__dirname + '/fixtures/file.txt').then(function() {
            spyOn(linter.commands, 'lint');
            linter.commands.toggleLinter();
            linter.commands.toggleLinter();
            return expect(linter.commands.lint).toHaveBeenCalled();
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvY29tbWFuZHMtc3BlYy5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLEVBQUEsUUFBQSxDQUFTLFVBQVQsRUFBcUIsU0FBQSxHQUFBO0FBQ25CLFFBQUEsa0JBQUE7QUFBQSxJQUFBLE1BQUEsR0FBUyxJQUFULENBQUE7QUFBQSxJQUVBLFVBQUEsQ0FBVyxTQUFBLEdBQUE7YUFDVCxlQUFBLENBQWdCLFNBQUEsR0FBQTtlQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4QixRQUE5QixDQUF1QyxDQUFDLElBQXhDLENBQTZDLFNBQUEsR0FBQTtBQUMzQyxVQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFkLENBQStCLFFBQS9CLENBQXdDLENBQUMsVUFBVSxDQUFDLFFBQTdELENBQUE7aUJBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLFNBQUEsR0FBWSxvQkFBaEMsRUFGMkM7UUFBQSxDQUE3QyxFQURjO01BQUEsQ0FBaEIsRUFEUztJQUFBLENBQVgsQ0FGQSxDQUFBO0FBQUEsSUFRQyxhQUFjLE9BQUEsQ0FBUSxVQUFSLEVBQWQsVUFSRCxDQUFBO0FBQUEsSUFVQSxRQUFBLENBQVMsb0JBQVQsRUFBK0IsU0FBQSxHQUFBO2FBQzdCLEVBQUEsQ0FBRyw4QkFBSCxFQUFtQyxTQUFBLEdBQUE7QUFFakMsWUFBQSxVQUFBO0FBQUEsUUFBQSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUF6QixHQUFpQyxTQUFqQyxDQUFBO0FBQUEsUUFDQSxNQUFNLENBQUMscUJBQVAsQ0FBQSxDQUE4QixDQUFDLFVBQS9CLENBQTBDLFVBQUEsQ0FBVyxPQUFYLENBQTFDLENBREEsQ0FBQTtBQUFBLFFBRUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFiLENBQW9CO0FBQUEsVUFBQyxLQUFBLEVBQU8sQ0FBQyxVQUFBLENBQVcsT0FBWCxDQUFELENBQVI7QUFBQSxVQUErQixPQUFBLEVBQVMsRUFBeEM7QUFBQSxVQUE0QyxRQUFBLEVBQVUsRUFBdEQ7U0FBcEIsQ0FGQSxDQUFBO0FBQUEsUUFJQSxVQUFBLEdBQWEsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsYUFBekIsQ0FBQSxDQUpiLENBQUE7QUFBQSxRQUtBLE1BQUEsQ0FBTyxVQUFQLENBQWtCLENBQUMsSUFBbkIsQ0FBd0IsSUFBeEIsQ0FMQSxDQUFBO0FBQUEsUUFNQSxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQWhCLENBQUEsQ0FOQSxDQUFBO0FBQUEsUUFPQSxNQUFBLENBQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsYUFBekIsQ0FBQSxDQUFQLENBQWdELENBQUMsSUFBakQsQ0FBc0QsQ0FBQSxVQUF0RCxDQVBBLENBQUE7QUFBQSxRQVFBLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBaEIsQ0FBQSxDQVJBLENBQUE7ZUFTQSxNQUFBLENBQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsYUFBekIsQ0FBQSxDQUFQLENBQWdELENBQUMsSUFBakQsQ0FBc0QsVUFBdEQsRUFYaUM7TUFBQSxDQUFuQyxFQUQ2QjtJQUFBLENBQS9CLENBVkEsQ0FBQTtXQXdCQSxRQUFBLENBQVMsZUFBVCxFQUEwQixTQUFBLEdBQUE7YUFDeEIsRUFBQSxDQUFHLHFCQUFILEVBQTBCLFNBQUEsR0FBQTtlQUN4QixlQUFBLENBQWdCLFNBQUEsR0FBQTtpQkFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsU0FBQSxHQUFZLG9CQUFoQyxDQUFxRCxDQUFDLElBQXRELENBQTJELFNBQUEsR0FBQTtBQUN6RCxZQUFBLEtBQUEsQ0FBTSxNQUFNLENBQUMsUUFBYixFQUF1QixNQUF2QixDQUFBLENBQUE7QUFBQSxZQUNBLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBaEIsQ0FBQSxDQURBLENBQUE7QUFBQSxZQUVBLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBaEIsQ0FBQSxDQUZBLENBQUE7bUJBR0EsTUFBQSxDQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBdkIsQ0FBNEIsQ0FBQyxnQkFBN0IsQ0FBQSxFQUp5RDtVQUFBLENBQTNELEVBRGM7UUFBQSxDQUFoQixFQUR3QjtNQUFBLENBQTFCLEVBRHdCO0lBQUEsQ0FBMUIsRUF6Qm1CO0VBQUEsQ0FBckIsQ0FBQSxDQUFBO0FBQUEiCn0=

//# sourceURL=/Users/nansthomas/.atom/packages/linter/spec/commands-spec.coffee
