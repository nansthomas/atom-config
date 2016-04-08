(function() {
  var ReferenceView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ReferenceView = (function(_super) {
    __extends(ReferenceView, _super);

    function ReferenceView() {
      return ReferenceView.__super__.constructor.apply(this, arguments);
    }

    ReferenceView.prototype.createdCallback = function() {
      var container;
      this.classList.add('atom-ternjs-reference');
      container = document.createElement('div');
      this.content = document.createElement('div');
      this.close = document.createElement('button');
      this.close.classList.add('btn', 'atom-ternjs-reference-close');
      this.close.innerHTML = 'Close';
      container.appendChild(this.close);
      container.appendChild(this.content);
      return this.appendChild(container);
    };

    ReferenceView.prototype.initialize = function(model) {
      this.setModel(model);
      return this;
    };

    ReferenceView.prototype.clickHandle = function(i) {
      return this.model.goToReference(i);
    };

    ReferenceView.prototype.buildItems = function(data) {
      var headline, i, item, li, list, _i, _len, _ref;
      this.content.innerHTML = '';
      headline = document.createElement('h2');
      headline.innerHTML = data.name + (" (" + data.type + ")");
      this.content.appendChild(headline);
      list = document.createElement('ul');
      _ref = data.refs;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        item = _ref[i];
        li = document.createElement('li');
        li.innerHTML = "<h3><span><span class=\"darken\">(" + (item.position.row + 1) + ":" + item.position.column + "):</span> <span>" + item.lineText + "</span></span> <span class=\"darken\">(" + item.file + ")</span><div class=\"clear\"></div></h3>";
        li.addEventListener('click', this.clickHandle.bind(this, i), false);
        list.appendChild(li);
      }
      return this.content.appendChild(list);
    };

    ReferenceView.prototype.destroy = function() {
      return this.remove();
    };

    ReferenceView.prototype.getClose = function() {
      return this.close;
    };

    ReferenceView.prototype.getModel = function() {
      return this.model;
    };

    ReferenceView.prototype.setModel = function(model) {
      return this.model = model;
    };

    return ReferenceView;

  })(HTMLElement);

  module.exports = document.registerElement('atom-ternjs-reference', {
    prototype: ReferenceView.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLXJlZmVyZW5jZS12aWV3LmNvZmZlZSIKICBdLAogICJuYW1lcyI6IFtdLAogICJtYXBwaW5ncyI6ICJBQUFBO0FBQUEsTUFBQSxhQUFBO0lBQUE7bVNBQUE7O0FBQUEsRUFBTTtBQUVKLG9DQUFBLENBQUE7Ozs7S0FBQTs7QUFBQSw0QkFBQSxlQUFBLEdBQWlCLFNBQUEsR0FBQTtBQUNmLFVBQUEsU0FBQTtBQUFBLE1BQUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsdUJBQWYsQ0FBQSxDQUFBO0FBQUEsTUFDQSxTQUFBLEdBQVksUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FEWixDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCLENBRlgsQ0FBQTtBQUFBLE1BR0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxRQUFRLENBQUMsYUFBVCxDQUF1QixRQUF2QixDQUhULENBQUE7QUFBQSxNQUlBLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQWpCLENBQXFCLEtBQXJCLEVBQTRCLDZCQUE1QixDQUpBLENBQUE7QUFBQSxNQUtBLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxHQUFtQixPQUxuQixDQUFBO0FBQUEsTUFNQSxTQUFTLENBQUMsV0FBVixDQUFzQixJQUFDLENBQUEsS0FBdkIsQ0FOQSxDQUFBO0FBQUEsTUFPQSxTQUFTLENBQUMsV0FBVixDQUFzQixJQUFDLENBQUEsT0FBdkIsQ0FQQSxDQUFBO2FBUUEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxTQUFiLEVBVGU7SUFBQSxDQUFqQixDQUFBOztBQUFBLDRCQVdBLFVBQUEsR0FBWSxTQUFDLEtBQUQsR0FBQTtBQUNWLE1BQUEsSUFB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

//# sourceURL=/Users/nansthomas/.atom/packages/atom-ternjs/lib/atom-ternjs-reference-view.coffee
