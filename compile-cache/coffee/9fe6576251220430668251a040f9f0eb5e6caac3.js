(function() {
  var File, fs, path,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  fs = require('fs');

  path = require('path');

  module.exports = File = (function() {
    function File() {}

    File["delete"] = function(files) {
      var e, file, _i, _len, _results;
      if (typeof files === 'string') {
        files = [files];
      }
      if (typeof files === 'object') {
        _results = [];
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          file = files[_i];
          if (fs.existsSync(file)) {
            try {
              _results.push(fs.unlinkSync(file));
            } catch (_error) {
              e = _error;
            }
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    File.getFileSize = function(filenames) {
      var fileSize, filename, sizes, _i, _len;
      fileSize = function(filename) {
        if (fs.existsSync(filename)) {
          return fs.statSync(filename)['size'];
        } else {
          return -1;
        }
      };
      if (typeof filenames === 'string') {
        return fileSize(filenames);
      } else {
        sizes = {};
        for (_i = 0, _len = filenames.length; _i < _len; _i++) {
          filename = filenames[_i];
          sizes[filename] = fileSize(filename);
        }
        return sizes;
      }
    };

    File.getTemporaryFilename = function(prefix, outputPath, fileExtension) {
      var filename, os, uniqueId, uuid;
      if (prefix == null) {
        prefix = "";
      }
      if (outputPath == null) {
        outputPath = null;
      }
      if (fileExtension == null) {
        fileExtension = 'tmp';
      }
      os = require('os');
      uuid = require('node-uuid');
      while (true) {
        uniqueId = uuid.v4();
        filename = "" + prefix + uniqueId + "." + fileExtension;
        if (!outputPath) {
          outputPath = os.tmpdir();
        }
        filename = path.join(outputPath, filename);
        if (!fs.existsSync(filename)) {
          break;
        }
      }
      return filename;
    };

    File.ensureDirectoryExists = function(paths) {
      var folder, p, parts, tmpPath, _i, _len, _results;
      if (typeof paths === 'string') {
        paths = [paths];
      }
      _results = [];
      for (_i = 0, _len = paths.length; _i < _len; _i++) {
        p = paths[_i];
        if (fs.existsSync(p)) {
          continue;
        }
        parts = p.split(path.sep);
        tmpPath = '';
        if (parts[0] === '') {
          parts.shift();
          tmpPath = path.sep;
        }
        _results.push((function() {
          var _j, _len1, _results1;
          _results1 = [];
          for (_j = 0, _len1 = parts.length; _j < _len1; _j++) {
            folder = parts[_j];
            tmpPath += (tmpPath === '' || tmpPath === path.sep ? '' : path.sep) + folder;
            if (!fs.existsSync(tmpPath)) {
              _results1.push(fs.mkdirSync(tmpPath));
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        })());
      }
      return _results;
    };

    File.fileSizeToReadable = function(bytes, decimals) {
      var dividend, divisor, i, readable, unitIndex, units, _i, _ref;
      if (decimals == null) {
        decimals = 2;
      }
      if (typeof bytes === 'number') {
        bytes = [bytes];
      }
      units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      unitIndex = 0;
      decimals = Math.pow(10, decimals);
      dividend = bytes[0];
      divisor = 1024;
      while (dividend >= divisor) {
        divisor = divisor * 1024;
        unitIndex++;
      }
      divisor = divisor / 1024;
      for (i = _i = 0, _ref = bytes.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        bytes[i] = Math.round(bytes[i] * decimals / divisor) / decimals;
      }
      readable = {
        size: bytes,
        unit: units[unitIndex],
        divisor: divisor
      };
      return readable;
    };

    File.hasFileExtension = function(filename, extension) {
      var fileExtension, _ref;
      fileExtension = path.extname(filename);
      if (typeof extension === 'string') {
        extension = [extension];
      }
      return _ref = fileExtension.toLowerCase(), __indexOf.call(extension, _ref) >= 0;
    };

    return File;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25hbnN0aG9tYXMvLmF0b20vcGFja2FnZXMvc2Fzcy1hdXRvY29tcGlsZS9saWIvaGVscGVyL2ZpbGUuY29mZmVlIgogIF0sCiAgIm5hbWVzIjogW10sCiAgIm1hcHBpbmdzIjogIkFBQUE7QUFBQSxNQUFBLGNBQUE7SUFBQSxxSkFBQTs7QUFBQSxFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUixDQUFMLENBQUE7O0FBQUEsRUFDQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVIsQ0FEUCxDQUFBOztBQUFBLEVBSUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtzQkFFRjs7QUFBQSxJQUFBLElBQUMsQ0FBQSxRQUFBLENBQUQsR0FBUyxTQUFDLEtBQUQsR0FBQTtBQUdMLFVBQUEsMkJBQUE7QUFBQSxNQUFBLElBQUcsTUFBQSxDQUFBLEtBQUEsS0FBZ0IsUUFBbkI7QUFDSSxRQUFBLEtBQUEsR0FBUSxDQUFDLEtBQUQsQ0FBUixDQURKO09BQUE7QUFHQSxNQUFBLElBQUcsTUFBQSxDQUFBLEtBQUEsS0FBZ0IsUUFBbkI7QUFDSTthQUFBLDRDQUFBOzJCQUFBO0FBQ0ksVUFBQSxJQUFHLEVBQUUsQ0FBQyxVQUFILENBQWMsSUFBZCxDQUFIO0FBQ0k7QUFDSSw0QkFBQSxFQUFFLENBQUMsVUFBSCxDQUFjLElBQWQsRUFBQSxDQURKO2FBQUEsY0FBQTtBQUVNLGNBQUEsVUFBQSxDQUZOO2FBREo7V0FBQSxNQUFBO2tDQUFBO1dBREo7QUFBQTt3QkFESjtPQU5LO0lBQUEsQ0FBVCxDQUFBOztBQUFBLElBZUEsSUFBQyxDQUFBLFdBQUQsR0FBYyxTQUFDLFNBQUQsR0FBQTtBQUNWLFVBQUEsbUNBQUE7QUFBQSxNQUFBLFFBQUEsR0FBVyxTQUFDLFFBQUQsR0FBQTtBQUNQLFFBQUEsSUFBRyxFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsQ0FBSDtBQUNJLGlCQUFPLEVBQUUs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

//# sourceURL=/Users/nansthomas/.atom/packages/sass-autocompile/lib/helper/file.coffee
