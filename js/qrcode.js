// Standalone QR Code Generator (Model 2, Byte Mode, Error Correction L/M)
// Renders to SVG or Canvas without any external dependencies.

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.QRCode = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Minimal standalone QR matrix generator
  // Based on QR Code standard ISO/IEC 18004
  
  function QR8bitByte(data) {
    this.mode = 4; // 8bit byte
    this.data = data;
  }
  QR8bitByte.prototype = {
    getLength: function () {
      return this.parsedData.length;
    },
    write: function (buffer) {
      for (var i = 0; i < this.parsedData.length; i++) {
        buffer.put(this.parsedData[i], 8);
      }
    }
  };
  
  // UTF-8 string to byte array
  function stringToBytes(s) {
    var bytes = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) {
        bytes.push(c);
      } else if (c < 0x800) {
        bytes.push(0xc0 | (c >> 6));
        bytes.push(0x80 | (c & 0x3f));
      } else if (c < 0xd800 || c >= 0xe000) {
        bytes.push(0xe0 | (c >> 12));
        bytes.push(0x80 | ((c >> 6) & 0x3f));
        bytes.push(0x80 | (c & 0x3f));
      } else {
        i++;
        c = 0x10000 + (((c & 0x3ff) << 10) | (s.charCodeAt(i) & 0x3ff));
        bytes.push(0xf0 | (c >> 18));
        bytes.push(0x80 | ((c >> 12) & 0x3f));
        bytes.push(0x80 | ((c >> 6) & 0x3f));
        bytes.push(0x80 | (c & 0x3f));
      }
    }
    return bytes;
  }

  // Galois Field GF(256) math for Reed-Solomon
  var QRMath = {
    glog: function (n) {
      if (n < 1) throw new Error("glog(" + n + ")");
      return QRMath.LOG_TABLE[n];
    },
    gexp: function (n) {
      while (n < 0) n += 255;
      while (n >= 255) n -= 255;
      return QRMath.EXP_TABLE[n];
    },
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256)
  };

  for (var i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
  for (var i = 8; i < 256; i++) {
    QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
  }
  for (var i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

  function QRPolynomial(num, shift) {
    if (num.length == undefined) throw new Error(num.length + "/" + shift);
    var offset = 0;
    while (offset < num.length && num[offset] == 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (var i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
    for (var i = num.length - offset; i < this.num.length; i++) this.num[i] = 0;
  }
  QRPolynomial.prototype = {
    get: function (index) { return this.num[index]; },
    getLength: function () { return this.num.length; },
    multiply: function (e) {
      var num = new Array(this.getLength() + e.getLength() - 1);
      for (var i = 0; i < num.length; i++) num[i] = 0;
      for (var i = 0; i < this.getLength(); i++) {
        for (var j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
      }
      return new QRPolynomial(num, 0);
    },
    mod: function (e) {
      if (this.getLength() - e.getLength() < 0) return this;
      var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      var num = new Array(this.getLength());
      for (var i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (var i = 0; i < e.getLength(); i++) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      }
      return new QRPolynomial(num, 0).mod(e);
    }
  };

  function QRBitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  QRBitBuffer.prototype = {
    get: function (index) {
      var bufIndex = Math.floor(index / 8);
      return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1;
    },
    put: function (num, length) {
      for (var i = 0; i < length; i++) {
        this.putBit(((num >>> (length - i - 1)) & 1) == 1);
      }
    },
    putBit: function (bit) {
      var bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      this.length++;
    }
  };

  // QR RS blocks definitions for versions 1 to 10
  var RS_BLOCK_TABLE = [
    // 1-L, 1-M, 1-Q, 1-H
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    // 2
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    // 3
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    // 4
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    // 5
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    // 6
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
    // 7
    [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
    // 8
    [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
    // 9
    [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
    // 10
    [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16]
  ];

  function getRSBlocks(typeNumber, errorCorrectLevel) {
    var row = (typeNumber - 1) * 4 + errorCorrectLevel;
    var raw = RS_BLOCK_TABLE[row];
    var list = [];
    for (var i = 0; i < raw.length; i += 3) {
      var count = raw[i];
      var totalCount = raw[i + 1];
      var dataCount = raw[i + 2];
      for (var j = 0; j < count; j++) {
        list.push({ totalCount: totalCount, dataCount: dataCount });
      }
    }
    return list;
  }

  function createErrorCorrectPolynomial(errorCorrectLength) {
    var a = new QRPolynomial([1], 0);
    for (var i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  }

  // QR Code generator class
  function QRCodeModel(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataList = [];
  }

  QRCodeModel.prototype = {
    addData: function (data) {
      var entry = new QR8bitByte(data);
      entry.parsedData = stringToBytes(data);
      this.dataList.push(entry);
    },
    isDark: function (row, col) {
      return this.modules[row][col];
    },
    getModuleCount: function () {
      return this.moduleCount;
    },
    make: function () {
      this.makeImpl(false, this.getBestMaskPattern());
    },
    makeImpl: function (test, maskPattern) {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = new Array(this.moduleCount);
      for (var row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount);
        for (var col = 0; col < this.moduleCount; col++) {
          this.modules[row][col] = null;
        }
      }
      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupPositionAdjustPattern();
      this.setupTimingPattern();
      this.setupTypeInfo(test, maskPattern);
      if (this.typeNumber >= 7) this.setupTypeNumber(test);
      this.mapData(this.createData(), maskPattern);
    },
    setupPositionProbePattern: function (row, col) {
      for (var r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;
        for (var c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;
          if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
              (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
              (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
            this.modules[row + r][col + c] = true;
          } else {
            this.modules[row + r][col + c] = false;
          }
        }
      }
    },
    setupTimingPattern: function () {
      for (var r = 8; r < this.moduleCount - 8; r++) {
        if (this.modules[r][6] !== null) continue;
        this.modules[r][6] = (r % 2 == 0);
      }
      for (var c = 8; c < this.moduleCount - 8; c++) {
        if (this.modules[6][c] !== null) continue;
        this.modules[6][c] = (c % 2 == 0);
      }
    },
    setupPositionAdjustPattern: function () {
      var pos = [
        [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
        [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
      ][this.typeNumber - 1] || [];
      for (var i = 0; i < pos.length; i++) {
        for (var j = 0; j < pos.length; j++) {
          var row = pos[i];
          var col = pos[j];
          if (this.modules[row][col] !== null) continue;
          for (var r = -2; r <= 2; r++) {
            for (var c = -2; c <= 2; c++) {
              if (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
                this.modules[row + r][col + c] = true;
              } else {
                this.modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    },
    setupTypeInfo: function (test, maskPattern) {
      var data = (this.errorCorrectLevel << 3) | maskPattern;
      var bits = (function (data) {
        var d = data << 10;
        while ((d >> 10) > 0) {
          var msb = 0;
          for (var i = 14; i >= 10; i--) {
            if ((d >> i) & 1) { msb = i; break; }
          }
          d ^= (0x537 << (msb - 10));
        }
        return ((data << 10) | d) ^ 0x5412;
      })(data);

      for (var i = 0; i < 15; i++) {
        var mod = (!test && ((bits >> i) & 1) == 1);
        if (i < 6) this.modules[i][8] = mod;
        else if (i < 8) this.modules[i + 1][8] = mod;
        else this.modules[this.moduleCount - 15 + i][8] = mod;

        if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
        else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
        else this.modules[8][15 - i - 1] = mod;
      }
      this.modules[this.moduleCount - 8][8] = !test;
    },
    setupTypeNumber: function (test) {
      var bits = (function (typeNumber) {
        var d = typeNumber << 12;
        while ((d >> 12) > 0) {
          var msb = 0;
          for (var i = 17; i >= 12; i--) {
            if ((d >> i) & 1) { msb = i; break; }
          }
          d ^= (0x1f25 << (msb - 12));
        }
        return (typeNumber << 12) | d;
      })(this.typeNumber);

      for (var i = 0; i < 18; i++) {
        var mod = (!test && ((bits >> i) & 1) == 1);
        this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
        this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    },
    createData: function () {
      var rsBlocks = getRSBlocks(this.typeNumber, this.errorCorrectLevel);
      var buffer = new QRBitBuffer();
      for (var i = 0; i < this.dataList.length; i++) {
        var data = this.dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), this.typeNumber < 10 ? 8 : 16);
        data.write(buffer);
      }
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
      if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
      while (buffer.length % 8 != 0) buffer.putBit(false);
      while (true) {
        if (buffer.length >= totalDataCount * 8) break;
        buffer.put(0xec, 8);
        if (buffer.length >= totalDataCount * 8) break;
        buffer.put(0x11, 8);
      }

      var offset = 0;
      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);
      for (var r = 0; r < rsBlocks.length; r++) {
        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;
        dcdata[r] = new Array(dcCount);
        for (var i = 0; i < dcdata[r].length; i++) {
          dcdata[r][i] = 0xff & buffer.buffer[i + offset];
        }
        offset += dcCount;
        var rsPoly = createErrorCorrectPolynomial(ecCount);
        var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i++) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
        }
      }

      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
      var data = new Array(totalCodeCount);
      var index = 0;
      for (var i = 0; i < 256; i++) {
        for (var r = 0; r < rsBlocks.length; r++) {
          if (i < dcdata[r].length) data[index++] = dcdata[r][i];
        }
      }
      for (var i = 0; i < 256; i++) {
        for (var r = 0; r < rsBlocks.length; r++) {
          if (i < ecdata[r].length) data[index++] = ecdata[r][i];
        }
      }
      return data;
    },
    mapData: function (data, maskPattern) {
      var inc = -1;
      var row = this.moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;
      var mask = function (i, j) {
        switch (maskPattern) {
          case 0: return (i + j) % 2 == 0;
          case 1: return i % 2 == 0;
          case 2: return j % 3 == 0;
          case 3: return (i + j) % 3 == 0;
          case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
          case 5: return ((i * j) % 2) + ((i * j) % 3) == 0;
          case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 == 0;
          case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 == 0;
          default: throw new Error("mask:" + maskPattern);
        }
      };

      for (var col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col == 6) col--;
        while (true) {
          for (var c = 0; c < 2; c++) {
            if (this.modules[row][col - c] === null) {
              var dark = false;
              if (byteIndex < data.length) {
                dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
              }
              if (mask(row, col - c)) dark = !dark;
              this.modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex == -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || this.moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    },
    getBestMaskPattern: function () {
      var minLostPoint = 0;
      var pattern = 0;
      for (var i = 0; i < 8; i++) {
        this.makeImpl(true, i);
        var lostPoint = (function (qr) {
          var lost = 0;
          var count = qr.getModuleCount();
          for (var row = 0; row < count; row++) {
            for (var col = 0; col < count; col++) {
              var same = 0;
              var dark = qr.isDark(row, col);
              for (var r = -1; r <= 1; r++) {
                if (row + r < 0 || count <= row + r) continue;
                for (var c = -1; c <= 1; c++) {
                  if (col + c < 0 || count <= col + c || (r == 0 && c == 0)) continue;
                  if (dark == qr.isDark(row + r, col + c)) same++;
                }
              }
              if (same > 5) lost += (3 + same - 5);
            }
          }
          return lost;
        })(this);

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }
      return pattern;
    }
  };

  // Helper to generate SVG string
  function generateSVG(text, options) {
    options = options || {};
    var size = options.size || 160;
    var margin = options.margin !== undefined ? options.margin : 2;
    var darkColor = options.colorDark || '#0f172a';
    var lightColor = options.colorLight || '#ffffff';

    // Auto-detect version needed
    var len = stringToBytes(text).length;
    var typeNumber = 2; // fits ~32 bytes
    if (len > 32) typeNumber = 3; // fits ~53 bytes
    if (len > 53) typeNumber = 4; // fits ~78 bytes
    if (len > 78) typeNumber = 5; // fits ~106 bytes
    if (len > 106) typeNumber = 6; // fits ~134 bytes
    if (len > 134) typeNumber = 8; // fits ~192 bytes

    var qr = new QRCodeModel(typeNumber, 1); // 1 = Level M (15% error recovery)
    qr.addData(text);
    qr.make();

    var count = qr.getModuleCount();
    var viewBoxSize = count + margin * 2;
    var rects = [];

    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          rects.push('<rect x="' + (c + margin) + '" y="' + (r + margin) + '" width="1" height="1" fill="' + darkColor + '" />');
        }
      }
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + viewBoxSize + ' ' + viewBoxSize + '" width="' + size + '" height="' + size + '">' +
      '<rect width="100%" height="100%" fill="' + lightColor + '"/>' +
      rects.join('') +
      '</svg>';
  }

  return {
    generateSVG: generateSVG,
    renderTo: function (element, text, options) {
      if (typeof element === 'string') element = document.getElementById(element);
      if (!element) return;
      element.innerHTML = generateSVG(text, options);
    }
  };
}));
