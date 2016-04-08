"use babel";

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var DocumentationView = require('./atom-ternjs-documentation-view');

var Documentation = (function () {
  function Documentation(manager) {
    _classCallCheck(this, Documentation);

    this.manager = manager;
    this.view = new DocumentationView();
    this.view.initialize(this);

    atom.views.getView(atom.workspace).appendChild(this.view);
  }

  _createClass(Documentation, [{
    key: 'request',
    value: function request() {
      var _this = this;

      var editor = atom.workspace.getActiveTextEditor();

      if (!editor) {

        return;
      }

      var cursor = editor.getLastCursor();
      var position = cursor.getBufferPosition();

      this.manager.client.update(editor).then(function (data) {

        if (data.isQueried) {

          return;
        }

        _this.manager.client.documentation(atom.project.relativizePath(editor.getURI())[1], {

          line: position.row,
          ch: position.column

        }).then(function (data) {

          if (!data) {

            return;
          }

          _this.view.setData({

            doc: _this.manager.helper.replaceTags(data.doc),
            origin: data.origin,
            type: _this.manager.helper.formatType(data),
            url: data.url || ''
          });

          _this.show();
        });
      });
    }
  }, {
    key: 'show',
    value: function show() {

      if (!this.marker) {

        var editor = atom.workspace.getActiveTextEditor();
        var cursor = editor.getLastCursor();

        if (!editor || !cursor) {

          return;
        }

        this.marker = cursor.getMarker();

        if (!this.marker) {

          return;
        }

        this.overlayDecoration = editor.decorateMarker(this.marker, {

          type: 'overlay',
          item: this.view,
          'class': 'atom-ternjs-documentation',
          position: 'tale',
          invalidate: 'touch'
        });
      } else {

        this.marker.setProperties({

          type: 'overlay',
          item: this.view,
          'class': 'atom-ternjs-documentation',
          position: 'tale',
          invalidate: 'touch'
        });
      }
    }
  }, {
    key: 'destroyOverlay',
    value: function destroyOverlay() {

      if (this.overlayDecoration) {

        this.overlayDecoration.destroy();
      }

      this.overlayDecoration = null;
      this.marker = null;
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      this.destroyOverlay();
      this.view.destroy();
      this.view = undefined;
    }
  }]);

  return Documentation;
})();

exports['default'] = Documentation;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9uYW5zdGhvbWFzLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1kb2N1bWVudGF0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7OztBQUVaLElBQUksaUJBQWlCLEdBQUcsT0FBTyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7O0lBRS9DLGFBQWE7QUFFckIsV0FGUSxhQUFhLENBRXBCLE9BQU8sRUFBRTswQkFGRixhQUFhOztBQUk5QixRQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUN2QixRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQztBQUNwQyxRQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFM0IsUUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDM0Q7O2VBVGtCLGFBQWE7O1dBV3pCLG1CQUFHOzs7QUFFUixVQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7O0FBRWxELFVBQUksQ0FBQyxNQUFNLEVBQUU7O0FBRVgsZUFBTztPQUNSOztBQUVELFVBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUNwQyxVQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzs7QUFFMUMsVUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLElBQUksRUFBSzs7QUFFaEQsWUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFOztBQUVsQixpQkFBTztTQUNSOztBQUVELGNBQUssT0FBTyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7O0FBRWpGLGNBQUksRUFBRSxRQUFRLENBQUMsR0FBRztBQUNsQixZQUFFLEVBQUUsUUFBUSxDQUFDLE1BQU07O1NBRXBCLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFJLEVBQUs7O0FBRWhCLGNBQUksQ0FBQyxJQUFJLEVBQUU7O0FBRVQsbUJBQU87V0FDUjs7QUFFRCxnQkFBSyxJQUFJLENBQUMsT0FBTyxDQUFDOztBQUVoQixlQUFHLEVBQUUsTUFBSyxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQzlDLGtCQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07QUFDbkIsZ0JBQUksRUFBRSxNQUFLLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztBQUMxQyxlQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFO1dBQ3BCLENBQUMsQ0FBQzs7QUFFSCxnQkFBSyxJQUFJLEVBQUUsQ0FBQztTQUNiLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQztLQUNKOzs7V0FFRyxnQkFBRzs7QUFFTCxVQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTs7QUFFaEIsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ2xELFlBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQzs7QUFFcEMsWUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRTs7QUFFdEIsaUJBQU87U0FDUjs7QUFFRCxZQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQzs7QUFFakMsWUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7O0FBRWhCLGlCQUFPO1NBQ1I7O0FBRUQsWUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTs7QUFFMUQsY0FBSSxFQUFFLFNBQVM7QUFDZixjQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7QUFDZixtQkFBTywyQkFBMkI7QUFDbEMsa0JBQVEsRUFBRSxNQUFNO0FBQ2hCLG9CQUFVLEVBQUUsT0FBTztTQUNwQixDQUFDLENBQUM7T0FFSixNQUFNOztBQUVMLFlBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDOztBQUV4QixjQUFJLEVBQUUsU0FBUztBQUNmLGNBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtBQUNmLG1CQUFPLDJCQUEyQjtBQUNsQyxrQkFBUSxFQUFFLE1BQU07QUFDaEIsb0JBQVUsRUFBRSxPQUFPO1NBQ3BCLENBQUMsQ0FBQztPQUNKO0tBQ0Y7OztXQUVhLDBCQUFHOztBQUVmLFVBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFOztBQUUxQixZQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDbEM7O0FBRUQsVUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUM5QixVQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztLQUNwQjs7O1dBRU0sbUJBQUc7O0FBRVIsVUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3RCLFVBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDcEIsVUFBSSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7S0FDdkI7OztTQWhIa0IsYUFBYTs7O3FCQUFiLGFBQWEiLCJmaWxlIjoiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2F0b20tdGVybmpzLWRvY3VtZW50YXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBiYWJlbFwiO1xuXG5sZXQgRG9jdW1lbnRhdGlvblZpZXcgPSByZXF1aXJlKCcuL2F0b20tdGVybmpzLWRvY3VtZW50YXRpb24tdmlldycpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEb2N1bWVudGF0aW9uIHtcblxuICBjb25zdHJ1Y3RvcihtYW5hZ2VyKSB7XG5cbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMudmlldyA9IG5ldyBEb2N1bWVudGF0aW9uVmlldygpO1xuICAgIHRoaXMudmlldy5pbml0aWFsaXplKHRoaXMpO1xuXG4gICAgYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKS5hcHBlbmRDaGlsZCh0aGlzLnZpZXcpO1xuICB9XG5cbiAgcmVxdWVzdCgpIHtcblxuICAgIGxldCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG5cbiAgICBpZiAoIWVkaXRvcikge1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGN1cnNvciA9IGVkaXRvci5nZXRMYXN0Q3Vyc29yKCk7XG4gICAgbGV0IHBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCk7XG5cbiAgICB0aGlzLm1hbmFnZXIuY2xpZW50LnVwZGF0ZShlZGl0b3IpLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgaWYgKGRhdGEuaXNRdWVyaWVkKSB7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm1hbmFnZXIuY2xpZW50LmRvY3VtZW50YXRpb24oYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGVkaXRvci5nZXRVUkkoKSlbMV0sIHtcblxuICAgICAgICBsaW5lOiBwb3NpdGlvbi5yb3csXG4gICAgICAgIGNoOiBwb3NpdGlvbi5jb2x1bW5cblxuICAgICAgfSkudGhlbigoZGF0YSkgPT4ge1xuXG4gICAgICAgIGlmICghZGF0YSkge1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy52aWV3LnNldERhdGEoe1xuXG4gICAgICAgICAgZG9jOiB0aGlzLm1hbmFnZXIuaGVscGVyLnJlcGxhY2VUYWdzKGRhdGEuZG9jKSxcbiAgICAgICAgICBvcmlnaW46IGRhdGEub3JpZ2luLFxuICAgICAgICAgIHR5cGU6IHRoaXMubWFuYWdlci5oZWxwZXIuZm9ybWF0VHlwZShkYXRhKSxcbiAgICAgICAgICB1cmw6IGRhdGEudXJsIHx8ICcnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzaG93KCkge1xuXG4gICAgaWYgKCF0aGlzLm1hcmtlcikge1xuXG4gICAgICBsZXQgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgbGV0IGN1cnNvciA9IGVkaXRvci5nZXRMYXN0Q3Vyc29yKCk7XG5cbiAgICAgIGlmICghZWRpdG9yIHx8ICFjdXJzb3IpIHtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMubWFya2VyID0gY3Vyc29yLmdldE1hcmtlcigpO1xuXG4gICAgICBpZiAoIXRoaXMubWFya2VyKSB7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uID0gZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMubWFya2VyLCB7XG5cbiAgICAgICAgdHlwZTogJ292ZXJsYXknLFxuICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXG4gICAgICAgIGNsYXNzOiAnYXRvbS10ZXJuanMtZG9jdW1lbnRhdGlvbicsXG4gICAgICAgIHBvc2l0aW9uOiAndGFsZScsXG4gICAgICAgIGludmFsaWRhdGU6ICd0b3VjaCdcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgdGhpcy5tYXJrZXIuc2V0UHJvcGVydGllcyh7XG5cbiAgICAgICAgdHlwZTogJ292ZXJsYXknLFxuICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXG4gICAgICAgIGNsYXNzOiAnYXRvbS10ZXJuanMtZG9jdW1lbnRhdGlvbicsXG4gICAgICAgIHBvc2l0aW9uOiAndGFsZScsXG4gICAgICAgIGludmFsaWRhdGU6ICd0b3VjaCdcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGRlc3Ryb3lPdmVybGF5KCkge1xuXG4gICAgaWYgKHRoaXMub3ZlcmxheURlY29yYXRpb24pIHtcblxuICAgICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbi5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbiA9IG51bGw7XG4gICAgdGhpcy5tYXJrZXIgPSBudWxsO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcblxuICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKTtcbiAgICB0aGlzLnZpZXcuZGVzdHJveSgpO1xuICAgIHRoaXMudmlldyA9IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19
//# sourceURL=/Users/nansthomas/.atom/packages/atom-ternjs/lib/atom-ternjs-documentation.js
