(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
module.exports = asPromise;

/**
 * Callback as used by {@link util.asPromise}.
 * @typedef asPromiseCallback
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {...*} params Additional arguments
 * @returns {undefined}
 */

/**
 * Returns a promise from a node-style callback function.
 * @memberof util
 * @param {asPromiseCallback} fn Function to call
 * @param {*} ctx Function context
 * @param {...*} params Function arguments
 * @returns {Promise<*>} Promisified function
 */
function asPromise(fn, ctx/*, varargs */) {
    var params  = new Array(arguments.length - 1),
        offset  = 0,
        index   = 2,
        pending = true;
    while (index < arguments.length)
        params[offset++] = arguments[index++];
    return new Promise(function executor(resolve, reject) {
        params[offset] = function callback(err/*, varargs */) {
            if (pending) {
                pending = false;
                if (err)
                    reject(err);
                else {
                    var params = new Array(arguments.length - 1),
                        offset = 0;
                    while (offset < params.length)
                        params[offset++] = arguments[offset];
                    resolve.apply(null, params);
                }
            }
        };
        try {
            fn.apply(ctx || null, params);
        } catch (err) {
            if (pending) {
                pending = false;
                reject(err);
            }
        }
    });
}

},{}],2:[function(require,module,exports){
"use strict";

/**
 * A minimal base64 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var base64 = exports;

/**
 * Calculates the byte length of a base64 encoded string.
 * @param {string} string Base64 encoded string
 * @returns {number} Byte length
 */
base64.length = function length(string) {
    var p = string.length;
    if (!p)
        return 0;
    var n = 0;
    while (--p % 4 > 1 && string.charAt(p) === "=")
        ++n;
    return Math.ceil(string.length * 3) / 4 - n;
};

// Base64 encoding table
var b64 = new Array(64);

// Base64 decoding table
var s64 = new Array(123);

// 65..90, 97..122, 48..57, 43, 47
for (var i = 0; i < 64;)
    s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;

/**
 * Encodes a buffer to a base64 encoded string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} Base64 encoded string
 */
base64.encode = function encode(buffer, start, end) {
    var parts = null,
        chunk = [];
    var i = 0, // output index
        j = 0, // goto index
        t;     // temporary
    while (start < end) {
        var b = buffer[start++];
        switch (j) {
            case 0:
                chunk[i++] = b64[b >> 2];
                t = (b & 3) << 4;
                j = 1;
                break;
            case 1:
                chunk[i++] = b64[t | b >> 4];
                t = (b & 15) << 2;
                j = 2;
                break;
            case 2:
                chunk[i++] = b64[t | b >> 6];
                chunk[i++] = b64[b & 63];
                j = 0;
                break;
        }
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (j) {
        chunk[i++] = b64[t];
        chunk[i++] = 61;
        if (j === 1)
            chunk[i++] = 61;
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

var invalidEncoding = "invalid encoding";

/**
 * Decodes a base64 encoded string to a buffer.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Number of bytes written
 * @throws {Error} If encoding is invalid
 */
base64.decode = function decode(string, buffer, offset) {
    var start = offset;
    var j = 0, // goto index
        t;     // temporary
    for (var i = 0; i < string.length;) {
        var c = string.charCodeAt(i++);
        if (c === 61 && j > 1)
            break;
        if ((c = s64[c]) === undefined)
            throw Error(invalidEncoding);
        switch (j) {
            case 0:
                t = c;
                j = 1;
                break;
            case 1:
                buffer[offset++] = t << 2 | (c & 48) >> 4;
                t = c;
                j = 2;
                break;
            case 2:
                buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
                t = c;
                j = 3;
                break;
            case 3:
                buffer[offset++] = (t & 3) << 6 | c;
                j = 0;
                break;
        }
    }
    if (j === 1)
        throw Error(invalidEncoding);
    return offset - start;
};

/**
 * Tests if the specified string appears to be base64 encoded.
 * @param {string} string String to test
 * @returns {boolean} `true` if probably base64 encoded, otherwise false
 */
base64.test = function test(string) {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
};

},{}],3:[function(require,module,exports){
"use strict";
module.exports = EventEmitter;

/**
 * Constructs a new event emitter instance.
 * @classdesc A minimal event emitter.
 * @memberof util
 * @constructor
 */
function EventEmitter() {

    /**
     * Registered listeners.
     * @type {Object.<string,*>}
     * @private
     */
    this._listeners = {};
}

/**
 * Registers an event listener.
 * @param {string} evt Event name
 * @param {function} fn Listener
 * @param {*} [ctx] Listener context
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.on = function on(evt, fn, ctx) {
    (this._listeners[evt] || (this._listeners[evt] = [])).push({
        fn  : fn,
        ctx : ctx || this
    });
    return this;
};

/**
 * Removes an event listener or any matching listeners if arguments are omitted.
 * @param {string} [evt] Event name. Removes all listeners if omitted.
 * @param {function} [fn] Listener to remove. Removes all listeners of `evt` if omitted.
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.off = function off(evt, fn) {
    if (evt === undefined)
        this._listeners = {};
    else {
        if (fn === undefined)
            this._listeners[evt] = [];
        else {
            var listeners = this._listeners[evt];
            for (var i = 0; i < listeners.length;)
                if (listeners[i].fn === fn)
                    listeners.splice(i, 1);
                else
                    ++i;
        }
    }
    return this;
};

/**
 * Emits an event by calling its listeners with the specified arguments.
 * @param {string} evt Event name
 * @param {...*} args Arguments
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.emit = function emit(evt) {
    var listeners = this._listeners[evt];
    if (listeners) {
        var args = [],
            i = 1;
        for (; i < arguments.length;)
            args.push(arguments[i++]);
        for (i = 0; i < listeners.length;)
            listeners[i].fn.apply(listeners[i++].ctx, args);
    }
    return this;
};

},{}],4:[function(require,module,exports){
"use strict";

module.exports = factory(factory);

/**
 * Reads / writes floats / doubles from / to buffers.
 * @name util.float
 * @namespace
 */

/**
 * Writes a 32 bit float to a buffer using little endian byte order.
 * @name util.float.writeFloatLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 32 bit float to a buffer using big endian byte order.
 * @name util.float.writeFloatBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 32 bit float from a buffer using little endian byte order.
 * @name util.float.readFloatLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 32 bit float from a buffer using big endian byte order.
 * @name util.float.readFloatBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Writes a 64 bit double to a buffer using little endian byte order.
 * @name util.float.writeDoubleLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 64 bit double to a buffer using big endian byte order.
 * @name util.float.writeDoubleBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 64 bit double from a buffer using little endian byte order.
 * @name util.float.readDoubleLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 64 bit double from a buffer using big endian byte order.
 * @name util.float.readDoubleBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

// Factory function for the purpose of node-based testing in modified global environments
function factory(exports) {

    // float: typed array
    if (typeof Float32Array !== "undefined") (function() {

        var f32 = new Float32Array([ -0 ]),
            f8b = new Uint8Array(f32.buffer),
            le  = f8b[3] === 128;

        function writeFloat_f32_cpy(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
        }

        function writeFloat_f32_rev(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[3];
            buf[pos + 1] = f8b[2];
            buf[pos + 2] = f8b[1];
            buf[pos + 3] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
        /* istanbul ignore next */
        exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;

        function readFloat_f32_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            return f32[0];
        }

        function readFloat_f32_rev(buf, pos) {
            f8b[3] = buf[pos    ];
            f8b[2] = buf[pos + 1];
            f8b[1] = buf[pos + 2];
            f8b[0] = buf[pos + 3];
            return f32[0];
        }

        /* istanbul ignore next */
        exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
        /* istanbul ignore next */
        exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;

    // float: ieee754
    })(); else (function() {

        function writeFloat_ieee754(writeUint, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0)
                writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos);
            else if (isNaN(val))
                writeUint(2143289344, buf, pos);
            else if (val > 3.4028234663852886e+38) // +-Infinity
                writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
            else if (val < 1.1754943508222875e-38) // denormal
                writeUint((sign << 31 | Math.round(val / 1.401298464324817e-45)) >>> 0, buf, pos);
            else {
                var exponent = Math.floor(Math.log(val) / Math.LN2),
                    mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
                writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
            }
        }

        exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
        exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);

        function readFloat_ieee754(readUint, buf, pos) {
            var uint = readUint(buf, pos),
                sign = (uint >> 31) * 2 + 1,
                exponent = uint >>> 23 & 255,
                mantissa = uint & 8388607;
            return exponent === 255
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0 // denormal
                ? sign * 1.401298464324817e-45 * mantissa
                : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
        }

        exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
        exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);

    })();

    // double: typed array
    if (typeof Float64Array !== "undefined") (function() {

        var f64 = new Float64Array([-0]),
            f8b = new Uint8Array(f64.buffer),
            le  = f8b[7] === 128;

        function writeDouble_f64_cpy(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
            buf[pos + 4] = f8b[4];
            buf[pos + 5] = f8b[5];
            buf[pos + 6] = f8b[6];
            buf[pos + 7] = f8b[7];
        }

        function writeDouble_f64_rev(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[7];
            buf[pos + 1] = f8b[6];
            buf[pos + 2] = f8b[5];
            buf[pos + 3] = f8b[4];
            buf[pos + 4] = f8b[3];
            buf[pos + 5] = f8b[2];
            buf[pos + 6] = f8b[1];
            buf[pos + 7] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
        /* istanbul ignore next */
        exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;

        function readDouble_f64_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            f8b[4] = buf[pos + 4];
            f8b[5] = buf[pos + 5];
            f8b[6] = buf[pos + 6];
            f8b[7] = buf[pos + 7];
            return f64[0];
        }

        function readDouble_f64_rev(buf, pos) {
            f8b[7] = buf[pos    ];
            f8b[6] = buf[pos + 1];
            f8b[5] = buf[pos + 2];
            f8b[4] = buf[pos + 3];
            f8b[3] = buf[pos + 4];
            f8b[2] = buf[pos + 5];
            f8b[1] = buf[pos + 6];
            f8b[0] = buf[pos + 7];
            return f64[0];
        }

        /* istanbul ignore next */
        exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
        /* istanbul ignore next */
        exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;

    // double: ieee754
    })(); else (function() {

        function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0) {
                writeUint(0, buf, pos + off0);
                writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos + off1);
            } else if (isNaN(val)) {
                writeUint(0, buf, pos + off0);
                writeUint(2146959360, buf, pos + off1);
            } else if (val > 1.7976931348623157e+308) { // +-Infinity
                writeUint(0, buf, pos + off0);
                writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
            } else {
                var mantissa;
                if (val < 2.2250738585072014e-308) { // denormal
                    mantissa = val / 5e-324;
                    writeUint(mantissa >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
                } else {
                    var exponent = Math.floor(Math.log(val) / Math.LN2);
                    if (exponent === 1024)
                        exponent = 1023;
                    mantissa = val * Math.pow(2, -exponent);
                    writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
                }
            }
        }

        exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
        exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);

        function readDouble_ieee754(readUint, off0, off1, buf, pos) {
            var lo = readUint(buf, pos + off0),
                hi = readUint(buf, pos + off1);
            var sign = (hi >> 31) * 2 + 1,
                exponent = hi >>> 20 & 2047,
                mantissa = 4294967296 * (hi & 1048575) + lo;
            return exponent === 2047
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0 // denormal
                ? sign * 5e-324 * mantissa
                : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
        }

        exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
        exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);

    })();

    return exports;
}

// uint helpers

function writeUintLE(val, buf, pos) {
    buf[pos    ] =  val        & 255;
    buf[pos + 1] =  val >>> 8  & 255;
    buf[pos + 2] =  val >>> 16 & 255;
    buf[pos + 3] =  val >>> 24;
}

function writeUintBE(val, buf, pos) {
    buf[pos    ] =  val >>> 24;
    buf[pos + 1] =  val >>> 16 & 255;
    buf[pos + 2] =  val >>> 8  & 255;
    buf[pos + 3] =  val        & 255;
}

function readUintLE(buf, pos) {
    return (buf[pos    ]
          | buf[pos + 1] << 8
          | buf[pos + 2] << 16
          | buf[pos + 3] << 24) >>> 0;
}

function readUintBE(buf, pos) {
    return (buf[pos    ] << 24
          | buf[pos + 1] << 16
          | buf[pos + 2] << 8
          | buf[pos + 3]) >>> 0;
}

},{}],5:[function(require,module,exports){
"use strict";
module.exports = inquire;

/**
 * Requires a module only if available.
 * @memberof util
 * @param {string} moduleName Module to require
 * @returns {?Object} Required module if available and not empty, otherwise `null`
 */
function inquire(moduleName) {
    try {
        var mod = eval("quire".replace(/^/,"re"))(moduleName); // eslint-disable-line no-eval
        if (mod && (mod.length || Object.keys(mod).length))
            return mod;
    } catch (e) {} // eslint-disable-line no-empty
    return null;
}

},{}],6:[function(require,module,exports){
"use strict";
module.exports = pool;

/**
 * An allocator as used by {@link util.pool}.
 * @typedef PoolAllocator
 * @type {function}
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */

/**
 * A slicer as used by {@link util.pool}.
 * @typedef PoolSlicer
 * @type {function}
 * @param {number} start Start offset
 * @param {number} end End offset
 * @returns {Uint8Array} Buffer slice
 * @this {Uint8Array}
 */

/**
 * A general purpose buffer pool.
 * @memberof util
 * @function
 * @param {PoolAllocator} alloc Allocator
 * @param {PoolSlicer} slice Slicer
 * @param {number} [size=8192] Slab size
 * @returns {PoolAllocator} Pooled allocator
 */
function pool(alloc, slice, size) {
    var SIZE   = size || 8192;
    var MAX    = SIZE >>> 1;
    var slab   = null;
    var offset = SIZE;
    return function pool_alloc(size) {
        if (size < 1 || size > MAX)
            return alloc(size);
        if (offset + size > SIZE) {
            slab = alloc(SIZE);
            offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size);
        if (offset & 7) // align to 32 bit
            offset = (offset | 7) + 1;
        return buf;
    };
}

},{}],7:[function(require,module,exports){
"use strict";

/**
 * A minimal UTF8 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var utf8 = exports;

/**
 * Calculates the UTF8 byte length of a string.
 * @param {string} string String
 * @returns {number} Byte length
 */
utf8.length = function utf8_length(string) {
    var len = 0,
        c = 0;
    for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128)
            len += 1;
        else if (c < 2048)
            len += 2;
        else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
            ++i;
            len += 4;
        } else
            len += 3;
    }
    return len;
};

/**
 * Reads UTF8 bytes as a string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
utf8.read = function utf8_read(buffer, start, end) {
    var len = end - start;
    if (len < 1)
        return "";
    var parts = null,
        chunk = [],
        i = 0, // char offset
        t;     // temporary
    while (start < end) {
        t = buffer[start++];
        if (t < 128)
            chunk[i++] = t;
        else if (t > 191 && t < 224)
            chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;
        else if (t > 239 && t < 365) {
            t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
            chunk[i++] = 0xD800 + (t >> 10);
            chunk[i++] = 0xDC00 + (t & 1023);
        } else
            chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

/**
 * Writes a string as UTF8 bytes.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
utf8.write = function utf8_write(string, buffer, offset) {
    var start = offset,
        c1, // character 1
        c2; // character 2
    for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
            buffer[offset++] = c1;
        } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6       | 192;
            buffer[offset++] = c1       & 63 | 128;
        } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
            c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
            ++i;
            buffer[offset++] = c1 >> 18      | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        } else {
            buffer[offset++] = c1 >> 12      | 224;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        }
    }
    return offset - start;
};

},{}],8:[function(require,module,exports){
module.exports = {
	first: first, 
	all: all, 
	closest: closest,
	next: next,
	prev: prev, 
	append: append,
	frag: frag
};


// for Edge, still do not support .matches :(
var tmpEl = document.createElement("div");
var matchesFn = tmpEl.matches || tmpEl.webkitMatchesSelector || tmpEl.msMatchesSelector;
module.exports._matchesFn = matchesFn; // make it available for this module (this will be internal only)

// --------- DOM Query Shortcuts --------- //

// Shortcut for .querySelector
// return the first element matching the selector from this el (or document if el is not given)
function first(el_or_selector, selector){
	// We do not have a selector at all, then, this call is for firstElementChild
	if (!selector && typeof el_or_selector !== "string"){
		var el = el_or_selector;
		// try to get 
		var firstElementChild = el.firstElementChild;

		// if firstElementChild is null/undefined, but we have a firstChild, it is perhaps because not supported
		if (!firstElementChild && el.firstChild){

			// If the firstChild is of type Element, return it. 
			if (el.firstChild.nodeType === 1 ){
				return el.firstChild;
			}
			// Otherwise, try to find the next element (using the next)
			else{
				return next(el.firstChild);
			}			
		}

		return firstElementChild;
	}
	// otherwise, the call was either (selector) or (el, selector), so foward to the querySelector
	else{
		return _execQuerySelector(false, el_or_selector, selector);	
	}
	
}

// Shortcut for .querySelectorAll
// return an nodeList of all of the elements element matching the selector from this el (or document if el is not given)
function all(el, selector){
	return _execQuerySelector(true, el, selector);
}

// return the first element next to the el matching the selector
// if no selector, will return the next Element
// return null if not found.
function next(el, selector){
	return _sibling(true, el, selector);
}

// if no selector, will return the previous Element
function prev(el, selector){
	return _sibling(false, el, selector);
}

// return the element closest in the hierarchy (up), including this el, matching this selector
// return null if not found
function closest(el, selector){
	var tmpEl = el;
	
	// use "!=" for null and undefined
	while (tmpEl != null && tmpEl !== document){
		if (matchesFn.call(tmpEl,selector)){
			return tmpEl;
		}
		tmpEl = tmpEl.parentElement;		
	}
	return null;
}

// --------- /DOM Query Shortcuts --------- //


// --------- DOM Helpers --------- //
function append(refEl, newEl, position){
	var parentEl, nextSibling = null;
	
	// default is "last"
	position = (position)?position:"last";

	//// 1) We determine the parentEl
	if (position === "last" || position === "first"  || position === "empty"){
		parentEl = refEl;
	}else if (position === "before" || position === "after"){
		parentEl = refEl.parentNode;
		if (!parentEl){
			throw new Error("mvdom ERROR - The referenceElement " + refEl + " does not have a parentNode. Cannot insert " + position);
		}
	}

	//// 2) We determine if we have a nextSibling or not
	// if "first", we try to see if there is a first child
	if (position === "first"){
		nextSibling = first(refEl); // if this is null, then, it will just do an appendChild
		// Note: this might be a text node but this is fine in this context.
	}
	// if "before", then, the refEl is the nextSibling
	else if (position === "before"){
		nextSibling = refEl;
	}
	// if "after", try to find the next Sibling (if not found, it will be just a appendChild to add last)
	else if (position === "after"){
		nextSibling = next(refEl);
	}

	//// 3) We append the newEl
	// if we have a next sibling, we insert it before
	if (nextSibling){
		parentEl.insertBefore(newEl, nextSibling);
	}
	// otherwise, we just do a append last
	else{
		if (position === "empty"){
			// TODO: CIRCULAR dependency. Right now, we do need to call the view.empty to do the correct empty, but view also use dom.js
			//       This works right now as all the modules get merged into the same object, but would be good to find a more elegant solution
			this.empty(refEl);
		}
		parentEl.appendChild(newEl);
	}

	return newEl;	
}


function frag(html){
	// make it null proof
	html = (html)?html.trim():null;
	if (!html){
		return null;
	}

	var template = document.createElement("template");
	if(template.content){
		template.innerHTML = html;
		return template.content;
	}
	// for IE 11
	else{
		var frag = document.createDocumentFragment();
		var tmp = document.createElement("div");
		tmp.innerHTML = html;
		while (tmp.firstChild) {
			frag.appendChild(tmp.firstChild);
		}
		return frag;

	}	
}
// --------- /DOM Helpers --------- //




function _sibling(next, el, selector){
	var sibling = (next)?"nextSibling":"previousSibling";

	var tmpEl = (el)?el[sibling]:null;

	// use "!=" for null and undefined
	while (tmpEl != null && tmpEl !== document){
		// only if node type is of Element, otherwise, 
		if (tmpEl.nodeType === 1 && (!selector || matchesFn.call(tmpEl, selector))){
			return tmpEl;
		}
		tmpEl = tmpEl[sibling];
	}
	return null;
}


// util: querySelector[All] wrapper
function _execQuerySelector(all, el, selector){
	// if el is null or undefined, means we return nothing. 
	if (typeof el === "undefined" || el === null){
		return null;
	}
	// if selector is undefined, it means we select from document and el is the document
	if (typeof selector === "undefined"){
		selector = el;
		el = document;		
	}
	return (all)?el.querySelectorAll(selector):el.querySelector(selector);
}

},{}],9:[function(require,module,exports){

var dom = require("./dom.js");
var utils = require("./utils.js");

module.exports = {
	pull: pull, 
	push: push, 
	puller: puller, 
	pusher: pusher
};

var _pushers = [

	["input[type='checkbox'], input[type='radio']", function(value){
		var iptValue = this.value || "on"; // as some browsers default to this

		// if the value is an array, it need to match this iptValue
		if (value instanceof Array){
			if (value.indexOf(iptValue) > -1){
				this.checked = true;
			}
		}
		// otherwise, if value is not an array,
		else if ((iptValue === "on" && value) || iptValue === value){
			this.checked = true;
		}
	}],

	["input", function(value){
		if(typeof value !== "undefined") this.value = value;
	}],

	["select", function(value){
		if(typeof value !== "undefined") this.value = value;
	}],

	["textarea", function(value){
		if(typeof value !== "undefined") this.value = value;
	}],

	["*", function(value){
		if(typeof value !== "undefined") this.innerHTML = value;
	}]
];

var _pullers = [
	["input[type='checkbox'], input[type='radio']", function(existingValue){

		var iptValue = this.value || "on"; // as some browser default to this
		var newValue;
		if (this.checked){
			// change "on" by true value (which usually what we want to have)
			// TODO: We should test the attribute "value" to allow "on" if it is defined
			newValue = (iptValue && iptValue !== "on")?iptValue:true;
			if (typeof existingValue !== "undefined"){
				// if we have an existingValue for this property, we create an array
				var values = utils.asArray(existingValue);
				values.push(newValue);
				newValue = values;
			}				
		}
		return newValue;
	}],

	["input, select", function(existingValue){
		return this.value;
	}],

	["textarea", function(existingValue){
		return this.value;
	}],

	["*", function(existingValue){
		return this.innerHTML;
	}]
];

function pusher(selector,func){
	_pushers.unshift([selector,func]);
}

function puller(selector,func){
	_pullers.unshift([selector,func]);
}

function push(el, selector_or_data, data) {
	var selector;

	// if data is null or undefined
	if (data == null){
		selector = ".dx";
		data = selector_or_data;
	}else{
		selector = selector_or_data;
	}

	var dxEls = dom.all(el, selector);

	utils.asArray(dxEls).forEach(function(dxEl){
		
		var propPath = getPropPath(dxEl);
		var value = utils.val(data,propPath);
		var i = 0, pusherSelector, fun, l = _pushers.length;
		for (; i<l ; i++){
			pusherSelector = _pushers[i][0];
			if (dom._matchesFn.call(dxEl,pusherSelector)){
				fun = _pushers[i][1];
				fun.call(dxEl,value);
				break;
			}
		}		
	});
}

function pull(el, selector){
	var obj = {};

	selector = (selector)?selector:".dx";

	var dxEls = dom.all(el, selector);

	utils.asArray(dxEls).forEach(function(dxEl){
		var propPath = getPropPath(dxEl);
		var i = 0, pullerSelector, fun, l = _pullers.length;		
		for (; i<l ; i++){
			pullerSelector = _pullers[i][0];
			if (dom._matchesFn.call(dxEl,pullerSelector)){
				fun = _pullers[i][1];
				var existingValue = utils.val(obj,propPath);
				var value = fun.call(dxEl,existingValue);
				if (typeof value !== "undefined"){
					utils.val(obj,propPath,value);	
				}
				break;
			}					
		}		
	});

	return obj;
}

/** 
 * Return the variable path of the first dx-. "-" is changed to "."
 * 
 * @param classAttr: like "row dx dx-contact.name"
 * @returns: will return "contact.name"
 **/
function getPropPath(dxEl){
	var path = null;
	var i =0, classes = dxEl.classList, l = dxEl.classList.length, name;
	for (; i < l; i++){
		name = classes[i];
		if (name.indexOf("dx-") === 0){
			path = name.split("-").slice(1).join(".");
			break;
		}
	}
	// if we do not have a path in the css, try the data-dx attribute
	if (!path){
		path = dxEl.getAttribute("data-dx");
	}
	if (!path){
		path = dxEl.getAttribute("name"); // last fall back, assume input field
	}
	return path;
}




},{"./dom.js":8,"./utils.js":13}],10:[function(require,module,exports){
var utils = require("./utils.js");
var dom = require("./dom.js");

module.exports = {
	on: on,
	off: off,
	trigger: trigger
};

// --------- Module APIs --------- //

// bind a event can be call with 
// - els: single or array of the base dom elements to bind the event listener upon.
// - type: event type (like 'click' or can be custom event).
// - selector: (optional) query selector which will be tested on the target element. 
// - listener: function which will get the "event" as first parameter
// - opts: (optional) {ns,ctx} optional namespace and ctx (i.e. this)
function on(els, types, selector, listener, opts){

	// if the "selector" is a function, then, it is the listener and there is no selector
	if (selector instanceof Function){
		listener = selector;
		selector = null;
		opts = listener;
	}

	types = utils.splitAndTrim(types, ",");

	types.forEach(function(type){
		var typeSelectorKey = buildTypeSelectorKey(type, selector);

		utils.asArray(els).forEach(function(el){

			// This will the listener use for the even listener, which might differ
			// from the listener function passed in case of a selector
			var _listener = listener; 

			// if we have a selector, create the wrapper listener to do the matches on the selector
			if (selector){
				_listener = function(evt){
					var tgt = null;
					var target = evt.target;
					var currentTarget = evt.currentTarget;
					var ctx = (opts)?opts.ctx:null;
					// if the target match the selector, then, easy, we call the listener
					if (target && dom._matchesFn.call(target,selector)){
						// Note: While mouseEvent are readonly for its properties, it does allow to add custom properties
						evt.selectTarget = target;
						listener.call(ctx,evt);
					}
					// now, if it does not, perhaps something in between the target and currentTarget
					// might match
					else{
						tgt = evt.target.parentNode;
						// TODO: might need to check that tgt is not undefined as well. 
						while (tgt !== null && tgt !== currentTarget && tgt !== document){
							if (dom._matchesFn.call(tgt,selector)){
								// Note: While mouseEvent are readonly for its properties, it does allow to add custom properties
								evt.selectTarget = tgt;
								listener.call(ctx,evt);
								tgt = null;
								break;
							}

							tgt = tgt.parentNode;
						}
					}
				};
			}
			// if we do not have a selector, but still havea  opts.ctx, then, need to wrap
			else if (opts && opts.ctx){
				_listener = function(evt){
					listener.call(opts.ctx,evt);
				};
			}
			
			var listenerRef = {
				type: type,
				listener: listener, // the listener as passed by the user
				_listener: _listener, // an eventual wrap of the listener, or just point listener.
			};

			if (selector){
				listenerRef.selector = selector;
			}

			// If we have a namespace, they add it to the Ref, and to the listenerRefsByNs
			// TODO: need to add listenerRef in a nsDic if if there a opts.ns
			if (opts && opts.ns){
				listenerRef.ns = opts.ns;
				var listenerRefSetByNs = utils.ensureMap(el,"listenerRefsByNs");
				var listenerRefSet = utils.ensureSet(listenerRefSetByNs, opts.ns);
				listenerRefSet.add(listenerRef);
			}

			// add the listenerRef as listener:listenerRef entry for this typeSelectorKey in the listenerDic
			var listenerDic = utils.ensureMap(el,"listenerDic");
			var listenerRefByListener = utils.ensureMap(listenerDic,typeSelectorKey);
			listenerRefByListener.set(listener, listenerRef);

			// do the binding
			el.addEventListener(type, _listener);

			return this;

		}); // /utils.asArray(els).forEach(function(el){

	}); // /types.forEach(function(type){

}


// remove the event binding
// .off(els); remove all events added via .on
// .off(els, type); remove all events of type added via .on
// .off(els, type, selector); remove all events of type and selector added via .on
// .off(els, type, selector, listener); remove event of this type, selector, and listener
// .off(els,{ns}); remove event from the namespace ns
function off(els, type, selector, listener){

	// --------- off(els, {ns}) --------- //
	// if we have a .off(els,{ns:..}) then we do check only the ns
	if (type.ns){		
		var ns = type.ns;
		utils.asArray(els).forEach(function(el){
			var listenerDic = el["listenerDic"];
			var listenerRefsByNs = el["listenerRefsByNs"];
			var listenerRefSet;
			if (listenerRefsByNs){
				listenerRefSet = listenerRefsByNs.get(ns);
				if (listenerRefSet){
					// if we get the set, we remove them all
					listenerRefSet.forEach(function(listenerRef){
						// we remove the event listener
						el.removeEventListener(listenerRef.type, listenerRef._listener);

						// need to remove it from the listenerDic
						var typeSelectorKey = buildTypeSelectorKey(listenerRef.type, listenerRef.selector);
						var listenerRefMapByListener = listenerDic.get(typeSelectorKey);
						if (listenerRefMapByListener.has(listenerRef.listener)){
							listenerRefMapByListener.delete(listenerRef.listener);
						}else{
							// console.log("INTERNAL ERROR should have a listener in el.listenerDic for " + typeSelectorKey);
						}
					});
					// we remove this namespace now that all event handlers has been removed
					listenerRefsByNs.delete(ns);
				}
			}
		});
		return;
	}
	// --------- /off(els, {ns}) --------- //


	// if the "selector" is a function, then, it is the listener and there is no selector
	if (selector instanceof Function){
		listener = selector;
		selector = null;
	}

	var typeSelectorKey = buildTypeSelectorKey(type, selector);

	utils.asArray(els).forEach(function(el){

		// First, get the listenerRefByListener for this type/selectory
		var listenerRefMapByListener = utils.val(el,["listenerDic",typeSelectorKey]);

		// for now, if we do not have a listenerRef for this type/[selector], we throw an error
		if (!listenerRefMapByListener){
			console.log("WARNING - Cannot do .off() since this type-selector '" + typeSelectorKey + 
				"' event was not bound with .on(). We will add support for this later.");
			return;
		}

		// if we do not have a listener function, this mean we need to remove all events for this type/selector
		if (typeof listener === "undefined"){
			listenerRefMapByListener.forEach(function(listenerRef){
				// Note: Here, type === listenerRef.type
				// remove the event
				el.removeEventListener(type, listenerRef._listener);				
			});
			el["listenerDic"].delete(typeSelectorKey);
		}
		// if we have a listener, then, just remove this one.
		else{
			// check that we have the map. 
			var listenerRef = listenerRefMapByListener.get(listener);

			if (!listenerRef){
				console.log("WARNING - Cannot do .off() since no listenerRef for " + typeSelectorKey + 
				" and function \n" + listener + "\n were found. Probably was not registered via on()");
				return;
			}

			// remove the event
			el.removeEventListener(type, listenerRef._listener);

			// remove it from the map
			listenerRefMapByListener.delete(listener);			
		}


	});	
}

var customDefaultProps = {
	bubbles: true,
	cancelable: true
};

function trigger(els, type, data){
	var evt = new CustomEvent(type, Object.assign({},customDefaultProps,data));	
	utils.asArray(els).forEach(function(el){
		el.dispatchEvent(evt);
	});
}
// --------- /Module APIs --------- //


function buildTypeSelectorKey(type, selector){
	var v = type;
	return (selector)?(v + "--" + selector):v;
}

},{"./dom.js":8,"./utils.js":13}],11:[function(require,module,exports){
var utils = require("./utils.js");

module.exports = {
	hub: hub
};

// User Hub object exposing the public API
var hubDic = new Map();

// Data for each hub (by name)
var hubDataDic = new Map(); 

// get or create a new hub;
function hub(name){
	if (name == null){
		throw "MVDOM INVALID API CALLS: for now, d.hub(name) require a name (no name was given).";
	}
	var h = hubDic.get(name); 
	// if it does not exist, we create and set it. 
	if (!h){
		// create the hub
		h = Object.create(HubProto, {
			name: { value: name } // read only
		});
		hubDic.set(name, h);

		// create the hubData
		hubDataDic.set(name, new HubDataProto(name));
	}
	return h;
}

hub.delete = function(name){
	hubDic.delete(name);
	hubDataDic.delete(name);
};

// --------- Hub --------- //
var HubProto = {
	sub: function(topics, labels, handler, opts){
		// ARG SHIFTING: if labels arg is a function, then, we swith the argument left
		if (typeof labels === "function"){
			opts = handler;
			handler = labels;			
			labels = null;
		}
		
		// make arrays
		topics = utils.splitAndTrim(topics, ",");
		if (labels != null){
			labels = utils.splitAndTrim(labels, ",");
		}

		// make opts (always defined at least an emtpy object)
		opts = makeOpts(opts);

		// add the event to the hubData
		var hubData = hubDataDic.get(this.name);
		hubData.addEvent(topics, labels, handler, opts);
	}, 

	unsub: function(ns){
		var hubData = hubDataDic.get(this.name);
		hubData.removeRefsForNs(ns);
	}, 

	pub: function(topics, labels, data){
		// ARG SHIFTING: if data is undefined, we shift args to the RIGHT
		if (typeof data === "undefined"){
			data = labels;
			labels = null;
		}

		topics = utils.splitAndTrim(topics, ",");


		if (labels != null){
			labels = utils.splitAndTrim(labels, ",");		
		}

		var hubData = hubDataDic.get(this.name);

		var hasLabels = (labels != null && labels.length > 0);

		// if we have labels, then, we send the labels bound events first
		if (hasLabels){
			hubData.getRefs(topics, labels).forEach(function(ref){
				invokeRef(ref, data);
			});
		}

		// then, we send the topic only bound
		hubData.getRefs(topics).forEach(function(ref){
			// if this send, has label, then, we make sure we invoke for each of this label
			if (hasLabels){
				labels.forEach(function(label){
					invokeRef(ref,data, label);
				});
			}
			// if we do not have labels, then, just call it.
			else{
				invokeRef(ref, data);
			}
		});

	}, 

	deleteHub: function(){
		hubDic.delete(this.name);
		hubDataDic.delete(this.name);
	}
};
// --------- /Hub --------- //

// --------- HubData --------- //
function HubDataProto(name){
	this.name = name;
	this.refsByNs = new Map();
	this.refsByTopic = new Map();
	this.refsByTopicLabel = new Map();
}

HubDataProto.prototype.addEvent = function(topics, labels, fun, opts){
	var refs = buildRefs(topics, labels, fun, opts);
	var refsByNs = this.refsByNs;
	var refsByTopic = this.refsByTopic;
	var refsByTopicLabel = this.refsByTopicLabel;
	refs.forEach(function(ref){
		// add this ref to the ns dictionary
		// TODO: probably need to add an custom "ns"
		if (ref.ns != null){
			utils.ensureArray(refsByNs, ref.ns).push(ref);
		}
		// if we have a label, add this ref to the topicLabel dictionary
		if (ref.label != null){
			utils.ensureArray(refsByTopicLabel, buildTopicLabelKey(ref.topic, ref.label)).push(ref);
		}
		// Otherwise, add it to this ref this topic
		else{
			
			utils.ensureArray(refsByTopic, ref.topic).push(ref);
		}
	});
};

HubDataProto.prototype.getRefs = function(topics, labels) {
	var refs = [];
	var refsByTopic = this.refsByTopic;
	var refsByTopicLabel = this.refsByTopicLabel;
	
	topics.forEach(function(topic){
		// if we do not have labels, then, just look in the topic dic
		if (labels == null || labels.length === 0){
			var topicRefs = refsByTopic.get(topic);
			if (topicRefs){
				refs.push.apply(refs, topicRefs);
			}
		}
		// if we have some labels, then, take those in accounts
		else{
			labels.forEach(function(label){
				var topicLabelRefs = refsByTopicLabel.get(buildTopicLabelKey(topic, label));
				if (topicLabelRefs){
					refs.push.apply(refs, topicLabelRefs);
				}
			});
		}
	});
	return refs;
};

HubDataProto.prototype.removeRefsForNs = function(ns){
	var refsByTopic = this.refsByTopic;
	var refsByTopicLabel = this.refsByTopicLabel;
	var refsByNs = this.refsByNs;

	var refs = this.refsByNs.get(ns);
	if (refs != null){

		// we remove each ref from the corresponding dic
		refs.forEach(function(ref){

			// First, we get the refs from the topic or topiclabel
			var refList;
			if (ref.label != null){
				var topicLabelKey = buildTopicLabelKey(ref.topic, ref.label);
				refList = refsByTopicLabel.get(topicLabelKey);
			}else{
				refList = refsByTopic.get(ref.topic);
			}

			// Then, for the refList array, we remove the ones that match this object
			var idx;
			while((idx = refList.indexOf(ref)) !== -1){
				refList.splice(idx, 1);
			}
		});

		// we remove them all form the refsByNs
		refsByNs.delete(ns);
	}


};

// static/private
function buildRefs(topics, labels, fun, opts){
	var refs = [];
	topics.forEach(function(topic){
		// if we do not have any labels, then, just add this topic
		if (labels == null || labels.length === 0){
			refs.push({
				topic: topic,
				fun: fun, 
				ns: opts.ns, 
				ctx: opts.ctx
			});
		}
		// if we have one or more labels, then, we add for those label
		else{
			labels.forEach(function(label){
				refs.push({
					topic: topic, 
					label: label, 
					fun: fun, 
					ns: opts.ns,
					ctx: opts.ctx
				});
			});			
		}

	});

	return refs;
}


// static/private: return a safe opts. If opts is a string, then, assume is it the {ns}
var emptyOpts = {};
function makeOpts(opts){
	if (opts == null){
		opts = emptyOpts;
	}else{
		if (typeof opts === "string"){
			opts = {ns:opts};
		}
	}
	return opts;
}

// static/private
function buildTopicLabelKey(topic, label){
	return topic + "-!-" + label;
}

// static/private: call ref method (with optional label override)
function invokeRef(ref, data, label){
	var info = {
		topic: ref.topic,
		label: ref.label || label,
		ns: ref.ns
	};
	ref.fun.call(ref.ctx,data,info);
}
// --------- /HubData --------- //



},{"./utils.js":13}],12:[function(require,module,exports){
var view = require("./view.js");
var event = require("./event.js");
var dom = require("./dom.js");
var dx = require("./dx.js");
var hub = require("./hub.js");
var utils = require("./utils.js");
require("./view-event.js");
require("./view-hub.js");
module.exports = {
    version: "0.4.3",
    // view APIs
    hook: view.hook,
    register: view.register,
    display: view.display,
    remove: view.remove,
    empty: view.empty,
    // event API
    on: event.on,
    off: event.off,
    trigger: event.trigger,
    // DOM Query Shortcuts
    first: dom.first,
    all: dom.all,
    closest: dom.closest,
    next: dom.next,
    prev: dom.prev,
    // DOM Helpers
    append: dom.append,
    frag: dom.frag,
    // DOM Push/Pull
    pull: dx.pull,
    push: dx.push,
    puller: dx.puller,
    pusher: dx.pusher,
    // Hub
    hub: hub.hub,
    // utils
    val: utils.val,
    asArray: utils.asArray
};
// put this component in the global scope
// TODO: We might want to have a index-global for putting this in the global scope and index.js not putting it in the global scope. 
if (window) {
    window.mvdom = module.exports;
}

},{"./dom.js":8,"./dx.js":9,"./event.js":10,"./hub.js":11,"./utils.js":13,"./view-event.js":14,"./view-hub.js":15,"./view.js":16}],13:[function(require,module,exports){

module.exports = {
	// Object Utils
	isNull: isNull,
	isEmpty: isEmpty,
	val: val, // public
	ensureMap: ensureMap,
	ensureSet: ensureSet,
	ensureArray: ensureArray,

	// asType
	asArray: asArray, // public

	// string utils
	splitAndTrim: splitAndTrim
};

// --------- Object Utils --------- //
var UD = "undefined";
var STR = "string";
var OBJ = "object";

// return true if value is null or undefined
function isNull(v){
	return (typeof v === UD || v === null);
}

// return true if the value is null, undefined, empty array, empty string, or empty object
function isEmpty(v){
	var tof = typeof v;
	if (isNull(v)){
		return true;
	}

	if (v instanceof Array || tof === STR){
		return (v.length === 0)?true:false;
	}

	if (tof === OBJ){
		// apparently 10x faster than Object.keys
		for (var x in v) { return false; }
		return true;
	}

	return false;
}

// TODO: need to document
function val(rootObj, pathToValue, value) {
	var setMode = (typeof value !== "undefined");

	if (!rootObj) {
		return rootObj;
	}
	// for now, return the rootObj if the pathToValue is empty or null or undefined
	if (!pathToValue) {
		return rootObj;
	}
	// if the pathToValue is already an array, do not parse it (this allow to support '.' in prop names)
	var names = (pathToValue instanceof Array)?pathToValue:pathToValue.split(".");
	
	var name, currentNode = rootObj, currentIsMap, nextNode;

	var i = 0, l = names.length, lIdx = l - 1;
	for (i; i < l; i++) {
		name = names[i];

		currentIsMap = (currentNode instanceof Map);
		nextNode = currentIsMap?currentNode.get(name):currentNode[name];

		if (setMode){
			// if last index, set the value
			if (i === lIdx){
				if (currentIsMap){
					currentNode.set(name,value);
				}else{
					currentNode[name] = value;
				}
				currentNode = value;
			}else{
				if (typeof nextNode === "undefined") {
					nextNode = {};
				} 
				currentNode[name] = nextNode;
				currentNode = nextNode;
			}
		}else{
			currentNode = nextNode;
			if (typeof currentNode === "undefined") {
				currentNode = undefined;
				break;
			}			
		}

		// if (node == null) {
		// 	return undefined;
		// }
		// // get the next node
		// node = (node instanceof Map)?node.get(name):node[name];
		// if (typeof node === "undefined") {
		// 	return node;
		// }
	}
	if (setMode){
		return rootObj;
	}else{
		return currentNode;
	}
}

// --------- /Object Utils --------- //

// --------- ensureType --------- //
// Make sure that this obj[propName] is a js Map and returns it. 
// Otherwise, create a new one, set it, and return it.
function ensureMap(obj, propName){
	return _ensure(obj, propName, Map);
}

// Make sure that this obj[propName] is a js Set and returns it. 
// Otherwise, create a new one, set it, and return it.
function ensureSet(obj, propName){
	return _ensure(obj, propName, Set);
}

// same as ensureMap but for array
function ensureArray(obj, propName){
	return _ensure(obj, propName, Array);
}

function _ensure(obj, propName, type){
	var isMap = (obj instanceof Map);
	var v = (isMap)?obj.get(propName):obj[propName];
	if (isNull(v)){
		v = (type === Array)?[]:(new type);
		if (isMap){
			obj.set(propName, v);
		}else{
			obj[propName] = v;	
		}		
	}
	return v;	
}

// --------- /ensureType --------- //

// --------- asType --------- //
// Return an array from a value object. If value is null/undefined, return empty array. 
// If value is null or undefined, return empty array
// If the value is an array it is returned as is
// If the value is a object with forEach/length will return a new array for these values
// Otherwise return single value array
function asArray(value){
	if (!isNull(value)){
		if (value instanceof Array){
			return value;
		}
		// If it is a nodeList, copy the elements into a real array
		else if (value.constructor && value.constructor.name === "NodeList"){
			return Array.prototype.slice.call(value);
		} 
		// if it is a function arguments
		else if (value.toString() === "[object Arguments]"){
			return Array.prototype.slice.call(value);
		}
		// otherwise we add value
		else{
			return [value];
		}
	}
	// otherwise, return an empty array
	return [];
}
// --------- /asType --------- //

// --------- String Utils --------- //
function splitAndTrim(str, sep){
	if (str == null){
		return [];
	}
	if (str.indexOf(sep) === -1){
		return [str.trim()];
	}
	return str.split(sep).map(trim);
}

function trim(str){
	return str.trim();
}
// --------- /String Utils --------- //

},{}],14:[function(require,module,exports){
var _view = require("./view.js");
var _event = require("./event.js");

// --------- Events Hook --------- //
_view.hook("willInit", function(view){
	var opts = {ns: "view_" + view.id, ctx: view};
	if (view.events){
		bindEvents(view.events, view.el, opts);
	}

	if (view.docEvents){
		bindEvents(view.docEvents, document, opts);
	}

	if (view.winEvents){
		bindEvents(view.windEvents, document, opts);
	}

	// TODO: need to allow closest binding.
});

_view.hook("willRemove", function(view){
	var ns = {ns: "view_" + view.id};
	_event.off(document, ns);
	_event.off(window, ns);
	// TODO: need to unbind closest/parents binding
});

function bindEvents(events, el, opts){
	var etxt, etxts, type, selector;
	for (etxt in events){
		etxts = etxt.trim().split(";");
		type = etxts[0].trim();
		selector = null;
		if (etxts.length > 1){
			selector = etxts[1].trim();
		}
		_event.on(el, type, selector, events[etxt], opts);
	}
}
// TODO: need to unbind on "willDestroy"

// --------- /Events Hook --------- //
},{"./event.js":10,"./view.js":16}],15:[function(require,module,exports){
var _view = require("./view.js");
var _hub = require("./hub.js");
var utils = require("./utils.js");

// --------- Events Hook --------- //
_view.hook("willInit", function(view){
	var opts = {ns: "view_" + view.id, ctx: view};

	if (view.hubEvents){
		// build the list of bindings

		var infoList = listHubInfo(view.hubEvents);
		infoList.forEach(function(info){
			info.hub.sub(info.topics, info.labels, info.fun, opts);
		});
	}

	// TODO: need to allow closest binding.
});

_view.hook("willRemove", function(view){
	var ns = "view_" + view.id;
	var infoList = listHubInfo(view.hubEvents);
	infoList.forEach(function(info){
		info.hub.unsub(ns);
	});
});

function listHubInfo(hubEvents){
	var key, val, key2, hub, infoList = [];

	for (key in hubEvents){
		val = hubEvents[key];
		if (typeof val === "function"){
			infoList.push(getHubInfo(key, null, val));
		}else{
			key2;
			hub = _hub.hub(key);
			for (key2 in val){
				infoList.push(getHubInfo(key2, hub, val[key2]));
			}
		}			
	}
	return infoList;
}

// returns {hub, topics, labels}
// hub is optional, if not present, assume the name will be the first item will be in the str
function getHubInfo(str, hub, fun){
	var a = utils.splitAndTrim(str,";");
	// if no hub, then, assume it is in the str
	var topicIdx = (hub)?0:1;
	var info = {
		topics: a[topicIdx],
		fun: fun
	};
	if (a.length > topicIdx + 1){
		info.labels = a[topicIdx + 1];
	}
	info.hub = (!hub)?_hub.hub(a[0]):hub;
	return info;
}

// TODO: need to unbind on "willDestroy"

// --------- /Events Hook --------- //
},{"./hub.js":11,"./utils.js":13,"./view.js":16}],16:[function(require,module,exports){
var utils = require("./utils.js");
var dom = require("./dom.js");

module.exports = {
	hook: hook,
	register: register,
	display: display, 
	remove: remove, 
	empty: empty
};

var viewDefDic = {};

var viewIdSeq = 0;

var hooks = {
	willCreate: [],
	didCreate: [],
	willInit: [],
	didInit: [],
	willDisplay: [],
	didDisplay: [],
	willPostDisplay: [],
	didPostDisplay: [], 
	willRemove: [],
	didRemove: []
};

var defaultConfig = {
	append: "last"
};

// --------- Public APIs --------- //
function hook(name, fun){
	hooks[name].push(fun);
}

function register(name, controller, config){
	var viewDef = {
		name: name,
		controller: controller,
		config: config
	}; 

	viewDefDic[name] = viewDef;
}

function display(name, parentEl, data, config){
	var self = this;

	var view = doInstantiate(name, config);
	
	return doCreate(view, data)
	.then(function(){
		return doInit(view, data);
	})
	.then(function(){
		return doDisplay.call(self, view, parentEl, data);
	})
	.then(function(){
		return doPostDisplay(view, data);
	});

}

function empty(els){
	utils.asArray(els).forEach(function(el){
		removeEl(el, true); // true to say childrenOnly
	});
}

function remove(els){
	utils.asArray(els).forEach(function(el){
		removeEl(el);
	});
}
// --------- /Public APIs --------- //

// will remove a el or its children
function removeEl(el, childrenOnly){
	childrenOnly = (childrenOnly === true) ;

	//// First we remove/destory the sub views
	var childrenViewEls = utils.asArray(dom.all(el, ".d-view"));

	// Reverse it to remove/destroy from the leaf
	var viewEls = childrenViewEls.reverse();

	// call doRemove on each view to have the lifecycle performed (willRemove/didRemove, .destroy)
	viewEls.forEach(function(viewEl){
		if (viewEl._view){
			doRemove(viewEl._view);	
		}else{
			// we should not be here, but somehow it happens in some app code (loggin warnning)
			console.log("MVDOM - WARNING - the following dom element should have a ._view property but it is not? (safe ignore)", viewEl);
			// NOTE: we do not need to remove the dom element as it will be taken care by the logic below (avoiding uncessary dom remove)
		}
		
	});

	// if it is removing only the children, then, let's make sure that all direct children elements are removed
	// (as the logic above only remove the viewEl)
	if (childrenOnly){
		// Then, we can remove all of the d.
		while (el.lastChild) {
			el.removeChild(el.lastChild);
		}
	}else{
		// if it is a view, we remove the viewwith doRemove
		if (el._view){
			doRemove(el._view);
		}else{
			if (el.parentNode){
				el.parentNode.removeChild(el);	
			}			
		}
	}

}



// return the "view" instance
// TODO: need to be async as well and allowed for loading component if not exist
function doInstantiate(name, config){

	// if the config is a string, then assume it is the append directive.
	if (typeof config === "string"){
		config = {append: config};
	}


	// get the view def from the dictionary
	var viewDef = viewDefDic[name];

	// if viewDef not found, throw an exception (Probably not registered)
	if (!viewDef){
		throw new Error("mvdom ERROR - View definition for '" + name + "' not found. Make sure to call d.register(viewName, viewController).");
	}

	// instantiate the view instance
	var view = Object.assign({}, viewDef.controller);

	// set the config
	view.config = Object.assign({}, defaultConfig, viewDef.config, config);

	// set the id
	view.id = viewIdSeq++;

	// set the name
	view.name = name;

	return view;
}

// return a promise that resolve with nothing.
function doCreate(view, data){
	performHook("willCreate", view);

	// Call the view.create
	var p = Promise.resolve(view.create(data));

	return p.then(function(html_or_node){

		var node = (typeof html_or_node === "string")?dom.frag(html_or_node):html_or_node;

		// If we have a fragument
		if (node.nodeType === 11){
			if (node.childNodes.length > 1){
				console.log("mvdom - WARNING - view HTML for view", view, "has multiple childNodes, but should have only one. Fallback by taking the first one, but check code.");
			}
			node = node.firstChild;
		}

		// make sure that the node is of time Element
		if (node.nodeType !== 1){
			throw new Error("el for view " + view.name + " is node of type Element. " + node);
		}

		var viewEl = node;

		// set the view.el and view.el._view
		view.el = viewEl;
		view.el.classList.add("d-view");
		view.el._view = view; 

		performHook("didCreate", view);	
	});
}

function doInit(view, data){
	performHook("willInit", view);
	var res;

	if (view.init){
		res = view.init(data);
	}
	return Promise.resolve(res).then(function(){
		performHook("didInit", view);	
	});
}

function doDisplay(view, refEl, data){
	performHook("willDisplay", view);

	try{		
		// WORKAROUND: this needs tobe the mvdom, since we have cyclic reference between dom.js and view.js (on empty)
		dom.append.call(this, refEl, view.el, view.config.append);
	}catch(ex){
		throw new Error("mvdom ERROR - Cannot add view.el " + view.el + " to refEl " + refEl + ". Cause: " + ex.toString());
	}

	performHook("didDisplay", view);

	return new Promise(function(resolve, fail){
		setTimeout(function(){
			resolve();
		},0);
	});
}

function doPostDisplay(view, data){
	performHook("willPostDisplay", view);

	var result;
	if (view.postDisplay){
		result = view.postDisplay(data);
	}

	return Promise.resolve(result).then(function(){
		return view;
	});

}

function doRemove(view){
	// Note: on willRemove all of the events bound to documents, window, parentElements, hubs will be unbind.
	performHook("willRemove", view);

	// remove it from the DOM
	// NOTE: this means that the detach won't remove the node from the DOM
	//       which avoid removing uncessary node, but means that didDetach will
	//       still have a view.el in the DOM
	var parentEl;
	if (view.el && view.el.parentNode){
		parentEl = view.el.parentNode;
		view.el.parentNode.removeChild(view.el);
	}	

	// we call 
	if (view.destroy){
		view.destroy({parentEl:parentEl});
	}
	
	performHook("didRemove", view);
}


function performHook(name, view){
	var hookFuns = hooks[name];
	var i= 0 , l = hookFuns.length, fun;
	for (; i < l; i++){
		fun = hookFuns[i];
		fun(view);
	}
}



},{"./dom.js":8,"./utils.js":13}],17:[function(require,module,exports){
// minimal library entry point.
"use strict";
module.exports = require("./src/index-minimal");

},{"./src/index-minimal":18}],18:[function(require,module,exports){
"use strict";
var protobuf = exports;

/**
 * Build type, one of `"full"`, `"light"` or `"minimal"`.
 * @name build
 * @type {string}
 * @const
 */
protobuf.build = "minimal";

// Serialization
protobuf.Writer       = require("./writer");
protobuf.BufferWriter = require("./writer_buffer");
protobuf.Reader       = require("./reader");
protobuf.BufferReader = require("./reader_buffer");

// Utility
protobuf.util         = require("./util/minimal");
protobuf.rpc          = require("./rpc");
protobuf.roots        = require("./roots");
protobuf.configure    = configure;

/* istanbul ignore next */
/**
 * Reconfigures the library according to the environment.
 * @returns {undefined}
 */
function configure() {
    protobuf.Reader._configure(protobuf.BufferReader);
    protobuf.util._configure();
}

// Configure serialization
protobuf.Writer._configure(protobuf.BufferWriter);
configure();

},{"./reader":19,"./reader_buffer":20,"./roots":21,"./rpc":22,"./util/minimal":25,"./writer":26,"./writer_buffer":27}],19:[function(require,module,exports){
"use strict";
module.exports = Reader;

var util      = require("./util/minimal");

var BufferReader; // cyclic

var LongBits  = util.LongBits,
    utf8      = util.utf8;

/* istanbul ignore next */
function indexOutOfRange(reader, writeLength) {
    return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
}

/**
 * Constructs a new reader instance using the specified buffer.
 * @classdesc Wire format reader using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 * @param {Uint8Array} buffer Buffer to read from
 */
function Reader(buffer) {

    /**
     * Read buffer.
     * @type {Uint8Array}
     */
    this.buf = buffer;

    /**
     * Read buffer position.
     * @type {number}
     */
    this.pos = 0;

    /**
     * Read buffer length.
     * @type {number}
     */
    this.len = buffer.length;
}

var create_array = typeof Uint8Array !== "undefined"
    ? function create_typed_array(buffer) {
        if (buffer instanceof Uint8Array || Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    }
    /* istanbul ignore next */
    : function create_array(buffer) {
        if (Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    };

/**
 * Creates a new reader using the specified buffer.
 * @function
 * @param {Uint8Array|Buffer} buffer Buffer to read from
 * @returns {Reader|BufferReader} A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
 * @throws {Error} If `buffer` is not a valid buffer
 */
Reader.create = util.Buffer
    ? function create_buffer_setup(buffer) {
        return (Reader.create = function create_buffer(buffer) {
            return util.Buffer.isBuffer(buffer)
                ? new BufferReader(buffer)
                /* istanbul ignore next */
                : create_array(buffer);
        })(buffer);
    }
    /* istanbul ignore next */
    : create_array;

Reader.prototype._slice = util.Array.prototype.subarray || /* istanbul ignore next */ util.Array.prototype.slice;

/**
 * Reads a varint as an unsigned 32 bit value.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.uint32 = (function read_uint32_setup() {
    var value = 4294967295; // optimizer type-hint, tends to deopt otherwise (?!)
    return function read_uint32() {
        value = (         this.buf[this.pos] & 127       ) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) <<  7) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 14) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 21) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] &  15) << 28) >>> 0; if (this.buf[this.pos++] < 128) return value;

        /* istanbul ignore if */
        if ((this.pos += 5) > this.len) {
            this.pos = this.len;
            throw indexOutOfRange(this, 10);
        }
        return value;
    };
})();

/**
 * Reads a varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.int32 = function read_int32() {
    return this.uint32() | 0;
};

/**
 * Reads a zig-zag encoded varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.sint32 = function read_sint32() {
    var value = this.uint32();
    return value >>> 1 ^ -(value & 1) | 0;
};

/* eslint-disable no-invalid-this */

function readLongVarint() {
    // tends to deopt with local vars for octet etc.
    var bits = new LongBits(0, 0);
    var i = 0;
    if (this.len - this.pos > 4) { // fast route (lo)
        for (; i < 4; ++i) {
            // 1st..4th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 5th
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >>  4) >>> 0;
        if (this.buf[this.pos++] < 128)
            return bits;
        i = 0;
    } else {
        for (; i < 3; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 1st..3th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 4th
        bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
        return bits;
    }
    if (this.len - this.pos > 4) { // fast route (hi)
        for (; i < 5; ++i) {
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    } else {
        for (; i < 5; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    }
    /* istanbul ignore next */
    throw Error("invalid varint encoding");
}

/* eslint-enable no-invalid-this */

/**
 * Reads a varint as a signed 64 bit value.
 * @name Reader#int64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as an unsigned 64 bit value.
 * @name Reader#uint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a zig-zag encoded varint as a signed 64 bit value.
 * @name Reader#sint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as a boolean.
 * @returns {boolean} Value read
 */
Reader.prototype.bool = function read_bool() {
    return this.uint32() !== 0;
};

function readFixed32_end(buf, end) { // note that this uses `end`, not `pos`
    return (buf[end - 4]
          | buf[end - 3] << 8
          | buf[end - 2] << 16
          | buf[end - 1] << 24) >>> 0;
}

/**
 * Reads fixed 32 bits as an unsigned 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.fixed32 = function read_fixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4);
};

/**
 * Reads fixed 32 bits as a signed 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.sfixed32 = function read_sfixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4) | 0;
};

/* eslint-disable no-invalid-this */

function readFixed64(/* this: Reader */) {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 8);

    return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
}

/* eslint-enable no-invalid-this */

/**
 * Reads fixed 64 bits.
 * @name Reader#fixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads zig-zag encoded fixed 64 bits.
 * @name Reader#sfixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a float (32 bit) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.float = function read_float() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    var value = util.float.readFloatLE(this.buf, this.pos);
    this.pos += 4;
    return value;
};

/**
 * Reads a double (64 bit float) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.double = function read_double() {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 4);

    var value = util.float.readDoubleLE(this.buf, this.pos);
    this.pos += 8;
    return value;
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @returns {Uint8Array} Value read
 */
Reader.prototype.bytes = function read_bytes() {
    var length = this.uint32(),
        start  = this.pos,
        end    = this.pos + length;

    /* istanbul ignore if */
    if (end > this.len)
        throw indexOutOfRange(this, length);

    this.pos += length;
    if (Array.isArray(this.buf)) // plain array
        return this.buf.slice(start, end);
    return start === end // fix for IE 10/Win8 and others' subarray returning array of size 1
        ? new this.buf.constructor(0)
        : this._slice.call(this.buf, start, end);
};

/**
 * Reads a string preceeded by its byte length as a varint.
 * @returns {string} Value read
 */
Reader.prototype.string = function read_string() {
    var bytes = this.bytes();
    return utf8.read(bytes, 0, bytes.length);
};

/**
 * Skips the specified number of bytes if specified, otherwise skips a varint.
 * @param {number} [length] Length if known, otherwise a varint is assumed
 * @returns {Reader} `this`
 */
Reader.prototype.skip = function skip(length) {
    if (typeof length === "number") {
        /* istanbul ignore if */
        if (this.pos + length > this.len)
            throw indexOutOfRange(this, length);
        this.pos += length;
    } else {
        do {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
        } while (this.buf[this.pos++] & 128);
    }
    return this;
};

/**
 * Skips the next element of the specified wire type.
 * @param {number} wireType Wire type received
 * @returns {Reader} `this`
 */
Reader.prototype.skipType = function(wireType) {
    switch (wireType) {
        case 0:
            this.skip();
            break;
        case 1:
            this.skip(8);
            break;
        case 2:
            this.skip(this.uint32());
            break;
        case 3:
            do { // eslint-disable-line no-constant-condition
                if ((wireType = this.uint32() & 7) === 4)
                    break;
                this.skipType(wireType);
            } while (true);
            break;
        case 5:
            this.skip(4);
            break;

        /* istanbul ignore next */
        default:
            throw Error("invalid wire type " + wireType + " at offset " + this.pos);
    }
    return this;
};

Reader._configure = function(BufferReader_) {
    BufferReader = BufferReader_;

    var fn = util.Long ? "toLong" : /* istanbul ignore next */ "toNumber";
    util.merge(Reader.prototype, {

        int64: function read_int64() {
            return readLongVarint.call(this)[fn](false);
        },

        uint64: function read_uint64() {
            return readLongVarint.call(this)[fn](true);
        },

        sint64: function read_sint64() {
            return readLongVarint.call(this).zzDecode()[fn](false);
        },

        fixed64: function read_fixed64() {
            return readFixed64.call(this)[fn](true);
        },

        sfixed64: function read_sfixed64() {
            return readFixed64.call(this)[fn](false);
        }

    });
};

},{"./util/minimal":25}],20:[function(require,module,exports){
"use strict";
module.exports = BufferReader;

// extends Reader
var Reader = require("./reader");
(BufferReader.prototype = Object.create(Reader.prototype)).constructor = BufferReader;

var util = require("./util/minimal");

/**
 * Constructs a new buffer reader instance.
 * @classdesc Wire format reader using node buffers.
 * @extends Reader
 * @constructor
 * @param {Buffer} buffer Buffer to read from
 */
function BufferReader(buffer) {
    Reader.call(this, buffer);

    /**
     * Read buffer.
     * @name BufferReader#buf
     * @type {Buffer}
     */
}

/* istanbul ignore else */
if (util.Buffer)
    BufferReader.prototype._slice = util.Buffer.prototype.slice;

/**
 * @override
 */
BufferReader.prototype.string = function read_string_buffer() {
    var len = this.uint32(); // modifies pos
    return this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len));
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @name BufferReader#bytes
 * @function
 * @returns {Buffer} Value read
 */

},{"./reader":19,"./util/minimal":25}],21:[function(require,module,exports){
"use strict";
module.exports = {};

/**
 * Named roots.
 * This is where pbjs stores generated structures (the option `-r, --root` specifies a name).
 * Can also be used manually to make roots available accross modules.
 * @name roots
 * @type {Object.<string,Root>}
 * @example
 * // pbjs -r myroot -o compiled.js ...
 *
 * // in another module:
 * require("./compiled.js");
 *
 * // in any subsequent module:
 * var root = protobuf.roots["myroot"];
 */

},{}],22:[function(require,module,exports){
"use strict";

/**
 * Streaming RPC helpers.
 * @namespace
 */
var rpc = exports;

/**
 * RPC implementation passed to {@link Service#create} performing a service request on network level, i.e. by utilizing http requests or websockets.
 * @typedef RPCImpl
 * @type {function}
 * @param {Method|rpc.ServiceMethod<Message<{}>,Message<{}>>} method Reflected or static method being called
 * @param {Uint8Array} requestData Request data
 * @param {RPCImplCallback} callback Callback function
 * @returns {undefined}
 * @example
 * function rpcImpl(method, requestData, callback) {
 *     if (protobuf.util.lcFirst(method.name) !== "myMethod") // compatible with static code
 *         throw Error("no such method");
 *     asynchronouslyObtainAResponse(requestData, function(err, responseData) {
 *         callback(err, responseData);
 *     });
 * }
 */

/**
 * Node-style callback as used by {@link RPCImpl}.
 * @typedef RPCImplCallback
 * @type {function}
 * @param {Error|null} error Error, if any, otherwise `null`
 * @param {Uint8Array|null} [response] Response data or `null` to signal end of stream, if there hasn't been an error
 * @returns {undefined}
 */

rpc.Service = require("./rpc/service");

},{"./rpc/service":23}],23:[function(require,module,exports){
"use strict";
module.exports = Service;

var util = require("../util/minimal");

// Extends EventEmitter
(Service.prototype = Object.create(util.EventEmitter.prototype)).constructor = Service;

/**
 * A service method callback as used by {@link rpc.ServiceMethod|ServiceMethod}.
 *
 * Differs from {@link RPCImplCallback} in that it is an actual callback of a service method which may not return `response = null`.
 * @typedef rpc.ServiceMethodCallback
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {TRes} [response] Response message
 * @returns {undefined}
 */

/**
 * A service method part of a {@link rpc.Service} as created by {@link Service.create}.
 * @typedef rpc.ServiceMethod
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} [callback] Node-style callback called with the error, if any, and the response message
 * @returns {Promise<Message<TRes>>} Promise if `callback` has been omitted, otherwise `undefined`
 */

/**
 * Constructs a new RPC service instance.
 * @classdesc An RPC service as returned by {@link Service#create}.
 * @exports rpc.Service
 * @extends util.EventEmitter
 * @constructor
 * @param {RPCImpl} rpcImpl RPC implementation
 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
 */
function Service(rpcImpl, requestDelimited, responseDelimited) {

    if (typeof rpcImpl !== "function")
        throw TypeError("rpcImpl must be a function");

    util.EventEmitter.call(this);

    /**
     * RPC implementation. Becomes `null` once the service is ended.
     * @type {RPCImpl|null}
     */
    this.rpcImpl = rpcImpl;

    /**
     * Whether requests are length-delimited.
     * @type {boolean}
     */
    this.requestDelimited = Boolean(requestDelimited);

    /**
     * Whether responses are length-delimited.
     * @type {boolean}
     */
    this.responseDelimited = Boolean(responseDelimited);
}

/**
 * Calls a service method through {@link rpc.Service#rpcImpl|rpcImpl}.
 * @param {Method|rpc.ServiceMethod<TReq,TRes>} method Reflected or static method
 * @param {Constructor<TReq>} requestCtor Request constructor
 * @param {Constructor<TRes>} responseCtor Response constructor
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} callback Service callback
 * @returns {undefined}
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 */
Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {

    if (!request)
        throw TypeError("request must be specified");

    var self = this;
    if (!callback)
        return util.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);

    if (!self.rpcImpl) {
        setTimeout(function() { callback(Error("already ended")); }, 0);
        return undefined;
    }

    try {
        return self.rpcImpl(
            method,
            requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
            function rpcCallback(err, response) {

                if (err) {
                    self.emit("error", err, method);
                    return callback(err);
                }

                if (response === null) {
                    self.end(/* endedByRPC */ true);
                    return undefined;
                }

                if (!(response instanceof responseCtor)) {
                    try {
                        response = responseCtor[self.responseDelimited ? "decodeDelimited" : "decode"](response);
                    } catch (err) {
                        self.emit("error", err, method);
                        return callback(err);
                    }
                }

                self.emit("data", response, method);
                return callback(null, response);
            }
        );
    } catch (err) {
        self.emit("error", err, method);
        setTimeout(function() { callback(err); }, 0);
        return undefined;
    }
};

/**
 * Ends this service and emits the `end` event.
 * @param {boolean} [endedByRPC=false] Whether the service has been ended by the RPC implementation.
 * @returns {rpc.Service} `this`
 */
Service.prototype.end = function end(endedByRPC) {
    if (this.rpcImpl) {
        if (!endedByRPC) // signal end to rpcImpl
            this.rpcImpl(null, null, null);
        this.rpcImpl = null;
        this.emit("end").off();
    }
    return this;
};

},{"../util/minimal":25}],24:[function(require,module,exports){
"use strict";
module.exports = LongBits;

var util = require("../util/minimal");

/**
 * Constructs new long bits.
 * @classdesc Helper class for working with the low and high bits of a 64 bit value.
 * @memberof util
 * @constructor
 * @param {number} lo Low 32 bits, unsigned
 * @param {number} hi High 32 bits, unsigned
 */
function LongBits(lo, hi) {

    // note that the casts below are theoretically unnecessary as of today, but older statically
    // generated converter code might still call the ctor with signed 32bits. kept for compat.

    /**
     * Low bits.
     * @type {number}
     */
    this.lo = lo >>> 0;

    /**
     * High bits.
     * @type {number}
     */
    this.hi = hi >>> 0;
}

/**
 * Zero bits.
 * @memberof util.LongBits
 * @type {util.LongBits}
 */
var zero = LongBits.zero = new LongBits(0, 0);

zero.toNumber = function() { return 0; };
zero.zzEncode = zero.zzDecode = function() { return this; };
zero.length = function() { return 1; };

/**
 * Zero hash.
 * @memberof util.LongBits
 * @type {string}
 */
var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";

/**
 * Constructs new long bits from the specified number.
 * @param {number} value Value
 * @returns {util.LongBits} Instance
 */
LongBits.fromNumber = function fromNumber(value) {
    if (value === 0)
        return zero;
    var sign = value < 0;
    if (sign)
        value = -value;
    var lo = value >>> 0,
        hi = (value - lo) / 4294967296 >>> 0;
    if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
            lo = 0;
            if (++hi > 4294967295)
                hi = 0;
        }
    }
    return new LongBits(lo, hi);
};

/**
 * Constructs new long bits from a number, long or string.
 * @param {Long|number|string} value Value
 * @returns {util.LongBits} Instance
 */
LongBits.from = function from(value) {
    if (typeof value === "number")
        return LongBits.fromNumber(value);
    if (util.isString(value)) {
        /* istanbul ignore else */
        if (util.Long)
            value = util.Long.fromString(value);
        else
            return LongBits.fromNumber(parseInt(value, 10));
    }
    return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
};

/**
 * Converts this long bits to a possibly unsafe JavaScript number.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {number} Possibly unsafe number
 */
LongBits.prototype.toNumber = function toNumber(unsigned) {
    if (!unsigned && this.hi >>> 31) {
        var lo = ~this.lo + 1 >>> 0,
            hi = ~this.hi     >>> 0;
        if (!lo)
            hi = hi + 1 >>> 0;
        return -(lo + hi * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
};

/**
 * Converts this long bits to a long.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long} Long
 */
LongBits.prototype.toLong = function toLong(unsigned) {
    return util.Long
        ? new util.Long(this.lo | 0, this.hi | 0, Boolean(unsigned))
        /* istanbul ignore next */
        : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
};

var charCodeAt = String.prototype.charCodeAt;

/**
 * Constructs new long bits from the specified 8 characters long hash.
 * @param {string} hash Hash
 * @returns {util.LongBits} Bits
 */
LongBits.fromHash = function fromHash(hash) {
    if (hash === zeroHash)
        return zero;
    return new LongBits(
        ( charCodeAt.call(hash, 0)
        | charCodeAt.call(hash, 1) << 8
        | charCodeAt.call(hash, 2) << 16
        | charCodeAt.call(hash, 3) << 24) >>> 0
    ,
        ( charCodeAt.call(hash, 4)
        | charCodeAt.call(hash, 5) << 8
        | charCodeAt.call(hash, 6) << 16
        | charCodeAt.call(hash, 7) << 24) >>> 0
    );
};

/**
 * Converts this long bits to a 8 characters long hash.
 * @returns {string} Hash
 */
LongBits.prototype.toHash = function toHash() {
    return String.fromCharCode(
        this.lo        & 255,
        this.lo >>> 8  & 255,
        this.lo >>> 16 & 255,
        this.lo >>> 24      ,
        this.hi        & 255,
        this.hi >>> 8  & 255,
        this.hi >>> 16 & 255,
        this.hi >>> 24
    );
};

/**
 * Zig-zag encodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits.prototype.zzEncode = function zzEncode() {
    var mask =   this.hi >> 31;
    this.hi  = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
    this.lo  = ( this.lo << 1                   ^ mask) >>> 0;
    return this;
};

/**
 * Zig-zag decodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits.prototype.zzDecode = function zzDecode() {
    var mask = -(this.lo & 1);
    this.lo  = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
    this.hi  = ( this.hi >>> 1                  ^ mask) >>> 0;
    return this;
};

/**
 * Calculates the length of this longbits when encoded as a varint.
 * @returns {number} Length
 */
LongBits.prototype.length = function length() {
    var part0 =  this.lo,
        part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
        part2 =  this.hi >>> 24;
    return part2 === 0
         ? part1 === 0
           ? part0 < 16384
             ? part0 < 128 ? 1 : 2
             : part0 < 2097152 ? 3 : 4
           : part1 < 16384
             ? part1 < 128 ? 5 : 6
             : part1 < 2097152 ? 7 : 8
         : part2 < 128 ? 9 : 10;
};

},{"../util/minimal":25}],25:[function(require,module,exports){
(function (global){
"use strict";
var util = exports;

// used to return a Promise where callback is omitted
util.asPromise = require("@protobufjs/aspromise");

// converts to / from base64 encoded strings
util.base64 = require("@protobufjs/base64");

// base class of rpc.Service
util.EventEmitter = require("@protobufjs/eventemitter");

// float handling accross browsers
util.float = require("@protobufjs/float");

// requires modules optionally and hides the call from bundlers
util.inquire = require("@protobufjs/inquire");

// converts to / from utf8 encoded strings
util.utf8 = require("@protobufjs/utf8");

// provides a node-like buffer pool in the browser
util.pool = require("@protobufjs/pool");

// utility to work with the low and high bits of a 64 bit value
util.LongBits = require("./longbits");

/**
 * An immuable empty array.
 * @memberof util
 * @type {Array.<*>}
 * @const
 */
util.emptyArray = Object.freeze ? Object.freeze([]) : /* istanbul ignore next */ []; // used on prototypes

/**
 * An immutable empty object.
 * @type {Object}
 * @const
 */
util.emptyObject = Object.freeze ? Object.freeze({}) : /* istanbul ignore next */ {}; // used on prototypes

/**
 * Whether running within node or not.
 * @memberof util
 * @type {boolean}
 * @const
 */
util.isNode = Boolean(global.process && global.process.versions && global.process.versions.node);

/**
 * Tests if the specified value is an integer.
 * @function
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is an integer
 */
util.isInteger = Number.isInteger || /* istanbul ignore next */ function isInteger(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};

/**
 * Tests if the specified value is a string.
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is a string
 */
util.isString = function isString(value) {
    return typeof value === "string" || value instanceof String;
};

/**
 * Tests if the specified value is a non-null object.
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is a non-null object
 */
util.isObject = function isObject(value) {
    return value && typeof value === "object";
};

/**
 * Checks if a property on a message is considered to be present.
 * This is an alias of {@link util.isSet}.
 * @function
 * @param {Object} obj Plain object or message instance
 * @param {string} prop Property name
 * @returns {boolean} `true` if considered to be present, otherwise `false`
 */
util.isset =

/**
 * Checks if a property on a message is considered to be present.
 * @param {Object} obj Plain object or message instance
 * @param {string} prop Property name
 * @returns {boolean} `true` if considered to be present, otherwise `false`
 */
util.isSet = function isSet(obj, prop) {
    var value = obj[prop];
    if (value != null && obj.hasOwnProperty(prop)) // eslint-disable-line eqeqeq, no-prototype-builtins
        return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
    return false;
};

/**
 * Any compatible Buffer instance.
 * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
 * @interface Buffer
 * @extends Uint8Array
 */

/**
 * Node's Buffer class if available.
 * @type {Constructor<Buffer>}
 */
util.Buffer = (function() {
    try {
        var Buffer = util.inquire("buffer").Buffer;
        // refuse to use non-node buffers if not explicitly assigned (perf reasons):
        return Buffer.prototype.utf8Write ? Buffer : /* istanbul ignore next */ null;
    } catch (e) {
        /* istanbul ignore next */
        return null;
    }
})();

// Internal alias of or polyfull for Buffer.from.
util._Buffer_from = null;

// Internal alias of or polyfill for Buffer.allocUnsafe.
util._Buffer_allocUnsafe = null;

/**
 * Creates a new buffer of whatever type supported by the environment.
 * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
 * @returns {Uint8Array|Buffer} Buffer
 */
util.newBuffer = function newBuffer(sizeOrArray) {
    /* istanbul ignore next */
    return typeof sizeOrArray === "number"
        ? util.Buffer
            ? util._Buffer_allocUnsafe(sizeOrArray)
            : new util.Array(sizeOrArray)
        : util.Buffer
            ? util._Buffer_from(sizeOrArray)
            : typeof Uint8Array === "undefined"
                ? sizeOrArray
                : new Uint8Array(sizeOrArray);
};

/**
 * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
 * @type {Constructor<Uint8Array>}
 */
util.Array = typeof Uint8Array !== "undefined" ? Uint8Array /* istanbul ignore next */ : Array;

/**
 * Any compatible Long instance.
 * This is a minimal stand-alone definition of a Long instance. The actual type is that exported by long.js.
 * @interface Long
 * @property {number} low Low bits
 * @property {number} high High bits
 * @property {boolean} unsigned Whether unsigned or not
 */

/**
 * Long.js's Long class if available.
 * @type {Constructor<Long>}
 */
util.Long = /* istanbul ignore next */ global.dcodeIO && /* istanbul ignore next */ global.dcodeIO.Long || util.inquire("long");

/**
 * Regular expression used to verify 2 bit (`bool`) map keys.
 * @type {RegExp}
 * @const
 */
util.key2Re = /^true|false|0|1$/;

/**
 * Regular expression used to verify 32 bit (`int32` etc.) map keys.
 * @type {RegExp}
 * @const
 */
util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;

/**
 * Regular expression used to verify 64 bit (`int64` etc.) map keys.
 * @type {RegExp}
 * @const
 */
util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;

/**
 * Converts a number or long to an 8 characters long hash string.
 * @param {Long|number} value Value to convert
 * @returns {string} Hash
 */
util.longToHash = function longToHash(value) {
    return value
        ? util.LongBits.from(value).toHash()
        : util.LongBits.zeroHash;
};

/**
 * Converts an 8 characters long hash string to a long or number.
 * @param {string} hash Hash
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long|number} Original value
 */
util.longFromHash = function longFromHash(hash, unsigned) {
    var bits = util.LongBits.fromHash(hash);
    if (util.Long)
        return util.Long.fromBits(bits.lo, bits.hi, unsigned);
    return bits.toNumber(Boolean(unsigned));
};

/**
 * Merges the properties of the source object into the destination object.
 * @memberof util
 * @param {Object.<string,*>} dst Destination object
 * @param {Object.<string,*>} src Source object
 * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
 * @returns {Object.<string,*>} Destination object
 */
function merge(dst, src, ifNotSet) { // used by converters
    for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
        if (dst[keys[i]] === undefined || !ifNotSet)
            dst[keys[i]] = src[keys[i]];
    return dst;
}

util.merge = merge;

/**
 * Converts the first character of a string to lower case.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.lcFirst = function lcFirst(str) {
    return str.charAt(0).toLowerCase() + str.substring(1);
};

/**
 * Creates a custom error constructor.
 * @memberof util
 * @param {string} name Error name
 * @returns {Constructor<Error>} Custom error constructor
 */
function newError(name) {

    function CustomError(message, properties) {

        if (!(this instanceof CustomError))
            return new CustomError(message, properties);

        // Error.call(this, message);
        // ^ just returns a new error instance because the ctor can be called as a function

        Object.defineProperty(this, "message", { get: function() { return message; } });

        /* istanbul ignore next */
        if (Error.captureStackTrace) // node
            Error.captureStackTrace(this, CustomError);
        else
            Object.defineProperty(this, "stack", { value: (new Error()).stack || "" });

        if (properties)
            merge(this, properties);
    }

    (CustomError.prototype = Object.create(Error.prototype)).constructor = CustomError;

    Object.defineProperty(CustomError.prototype, "name", { get: function() { return name; } });

    CustomError.prototype.toString = function toString() {
        return this.name + ": " + this.message;
    };

    return CustomError;
}

util.newError = newError;

/**
 * Constructs a new protocol error.
 * @classdesc Error subclass indicating a protocol specifc error.
 * @memberof util
 * @extends Error
 * @template T extends Message<T>
 * @constructor
 * @param {string} message Error message
 * @param {Object.<string,*>} [properties] Additional properties
 * @example
 * try {
 *     MyMessage.decode(someBuffer); // throws if required fields are missing
 * } catch (e) {
 *     if (e instanceof ProtocolError && e.instance)
 *         console.log("decoded so far: " + JSON.stringify(e.instance));
 * }
 */
util.ProtocolError = newError("ProtocolError");

/**
 * So far decoded message instance.
 * @name util.ProtocolError#instance
 * @type {Message<T>}
 */

/**
 * A OneOf getter as returned by {@link util.oneOfGetter}.
 * @typedef OneOfGetter
 * @type {function}
 * @returns {string|undefined} Set field name, if any
 */

/**
 * Builds a getter for a oneof's present field name.
 * @param {string[]} fieldNames Field names
 * @returns {OneOfGetter} Unbound getter
 */
util.oneOfGetter = function getOneOf(fieldNames) {
    var fieldMap = {};
    for (var i = 0; i < fieldNames.length; ++i)
        fieldMap[fieldNames[i]] = 1;

    /**
     * @returns {string|undefined} Set field name, if any
     * @this Object
     * @ignore
     */
    return function() { // eslint-disable-line consistent-return
        for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i)
            if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined && this[keys[i]] !== null)
                return keys[i];
    };
};

/**
 * A OneOf setter as returned by {@link util.oneOfSetter}.
 * @typedef OneOfSetter
 * @type {function}
 * @param {string|undefined} value Field name
 * @returns {undefined}
 */

/**
 * Builds a setter for a oneof's present field name.
 * @param {string[]} fieldNames Field names
 * @returns {OneOfSetter} Unbound setter
 */
util.oneOfSetter = function setOneOf(fieldNames) {

    /**
     * @param {string} name Field name
     * @returns {undefined}
     * @this Object
     * @ignore
     */
    return function(name) {
        for (var i = 0; i < fieldNames.length; ++i)
            if (fieldNames[i] !== name)
                delete this[fieldNames[i]];
    };
};

/**
 * Default conversion options used for {@link Message#toJSON} implementations.
 *
 * These options are close to proto3's JSON mapping with the exception that internal types like Any are handled just like messages. More precisely:
 *
 * - Longs become strings
 * - Enums become string keys
 * - Bytes become base64 encoded strings
 * - (Sub-)Messages become plain objects
 * - Maps become plain objects with all string keys
 * - Repeated fields become arrays
 * - NaN and Infinity for float and double fields become strings
 *
 * @type {IConversionOptions}
 * @see https://developers.google.com/protocol-buffers/docs/proto3?hl=en#json
 */
util.toJSONOptions = {
    longs: String,
    enums: String,
    bytes: String,
    json: true
};

util._configure = function() {
    var Buffer = util.Buffer;
    /* istanbul ignore if */
    if (!Buffer) {
        util._Buffer_from = util._Buffer_allocUnsafe = null;
        return;
    }
    // because node 4.x buffers are incompatible & immutable
    // see: https://github.com/dcodeIO/protobuf.js/pull/665
    util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from ||
        /* istanbul ignore next */
        function Buffer_from(value, encoding) {
            return new Buffer(value, encoding);
        };
    util._Buffer_allocUnsafe = Buffer.allocUnsafe ||
        /* istanbul ignore next */
        function Buffer_allocUnsafe(size) {
            return new Buffer(size);
        };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./longbits":24,"@protobufjs/aspromise":1,"@protobufjs/base64":2,"@protobufjs/eventemitter":3,"@protobufjs/float":4,"@protobufjs/inquire":5,"@protobufjs/pool":6,"@protobufjs/utf8":7}],26:[function(require,module,exports){
"use strict";
module.exports = Writer;

var util      = require("./util/minimal");

var BufferWriter; // cyclic

var LongBits  = util.LongBits,
    base64    = util.base64,
    utf8      = util.utf8;

/**
 * Constructs a new writer operation instance.
 * @classdesc Scheduled writer operation.
 * @constructor
 * @param {function(*, Uint8Array, number)} fn Function to call
 * @param {number} len Value byte length
 * @param {*} val Value to write
 * @ignore
 */
function Op(fn, len, val) {

    /**
     * Function to call.
     * @type {function(Uint8Array, number, *)}
     */
    this.fn = fn;

    /**
     * Value byte length.
     * @type {number}
     */
    this.len = len;

    /**
     * Next operation.
     * @type {Writer.Op|undefined}
     */
    this.next = undefined;

    /**
     * Value to write.
     * @type {*}
     */
    this.val = val; // type varies
}

/* istanbul ignore next */
function noop() {} // eslint-disable-line no-empty-function

/**
 * Constructs a new writer state instance.
 * @classdesc Copied writer state.
 * @memberof Writer
 * @constructor
 * @param {Writer} writer Writer to copy state from
 * @ignore
 */
function State(writer) {

    /**
     * Current head.
     * @type {Writer.Op}
     */
    this.head = writer.head;

    /**
     * Current tail.
     * @type {Writer.Op}
     */
    this.tail = writer.tail;

    /**
     * Current buffer length.
     * @type {number}
     */
    this.len = writer.len;

    /**
     * Next state.
     * @type {State|null}
     */
    this.next = writer.states;
}

/**
 * Constructs a new writer instance.
 * @classdesc Wire format writer using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 */
function Writer() {

    /**
     * Current length.
     * @type {number}
     */
    this.len = 0;

    /**
     * Operations head.
     * @type {Object}
     */
    this.head = new Op(noop, 0, 0);

    /**
     * Operations tail
     * @type {Object}
     */
    this.tail = this.head;

    /**
     * Linked forked states.
     * @type {Object|null}
     */
    this.states = null;

    // When a value is written, the writer calculates its byte length and puts it into a linked
    // list of operations to perform when finish() is called. This both allows us to allocate
    // buffers of the exact required size and reduces the amount of work we have to do compared
    // to first calculating over objects and then encoding over objects. In our case, the encoding
    // part is just a linked list walk calling operations with already prepared values.
}

/**
 * Creates a new writer.
 * @function
 * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
 */
Writer.create = util.Buffer
    ? function create_buffer_setup() {
        return (Writer.create = function create_buffer() {
            return new BufferWriter();
        })();
    }
    /* istanbul ignore next */
    : function create_array() {
        return new Writer();
    };

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */
Writer.alloc = function alloc(size) {
    return new util.Array(size);
};

// Use Uint8Array buffer pool in the browser, just like node does with buffers
/* istanbul ignore else */
if (util.Array !== Array)
    Writer.alloc = util.pool(Writer.alloc, util.Array.prototype.subarray);

/**
 * Pushes a new operation to the queue.
 * @param {function(Uint8Array, number, *)} fn Function to call
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @returns {Writer} `this`
 * @private
 */
Writer.prototype._push = function push(fn, len, val) {
    this.tail = this.tail.next = new Op(fn, len, val);
    this.len += len;
    return this;
};

function writeByte(val, buf, pos) {
    buf[pos] = val & 255;
}

function writeVarint32(val, buf, pos) {
    while (val > 127) {
        buf[pos++] = val & 127 | 128;
        val >>>= 7;
    }
    buf[pos] = val;
}

/**
 * Constructs a new varint writer operation instance.
 * @classdesc Scheduled varint writer operation.
 * @extends Op
 * @constructor
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @ignore
 */
function VarintOp(len, val) {
    this.len = len;
    this.next = undefined;
    this.val = val;
}

VarintOp.prototype = Object.create(Op.prototype);
VarintOp.prototype.fn = writeVarint32;

/**
 * Writes an unsigned 32 bit value as a varint.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.uint32 = function write_uint32(value) {
    // here, the call to this.push has been inlined and a varint specific Op subclass is used.
    // uint32 is by far the most frequently used operation and benefits significantly from this.
    this.len += (this.tail = this.tail.next = new VarintOp(
        (value = value >>> 0)
                < 128       ? 1
        : value < 16384     ? 2
        : value < 2097152   ? 3
        : value < 268435456 ? 4
        :                     5,
    value)).len;
    return this;
};

/**
 * Writes a signed 32 bit value as a varint.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.int32 = function write_int32(value) {
    return value < 0
        ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) // 10 bytes per spec
        : this.uint32(value);
};

/**
 * Writes a 32 bit value as a varint, zig-zag encoded.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sint32 = function write_sint32(value) {
    return this.uint32((value << 1 ^ value >> 31) >>> 0);
};

function writeVarint64(val, buf, pos) {
    while (val.hi) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
        val.hi >>>= 7;
    }
    while (val.lo > 127) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = val.lo >>> 7;
    }
    buf[pos++] = val.lo;
}

/**
 * Writes an unsigned 64 bit value as a varint.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.uint64 = function write_uint64(value) {
    var bits = LongBits.from(value);
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a signed 64 bit value as a varint.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.int64 = Writer.prototype.uint64;

/**
 * Writes a signed 64 bit value as a varint, zig-zag encoded.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sint64 = function write_sint64(value) {
    var bits = LongBits.from(value).zzEncode();
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a boolish value as a varint.
 * @param {boolean} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.bool = function write_bool(value) {
    return this._push(writeByte, 1, value ? 1 : 0);
};

function writeFixed32(val, buf, pos) {
    buf[pos    ] =  val         & 255;
    buf[pos + 1] =  val >>> 8   & 255;
    buf[pos + 2] =  val >>> 16  & 255;
    buf[pos + 3] =  val >>> 24;
}

/**
 * Writes an unsigned 32 bit value as fixed 32 bits.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.fixed32 = function write_fixed32(value) {
    return this._push(writeFixed32, 4, value >>> 0);
};

/**
 * Writes a signed 32 bit value as fixed 32 bits.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sfixed32 = Writer.prototype.fixed32;

/**
 * Writes an unsigned 64 bit value as fixed 64 bits.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.fixed64 = function write_fixed64(value) {
    var bits = LongBits.from(value);
    return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
};

/**
 * Writes a signed 64 bit value as fixed 64 bits.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sfixed64 = Writer.prototype.fixed64;

/**
 * Writes a float (32 bit).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.float = function write_float(value) {
    return this._push(util.float.writeFloatLE, 4, value);
};

/**
 * Writes a double (64 bit float).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.double = function write_double(value) {
    return this._push(util.float.writeDoubleLE, 8, value);
};

var writeBytes = util.Array.prototype.set
    ? function writeBytes_set(val, buf, pos) {
        buf.set(val, pos); // also works for plain array values
    }
    /* istanbul ignore next */
    : function writeBytes_for(val, buf, pos) {
        for (var i = 0; i < val.length; ++i)
            buf[pos + i] = val[i];
    };

/**
 * Writes a sequence of bytes.
 * @param {Uint8Array|string} value Buffer or base64 encoded string to write
 * @returns {Writer} `this`
 */
Writer.prototype.bytes = function write_bytes(value) {
    var len = value.length >>> 0;
    if (!len)
        return this._push(writeByte, 1, 0);
    if (util.isString(value)) {
        var buf = Writer.alloc(len = base64.length(value));
        base64.decode(value, buf, 0);
        value = buf;
    }
    return this.uint32(len)._push(writeBytes, len, value);
};

/**
 * Writes a string.
 * @param {string} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.string = function write_string(value) {
    var len = utf8.length(value);
    return len
        ? this.uint32(len)._push(utf8.write, len, value)
        : this._push(writeByte, 1, 0);
};

/**
 * Forks this writer's state by pushing it to a stack.
 * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
 * @returns {Writer} `this`
 */
Writer.prototype.fork = function fork() {
    this.states = new State(this);
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
    return this;
};

/**
 * Resets this instance to the last state.
 * @returns {Writer} `this`
 */
Writer.prototype.reset = function reset() {
    if (this.states) {
        this.head   = this.states.head;
        this.tail   = this.states.tail;
        this.len    = this.states.len;
        this.states = this.states.next;
    } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len  = 0;
    }
    return this;
};

/**
 * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
 * @returns {Writer} `this`
 */
Writer.prototype.ldelim = function ldelim() {
    var head = this.head,
        tail = this.tail,
        len  = this.len;
    this.reset().uint32(len);
    if (len) {
        this.tail.next = head.next; // skip noop
        this.tail = tail;
        this.len += len;
    }
    return this;
};

/**
 * Finishes the write operation.
 * @returns {Uint8Array} Finished buffer
 */
Writer.prototype.finish = function finish() {
    var head = this.head.next, // skip noop
        buf  = this.constructor.alloc(this.len),
        pos  = 0;
    while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
    }
    // this.head = this.tail = null;
    return buf;
};

Writer._configure = function(BufferWriter_) {
    BufferWriter = BufferWriter_;
};

},{"./util/minimal":25}],27:[function(require,module,exports){
"use strict";
module.exports = BufferWriter;

// extends Writer
var Writer = require("./writer");
(BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;

var util = require("./util/minimal");

var Buffer = util.Buffer;

/**
 * Constructs a new buffer writer instance.
 * @classdesc Wire format writer using node buffers.
 * @extends Writer
 * @constructor
 */
function BufferWriter() {
    Writer.call(this);
}

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Buffer} Buffer
 */
BufferWriter.alloc = function alloc_buffer(size) {
    return (BufferWriter.alloc = util._Buffer_allocUnsafe)(size);
};

var writeBytesBuffer = Buffer && Buffer.prototype instanceof Uint8Array && Buffer.prototype.set.name === "set"
    ? function writeBytesBuffer_set(val, buf, pos) {
        buf.set(val, pos); // faster than copy (requires node >= 4 where Buffers extend Uint8Array and set is properly inherited)
                           // also works for plain array values
    }
    /* istanbul ignore next */
    : function writeBytesBuffer_copy(val, buf, pos) {
        if (val.copy) // Buffer values
            val.copy(buf, pos, 0, val.length);
        else for (var i = 0; i < val.length;) // plain array values
            buf[pos++] = val[i++];
    };

/**
 * @override
 */
BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
    if (util.isString(value))
        value = util._Buffer_from(value, "base64");
    var len = value.length >>> 0;
    this.uint32(len);
    if (len)
        this._push(writeBytesBuffer, len, value);
    return this;
};

function writeStringBuffer(val, buf, pos) {
    if (val.length < 40) // plain js is faster for short strings (probably due to redundant assertions)
        util.utf8.write(val, buf, pos);
    else
        buf.utf8Write(val, pos);
}

/**
 * @override
 */
BufferWriter.prototype.string = function write_string_buffer(value) {
    var len = Buffer.byteLength(value);
    this.uint32(len);
    if (len)
        this._push(writeStringBuffer, len, value);
    return this;
};


/**
 * Finishes the write operation.
 * @name BufferWriter#finish
 * @function
 * @returns {Buffer} Finished buffer
 */

},{"./util/minimal":25,"./writer":26}],28:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var allproto_1 = require("../srcdeps/proto-gen-ts/allproto");
var MyLists_1 = require("./MyLists");
var Now_1 = require("./Now");
var Hello = (function () {
    function Hello() {
    }
    Hello.prototype.getShoppingList = function () {
        var shoppingList = allproto_1.list.List.create({ name: "shopping" });
        shoppingList.items.push(allproto_1.list.Item.create({ name: "coffee" }));
        shoppingList.items.push(allproto_1.list.Item.create({ name: "cat food" }));
        return shoppingList;
    };
    Hello.prototype.run = function () {
        console.log("hello world 10");
        new Now_1.Now().print();
        console.log(new MyLists_1.MyLists().getShoppingList());
    };
    return Hello;
}());
exports.Hello = Hello;

},{"../srcdeps/proto-gen-ts/allproto":31,"./MyLists":29,"./Now":30}],29:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var allproto_1 = require("../srcdeps/proto-gen-ts/allproto");
var MyLists = (function () {
    function MyLists() {
    }
    MyLists.prototype.getShoppingList = function () {
        var shoppingList = allproto_1.list.List.create({ name: "shopping" });
        shoppingList.items.push(allproto_1.list.Item.create({ name: "coffee" }));
        shoppingList.items.push(allproto_1.list.Item.create({ name: "cat food" }));
        return shoppingList;
    };
    return MyLists;
}());
exports.MyLists = MyLists;

},{"../srcdeps/proto-gen-ts/allproto":31}],30:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Now = (function () {
    function Now() {
    }
    Now.prototype.print = function () {
        console.log(new Date(), "something else 2");
    };
    return Now;
}());
exports.Now = Now;

},{}],31:[function(require,module,exports){
/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
"use strict";
var $protobuf = require("../protobufjs/minimal.js");
// Common aliases
var $util = $protobuf.util;
// Exported root namespace
var $root = $protobuf.roots["../srcdeps/proto-gen-ts/allproto"] || ($protobuf.roots["../srcdeps/proto-gen-ts/allproto"] = {});
$root.list = (function () {
    /**
     * Namespace list.
     * @exports list
     * @namespace
     */
    var list = {};
    list.Item = (function () {
        /**
         * Properties of an Item.
         * @memberof list
         * @interface IItem
         * @property {string} [name] Item name
         */
        /**
         * Constructs a new Item.
         * @memberof list
         * @classdesc Represents an Item.
         * @constructor
         * @param {list.IItem=} [properties] Properties to set
         */
        function Item(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        /**
         * Item name.
         * @member {string}name
         * @memberof list.Item
         * @instance
         */
        Item.prototype.name = "";
        /**
         * Creates a new Item instance using the specified properties.
         * @function create
         * @memberof list.Item
         * @static
         * @param {list.IItem=} [properties] Properties to set
         * @returns {list.Item} Item instance
         */
        Item.create = function create(properties) {
            return new Item(properties);
        };
        /**
         * Verifies an Item message.
         * @function verify
         * @memberof list.Item
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Item.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            return null;
        };
        /**
         * Creates an Item message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof list.Item
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {list.Item} Item
         */
        Item.fromObject = function fromObject(object) {
            if (object instanceof $root.list.Item)
                return object;
            var message = new $root.list.Item();
            if (object.name != null)
                message.name = String(object.name);
            return message;
        };
        /**
         * Creates a plain object from an Item message. Also converts values to other types if specified.
         * @function toObject
         * @memberof list.Item
         * @static
         * @param {list.Item} message Item
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Item.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.name = "";
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            return object;
        };
        /**
         * Converts this Item to JSON.
         * @function toJSON
         * @memberof list.Item
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Item.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        return Item;
    })();
    list.List = (function () {
        /**
         * Properties of a List.
         * @memberof list
         * @interface IList
         * @property {string} [name] List name
         * @property {Array.<list.IItem>} [items] List items
         */
        /**
         * Constructs a new List.
         * @memberof list
         * @classdesc Represents a List.
         * @constructor
         * @param {list.IList=} [properties] Properties to set
         */
        function List(properties) {
            this.items = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        /**
         * List name.
         * @member {string}name
         * @memberof list.List
         * @instance
         */
        List.prototype.name = "";
        /**
         * List items.
         * @member {Array.<list.IItem>}items
         * @memberof list.List
         * @instance
         */
        List.prototype.items = $util.emptyArray;
        /**
         * Creates a new List instance using the specified properties.
         * @function create
         * @memberof list.List
         * @static
         * @param {list.IList=} [properties] Properties to set
         * @returns {list.List} List instance
         */
        List.create = function create(properties) {
            return new List(properties);
        };
        /**
         * Verifies a List message.
         * @function verify
         * @memberof list.List
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        List.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.items != null && message.hasOwnProperty("items")) {
                if (!Array.isArray(message.items))
                    return "items: array expected";
                for (var i = 0; i < message.items.length; ++i) {
                    var error = $root.list.Item.verify(message.items[i]);
                    if (error)
                        return "items." + error;
                }
            }
            return null;
        };
        /**
         * Creates a List message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof list.List
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {list.List} List
         */
        List.fromObject = function fromObject(object) {
            if (object instanceof $root.list.List)
                return object;
            var message = new $root.list.List();
            if (object.name != null)
                message.name = String(object.name);
            if (object.items) {
                if (!Array.isArray(object.items))
                    throw TypeError(".list.List.items: array expected");
                message.items = [];
                for (var i = 0; i < object.items.length; ++i) {
                    if (typeof object.items[i] !== "object")
                        throw TypeError(".list.List.items: object expected");
                    message.items[i] = $root.list.Item.fromObject(object.items[i]);
                }
            }
            return message;
        };
        /**
         * Creates a plain object from a List message. Also converts values to other types if specified.
         * @function toObject
         * @memberof list.List
         * @static
         * @param {list.List} message List
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        List.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.items = [];
            if (options.defaults)
                object.name = "";
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.items && message.items.length) {
                object.items = [];
                for (var j = 0; j < message.items.length; ++j)
                    object.items[j] = $root.list.Item.toObject(message.items[j], options);
            }
            return object;
        };
        /**
         * Converts this List to JSON.
         * @function toJSON
         * @memberof list.List
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        List.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        return List;
    })();
    return list;
})();
module.exports = $root;

},{"../protobufjs/minimal.js":17}],32:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var MyLists_1 = require("../src/MyLists");
var Hello_1 = require("../src/Hello");
console.log("Init start");
// Random hello-world type stuff. Check the browser console.
new Hello_1.Hello().run();
var d = require("../uideps/mvdom");
document.addEventListener("DOMContentLoaded", function () {
    d.display("ShoppingView", d.first("#shopping"), new MyLists_1.MyLists().getShoppingList());
});
d.register("ShoppingView", {
    create: function () {
        return "<div class='ShoppingView'>\n              <div class=\"list\">hi, i'm the empty list</div>\n            </div>";
    },
    init: function (shoppingList) {
        var view = this;
        var listEl = d.first(view.el, ".list");
        listEl.innerHTML = "";
        var nameDiv = document.createElement("div");
        nameDiv.textContent = shoppingList.name;
        listEl.appendChild(nameDiv);
        var ul = document.createElement("ul");
        for (var _i = 0, _a = shoppingList.items; _i < _a.length; _i++) {
            var listItem = _a[_i];
            var li = document.createElement("li");
            li.textContent = listItem.name || "";
            ul.appendChild(li);
        }
        listEl.appendChild(ul);
    }
});
console.log("Init done");

},{"../src/Hello":28,"../src/MyLists":29,"../uideps/mvdom":12}]},{},[32])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvYXNwcm9taXNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL2Jhc2U2NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9ldmVudGVtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvZmxvYXQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvaW5xdWlyZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9wb29sL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL3V0ZjgvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbXZkb20vc3JjL2RvbS5qcyIsIm5vZGVfbW9kdWxlcy9tdmRvbS9zcmMvZHguanMiLCJub2RlX21vZHVsZXMvbXZkb20vc3JjL2V2ZW50LmpzIiwibm9kZV9tb2R1bGVzL212ZG9tL3NyYy9odWIuanMiLCJub2RlX21vZHVsZXMvbXZkb20vdHMvdWlkZXBzL212ZG9tL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL212ZG9tL3NyYy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9tdmRvbS9zcmMvdmlldy1ldmVudC5qcyIsIm5vZGVfbW9kdWxlcy9tdmRvbS9zcmMvdmlldy1odWIuanMiLCJub2RlX21vZHVsZXMvbXZkb20vc3JjL3ZpZXcuanMiLCJub2RlX21vZHVsZXMvdHMvc3JjZGVwcy9wcm90b2J1ZmpzL21pbmltYWwuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvaW5kZXgtbWluaW1hbC5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9yZWFkZXIuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvcmVhZGVyX2J1ZmZlci5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9yb290cy5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9ycGMuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvcnBjL3NlcnZpY2UuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvdXRpbC9sb25nYml0cy5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy91dGlsL21pbmltYWwuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvd3JpdGVyLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3dyaXRlcl9idWZmZXIuanMiLCIuLi90cy9zcmMvSGVsbG8udHMiLCIuLi90cy9zcmMvTXlMaXN0cy50cyIsIi4uL3RzL3NyYy9Ob3cudHMiLCIuLi90cy9zcmNkZXBzL3Byb3RvLWdlbi10cy9hbGxwcm90by5qcyIsIi4uL3RzL3VpL0luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUUEsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ2hDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNsQyxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUIsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVCLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFbEMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDM0IsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBRXpCLE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDaEIsT0FBTyxFQUFFLE9BQU87SUFFaEIsWUFBWTtJQUNaLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtJQUNmLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtJQUN2QixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87SUFDckIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO0lBQ25CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztJQUVqQixZQUFZO0lBQ1osRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFO0lBQ1osR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHO0lBQ2QsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO0lBRXRCLHNCQUFzQjtJQUN0QixLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUs7SUFDaEIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ1osT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPO0lBQ3BCLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtJQUNkLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtJQUVkLGNBQWM7SUFDZCxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07SUFDbEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO0lBRWQsZ0JBQWdCO0lBQ2hCLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSTtJQUNiLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSTtJQUNiLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTTtJQUNqQixNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU07SUFFakIsTUFBTTtJQUNOLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRztJQUVaLFFBQVE7SUFDUixHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUc7SUFDZCxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87Q0FDdEIsQ0FBQztBQUVGLHlDQUF5QztBQUN6QyxvSUFBb0k7QUFDcEksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUEsQ0FBQztJQUNYLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztBQUMvQixDQUFDOzs7QUN0REQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UUEsK0JBQStCO0FBRS9CLFlBQVksQ0FBQztBQUNiLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7OztBQ0hoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakZBLDZEQUF1RDtBQUN2RCxxQ0FBbUM7QUFDbkMsNkJBQTJCO0FBQzNCO0lBQUE7SUFjQSxDQUFDO0lBYkMsK0JBQWUsR0FBZjtRQUNFLElBQUksWUFBWSxHQUFHLGVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUE7UUFDdkQsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzNELFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUMsQ0FBQTtRQUM3RCxNQUFNLENBQUMsWUFBWSxDQUFBO0lBQ3JCLENBQUM7SUFFRCxtQkFBRyxHQUFIO1FBQ0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1FBQzdCLElBQUksU0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUE7UUFFakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlCQUFPLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFBO0lBQzlDLENBQUM7SUFDSCxZQUFDO0FBQUQsQ0FkQSxBQWNDLElBQUE7QUFkWSxzQkFBSzs7Ozs7QUNIbEIsNkRBQXVEO0FBRXZEO0lBQUE7SUFPQSxDQUFDO0lBTkMsaUNBQWUsR0FBZjtRQUNFLElBQUksWUFBWSxHQUFHLGVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUE7UUFDdkQsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzNELFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUMsQ0FBQTtRQUM3RCxNQUFNLENBQUMsWUFBWSxDQUFBO0lBQ3JCLENBQUM7SUFDSCxjQUFDO0FBQUQsQ0FQQSxBQU9DLElBQUE7QUFQWSwwQkFBTzs7Ozs7QUNGcEI7SUFBQTtJQUlBLENBQUM7SUFIQyxtQkFBSyxHQUFMO1FBQ0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFFLGtCQUFrQixDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUNILFVBQUM7QUFBRCxDQUpBLEFBSUMsSUFBQTtBQUpZLGtCQUFHOzs7QUNBaEIsMEZBQTBGO0FBQzFGLFlBQVksQ0FBQztBQUViLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBRXBELGlCQUFpQjtBQUNqQixJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBRTNCLDBCQUEwQjtBQUMxQixJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFFOUgsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDO0lBRVY7Ozs7T0FJRztJQUNILElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUVkLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQztRQUVUOzs7OztXQUtHO1FBRUg7Ozs7OztXQU1HO1FBQ0gsY0FBYyxVQUFVO1lBQ3BCLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDWCxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUNoRSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO3dCQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRDs7Ozs7V0FLRztRQUNILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUV6Qjs7Ozs7OztXQU9HO1FBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBZ0IsVUFBVTtZQUNwQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDO1FBRUY7Ozs7Ozs7V0FPRztRQUNILElBQUksQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLE9BQU87WUFDakMsRUFBRSxDQUFDLENBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxJQUFJLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztZQUM3QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM5QixNQUFNLENBQUMsdUJBQXVCLENBQUM7WUFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDLENBQUM7UUFFRjs7Ozs7OztXQU9HO1FBQ0gsSUFBSSxDQUFDLFVBQVUsR0FBRyxvQkFBb0IsTUFBTTtZQUN4QyxFQUFFLENBQUMsQ0FBQyxNQUFNLFlBQVksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsSUFBSSxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO2dCQUNwQixPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUNuQixDQUFDLENBQUM7UUFFRjs7Ozs7Ozs7V0FRRztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsa0JBQWtCLE9BQU8sRUFBRSxPQUFPO1lBQzlDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUNULE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDakIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUMvQixNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2xCLENBQUMsQ0FBQztRQUVGOzs7Ozs7V0FNRztRQUNILElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHO1lBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6RSxDQUFDLENBQUM7UUFFRixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFTCxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUM7UUFFVDs7Ozs7O1dBTUc7UUFFSDs7Ozs7O1dBTUc7UUFDSCxjQUFjLFVBQVU7WUFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDaEIsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUNYLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQ2hFLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7d0JBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRXpCOzs7OztXQUtHO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUV4Qzs7Ozs7OztXQU9HO1FBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBZ0IsVUFBVTtZQUNwQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDO1FBRUY7Ozs7Ozs7V0FPRztRQUNILElBQUksQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLE9BQU87WUFDakMsRUFBRSxDQUFDLENBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxJQUFJLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztZQUM3QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM5QixNQUFNLENBQUMsdUJBQXVCLENBQUM7WUFDdkMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzlCLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQztnQkFDbkMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUM1QyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7d0JBQ04sTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBQ2hDLENBQUM7WUFDTCxDQUFDO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDLENBQUM7UUFFRjs7Ozs7OztXQU9HO1FBQ0gsSUFBSSxDQUFDLFVBQVUsR0FBRyxvQkFBb0IsTUFBTTtZQUN4QyxFQUFFLENBQUMsQ0FBQyxNQUFNLFlBQVksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsSUFBSSxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO2dCQUNwQixPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDN0IsTUFBTSxTQUFTLENBQUMsa0NBQWtDLENBQUMsQ0FBQztnQkFDeEQsT0FBTyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ25CLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDM0MsRUFBRSxDQUFDLENBQUMsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsQ0FBQzt3QkFDcEMsTUFBTSxTQUFTLENBQUMsbUNBQW1DLENBQUMsQ0FBQztvQkFDekQsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxDQUFDO1lBQ0wsQ0FBQztZQUNELE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDbkIsQ0FBQyxDQUFDO1FBRUY7Ozs7Ozs7O1dBUUc7UUFDSCxJQUFJLENBQUMsUUFBUSxHQUFHLGtCQUFrQixPQUFPLEVBQUUsT0FBTztZQUM5QyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDVCxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNoQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUM7Z0JBQ25DLE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ3RCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUMvQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2xCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUN6QyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2xCLENBQUMsQ0FBQztRQUVGOzs7Ozs7V0FNRztRQUNILElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHO1lBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6RSxDQUFDLENBQUM7UUFFRixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFTCxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFFTCxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQzs7Ozs7QUN6UnZCLDBDQUF3QztBQUN4QyxzQ0FBb0M7QUFHcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUV6Qiw0REFBNEQ7QUFDNUQsSUFBSSxhQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQWNqQixJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtBQUVsQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUU7SUFDNUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLGlCQUFPLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFBO0FBQ2xGLENBQUMsQ0FBQyxDQUFBO0FBRUYsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUM7SUFDekIsTUFBTSxFQUFFO1FBQ0wsTUFBTSxDQUFDLGdIQUVRLENBQUE7SUFDbEIsQ0FBQztJQUVELElBQUksRUFBRSxVQUFTLFlBQXVCO1FBQ25DLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNmLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUN0QyxNQUFNLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtRQUVyQixJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzNDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQTtRQUN2QyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRTNCLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDckMsR0FBRyxDQUFDLENBQWlCLFVBQWtCLEVBQWxCLEtBQUEsWUFBWSxDQUFDLEtBQUssRUFBbEIsY0FBa0IsRUFBbEIsSUFBa0I7WUFBbEMsSUFBSSxRQUFRLFNBQUE7WUFDZixJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ3JDLEVBQUUsQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUE7WUFDcEMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtTQUNuQjtRQUVELE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDeEIsQ0FBQztDQUNGLENBQUMsQ0FBQTtBQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gYXNQcm9taXNlO1xyXG5cclxuLyoqXHJcbiAqIENhbGxiYWNrIGFzIHVzZWQgYnkge0BsaW5rIHV0aWwuYXNQcm9taXNlfS5cclxuICogQHR5cGVkZWYgYXNQcm9taXNlQ2FsbGJhY2tcclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge0Vycm9yfG51bGx9IGVycm9yIEVycm9yLCBpZiBhbnlcclxuICogQHBhcmFtIHsuLi4qfSBwYXJhbXMgQWRkaXRpb25hbCBhcmd1bWVudHNcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIHByb21pc2UgZnJvbSBhIG5vZGUtc3R5bGUgY2FsbGJhY2sgZnVuY3Rpb24uXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBwYXJhbSB7YXNQcm9taXNlQ2FsbGJhY2t9IGZuIEZ1bmN0aW9uIHRvIGNhbGxcclxuICogQHBhcmFtIHsqfSBjdHggRnVuY3Rpb24gY29udGV4dFxyXG4gKiBAcGFyYW0gey4uLip9IHBhcmFtcyBGdW5jdGlvbiBhcmd1bWVudHNcclxuICogQHJldHVybnMge1Byb21pc2U8Kj59IFByb21pc2lmaWVkIGZ1bmN0aW9uXHJcbiAqL1xyXG5mdW5jdGlvbiBhc1Byb21pc2UoZm4sIGN0eC8qLCB2YXJhcmdzICovKSB7XHJcbiAgICB2YXIgcGFyYW1zICA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSksXHJcbiAgICAgICAgb2Zmc2V0ICA9IDAsXHJcbiAgICAgICAgaW5kZXggICA9IDIsXHJcbiAgICAgICAgcGVuZGluZyA9IHRydWU7XHJcbiAgICB3aGlsZSAoaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoKVxyXG4gICAgICAgIHBhcmFtc1tvZmZzZXQrK10gPSBhcmd1bWVudHNbaW5kZXgrK107XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gZXhlY3V0b3IocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgcGFyYW1zW29mZnNldF0gPSBmdW5jdGlvbiBjYWxsYmFjayhlcnIvKiwgdmFyYXJncyAqLykge1xyXG4gICAgICAgICAgICBpZiAocGVuZGluZykge1xyXG4gICAgICAgICAgICAgICAgcGVuZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycilcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChvZmZzZXQgPCBwYXJhbXMubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXNbb2Zmc2V0KytdID0gYXJndW1lbnRzW29mZnNldF07XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZS5hcHBseShudWxsLCBwYXJhbXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBmbi5hcHBseShjdHggfHwgbnVsbCwgcGFyYW1zKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgaWYgKHBlbmRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHBlbmRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQSBtaW5pbWFsIGJhc2U2NCBpbXBsZW1lbnRhdGlvbiBmb3IgbnVtYmVyIGFycmF5cy5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIGJhc2U2NCA9IGV4cG9ydHM7XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgYnl0ZSBsZW5ndGggb2YgYSBiYXNlNjQgZW5jb2RlZCBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgQmFzZTY0IGVuY29kZWQgc3RyaW5nXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IEJ5dGUgbGVuZ3RoXHJcbiAqL1xyXG5iYXNlNjQubGVuZ3RoID0gZnVuY3Rpb24gbGVuZ3RoKHN0cmluZykge1xyXG4gICAgdmFyIHAgPSBzdHJpbmcubGVuZ3RoO1xyXG4gICAgaWYgKCFwKVxyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgdmFyIG4gPSAwO1xyXG4gICAgd2hpbGUgKC0tcCAlIDQgPiAxICYmIHN0cmluZy5jaGFyQXQocCkgPT09IFwiPVwiKVxyXG4gICAgICAgICsrbjtcclxuICAgIHJldHVybiBNYXRoLmNlaWwoc3RyaW5nLmxlbmd0aCAqIDMpIC8gNCAtIG47XHJcbn07XHJcblxyXG4vLyBCYXNlNjQgZW5jb2RpbmcgdGFibGVcclxudmFyIGI2NCA9IG5ldyBBcnJheSg2NCk7XHJcblxyXG4vLyBCYXNlNjQgZGVjb2RpbmcgdGFibGVcclxudmFyIHM2NCA9IG5ldyBBcnJheSgxMjMpO1xyXG5cclxuLy8gNjUuLjkwLCA5Ny4uMTIyLCA0OC4uNTcsIDQzLCA0N1xyXG5mb3IgKHZhciBpID0gMDsgaSA8IDY0OylcclxuICAgIHM2NFtiNjRbaV0gPSBpIDwgMjYgPyBpICsgNjUgOiBpIDwgNTIgPyBpICsgNzEgOiBpIDwgNjIgPyBpIC0gNCA6IGkgLSA1OSB8IDQzXSA9IGkrKztcclxuXHJcbi8qKlxyXG4gKiBFbmNvZGVzIGEgYnVmZmVyIHRvIGEgYmFzZTY0IGVuY29kZWQgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTb3VyY2Ugc3RhcnRcclxuICogQHBhcmFtIHtudW1iZXJ9IGVuZCBTb3VyY2UgZW5kXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEJhc2U2NCBlbmNvZGVkIHN0cmluZ1xyXG4gKi9cclxuYmFzZTY0LmVuY29kZSA9IGZ1bmN0aW9uIGVuY29kZShidWZmZXIsIHN0YXJ0LCBlbmQpIHtcclxuICAgIHZhciBwYXJ0cyA9IG51bGwsXHJcbiAgICAgICAgY2h1bmsgPSBbXTtcclxuICAgIHZhciBpID0gMCwgLy8gb3V0cHV0IGluZGV4XHJcbiAgICAgICAgaiA9IDAsIC8vIGdvdG8gaW5kZXhcclxuICAgICAgICB0OyAgICAgLy8gdGVtcG9yYXJ5XHJcbiAgICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcclxuICAgICAgICB2YXIgYiA9IGJ1ZmZlcltzdGFydCsrXTtcclxuICAgICAgICBzd2l0Y2ggKGopIHtcclxuICAgICAgICAgICAgY2FzZSAwOlxyXG4gICAgICAgICAgICAgICAgY2h1bmtbaSsrXSA9IGI2NFtiID4+IDJdO1xyXG4gICAgICAgICAgICAgICAgdCA9IChiICYgMykgPDwgNDtcclxuICAgICAgICAgICAgICAgIGogPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgICAgIGNodW5rW2krK10gPSBiNjRbdCB8IGIgPj4gNF07XHJcbiAgICAgICAgICAgICAgICB0ID0gKGIgJiAxNSkgPDwgMjtcclxuICAgICAgICAgICAgICAgIGogPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgIGNodW5rW2krK10gPSBiNjRbdCB8IGIgPj4gNl07XHJcbiAgICAgICAgICAgICAgICBjaHVua1tpKytdID0gYjY0W2IgJiA2M107XHJcbiAgICAgICAgICAgICAgICBqID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaSA+IDgxOTEpIHtcclxuICAgICAgICAgICAgKHBhcnRzIHx8IChwYXJ0cyA9IFtdKSkucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY2h1bmspKTtcclxuICAgICAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGopIHtcclxuICAgICAgICBjaHVua1tpKytdID0gYjY0W3RdO1xyXG4gICAgICAgIGNodW5rW2krK10gPSA2MTtcclxuICAgICAgICBpZiAoaiA9PT0gMSlcclxuICAgICAgICAgICAgY2h1bmtbaSsrXSA9IDYxO1xyXG4gICAgfVxyXG4gICAgaWYgKHBhcnRzKSB7XHJcbiAgICAgICAgaWYgKGkpXHJcbiAgICAgICAgICAgIHBhcnRzLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rLnNsaWNlKDAsIGkpKSk7XHJcbiAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rLnNsaWNlKDAsIGkpKTtcclxufTtcclxuXHJcbnZhciBpbnZhbGlkRW5jb2RpbmcgPSBcImludmFsaWQgZW5jb2RpbmdcIjtcclxuXHJcbi8qKlxyXG4gKiBEZWNvZGVzIGEgYmFzZTY0IGVuY29kZWQgc3RyaW5nIHRvIGEgYnVmZmVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFNvdXJjZSBzdHJpbmdcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgRGVzdGluYXRpb24gYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgRGVzdGluYXRpb24gb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IE51bWJlciBvZiBieXRlcyB3cml0dGVuXHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBlbmNvZGluZyBpcyBpbnZhbGlkXHJcbiAqL1xyXG5iYXNlNjQuZGVjb2RlID0gZnVuY3Rpb24gZGVjb2RlKHN0cmluZywgYnVmZmVyLCBvZmZzZXQpIHtcclxuICAgIHZhciBzdGFydCA9IG9mZnNldDtcclxuICAgIHZhciBqID0gMCwgLy8gZ290byBpbmRleFxyXG4gICAgICAgIHQ7ICAgICAvLyB0ZW1wb3JhcnlcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDspIHtcclxuICAgICAgICB2YXIgYyA9IHN0cmluZy5jaGFyQ29kZUF0KGkrKyk7XHJcbiAgICAgICAgaWYgKGMgPT09IDYxICYmIGogPiAxKVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBpZiAoKGMgPSBzNjRbY10pID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKGludmFsaWRFbmNvZGluZyk7XHJcbiAgICAgICAgc3dpdGNoIChqKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICAgIHQgPSBjO1xyXG4gICAgICAgICAgICAgICAgaiA9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IHQgPDwgMiB8IChjICYgNDgpID4+IDQ7XHJcbiAgICAgICAgICAgICAgICB0ID0gYztcclxuICAgICAgICAgICAgICAgIGogPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSAodCAmIDE1KSA8PCA0IHwgKGMgJiA2MCkgPj4gMjtcclxuICAgICAgICAgICAgICAgIHQgPSBjO1xyXG4gICAgICAgICAgICAgICAgaiA9IDM7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9ICh0ICYgMykgPDwgNiB8IGM7XHJcbiAgICAgICAgICAgICAgICBqID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChqID09PSAxKVxyXG4gICAgICAgIHRocm93IEVycm9yKGludmFsaWRFbmNvZGluZyk7XHJcbiAgICByZXR1cm4gb2Zmc2V0IC0gc3RhcnQ7XHJcbn07XHJcblxyXG4vKipcclxuICogVGVzdHMgaWYgdGhlIHNwZWNpZmllZCBzdHJpbmcgYXBwZWFycyB0byBiZSBiYXNlNjQgZW5jb2RlZC5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBTdHJpbmcgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHByb2JhYmx5IGJhc2U2NCBlbmNvZGVkLCBvdGhlcndpc2UgZmFsc2VcclxuICovXHJcbmJhc2U2NC50ZXN0ID0gZnVuY3Rpb24gdGVzdChzdHJpbmcpIHtcclxuICAgIHJldHVybiAvXig/OltBLVphLXowLTkrL117NH0pKig/OltBLVphLXowLTkrL117Mn09PXxbQS1aYS16MC05Ky9dezN9PSk/JC8udGVzdChzdHJpbmcpO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBldmVudCBlbWl0dGVyIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIEEgbWluaW1hbCBldmVudCBlbWl0dGVyLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZ2lzdGVyZWQgbGlzdGVuZXJzLlxyXG4gICAgICogQHR5cGUge09iamVjdC48c3RyaW5nLCo+fVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgdGhpcy5fbGlzdGVuZXJzID0ge307XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZWdpc3RlcnMgYW4gZXZlbnQgbGlzdGVuZXIuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBldnQgRXZlbnQgbmFtZVxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBmbiBMaXN0ZW5lclxyXG4gKiBAcGFyYW0geyp9IFtjdHhdIExpc3RlbmVyIGNvbnRleHRcclxuICogQHJldHVybnMge3V0aWwuRXZlbnRFbWl0dGVyfSBgdGhpc2BcclxuICovXHJcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldnQsIGZuLCBjdHgpIHtcclxuICAgICh0aGlzLl9saXN0ZW5lcnNbZXZ0XSB8fCAodGhpcy5fbGlzdGVuZXJzW2V2dF0gPSBbXSkpLnB1c2goe1xyXG4gICAgICAgIGZuICA6IGZuLFxyXG4gICAgICAgIGN0eCA6IGN0eCB8fCB0aGlzXHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYW4gZXZlbnQgbGlzdGVuZXIgb3IgYW55IG1hdGNoaW5nIGxpc3RlbmVycyBpZiBhcmd1bWVudHMgYXJlIG9taXR0ZWQuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZXZ0XSBFdmVudCBuYW1lLiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgaWYgb21pdHRlZC5cclxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2ZuXSBMaXN0ZW5lciB0byByZW1vdmUuIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBvZiBgZXZ0YCBpZiBvbWl0dGVkLlxyXG4gKiBAcmV0dXJucyB7dXRpbC5FdmVudEVtaXR0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbiBvZmYoZXZ0LCBmbikge1xyXG4gICAgaWYgKGV2dCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKGZuID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVyc1tldnRdID0gW107XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnNbZXZ0XTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOylcclxuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0uZm4gPT09IGZuKVxyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgKytpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVtaXRzIGFuIGV2ZW50IGJ5IGNhbGxpbmcgaXRzIGxpc3RlbmVycyB3aXRoIHRoZSBzcGVjaWZpZWQgYXJndW1lbnRzLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZ0IEV2ZW50IG5hbWVcclxuICogQHBhcmFtIHsuLi4qfSBhcmdzIEFyZ3VtZW50c1xyXG4gKiBAcmV0dXJucyB7dXRpbC5FdmVudEVtaXR0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcclxuICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnNbZXZ0XTtcclxuICAgIGlmIChsaXN0ZW5lcnMpIHtcclxuICAgICAgICB2YXIgYXJncyA9IFtdLFxyXG4gICAgICAgICAgICBpID0gMTtcclxuICAgICAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7KVxyXG4gICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2krK10pO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOylcclxuICAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpKytdLmN0eCwgYXJncyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoZmFjdG9yeSk7XHJcblxyXG4vKipcclxuICogUmVhZHMgLyB3cml0ZXMgZmxvYXRzIC8gZG91YmxlcyBmcm9tIC8gdG8gYnVmZmVycy5cclxuICogQG5hbWUgdXRpbC5mbG9hdFxyXG4gKiBAbmFtZXNwYWNlXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIDMyIGJpdCBmbG9hdCB0byBhIGJ1ZmZlciB1c2luZyBsaXR0bGUgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQud3JpdGVGbG9hdExFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRhcmdldCBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBUYXJnZXQgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSAzMiBiaXQgZmxvYXQgdG8gYSBidWZmZXIgdXNpbmcgYmlnIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LndyaXRlRmxvYXRCRVxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBUYXJnZXQgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGFyZ2V0IGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSAzMiBiaXQgZmxvYXQgZnJvbSBhIGJ1ZmZlciB1c2luZyBsaXR0bGUgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQucmVhZEZsb2F0TEVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFNvdXJjZSBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBTb3VyY2UgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgMzIgYml0IGZsb2F0IGZyb20gYSBidWZmZXIgdXNpbmcgYmlnIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LnJlYWRGbG9hdEJFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgU291cmNlIGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSA2NCBiaXQgZG91YmxlIHRvIGEgYnVmZmVyIHVzaW5nIGxpdHRsZSBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC53cml0ZURvdWJsZUxFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRhcmdldCBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBUYXJnZXQgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSA2NCBiaXQgZG91YmxlIHRvIGEgYnVmZmVyIHVzaW5nIGJpZyBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC53cml0ZURvdWJsZUJFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRhcmdldCBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBUYXJnZXQgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIDY0IGJpdCBkb3VibGUgZnJvbSBhIGJ1ZmZlciB1c2luZyBsaXR0bGUgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQucmVhZERvdWJsZUxFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgU291cmNlIGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIDY0IGJpdCBkb3VibGUgZnJvbSBhIGJ1ZmZlciB1c2luZyBiaWcgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQucmVhZERvdWJsZUJFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgU291cmNlIGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8vIEZhY3RvcnkgZnVuY3Rpb24gZm9yIHRoZSBwdXJwb3NlIG9mIG5vZGUtYmFzZWQgdGVzdGluZyBpbiBtb2RpZmllZCBnbG9iYWwgZW52aXJvbm1lbnRzXHJcbmZ1bmN0aW9uIGZhY3RvcnkoZXhwb3J0cykge1xyXG5cclxuICAgIC8vIGZsb2F0OiB0eXBlZCBhcnJheVxyXG4gICAgaWYgKHR5cGVvZiBGbG9hdDMyQXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGYzMiA9IG5ldyBGbG9hdDMyQXJyYXkoWyAtMCBdKSxcclxuICAgICAgICAgICAgZjhiID0gbmV3IFVpbnQ4QXJyYXkoZjMyLmJ1ZmZlciksXHJcbiAgICAgICAgICAgIGxlICA9IGY4YlszXSA9PT0gMTI4O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZUZsb2F0X2YzMl9jcHkodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmMzJbMF0gPSB2YWw7XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgICAgXSA9IGY4YlswXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDFdID0gZjhiWzFdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMl0gPSBmOGJbMl07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAzXSA9IGY4YlszXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRmxvYXRfZjMyX3Jldih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGYzMlswXSA9IHZhbDtcclxuICAgICAgICAgICAgYnVmW3BvcyAgICBdID0gZjhiWzNdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMV0gPSBmOGJbMl07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAyXSA9IGY4YlsxXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDNdID0gZjhiWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLndyaXRlRmxvYXRMRSA9IGxlID8gd3JpdGVGbG9hdF9mMzJfY3B5IDogd3JpdGVGbG9hdF9mMzJfcmV2O1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy53cml0ZUZsb2F0QkUgPSBsZSA/IHdyaXRlRmxvYXRfZjMyX3JldiA6IHdyaXRlRmxvYXRfZjMyX2NweTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZEZsb2F0X2YzMl9jcHkoYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjhiWzBdID0gYnVmW3BvcyAgICBdO1xyXG4gICAgICAgICAgICBmOGJbMV0gPSBidWZbcG9zICsgMV07XHJcbiAgICAgICAgICAgIGY4YlsyXSA9IGJ1Zltwb3MgKyAyXTtcclxuICAgICAgICAgICAgZjhiWzNdID0gYnVmW3BvcyArIDNdO1xyXG4gICAgICAgICAgICByZXR1cm4gZjMyWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZEZsb2F0X2YzMl9yZXYoYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjhiWzNdID0gYnVmW3BvcyAgICBdO1xyXG4gICAgICAgICAgICBmOGJbMl0gPSBidWZbcG9zICsgMV07XHJcbiAgICAgICAgICAgIGY4YlsxXSA9IGJ1Zltwb3MgKyAyXTtcclxuICAgICAgICAgICAgZjhiWzBdID0gYnVmW3BvcyArIDNdO1xyXG4gICAgICAgICAgICByZXR1cm4gZjMyWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLnJlYWRGbG9hdExFID0gbGUgPyByZWFkRmxvYXRfZjMyX2NweSA6IHJlYWRGbG9hdF9mMzJfcmV2O1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRmxvYXRCRSA9IGxlID8gcmVhZEZsb2F0X2YzMl9yZXYgOiByZWFkRmxvYXRfZjMyX2NweTtcclxuXHJcbiAgICAvLyBmbG9hdDogaWVlZTc1NFxyXG4gICAgfSkoKTsgZWxzZSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRmxvYXRfaWVlZTc1NCh3cml0ZVVpbnQsIHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgdmFyIHNpZ24gPSB2YWwgPCAwID8gMSA6IDA7XHJcbiAgICAgICAgICAgIGlmIChzaWduKVxyXG4gICAgICAgICAgICAgICAgdmFsID0gLXZhbDtcclxuICAgICAgICAgICAgaWYgKHZhbCA9PT0gMClcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgxIC8gdmFsID4gMCA/IC8qIHBvc2l0aXZlICovIDAgOiAvKiBuZWdhdGl2ZSAwICovIDIxNDc0ODM2NDgsIGJ1ZiwgcG9zKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoaXNOYU4odmFsKSlcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgyMTQzMjg5MzQ0LCBidWYsIHBvcyk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA+IDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpIC8vICstSW5maW5pdHlcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgoc2lnbiA8PCAzMSB8IDIxMzkwOTUwNDApID4+PiAwLCBidWYsIHBvcyk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA8IDEuMTc1NDk0MzUwODIyMjg3NWUtMzgpIC8vIGRlbm9ybWFsXHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoKHNpZ24gPDwgMzEgfCBNYXRoLnJvdW5kKHZhbCAvIDEuNDAxMjk4NDY0MzI0ODE3ZS00NSkpID4+PiAwLCBidWYsIHBvcyk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV4cG9uZW50ID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWwpIC8gTWF0aC5MTjIpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1hbnRpc3NhID0gTWF0aC5yb3VuZCh2YWwgKiBNYXRoLnBvdygyLCAtZXhwb25lbnQpICogODM4ODYwOCkgJiA4Mzg4NjA3O1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgZXhwb25lbnQgKyAxMjcgPDwgMjMgfCBtYW50aXNzYSkgPj4+IDAsIGJ1ZiwgcG9zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhwb3J0cy53cml0ZUZsb2F0TEUgPSB3cml0ZUZsb2F0X2llZWU3NTQuYmluZChudWxsLCB3cml0ZVVpbnRMRSk7XHJcbiAgICAgICAgZXhwb3J0cy53cml0ZUZsb2F0QkUgPSB3cml0ZUZsb2F0X2llZWU3NTQuYmluZChudWxsLCB3cml0ZVVpbnRCRSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWRGbG9hdF9pZWVlNzU0KHJlYWRVaW50LCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICB2YXIgdWludCA9IHJlYWRVaW50KGJ1ZiwgcG9zKSxcclxuICAgICAgICAgICAgICAgIHNpZ24gPSAodWludCA+PiAzMSkgKiAyICsgMSxcclxuICAgICAgICAgICAgICAgIGV4cG9uZW50ID0gdWludCA+Pj4gMjMgJiAyNTUsXHJcbiAgICAgICAgICAgICAgICBtYW50aXNzYSA9IHVpbnQgJiA4Mzg4NjA3O1xyXG4gICAgICAgICAgICByZXR1cm4gZXhwb25lbnQgPT09IDI1NVxyXG4gICAgICAgICAgICAgICAgPyBtYW50aXNzYVxyXG4gICAgICAgICAgICAgICAgPyBOYU5cclxuICAgICAgICAgICAgICAgIDogc2lnbiAqIEluZmluaXR5XHJcbiAgICAgICAgICAgICAgICA6IGV4cG9uZW50ID09PSAwIC8vIGRlbm9ybWFsXHJcbiAgICAgICAgICAgICAgICA/IHNpZ24gKiAxLjQwMTI5ODQ2NDMyNDgxN2UtNDUgKiBtYW50aXNzYVxyXG4gICAgICAgICAgICAgICAgOiBzaWduICogTWF0aC5wb3coMiwgZXhwb25lbnQgLSAxNTApICogKG1hbnRpc3NhICsgODM4ODYwOCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHBvcnRzLnJlYWRGbG9hdExFID0gcmVhZEZsb2F0X2llZWU3NTQuYmluZChudWxsLCByZWFkVWludExFKTtcclxuICAgICAgICBleHBvcnRzLnJlYWRGbG9hdEJFID0gcmVhZEZsb2F0X2llZWU3NTQuYmluZChudWxsLCByZWFkVWludEJFKTtcclxuXHJcbiAgICB9KSgpO1xyXG5cclxuICAgIC8vIGRvdWJsZTogdHlwZWQgYXJyYXlcclxuICAgIGlmICh0eXBlb2YgRmxvYXQ2NEFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBmNjQgPSBuZXcgRmxvYXQ2NEFycmF5KFstMF0pLFxyXG4gICAgICAgICAgICBmOGIgPSBuZXcgVWludDhBcnJheShmNjQuYnVmZmVyKSxcclxuICAgICAgICAgICAgbGUgID0gZjhiWzddID09PSAxMjg7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRG91YmxlX2Y2NF9jcHkodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmNjRbMF0gPSB2YWw7XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgICAgXSA9IGY4YlswXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDFdID0gZjhiWzFdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMl0gPSBmOGJbMl07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAzXSA9IGY4YlszXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDRdID0gZjhiWzRdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgNV0gPSBmOGJbNV07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA2XSA9IGY4Yls2XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDddID0gZjhiWzddO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVEb3VibGVfZjY0X3Jldih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGY2NFswXSA9IHZhbDtcclxuICAgICAgICAgICAgYnVmW3BvcyAgICBdID0gZjhiWzddO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMV0gPSBmOGJbNl07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAyXSA9IGY4Yls1XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDNdID0gZjhiWzRdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgNF0gPSBmOGJbM107XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA1XSA9IGY4YlsyXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDZdID0gZjhiWzFdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgN10gPSBmOGJbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMud3JpdGVEb3VibGVMRSA9IGxlID8gd3JpdGVEb3VibGVfZjY0X2NweSA6IHdyaXRlRG91YmxlX2Y2NF9yZXY7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLndyaXRlRG91YmxlQkUgPSBsZSA/IHdyaXRlRG91YmxlX2Y2NF9yZXYgOiB3cml0ZURvdWJsZV9mNjRfY3B5O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkRG91YmxlX2Y2NF9jcHkoYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjhiWzBdID0gYnVmW3BvcyAgICBdO1xyXG4gICAgICAgICAgICBmOGJbMV0gPSBidWZbcG9zICsgMV07XHJcbiAgICAgICAgICAgIGY4YlsyXSA9IGJ1Zltwb3MgKyAyXTtcclxuICAgICAgICAgICAgZjhiWzNdID0gYnVmW3BvcyArIDNdO1xyXG4gICAgICAgICAgICBmOGJbNF0gPSBidWZbcG9zICsgNF07XHJcbiAgICAgICAgICAgIGY4Yls1XSA9IGJ1Zltwb3MgKyA1XTtcclxuICAgICAgICAgICAgZjhiWzZdID0gYnVmW3BvcyArIDZdO1xyXG4gICAgICAgICAgICBmOGJbN10gPSBidWZbcG9zICsgN107XHJcbiAgICAgICAgICAgIHJldHVybiBmNjRbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkRG91YmxlX2Y2NF9yZXYoYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjhiWzddID0gYnVmW3BvcyAgICBdO1xyXG4gICAgICAgICAgICBmOGJbNl0gPSBidWZbcG9zICsgMV07XHJcbiAgICAgICAgICAgIGY4Yls1XSA9IGJ1Zltwb3MgKyAyXTtcclxuICAgICAgICAgICAgZjhiWzRdID0gYnVmW3BvcyArIDNdO1xyXG4gICAgICAgICAgICBmOGJbM10gPSBidWZbcG9zICsgNF07XHJcbiAgICAgICAgICAgIGY4YlsyXSA9IGJ1Zltwb3MgKyA1XTtcclxuICAgICAgICAgICAgZjhiWzFdID0gYnVmW3BvcyArIDZdO1xyXG4gICAgICAgICAgICBmOGJbMF0gPSBidWZbcG9zICsgN107XHJcbiAgICAgICAgICAgIHJldHVybiBmNjRbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMucmVhZERvdWJsZUxFID0gbGUgPyByZWFkRG91YmxlX2Y2NF9jcHkgOiByZWFkRG91YmxlX2Y2NF9yZXY7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLnJlYWREb3VibGVCRSA9IGxlID8gcmVhZERvdWJsZV9mNjRfcmV2IDogcmVhZERvdWJsZV9mNjRfY3B5O1xyXG5cclxuICAgIC8vIGRvdWJsZTogaWVlZTc1NFxyXG4gICAgfSkoKTsgZWxzZSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRG91YmxlX2llZWU3NTQod3JpdGVVaW50LCBvZmYwLCBvZmYxLCB2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWduID0gdmFsIDwgMCA/IDEgOiAwO1xyXG4gICAgICAgICAgICBpZiAoc2lnbilcclxuICAgICAgICAgICAgICAgIHZhbCA9IC12YWw7XHJcbiAgICAgICAgICAgIGlmICh2YWwgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgwLCBidWYsIHBvcyArIG9mZjApO1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDEgLyB2YWwgPiAwID8gLyogcG9zaXRpdmUgKi8gMCA6IC8qIG5lZ2F0aXZlIDAgKi8gMjE0NzQ4MzY0OCwgYnVmLCBwb3MgKyBvZmYxKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc05hTih2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoMCwgYnVmLCBwb3MgKyBvZmYwKTtcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgyMTQ2OTU5MzYwLCBidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbCA+IDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4KSB7IC8vICstSW5maW5pdHlcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgwLCBidWYsIHBvcyArIG9mZjApO1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgMjE0NjQzNTA3MikgPj4+IDAsIGJ1ZiwgcG9zICsgb2ZmMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWFudGlzc2E7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsIDwgMi4yMjUwNzM4NTg1MDcyMDE0ZS0zMDgpIHsgLy8gZGVub3JtYWxcclxuICAgICAgICAgICAgICAgICAgICBtYW50aXNzYSA9IHZhbCAvIDVlLTMyNDtcclxuICAgICAgICAgICAgICAgICAgICB3cml0ZVVpbnQobWFudGlzc2EgPj4+IDAsIGJ1ZiwgcG9zICsgb2ZmMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgbWFudGlzc2EgLyA0Mjk0OTY3Mjk2KSA+Pj4gMCwgYnVmLCBwb3MgKyBvZmYxKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4cG9uZW50ID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWwpIC8gTWF0aC5MTjIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChleHBvbmVudCA9PT0gMTAyNClcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb25lbnQgPSAxMDIzO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hbnRpc3NhID0gdmFsICogTWF0aC5wb3coMiwgLWV4cG9uZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB3cml0ZVVpbnQobWFudGlzc2EgKiA0NTAzNTk5NjI3MzcwNDk2ID4+PiAwLCBidWYsIHBvcyArIG9mZjApO1xyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlVWludCgoc2lnbiA8PCAzMSB8IGV4cG9uZW50ICsgMTAyMyA8PCAyMCB8IG1hbnRpc3NhICogMTA0ODU3NiAmIDEwNDg1NzUpID4+PiAwLCBidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHBvcnRzLndyaXRlRG91YmxlTEUgPSB3cml0ZURvdWJsZV9pZWVlNzU0LmJpbmQobnVsbCwgd3JpdGVVaW50TEUsIDAsIDQpO1xyXG4gICAgICAgIGV4cG9ydHMud3JpdGVEb3VibGVCRSA9IHdyaXRlRG91YmxlX2llZWU3NTQuYmluZChudWxsLCB3cml0ZVVpbnRCRSwgNCwgMCk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWREb3VibGVfaWVlZTc1NChyZWFkVWludCwgb2ZmMCwgb2ZmMSwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgdmFyIGxvID0gcmVhZFVpbnQoYnVmLCBwb3MgKyBvZmYwKSxcclxuICAgICAgICAgICAgICAgIGhpID0gcmVhZFVpbnQoYnVmLCBwb3MgKyBvZmYxKTtcclxuICAgICAgICAgICAgdmFyIHNpZ24gPSAoaGkgPj4gMzEpICogMiArIDEsXHJcbiAgICAgICAgICAgICAgICBleHBvbmVudCA9IGhpID4+PiAyMCAmIDIwNDcsXHJcbiAgICAgICAgICAgICAgICBtYW50aXNzYSA9IDQyOTQ5NjcyOTYgKiAoaGkgJiAxMDQ4NTc1KSArIGxvO1xyXG4gICAgICAgICAgICByZXR1cm4gZXhwb25lbnQgPT09IDIwNDdcclxuICAgICAgICAgICAgICAgID8gbWFudGlzc2FcclxuICAgICAgICAgICAgICAgID8gTmFOXHJcbiAgICAgICAgICAgICAgICA6IHNpZ24gKiBJbmZpbml0eVxyXG4gICAgICAgICAgICAgICAgOiBleHBvbmVudCA9PT0gMCAvLyBkZW5vcm1hbFxyXG4gICAgICAgICAgICAgICAgPyBzaWduICogNWUtMzI0ICogbWFudGlzc2FcclxuICAgICAgICAgICAgICAgIDogc2lnbiAqIE1hdGgucG93KDIsIGV4cG9uZW50IC0gMTA3NSkgKiAobWFudGlzc2EgKyA0NTAzNTk5NjI3MzcwNDk2KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4cG9ydHMucmVhZERvdWJsZUxFID0gcmVhZERvdWJsZV9pZWVlNzU0LmJpbmQobnVsbCwgcmVhZFVpbnRMRSwgMCwgNCk7XHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRG91YmxlQkUgPSByZWFkRG91YmxlX2llZWU3NTQuYmluZChudWxsLCByZWFkVWludEJFLCA0LCAwKTtcclxuXHJcbiAgICB9KSgpO1xyXG5cclxuICAgIHJldHVybiBleHBvcnRzO1xyXG59XHJcblxyXG4vLyB1aW50IGhlbHBlcnNcclxuXHJcbmZ1bmN0aW9uIHdyaXRlVWludExFKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIGJ1Zltwb3MgICAgXSA9ICB2YWwgICAgICAgICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDFdID0gIHZhbCA+Pj4gOCAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgMl0gPSAgdmFsID4+PiAxNiAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAzXSA9ICB2YWwgPj4+IDI0O1xyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZVVpbnRCRSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICBidWZbcG9zICAgIF0gPSAgdmFsID4+PiAyNDtcclxuICAgIGJ1Zltwb3MgKyAxXSA9ICB2YWwgPj4+IDE2ICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDJdID0gIHZhbCA+Pj4gOCAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgM10gPSAgdmFsICAgICAgICAmIDI1NTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZFVpbnRMRShidWYsIHBvcykge1xyXG4gICAgcmV0dXJuIChidWZbcG9zICAgIF1cclxuICAgICAgICAgIHwgYnVmW3BvcyArIDFdIDw8IDhcclxuICAgICAgICAgIHwgYnVmW3BvcyArIDJdIDw8IDE2XHJcbiAgICAgICAgICB8IGJ1Zltwb3MgKyAzXSA8PCAyNCkgPj4+IDA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRVaW50QkUoYnVmLCBwb3MpIHtcclxuICAgIHJldHVybiAoYnVmW3BvcyAgICBdIDw8IDI0XHJcbiAgICAgICAgICB8IGJ1Zltwb3MgKyAxXSA8PCAxNlxyXG4gICAgICAgICAgfCBidWZbcG9zICsgMl0gPDwgOFxyXG4gICAgICAgICAgfCBidWZbcG9zICsgM10pID4+PiAwO1xyXG59XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IGlucXVpcmU7XHJcblxyXG4vKipcclxuICogUmVxdWlyZXMgYSBtb2R1bGUgb25seSBpZiBhdmFpbGFibGUuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtb2R1bGVOYW1lIE1vZHVsZSB0byByZXF1aXJlXHJcbiAqIEByZXR1cm5zIHs/T2JqZWN0fSBSZXF1aXJlZCBtb2R1bGUgaWYgYXZhaWxhYmxlIGFuZCBub3QgZW1wdHksIG90aGVyd2lzZSBgbnVsbGBcclxuICovXHJcbmZ1bmN0aW9uIGlucXVpcmUobW9kdWxlTmFtZSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgbW9kID0gZXZhbChcInF1aXJlXCIucmVwbGFjZSgvXi8sXCJyZVwiKSkobW9kdWxlTmFtZSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZXZhbFxyXG4gICAgICAgIGlmIChtb2QgJiYgKG1vZC5sZW5ndGggfHwgT2JqZWN0LmtleXMobW9kKS5sZW5ndGgpKVxyXG4gICAgICAgICAgICByZXR1cm4gbW9kO1xyXG4gICAgfSBjYXRjaCAoZSkge30gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lbXB0eVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gcG9vbDtcclxuXHJcbi8qKlxyXG4gKiBBbiBhbGxvY2F0b3IgYXMgdXNlZCBieSB7QGxpbmsgdXRpbC5wb29sfS5cclxuICogQHR5cGVkZWYgUG9vbEFsbG9jYXRvclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzaXplIEJ1ZmZlciBzaXplXHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBCdWZmZXJcclxuICovXHJcblxyXG4vKipcclxuICogQSBzbGljZXIgYXMgdXNlZCBieSB7QGxpbmsgdXRpbC5wb29sfS5cclxuICogQHR5cGVkZWYgUG9vbFNsaWNlclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTdGFydCBvZmZzZXRcclxuICogQHBhcmFtIHtudW1iZXJ9IGVuZCBFbmQgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBCdWZmZXIgc2xpY2VcclxuICogQHRoaXMge1VpbnQ4QXJyYXl9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgZ2VuZXJhbCBwdXJwb3NlIGJ1ZmZlciBwb29sLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtQb29sQWxsb2NhdG9yfSBhbGxvYyBBbGxvY2F0b3JcclxuICogQHBhcmFtIHtQb29sU2xpY2VyfSBzbGljZSBTbGljZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IFtzaXplPTgxOTJdIFNsYWIgc2l6ZVxyXG4gKiBAcmV0dXJucyB7UG9vbEFsbG9jYXRvcn0gUG9vbGVkIGFsbG9jYXRvclxyXG4gKi9cclxuZnVuY3Rpb24gcG9vbChhbGxvYywgc2xpY2UsIHNpemUpIHtcclxuICAgIHZhciBTSVpFICAgPSBzaXplIHx8IDgxOTI7XHJcbiAgICB2YXIgTUFYICAgID0gU0laRSA+Pj4gMTtcclxuICAgIHZhciBzbGFiICAgPSBudWxsO1xyXG4gICAgdmFyIG9mZnNldCA9IFNJWkU7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gcG9vbF9hbGxvYyhzaXplKSB7XHJcbiAgICAgICAgaWYgKHNpemUgPCAxIHx8IHNpemUgPiBNQVgpXHJcbiAgICAgICAgICAgIHJldHVybiBhbGxvYyhzaXplKTtcclxuICAgICAgICBpZiAob2Zmc2V0ICsgc2l6ZSA+IFNJWkUpIHtcclxuICAgICAgICAgICAgc2xhYiA9IGFsbG9jKFNJWkUpO1xyXG4gICAgICAgICAgICBvZmZzZXQgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnVmID0gc2xpY2UuY2FsbChzbGFiLCBvZmZzZXQsIG9mZnNldCArPSBzaXplKTtcclxuICAgICAgICBpZiAob2Zmc2V0ICYgNykgLy8gYWxpZ24gdG8gMzIgYml0XHJcbiAgICAgICAgICAgIG9mZnNldCA9IChvZmZzZXQgfCA3KSArIDE7XHJcbiAgICAgICAgcmV0dXJuIGJ1ZjtcclxuICAgIH07XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQSBtaW5pbWFsIFVURjggaW1wbGVtZW50YXRpb24gZm9yIG51bWJlciBhcnJheXMuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBuYW1lc3BhY2VcclxuICovXHJcbnZhciB1dGY4ID0gZXhwb3J0cztcclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBVVEY4IGJ5dGUgbGVuZ3RoIG9mIGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFN0cmluZ1xyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBCeXRlIGxlbmd0aFxyXG4gKi9cclxudXRmOC5sZW5ndGggPSBmdW5jdGlvbiB1dGY4X2xlbmd0aChzdHJpbmcpIHtcclxuICAgIHZhciBsZW4gPSAwLFxyXG4gICAgICAgIGMgPSAwO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICBjID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XHJcbiAgICAgICAgaWYgKGMgPCAxMjgpXHJcbiAgICAgICAgICAgIGxlbiArPSAxO1xyXG4gICAgICAgIGVsc2UgaWYgKGMgPCAyMDQ4KVxyXG4gICAgICAgICAgICBsZW4gKz0gMjtcclxuICAgICAgICBlbHNlIGlmICgoYyAmIDB4RkMwMCkgPT09IDB4RDgwMCAmJiAoc3RyaW5nLmNoYXJDb2RlQXQoaSArIDEpICYgMHhGQzAwKSA9PT0gMHhEQzAwKSB7XHJcbiAgICAgICAgICAgICsraTtcclxuICAgICAgICAgICAgbGVuICs9IDQ7XHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIGxlbiArPSAzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGxlbjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBVVEY4IGJ5dGVzIGFzIGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTb3VyY2Ugc3RhcnRcclxuICogQHBhcmFtIHtudW1iZXJ9IGVuZCBTb3VyY2UgZW5kXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFN0cmluZyByZWFkXHJcbiAqL1xyXG51dGY4LnJlYWQgPSBmdW5jdGlvbiB1dGY4X3JlYWQoYnVmZmVyLCBzdGFydCwgZW5kKSB7XHJcbiAgICB2YXIgbGVuID0gZW5kIC0gc3RhcnQ7XHJcbiAgICBpZiAobGVuIDwgMSlcclxuICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgIHZhciBwYXJ0cyA9IG51bGwsXHJcbiAgICAgICAgY2h1bmsgPSBbXSxcclxuICAgICAgICBpID0gMCwgLy8gY2hhciBvZmZzZXRcclxuICAgICAgICB0OyAgICAgLy8gdGVtcG9yYXJ5XHJcbiAgICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcclxuICAgICAgICB0ID0gYnVmZmVyW3N0YXJ0KytdO1xyXG4gICAgICAgIGlmICh0IDwgMTI4KVxyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gdDtcclxuICAgICAgICBlbHNlIGlmICh0ID4gMTkxICYmIHQgPCAyMjQpXHJcbiAgICAgICAgICAgIGNodW5rW2krK10gPSAodCAmIDMxKSA8PCA2IHwgYnVmZmVyW3N0YXJ0KytdICYgNjM7XHJcbiAgICAgICAgZWxzZSBpZiAodCA+IDIzOSAmJiB0IDwgMzY1KSB7XHJcbiAgICAgICAgICAgIHQgPSAoKHQgJiA3KSA8PCAxOCB8IChidWZmZXJbc3RhcnQrK10gJiA2MykgPDwgMTIgfCAoYnVmZmVyW3N0YXJ0KytdICYgNjMpIDw8IDYgfCBidWZmZXJbc3RhcnQrK10gJiA2MykgLSAweDEwMDAwO1xyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gMHhEODAwICsgKHQgPj4gMTApO1xyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gMHhEQzAwICsgKHQgJiAxMDIzKTtcclxuICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgY2h1bmtbaSsrXSA9ICh0ICYgMTUpIDw8IDEyIHwgKGJ1ZmZlcltzdGFydCsrXSAmIDYzKSA8PCA2IHwgYnVmZmVyW3N0YXJ0KytdICYgNjM7XHJcbiAgICAgICAgaWYgKGkgPiA4MTkxKSB7XHJcbiAgICAgICAgICAgIChwYXJ0cyB8fCAocGFydHMgPSBbXSkpLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rKSk7XHJcbiAgICAgICAgICAgIGkgPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChwYXJ0cykge1xyXG4gICAgICAgIGlmIChpKVxyXG4gICAgICAgICAgICBwYXJ0cy5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjaHVuay5zbGljZSgwLCBpKSkpO1xyXG4gICAgICAgIHJldHVybiBwYXJ0cy5qb2luKFwiXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjaHVuay5zbGljZSgwLCBpKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc3RyaW5nIGFzIFVURjggYnl0ZXMuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgU291cmNlIHN0cmluZ1xyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBEZXN0aW5hdGlvbiBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBEZXN0aW5hdGlvbiBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gQnl0ZXMgd3JpdHRlblxyXG4gKi9cclxudXRmOC53cml0ZSA9IGZ1bmN0aW9uIHV0Zjhfd3JpdGUoc3RyaW5nLCBidWZmZXIsIG9mZnNldCkge1xyXG4gICAgdmFyIHN0YXJ0ID0gb2Zmc2V0LFxyXG4gICAgICAgIGMxLCAvLyBjaGFyYWN0ZXIgMVxyXG4gICAgICAgIGMyOyAvLyBjaGFyYWN0ZXIgMlxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICBjMSA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xyXG4gICAgICAgIGlmIChjMSA8IDEyOCkge1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzE7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjMSA8IDIwNDgpIHtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDYgICAgICAgfCAxOTI7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSAgICAgICAmIDYzIHwgMTI4O1xyXG4gICAgICAgIH0gZWxzZSBpZiAoKGMxICYgMHhGQzAwKSA9PT0gMHhEODAwICYmICgoYzIgPSBzdHJpbmcuY2hhckNvZGVBdChpICsgMSkpICYgMHhGQzAwKSA9PT0gMHhEQzAwKSB7XHJcbiAgICAgICAgICAgIGMxID0gMHgxMDAwMCArICgoYzEgJiAweDAzRkYpIDw8IDEwKSArIChjMiAmIDB4MDNGRik7XHJcbiAgICAgICAgICAgICsraTtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDE4ICAgICAgfCAyNDA7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSA+PiAxMiAmIDYzIHwgMTI4O1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgPj4gNiAgJiA2MyB8IDEyODtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxICAgICAgICYgNjMgfCAxMjg7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDEyICAgICAgfCAyMjQ7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSA+PiA2ICAmIDYzIHwgMTI4O1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgICAgICAgJiA2MyB8IDEyODtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0IC0gc3RhcnQ7XHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRmaXJzdDogZmlyc3QsIFxuXHRhbGw6IGFsbCwgXG5cdGNsb3Nlc3Q6IGNsb3Nlc3QsXG5cdG5leHQ6IG5leHQsXG5cdHByZXY6IHByZXYsIFxuXHRhcHBlbmQ6IGFwcGVuZCxcblx0ZnJhZzogZnJhZ1xufTtcblxuXG4vLyBmb3IgRWRnZSwgc3RpbGwgZG8gbm90IHN1cHBvcnQgLm1hdGNoZXMgOihcbnZhciB0bXBFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG52YXIgbWF0Y2hlc0ZuID0gdG1wRWwubWF0Y2hlcyB8fCB0bXBFbC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgdG1wRWwubXNNYXRjaGVzU2VsZWN0b3I7XG5tb2R1bGUuZXhwb3J0cy5fbWF0Y2hlc0ZuID0gbWF0Y2hlc0ZuOyAvLyBtYWtlIGl0IGF2YWlsYWJsZSBmb3IgdGhpcyBtb2R1bGUgKHRoaXMgd2lsbCBiZSBpbnRlcm5hbCBvbmx5KVxuXG4vLyAtLS0tLS0tLS0gRE9NIFF1ZXJ5IFNob3J0Y3V0cyAtLS0tLS0tLS0gLy9cblxuLy8gU2hvcnRjdXQgZm9yIC5xdWVyeVNlbGVjdG9yXG4vLyByZXR1cm4gdGhlIGZpcnN0IGVsZW1lbnQgbWF0Y2hpbmcgdGhlIHNlbGVjdG9yIGZyb20gdGhpcyBlbCAob3IgZG9jdW1lbnQgaWYgZWwgaXMgbm90IGdpdmVuKVxuZnVuY3Rpb24gZmlyc3QoZWxfb3Jfc2VsZWN0b3IsIHNlbGVjdG9yKXtcblx0Ly8gV2UgZG8gbm90IGhhdmUgYSBzZWxlY3RvciBhdCBhbGwsIHRoZW4sIHRoaXMgY2FsbCBpcyBmb3IgZmlyc3RFbGVtZW50Q2hpbGRcblx0aWYgKCFzZWxlY3RvciAmJiB0eXBlb2YgZWxfb3Jfc2VsZWN0b3IgIT09IFwic3RyaW5nXCIpe1xuXHRcdHZhciBlbCA9IGVsX29yX3NlbGVjdG9yO1xuXHRcdC8vIHRyeSB0byBnZXQgXG5cdFx0dmFyIGZpcnN0RWxlbWVudENoaWxkID0gZWwuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cblx0XHQvLyBpZiBmaXJzdEVsZW1lbnRDaGlsZCBpcyBudWxsL3VuZGVmaW5lZCwgYnV0IHdlIGhhdmUgYSBmaXJzdENoaWxkLCBpdCBpcyBwZXJoYXBzIGJlY2F1c2Ugbm90IHN1cHBvcnRlZFxuXHRcdGlmICghZmlyc3RFbGVtZW50Q2hpbGQgJiYgZWwuZmlyc3RDaGlsZCl7XG5cblx0XHRcdC8vIElmIHRoZSBmaXJzdENoaWxkIGlzIG9mIHR5cGUgRWxlbWVudCwgcmV0dXJuIGl0LiBcblx0XHRcdGlmIChlbC5maXJzdENoaWxkLm5vZGVUeXBlID09PSAxICl7XG5cdFx0XHRcdHJldHVybiBlbC5maXJzdENoaWxkO1xuXHRcdFx0fVxuXHRcdFx0Ly8gT3RoZXJ3aXNlLCB0cnkgdG8gZmluZCB0aGUgbmV4dCBlbGVtZW50ICh1c2luZyB0aGUgbmV4dClcblx0XHRcdGVsc2V7XG5cdFx0XHRcdHJldHVybiBuZXh0KGVsLmZpcnN0Q2hpbGQpO1xuXHRcdFx0fVx0XHRcdFxuXHRcdH1cblxuXHRcdHJldHVybiBmaXJzdEVsZW1lbnRDaGlsZDtcblx0fVxuXHQvLyBvdGhlcndpc2UsIHRoZSBjYWxsIHdhcyBlaXRoZXIgKHNlbGVjdG9yKSBvciAoZWwsIHNlbGVjdG9yKSwgc28gZm93YXJkIHRvIHRoZSBxdWVyeVNlbGVjdG9yXG5cdGVsc2V7XG5cdFx0cmV0dXJuIF9leGVjUXVlcnlTZWxlY3RvcihmYWxzZSwgZWxfb3Jfc2VsZWN0b3IsIHNlbGVjdG9yKTtcdFxuXHR9XG5cdFxufVxuXG4vLyBTaG9ydGN1dCBmb3IgLnF1ZXJ5U2VsZWN0b3JBbGxcbi8vIHJldHVybiBhbiBub2RlTGlzdCBvZiBhbGwgb2YgdGhlIGVsZW1lbnRzIGVsZW1lbnQgbWF0Y2hpbmcgdGhlIHNlbGVjdG9yIGZyb20gdGhpcyBlbCAob3IgZG9jdW1lbnQgaWYgZWwgaXMgbm90IGdpdmVuKVxuZnVuY3Rpb24gYWxsKGVsLCBzZWxlY3Rvcil7XG5cdHJldHVybiBfZXhlY1F1ZXJ5U2VsZWN0b3IodHJ1ZSwgZWwsIHNlbGVjdG9yKTtcbn1cblxuLy8gcmV0dXJuIHRoZSBmaXJzdCBlbGVtZW50IG5leHQgdG8gdGhlIGVsIG1hdGNoaW5nIHRoZSBzZWxlY3RvclxuLy8gaWYgbm8gc2VsZWN0b3IsIHdpbGwgcmV0dXJuIHRoZSBuZXh0IEVsZW1lbnRcbi8vIHJldHVybiBudWxsIGlmIG5vdCBmb3VuZC5cbmZ1bmN0aW9uIG5leHQoZWwsIHNlbGVjdG9yKXtcblx0cmV0dXJuIF9zaWJsaW5nKHRydWUsIGVsLCBzZWxlY3Rvcik7XG59XG5cbi8vIGlmIG5vIHNlbGVjdG9yLCB3aWxsIHJldHVybiB0aGUgcHJldmlvdXMgRWxlbWVudFxuZnVuY3Rpb24gcHJldihlbCwgc2VsZWN0b3Ipe1xuXHRyZXR1cm4gX3NpYmxpbmcoZmFsc2UsIGVsLCBzZWxlY3Rvcik7XG59XG5cbi8vIHJldHVybiB0aGUgZWxlbWVudCBjbG9zZXN0IGluIHRoZSBoaWVyYXJjaHkgKHVwKSwgaW5jbHVkaW5nIHRoaXMgZWwsIG1hdGNoaW5nIHRoaXMgc2VsZWN0b3Jcbi8vIHJldHVybiBudWxsIGlmIG5vdCBmb3VuZFxuZnVuY3Rpb24gY2xvc2VzdChlbCwgc2VsZWN0b3Ipe1xuXHR2YXIgdG1wRWwgPSBlbDtcblx0XG5cdC8vIHVzZSBcIiE9XCIgZm9yIG51bGwgYW5kIHVuZGVmaW5lZFxuXHR3aGlsZSAodG1wRWwgIT0gbnVsbCAmJiB0bXBFbCAhPT0gZG9jdW1lbnQpe1xuXHRcdGlmIChtYXRjaGVzRm4uY2FsbCh0bXBFbCxzZWxlY3Rvcikpe1xuXHRcdFx0cmV0dXJuIHRtcEVsO1xuXHRcdH1cblx0XHR0bXBFbCA9IHRtcEVsLnBhcmVudEVsZW1lbnQ7XHRcdFxuXHR9XG5cdHJldHVybiBudWxsO1xufVxuXG4vLyAtLS0tLS0tLS0gL0RPTSBRdWVyeSBTaG9ydGN1dHMgLS0tLS0tLS0tIC8vXG5cblxuLy8gLS0tLS0tLS0tIERPTSBIZWxwZXJzIC0tLS0tLS0tLSAvL1xuZnVuY3Rpb24gYXBwZW5kKHJlZkVsLCBuZXdFbCwgcG9zaXRpb24pe1xuXHR2YXIgcGFyZW50RWwsIG5leHRTaWJsaW5nID0gbnVsbDtcblx0XG5cdC8vIGRlZmF1bHQgaXMgXCJsYXN0XCJcblx0cG9zaXRpb24gPSAocG9zaXRpb24pP3Bvc2l0aW9uOlwibGFzdFwiO1xuXG5cdC8vLy8gMSkgV2UgZGV0ZXJtaW5lIHRoZSBwYXJlbnRFbFxuXHRpZiAocG9zaXRpb24gPT09IFwibGFzdFwiIHx8IHBvc2l0aW9uID09PSBcImZpcnN0XCIgIHx8IHBvc2l0aW9uID09PSBcImVtcHR5XCIpe1xuXHRcdHBhcmVudEVsID0gcmVmRWw7XG5cdH1lbHNlIGlmIChwb3NpdGlvbiA9PT0gXCJiZWZvcmVcIiB8fCBwb3NpdGlvbiA9PT0gXCJhZnRlclwiKXtcblx0XHRwYXJlbnRFbCA9IHJlZkVsLnBhcmVudE5vZGU7XG5cdFx0aWYgKCFwYXJlbnRFbCl7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJtdmRvbSBFUlJPUiAtIFRoZSByZWZlcmVuY2VFbGVtZW50IFwiICsgcmVmRWwgKyBcIiBkb2VzIG5vdCBoYXZlIGEgcGFyZW50Tm9kZS4gQ2Fubm90IGluc2VydCBcIiArIHBvc2l0aW9uKTtcblx0XHR9XG5cdH1cblxuXHQvLy8vIDIpIFdlIGRldGVybWluZSBpZiB3ZSBoYXZlIGEgbmV4dFNpYmxpbmcgb3Igbm90XG5cdC8vIGlmIFwiZmlyc3RcIiwgd2UgdHJ5IHRvIHNlZSBpZiB0aGVyZSBpcyBhIGZpcnN0IGNoaWxkXG5cdGlmIChwb3NpdGlvbiA9PT0gXCJmaXJzdFwiKXtcblx0XHRuZXh0U2libGluZyA9IGZpcnN0KHJlZkVsKTsgLy8gaWYgdGhpcyBpcyBudWxsLCB0aGVuLCBpdCB3aWxsIGp1c3QgZG8gYW4gYXBwZW5kQ2hpbGRcblx0XHQvLyBOb3RlOiB0aGlzIG1pZ2h0IGJlIGEgdGV4dCBub2RlIGJ1dCB0aGlzIGlzIGZpbmUgaW4gdGhpcyBjb250ZXh0LlxuXHR9XG5cdC8vIGlmIFwiYmVmb3JlXCIsIHRoZW4sIHRoZSByZWZFbCBpcyB0aGUgbmV4dFNpYmxpbmdcblx0ZWxzZSBpZiAocG9zaXRpb24gPT09IFwiYmVmb3JlXCIpe1xuXHRcdG5leHRTaWJsaW5nID0gcmVmRWw7XG5cdH1cblx0Ly8gaWYgXCJhZnRlclwiLCB0cnkgdG8gZmluZCB0aGUgbmV4dCBTaWJsaW5nIChpZiBub3QgZm91bmQsIGl0IHdpbGwgYmUganVzdCBhIGFwcGVuZENoaWxkIHRvIGFkZCBsYXN0KVxuXHRlbHNlIGlmIChwb3NpdGlvbiA9PT0gXCJhZnRlclwiKXtcblx0XHRuZXh0U2libGluZyA9IG5leHQocmVmRWwpO1xuXHR9XG5cblx0Ly8vLyAzKSBXZSBhcHBlbmQgdGhlIG5ld0VsXG5cdC8vIGlmIHdlIGhhdmUgYSBuZXh0IHNpYmxpbmcsIHdlIGluc2VydCBpdCBiZWZvcmVcblx0aWYgKG5leHRTaWJsaW5nKXtcblx0XHRwYXJlbnRFbC5pbnNlcnRCZWZvcmUobmV3RWwsIG5leHRTaWJsaW5nKTtcblx0fVxuXHQvLyBvdGhlcndpc2UsIHdlIGp1c3QgZG8gYSBhcHBlbmQgbGFzdFxuXHRlbHNle1xuXHRcdGlmIChwb3NpdGlvbiA9PT0gXCJlbXB0eVwiKXtcblx0XHRcdC8vIFRPRE86IENJUkNVTEFSIGRlcGVuZGVuY3kuIFJpZ2h0IG5vdywgd2UgZG8gbmVlZCB0byBjYWxsIHRoZSB2aWV3LmVtcHR5IHRvIGRvIHRoZSBjb3JyZWN0IGVtcHR5LCBidXQgdmlldyBhbHNvIHVzZSBkb20uanNcblx0XHRcdC8vICAgICAgIFRoaXMgd29ya3MgcmlnaHQgbm93IGFzIGFsbCB0aGUgbW9kdWxlcyBnZXQgbWVyZ2VkIGludG8gdGhlIHNhbWUgb2JqZWN0LCBidXQgd291bGQgYmUgZ29vZCB0byBmaW5kIGEgbW9yZSBlbGVnYW50IHNvbHV0aW9uXG5cdFx0XHR0aGlzLmVtcHR5KHJlZkVsKTtcblx0XHR9XG5cdFx0cGFyZW50RWwuYXBwZW5kQ2hpbGQobmV3RWwpO1xuXHR9XG5cblx0cmV0dXJuIG5ld0VsO1x0XG59XG5cblxuZnVuY3Rpb24gZnJhZyhodG1sKXtcblx0Ly8gbWFrZSBpdCBudWxsIHByb29mXG5cdGh0bWwgPSAoaHRtbCk/aHRtbC50cmltKCk6bnVsbDtcblx0aWYgKCFodG1sKXtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcblx0aWYodGVtcGxhdGUuY29udGVudCl7XG5cdFx0dGVtcGxhdGUuaW5uZXJIVE1MID0gaHRtbDtcblx0XHRyZXR1cm4gdGVtcGxhdGUuY29udGVudDtcblx0fVxuXHQvLyBmb3IgSUUgMTFcblx0ZWxzZXtcblx0XHR2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHR2YXIgdG1wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHR0bXAuaW5uZXJIVE1MID0gaHRtbDtcblx0XHR3aGlsZSAodG1wLmZpcnN0Q2hpbGQpIHtcblx0XHRcdGZyYWcuYXBwZW5kQ2hpbGQodG1wLmZpcnN0Q2hpbGQpO1xuXHRcdH1cblx0XHRyZXR1cm4gZnJhZztcblxuXHR9XHRcbn1cbi8vIC0tLS0tLS0tLSAvRE9NIEhlbHBlcnMgLS0tLS0tLS0tIC8vXG5cblxuXG5cbmZ1bmN0aW9uIF9zaWJsaW5nKG5leHQsIGVsLCBzZWxlY3Rvcil7XG5cdHZhciBzaWJsaW5nID0gKG5leHQpP1wibmV4dFNpYmxpbmdcIjpcInByZXZpb3VzU2libGluZ1wiO1xuXG5cdHZhciB0bXBFbCA9IChlbCk/ZWxbc2libGluZ106bnVsbDtcblxuXHQvLyB1c2UgXCIhPVwiIGZvciBudWxsIGFuZCB1bmRlZmluZWRcblx0d2hpbGUgKHRtcEVsICE9IG51bGwgJiYgdG1wRWwgIT09IGRvY3VtZW50KXtcblx0XHQvLyBvbmx5IGlmIG5vZGUgdHlwZSBpcyBvZiBFbGVtZW50LCBvdGhlcndpc2UsIFxuXHRcdGlmICh0bXBFbC5ub2RlVHlwZSA9PT0gMSAmJiAoIXNlbGVjdG9yIHx8IG1hdGNoZXNGbi5jYWxsKHRtcEVsLCBzZWxlY3RvcikpKXtcblx0XHRcdHJldHVybiB0bXBFbDtcblx0XHR9XG5cdFx0dG1wRWwgPSB0bXBFbFtzaWJsaW5nXTtcblx0fVxuXHRyZXR1cm4gbnVsbDtcbn1cblxuXG4vLyB1dGlsOiBxdWVyeVNlbGVjdG9yW0FsbF0gd3JhcHBlclxuZnVuY3Rpb24gX2V4ZWNRdWVyeVNlbGVjdG9yKGFsbCwgZWwsIHNlbGVjdG9yKXtcblx0Ly8gaWYgZWwgaXMgbnVsbCBvciB1bmRlZmluZWQsIG1lYW5zIHdlIHJldHVybiBub3RoaW5nLiBcblx0aWYgKHR5cGVvZiBlbCA9PT0gXCJ1bmRlZmluZWRcIiB8fCBlbCA9PT0gbnVsbCl7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblx0Ly8gaWYgc2VsZWN0b3IgaXMgdW5kZWZpbmVkLCBpdCBtZWFucyB3ZSBzZWxlY3QgZnJvbSBkb2N1bWVudCBhbmQgZWwgaXMgdGhlIGRvY3VtZW50XG5cdGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09IFwidW5kZWZpbmVkXCIpe1xuXHRcdHNlbGVjdG9yID0gZWw7XG5cdFx0ZWwgPSBkb2N1bWVudDtcdFx0XG5cdH1cblx0cmV0dXJuIChhbGwpP2VsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpOmVsLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xufVxuIiwiXG52YXIgZG9tID0gcmVxdWlyZShcIi4vZG9tLmpzXCIpO1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRwdWxsOiBwdWxsLCBcblx0cHVzaDogcHVzaCwgXG5cdHB1bGxlcjogcHVsbGVyLCBcblx0cHVzaGVyOiBwdXNoZXJcbn07XG5cbnZhciBfcHVzaGVycyA9IFtcblxuXHRbXCJpbnB1dFt0eXBlPSdjaGVja2JveCddLCBpbnB1dFt0eXBlPSdyYWRpbyddXCIsIGZ1bmN0aW9uKHZhbHVlKXtcblx0XHR2YXIgaXB0VmFsdWUgPSB0aGlzLnZhbHVlIHx8IFwib25cIjsgLy8gYXMgc29tZSBicm93c2VycyBkZWZhdWx0IHRvIHRoaXNcblxuXHRcdC8vIGlmIHRoZSB2YWx1ZSBpcyBhbiBhcnJheSwgaXQgbmVlZCB0byBtYXRjaCB0aGlzIGlwdFZhbHVlXG5cdFx0aWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpe1xuXHRcdFx0aWYgKHZhbHVlLmluZGV4T2YoaXB0VmFsdWUpID4gLTEpe1xuXHRcdFx0XHR0aGlzLmNoZWNrZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBvdGhlcndpc2UsIGlmIHZhbHVlIGlzIG5vdCBhbiBhcnJheSxcblx0XHRlbHNlIGlmICgoaXB0VmFsdWUgPT09IFwib25cIiAmJiB2YWx1ZSkgfHwgaXB0VmFsdWUgPT09IHZhbHVlKXtcblx0XHRcdHRoaXMuY2hlY2tlZCA9IHRydWU7XG5cdFx0fVxuXHR9XSxcblxuXHRbXCJpbnB1dFwiLCBmdW5jdGlvbih2YWx1ZSl7XG5cdFx0aWYodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB0aGlzLnZhbHVlID0gdmFsdWU7XG5cdH1dLFxuXG5cdFtcInNlbGVjdFwiLCBmdW5jdGlvbih2YWx1ZSl7XG5cdFx0aWYodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB0aGlzLnZhbHVlID0gdmFsdWU7XG5cdH1dLFxuXG5cdFtcInRleHRhcmVhXCIsIGZ1bmN0aW9uKHZhbHVlKXtcblx0XHRpZih0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHRoaXMudmFsdWUgPSB2YWx1ZTtcblx0fV0sXG5cblx0W1wiKlwiLCBmdW5jdGlvbih2YWx1ZSl7XG5cdFx0aWYodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB0aGlzLmlubmVySFRNTCA9IHZhbHVlO1xuXHR9XVxuXTtcblxudmFyIF9wdWxsZXJzID0gW1xuXHRbXCJpbnB1dFt0eXBlPSdjaGVja2JveCddLCBpbnB1dFt0eXBlPSdyYWRpbyddXCIsIGZ1bmN0aW9uKGV4aXN0aW5nVmFsdWUpe1xuXG5cdFx0dmFyIGlwdFZhbHVlID0gdGhpcy52YWx1ZSB8fCBcIm9uXCI7IC8vIGFzIHNvbWUgYnJvd3NlciBkZWZhdWx0IHRvIHRoaXNcblx0XHR2YXIgbmV3VmFsdWU7XG5cdFx0aWYgKHRoaXMuY2hlY2tlZCl7XG5cdFx0XHQvLyBjaGFuZ2UgXCJvblwiIGJ5IHRydWUgdmFsdWUgKHdoaWNoIHVzdWFsbHkgd2hhdCB3ZSB3YW50IHRvIGhhdmUpXG5cdFx0XHQvLyBUT0RPOiBXZSBzaG91bGQgdGVzdCB0aGUgYXR0cmlidXRlIFwidmFsdWVcIiB0byBhbGxvdyBcIm9uXCIgaWYgaXQgaXMgZGVmaW5lZFxuXHRcdFx0bmV3VmFsdWUgPSAoaXB0VmFsdWUgJiYgaXB0VmFsdWUgIT09IFwib25cIik/aXB0VmFsdWU6dHJ1ZTtcblx0XHRcdGlmICh0eXBlb2YgZXhpc3RpbmdWYWx1ZSAhPT0gXCJ1bmRlZmluZWRcIil7XG5cdFx0XHRcdC8vIGlmIHdlIGhhdmUgYW4gZXhpc3RpbmdWYWx1ZSBmb3IgdGhpcyBwcm9wZXJ0eSwgd2UgY3JlYXRlIGFuIGFycmF5XG5cdFx0XHRcdHZhciB2YWx1ZXMgPSB1dGlscy5hc0FycmF5KGV4aXN0aW5nVmFsdWUpO1xuXHRcdFx0XHR2YWx1ZXMucHVzaChuZXdWYWx1ZSk7XG5cdFx0XHRcdG5ld1ZhbHVlID0gdmFsdWVzO1xuXHRcdFx0fVx0XHRcdFx0XG5cdFx0fVxuXHRcdHJldHVybiBuZXdWYWx1ZTtcblx0fV0sXG5cblx0W1wiaW5wdXQsIHNlbGVjdFwiLCBmdW5jdGlvbihleGlzdGluZ1ZhbHVlKXtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZTtcblx0fV0sXG5cblx0W1widGV4dGFyZWFcIiwgZnVuY3Rpb24oZXhpc3RpbmdWYWx1ZSl7XG5cdFx0cmV0dXJuIHRoaXMudmFsdWU7XG5cdH1dLFxuXG5cdFtcIipcIiwgZnVuY3Rpb24oZXhpc3RpbmdWYWx1ZSl7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXJIVE1MO1xuXHR9XVxuXTtcblxuZnVuY3Rpb24gcHVzaGVyKHNlbGVjdG9yLGZ1bmMpe1xuXHRfcHVzaGVycy51bnNoaWZ0KFtzZWxlY3RvcixmdW5jXSk7XG59XG5cbmZ1bmN0aW9uIHB1bGxlcihzZWxlY3RvcixmdW5jKXtcblx0X3B1bGxlcnMudW5zaGlmdChbc2VsZWN0b3IsZnVuY10pO1xufVxuXG5mdW5jdGlvbiBwdXNoKGVsLCBzZWxlY3Rvcl9vcl9kYXRhLCBkYXRhKSB7XG5cdHZhciBzZWxlY3RvcjtcblxuXHQvLyBpZiBkYXRhIGlzIG51bGwgb3IgdW5kZWZpbmVkXG5cdGlmIChkYXRhID09IG51bGwpe1xuXHRcdHNlbGVjdG9yID0gXCIuZHhcIjtcblx0XHRkYXRhID0gc2VsZWN0b3Jfb3JfZGF0YTtcblx0fWVsc2V7XG5cdFx0c2VsZWN0b3IgPSBzZWxlY3Rvcl9vcl9kYXRhO1xuXHR9XG5cblx0dmFyIGR4RWxzID0gZG9tLmFsbChlbCwgc2VsZWN0b3IpO1xuXG5cdHV0aWxzLmFzQXJyYXkoZHhFbHMpLmZvckVhY2goZnVuY3Rpb24oZHhFbCl7XG5cdFx0XG5cdFx0dmFyIHByb3BQYXRoID0gZ2V0UHJvcFBhdGgoZHhFbCk7XG5cdFx0dmFyIHZhbHVlID0gdXRpbHMudmFsKGRhdGEscHJvcFBhdGgpO1xuXHRcdHZhciBpID0gMCwgcHVzaGVyU2VsZWN0b3IsIGZ1biwgbCA9IF9wdXNoZXJzLmxlbmd0aDtcblx0XHRmb3IgKDsgaTxsIDsgaSsrKXtcblx0XHRcdHB1c2hlclNlbGVjdG9yID0gX3B1c2hlcnNbaV1bMF07XG5cdFx0XHRpZiAoZG9tLl9tYXRjaGVzRm4uY2FsbChkeEVsLHB1c2hlclNlbGVjdG9yKSl7XG5cdFx0XHRcdGZ1biA9IF9wdXNoZXJzW2ldWzFdO1xuXHRcdFx0XHRmdW4uY2FsbChkeEVsLHZhbHVlKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVx0XHRcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHB1bGwoZWwsIHNlbGVjdG9yKXtcblx0dmFyIG9iaiA9IHt9O1xuXG5cdHNlbGVjdG9yID0gKHNlbGVjdG9yKT9zZWxlY3RvcjpcIi5keFwiO1xuXG5cdHZhciBkeEVscyA9IGRvbS5hbGwoZWwsIHNlbGVjdG9yKTtcblxuXHR1dGlscy5hc0FycmF5KGR4RWxzKS5mb3JFYWNoKGZ1bmN0aW9uKGR4RWwpe1xuXHRcdHZhciBwcm9wUGF0aCA9IGdldFByb3BQYXRoKGR4RWwpO1xuXHRcdHZhciBpID0gMCwgcHVsbGVyU2VsZWN0b3IsIGZ1biwgbCA9IF9wdWxsZXJzLmxlbmd0aDtcdFx0XG5cdFx0Zm9yICg7IGk8bCA7IGkrKyl7XG5cdFx0XHRwdWxsZXJTZWxlY3RvciA9IF9wdWxsZXJzW2ldWzBdO1xuXHRcdFx0aWYgKGRvbS5fbWF0Y2hlc0ZuLmNhbGwoZHhFbCxwdWxsZXJTZWxlY3Rvcikpe1xuXHRcdFx0XHRmdW4gPSBfcHVsbGVyc1tpXVsxXTtcblx0XHRcdFx0dmFyIGV4aXN0aW5nVmFsdWUgPSB1dGlscy52YWwob2JqLHByb3BQYXRoKTtcblx0XHRcdFx0dmFyIHZhbHVlID0gZnVuLmNhbGwoZHhFbCxleGlzdGluZ1ZhbHVlKTtcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIil7XG5cdFx0XHRcdFx0dXRpbHMudmFsKG9iaixwcm9wUGF0aCx2YWx1ZSk7XHRcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cdFx0XHRcdFx0XG5cdFx0fVx0XHRcblx0fSk7XG5cblx0cmV0dXJuIG9iajtcbn1cblxuLyoqIFxuICogUmV0dXJuIHRoZSB2YXJpYWJsZSBwYXRoIG9mIHRoZSBmaXJzdCBkeC0uIFwiLVwiIGlzIGNoYW5nZWQgdG8gXCIuXCJcbiAqIFxuICogQHBhcmFtIGNsYXNzQXR0cjogbGlrZSBcInJvdyBkeCBkeC1jb250YWN0Lm5hbWVcIlxuICogQHJldHVybnM6IHdpbGwgcmV0dXJuIFwiY29udGFjdC5uYW1lXCJcbiAqKi9cbmZ1bmN0aW9uIGdldFByb3BQYXRoKGR4RWwpe1xuXHR2YXIgcGF0aCA9IG51bGw7XG5cdHZhciBpID0wLCBjbGFzc2VzID0gZHhFbC5jbGFzc0xpc3QsIGwgPSBkeEVsLmNsYXNzTGlzdC5sZW5ndGgsIG5hbWU7XG5cdGZvciAoOyBpIDwgbDsgaSsrKXtcblx0XHRuYW1lID0gY2xhc3Nlc1tpXTtcblx0XHRpZiAobmFtZS5pbmRleE9mKFwiZHgtXCIpID09PSAwKXtcblx0XHRcdHBhdGggPSBuYW1lLnNwbGl0KFwiLVwiKS5zbGljZSgxKS5qb2luKFwiLlwiKTtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fVxuXHQvLyBpZiB3ZSBkbyBub3QgaGF2ZSBhIHBhdGggaW4gdGhlIGNzcywgdHJ5IHRoZSBkYXRhLWR4IGF0dHJpYnV0ZVxuXHRpZiAoIXBhdGgpe1xuXHRcdHBhdGggPSBkeEVsLmdldEF0dHJpYnV0ZShcImRhdGEtZHhcIik7XG5cdH1cblx0aWYgKCFwYXRoKXtcblx0XHRwYXRoID0gZHhFbC5nZXRBdHRyaWJ1dGUoXCJuYW1lXCIpOyAvLyBsYXN0IGZhbGwgYmFjaywgYXNzdW1lIGlucHV0IGZpZWxkXG5cdH1cblx0cmV0dXJuIHBhdGg7XG59XG5cblxuXG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcbnZhciBkb20gPSByZXF1aXJlKFwiLi9kb20uanNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRvbjogb24sXG5cdG9mZjogb2ZmLFxuXHR0cmlnZ2VyOiB0cmlnZ2VyXG59O1xuXG4vLyAtLS0tLS0tLS0gTW9kdWxlIEFQSXMgLS0tLS0tLS0tIC8vXG5cbi8vIGJpbmQgYSBldmVudCBjYW4gYmUgY2FsbCB3aXRoIFxuLy8gLSBlbHM6IHNpbmdsZSBvciBhcnJheSBvZiB0aGUgYmFzZSBkb20gZWxlbWVudHMgdG8gYmluZCB0aGUgZXZlbnQgbGlzdGVuZXIgdXBvbi5cbi8vIC0gdHlwZTogZXZlbnQgdHlwZSAobGlrZSAnY2xpY2snIG9yIGNhbiBiZSBjdXN0b20gZXZlbnQpLlxuLy8gLSBzZWxlY3RvcjogKG9wdGlvbmFsKSBxdWVyeSBzZWxlY3RvciB3aGljaCB3aWxsIGJlIHRlc3RlZCBvbiB0aGUgdGFyZ2V0IGVsZW1lbnQuIFxuLy8gLSBsaXN0ZW5lcjogZnVuY3Rpb24gd2hpY2ggd2lsbCBnZXQgdGhlIFwiZXZlbnRcIiBhcyBmaXJzdCBwYXJhbWV0ZXJcbi8vIC0gb3B0czogKG9wdGlvbmFsKSB7bnMsY3R4fSBvcHRpb25hbCBuYW1lc3BhY2UgYW5kIGN0eCAoaS5lLiB0aGlzKVxuZnVuY3Rpb24gb24oZWxzLCB0eXBlcywgc2VsZWN0b3IsIGxpc3RlbmVyLCBvcHRzKXtcblxuXHQvLyBpZiB0aGUgXCJzZWxlY3RvclwiIGlzIGEgZnVuY3Rpb24sIHRoZW4sIGl0IGlzIHRoZSBsaXN0ZW5lciBhbmQgdGhlcmUgaXMgbm8gc2VsZWN0b3Jcblx0aWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgRnVuY3Rpb24pe1xuXHRcdGxpc3RlbmVyID0gc2VsZWN0b3I7XG5cdFx0c2VsZWN0b3IgPSBudWxsO1xuXHRcdG9wdHMgPSBsaXN0ZW5lcjtcblx0fVxuXG5cdHR5cGVzID0gdXRpbHMuc3BsaXRBbmRUcmltKHR5cGVzLCBcIixcIik7XG5cblx0dHlwZXMuZm9yRWFjaChmdW5jdGlvbih0eXBlKXtcblx0XHR2YXIgdHlwZVNlbGVjdG9yS2V5ID0gYnVpbGRUeXBlU2VsZWN0b3JLZXkodHlwZSwgc2VsZWN0b3IpO1xuXG5cdFx0dXRpbHMuYXNBcnJheShlbHMpLmZvckVhY2goZnVuY3Rpb24oZWwpe1xuXG5cdFx0XHQvLyBUaGlzIHdpbGwgdGhlIGxpc3RlbmVyIHVzZSBmb3IgdGhlIGV2ZW4gbGlzdGVuZXIsIHdoaWNoIG1pZ2h0IGRpZmZlclxuXHRcdFx0Ly8gZnJvbSB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gcGFzc2VkIGluIGNhc2Ugb2YgYSBzZWxlY3RvclxuXHRcdFx0dmFyIF9saXN0ZW5lciA9IGxpc3RlbmVyOyBcblxuXHRcdFx0Ly8gaWYgd2UgaGF2ZSBhIHNlbGVjdG9yLCBjcmVhdGUgdGhlIHdyYXBwZXIgbGlzdGVuZXIgdG8gZG8gdGhlIG1hdGNoZXMgb24gdGhlIHNlbGVjdG9yXG5cdFx0XHRpZiAoc2VsZWN0b3Ipe1xuXHRcdFx0XHRfbGlzdGVuZXIgPSBmdW5jdGlvbihldnQpe1xuXHRcdFx0XHRcdHZhciB0Z3QgPSBudWxsO1xuXHRcdFx0XHRcdHZhciB0YXJnZXQgPSBldnQudGFyZ2V0O1xuXHRcdFx0XHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZXZ0LmN1cnJlbnRUYXJnZXQ7XG5cdFx0XHRcdFx0dmFyIGN0eCA9IChvcHRzKT9vcHRzLmN0eDpudWxsO1xuXHRcdFx0XHRcdC8vIGlmIHRoZSB0YXJnZXQgbWF0Y2ggdGhlIHNlbGVjdG9yLCB0aGVuLCBlYXN5LCB3ZSBjYWxsIHRoZSBsaXN0ZW5lclxuXHRcdFx0XHRcdGlmICh0YXJnZXQgJiYgZG9tLl9tYXRjaGVzRm4uY2FsbCh0YXJnZXQsc2VsZWN0b3IpKXtcblx0XHRcdFx0XHRcdC8vIE5vdGU6IFdoaWxlIG1vdXNlRXZlbnQgYXJlIHJlYWRvbmx5IGZvciBpdHMgcHJvcGVydGllcywgaXQgZG9lcyBhbGxvdyB0byBhZGQgY3VzdG9tIHByb3BlcnRpZXNcblx0XHRcdFx0XHRcdGV2dC5zZWxlY3RUYXJnZXQgPSB0YXJnZXQ7XG5cdFx0XHRcdFx0XHRsaXN0ZW5lci5jYWxsKGN0eCxldnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBub3csIGlmIGl0IGRvZXMgbm90LCBwZXJoYXBzIHNvbWV0aGluZyBpbiBiZXR3ZWVuIHRoZSB0YXJnZXQgYW5kIGN1cnJlbnRUYXJnZXRcblx0XHRcdFx0XHQvLyBtaWdodCBtYXRjaFxuXHRcdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0XHR0Z3QgPSBldnQudGFyZ2V0LnBhcmVudE5vZGU7XG5cdFx0XHRcdFx0XHQvLyBUT0RPOiBtaWdodCBuZWVkIHRvIGNoZWNrIHRoYXQgdGd0IGlzIG5vdCB1bmRlZmluZWQgYXMgd2VsbC4gXG5cdFx0XHRcdFx0XHR3aGlsZSAodGd0ICE9PSBudWxsICYmIHRndCAhPT0gY3VycmVudFRhcmdldCAmJiB0Z3QgIT09IGRvY3VtZW50KXtcblx0XHRcdFx0XHRcdFx0aWYgKGRvbS5fbWF0Y2hlc0ZuLmNhbGwodGd0LHNlbGVjdG9yKSl7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gTm90ZTogV2hpbGUgbW91c2VFdmVudCBhcmUgcmVhZG9ubHkgZm9yIGl0cyBwcm9wZXJ0aWVzLCBpdCBkb2VzIGFsbG93IHRvIGFkZCBjdXN0b20gcHJvcGVydGllc1xuXHRcdFx0XHRcdFx0XHRcdGV2dC5zZWxlY3RUYXJnZXQgPSB0Z3Q7XG5cdFx0XHRcdFx0XHRcdFx0bGlzdGVuZXIuY2FsbChjdHgsZXZ0KTtcblx0XHRcdFx0XHRcdFx0XHR0Z3QgPSBudWxsO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0dGd0ID0gdGd0LnBhcmVudE5vZGU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdFx0Ly8gaWYgd2UgZG8gbm90IGhhdmUgYSBzZWxlY3RvciwgYnV0IHN0aWxsIGhhdmVhICBvcHRzLmN0eCwgdGhlbiwgbmVlZCB0byB3cmFwXG5cdFx0XHRlbHNlIGlmIChvcHRzICYmIG9wdHMuY3R4KXtcblx0XHRcdFx0X2xpc3RlbmVyID0gZnVuY3Rpb24oZXZ0KXtcblx0XHRcdFx0XHRsaXN0ZW5lci5jYWxsKG9wdHMuY3R4LGV2dCk7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHZhciBsaXN0ZW5lclJlZiA9IHtcblx0XHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdFx0bGlzdGVuZXI6IGxpc3RlbmVyLCAvLyB0aGUgbGlzdGVuZXIgYXMgcGFzc2VkIGJ5IHRoZSB1c2VyXG5cdFx0XHRcdF9saXN0ZW5lcjogX2xpc3RlbmVyLCAvLyBhbiBldmVudHVhbCB3cmFwIG9mIHRoZSBsaXN0ZW5lciwgb3IganVzdCBwb2ludCBsaXN0ZW5lci5cblx0XHRcdH07XG5cblx0XHRcdGlmIChzZWxlY3Rvcil7XG5cdFx0XHRcdGxpc3RlbmVyUmVmLnNlbGVjdG9yID0gc2VsZWN0b3I7XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIHdlIGhhdmUgYSBuYW1lc3BhY2UsIHRoZXkgYWRkIGl0IHRvIHRoZSBSZWYsIGFuZCB0byB0aGUgbGlzdGVuZXJSZWZzQnlOc1xuXHRcdFx0Ly8gVE9ETzogbmVlZCB0byBhZGQgbGlzdGVuZXJSZWYgaW4gYSBuc0RpYyBpZiBpZiB0aGVyZSBhIG9wdHMubnNcblx0XHRcdGlmIChvcHRzICYmIG9wdHMubnMpe1xuXHRcdFx0XHRsaXN0ZW5lclJlZi5ucyA9IG9wdHMubnM7XG5cdFx0XHRcdHZhciBsaXN0ZW5lclJlZlNldEJ5TnMgPSB1dGlscy5lbnN1cmVNYXAoZWwsXCJsaXN0ZW5lclJlZnNCeU5zXCIpO1xuXHRcdFx0XHR2YXIgbGlzdGVuZXJSZWZTZXQgPSB1dGlscy5lbnN1cmVTZXQobGlzdGVuZXJSZWZTZXRCeU5zLCBvcHRzLm5zKTtcblx0XHRcdFx0bGlzdGVuZXJSZWZTZXQuYWRkKGxpc3RlbmVyUmVmKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gYWRkIHRoZSBsaXN0ZW5lclJlZiBhcyBsaXN0ZW5lcjpsaXN0ZW5lclJlZiBlbnRyeSBmb3IgdGhpcyB0eXBlU2VsZWN0b3JLZXkgaW4gdGhlIGxpc3RlbmVyRGljXG5cdFx0XHR2YXIgbGlzdGVuZXJEaWMgPSB1dGlscy5lbnN1cmVNYXAoZWwsXCJsaXN0ZW5lckRpY1wiKTtcblx0XHRcdHZhciBsaXN0ZW5lclJlZkJ5TGlzdGVuZXIgPSB1dGlscy5lbnN1cmVNYXAobGlzdGVuZXJEaWMsdHlwZVNlbGVjdG9yS2V5KTtcblx0XHRcdGxpc3RlbmVyUmVmQnlMaXN0ZW5lci5zZXQobGlzdGVuZXIsIGxpc3RlbmVyUmVmKTtcblxuXHRcdFx0Ly8gZG8gdGhlIGJpbmRpbmdcblx0XHRcdGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgX2xpc3RlbmVyKTtcblxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cblx0XHR9KTsgLy8gL3V0aWxzLmFzQXJyYXkoZWxzKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXtcblxuXHR9KTsgLy8gL3R5cGVzLmZvckVhY2goZnVuY3Rpb24odHlwZSl7XG5cbn1cblxuXG4vLyByZW1vdmUgdGhlIGV2ZW50IGJpbmRpbmdcbi8vIC5vZmYoZWxzKTsgcmVtb3ZlIGFsbCBldmVudHMgYWRkZWQgdmlhIC5vblxuLy8gLm9mZihlbHMsIHR5cGUpOyByZW1vdmUgYWxsIGV2ZW50cyBvZiB0eXBlIGFkZGVkIHZpYSAub25cbi8vIC5vZmYoZWxzLCB0eXBlLCBzZWxlY3Rvcik7IHJlbW92ZSBhbGwgZXZlbnRzIG9mIHR5cGUgYW5kIHNlbGVjdG9yIGFkZGVkIHZpYSAub25cbi8vIC5vZmYoZWxzLCB0eXBlLCBzZWxlY3RvciwgbGlzdGVuZXIpOyByZW1vdmUgZXZlbnQgb2YgdGhpcyB0eXBlLCBzZWxlY3RvciwgYW5kIGxpc3RlbmVyXG4vLyAub2ZmKGVscyx7bnN9KTsgcmVtb3ZlIGV2ZW50IGZyb20gdGhlIG5hbWVzcGFjZSBuc1xuZnVuY3Rpb24gb2ZmKGVscywgdHlwZSwgc2VsZWN0b3IsIGxpc3RlbmVyKXtcblxuXHQvLyAtLS0tLS0tLS0gb2ZmKGVscywge25zfSkgLS0tLS0tLS0tIC8vXG5cdC8vIGlmIHdlIGhhdmUgYSAub2ZmKGVscyx7bnM6Li59KSB0aGVuIHdlIGRvIGNoZWNrIG9ubHkgdGhlIG5zXG5cdGlmICh0eXBlLm5zKXtcdFx0XG5cdFx0dmFyIG5zID0gdHlwZS5ucztcblx0XHR1dGlscy5hc0FycmF5KGVscykuZm9yRWFjaChmdW5jdGlvbihlbCl7XG5cdFx0XHR2YXIgbGlzdGVuZXJEaWMgPSBlbFtcImxpc3RlbmVyRGljXCJdO1xuXHRcdFx0dmFyIGxpc3RlbmVyUmVmc0J5TnMgPSBlbFtcImxpc3RlbmVyUmVmc0J5TnNcIl07XG5cdFx0XHR2YXIgbGlzdGVuZXJSZWZTZXQ7XG5cdFx0XHRpZiAobGlzdGVuZXJSZWZzQnlOcyl7XG5cdFx0XHRcdGxpc3RlbmVyUmVmU2V0ID0gbGlzdGVuZXJSZWZzQnlOcy5nZXQobnMpO1xuXHRcdFx0XHRpZiAobGlzdGVuZXJSZWZTZXQpe1xuXHRcdFx0XHRcdC8vIGlmIHdlIGdldCB0aGUgc2V0LCB3ZSByZW1vdmUgdGhlbSBhbGxcblx0XHRcdFx0XHRsaXN0ZW5lclJlZlNldC5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyUmVmKXtcblx0XHRcdFx0XHRcdC8vIHdlIHJlbW92ZSB0aGUgZXZlbnQgbGlzdGVuZXJcblx0XHRcdFx0XHRcdGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIobGlzdGVuZXJSZWYudHlwZSwgbGlzdGVuZXJSZWYuX2xpc3RlbmVyKTtcblxuXHRcdFx0XHRcdFx0Ly8gbmVlZCB0byByZW1vdmUgaXQgZnJvbSB0aGUgbGlzdGVuZXJEaWNcblx0XHRcdFx0XHRcdHZhciB0eXBlU2VsZWN0b3JLZXkgPSBidWlsZFR5cGVTZWxlY3RvcktleShsaXN0ZW5lclJlZi50eXBlLCBsaXN0ZW5lclJlZi5zZWxlY3Rvcik7XG5cdFx0XHRcdFx0XHR2YXIgbGlzdGVuZXJSZWZNYXBCeUxpc3RlbmVyID0gbGlzdGVuZXJEaWMuZ2V0KHR5cGVTZWxlY3RvcktleSk7XG5cdFx0XHRcdFx0XHRpZiAobGlzdGVuZXJSZWZNYXBCeUxpc3RlbmVyLmhhcyhsaXN0ZW5lclJlZi5saXN0ZW5lcikpe1xuXHRcdFx0XHRcdFx0XHRsaXN0ZW5lclJlZk1hcEJ5TGlzdGVuZXIuZGVsZXRlKGxpc3RlbmVyUmVmLmxpc3RlbmVyKTtcblx0XHRcdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcIklOVEVSTkFMIEVSUk9SIHNob3VsZCBoYXZlIGEgbGlzdGVuZXIgaW4gZWwubGlzdGVuZXJEaWMgZm9yIFwiICsgdHlwZVNlbGVjdG9yS2V5KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHQvLyB3ZSByZW1vdmUgdGhpcyBuYW1lc3BhY2Ugbm93IHRoYXQgYWxsIGV2ZW50IGhhbmRsZXJzIGhhcyBiZWVuIHJlbW92ZWRcblx0XHRcdFx0XHRsaXN0ZW5lclJlZnNCeU5zLmRlbGV0ZShucyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm47XG5cdH1cblx0Ly8gLS0tLS0tLS0tIC9vZmYoZWxzLCB7bnN9KSAtLS0tLS0tLS0gLy9cblxuXG5cdC8vIGlmIHRoZSBcInNlbGVjdG9yXCIgaXMgYSBmdW5jdGlvbiwgdGhlbiwgaXQgaXMgdGhlIGxpc3RlbmVyIGFuZCB0aGVyZSBpcyBubyBzZWxlY3RvclxuXHRpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbil7XG5cdFx0bGlzdGVuZXIgPSBzZWxlY3Rvcjtcblx0XHRzZWxlY3RvciA9IG51bGw7XG5cdH1cblxuXHR2YXIgdHlwZVNlbGVjdG9yS2V5ID0gYnVpbGRUeXBlU2VsZWN0b3JLZXkodHlwZSwgc2VsZWN0b3IpO1xuXG5cdHV0aWxzLmFzQXJyYXkoZWxzKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXtcblxuXHRcdC8vIEZpcnN0LCBnZXQgdGhlIGxpc3RlbmVyUmVmQnlMaXN0ZW5lciBmb3IgdGhpcyB0eXBlL3NlbGVjdG9yeVxuXHRcdHZhciBsaXN0ZW5lclJlZk1hcEJ5TGlzdGVuZXIgPSB1dGlscy52YWwoZWwsW1wibGlzdGVuZXJEaWNcIix0eXBlU2VsZWN0b3JLZXldKTtcblxuXHRcdC8vIGZvciBub3csIGlmIHdlIGRvIG5vdCBoYXZlIGEgbGlzdGVuZXJSZWYgZm9yIHRoaXMgdHlwZS9bc2VsZWN0b3JdLCB3ZSB0aHJvdyBhbiBlcnJvclxuXHRcdGlmICghbGlzdGVuZXJSZWZNYXBCeUxpc3RlbmVyKXtcblx0XHRcdGNvbnNvbGUubG9nKFwiV0FSTklORyAtIENhbm5vdCBkbyAub2ZmKCkgc2luY2UgdGhpcyB0eXBlLXNlbGVjdG9yICdcIiArIHR5cGVTZWxlY3RvcktleSArIFxuXHRcdFx0XHRcIicgZXZlbnQgd2FzIG5vdCBib3VuZCB3aXRoIC5vbigpLiBXZSB3aWxsIGFkZCBzdXBwb3J0IGZvciB0aGlzIGxhdGVyLlwiKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBpZiB3ZSBkbyBub3QgaGF2ZSBhIGxpc3RlbmVyIGZ1bmN0aW9uLCB0aGlzIG1lYW4gd2UgbmVlZCB0byByZW1vdmUgYWxsIGV2ZW50cyBmb3IgdGhpcyB0eXBlL3NlbGVjdG9yXG5cdFx0aWYgKHR5cGVvZiBsaXN0ZW5lciA9PT0gXCJ1bmRlZmluZWRcIil7XG5cdFx0XHRsaXN0ZW5lclJlZk1hcEJ5TGlzdGVuZXIuZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lclJlZil7XG5cdFx0XHRcdC8vIE5vdGU6IEhlcmUsIHR5cGUgPT09IGxpc3RlbmVyUmVmLnR5cGVcblx0XHRcdFx0Ly8gcmVtb3ZlIHRoZSBldmVudFxuXHRcdFx0XHRlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyUmVmLl9saXN0ZW5lcik7XHRcdFx0XHRcblx0XHRcdH0pO1xuXHRcdFx0ZWxbXCJsaXN0ZW5lckRpY1wiXS5kZWxldGUodHlwZVNlbGVjdG9yS2V5KTtcblx0XHR9XG5cdFx0Ly8gaWYgd2UgaGF2ZSBhIGxpc3RlbmVyLCB0aGVuLCBqdXN0IHJlbW92ZSB0aGlzIG9uZS5cblx0XHRlbHNle1xuXHRcdFx0Ly8gY2hlY2sgdGhhdCB3ZSBoYXZlIHRoZSBtYXAuIFxuXHRcdFx0dmFyIGxpc3RlbmVyUmVmID0gbGlzdGVuZXJSZWZNYXBCeUxpc3RlbmVyLmdldChsaXN0ZW5lcik7XG5cblx0XHRcdGlmICghbGlzdGVuZXJSZWYpe1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIldBUk5JTkcgLSBDYW5ub3QgZG8gLm9mZigpIHNpbmNlIG5vIGxpc3RlbmVyUmVmIGZvciBcIiArIHR5cGVTZWxlY3RvcktleSArIFxuXHRcdFx0XHRcIiBhbmQgZnVuY3Rpb24gXFxuXCIgKyBsaXN0ZW5lciArIFwiXFxuIHdlcmUgZm91bmQuIFByb2JhYmx5IHdhcyBub3QgcmVnaXN0ZXJlZCB2aWEgb24oKVwiKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyByZW1vdmUgdGhlIGV2ZW50XG5cdFx0XHRlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyUmVmLl9saXN0ZW5lcik7XG5cblx0XHRcdC8vIHJlbW92ZSBpdCBmcm9tIHRoZSBtYXBcblx0XHRcdGxpc3RlbmVyUmVmTWFwQnlMaXN0ZW5lci5kZWxldGUobGlzdGVuZXIpO1x0XHRcdFxuXHRcdH1cblxuXG5cdH0pO1x0XG59XG5cbnZhciBjdXN0b21EZWZhdWx0UHJvcHMgPSB7XG5cdGJ1YmJsZXM6IHRydWUsXG5cdGNhbmNlbGFibGU6IHRydWVcbn07XG5cbmZ1bmN0aW9uIHRyaWdnZXIoZWxzLCB0eXBlLCBkYXRhKXtcblx0dmFyIGV2dCA9IG5ldyBDdXN0b21FdmVudCh0eXBlLCBPYmplY3QuYXNzaWduKHt9LGN1c3RvbURlZmF1bHRQcm9wcyxkYXRhKSk7XHRcblx0dXRpbHMuYXNBcnJheShlbHMpLmZvckVhY2goZnVuY3Rpb24oZWwpe1xuXHRcdGVsLmRpc3BhdGNoRXZlbnQoZXZ0KTtcblx0fSk7XG59XG4vLyAtLS0tLS0tLS0gL01vZHVsZSBBUElzIC0tLS0tLS0tLSAvL1xuXG5cbmZ1bmN0aW9uIGJ1aWxkVHlwZVNlbGVjdG9yS2V5KHR5cGUsIHNlbGVjdG9yKXtcblx0dmFyIHYgPSB0eXBlO1xuXHRyZXR1cm4gKHNlbGVjdG9yKT8odiArIFwiLS1cIiArIHNlbGVjdG9yKTp2O1xufVxuIiwidmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRodWI6IGh1YlxufTtcblxuLy8gVXNlciBIdWIgb2JqZWN0IGV4cG9zaW5nIHRoZSBwdWJsaWMgQVBJXG52YXIgaHViRGljID0gbmV3IE1hcCgpO1xuXG4vLyBEYXRhIGZvciBlYWNoIGh1YiAoYnkgbmFtZSlcbnZhciBodWJEYXRhRGljID0gbmV3IE1hcCgpOyBcblxuLy8gZ2V0IG9yIGNyZWF0ZSBhIG5ldyBodWI7XG5mdW5jdGlvbiBodWIobmFtZSl7XG5cdGlmIChuYW1lID09IG51bGwpe1xuXHRcdHRocm93IFwiTVZET00gSU5WQUxJRCBBUEkgQ0FMTFM6IGZvciBub3csIGQuaHViKG5hbWUpIHJlcXVpcmUgYSBuYW1lIChubyBuYW1lIHdhcyBnaXZlbikuXCI7XG5cdH1cblx0dmFyIGggPSBodWJEaWMuZ2V0KG5hbWUpOyBcblx0Ly8gaWYgaXQgZG9lcyBub3QgZXhpc3QsIHdlIGNyZWF0ZSBhbmQgc2V0IGl0LiBcblx0aWYgKCFoKXtcblx0XHQvLyBjcmVhdGUgdGhlIGh1YlxuXHRcdGggPSBPYmplY3QuY3JlYXRlKEh1YlByb3RvLCB7XG5cdFx0XHRuYW1lOiB7IHZhbHVlOiBuYW1lIH0gLy8gcmVhZCBvbmx5XG5cdFx0fSk7XG5cdFx0aHViRGljLnNldChuYW1lLCBoKTtcblxuXHRcdC8vIGNyZWF0ZSB0aGUgaHViRGF0YVxuXHRcdGh1YkRhdGFEaWMuc2V0KG5hbWUsIG5ldyBIdWJEYXRhUHJvdG8obmFtZSkpO1xuXHR9XG5cdHJldHVybiBoO1xufVxuXG5odWIuZGVsZXRlID0gZnVuY3Rpb24obmFtZSl7XG5cdGh1YkRpYy5kZWxldGUobmFtZSk7XG5cdGh1YkRhdGFEaWMuZGVsZXRlKG5hbWUpO1xufTtcblxuLy8gLS0tLS0tLS0tIEh1YiAtLS0tLS0tLS0gLy9cbnZhciBIdWJQcm90byA9IHtcblx0c3ViOiBmdW5jdGlvbih0b3BpY3MsIGxhYmVscywgaGFuZGxlciwgb3B0cyl7XG5cdFx0Ly8gQVJHIFNISUZUSU5HOiBpZiBsYWJlbHMgYXJnIGlzIGEgZnVuY3Rpb24sIHRoZW4sIHdlIHN3aXRoIHRoZSBhcmd1bWVudCBsZWZ0XG5cdFx0aWYgKHR5cGVvZiBsYWJlbHMgPT09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHRvcHRzID0gaGFuZGxlcjtcblx0XHRcdGhhbmRsZXIgPSBsYWJlbHM7XHRcdFx0XG5cdFx0XHRsYWJlbHMgPSBudWxsO1xuXHRcdH1cblx0XHRcblx0XHQvLyBtYWtlIGFycmF5c1xuXHRcdHRvcGljcyA9IHV0aWxzLnNwbGl0QW5kVHJpbSh0b3BpY3MsIFwiLFwiKTtcblx0XHRpZiAobGFiZWxzICE9IG51bGwpe1xuXHRcdFx0bGFiZWxzID0gdXRpbHMuc3BsaXRBbmRUcmltKGxhYmVscywgXCIsXCIpO1xuXHRcdH1cblxuXHRcdC8vIG1ha2Ugb3B0cyAoYWx3YXlzIGRlZmluZWQgYXQgbGVhc3QgYW4gZW10cHkgb2JqZWN0KVxuXHRcdG9wdHMgPSBtYWtlT3B0cyhvcHRzKTtcblxuXHRcdC8vIGFkZCB0aGUgZXZlbnQgdG8gdGhlIGh1YkRhdGFcblx0XHR2YXIgaHViRGF0YSA9IGh1YkRhdGFEaWMuZ2V0KHRoaXMubmFtZSk7XG5cdFx0aHViRGF0YS5hZGRFdmVudCh0b3BpY3MsIGxhYmVscywgaGFuZGxlciwgb3B0cyk7XG5cdH0sIFxuXG5cdHVuc3ViOiBmdW5jdGlvbihucyl7XG5cdFx0dmFyIGh1YkRhdGEgPSBodWJEYXRhRGljLmdldCh0aGlzLm5hbWUpO1xuXHRcdGh1YkRhdGEucmVtb3ZlUmVmc0Zvck5zKG5zKTtcblx0fSwgXG5cblx0cHViOiBmdW5jdGlvbih0b3BpY3MsIGxhYmVscywgZGF0YSl7XG5cdFx0Ly8gQVJHIFNISUZUSU5HOiBpZiBkYXRhIGlzIHVuZGVmaW5lZCwgd2Ugc2hpZnQgYXJncyB0byB0aGUgUklHSFRcblx0XHRpZiAodHlwZW9mIGRhdGEgPT09IFwidW5kZWZpbmVkXCIpe1xuXHRcdFx0ZGF0YSA9IGxhYmVscztcblx0XHRcdGxhYmVscyA9IG51bGw7XG5cdFx0fVxuXG5cdFx0dG9waWNzID0gdXRpbHMuc3BsaXRBbmRUcmltKHRvcGljcywgXCIsXCIpO1xuXG5cblx0XHRpZiAobGFiZWxzICE9IG51bGwpe1xuXHRcdFx0bGFiZWxzID0gdXRpbHMuc3BsaXRBbmRUcmltKGxhYmVscywgXCIsXCIpO1x0XHRcblx0XHR9XG5cblx0XHR2YXIgaHViRGF0YSA9IGh1YkRhdGFEaWMuZ2V0KHRoaXMubmFtZSk7XG5cblx0XHR2YXIgaGFzTGFiZWxzID0gKGxhYmVscyAhPSBudWxsICYmIGxhYmVscy5sZW5ndGggPiAwKTtcblxuXHRcdC8vIGlmIHdlIGhhdmUgbGFiZWxzLCB0aGVuLCB3ZSBzZW5kIHRoZSBsYWJlbHMgYm91bmQgZXZlbnRzIGZpcnN0XG5cdFx0aWYgKGhhc0xhYmVscyl7XG5cdFx0XHRodWJEYXRhLmdldFJlZnModG9waWNzLCBsYWJlbHMpLmZvckVhY2goZnVuY3Rpb24ocmVmKXtcblx0XHRcdFx0aW52b2tlUmVmKHJlZiwgZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyB0aGVuLCB3ZSBzZW5kIHRoZSB0b3BpYyBvbmx5IGJvdW5kXG5cdFx0aHViRGF0YS5nZXRSZWZzKHRvcGljcykuZm9yRWFjaChmdW5jdGlvbihyZWYpe1xuXHRcdFx0Ly8gaWYgdGhpcyBzZW5kLCBoYXMgbGFiZWwsIHRoZW4sIHdlIG1ha2Ugc3VyZSB3ZSBpbnZva2UgZm9yIGVhY2ggb2YgdGhpcyBsYWJlbFxuXHRcdFx0aWYgKGhhc0xhYmVscyl7XG5cdFx0XHRcdGxhYmVscy5mb3JFYWNoKGZ1bmN0aW9uKGxhYmVsKXtcblx0XHRcdFx0XHRpbnZva2VSZWYocmVmLGRhdGEsIGxhYmVsKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBpZiB3ZSBkbyBub3QgaGF2ZSBsYWJlbHMsIHRoZW4sIGp1c3QgY2FsbCBpdC5cblx0XHRcdGVsc2V7XG5cdFx0XHRcdGludm9rZVJlZihyZWYsIGRhdGEpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdH0sIFxuXG5cdGRlbGV0ZUh1YjogZnVuY3Rpb24oKXtcblx0XHRodWJEaWMuZGVsZXRlKHRoaXMubmFtZSk7XG5cdFx0aHViRGF0YURpYy5kZWxldGUodGhpcy5uYW1lKTtcblx0fVxufTtcbi8vIC0tLS0tLS0tLSAvSHViIC0tLS0tLS0tLSAvL1xuXG4vLyAtLS0tLS0tLS0gSHViRGF0YSAtLS0tLS0tLS0gLy9cbmZ1bmN0aW9uIEh1YkRhdGFQcm90byhuYW1lKXtcblx0dGhpcy5uYW1lID0gbmFtZTtcblx0dGhpcy5yZWZzQnlOcyA9IG5ldyBNYXAoKTtcblx0dGhpcy5yZWZzQnlUb3BpYyA9IG5ldyBNYXAoKTtcblx0dGhpcy5yZWZzQnlUb3BpY0xhYmVsID0gbmV3IE1hcCgpO1xufVxuXG5IdWJEYXRhUHJvdG8ucHJvdG90eXBlLmFkZEV2ZW50ID0gZnVuY3Rpb24odG9waWNzLCBsYWJlbHMsIGZ1biwgb3B0cyl7XG5cdHZhciByZWZzID0gYnVpbGRSZWZzKHRvcGljcywgbGFiZWxzLCBmdW4sIG9wdHMpO1xuXHR2YXIgcmVmc0J5TnMgPSB0aGlzLnJlZnNCeU5zO1xuXHR2YXIgcmVmc0J5VG9waWMgPSB0aGlzLnJlZnNCeVRvcGljO1xuXHR2YXIgcmVmc0J5VG9waWNMYWJlbCA9IHRoaXMucmVmc0J5VG9waWNMYWJlbDtcblx0cmVmcy5mb3JFYWNoKGZ1bmN0aW9uKHJlZil7XG5cdFx0Ly8gYWRkIHRoaXMgcmVmIHRvIHRoZSBucyBkaWN0aW9uYXJ5XG5cdFx0Ly8gVE9ETzogcHJvYmFibHkgbmVlZCB0byBhZGQgYW4gY3VzdG9tIFwibnNcIlxuXHRcdGlmIChyZWYubnMgIT0gbnVsbCl7XG5cdFx0XHR1dGlscy5lbnN1cmVBcnJheShyZWZzQnlOcywgcmVmLm5zKS5wdXNoKHJlZik7XG5cdFx0fVxuXHRcdC8vIGlmIHdlIGhhdmUgYSBsYWJlbCwgYWRkIHRoaXMgcmVmIHRvIHRoZSB0b3BpY0xhYmVsIGRpY3Rpb25hcnlcblx0XHRpZiAocmVmLmxhYmVsICE9IG51bGwpe1xuXHRcdFx0dXRpbHMuZW5zdXJlQXJyYXkocmVmc0J5VG9waWNMYWJlbCwgYnVpbGRUb3BpY0xhYmVsS2V5KHJlZi50b3BpYywgcmVmLmxhYmVsKSkucHVzaChyZWYpO1xuXHRcdH1cblx0XHQvLyBPdGhlcndpc2UsIGFkZCBpdCB0byB0aGlzIHJlZiB0aGlzIHRvcGljXG5cdFx0ZWxzZXtcblx0XHRcdFxuXHRcdFx0dXRpbHMuZW5zdXJlQXJyYXkocmVmc0J5VG9waWMsIHJlZi50b3BpYykucHVzaChyZWYpO1xuXHRcdH1cblx0fSk7XG59O1xuXG5IdWJEYXRhUHJvdG8ucHJvdG90eXBlLmdldFJlZnMgPSBmdW5jdGlvbih0b3BpY3MsIGxhYmVscykge1xuXHR2YXIgcmVmcyA9IFtdO1xuXHR2YXIgcmVmc0J5VG9waWMgPSB0aGlzLnJlZnNCeVRvcGljO1xuXHR2YXIgcmVmc0J5VG9waWNMYWJlbCA9IHRoaXMucmVmc0J5VG9waWNMYWJlbDtcblx0XG5cdHRvcGljcy5mb3JFYWNoKGZ1bmN0aW9uKHRvcGljKXtcblx0XHQvLyBpZiB3ZSBkbyBub3QgaGF2ZSBsYWJlbHMsIHRoZW4sIGp1c3QgbG9vayBpbiB0aGUgdG9waWMgZGljXG5cdFx0aWYgKGxhYmVscyA9PSBudWxsIHx8IGxhYmVscy5sZW5ndGggPT09IDApe1xuXHRcdFx0dmFyIHRvcGljUmVmcyA9IHJlZnNCeVRvcGljLmdldCh0b3BpYyk7XG5cdFx0XHRpZiAodG9waWNSZWZzKXtcblx0XHRcdFx0cmVmcy5wdXNoLmFwcGx5KHJlZnMsIHRvcGljUmVmcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIGlmIHdlIGhhdmUgc29tZSBsYWJlbHMsIHRoZW4sIHRha2UgdGhvc2UgaW4gYWNjb3VudHNcblx0XHRlbHNle1xuXHRcdFx0bGFiZWxzLmZvckVhY2goZnVuY3Rpb24obGFiZWwpe1xuXHRcdFx0XHR2YXIgdG9waWNMYWJlbFJlZnMgPSByZWZzQnlUb3BpY0xhYmVsLmdldChidWlsZFRvcGljTGFiZWxLZXkodG9waWMsIGxhYmVsKSk7XG5cdFx0XHRcdGlmICh0b3BpY0xhYmVsUmVmcyl7XG5cdFx0XHRcdFx0cmVmcy5wdXNoLmFwcGx5KHJlZnMsIHRvcGljTGFiZWxSZWZzKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIHJlZnM7XG59O1xuXG5IdWJEYXRhUHJvdG8ucHJvdG90eXBlLnJlbW92ZVJlZnNGb3JOcyA9IGZ1bmN0aW9uKG5zKXtcblx0dmFyIHJlZnNCeVRvcGljID0gdGhpcy5yZWZzQnlUb3BpYztcblx0dmFyIHJlZnNCeVRvcGljTGFiZWwgPSB0aGlzLnJlZnNCeVRvcGljTGFiZWw7XG5cdHZhciByZWZzQnlOcyA9IHRoaXMucmVmc0J5TnM7XG5cblx0dmFyIHJlZnMgPSB0aGlzLnJlZnNCeU5zLmdldChucyk7XG5cdGlmIChyZWZzICE9IG51bGwpe1xuXG5cdFx0Ly8gd2UgcmVtb3ZlIGVhY2ggcmVmIGZyb20gdGhlIGNvcnJlc3BvbmRpbmcgZGljXG5cdFx0cmVmcy5mb3JFYWNoKGZ1bmN0aW9uKHJlZil7XG5cblx0XHRcdC8vIEZpcnN0LCB3ZSBnZXQgdGhlIHJlZnMgZnJvbSB0aGUgdG9waWMgb3IgdG9waWNsYWJlbFxuXHRcdFx0dmFyIHJlZkxpc3Q7XG5cdFx0XHRpZiAocmVmLmxhYmVsICE9IG51bGwpe1xuXHRcdFx0XHR2YXIgdG9waWNMYWJlbEtleSA9IGJ1aWxkVG9waWNMYWJlbEtleShyZWYudG9waWMsIHJlZi5sYWJlbCk7XG5cdFx0XHRcdHJlZkxpc3QgPSByZWZzQnlUb3BpY0xhYmVsLmdldCh0b3BpY0xhYmVsS2V5KTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRyZWZMaXN0ID0gcmVmc0J5VG9waWMuZ2V0KHJlZi50b3BpYyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFRoZW4sIGZvciB0aGUgcmVmTGlzdCBhcnJheSwgd2UgcmVtb3ZlIHRoZSBvbmVzIHRoYXQgbWF0Y2ggdGhpcyBvYmplY3Rcblx0XHRcdHZhciBpZHg7XG5cdFx0XHR3aGlsZSgoaWR4ID0gcmVmTGlzdC5pbmRleE9mKHJlZikpICE9PSAtMSl7XG5cdFx0XHRcdHJlZkxpc3Quc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyB3ZSByZW1vdmUgdGhlbSBhbGwgZm9ybSB0aGUgcmVmc0J5TnNcblx0XHRyZWZzQnlOcy5kZWxldGUobnMpO1xuXHR9XG5cblxufTtcblxuLy8gc3RhdGljL3ByaXZhdGVcbmZ1bmN0aW9uIGJ1aWxkUmVmcyh0b3BpY3MsIGxhYmVscywgZnVuLCBvcHRzKXtcblx0dmFyIHJlZnMgPSBbXTtcblx0dG9waWNzLmZvckVhY2goZnVuY3Rpb24odG9waWMpe1xuXHRcdC8vIGlmIHdlIGRvIG5vdCBoYXZlIGFueSBsYWJlbHMsIHRoZW4sIGp1c3QgYWRkIHRoaXMgdG9waWNcblx0XHRpZiAobGFiZWxzID09IG51bGwgfHwgbGFiZWxzLmxlbmd0aCA9PT0gMCl7XG5cdFx0XHRyZWZzLnB1c2goe1xuXHRcdFx0XHR0b3BpYzogdG9waWMsXG5cdFx0XHRcdGZ1bjogZnVuLCBcblx0XHRcdFx0bnM6IG9wdHMubnMsIFxuXHRcdFx0XHRjdHg6IG9wdHMuY3R4XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Ly8gaWYgd2UgaGF2ZSBvbmUgb3IgbW9yZSBsYWJlbHMsIHRoZW4sIHdlIGFkZCBmb3IgdGhvc2UgbGFiZWxcblx0XHRlbHNle1xuXHRcdFx0bGFiZWxzLmZvckVhY2goZnVuY3Rpb24obGFiZWwpe1xuXHRcdFx0XHRyZWZzLnB1c2goe1xuXHRcdFx0XHRcdHRvcGljOiB0b3BpYywgXG5cdFx0XHRcdFx0bGFiZWw6IGxhYmVsLCBcblx0XHRcdFx0XHRmdW46IGZ1biwgXG5cdFx0XHRcdFx0bnM6IG9wdHMubnMsXG5cdFx0XHRcdFx0Y3R4OiBvcHRzLmN0eFxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1x0XHRcdFxuXHRcdH1cblxuXHR9KTtcblxuXHRyZXR1cm4gcmVmcztcbn1cblxuXG4vLyBzdGF0aWMvcHJpdmF0ZTogcmV0dXJuIGEgc2FmZSBvcHRzLiBJZiBvcHRzIGlzIGEgc3RyaW5nLCB0aGVuLCBhc3N1bWUgaXMgaXQgdGhlIHtuc31cbnZhciBlbXB0eU9wdHMgPSB7fTtcbmZ1bmN0aW9uIG1ha2VPcHRzKG9wdHMpe1xuXHRpZiAob3B0cyA9PSBudWxsKXtcblx0XHRvcHRzID0gZW1wdHlPcHRzO1xuXHR9ZWxzZXtcblx0XHRpZiAodHlwZW9mIG9wdHMgPT09IFwic3RyaW5nXCIpe1xuXHRcdFx0b3B0cyA9IHtuczpvcHRzfTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG9wdHM7XG59XG5cbi8vIHN0YXRpYy9wcml2YXRlXG5mdW5jdGlvbiBidWlsZFRvcGljTGFiZWxLZXkodG9waWMsIGxhYmVsKXtcblx0cmV0dXJuIHRvcGljICsgXCItIS1cIiArIGxhYmVsO1xufVxuXG4vLyBzdGF0aWMvcHJpdmF0ZTogY2FsbCByZWYgbWV0aG9kICh3aXRoIG9wdGlvbmFsIGxhYmVsIG92ZXJyaWRlKVxuZnVuY3Rpb24gaW52b2tlUmVmKHJlZiwgZGF0YSwgbGFiZWwpe1xuXHR2YXIgaW5mbyA9IHtcblx0XHR0b3BpYzogcmVmLnRvcGljLFxuXHRcdGxhYmVsOiByZWYubGFiZWwgfHwgbGFiZWwsXG5cdFx0bnM6IHJlZi5uc1xuXHR9O1xuXHRyZWYuZnVuLmNhbGwocmVmLmN0eCxkYXRhLGluZm8pO1xufVxuLy8gLS0tLS0tLS0tIC9IdWJEYXRhIC0tLS0tLS0tLSAvL1xuXG5cbiIsInZhciB2aWV3ID0gcmVxdWlyZShcIi4vdmlldy5qc1wiKTtcbnZhciBldmVudCA9IHJlcXVpcmUoXCIuL2V2ZW50LmpzXCIpO1xudmFyIGRvbSA9IHJlcXVpcmUoXCIuL2RvbS5qc1wiKTtcbnZhciBkeCA9IHJlcXVpcmUoXCIuL2R4LmpzXCIpO1xudmFyIGh1YiA9IHJlcXVpcmUoXCIuL2h1Yi5qc1wiKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xuXG5yZXF1aXJlKFwiLi92aWV3LWV2ZW50LmpzXCIpO1xucmVxdWlyZShcIi4vdmlldy1odWIuanNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHR2ZXJzaW9uOiBcIjAuNC4zXCIsXG5cdFxuXHQvLyB2aWV3IEFQSXNcblx0aG9vazogdmlldy5ob29rLFxuXHRyZWdpc3Rlcjogdmlldy5yZWdpc3Rlcixcblx0ZGlzcGxheTogdmlldy5kaXNwbGF5LFxuXHRyZW1vdmU6IHZpZXcucmVtb3ZlLFxuXHRlbXB0eTogdmlldy5lbXB0eSxcblxuXHQvLyBldmVudCBBUElcblx0b246IGV2ZW50Lm9uLCBcblx0b2ZmOiBldmVudC5vZmYsXG5cdHRyaWdnZXI6IGV2ZW50LnRyaWdnZXIsXG5cblx0Ly8gRE9NIFF1ZXJ5IFNob3J0Y3V0c1xuXHRmaXJzdDogZG9tLmZpcnN0LFxuXHRhbGw6IGRvbS5hbGwsXG5cdGNsb3Nlc3Q6IGRvbS5jbG9zZXN0LFxuXHRuZXh0OiBkb20ubmV4dCxcblx0cHJldjogZG9tLnByZXYsXG5cblx0Ly8gRE9NIEhlbHBlcnNcblx0YXBwZW5kOiBkb20uYXBwZW5kLFxuXHRmcmFnOiBkb20uZnJhZyxcblxuXHQvLyBET00gUHVzaC9QdWxsXG5cdHB1bGw6IGR4LnB1bGwsXG5cdHB1c2g6IGR4LnB1c2gsXG5cdHB1bGxlcjogZHgucHVsbGVyLFxuXHRwdXNoZXI6IGR4LnB1c2hlcixcblxuXHQvLyBIdWJcblx0aHViOiBodWIuaHViLFxuXG5cdC8vIHV0aWxzXG5cdHZhbDogdXRpbHMudmFsLFxuXHRhc0FycmF5OiB1dGlscy5hc0FycmF5XG59O1xuXG4vLyBwdXQgdGhpcyBjb21wb25lbnQgaW4gdGhlIGdsb2JhbCBzY29wZVxuLy8gVE9ETzogV2UgbWlnaHQgd2FudCB0byBoYXZlIGEgaW5kZXgtZ2xvYmFsIGZvciBwdXR0aW5nIHRoaXMgaW4gdGhlIGdsb2JhbCBzY29wZSBhbmQgaW5kZXguanMgbm90IHB1dHRpbmcgaXQgaW4gdGhlIGdsb2JhbCBzY29wZS4gXG5pZiAod2luZG93KXtcblx0d2luZG93Lm12ZG9tID0gbW9kdWxlLmV4cG9ydHM7XHRcbn1cblxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuXHQvLyBPYmplY3QgVXRpbHNcblx0aXNOdWxsOiBpc051bGwsXG5cdGlzRW1wdHk6IGlzRW1wdHksXG5cdHZhbDogdmFsLCAvLyBwdWJsaWNcblx0ZW5zdXJlTWFwOiBlbnN1cmVNYXAsXG5cdGVuc3VyZVNldDogZW5zdXJlU2V0LFxuXHRlbnN1cmVBcnJheTogZW5zdXJlQXJyYXksXG5cblx0Ly8gYXNUeXBlXG5cdGFzQXJyYXk6IGFzQXJyYXksIC8vIHB1YmxpY1xuXG5cdC8vIHN0cmluZyB1dGlsc1xuXHRzcGxpdEFuZFRyaW06IHNwbGl0QW5kVHJpbVxufTtcblxuLy8gLS0tLS0tLS0tIE9iamVjdCBVdGlscyAtLS0tLS0tLS0gLy9cbnZhciBVRCA9IFwidW5kZWZpbmVkXCI7XG52YXIgU1RSID0gXCJzdHJpbmdcIjtcbnZhciBPQkogPSBcIm9iamVjdFwiO1xuXG4vLyByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBpcyBudWxsIG9yIHVuZGVmaW5lZFxuZnVuY3Rpb24gaXNOdWxsKHYpe1xuXHRyZXR1cm4gKHR5cGVvZiB2ID09PSBVRCB8fCB2ID09PSBudWxsKTtcbn1cblxuLy8gcmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIGlzIG51bGwsIHVuZGVmaW5lZCwgZW1wdHkgYXJyYXksIGVtcHR5IHN0cmluZywgb3IgZW1wdHkgb2JqZWN0XG5mdW5jdGlvbiBpc0VtcHR5KHYpe1xuXHR2YXIgdG9mID0gdHlwZW9mIHY7XG5cdGlmIChpc051bGwodikpe1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0aWYgKHYgaW5zdGFuY2VvZiBBcnJheSB8fCB0b2YgPT09IFNUUil7XG5cdFx0cmV0dXJuICh2Lmxlbmd0aCA9PT0gMCk/dHJ1ZTpmYWxzZTtcblx0fVxuXG5cdGlmICh0b2YgPT09IE9CSil7XG5cdFx0Ly8gYXBwYXJlbnRseSAxMHggZmFzdGVyIHRoYW4gT2JqZWN0LmtleXNcblx0XHRmb3IgKHZhciB4IGluIHYpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbi8vIFRPRE86IG5lZWQgdG8gZG9jdW1lbnRcbmZ1bmN0aW9uIHZhbChyb290T2JqLCBwYXRoVG9WYWx1ZSwgdmFsdWUpIHtcblx0dmFyIHNldE1vZGUgPSAodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKTtcblxuXHRpZiAoIXJvb3RPYmopIHtcblx0XHRyZXR1cm4gcm9vdE9iajtcblx0fVxuXHQvLyBmb3Igbm93LCByZXR1cm4gdGhlIHJvb3RPYmogaWYgdGhlIHBhdGhUb1ZhbHVlIGlzIGVtcHR5IG9yIG51bGwgb3IgdW5kZWZpbmVkXG5cdGlmICghcGF0aFRvVmFsdWUpIHtcblx0XHRyZXR1cm4gcm9vdE9iajtcblx0fVxuXHQvLyBpZiB0aGUgcGF0aFRvVmFsdWUgaXMgYWxyZWFkeSBhbiBhcnJheSwgZG8gbm90IHBhcnNlIGl0ICh0aGlzIGFsbG93IHRvIHN1cHBvcnQgJy4nIGluIHByb3AgbmFtZXMpXG5cdHZhciBuYW1lcyA9IChwYXRoVG9WYWx1ZSBpbnN0YW5jZW9mIEFycmF5KT9wYXRoVG9WYWx1ZTpwYXRoVG9WYWx1ZS5zcGxpdChcIi5cIik7XG5cdFxuXHR2YXIgbmFtZSwgY3VycmVudE5vZGUgPSByb290T2JqLCBjdXJyZW50SXNNYXAsIG5leHROb2RlO1xuXG5cdHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aCwgbElkeCA9IGwgLSAxO1xuXHRmb3IgKGk7IGkgPCBsOyBpKyspIHtcblx0XHRuYW1lID0gbmFtZXNbaV07XG5cblx0XHRjdXJyZW50SXNNYXAgPSAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBNYXApO1xuXHRcdG5leHROb2RlID0gY3VycmVudElzTWFwP2N1cnJlbnROb2RlLmdldChuYW1lKTpjdXJyZW50Tm9kZVtuYW1lXTtcblxuXHRcdGlmIChzZXRNb2RlKXtcblx0XHRcdC8vIGlmIGxhc3QgaW5kZXgsIHNldCB0aGUgdmFsdWVcblx0XHRcdGlmIChpID09PSBsSWR4KXtcblx0XHRcdFx0aWYgKGN1cnJlbnRJc01hcCl7XG5cdFx0XHRcdFx0Y3VycmVudE5vZGUuc2V0KG5hbWUsdmFsdWUpO1xuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRjdXJyZW50Tm9kZVtuYW1lXSA9IHZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGN1cnJlbnROb2RlID0gdmFsdWU7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0aWYgKHR5cGVvZiBuZXh0Tm9kZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0XHRcdG5leHROb2RlID0ge307XG5cdFx0XHRcdH0gXG5cdFx0XHRcdGN1cnJlbnROb2RlW25hbWVdID0gbmV4dE5vZGU7XG5cdFx0XHRcdGN1cnJlbnROb2RlID0gbmV4dE5vZGU7XG5cdFx0XHR9XG5cdFx0fWVsc2V7XG5cdFx0XHRjdXJyZW50Tm9kZSA9IG5leHROb2RlO1xuXHRcdFx0aWYgKHR5cGVvZiBjdXJyZW50Tm9kZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0XHRjdXJyZW50Tm9kZSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XHRcdFx0XG5cdFx0fVxuXG5cdFx0Ly8gaWYgKG5vZGUgPT0gbnVsbCkge1xuXHRcdC8vIFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHQvLyB9XG5cdFx0Ly8gLy8gZ2V0IHRoZSBuZXh0IG5vZGVcblx0XHQvLyBub2RlID0gKG5vZGUgaW5zdGFuY2VvZiBNYXApP25vZGUuZ2V0KG5hbWUpOm5vZGVbbmFtZV07XG5cdFx0Ly8gaWYgKHR5cGVvZiBub2RlID09PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0Ly8gXHRyZXR1cm4gbm9kZTtcblx0XHQvLyB9XG5cdH1cblx0aWYgKHNldE1vZGUpe1xuXHRcdHJldHVybiByb290T2JqO1xuXHR9ZWxzZXtcblx0XHRyZXR1cm4gY3VycmVudE5vZGU7XG5cdH1cbn1cblxuLy8gLS0tLS0tLS0tIC9PYmplY3QgVXRpbHMgLS0tLS0tLS0tIC8vXG5cbi8vIC0tLS0tLS0tLSBlbnN1cmVUeXBlIC0tLS0tLS0tLSAvL1xuLy8gTWFrZSBzdXJlIHRoYXQgdGhpcyBvYmpbcHJvcE5hbWVdIGlzIGEganMgTWFwIGFuZCByZXR1cm5zIGl0LiBcbi8vIE90aGVyd2lzZSwgY3JlYXRlIGEgbmV3IG9uZSwgc2V0IGl0LCBhbmQgcmV0dXJuIGl0LlxuZnVuY3Rpb24gZW5zdXJlTWFwKG9iaiwgcHJvcE5hbWUpe1xuXHRyZXR1cm4gX2Vuc3VyZShvYmosIHByb3BOYW1lLCBNYXApO1xufVxuXG4vLyBNYWtlIHN1cmUgdGhhdCB0aGlzIG9ialtwcm9wTmFtZV0gaXMgYSBqcyBTZXQgYW5kIHJldHVybnMgaXQuIFxuLy8gT3RoZXJ3aXNlLCBjcmVhdGUgYSBuZXcgb25lLCBzZXQgaXQsIGFuZCByZXR1cm4gaXQuXG5mdW5jdGlvbiBlbnN1cmVTZXQob2JqLCBwcm9wTmFtZSl7XG5cdHJldHVybiBfZW5zdXJlKG9iaiwgcHJvcE5hbWUsIFNldCk7XG59XG5cbi8vIHNhbWUgYXMgZW5zdXJlTWFwIGJ1dCBmb3IgYXJyYXlcbmZ1bmN0aW9uIGVuc3VyZUFycmF5KG9iaiwgcHJvcE5hbWUpe1xuXHRyZXR1cm4gX2Vuc3VyZShvYmosIHByb3BOYW1lLCBBcnJheSk7XG59XG5cbmZ1bmN0aW9uIF9lbnN1cmUob2JqLCBwcm9wTmFtZSwgdHlwZSl7XG5cdHZhciBpc01hcCA9IChvYmogaW5zdGFuY2VvZiBNYXApO1xuXHR2YXIgdiA9IChpc01hcCk/b2JqLmdldChwcm9wTmFtZSk6b2JqW3Byb3BOYW1lXTtcblx0aWYgKGlzTnVsbCh2KSl7XG5cdFx0diA9ICh0eXBlID09PSBBcnJheSk/W106KG5ldyB0eXBlKTtcblx0XHRpZiAoaXNNYXApe1xuXHRcdFx0b2JqLnNldChwcm9wTmFtZSwgdik7XG5cdFx0fWVsc2V7XG5cdFx0XHRvYmpbcHJvcE5hbWVdID0gdjtcdFxuXHRcdH1cdFx0XG5cdH1cblx0cmV0dXJuIHY7XHRcbn1cblxuLy8gLS0tLS0tLS0tIC9lbnN1cmVUeXBlIC0tLS0tLS0tLSAvL1xuXG4vLyAtLS0tLS0tLS0gYXNUeXBlIC0tLS0tLS0tLSAvL1xuLy8gUmV0dXJuIGFuIGFycmF5IGZyb20gYSB2YWx1ZSBvYmplY3QuIElmIHZhbHVlIGlzIG51bGwvdW5kZWZpbmVkLCByZXR1cm4gZW1wdHkgYXJyYXkuIFxuLy8gSWYgdmFsdWUgaXMgbnVsbCBvciB1bmRlZmluZWQsIHJldHVybiBlbXB0eSBhcnJheVxuLy8gSWYgdGhlIHZhbHVlIGlzIGFuIGFycmF5IGl0IGlzIHJldHVybmVkIGFzIGlzXG4vLyBJZiB0aGUgdmFsdWUgaXMgYSBvYmplY3Qgd2l0aCBmb3JFYWNoL2xlbmd0aCB3aWxsIHJldHVybiBhIG5ldyBhcnJheSBmb3IgdGhlc2UgdmFsdWVzXG4vLyBPdGhlcndpc2UgcmV0dXJuIHNpbmdsZSB2YWx1ZSBhcnJheVxuZnVuY3Rpb24gYXNBcnJheSh2YWx1ZSl7XG5cdGlmICghaXNOdWxsKHZhbHVlKSl7XG5cdFx0aWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpe1xuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblx0XHQvLyBJZiBpdCBpcyBhIG5vZGVMaXN0LCBjb3B5IHRoZSBlbGVtZW50cyBpbnRvIGEgcmVhbCBhcnJheVxuXHRcdGVsc2UgaWYgKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLm5hbWUgPT09IFwiTm9kZUxpc3RcIil7XG5cdFx0XHRyZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodmFsdWUpO1xuXHRcdH0gXG5cdFx0Ly8gaWYgaXQgaXMgYSBmdW5jdGlvbiBhcmd1bWVudHNcblx0XHRlbHNlIGlmICh2YWx1ZS50b1N0cmluZygpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKXtcblx0XHRcdHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh2YWx1ZSk7XG5cdFx0fVxuXHRcdC8vIG90aGVyd2lzZSB3ZSBhZGQgdmFsdWVcblx0XHRlbHNle1xuXHRcdFx0cmV0dXJuIFt2YWx1ZV07XG5cdFx0fVxuXHR9XG5cdC8vIG90aGVyd2lzZSwgcmV0dXJuIGFuIGVtcHR5IGFycmF5XG5cdHJldHVybiBbXTtcbn1cbi8vIC0tLS0tLS0tLSAvYXNUeXBlIC0tLS0tLS0tLSAvL1xuXG4vLyAtLS0tLS0tLS0gU3RyaW5nIFV0aWxzIC0tLS0tLS0tLSAvL1xuZnVuY3Rpb24gc3BsaXRBbmRUcmltKHN0ciwgc2VwKXtcblx0aWYgKHN0ciA9PSBudWxsKXtcblx0XHRyZXR1cm4gW107XG5cdH1cblx0aWYgKHN0ci5pbmRleE9mKHNlcCkgPT09IC0xKXtcblx0XHRyZXR1cm4gW3N0ci50cmltKCldO1xuXHR9XG5cdHJldHVybiBzdHIuc3BsaXQoc2VwKS5tYXAodHJpbSk7XG59XG5cbmZ1bmN0aW9uIHRyaW0oc3RyKXtcblx0cmV0dXJuIHN0ci50cmltKCk7XG59XG4vLyAtLS0tLS0tLS0gL1N0cmluZyBVdGlscyAtLS0tLS0tLS0gLy9cbiIsInZhciBfdmlldyA9IHJlcXVpcmUoXCIuL3ZpZXcuanNcIik7XG52YXIgX2V2ZW50ID0gcmVxdWlyZShcIi4vZXZlbnQuanNcIik7XG5cbi8vIC0tLS0tLS0tLSBFdmVudHMgSG9vayAtLS0tLS0tLS0gLy9cbl92aWV3Lmhvb2soXCJ3aWxsSW5pdFwiLCBmdW5jdGlvbih2aWV3KXtcblx0dmFyIG9wdHMgPSB7bnM6IFwidmlld19cIiArIHZpZXcuaWQsIGN0eDogdmlld307XG5cdGlmICh2aWV3LmV2ZW50cyl7XG5cdFx0YmluZEV2ZW50cyh2aWV3LmV2ZW50cywgdmlldy5lbCwgb3B0cyk7XG5cdH1cblxuXHRpZiAodmlldy5kb2NFdmVudHMpe1xuXHRcdGJpbmRFdmVudHModmlldy5kb2NFdmVudHMsIGRvY3VtZW50LCBvcHRzKTtcblx0fVxuXG5cdGlmICh2aWV3LndpbkV2ZW50cyl7XG5cdFx0YmluZEV2ZW50cyh2aWV3LndpbmRFdmVudHMsIGRvY3VtZW50LCBvcHRzKTtcblx0fVxuXG5cdC8vIFRPRE86IG5lZWQgdG8gYWxsb3cgY2xvc2VzdCBiaW5kaW5nLlxufSk7XG5cbl92aWV3Lmhvb2soXCJ3aWxsUmVtb3ZlXCIsIGZ1bmN0aW9uKHZpZXcpe1xuXHR2YXIgbnMgPSB7bnM6IFwidmlld19cIiArIHZpZXcuaWR9O1xuXHRfZXZlbnQub2ZmKGRvY3VtZW50LCBucyk7XG5cdF9ldmVudC5vZmYod2luZG93LCBucyk7XG5cdC8vIFRPRE86IG5lZWQgdG8gdW5iaW5kIGNsb3Nlc3QvcGFyZW50cyBiaW5kaW5nXG59KTtcblxuZnVuY3Rpb24gYmluZEV2ZW50cyhldmVudHMsIGVsLCBvcHRzKXtcblx0dmFyIGV0eHQsIGV0eHRzLCB0eXBlLCBzZWxlY3Rvcjtcblx0Zm9yIChldHh0IGluIGV2ZW50cyl7XG5cdFx0ZXR4dHMgPSBldHh0LnRyaW0oKS5zcGxpdChcIjtcIik7XG5cdFx0dHlwZSA9IGV0eHRzWzBdLnRyaW0oKTtcblx0XHRzZWxlY3RvciA9IG51bGw7XG5cdFx0aWYgKGV0eHRzLmxlbmd0aCA+IDEpe1xuXHRcdFx0c2VsZWN0b3IgPSBldHh0c1sxXS50cmltKCk7XG5cdFx0fVxuXHRcdF9ldmVudC5vbihlbCwgdHlwZSwgc2VsZWN0b3IsIGV2ZW50c1tldHh0XSwgb3B0cyk7XG5cdH1cbn1cbi8vIFRPRE86IG5lZWQgdG8gdW5iaW5kIG9uIFwid2lsbERlc3Ryb3lcIlxuXG4vLyAtLS0tLS0tLS0gL0V2ZW50cyBIb29rIC0tLS0tLS0tLSAvLyIsInZhciBfdmlldyA9IHJlcXVpcmUoXCIuL3ZpZXcuanNcIik7XG52YXIgX2h1YiA9IHJlcXVpcmUoXCIuL2h1Yi5qc1wiKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xuXG4vLyAtLS0tLS0tLS0gRXZlbnRzIEhvb2sgLS0tLS0tLS0tIC8vXG5fdmlldy5ob29rKFwid2lsbEluaXRcIiwgZnVuY3Rpb24odmlldyl7XG5cdHZhciBvcHRzID0ge25zOiBcInZpZXdfXCIgKyB2aWV3LmlkLCBjdHg6IHZpZXd9O1xuXG5cdGlmICh2aWV3Lmh1YkV2ZW50cyl7XG5cdFx0Ly8gYnVpbGQgdGhlIGxpc3Qgb2YgYmluZGluZ3NcblxuXHRcdHZhciBpbmZvTGlzdCA9IGxpc3RIdWJJbmZvKHZpZXcuaHViRXZlbnRzKTtcblx0XHRpbmZvTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGluZm8pe1xuXHRcdFx0aW5mby5odWIuc3ViKGluZm8udG9waWNzLCBpbmZvLmxhYmVscywgaW5mby5mdW4sIG9wdHMpO1xuXHRcdH0pO1xuXHR9XG5cblx0Ly8gVE9ETzogbmVlZCB0byBhbGxvdyBjbG9zZXN0IGJpbmRpbmcuXG59KTtcblxuX3ZpZXcuaG9vayhcIndpbGxSZW1vdmVcIiwgZnVuY3Rpb24odmlldyl7XG5cdHZhciBucyA9IFwidmlld19cIiArIHZpZXcuaWQ7XG5cdHZhciBpbmZvTGlzdCA9IGxpc3RIdWJJbmZvKHZpZXcuaHViRXZlbnRzKTtcblx0aW5mb0xpc3QuZm9yRWFjaChmdW5jdGlvbihpbmZvKXtcblx0XHRpbmZvLmh1Yi51bnN1Yihucyk7XG5cdH0pO1xufSk7XG5cbmZ1bmN0aW9uIGxpc3RIdWJJbmZvKGh1YkV2ZW50cyl7XG5cdHZhciBrZXksIHZhbCwga2V5MiwgaHViLCBpbmZvTGlzdCA9IFtdO1xuXG5cdGZvciAoa2V5IGluIGh1YkV2ZW50cyl7XG5cdFx0dmFsID0gaHViRXZlbnRzW2tleV07XG5cdFx0aWYgKHR5cGVvZiB2YWwgPT09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHRpbmZvTGlzdC5wdXNoKGdldEh1YkluZm8oa2V5LCBudWxsLCB2YWwpKTtcblx0XHR9ZWxzZXtcblx0XHRcdGtleTI7XG5cdFx0XHRodWIgPSBfaHViLmh1YihrZXkpO1xuXHRcdFx0Zm9yIChrZXkyIGluIHZhbCl7XG5cdFx0XHRcdGluZm9MaXN0LnB1c2goZ2V0SHViSW5mbyhrZXkyLCBodWIsIHZhbFtrZXkyXSkpO1xuXHRcdFx0fVxuXHRcdH1cdFx0XHRcblx0fVxuXHRyZXR1cm4gaW5mb0xpc3Q7XG59XG5cbi8vIHJldHVybnMge2h1YiwgdG9waWNzLCBsYWJlbHN9XG4vLyBodWIgaXMgb3B0aW9uYWwsIGlmIG5vdCBwcmVzZW50LCBhc3N1bWUgdGhlIG5hbWUgd2lsbCBiZSB0aGUgZmlyc3QgaXRlbSB3aWxsIGJlIGluIHRoZSBzdHJcbmZ1bmN0aW9uIGdldEh1YkluZm8oc3RyLCBodWIsIGZ1bil7XG5cdHZhciBhID0gdXRpbHMuc3BsaXRBbmRUcmltKHN0cixcIjtcIik7XG5cdC8vIGlmIG5vIGh1YiwgdGhlbiwgYXNzdW1lIGl0IGlzIGluIHRoZSBzdHJcblx0dmFyIHRvcGljSWR4ID0gKGh1Yik/MDoxO1xuXHR2YXIgaW5mbyA9IHtcblx0XHR0b3BpY3M6IGFbdG9waWNJZHhdLFxuXHRcdGZ1bjogZnVuXG5cdH07XG5cdGlmIChhLmxlbmd0aCA+IHRvcGljSWR4ICsgMSl7XG5cdFx0aW5mby5sYWJlbHMgPSBhW3RvcGljSWR4ICsgMV07XG5cdH1cblx0aW5mby5odWIgPSAoIWh1Yik/X2h1Yi5odWIoYVswXSk6aHViO1xuXHRyZXR1cm4gaW5mbztcbn1cblxuLy8gVE9ETzogbmVlZCB0byB1bmJpbmQgb24gXCJ3aWxsRGVzdHJveVwiXG5cbi8vIC0tLS0tLS0tLSAvRXZlbnRzIEhvb2sgLS0tLS0tLS0tIC8vIiwidmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG52YXIgZG9tID0gcmVxdWlyZShcIi4vZG9tLmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aG9vazogaG9vayxcblx0cmVnaXN0ZXI6IHJlZ2lzdGVyLFxuXHRkaXNwbGF5OiBkaXNwbGF5LCBcblx0cmVtb3ZlOiByZW1vdmUsIFxuXHRlbXB0eTogZW1wdHlcbn07XG5cbnZhciB2aWV3RGVmRGljID0ge307XG5cbnZhciB2aWV3SWRTZXEgPSAwO1xuXG52YXIgaG9va3MgPSB7XG5cdHdpbGxDcmVhdGU6IFtdLFxuXHRkaWRDcmVhdGU6IFtdLFxuXHR3aWxsSW5pdDogW10sXG5cdGRpZEluaXQ6IFtdLFxuXHR3aWxsRGlzcGxheTogW10sXG5cdGRpZERpc3BsYXk6IFtdLFxuXHR3aWxsUG9zdERpc3BsYXk6IFtdLFxuXHRkaWRQb3N0RGlzcGxheTogW10sIFxuXHR3aWxsUmVtb3ZlOiBbXSxcblx0ZGlkUmVtb3ZlOiBbXVxufTtcblxudmFyIGRlZmF1bHRDb25maWcgPSB7XG5cdGFwcGVuZDogXCJsYXN0XCJcbn07XG5cbi8vIC0tLS0tLS0tLSBQdWJsaWMgQVBJcyAtLS0tLS0tLS0gLy9cbmZ1bmN0aW9uIGhvb2sobmFtZSwgZnVuKXtcblx0aG9va3NbbmFtZV0ucHVzaChmdW4pO1xufVxuXG5mdW5jdGlvbiByZWdpc3RlcihuYW1lLCBjb250cm9sbGVyLCBjb25maWcpe1xuXHR2YXIgdmlld0RlZiA9IHtcblx0XHRuYW1lOiBuYW1lLFxuXHRcdGNvbnRyb2xsZXI6IGNvbnRyb2xsZXIsXG5cdFx0Y29uZmlnOiBjb25maWdcblx0fTsgXG5cblx0dmlld0RlZkRpY1tuYW1lXSA9IHZpZXdEZWY7XG59XG5cbmZ1bmN0aW9uIGRpc3BsYXkobmFtZSwgcGFyZW50RWwsIGRhdGEsIGNvbmZpZyl7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHR2YXIgdmlldyA9IGRvSW5zdGFudGlhdGUobmFtZSwgY29uZmlnKTtcblx0XG5cdHJldHVybiBkb0NyZWF0ZSh2aWV3LCBkYXRhKVxuXHQudGhlbihmdW5jdGlvbigpe1xuXHRcdHJldHVybiBkb0luaXQodmlldywgZGF0YSk7XG5cdH0pXG5cdC50aGVuKGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIGRvRGlzcGxheS5jYWxsKHNlbGYsIHZpZXcsIHBhcmVudEVsLCBkYXRhKTtcblx0fSlcblx0LnRoZW4oZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gZG9Qb3N0RGlzcGxheSh2aWV3LCBkYXRhKTtcblx0fSk7XG5cbn1cblxuZnVuY3Rpb24gZW1wdHkoZWxzKXtcblx0dXRpbHMuYXNBcnJheShlbHMpLmZvckVhY2goZnVuY3Rpb24oZWwpe1xuXHRcdHJlbW92ZUVsKGVsLCB0cnVlKTsgLy8gdHJ1ZSB0byBzYXkgY2hpbGRyZW5Pbmx5XG5cdH0pO1xufVxuXG5mdW5jdGlvbiByZW1vdmUoZWxzKXtcblx0dXRpbHMuYXNBcnJheShlbHMpLmZvckVhY2goZnVuY3Rpb24oZWwpe1xuXHRcdHJlbW92ZUVsKGVsKTtcblx0fSk7XG59XG4vLyAtLS0tLS0tLS0gL1B1YmxpYyBBUElzIC0tLS0tLS0tLSAvL1xuXG4vLyB3aWxsIHJlbW92ZSBhIGVsIG9yIGl0cyBjaGlsZHJlblxuZnVuY3Rpb24gcmVtb3ZlRWwoZWwsIGNoaWxkcmVuT25seSl7XG5cdGNoaWxkcmVuT25seSA9IChjaGlsZHJlbk9ubHkgPT09IHRydWUpIDtcblxuXHQvLy8vIEZpcnN0IHdlIHJlbW92ZS9kZXN0b3J5IHRoZSBzdWIgdmlld3Ncblx0dmFyIGNoaWxkcmVuVmlld0VscyA9IHV0aWxzLmFzQXJyYXkoZG9tLmFsbChlbCwgXCIuZC12aWV3XCIpKTtcblxuXHQvLyBSZXZlcnNlIGl0IHRvIHJlbW92ZS9kZXN0cm95IGZyb20gdGhlIGxlYWZcblx0dmFyIHZpZXdFbHMgPSBjaGlsZHJlblZpZXdFbHMucmV2ZXJzZSgpO1xuXG5cdC8vIGNhbGwgZG9SZW1vdmUgb24gZWFjaCB2aWV3IHRvIGhhdmUgdGhlIGxpZmVjeWNsZSBwZXJmb3JtZWQgKHdpbGxSZW1vdmUvZGlkUmVtb3ZlLCAuZGVzdHJveSlcblx0dmlld0Vscy5mb3JFYWNoKGZ1bmN0aW9uKHZpZXdFbCl7XG5cdFx0aWYgKHZpZXdFbC5fdmlldyl7XG5cdFx0XHRkb1JlbW92ZSh2aWV3RWwuX3ZpZXcpO1x0XG5cdFx0fWVsc2V7XG5cdFx0XHQvLyB3ZSBzaG91bGQgbm90IGJlIGhlcmUsIGJ1dCBzb21laG93IGl0IGhhcHBlbnMgaW4gc29tZSBhcHAgY29kZSAobG9nZ2luIHdhcm5uaW5nKVxuXHRcdFx0Y29uc29sZS5sb2coXCJNVkRPTSAtIFdBUk5JTkcgLSB0aGUgZm9sbG93aW5nIGRvbSBlbGVtZW50IHNob3VsZCBoYXZlIGEgLl92aWV3IHByb3BlcnR5IGJ1dCBpdCBpcyBub3Q/IChzYWZlIGlnbm9yZSlcIiwgdmlld0VsKTtcblx0XHRcdC8vIE5PVEU6IHdlIGRvIG5vdCBuZWVkIHRvIHJlbW92ZSB0aGUgZG9tIGVsZW1lbnQgYXMgaXQgd2lsbCBiZSB0YWtlbiBjYXJlIGJ5IHRoZSBsb2dpYyBiZWxvdyAoYXZvaWRpbmcgdW5jZXNzYXJ5IGRvbSByZW1vdmUpXG5cdFx0fVxuXHRcdFxuXHR9KTtcblxuXHQvLyBpZiBpdCBpcyByZW1vdmluZyBvbmx5IHRoZSBjaGlsZHJlbiwgdGhlbiwgbGV0J3MgbWFrZSBzdXJlIHRoYXQgYWxsIGRpcmVjdCBjaGlsZHJlbiBlbGVtZW50cyBhcmUgcmVtb3ZlZFxuXHQvLyAoYXMgdGhlIGxvZ2ljIGFib3ZlIG9ubHkgcmVtb3ZlIHRoZSB2aWV3RWwpXG5cdGlmIChjaGlsZHJlbk9ubHkpe1xuXHRcdC8vIFRoZW4sIHdlIGNhbiByZW1vdmUgYWxsIG9mIHRoZSBkLlxuXHRcdHdoaWxlIChlbC5sYXN0Q2hpbGQpIHtcblx0XHRcdGVsLnJlbW92ZUNoaWxkKGVsLmxhc3RDaGlsZCk7XG5cdFx0fVxuXHR9ZWxzZXtcblx0XHQvLyBpZiBpdCBpcyBhIHZpZXcsIHdlIHJlbW92ZSB0aGUgdmlld3dpdGggZG9SZW1vdmVcblx0XHRpZiAoZWwuX3ZpZXcpe1xuXHRcdFx0ZG9SZW1vdmUoZWwuX3ZpZXcpO1xuXHRcdH1lbHNle1xuXHRcdFx0aWYgKGVsLnBhcmVudE5vZGUpe1xuXHRcdFx0XHRlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKTtcdFxuXHRcdFx0fVx0XHRcdFxuXHRcdH1cblx0fVxuXG59XG5cblxuXG4vLyByZXR1cm4gdGhlIFwidmlld1wiIGluc3RhbmNlXG4vLyBUT0RPOiBuZWVkIHRvIGJlIGFzeW5jIGFzIHdlbGwgYW5kIGFsbG93ZWQgZm9yIGxvYWRpbmcgY29tcG9uZW50IGlmIG5vdCBleGlzdFxuZnVuY3Rpb24gZG9JbnN0YW50aWF0ZShuYW1lLCBjb25maWcpe1xuXG5cdC8vIGlmIHRoZSBjb25maWcgaXMgYSBzdHJpbmcsIHRoZW4gYXNzdW1lIGl0IGlzIHRoZSBhcHBlbmQgZGlyZWN0aXZlLlxuXHRpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJzdHJpbmdcIil7XG5cdFx0Y29uZmlnID0ge2FwcGVuZDogY29uZmlnfTtcblx0fVxuXG5cblx0Ly8gZ2V0IHRoZSB2aWV3IGRlZiBmcm9tIHRoZSBkaWN0aW9uYXJ5XG5cdHZhciB2aWV3RGVmID0gdmlld0RlZkRpY1tuYW1lXTtcblxuXHQvLyBpZiB2aWV3RGVmIG5vdCBmb3VuZCwgdGhyb3cgYW4gZXhjZXB0aW9uIChQcm9iYWJseSBub3QgcmVnaXN0ZXJlZClcblx0aWYgKCF2aWV3RGVmKXtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJtdmRvbSBFUlJPUiAtIFZpZXcgZGVmaW5pdGlvbiBmb3IgJ1wiICsgbmFtZSArIFwiJyBub3QgZm91bmQuIE1ha2Ugc3VyZSB0byBjYWxsIGQucmVnaXN0ZXIodmlld05hbWUsIHZpZXdDb250cm9sbGVyKS5cIik7XG5cdH1cblxuXHQvLyBpbnN0YW50aWF0ZSB0aGUgdmlldyBpbnN0YW5jZVxuXHR2YXIgdmlldyA9IE9iamVjdC5hc3NpZ24oe30sIHZpZXdEZWYuY29udHJvbGxlcik7XG5cblx0Ly8gc2V0IHRoZSBjb25maWdcblx0dmlldy5jb25maWcgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0Q29uZmlnLCB2aWV3RGVmLmNvbmZpZywgY29uZmlnKTtcblxuXHQvLyBzZXQgdGhlIGlkXG5cdHZpZXcuaWQgPSB2aWV3SWRTZXErKztcblxuXHQvLyBzZXQgdGhlIG5hbWVcblx0dmlldy5uYW1lID0gbmFtZTtcblxuXHRyZXR1cm4gdmlldztcbn1cblxuLy8gcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHJlc29sdmUgd2l0aCBub3RoaW5nLlxuZnVuY3Rpb24gZG9DcmVhdGUodmlldywgZGF0YSl7XG5cdHBlcmZvcm1Ib29rKFwid2lsbENyZWF0ZVwiLCB2aWV3KTtcblxuXHQvLyBDYWxsIHRoZSB2aWV3LmNyZWF0ZVxuXHR2YXIgcCA9IFByb21pc2UucmVzb2x2ZSh2aWV3LmNyZWF0ZShkYXRhKSk7XG5cblx0cmV0dXJuIHAudGhlbihmdW5jdGlvbihodG1sX29yX25vZGUpe1xuXG5cdFx0dmFyIG5vZGUgPSAodHlwZW9mIGh0bWxfb3Jfbm9kZSA9PT0gXCJzdHJpbmdcIik/ZG9tLmZyYWcoaHRtbF9vcl9ub2RlKTpodG1sX29yX25vZGU7XG5cblx0XHQvLyBJZiB3ZSBoYXZlIGEgZnJhZ3VtZW50XG5cdFx0aWYgKG5vZGUubm9kZVR5cGUgPT09IDExKXtcblx0XHRcdGlmIChub2RlLmNoaWxkTm9kZXMubGVuZ3RoID4gMSl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwibXZkb20gLSBXQVJOSU5HIC0gdmlldyBIVE1MIGZvciB2aWV3XCIsIHZpZXcsIFwiaGFzIG11bHRpcGxlIGNoaWxkTm9kZXMsIGJ1dCBzaG91bGQgaGF2ZSBvbmx5IG9uZS4gRmFsbGJhY2sgYnkgdGFraW5nIHRoZSBmaXJzdCBvbmUsIGJ1dCBjaGVjayBjb2RlLlwiKTtcblx0XHRcdH1cblx0XHRcdG5vZGUgPSBub2RlLmZpcnN0Q2hpbGQ7XG5cdFx0fVxuXG5cdFx0Ly8gbWFrZSBzdXJlIHRoYXQgdGhlIG5vZGUgaXMgb2YgdGltZSBFbGVtZW50XG5cdFx0aWYgKG5vZGUubm9kZVR5cGUgIT09IDEpe1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiZWwgZm9yIHZpZXcgXCIgKyB2aWV3Lm5hbWUgKyBcIiBpcyBub2RlIG9mIHR5cGUgRWxlbWVudC4gXCIgKyBub2RlKTtcblx0XHR9XG5cblx0XHR2YXIgdmlld0VsID0gbm9kZTtcblxuXHRcdC8vIHNldCB0aGUgdmlldy5lbCBhbmQgdmlldy5lbC5fdmlld1xuXHRcdHZpZXcuZWwgPSB2aWV3RWw7XG5cdFx0dmlldy5lbC5jbGFzc0xpc3QuYWRkKFwiZC12aWV3XCIpO1xuXHRcdHZpZXcuZWwuX3ZpZXcgPSB2aWV3OyBcblxuXHRcdHBlcmZvcm1Ib29rKFwiZGlkQ3JlYXRlXCIsIHZpZXcpO1x0XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBkb0luaXQodmlldywgZGF0YSl7XG5cdHBlcmZvcm1Ib29rKFwid2lsbEluaXRcIiwgdmlldyk7XG5cdHZhciByZXM7XG5cblx0aWYgKHZpZXcuaW5pdCl7XG5cdFx0cmVzID0gdmlldy5pbml0KGRhdGEpO1xuXHR9XG5cdHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzKS50aGVuKGZ1bmN0aW9uKCl7XG5cdFx0cGVyZm9ybUhvb2soXCJkaWRJbml0XCIsIHZpZXcpO1x0XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBkb0Rpc3BsYXkodmlldywgcmVmRWwsIGRhdGEpe1xuXHRwZXJmb3JtSG9vayhcIndpbGxEaXNwbGF5XCIsIHZpZXcpO1xuXG5cdHRyeXtcdFx0XG5cdFx0Ly8gV09SS0FST1VORDogdGhpcyBuZWVkcyB0b2JlIHRoZSBtdmRvbSwgc2luY2Ugd2UgaGF2ZSBjeWNsaWMgcmVmZXJlbmNlIGJldHdlZW4gZG9tLmpzIGFuZCB2aWV3LmpzIChvbiBlbXB0eSlcblx0XHRkb20uYXBwZW5kLmNhbGwodGhpcywgcmVmRWwsIHZpZXcuZWwsIHZpZXcuY29uZmlnLmFwcGVuZCk7XG5cdH1jYXRjaChleCl7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwibXZkb20gRVJST1IgLSBDYW5ub3QgYWRkIHZpZXcuZWwgXCIgKyB2aWV3LmVsICsgXCIgdG8gcmVmRWwgXCIgKyByZWZFbCArIFwiLiBDYXVzZTogXCIgKyBleC50b1N0cmluZygpKTtcblx0fVxuXG5cdHBlcmZvcm1Ib29rKFwiZGlkRGlzcGxheVwiLCB2aWV3KTtcblxuXHRyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgZmFpbCl7XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0cmVzb2x2ZSgpO1xuXHRcdH0sMCk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBkb1Bvc3REaXNwbGF5KHZpZXcsIGRhdGEpe1xuXHRwZXJmb3JtSG9vayhcIndpbGxQb3N0RGlzcGxheVwiLCB2aWV3KTtcblxuXHR2YXIgcmVzdWx0O1xuXHRpZiAodmlldy5wb3N0RGlzcGxheSl7XG5cdFx0cmVzdWx0ID0gdmlldy5wb3N0RGlzcGxheShkYXRhKTtcblx0fVxuXG5cdHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0KS50aGVuKGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHZpZXc7XG5cdH0pO1xuXG59XG5cbmZ1bmN0aW9uIGRvUmVtb3ZlKHZpZXcpe1xuXHQvLyBOb3RlOiBvbiB3aWxsUmVtb3ZlIGFsbCBvZiB0aGUgZXZlbnRzIGJvdW5kIHRvIGRvY3VtZW50cywgd2luZG93LCBwYXJlbnRFbGVtZW50cywgaHVicyB3aWxsIGJlIHVuYmluZC5cblx0cGVyZm9ybUhvb2soXCJ3aWxsUmVtb3ZlXCIsIHZpZXcpO1xuXG5cdC8vIHJlbW92ZSBpdCBmcm9tIHRoZSBET01cblx0Ly8gTk9URTogdGhpcyBtZWFucyB0aGF0IHRoZSBkZXRhY2ggd29uJ3QgcmVtb3ZlIHRoZSBub2RlIGZyb20gdGhlIERPTVxuXHQvLyAgICAgICB3aGljaCBhdm9pZCByZW1vdmluZyB1bmNlc3Nhcnkgbm9kZSwgYnV0IG1lYW5zIHRoYXQgZGlkRGV0YWNoIHdpbGxcblx0Ly8gICAgICAgc3RpbGwgaGF2ZSBhIHZpZXcuZWwgaW4gdGhlIERPTVxuXHR2YXIgcGFyZW50RWw7XG5cdGlmICh2aWV3LmVsICYmIHZpZXcuZWwucGFyZW50Tm9kZSl7XG5cdFx0cGFyZW50RWwgPSB2aWV3LmVsLnBhcmVudE5vZGU7XG5cdFx0dmlldy5lbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHZpZXcuZWwpO1xuXHR9XHRcblxuXHQvLyB3ZSBjYWxsIFxuXHRpZiAodmlldy5kZXN0cm95KXtcblx0XHR2aWV3LmRlc3Ryb3koe3BhcmVudEVsOnBhcmVudEVsfSk7XG5cdH1cblx0XG5cdHBlcmZvcm1Ib29rKFwiZGlkUmVtb3ZlXCIsIHZpZXcpO1xufVxuXG5cbmZ1bmN0aW9uIHBlcmZvcm1Ib29rKG5hbWUsIHZpZXcpe1xuXHR2YXIgaG9va0Z1bnMgPSBob29rc1tuYW1lXTtcblx0dmFyIGk9IDAgLCBsID0gaG9va0Z1bnMubGVuZ3RoLCBmdW47XG5cdGZvciAoOyBpIDwgbDsgaSsrKXtcblx0XHRmdW4gPSBob29rRnVuc1tpXTtcblx0XHRmdW4odmlldyk7XG5cdH1cbn1cblxuXG4iLCIvLyBtaW5pbWFsIGxpYnJhcnkgZW50cnkgcG9pbnQuXHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXgtbWluaW1hbFwiKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBwcm90b2J1ZiA9IGV4cG9ydHM7XHJcblxyXG4vKipcclxuICogQnVpbGQgdHlwZSwgb25lIG9mIGBcImZ1bGxcImAsIGBcImxpZ2h0XCJgIG9yIGBcIm1pbmltYWxcImAuXHJcbiAqIEBuYW1lIGJ1aWxkXHJcbiAqIEB0eXBlIHtzdHJpbmd9XHJcbiAqIEBjb25zdFxyXG4gKi9cclxucHJvdG9idWYuYnVpbGQgPSBcIm1pbmltYWxcIjtcclxuXHJcbi8vIFNlcmlhbGl6YXRpb25cclxucHJvdG9idWYuV3JpdGVyICAgICAgID0gcmVxdWlyZShcIi4vd3JpdGVyXCIpO1xyXG5wcm90b2J1Zi5CdWZmZXJXcml0ZXIgPSByZXF1aXJlKFwiLi93cml0ZXJfYnVmZmVyXCIpO1xyXG5wcm90b2J1Zi5SZWFkZXIgICAgICAgPSByZXF1aXJlKFwiLi9yZWFkZXJcIik7XHJcbnByb3RvYnVmLkJ1ZmZlclJlYWRlciA9IHJlcXVpcmUoXCIuL3JlYWRlcl9idWZmZXJcIik7XHJcblxyXG4vLyBVdGlsaXR5XHJcbnByb3RvYnVmLnV0aWwgICAgICAgICA9IHJlcXVpcmUoXCIuL3V0aWwvbWluaW1hbFwiKTtcclxucHJvdG9idWYucnBjICAgICAgICAgID0gcmVxdWlyZShcIi4vcnBjXCIpO1xyXG5wcm90b2J1Zi5yb290cyAgICAgICAgPSByZXF1aXJlKFwiLi9yb290c1wiKTtcclxucHJvdG9idWYuY29uZmlndXJlICAgID0gY29uZmlndXJlO1xyXG5cclxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuLyoqXHJcbiAqIFJlY29uZmlndXJlcyB0aGUgbGlicmFyeSBhY2NvcmRpbmcgdG8gdGhlIGVudmlyb25tZW50LlxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuZnVuY3Rpb24gY29uZmlndXJlKCkge1xyXG4gICAgcHJvdG9idWYuUmVhZGVyLl9jb25maWd1cmUocHJvdG9idWYuQnVmZmVyUmVhZGVyKTtcclxuICAgIHByb3RvYnVmLnV0aWwuX2NvbmZpZ3VyZSgpO1xyXG59XHJcblxyXG4vLyBDb25maWd1cmUgc2VyaWFsaXphdGlvblxyXG5wcm90b2J1Zi5Xcml0ZXIuX2NvbmZpZ3VyZShwcm90b2J1Zi5CdWZmZXJXcml0ZXIpO1xyXG5jb25maWd1cmUoKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gUmVhZGVyO1xyXG5cclxudmFyIHV0aWwgICAgICA9IHJlcXVpcmUoXCIuL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbnZhciBCdWZmZXJSZWFkZXI7IC8vIGN5Y2xpY1xyXG5cclxudmFyIExvbmdCaXRzICA9IHV0aWwuTG9uZ0JpdHMsXHJcbiAgICB1dGY4ICAgICAgPSB1dGlsLnV0Zjg7XHJcblxyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG5mdW5jdGlvbiBpbmRleE91dE9mUmFuZ2UocmVhZGVyLCB3cml0ZUxlbmd0aCkge1xyXG4gICAgcmV0dXJuIFJhbmdlRXJyb3IoXCJpbmRleCBvdXQgb2YgcmFuZ2U6IFwiICsgcmVhZGVyLnBvcyArIFwiICsgXCIgKyAod3JpdGVMZW5ndGggfHwgMSkgKyBcIiA+IFwiICsgcmVhZGVyLmxlbik7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHJlYWRlciBpbnN0YW5jZSB1c2luZyB0aGUgc3BlY2lmaWVkIGJ1ZmZlci5cclxuICogQGNsYXNzZGVzYyBXaXJlIGZvcm1hdCByZWFkZXIgdXNpbmcgYFVpbnQ4QXJyYXlgIGlmIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGBBcnJheWAuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBCdWZmZXIgdG8gcmVhZCBmcm9tXHJcbiAqL1xyXG5mdW5jdGlvbiBSZWFkZXIoYnVmZmVyKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWFkIGJ1ZmZlci5cclxuICAgICAqIEB0eXBlIHtVaW50OEFycmF5fVxyXG4gICAgICovXHJcbiAgICB0aGlzLmJ1ZiA9IGJ1ZmZlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlYWQgYnVmZmVyIHBvc2l0aW9uLlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5wb3MgPSAwO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVhZCBidWZmZXIgbGVuZ3RoLlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5sZW4gPSBidWZmZXIubGVuZ3RoO1xyXG59XHJcblxyXG52YXIgY3JlYXRlX2FycmF5ID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCJcclxuICAgID8gZnVuY3Rpb24gY3JlYXRlX3R5cGVkX2FycmF5KGJ1ZmZlcikge1xyXG4gICAgICAgIGlmIChidWZmZXIgaW5zdGFuY2VvZiBVaW50OEFycmF5IHx8IEFycmF5LmlzQXJyYXkoYnVmZmVyKSlcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWFkZXIoYnVmZmVyKTtcclxuICAgICAgICB0aHJvdyBFcnJvcihcImlsbGVnYWwgYnVmZmVyXCIpO1xyXG4gICAgfVxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIDogZnVuY3Rpb24gY3JlYXRlX2FycmF5KGJ1ZmZlcikge1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGJ1ZmZlcikpXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVhZGVyKGJ1ZmZlcik7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJpbGxlZ2FsIGJ1ZmZlclwiKTtcclxuICAgIH07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyByZWFkZXIgdXNpbmcgdGhlIHNwZWNpZmllZCBidWZmZXIuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl8QnVmZmVyfSBidWZmZXIgQnVmZmVyIHRvIHJlYWQgZnJvbVxyXG4gKiBAcmV0dXJucyB7UmVhZGVyfEJ1ZmZlclJlYWRlcn0gQSB7QGxpbmsgQnVmZmVyUmVhZGVyfSBpZiBgYnVmZmVyYCBpcyBhIEJ1ZmZlciwgb3RoZXJ3aXNlIGEge0BsaW5rIFJlYWRlcn1cclxuICogQHRocm93cyB7RXJyb3J9IElmIGBidWZmZXJgIGlzIG5vdCBhIHZhbGlkIGJ1ZmZlclxyXG4gKi9cclxuUmVhZGVyLmNyZWF0ZSA9IHV0aWwuQnVmZmVyXHJcbiAgICA/IGZ1bmN0aW9uIGNyZWF0ZV9idWZmZXJfc2V0dXAoYnVmZmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIChSZWFkZXIuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlX2J1ZmZlcihidWZmZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHV0aWwuQnVmZmVyLmlzQnVmZmVyKGJ1ZmZlcilcclxuICAgICAgICAgICAgICAgID8gbmV3IEJ1ZmZlclJlYWRlcihidWZmZXIpXHJcbiAgICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgICAgICAgICAgOiBjcmVhdGVfYXJyYXkoYnVmZmVyKTtcclxuICAgICAgICB9KShidWZmZXIpO1xyXG4gICAgfVxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIDogY3JlYXRlX2FycmF5O1xyXG5cclxuUmVhZGVyLnByb3RvdHlwZS5fc2xpY2UgPSB1dGlsLkFycmF5LnByb3RvdHlwZS5zdWJhcnJheSB8fCAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyB1dGlsLkFycmF5LnByb3RvdHlwZS5zbGljZTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHZhcmludCBhcyBhbiB1bnNpZ25lZCAzMiBiaXQgdmFsdWUuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLnVpbnQzMiA9IChmdW5jdGlvbiByZWFkX3VpbnQzMl9zZXR1cCgpIHtcclxuICAgIHZhciB2YWx1ZSA9IDQyOTQ5NjcyOTU7IC8vIG9wdGltaXplciB0eXBlLWhpbnQsIHRlbmRzIHRvIGRlb3B0IG90aGVyd2lzZSAoPyEpXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gcmVhZF91aW50MzIoKSB7XHJcbiAgICAgICAgdmFsdWUgPSAoICAgICAgICAgdGhpcy5idWZbdGhpcy5wb3NdICYgMTI3ICAgICAgICkgPj4+IDA7IGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOCkgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIHZhbHVlID0gKHZhbHVlIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgIDcpID4+PiAwOyBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB2YWx1ZSA9ICh2YWx1ZSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IDE0KSA+Pj4gMDsgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KSByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgdmFsdWUgPSAodmFsdWUgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCAyMSkgPj4+IDA7IGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOCkgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIHZhbHVlID0gKHZhbHVlIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmICAxNSkgPDwgMjgpID4+PiAwOyBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpIHJldHVybiB2YWx1ZTtcclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICAgICAgaWYgKCh0aGlzLnBvcyArPSA1KSA+IHRoaXMubGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9zID0gdGhpcy5sZW47XHJcbiAgICAgICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCAxMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG4vKipcclxuICogUmVhZHMgYSB2YXJpbnQgYXMgYSBzaWduZWQgMzIgYml0IHZhbHVlLlxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLmludDMyID0gZnVuY3Rpb24gcmVhZF9pbnQzMigpIHtcclxuICAgIHJldHVybiB0aGlzLnVpbnQzMigpIHwgMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHppZy16YWcgZW5jb2RlZCB2YXJpbnQgYXMgYSBzaWduZWQgMzIgYml0IHZhbHVlLlxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLnNpbnQzMiA9IGZ1bmN0aW9uIHJlYWRfc2ludDMyKCkge1xyXG4gICAgdmFyIHZhbHVlID0gdGhpcy51aW50MzIoKTtcclxuICAgIHJldHVybiB2YWx1ZSA+Pj4gMSBeIC0odmFsdWUgJiAxKSB8IDA7XHJcbn07XHJcblxyXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cclxuXHJcbmZ1bmN0aW9uIHJlYWRMb25nVmFyaW50KCkge1xyXG4gICAgLy8gdGVuZHMgdG8gZGVvcHQgd2l0aCBsb2NhbCB2YXJzIGZvciBvY3RldCBldGMuXHJcbiAgICB2YXIgYml0cyA9IG5ldyBMb25nQml0cygwLCAwKTtcclxuICAgIHZhciBpID0gMDtcclxuICAgIGlmICh0aGlzLmxlbiAtIHRoaXMucG9zID4gNCkgeyAvLyBmYXN0IHJvdXRlIChsbylcclxuICAgICAgICBmb3IgKDsgaSA8IDQ7ICsraSkge1xyXG4gICAgICAgICAgICAvLyAxc3QuLjR0aFxyXG4gICAgICAgICAgICBiaXRzLmxvID0gKGJpdHMubG8gfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCBpICogNykgPj4+IDA7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOClcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaXRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyA1dGhcclxuICAgICAgICBiaXRzLmxvID0gKGJpdHMubG8gfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCAyOCkgPj4+IDA7XHJcbiAgICAgICAgYml0cy5oaSA9IChiaXRzLmhpIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPj4gIDQpID4+PiAwO1xyXG4gICAgICAgIGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOClcclxuICAgICAgICAgICAgcmV0dXJuIGJpdHM7XHJcbiAgICAgICAgaSA9IDA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZvciAoOyBpIDwgMzsgKytpKSB7XHJcbiAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5sZW4pXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcyk7XHJcbiAgICAgICAgICAgIC8vIDFzdC4uM3RoXHJcbiAgICAgICAgICAgIGJpdHMubG8gPSAoYml0cy5sbyB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IGkgKiA3KSA+Pj4gMDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpdHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDR0aFxyXG4gICAgICAgIGJpdHMubG8gPSAoYml0cy5sbyB8ICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSAmIDEyNykgPDwgaSAqIDcpID4+PiAwO1xyXG4gICAgICAgIHJldHVybiBiaXRzO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubGVuIC0gdGhpcy5wb3MgPiA0KSB7IC8vIGZhc3Qgcm91dGUgKGhpKVxyXG4gICAgICAgIGZvciAoOyBpIDwgNTsgKytpKSB7XHJcbiAgICAgICAgICAgIC8vIDZ0aC4uMTB0aFxyXG4gICAgICAgICAgICBiaXRzLmhpID0gKGJpdHMuaGkgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCBpICogNyArIDMpID4+PiAwO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYml0cztcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZvciAoOyBpIDwgNTsgKytpKSB7XHJcbiAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5sZW4pXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcyk7XHJcbiAgICAgICAgICAgIC8vIDZ0aC4uMTB0aFxyXG4gICAgICAgICAgICBiaXRzLmhpID0gKGJpdHMuaGkgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCBpICogNyArIDMpID4+PiAwO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYml0cztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgdGhyb3cgRXJyb3IoXCJpbnZhbGlkIHZhcmludCBlbmNvZGluZ1wiKTtcclxufVxyXG5cclxuLyogZXNsaW50LWVuYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHZhcmludCBhcyBhIHNpZ25lZCA2NCBiaXQgdmFsdWUuXHJcbiAqIEBuYW1lIFJlYWRlciNpbnQ2NFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0xvbmd9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSB2YXJpbnQgYXMgYW4gdW5zaWduZWQgNjQgYml0IHZhbHVlLlxyXG4gKiBAbmFtZSBSZWFkZXIjdWludDY0XHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7TG9uZ30gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHppZy16YWcgZW5jb2RlZCB2YXJpbnQgYXMgYSBzaWduZWQgNjQgYml0IHZhbHVlLlxyXG4gKiBAbmFtZSBSZWFkZXIjc2ludDY0XHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7TG9uZ30gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHZhcmludCBhcyBhIGJvb2xlYW4uXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLmJvb2wgPSBmdW5jdGlvbiByZWFkX2Jvb2woKSB7XHJcbiAgICByZXR1cm4gdGhpcy51aW50MzIoKSAhPT0gMDtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHJlYWRGaXhlZDMyX2VuZChidWYsIGVuZCkgeyAvLyBub3RlIHRoYXQgdGhpcyB1c2VzIGBlbmRgLCBub3QgYHBvc2BcclxuICAgIHJldHVybiAoYnVmW2VuZCAtIDRdXHJcbiAgICAgICAgICB8IGJ1ZltlbmQgLSAzXSA8PCA4XHJcbiAgICAgICAgICB8IGJ1ZltlbmQgLSAyXSA8PCAxNlxyXG4gICAgICAgICAgfCBidWZbZW5kIC0gMV0gPDwgMjQpID4+PiAwO1xyXG59XHJcblxyXG4vKipcclxuICogUmVhZHMgZml4ZWQgMzIgYml0cyBhcyBhbiB1bnNpZ25lZCAzMiBiaXQgaW50ZWdlci5cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5maXhlZDMyID0gZnVuY3Rpb24gcmVhZF9maXhlZDMyKCkge1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKHRoaXMucG9zICsgNCA+IHRoaXMubGVuKVxyXG4gICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCA0KTtcclxuXHJcbiAgICByZXR1cm4gcmVhZEZpeGVkMzJfZW5kKHRoaXMuYnVmLCB0aGlzLnBvcyArPSA0KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBmaXhlZCAzMiBiaXRzIGFzIGEgc2lnbmVkIDMyIGJpdCBpbnRlZ2VyLlxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLnNmaXhlZDMyID0gZnVuY3Rpb24gcmVhZF9zZml4ZWQzMigpIHtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICh0aGlzLnBvcyArIDQgPiB0aGlzLmxlbilcclxuICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgNCk7XHJcblxyXG4gICAgcmV0dXJuIHJlYWRGaXhlZDMyX2VuZCh0aGlzLmJ1ZiwgdGhpcy5wb3MgKz0gNCkgfCAwO1xyXG59O1xyXG5cclxuLyogZXNsaW50LWRpc2FibGUgbm8taW52YWxpZC10aGlzICovXHJcblxyXG5mdW5jdGlvbiByZWFkRml4ZWQ2NCgvKiB0aGlzOiBSZWFkZXIgKi8pIHtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICh0aGlzLnBvcyArIDggPiB0aGlzLmxlbilcclxuICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgOCk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBMb25nQml0cyhyZWFkRml4ZWQzMl9lbmQodGhpcy5idWYsIHRoaXMucG9zICs9IDQpLCByZWFkRml4ZWQzMl9lbmQodGhpcy5idWYsIHRoaXMucG9zICs9IDQpKTtcclxufVxyXG5cclxuLyogZXNsaW50LWVuYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBmaXhlZCA2NCBiaXRzLlxyXG4gKiBAbmFtZSBSZWFkZXIjZml4ZWQ2NFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0xvbmd9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgemlnLXphZyBlbmNvZGVkIGZpeGVkIDY0IGJpdHMuXHJcbiAqIEBuYW1lIFJlYWRlciNzZml4ZWQ2NFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0xvbmd9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSBmbG9hdCAoMzIgYml0KSBhcyBhIG51bWJlci5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuZmxvYXQgPSBmdW5jdGlvbiByZWFkX2Zsb2F0KCkge1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKHRoaXMucG9zICsgNCA+IHRoaXMubGVuKVxyXG4gICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCA0KTtcclxuXHJcbiAgICB2YXIgdmFsdWUgPSB1dGlsLmZsb2F0LnJlYWRGbG9hdExFKHRoaXMuYnVmLCB0aGlzLnBvcyk7XHJcbiAgICB0aGlzLnBvcyArPSA0O1xyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgZG91YmxlICg2NCBiaXQgZmxvYXQpIGFzIGEgbnVtYmVyLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5kb3VibGUgPSBmdW5jdGlvbiByZWFkX2RvdWJsZSgpIHtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICh0aGlzLnBvcyArIDggPiB0aGlzLmxlbilcclxuICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgNCk7XHJcblxyXG4gICAgdmFyIHZhbHVlID0gdXRpbC5mbG9hdC5yZWFkRG91YmxlTEUodGhpcy5idWYsIHRoaXMucG9zKTtcclxuICAgIHRoaXMucG9zICs9IDg7XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgYSBzZXF1ZW5jZSBvZiBieXRlcyBwcmVjZWVkZWQgYnkgaXRzIGxlbmd0aCBhcyBhIHZhcmludC5cclxuICogQHJldHVybnMge1VpbnQ4QXJyYXl9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuYnl0ZXMgPSBmdW5jdGlvbiByZWFkX2J5dGVzKCkge1xyXG4gICAgdmFyIGxlbmd0aCA9IHRoaXMudWludDMyKCksXHJcbiAgICAgICAgc3RhcnQgID0gdGhpcy5wb3MsXHJcbiAgICAgICAgZW5kICAgID0gdGhpcy5wb3MgKyBsZW5ndGg7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAoZW5kID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIGxlbmd0aCk7XHJcblxyXG4gICAgdGhpcy5wb3MgKz0gbGVuZ3RoO1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5idWYpKSAvLyBwbGFpbiBhcnJheVxyXG4gICAgICAgIHJldHVybiB0aGlzLmJ1Zi5zbGljZShzdGFydCwgZW5kKTtcclxuICAgIHJldHVybiBzdGFydCA9PT0gZW5kIC8vIGZpeCBmb3IgSUUgMTAvV2luOCBhbmQgb3RoZXJzJyBzdWJhcnJheSByZXR1cm5pbmcgYXJyYXkgb2Ygc2l6ZSAxXHJcbiAgICAgICAgPyBuZXcgdGhpcy5idWYuY29uc3RydWN0b3IoMClcclxuICAgICAgICA6IHRoaXMuX3NsaWNlLmNhbGwodGhpcy5idWYsIHN0YXJ0LCBlbmQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgc3RyaW5nIHByZWNlZWRlZCBieSBpdHMgYnl0ZSBsZW5ndGggYXMgYSB2YXJpbnQuXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuc3RyaW5nID0gZnVuY3Rpb24gcmVhZF9zdHJpbmcoKSB7XHJcbiAgICB2YXIgYnl0ZXMgPSB0aGlzLmJ5dGVzKCk7XHJcbiAgICByZXR1cm4gdXRmOC5yZWFkKGJ5dGVzLCAwLCBieXRlcy5sZW5ndGgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNraXBzIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGJ5dGVzIGlmIHNwZWNpZmllZCwgb3RoZXJ3aXNlIHNraXBzIGEgdmFyaW50LlxyXG4gKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aF0gTGVuZ3RoIGlmIGtub3duLCBvdGhlcndpc2UgYSB2YXJpbnQgaXMgYXNzdW1lZFxyXG4gKiBAcmV0dXJucyB7UmVhZGVyfSBgdGhpc2BcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuc2tpcCA9IGZ1bmN0aW9uIHNraXAobGVuZ3RoKSB7XHJcbiAgICBpZiAodHlwZW9mIGxlbmd0aCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgICAgIGlmICh0aGlzLnBvcyArIGxlbmd0aCA+IHRoaXMubGVuKVxyXG4gICAgICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgbGVuZ3RoKTtcclxuICAgICAgICB0aGlzLnBvcyArPSBsZW5ndGg7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmxlbilcclxuICAgICAgICAgICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzKTtcclxuICAgICAgICB9IHdoaWxlICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSAmIDEyOCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTa2lwcyB0aGUgbmV4dCBlbGVtZW50IG9mIHRoZSBzcGVjaWZpZWQgd2lyZSB0eXBlLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gd2lyZVR5cGUgV2lyZSB0eXBlIHJlY2VpdmVkXHJcbiAqIEByZXR1cm5zIHtSZWFkZXJ9IGB0aGlzYFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5za2lwVHlwZSA9IGZ1bmN0aW9uKHdpcmVUeXBlKSB7XHJcbiAgICBzd2l0Y2ggKHdpcmVUeXBlKSB7XHJcbiAgICAgICAgY2FzZSAwOlxyXG4gICAgICAgICAgICB0aGlzLnNraXAoKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgICB0aGlzLnNraXAoOCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgdGhpcy5za2lwKHRoaXMudWludDMyKCkpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgIGRvIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zdGFudC1jb25kaXRpb25cclxuICAgICAgICAgICAgICAgIGlmICgod2lyZVR5cGUgPSB0aGlzLnVpbnQzMigpICYgNykgPT09IDQpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNraXBUeXBlKHdpcmVUeXBlKTtcclxuICAgICAgICAgICAgfSB3aGlsZSAodHJ1ZSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNTpcclxuICAgICAgICAgICAgdGhpcy5za2lwKDQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcImludmFsaWQgd2lyZSB0eXBlIFwiICsgd2lyZVR5cGUgKyBcIiBhdCBvZmZzZXQgXCIgKyB0aGlzLnBvcyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblJlYWRlci5fY29uZmlndXJlID0gZnVuY3Rpb24oQnVmZmVyUmVhZGVyXykge1xyXG4gICAgQnVmZmVyUmVhZGVyID0gQnVmZmVyUmVhZGVyXztcclxuXHJcbiAgICB2YXIgZm4gPSB1dGlsLkxvbmcgPyBcInRvTG9uZ1wiIDogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gXCJ0b051bWJlclwiO1xyXG4gICAgdXRpbC5tZXJnZShSZWFkZXIucHJvdG90eXBlLCB7XHJcblxyXG4gICAgICAgIGludDY0OiBmdW5jdGlvbiByZWFkX2ludDY0KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVhZExvbmdWYXJpbnQuY2FsbCh0aGlzKVtmbl0oZmFsc2UpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHVpbnQ2NDogZnVuY3Rpb24gcmVhZF91aW50NjQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWFkTG9uZ1ZhcmludC5jYWxsKHRoaXMpW2ZuXSh0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzaW50NjQ6IGZ1bmN0aW9uIHJlYWRfc2ludDY0KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVhZExvbmdWYXJpbnQuY2FsbCh0aGlzKS56ekRlY29kZSgpW2ZuXShmYWxzZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZml4ZWQ2NDogZnVuY3Rpb24gcmVhZF9maXhlZDY0KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVhZEZpeGVkNjQuY2FsbCh0aGlzKVtmbl0odHJ1ZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2ZpeGVkNjQ6IGZ1bmN0aW9uIHJlYWRfc2ZpeGVkNjQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWFkRml4ZWQ2NC5jYWxsKHRoaXMpW2ZuXShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBCdWZmZXJSZWFkZXI7XHJcblxyXG4vLyBleHRlbmRzIFJlYWRlclxyXG52YXIgUmVhZGVyID0gcmVxdWlyZShcIi4vcmVhZGVyXCIpO1xyXG4oQnVmZmVyUmVhZGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUmVhZGVyLnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yID0gQnVmZmVyUmVhZGVyO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwiLi91dGlsL21pbmltYWxcIik7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBidWZmZXIgcmVhZGVyIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIFdpcmUgZm9ybWF0IHJlYWRlciB1c2luZyBub2RlIGJ1ZmZlcnMuXHJcbiAqIEBleHRlbmRzIFJlYWRlclxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtCdWZmZXJ9IGJ1ZmZlciBCdWZmZXIgdG8gcmVhZCBmcm9tXHJcbiAqL1xyXG5mdW5jdGlvbiBCdWZmZXJSZWFkZXIoYnVmZmVyKSB7XHJcbiAgICBSZWFkZXIuY2FsbCh0aGlzLCBidWZmZXIpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVhZCBidWZmZXIuXHJcbiAgICAgKiBAbmFtZSBCdWZmZXJSZWFkZXIjYnVmXHJcbiAgICAgKiBAdHlwZSB7QnVmZmVyfVxyXG4gICAgICovXHJcbn1cclxuXHJcbi8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXHJcbmlmICh1dGlsLkJ1ZmZlcilcclxuICAgIEJ1ZmZlclJlYWRlci5wcm90b3R5cGUuX3NsaWNlID0gdXRpbC5CdWZmZXIucHJvdG90eXBlLnNsaWNlO1xyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuQnVmZmVyUmVhZGVyLnByb3RvdHlwZS5zdHJpbmcgPSBmdW5jdGlvbiByZWFkX3N0cmluZ19idWZmZXIoKSB7XHJcbiAgICB2YXIgbGVuID0gdGhpcy51aW50MzIoKTsgLy8gbW9kaWZpZXMgcG9zXHJcbiAgICByZXR1cm4gdGhpcy5idWYudXRmOFNsaWNlKHRoaXMucG9zLCB0aGlzLnBvcyA9IE1hdGgubWluKHRoaXMucG9zICsgbGVuLCB0aGlzLmxlbikpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgc2VxdWVuY2Ugb2YgYnl0ZXMgcHJlY2VlZGVkIGJ5IGl0cyBsZW5ndGggYXMgYSB2YXJpbnQuXHJcbiAqIEBuYW1lIEJ1ZmZlclJlYWRlciNieXRlc1xyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0J1ZmZlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0ge307XHJcblxyXG4vKipcclxuICogTmFtZWQgcm9vdHMuXHJcbiAqIFRoaXMgaXMgd2hlcmUgcGJqcyBzdG9yZXMgZ2VuZXJhdGVkIHN0cnVjdHVyZXMgKHRoZSBvcHRpb24gYC1yLCAtLXJvb3RgIHNwZWNpZmllcyBhIG5hbWUpLlxyXG4gKiBDYW4gYWxzbyBiZSB1c2VkIG1hbnVhbGx5IHRvIG1ha2Ugcm9vdHMgYXZhaWxhYmxlIGFjY3Jvc3MgbW9kdWxlcy5cclxuICogQG5hbWUgcm9vdHNcclxuICogQHR5cGUge09iamVjdC48c3RyaW5nLFJvb3Q+fVxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvLyBwYmpzIC1yIG15cm9vdCAtbyBjb21waWxlZC5qcyAuLi5cclxuICpcclxuICogLy8gaW4gYW5vdGhlciBtb2R1bGU6XHJcbiAqIHJlcXVpcmUoXCIuL2NvbXBpbGVkLmpzXCIpO1xyXG4gKlxyXG4gKiAvLyBpbiBhbnkgc3Vic2VxdWVudCBtb2R1bGU6XHJcbiAqIHZhciByb290ID0gcHJvdG9idWYucm9vdHNbXCJteXJvb3RcIl07XHJcbiAqL1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qKlxyXG4gKiBTdHJlYW1pbmcgUlBDIGhlbHBlcnMuXHJcbiAqIEBuYW1lc3BhY2VcclxuICovXHJcbnZhciBycGMgPSBleHBvcnRzO1xyXG5cclxuLyoqXHJcbiAqIFJQQyBpbXBsZW1lbnRhdGlvbiBwYXNzZWQgdG8ge0BsaW5rIFNlcnZpY2UjY3JlYXRlfSBwZXJmb3JtaW5nIGEgc2VydmljZSByZXF1ZXN0IG9uIG5ldHdvcmsgbGV2ZWwsIGkuZS4gYnkgdXRpbGl6aW5nIGh0dHAgcmVxdWVzdHMgb3Igd2Vic29ja2V0cy5cclxuICogQHR5cGVkZWYgUlBDSW1wbFxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7TWV0aG9kfHJwYy5TZXJ2aWNlTWV0aG9kPE1lc3NhZ2U8e30+LE1lc3NhZ2U8e30+Pn0gbWV0aG9kIFJlZmxlY3RlZCBvciBzdGF0aWMgbWV0aG9kIGJlaW5nIGNhbGxlZFxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHJlcXVlc3REYXRhIFJlcXVlc3QgZGF0YVxyXG4gKiBAcGFyYW0ge1JQQ0ltcGxDYWxsYmFja30gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb25cclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICogQGV4YW1wbGVcclxuICogZnVuY3Rpb24gcnBjSW1wbChtZXRob2QsIHJlcXVlc3REYXRhLCBjYWxsYmFjaykge1xyXG4gKiAgICAgaWYgKHByb3RvYnVmLnV0aWwubGNGaXJzdChtZXRob2QubmFtZSkgIT09IFwibXlNZXRob2RcIikgLy8gY29tcGF0aWJsZSB3aXRoIHN0YXRpYyBjb2RlXHJcbiAqICAgICAgICAgdGhyb3cgRXJyb3IoXCJubyBzdWNoIG1ldGhvZFwiKTtcclxuICogICAgIGFzeW5jaHJvbm91c2x5T2J0YWluQVJlc3BvbnNlKHJlcXVlc3REYXRhLCBmdW5jdGlvbihlcnIsIHJlc3BvbnNlRGF0YSkge1xyXG4gKiAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzcG9uc2VEYXRhKTtcclxuICogICAgIH0pO1xyXG4gKiB9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIE5vZGUtc3R5bGUgY2FsbGJhY2sgYXMgdXNlZCBieSB7QGxpbmsgUlBDSW1wbH0uXHJcbiAqIEB0eXBlZGVmIFJQQ0ltcGxDYWxsYmFja1xyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7RXJyb3J8bnVsbH0gZXJyb3IgRXJyb3IsIGlmIGFueSwgb3RoZXJ3aXNlIGBudWxsYFxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl8bnVsbH0gW3Jlc3BvbnNlXSBSZXNwb25zZSBkYXRhIG9yIGBudWxsYCB0byBzaWduYWwgZW5kIG9mIHN0cmVhbSwgaWYgdGhlcmUgaGFzbid0IGJlZW4gYW4gZXJyb3JcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG5ycGMuU2VydmljZSA9IHJlcXVpcmUoXCIuL3JwYy9zZXJ2aWNlXCIpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2aWNlO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxuLy8gRXh0ZW5kcyBFdmVudEVtaXR0ZXJcclxuKFNlcnZpY2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSh1dGlsLkV2ZW50RW1pdHRlci5wcm90b3R5cGUpKS5jb25zdHJ1Y3RvciA9IFNlcnZpY2U7XHJcblxyXG4vKipcclxuICogQSBzZXJ2aWNlIG1ldGhvZCBjYWxsYmFjayBhcyB1c2VkIGJ5IHtAbGluayBycGMuU2VydmljZU1ldGhvZHxTZXJ2aWNlTWV0aG9kfS5cclxuICpcclxuICogRGlmZmVycyBmcm9tIHtAbGluayBSUENJbXBsQ2FsbGJhY2t9IGluIHRoYXQgaXQgaXMgYW4gYWN0dWFsIGNhbGxiYWNrIG9mIGEgc2VydmljZSBtZXRob2Qgd2hpY2ggbWF5IG5vdCByZXR1cm4gYHJlc3BvbnNlID0gbnVsbGAuXHJcbiAqIEB0eXBlZGVmIHJwYy5TZXJ2aWNlTWV0aG9kQ2FsbGJhY2tcclxuICogQHRlbXBsYXRlIFRSZXMgZXh0ZW5kcyBNZXNzYWdlPFRSZXM+XHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtFcnJvcnxudWxsfSBlcnJvciBFcnJvciwgaWYgYW55XHJcbiAqIEBwYXJhbSB7VFJlc30gW3Jlc3BvbnNlXSBSZXNwb25zZSBtZXNzYWdlXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgc2VydmljZSBtZXRob2QgcGFydCBvZiBhIHtAbGluayBycGMuU2VydmljZX0gYXMgY3JlYXRlZCBieSB7QGxpbmsgU2VydmljZS5jcmVhdGV9LlxyXG4gKiBAdHlwZWRlZiBycGMuU2VydmljZU1ldGhvZFxyXG4gKiBAdGVtcGxhdGUgVFJlcSBleHRlbmRzIE1lc3NhZ2U8VFJlcT5cclxuICogQHRlbXBsYXRlIFRSZXMgZXh0ZW5kcyBNZXNzYWdlPFRSZXM+XHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtUUmVxfFByb3BlcnRpZXM8VFJlcT59IHJlcXVlc3QgUmVxdWVzdCBtZXNzYWdlIG9yIHBsYWluIG9iamVjdFxyXG4gKiBAcGFyYW0ge3JwYy5TZXJ2aWNlTWV0aG9kQ2FsbGJhY2s8VFJlcz59IFtjYWxsYmFja10gTm9kZS1zdHlsZSBjYWxsYmFjayBjYWxsZWQgd2l0aCB0aGUgZXJyb3IsIGlmIGFueSwgYW5kIHRoZSByZXNwb25zZSBtZXNzYWdlXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE1lc3NhZ2U8VFJlcz4+fSBQcm9taXNlIGlmIGBjYWxsYmFja2AgaGFzIGJlZW4gb21pdHRlZCwgb3RoZXJ3aXNlIGB1bmRlZmluZWRgXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgUlBDIHNlcnZpY2UgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgQW4gUlBDIHNlcnZpY2UgYXMgcmV0dXJuZWQgYnkge0BsaW5rIFNlcnZpY2UjY3JlYXRlfS5cclxuICogQGV4cG9ydHMgcnBjLlNlcnZpY2VcclxuICogQGV4dGVuZHMgdXRpbC5FdmVudEVtaXR0ZXJcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7UlBDSW1wbH0gcnBjSW1wbCBSUEMgaW1wbGVtZW50YXRpb25cclxuICogQHBhcmFtIHtib29sZWFufSBbcmVxdWVzdERlbGltaXRlZD1mYWxzZV0gV2hldGhlciByZXF1ZXN0cyBhcmUgbGVuZ3RoLWRlbGltaXRlZFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXNwb25zZURlbGltaXRlZD1mYWxzZV0gV2hldGhlciByZXNwb25zZXMgYXJlIGxlbmd0aC1kZWxpbWl0ZWRcclxuICovXHJcbmZ1bmN0aW9uIFNlcnZpY2UocnBjSW1wbCwgcmVxdWVzdERlbGltaXRlZCwgcmVzcG9uc2VEZWxpbWl0ZWQpIHtcclxuXHJcbiAgICBpZiAodHlwZW9mIHJwY0ltcGwgIT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJycGNJbXBsIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcclxuXHJcbiAgICB1dGlsLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUlBDIGltcGxlbWVudGF0aW9uLiBCZWNvbWVzIGBudWxsYCBvbmNlIHRoZSBzZXJ2aWNlIGlzIGVuZGVkLlxyXG4gICAgICogQHR5cGUge1JQQ0ltcGx8bnVsbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5ycGNJbXBsID0gcnBjSW1wbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZXRoZXIgcmVxdWVzdHMgYXJlIGxlbmd0aC1kZWxpbWl0ZWQuXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5yZXF1ZXN0RGVsaW1pdGVkID0gQm9vbGVhbihyZXF1ZXN0RGVsaW1pdGVkKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZXRoZXIgcmVzcG9uc2VzIGFyZSBsZW5ndGgtZGVsaW1pdGVkLlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVzcG9uc2VEZWxpbWl0ZWQgPSBCb29sZWFuKHJlc3BvbnNlRGVsaW1pdGVkKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGxzIGEgc2VydmljZSBtZXRob2QgdGhyb3VnaCB7QGxpbmsgcnBjLlNlcnZpY2UjcnBjSW1wbHxycGNJbXBsfS5cclxuICogQHBhcmFtIHtNZXRob2R8cnBjLlNlcnZpY2VNZXRob2Q8VFJlcSxUUmVzPn0gbWV0aG9kIFJlZmxlY3RlZCBvciBzdGF0aWMgbWV0aG9kXHJcbiAqIEBwYXJhbSB7Q29uc3RydWN0b3I8VFJlcT59IHJlcXVlc3RDdG9yIFJlcXVlc3QgY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtDb25zdHJ1Y3RvcjxUUmVzPn0gcmVzcG9uc2VDdG9yIFJlc3BvbnNlIGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7VFJlcXxQcm9wZXJ0aWVzPFRSZXE+fSByZXF1ZXN0IFJlcXVlc3QgbWVzc2FnZSBvciBwbGFpbiBvYmplY3RcclxuICogQHBhcmFtIHtycGMuU2VydmljZU1ldGhvZENhbGxiYWNrPFRSZXM+fSBjYWxsYmFjayBTZXJ2aWNlIGNhbGxiYWNrXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqIEB0ZW1wbGF0ZSBUUmVxIGV4dGVuZHMgTWVzc2FnZTxUUmVxPlxyXG4gKiBAdGVtcGxhdGUgVFJlcyBleHRlbmRzIE1lc3NhZ2U8VFJlcz5cclxuICovXHJcblNlcnZpY2UucHJvdG90eXBlLnJwY0NhbGwgPSBmdW5jdGlvbiBycGNDYWxsKG1ldGhvZCwgcmVxdWVzdEN0b3IsIHJlc3BvbnNlQ3RvciwgcmVxdWVzdCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICBpZiAoIXJlcXVlc3QpXHJcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwicmVxdWVzdCBtdXN0IGJlIHNwZWNpZmllZFwiKTtcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBpZiAoIWNhbGxiYWNrKVxyXG4gICAgICAgIHJldHVybiB1dGlsLmFzUHJvbWlzZShycGNDYWxsLCBzZWxmLCBtZXRob2QsIHJlcXVlc3RDdG9yLCByZXNwb25zZUN0b3IsIHJlcXVlc3QpO1xyXG5cclxuICAgIGlmICghc2VsZi5ycGNJbXBsKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soRXJyb3IoXCJhbHJlYWR5IGVuZGVkXCIpKTsgfSwgMCk7XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBzZWxmLnJwY0ltcGwoXHJcbiAgICAgICAgICAgIG1ldGhvZCxcclxuICAgICAgICAgICAgcmVxdWVzdEN0b3Jbc2VsZi5yZXF1ZXN0RGVsaW1pdGVkID8gXCJlbmNvZGVEZWxpbWl0ZWRcIiA6IFwiZW5jb2RlXCJdKHJlcXVlc3QpLmZpbmlzaCgpLFxyXG4gICAgICAgICAgICBmdW5jdGlvbiBycGNDYWxsYmFjayhlcnIsIHJlc3BvbnNlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZW1pdChcImVycm9yXCIsIGVyciwgbWV0aG9kKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmVuZCgvKiBlbmRlZEJ5UlBDICovIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCEocmVzcG9uc2UgaW5zdGFuY2VvZiByZXNwb25zZUN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSByZXNwb25zZUN0b3Jbc2VsZi5yZXNwb25zZURlbGltaXRlZCA/IFwiZGVjb2RlRGVsaW1pdGVkXCIgOiBcImRlY29kZVwiXShyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZW1pdChcImVycm9yXCIsIGVyciwgbWV0aG9kKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuZW1pdChcImRhdGFcIiwgcmVzcG9uc2UsIG1ldGhvZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHNlbGYuZW1pdChcImVycm9yXCIsIGVyciwgbWV0aG9kKTtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhlcnIpOyB9LCAwKTtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVuZHMgdGhpcyBzZXJ2aWNlIGFuZCBlbWl0cyB0aGUgYGVuZGAgZXZlbnQuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2VuZGVkQnlSUEM9ZmFsc2VdIFdoZXRoZXIgdGhlIHNlcnZpY2UgaGFzIGJlZW4gZW5kZWQgYnkgdGhlIFJQQyBpbXBsZW1lbnRhdGlvbi5cclxuICogQHJldHVybnMge3JwYy5TZXJ2aWNlfSBgdGhpc2BcclxuICovXHJcblNlcnZpY2UucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uIGVuZChlbmRlZEJ5UlBDKSB7XHJcbiAgICBpZiAodGhpcy5ycGNJbXBsKSB7XHJcbiAgICAgICAgaWYgKCFlbmRlZEJ5UlBDKSAvLyBzaWduYWwgZW5kIHRvIHJwY0ltcGxcclxuICAgICAgICAgICAgdGhpcy5ycGNJbXBsKG51bGwsIG51bGwsIG51bGwpO1xyXG4gICAgICAgIHRoaXMucnBjSW1wbCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5lbWl0KFwiZW5kXCIpLm9mZigpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IExvbmdCaXRzO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgbmV3IGxvbmcgYml0cy5cclxuICogQGNsYXNzZGVzYyBIZWxwZXIgY2xhc3MgZm9yIHdvcmtpbmcgd2l0aCB0aGUgbG93IGFuZCBoaWdoIGJpdHMgb2YgYSA2NCBiaXQgdmFsdWUuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge251bWJlcn0gbG8gTG93IDMyIGJpdHMsIHVuc2lnbmVkXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBoaSBIaWdoIDMyIGJpdHMsIHVuc2lnbmVkXHJcbiAqL1xyXG5mdW5jdGlvbiBMb25nQml0cyhsbywgaGkpIHtcclxuXHJcbiAgICAvLyBub3RlIHRoYXQgdGhlIGNhc3RzIGJlbG93IGFyZSB0aGVvcmV0aWNhbGx5IHVubmVjZXNzYXJ5IGFzIG9mIHRvZGF5LCBidXQgb2xkZXIgc3RhdGljYWxseVxyXG4gICAgLy8gZ2VuZXJhdGVkIGNvbnZlcnRlciBjb2RlIG1pZ2h0IHN0aWxsIGNhbGwgdGhlIGN0b3Igd2l0aCBzaWduZWQgMzJiaXRzLiBrZXB0IGZvciBjb21wYXQuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb3cgYml0cy5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubG8gPSBsbyA+Pj4gMDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEhpZ2ggYml0cy5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuaGkgPSBoaSA+Pj4gMDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFplcm8gYml0cy5cclxuICogQG1lbWJlcm9mIHV0aWwuTG9uZ0JpdHNcclxuICogQHR5cGUge3V0aWwuTG9uZ0JpdHN9XHJcbiAqL1xyXG52YXIgemVybyA9IExvbmdCaXRzLnplcm8gPSBuZXcgTG9uZ0JpdHMoMCwgMCk7XHJcblxyXG56ZXJvLnRvTnVtYmVyID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xyXG56ZXJvLnp6RW5jb2RlID0gemVyby56ekRlY29kZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfTtcclxuemVyby5sZW5ndGggPSBmdW5jdGlvbigpIHsgcmV0dXJuIDE7IH07XHJcblxyXG4vKipcclxuICogWmVybyBoYXNoLlxyXG4gKiBAbWVtYmVyb2YgdXRpbC5Mb25nQml0c1xyXG4gKiBAdHlwZSB7c3RyaW5nfVxyXG4gKi9cclxudmFyIHplcm9IYXNoID0gTG9uZ0JpdHMuemVyb0hhc2ggPSBcIlxcMFxcMFxcMFxcMFxcMFxcMFxcMFxcMFwiO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgbmV3IGxvbmcgYml0cyBmcm9tIHRoZSBzcGVjaWZpZWQgbnVtYmVyLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWVcclxuICogQHJldHVybnMge3V0aWwuTG9uZ0JpdHN9IEluc3RhbmNlXHJcbiAqL1xyXG5Mb25nQml0cy5mcm9tTnVtYmVyID0gZnVuY3Rpb24gZnJvbU51bWJlcih2YWx1ZSkge1xyXG4gICAgaWYgKHZhbHVlID09PSAwKVxyXG4gICAgICAgIHJldHVybiB6ZXJvO1xyXG4gICAgdmFyIHNpZ24gPSB2YWx1ZSA8IDA7XHJcbiAgICBpZiAoc2lnbilcclxuICAgICAgICB2YWx1ZSA9IC12YWx1ZTtcclxuICAgIHZhciBsbyA9IHZhbHVlID4+PiAwLFxyXG4gICAgICAgIGhpID0gKHZhbHVlIC0gbG8pIC8gNDI5NDk2NzI5NiA+Pj4gMDtcclxuICAgIGlmIChzaWduKSB7XHJcbiAgICAgICAgaGkgPSB+aGkgPj4+IDA7XHJcbiAgICAgICAgbG8gPSB+bG8gPj4+IDA7XHJcbiAgICAgICAgaWYgKCsrbG8gPiA0Mjk0OTY3Mjk1KSB7XHJcbiAgICAgICAgICAgIGxvID0gMDtcclxuICAgICAgICAgICAgaWYgKCsraGkgPiA0Mjk0OTY3Mjk1KVxyXG4gICAgICAgICAgICAgICAgaGkgPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgTG9uZ0JpdHMobG8sIGhpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIG5ldyBsb25nIGJpdHMgZnJvbSBhIG51bWJlciwgbG9uZyBvciBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZVxyXG4gKiBAcmV0dXJucyB7dXRpbC5Mb25nQml0c30gSW5zdGFuY2VcclxuICovXHJcbkxvbmdCaXRzLmZyb20gPSBmdW5jdGlvbiBmcm9tKHZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiKVxyXG4gICAgICAgIHJldHVybiBMb25nQml0cy5mcm9tTnVtYmVyKHZhbHVlKTtcclxuICAgIGlmICh1dGlsLmlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXHJcbiAgICAgICAgaWYgKHV0aWwuTG9uZylcclxuICAgICAgICAgICAgdmFsdWUgPSB1dGlsLkxvbmcuZnJvbVN0cmluZyh2YWx1ZSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gTG9uZ0JpdHMuZnJvbU51bWJlcihwYXJzZUludCh2YWx1ZSwgMTApKTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZS5sb3cgfHwgdmFsdWUuaGlnaCA/IG5ldyBMb25nQml0cyh2YWx1ZS5sb3cgPj4+IDAsIHZhbHVlLmhpZ2ggPj4+IDApIDogemVybztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyB0aGlzIGxvbmcgYml0cyB0byBhIHBvc3NpYmx5IHVuc2FmZSBKYXZhU2NyaXB0IG51bWJlci5cclxuICogQHBhcmFtIHtib29sZWFufSBbdW5zaWduZWQ9ZmFsc2VdIFdoZXRoZXIgdW5zaWduZWQgb3Igbm90XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFBvc3NpYmx5IHVuc2FmZSBudW1iZXJcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS50b051bWJlciA9IGZ1bmN0aW9uIHRvTnVtYmVyKHVuc2lnbmVkKSB7XHJcbiAgICBpZiAoIXVuc2lnbmVkICYmIHRoaXMuaGkgPj4+IDMxKSB7XHJcbiAgICAgICAgdmFyIGxvID0gfnRoaXMubG8gKyAxID4+PiAwLFxyXG4gICAgICAgICAgICBoaSA9IH50aGlzLmhpICAgICA+Pj4gMDtcclxuICAgICAgICBpZiAoIWxvKVxyXG4gICAgICAgICAgICBoaSA9IGhpICsgMSA+Pj4gMDtcclxuICAgICAgICByZXR1cm4gLShsbyArIGhpICogNDI5NDk2NzI5Nik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5sbyArIHRoaXMuaGkgKiA0Mjk0OTY3Mjk2O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoaXMgbG9uZyBiaXRzIHRvIGEgbG9uZy5cclxuICogQHBhcmFtIHtib29sZWFufSBbdW5zaWduZWQ9ZmFsc2VdIFdoZXRoZXIgdW5zaWduZWQgb3Igbm90XHJcbiAqIEByZXR1cm5zIHtMb25nfSBMb25nXHJcbiAqL1xyXG5Mb25nQml0cy5wcm90b3R5cGUudG9Mb25nID0gZnVuY3Rpb24gdG9Mb25nKHVuc2lnbmVkKSB7XHJcbiAgICByZXR1cm4gdXRpbC5Mb25nXHJcbiAgICAgICAgPyBuZXcgdXRpbC5Mb25nKHRoaXMubG8gfCAwLCB0aGlzLmhpIHwgMCwgQm9vbGVhbih1bnNpZ25lZCkpXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICA6IHsgbG93OiB0aGlzLmxvIHwgMCwgaGlnaDogdGhpcy5oaSB8IDAsIHVuc2lnbmVkOiBCb29sZWFuKHVuc2lnbmVkKSB9O1xyXG59O1xyXG5cclxudmFyIGNoYXJDb2RlQXQgPSBTdHJpbmcucHJvdG90eXBlLmNoYXJDb2RlQXQ7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBuZXcgbG9uZyBiaXRzIGZyb20gdGhlIHNwZWNpZmllZCA4IGNoYXJhY3RlcnMgbG9uZyBoYXNoLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaGFzaCBIYXNoXHJcbiAqIEByZXR1cm5zIHt1dGlsLkxvbmdCaXRzfSBCaXRzXHJcbiAqL1xyXG5Mb25nQml0cy5mcm9tSGFzaCA9IGZ1bmN0aW9uIGZyb21IYXNoKGhhc2gpIHtcclxuICAgIGlmIChoYXNoID09PSB6ZXJvSGFzaClcclxuICAgICAgICByZXR1cm4gemVybztcclxuICAgIHJldHVybiBuZXcgTG9uZ0JpdHMoXHJcbiAgICAgICAgKCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgMClcclxuICAgICAgICB8IGNoYXJDb2RlQXQuY2FsbChoYXNoLCAxKSA8PCA4XHJcbiAgICAgICAgfCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgMikgPDwgMTZcclxuICAgICAgICB8IGNoYXJDb2RlQXQuY2FsbChoYXNoLCAzKSA8PCAyNCkgPj4+IDBcclxuICAgICxcclxuICAgICAgICAoIGNoYXJDb2RlQXQuY2FsbChoYXNoLCA0KVxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDUpIDw8IDhcclxuICAgICAgICB8IGNoYXJDb2RlQXQuY2FsbChoYXNoLCA2KSA8PCAxNlxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDcpIDw8IDI0KSA+Pj4gMFxyXG4gICAgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyB0aGlzIGxvbmcgYml0cyB0byBhIDggY2hhcmFjdGVycyBsb25nIGhhc2guXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEhhc2hcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS50b0hhc2ggPSBmdW5jdGlvbiB0b0hhc2goKSB7XHJcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShcclxuICAgICAgICB0aGlzLmxvICAgICAgICAmIDI1NSxcclxuICAgICAgICB0aGlzLmxvID4+PiA4ICAmIDI1NSxcclxuICAgICAgICB0aGlzLmxvID4+PiAxNiAmIDI1NSxcclxuICAgICAgICB0aGlzLmxvID4+PiAyNCAgICAgICxcclxuICAgICAgICB0aGlzLmhpICAgICAgICAmIDI1NSxcclxuICAgICAgICB0aGlzLmhpID4+PiA4ICAmIDI1NSxcclxuICAgICAgICB0aGlzLmhpID4+PiAxNiAmIDI1NSxcclxuICAgICAgICB0aGlzLmhpID4+PiAyNFxyXG4gICAgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBaaWctemFnIGVuY29kZXMgdGhpcyBsb25nIGJpdHMuXHJcbiAqIEByZXR1cm5zIHt1dGlsLkxvbmdCaXRzfSBgdGhpc2BcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS56ekVuY29kZSA9IGZ1bmN0aW9uIHp6RW5jb2RlKCkge1xyXG4gICAgdmFyIG1hc2sgPSAgIHRoaXMuaGkgPj4gMzE7XHJcbiAgICB0aGlzLmhpICA9ICgodGhpcy5oaSA8PCAxIHwgdGhpcy5sbyA+Pj4gMzEpIF4gbWFzaykgPj4+IDA7XHJcbiAgICB0aGlzLmxvICA9ICggdGhpcy5sbyA8PCAxICAgICAgICAgICAgICAgICAgIF4gbWFzaykgPj4+IDA7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBaaWctemFnIGRlY29kZXMgdGhpcyBsb25nIGJpdHMuXHJcbiAqIEByZXR1cm5zIHt1dGlsLkxvbmdCaXRzfSBgdGhpc2BcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS56ekRlY29kZSA9IGZ1bmN0aW9uIHp6RGVjb2RlKCkge1xyXG4gICAgdmFyIG1hc2sgPSAtKHRoaXMubG8gJiAxKTtcclxuICAgIHRoaXMubG8gID0gKCh0aGlzLmxvID4+PiAxIHwgdGhpcy5oaSA8PCAzMSkgXiBtYXNrKSA+Pj4gMDtcclxuICAgIHRoaXMuaGkgID0gKCB0aGlzLmhpID4+PiAxICAgICAgICAgICAgICAgICAgXiBtYXNrKSA+Pj4gMDtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiB0aGlzIGxvbmdiaXRzIHdoZW4gZW5jb2RlZCBhcyBhIHZhcmludC5cclxuICogQHJldHVybnMge251bWJlcn0gTGVuZ3RoXHJcbiAqL1xyXG5Mb25nQml0cy5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gbGVuZ3RoKCkge1xyXG4gICAgdmFyIHBhcnQwID0gIHRoaXMubG8sXHJcbiAgICAgICAgcGFydDEgPSAodGhpcy5sbyA+Pj4gMjggfCB0aGlzLmhpIDw8IDQpID4+PiAwLFxyXG4gICAgICAgIHBhcnQyID0gIHRoaXMuaGkgPj4+IDI0O1xyXG4gICAgcmV0dXJuIHBhcnQyID09PSAwXHJcbiAgICAgICAgID8gcGFydDEgPT09IDBcclxuICAgICAgICAgICA/IHBhcnQwIDwgMTYzODRcclxuICAgICAgICAgICAgID8gcGFydDAgPCAxMjggPyAxIDogMlxyXG4gICAgICAgICAgICAgOiBwYXJ0MCA8IDIwOTcxNTIgPyAzIDogNFxyXG4gICAgICAgICAgIDogcGFydDEgPCAxNjM4NFxyXG4gICAgICAgICAgICAgPyBwYXJ0MSA8IDEyOCA/IDUgOiA2XHJcbiAgICAgICAgICAgICA6IHBhcnQxIDwgMjA5NzE1MiA/IDcgOiA4XHJcbiAgICAgICAgIDogcGFydDIgPCAxMjggPyA5IDogMTA7XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgdXRpbCA9IGV4cG9ydHM7XHJcblxyXG4vLyB1c2VkIHRvIHJldHVybiBhIFByb21pc2Ugd2hlcmUgY2FsbGJhY2sgaXMgb21pdHRlZFxyXG51dGlsLmFzUHJvbWlzZSA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9hc3Byb21pc2VcIik7XHJcblxyXG4vLyBjb252ZXJ0cyB0byAvIGZyb20gYmFzZTY0IGVuY29kZWQgc3RyaW5nc1xyXG51dGlsLmJhc2U2NCA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9iYXNlNjRcIik7XHJcblxyXG4vLyBiYXNlIGNsYXNzIG9mIHJwYy5TZXJ2aWNlXHJcbnV0aWwuRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL2V2ZW50ZW1pdHRlclwiKTtcclxuXHJcbi8vIGZsb2F0IGhhbmRsaW5nIGFjY3Jvc3MgYnJvd3NlcnNcclxudXRpbC5mbG9hdCA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9mbG9hdFwiKTtcclxuXHJcbi8vIHJlcXVpcmVzIG1vZHVsZXMgb3B0aW9uYWxseSBhbmQgaGlkZXMgdGhlIGNhbGwgZnJvbSBidW5kbGVyc1xyXG51dGlsLmlucXVpcmUgPSByZXF1aXJlKFwiQHByb3RvYnVmanMvaW5xdWlyZVwiKTtcclxuXHJcbi8vIGNvbnZlcnRzIHRvIC8gZnJvbSB1dGY4IGVuY29kZWQgc3RyaW5nc1xyXG51dGlsLnV0ZjggPSByZXF1aXJlKFwiQHByb3RvYnVmanMvdXRmOFwiKTtcclxuXHJcbi8vIHByb3ZpZGVzIGEgbm9kZS1saWtlIGJ1ZmZlciBwb29sIGluIHRoZSBicm93c2VyXHJcbnV0aWwucG9vbCA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9wb29sXCIpO1xyXG5cclxuLy8gdXRpbGl0eSB0byB3b3JrIHdpdGggdGhlIGxvdyBhbmQgaGlnaCBiaXRzIG9mIGEgNjQgYml0IHZhbHVlXHJcbnV0aWwuTG9uZ0JpdHMgPSByZXF1aXJlKFwiLi9sb25nYml0c1wiKTtcclxuXHJcbi8qKlxyXG4gKiBBbiBpbW11YWJsZSBlbXB0eSBhcnJheS5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHR5cGUge0FycmF5LjwqPn1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmVtcHR5QXJyYXkgPSBPYmplY3QuZnJlZXplID8gT2JqZWN0LmZyZWV6ZShbXSkgOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBbXTsgLy8gdXNlZCBvbiBwcm90b3R5cGVzXHJcblxyXG4vKipcclxuICogQW4gaW1tdXRhYmxlIGVtcHR5IG9iamVjdC5cclxuICogQHR5cGUge09iamVjdH1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmVtcHR5T2JqZWN0ID0gT2JqZWN0LmZyZWV6ZSA/IE9iamVjdC5mcmVlemUoe30pIDogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8ge307IC8vIHVzZWQgb24gcHJvdG90eXBlc1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgcnVubmluZyB3aXRoaW4gbm9kZSBvciBub3QuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEB0eXBlIHtib29sZWFufVxyXG4gKiBAY29uc3RcclxuICovXHJcbnV0aWwuaXNOb2RlID0gQm9vbGVhbihnbG9iYWwucHJvY2VzcyAmJiBnbG9iYWwucHJvY2Vzcy52ZXJzaW9ucyAmJiBnbG9iYWwucHJvY2Vzcy52ZXJzaW9ucy5ub2RlKTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGlzIGFuIGludGVnZXIuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0geyp9IHZhbHVlIFZhbHVlIHRvIHRlc3RcclxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgdmFsdWUgaXMgYW4gaW50ZWdlclxyXG4gKi9cclxudXRpbC5pc0ludGVnZXIgPSBOdW1iZXIuaXNJbnRlZ2VyIHx8IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIGZ1bmN0aW9uIGlzSW50ZWdlcih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiAmJiBpc0Zpbml0ZSh2YWx1ZSkgJiYgTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGlmIHRoZSBzcGVjaWZpZWQgdmFsdWUgaXMgYSBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVmFsdWUgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHRoZSB2YWx1ZSBpcyBhIHN0cmluZ1xyXG4gKi9cclxudXRpbC5pc1N0cmluZyA9IGZ1bmN0aW9uIGlzU3RyaW5nKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiIHx8IHZhbHVlIGluc3RhbmNlb2YgU3RyaW5nO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGlmIHRoZSBzcGVjaWZpZWQgdmFsdWUgaXMgYSBub24tbnVsbCBvYmplY3QuXHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVmFsdWUgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHRoZSB2YWx1ZSBpcyBhIG5vbi1udWxsIG9iamVjdFxyXG4gKi9cclxudXRpbC5pc09iamVjdCA9IGZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHByb3BlcnR5IG9uIGEgbWVzc2FnZSBpcyBjb25zaWRlcmVkIHRvIGJlIHByZXNlbnQuXHJcbiAqIFRoaXMgaXMgYW4gYWxpYXMgb2Yge0BsaW5rIHV0aWwuaXNTZXR9LlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBQbGFpbiBvYmplY3Qgb3IgbWVzc2FnZSBpbnN0YW5jZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcCBQcm9wZXJ0eSBuYW1lXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgY29uc2lkZXJlZCB0byBiZSBwcmVzZW50LCBvdGhlcndpc2UgYGZhbHNlYFxyXG4gKi9cclxudXRpbC5pc3NldCA9XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcHJvcGVydHkgb24gYSBtZXNzYWdlIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJlc2VudC5cclxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBQbGFpbiBvYmplY3Qgb3IgbWVzc2FnZSBpbnN0YW5jZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcCBQcm9wZXJ0eSBuYW1lXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgY29uc2lkZXJlZCB0byBiZSBwcmVzZW50LCBvdGhlcndpc2UgYGZhbHNlYFxyXG4gKi9cclxudXRpbC5pc1NldCA9IGZ1bmN0aW9uIGlzU2V0KG9iaiwgcHJvcCkge1xyXG4gICAgdmFyIHZhbHVlID0gb2JqW3Byb3BdO1xyXG4gICAgaWYgKHZhbHVlICE9IG51bGwgJiYgb2JqLmhhc093blByb3BlcnR5KHByb3ApKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcSwgbm8tcHJvdG90eXBlLWJ1aWx0aW5zXHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSAhPT0gXCJvYmplY3RcIiB8fCAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZS5sZW5ndGggOiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoKSA+IDA7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogQW55IGNvbXBhdGlibGUgQnVmZmVyIGluc3RhbmNlLlxyXG4gKiBUaGlzIGlzIGEgbWluaW1hbCBzdGFuZC1hbG9uZSBkZWZpbml0aW9uIG9mIGEgQnVmZmVyIGluc3RhbmNlLiBUaGUgYWN0dWFsIHR5cGUgaXMgdGhhdCBleHBvcnRlZCBieSBub2RlJ3MgdHlwaW5ncy5cclxuICogQGludGVyZmFjZSBCdWZmZXJcclxuICogQGV4dGVuZHMgVWludDhBcnJheVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBOb2RlJ3MgQnVmZmVyIGNsYXNzIGlmIGF2YWlsYWJsZS5cclxuICogQHR5cGUge0NvbnN0cnVjdG9yPEJ1ZmZlcj59XHJcbiAqL1xyXG51dGlsLkJ1ZmZlciA9IChmdW5jdGlvbigpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIEJ1ZmZlciA9IHV0aWwuaW5xdWlyZShcImJ1ZmZlclwiKS5CdWZmZXI7XHJcbiAgICAgICAgLy8gcmVmdXNlIHRvIHVzZSBub24tbm9kZSBidWZmZXJzIGlmIG5vdCBleHBsaWNpdGx5IGFzc2lnbmVkIChwZXJmIHJlYXNvbnMpOlxyXG4gICAgICAgIHJldHVybiBCdWZmZXIucHJvdG90eXBlLnV0ZjhXcml0ZSA/IEJ1ZmZlciA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIG51bGw7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufSkoKTtcclxuXHJcbi8vIEludGVybmFsIGFsaWFzIG9mIG9yIHBvbHlmdWxsIGZvciBCdWZmZXIuZnJvbS5cclxudXRpbC5fQnVmZmVyX2Zyb20gPSBudWxsO1xyXG5cclxuLy8gSW50ZXJuYWwgYWxpYXMgb2Ygb3IgcG9seWZpbGwgZm9yIEJ1ZmZlci5hbGxvY1Vuc2FmZS5cclxudXRpbC5fQnVmZmVyX2FsbG9jVW5zYWZlID0gbnVsbDtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IGJ1ZmZlciBvZiB3aGF0ZXZlciB0eXBlIHN1cHBvcnRlZCBieSB0aGUgZW52aXJvbm1lbnQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfG51bWJlcltdfSBbc2l6ZU9yQXJyYXk9MF0gQnVmZmVyIHNpemUgb3IgbnVtYmVyIGFycmF5XHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fEJ1ZmZlcn0gQnVmZmVyXHJcbiAqL1xyXG51dGlsLm5ld0J1ZmZlciA9IGZ1bmN0aW9uIG5ld0J1ZmZlcihzaXplT3JBcnJheSkge1xyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIHJldHVybiB0eXBlb2Ygc2l6ZU9yQXJyYXkgPT09IFwibnVtYmVyXCJcclxuICAgICAgICA/IHV0aWwuQnVmZmVyXHJcbiAgICAgICAgICAgID8gdXRpbC5fQnVmZmVyX2FsbG9jVW5zYWZlKHNpemVPckFycmF5KVxyXG4gICAgICAgICAgICA6IG5ldyB1dGlsLkFycmF5KHNpemVPckFycmF5KVxyXG4gICAgICAgIDogdXRpbC5CdWZmZXJcclxuICAgICAgICAgICAgPyB1dGlsLl9CdWZmZXJfZnJvbShzaXplT3JBcnJheSlcclxuICAgICAgICAgICAgOiB0eXBlb2YgVWludDhBcnJheSA9PT0gXCJ1bmRlZmluZWRcIlxyXG4gICAgICAgICAgICAgICAgPyBzaXplT3JBcnJheVxyXG4gICAgICAgICAgICAgICAgOiBuZXcgVWludDhBcnJheShzaXplT3JBcnJheSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQXJyYXkgaW1wbGVtZW50YXRpb24gdXNlZCBpbiB0aGUgYnJvd3Nlci4gYFVpbnQ4QXJyYXlgIGlmIHN1cHBvcnRlZCwgb3RoZXJ3aXNlIGBBcnJheWAuXHJcbiAqIEB0eXBlIHtDb25zdHJ1Y3RvcjxVaW50OEFycmF5Pn1cclxuICovXHJcbnV0aWwuQXJyYXkgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gXCJ1bmRlZmluZWRcIiA/IFVpbnQ4QXJyYXkgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gOiBBcnJheTtcclxuXHJcbi8qKlxyXG4gKiBBbnkgY29tcGF0aWJsZSBMb25nIGluc3RhbmNlLlxyXG4gKiBUaGlzIGlzIGEgbWluaW1hbCBzdGFuZC1hbG9uZSBkZWZpbml0aW9uIG9mIGEgTG9uZyBpbnN0YW5jZS4gVGhlIGFjdHVhbCB0eXBlIGlzIHRoYXQgZXhwb3J0ZWQgYnkgbG9uZy5qcy5cclxuICogQGludGVyZmFjZSBMb25nXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsb3cgTG93IGJpdHNcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGhpZ2ggSGlnaCBiaXRzXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdW5zaWduZWQgV2hldGhlciB1bnNpZ25lZCBvciBub3RcclxuICovXHJcblxyXG4vKipcclxuICogTG9uZy5qcydzIExvbmcgY2xhc3MgaWYgYXZhaWxhYmxlLlxyXG4gKiBAdHlwZSB7Q29uc3RydWN0b3I8TG9uZz59XHJcbiAqL1xyXG51dGlsLkxvbmcgPSAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBnbG9iYWwuZGNvZGVJTyAmJiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBnbG9iYWwuZGNvZGVJTy5Mb25nIHx8IHV0aWwuaW5xdWlyZShcImxvbmdcIik7XHJcblxyXG4vKipcclxuICogUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gdmVyaWZ5IDIgYml0IChgYm9vbGApIG1hcCBrZXlzLlxyXG4gKiBAdHlwZSB7UmVnRXhwfVxyXG4gKiBAY29uc3RcclxuICovXHJcbnV0aWwua2V5MlJlID0gL150cnVlfGZhbHNlfDB8MSQvO1xyXG5cclxuLyoqXHJcbiAqIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHZlcmlmeSAzMiBiaXQgKGBpbnQzMmAgZXRjLikgbWFwIGtleXMuXHJcbiAqIEB0eXBlIHtSZWdFeHB9XHJcbiAqIEBjb25zdFxyXG4gKi9cclxudXRpbC5rZXkzMlJlID0gL14tPyg/OjB8WzEtOV1bMC05XSopJC87XHJcblxyXG4vKipcclxuICogUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gdmVyaWZ5IDY0IGJpdCAoYGludDY0YCBldGMuKSBtYXAga2V5cy5cclxuICogQHR5cGUge1JlZ0V4cH1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmtleTY0UmUgPSAvXig/OltcXFxceDAwLVxcXFx4ZmZdezh9fC0/KD86MHxbMS05XVswLTldKikpJC87XHJcblxyXG4vKipcclxuICogQ29udmVydHMgYSBudW1iZXIgb3IgbG9uZyB0byBhbiA4IGNoYXJhY3RlcnMgbG9uZyBoYXNoIHN0cmluZy5cclxuICogQHBhcmFtIHtMb25nfG51bWJlcn0gdmFsdWUgVmFsdWUgdG8gY29udmVydFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIYXNoXHJcbiAqL1xyXG51dGlsLmxvbmdUb0hhc2ggPSBmdW5jdGlvbiBsb25nVG9IYXNoKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWVcclxuICAgICAgICA/IHV0aWwuTG9uZ0JpdHMuZnJvbSh2YWx1ZSkudG9IYXNoKClcclxuICAgICAgICA6IHV0aWwuTG9uZ0JpdHMuemVyb0hhc2g7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgYW4gOCBjaGFyYWN0ZXJzIGxvbmcgaGFzaCBzdHJpbmcgdG8gYSBsb25nIG9yIG51bWJlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IGhhc2ggSGFzaFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1bnNpZ25lZD1mYWxzZV0gV2hldGhlciB1bnNpZ25lZCBvciBub3RcclxuICogQHJldHVybnMge0xvbmd8bnVtYmVyfSBPcmlnaW5hbCB2YWx1ZVxyXG4gKi9cclxudXRpbC5sb25nRnJvbUhhc2ggPSBmdW5jdGlvbiBsb25nRnJvbUhhc2goaGFzaCwgdW5zaWduZWQpIHtcclxuICAgIHZhciBiaXRzID0gdXRpbC5Mb25nQml0cy5mcm9tSGFzaChoYXNoKTtcclxuICAgIGlmICh1dGlsLkxvbmcpXHJcbiAgICAgICAgcmV0dXJuIHV0aWwuTG9uZy5mcm9tQml0cyhiaXRzLmxvLCBiaXRzLmhpLCB1bnNpZ25lZCk7XHJcbiAgICByZXR1cm4gYml0cy50b051bWJlcihCb29sZWFuKHVuc2lnbmVkKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogTWVyZ2VzIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBzb3VyY2Ugb2JqZWN0IGludG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gZHN0IERlc3RpbmF0aW9uIG9iamVjdFxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBzcmMgU291cmNlIG9iamVjdFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpZk5vdFNldD1mYWxzZV0gTWVyZ2VzIG9ubHkgaWYgdGhlIGtleSBpcyBub3QgYWxyZWFkeSBzZXRcclxuICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBEZXN0aW5hdGlvbiBvYmplY3RcclxuICovXHJcbmZ1bmN0aW9uIG1lcmdlKGRzdCwgc3JjLCBpZk5vdFNldCkgeyAvLyB1c2VkIGJ5IGNvbnZlcnRlcnNcclxuICAgIGZvciAodmFyIGtleXMgPSBPYmplY3Qua2V5cyhzcmMpLCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgaWYgKGRzdFtrZXlzW2ldXSA9PT0gdW5kZWZpbmVkIHx8ICFpZk5vdFNldClcclxuICAgICAgICAgICAgZHN0W2tleXNbaV1dID0gc3JjW2tleXNbaV1dO1xyXG4gICAgcmV0dXJuIGRzdDtcclxufVxyXG5cclxudXRpbC5tZXJnZSA9IG1lcmdlO1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgYSBzdHJpbmcgdG8gbG93ZXIgY2FzZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciBTdHJpbmcgdG8gY29udmVydFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBDb252ZXJ0ZWQgc3RyaW5nXHJcbiAqL1xyXG51dGlsLmxjRmlyc3QgPSBmdW5jdGlvbiBsY0ZpcnN0KHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9Mb3dlckNhc2UoKSArIHN0ci5zdWJzdHJpbmcoMSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGN1c3RvbSBlcnJvciBjb25zdHJ1Y3Rvci5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgRXJyb3IgbmFtZVxyXG4gKiBAcmV0dXJucyB7Q29uc3RydWN0b3I8RXJyb3I+fSBDdXN0b20gZXJyb3IgY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIG5ld0Vycm9yKG5hbWUpIHtcclxuXHJcbiAgICBmdW5jdGlvbiBDdXN0b21FcnJvcihtZXNzYWdlLCBwcm9wZXJ0aWVzKSB7XHJcblxyXG4gICAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDdXN0b21FcnJvcikpXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ3VzdG9tRXJyb3IobWVzc2FnZSwgcHJvcGVydGllcyk7XHJcblxyXG4gICAgICAgIC8vIEVycm9yLmNhbGwodGhpcywgbWVzc2FnZSk7XHJcbiAgICAgICAgLy8gXiBqdXN0IHJldHVybnMgYSBuZXcgZXJyb3IgaW5zdGFuY2UgYmVjYXVzZSB0aGUgY3RvciBjYW4gYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb25cclxuXHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibWVzc2FnZVwiLCB7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtZXNzYWdlOyB9IH0pO1xyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkgLy8gbm9kZVxyXG4gICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBDdXN0b21FcnJvcik7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJzdGFja1wiLCB7IHZhbHVlOiAobmV3IEVycm9yKCkpLnN0YWNrIHx8IFwiXCIgfSk7XHJcblxyXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzKVxyXG4gICAgICAgICAgICBtZXJnZSh0aGlzLCBwcm9wZXJ0aWVzKTtcclxuICAgIH1cclxuXHJcbiAgICAoQ3VzdG9tRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpKS5jb25zdHJ1Y3RvciA9IEN1c3RvbUVycm9yO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDdXN0b21FcnJvci5wcm90b3R5cGUsIFwibmFtZVwiLCB7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBuYW1lOyB9IH0pO1xyXG5cclxuICAgIEN1c3RvbUVycm9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5hbWUgKyBcIjogXCIgKyB0aGlzLm1lc3NhZ2U7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBDdXN0b21FcnJvcjtcclxufVxyXG5cclxudXRpbC5uZXdFcnJvciA9IG5ld0Vycm9yO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgcHJvdG9jb2wgZXJyb3IuXHJcbiAqIEBjbGFzc2Rlc2MgRXJyb3Igc3ViY2xhc3MgaW5kaWNhdGluZyBhIHByb3RvY29sIHNwZWNpZmMgZXJyb3IuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBleHRlbmRzIEVycm9yXHJcbiAqIEB0ZW1wbGF0ZSBUIGV4dGVuZHMgTWVzc2FnZTxUPlxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgRXJyb3IgbWVzc2FnZVxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBbcHJvcGVydGllc10gQWRkaXRpb25hbCBwcm9wZXJ0aWVzXHJcbiAqIEBleGFtcGxlXHJcbiAqIHRyeSB7XHJcbiAqICAgICBNeU1lc3NhZ2UuZGVjb2RlKHNvbWVCdWZmZXIpOyAvLyB0aHJvd3MgaWYgcmVxdWlyZWQgZmllbGRzIGFyZSBtaXNzaW5nXHJcbiAqIH0gY2F0Y2ggKGUpIHtcclxuICogICAgIGlmIChlIGluc3RhbmNlb2YgUHJvdG9jb2xFcnJvciAmJiBlLmluc3RhbmNlKVxyXG4gKiAgICAgICAgIGNvbnNvbGUubG9nKFwiZGVjb2RlZCBzbyBmYXI6IFwiICsgSlNPTi5zdHJpbmdpZnkoZS5pbnN0YW5jZSkpO1xyXG4gKiB9XHJcbiAqL1xyXG51dGlsLlByb3RvY29sRXJyb3IgPSBuZXdFcnJvcihcIlByb3RvY29sRXJyb3JcIik7XHJcblxyXG4vKipcclxuICogU28gZmFyIGRlY29kZWQgbWVzc2FnZSBpbnN0YW5jZS5cclxuICogQG5hbWUgdXRpbC5Qcm90b2NvbEVycm9yI2luc3RhbmNlXHJcbiAqIEB0eXBlIHtNZXNzYWdlPFQ+fVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIE9uZU9mIGdldHRlciBhcyByZXR1cm5lZCBieSB7QGxpbmsgdXRpbC5vbmVPZkdldHRlcn0uXHJcbiAqIEB0eXBlZGVmIE9uZU9mR2V0dGVyXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFNldCBmaWVsZCBuYW1lLCBpZiBhbnlcclxuICovXHJcblxyXG4vKipcclxuICogQnVpbGRzIGEgZ2V0dGVyIGZvciBhIG9uZW9mJ3MgcHJlc2VudCBmaWVsZCBuYW1lLlxyXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBmaWVsZE5hbWVzIEZpZWxkIG5hbWVzXHJcbiAqIEByZXR1cm5zIHtPbmVPZkdldHRlcn0gVW5ib3VuZCBnZXR0ZXJcclxuICovXHJcbnV0aWwub25lT2ZHZXR0ZXIgPSBmdW5jdGlvbiBnZXRPbmVPZihmaWVsZE5hbWVzKSB7XHJcbiAgICB2YXIgZmllbGRNYXAgPSB7fTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmllbGROYW1lcy5sZW5ndGg7ICsraSlcclxuICAgICAgICBmaWVsZE1hcFtmaWVsZE5hbWVzW2ldXSA9IDE7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gU2V0IGZpZWxkIG5hbWUsIGlmIGFueVxyXG4gICAgICogQHRoaXMgT2JqZWN0XHJcbiAgICAgKiBAaWdub3JlXHJcbiAgICAgKi9cclxuICAgIHJldHVybiBmdW5jdGlvbigpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb25zaXN0ZW50LXJldHVyblxyXG4gICAgICAgIGZvciAodmFyIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzKSwgaSA9IGtleXMubGVuZ3RoIC0gMTsgaSA+IC0xOyAtLWkpXHJcbiAgICAgICAgICAgIGlmIChmaWVsZE1hcFtrZXlzW2ldXSA9PT0gMSAmJiB0aGlzW2tleXNbaV1dICE9PSB1bmRlZmluZWQgJiYgdGhpc1trZXlzW2ldXSAhPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHJldHVybiBrZXlzW2ldO1xyXG4gICAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBIE9uZU9mIHNldHRlciBhcyByZXR1cm5lZCBieSB7QGxpbmsgdXRpbC5vbmVPZlNldHRlcn0uXHJcbiAqIEB0eXBlZGVmIE9uZU9mU2V0dGVyXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSB2YWx1ZSBGaWVsZCBuYW1lXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEJ1aWxkcyBhIHNldHRlciBmb3IgYSBvbmVvZidzIHByZXNlbnQgZmllbGQgbmFtZS5cclxuICogQHBhcmFtIHtzdHJpbmdbXX0gZmllbGROYW1lcyBGaWVsZCBuYW1lc1xyXG4gKiBAcmV0dXJucyB7T25lT2ZTZXR0ZXJ9IFVuYm91bmQgc2V0dGVyXHJcbiAqL1xyXG51dGlsLm9uZU9mU2V0dGVyID0gZnVuY3Rpb24gc2V0T25lT2YoZmllbGROYW1lcykge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgRmllbGQgbmFtZVxyXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICAgICAqIEB0aGlzIE9iamVjdFxyXG4gICAgICogQGlnbm9yZVxyXG4gICAgICovXHJcbiAgICByZXR1cm4gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmllbGROYW1lcy5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgaWYgKGZpZWxkTmFtZXNbaV0gIT09IG5hbWUpXHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpc1tmaWVsZE5hbWVzW2ldXTtcclxuICAgIH07XHJcbn07XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBjb252ZXJzaW9uIG9wdGlvbnMgdXNlZCBmb3Ige0BsaW5rIE1lc3NhZ2UjdG9KU09OfSBpbXBsZW1lbnRhdGlvbnMuXHJcbiAqXHJcbiAqIFRoZXNlIG9wdGlvbnMgYXJlIGNsb3NlIHRvIHByb3RvMydzIEpTT04gbWFwcGluZyB3aXRoIHRoZSBleGNlcHRpb24gdGhhdCBpbnRlcm5hbCB0eXBlcyBsaWtlIEFueSBhcmUgaGFuZGxlZCBqdXN0IGxpa2UgbWVzc2FnZXMuIE1vcmUgcHJlY2lzZWx5OlxyXG4gKlxyXG4gKiAtIExvbmdzIGJlY29tZSBzdHJpbmdzXHJcbiAqIC0gRW51bXMgYmVjb21lIHN0cmluZyBrZXlzXHJcbiAqIC0gQnl0ZXMgYmVjb21lIGJhc2U2NCBlbmNvZGVkIHN0cmluZ3NcclxuICogLSAoU3ViLSlNZXNzYWdlcyBiZWNvbWUgcGxhaW4gb2JqZWN0c1xyXG4gKiAtIE1hcHMgYmVjb21lIHBsYWluIG9iamVjdHMgd2l0aCBhbGwgc3RyaW5nIGtleXNcclxuICogLSBSZXBlYXRlZCBmaWVsZHMgYmVjb21lIGFycmF5c1xyXG4gKiAtIE5hTiBhbmQgSW5maW5pdHkgZm9yIGZsb2F0IGFuZCBkb3VibGUgZmllbGRzIGJlY29tZSBzdHJpbmdzXHJcbiAqXHJcbiAqIEB0eXBlIHtJQ29udmVyc2lvbk9wdGlvbnN9XHJcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vcHJvdG9jb2wtYnVmZmVycy9kb2NzL3Byb3RvMz9obD1lbiNqc29uXHJcbiAqL1xyXG51dGlsLnRvSlNPTk9wdGlvbnMgPSB7XHJcbiAgICBsb25nczogU3RyaW5nLFxyXG4gICAgZW51bXM6IFN0cmluZyxcclxuICAgIGJ5dGVzOiBTdHJpbmcsXHJcbiAgICBqc29uOiB0cnVlXHJcbn07XHJcblxyXG51dGlsLl9jb25maWd1cmUgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBCdWZmZXIgPSB1dGlsLkJ1ZmZlcjtcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKCFCdWZmZXIpIHtcclxuICAgICAgICB1dGlsLl9CdWZmZXJfZnJvbSA9IHV0aWwuX0J1ZmZlcl9hbGxvY1Vuc2FmZSA9IG51bGw7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy8gYmVjYXVzZSBub2RlIDQueCBidWZmZXJzIGFyZSBpbmNvbXBhdGlibGUgJiBpbW11dGFibGVcclxuICAgIC8vIHNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Rjb2RlSU8vcHJvdG9idWYuanMvcHVsbC82NjVcclxuICAgIHV0aWwuX0J1ZmZlcl9mcm9tID0gQnVmZmVyLmZyb20gIT09IFVpbnQ4QXJyYXkuZnJvbSAmJiBCdWZmZXIuZnJvbSB8fFxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZnVuY3Rpb24gQnVmZmVyX2Zyb20odmFsdWUsIGVuY29kaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQnVmZmVyKHZhbHVlLCBlbmNvZGluZyk7XHJcbiAgICAgICAgfTtcclxuICAgIHV0aWwuX0J1ZmZlcl9hbGxvY1Vuc2FmZSA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSB8fFxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZnVuY3Rpb24gQnVmZmVyX2FsbG9jVW5zYWZlKHNpemUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXIoc2l6ZSk7XHJcbiAgICAgICAgfTtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gV3JpdGVyO1xyXG5cclxudmFyIHV0aWwgICAgICA9IHJlcXVpcmUoXCIuL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbnZhciBCdWZmZXJXcml0ZXI7IC8vIGN5Y2xpY1xyXG5cclxudmFyIExvbmdCaXRzICA9IHV0aWwuTG9uZ0JpdHMsXHJcbiAgICBiYXNlNjQgICAgPSB1dGlsLmJhc2U2NCxcclxuICAgIHV0ZjggICAgICA9IHV0aWwudXRmODtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHdyaXRlciBvcGVyYXRpb24gaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgU2NoZWR1bGVkIHdyaXRlciBvcGVyYXRpb24uXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCosIFVpbnQ4QXJyYXksIG51bWJlcil9IGZuIEZ1bmN0aW9uIHRvIGNhbGxcclxuICogQHBhcmFtIHtudW1iZXJ9IGxlbiBWYWx1ZSBieXRlIGxlbmd0aFxyXG4gKiBAcGFyYW0geyp9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5mdW5jdGlvbiBPcChmbiwgbGVuLCB2YWwpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZ1bmN0aW9uIHRvIGNhbGwuXHJcbiAgICAgKiBAdHlwZSB7ZnVuY3Rpb24oVWludDhBcnJheSwgbnVtYmVyLCAqKX1cclxuICAgICAqL1xyXG4gICAgdGhpcy5mbiA9IGZuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmFsdWUgYnl0ZSBsZW5ndGguXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmxlbiA9IGxlbjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE5leHQgb3BlcmF0aW9uLlxyXG4gICAgICogQHR5cGUge1dyaXRlci5PcHx1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFZhbHVlIHRvIHdyaXRlLlxyXG4gICAgICogQHR5cGUgeyp9XHJcbiAgICAgKi9cclxuICAgIHRoaXMudmFsID0gdmFsOyAvLyB0eXBlIHZhcmllc1xyXG59XHJcblxyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG5mdW5jdGlvbiBub29wKCkge30gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lbXB0eS1mdW5jdGlvblxyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgd3JpdGVyIHN0YXRlIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIENvcGllZCB3cml0ZXIgc3RhdGUuXHJcbiAqIEBtZW1iZXJvZiBXcml0ZXJcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7V3JpdGVyfSB3cml0ZXIgV3JpdGVyIHRvIGNvcHkgc3RhdGUgZnJvbVxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5mdW5jdGlvbiBTdGF0ZSh3cml0ZXIpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEN1cnJlbnQgaGVhZC5cclxuICAgICAqIEB0eXBlIHtXcml0ZXIuT3B9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuaGVhZCA9IHdyaXRlci5oZWFkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3VycmVudCB0YWlsLlxyXG4gICAgICogQHR5cGUge1dyaXRlci5PcH1cclxuICAgICAqL1xyXG4gICAgdGhpcy50YWlsID0gd3JpdGVyLnRhaWw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDdXJyZW50IGJ1ZmZlciBsZW5ndGguXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmxlbiA9IHdyaXRlci5sZW47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBOZXh0IHN0YXRlLlxyXG4gICAgICogQHR5cGUge1N0YXRlfG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubmV4dCA9IHdyaXRlci5zdGF0ZXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHdyaXRlciBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBXaXJlIGZvcm1hdCB3cml0ZXIgdXNpbmcgYFVpbnQ4QXJyYXlgIGlmIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGBBcnJheWAuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gV3JpdGVyKCkge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3VycmVudCBsZW5ndGguXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmxlbiA9IDA7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcGVyYXRpb25zIGhlYWQuXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICB0aGlzLmhlYWQgPSBuZXcgT3Aobm9vcCwgMCwgMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcGVyYXRpb25zIHRhaWxcclxuICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIHRoaXMudGFpbCA9IHRoaXMuaGVhZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIExpbmtlZCBmb3JrZWQgc3RhdGVzLlxyXG4gICAgICogQHR5cGUge09iamVjdHxudWxsfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnN0YXRlcyA9IG51bGw7XHJcblxyXG4gICAgLy8gV2hlbiBhIHZhbHVlIGlzIHdyaXR0ZW4sIHRoZSB3cml0ZXIgY2FsY3VsYXRlcyBpdHMgYnl0ZSBsZW5ndGggYW5kIHB1dHMgaXQgaW50byBhIGxpbmtlZFxyXG4gICAgLy8gbGlzdCBvZiBvcGVyYXRpb25zIHRvIHBlcmZvcm0gd2hlbiBmaW5pc2goKSBpcyBjYWxsZWQuIFRoaXMgYm90aCBhbGxvd3MgdXMgdG8gYWxsb2NhdGVcclxuICAgIC8vIGJ1ZmZlcnMgb2YgdGhlIGV4YWN0IHJlcXVpcmVkIHNpemUgYW5kIHJlZHVjZXMgdGhlIGFtb3VudCBvZiB3b3JrIHdlIGhhdmUgdG8gZG8gY29tcGFyZWRcclxuICAgIC8vIHRvIGZpcnN0IGNhbGN1bGF0aW5nIG92ZXIgb2JqZWN0cyBhbmQgdGhlbiBlbmNvZGluZyBvdmVyIG9iamVjdHMuIEluIG91ciBjYXNlLCB0aGUgZW5jb2RpbmdcclxuICAgIC8vIHBhcnQgaXMganVzdCBhIGxpbmtlZCBsaXN0IHdhbGsgY2FsbGluZyBvcGVyYXRpb25zIHdpdGggYWxyZWFkeSBwcmVwYXJlZCB2YWx1ZXMuXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IHdyaXRlci5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJXcml0ZXJ8V3JpdGVyfSBBIHtAbGluayBCdWZmZXJXcml0ZXJ9IHdoZW4gQnVmZmVycyBhcmUgc3VwcG9ydGVkLCBvdGhlcndpc2UgYSB7QGxpbmsgV3JpdGVyfVxyXG4gKi9cclxuV3JpdGVyLmNyZWF0ZSA9IHV0aWwuQnVmZmVyXHJcbiAgICA/IGZ1bmN0aW9uIGNyZWF0ZV9idWZmZXJfc2V0dXAoKSB7XHJcbiAgICAgICAgcmV0dXJuIChXcml0ZXIuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlX2J1ZmZlcigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXJXcml0ZXIoKTtcclxuICAgICAgICB9KSgpO1xyXG4gICAgfVxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIDogZnVuY3Rpb24gY3JlYXRlX2FycmF5KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgV3JpdGVyKCk7XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIEFsbG9jYXRlcyBhIGJ1ZmZlciBvZiB0aGUgc3BlY2lmaWVkIHNpemUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzaXplIEJ1ZmZlciBzaXplXHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBCdWZmZXJcclxuICovXHJcbldyaXRlci5hbGxvYyA9IGZ1bmN0aW9uIGFsbG9jKHNpemUpIHtcclxuICAgIHJldHVybiBuZXcgdXRpbC5BcnJheShzaXplKTtcclxufTtcclxuXHJcbi8vIFVzZSBVaW50OEFycmF5IGJ1ZmZlciBwb29sIGluIHRoZSBicm93c2VyLCBqdXN0IGxpa2Ugbm9kZSBkb2VzIHdpdGggYnVmZmVyc1xyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xyXG5pZiAodXRpbC5BcnJheSAhPT0gQXJyYXkpXHJcbiAgICBXcml0ZXIuYWxsb2MgPSB1dGlsLnBvb2woV3JpdGVyLmFsbG9jLCB1dGlsLkFycmF5LnByb3RvdHlwZS5zdWJhcnJheSk7XHJcblxyXG4vKipcclxuICogUHVzaGVzIGEgbmV3IG9wZXJhdGlvbiB0byB0aGUgcXVldWUuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oVWludDhBcnJheSwgbnVtYmVyLCAqKX0gZm4gRnVuY3Rpb24gdG8gY2FsbFxyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuIFZhbHVlIGJ5dGUgbGVuZ3RoXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLl9wdXNoID0gZnVuY3Rpb24gcHVzaChmbiwgbGVuLCB2YWwpIHtcclxuICAgIHRoaXMudGFpbCA9IHRoaXMudGFpbC5uZXh0ID0gbmV3IE9wKGZuLCBsZW4sIHZhbCk7XHJcbiAgICB0aGlzLmxlbiArPSBsZW47XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlQnl0ZSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICBidWZbcG9zXSA9IHZhbCAmIDI1NTtcclxufVxyXG5cclxuZnVuY3Rpb24gd3JpdGVWYXJpbnQzMih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICB3aGlsZSAodmFsID4gMTI3KSB7XHJcbiAgICAgICAgYnVmW3BvcysrXSA9IHZhbCAmIDEyNyB8IDEyODtcclxuICAgICAgICB2YWwgPj4+PSA3O1xyXG4gICAgfVxyXG4gICAgYnVmW3Bvc10gPSB2YWw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHZhcmludCB3cml0ZXIgb3BlcmF0aW9uIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIFNjaGVkdWxlZCB2YXJpbnQgd3JpdGVyIG9wZXJhdGlvbi5cclxuICogQGV4dGVuZHMgT3BcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gVmFsdWUgYnl0ZSBsZW5ndGhcclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5mdW5jdGlvbiBWYXJpbnRPcChsZW4sIHZhbCkge1xyXG4gICAgdGhpcy5sZW4gPSBsZW47XHJcbiAgICB0aGlzLm5leHQgPSB1bmRlZmluZWQ7XHJcbiAgICB0aGlzLnZhbCA9IHZhbDtcclxufVxyXG5cclxuVmFyaW50T3AucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShPcC5wcm90b3R5cGUpO1xyXG5WYXJpbnRPcC5wcm90b3R5cGUuZm4gPSB3cml0ZVZhcmludDMyO1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhbiB1bnNpZ25lZCAzMiBiaXQgdmFsdWUgYXMgYSB2YXJpbnQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUudWludDMyID0gZnVuY3Rpb24gd3JpdGVfdWludDMyKHZhbHVlKSB7XHJcbiAgICAvLyBoZXJlLCB0aGUgY2FsbCB0byB0aGlzLnB1c2ggaGFzIGJlZW4gaW5saW5lZCBhbmQgYSB2YXJpbnQgc3BlY2lmaWMgT3Agc3ViY2xhc3MgaXMgdXNlZC5cclxuICAgIC8vIHVpbnQzMiBpcyBieSBmYXIgdGhlIG1vc3QgZnJlcXVlbnRseSB1c2VkIG9wZXJhdGlvbiBhbmQgYmVuZWZpdHMgc2lnbmlmaWNhbnRseSBmcm9tIHRoaXMuXHJcbiAgICB0aGlzLmxlbiArPSAodGhpcy50YWlsID0gdGhpcy50YWlsLm5leHQgPSBuZXcgVmFyaW50T3AoXHJcbiAgICAgICAgKHZhbHVlID0gdmFsdWUgPj4+IDApXHJcbiAgICAgICAgICAgICAgICA8IDEyOCAgICAgICA/IDFcclxuICAgICAgICA6IHZhbHVlIDwgMTYzODQgICAgID8gMlxyXG4gICAgICAgIDogdmFsdWUgPCAyMDk3MTUyICAgPyAzXHJcbiAgICAgICAgOiB2YWx1ZSA8IDI2ODQzNTQ1NiA/IDRcclxuICAgICAgICA6ICAgICAgICAgICAgICAgICAgICAgNSxcclxuICAgIHZhbHVlKSkubGVuO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2lnbmVkIDMyIGJpdCB2YWx1ZSBhcyBhIHZhcmludC5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuaW50MzIgPSBmdW5jdGlvbiB3cml0ZV9pbnQzMih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlIDwgMFxyXG4gICAgICAgID8gdGhpcy5fcHVzaCh3cml0ZVZhcmludDY0LCAxMCwgTG9uZ0JpdHMuZnJvbU51bWJlcih2YWx1ZSkpIC8vIDEwIGJ5dGVzIHBlciBzcGVjXHJcbiAgICAgICAgOiB0aGlzLnVpbnQzMih2YWx1ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgMzIgYml0IHZhbHVlIGFzIGEgdmFyaW50LCB6aWctemFnIGVuY29kZWQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuc2ludDMyID0gZnVuY3Rpb24gd3JpdGVfc2ludDMyKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy51aW50MzIoKHZhbHVlIDw8IDEgXiB2YWx1ZSA+PiAzMSkgPj4+IDApO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGVWYXJpbnQ2NCh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICB3aGlsZSAodmFsLmhpKSB7XHJcbiAgICAgICAgYnVmW3BvcysrXSA9IHZhbC5sbyAmIDEyNyB8IDEyODtcclxuICAgICAgICB2YWwubG8gPSAodmFsLmxvID4+PiA3IHwgdmFsLmhpIDw8IDI1KSA+Pj4gMDtcclxuICAgICAgICB2YWwuaGkgPj4+PSA3O1xyXG4gICAgfVxyXG4gICAgd2hpbGUgKHZhbC5sbyA+IDEyNykge1xyXG4gICAgICAgIGJ1Zltwb3MrK10gPSB2YWwubG8gJiAxMjcgfCAxMjg7XHJcbiAgICAgICAgdmFsLmxvID0gdmFsLmxvID4+PiA3O1xyXG4gICAgfVxyXG4gICAgYnVmW3BvcysrXSA9IHZhbC5sbztcclxufVxyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhbiB1bnNpZ25lZCA2NCBiaXQgdmFsdWUgYXMgYSB2YXJpbnQuXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBgdmFsdWVgIGlzIGEgc3RyaW5nIGFuZCBubyBsb25nIGxpYnJhcnkgaXMgcHJlc2VudC5cclxuICovXHJcbldyaXRlci5wcm90b3R5cGUudWludDY0ID0gZnVuY3Rpb24gd3JpdGVfdWludDY0KHZhbHVlKSB7XHJcbiAgICB2YXIgYml0cyA9IExvbmdCaXRzLmZyb20odmFsdWUpO1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2god3JpdGVWYXJpbnQ2NCwgYml0cy5sZW5ndGgoKSwgYml0cyk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2lnbmVkIDY0IGJpdCB2YWx1ZSBhcyBhIHZhcmludC5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBgdmFsdWVgIGlzIGEgc3RyaW5nIGFuZCBubyBsb25nIGxpYnJhcnkgaXMgcHJlc2VudC5cclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuaW50NjQgPSBXcml0ZXIucHJvdG90eXBlLnVpbnQ2NDtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzaWduZWQgNjQgYml0IHZhbHVlIGFzIGEgdmFyaW50LCB6aWctemFnIGVuY29kZWQuXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBgdmFsdWVgIGlzIGEgc3RyaW5nIGFuZCBubyBsb25nIGxpYnJhcnkgaXMgcHJlc2VudC5cclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuc2ludDY0ID0gZnVuY3Rpb24gd3JpdGVfc2ludDY0KHZhbHVlKSB7XHJcbiAgICB2YXIgYml0cyA9IExvbmdCaXRzLmZyb20odmFsdWUpLnp6RW5jb2RlKCk7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZVZhcmludDY0LCBiaXRzLmxlbmd0aCgpLCBiaXRzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBib29saXNoIHZhbHVlIGFzIGEgdmFyaW50LlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5ib29sID0gZnVuY3Rpb24gd3JpdGVfYm9vbCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2god3JpdGVCeXRlLCAxLCB2YWx1ZSA/IDEgOiAwKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlRml4ZWQzMih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICBidWZbcG9zICAgIF0gPSAgdmFsICAgICAgICAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgMV0gPSAgdmFsID4+PiA4ICAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgMl0gPSAgdmFsID4+PiAxNiAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgM10gPSAgdmFsID4+PiAyNDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhbiB1bnNpZ25lZCAzMiBiaXQgdmFsdWUgYXMgZml4ZWQgMzIgYml0cy5cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5maXhlZDMyID0gZnVuY3Rpb24gd3JpdGVfZml4ZWQzMih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2god3JpdGVGaXhlZDMyLCA0LCB2YWx1ZSA+Pj4gMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2lnbmVkIDMyIGJpdCB2YWx1ZSBhcyBmaXhlZCAzMiBiaXRzLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5zZml4ZWQzMiA9IFdyaXRlci5wcm90b3R5cGUuZml4ZWQzMjtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYW4gdW5zaWduZWQgNjQgYml0IHZhbHVlIGFzIGZpeGVkIDY0IGJpdHMuXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBgdmFsdWVgIGlzIGEgc3RyaW5nIGFuZCBubyBsb25nIGxpYnJhcnkgaXMgcHJlc2VudC5cclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuZml4ZWQ2NCA9IGZ1bmN0aW9uIHdyaXRlX2ZpeGVkNjQodmFsdWUpIHtcclxuICAgIHZhciBiaXRzID0gTG9uZ0JpdHMuZnJvbSh2YWx1ZSk7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZUZpeGVkMzIsIDQsIGJpdHMubG8pLl9wdXNoKHdyaXRlRml4ZWQzMiwgNCwgYml0cy5oaSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2lnbmVkIDY0IGJpdCB2YWx1ZSBhcyBmaXhlZCA2NCBiaXRzLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGB2YWx1ZWAgaXMgYSBzdHJpbmcgYW5kIG5vIGxvbmcgbGlicmFyeSBpcyBwcmVzZW50LlxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5zZml4ZWQ2NCA9IFdyaXRlci5wcm90b3R5cGUuZml4ZWQ2NDtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBmbG9hdCAoMzIgYml0KS5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuZmxvYXQgPSBmdW5jdGlvbiB3cml0ZV9mbG9hdCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2godXRpbC5mbG9hdC53cml0ZUZsb2F0TEUsIDQsIHZhbHVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBkb3VibGUgKDY0IGJpdCBmbG9hdCkuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmRvdWJsZSA9IGZ1bmN0aW9uIHdyaXRlX2RvdWJsZSh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2godXRpbC5mbG9hdC53cml0ZURvdWJsZUxFLCA4LCB2YWx1ZSk7XHJcbn07XHJcblxyXG52YXIgd3JpdGVCeXRlcyA9IHV0aWwuQXJyYXkucHJvdG90eXBlLnNldFxyXG4gICAgPyBmdW5jdGlvbiB3cml0ZUJ5dGVzX3NldCh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgYnVmLnNldCh2YWwsIHBvcyk7IC8vIGFsc28gd29ya3MgZm9yIHBsYWluIGFycmF5IHZhbHVlc1xyXG4gICAgfVxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIDogZnVuY3Rpb24gd3JpdGVCeXRlc19mb3IodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICBidWZbcG9zICsgaV0gPSB2YWxbaV07XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHNlcXVlbmNlIG9mIGJ5dGVzLlxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl8c3RyaW5nfSB2YWx1ZSBCdWZmZXIgb3IgYmFzZTY0IGVuY29kZWQgc3RyaW5nIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5ieXRlcyA9IGZ1bmN0aW9uIHdyaXRlX2J5dGVzKHZhbHVlKSB7XHJcbiAgICB2YXIgbGVuID0gdmFsdWUubGVuZ3RoID4+PiAwO1xyXG4gICAgaWYgKCFsZW4pXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3B1c2god3JpdGVCeXRlLCAxLCAwKTtcclxuICAgIGlmICh1dGlsLmlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgIHZhciBidWYgPSBXcml0ZXIuYWxsb2MobGVuID0gYmFzZTY0Lmxlbmd0aCh2YWx1ZSkpO1xyXG4gICAgICAgIGJhc2U2NC5kZWNvZGUodmFsdWUsIGJ1ZiwgMCk7XHJcbiAgICAgICAgdmFsdWUgPSBidWY7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy51aW50MzIobGVuKS5fcHVzaCh3cml0ZUJ5dGVzLCBsZW4sIHZhbHVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuc3RyaW5nID0gZnVuY3Rpb24gd3JpdGVfc3RyaW5nKHZhbHVlKSB7XHJcbiAgICB2YXIgbGVuID0gdXRmOC5sZW5ndGgodmFsdWUpO1xyXG4gICAgcmV0dXJuIGxlblxyXG4gICAgICAgID8gdGhpcy51aW50MzIobGVuKS5fcHVzaCh1dGY4LndyaXRlLCBsZW4sIHZhbHVlKVxyXG4gICAgICAgIDogdGhpcy5fcHVzaCh3cml0ZUJ5dGUsIDEsIDApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZvcmtzIHRoaXMgd3JpdGVyJ3Mgc3RhdGUgYnkgcHVzaGluZyBpdCB0byBhIHN0YWNrLlxyXG4gKiBDYWxsaW5nIHtAbGluayBXcml0ZXIjcmVzZXR8cmVzZXR9IG9yIHtAbGluayBXcml0ZXIjbGRlbGltfGxkZWxpbX0gcmVzZXRzIHRoZSB3cml0ZXIgdG8gdGhlIHByZXZpb3VzIHN0YXRlLlxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuZm9yayA9IGZ1bmN0aW9uIGZvcmsoKSB7XHJcbiAgICB0aGlzLnN0YXRlcyA9IG5ldyBTdGF0ZSh0aGlzKTtcclxuICAgIHRoaXMuaGVhZCA9IHRoaXMudGFpbCA9IG5ldyBPcChub29wLCAwLCAwKTtcclxuICAgIHRoaXMubGVuID0gMDtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0aGlzIGluc3RhbmNlIHRvIHRoZSBsYXN0IHN0YXRlLlxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiByZXNldCgpIHtcclxuICAgIGlmICh0aGlzLnN0YXRlcykge1xyXG4gICAgICAgIHRoaXMuaGVhZCAgID0gdGhpcy5zdGF0ZXMuaGVhZDtcclxuICAgICAgICB0aGlzLnRhaWwgICA9IHRoaXMuc3RhdGVzLnRhaWw7XHJcbiAgICAgICAgdGhpcy5sZW4gICAgPSB0aGlzLnN0YXRlcy5sZW47XHJcbiAgICAgICAgdGhpcy5zdGF0ZXMgPSB0aGlzLnN0YXRlcy5uZXh0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmhlYWQgPSB0aGlzLnRhaWwgPSBuZXcgT3Aobm9vcCwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5sZW4gID0gMDtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0byB0aGUgbGFzdCBzdGF0ZSBhbmQgYXBwZW5kcyB0aGUgZm9yayBzdGF0ZSdzIGN1cnJlbnQgd3JpdGUgbGVuZ3RoIGFzIGEgdmFyaW50IGZvbGxvd2VkIGJ5IGl0cyBvcGVyYXRpb25zLlxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUubGRlbGltID0gZnVuY3Rpb24gbGRlbGltKCkge1xyXG4gICAgdmFyIGhlYWQgPSB0aGlzLmhlYWQsXHJcbiAgICAgICAgdGFpbCA9IHRoaXMudGFpbCxcclxuICAgICAgICBsZW4gID0gdGhpcy5sZW47XHJcbiAgICB0aGlzLnJlc2V0KCkudWludDMyKGxlbik7XHJcbiAgICBpZiAobGVuKSB7XHJcbiAgICAgICAgdGhpcy50YWlsLm5leHQgPSBoZWFkLm5leHQ7IC8vIHNraXAgbm9vcFxyXG4gICAgICAgIHRoaXMudGFpbCA9IHRhaWw7XHJcbiAgICAgICAgdGhpcy5sZW4gKz0gbGVuO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogRmluaXNoZXMgdGhlIHdyaXRlIG9wZXJhdGlvbi5cclxuICogQHJldHVybnMge1VpbnQ4QXJyYXl9IEZpbmlzaGVkIGJ1ZmZlclxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5maW5pc2ggPSBmdW5jdGlvbiBmaW5pc2goKSB7XHJcbiAgICB2YXIgaGVhZCA9IHRoaXMuaGVhZC5uZXh0LCAvLyBza2lwIG5vb3BcclxuICAgICAgICBidWYgID0gdGhpcy5jb25zdHJ1Y3Rvci5hbGxvYyh0aGlzLmxlbiksXHJcbiAgICAgICAgcG9zICA9IDA7XHJcbiAgICB3aGlsZSAoaGVhZCkge1xyXG4gICAgICAgIGhlYWQuZm4oaGVhZC52YWwsIGJ1ZiwgcG9zKTtcclxuICAgICAgICBwb3MgKz0gaGVhZC5sZW47XHJcbiAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcclxuICAgIH1cclxuICAgIC8vIHRoaXMuaGVhZCA9IHRoaXMudGFpbCA9IG51bGw7XHJcbiAgICByZXR1cm4gYnVmO1xyXG59O1xyXG5cclxuV3JpdGVyLl9jb25maWd1cmUgPSBmdW5jdGlvbihCdWZmZXJXcml0ZXJfKSB7XHJcbiAgICBCdWZmZXJXcml0ZXIgPSBCdWZmZXJXcml0ZXJfO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBCdWZmZXJXcml0ZXI7XHJcblxyXG4vLyBleHRlbmRzIFdyaXRlclxyXG52YXIgV3JpdGVyID0gcmVxdWlyZShcIi4vd3JpdGVyXCIpO1xyXG4oQnVmZmVyV3JpdGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoV3JpdGVyLnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yID0gQnVmZmVyV3JpdGVyO1xyXG5cclxudmFyIHV0aWwgPSByZXF1aXJlKFwiLi91dGlsL21pbmltYWxcIik7XHJcblxyXG52YXIgQnVmZmVyID0gdXRpbC5CdWZmZXI7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBidWZmZXIgd3JpdGVyIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIFdpcmUgZm9ybWF0IHdyaXRlciB1c2luZyBub2RlIGJ1ZmZlcnMuXHJcbiAqIEBleHRlbmRzIFdyaXRlclxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEJ1ZmZlcldyaXRlcigpIHtcclxuICAgIFdyaXRlci5jYWxsKHRoaXMpO1xyXG59XHJcblxyXG4vKipcclxuICogQWxsb2NhdGVzIGEgYnVmZmVyIG9mIHRoZSBzcGVjaWZpZWQgc2l6ZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IHNpemUgQnVmZmVyIHNpemVcclxuICogQHJldHVybnMge0J1ZmZlcn0gQnVmZmVyXHJcbiAqL1xyXG5CdWZmZXJXcml0ZXIuYWxsb2MgPSBmdW5jdGlvbiBhbGxvY19idWZmZXIoc2l6ZSkge1xyXG4gICAgcmV0dXJuIChCdWZmZXJXcml0ZXIuYWxsb2MgPSB1dGlsLl9CdWZmZXJfYWxsb2NVbnNhZmUpKHNpemUpO1xyXG59O1xyXG5cclxudmFyIHdyaXRlQnl0ZXNCdWZmZXIgPSBCdWZmZXIgJiYgQnVmZmVyLnByb3RvdHlwZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgJiYgQnVmZmVyLnByb3RvdHlwZS5zZXQubmFtZSA9PT0gXCJzZXRcIlxyXG4gICAgPyBmdW5jdGlvbiB3cml0ZUJ5dGVzQnVmZmVyX3NldCh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgYnVmLnNldCh2YWwsIHBvcyk7IC8vIGZhc3RlciB0aGFuIGNvcHkgKHJlcXVpcmVzIG5vZGUgPj0gNCB3aGVyZSBCdWZmZXJzIGV4dGVuZCBVaW50OEFycmF5IGFuZCBzZXQgaXMgcHJvcGVybHkgaW5oZXJpdGVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbHNvIHdvcmtzIGZvciBwbGFpbiBhcnJheSB2YWx1ZXNcclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICA6IGZ1bmN0aW9uIHdyaXRlQnl0ZXNCdWZmZXJfY29weSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgaWYgKHZhbC5jb3B5KSAvLyBCdWZmZXIgdmFsdWVzXHJcbiAgICAgICAgICAgIHZhbC5jb3B5KGJ1ZiwgcG9zLCAwLCB2YWwubGVuZ3RoKTtcclxuICAgICAgICBlbHNlIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsLmxlbmd0aDspIC8vIHBsYWluIGFycmF5IHZhbHVlc1xyXG4gICAgICAgICAgICBidWZbcG9zKytdID0gdmFsW2krK107XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuQnVmZmVyV3JpdGVyLnByb3RvdHlwZS5ieXRlcyA9IGZ1bmN0aW9uIHdyaXRlX2J5dGVzX2J1ZmZlcih2YWx1ZSkge1xyXG4gICAgaWYgKHV0aWwuaXNTdHJpbmcodmFsdWUpKVxyXG4gICAgICAgIHZhbHVlID0gdXRpbC5fQnVmZmVyX2Zyb20odmFsdWUsIFwiYmFzZTY0XCIpO1xyXG4gICAgdmFyIGxlbiA9IHZhbHVlLmxlbmd0aCA+Pj4gMDtcclxuICAgIHRoaXMudWludDMyKGxlbik7XHJcbiAgICBpZiAobGVuKVxyXG4gICAgICAgIHRoaXMuX3B1c2god3JpdGVCeXRlc0J1ZmZlciwgbGVuLCB2YWx1ZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlU3RyaW5nQnVmZmVyKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIGlmICh2YWwubGVuZ3RoIDwgNDApIC8vIHBsYWluIGpzIGlzIGZhc3RlciBmb3Igc2hvcnQgc3RyaW5ncyAocHJvYmFibHkgZHVlIHRvIHJlZHVuZGFudCBhc3NlcnRpb25zKVxyXG4gICAgICAgIHV0aWwudXRmOC53cml0ZSh2YWwsIGJ1ZiwgcG9zKTtcclxuICAgIGVsc2VcclxuICAgICAgICBidWYudXRmOFdyaXRlKHZhbCwgcG9zKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuQnVmZmVyV3JpdGVyLnByb3RvdHlwZS5zdHJpbmcgPSBmdW5jdGlvbiB3cml0ZV9zdHJpbmdfYnVmZmVyKHZhbHVlKSB7XHJcbiAgICB2YXIgbGVuID0gQnVmZmVyLmJ5dGVMZW5ndGgodmFsdWUpO1xyXG4gICAgdGhpcy51aW50MzIobGVuKTtcclxuICAgIGlmIChsZW4pXHJcbiAgICAgICAgdGhpcy5fcHVzaCh3cml0ZVN0cmluZ0J1ZmZlciwgbGVuLCB2YWx1ZSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcblxyXG4vKipcclxuICogRmluaXNoZXMgdGhlIHdyaXRlIG9wZXJhdGlvbi5cclxuICogQG5hbWUgQnVmZmVyV3JpdGVyI2ZpbmlzaFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0J1ZmZlcn0gRmluaXNoZWQgYnVmZmVyXHJcbiAqL1xyXG4iLCJpbXBvcnQgeyBsaXN0IH0gZnJvbSBcIi4uL3NyY2RlcHMvcHJvdG8tZ2VuLXRzL2FsbHByb3RvXCJcbmltcG9ydCB7IE15TGlzdHMgfSBmcm9tIFwiLi9NeUxpc3RzXCJcbmltcG9ydCB7IE5vdyB9IGZyb20gXCIuL05vd1wiXG5leHBvcnQgY2xhc3MgSGVsbG8ge1xuICBnZXRTaG9wcGluZ0xpc3QoKTogbGlzdC5MaXN0IHtcbiAgICBsZXQgc2hvcHBpbmdMaXN0ID0gbGlzdC5MaXN0LmNyZWF0ZSh7bmFtZTogXCJzaG9wcGluZ1wifSlcbiAgICBzaG9wcGluZ0xpc3QuaXRlbXMucHVzaChsaXN0Lkl0ZW0uY3JlYXRlKHtuYW1lOiBcImNvZmZlZVwifSkpXG4gICAgc2hvcHBpbmdMaXN0Lml0ZW1zLnB1c2gobGlzdC5JdGVtLmNyZWF0ZSh7bmFtZTogXCJjYXQgZm9vZFwifSkpXG4gICAgcmV0dXJuIHNob3BwaW5nTGlzdFxuICB9XG5cbiAgcnVuKCkge1xuICAgIGNvbnNvbGUubG9nKFwiaGVsbG8gd29ybGQgMTBcIilcbiAgICBuZXcgTm93KCkucHJpbnQoKVxuXG4gICAgY29uc29sZS5sb2cobmV3IE15TGlzdHMoKS5nZXRTaG9wcGluZ0xpc3QoKSlcbiAgfVxufSIsImltcG9ydCB7IGxpc3QgfSBmcm9tIFwiLi4vc3JjZGVwcy9wcm90by1nZW4tdHMvYWxscHJvdG9cIlxuXG5leHBvcnQgY2xhc3MgTXlMaXN0cyB7XG4gIGdldFNob3BwaW5nTGlzdCgpOiBsaXN0Lkxpc3Qge1xuICAgIGxldCBzaG9wcGluZ0xpc3QgPSBsaXN0Lkxpc3QuY3JlYXRlKHtuYW1lOiBcInNob3BwaW5nXCJ9KVxuICAgIHNob3BwaW5nTGlzdC5pdGVtcy5wdXNoKGxpc3QuSXRlbS5jcmVhdGUoe25hbWU6IFwiY29mZmVlXCJ9KSlcbiAgICBzaG9wcGluZ0xpc3QuaXRlbXMucHVzaChsaXN0Lkl0ZW0uY3JlYXRlKHtuYW1lOiBcImNhdCBmb29kXCJ9KSlcbiAgICByZXR1cm4gc2hvcHBpbmdMaXN0XG4gIH1cbn0iLCJleHBvcnQgY2xhc3MgTm93IHtcbiAgcHJpbnQoKSB7XG4gICAgY29uc29sZS5sb2cobmV3IERhdGUoKSwgXCJzb21ldGhpbmcgZWxzZSAyXCIpXG4gIH1cbn0iLCIvKmVzbGludC1kaXNhYmxlIGJsb2NrLXNjb3BlZC12YXIsIG5vLXJlZGVjbGFyZSwgbm8tY29udHJvbC1yZWdleCwgbm8tcHJvdG90eXBlLWJ1aWx0aW5zKi9cblwidXNlIHN0cmljdFwiO1xuXG52YXIgJHByb3RvYnVmID0gcmVxdWlyZShcIi4uL3Byb3RvYnVmanMvbWluaW1hbC5qc1wiKTtcblxuLy8gQ29tbW9uIGFsaWFzZXNcbnZhciAkdXRpbCA9ICRwcm90b2J1Zi51dGlsO1xuXG4vLyBFeHBvcnRlZCByb290IG5hbWVzcGFjZVxudmFyICRyb290ID0gJHByb3RvYnVmLnJvb3RzW1wiLi4vc3JjZGVwcy9wcm90by1nZW4tdHMvYWxscHJvdG9cIl0gfHwgKCRwcm90b2J1Zi5yb290c1tcIi4uL3NyY2RlcHMvcHJvdG8tZ2VuLXRzL2FsbHByb3RvXCJdID0ge30pO1xuXG4kcm9vdC5saXN0ID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgLyoqXG4gICAgICogTmFtZXNwYWNlIGxpc3QuXG4gICAgICogQGV4cG9ydHMgbGlzdFxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKi9cbiAgICB2YXIgbGlzdCA9IHt9O1xuXG4gICAgbGlzdC5JdGVtID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9wZXJ0aWVzIG9mIGFuIEl0ZW0uXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0XG4gICAgICAgICAqIEBpbnRlcmZhY2UgSUl0ZW1cbiAgICAgICAgICogQHByb3BlcnR5IHtzdHJpbmd9IFtuYW1lXSBJdGVtIG5hbWVcbiAgICAgICAgICovXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnN0cnVjdHMgYSBuZXcgSXRlbS5cbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3RcbiAgICAgICAgICogQGNsYXNzZGVzYyBSZXByZXNlbnRzIGFuIEl0ZW0uXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAcGFyYW0ge2xpc3QuSUl0ZW09fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIEl0ZW0ocHJvcGVydGllcykge1xuICAgICAgICAgICAgaWYgKHByb3BlcnRpZXMpXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5cyA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW2tleXNbaV1dICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2tleXNbaV1dID0gcHJvcGVydGllc1trZXlzW2ldXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVtIG5hbWUuXG4gICAgICAgICAqIEBtZW1iZXIge3N0cmluZ31uYW1lXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkl0ZW1cbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBJdGVtLnByb3RvdHlwZS5uYW1lID0gXCJcIjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBJdGVtIGluc3RhbmNlIHVzaW5nIHRoZSBzcGVjaWZpZWQgcHJvcGVydGllcy5cbiAgICAgICAgICogQGZ1bmN0aW9uIGNyZWF0ZVxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5JdGVtXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQHBhcmFtIHtsaXN0LklJdGVtPX0gW3Byb3BlcnRpZXNdIFByb3BlcnRpZXMgdG8gc2V0XG4gICAgICAgICAqIEByZXR1cm5zIHtsaXN0Lkl0ZW19IEl0ZW0gaW5zdGFuY2VcbiAgICAgICAgICovXG4gICAgICAgIEl0ZW0uY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgSXRlbShwcm9wZXJ0aWVzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVmVyaWZpZXMgYW4gSXRlbSBtZXNzYWdlLlxuICAgICAgICAgKiBAZnVuY3Rpb24gdmVyaWZ5XG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkl0ZW1cbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBtZXNzYWdlIFBsYWluIG9iamVjdCB0byB2ZXJpZnlcbiAgICAgICAgICogQHJldHVybnMge3N0cmluZ3xudWxsfSBgbnVsbGAgaWYgdmFsaWQsIG90aGVyd2lzZSB0aGUgcmVhc29uIHdoeSBpdCBpcyBub3RcbiAgICAgICAgICovXG4gICAgICAgIEl0ZW0udmVyaWZ5ID0gZnVuY3Rpb24gdmVyaWZ5KG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gXCJvYmplY3RcIiB8fCBtZXNzYWdlID09PSBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiBcIm9iamVjdCBleHBlY3RlZFwiO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UubmFtZSAhPSBudWxsICYmIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJuYW1lXCIpKVxuICAgICAgICAgICAgICAgIGlmICghJHV0aWwuaXNTdHJpbmcobWVzc2FnZS5uYW1lKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibmFtZTogc3RyaW5nIGV4cGVjdGVkXCI7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhbiBJdGVtIG1lc3NhZ2UgZnJvbSBhIHBsYWluIG9iamVjdC4gQWxzbyBjb252ZXJ0cyB2YWx1ZXMgdG8gdGhlaXIgcmVzcGVjdGl2ZSBpbnRlcm5hbCB0eXBlcy5cbiAgICAgICAgICogQGZ1bmN0aW9uIGZyb21PYmplY3RcbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuSXRlbVxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IG9iamVjdCBQbGFpbiBvYmplY3RcbiAgICAgICAgICogQHJldHVybnMge2xpc3QuSXRlbX0gSXRlbVxuICAgICAgICAgKi9cbiAgICAgICAgSXRlbS5mcm9tT2JqZWN0ID0gZnVuY3Rpb24gZnJvbU9iamVjdChvYmplY3QpIHtcbiAgICAgICAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiAkcm9vdC5saXN0Lkl0ZW0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gbmV3ICRyb290Lmxpc3QuSXRlbSgpO1xuICAgICAgICAgICAgaWYgKG9iamVjdC5uYW1lICE9IG51bGwpXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5uYW1lID0gU3RyaW5nKG9iamVjdC5uYW1lKTtcbiAgICAgICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgcGxhaW4gb2JqZWN0IGZyb20gYW4gSXRlbSBtZXNzYWdlLiBBbHNvIGNvbnZlcnRzIHZhbHVlcyB0byBvdGhlciB0eXBlcyBpZiBzcGVjaWZpZWQuXG4gICAgICAgICAqIEBmdW5jdGlvbiB0b09iamVjdFxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5JdGVtXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQHBhcmFtIHtsaXN0Lkl0ZW19IG1lc3NhZ2UgSXRlbVxuICAgICAgICAgKiBAcGFyYW0geyRwcm90b2J1Zi5JQ29udmVyc2lvbk9wdGlvbnN9IFtvcHRpb25zXSBDb252ZXJzaW9uIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBQbGFpbiBvYmplY3RcbiAgICAgICAgICovXG4gICAgICAgIEl0ZW0udG9PYmplY3QgPSBmdW5jdGlvbiB0b09iamVjdChtZXNzYWdlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMpXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgdmFyIG9iamVjdCA9IHt9O1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZGVmYXVsdHMpXG4gICAgICAgICAgICAgICAgb2JqZWN0Lm5hbWUgPSBcIlwiO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UubmFtZSAhPSBudWxsICYmIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJuYW1lXCIpKVxuICAgICAgICAgICAgICAgIG9iamVjdC5uYW1lID0gbWVzc2FnZS5uYW1lO1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydHMgdGhpcyBJdGVtIHRvIEpTT04uXG4gICAgICAgICAqIEBmdW5jdGlvbiB0b0pTT05cbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuSXRlbVxuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBKU09OIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgSXRlbS5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IudG9PYmplY3QodGhpcywgJHByb3RvYnVmLnV0aWwudG9KU09OT3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIEl0ZW07XG4gICAgfSkoKTtcblxuICAgIGxpc3QuTGlzdCA9IChmdW5jdGlvbigpIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJvcGVydGllcyBvZiBhIExpc3QuXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0XG4gICAgICAgICAqIEBpbnRlcmZhY2UgSUxpc3RcbiAgICAgICAgICogQHByb3BlcnR5IHtzdHJpbmd9IFtuYW1lXSBMaXN0IG5hbWVcbiAgICAgICAgICogQHByb3BlcnR5IHtBcnJheS48bGlzdC5JSXRlbT59IFtpdGVtc10gTGlzdCBpdGVtc1xuICAgICAgICAgKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29uc3RydWN0cyBhIG5ldyBMaXN0LlxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdFxuICAgICAgICAgKiBAY2xhc3NkZXNjIFJlcHJlc2VudHMgYSBMaXN0LlxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICogQHBhcmFtIHtsaXN0LklMaXN0PX0gW3Byb3BlcnRpZXNdIFByb3BlcnRpZXMgdG8gc2V0XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBMaXN0KHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzKVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleXMgPSBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKSwgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc1trZXlzW2ldXSAhPSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1trZXlzW2ldXSA9IHByb3BlcnRpZXNba2V5c1tpXV07XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCBuYW1lLlxuICAgICAgICAgKiBAbWVtYmVyIHtzdHJpbmd9bmFtZVxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5MaXN0XG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKi9cbiAgICAgICAgTGlzdC5wcm90b3R5cGUubmFtZSA9IFwiXCI7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExpc3QgaXRlbXMuXG4gICAgICAgICAqIEBtZW1iZXIge0FycmF5LjxsaXN0LklJdGVtPn1pdGVtc1xuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5MaXN0XG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKi9cbiAgICAgICAgTGlzdC5wcm90b3R5cGUuaXRlbXMgPSAkdXRpbC5lbXB0eUFycmF5O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IExpc3QgaW5zdGFuY2UgdXNpbmcgdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzLlxuICAgICAgICAgKiBAZnVuY3Rpb24gY3JlYXRlXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkxpc3RcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAcGFyYW0ge2xpc3QuSUxpc3Q9fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcbiAgICAgICAgICogQHJldHVybnMge2xpc3QuTGlzdH0gTGlzdCBpbnN0YW5jZVxuICAgICAgICAgKi9cbiAgICAgICAgTGlzdC5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUocHJvcGVydGllcykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBMaXN0KHByb3BlcnRpZXMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBWZXJpZmllcyBhIExpc3QgbWVzc2FnZS5cbiAgICAgICAgICogQGZ1bmN0aW9uIHZlcmlmeVxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5MaXN0XG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gbWVzc2FnZSBQbGFpbiBvYmplY3QgdG8gdmVyaWZ5XG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd8bnVsbH0gYG51bGxgIGlmIHZhbGlkLCBvdGhlcndpc2UgdGhlIHJlYXNvbiB3aHkgaXQgaXMgbm90XG4gICAgICAgICAqL1xuICAgICAgICBMaXN0LnZlcmlmeSA9IGZ1bmN0aW9uIHZlcmlmeShtZXNzYWdlKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1lc3NhZ2UgIT09IFwib2JqZWN0XCIgfHwgbWVzc2FnZSA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJvYmplY3QgZXhwZWN0ZWRcIjtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLm5hbWUgIT0gbnVsbCAmJiBtZXNzYWdlLmhhc093blByb3BlcnR5KFwibmFtZVwiKSlcbiAgICAgICAgICAgICAgICBpZiAoISR1dGlsLmlzU3RyaW5nKG1lc3NhZ2UubmFtZSkpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIm5hbWU6IHN0cmluZyBleHBlY3RlZFwiO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UuaXRlbXMgIT0gbnVsbCAmJiBtZXNzYWdlLmhhc093blByb3BlcnR5KFwiaXRlbXNcIikpIHtcbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkobWVzc2FnZS5pdGVtcykpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIml0ZW1zOiBhcnJheSBleHBlY3RlZFwiO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWVzc2FnZS5pdGVtcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSAkcm9vdC5saXN0Lkl0ZW0udmVyaWZ5KG1lc3NhZ2UuaXRlbXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJpdGVtcy5cIiArIGVycm9yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgTGlzdCBtZXNzYWdlIGZyb20gYSBwbGFpbiBvYmplY3QuIEFsc28gY29udmVydHMgdmFsdWVzIHRvIHRoZWlyIHJlc3BlY3RpdmUgaW50ZXJuYWwgdHlwZXMuXG4gICAgICAgICAqIEBmdW5jdGlvbiBmcm9tT2JqZWN0XG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkxpc3RcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBvYmplY3QgUGxhaW4gb2JqZWN0XG4gICAgICAgICAqIEByZXR1cm5zIHtsaXN0Lkxpc3R9IExpc3RcbiAgICAgICAgICovXG4gICAgICAgIExpc3QuZnJvbU9iamVjdCA9IGZ1bmN0aW9uIGZyb21PYmplY3Qob2JqZWN0KSB7XG4gICAgICAgICAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgJHJvb3QubGlzdC5MaXN0KVxuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IG5ldyAkcm9vdC5saXN0Lkxpc3QoKTtcbiAgICAgICAgICAgIGlmIChvYmplY3QubmFtZSAhPSBudWxsKVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UubmFtZSA9IFN0cmluZyhvYmplY3QubmFtZSk7XG4gICAgICAgICAgICBpZiAob2JqZWN0Lml0ZW1zKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KG9iamVjdC5pdGVtcykpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcihcIi5saXN0Lkxpc3QuaXRlbXM6IGFycmF5IGV4cGVjdGVkXCIpO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UuaXRlbXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iamVjdC5pdGVtcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdC5pdGVtc1tpXSAhPT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcihcIi5saXN0Lkxpc3QuaXRlbXM6IG9iamVjdCBleHBlY3RlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5pdGVtc1tpXSA9ICRyb290Lmxpc3QuSXRlbS5mcm9tT2JqZWN0KG9iamVjdC5pdGVtc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBwbGFpbiBvYmplY3QgZnJvbSBhIExpc3QgbWVzc2FnZS4gQWxzbyBjb252ZXJ0cyB2YWx1ZXMgdG8gb3RoZXIgdHlwZXMgaWYgc3BlY2lmaWVkLlxuICAgICAgICAgKiBAZnVuY3Rpb24gdG9PYmplY3RcbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuTGlzdFxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBwYXJhbSB7bGlzdC5MaXN0fSBtZXNzYWdlIExpc3RcbiAgICAgICAgICogQHBhcmFtIHskcHJvdG9idWYuSUNvbnZlcnNpb25PcHRpb25zfSBbb3B0aW9uc10gQ29udmVyc2lvbiBvcHRpb25zXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPn0gUGxhaW4gb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBMaXN0LnRvT2JqZWN0ID0gZnVuY3Rpb24gdG9PYmplY3QobWVzc2FnZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zKVxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgICAgIHZhciBvYmplY3QgPSB7fTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFycmF5cyB8fCBvcHRpb25zLmRlZmF1bHRzKVxuICAgICAgICAgICAgICAgIG9iamVjdC5pdGVtcyA9IFtdO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZGVmYXVsdHMpXG4gICAgICAgICAgICAgICAgb2JqZWN0Lm5hbWUgPSBcIlwiO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UubmFtZSAhPSBudWxsICYmIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJuYW1lXCIpKVxuICAgICAgICAgICAgICAgIG9iamVjdC5uYW1lID0gbWVzc2FnZS5uYW1lO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UuaXRlbXMgJiYgbWVzc2FnZS5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBvYmplY3QuaXRlbXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1lc3NhZ2UuaXRlbXMubGVuZ3RoOyArK2opXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5pdGVtc1tqXSA9ICRyb290Lmxpc3QuSXRlbS50b09iamVjdChtZXNzYWdlLml0ZW1zW2pdLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIHRoaXMgTGlzdCB0byBKU09OLlxuICAgICAgICAgKiBAZnVuY3Rpb24gdG9KU09OXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkxpc3RcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPn0gSlNPTiBvYmplY3RcbiAgICAgICAgICovXG4gICAgICAgIExpc3QucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnRvT2JqZWN0KHRoaXMsICRwcm90b2J1Zi51dGlsLnRvSlNPTk9wdGlvbnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBMaXN0O1xuICAgIH0pKCk7XG5cbiAgICByZXR1cm4gbGlzdDtcbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gJHJvb3Q7XG4iLCJpbXBvcnQgeyBNeUxpc3RzIH0gZnJvbSBcIi4uL3NyYy9NeUxpc3RzXCJcbmltcG9ydCB7IEhlbGxvIH0gZnJvbSBcIi4uL3NyYy9IZWxsb1wiXG5pbXBvcnQgeyBsaXN0IH0gZnJvbSBcIi4uL3NyY2RlcHMvcHJvdG8tZ2VuLXRzL2FsbHByb3RvXCJcblxuY29uc29sZS5sb2coXCJJbml0IHN0YXJ0XCIpXG5cbi8vIFJhbmRvbSBoZWxsby13b3JsZCB0eXBlIHN0dWZmLiBDaGVjayB0aGUgYnJvd3NlciBjb25zb2xlLlxubmV3IEhlbGxvKCkucnVuKClcblxuXG4vLyBUaGlzIGlzIHR5cGljYWwgbXZkb20gY29kZSBsaWtlIHlvdSdkIGZpbmQgaW4gdGhlIGV4YW1wbGVzXG4vLyBoZXJlOiBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9tdmRvbVxuLy9cbi8vIFRoZSBjb2RlIGJlbG93IGlzIGphdmFzY3JpcHQtd2l0aC1hLWxpdHRsZS10eXBlc2NyaXB0LlxuLy8gTm90ZSB0aGF0IHRoZSBtb2RlbCBvYmplY3QgKHNob3BwaW5nTGlzdCkgaXMgc3Ryb25nbHkgdHlwZWQsXG4vLyBhbmQgd2UgZ2V0IHRoZSBiZW5lZml0IG9mIGNvZGUgY29tcGxldGlvbiwgSURFIHJlZCBzcXVpZ2dsaWVzLCBldGMuXG4vL1xuLy8gRXZlbiBiZXR0ZXIgd291bGQgYmUgdG8gY3JlYXRlIGFuIG12ZG9tIHR5cGVzY3JpcHQgZGVmaW5pdGlvbixcbi8vIGJ1dCB0aGF0J3Mgb3V0IG9mIHNjb3BlIGZvciB0aGlzIHByb2plY3QuXG5cbmRlY2xhcmUgZnVuY3Rpb24gcmVxdWlyZShuYW1lOnN0cmluZyk7XG5sZXQgZCA9IHJlcXVpcmUoXCIuLi91aWRlcHMvbXZkb21cIilcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT4ge1xuICBkLmRpc3BsYXkoXCJTaG9wcGluZ1ZpZXdcIiwgZC5maXJzdChcIiNzaG9wcGluZ1wiKSwgbmV3IE15TGlzdHMoKS5nZXRTaG9wcGluZ0xpc3QoKSlcbn0pXG5cbmQucmVnaXN0ZXIoXCJTaG9wcGluZ1ZpZXdcIix7XG5cdGNyZWF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPSdTaG9wcGluZ1ZpZXcnPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibGlzdFwiPmhpLCBpJ20gdGhlIGVtcHR5IGxpc3Q8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PmBcblx0fSxcblx0XHRcdFx0XHRcblx0aW5pdDogZnVuY3Rpb24oc2hvcHBpbmdMaXN0OiBsaXN0Lkxpc3Qpe1xuICAgIGxldCB2aWV3ID0gdGhpc1xuICAgIGxldCBsaXN0RWwgPSBkLmZpcnN0KHZpZXcuZWwsIFwiLmxpc3RcIilcbiAgICBsaXN0RWwuaW5uZXJIVE1MID0gXCJcIlxuXG4gICAgbGV0IG5hbWVEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgbmFtZURpdi50ZXh0Q29udGVudCA9IHNob3BwaW5nTGlzdC5uYW1lXG4gICAgbGlzdEVsLmFwcGVuZENoaWxkKG5hbWVEaXYpXG5cbiAgICBsZXQgdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIilcbiAgICBmb3IgKGxldCBsaXN0SXRlbSBvZiBzaG9wcGluZ0xpc3QuaXRlbXMpIHtcbiAgICAgIGxldCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKVxuICAgICAgbGkudGV4dENvbnRlbnQgPSBsaXN0SXRlbS5uYW1lIHx8IFwiXCJcbiAgICAgIHVsLmFwcGVuZENoaWxkKGxpKVxuICAgIH1cbiAgICBcbiAgICBsaXN0RWwuYXBwZW5kQ2hpbGQodWwpXG4gIH1cbn0pXG5cbmNvbnNvbGUubG9nKFwiSW5pdCBkb25lXCIpXG4iXX0=
