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
"use strict";
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
var MyLists_1 = require("./MyLists");
var Now_1 = require("./Now");
var Hello = (function () {
    function Hello() {
    }
    Hello.prototype.run = function () {
        console.log("hello world 10");
        new Now_1.Now().print();
        console.log(new MyLists_1.MyLists().getShoppingList());
    };
    return Hello;
}());
exports.Hello = Hello;

},{"./MyLists":29,"./Now":30}],29:[function(require,module,exports){
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
var Hello_1 = require("../src/Hello");
var MyLists_1 = require("../src/MyLists");
/* tslint:disable */
// for now this is js-like code, so disable tslint
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvYXNwcm9taXNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL2Jhc2U2NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9ldmVudGVtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvZmxvYXQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvaW5xdWlyZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9wb29sL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL3V0ZjgvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbXZkb20vc3JjL2RvbS5qcyIsIm5vZGVfbW9kdWxlcy9tdmRvbS9zcmMvZHguanMiLCJub2RlX21vZHVsZXMvbXZkb20vc3JjL2V2ZW50LmpzIiwibm9kZV9tb2R1bGVzL212ZG9tL3NyYy9odWIuanMiLCJub2RlX21vZHVsZXMvbXZkb20vdHMvdWlkZXBzL212ZG9tL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL212ZG9tL3NyYy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9tdmRvbS9zcmMvdmlldy1ldmVudC5qcyIsIm5vZGVfbW9kdWxlcy9tdmRvbS9zcmMvdmlldy1odWIuanMiLCJub2RlX21vZHVsZXMvbXZkb20vc3JjL3ZpZXcuanMiLCJub2RlX21vZHVsZXMvdHMvc3JjZGVwcy9wcm90b2J1ZmpzL21pbmltYWwuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvaW5kZXgtbWluaW1hbC5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9yZWFkZXIuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvcmVhZGVyX2J1ZmZlci5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9yb290cy5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9ycGMuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvcnBjL3NlcnZpY2UuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvdXRpbC9sb25nYml0cy5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy91dGlsL21pbmltYWwuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvd3JpdGVyLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3dyaXRlcl9idWZmZXIuanMiLCIuLi90cy9zcmMvSGVsbG8udHMiLCIuLi90cy9zcmMvTXlMaXN0cy50cyIsIi4uL3RzL3NyYy9Ob3cudHMiLCIuLi90cy9zcmNkZXBzL3Byb3RvLWdlbi10cy9hbGxwcm90by5qcyIsIi4uL3RzL3VpL0luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM1FBLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNoQyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDbEMsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlCLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM1QixJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRWxDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNCLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUV6QixNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2hCLE9BQU8sRUFBRSxPQUFPO0lBRWhCLFlBQVk7SUFDWixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7SUFDZixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7SUFDdkIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO0lBQ3JCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtJQUNuQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7SUFFakIsWUFBWTtJQUNaLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRTtJQUNaLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRztJQUNkLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztJQUV0QixzQkFBc0I7SUFDdEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO0lBQ2hCLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRztJQUNaLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTztJQUNwQixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7SUFDZCxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7SUFFZCxjQUFjO0lBQ2QsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNO0lBQ2xCLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtJQUVkLGdCQUFnQjtJQUNoQixJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUk7SUFDYixJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUk7SUFDYixNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU07SUFDakIsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNO0lBRWpCLE1BQU07SUFDTixHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUc7SUFFWixRQUFRO0lBQ1IsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHO0lBQ2QsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO0NBQ3RCLENBQUM7QUFFRix5Q0FBeUM7QUFDekMsb0lBQW9JO0FBQ3BJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBLENBQUM7SUFDWCxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7QUFDL0IsQ0FBQzs7O0FDdEREO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVFBLCtCQUErQjtBQUUvQixZQUFZLENBQUM7QUFDYixNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOzs7QUNIaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDclpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hGQSxxQ0FBbUM7QUFDbkMsNkJBQTJCO0FBQzNCO0lBQUE7SUFPQSxDQUFDO0lBTlEsbUJBQUcsR0FBVjtRQUNFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtRQUM3QixJQUFJLFNBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBRWpCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxpQkFBTyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQTtJQUM5QyxDQUFDO0lBQ0gsWUFBQztBQUFELENBUEEsQUFPQyxJQUFBO0FBUFksc0JBQUs7Ozs7O0FDSGxCLDZEQUF1RDtBQUV2RDtJQUFBO0lBT0EsQ0FBQztJQU5RLGlDQUFlLEdBQXRCO1FBQ0UsSUFBTSxZQUFZLEdBQUcsZUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFDLENBQUMsQ0FBQTtRQUN6RCxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDLENBQUE7UUFDM0QsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzdELE1BQU0sQ0FBQyxZQUFZLENBQUE7SUFDckIsQ0FBQztJQUNILGNBQUM7QUFBRCxDQVBBLEFBT0MsSUFBQTtBQVBZLDBCQUFPOzs7OztBQ0ZwQjtJQUFBO0lBSUEsQ0FBQztJQUhRLG1CQUFLLEdBQVo7UUFDRSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtJQUM3QyxDQUFDO0lBQ0gsVUFBQztBQUFELENBSkEsQUFJQyxJQUFBO0FBSlksa0JBQUc7OztBQ0FoQiwwRkFBMEY7QUFDMUYsWUFBWSxDQUFDO0FBRWIsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFFcEQsaUJBQWlCO0FBQ2pCLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFFM0IsMEJBQTBCO0FBQzFCLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsa0NBQWtDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsa0NBQWtDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUU5SCxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUM7SUFFVjs7OztPQUlHO0lBQ0gsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBRWQsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDO1FBRVQ7Ozs7O1dBS0c7UUFFSDs7Ozs7O1dBTUc7UUFDSCxjQUFjLFVBQVU7WUFDcEIsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUNYLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQ2hFLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7d0JBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRXpCOzs7Ozs7O1dBT0c7UUFDSCxJQUFJLENBQUMsTUFBTSxHQUFHLGdCQUFnQixVQUFVO1lBQ3BDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUM7UUFFRjs7Ozs7OztXQU9HO1FBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBZ0IsT0FBTztZQUNqQyxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLElBQUksQ0FBQztnQkFDaEQsTUFBTSxDQUFDLGlCQUFpQixDQUFDO1lBQzdCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzlCLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQztZQUN2QyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUMsQ0FBQztRQUVGOzs7Ozs7O1dBT0c7UUFDSCxJQUFJLENBQUMsVUFBVSxHQUFHLG9CQUFvQixNQUFNO1lBQ3hDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sWUFBWSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDbEMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNsQixJQUFJLE9BQU8sR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDcEMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQ25CLENBQUMsQ0FBQztRQUVGOzs7Ozs7OztXQVFHO1FBQ0gsSUFBSSxDQUFDLFFBQVEsR0FBRyxrQkFBa0IsT0FBTyxFQUFFLE9BQU87WUFDOUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBQ1QsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNqQixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDaEIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztnQkFDakIsTUFBTSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7WUFDckIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDbEIsQ0FBQyxDQUFDO1FBRUY7Ozs7OztXQU1HO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUc7WUFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pFLENBQUMsQ0FBQztRQUVGLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUVMLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQztRQUVUOzs7Ozs7V0FNRztRQUVIOzs7Ozs7V0FNRztRQUNILGNBQWMsVUFBVTtZQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNoQixFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQ1gsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztvQkFDaEUsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQzt3QkFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFFekI7Ozs7O1dBS0c7UUFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBRXhDOzs7Ozs7O1dBT0c7UUFDSCxJQUFJLENBQUMsTUFBTSxHQUFHLGdCQUFnQixVQUFVO1lBQ3BDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUM7UUFFRjs7Ozs7OztXQU9HO1FBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBZ0IsT0FBTztZQUNqQyxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLElBQUksQ0FBQztnQkFDaEQsTUFBTSxDQUFDLGlCQUFpQixDQUFDO1lBQzdCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzlCLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQztZQUN2QyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDOUIsTUFBTSxDQUFDLHVCQUF1QixDQUFDO2dCQUNuQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQzVDLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3JELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQzt3QkFDTixNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztnQkFDaEMsQ0FBQztZQUNMLENBQUM7WUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUMsQ0FBQztRQUVGOzs7Ozs7O1dBT0c7UUFDSCxJQUFJLENBQUMsVUFBVSxHQUFHLG9CQUFvQixNQUFNO1lBQ3hDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sWUFBWSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDbEMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNsQixJQUFJLE9BQU8sR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDcEMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDZixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM3QixNQUFNLFNBQVMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO2dCQUN4RCxPQUFPLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDbkIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUMzQyxFQUFFLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxDQUFDO3dCQUNwQyxNQUFNLFNBQVMsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO29CQUN6RCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLENBQUM7WUFDTCxDQUFDO1lBQ0QsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUNuQixDQUFDLENBQUM7UUFFRjs7Ozs7Ozs7V0FRRztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsa0JBQWtCLE9BQU8sRUFBRSxPQUFPO1lBQzlDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUNULE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDakIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDdEIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztnQkFDakIsTUFBTSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7WUFDckIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQy9CLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQ3pDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUUsQ0FBQztZQUNELE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDbEIsQ0FBQyxDQUFDO1FBRUY7Ozs7OztXQU1HO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUc7WUFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pFLENBQUMsQ0FBQztRQUVGLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUVMLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDaEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUVMLE1BQU0sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDOzs7OztBQ3pSdkIsc0NBQW9DO0FBQ3BDLDBDQUF3QztBQUl4QyxvQkFBb0I7QUFDcEIsa0RBQWtEO0FBRWxELE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUE7QUFFekIsNERBQTREO0FBQzVELElBQUksYUFBSyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7QUFjakIsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUE7QUFFbEMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFO0lBQzVDLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUUsSUFBSSxpQkFBTyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQTtBQUNsRixDQUFDLENBQUMsQ0FBQTtBQUVGLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFDO0lBQ3pCLE1BQU0sRUFBRTtRQUNMLE1BQU0sQ0FBQyxnSEFFUSxDQUFBO0lBQ2xCLENBQUM7SUFFRCxJQUFJLEVBQUUsVUFBUyxZQUF1QjtRQUNuQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUE7UUFDZixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDdEMsTUFBTSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7UUFFckIsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMzQyxPQUFPLENBQUMsV0FBVyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUE7UUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUUzQixJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3JDLEdBQUcsQ0FBQyxDQUFpQixVQUFrQixFQUFsQixLQUFBLFlBQVksQ0FBQyxLQUFLLEVBQWxCLGNBQWtCLEVBQWxCLElBQWtCO1lBQWxDLElBQUksUUFBUSxTQUFBO1lBQ2YsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUNyQyxFQUFFLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFBO1lBQ3BDLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUE7U0FDbkI7UUFFRCxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ3hCLENBQUM7Q0FDRixDQUFDLENBQUE7QUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IGFzUHJvbWlzZTtcclxuXHJcbi8qKlxyXG4gKiBDYWxsYmFjayBhcyB1c2VkIGJ5IHtAbGluayB1dGlsLmFzUHJvbWlzZX0uXHJcbiAqIEB0eXBlZGVmIGFzUHJvbWlzZUNhbGxiYWNrXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtFcnJvcnxudWxsfSBlcnJvciBFcnJvciwgaWYgYW55XHJcbiAqIEBwYXJhbSB7Li4uKn0gcGFyYW1zIEFkZGl0aW9uYWwgYXJndW1lbnRzXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBwcm9taXNlIGZyb20gYSBub2RlLXN0eWxlIGNhbGxiYWNrIGZ1bmN0aW9uLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAcGFyYW0ge2FzUHJvbWlzZUNhbGxiYWNrfSBmbiBGdW5jdGlvbiB0byBjYWxsXHJcbiAqIEBwYXJhbSB7Kn0gY3R4IEZ1bmN0aW9uIGNvbnRleHRcclxuICogQHBhcmFtIHsuLi4qfSBwYXJhbXMgRnVuY3Rpb24gYXJndW1lbnRzXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPCo+fSBQcm9taXNpZmllZCBmdW5jdGlvblxyXG4gKi9cclxuZnVuY3Rpb24gYXNQcm9taXNlKGZuLCBjdHgvKiwgdmFyYXJncyAqLykge1xyXG4gICAgdmFyIHBhcmFtcyAgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpLFxyXG4gICAgICAgIG9mZnNldCAgPSAwLFxyXG4gICAgICAgIGluZGV4ICAgPSAyLFxyXG4gICAgICAgIHBlbmRpbmcgPSB0cnVlO1xyXG4gICAgd2hpbGUgKGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aClcclxuICAgICAgICBwYXJhbXNbb2Zmc2V0KytdID0gYXJndW1lbnRzW2luZGV4KytdO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIGV4ZWN1dG9yKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIHBhcmFtc1tvZmZzZXRdID0gZnVuY3Rpb24gY2FsbGJhY2soZXJyLyosIHZhcmFyZ3MgKi8pIHtcclxuICAgICAgICAgICAgaWYgKHBlbmRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHBlbmRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAob2Zmc2V0IDwgcGFyYW1zLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zW29mZnNldCsrXSA9IGFyZ3VtZW50c1tvZmZzZXRdO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUuYXBwbHkobnVsbCwgcGFyYW1zKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgZm4uYXBwbHkoY3R4IHx8IG51bGwsIHBhcmFtcyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChwZW5kaW5nKSB7XHJcbiAgICAgICAgICAgICAgICBwZW5kaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoqXHJcbiAqIEEgbWluaW1hbCBiYXNlNjQgaW1wbGVtZW50YXRpb24gZm9yIG51bWJlciBhcnJheXMuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBuYW1lc3BhY2VcclxuICovXHJcbnZhciBiYXNlNjQgPSBleHBvcnRzO1xyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIGJ5dGUgbGVuZ3RoIG9mIGEgYmFzZTY0IGVuY29kZWQgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIEJhc2U2NCBlbmNvZGVkIHN0cmluZ1xyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBCeXRlIGxlbmd0aFxyXG4gKi9cclxuYmFzZTY0Lmxlbmd0aCA9IGZ1bmN0aW9uIGxlbmd0aChzdHJpbmcpIHtcclxuICAgIHZhciBwID0gc3RyaW5nLmxlbmd0aDtcclxuICAgIGlmICghcClcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIHZhciBuID0gMDtcclxuICAgIHdoaWxlICgtLXAgJSA0ID4gMSAmJiBzdHJpbmcuY2hhckF0KHApID09PSBcIj1cIilcclxuICAgICAgICArK247XHJcbiAgICByZXR1cm4gTWF0aC5jZWlsKHN0cmluZy5sZW5ndGggKiAzKSAvIDQgLSBuO1xyXG59O1xyXG5cclxuLy8gQmFzZTY0IGVuY29kaW5nIHRhYmxlXHJcbnZhciBiNjQgPSBuZXcgQXJyYXkoNjQpO1xyXG5cclxuLy8gQmFzZTY0IGRlY29kaW5nIHRhYmxlXHJcbnZhciBzNjQgPSBuZXcgQXJyYXkoMTIzKTtcclxuXHJcbi8vIDY1Li45MCwgOTcuLjEyMiwgNDguLjU3LCA0MywgNDdcclxuZm9yICh2YXIgaSA9IDA7IGkgPCA2NDspXHJcbiAgICBzNjRbYjY0W2ldID0gaSA8IDI2ID8gaSArIDY1IDogaSA8IDUyID8gaSArIDcxIDogaSA8IDYyID8gaSAtIDQgOiBpIC0gNTkgfCA0M10gPSBpKys7XHJcblxyXG4vKipcclxuICogRW5jb2RlcyBhIGJ1ZmZlciB0byBhIGJhc2U2NCBlbmNvZGVkIHN0cmluZy5cclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgU291cmNlIGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgU291cmNlIHN0YXJ0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQgU291cmNlIGVuZFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBCYXNlNjQgZW5jb2RlZCBzdHJpbmdcclxuICovXHJcbmJhc2U2NC5lbmNvZGUgPSBmdW5jdGlvbiBlbmNvZGUoYnVmZmVyLCBzdGFydCwgZW5kKSB7XHJcbiAgICB2YXIgcGFydHMgPSBudWxsLFxyXG4gICAgICAgIGNodW5rID0gW107XHJcbiAgICB2YXIgaSA9IDAsIC8vIG91dHB1dCBpbmRleFxyXG4gICAgICAgIGogPSAwLCAvLyBnb3RvIGluZGV4XHJcbiAgICAgICAgdDsgICAgIC8vIHRlbXBvcmFyeVxyXG4gICAgd2hpbGUgKHN0YXJ0IDwgZW5kKSB7XHJcbiAgICAgICAgdmFyIGIgPSBidWZmZXJbc3RhcnQrK107XHJcbiAgICAgICAgc3dpdGNoIChqKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICAgIGNodW5rW2krK10gPSBiNjRbYiA+PiAyXTtcclxuICAgICAgICAgICAgICAgIHQgPSAoYiAmIDMpIDw8IDQ7XHJcbiAgICAgICAgICAgICAgICBqID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICAgICAgICBjaHVua1tpKytdID0gYjY0W3QgfCBiID4+IDRdO1xyXG4gICAgICAgICAgICAgICAgdCA9IChiICYgMTUpIDw8IDI7XHJcbiAgICAgICAgICAgICAgICBqID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgICAgICBjaHVua1tpKytdID0gYjY0W3QgfCBiID4+IDZdO1xyXG4gICAgICAgICAgICAgICAgY2h1bmtbaSsrXSA9IGI2NFtiICYgNjNdO1xyXG4gICAgICAgICAgICAgICAgaiA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGkgPiA4MTkxKSB7XHJcbiAgICAgICAgICAgIChwYXJ0cyB8fCAocGFydHMgPSBbXSkpLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rKSk7XHJcbiAgICAgICAgICAgIGkgPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChqKSB7XHJcbiAgICAgICAgY2h1bmtbaSsrXSA9IGI2NFt0XTtcclxuICAgICAgICBjaHVua1tpKytdID0gNjE7XHJcbiAgICAgICAgaWYgKGogPT09IDEpXHJcbiAgICAgICAgICAgIGNodW5rW2krK10gPSA2MTtcclxuICAgIH1cclxuICAgIGlmIChwYXJ0cykge1xyXG4gICAgICAgIGlmIChpKVxyXG4gICAgICAgICAgICBwYXJ0cy5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjaHVuay5zbGljZSgwLCBpKSkpO1xyXG4gICAgICAgIHJldHVybiBwYXJ0cy5qb2luKFwiXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjaHVuay5zbGljZSgwLCBpKSk7XHJcbn07XHJcblxyXG52YXIgaW52YWxpZEVuY29kaW5nID0gXCJpbnZhbGlkIGVuY29kaW5nXCI7XHJcblxyXG4vKipcclxuICogRGVjb2RlcyBhIGJhc2U2NCBlbmNvZGVkIHN0cmluZyB0byBhIGJ1ZmZlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBTb3VyY2Ugc3RyaW5nXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmZmVyIERlc3RpbmF0aW9uIGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IERlc3RpbmF0aW9uIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBOdW1iZXIgb2YgYnl0ZXMgd3JpdHRlblxyXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgZW5jb2RpbmcgaXMgaW52YWxpZFxyXG4gKi9cclxuYmFzZTY0LmRlY29kZSA9IGZ1bmN0aW9uIGRlY29kZShzdHJpbmcsIGJ1ZmZlciwgb2Zmc2V0KSB7XHJcbiAgICB2YXIgc3RhcnQgPSBvZmZzZXQ7XHJcbiAgICB2YXIgaiA9IDAsIC8vIGdvdG8gaW5kZXhcclxuICAgICAgICB0OyAgICAgLy8gdGVtcG9yYXJ5XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7KSB7XHJcbiAgICAgICAgdmFyIGMgPSBzdHJpbmcuY2hhckNvZGVBdChpKyspO1xyXG4gICAgICAgIGlmIChjID09PSA2MSAmJiBqID4gMSlcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgaWYgKChjID0gczY0W2NdKSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihpbnZhbGlkRW5jb2RpbmcpO1xyXG4gICAgICAgIHN3aXRjaCAoaikge1xyXG4gICAgICAgICAgICBjYXNlIDA6XHJcbiAgICAgICAgICAgICAgICB0ID0gYztcclxuICAgICAgICAgICAgICAgIGogPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSB0IDw8IDIgfCAoYyAmIDQ4KSA+PiA0O1xyXG4gICAgICAgICAgICAgICAgdCA9IGM7XHJcbiAgICAgICAgICAgICAgICBqID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gKHQgJiAxNSkgPDwgNCB8IChjICYgNjApID4+IDI7XHJcbiAgICAgICAgICAgICAgICB0ID0gYztcclxuICAgICAgICAgICAgICAgIGogPSAzO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSAodCAmIDMpIDw8IDYgfCBjO1xyXG4gICAgICAgICAgICAgICAgaiA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoaiA9PT0gMSlcclxuICAgICAgICB0aHJvdyBFcnJvcihpbnZhbGlkRW5jb2RpbmcpO1xyXG4gICAgcmV0dXJuIG9mZnNldCAtIHN0YXJ0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGlmIHRoZSBzcGVjaWZpZWQgc3RyaW5nIGFwcGVhcnMgdG8gYmUgYmFzZTY0IGVuY29kZWQuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgU3RyaW5nIHRvIHRlc3RcclxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiBwcm9iYWJseSBiYXNlNjQgZW5jb2RlZCwgb3RoZXJ3aXNlIGZhbHNlXHJcbiAqL1xyXG5iYXNlNjQudGVzdCA9IGZ1bmN0aW9uIHRlc3Qoc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gL14oPzpbQS1aYS16MC05Ky9dezR9KSooPzpbQS1aYS16MC05Ky9dezJ9PT18W0EtWmEtejAtOSsvXXszfT0pPyQvLnRlc3Qoc3RyaW5nKTtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgZXZlbnQgZW1pdHRlciBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBBIG1pbmltYWwgZXZlbnQgZW1pdHRlci5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlcmVkIGxpc3RlbmVycy5cclxuICAgICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywqPn1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xyXG59XHJcblxyXG4vKipcclxuICogUmVnaXN0ZXJzIGFuIGV2ZW50IGxpc3RlbmVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZ0IEV2ZW50IG5hbWVcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gZm4gTGlzdGVuZXJcclxuICogQHBhcmFtIHsqfSBbY3R4XSBMaXN0ZW5lciBjb250ZXh0XHJcbiAqIEByZXR1cm5zIHt1dGlsLkV2ZW50RW1pdHRlcn0gYHRoaXNgXHJcbiAqL1xyXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZ0LCBmbiwgY3R4KSB7XHJcbiAgICAodGhpcy5fbGlzdGVuZXJzW2V2dF0gfHwgKHRoaXMuX2xpc3RlbmVyc1tldnRdID0gW10pKS5wdXNoKHtcclxuICAgICAgICBmbiAgOiBmbixcclxuICAgICAgICBjdHggOiBjdHggfHwgdGhpc1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFuIGV2ZW50IGxpc3RlbmVyIG9yIGFueSBtYXRjaGluZyBsaXN0ZW5lcnMgaWYgYXJndW1lbnRzIGFyZSBvbWl0dGVkLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2V2dF0gRXZlbnQgbmFtZS4gUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGlmIG9taXR0ZWQuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtmbl0gTGlzdGVuZXIgdG8gcmVtb3ZlLiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgb2YgYGV2dGAgaWYgb21pdHRlZC5cclxuICogQHJldHVybnMge3V0aWwuRXZlbnRFbWl0dGVyfSBgdGhpc2BcclxuICovXHJcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gb2ZmKGV2dCwgZm4pIHtcclxuICAgIGlmIChldnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICB0aGlzLl9saXN0ZW5lcnMgPSB7fTtcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGlmIChmbiA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5lcnNbZXZ0XSA9IFtdO1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW2V2dF07XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDspXHJcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldLmZuID09PSBmbilcclxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICsraTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFbWl0cyBhbiBldmVudCBieSBjYWxsaW5nIGl0cyBsaXN0ZW5lcnMgd2l0aCB0aGUgc3BlY2lmaWVkIGFyZ3VtZW50cy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGV2dCBFdmVudCBuYW1lXHJcbiAqIEBwYXJhbSB7Li4uKn0gYXJncyBBcmd1bWVudHNcclxuICogQHJldHVybnMge3V0aWwuRXZlbnRFbWl0dGVyfSBgdGhpc2BcclxuICovXHJcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZ0KSB7XHJcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW2V2dF07XHJcbiAgICBpZiAobGlzdGVuZXJzKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbXSxcclxuICAgICAgICAgICAgaSA9IDE7XHJcbiAgICAgICAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOylcclxuICAgICAgICAgICAgYXJncy5wdXNoKGFyZ3VtZW50c1tpKytdKTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDspXHJcbiAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaSsrXS5jdHgsIGFyZ3MpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KGZhY3RvcnkpO1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIC8gd3JpdGVzIGZsb2F0cyAvIGRvdWJsZXMgZnJvbSAvIHRvIGJ1ZmZlcnMuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXRcclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSAzMiBiaXQgZmxvYXQgdG8gYSBidWZmZXIgdXNpbmcgbGl0dGxlIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LndyaXRlRmxvYXRMRVxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBUYXJnZXQgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGFyZ2V0IGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgMzIgYml0IGZsb2F0IHRvIGEgYnVmZmVyIHVzaW5nIGJpZyBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC53cml0ZUZsb2F0QkVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgVGFyZ2V0IGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFRhcmdldCBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgMzIgYml0IGZsb2F0IGZyb20gYSBidWZmZXIgdXNpbmcgbGl0dGxlIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LnJlYWRGbG9hdExFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBTb3VyY2UgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgU291cmNlIGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIDMyIGJpdCBmbG9hdCBmcm9tIGEgYnVmZmVyIHVzaW5nIGJpZyBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC5yZWFkRmxvYXRCRVxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgU291cmNlIGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFNvdXJjZSBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgNjQgYml0IGRvdWJsZSB0byBhIGJ1ZmZlciB1c2luZyBsaXR0bGUgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQud3JpdGVEb3VibGVMRVxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBUYXJnZXQgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGFyZ2V0IGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgNjQgYml0IGRvdWJsZSB0byBhIGJ1ZmZlciB1c2luZyBiaWcgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQud3JpdGVEb3VibGVCRVxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZiBUYXJnZXQgYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGFyZ2V0IGJ1ZmZlciBvZmZzZXRcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSA2NCBiaXQgZG91YmxlIGZyb20gYSBidWZmZXIgdXNpbmcgbGl0dGxlIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LnJlYWREb3VibGVMRVxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgU291cmNlIGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFNvdXJjZSBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSA2NCBiaXQgZG91YmxlIGZyb20gYSBidWZmZXIgdXNpbmcgYmlnIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LnJlYWREb3VibGVCRVxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgU291cmNlIGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFNvdXJjZSBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vLyBGYWN0b3J5IGZ1bmN0aW9uIGZvciB0aGUgcHVycG9zZSBvZiBub2RlLWJhc2VkIHRlc3RpbmcgaW4gbW9kaWZpZWQgZ2xvYmFsIGVudmlyb25tZW50c1xyXG5mdW5jdGlvbiBmYWN0b3J5KGV4cG9ydHMpIHtcclxuXHJcbiAgICAvLyBmbG9hdDogdHlwZWQgYXJyYXlcclxuICAgIGlmICh0eXBlb2YgRmxvYXQzMkFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBmMzIgPSBuZXcgRmxvYXQzMkFycmF5KFsgLTAgXSksXHJcbiAgICAgICAgICAgIGY4YiA9IG5ldyBVaW50OEFycmF5KGYzMi5idWZmZXIpLFxyXG4gICAgICAgICAgICBsZSAgPSBmOGJbM10gPT09IDEyODtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVGbG9hdF9mMzJfY3B5KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjMyWzBdID0gdmFsO1xyXG4gICAgICAgICAgICBidWZbcG9zICAgIF0gPSBmOGJbMF07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAxXSA9IGY4YlsxXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDJdID0gZjhiWzJdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgM10gPSBmOGJbM107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZUZsb2F0X2YzMl9yZXYodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmMzJbMF0gPSB2YWw7XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgICAgXSA9IGY4YlszXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDFdID0gZjhiWzJdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMl0gPSBmOGJbMV07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAzXSA9IGY4YlswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy53cml0ZUZsb2F0TEUgPSBsZSA/IHdyaXRlRmxvYXRfZjMyX2NweSA6IHdyaXRlRmxvYXRfZjMyX3JldjtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMud3JpdGVGbG9hdEJFID0gbGUgPyB3cml0ZUZsb2F0X2YzMl9yZXYgOiB3cml0ZUZsb2F0X2YzMl9jcHk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWRGbG9hdF9mMzJfY3B5KGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGY4YlswXSA9IGJ1Zltwb3MgICAgXTtcclxuICAgICAgICAgICAgZjhiWzFdID0gYnVmW3BvcyArIDFdO1xyXG4gICAgICAgICAgICBmOGJbMl0gPSBidWZbcG9zICsgMl07XHJcbiAgICAgICAgICAgIGY4YlszXSA9IGJ1Zltwb3MgKyAzXTtcclxuICAgICAgICAgICAgcmV0dXJuIGYzMlswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWRGbG9hdF9mMzJfcmV2KGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGY4YlszXSA9IGJ1Zltwb3MgICAgXTtcclxuICAgICAgICAgICAgZjhiWzJdID0gYnVmW3BvcyArIDFdO1xyXG4gICAgICAgICAgICBmOGJbMV0gPSBidWZbcG9zICsgMl07XHJcbiAgICAgICAgICAgIGY4YlswXSA9IGJ1Zltwb3MgKyAzXTtcclxuICAgICAgICAgICAgcmV0dXJuIGYzMlswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRmxvYXRMRSA9IGxlID8gcmVhZEZsb2F0X2YzMl9jcHkgOiByZWFkRmxvYXRfZjMyX3JldjtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMucmVhZEZsb2F0QkUgPSBsZSA/IHJlYWRGbG9hdF9mMzJfcmV2IDogcmVhZEZsb2F0X2YzMl9jcHk7XHJcblxyXG4gICAgLy8gZmxvYXQ6IGllZWU3NTRcclxuICAgIH0pKCk7IGVsc2UgKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZUZsb2F0X2llZWU3NTQod3JpdGVVaW50LCB2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWduID0gdmFsIDwgMCA/IDEgOiAwO1xyXG4gICAgICAgICAgICBpZiAoc2lnbilcclxuICAgICAgICAgICAgICAgIHZhbCA9IC12YWw7XHJcbiAgICAgICAgICAgIGlmICh2YWwgPT09IDApXHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoMSAvIHZhbCA+IDAgPyAvKiBwb3NpdGl2ZSAqLyAwIDogLyogbmVnYXRpdmUgMCAqLyAyMTQ3NDgzNjQ4LCBidWYsIHBvcyk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGlzTmFOKHZhbCkpXHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoMjE0MzI4OTM0NCwgYnVmLCBwb3MpO1xyXG4gICAgICAgICAgICBlbHNlIGlmICh2YWwgPiAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KSAvLyArLUluZmluaXR5XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoKHNpZ24gPDwgMzEgfCAyMTM5MDk1MDQwKSA+Pj4gMCwgYnVmLCBwb3MpO1xyXG4gICAgICAgICAgICBlbHNlIGlmICh2YWwgPCAxLjE3NTQ5NDM1MDgyMjI4NzVlLTM4KSAvLyBkZW5vcm1hbFxyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgTWF0aC5yb3VuZCh2YWwgLyAxLjQwMTI5ODQ2NDMyNDgxN2UtNDUpKSA+Pj4gMCwgYnVmLCBwb3MpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBleHBvbmVudCA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsKSAvIE1hdGguTE4yKSxcclxuICAgICAgICAgICAgICAgICAgICBtYW50aXNzYSA9IE1hdGgucm91bmQodmFsICogTWF0aC5wb3coMiwgLWV4cG9uZW50KSAqIDgzODg2MDgpICYgODM4ODYwNztcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgoc2lnbiA8PCAzMSB8IGV4cG9uZW50ICsgMTI3IDw8IDIzIHwgbWFudGlzc2EpID4+PiAwLCBidWYsIHBvcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4cG9ydHMud3JpdGVGbG9hdExFID0gd3JpdGVGbG9hdF9pZWVlNzU0LmJpbmQobnVsbCwgd3JpdGVVaW50TEUpO1xyXG4gICAgICAgIGV4cG9ydHMud3JpdGVGbG9hdEJFID0gd3JpdGVGbG9hdF9pZWVlNzU0LmJpbmQobnVsbCwgd3JpdGVVaW50QkUpO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkRmxvYXRfaWVlZTc1NChyZWFkVWludCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgdmFyIHVpbnQgPSByZWFkVWludChidWYsIHBvcyksXHJcbiAgICAgICAgICAgICAgICBzaWduID0gKHVpbnQgPj4gMzEpICogMiArIDEsXHJcbiAgICAgICAgICAgICAgICBleHBvbmVudCA9IHVpbnQgPj4+IDIzICYgMjU1LFxyXG4gICAgICAgICAgICAgICAgbWFudGlzc2EgPSB1aW50ICYgODM4ODYwNztcclxuICAgICAgICAgICAgcmV0dXJuIGV4cG9uZW50ID09PSAyNTVcclxuICAgICAgICAgICAgICAgID8gbWFudGlzc2FcclxuICAgICAgICAgICAgICAgID8gTmFOXHJcbiAgICAgICAgICAgICAgICA6IHNpZ24gKiBJbmZpbml0eVxyXG4gICAgICAgICAgICAgICAgOiBleHBvbmVudCA9PT0gMCAvLyBkZW5vcm1hbFxyXG4gICAgICAgICAgICAgICAgPyBzaWduICogMS40MDEyOTg0NjQzMjQ4MTdlLTQ1ICogbWFudGlzc2FcclxuICAgICAgICAgICAgICAgIDogc2lnbiAqIE1hdGgucG93KDIsIGV4cG9uZW50IC0gMTUwKSAqIChtYW50aXNzYSArIDgzODg2MDgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRmxvYXRMRSA9IHJlYWRGbG9hdF9pZWVlNzU0LmJpbmQobnVsbCwgcmVhZFVpbnRMRSk7XHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRmxvYXRCRSA9IHJlYWRGbG9hdF9pZWVlNzU0LmJpbmQobnVsbCwgcmVhZFVpbnRCRSk7XHJcblxyXG4gICAgfSkoKTtcclxuXHJcbiAgICAvLyBkb3VibGU6IHR5cGVkIGFycmF5XHJcbiAgICBpZiAodHlwZW9mIEZsb2F0NjRBcnJheSAhPT0gXCJ1bmRlZmluZWRcIikgKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgZjY0ID0gbmV3IEZsb2F0NjRBcnJheShbLTBdKSxcclxuICAgICAgICAgICAgZjhiID0gbmV3IFVpbnQ4QXJyYXkoZjY0LmJ1ZmZlciksXHJcbiAgICAgICAgICAgIGxlICA9IGY4Yls3XSA9PT0gMTI4O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZURvdWJsZV9mNjRfY3B5KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjY0WzBdID0gdmFsO1xyXG4gICAgICAgICAgICBidWZbcG9zICAgIF0gPSBmOGJbMF07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAxXSA9IGY4YlsxXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDJdID0gZjhiWzJdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgM10gPSBmOGJbM107XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA0XSA9IGY4Yls0XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDVdID0gZjhiWzVdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgNl0gPSBmOGJbNl07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA3XSA9IGY4Yls3XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRG91YmxlX2Y2NF9yZXYodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmNjRbMF0gPSB2YWw7XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgICAgXSA9IGY4Yls3XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDFdID0gZjhiWzZdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMl0gPSBmOGJbNV07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAzXSA9IGY4Yls0XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDRdID0gZjhiWzNdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgNV0gPSBmOGJbMl07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA2XSA9IGY4YlsxXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDddID0gZjhiWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLndyaXRlRG91YmxlTEUgPSBsZSA/IHdyaXRlRG91YmxlX2Y2NF9jcHkgOiB3cml0ZURvdWJsZV9mNjRfcmV2O1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy53cml0ZURvdWJsZUJFID0gbGUgPyB3cml0ZURvdWJsZV9mNjRfcmV2IDogd3JpdGVEb3VibGVfZjY0X2NweTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZERvdWJsZV9mNjRfY3B5KGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGY4YlswXSA9IGJ1Zltwb3MgICAgXTtcclxuICAgICAgICAgICAgZjhiWzFdID0gYnVmW3BvcyArIDFdO1xyXG4gICAgICAgICAgICBmOGJbMl0gPSBidWZbcG9zICsgMl07XHJcbiAgICAgICAgICAgIGY4YlszXSA9IGJ1Zltwb3MgKyAzXTtcclxuICAgICAgICAgICAgZjhiWzRdID0gYnVmW3BvcyArIDRdO1xyXG4gICAgICAgICAgICBmOGJbNV0gPSBidWZbcG9zICsgNV07XHJcbiAgICAgICAgICAgIGY4Yls2XSA9IGJ1Zltwb3MgKyA2XTtcclxuICAgICAgICAgICAgZjhiWzddID0gYnVmW3BvcyArIDddO1xyXG4gICAgICAgICAgICByZXR1cm4gZjY0WzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZERvdWJsZV9mNjRfcmV2KGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGY4Yls3XSA9IGJ1Zltwb3MgICAgXTtcclxuICAgICAgICAgICAgZjhiWzZdID0gYnVmW3BvcyArIDFdO1xyXG4gICAgICAgICAgICBmOGJbNV0gPSBidWZbcG9zICsgMl07XHJcbiAgICAgICAgICAgIGY4Yls0XSA9IGJ1Zltwb3MgKyAzXTtcclxuICAgICAgICAgICAgZjhiWzNdID0gYnVmW3BvcyArIDRdO1xyXG4gICAgICAgICAgICBmOGJbMl0gPSBidWZbcG9zICsgNV07XHJcbiAgICAgICAgICAgIGY4YlsxXSA9IGJ1Zltwb3MgKyA2XTtcclxuICAgICAgICAgICAgZjhiWzBdID0gYnVmW3BvcyArIDddO1xyXG4gICAgICAgICAgICByZXR1cm4gZjY0WzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLnJlYWREb3VibGVMRSA9IGxlID8gcmVhZERvdWJsZV9mNjRfY3B5IDogcmVhZERvdWJsZV9mNjRfcmV2O1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRG91YmxlQkUgPSBsZSA/IHJlYWREb3VibGVfZjY0X3JldiA6IHJlYWREb3VibGVfZjY0X2NweTtcclxuXHJcbiAgICAvLyBkb3VibGU6IGllZWU3NTRcclxuICAgIH0pKCk7IGVsc2UgKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZURvdWJsZV9pZWVlNzU0KHdyaXRlVWludCwgb2ZmMCwgb2ZmMSwgdmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICB2YXIgc2lnbiA9IHZhbCA8IDAgPyAxIDogMDtcclxuICAgICAgICAgICAgaWYgKHNpZ24pXHJcbiAgICAgICAgICAgICAgICB2YWwgPSAtdmFsO1xyXG4gICAgICAgICAgICBpZiAodmFsID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoMCwgYnVmLCBwb3MgKyBvZmYwKTtcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgxIC8gdmFsID4gMCA/IC8qIHBvc2l0aXZlICovIDAgOiAvKiBuZWdhdGl2ZSAwICovIDIxNDc0ODM2NDgsIGJ1ZiwgcG9zICsgb2ZmMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOYU4odmFsKSkge1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDAsIGJ1ZiwgcG9zICsgb2ZmMCk7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoMjE0Njk1OTM2MCwgYnVmLCBwb3MgKyBvZmYxKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWwgPiAxLjc5NzY5MzEzNDg2MjMxNTdlKzMwOCkgeyAvLyArLUluZmluaXR5XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoMCwgYnVmLCBwb3MgKyBvZmYwKTtcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgoc2lnbiA8PCAzMSB8IDIxNDY0MzUwNzIpID4+PiAwLCBidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1hbnRpc3NhO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbCA8IDIuMjI1MDczODU4NTA3MjAxNGUtMzA4KSB7IC8vIGRlbm9ybWFsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFudGlzc2EgPSB2YWwgLyA1ZS0zMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVVaW50KG1hbnRpc3NhID4+PiAwLCBidWYsIHBvcyArIG9mZjApO1xyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlVWludCgoc2lnbiA8PCAzMSB8IG1hbnRpc3NhIC8gNDI5NDk2NzI5NikgPj4+IDAsIGJ1ZiwgcG9zICsgb2ZmMSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBleHBvbmVudCA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsKSAvIE1hdGguTE4yKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXhwb25lbnQgPT09IDEwMjQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9uZW50ID0gMTAyMztcclxuICAgICAgICAgICAgICAgICAgICBtYW50aXNzYSA9IHZhbCAqIE1hdGgucG93KDIsIC1leHBvbmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVVaW50KG1hbnRpc3NhICogNDUwMzU5OTYyNzM3MDQ5NiA+Pj4gMCwgYnVmLCBwb3MgKyBvZmYwKTtcclxuICAgICAgICAgICAgICAgICAgICB3cml0ZVVpbnQoKHNpZ24gPDwgMzEgfCBleHBvbmVudCArIDEwMjMgPDwgMjAgfCBtYW50aXNzYSAqIDEwNDg1NzYgJiAxMDQ4NTc1KSA+Pj4gMCwgYnVmLCBwb3MgKyBvZmYxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhwb3J0cy53cml0ZURvdWJsZUxFID0gd3JpdGVEb3VibGVfaWVlZTc1NC5iaW5kKG51bGwsIHdyaXRlVWludExFLCAwLCA0KTtcclxuICAgICAgICBleHBvcnRzLndyaXRlRG91YmxlQkUgPSB3cml0ZURvdWJsZV9pZWVlNzU0LmJpbmQobnVsbCwgd3JpdGVVaW50QkUsIDQsIDApO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkRG91YmxlX2llZWU3NTQocmVhZFVpbnQsIG9mZjAsIG9mZjEsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIHZhciBsbyA9IHJlYWRVaW50KGJ1ZiwgcG9zICsgb2ZmMCksXHJcbiAgICAgICAgICAgICAgICBoaSA9IHJlYWRVaW50KGJ1ZiwgcG9zICsgb2ZmMSk7XHJcbiAgICAgICAgICAgIHZhciBzaWduID0gKGhpID4+IDMxKSAqIDIgKyAxLFxyXG4gICAgICAgICAgICAgICAgZXhwb25lbnQgPSBoaSA+Pj4gMjAgJiAyMDQ3LFxyXG4gICAgICAgICAgICAgICAgbWFudGlzc2EgPSA0Mjk0OTY3Mjk2ICogKGhpICYgMTA0ODU3NSkgKyBsbztcclxuICAgICAgICAgICAgcmV0dXJuIGV4cG9uZW50ID09PSAyMDQ3XHJcbiAgICAgICAgICAgICAgICA/IG1hbnRpc3NhXHJcbiAgICAgICAgICAgICAgICA/IE5hTlxyXG4gICAgICAgICAgICAgICAgOiBzaWduICogSW5maW5pdHlcclxuICAgICAgICAgICAgICAgIDogZXhwb25lbnQgPT09IDAgLy8gZGVub3JtYWxcclxuICAgICAgICAgICAgICAgID8gc2lnbiAqIDVlLTMyNCAqIG1hbnRpc3NhXHJcbiAgICAgICAgICAgICAgICA6IHNpZ24gKiBNYXRoLnBvdygyLCBleHBvbmVudCAtIDEwNzUpICogKG1hbnRpc3NhICsgNDUwMzU5OTYyNzM3MDQ5Nik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHBvcnRzLnJlYWREb3VibGVMRSA9IHJlYWREb3VibGVfaWVlZTc1NC5iaW5kKG51bGwsIHJlYWRVaW50TEUsIDAsIDQpO1xyXG4gICAgICAgIGV4cG9ydHMucmVhZERvdWJsZUJFID0gcmVhZERvdWJsZV9pZWVlNzU0LmJpbmQobnVsbCwgcmVhZFVpbnRCRSwgNCwgMCk7XHJcblxyXG4gICAgfSkoKTtcclxuXHJcbiAgICByZXR1cm4gZXhwb3J0cztcclxufVxyXG5cclxuLy8gdWludCBoZWxwZXJzXHJcblxyXG5mdW5jdGlvbiB3cml0ZVVpbnRMRSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICBidWZbcG9zICAgIF0gPSAgdmFsICAgICAgICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAxXSA9ICB2YWwgPj4+IDggICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDJdID0gIHZhbCA+Pj4gMTYgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgM10gPSAgdmFsID4+PiAyNDtcclxufVxyXG5cclxuZnVuY3Rpb24gd3JpdGVVaW50QkUodmFsLCBidWYsIHBvcykge1xyXG4gICAgYnVmW3BvcyAgICBdID0gIHZhbCA+Pj4gMjQ7XHJcbiAgICBidWZbcG9zICsgMV0gPSAgdmFsID4+PiAxNiAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAyXSA9ICB2YWwgPj4+IDggICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDNdID0gIHZhbCAgICAgICAgJiAyNTU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRVaW50TEUoYnVmLCBwb3MpIHtcclxuICAgIHJldHVybiAoYnVmW3BvcyAgICBdXHJcbiAgICAgICAgICB8IGJ1Zltwb3MgKyAxXSA8PCA4XHJcbiAgICAgICAgICB8IGJ1Zltwb3MgKyAyXSA8PCAxNlxyXG4gICAgICAgICAgfCBidWZbcG9zICsgM10gPDwgMjQpID4+PiAwO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkVWludEJFKGJ1ZiwgcG9zKSB7XHJcbiAgICByZXR1cm4gKGJ1Zltwb3MgICAgXSA8PCAyNFxyXG4gICAgICAgICAgfCBidWZbcG9zICsgMV0gPDwgMTZcclxuICAgICAgICAgIHwgYnVmW3BvcyArIDJdIDw8IDhcclxuICAgICAgICAgIHwgYnVmW3BvcyArIDNdKSA+Pj4gMDtcclxufVxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBpbnF1aXJlO1xyXG5cclxuLyoqXHJcbiAqIFJlcXVpcmVzIGEgbW9kdWxlIG9ubHkgaWYgYXZhaWxhYmxlLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbW9kdWxlTmFtZSBNb2R1bGUgdG8gcmVxdWlyZVxyXG4gKiBAcmV0dXJucyB7P09iamVjdH0gUmVxdWlyZWQgbW9kdWxlIGlmIGF2YWlsYWJsZSBhbmQgbm90IGVtcHR5LCBvdGhlcndpc2UgYG51bGxgXHJcbiAqL1xyXG5mdW5jdGlvbiBpbnF1aXJlKG1vZHVsZU5hbWUpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIG1vZCA9IGV2YWwoXCJxdWlyZVwiLnJlcGxhY2UoL14vLFwicmVcIikpKG1vZHVsZU5hbWUpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV2YWxcclxuICAgICAgICBpZiAobW9kICYmIChtb2QubGVuZ3RoIHx8IE9iamVjdC5rZXlzKG1vZCkubGVuZ3RoKSlcclxuICAgICAgICAgICAgcmV0dXJuIG1vZDtcclxuICAgIH0gY2F0Y2ggKGUpIHt9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZW1wdHlcclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IHBvb2w7XHJcblxyXG4vKipcclxuICogQW4gYWxsb2NhdG9yIGFzIHVzZWQgYnkge0BsaW5rIHV0aWwucG9vbH0uXHJcbiAqIEB0eXBlZGVmIFBvb2xBbGxvY2F0b3JcclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge251bWJlcn0gc2l6ZSBCdWZmZXIgc2l6ZVxyXG4gKiBAcmV0dXJucyB7VWludDhBcnJheX0gQnVmZmVyXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgc2xpY2VyIGFzIHVzZWQgYnkge0BsaW5rIHV0aWwucG9vbH0uXHJcbiAqIEB0eXBlZGVmIFBvb2xTbGljZXJcclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgU3RhcnQgb2Zmc2V0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQgRW5kIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7VWludDhBcnJheX0gQnVmZmVyIHNsaWNlXHJcbiAqIEB0aGlzIHtVaW50OEFycmF5fVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGdlbmVyYWwgcHVycG9zZSBidWZmZXIgcG9vbC5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7UG9vbEFsbG9jYXRvcn0gYWxsb2MgQWxsb2NhdG9yXHJcbiAqIEBwYXJhbSB7UG9vbFNsaWNlcn0gc2xpY2UgU2xpY2VyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbc2l6ZT04MTkyXSBTbGFiIHNpemVcclxuICogQHJldHVybnMge1Bvb2xBbGxvY2F0b3J9IFBvb2xlZCBhbGxvY2F0b3JcclxuICovXHJcbmZ1bmN0aW9uIHBvb2woYWxsb2MsIHNsaWNlLCBzaXplKSB7XHJcbiAgICB2YXIgU0laRSAgID0gc2l6ZSB8fCA4MTkyO1xyXG4gICAgdmFyIE1BWCAgICA9IFNJWkUgPj4+IDE7XHJcbiAgICB2YXIgc2xhYiAgID0gbnVsbDtcclxuICAgIHZhciBvZmZzZXQgPSBTSVpFO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBvb2xfYWxsb2Moc2l6ZSkge1xyXG4gICAgICAgIGlmIChzaXplIDwgMSB8fCBzaXplID4gTUFYKVxyXG4gICAgICAgICAgICByZXR1cm4gYWxsb2Moc2l6ZSk7XHJcbiAgICAgICAgaWYgKG9mZnNldCArIHNpemUgPiBTSVpFKSB7XHJcbiAgICAgICAgICAgIHNsYWIgPSBhbGxvYyhTSVpFKTtcclxuICAgICAgICAgICAgb2Zmc2V0ID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGJ1ZiA9IHNsaWNlLmNhbGwoc2xhYiwgb2Zmc2V0LCBvZmZzZXQgKz0gc2l6ZSk7XHJcbiAgICAgICAgaWYgKG9mZnNldCAmIDcpIC8vIGFsaWduIHRvIDMyIGJpdFxyXG4gICAgICAgICAgICBvZmZzZXQgPSAob2Zmc2V0IHwgNykgKyAxO1xyXG4gICAgICAgIHJldHVybiBidWY7XHJcbiAgICB9O1xyXG59XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoqXHJcbiAqIEEgbWluaW1hbCBVVEY4IGltcGxlbWVudGF0aW9uIGZvciBudW1iZXIgYXJyYXlzLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAbmFtZXNwYWNlXHJcbiAqL1xyXG52YXIgdXRmOCA9IGV4cG9ydHM7XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgVVRGOCBieXRlIGxlbmd0aCBvZiBhIHN0cmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBTdHJpbmdcclxuICogQHJldHVybnMge251bWJlcn0gQnl0ZSBsZW5ndGhcclxuICovXHJcbnV0ZjgubGVuZ3RoID0gZnVuY3Rpb24gdXRmOF9sZW5ndGgoc3RyaW5nKSB7XHJcbiAgICB2YXIgbGVuID0gMCxcclxuICAgICAgICBjID0gMDtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgYyA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xyXG4gICAgICAgIGlmIChjIDwgMTI4KVxyXG4gICAgICAgICAgICBsZW4gKz0gMTtcclxuICAgICAgICBlbHNlIGlmIChjIDwgMjA0OClcclxuICAgICAgICAgICAgbGVuICs9IDI7XHJcbiAgICAgICAgZWxzZSBpZiAoKGMgJiAweEZDMDApID09PSAweEQ4MDAgJiYgKHN0cmluZy5jaGFyQ29kZUF0KGkgKyAxKSAmIDB4RkMwMCkgPT09IDB4REMwMCkge1xyXG4gICAgICAgICAgICArK2k7XHJcbiAgICAgICAgICAgIGxlbiArPSA0O1xyXG4gICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICBsZW4gKz0gMztcclxuICAgIH1cclxuICAgIHJldHVybiBsZW47XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgVVRGOCBieXRlcyBhcyBhIHN0cmluZy5cclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgU291cmNlIGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgU291cmNlIHN0YXJ0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmQgU291cmNlIGVuZFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBTdHJpbmcgcmVhZFxyXG4gKi9cclxudXRmOC5yZWFkID0gZnVuY3Rpb24gdXRmOF9yZWFkKGJ1ZmZlciwgc3RhcnQsIGVuZCkge1xyXG4gICAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0O1xyXG4gICAgaWYgKGxlbiA8IDEpXHJcbiAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICB2YXIgcGFydHMgPSBudWxsLFxyXG4gICAgICAgIGNodW5rID0gW10sXHJcbiAgICAgICAgaSA9IDAsIC8vIGNoYXIgb2Zmc2V0XHJcbiAgICAgICAgdDsgICAgIC8vIHRlbXBvcmFyeVxyXG4gICAgd2hpbGUgKHN0YXJ0IDwgZW5kKSB7XHJcbiAgICAgICAgdCA9IGJ1ZmZlcltzdGFydCsrXTtcclxuICAgICAgICBpZiAodCA8IDEyOClcclxuICAgICAgICAgICAgY2h1bmtbaSsrXSA9IHQ7XHJcbiAgICAgICAgZWxzZSBpZiAodCA+IDE5MSAmJiB0IDwgMjI0KVxyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gKHQgJiAzMSkgPDwgNiB8IGJ1ZmZlcltzdGFydCsrXSAmIDYzO1xyXG4gICAgICAgIGVsc2UgaWYgKHQgPiAyMzkgJiYgdCA8IDM2NSkge1xyXG4gICAgICAgICAgICB0ID0gKCh0ICYgNykgPDwgMTggfCAoYnVmZmVyW3N0YXJ0KytdICYgNjMpIDw8IDEyIHwgKGJ1ZmZlcltzdGFydCsrXSAmIDYzKSA8PCA2IHwgYnVmZmVyW3N0YXJ0KytdICYgNjMpIC0gMHgxMDAwMDtcclxuICAgICAgICAgICAgY2h1bmtbaSsrXSA9IDB4RDgwMCArICh0ID4+IDEwKTtcclxuICAgICAgICAgICAgY2h1bmtbaSsrXSA9IDB4REMwMCArICh0ICYgMTAyMyk7XHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIGNodW5rW2krK10gPSAodCAmIDE1KSA8PCAxMiB8IChidWZmZXJbc3RhcnQrK10gJiA2MykgPDwgNiB8IGJ1ZmZlcltzdGFydCsrXSAmIDYzO1xyXG4gICAgICAgIGlmIChpID4gODE5MSkge1xyXG4gICAgICAgICAgICAocGFydHMgfHwgKHBhcnRzID0gW10pKS5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjaHVuaykpO1xyXG4gICAgICAgICAgICBpID0gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAocGFydHMpIHtcclxuICAgICAgICBpZiAoaSlcclxuICAgICAgICAgICAgcGFydHMucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY2h1bmsuc2xpY2UoMCwgaSkpKTtcclxuICAgICAgICByZXR1cm4gcGFydHMuam9pbihcIlwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY2h1bmsuc2xpY2UoMCwgaSkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHN0cmluZyBhcyBVVEY4IGJ5dGVzLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFNvdXJjZSBzdHJpbmdcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgRGVzdGluYXRpb24gYnVmZmVyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgRGVzdGluYXRpb24gb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IEJ5dGVzIHdyaXR0ZW5cclxuICovXHJcbnV0Zjgud3JpdGUgPSBmdW5jdGlvbiB1dGY4X3dyaXRlKHN0cmluZywgYnVmZmVyLCBvZmZzZXQpIHtcclxuICAgIHZhciBzdGFydCA9IG9mZnNldCxcclxuICAgICAgICBjMSwgLy8gY2hhcmFjdGVyIDFcclxuICAgICAgICBjMjsgLy8gY2hhcmFjdGVyIDJcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgYzEgPSBzdHJpbmcuY2hhckNvZGVBdChpKTtcclxuICAgICAgICBpZiAoYzEgPCAxMjgpIHtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoYzEgPCAyMDQ4KSB7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSA+PiA2ICAgICAgIHwgMTkyO1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgICAgICAgJiA2MyB8IDEyODtcclxuICAgICAgICB9IGVsc2UgaWYgKChjMSAmIDB4RkMwMCkgPT09IDB4RDgwMCAmJiAoKGMyID0gc3RyaW5nLmNoYXJDb2RlQXQoaSArIDEpKSAmIDB4RkMwMCkgPT09IDB4REMwMCkge1xyXG4gICAgICAgICAgICBjMSA9IDB4MTAwMDAgKyAoKGMxICYgMHgwM0ZGKSA8PCAxMCkgKyAoYzIgJiAweDAzRkYpO1xyXG4gICAgICAgICAgICArK2k7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSA+PiAxOCAgICAgIHwgMjQwO1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgPj4gMTIgJiA2MyB8IDEyODtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDYgICYgNjMgfCAxMjg7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSAgICAgICAmIDYzIHwgMTI4O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSA+PiAxMiAgICAgIHwgMjI0O1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgPj4gNiAgJiA2MyB8IDEyODtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxICAgICAgICYgNjMgfCAxMjg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9mZnNldCAtIHN0YXJ0O1xyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0Zmlyc3Q6IGZpcnN0LCBcblx0YWxsOiBhbGwsIFxuXHRjbG9zZXN0OiBjbG9zZXN0LFxuXHRuZXh0OiBuZXh0LFxuXHRwcmV2OiBwcmV2LCBcblx0YXBwZW5kOiBhcHBlbmQsXG5cdGZyYWc6IGZyYWdcbn07XG5cblxuLy8gZm9yIEVkZ2UsIHN0aWxsIGRvIG5vdCBzdXBwb3J0IC5tYXRjaGVzIDooXG52YXIgdG1wRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xudmFyIG1hdGNoZXNGbiA9IHRtcEVsLm1hdGNoZXMgfHwgdG1wRWwud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IHRtcEVsLm1zTWF0Y2hlc1NlbGVjdG9yO1xubW9kdWxlLmV4cG9ydHMuX21hdGNoZXNGbiA9IG1hdGNoZXNGbjsgLy8gbWFrZSBpdCBhdmFpbGFibGUgZm9yIHRoaXMgbW9kdWxlICh0aGlzIHdpbGwgYmUgaW50ZXJuYWwgb25seSlcblxuLy8gLS0tLS0tLS0tIERPTSBRdWVyeSBTaG9ydGN1dHMgLS0tLS0tLS0tIC8vXG5cbi8vIFNob3J0Y3V0IGZvciAucXVlcnlTZWxlY3RvclxuLy8gcmV0dXJuIHRoZSBmaXJzdCBlbGVtZW50IG1hdGNoaW5nIHRoZSBzZWxlY3RvciBmcm9tIHRoaXMgZWwgKG9yIGRvY3VtZW50IGlmIGVsIGlzIG5vdCBnaXZlbilcbmZ1bmN0aW9uIGZpcnN0KGVsX29yX3NlbGVjdG9yLCBzZWxlY3Rvcil7XG5cdC8vIFdlIGRvIG5vdCBoYXZlIGEgc2VsZWN0b3IgYXQgYWxsLCB0aGVuLCB0aGlzIGNhbGwgaXMgZm9yIGZpcnN0RWxlbWVudENoaWxkXG5cdGlmICghc2VsZWN0b3IgJiYgdHlwZW9mIGVsX29yX3NlbGVjdG9yICE9PSBcInN0cmluZ1wiKXtcblx0XHR2YXIgZWwgPSBlbF9vcl9zZWxlY3Rvcjtcblx0XHQvLyB0cnkgdG8gZ2V0IFxuXHRcdHZhciBmaXJzdEVsZW1lbnRDaGlsZCA9IGVsLmZpcnN0RWxlbWVudENoaWxkO1xuXG5cdFx0Ly8gaWYgZmlyc3RFbGVtZW50Q2hpbGQgaXMgbnVsbC91bmRlZmluZWQsIGJ1dCB3ZSBoYXZlIGEgZmlyc3RDaGlsZCwgaXQgaXMgcGVyaGFwcyBiZWNhdXNlIG5vdCBzdXBwb3J0ZWRcblx0XHRpZiAoIWZpcnN0RWxlbWVudENoaWxkICYmIGVsLmZpcnN0Q2hpbGQpe1xuXG5cdFx0XHQvLyBJZiB0aGUgZmlyc3RDaGlsZCBpcyBvZiB0eXBlIEVsZW1lbnQsIHJldHVybiBpdC4gXG5cdFx0XHRpZiAoZWwuZmlyc3RDaGlsZC5ub2RlVHlwZSA9PT0gMSApe1xuXHRcdFx0XHRyZXR1cm4gZWwuZmlyc3RDaGlsZDtcblx0XHRcdH1cblx0XHRcdC8vIE90aGVyd2lzZSwgdHJ5IHRvIGZpbmQgdGhlIG5leHQgZWxlbWVudCAodXNpbmcgdGhlIG5leHQpXG5cdFx0XHRlbHNle1xuXHRcdFx0XHRyZXR1cm4gbmV4dChlbC5maXJzdENoaWxkKTtcblx0XHRcdH1cdFx0XHRcblx0XHR9XG5cblx0XHRyZXR1cm4gZmlyc3RFbGVtZW50Q2hpbGQ7XG5cdH1cblx0Ly8gb3RoZXJ3aXNlLCB0aGUgY2FsbCB3YXMgZWl0aGVyIChzZWxlY3Rvcikgb3IgKGVsLCBzZWxlY3RvciksIHNvIGZvd2FyZCB0byB0aGUgcXVlcnlTZWxlY3RvclxuXHRlbHNle1xuXHRcdHJldHVybiBfZXhlY1F1ZXJ5U2VsZWN0b3IoZmFsc2UsIGVsX29yX3NlbGVjdG9yLCBzZWxlY3Rvcik7XHRcblx0fVxuXHRcbn1cblxuLy8gU2hvcnRjdXQgZm9yIC5xdWVyeVNlbGVjdG9yQWxsXG4vLyByZXR1cm4gYW4gbm9kZUxpc3Qgb2YgYWxsIG9mIHRoZSBlbGVtZW50cyBlbGVtZW50IG1hdGNoaW5nIHRoZSBzZWxlY3RvciBmcm9tIHRoaXMgZWwgKG9yIGRvY3VtZW50IGlmIGVsIGlzIG5vdCBnaXZlbilcbmZ1bmN0aW9uIGFsbChlbCwgc2VsZWN0b3Ipe1xuXHRyZXR1cm4gX2V4ZWNRdWVyeVNlbGVjdG9yKHRydWUsIGVsLCBzZWxlY3Rvcik7XG59XG5cbi8vIHJldHVybiB0aGUgZmlyc3QgZWxlbWVudCBuZXh0IHRvIHRoZSBlbCBtYXRjaGluZyB0aGUgc2VsZWN0b3Jcbi8vIGlmIG5vIHNlbGVjdG9yLCB3aWxsIHJldHVybiB0aGUgbmV4dCBFbGVtZW50XG4vLyByZXR1cm4gbnVsbCBpZiBub3QgZm91bmQuXG5mdW5jdGlvbiBuZXh0KGVsLCBzZWxlY3Rvcil7XG5cdHJldHVybiBfc2libGluZyh0cnVlLCBlbCwgc2VsZWN0b3IpO1xufVxuXG4vLyBpZiBubyBzZWxlY3Rvciwgd2lsbCByZXR1cm4gdGhlIHByZXZpb3VzIEVsZW1lbnRcbmZ1bmN0aW9uIHByZXYoZWwsIHNlbGVjdG9yKXtcblx0cmV0dXJuIF9zaWJsaW5nKGZhbHNlLCBlbCwgc2VsZWN0b3IpO1xufVxuXG4vLyByZXR1cm4gdGhlIGVsZW1lbnQgY2xvc2VzdCBpbiB0aGUgaGllcmFyY2h5ICh1cCksIGluY2x1ZGluZyB0aGlzIGVsLCBtYXRjaGluZyB0aGlzIHNlbGVjdG9yXG4vLyByZXR1cm4gbnVsbCBpZiBub3QgZm91bmRcbmZ1bmN0aW9uIGNsb3Nlc3QoZWwsIHNlbGVjdG9yKXtcblx0dmFyIHRtcEVsID0gZWw7XG5cdFxuXHQvLyB1c2UgXCIhPVwiIGZvciBudWxsIGFuZCB1bmRlZmluZWRcblx0d2hpbGUgKHRtcEVsICE9IG51bGwgJiYgdG1wRWwgIT09IGRvY3VtZW50KXtcblx0XHRpZiAobWF0Y2hlc0ZuLmNhbGwodG1wRWwsc2VsZWN0b3IpKXtcblx0XHRcdHJldHVybiB0bXBFbDtcblx0XHR9XG5cdFx0dG1wRWwgPSB0bXBFbC5wYXJlbnRFbGVtZW50O1x0XHRcblx0fVxuXHRyZXR1cm4gbnVsbDtcbn1cblxuLy8gLS0tLS0tLS0tIC9ET00gUXVlcnkgU2hvcnRjdXRzIC0tLS0tLS0tLSAvL1xuXG5cbi8vIC0tLS0tLS0tLSBET00gSGVscGVycyAtLS0tLS0tLS0gLy9cbmZ1bmN0aW9uIGFwcGVuZChyZWZFbCwgbmV3RWwsIHBvc2l0aW9uKXtcblx0dmFyIHBhcmVudEVsLCBuZXh0U2libGluZyA9IG51bGw7XG5cdFxuXHQvLyBkZWZhdWx0IGlzIFwibGFzdFwiXG5cdHBvc2l0aW9uID0gKHBvc2l0aW9uKT9wb3NpdGlvbjpcImxhc3RcIjtcblxuXHQvLy8vIDEpIFdlIGRldGVybWluZSB0aGUgcGFyZW50RWxcblx0aWYgKHBvc2l0aW9uID09PSBcImxhc3RcIiB8fCBwb3NpdGlvbiA9PT0gXCJmaXJzdFwiICB8fCBwb3NpdGlvbiA9PT0gXCJlbXB0eVwiKXtcblx0XHRwYXJlbnRFbCA9IHJlZkVsO1xuXHR9ZWxzZSBpZiAocG9zaXRpb24gPT09IFwiYmVmb3JlXCIgfHwgcG9zaXRpb24gPT09IFwiYWZ0ZXJcIil7XG5cdFx0cGFyZW50RWwgPSByZWZFbC5wYXJlbnROb2RlO1xuXHRcdGlmICghcGFyZW50RWwpe1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwibXZkb20gRVJST1IgLSBUaGUgcmVmZXJlbmNlRWxlbWVudCBcIiArIHJlZkVsICsgXCIgZG9lcyBub3QgaGF2ZSBhIHBhcmVudE5vZGUuIENhbm5vdCBpbnNlcnQgXCIgKyBwb3NpdGlvbik7XG5cdFx0fVxuXHR9XG5cblx0Ly8vLyAyKSBXZSBkZXRlcm1pbmUgaWYgd2UgaGF2ZSBhIG5leHRTaWJsaW5nIG9yIG5vdFxuXHQvLyBpZiBcImZpcnN0XCIsIHdlIHRyeSB0byBzZWUgaWYgdGhlcmUgaXMgYSBmaXJzdCBjaGlsZFxuXHRpZiAocG9zaXRpb24gPT09IFwiZmlyc3RcIil7XG5cdFx0bmV4dFNpYmxpbmcgPSBmaXJzdChyZWZFbCk7IC8vIGlmIHRoaXMgaXMgbnVsbCwgdGhlbiwgaXQgd2lsbCBqdXN0IGRvIGFuIGFwcGVuZENoaWxkXG5cdFx0Ly8gTm90ZTogdGhpcyBtaWdodCBiZSBhIHRleHQgbm9kZSBidXQgdGhpcyBpcyBmaW5lIGluIHRoaXMgY29udGV4dC5cblx0fVxuXHQvLyBpZiBcImJlZm9yZVwiLCB0aGVuLCB0aGUgcmVmRWwgaXMgdGhlIG5leHRTaWJsaW5nXG5cdGVsc2UgaWYgKHBvc2l0aW9uID09PSBcImJlZm9yZVwiKXtcblx0XHRuZXh0U2libGluZyA9IHJlZkVsO1xuXHR9XG5cdC8vIGlmIFwiYWZ0ZXJcIiwgdHJ5IHRvIGZpbmQgdGhlIG5leHQgU2libGluZyAoaWYgbm90IGZvdW5kLCBpdCB3aWxsIGJlIGp1c3QgYSBhcHBlbmRDaGlsZCB0byBhZGQgbGFzdClcblx0ZWxzZSBpZiAocG9zaXRpb24gPT09IFwiYWZ0ZXJcIil7XG5cdFx0bmV4dFNpYmxpbmcgPSBuZXh0KHJlZkVsKTtcblx0fVxuXG5cdC8vLy8gMykgV2UgYXBwZW5kIHRoZSBuZXdFbFxuXHQvLyBpZiB3ZSBoYXZlIGEgbmV4dCBzaWJsaW5nLCB3ZSBpbnNlcnQgaXQgYmVmb3JlXG5cdGlmIChuZXh0U2libGluZyl7XG5cdFx0cGFyZW50RWwuaW5zZXJ0QmVmb3JlKG5ld0VsLCBuZXh0U2libGluZyk7XG5cdH1cblx0Ly8gb3RoZXJ3aXNlLCB3ZSBqdXN0IGRvIGEgYXBwZW5kIGxhc3Rcblx0ZWxzZXtcblx0XHRpZiAocG9zaXRpb24gPT09IFwiZW1wdHlcIil7XG5cdFx0XHQvLyBUT0RPOiBDSVJDVUxBUiBkZXBlbmRlbmN5LiBSaWdodCBub3csIHdlIGRvIG5lZWQgdG8gY2FsbCB0aGUgdmlldy5lbXB0eSB0byBkbyB0aGUgY29ycmVjdCBlbXB0eSwgYnV0IHZpZXcgYWxzbyB1c2UgZG9tLmpzXG5cdFx0XHQvLyAgICAgICBUaGlzIHdvcmtzIHJpZ2h0IG5vdyBhcyBhbGwgdGhlIG1vZHVsZXMgZ2V0IG1lcmdlZCBpbnRvIHRoZSBzYW1lIG9iamVjdCwgYnV0IHdvdWxkIGJlIGdvb2QgdG8gZmluZCBhIG1vcmUgZWxlZ2FudCBzb2x1dGlvblxuXHRcdFx0dGhpcy5lbXB0eShyZWZFbCk7XG5cdFx0fVxuXHRcdHBhcmVudEVsLmFwcGVuZENoaWxkKG5ld0VsKTtcblx0fVxuXG5cdHJldHVybiBuZXdFbDtcdFxufVxuXG5cbmZ1bmN0aW9uIGZyYWcoaHRtbCl7XG5cdC8vIG1ha2UgaXQgbnVsbCBwcm9vZlxuXHRodG1sID0gKGh0bWwpP2h0bWwudHJpbSgpOm51bGw7XG5cdGlmICghaHRtbCl7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHR2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG5cdGlmKHRlbXBsYXRlLmNvbnRlbnQpe1xuXHRcdHRlbXBsYXRlLmlubmVySFRNTCA9IGh0bWw7XG5cdFx0cmV0dXJuIHRlbXBsYXRlLmNvbnRlbnQ7XG5cdH1cblx0Ly8gZm9yIElFIDExXG5cdGVsc2V7XG5cdFx0dmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cdFx0dmFyIHRtcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0dG1wLmlubmVySFRNTCA9IGh0bWw7XG5cdFx0d2hpbGUgKHRtcC5maXJzdENoaWxkKSB7XG5cdFx0XHRmcmFnLmFwcGVuZENoaWxkKHRtcC5maXJzdENoaWxkKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZyYWc7XG5cblx0fVx0XG59XG4vLyAtLS0tLS0tLS0gL0RPTSBIZWxwZXJzIC0tLS0tLS0tLSAvL1xuXG5cblxuXG5mdW5jdGlvbiBfc2libGluZyhuZXh0LCBlbCwgc2VsZWN0b3Ipe1xuXHR2YXIgc2libGluZyA9IChuZXh0KT9cIm5leHRTaWJsaW5nXCI6XCJwcmV2aW91c1NpYmxpbmdcIjtcblxuXHR2YXIgdG1wRWwgPSAoZWwpP2VsW3NpYmxpbmddOm51bGw7XG5cblx0Ly8gdXNlIFwiIT1cIiBmb3IgbnVsbCBhbmQgdW5kZWZpbmVkXG5cdHdoaWxlICh0bXBFbCAhPSBudWxsICYmIHRtcEVsICE9PSBkb2N1bWVudCl7XG5cdFx0Ly8gb25seSBpZiBub2RlIHR5cGUgaXMgb2YgRWxlbWVudCwgb3RoZXJ3aXNlLCBcblx0XHRpZiAodG1wRWwubm9kZVR5cGUgPT09IDEgJiYgKCFzZWxlY3RvciB8fCBtYXRjaGVzRm4uY2FsbCh0bXBFbCwgc2VsZWN0b3IpKSl7XG5cdFx0XHRyZXR1cm4gdG1wRWw7XG5cdFx0fVxuXHRcdHRtcEVsID0gdG1wRWxbc2libGluZ107XG5cdH1cblx0cmV0dXJuIG51bGw7XG59XG5cblxuLy8gdXRpbDogcXVlcnlTZWxlY3RvcltBbGxdIHdyYXBwZXJcbmZ1bmN0aW9uIF9leGVjUXVlcnlTZWxlY3RvcihhbGwsIGVsLCBzZWxlY3Rvcil7XG5cdC8vIGlmIGVsIGlzIG51bGwgb3IgdW5kZWZpbmVkLCBtZWFucyB3ZSByZXR1cm4gbm90aGluZy4gXG5cdGlmICh0eXBlb2YgZWwgPT09IFwidW5kZWZpbmVkXCIgfHwgZWwgPT09IG51bGwpe1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cdC8vIGlmIHNlbGVjdG9yIGlzIHVuZGVmaW5lZCwgaXQgbWVhbnMgd2Ugc2VsZWN0IGZyb20gZG9jdW1lbnQgYW5kIGVsIGlzIHRoZSBkb2N1bWVudFxuXHRpZiAodHlwZW9mIHNlbGVjdG9yID09PSBcInVuZGVmaW5lZFwiKXtcblx0XHRzZWxlY3RvciA9IGVsO1xuXHRcdGVsID0gZG9jdW1lbnQ7XHRcdFxuXHR9XG5cdHJldHVybiAoYWxsKT9lbC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTplbC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbn1cbiIsIlxudmFyIGRvbSA9IHJlcXVpcmUoXCIuL2RvbS5qc1wiKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0cHVsbDogcHVsbCwgXG5cdHB1c2g6IHB1c2gsIFxuXHRwdWxsZXI6IHB1bGxlciwgXG5cdHB1c2hlcjogcHVzaGVyXG59O1xuXG52YXIgX3B1c2hlcnMgPSBbXG5cblx0W1wiaW5wdXRbdHlwZT0nY2hlY2tib3gnXSwgaW5wdXRbdHlwZT0ncmFkaW8nXVwiLCBmdW5jdGlvbih2YWx1ZSl7XG5cdFx0dmFyIGlwdFZhbHVlID0gdGhpcy52YWx1ZSB8fCBcIm9uXCI7IC8vIGFzIHNvbWUgYnJvd3NlcnMgZGVmYXVsdCB0byB0aGlzXG5cblx0XHQvLyBpZiB0aGUgdmFsdWUgaXMgYW4gYXJyYXksIGl0IG5lZWQgdG8gbWF0Y2ggdGhpcyBpcHRWYWx1ZVxuXHRcdGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KXtcblx0XHRcdGlmICh2YWx1ZS5pbmRleE9mKGlwdFZhbHVlKSA+IC0xKXtcblx0XHRcdFx0dGhpcy5jaGVja2VkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gb3RoZXJ3aXNlLCBpZiB2YWx1ZSBpcyBub3QgYW4gYXJyYXksXG5cdFx0ZWxzZSBpZiAoKGlwdFZhbHVlID09PSBcIm9uXCIgJiYgdmFsdWUpIHx8IGlwdFZhbHVlID09PSB2YWx1ZSl7XG5cdFx0XHR0aGlzLmNoZWNrZWQgPSB0cnVlO1xuXHRcdH1cblx0fV0sXG5cblx0W1wiaW5wdXRcIiwgZnVuY3Rpb24odmFsdWUpe1xuXHRcdGlmKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikgdGhpcy52YWx1ZSA9IHZhbHVlO1xuXHR9XSxcblxuXHRbXCJzZWxlY3RcIiwgZnVuY3Rpb24odmFsdWUpe1xuXHRcdGlmKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikgdGhpcy52YWx1ZSA9IHZhbHVlO1xuXHR9XSxcblxuXHRbXCJ0ZXh0YXJlYVwiLCBmdW5jdGlvbih2YWx1ZSl7XG5cdFx0aWYodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB0aGlzLnZhbHVlID0gdmFsdWU7XG5cdH1dLFxuXG5cdFtcIipcIiwgZnVuY3Rpb24odmFsdWUpe1xuXHRcdGlmKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikgdGhpcy5pbm5lckhUTUwgPSB2YWx1ZTtcblx0fV1cbl07XG5cbnZhciBfcHVsbGVycyA9IFtcblx0W1wiaW5wdXRbdHlwZT0nY2hlY2tib3gnXSwgaW5wdXRbdHlwZT0ncmFkaW8nXVwiLCBmdW5jdGlvbihleGlzdGluZ1ZhbHVlKXtcblxuXHRcdHZhciBpcHRWYWx1ZSA9IHRoaXMudmFsdWUgfHwgXCJvblwiOyAvLyBhcyBzb21lIGJyb3dzZXIgZGVmYXVsdCB0byB0aGlzXG5cdFx0dmFyIG5ld1ZhbHVlO1xuXHRcdGlmICh0aGlzLmNoZWNrZWQpe1xuXHRcdFx0Ly8gY2hhbmdlIFwib25cIiBieSB0cnVlIHZhbHVlICh3aGljaCB1c3VhbGx5IHdoYXQgd2Ugd2FudCB0byBoYXZlKVxuXHRcdFx0Ly8gVE9ETzogV2Ugc2hvdWxkIHRlc3QgdGhlIGF0dHJpYnV0ZSBcInZhbHVlXCIgdG8gYWxsb3cgXCJvblwiIGlmIGl0IGlzIGRlZmluZWRcblx0XHRcdG5ld1ZhbHVlID0gKGlwdFZhbHVlICYmIGlwdFZhbHVlICE9PSBcIm9uXCIpP2lwdFZhbHVlOnRydWU7XG5cdFx0XHRpZiAodHlwZW9mIGV4aXN0aW5nVmFsdWUgIT09IFwidW5kZWZpbmVkXCIpe1xuXHRcdFx0XHQvLyBpZiB3ZSBoYXZlIGFuIGV4aXN0aW5nVmFsdWUgZm9yIHRoaXMgcHJvcGVydHksIHdlIGNyZWF0ZSBhbiBhcnJheVxuXHRcdFx0XHR2YXIgdmFsdWVzID0gdXRpbHMuYXNBcnJheShleGlzdGluZ1ZhbHVlKTtcblx0XHRcdFx0dmFsdWVzLnB1c2gobmV3VmFsdWUpO1xuXHRcdFx0XHRuZXdWYWx1ZSA9IHZhbHVlcztcblx0XHRcdH1cdFx0XHRcdFxuXHRcdH1cblx0XHRyZXR1cm4gbmV3VmFsdWU7XG5cdH1dLFxuXG5cdFtcImlucHV0LCBzZWxlY3RcIiwgZnVuY3Rpb24oZXhpc3RpbmdWYWx1ZSl7XG5cdFx0cmV0dXJuIHRoaXMudmFsdWU7XG5cdH1dLFxuXG5cdFtcInRleHRhcmVhXCIsIGZ1bmN0aW9uKGV4aXN0aW5nVmFsdWUpe1xuXHRcdHJldHVybiB0aGlzLnZhbHVlO1xuXHR9XSxcblxuXHRbXCIqXCIsIGZ1bmN0aW9uKGV4aXN0aW5nVmFsdWUpe1xuXHRcdHJldHVybiB0aGlzLmlubmVySFRNTDtcblx0fV1cbl07XG5cbmZ1bmN0aW9uIHB1c2hlcihzZWxlY3RvcixmdW5jKXtcblx0X3B1c2hlcnMudW5zaGlmdChbc2VsZWN0b3IsZnVuY10pO1xufVxuXG5mdW5jdGlvbiBwdWxsZXIoc2VsZWN0b3IsZnVuYyl7XG5cdF9wdWxsZXJzLnVuc2hpZnQoW3NlbGVjdG9yLGZ1bmNdKTtcbn1cblxuZnVuY3Rpb24gcHVzaChlbCwgc2VsZWN0b3Jfb3JfZGF0YSwgZGF0YSkge1xuXHR2YXIgc2VsZWN0b3I7XG5cblx0Ly8gaWYgZGF0YSBpcyBudWxsIG9yIHVuZGVmaW5lZFxuXHRpZiAoZGF0YSA9PSBudWxsKXtcblx0XHRzZWxlY3RvciA9IFwiLmR4XCI7XG5cdFx0ZGF0YSA9IHNlbGVjdG9yX29yX2RhdGE7XG5cdH1lbHNle1xuXHRcdHNlbGVjdG9yID0gc2VsZWN0b3Jfb3JfZGF0YTtcblx0fVxuXG5cdHZhciBkeEVscyA9IGRvbS5hbGwoZWwsIHNlbGVjdG9yKTtcblxuXHR1dGlscy5hc0FycmF5KGR4RWxzKS5mb3JFYWNoKGZ1bmN0aW9uKGR4RWwpe1xuXHRcdFxuXHRcdHZhciBwcm9wUGF0aCA9IGdldFByb3BQYXRoKGR4RWwpO1xuXHRcdHZhciB2YWx1ZSA9IHV0aWxzLnZhbChkYXRhLHByb3BQYXRoKTtcblx0XHR2YXIgaSA9IDAsIHB1c2hlclNlbGVjdG9yLCBmdW4sIGwgPSBfcHVzaGVycy5sZW5ndGg7XG5cdFx0Zm9yICg7IGk8bCA7IGkrKyl7XG5cdFx0XHRwdXNoZXJTZWxlY3RvciA9IF9wdXNoZXJzW2ldWzBdO1xuXHRcdFx0aWYgKGRvbS5fbWF0Y2hlc0ZuLmNhbGwoZHhFbCxwdXNoZXJTZWxlY3Rvcikpe1xuXHRcdFx0XHRmdW4gPSBfcHVzaGVyc1tpXVsxXTtcblx0XHRcdFx0ZnVuLmNhbGwoZHhFbCx2YWx1ZSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cdFx0XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBwdWxsKGVsLCBzZWxlY3Rvcil7XG5cdHZhciBvYmogPSB7fTtcblxuXHRzZWxlY3RvciA9IChzZWxlY3Rvcik/c2VsZWN0b3I6XCIuZHhcIjtcblxuXHR2YXIgZHhFbHMgPSBkb20uYWxsKGVsLCBzZWxlY3Rvcik7XG5cblx0dXRpbHMuYXNBcnJheShkeEVscykuZm9yRWFjaChmdW5jdGlvbihkeEVsKXtcblx0XHR2YXIgcHJvcFBhdGggPSBnZXRQcm9wUGF0aChkeEVsKTtcblx0XHR2YXIgaSA9IDAsIHB1bGxlclNlbGVjdG9yLCBmdW4sIGwgPSBfcHVsbGVycy5sZW5ndGg7XHRcdFxuXHRcdGZvciAoOyBpPGwgOyBpKyspe1xuXHRcdFx0cHVsbGVyU2VsZWN0b3IgPSBfcHVsbGVyc1tpXVswXTtcblx0XHRcdGlmIChkb20uX21hdGNoZXNGbi5jYWxsKGR4RWwscHVsbGVyU2VsZWN0b3IpKXtcblx0XHRcdFx0ZnVuID0gX3B1bGxlcnNbaV1bMV07XG5cdFx0XHRcdHZhciBleGlzdGluZ1ZhbHVlID0gdXRpbHMudmFsKG9iaixwcm9wUGF0aCk7XG5cdFx0XHRcdHZhciB2YWx1ZSA9IGZ1bi5jYWxsKGR4RWwsZXhpc3RpbmdWYWx1ZSk7XG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpe1xuXHRcdFx0XHRcdHV0aWxzLnZhbChvYmoscHJvcFBhdGgsdmFsdWUpO1x0XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XHRcdFx0XHRcdFxuXHRcdH1cdFx0XG5cdH0pO1xuXG5cdHJldHVybiBvYmo7XG59XG5cbi8qKiBcbiAqIFJldHVybiB0aGUgdmFyaWFibGUgcGF0aCBvZiB0aGUgZmlyc3QgZHgtLiBcIi1cIiBpcyBjaGFuZ2VkIHRvIFwiLlwiXG4gKiBcbiAqIEBwYXJhbSBjbGFzc0F0dHI6IGxpa2UgXCJyb3cgZHggZHgtY29udGFjdC5uYW1lXCJcbiAqIEByZXR1cm5zOiB3aWxsIHJldHVybiBcImNvbnRhY3QubmFtZVwiXG4gKiovXG5mdW5jdGlvbiBnZXRQcm9wUGF0aChkeEVsKXtcblx0dmFyIHBhdGggPSBudWxsO1xuXHR2YXIgaSA9MCwgY2xhc3NlcyA9IGR4RWwuY2xhc3NMaXN0LCBsID0gZHhFbC5jbGFzc0xpc3QubGVuZ3RoLCBuYW1lO1xuXHRmb3IgKDsgaSA8IGw7IGkrKyl7XG5cdFx0bmFtZSA9IGNsYXNzZXNbaV07XG5cdFx0aWYgKG5hbWUuaW5kZXhPZihcImR4LVwiKSA9PT0gMCl7XG5cdFx0XHRwYXRoID0gbmFtZS5zcGxpdChcIi1cIikuc2xpY2UoMSkuam9pbihcIi5cIik7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdH1cblx0Ly8gaWYgd2UgZG8gbm90IGhhdmUgYSBwYXRoIGluIHRoZSBjc3MsIHRyeSB0aGUgZGF0YS1keCBhdHRyaWJ1dGVcblx0aWYgKCFwYXRoKXtcblx0XHRwYXRoID0gZHhFbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWR4XCIpO1xuXHR9XG5cdGlmICghcGF0aCl7XG5cdFx0cGF0aCA9IGR4RWwuZ2V0QXR0cmlidXRlKFwibmFtZVwiKTsgLy8gbGFzdCBmYWxsIGJhY2ssIGFzc3VtZSBpbnB1dCBmaWVsZFxuXHR9XG5cdHJldHVybiBwYXRoO1xufVxuXG5cblxuIiwidmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG52YXIgZG9tID0gcmVxdWlyZShcIi4vZG9tLmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0b246IG9uLFxuXHRvZmY6IG9mZixcblx0dHJpZ2dlcjogdHJpZ2dlclxufTtcblxuLy8gLS0tLS0tLS0tIE1vZHVsZSBBUElzIC0tLS0tLS0tLSAvL1xuXG4vLyBiaW5kIGEgZXZlbnQgY2FuIGJlIGNhbGwgd2l0aCBcbi8vIC0gZWxzOiBzaW5nbGUgb3IgYXJyYXkgb2YgdGhlIGJhc2UgZG9tIGVsZW1lbnRzIHRvIGJpbmQgdGhlIGV2ZW50IGxpc3RlbmVyIHVwb24uXG4vLyAtIHR5cGU6IGV2ZW50IHR5cGUgKGxpa2UgJ2NsaWNrJyBvciBjYW4gYmUgY3VzdG9tIGV2ZW50KS5cbi8vIC0gc2VsZWN0b3I6IChvcHRpb25hbCkgcXVlcnkgc2VsZWN0b3Igd2hpY2ggd2lsbCBiZSB0ZXN0ZWQgb24gdGhlIHRhcmdldCBlbGVtZW50LiBcbi8vIC0gbGlzdGVuZXI6IGZ1bmN0aW9uIHdoaWNoIHdpbGwgZ2V0IHRoZSBcImV2ZW50XCIgYXMgZmlyc3QgcGFyYW1ldGVyXG4vLyAtIG9wdHM6IChvcHRpb25hbCkge25zLGN0eH0gb3B0aW9uYWwgbmFtZXNwYWNlIGFuZCBjdHggKGkuZS4gdGhpcylcbmZ1bmN0aW9uIG9uKGVscywgdHlwZXMsIHNlbGVjdG9yLCBsaXN0ZW5lciwgb3B0cyl7XG5cblx0Ly8gaWYgdGhlIFwic2VsZWN0b3JcIiBpcyBhIGZ1bmN0aW9uLCB0aGVuLCBpdCBpcyB0aGUgbGlzdGVuZXIgYW5kIHRoZXJlIGlzIG5vIHNlbGVjdG9yXG5cdGlmIChzZWxlY3RvciBpbnN0YW5jZW9mIEZ1bmN0aW9uKXtcblx0XHRsaXN0ZW5lciA9IHNlbGVjdG9yO1xuXHRcdHNlbGVjdG9yID0gbnVsbDtcblx0XHRvcHRzID0gbGlzdGVuZXI7XG5cdH1cblxuXHR0eXBlcyA9IHV0aWxzLnNwbGl0QW5kVHJpbSh0eXBlcywgXCIsXCIpO1xuXG5cdHR5cGVzLmZvckVhY2goZnVuY3Rpb24odHlwZSl7XG5cdFx0dmFyIHR5cGVTZWxlY3RvcktleSA9IGJ1aWxkVHlwZVNlbGVjdG9yS2V5KHR5cGUsIHNlbGVjdG9yKTtcblxuXHRcdHV0aWxzLmFzQXJyYXkoZWxzKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXtcblxuXHRcdFx0Ly8gVGhpcyB3aWxsIHRoZSBsaXN0ZW5lciB1c2UgZm9yIHRoZSBldmVuIGxpc3RlbmVyLCB3aGljaCBtaWdodCBkaWZmZXJcblx0XHRcdC8vIGZyb20gdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHBhc3NlZCBpbiBjYXNlIG9mIGEgc2VsZWN0b3Jcblx0XHRcdHZhciBfbGlzdGVuZXIgPSBsaXN0ZW5lcjsgXG5cblx0XHRcdC8vIGlmIHdlIGhhdmUgYSBzZWxlY3RvciwgY3JlYXRlIHRoZSB3cmFwcGVyIGxpc3RlbmVyIHRvIGRvIHRoZSBtYXRjaGVzIG9uIHRoZSBzZWxlY3RvclxuXHRcdFx0aWYgKHNlbGVjdG9yKXtcblx0XHRcdFx0X2xpc3RlbmVyID0gZnVuY3Rpb24oZXZ0KXtcblx0XHRcdFx0XHR2YXIgdGd0ID0gbnVsbDtcblx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gZXZ0LnRhcmdldDtcblx0XHRcdFx0XHR2YXIgY3VycmVudFRhcmdldCA9IGV2dC5jdXJyZW50VGFyZ2V0O1xuXHRcdFx0XHRcdHZhciBjdHggPSAob3B0cyk/b3B0cy5jdHg6bnVsbDtcblx0XHRcdFx0XHQvLyBpZiB0aGUgdGFyZ2V0IG1hdGNoIHRoZSBzZWxlY3RvciwgdGhlbiwgZWFzeSwgd2UgY2FsbCB0aGUgbGlzdGVuZXJcblx0XHRcdFx0XHRpZiAodGFyZ2V0ICYmIGRvbS5fbWF0Y2hlc0ZuLmNhbGwodGFyZ2V0LHNlbGVjdG9yKSl7XG5cdFx0XHRcdFx0XHQvLyBOb3RlOiBXaGlsZSBtb3VzZUV2ZW50IGFyZSByZWFkb25seSBmb3IgaXRzIHByb3BlcnRpZXMsIGl0IGRvZXMgYWxsb3cgdG8gYWRkIGN1c3RvbSBwcm9wZXJ0aWVzXG5cdFx0XHRcdFx0XHRldnQuc2VsZWN0VGFyZ2V0ID0gdGFyZ2V0O1xuXHRcdFx0XHRcdFx0bGlzdGVuZXIuY2FsbChjdHgsZXZ0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gbm93LCBpZiBpdCBkb2VzIG5vdCwgcGVyaGFwcyBzb21ldGhpbmcgaW4gYmV0d2VlbiB0aGUgdGFyZ2V0IGFuZCBjdXJyZW50VGFyZ2V0XG5cdFx0XHRcdFx0Ly8gbWlnaHQgbWF0Y2hcblx0XHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdFx0dGd0ID0gZXZ0LnRhcmdldC5wYXJlbnROb2RlO1xuXHRcdFx0XHRcdFx0Ly8gVE9ETzogbWlnaHQgbmVlZCB0byBjaGVjayB0aGF0IHRndCBpcyBub3QgdW5kZWZpbmVkIGFzIHdlbGwuIFxuXHRcdFx0XHRcdFx0d2hpbGUgKHRndCAhPT0gbnVsbCAmJiB0Z3QgIT09IGN1cnJlbnRUYXJnZXQgJiYgdGd0ICE9PSBkb2N1bWVudCl7XG5cdFx0XHRcdFx0XHRcdGlmIChkb20uX21hdGNoZXNGbi5jYWxsKHRndCxzZWxlY3Rvcikpe1xuXHRcdFx0XHRcdFx0XHRcdC8vIE5vdGU6IFdoaWxlIG1vdXNlRXZlbnQgYXJlIHJlYWRvbmx5IGZvciBpdHMgcHJvcGVydGllcywgaXQgZG9lcyBhbGxvdyB0byBhZGQgY3VzdG9tIHByb3BlcnRpZXNcblx0XHRcdFx0XHRcdFx0XHRldnQuc2VsZWN0VGFyZ2V0ID0gdGd0O1xuXHRcdFx0XHRcdFx0XHRcdGxpc3RlbmVyLmNhbGwoY3R4LGV2dCk7XG5cdFx0XHRcdFx0XHRcdFx0dGd0ID0gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHRndCA9IHRndC5wYXJlbnROb2RlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHRcdC8vIGlmIHdlIGRvIG5vdCBoYXZlIGEgc2VsZWN0b3IsIGJ1dCBzdGlsbCBoYXZlYSAgb3B0cy5jdHgsIHRoZW4sIG5lZWQgdG8gd3JhcFxuXHRcdFx0ZWxzZSBpZiAob3B0cyAmJiBvcHRzLmN0eCl7XG5cdFx0XHRcdF9saXN0ZW5lciA9IGZ1bmN0aW9uKGV2dCl7XG5cdFx0XHRcdFx0bGlzdGVuZXIuY2FsbChvcHRzLmN0eCxldnQpO1xuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR2YXIgbGlzdGVuZXJSZWYgPSB7XG5cdFx0XHRcdHR5cGU6IHR5cGUsXG5cdFx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lciwgLy8gdGhlIGxpc3RlbmVyIGFzIHBhc3NlZCBieSB0aGUgdXNlclxuXHRcdFx0XHRfbGlzdGVuZXI6IF9saXN0ZW5lciwgLy8gYW4gZXZlbnR1YWwgd3JhcCBvZiB0aGUgbGlzdGVuZXIsIG9yIGp1c3QgcG9pbnQgbGlzdGVuZXIuXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoc2VsZWN0b3Ipe1xuXHRcdFx0XHRsaXN0ZW5lclJlZi5zZWxlY3RvciA9IHNlbGVjdG9yO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiB3ZSBoYXZlIGEgbmFtZXNwYWNlLCB0aGV5IGFkZCBpdCB0byB0aGUgUmVmLCBhbmQgdG8gdGhlIGxpc3RlbmVyUmVmc0J5TnNcblx0XHRcdC8vIFRPRE86IG5lZWQgdG8gYWRkIGxpc3RlbmVyUmVmIGluIGEgbnNEaWMgaWYgaWYgdGhlcmUgYSBvcHRzLm5zXG5cdFx0XHRpZiAob3B0cyAmJiBvcHRzLm5zKXtcblx0XHRcdFx0bGlzdGVuZXJSZWYubnMgPSBvcHRzLm5zO1xuXHRcdFx0XHR2YXIgbGlzdGVuZXJSZWZTZXRCeU5zID0gdXRpbHMuZW5zdXJlTWFwKGVsLFwibGlzdGVuZXJSZWZzQnlOc1wiKTtcblx0XHRcdFx0dmFyIGxpc3RlbmVyUmVmU2V0ID0gdXRpbHMuZW5zdXJlU2V0KGxpc3RlbmVyUmVmU2V0QnlOcywgb3B0cy5ucyk7XG5cdFx0XHRcdGxpc3RlbmVyUmVmU2V0LmFkZChsaXN0ZW5lclJlZik7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGFkZCB0aGUgbGlzdGVuZXJSZWYgYXMgbGlzdGVuZXI6bGlzdGVuZXJSZWYgZW50cnkgZm9yIHRoaXMgdHlwZVNlbGVjdG9yS2V5IGluIHRoZSBsaXN0ZW5lckRpY1xuXHRcdFx0dmFyIGxpc3RlbmVyRGljID0gdXRpbHMuZW5zdXJlTWFwKGVsLFwibGlzdGVuZXJEaWNcIik7XG5cdFx0XHR2YXIgbGlzdGVuZXJSZWZCeUxpc3RlbmVyID0gdXRpbHMuZW5zdXJlTWFwKGxpc3RlbmVyRGljLHR5cGVTZWxlY3RvcktleSk7XG5cdFx0XHRsaXN0ZW5lclJlZkJ5TGlzdGVuZXIuc2V0KGxpc3RlbmVyLCBsaXN0ZW5lclJlZik7XG5cblx0XHRcdC8vIGRvIHRoZSBiaW5kaW5nXG5cdFx0XHRlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIF9saXN0ZW5lcik7XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXG5cdFx0fSk7IC8vIC91dGlscy5hc0FycmF5KGVscykuZm9yRWFjaChmdW5jdGlvbihlbCl7XG5cblx0fSk7IC8vIC90eXBlcy5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUpe1xuXG59XG5cblxuLy8gcmVtb3ZlIHRoZSBldmVudCBiaW5kaW5nXG4vLyAub2ZmKGVscyk7IHJlbW92ZSBhbGwgZXZlbnRzIGFkZGVkIHZpYSAub25cbi8vIC5vZmYoZWxzLCB0eXBlKTsgcmVtb3ZlIGFsbCBldmVudHMgb2YgdHlwZSBhZGRlZCB2aWEgLm9uXG4vLyAub2ZmKGVscywgdHlwZSwgc2VsZWN0b3IpOyByZW1vdmUgYWxsIGV2ZW50cyBvZiB0eXBlIGFuZCBzZWxlY3RvciBhZGRlZCB2aWEgLm9uXG4vLyAub2ZmKGVscywgdHlwZSwgc2VsZWN0b3IsIGxpc3RlbmVyKTsgcmVtb3ZlIGV2ZW50IG9mIHRoaXMgdHlwZSwgc2VsZWN0b3IsIGFuZCBsaXN0ZW5lclxuLy8gLm9mZihlbHMse25zfSk7IHJlbW92ZSBldmVudCBmcm9tIHRoZSBuYW1lc3BhY2UgbnNcbmZ1bmN0aW9uIG9mZihlbHMsIHR5cGUsIHNlbGVjdG9yLCBsaXN0ZW5lcil7XG5cblx0Ly8gLS0tLS0tLS0tIG9mZihlbHMsIHtuc30pIC0tLS0tLS0tLSAvL1xuXHQvLyBpZiB3ZSBoYXZlIGEgLm9mZihlbHMse25zOi4ufSkgdGhlbiB3ZSBkbyBjaGVjayBvbmx5IHRoZSBuc1xuXHRpZiAodHlwZS5ucyl7XHRcdFxuXHRcdHZhciBucyA9IHR5cGUubnM7XG5cdFx0dXRpbHMuYXNBcnJheShlbHMpLmZvckVhY2goZnVuY3Rpb24oZWwpe1xuXHRcdFx0dmFyIGxpc3RlbmVyRGljID0gZWxbXCJsaXN0ZW5lckRpY1wiXTtcblx0XHRcdHZhciBsaXN0ZW5lclJlZnNCeU5zID0gZWxbXCJsaXN0ZW5lclJlZnNCeU5zXCJdO1xuXHRcdFx0dmFyIGxpc3RlbmVyUmVmU2V0O1xuXHRcdFx0aWYgKGxpc3RlbmVyUmVmc0J5TnMpe1xuXHRcdFx0XHRsaXN0ZW5lclJlZlNldCA9IGxpc3RlbmVyUmVmc0J5TnMuZ2V0KG5zKTtcblx0XHRcdFx0aWYgKGxpc3RlbmVyUmVmU2V0KXtcblx0XHRcdFx0XHQvLyBpZiB3ZSBnZXQgdGhlIHNldCwgd2UgcmVtb3ZlIHRoZW0gYWxsXG5cdFx0XHRcdFx0bGlzdGVuZXJSZWZTZXQuZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lclJlZil7XG5cdFx0XHRcdFx0XHQvLyB3ZSByZW1vdmUgdGhlIGV2ZW50IGxpc3RlbmVyXG5cdFx0XHRcdFx0XHRlbC5yZW1vdmVFdmVudExpc3RlbmVyKGxpc3RlbmVyUmVmLnR5cGUsIGxpc3RlbmVyUmVmLl9saXN0ZW5lcik7XG5cblx0XHRcdFx0XHRcdC8vIG5lZWQgdG8gcmVtb3ZlIGl0IGZyb20gdGhlIGxpc3RlbmVyRGljXG5cdFx0XHRcdFx0XHR2YXIgdHlwZVNlbGVjdG9yS2V5ID0gYnVpbGRUeXBlU2VsZWN0b3JLZXkobGlzdGVuZXJSZWYudHlwZSwgbGlzdGVuZXJSZWYuc2VsZWN0b3IpO1xuXHRcdFx0XHRcdFx0dmFyIGxpc3RlbmVyUmVmTWFwQnlMaXN0ZW5lciA9IGxpc3RlbmVyRGljLmdldCh0eXBlU2VsZWN0b3JLZXkpO1xuXHRcdFx0XHRcdFx0aWYgKGxpc3RlbmVyUmVmTWFwQnlMaXN0ZW5lci5oYXMobGlzdGVuZXJSZWYubGlzdGVuZXIpKXtcblx0XHRcdFx0XHRcdFx0bGlzdGVuZXJSZWZNYXBCeUxpc3RlbmVyLmRlbGV0ZShsaXN0ZW5lclJlZi5saXN0ZW5lcik7XG5cdFx0XHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJJTlRFUk5BTCBFUlJPUiBzaG91bGQgaGF2ZSBhIGxpc3RlbmVyIGluIGVsLmxpc3RlbmVyRGljIGZvciBcIiArIHR5cGVTZWxlY3RvcktleSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0Ly8gd2UgcmVtb3ZlIHRoaXMgbmFtZXNwYWNlIG5vdyB0aGF0IGFsbCBldmVudCBoYW5kbGVycyBoYXMgYmVlbiByZW1vdmVkXG5cdFx0XHRcdFx0bGlzdGVuZXJSZWZzQnlOcy5kZWxldGUobnMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdC8vIC0tLS0tLS0tLSAvb2ZmKGVscywge25zfSkgLS0tLS0tLS0tIC8vXG5cblxuXHQvLyBpZiB0aGUgXCJzZWxlY3RvclwiIGlzIGEgZnVuY3Rpb24sIHRoZW4sIGl0IGlzIHRoZSBsaXN0ZW5lciBhbmQgdGhlcmUgaXMgbm8gc2VsZWN0b3Jcblx0aWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgRnVuY3Rpb24pe1xuXHRcdGxpc3RlbmVyID0gc2VsZWN0b3I7XG5cdFx0c2VsZWN0b3IgPSBudWxsO1xuXHR9XG5cblx0dmFyIHR5cGVTZWxlY3RvcktleSA9IGJ1aWxkVHlwZVNlbGVjdG9yS2V5KHR5cGUsIHNlbGVjdG9yKTtcblxuXHR1dGlscy5hc0FycmF5KGVscykuZm9yRWFjaChmdW5jdGlvbihlbCl7XG5cblx0XHQvLyBGaXJzdCwgZ2V0IHRoZSBsaXN0ZW5lclJlZkJ5TGlzdGVuZXIgZm9yIHRoaXMgdHlwZS9zZWxlY3Rvcnlcblx0XHR2YXIgbGlzdGVuZXJSZWZNYXBCeUxpc3RlbmVyID0gdXRpbHMudmFsKGVsLFtcImxpc3RlbmVyRGljXCIsdHlwZVNlbGVjdG9yS2V5XSk7XG5cblx0XHQvLyBmb3Igbm93LCBpZiB3ZSBkbyBub3QgaGF2ZSBhIGxpc3RlbmVyUmVmIGZvciB0aGlzIHR5cGUvW3NlbGVjdG9yXSwgd2UgdGhyb3cgYW4gZXJyb3Jcblx0XHRpZiAoIWxpc3RlbmVyUmVmTWFwQnlMaXN0ZW5lcil7XG5cdFx0XHRjb25zb2xlLmxvZyhcIldBUk5JTkcgLSBDYW5ub3QgZG8gLm9mZigpIHNpbmNlIHRoaXMgdHlwZS1zZWxlY3RvciAnXCIgKyB0eXBlU2VsZWN0b3JLZXkgKyBcblx0XHRcdFx0XCInIGV2ZW50IHdhcyBub3QgYm91bmQgd2l0aCAub24oKS4gV2Ugd2lsbCBhZGQgc3VwcG9ydCBmb3IgdGhpcyBsYXRlci5cIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gaWYgd2UgZG8gbm90IGhhdmUgYSBsaXN0ZW5lciBmdW5jdGlvbiwgdGhpcyBtZWFuIHdlIG5lZWQgdG8gcmVtb3ZlIGFsbCBldmVudHMgZm9yIHRoaXMgdHlwZS9zZWxlY3RvclxuXHRcdGlmICh0eXBlb2YgbGlzdGVuZXIgPT09IFwidW5kZWZpbmVkXCIpe1xuXHRcdFx0bGlzdGVuZXJSZWZNYXBCeUxpc3RlbmVyLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXJSZWYpe1xuXHRcdFx0XHQvLyBOb3RlOiBIZXJlLCB0eXBlID09PSBsaXN0ZW5lclJlZi50eXBlXG5cdFx0XHRcdC8vIHJlbW92ZSB0aGUgZXZlbnRcblx0XHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lclJlZi5fbGlzdGVuZXIpO1x0XHRcdFx0XG5cdFx0XHR9KTtcblx0XHRcdGVsW1wibGlzdGVuZXJEaWNcIl0uZGVsZXRlKHR5cGVTZWxlY3RvcktleSk7XG5cdFx0fVxuXHRcdC8vIGlmIHdlIGhhdmUgYSBsaXN0ZW5lciwgdGhlbiwganVzdCByZW1vdmUgdGhpcyBvbmUuXG5cdFx0ZWxzZXtcblx0XHRcdC8vIGNoZWNrIHRoYXQgd2UgaGF2ZSB0aGUgbWFwLiBcblx0XHRcdHZhciBsaXN0ZW5lclJlZiA9IGxpc3RlbmVyUmVmTWFwQnlMaXN0ZW5lci5nZXQobGlzdGVuZXIpO1xuXG5cdFx0XHRpZiAoIWxpc3RlbmVyUmVmKXtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJXQVJOSU5HIC0gQ2Fubm90IGRvIC5vZmYoKSBzaW5jZSBubyBsaXN0ZW5lclJlZiBmb3IgXCIgKyB0eXBlU2VsZWN0b3JLZXkgKyBcblx0XHRcdFx0XCIgYW5kIGZ1bmN0aW9uIFxcblwiICsgbGlzdGVuZXIgKyBcIlxcbiB3ZXJlIGZvdW5kLiBQcm9iYWJseSB3YXMgbm90IHJlZ2lzdGVyZWQgdmlhIG9uKClcIik7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gcmVtb3ZlIHRoZSBldmVudFxuXHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lclJlZi5fbGlzdGVuZXIpO1xuXG5cdFx0XHQvLyByZW1vdmUgaXQgZnJvbSB0aGUgbWFwXG5cdFx0XHRsaXN0ZW5lclJlZk1hcEJ5TGlzdGVuZXIuZGVsZXRlKGxpc3RlbmVyKTtcdFx0XHRcblx0XHR9XG5cblxuXHR9KTtcdFxufVxuXG52YXIgY3VzdG9tRGVmYXVsdFByb3BzID0ge1xuXHRidWJibGVzOiB0cnVlLFxuXHRjYW5jZWxhYmxlOiB0cnVlXG59O1xuXG5mdW5jdGlvbiB0cmlnZ2VyKGVscywgdHlwZSwgZGF0YSl7XG5cdHZhciBldnQgPSBuZXcgQ3VzdG9tRXZlbnQodHlwZSwgT2JqZWN0LmFzc2lnbih7fSxjdXN0b21EZWZhdWx0UHJvcHMsZGF0YSkpO1x0XG5cdHV0aWxzLmFzQXJyYXkoZWxzKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXtcblx0XHRlbC5kaXNwYXRjaEV2ZW50KGV2dCk7XG5cdH0pO1xufVxuLy8gLS0tLS0tLS0tIC9Nb2R1bGUgQVBJcyAtLS0tLS0tLS0gLy9cblxuXG5mdW5jdGlvbiBidWlsZFR5cGVTZWxlY3RvcktleSh0eXBlLCBzZWxlY3Rvcil7XG5cdHZhciB2ID0gdHlwZTtcblx0cmV0dXJuIChzZWxlY3Rvcik/KHYgKyBcIi0tXCIgKyBzZWxlY3Rvcik6djtcbn1cbiIsInZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aHViOiBodWJcbn07XG5cbi8vIFVzZXIgSHViIG9iamVjdCBleHBvc2luZyB0aGUgcHVibGljIEFQSVxudmFyIGh1YkRpYyA9IG5ldyBNYXAoKTtcblxuLy8gRGF0YSBmb3IgZWFjaCBodWIgKGJ5IG5hbWUpXG52YXIgaHViRGF0YURpYyA9IG5ldyBNYXAoKTsgXG5cbi8vIGdldCBvciBjcmVhdGUgYSBuZXcgaHViO1xuZnVuY3Rpb24gaHViKG5hbWUpe1xuXHRpZiAobmFtZSA9PSBudWxsKXtcblx0XHR0aHJvdyBcIk1WRE9NIElOVkFMSUQgQVBJIENBTExTOiBmb3Igbm93LCBkLmh1YihuYW1lKSByZXF1aXJlIGEgbmFtZSAobm8gbmFtZSB3YXMgZ2l2ZW4pLlwiO1xuXHR9XG5cdHZhciBoID0gaHViRGljLmdldChuYW1lKTsgXG5cdC8vIGlmIGl0IGRvZXMgbm90IGV4aXN0LCB3ZSBjcmVhdGUgYW5kIHNldCBpdC4gXG5cdGlmICghaCl7XG5cdFx0Ly8gY3JlYXRlIHRoZSBodWJcblx0XHRoID0gT2JqZWN0LmNyZWF0ZShIdWJQcm90bywge1xuXHRcdFx0bmFtZTogeyB2YWx1ZTogbmFtZSB9IC8vIHJlYWQgb25seVxuXHRcdH0pO1xuXHRcdGh1YkRpYy5zZXQobmFtZSwgaCk7XG5cblx0XHQvLyBjcmVhdGUgdGhlIGh1YkRhdGFcblx0XHRodWJEYXRhRGljLnNldChuYW1lLCBuZXcgSHViRGF0YVByb3RvKG5hbWUpKTtcblx0fVxuXHRyZXR1cm4gaDtcbn1cblxuaHViLmRlbGV0ZSA9IGZ1bmN0aW9uKG5hbWUpe1xuXHRodWJEaWMuZGVsZXRlKG5hbWUpO1xuXHRodWJEYXRhRGljLmRlbGV0ZShuYW1lKTtcbn07XG5cbi8vIC0tLS0tLS0tLSBIdWIgLS0tLS0tLS0tIC8vXG52YXIgSHViUHJvdG8gPSB7XG5cdHN1YjogZnVuY3Rpb24odG9waWNzLCBsYWJlbHMsIGhhbmRsZXIsIG9wdHMpe1xuXHRcdC8vIEFSRyBTSElGVElORzogaWYgbGFiZWxzIGFyZyBpcyBhIGZ1bmN0aW9uLCB0aGVuLCB3ZSBzd2l0aCB0aGUgYXJndW1lbnQgbGVmdFxuXHRcdGlmICh0eXBlb2YgbGFiZWxzID09PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0b3B0cyA9IGhhbmRsZXI7XG5cdFx0XHRoYW5kbGVyID0gbGFiZWxzO1x0XHRcdFxuXHRcdFx0bGFiZWxzID0gbnVsbDtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gbWFrZSBhcnJheXNcblx0XHR0b3BpY3MgPSB1dGlscy5zcGxpdEFuZFRyaW0odG9waWNzLCBcIixcIik7XG5cdFx0aWYgKGxhYmVscyAhPSBudWxsKXtcblx0XHRcdGxhYmVscyA9IHV0aWxzLnNwbGl0QW5kVHJpbShsYWJlbHMsIFwiLFwiKTtcblx0XHR9XG5cblx0XHQvLyBtYWtlIG9wdHMgKGFsd2F5cyBkZWZpbmVkIGF0IGxlYXN0IGFuIGVtdHB5IG9iamVjdClcblx0XHRvcHRzID0gbWFrZU9wdHMob3B0cyk7XG5cblx0XHQvLyBhZGQgdGhlIGV2ZW50IHRvIHRoZSBodWJEYXRhXG5cdFx0dmFyIGh1YkRhdGEgPSBodWJEYXRhRGljLmdldCh0aGlzLm5hbWUpO1xuXHRcdGh1YkRhdGEuYWRkRXZlbnQodG9waWNzLCBsYWJlbHMsIGhhbmRsZXIsIG9wdHMpO1xuXHR9LCBcblxuXHR1bnN1YjogZnVuY3Rpb24obnMpe1xuXHRcdHZhciBodWJEYXRhID0gaHViRGF0YURpYy5nZXQodGhpcy5uYW1lKTtcblx0XHRodWJEYXRhLnJlbW92ZVJlZnNGb3JOcyhucyk7XG5cdH0sIFxuXG5cdHB1YjogZnVuY3Rpb24odG9waWNzLCBsYWJlbHMsIGRhdGEpe1xuXHRcdC8vIEFSRyBTSElGVElORzogaWYgZGF0YSBpcyB1bmRlZmluZWQsIHdlIHNoaWZ0IGFyZ3MgdG8gdGhlIFJJR0hUXG5cdFx0aWYgKHR5cGVvZiBkYXRhID09PSBcInVuZGVmaW5lZFwiKXtcblx0XHRcdGRhdGEgPSBsYWJlbHM7XG5cdFx0XHRsYWJlbHMgPSBudWxsO1xuXHRcdH1cblxuXHRcdHRvcGljcyA9IHV0aWxzLnNwbGl0QW5kVHJpbSh0b3BpY3MsIFwiLFwiKTtcblxuXG5cdFx0aWYgKGxhYmVscyAhPSBudWxsKXtcblx0XHRcdGxhYmVscyA9IHV0aWxzLnNwbGl0QW5kVHJpbShsYWJlbHMsIFwiLFwiKTtcdFx0XG5cdFx0fVxuXG5cdFx0dmFyIGh1YkRhdGEgPSBodWJEYXRhRGljLmdldCh0aGlzLm5hbWUpO1xuXG5cdFx0dmFyIGhhc0xhYmVscyA9IChsYWJlbHMgIT0gbnVsbCAmJiBsYWJlbHMubGVuZ3RoID4gMCk7XG5cblx0XHQvLyBpZiB3ZSBoYXZlIGxhYmVscywgdGhlbiwgd2Ugc2VuZCB0aGUgbGFiZWxzIGJvdW5kIGV2ZW50cyBmaXJzdFxuXHRcdGlmIChoYXNMYWJlbHMpe1xuXHRcdFx0aHViRGF0YS5nZXRSZWZzKHRvcGljcywgbGFiZWxzKS5mb3JFYWNoKGZ1bmN0aW9uKHJlZil7XG5cdFx0XHRcdGludm9rZVJlZihyZWYsIGRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gdGhlbiwgd2Ugc2VuZCB0aGUgdG9waWMgb25seSBib3VuZFxuXHRcdGh1YkRhdGEuZ2V0UmVmcyh0b3BpY3MpLmZvckVhY2goZnVuY3Rpb24ocmVmKXtcblx0XHRcdC8vIGlmIHRoaXMgc2VuZCwgaGFzIGxhYmVsLCB0aGVuLCB3ZSBtYWtlIHN1cmUgd2UgaW52b2tlIGZvciBlYWNoIG9mIHRoaXMgbGFiZWxcblx0XHRcdGlmIChoYXNMYWJlbHMpe1xuXHRcdFx0XHRsYWJlbHMuZm9yRWFjaChmdW5jdGlvbihsYWJlbCl7XG5cdFx0XHRcdFx0aW52b2tlUmVmKHJlZixkYXRhLCBsYWJlbCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0Ly8gaWYgd2UgZG8gbm90IGhhdmUgbGFiZWxzLCB0aGVuLCBqdXN0IGNhbGwgaXQuXG5cdFx0XHRlbHNle1xuXHRcdFx0XHRpbnZva2VSZWYocmVmLCBkYXRhKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHR9LCBcblxuXHRkZWxldGVIdWI6IGZ1bmN0aW9uKCl7XG5cdFx0aHViRGljLmRlbGV0ZSh0aGlzLm5hbWUpO1xuXHRcdGh1YkRhdGFEaWMuZGVsZXRlKHRoaXMubmFtZSk7XG5cdH1cbn07XG4vLyAtLS0tLS0tLS0gL0h1YiAtLS0tLS0tLS0gLy9cblxuLy8gLS0tLS0tLS0tIEh1YkRhdGEgLS0tLS0tLS0tIC8vXG5mdW5jdGlvbiBIdWJEYXRhUHJvdG8obmFtZSl7XG5cdHRoaXMubmFtZSA9IG5hbWU7XG5cdHRoaXMucmVmc0J5TnMgPSBuZXcgTWFwKCk7XG5cdHRoaXMucmVmc0J5VG9waWMgPSBuZXcgTWFwKCk7XG5cdHRoaXMucmVmc0J5VG9waWNMYWJlbCA9IG5ldyBNYXAoKTtcbn1cblxuSHViRGF0YVByb3RvLnByb3RvdHlwZS5hZGRFdmVudCA9IGZ1bmN0aW9uKHRvcGljcywgbGFiZWxzLCBmdW4sIG9wdHMpe1xuXHR2YXIgcmVmcyA9IGJ1aWxkUmVmcyh0b3BpY3MsIGxhYmVscywgZnVuLCBvcHRzKTtcblx0dmFyIHJlZnNCeU5zID0gdGhpcy5yZWZzQnlOcztcblx0dmFyIHJlZnNCeVRvcGljID0gdGhpcy5yZWZzQnlUb3BpYztcblx0dmFyIHJlZnNCeVRvcGljTGFiZWwgPSB0aGlzLnJlZnNCeVRvcGljTGFiZWw7XG5cdHJlZnMuZm9yRWFjaChmdW5jdGlvbihyZWYpe1xuXHRcdC8vIGFkZCB0aGlzIHJlZiB0byB0aGUgbnMgZGljdGlvbmFyeVxuXHRcdC8vIFRPRE86IHByb2JhYmx5IG5lZWQgdG8gYWRkIGFuIGN1c3RvbSBcIm5zXCJcblx0XHRpZiAocmVmLm5zICE9IG51bGwpe1xuXHRcdFx0dXRpbHMuZW5zdXJlQXJyYXkocmVmc0J5TnMsIHJlZi5ucykucHVzaChyZWYpO1xuXHRcdH1cblx0XHQvLyBpZiB3ZSBoYXZlIGEgbGFiZWwsIGFkZCB0aGlzIHJlZiB0byB0aGUgdG9waWNMYWJlbCBkaWN0aW9uYXJ5XG5cdFx0aWYgKHJlZi5sYWJlbCAhPSBudWxsKXtcblx0XHRcdHV0aWxzLmVuc3VyZUFycmF5KHJlZnNCeVRvcGljTGFiZWwsIGJ1aWxkVG9waWNMYWJlbEtleShyZWYudG9waWMsIHJlZi5sYWJlbCkpLnB1c2gocmVmKTtcblx0XHR9XG5cdFx0Ly8gT3RoZXJ3aXNlLCBhZGQgaXQgdG8gdGhpcyByZWYgdGhpcyB0b3BpY1xuXHRcdGVsc2V7XG5cdFx0XHRcblx0XHRcdHV0aWxzLmVuc3VyZUFycmF5KHJlZnNCeVRvcGljLCByZWYudG9waWMpLnB1c2gocmVmKTtcblx0XHR9XG5cdH0pO1xufTtcblxuSHViRGF0YVByb3RvLnByb3RvdHlwZS5nZXRSZWZzID0gZnVuY3Rpb24odG9waWNzLCBsYWJlbHMpIHtcblx0dmFyIHJlZnMgPSBbXTtcblx0dmFyIHJlZnNCeVRvcGljID0gdGhpcy5yZWZzQnlUb3BpYztcblx0dmFyIHJlZnNCeVRvcGljTGFiZWwgPSB0aGlzLnJlZnNCeVRvcGljTGFiZWw7XG5cdFxuXHR0b3BpY3MuZm9yRWFjaChmdW5jdGlvbih0b3BpYyl7XG5cdFx0Ly8gaWYgd2UgZG8gbm90IGhhdmUgbGFiZWxzLCB0aGVuLCBqdXN0IGxvb2sgaW4gdGhlIHRvcGljIGRpY1xuXHRcdGlmIChsYWJlbHMgPT0gbnVsbCB8fCBsYWJlbHMubGVuZ3RoID09PSAwKXtcblx0XHRcdHZhciB0b3BpY1JlZnMgPSByZWZzQnlUb3BpYy5nZXQodG9waWMpO1xuXHRcdFx0aWYgKHRvcGljUmVmcyl7XG5cdFx0XHRcdHJlZnMucHVzaC5hcHBseShyZWZzLCB0b3BpY1JlZnMpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBpZiB3ZSBoYXZlIHNvbWUgbGFiZWxzLCB0aGVuLCB0YWtlIHRob3NlIGluIGFjY291bnRzXG5cdFx0ZWxzZXtcblx0XHRcdGxhYmVscy5mb3JFYWNoKGZ1bmN0aW9uKGxhYmVsKXtcblx0XHRcdFx0dmFyIHRvcGljTGFiZWxSZWZzID0gcmVmc0J5VG9waWNMYWJlbC5nZXQoYnVpbGRUb3BpY0xhYmVsS2V5KHRvcGljLCBsYWJlbCkpO1xuXHRcdFx0XHRpZiAodG9waWNMYWJlbFJlZnMpe1xuXHRcdFx0XHRcdHJlZnMucHVzaC5hcHBseShyZWZzLCB0b3BpY0xhYmVsUmVmcyk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiByZWZzO1xufTtcblxuSHViRGF0YVByb3RvLnByb3RvdHlwZS5yZW1vdmVSZWZzRm9yTnMgPSBmdW5jdGlvbihucyl7XG5cdHZhciByZWZzQnlUb3BpYyA9IHRoaXMucmVmc0J5VG9waWM7XG5cdHZhciByZWZzQnlUb3BpY0xhYmVsID0gdGhpcy5yZWZzQnlUb3BpY0xhYmVsO1xuXHR2YXIgcmVmc0J5TnMgPSB0aGlzLnJlZnNCeU5zO1xuXG5cdHZhciByZWZzID0gdGhpcy5yZWZzQnlOcy5nZXQobnMpO1xuXHRpZiAocmVmcyAhPSBudWxsKXtcblxuXHRcdC8vIHdlIHJlbW92ZSBlYWNoIHJlZiBmcm9tIHRoZSBjb3JyZXNwb25kaW5nIGRpY1xuXHRcdHJlZnMuZm9yRWFjaChmdW5jdGlvbihyZWYpe1xuXG5cdFx0XHQvLyBGaXJzdCwgd2UgZ2V0IHRoZSByZWZzIGZyb20gdGhlIHRvcGljIG9yIHRvcGljbGFiZWxcblx0XHRcdHZhciByZWZMaXN0O1xuXHRcdFx0aWYgKHJlZi5sYWJlbCAhPSBudWxsKXtcblx0XHRcdFx0dmFyIHRvcGljTGFiZWxLZXkgPSBidWlsZFRvcGljTGFiZWxLZXkocmVmLnRvcGljLCByZWYubGFiZWwpO1xuXHRcdFx0XHRyZWZMaXN0ID0gcmVmc0J5VG9waWNMYWJlbC5nZXQodG9waWNMYWJlbEtleSk7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0cmVmTGlzdCA9IHJlZnNCeVRvcGljLmdldChyZWYudG9waWMpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBUaGVuLCBmb3IgdGhlIHJlZkxpc3QgYXJyYXksIHdlIHJlbW92ZSB0aGUgb25lcyB0aGF0IG1hdGNoIHRoaXMgb2JqZWN0XG5cdFx0XHR2YXIgaWR4O1xuXHRcdFx0d2hpbGUoKGlkeCA9IHJlZkxpc3QuaW5kZXhPZihyZWYpKSAhPT0gLTEpe1xuXHRcdFx0XHRyZWZMaXN0LnNwbGljZShpZHgsIDEpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gd2UgcmVtb3ZlIHRoZW0gYWxsIGZvcm0gdGhlIHJlZnNCeU5zXG5cdFx0cmVmc0J5TnMuZGVsZXRlKG5zKTtcblx0fVxuXG5cbn07XG5cbi8vIHN0YXRpYy9wcml2YXRlXG5mdW5jdGlvbiBidWlsZFJlZnModG9waWNzLCBsYWJlbHMsIGZ1biwgb3B0cyl7XG5cdHZhciByZWZzID0gW107XG5cdHRvcGljcy5mb3JFYWNoKGZ1bmN0aW9uKHRvcGljKXtcblx0XHQvLyBpZiB3ZSBkbyBub3QgaGF2ZSBhbnkgbGFiZWxzLCB0aGVuLCBqdXN0IGFkZCB0aGlzIHRvcGljXG5cdFx0aWYgKGxhYmVscyA9PSBudWxsIHx8IGxhYmVscy5sZW5ndGggPT09IDApe1xuXHRcdFx0cmVmcy5wdXNoKHtcblx0XHRcdFx0dG9waWM6IHRvcGljLFxuXHRcdFx0XHRmdW46IGZ1biwgXG5cdFx0XHRcdG5zOiBvcHRzLm5zLCBcblx0XHRcdFx0Y3R4OiBvcHRzLmN0eFxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdC8vIGlmIHdlIGhhdmUgb25lIG9yIG1vcmUgbGFiZWxzLCB0aGVuLCB3ZSBhZGQgZm9yIHRob3NlIGxhYmVsXG5cdFx0ZWxzZXtcblx0XHRcdGxhYmVscy5mb3JFYWNoKGZ1bmN0aW9uKGxhYmVsKXtcblx0XHRcdFx0cmVmcy5wdXNoKHtcblx0XHRcdFx0XHR0b3BpYzogdG9waWMsIFxuXHRcdFx0XHRcdGxhYmVsOiBsYWJlbCwgXG5cdFx0XHRcdFx0ZnVuOiBmdW4sIFxuXHRcdFx0XHRcdG5zOiBvcHRzLm5zLFxuXHRcdFx0XHRcdGN0eDogb3B0cy5jdHhcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcdFx0XHRcblx0XHR9XG5cblx0fSk7XG5cblx0cmV0dXJuIHJlZnM7XG59XG5cblxuLy8gc3RhdGljL3ByaXZhdGU6IHJldHVybiBhIHNhZmUgb3B0cy4gSWYgb3B0cyBpcyBhIHN0cmluZywgdGhlbiwgYXNzdW1lIGlzIGl0IHRoZSB7bnN9XG52YXIgZW1wdHlPcHRzID0ge307XG5mdW5jdGlvbiBtYWtlT3B0cyhvcHRzKXtcblx0aWYgKG9wdHMgPT0gbnVsbCl7XG5cdFx0b3B0cyA9IGVtcHR5T3B0cztcblx0fWVsc2V7XG5cdFx0aWYgKHR5cGVvZiBvcHRzID09PSBcInN0cmluZ1wiKXtcblx0XHRcdG9wdHMgPSB7bnM6b3B0c307XG5cdFx0fVxuXHR9XG5cdHJldHVybiBvcHRzO1xufVxuXG4vLyBzdGF0aWMvcHJpdmF0ZVxuZnVuY3Rpb24gYnVpbGRUb3BpY0xhYmVsS2V5KHRvcGljLCBsYWJlbCl7XG5cdHJldHVybiB0b3BpYyArIFwiLSEtXCIgKyBsYWJlbDtcbn1cblxuLy8gc3RhdGljL3ByaXZhdGU6IGNhbGwgcmVmIG1ldGhvZCAod2l0aCBvcHRpb25hbCBsYWJlbCBvdmVycmlkZSlcbmZ1bmN0aW9uIGludm9rZVJlZihyZWYsIGRhdGEsIGxhYmVsKXtcblx0dmFyIGluZm8gPSB7XG5cdFx0dG9waWM6IHJlZi50b3BpYyxcblx0XHRsYWJlbDogcmVmLmxhYmVsIHx8IGxhYmVsLFxuXHRcdG5zOiByZWYubnNcblx0fTtcblx0cmVmLmZ1bi5jYWxsKHJlZi5jdHgsZGF0YSxpbmZvKTtcbn1cbi8vIC0tLS0tLS0tLSAvSHViRGF0YSAtLS0tLS0tLS0gLy9cblxuXG4iLCJ2YXIgdmlldyA9IHJlcXVpcmUoXCIuL3ZpZXcuanNcIik7XG52YXIgZXZlbnQgPSByZXF1aXJlKFwiLi9ldmVudC5qc1wiKTtcbnZhciBkb20gPSByZXF1aXJlKFwiLi9kb20uanNcIik7XG52YXIgZHggPSByZXF1aXJlKFwiLi9keC5qc1wiKTtcbnZhciBodWIgPSByZXF1aXJlKFwiLi9odWIuanNcIik7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcblxucmVxdWlyZShcIi4vdmlldy1ldmVudC5qc1wiKTtcbnJlcXVpcmUoXCIuL3ZpZXctaHViLmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0dmVyc2lvbjogXCIwLjQuM1wiLFxuXHRcblx0Ly8gdmlldyBBUElzXG5cdGhvb2s6IHZpZXcuaG9vayxcblx0cmVnaXN0ZXI6IHZpZXcucmVnaXN0ZXIsXG5cdGRpc3BsYXk6IHZpZXcuZGlzcGxheSxcblx0cmVtb3ZlOiB2aWV3LnJlbW92ZSxcblx0ZW1wdHk6IHZpZXcuZW1wdHksXG5cblx0Ly8gZXZlbnQgQVBJXG5cdG9uOiBldmVudC5vbiwgXG5cdG9mZjogZXZlbnQub2ZmLFxuXHR0cmlnZ2VyOiBldmVudC50cmlnZ2VyLFxuXG5cdC8vIERPTSBRdWVyeSBTaG9ydGN1dHNcblx0Zmlyc3Q6IGRvbS5maXJzdCxcblx0YWxsOiBkb20uYWxsLFxuXHRjbG9zZXN0OiBkb20uY2xvc2VzdCxcblx0bmV4dDogZG9tLm5leHQsXG5cdHByZXY6IGRvbS5wcmV2LFxuXG5cdC8vIERPTSBIZWxwZXJzXG5cdGFwcGVuZDogZG9tLmFwcGVuZCxcblx0ZnJhZzogZG9tLmZyYWcsXG5cblx0Ly8gRE9NIFB1c2gvUHVsbFxuXHRwdWxsOiBkeC5wdWxsLFxuXHRwdXNoOiBkeC5wdXNoLFxuXHRwdWxsZXI6IGR4LnB1bGxlcixcblx0cHVzaGVyOiBkeC5wdXNoZXIsXG5cblx0Ly8gSHViXG5cdGh1YjogaHViLmh1YixcblxuXHQvLyB1dGlsc1xuXHR2YWw6IHV0aWxzLnZhbCxcblx0YXNBcnJheTogdXRpbHMuYXNBcnJheVxufTtcblxuLy8gcHV0IHRoaXMgY29tcG9uZW50IGluIHRoZSBnbG9iYWwgc2NvcGVcbi8vIFRPRE86IFdlIG1pZ2h0IHdhbnQgdG8gaGF2ZSBhIGluZGV4LWdsb2JhbCBmb3IgcHV0dGluZyB0aGlzIGluIHRoZSBnbG9iYWwgc2NvcGUgYW5kIGluZGV4LmpzIG5vdCBwdXR0aW5nIGl0IGluIHRoZSBnbG9iYWwgc2NvcGUuIFxuaWYgKHdpbmRvdyl7XG5cdHdpbmRvdy5tdmRvbSA9IG1vZHVsZS5leHBvcnRzO1x0XG59XG5cblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Ly8gT2JqZWN0IFV0aWxzXG5cdGlzTnVsbDogaXNOdWxsLFxuXHRpc0VtcHR5OiBpc0VtcHR5LFxuXHR2YWw6IHZhbCwgLy8gcHVibGljXG5cdGVuc3VyZU1hcDogZW5zdXJlTWFwLFxuXHRlbnN1cmVTZXQ6IGVuc3VyZVNldCxcblx0ZW5zdXJlQXJyYXk6IGVuc3VyZUFycmF5LFxuXG5cdC8vIGFzVHlwZVxuXHRhc0FycmF5OiBhc0FycmF5LCAvLyBwdWJsaWNcblxuXHQvLyBzdHJpbmcgdXRpbHNcblx0c3BsaXRBbmRUcmltOiBzcGxpdEFuZFRyaW1cbn07XG5cbi8vIC0tLS0tLS0tLSBPYmplY3QgVXRpbHMgLS0tLS0tLS0tIC8vXG52YXIgVUQgPSBcInVuZGVmaW5lZFwiO1xudmFyIFNUUiA9IFwic3RyaW5nXCI7XG52YXIgT0JKID0gXCJvYmplY3RcIjtcblxuLy8gcmV0dXJuIHRydWUgaWYgdmFsdWUgaXMgbnVsbCBvciB1bmRlZmluZWRcbmZ1bmN0aW9uIGlzTnVsbCh2KXtcblx0cmV0dXJuICh0eXBlb2YgdiA9PT0gVUQgfHwgdiA9PT0gbnVsbCk7XG59XG5cbi8vIHJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBpcyBudWxsLCB1bmRlZmluZWQsIGVtcHR5IGFycmF5LCBlbXB0eSBzdHJpbmcsIG9yIGVtcHR5IG9iamVjdFxuZnVuY3Rpb24gaXNFbXB0eSh2KXtcblx0dmFyIHRvZiA9IHR5cGVvZiB2O1xuXHRpZiAoaXNOdWxsKHYpKXtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdGlmICh2IGluc3RhbmNlb2YgQXJyYXkgfHwgdG9mID09PSBTVFIpe1xuXHRcdHJldHVybiAodi5sZW5ndGggPT09IDApP3RydWU6ZmFsc2U7XG5cdH1cblxuXHRpZiAodG9mID09PSBPQkope1xuXHRcdC8vIGFwcGFyZW50bHkgMTB4IGZhc3RlciB0aGFuIE9iamVjdC5rZXlzXG5cdFx0Zm9yICh2YXIgeCBpbiB2KSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vLyBUT0RPOiBuZWVkIHRvIGRvY3VtZW50XG5mdW5jdGlvbiB2YWwocm9vdE9iaiwgcGF0aFRvVmFsdWUsIHZhbHVlKSB7XG5cdHZhciBzZXRNb2RlID0gKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIik7XG5cblx0aWYgKCFyb290T2JqKSB7XG5cdFx0cmV0dXJuIHJvb3RPYmo7XG5cdH1cblx0Ly8gZm9yIG5vdywgcmV0dXJuIHRoZSByb290T2JqIGlmIHRoZSBwYXRoVG9WYWx1ZSBpcyBlbXB0eSBvciBudWxsIG9yIHVuZGVmaW5lZFxuXHRpZiAoIXBhdGhUb1ZhbHVlKSB7XG5cdFx0cmV0dXJuIHJvb3RPYmo7XG5cdH1cblx0Ly8gaWYgdGhlIHBhdGhUb1ZhbHVlIGlzIGFscmVhZHkgYW4gYXJyYXksIGRvIG5vdCBwYXJzZSBpdCAodGhpcyBhbGxvdyB0byBzdXBwb3J0ICcuJyBpbiBwcm9wIG5hbWVzKVxuXHR2YXIgbmFtZXMgPSAocGF0aFRvVmFsdWUgaW5zdGFuY2VvZiBBcnJheSk/cGF0aFRvVmFsdWU6cGF0aFRvVmFsdWUuc3BsaXQoXCIuXCIpO1xuXHRcblx0dmFyIG5hbWUsIGN1cnJlbnROb2RlID0gcm9vdE9iaiwgY3VycmVudElzTWFwLCBuZXh0Tm9kZTtcblxuXHR2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGgsIGxJZHggPSBsIC0gMTtcblx0Zm9yIChpOyBpIDwgbDsgaSsrKSB7XG5cdFx0bmFtZSA9IG5hbWVzW2ldO1xuXG5cdFx0Y3VycmVudElzTWFwID0gKGN1cnJlbnROb2RlIGluc3RhbmNlb2YgTWFwKTtcblx0XHRuZXh0Tm9kZSA9IGN1cnJlbnRJc01hcD9jdXJyZW50Tm9kZS5nZXQobmFtZSk6Y3VycmVudE5vZGVbbmFtZV07XG5cblx0XHRpZiAoc2V0TW9kZSl7XG5cdFx0XHQvLyBpZiBsYXN0IGluZGV4LCBzZXQgdGhlIHZhbHVlXG5cdFx0XHRpZiAoaSA9PT0gbElkeCl7XG5cdFx0XHRcdGlmIChjdXJyZW50SXNNYXApe1xuXHRcdFx0XHRcdGN1cnJlbnROb2RlLnNldChuYW1lLHZhbHVlKTtcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0Y3VycmVudE5vZGVbbmFtZV0gPSB2YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjdXJyZW50Tm9kZSA9IHZhbHVlO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdGlmICh0eXBlb2YgbmV4dE5vZGUgPT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdFx0XHRuZXh0Tm9kZSA9IHt9O1xuXHRcdFx0XHR9IFxuXHRcdFx0XHRjdXJyZW50Tm9kZVtuYW1lXSA9IG5leHROb2RlO1xuXHRcdFx0XHRjdXJyZW50Tm9kZSA9IG5leHROb2RlO1xuXHRcdFx0fVxuXHRcdH1lbHNle1xuXHRcdFx0Y3VycmVudE5vZGUgPSBuZXh0Tm9kZTtcblx0XHRcdGlmICh0eXBlb2YgY3VycmVudE5vZGUgPT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdFx0Y3VycmVudE5vZGUgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVx0XHRcdFxuXHRcdH1cblxuXHRcdC8vIGlmIChub2RlID09IG51bGwpIHtcblx0XHQvLyBcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0Ly8gfVxuXHRcdC8vIC8vIGdldCB0aGUgbmV4dCBub2RlXG5cdFx0Ly8gbm9kZSA9IChub2RlIGluc3RhbmNlb2YgTWFwKT9ub2RlLmdldChuYW1lKTpub2RlW25hbWVdO1xuXHRcdC8vIGlmICh0eXBlb2Ygbm9kZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdC8vIFx0cmV0dXJuIG5vZGU7XG5cdFx0Ly8gfVxuXHR9XG5cdGlmIChzZXRNb2RlKXtcblx0XHRyZXR1cm4gcm9vdE9iajtcblx0fWVsc2V7XG5cdFx0cmV0dXJuIGN1cnJlbnROb2RlO1xuXHR9XG59XG5cbi8vIC0tLS0tLS0tLSAvT2JqZWN0IFV0aWxzIC0tLS0tLS0tLSAvL1xuXG4vLyAtLS0tLS0tLS0gZW5zdXJlVHlwZSAtLS0tLS0tLS0gLy9cbi8vIE1ha2Ugc3VyZSB0aGF0IHRoaXMgb2JqW3Byb3BOYW1lXSBpcyBhIGpzIE1hcCBhbmQgcmV0dXJucyBpdC4gXG4vLyBPdGhlcndpc2UsIGNyZWF0ZSBhIG5ldyBvbmUsIHNldCBpdCwgYW5kIHJldHVybiBpdC5cbmZ1bmN0aW9uIGVuc3VyZU1hcChvYmosIHByb3BOYW1lKXtcblx0cmV0dXJuIF9lbnN1cmUob2JqLCBwcm9wTmFtZSwgTWFwKTtcbn1cblxuLy8gTWFrZSBzdXJlIHRoYXQgdGhpcyBvYmpbcHJvcE5hbWVdIGlzIGEganMgU2V0IGFuZCByZXR1cm5zIGl0LiBcbi8vIE90aGVyd2lzZSwgY3JlYXRlIGEgbmV3IG9uZSwgc2V0IGl0LCBhbmQgcmV0dXJuIGl0LlxuZnVuY3Rpb24gZW5zdXJlU2V0KG9iaiwgcHJvcE5hbWUpe1xuXHRyZXR1cm4gX2Vuc3VyZShvYmosIHByb3BOYW1lLCBTZXQpO1xufVxuXG4vLyBzYW1lIGFzIGVuc3VyZU1hcCBidXQgZm9yIGFycmF5XG5mdW5jdGlvbiBlbnN1cmVBcnJheShvYmosIHByb3BOYW1lKXtcblx0cmV0dXJuIF9lbnN1cmUob2JqLCBwcm9wTmFtZSwgQXJyYXkpO1xufVxuXG5mdW5jdGlvbiBfZW5zdXJlKG9iaiwgcHJvcE5hbWUsIHR5cGUpe1xuXHR2YXIgaXNNYXAgPSAob2JqIGluc3RhbmNlb2YgTWFwKTtcblx0dmFyIHYgPSAoaXNNYXApP29iai5nZXQocHJvcE5hbWUpOm9ialtwcm9wTmFtZV07XG5cdGlmIChpc051bGwodikpe1xuXHRcdHYgPSAodHlwZSA9PT0gQXJyYXkpP1tdOihuZXcgdHlwZSk7XG5cdFx0aWYgKGlzTWFwKXtcblx0XHRcdG9iai5zZXQocHJvcE5hbWUsIHYpO1xuXHRcdH1lbHNle1xuXHRcdFx0b2JqW3Byb3BOYW1lXSA9IHY7XHRcblx0XHR9XHRcdFxuXHR9XG5cdHJldHVybiB2O1x0XG59XG5cbi8vIC0tLS0tLS0tLSAvZW5zdXJlVHlwZSAtLS0tLS0tLS0gLy9cblxuLy8gLS0tLS0tLS0tIGFzVHlwZSAtLS0tLS0tLS0gLy9cbi8vIFJldHVybiBhbiBhcnJheSBmcm9tIGEgdmFsdWUgb2JqZWN0LiBJZiB2YWx1ZSBpcyBudWxsL3VuZGVmaW5lZCwgcmV0dXJuIGVtcHR5IGFycmF5LiBcbi8vIElmIHZhbHVlIGlzIG51bGwgb3IgdW5kZWZpbmVkLCByZXR1cm4gZW1wdHkgYXJyYXlcbi8vIElmIHRoZSB2YWx1ZSBpcyBhbiBhcnJheSBpdCBpcyByZXR1cm5lZCBhcyBpc1xuLy8gSWYgdGhlIHZhbHVlIGlzIGEgb2JqZWN0IHdpdGggZm9yRWFjaC9sZW5ndGggd2lsbCByZXR1cm4gYSBuZXcgYXJyYXkgZm9yIHRoZXNlIHZhbHVlc1xuLy8gT3RoZXJ3aXNlIHJldHVybiBzaW5nbGUgdmFsdWUgYXJyYXlcbmZ1bmN0aW9uIGFzQXJyYXkodmFsdWUpe1xuXHRpZiAoIWlzTnVsbCh2YWx1ZSkpe1xuXHRcdGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KXtcblx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHR9XG5cdFx0Ly8gSWYgaXQgaXMgYSBub2RlTGlzdCwgY29weSB0aGUgZWxlbWVudHMgaW50byBhIHJlYWwgYXJyYXlcblx0XHRlbHNlIGlmICh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIk5vZGVMaXN0XCIpe1xuXHRcdFx0cmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHZhbHVlKTtcblx0XHR9IFxuXHRcdC8vIGlmIGl0IGlzIGEgZnVuY3Rpb24gYXJndW1lbnRzXG5cdFx0ZWxzZSBpZiAodmFsdWUudG9TdHJpbmcoKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIil7XG5cdFx0XHRyZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodmFsdWUpO1xuXHRcdH1cblx0XHQvLyBvdGhlcndpc2Ugd2UgYWRkIHZhbHVlXG5cdFx0ZWxzZXtcblx0XHRcdHJldHVybiBbdmFsdWVdO1xuXHRcdH1cblx0fVxuXHQvLyBvdGhlcndpc2UsIHJldHVybiBhbiBlbXB0eSBhcnJheVxuXHRyZXR1cm4gW107XG59XG4vLyAtLS0tLS0tLS0gL2FzVHlwZSAtLS0tLS0tLS0gLy9cblxuLy8gLS0tLS0tLS0tIFN0cmluZyBVdGlscyAtLS0tLS0tLS0gLy9cbmZ1bmN0aW9uIHNwbGl0QW5kVHJpbShzdHIsIHNlcCl7XG5cdGlmIChzdHIgPT0gbnVsbCl7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cdGlmIChzdHIuaW5kZXhPZihzZXApID09PSAtMSl7XG5cdFx0cmV0dXJuIFtzdHIudHJpbSgpXTtcblx0fVxuXHRyZXR1cm4gc3RyLnNwbGl0KHNlcCkubWFwKHRyaW0pO1xufVxuXG5mdW5jdGlvbiB0cmltKHN0cil7XG5cdHJldHVybiBzdHIudHJpbSgpO1xufVxuLy8gLS0tLS0tLS0tIC9TdHJpbmcgVXRpbHMgLS0tLS0tLS0tIC8vXG4iLCJ2YXIgX3ZpZXcgPSByZXF1aXJlKFwiLi92aWV3LmpzXCIpO1xudmFyIF9ldmVudCA9IHJlcXVpcmUoXCIuL2V2ZW50LmpzXCIpO1xuXG4vLyAtLS0tLS0tLS0gRXZlbnRzIEhvb2sgLS0tLS0tLS0tIC8vXG5fdmlldy5ob29rKFwid2lsbEluaXRcIiwgZnVuY3Rpb24odmlldyl7XG5cdHZhciBvcHRzID0ge25zOiBcInZpZXdfXCIgKyB2aWV3LmlkLCBjdHg6IHZpZXd9O1xuXHRpZiAodmlldy5ldmVudHMpe1xuXHRcdGJpbmRFdmVudHModmlldy5ldmVudHMsIHZpZXcuZWwsIG9wdHMpO1xuXHR9XG5cblx0aWYgKHZpZXcuZG9jRXZlbnRzKXtcblx0XHRiaW5kRXZlbnRzKHZpZXcuZG9jRXZlbnRzLCBkb2N1bWVudCwgb3B0cyk7XG5cdH1cblxuXHRpZiAodmlldy53aW5FdmVudHMpe1xuXHRcdGJpbmRFdmVudHModmlldy53aW5kRXZlbnRzLCBkb2N1bWVudCwgb3B0cyk7XG5cdH1cblxuXHQvLyBUT0RPOiBuZWVkIHRvIGFsbG93IGNsb3Nlc3QgYmluZGluZy5cbn0pO1xuXG5fdmlldy5ob29rKFwid2lsbFJlbW92ZVwiLCBmdW5jdGlvbih2aWV3KXtcblx0dmFyIG5zID0ge25zOiBcInZpZXdfXCIgKyB2aWV3LmlkfTtcblx0X2V2ZW50Lm9mZihkb2N1bWVudCwgbnMpO1xuXHRfZXZlbnQub2ZmKHdpbmRvdywgbnMpO1xuXHQvLyBUT0RPOiBuZWVkIHRvIHVuYmluZCBjbG9zZXN0L3BhcmVudHMgYmluZGluZ1xufSk7XG5cbmZ1bmN0aW9uIGJpbmRFdmVudHMoZXZlbnRzLCBlbCwgb3B0cyl7XG5cdHZhciBldHh0LCBldHh0cywgdHlwZSwgc2VsZWN0b3I7XG5cdGZvciAoZXR4dCBpbiBldmVudHMpe1xuXHRcdGV0eHRzID0gZXR4dC50cmltKCkuc3BsaXQoXCI7XCIpO1xuXHRcdHR5cGUgPSBldHh0c1swXS50cmltKCk7XG5cdFx0c2VsZWN0b3IgPSBudWxsO1xuXHRcdGlmIChldHh0cy5sZW5ndGggPiAxKXtcblx0XHRcdHNlbGVjdG9yID0gZXR4dHNbMV0udHJpbSgpO1xuXHRcdH1cblx0XHRfZXZlbnQub24oZWwsIHR5cGUsIHNlbGVjdG9yLCBldmVudHNbZXR4dF0sIG9wdHMpO1xuXHR9XG59XG4vLyBUT0RPOiBuZWVkIHRvIHVuYmluZCBvbiBcIndpbGxEZXN0cm95XCJcblxuLy8gLS0tLS0tLS0tIC9FdmVudHMgSG9vayAtLS0tLS0tLS0gLy8iLCJ2YXIgX3ZpZXcgPSByZXF1aXJlKFwiLi92aWV3LmpzXCIpO1xudmFyIF9odWIgPSByZXF1aXJlKFwiLi9odWIuanNcIik7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcblxuLy8gLS0tLS0tLS0tIEV2ZW50cyBIb29rIC0tLS0tLS0tLSAvL1xuX3ZpZXcuaG9vayhcIndpbGxJbml0XCIsIGZ1bmN0aW9uKHZpZXcpe1xuXHR2YXIgb3B0cyA9IHtuczogXCJ2aWV3X1wiICsgdmlldy5pZCwgY3R4OiB2aWV3fTtcblxuXHRpZiAodmlldy5odWJFdmVudHMpe1xuXHRcdC8vIGJ1aWxkIHRoZSBsaXN0IG9mIGJpbmRpbmdzXG5cblx0XHR2YXIgaW5mb0xpc3QgPSBsaXN0SHViSW5mbyh2aWV3Lmh1YkV2ZW50cyk7XG5cdFx0aW5mb0xpc3QuZm9yRWFjaChmdW5jdGlvbihpbmZvKXtcblx0XHRcdGluZm8uaHViLnN1YihpbmZvLnRvcGljcywgaW5mby5sYWJlbHMsIGluZm8uZnVuLCBvcHRzKTtcblx0XHR9KTtcblx0fVxuXG5cdC8vIFRPRE86IG5lZWQgdG8gYWxsb3cgY2xvc2VzdCBiaW5kaW5nLlxufSk7XG5cbl92aWV3Lmhvb2soXCJ3aWxsUmVtb3ZlXCIsIGZ1bmN0aW9uKHZpZXcpe1xuXHR2YXIgbnMgPSBcInZpZXdfXCIgKyB2aWV3LmlkO1xuXHR2YXIgaW5mb0xpc3QgPSBsaXN0SHViSW5mbyh2aWV3Lmh1YkV2ZW50cyk7XG5cdGluZm9MaXN0LmZvckVhY2goZnVuY3Rpb24oaW5mbyl7XG5cdFx0aW5mby5odWIudW5zdWIobnMpO1xuXHR9KTtcbn0pO1xuXG5mdW5jdGlvbiBsaXN0SHViSW5mbyhodWJFdmVudHMpe1xuXHR2YXIga2V5LCB2YWwsIGtleTIsIGh1YiwgaW5mb0xpc3QgPSBbXTtcblxuXHRmb3IgKGtleSBpbiBodWJFdmVudHMpe1xuXHRcdHZhbCA9IGh1YkV2ZW50c1trZXldO1xuXHRcdGlmICh0eXBlb2YgdmFsID09PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0aW5mb0xpc3QucHVzaChnZXRIdWJJbmZvKGtleSwgbnVsbCwgdmFsKSk7XG5cdFx0fWVsc2V7XG5cdFx0XHRrZXkyO1xuXHRcdFx0aHViID0gX2h1Yi5odWIoa2V5KTtcblx0XHRcdGZvciAoa2V5MiBpbiB2YWwpe1xuXHRcdFx0XHRpbmZvTGlzdC5wdXNoKGdldEh1YkluZm8oa2V5MiwgaHViLCB2YWxba2V5Ml0pKTtcblx0XHRcdH1cblx0XHR9XHRcdFx0XG5cdH1cblx0cmV0dXJuIGluZm9MaXN0O1xufVxuXG4vLyByZXR1cm5zIHtodWIsIHRvcGljcywgbGFiZWxzfVxuLy8gaHViIGlzIG9wdGlvbmFsLCBpZiBub3QgcHJlc2VudCwgYXNzdW1lIHRoZSBuYW1lIHdpbGwgYmUgdGhlIGZpcnN0IGl0ZW0gd2lsbCBiZSBpbiB0aGUgc3RyXG5mdW5jdGlvbiBnZXRIdWJJbmZvKHN0ciwgaHViLCBmdW4pe1xuXHR2YXIgYSA9IHV0aWxzLnNwbGl0QW5kVHJpbShzdHIsXCI7XCIpO1xuXHQvLyBpZiBubyBodWIsIHRoZW4sIGFzc3VtZSBpdCBpcyBpbiB0aGUgc3RyXG5cdHZhciB0b3BpY0lkeCA9IChodWIpPzA6MTtcblx0dmFyIGluZm8gPSB7XG5cdFx0dG9waWNzOiBhW3RvcGljSWR4XSxcblx0XHRmdW46IGZ1blxuXHR9O1xuXHRpZiAoYS5sZW5ndGggPiB0b3BpY0lkeCArIDEpe1xuXHRcdGluZm8ubGFiZWxzID0gYVt0b3BpY0lkeCArIDFdO1xuXHR9XG5cdGluZm8uaHViID0gKCFodWIpP19odWIuaHViKGFbMF0pOmh1Yjtcblx0cmV0dXJuIGluZm87XG59XG5cbi8vIFRPRE86IG5lZWQgdG8gdW5iaW5kIG9uIFwid2lsbERlc3Ryb3lcIlxuXG4vLyAtLS0tLS0tLS0gL0V2ZW50cyBIb29rIC0tLS0tLS0tLSAvLyIsInZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xudmFyIGRvbSA9IHJlcXVpcmUoXCIuL2RvbS5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGhvb2s6IGhvb2ssXG5cdHJlZ2lzdGVyOiByZWdpc3Rlcixcblx0ZGlzcGxheTogZGlzcGxheSwgXG5cdHJlbW92ZTogcmVtb3ZlLCBcblx0ZW1wdHk6IGVtcHR5XG59O1xuXG52YXIgdmlld0RlZkRpYyA9IHt9O1xuXG52YXIgdmlld0lkU2VxID0gMDtcblxudmFyIGhvb2tzID0ge1xuXHR3aWxsQ3JlYXRlOiBbXSxcblx0ZGlkQ3JlYXRlOiBbXSxcblx0d2lsbEluaXQ6IFtdLFxuXHRkaWRJbml0OiBbXSxcblx0d2lsbERpc3BsYXk6IFtdLFxuXHRkaWREaXNwbGF5OiBbXSxcblx0d2lsbFBvc3REaXNwbGF5OiBbXSxcblx0ZGlkUG9zdERpc3BsYXk6IFtdLCBcblx0d2lsbFJlbW92ZTogW10sXG5cdGRpZFJlbW92ZTogW11cbn07XG5cbnZhciBkZWZhdWx0Q29uZmlnID0ge1xuXHRhcHBlbmQ6IFwibGFzdFwiXG59O1xuXG4vLyAtLS0tLS0tLS0gUHVibGljIEFQSXMgLS0tLS0tLS0tIC8vXG5mdW5jdGlvbiBob29rKG5hbWUsIGZ1bil7XG5cdGhvb2tzW25hbWVdLnB1c2goZnVuKTtcbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXIobmFtZSwgY29udHJvbGxlciwgY29uZmlnKXtcblx0dmFyIHZpZXdEZWYgPSB7XG5cdFx0bmFtZTogbmFtZSxcblx0XHRjb250cm9sbGVyOiBjb250cm9sbGVyLFxuXHRcdGNvbmZpZzogY29uZmlnXG5cdH07IFxuXG5cdHZpZXdEZWZEaWNbbmFtZV0gPSB2aWV3RGVmO1xufVxuXG5mdW5jdGlvbiBkaXNwbGF5KG5hbWUsIHBhcmVudEVsLCBkYXRhLCBjb25maWcpe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0dmFyIHZpZXcgPSBkb0luc3RhbnRpYXRlKG5hbWUsIGNvbmZpZyk7XG5cdFxuXHRyZXR1cm4gZG9DcmVhdGUodmlldywgZGF0YSlcblx0LnRoZW4oZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gZG9Jbml0KHZpZXcsIGRhdGEpO1xuXHR9KVxuXHQudGhlbihmdW5jdGlvbigpe1xuXHRcdHJldHVybiBkb0Rpc3BsYXkuY2FsbChzZWxmLCB2aWV3LCBwYXJlbnRFbCwgZGF0YSk7XG5cdH0pXG5cdC50aGVuKGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIGRvUG9zdERpc3BsYXkodmlldywgZGF0YSk7XG5cdH0pO1xuXG59XG5cbmZ1bmN0aW9uIGVtcHR5KGVscyl7XG5cdHV0aWxzLmFzQXJyYXkoZWxzKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXtcblx0XHRyZW1vdmVFbChlbCwgdHJ1ZSk7IC8vIHRydWUgdG8gc2F5IGNoaWxkcmVuT25seVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlKGVscyl7XG5cdHV0aWxzLmFzQXJyYXkoZWxzKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXtcblx0XHRyZW1vdmVFbChlbCk7XG5cdH0pO1xufVxuLy8gLS0tLS0tLS0tIC9QdWJsaWMgQVBJcyAtLS0tLS0tLS0gLy9cblxuLy8gd2lsbCByZW1vdmUgYSBlbCBvciBpdHMgY2hpbGRyZW5cbmZ1bmN0aW9uIHJlbW92ZUVsKGVsLCBjaGlsZHJlbk9ubHkpe1xuXHRjaGlsZHJlbk9ubHkgPSAoY2hpbGRyZW5Pbmx5ID09PSB0cnVlKSA7XG5cblx0Ly8vLyBGaXJzdCB3ZSByZW1vdmUvZGVzdG9yeSB0aGUgc3ViIHZpZXdzXG5cdHZhciBjaGlsZHJlblZpZXdFbHMgPSB1dGlscy5hc0FycmF5KGRvbS5hbGwoZWwsIFwiLmQtdmlld1wiKSk7XG5cblx0Ly8gUmV2ZXJzZSBpdCB0byByZW1vdmUvZGVzdHJveSBmcm9tIHRoZSBsZWFmXG5cdHZhciB2aWV3RWxzID0gY2hpbGRyZW5WaWV3RWxzLnJldmVyc2UoKTtcblxuXHQvLyBjYWxsIGRvUmVtb3ZlIG9uIGVhY2ggdmlldyB0byBoYXZlIHRoZSBsaWZlY3ljbGUgcGVyZm9ybWVkICh3aWxsUmVtb3ZlL2RpZFJlbW92ZSwgLmRlc3Ryb3kpXG5cdHZpZXdFbHMuZm9yRWFjaChmdW5jdGlvbih2aWV3RWwpe1xuXHRcdGlmICh2aWV3RWwuX3ZpZXcpe1xuXHRcdFx0ZG9SZW1vdmUodmlld0VsLl92aWV3KTtcdFxuXHRcdH1lbHNle1xuXHRcdFx0Ly8gd2Ugc2hvdWxkIG5vdCBiZSBoZXJlLCBidXQgc29tZWhvdyBpdCBoYXBwZW5zIGluIHNvbWUgYXBwIGNvZGUgKGxvZ2dpbiB3YXJubmluZylcblx0XHRcdGNvbnNvbGUubG9nKFwiTVZET00gLSBXQVJOSU5HIC0gdGhlIGZvbGxvd2luZyBkb20gZWxlbWVudCBzaG91bGQgaGF2ZSBhIC5fdmlldyBwcm9wZXJ0eSBidXQgaXQgaXMgbm90PyAoc2FmZSBpZ25vcmUpXCIsIHZpZXdFbCk7XG5cdFx0XHQvLyBOT1RFOiB3ZSBkbyBub3QgbmVlZCB0byByZW1vdmUgdGhlIGRvbSBlbGVtZW50IGFzIGl0IHdpbGwgYmUgdGFrZW4gY2FyZSBieSB0aGUgbG9naWMgYmVsb3cgKGF2b2lkaW5nIHVuY2Vzc2FyeSBkb20gcmVtb3ZlKVxuXHRcdH1cblx0XHRcblx0fSk7XG5cblx0Ly8gaWYgaXQgaXMgcmVtb3Zpbmcgb25seSB0aGUgY2hpbGRyZW4sIHRoZW4sIGxldCdzIG1ha2Ugc3VyZSB0aGF0IGFsbCBkaXJlY3QgY2hpbGRyZW4gZWxlbWVudHMgYXJlIHJlbW92ZWRcblx0Ly8gKGFzIHRoZSBsb2dpYyBhYm92ZSBvbmx5IHJlbW92ZSB0aGUgdmlld0VsKVxuXHRpZiAoY2hpbGRyZW5Pbmx5KXtcblx0XHQvLyBUaGVuLCB3ZSBjYW4gcmVtb3ZlIGFsbCBvZiB0aGUgZC5cblx0XHR3aGlsZSAoZWwubGFzdENoaWxkKSB7XG5cdFx0XHRlbC5yZW1vdmVDaGlsZChlbC5sYXN0Q2hpbGQpO1xuXHRcdH1cblx0fWVsc2V7XG5cdFx0Ly8gaWYgaXQgaXMgYSB2aWV3LCB3ZSByZW1vdmUgdGhlIHZpZXd3aXRoIGRvUmVtb3ZlXG5cdFx0aWYgKGVsLl92aWV3KXtcblx0XHRcdGRvUmVtb3ZlKGVsLl92aWV3KTtcblx0XHR9ZWxzZXtcblx0XHRcdGlmIChlbC5wYXJlbnROb2RlKXtcblx0XHRcdFx0ZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbCk7XHRcblx0XHRcdH1cdFx0XHRcblx0XHR9XG5cdH1cblxufVxuXG5cblxuLy8gcmV0dXJuIHRoZSBcInZpZXdcIiBpbnN0YW5jZVxuLy8gVE9ETzogbmVlZCB0byBiZSBhc3luYyBhcyB3ZWxsIGFuZCBhbGxvd2VkIGZvciBsb2FkaW5nIGNvbXBvbmVudCBpZiBub3QgZXhpc3RcbmZ1bmN0aW9uIGRvSW5zdGFudGlhdGUobmFtZSwgY29uZmlnKXtcblxuXHQvLyBpZiB0aGUgY29uZmlnIGlzIGEgc3RyaW5nLCB0aGVuIGFzc3VtZSBpdCBpcyB0aGUgYXBwZW5kIGRpcmVjdGl2ZS5cblx0aWYgKHR5cGVvZiBjb25maWcgPT09IFwic3RyaW5nXCIpe1xuXHRcdGNvbmZpZyA9IHthcHBlbmQ6IGNvbmZpZ307XG5cdH1cblxuXG5cdC8vIGdldCB0aGUgdmlldyBkZWYgZnJvbSB0aGUgZGljdGlvbmFyeVxuXHR2YXIgdmlld0RlZiA9IHZpZXdEZWZEaWNbbmFtZV07XG5cblx0Ly8gaWYgdmlld0RlZiBub3QgZm91bmQsIHRocm93IGFuIGV4Y2VwdGlvbiAoUHJvYmFibHkgbm90IHJlZ2lzdGVyZWQpXG5cdGlmICghdmlld0RlZil7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwibXZkb20gRVJST1IgLSBWaWV3IGRlZmluaXRpb24gZm9yICdcIiArIG5hbWUgKyBcIicgbm90IGZvdW5kLiBNYWtlIHN1cmUgdG8gY2FsbCBkLnJlZ2lzdGVyKHZpZXdOYW1lLCB2aWV3Q29udHJvbGxlcikuXCIpO1xuXHR9XG5cblx0Ly8gaW5zdGFudGlhdGUgdGhlIHZpZXcgaW5zdGFuY2Vcblx0dmFyIHZpZXcgPSBPYmplY3QuYXNzaWduKHt9LCB2aWV3RGVmLmNvbnRyb2xsZXIpO1xuXG5cdC8vIHNldCB0aGUgY29uZmlnXG5cdHZpZXcuY29uZmlnID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdENvbmZpZywgdmlld0RlZi5jb25maWcsIGNvbmZpZyk7XG5cblx0Ly8gc2V0IHRoZSBpZFxuXHR2aWV3LmlkID0gdmlld0lkU2VxKys7XG5cblx0Ly8gc2V0IHRoZSBuYW1lXG5cdHZpZXcubmFtZSA9IG5hbWU7XG5cblx0cmV0dXJuIHZpZXc7XG59XG5cbi8vIHJldHVybiBhIHByb21pc2UgdGhhdCByZXNvbHZlIHdpdGggbm90aGluZy5cbmZ1bmN0aW9uIGRvQ3JlYXRlKHZpZXcsIGRhdGEpe1xuXHRwZXJmb3JtSG9vayhcIndpbGxDcmVhdGVcIiwgdmlldyk7XG5cblx0Ly8gQ2FsbCB0aGUgdmlldy5jcmVhdGVcblx0dmFyIHAgPSBQcm9taXNlLnJlc29sdmUodmlldy5jcmVhdGUoZGF0YSkpO1xuXG5cdHJldHVybiBwLnRoZW4oZnVuY3Rpb24oaHRtbF9vcl9ub2RlKXtcblxuXHRcdHZhciBub2RlID0gKHR5cGVvZiBodG1sX29yX25vZGUgPT09IFwic3RyaW5nXCIpP2RvbS5mcmFnKGh0bWxfb3Jfbm9kZSk6aHRtbF9vcl9ub2RlO1xuXG5cdFx0Ly8gSWYgd2UgaGF2ZSBhIGZyYWd1bWVudFxuXHRcdGlmIChub2RlLm5vZGVUeXBlID09PSAxMSl7XG5cdFx0XHRpZiAobm9kZS5jaGlsZE5vZGVzLmxlbmd0aCA+IDEpe1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIm12ZG9tIC0gV0FSTklORyAtIHZpZXcgSFRNTCBmb3Igdmlld1wiLCB2aWV3LCBcImhhcyBtdWx0aXBsZSBjaGlsZE5vZGVzLCBidXQgc2hvdWxkIGhhdmUgb25seSBvbmUuIEZhbGxiYWNrIGJ5IHRha2luZyB0aGUgZmlyc3Qgb25lLCBidXQgY2hlY2sgY29kZS5cIik7XG5cdFx0XHR9XG5cdFx0XHRub2RlID0gbm9kZS5maXJzdENoaWxkO1xuXHRcdH1cblxuXHRcdC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSBub2RlIGlzIG9mIHRpbWUgRWxlbWVudFxuXHRcdGlmIChub2RlLm5vZGVUeXBlICE9PSAxKXtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcImVsIGZvciB2aWV3IFwiICsgdmlldy5uYW1lICsgXCIgaXMgbm9kZSBvZiB0eXBlIEVsZW1lbnQuIFwiICsgbm9kZSk7XG5cdFx0fVxuXG5cdFx0dmFyIHZpZXdFbCA9IG5vZGU7XG5cblx0XHQvLyBzZXQgdGhlIHZpZXcuZWwgYW5kIHZpZXcuZWwuX3ZpZXdcblx0XHR2aWV3LmVsID0gdmlld0VsO1xuXHRcdHZpZXcuZWwuY2xhc3NMaXN0LmFkZChcImQtdmlld1wiKTtcblx0XHR2aWV3LmVsLl92aWV3ID0gdmlldzsgXG5cblx0XHRwZXJmb3JtSG9vayhcImRpZENyZWF0ZVwiLCB2aWV3KTtcdFxuXHR9KTtcbn1cblxuZnVuY3Rpb24gZG9Jbml0KHZpZXcsIGRhdGEpe1xuXHRwZXJmb3JtSG9vayhcIndpbGxJbml0XCIsIHZpZXcpO1xuXHR2YXIgcmVzO1xuXG5cdGlmICh2aWV3LmluaXQpe1xuXHRcdHJlcyA9IHZpZXcuaW5pdChkYXRhKTtcblx0fVxuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlcykudGhlbihmdW5jdGlvbigpe1xuXHRcdHBlcmZvcm1Ib29rKFwiZGlkSW5pdFwiLCB2aWV3KTtcdFxuXHR9KTtcbn1cblxuZnVuY3Rpb24gZG9EaXNwbGF5KHZpZXcsIHJlZkVsLCBkYXRhKXtcblx0cGVyZm9ybUhvb2soXCJ3aWxsRGlzcGxheVwiLCB2aWV3KTtcblxuXHR0cnl7XHRcdFxuXHRcdC8vIFdPUktBUk9VTkQ6IHRoaXMgbmVlZHMgdG9iZSB0aGUgbXZkb20sIHNpbmNlIHdlIGhhdmUgY3ljbGljIHJlZmVyZW5jZSBiZXR3ZWVuIGRvbS5qcyBhbmQgdmlldy5qcyAob24gZW1wdHkpXG5cdFx0ZG9tLmFwcGVuZC5jYWxsKHRoaXMsIHJlZkVsLCB2aWV3LmVsLCB2aWV3LmNvbmZpZy5hcHBlbmQpO1xuXHR9Y2F0Y2goZXgpe1xuXHRcdHRocm93IG5ldyBFcnJvcihcIm12ZG9tIEVSUk9SIC0gQ2Fubm90IGFkZCB2aWV3LmVsIFwiICsgdmlldy5lbCArIFwiIHRvIHJlZkVsIFwiICsgcmVmRWwgKyBcIi4gQ2F1c2U6IFwiICsgZXgudG9TdHJpbmcoKSk7XG5cdH1cblxuXHRwZXJmb3JtSG9vayhcImRpZERpc3BsYXlcIiwgdmlldyk7XG5cblx0cmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIGZhaWwpe1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdHJlc29sdmUoKTtcblx0XHR9LDApO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gZG9Qb3N0RGlzcGxheSh2aWV3LCBkYXRhKXtcblx0cGVyZm9ybUhvb2soXCJ3aWxsUG9zdERpc3BsYXlcIiwgdmlldyk7XG5cblx0dmFyIHJlc3VsdDtcblx0aWYgKHZpZXcucG9zdERpc3BsYXkpe1xuXHRcdHJlc3VsdCA9IHZpZXcucG9zdERpc3BsYXkoZGF0YSk7XG5cdH1cblxuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCkudGhlbihmdW5jdGlvbigpe1xuXHRcdHJldHVybiB2aWV3O1xuXHR9KTtcblxufVxuXG5mdW5jdGlvbiBkb1JlbW92ZSh2aWV3KXtcblx0Ly8gTm90ZTogb24gd2lsbFJlbW92ZSBhbGwgb2YgdGhlIGV2ZW50cyBib3VuZCB0byBkb2N1bWVudHMsIHdpbmRvdywgcGFyZW50RWxlbWVudHMsIGh1YnMgd2lsbCBiZSB1bmJpbmQuXG5cdHBlcmZvcm1Ib29rKFwid2lsbFJlbW92ZVwiLCB2aWV3KTtcblxuXHQvLyByZW1vdmUgaXQgZnJvbSB0aGUgRE9NXG5cdC8vIE5PVEU6IHRoaXMgbWVhbnMgdGhhdCB0aGUgZGV0YWNoIHdvbid0IHJlbW92ZSB0aGUgbm9kZSBmcm9tIHRoZSBET01cblx0Ly8gICAgICAgd2hpY2ggYXZvaWQgcmVtb3ZpbmcgdW5jZXNzYXJ5IG5vZGUsIGJ1dCBtZWFucyB0aGF0IGRpZERldGFjaCB3aWxsXG5cdC8vICAgICAgIHN0aWxsIGhhdmUgYSB2aWV3LmVsIGluIHRoZSBET01cblx0dmFyIHBhcmVudEVsO1xuXHRpZiAodmlldy5lbCAmJiB2aWV3LmVsLnBhcmVudE5vZGUpe1xuXHRcdHBhcmVudEVsID0gdmlldy5lbC5wYXJlbnROb2RlO1xuXHRcdHZpZXcuZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh2aWV3LmVsKTtcblx0fVx0XG5cblx0Ly8gd2UgY2FsbCBcblx0aWYgKHZpZXcuZGVzdHJveSl7XG5cdFx0dmlldy5kZXN0cm95KHtwYXJlbnRFbDpwYXJlbnRFbH0pO1xuXHR9XG5cdFxuXHRwZXJmb3JtSG9vayhcImRpZFJlbW92ZVwiLCB2aWV3KTtcbn1cblxuXG5mdW5jdGlvbiBwZXJmb3JtSG9vayhuYW1lLCB2aWV3KXtcblx0dmFyIGhvb2tGdW5zID0gaG9va3NbbmFtZV07XG5cdHZhciBpPSAwICwgbCA9IGhvb2tGdW5zLmxlbmd0aCwgZnVuO1xuXHRmb3IgKDsgaSA8IGw7IGkrKyl7XG5cdFx0ZnVuID0gaG9va0Z1bnNbaV07XG5cdFx0ZnVuKHZpZXcpO1xuXHR9XG59XG5cblxuIiwiLy8gbWluaW1hbCBsaWJyYXJ5IGVudHJ5IHBvaW50LlxyXG5cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LW1pbmltYWxcIik7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgcHJvdG9idWYgPSBleHBvcnRzO1xyXG5cclxuLyoqXHJcbiAqIEJ1aWxkIHR5cGUsIG9uZSBvZiBgXCJmdWxsXCJgLCBgXCJsaWdodFwiYCBvciBgXCJtaW5pbWFsXCJgLlxyXG4gKiBAbmFtZSBidWlsZFxyXG4gKiBAdHlwZSB7c3RyaW5nfVxyXG4gKiBAY29uc3RcclxuICovXHJcbnByb3RvYnVmLmJ1aWxkID0gXCJtaW5pbWFsXCI7XHJcblxyXG4vLyBTZXJpYWxpemF0aW9uXHJcbnByb3RvYnVmLldyaXRlciAgICAgICA9IHJlcXVpcmUoXCIuL3dyaXRlclwiKTtcclxucHJvdG9idWYuQnVmZmVyV3JpdGVyID0gcmVxdWlyZShcIi4vd3JpdGVyX2J1ZmZlclwiKTtcclxucHJvdG9idWYuUmVhZGVyICAgICAgID0gcmVxdWlyZShcIi4vcmVhZGVyXCIpO1xyXG5wcm90b2J1Zi5CdWZmZXJSZWFkZXIgPSByZXF1aXJlKFwiLi9yZWFkZXJfYnVmZmVyXCIpO1xyXG5cclxuLy8gVXRpbGl0eVxyXG5wcm90b2J1Zi51dGlsICAgICAgICAgPSByZXF1aXJlKFwiLi91dGlsL21pbmltYWxcIik7XHJcbnByb3RvYnVmLnJwYyAgICAgICAgICA9IHJlcXVpcmUoXCIuL3JwY1wiKTtcclxucHJvdG9idWYucm9vdHMgICAgICAgID0gcmVxdWlyZShcIi4vcm9vdHNcIik7XHJcbnByb3RvYnVmLmNvbmZpZ3VyZSAgICA9IGNvbmZpZ3VyZTtcclxuXHJcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbi8qKlxyXG4gKiBSZWNvbmZpZ3VyZXMgdGhlIGxpYnJhcnkgYWNjb3JkaW5nIHRvIHRoZSBlbnZpcm9ubWVudC5cclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcbmZ1bmN0aW9uIGNvbmZpZ3VyZSgpIHtcclxuICAgIHByb3RvYnVmLlJlYWRlci5fY29uZmlndXJlKHByb3RvYnVmLkJ1ZmZlclJlYWRlcik7XHJcbiAgICBwcm90b2J1Zi51dGlsLl9jb25maWd1cmUoKTtcclxufVxyXG5cclxuLy8gQ29uZmlndXJlIHNlcmlhbGl6YXRpb25cclxucHJvdG9idWYuV3JpdGVyLl9jb25maWd1cmUocHJvdG9idWYuQnVmZmVyV3JpdGVyKTtcclxuY29uZmlndXJlKCk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWRlcjtcclxuXHJcbnZhciB1dGlsICAgICAgPSByZXF1aXJlKFwiLi91dGlsL21pbmltYWxcIik7XHJcblxyXG52YXIgQnVmZmVyUmVhZGVyOyAvLyBjeWNsaWNcclxuXHJcbnZhciBMb25nQml0cyAgPSB1dGlsLkxvbmdCaXRzLFxyXG4gICAgdXRmOCAgICAgID0gdXRpbC51dGY4O1xyXG5cclxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuZnVuY3Rpb24gaW5kZXhPdXRPZlJhbmdlKHJlYWRlciwgd3JpdGVMZW5ndGgpIHtcclxuICAgIHJldHVybiBSYW5nZUVycm9yKFwiaW5kZXggb3V0IG9mIHJhbmdlOiBcIiArIHJlYWRlci5wb3MgKyBcIiArIFwiICsgKHdyaXRlTGVuZ3RoIHx8IDEpICsgXCIgPiBcIiArIHJlYWRlci5sZW4pO1xyXG59XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyByZWFkZXIgaW5zdGFuY2UgdXNpbmcgdGhlIHNwZWNpZmllZCBidWZmZXIuXHJcbiAqIEBjbGFzc2Rlc2MgV2lyZSBmb3JtYXQgcmVhZGVyIHVzaW5nIGBVaW50OEFycmF5YCBpZiBhdmFpbGFibGUsIG90aGVyd2lzZSBgQXJyYXlgLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgQnVmZmVyIHRvIHJlYWQgZnJvbVxyXG4gKi9cclxuZnVuY3Rpb24gUmVhZGVyKGJ1ZmZlcikge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVhZCBidWZmZXIuXHJcbiAgICAgKiBAdHlwZSB7VWludDhBcnJheX1cclxuICAgICAqL1xyXG4gICAgdGhpcy5idWYgPSBidWZmZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWFkIGJ1ZmZlciBwb3NpdGlvbi5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMucG9zID0gMDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlYWQgYnVmZmVyIGxlbmd0aC5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubGVuID0gYnVmZmVyLmxlbmd0aDtcclxufVxyXG5cclxudmFyIGNyZWF0ZV9hcnJheSA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSBcInVuZGVmaW5lZFwiXHJcbiAgICA/IGZ1bmN0aW9uIGNyZWF0ZV90eXBlZF9hcnJheShidWZmZXIpIHtcclxuICAgICAgICBpZiAoYnVmZmVyIGluc3RhbmNlb2YgVWludDhBcnJheSB8fCBBcnJheS5pc0FycmF5KGJ1ZmZlcikpXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVhZGVyKGJ1ZmZlcik7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJpbGxlZ2FsIGJ1ZmZlclwiKTtcclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICA6IGZ1bmN0aW9uIGNyZWF0ZV9hcnJheShidWZmZXIpIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShidWZmZXIpKVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlYWRlcihidWZmZXIpO1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiaWxsZWdhbCBidWZmZXJcIik7XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgcmVhZGVyIHVzaW5nIHRoZSBzcGVjaWZpZWQgYnVmZmVyLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtVaW50OEFycmF5fEJ1ZmZlcn0gYnVmZmVyIEJ1ZmZlciB0byByZWFkIGZyb21cclxuICogQHJldHVybnMge1JlYWRlcnxCdWZmZXJSZWFkZXJ9IEEge0BsaW5rIEJ1ZmZlclJlYWRlcn0gaWYgYGJ1ZmZlcmAgaXMgYSBCdWZmZXIsIG90aGVyd2lzZSBhIHtAbGluayBSZWFkZXJ9XHJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBgYnVmZmVyYCBpcyBub3QgYSB2YWxpZCBidWZmZXJcclxuICovXHJcblJlYWRlci5jcmVhdGUgPSB1dGlsLkJ1ZmZlclxyXG4gICAgPyBmdW5jdGlvbiBjcmVhdGVfYnVmZmVyX3NldHVwKGJ1ZmZlcikge1xyXG4gICAgICAgIHJldHVybiAoUmVhZGVyLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZV9idWZmZXIoYnVmZmVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1dGlsLkJ1ZmZlci5pc0J1ZmZlcihidWZmZXIpXHJcbiAgICAgICAgICAgICAgICA/IG5ldyBCdWZmZXJSZWFkZXIoYnVmZmVyKVxyXG4gICAgICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICAgICAgICAgIDogY3JlYXRlX2FycmF5KGJ1ZmZlcik7XHJcbiAgICAgICAgfSkoYnVmZmVyKTtcclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICA6IGNyZWF0ZV9hcnJheTtcclxuXHJcblJlYWRlci5wcm90b3R5cGUuX3NsaWNlID0gdXRpbC5BcnJheS5wcm90b3R5cGUuc3ViYXJyYXkgfHwgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gdXRpbC5BcnJheS5wcm90b3R5cGUuc2xpY2U7XHJcblxyXG4vKipcclxuICogUmVhZHMgYSB2YXJpbnQgYXMgYW4gdW5zaWduZWQgMzIgYml0IHZhbHVlLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS51aW50MzIgPSAoZnVuY3Rpb24gcmVhZF91aW50MzJfc2V0dXAoKSB7XHJcbiAgICB2YXIgdmFsdWUgPSA0Mjk0OTY3Mjk1OyAvLyBvcHRpbWl6ZXIgdHlwZS1oaW50LCB0ZW5kcyB0byBkZW9wdCBvdGhlcndpc2UgKD8hKVxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJlYWRfdWludDMyKCkge1xyXG4gICAgICAgIHZhbHVlID0gKCAgICAgICAgIHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNyAgICAgICApID4+PiAwOyBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB2YWx1ZSA9ICh2YWx1ZSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8ICA3KSA+Pj4gMDsgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KSByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgdmFsdWUgPSAodmFsdWUgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCAxNCkgPj4+IDA7IGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOCkgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIHZhbHVlID0gKHZhbHVlIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgMjEpID4+PiAwOyBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB2YWx1ZSA9ICh2YWx1ZSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAgMTUpIDw8IDI4KSA+Pj4gMDsgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KSByZXR1cm4gdmFsdWU7XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgICAgIGlmICgodGhpcy5wb3MgKz0gNSkgPiB0aGlzLmxlbikge1xyXG4gICAgICAgICAgICB0aGlzLnBvcyA9IHRoaXMubGVuO1xyXG4gICAgICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgMTApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgdmFyaW50IGFzIGEgc2lnbmVkIDMyIGJpdCB2YWx1ZS5cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5pbnQzMiA9IGZ1bmN0aW9uIHJlYWRfaW50MzIoKSB7XHJcbiAgICByZXR1cm4gdGhpcy51aW50MzIoKSB8IDA7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgYSB6aWctemFnIGVuY29kZWQgdmFyaW50IGFzIGEgc2lnbmVkIDMyIGJpdCB2YWx1ZS5cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5zaW50MzIgPSBmdW5jdGlvbiByZWFkX3NpbnQzMigpIHtcclxuICAgIHZhciB2YWx1ZSA9IHRoaXMudWludDMyKCk7XHJcbiAgICByZXR1cm4gdmFsdWUgPj4+IDEgXiAtKHZhbHVlICYgMSkgfCAwO1xyXG59O1xyXG5cclxuLyogZXNsaW50LWRpc2FibGUgbm8taW52YWxpZC10aGlzICovXHJcblxyXG5mdW5jdGlvbiByZWFkTG9uZ1ZhcmludCgpIHtcclxuICAgIC8vIHRlbmRzIHRvIGRlb3B0IHdpdGggbG9jYWwgdmFycyBmb3Igb2N0ZXQgZXRjLlxyXG4gICAgdmFyIGJpdHMgPSBuZXcgTG9uZ0JpdHMoMCwgMCk7XHJcbiAgICB2YXIgaSA9IDA7XHJcbiAgICBpZiAodGhpcy5sZW4gLSB0aGlzLnBvcyA+IDQpIHsgLy8gZmFzdCByb3V0ZSAobG8pXHJcbiAgICAgICAgZm9yICg7IGkgPCA0OyArK2kpIHtcclxuICAgICAgICAgICAgLy8gMXN0Li40dGhcclxuICAgICAgICAgICAgYml0cy5sbyA9IChiaXRzLmxvIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgaSAqIDcpID4+PiAwO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYml0cztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gNXRoXHJcbiAgICAgICAgYml0cy5sbyA9IChiaXRzLmxvIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgMjgpID4+PiAwO1xyXG4gICAgICAgIGJpdHMuaGkgPSAoYml0cy5oaSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpID4+ICA0KSA+Pj4gMDtcclxuICAgICAgICBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpXHJcbiAgICAgICAgICAgIHJldHVybiBiaXRzO1xyXG4gICAgICAgIGkgPSAwO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBmb3IgKDsgaSA8IDM7ICsraSkge1xyXG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICAgICAgaWYgKHRoaXMucG9zID49IHRoaXMubGVuKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMpO1xyXG4gICAgICAgICAgICAvLyAxc3QuLjN0aFxyXG4gICAgICAgICAgICBiaXRzLmxvID0gKGJpdHMubG8gfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCBpICogNykgPj4+IDA7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOClcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaXRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyA0dGhcclxuICAgICAgICBiaXRzLmxvID0gKGJpdHMubG8gfCAodGhpcy5idWZbdGhpcy5wb3MrK10gJiAxMjcpIDw8IGkgKiA3KSA+Pj4gMDtcclxuICAgICAgICByZXR1cm4gYml0cztcclxuICAgIH1cclxuICAgIGlmICh0aGlzLmxlbiAtIHRoaXMucG9zID4gNCkgeyAvLyBmYXN0IHJvdXRlIChoaSlcclxuICAgICAgICBmb3IgKDsgaSA8IDU7ICsraSkge1xyXG4gICAgICAgICAgICAvLyA2dGguLjEwdGhcclxuICAgICAgICAgICAgYml0cy5oaSA9IChiaXRzLmhpIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgaSAqIDcgKyAzKSA+Pj4gMDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpdHM7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBmb3IgKDsgaSA8IDU7ICsraSkge1xyXG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICAgICAgaWYgKHRoaXMucG9zID49IHRoaXMubGVuKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMpO1xyXG4gICAgICAgICAgICAvLyA2dGguLjEwdGhcclxuICAgICAgICAgICAgYml0cy5oaSA9IChiaXRzLmhpIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgaSAqIDcgKyAzKSA+Pj4gMDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpdHM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIHRocm93IEVycm9yKFwiaW52YWxpZCB2YXJpbnQgZW5jb2RpbmdcIik7XHJcbn1cclxuXHJcbi8qIGVzbGludC1lbmFibGUgbm8taW52YWxpZC10aGlzICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSB2YXJpbnQgYXMgYSBzaWduZWQgNjQgYml0IHZhbHVlLlxyXG4gKiBAbmFtZSBSZWFkZXIjaW50NjRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtMb25nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgdmFyaW50IGFzIGFuIHVuc2lnbmVkIDY0IGJpdCB2YWx1ZS5cclxuICogQG5hbWUgUmVhZGVyI3VpbnQ2NFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0xvbmd9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSB6aWctemFnIGVuY29kZWQgdmFyaW50IGFzIGEgc2lnbmVkIDY0IGJpdCB2YWx1ZS5cclxuICogQG5hbWUgUmVhZGVyI3NpbnQ2NFxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0xvbmd9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSB2YXJpbnQgYXMgYSBib29sZWFuLlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5ib29sID0gZnVuY3Rpb24gcmVhZF9ib29sKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudWludDMyKCkgIT09IDA7XHJcbn07XHJcblxyXG5mdW5jdGlvbiByZWFkRml4ZWQzMl9lbmQoYnVmLCBlbmQpIHsgLy8gbm90ZSB0aGF0IHRoaXMgdXNlcyBgZW5kYCwgbm90IGBwb3NgXHJcbiAgICByZXR1cm4gKGJ1ZltlbmQgLSA0XVxyXG4gICAgICAgICAgfCBidWZbZW5kIC0gM10gPDwgOFxyXG4gICAgICAgICAgfCBidWZbZW5kIC0gMl0gPDwgMTZcclxuICAgICAgICAgIHwgYnVmW2VuZCAtIDFdIDw8IDI0KSA+Pj4gMDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGZpeGVkIDMyIGJpdHMgYXMgYW4gdW5zaWduZWQgMzIgYml0IGludGVnZXIuXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuZml4ZWQzMiA9IGZ1bmN0aW9uIHJlYWRfZml4ZWQzMigpIHtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICh0aGlzLnBvcyArIDQgPiB0aGlzLmxlbilcclxuICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgNCk7XHJcblxyXG4gICAgcmV0dXJuIHJlYWRGaXhlZDMyX2VuZCh0aGlzLmJ1ZiwgdGhpcy5wb3MgKz0gNCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgZml4ZWQgMzIgYml0cyBhcyBhIHNpZ25lZCAzMiBiaXQgaW50ZWdlci5cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5zZml4ZWQzMiA9IGZ1bmN0aW9uIHJlYWRfc2ZpeGVkMzIoKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAodGhpcy5wb3MgKyA0ID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDQpO1xyXG5cclxuICAgIHJldHVybiByZWFkRml4ZWQzMl9lbmQodGhpcy5idWYsIHRoaXMucG9zICs9IDQpIHwgMDtcclxufTtcclxuXHJcbi8qIGVzbGludC1kaXNhYmxlIG5vLWludmFsaWQtdGhpcyAqL1xyXG5cclxuZnVuY3Rpb24gcmVhZEZpeGVkNjQoLyogdGhpczogUmVhZGVyICovKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAodGhpcy5wb3MgKyA4ID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDgpO1xyXG5cclxuICAgIHJldHVybiBuZXcgTG9uZ0JpdHMocmVhZEZpeGVkMzJfZW5kKHRoaXMuYnVmLCB0aGlzLnBvcyArPSA0KSwgcmVhZEZpeGVkMzJfZW5kKHRoaXMuYnVmLCB0aGlzLnBvcyArPSA0KSk7XHJcbn1cclxuXHJcbi8qIGVzbGludC1lbmFibGUgbm8taW52YWxpZC10aGlzICovXHJcblxyXG4vKipcclxuICogUmVhZHMgZml4ZWQgNjQgYml0cy5cclxuICogQG5hbWUgUmVhZGVyI2ZpeGVkNjRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtMb25nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIHppZy16YWcgZW5jb2RlZCBmaXhlZCA2NCBiaXRzLlxyXG4gKiBAbmFtZSBSZWFkZXIjc2ZpeGVkNjRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtMb25nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgZmxvYXQgKDMyIGJpdCkgYXMgYSBudW1iZXIuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLmZsb2F0ID0gZnVuY3Rpb24gcmVhZF9mbG9hdCgpIHtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICh0aGlzLnBvcyArIDQgPiB0aGlzLmxlbilcclxuICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgNCk7XHJcblxyXG4gICAgdmFyIHZhbHVlID0gdXRpbC5mbG9hdC5yZWFkRmxvYXRMRSh0aGlzLmJ1ZiwgdGhpcy5wb3MpO1xyXG4gICAgdGhpcy5wb3MgKz0gNDtcclxuICAgIHJldHVybiB2YWx1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIGRvdWJsZSAoNjQgYml0IGZsb2F0KSBhcyBhIG51bWJlci5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuZG91YmxlID0gZnVuY3Rpb24gcmVhZF9kb3VibGUoKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAodGhpcy5wb3MgKyA4ID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDQpO1xyXG5cclxuICAgIHZhciB2YWx1ZSA9IHV0aWwuZmxvYXQucmVhZERvdWJsZUxFKHRoaXMuYnVmLCB0aGlzLnBvcyk7XHJcbiAgICB0aGlzLnBvcyArPSA4O1xyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgc2VxdWVuY2Ugb2YgYnl0ZXMgcHJlY2VlZGVkIGJ5IGl0cyBsZW5ndGggYXMgYSB2YXJpbnQuXHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLmJ5dGVzID0gZnVuY3Rpb24gcmVhZF9ieXRlcygpIHtcclxuICAgIHZhciBsZW5ndGggPSB0aGlzLnVpbnQzMigpLFxyXG4gICAgICAgIHN0YXJ0ICA9IHRoaXMucG9zLFxyXG4gICAgICAgIGVuZCAgICA9IHRoaXMucG9zICsgbGVuZ3RoO1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKGVuZCA+IHRoaXMubGVuKVxyXG4gICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCBsZW5ndGgpO1xyXG5cclxuICAgIHRoaXMucG9zICs9IGxlbmd0aDtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuYnVmKSkgLy8gcGxhaW4gYXJyYXlcclxuICAgICAgICByZXR1cm4gdGhpcy5idWYuc2xpY2Uoc3RhcnQsIGVuZCk7XHJcbiAgICByZXR1cm4gc3RhcnQgPT09IGVuZCAvLyBmaXggZm9yIElFIDEwL1dpbjggYW5kIG90aGVycycgc3ViYXJyYXkgcmV0dXJuaW5nIGFycmF5IG9mIHNpemUgMVxyXG4gICAgICAgID8gbmV3IHRoaXMuYnVmLmNvbnN0cnVjdG9yKDApXHJcbiAgICAgICAgOiB0aGlzLl9zbGljZS5jYWxsKHRoaXMuYnVmLCBzdGFydCwgZW5kKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHN0cmluZyBwcmVjZWVkZWQgYnkgaXRzIGJ5dGUgbGVuZ3RoIGFzIGEgdmFyaW50LlxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLnN0cmluZyA9IGZ1bmN0aW9uIHJlYWRfc3RyaW5nKCkge1xyXG4gICAgdmFyIGJ5dGVzID0gdGhpcy5ieXRlcygpO1xyXG4gICAgcmV0dXJuIHV0ZjgucmVhZChieXRlcywgMCwgYnl0ZXMubGVuZ3RoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTa2lwcyB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBieXRlcyBpZiBzcGVjaWZpZWQsIG90aGVyd2lzZSBza2lwcyBhIHZhcmludC5cclxuICogQHBhcmFtIHtudW1iZXJ9IFtsZW5ndGhdIExlbmd0aCBpZiBrbm93biwgb3RoZXJ3aXNlIGEgdmFyaW50IGlzIGFzc3VtZWRcclxuICogQHJldHVybnMge1JlYWRlcn0gYHRoaXNgXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLnNraXAgPSBmdW5jdGlvbiBza2lwKGxlbmd0aCkge1xyXG4gICAgaWYgKHR5cGVvZiBsZW5ndGggPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICBpZiAodGhpcy5wb3MgKyBsZW5ndGggPiB0aGlzLmxlbilcclxuICAgICAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIGxlbmd0aCk7XHJcbiAgICAgICAgdGhpcy5wb3MgKz0gbGVuZ3RoO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5sZW4pXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcyk7XHJcbiAgICAgICAgfSB3aGlsZSAodGhpcy5idWZbdGhpcy5wb3MrK10gJiAxMjgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogU2tpcHMgdGhlIG5leHQgZWxlbWVudCBvZiB0aGUgc3BlY2lmaWVkIHdpcmUgdHlwZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IHdpcmVUeXBlIFdpcmUgdHlwZSByZWNlaXZlZFxyXG4gKiBAcmV0dXJucyB7UmVhZGVyfSBgdGhpc2BcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuc2tpcFR5cGUgPSBmdW5jdGlvbih3aXJlVHlwZSkge1xyXG4gICAgc3dpdGNoICh3aXJlVHlwZSkge1xyXG4gICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgdGhpcy5za2lwKCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgdGhpcy5za2lwKDgpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgIHRoaXMuc2tpcCh0aGlzLnVpbnQzMigpKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICBkbyB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc3RhbnQtY29uZGl0aW9uXHJcbiAgICAgICAgICAgICAgICBpZiAoKHdpcmVUeXBlID0gdGhpcy51aW50MzIoKSAmIDcpID09PSA0KVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5za2lwVHlwZSh3aXJlVHlwZSk7XHJcbiAgICAgICAgICAgIH0gd2hpbGUgKHRydWUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDU6XHJcbiAgICAgICAgICAgIHRoaXMuc2tpcCg0KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJpbnZhbGlkIHdpcmUgdHlwZSBcIiArIHdpcmVUeXBlICsgXCIgYXQgb2Zmc2V0IFwiICsgdGhpcy5wb3MpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5SZWFkZXIuX2NvbmZpZ3VyZSA9IGZ1bmN0aW9uKEJ1ZmZlclJlYWRlcl8pIHtcclxuICAgIEJ1ZmZlclJlYWRlciA9IEJ1ZmZlclJlYWRlcl87XHJcblxyXG4gICAgdmFyIGZuID0gdXRpbC5Mb25nID8gXCJ0b0xvbmdcIiA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIFwidG9OdW1iZXJcIjtcclxuICAgIHV0aWwubWVyZ2UoUmVhZGVyLnByb3RvdHlwZSwge1xyXG5cclxuICAgICAgICBpbnQ2NDogZnVuY3Rpb24gcmVhZF9pbnQ2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWRMb25nVmFyaW50LmNhbGwodGhpcylbZm5dKGZhbHNlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB1aW50NjQ6IGZ1bmN0aW9uIHJlYWRfdWludDY0KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVhZExvbmdWYXJpbnQuY2FsbCh0aGlzKVtmbl0odHJ1ZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2ludDY0OiBmdW5jdGlvbiByZWFkX3NpbnQ2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWRMb25nVmFyaW50LmNhbGwodGhpcykuenpEZWNvZGUoKVtmbl0oZmFsc2UpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZpeGVkNjQ6IGZ1bmN0aW9uIHJlYWRfZml4ZWQ2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWRGaXhlZDY0LmNhbGwodGhpcylbZm5dKHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNmaXhlZDY0OiBmdW5jdGlvbiByZWFkX3NmaXhlZDY0KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVhZEZpeGVkNjQuY2FsbCh0aGlzKVtmbl0oZmFsc2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gQnVmZmVyUmVhZGVyO1xyXG5cclxuLy8gZXh0ZW5kcyBSZWFkZXJcclxudmFyIFJlYWRlciA9IHJlcXVpcmUoXCIuL3JlYWRlclwiKTtcclxuKEJ1ZmZlclJlYWRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlYWRlci5wcm90b3R5cGUpKS5jb25zdHJ1Y3RvciA9IEJ1ZmZlclJlYWRlcjtcclxuXHJcbnZhciB1dGlsID0gcmVxdWlyZShcIi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgYnVmZmVyIHJlYWRlciBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBXaXJlIGZvcm1hdCByZWFkZXIgdXNpbmcgbm9kZSBidWZmZXJzLlxyXG4gKiBAZXh0ZW5kcyBSZWFkZXJcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7QnVmZmVyfSBidWZmZXIgQnVmZmVyIHRvIHJlYWQgZnJvbVxyXG4gKi9cclxuZnVuY3Rpb24gQnVmZmVyUmVhZGVyKGJ1ZmZlcikge1xyXG4gICAgUmVhZGVyLmNhbGwodGhpcywgYnVmZmVyKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlYWQgYnVmZmVyLlxyXG4gICAgICogQG5hbWUgQnVmZmVyUmVhZGVyI2J1ZlxyXG4gICAgICogQHR5cGUge0J1ZmZlcn1cclxuICAgICAqL1xyXG59XHJcblxyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xyXG5pZiAodXRpbC5CdWZmZXIpXHJcbiAgICBCdWZmZXJSZWFkZXIucHJvdG90eXBlLl9zbGljZSA9IHV0aWwuQnVmZmVyLnByb3RvdHlwZS5zbGljZTtcclxuXHJcbi8qKlxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcbkJ1ZmZlclJlYWRlci5wcm90b3R5cGUuc3RyaW5nID0gZnVuY3Rpb24gcmVhZF9zdHJpbmdfYnVmZmVyKCkge1xyXG4gICAgdmFyIGxlbiA9IHRoaXMudWludDMyKCk7IC8vIG1vZGlmaWVzIHBvc1xyXG4gICAgcmV0dXJuIHRoaXMuYnVmLnV0ZjhTbGljZSh0aGlzLnBvcywgdGhpcy5wb3MgPSBNYXRoLm1pbih0aGlzLnBvcyArIGxlbiwgdGhpcy5sZW4pKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHNlcXVlbmNlIG9mIGJ5dGVzIHByZWNlZWRlZCBieSBpdHMgbGVuZ3RoIGFzIGEgdmFyaW50LlxyXG4gKiBAbmFtZSBCdWZmZXJSZWFkZXIjYnl0ZXNcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IHt9O1xyXG5cclxuLyoqXHJcbiAqIE5hbWVkIHJvb3RzLlxyXG4gKiBUaGlzIGlzIHdoZXJlIHBianMgc3RvcmVzIGdlbmVyYXRlZCBzdHJ1Y3R1cmVzICh0aGUgb3B0aW9uIGAtciwgLS1yb290YCBzcGVjaWZpZXMgYSBuYW1lKS5cclxuICogQ2FuIGFsc28gYmUgdXNlZCBtYW51YWxseSB0byBtYWtlIHJvb3RzIGF2YWlsYWJsZSBhY2Nyb3NzIG1vZHVsZXMuXHJcbiAqIEBuYW1lIHJvb3RzXHJcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZyxSb290Pn1cclxuICogQGV4YW1wbGVcclxuICogLy8gcGJqcyAtciBteXJvb3QgLW8gY29tcGlsZWQuanMgLi4uXHJcbiAqXHJcbiAqIC8vIGluIGFub3RoZXIgbW9kdWxlOlxyXG4gKiByZXF1aXJlKFwiLi9jb21waWxlZC5qc1wiKTtcclxuICpcclxuICogLy8gaW4gYW55IHN1YnNlcXVlbnQgbW9kdWxlOlxyXG4gKiB2YXIgcm9vdCA9IHByb3RvYnVmLnJvb3RzW1wibXlyb290XCJdO1xyXG4gKi9cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogU3RyZWFtaW5nIFJQQyBoZWxwZXJzLlxyXG4gKiBAbmFtZXNwYWNlXHJcbiAqL1xyXG52YXIgcnBjID0gZXhwb3J0cztcclxuXHJcbi8qKlxyXG4gKiBSUEMgaW1wbGVtZW50YXRpb24gcGFzc2VkIHRvIHtAbGluayBTZXJ2aWNlI2NyZWF0ZX0gcGVyZm9ybWluZyBhIHNlcnZpY2UgcmVxdWVzdCBvbiBuZXR3b3JrIGxldmVsLCBpLmUuIGJ5IHV0aWxpemluZyBodHRwIHJlcXVlc3RzIG9yIHdlYnNvY2tldHMuXHJcbiAqIEB0eXBlZGVmIFJQQ0ltcGxcclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge01ldGhvZHxycGMuU2VydmljZU1ldGhvZDxNZXNzYWdlPHt9PixNZXNzYWdlPHt9Pj59IG1ldGhvZCBSZWZsZWN0ZWQgb3Igc3RhdGljIG1ldGhvZCBiZWluZyBjYWxsZWRcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSByZXF1ZXN0RGF0YSBSZXF1ZXN0IGRhdGFcclxuICogQHBhcmFtIHtSUENJbXBsQ2FsbGJhY2t9IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqIEBleGFtcGxlXHJcbiAqIGZ1bmN0aW9uIHJwY0ltcGwobWV0aG9kLCByZXF1ZXN0RGF0YSwgY2FsbGJhY2spIHtcclxuICogICAgIGlmIChwcm90b2J1Zi51dGlsLmxjRmlyc3QobWV0aG9kLm5hbWUpICE9PSBcIm15TWV0aG9kXCIpIC8vIGNvbXBhdGlibGUgd2l0aCBzdGF0aWMgY29kZVxyXG4gKiAgICAgICAgIHRocm93IEVycm9yKFwibm8gc3VjaCBtZXRob2RcIik7XHJcbiAqICAgICBhc3luY2hyb25vdXNseU9idGFpbkFSZXNwb25zZShyZXF1ZXN0RGF0YSwgZnVuY3Rpb24oZXJyLCByZXNwb25zZURhdGEpIHtcclxuICogICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3BvbnNlRGF0YSk7XHJcbiAqICAgICB9KTtcclxuICogfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBOb2RlLXN0eWxlIGNhbGxiYWNrIGFzIHVzZWQgYnkge0BsaW5rIFJQQ0ltcGx9LlxyXG4gKiBAdHlwZWRlZiBSUENJbXBsQ2FsbGJhY2tcclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge0Vycm9yfG51bGx9IGVycm9yIEVycm9yLCBpZiBhbnksIG90aGVyd2lzZSBgbnVsbGBcclxuICogQHBhcmFtIHtVaW50OEFycmF5fG51bGx9IFtyZXNwb25zZV0gUmVzcG9uc2UgZGF0YSBvciBgbnVsbGAgdG8gc2lnbmFsIGVuZCBvZiBzdHJlYW0sIGlmIHRoZXJlIGhhc24ndCBiZWVuIGFuIGVycm9yXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxucnBjLlNlcnZpY2UgPSByZXF1aXJlKFwiLi9ycGMvc2VydmljZVwiKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gU2VydmljZTtcclxuXHJcbnZhciB1dGlsID0gcmVxdWlyZShcIi4uL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbi8vIEV4dGVuZHMgRXZlbnRFbWl0dGVyXHJcbihTZXJ2aWNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUodXRpbC5FdmVudEVtaXR0ZXIucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBTZXJ2aWNlO1xyXG5cclxuLyoqXHJcbiAqIEEgc2VydmljZSBtZXRob2QgY2FsbGJhY2sgYXMgdXNlZCBieSB7QGxpbmsgcnBjLlNlcnZpY2VNZXRob2R8U2VydmljZU1ldGhvZH0uXHJcbiAqXHJcbiAqIERpZmZlcnMgZnJvbSB7QGxpbmsgUlBDSW1wbENhbGxiYWNrfSBpbiB0aGF0IGl0IGlzIGFuIGFjdHVhbCBjYWxsYmFjayBvZiBhIHNlcnZpY2UgbWV0aG9kIHdoaWNoIG1heSBub3QgcmV0dXJuIGByZXNwb25zZSA9IG51bGxgLlxyXG4gKiBAdHlwZWRlZiBycGMuU2VydmljZU1ldGhvZENhbGxiYWNrXHJcbiAqIEB0ZW1wbGF0ZSBUUmVzIGV4dGVuZHMgTWVzc2FnZTxUUmVzPlxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7RXJyb3J8bnVsbH0gZXJyb3IgRXJyb3IsIGlmIGFueVxyXG4gKiBAcGFyYW0ge1RSZXN9IFtyZXNwb25zZV0gUmVzcG9uc2UgbWVzc2FnZVxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIHNlcnZpY2UgbWV0aG9kIHBhcnQgb2YgYSB7QGxpbmsgcnBjLlNlcnZpY2V9IGFzIGNyZWF0ZWQgYnkge0BsaW5rIFNlcnZpY2UuY3JlYXRlfS5cclxuICogQHR5cGVkZWYgcnBjLlNlcnZpY2VNZXRob2RcclxuICogQHRlbXBsYXRlIFRSZXEgZXh0ZW5kcyBNZXNzYWdlPFRSZXE+XHJcbiAqIEB0ZW1wbGF0ZSBUUmVzIGV4dGVuZHMgTWVzc2FnZTxUUmVzPlxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7VFJlcXxQcm9wZXJ0aWVzPFRSZXE+fSByZXF1ZXN0IFJlcXVlc3QgbWVzc2FnZSBvciBwbGFpbiBvYmplY3RcclxuICogQHBhcmFtIHtycGMuU2VydmljZU1ldGhvZENhbGxiYWNrPFRSZXM+fSBbY2FsbGJhY2tdIE5vZGUtc3R5bGUgY2FsbGJhY2sgY2FsbGVkIHdpdGggdGhlIGVycm9yLCBpZiBhbnksIGFuZCB0aGUgcmVzcG9uc2UgbWVzc2FnZVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxNZXNzYWdlPFRSZXM+Pn0gUHJvbWlzZSBpZiBgY2FsbGJhY2tgIGhhcyBiZWVuIG9taXR0ZWQsIG90aGVyd2lzZSBgdW5kZWZpbmVkYFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IFJQQyBzZXJ2aWNlIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIEFuIFJQQyBzZXJ2aWNlIGFzIHJldHVybmVkIGJ5IHtAbGluayBTZXJ2aWNlI2NyZWF0ZX0uXHJcbiAqIEBleHBvcnRzIHJwYy5TZXJ2aWNlXHJcbiAqIEBleHRlbmRzIHV0aWwuRXZlbnRFbWl0dGVyXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge1JQQ0ltcGx9IHJwY0ltcGwgUlBDIGltcGxlbWVudGF0aW9uXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JlcXVlc3REZWxpbWl0ZWQ9ZmFsc2VdIFdoZXRoZXIgcmVxdWVzdHMgYXJlIGxlbmd0aC1kZWxpbWl0ZWRcclxuICogQHBhcmFtIHtib29sZWFufSBbcmVzcG9uc2VEZWxpbWl0ZWQ9ZmFsc2VdIFdoZXRoZXIgcmVzcG9uc2VzIGFyZSBsZW5ndGgtZGVsaW1pdGVkXHJcbiAqL1xyXG5mdW5jdGlvbiBTZXJ2aWNlKHJwY0ltcGwsIHJlcXVlc3REZWxpbWl0ZWQsIHJlc3BvbnNlRGVsaW1pdGVkKSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBycGNJbXBsICE9PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwicnBjSW1wbCBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XHJcblxyXG4gICAgdXRpbC5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJQQyBpbXBsZW1lbnRhdGlvbi4gQmVjb21lcyBgbnVsbGAgb25jZSB0aGUgc2VydmljZSBpcyBlbmRlZC5cclxuICAgICAqIEB0eXBlIHtSUENJbXBsfG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMucnBjSW1wbCA9IHJwY0ltcGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHJlcXVlc3RzIGFyZSBsZW5ndGgtZGVsaW1pdGVkLlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHRoaXMucmVxdWVzdERlbGltaXRlZCA9IEJvb2xlYW4ocmVxdWVzdERlbGltaXRlZCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHJlc3BvbnNlcyBhcmUgbGVuZ3RoLWRlbGltaXRlZC5cclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlc3BvbnNlRGVsaW1pdGVkID0gQm9vbGVhbihyZXNwb25zZURlbGltaXRlZCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDYWxscyBhIHNlcnZpY2UgbWV0aG9kIHRocm91Z2gge0BsaW5rIHJwYy5TZXJ2aWNlI3JwY0ltcGx8cnBjSW1wbH0uXHJcbiAqIEBwYXJhbSB7TWV0aG9kfHJwYy5TZXJ2aWNlTWV0aG9kPFRSZXEsVFJlcz59IG1ldGhvZCBSZWZsZWN0ZWQgb3Igc3RhdGljIG1ldGhvZFxyXG4gKiBAcGFyYW0ge0NvbnN0cnVjdG9yPFRSZXE+fSByZXF1ZXN0Q3RvciBSZXF1ZXN0IGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7Q29uc3RydWN0b3I8VFJlcz59IHJlc3BvbnNlQ3RvciBSZXNwb25zZSBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge1RSZXF8UHJvcGVydGllczxUUmVxPn0gcmVxdWVzdCBSZXF1ZXN0IG1lc3NhZ2Ugb3IgcGxhaW4gb2JqZWN0XHJcbiAqIEBwYXJhbSB7cnBjLlNlcnZpY2VNZXRob2RDYWxsYmFjazxUUmVzPn0gY2FsbGJhY2sgU2VydmljZSBjYWxsYmFja1xyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKiBAdGVtcGxhdGUgVFJlcSBleHRlbmRzIE1lc3NhZ2U8VFJlcT5cclxuICogQHRlbXBsYXRlIFRSZXMgZXh0ZW5kcyBNZXNzYWdlPFRSZXM+XHJcbiAqL1xyXG5TZXJ2aWNlLnByb3RvdHlwZS5ycGNDYWxsID0gZnVuY3Rpb24gcnBjQ2FsbChtZXRob2QsIHJlcXVlc3RDdG9yLCByZXNwb25zZUN0b3IsIHJlcXVlc3QsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgaWYgKCFyZXF1ZXN0KVxyXG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcInJlcXVlc3QgbXVzdCBiZSBzcGVjaWZpZWRcIik7XHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgaWYgKCFjYWxsYmFjaylcclxuICAgICAgICByZXR1cm4gdXRpbC5hc1Byb21pc2UocnBjQ2FsbCwgc2VsZiwgbWV0aG9kLCByZXF1ZXN0Q3RvciwgcmVzcG9uc2VDdG9yLCByZXF1ZXN0KTtcclxuXHJcbiAgICBpZiAoIXNlbGYucnBjSW1wbCkge1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKEVycm9yKFwiYWxyZWFkeSBlbmRlZFwiKSk7IH0sIDApO1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gc2VsZi5ycGNJbXBsKFxyXG4gICAgICAgICAgICBtZXRob2QsXHJcbiAgICAgICAgICAgIHJlcXVlc3RDdG9yW3NlbGYucmVxdWVzdERlbGltaXRlZCA/IFwiZW5jb2RlRGVsaW1pdGVkXCIgOiBcImVuY29kZVwiXShyZXF1ZXN0KS5maW5pc2goKSxcclxuICAgICAgICAgICAgZnVuY3Rpb24gcnBjQ2FsbGJhY2soZXJyLCByZXNwb25zZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmVtaXQoXCJlcnJvclwiLCBlcnIsIG1ldGhvZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbmQoLyogZW5kZWRCeVJQQyAqLyB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghKHJlc3BvbnNlIGluc3RhbmNlb2YgcmVzcG9uc2VDdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gcmVzcG9uc2VDdG9yW3NlbGYucmVzcG9uc2VEZWxpbWl0ZWQgPyBcImRlY29kZURlbGltaXRlZFwiIDogXCJkZWNvZGVcIl0ocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVtaXQoXCJlcnJvclwiLCBlcnIsIG1ldGhvZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmVtaXQoXCJkYXRhXCIsIHJlc3BvbnNlLCBtZXRob2QpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBzZWxmLmVtaXQoXCJlcnJvclwiLCBlcnIsIG1ldGhvZCk7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soZXJyKTsgfSwgMCk7XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBFbmRzIHRoaXMgc2VydmljZSBhbmQgZW1pdHMgdGhlIGBlbmRgIGV2ZW50LlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtlbmRlZEJ5UlBDPWZhbHNlXSBXaGV0aGVyIHRoZSBzZXJ2aWNlIGhhcyBiZWVuIGVuZGVkIGJ5IHRoZSBSUEMgaW1wbGVtZW50YXRpb24uXHJcbiAqIEByZXR1cm5zIHtycGMuU2VydmljZX0gYHRoaXNgXHJcbiAqL1xyXG5TZXJ2aWNlLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiBlbmQoZW5kZWRCeVJQQykge1xyXG4gICAgaWYgKHRoaXMucnBjSW1wbCkge1xyXG4gICAgICAgIGlmICghZW5kZWRCeVJQQykgLy8gc2lnbmFsIGVuZCB0byBycGNJbXBsXHJcbiAgICAgICAgICAgIHRoaXMucnBjSW1wbChudWxsLCBudWxsLCBudWxsKTtcclxuICAgICAgICB0aGlzLnJwY0ltcGwgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuZW1pdChcImVuZFwiKS5vZmYoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBMb25nQml0cztcclxuXHJcbnZhciB1dGlsID0gcmVxdWlyZShcIi4uL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIG5ldyBsb25nIGJpdHMuXHJcbiAqIEBjbGFzc2Rlc2MgSGVscGVyIGNsYXNzIGZvciB3b3JraW5nIHdpdGggdGhlIGxvdyBhbmQgaGlnaCBiaXRzIG9mIGEgNjQgYml0IHZhbHVlLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtudW1iZXJ9IGxvIExvdyAzMiBiaXRzLCB1bnNpZ25lZFxyXG4gKiBAcGFyYW0ge251bWJlcn0gaGkgSGlnaCAzMiBiaXRzLCB1bnNpZ25lZFxyXG4gKi9cclxuZnVuY3Rpb24gTG9uZ0JpdHMobG8sIGhpKSB7XHJcblxyXG4gICAgLy8gbm90ZSB0aGF0IHRoZSBjYXN0cyBiZWxvdyBhcmUgdGhlb3JldGljYWxseSB1bm5lY2Vzc2FyeSBhcyBvZiB0b2RheSwgYnV0IG9sZGVyIHN0YXRpY2FsbHlcclxuICAgIC8vIGdlbmVyYXRlZCBjb252ZXJ0ZXIgY29kZSBtaWdodCBzdGlsbCBjYWxsIHRoZSBjdG9yIHdpdGggc2lnbmVkIDMyYml0cy4ga2VwdCBmb3IgY29tcGF0LlxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTG93IGJpdHMuXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmxvID0gbG8gPj4+IDA7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIaWdoIGJpdHMuXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmhpID0gaGkgPj4+IDA7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBaZXJvIGJpdHMuXHJcbiAqIEBtZW1iZXJvZiB1dGlsLkxvbmdCaXRzXHJcbiAqIEB0eXBlIHt1dGlsLkxvbmdCaXRzfVxyXG4gKi9cclxudmFyIHplcm8gPSBMb25nQml0cy56ZXJvID0gbmV3IExvbmdCaXRzKDAsIDApO1xyXG5cclxuemVyby50b051bWJlciA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcclxuemVyby56ekVuY29kZSA9IHplcm8uenpEZWNvZGUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH07XHJcbnplcm8ubGVuZ3RoID0gZnVuY3Rpb24oKSB7IHJldHVybiAxOyB9O1xyXG5cclxuLyoqXHJcbiAqIFplcm8gaGFzaC5cclxuICogQG1lbWJlcm9mIHV0aWwuTG9uZ0JpdHNcclxuICogQHR5cGUge3N0cmluZ31cclxuICovXHJcbnZhciB6ZXJvSGFzaCA9IExvbmdCaXRzLnplcm9IYXNoID0gXCJcXDBcXDBcXDBcXDBcXDBcXDBcXDBcXDBcIjtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIG5ldyBsb25nIGJpdHMgZnJvbSB0aGUgc3BlY2lmaWVkIG51bWJlci5cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlXHJcbiAqIEByZXR1cm5zIHt1dGlsLkxvbmdCaXRzfSBJbnN0YW5jZVxyXG4gKi9cclxuTG9uZ0JpdHMuZnJvbU51bWJlciA9IGZ1bmN0aW9uIGZyb21OdW1iZXIodmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSA9PT0gMClcclxuICAgICAgICByZXR1cm4gemVybztcclxuICAgIHZhciBzaWduID0gdmFsdWUgPCAwO1xyXG4gICAgaWYgKHNpZ24pXHJcbiAgICAgICAgdmFsdWUgPSAtdmFsdWU7XHJcbiAgICB2YXIgbG8gPSB2YWx1ZSA+Pj4gMCxcclxuICAgICAgICBoaSA9ICh2YWx1ZSAtIGxvKSAvIDQyOTQ5NjcyOTYgPj4+IDA7XHJcbiAgICBpZiAoc2lnbikge1xyXG4gICAgICAgIGhpID0gfmhpID4+PiAwO1xyXG4gICAgICAgIGxvID0gfmxvID4+PiAwO1xyXG4gICAgICAgIGlmICgrK2xvID4gNDI5NDk2NzI5NSkge1xyXG4gICAgICAgICAgICBsbyA9IDA7XHJcbiAgICAgICAgICAgIGlmICgrK2hpID4gNDI5NDk2NzI5NSlcclxuICAgICAgICAgICAgICAgIGhpID0gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IExvbmdCaXRzKGxvLCBoaSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBuZXcgbG9uZyBiaXRzIGZyb20gYSBudW1iZXIsIGxvbmcgb3Igc3RyaW5nLlxyXG4gKiBAcGFyYW0ge0xvbmd8bnVtYmVyfHN0cmluZ30gdmFsdWUgVmFsdWVcclxuICogQHJldHVybnMge3V0aWwuTG9uZ0JpdHN9IEluc3RhbmNlXHJcbiAqL1xyXG5Mb25nQml0cy5mcm9tID0gZnVuY3Rpb24gZnJvbSh2YWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIilcclxuICAgICAgICByZXR1cm4gTG9uZ0JpdHMuZnJvbU51bWJlcih2YWx1ZSk7XHJcbiAgICBpZiAodXRpbC5pc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xyXG4gICAgICAgIGlmICh1dGlsLkxvbmcpXHJcbiAgICAgICAgICAgIHZhbHVlID0gdXRpbC5Mb25nLmZyb21TdHJpbmcodmFsdWUpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIExvbmdCaXRzLmZyb21OdW1iZXIocGFyc2VJbnQodmFsdWUsIDEwKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWUubG93IHx8IHZhbHVlLmhpZ2ggPyBuZXcgTG9uZ0JpdHModmFsdWUubG93ID4+PiAwLCB2YWx1ZS5oaWdoID4+PiAwKSA6IHplcm87XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBsb25nIGJpdHMgdG8gYSBwb3NzaWJseSB1bnNhZmUgSmF2YVNjcmlwdCBudW1iZXIuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Vuc2lnbmVkPWZhbHNlXSBXaGV0aGVyIHVuc2lnbmVkIG9yIG5vdFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBQb3NzaWJseSB1bnNhZmUgbnVtYmVyXHJcbiAqL1xyXG5Mb25nQml0cy5wcm90b3R5cGUudG9OdW1iZXIgPSBmdW5jdGlvbiB0b051bWJlcih1bnNpZ25lZCkge1xyXG4gICAgaWYgKCF1bnNpZ25lZCAmJiB0aGlzLmhpID4+PiAzMSkge1xyXG4gICAgICAgIHZhciBsbyA9IH50aGlzLmxvICsgMSA+Pj4gMCxcclxuICAgICAgICAgICAgaGkgPSB+dGhpcy5oaSAgICAgPj4+IDA7XHJcbiAgICAgICAgaWYgKCFsbylcclxuICAgICAgICAgICAgaGkgPSBoaSArIDEgPj4+IDA7XHJcbiAgICAgICAgcmV0dXJuIC0obG8gKyBoaSAqIDQyOTQ5NjcyOTYpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMubG8gKyB0aGlzLmhpICogNDI5NDk2NzI5NjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyB0aGlzIGxvbmcgYml0cyB0byBhIGxvbmcuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Vuc2lnbmVkPWZhbHNlXSBXaGV0aGVyIHVuc2lnbmVkIG9yIG5vdFxyXG4gKiBAcmV0dXJucyB7TG9uZ30gTG9uZ1xyXG4gKi9cclxuTG9uZ0JpdHMucHJvdG90eXBlLnRvTG9uZyA9IGZ1bmN0aW9uIHRvTG9uZyh1bnNpZ25lZCkge1xyXG4gICAgcmV0dXJuIHV0aWwuTG9uZ1xyXG4gICAgICAgID8gbmV3IHV0aWwuTG9uZyh0aGlzLmxvIHwgMCwgdGhpcy5oaSB8IDAsIEJvb2xlYW4odW5zaWduZWQpKVxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgOiB7IGxvdzogdGhpcy5sbyB8IDAsIGhpZ2g6IHRoaXMuaGkgfCAwLCB1bnNpZ25lZDogQm9vbGVhbih1bnNpZ25lZCkgfTtcclxufTtcclxuXHJcbnZhciBjaGFyQ29kZUF0ID0gU3RyaW5nLnByb3RvdHlwZS5jaGFyQ29kZUF0O1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgbmV3IGxvbmcgYml0cyBmcm9tIHRoZSBzcGVjaWZpZWQgOCBjaGFyYWN0ZXJzIGxvbmcgaGFzaC5cclxuICogQHBhcmFtIHtzdHJpbmd9IGhhc2ggSGFzaFxyXG4gKiBAcmV0dXJucyB7dXRpbC5Mb25nQml0c30gQml0c1xyXG4gKi9cclxuTG9uZ0JpdHMuZnJvbUhhc2ggPSBmdW5jdGlvbiBmcm9tSGFzaChoYXNoKSB7XHJcbiAgICBpZiAoaGFzaCA9PT0gemVyb0hhc2gpXHJcbiAgICAgICAgcmV0dXJuIHplcm87XHJcbiAgICByZXR1cm4gbmV3IExvbmdCaXRzKFxyXG4gICAgICAgICggY2hhckNvZGVBdC5jYWxsKGhhc2gsIDApXHJcbiAgICAgICAgfCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgMSkgPDwgOFxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDIpIDw8IDE2XHJcbiAgICAgICAgfCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgMykgPDwgMjQpID4+PiAwXHJcbiAgICAsXHJcbiAgICAgICAgKCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgNClcclxuICAgICAgICB8IGNoYXJDb2RlQXQuY2FsbChoYXNoLCA1KSA8PCA4XHJcbiAgICAgICAgfCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgNikgPDwgMTZcclxuICAgICAgICB8IGNoYXJDb2RlQXQuY2FsbChoYXNoLCA3KSA8PCAyNCkgPj4+IDBcclxuICAgICk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBsb25nIGJpdHMgdG8gYSA4IGNoYXJhY3RlcnMgbG9uZyBoYXNoLlxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIYXNoXHJcbiAqL1xyXG5Mb25nQml0cy5wcm90b3R5cGUudG9IYXNoID0gZnVuY3Rpb24gdG9IYXNoKCkge1xyXG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoXHJcbiAgICAgICAgdGhpcy5sbyAgICAgICAgJiAyNTUsXHJcbiAgICAgICAgdGhpcy5sbyA+Pj4gOCAgJiAyNTUsXHJcbiAgICAgICAgdGhpcy5sbyA+Pj4gMTYgJiAyNTUsXHJcbiAgICAgICAgdGhpcy5sbyA+Pj4gMjQgICAgICAsXHJcbiAgICAgICAgdGhpcy5oaSAgICAgICAgJiAyNTUsXHJcbiAgICAgICAgdGhpcy5oaSA+Pj4gOCAgJiAyNTUsXHJcbiAgICAgICAgdGhpcy5oaSA+Pj4gMTYgJiAyNTUsXHJcbiAgICAgICAgdGhpcy5oaSA+Pj4gMjRcclxuICAgICk7XHJcbn07XHJcblxyXG4vKipcclxuICogWmlnLXphZyBlbmNvZGVzIHRoaXMgbG9uZyBiaXRzLlxyXG4gKiBAcmV0dXJucyB7dXRpbC5Mb25nQml0c30gYHRoaXNgXHJcbiAqL1xyXG5Mb25nQml0cy5wcm90b3R5cGUuenpFbmNvZGUgPSBmdW5jdGlvbiB6ekVuY29kZSgpIHtcclxuICAgIHZhciBtYXNrID0gICB0aGlzLmhpID4+IDMxO1xyXG4gICAgdGhpcy5oaSAgPSAoKHRoaXMuaGkgPDwgMSB8IHRoaXMubG8gPj4+IDMxKSBeIG1hc2spID4+PiAwO1xyXG4gICAgdGhpcy5sbyAgPSAoIHRoaXMubG8gPDwgMSAgICAgICAgICAgICAgICAgICBeIG1hc2spID4+PiAwO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogWmlnLXphZyBkZWNvZGVzIHRoaXMgbG9uZyBiaXRzLlxyXG4gKiBAcmV0dXJucyB7dXRpbC5Mb25nQml0c30gYHRoaXNgXHJcbiAqL1xyXG5Mb25nQml0cy5wcm90b3R5cGUuenpEZWNvZGUgPSBmdW5jdGlvbiB6ekRlY29kZSgpIHtcclxuICAgIHZhciBtYXNrID0gLSh0aGlzLmxvICYgMSk7XHJcbiAgICB0aGlzLmxvICA9ICgodGhpcy5sbyA+Pj4gMSB8IHRoaXMuaGkgPDwgMzEpIF4gbWFzaykgPj4+IDA7XHJcbiAgICB0aGlzLmhpICA9ICggdGhpcy5oaSA+Pj4gMSAgICAgICAgICAgICAgICAgIF4gbWFzaykgPj4+IDA7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggb2YgdGhpcyBsb25nYml0cyB3aGVuIGVuY29kZWQgYXMgYSB2YXJpbnQuXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IExlbmd0aFxyXG4gKi9cclxuTG9uZ0JpdHMucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uIGxlbmd0aCgpIHtcclxuICAgIHZhciBwYXJ0MCA9ICB0aGlzLmxvLFxyXG4gICAgICAgIHBhcnQxID0gKHRoaXMubG8gPj4+IDI4IHwgdGhpcy5oaSA8PCA0KSA+Pj4gMCxcclxuICAgICAgICBwYXJ0MiA9ICB0aGlzLmhpID4+PiAyNDtcclxuICAgIHJldHVybiBwYXJ0MiA9PT0gMFxyXG4gICAgICAgICA/IHBhcnQxID09PSAwXHJcbiAgICAgICAgICAgPyBwYXJ0MCA8IDE2Mzg0XHJcbiAgICAgICAgICAgICA/IHBhcnQwIDwgMTI4ID8gMSA6IDJcclxuICAgICAgICAgICAgIDogcGFydDAgPCAyMDk3MTUyID8gMyA6IDRcclxuICAgICAgICAgICA6IHBhcnQxIDwgMTYzODRcclxuICAgICAgICAgICAgID8gcGFydDEgPCAxMjggPyA1IDogNlxyXG4gICAgICAgICAgICAgOiBwYXJ0MSA8IDIwOTcxNTIgPyA3IDogOFxyXG4gICAgICAgICA6IHBhcnQyIDwgMTI4ID8gOSA6IDEwO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIHV0aWwgPSBleHBvcnRzO1xyXG5cclxuLy8gdXNlZCB0byByZXR1cm4gYSBQcm9taXNlIHdoZXJlIGNhbGxiYWNrIGlzIG9taXR0ZWRcclxudXRpbC5hc1Byb21pc2UgPSByZXF1aXJlKFwiQHByb3RvYnVmanMvYXNwcm9taXNlXCIpO1xyXG5cclxuLy8gY29udmVydHMgdG8gLyBmcm9tIGJhc2U2NCBlbmNvZGVkIHN0cmluZ3NcclxudXRpbC5iYXNlNjQgPSByZXF1aXJlKFwiQHByb3RvYnVmanMvYmFzZTY0XCIpO1xyXG5cclxuLy8gYmFzZSBjbGFzcyBvZiBycGMuU2VydmljZVxyXG51dGlsLkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9ldmVudGVtaXR0ZXJcIik7XHJcblxyXG4vLyBmbG9hdCBoYW5kbGluZyBhY2Nyb3NzIGJyb3dzZXJzXHJcbnV0aWwuZmxvYXQgPSByZXF1aXJlKFwiQHByb3RvYnVmanMvZmxvYXRcIik7XHJcblxyXG4vLyByZXF1aXJlcyBtb2R1bGVzIG9wdGlvbmFsbHkgYW5kIGhpZGVzIHRoZSBjYWxsIGZyb20gYnVuZGxlcnNcclxudXRpbC5pbnF1aXJlID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL2lucXVpcmVcIik7XHJcblxyXG4vLyBjb252ZXJ0cyB0byAvIGZyb20gdXRmOCBlbmNvZGVkIHN0cmluZ3NcclxudXRpbC51dGY4ID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL3V0ZjhcIik7XHJcblxyXG4vLyBwcm92aWRlcyBhIG5vZGUtbGlrZSBidWZmZXIgcG9vbCBpbiB0aGUgYnJvd3NlclxyXG51dGlsLnBvb2wgPSByZXF1aXJlKFwiQHByb3RvYnVmanMvcG9vbFwiKTtcclxuXHJcbi8vIHV0aWxpdHkgdG8gd29yayB3aXRoIHRoZSBsb3cgYW5kIGhpZ2ggYml0cyBvZiBhIDY0IGJpdCB2YWx1ZVxyXG51dGlsLkxvbmdCaXRzID0gcmVxdWlyZShcIi4vbG9uZ2JpdHNcIik7XHJcblxyXG4vKipcclxuICogQW4gaW1tdWFibGUgZW1wdHkgYXJyYXkuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEB0eXBlIHtBcnJheS48Kj59XHJcbiAqIEBjb25zdFxyXG4gKi9cclxudXRpbC5lbXB0eUFycmF5ID0gT2JqZWN0LmZyZWV6ZSA/IE9iamVjdC5mcmVlemUoW10pIDogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gW107IC8vIHVzZWQgb24gcHJvdG90eXBlc1xyXG5cclxuLyoqXHJcbiAqIEFuIGltbXV0YWJsZSBlbXB0eSBvYmplY3QuXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqIEBjb25zdFxyXG4gKi9cclxudXRpbC5lbXB0eU9iamVjdCA9IE9iamVjdC5mcmVlemUgPyBPYmplY3QuZnJlZXplKHt9KSA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIHt9OyAvLyB1c2VkIG9uIHByb3RvdHlwZXNcclxuXHJcbi8qKlxyXG4gKiBXaGV0aGVyIHJ1bm5pbmcgd2l0aGluIG5vZGUgb3Igbm90LlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAdHlwZSB7Ym9vbGVhbn1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmlzTm9kZSA9IEJvb2xlYW4oZ2xvYmFsLnByb2Nlc3MgJiYgZ2xvYmFsLnByb2Nlc3MudmVyc2lvbnMgJiYgZ2xvYmFsLnByb2Nlc3MudmVyc2lvbnMubm9kZSk7XHJcblxyXG4vKipcclxuICogVGVzdHMgaWYgdGhlIHNwZWNpZmllZCB2YWx1ZSBpcyBhbiBpbnRlZ2VyLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHsqfSB2YWx1ZSBWYWx1ZSB0byB0ZXN0XHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgdGhlIHZhbHVlIGlzIGFuIGludGVnZXJcclxuICovXHJcbnV0aWwuaXNJbnRlZ2VyID0gTnVtYmVyLmlzSW50ZWdlciB8fCAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBmdW5jdGlvbiBpc0ludGVnZXIodmFsdWUpIHtcclxuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgaXNGaW5pdGUodmFsdWUpICYmIE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGlzIGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0geyp9IHZhbHVlIFZhbHVlIHRvIHRlc3RcclxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgdmFsdWUgaXMgYSBzdHJpbmdcclxuICovXHJcbnV0aWwuaXNTdHJpbmcgPSBmdW5jdGlvbiBpc1N0cmluZyh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiB8fCB2YWx1ZSBpbnN0YW5jZW9mIFN0cmluZztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGlzIGEgbm9uLW51bGwgb2JqZWN0LlxyXG4gKiBAcGFyYW0geyp9IHZhbHVlIFZhbHVlIHRvIHRlc3RcclxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgdmFsdWUgaXMgYSBub24tbnVsbCBvYmplY3RcclxuICovXHJcbnV0aWwuaXNPYmplY3QgPSBmdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYSBwcm9wZXJ0eSBvbiBhIG1lc3NhZ2UgaXMgY29uc2lkZXJlZCB0byBiZSBwcmVzZW50LlxyXG4gKiBUaGlzIGlzIGFuIGFsaWFzIG9mIHtAbGluayB1dGlsLmlzU2V0fS5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogUGxhaW4gb2JqZWN0IG9yIG1lc3NhZ2UgaW5zdGFuY2VcclxuICogQHBhcmFtIHtzdHJpbmd9IHByb3AgUHJvcGVydHkgbmFtZVxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIGNvbnNpZGVyZWQgdG8gYmUgcHJlc2VudCwgb3RoZXJ3aXNlIGBmYWxzZWBcclxuICovXHJcbnV0aWwuaXNzZXQgPVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHByb3BlcnR5IG9uIGEgbWVzc2FnZSBpcyBjb25zaWRlcmVkIHRvIGJlIHByZXNlbnQuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogUGxhaW4gb2JqZWN0IG9yIG1lc3NhZ2UgaW5zdGFuY2VcclxuICogQHBhcmFtIHtzdHJpbmd9IHByb3AgUHJvcGVydHkgbmFtZVxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIGNvbnNpZGVyZWQgdG8gYmUgcHJlc2VudCwgb3RoZXJ3aXNlIGBmYWxzZWBcclxuICovXHJcbnV0aWwuaXNTZXQgPSBmdW5jdGlvbiBpc1NldChvYmosIHByb3ApIHtcclxuICAgIHZhciB2YWx1ZSA9IG9ialtwcm9wXTtcclxuICAgIGlmICh2YWx1ZSAhPSBudWxsICYmIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXEsIG5vLXByb3RvdHlwZS1idWlsdGluc1xyXG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIgfHwgKEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUubGVuZ3RoIDogT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aCkgPiAwO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFueSBjb21wYXRpYmxlIEJ1ZmZlciBpbnN0YW5jZS5cclxuICogVGhpcyBpcyBhIG1pbmltYWwgc3RhbmQtYWxvbmUgZGVmaW5pdGlvbiBvZiBhIEJ1ZmZlciBpbnN0YW5jZS4gVGhlIGFjdHVhbCB0eXBlIGlzIHRoYXQgZXhwb3J0ZWQgYnkgbm9kZSdzIHR5cGluZ3MuXHJcbiAqIEBpbnRlcmZhY2UgQnVmZmVyXHJcbiAqIEBleHRlbmRzIFVpbnQ4QXJyYXlcclxuICovXHJcblxyXG4vKipcclxuICogTm9kZSdzIEJ1ZmZlciBjbGFzcyBpZiBhdmFpbGFibGUuXHJcbiAqIEB0eXBlIHtDb25zdHJ1Y3RvcjxCdWZmZXI+fVxyXG4gKi9cclxudXRpbC5CdWZmZXIgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciBCdWZmZXIgPSB1dGlsLmlucXVpcmUoXCJidWZmZXJcIikuQnVmZmVyO1xyXG4gICAgICAgIC8vIHJlZnVzZSB0byB1c2Ugbm9uLW5vZGUgYnVmZmVycyBpZiBub3QgZXhwbGljaXRseSBhc3NpZ25lZCAocGVyZiByZWFzb25zKTpcclxuICAgICAgICByZXR1cm4gQnVmZmVyLnByb3RvdHlwZS51dGY4V3JpdGUgPyBCdWZmZXIgOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBudWxsO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn0pKCk7XHJcblxyXG4vLyBJbnRlcm5hbCBhbGlhcyBvZiBvciBwb2x5ZnVsbCBmb3IgQnVmZmVyLmZyb20uXHJcbnV0aWwuX0J1ZmZlcl9mcm9tID0gbnVsbDtcclxuXHJcbi8vIEludGVybmFsIGFsaWFzIG9mIG9yIHBvbHlmaWxsIGZvciBCdWZmZXIuYWxsb2NVbnNhZmUuXHJcbnV0aWwuX0J1ZmZlcl9hbGxvY1Vuc2FmZSA9IG51bGw7XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBidWZmZXIgb2Ygd2hhdGV2ZXIgdHlwZSBzdXBwb3J0ZWQgYnkgdGhlIGVudmlyb25tZW50LlxyXG4gKiBAcGFyYW0ge251bWJlcnxudW1iZXJbXX0gW3NpemVPckFycmF5PTBdIEJ1ZmZlciBzaXplIG9yIG51bWJlciBhcnJheVxyXG4gKiBAcmV0dXJucyB7VWludDhBcnJheXxCdWZmZXJ9IEJ1ZmZlclxyXG4gKi9cclxudXRpbC5uZXdCdWZmZXIgPSBmdW5jdGlvbiBuZXdCdWZmZXIoc2l6ZU9yQXJyYXkpIHtcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICByZXR1cm4gdHlwZW9mIHNpemVPckFycmF5ID09PSBcIm51bWJlclwiXHJcbiAgICAgICAgPyB1dGlsLkJ1ZmZlclxyXG4gICAgICAgICAgICA/IHV0aWwuX0J1ZmZlcl9hbGxvY1Vuc2FmZShzaXplT3JBcnJheSlcclxuICAgICAgICAgICAgOiBuZXcgdXRpbC5BcnJheShzaXplT3JBcnJheSlcclxuICAgICAgICA6IHV0aWwuQnVmZmVyXHJcbiAgICAgICAgICAgID8gdXRpbC5fQnVmZmVyX2Zyb20oc2l6ZU9yQXJyYXkpXHJcbiAgICAgICAgICAgIDogdHlwZW9mIFVpbnQ4QXJyYXkgPT09IFwidW5kZWZpbmVkXCJcclxuICAgICAgICAgICAgICAgID8gc2l6ZU9yQXJyYXlcclxuICAgICAgICAgICAgICAgIDogbmV3IFVpbnQ4QXJyYXkoc2l6ZU9yQXJyYXkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFycmF5IGltcGxlbWVudGF0aW9uIHVzZWQgaW4gdGhlIGJyb3dzZXIuIGBVaW50OEFycmF5YCBpZiBzdXBwb3J0ZWQsIG90aGVyd2lzZSBgQXJyYXlgLlxyXG4gKiBAdHlwZSB7Q29uc3RydWN0b3I8VWludDhBcnJheT59XHJcbiAqL1xyXG51dGlsLkFycmF5ID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCIgPyBVaW50OEFycmF5IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIDogQXJyYXk7XHJcblxyXG4vKipcclxuICogQW55IGNvbXBhdGlibGUgTG9uZyBpbnN0YW5jZS5cclxuICogVGhpcyBpcyBhIG1pbmltYWwgc3RhbmQtYWxvbmUgZGVmaW5pdGlvbiBvZiBhIExvbmcgaW5zdGFuY2UuIFRoZSBhY3R1YWwgdHlwZSBpcyB0aGF0IGV4cG9ydGVkIGJ5IGxvbmcuanMuXHJcbiAqIEBpbnRlcmZhY2UgTG9uZ1xyXG4gKiBAcHJvcGVydHkge251bWJlcn0gbG93IExvdyBiaXRzXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBoaWdoIEhpZ2ggYml0c1xyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHVuc2lnbmVkIFdoZXRoZXIgdW5zaWduZWQgb3Igbm90XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIExvbmcuanMncyBMb25nIGNsYXNzIGlmIGF2YWlsYWJsZS5cclxuICogQHR5cGUge0NvbnN0cnVjdG9yPExvbmc+fVxyXG4gKi9cclxudXRpbC5Mb25nID0gLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gZ2xvYmFsLmRjb2RlSU8gJiYgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gZ2xvYmFsLmRjb2RlSU8uTG9uZyB8fCB1dGlsLmlucXVpcmUoXCJsb25nXCIpO1xyXG5cclxuLyoqXHJcbiAqIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHZlcmlmeSAyIGJpdCAoYGJvb2xgKSBtYXAga2V5cy5cclxuICogQHR5cGUge1JlZ0V4cH1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmtleTJSZSA9IC9edHJ1ZXxmYWxzZXwwfDEkLztcclxuXHJcbi8qKlxyXG4gKiBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byB2ZXJpZnkgMzIgYml0IChgaW50MzJgIGV0Yy4pIG1hcCBrZXlzLlxyXG4gKiBAdHlwZSB7UmVnRXhwfVxyXG4gKiBAY29uc3RcclxuICovXHJcbnV0aWwua2V5MzJSZSA9IC9eLT8oPzowfFsxLTldWzAtOV0qKSQvO1xyXG5cclxuLyoqXHJcbiAqIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHZlcmlmeSA2NCBiaXQgKGBpbnQ2NGAgZXRjLikgbWFwIGtleXMuXHJcbiAqIEB0eXBlIHtSZWdFeHB9XHJcbiAqIEBjb25zdFxyXG4gKi9cclxudXRpbC5rZXk2NFJlID0gL14oPzpbXFxcXHgwMC1cXFxceGZmXXs4fXwtPyg/OjB8WzEtOV1bMC05XSopKSQvO1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIGEgbnVtYmVyIG9yIGxvbmcgdG8gYW4gOCBjaGFyYWN0ZXJzIGxvbmcgaGFzaCBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIGNvbnZlcnRcclxuICogQHJldHVybnMge3N0cmluZ30gSGFzaFxyXG4gKi9cclxudXRpbC5sb25nVG9IYXNoID0gZnVuY3Rpb24gbG9uZ1RvSGFzaCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlXHJcbiAgICAgICAgPyB1dGlsLkxvbmdCaXRzLmZyb20odmFsdWUpLnRvSGFzaCgpXHJcbiAgICAgICAgOiB1dGlsLkxvbmdCaXRzLnplcm9IYXNoO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIGFuIDggY2hhcmFjdGVycyBsb25nIGhhc2ggc3RyaW5nIHRvIGEgbG9uZyBvciBudW1iZXIuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBoYXNoIEhhc2hcclxuICogQHBhcmFtIHtib29sZWFufSBbdW5zaWduZWQ9ZmFsc2VdIFdoZXRoZXIgdW5zaWduZWQgb3Igbm90XHJcbiAqIEByZXR1cm5zIHtMb25nfG51bWJlcn0gT3JpZ2luYWwgdmFsdWVcclxuICovXHJcbnV0aWwubG9uZ0Zyb21IYXNoID0gZnVuY3Rpb24gbG9uZ0Zyb21IYXNoKGhhc2gsIHVuc2lnbmVkKSB7XHJcbiAgICB2YXIgYml0cyA9IHV0aWwuTG9uZ0JpdHMuZnJvbUhhc2goaGFzaCk7XHJcbiAgICBpZiAodXRpbC5Mb25nKVxyXG4gICAgICAgIHJldHVybiB1dGlsLkxvbmcuZnJvbUJpdHMoYml0cy5sbywgYml0cy5oaSwgdW5zaWduZWQpO1xyXG4gICAgcmV0dXJuIGJpdHMudG9OdW1iZXIoQm9vbGVhbih1bnNpZ25lZCkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1lcmdlcyB0aGUgcHJvcGVydGllcyBvZiB0aGUgc291cmNlIG9iamVjdCBpbnRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IGRzdCBEZXN0aW5hdGlvbiBvYmplY3RcclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gc3JjIFNvdXJjZSBvYmplY3RcclxuICogQHBhcmFtIHtib29sZWFufSBbaWZOb3RTZXQ9ZmFsc2VdIE1lcmdlcyBvbmx5IGlmIHRoZSBrZXkgaXMgbm90IGFscmVhZHkgc2V0XHJcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywqPn0gRGVzdGluYXRpb24gb2JqZWN0XHJcbiAqL1xyXG5mdW5jdGlvbiBtZXJnZShkc3QsIHNyYywgaWZOb3RTZXQpIHsgLy8gdXNlZCBieSBjb252ZXJ0ZXJzXHJcbiAgICBmb3IgKHZhciBrZXlzID0gT2JqZWN0LmtleXMoc3JjKSwgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKVxyXG4gICAgICAgIGlmIChkc3Rba2V5c1tpXV0gPT09IHVuZGVmaW5lZCB8fCAhaWZOb3RTZXQpXHJcbiAgICAgICAgICAgIGRzdFtrZXlzW2ldXSA9IHNyY1trZXlzW2ldXTtcclxuICAgIHJldHVybiBkc3Q7XHJcbn1cclxuXHJcbnV0aWwubWVyZ2UgPSBtZXJnZTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIGEgc3RyaW5nIHRvIGxvd2VyIGNhc2UuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgU3RyaW5nIHRvIGNvbnZlcnRcclxuICogQHJldHVybnMge3N0cmluZ30gQ29udmVydGVkIHN0cmluZ1xyXG4gKi9cclxudXRpbC5sY0ZpcnN0ID0gZnVuY3Rpb24gbGNGaXJzdChzdHIpIHtcclxuICAgIHJldHVybiBzdHIuY2hhckF0KDApLnRvTG93ZXJDYXNlKCkgKyBzdHIuc3Vic3RyaW5nKDEpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBjdXN0b20gZXJyb3IgY29uc3RydWN0b3IuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEVycm9yIG5hbWVcclxuICogQHJldHVybnMge0NvbnN0cnVjdG9yPEVycm9yPn0gQ3VzdG9tIGVycm9yIGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBuZXdFcnJvcihuYW1lKSB7XHJcblxyXG4gICAgZnVuY3Rpb24gQ3VzdG9tRXJyb3IobWVzc2FnZSwgcHJvcGVydGllcykge1xyXG5cclxuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ3VzdG9tRXJyb3IpKVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEN1c3RvbUVycm9yKG1lc3NhZ2UsIHByb3BlcnRpZXMpO1xyXG5cclxuICAgICAgICAvLyBFcnJvci5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xyXG4gICAgICAgIC8vIF4ganVzdCByZXR1cm5zIGEgbmV3IGVycm9yIGluc3RhbmNlIGJlY2F1c2UgdGhlIGN0b3IgY2FuIGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uXHJcblxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIm1lc3NhZ2VcIiwgeyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbWVzc2FnZTsgfSB9KTtcclxuXHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIC8vIG5vZGVcclxuICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgQ3VzdG9tRXJyb3IpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwic3RhY2tcIiwgeyB2YWx1ZTogKG5ldyBFcnJvcigpKS5zdGFjayB8fCBcIlwiIH0pO1xyXG5cclxuICAgICAgICBpZiAocHJvcGVydGllcylcclxuICAgICAgICAgICAgbWVyZ2UodGhpcywgcHJvcGVydGllcyk7XHJcbiAgICB9XHJcblxyXG4gICAgKEN1c3RvbUVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBDdXN0b21FcnJvcjtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ3VzdG9tRXJyb3IucHJvdG90eXBlLCBcIm5hbWVcIiwgeyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmFtZTsgfSB9KTtcclxuXHJcbiAgICBDdXN0b21FcnJvci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lICsgXCI6IFwiICsgdGhpcy5tZXNzYWdlO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQ3VzdG9tRXJyb3I7XHJcbn1cclxuXHJcbnV0aWwubmV3RXJyb3IgPSBuZXdFcnJvcjtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHByb3RvY29sIGVycm9yLlxyXG4gKiBAY2xhc3NkZXNjIEVycm9yIHN1YmNsYXNzIGluZGljYXRpbmcgYSBwcm90b2NvbCBzcGVjaWZjIGVycm9yLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAZXh0ZW5kcyBFcnJvclxyXG4gKiBAdGVtcGxhdGUgVCBleHRlbmRzIE1lc3NhZ2U8VD5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIEVycm9yIG1lc3NhZ2VcclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gW3Byb3BlcnRpZXNdIEFkZGl0aW9uYWwgcHJvcGVydGllc1xyXG4gKiBAZXhhbXBsZVxyXG4gKiB0cnkge1xyXG4gKiAgICAgTXlNZXNzYWdlLmRlY29kZShzb21lQnVmZmVyKTsgLy8gdGhyb3dzIGlmIHJlcXVpcmVkIGZpZWxkcyBhcmUgbWlzc2luZ1xyXG4gKiB9IGNhdGNoIChlKSB7XHJcbiAqICAgICBpZiAoZSBpbnN0YW5jZW9mIFByb3RvY29sRXJyb3IgJiYgZS5pbnN0YW5jZSlcclxuICogICAgICAgICBjb25zb2xlLmxvZyhcImRlY29kZWQgc28gZmFyOiBcIiArIEpTT04uc3RyaW5naWZ5KGUuaW5zdGFuY2UpKTtcclxuICogfVxyXG4gKi9cclxudXRpbC5Qcm90b2NvbEVycm9yID0gbmV3RXJyb3IoXCJQcm90b2NvbEVycm9yXCIpO1xyXG5cclxuLyoqXHJcbiAqIFNvIGZhciBkZWNvZGVkIG1lc3NhZ2UgaW5zdGFuY2UuXHJcbiAqIEBuYW1lIHV0aWwuUHJvdG9jb2xFcnJvciNpbnN0YW5jZVxyXG4gKiBAdHlwZSB7TWVzc2FnZTxUPn1cclxuICovXHJcblxyXG4vKipcclxuICogQSBPbmVPZiBnZXR0ZXIgYXMgcmV0dXJuZWQgYnkge0BsaW5rIHV0aWwub25lT2ZHZXR0ZXJ9LlxyXG4gKiBAdHlwZWRlZiBPbmVPZkdldHRlclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEByZXR1cm5zIHtzdHJpbmd8dW5kZWZpbmVkfSBTZXQgZmllbGQgbmFtZSwgaWYgYW55XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEJ1aWxkcyBhIGdldHRlciBmb3IgYSBvbmVvZidzIHByZXNlbnQgZmllbGQgbmFtZS5cclxuICogQHBhcmFtIHtzdHJpbmdbXX0gZmllbGROYW1lcyBGaWVsZCBuYW1lc1xyXG4gKiBAcmV0dXJucyB7T25lT2ZHZXR0ZXJ9IFVuYm91bmQgZ2V0dGVyXHJcbiAqL1xyXG51dGlsLm9uZU9mR2V0dGVyID0gZnVuY3Rpb24gZ2V0T25lT2YoZmllbGROYW1lcykge1xyXG4gICAgdmFyIGZpZWxkTWFwID0ge307XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkTmFtZXMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgZmllbGRNYXBbZmllbGROYW1lc1tpXV0gPSAxO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybnMge3N0cmluZ3x1bmRlZmluZWR9IFNldCBmaWVsZCBuYW1lLCBpZiBhbnlcclxuICAgICAqIEB0aGlzIE9iamVjdFxyXG4gICAgICogQGlnbm9yZVxyXG4gICAgICovXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29uc2lzdGVudC1yZXR1cm5cclxuICAgICAgICBmb3IgKHZhciBrZXlzID0gT2JqZWN0LmtleXModGhpcyksIGkgPSBrZXlzLmxlbmd0aCAtIDE7IGkgPiAtMTsgLS1pKVxyXG4gICAgICAgICAgICBpZiAoZmllbGRNYXBba2V5c1tpXV0gPT09IDEgJiYgdGhpc1trZXlzW2ldXSAhPT0gdW5kZWZpbmVkICYmIHRoaXNba2V5c1tpXV0gIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5c1tpXTtcclxuICAgIH07XHJcbn07XHJcblxyXG4vKipcclxuICogQSBPbmVPZiBzZXR0ZXIgYXMgcmV0dXJuZWQgYnkge0BsaW5rIHV0aWwub25lT2ZTZXR0ZXJ9LlxyXG4gKiBAdHlwZWRlZiBPbmVPZlNldHRlclxyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gdmFsdWUgRmllbGQgbmFtZVxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBCdWlsZHMgYSBzZXR0ZXIgZm9yIGEgb25lb2YncyBwcmVzZW50IGZpZWxkIG5hbWUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nW119IGZpZWxkTmFtZXMgRmllbGQgbmFtZXNcclxuICogQHJldHVybnMge09uZU9mU2V0dGVyfSBVbmJvdW5kIHNldHRlclxyXG4gKi9cclxudXRpbC5vbmVPZlNldHRlciA9IGZ1bmN0aW9uIHNldE9uZU9mKGZpZWxkTmFtZXMpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEZpZWxkIG5hbWVcclxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAgICAgKiBAdGhpcyBPYmplY3RcclxuICAgICAqIEBpZ25vcmVcclxuICAgICAqL1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkTmFtZXMubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIGlmIChmaWVsZE5hbWVzW2ldICE9PSBuYW1lKVxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXNbZmllbGROYW1lc1tpXV07XHJcbiAgICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlZmF1bHQgY29udmVyc2lvbiBvcHRpb25zIHVzZWQgZm9yIHtAbGluayBNZXNzYWdlI3RvSlNPTn0gaW1wbGVtZW50YXRpb25zLlxyXG4gKlxyXG4gKiBUaGVzZSBvcHRpb25zIGFyZSBjbG9zZSB0byBwcm90bzMncyBKU09OIG1hcHBpbmcgd2l0aCB0aGUgZXhjZXB0aW9uIHRoYXQgaW50ZXJuYWwgdHlwZXMgbGlrZSBBbnkgYXJlIGhhbmRsZWQganVzdCBsaWtlIG1lc3NhZ2VzLiBNb3JlIHByZWNpc2VseTpcclxuICpcclxuICogLSBMb25ncyBiZWNvbWUgc3RyaW5nc1xyXG4gKiAtIEVudW1zIGJlY29tZSBzdHJpbmcga2V5c1xyXG4gKiAtIEJ5dGVzIGJlY29tZSBiYXNlNjQgZW5jb2RlZCBzdHJpbmdzXHJcbiAqIC0gKFN1Yi0pTWVzc2FnZXMgYmVjb21lIHBsYWluIG9iamVjdHNcclxuICogLSBNYXBzIGJlY29tZSBwbGFpbiBvYmplY3RzIHdpdGggYWxsIHN0cmluZyBrZXlzXHJcbiAqIC0gUmVwZWF0ZWQgZmllbGRzIGJlY29tZSBhcnJheXNcclxuICogLSBOYU4gYW5kIEluZmluaXR5IGZvciBmbG9hdCBhbmQgZG91YmxlIGZpZWxkcyBiZWNvbWUgc3RyaW5nc1xyXG4gKlxyXG4gKiBAdHlwZSB7SUNvbnZlcnNpb25PcHRpb25zfVxyXG4gKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL3Byb3RvY29sLWJ1ZmZlcnMvZG9jcy9wcm90bzM/aGw9ZW4janNvblxyXG4gKi9cclxudXRpbC50b0pTT05PcHRpb25zID0ge1xyXG4gICAgbG9uZ3M6IFN0cmluZyxcclxuICAgIGVudW1zOiBTdHJpbmcsXHJcbiAgICBieXRlczogU3RyaW5nLFxyXG4gICAganNvbjogdHJ1ZVxyXG59O1xyXG5cclxudXRpbC5fY29uZmlndXJlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgQnVmZmVyID0gdXRpbC5CdWZmZXI7XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmICghQnVmZmVyKSB7XHJcbiAgICAgICAgdXRpbC5fQnVmZmVyX2Zyb20gPSB1dGlsLl9CdWZmZXJfYWxsb2NVbnNhZmUgPSBudWxsO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIC8vIGJlY2F1c2Ugbm9kZSA0LnggYnVmZmVycyBhcmUgaW5jb21wYXRpYmxlICYgaW1tdXRhYmxlXHJcbiAgICAvLyBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9kY29kZUlPL3Byb3RvYnVmLmpzL3B1bGwvNjY1XHJcbiAgICB1dGlsLl9CdWZmZXJfZnJvbSA9IEJ1ZmZlci5mcm9tICE9PSBVaW50OEFycmF5LmZyb20gJiYgQnVmZmVyLmZyb20gfHxcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIEJ1ZmZlcl9mcm9tKHZhbHVlLCBlbmNvZGluZykge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmcpO1xyXG4gICAgICAgIH07XHJcbiAgICB1dGlsLl9CdWZmZXJfYWxsb2NVbnNhZmUgPSBCdWZmZXIuYWxsb2NVbnNhZmUgfHxcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIEJ1ZmZlcl9hbGxvY1Vuc2FmZShzaXplKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQnVmZmVyKHNpemUpO1xyXG4gICAgICAgIH07XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFdyaXRlcjtcclxuXHJcbnZhciB1dGlsICAgICAgPSByZXF1aXJlKFwiLi91dGlsL21pbmltYWxcIik7XHJcblxyXG52YXIgQnVmZmVyV3JpdGVyOyAvLyBjeWNsaWNcclxuXHJcbnZhciBMb25nQml0cyAgPSB1dGlsLkxvbmdCaXRzLFxyXG4gICAgYmFzZTY0ICAgID0gdXRpbC5iYXNlNjQsXHJcbiAgICB1dGY4ICAgICAgPSB1dGlsLnV0Zjg7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyB3cml0ZXIgb3BlcmF0aW9uIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIFNjaGVkdWxlZCB3cml0ZXIgb3BlcmF0aW9uLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtmdW5jdGlvbigqLCBVaW50OEFycmF5LCBudW1iZXIpfSBmbiBGdW5jdGlvbiB0byBjYWxsXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gVmFsdWUgYnl0ZSBsZW5ndGhcclxuICogQHBhcmFtIHsqfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQGlnbm9yZVxyXG4gKi9cclxuZnVuY3Rpb24gT3AoZm4sIGxlbiwgdmFsKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGdW5jdGlvbiB0byBjYWxsLlxyXG4gICAgICogQHR5cGUge2Z1bmN0aW9uKFVpbnQ4QXJyYXksIG51bWJlciwgKil9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuZm4gPSBmbjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFZhbHVlIGJ5dGUgbGVuZ3RoLlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5sZW4gPSBsZW47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBOZXh0IG9wZXJhdGlvbi5cclxuICAgICAqIEB0eXBlIHtXcml0ZXIuT3B8dW5kZWZpbmVkfVxyXG4gICAgICovXHJcbiAgICB0aGlzLm5leHQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBWYWx1ZSB0byB3cml0ZS5cclxuICAgICAqIEB0eXBlIHsqfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnZhbCA9IHZhbDsgLy8gdHlwZSB2YXJpZXNcclxufVxyXG5cclxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuZnVuY3Rpb24gbm9vcCgpIHt9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZW1wdHktZnVuY3Rpb25cclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IHdyaXRlciBzdGF0ZSBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBDb3BpZWQgd3JpdGVyIHN0YXRlLlxyXG4gKiBAbWVtYmVyb2YgV3JpdGVyXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge1dyaXRlcn0gd3JpdGVyIFdyaXRlciB0byBjb3B5IHN0YXRlIGZyb21cclxuICogQGlnbm9yZVxyXG4gKi9cclxuZnVuY3Rpb24gU3RhdGUod3JpdGVyKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDdXJyZW50IGhlYWQuXHJcbiAgICAgKiBAdHlwZSB7V3JpdGVyLk9wfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmhlYWQgPSB3cml0ZXIuaGVhZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEN1cnJlbnQgdGFpbC5cclxuICAgICAqIEB0eXBlIHtXcml0ZXIuT3B9XHJcbiAgICAgKi9cclxuICAgIHRoaXMudGFpbCA9IHdyaXRlci50YWlsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3VycmVudCBidWZmZXIgbGVuZ3RoLlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5sZW4gPSB3cml0ZXIubGVuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTmV4dCBzdGF0ZS5cclxuICAgICAqIEB0eXBlIHtTdGF0ZXxudWxsfVxyXG4gICAgICovXHJcbiAgICB0aGlzLm5leHQgPSB3cml0ZXIuc3RhdGVzO1xyXG59XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyB3cml0ZXIgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgV2lyZSBmb3JtYXQgd3JpdGVyIHVzaW5nIGBVaW50OEFycmF5YCBpZiBhdmFpbGFibGUsIG90aGVyd2lzZSBgQXJyYXlgLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFdyaXRlcigpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEN1cnJlbnQgbGVuZ3RoLlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5sZW4gPSAwO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3BlcmF0aW9ucyBoZWFkLlxyXG4gICAgICogQHR5cGUge09iamVjdH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5oZWFkID0gbmV3IE9wKG5vb3AsIDAsIDApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3BlcmF0aW9ucyB0YWlsXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICB0aGlzLnRhaWwgPSB0aGlzLmhlYWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMaW5rZWQgZm9ya2VkIHN0YXRlcy5cclxuICAgICAqIEB0eXBlIHtPYmplY3R8bnVsbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5zdGF0ZXMgPSBudWxsO1xyXG5cclxuICAgIC8vIFdoZW4gYSB2YWx1ZSBpcyB3cml0dGVuLCB0aGUgd3JpdGVyIGNhbGN1bGF0ZXMgaXRzIGJ5dGUgbGVuZ3RoIGFuZCBwdXRzIGl0IGludG8gYSBsaW5rZWRcclxuICAgIC8vIGxpc3Qgb2Ygb3BlcmF0aW9ucyB0byBwZXJmb3JtIHdoZW4gZmluaXNoKCkgaXMgY2FsbGVkLiBUaGlzIGJvdGggYWxsb3dzIHVzIHRvIGFsbG9jYXRlXHJcbiAgICAvLyBidWZmZXJzIG9mIHRoZSBleGFjdCByZXF1aXJlZCBzaXplIGFuZCByZWR1Y2VzIHRoZSBhbW91bnQgb2Ygd29yayB3ZSBoYXZlIHRvIGRvIGNvbXBhcmVkXHJcbiAgICAvLyB0byBmaXJzdCBjYWxjdWxhdGluZyBvdmVyIG9iamVjdHMgYW5kIHRoZW4gZW5jb2Rpbmcgb3ZlciBvYmplY3RzLiBJbiBvdXIgY2FzZSwgdGhlIGVuY29kaW5nXHJcbiAgICAvLyBwYXJ0IGlzIGp1c3QgYSBsaW5rZWQgbGlzdCB3YWxrIGNhbGxpbmcgb3BlcmF0aW9ucyB3aXRoIGFscmVhZHkgcHJlcGFyZWQgdmFsdWVzLlxyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyB3cml0ZXIuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7QnVmZmVyV3JpdGVyfFdyaXRlcn0gQSB7QGxpbmsgQnVmZmVyV3JpdGVyfSB3aGVuIEJ1ZmZlcnMgYXJlIHN1cHBvcnRlZCwgb3RoZXJ3aXNlIGEge0BsaW5rIFdyaXRlcn1cclxuICovXHJcbldyaXRlci5jcmVhdGUgPSB1dGlsLkJ1ZmZlclxyXG4gICAgPyBmdW5jdGlvbiBjcmVhdGVfYnVmZmVyX3NldHVwKCkge1xyXG4gICAgICAgIHJldHVybiAoV3JpdGVyLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZV9idWZmZXIoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQnVmZmVyV3JpdGVyKCk7XHJcbiAgICAgICAgfSkoKTtcclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICA6IGZ1bmN0aW9uIGNyZWF0ZV9hcnJheSgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFdyaXRlcigpO1xyXG4gICAgfTtcclxuXHJcbi8qKlxyXG4gKiBBbGxvY2F0ZXMgYSBidWZmZXIgb2YgdGhlIHNwZWNpZmllZCBzaXplLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gc2l6ZSBCdWZmZXIgc2l6ZVxyXG4gKiBAcmV0dXJucyB7VWludDhBcnJheX0gQnVmZmVyXHJcbiAqL1xyXG5Xcml0ZXIuYWxsb2MgPSBmdW5jdGlvbiBhbGxvYyhzaXplKSB7XHJcbiAgICByZXR1cm4gbmV3IHV0aWwuQXJyYXkoc2l6ZSk7XHJcbn07XHJcblxyXG4vLyBVc2UgVWludDhBcnJheSBidWZmZXIgcG9vbCBpbiB0aGUgYnJvd3NlciwganVzdCBsaWtlIG5vZGUgZG9lcyB3aXRoIGJ1ZmZlcnNcclxuLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cclxuaWYgKHV0aWwuQXJyYXkgIT09IEFycmF5KVxyXG4gICAgV3JpdGVyLmFsbG9jID0gdXRpbC5wb29sKFdyaXRlci5hbGxvYywgdXRpbC5BcnJheS5wcm90b3R5cGUuc3ViYXJyYXkpO1xyXG5cclxuLyoqXHJcbiAqIFB1c2hlcyBhIG5ldyBvcGVyYXRpb24gdG8gdGhlIHF1ZXVlLlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFVpbnQ4QXJyYXksIG51bWJlciwgKil9IGZuIEZ1bmN0aW9uIHRvIGNhbGxcclxuICogQHBhcmFtIHtudW1iZXJ9IGxlbiBWYWx1ZSBieXRlIGxlbmd0aFxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5fcHVzaCA9IGZ1bmN0aW9uIHB1c2goZm4sIGxlbiwgdmFsKSB7XHJcbiAgICB0aGlzLnRhaWwgPSB0aGlzLnRhaWwubmV4dCA9IG5ldyBPcChmbiwgbGVuLCB2YWwpO1xyXG4gICAgdGhpcy5sZW4gKz0gbGVuO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5mdW5jdGlvbiB3cml0ZUJ5dGUodmFsLCBidWYsIHBvcykge1xyXG4gICAgYnVmW3Bvc10gPSB2YWwgJiAyNTU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdyaXRlVmFyaW50MzIodmFsLCBidWYsIHBvcykge1xyXG4gICAgd2hpbGUgKHZhbCA+IDEyNykge1xyXG4gICAgICAgIGJ1Zltwb3MrK10gPSB2YWwgJiAxMjcgfCAxMjg7XHJcbiAgICAgICAgdmFsID4+Pj0gNztcclxuICAgIH1cclxuICAgIGJ1Zltwb3NdID0gdmFsO1xyXG59XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyB2YXJpbnQgd3JpdGVyIG9wZXJhdGlvbiBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBTY2hlZHVsZWQgdmFyaW50IHdyaXRlciBvcGVyYXRpb24uXHJcbiAqIEBleHRlbmRzIE9wXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuIFZhbHVlIGJ5dGUgbGVuZ3RoXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQGlnbm9yZVxyXG4gKi9cclxuZnVuY3Rpb24gVmFyaW50T3AobGVuLCB2YWwpIHtcclxuICAgIHRoaXMubGVuID0gbGVuO1xyXG4gICAgdGhpcy5uZXh0ID0gdW5kZWZpbmVkO1xyXG4gICAgdGhpcy52YWwgPSB2YWw7XHJcbn1cclxuXHJcblZhcmludE9wLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoT3AucHJvdG90eXBlKTtcclxuVmFyaW50T3AucHJvdG90eXBlLmZuID0gd3JpdGVWYXJpbnQzMjtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYW4gdW5zaWduZWQgMzIgYml0IHZhbHVlIGFzIGEgdmFyaW50LlxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLnVpbnQzMiA9IGZ1bmN0aW9uIHdyaXRlX3VpbnQzMih2YWx1ZSkge1xyXG4gICAgLy8gaGVyZSwgdGhlIGNhbGwgdG8gdGhpcy5wdXNoIGhhcyBiZWVuIGlubGluZWQgYW5kIGEgdmFyaW50IHNwZWNpZmljIE9wIHN1YmNsYXNzIGlzIHVzZWQuXHJcbiAgICAvLyB1aW50MzIgaXMgYnkgZmFyIHRoZSBtb3N0IGZyZXF1ZW50bHkgdXNlZCBvcGVyYXRpb24gYW5kIGJlbmVmaXRzIHNpZ25pZmljYW50bHkgZnJvbSB0aGlzLlxyXG4gICAgdGhpcy5sZW4gKz0gKHRoaXMudGFpbCA9IHRoaXMudGFpbC5uZXh0ID0gbmV3IFZhcmludE9wKFxyXG4gICAgICAgICh2YWx1ZSA9IHZhbHVlID4+PiAwKVxyXG4gICAgICAgICAgICAgICAgPCAxMjggICAgICAgPyAxXHJcbiAgICAgICAgOiB2YWx1ZSA8IDE2Mzg0ICAgICA/IDJcclxuICAgICAgICA6IHZhbHVlIDwgMjA5NzE1MiAgID8gM1xyXG4gICAgICAgIDogdmFsdWUgPCAyNjg0MzU0NTYgPyA0XHJcbiAgICAgICAgOiAgICAgICAgICAgICAgICAgICAgIDUsXHJcbiAgICB2YWx1ZSkpLmxlbjtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHNpZ25lZCAzMiBiaXQgdmFsdWUgYXMgYSB2YXJpbnQuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmludDMyID0gZnVuY3Rpb24gd3JpdGVfaW50MzIodmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZSA8IDBcclxuICAgICAgICA/IHRoaXMuX3B1c2god3JpdGVWYXJpbnQ2NCwgMTAsIExvbmdCaXRzLmZyb21OdW1iZXIodmFsdWUpKSAvLyAxMCBieXRlcyBwZXIgc3BlY1xyXG4gICAgICAgIDogdGhpcy51aW50MzIodmFsdWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIDMyIGJpdCB2YWx1ZSBhcyBhIHZhcmludCwgemlnLXphZyBlbmNvZGVkLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLnNpbnQzMiA9IGZ1bmN0aW9uIHdyaXRlX3NpbnQzMih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMudWludDMyKCh2YWx1ZSA8PCAxIF4gdmFsdWUgPj4gMzEpID4+PiAwKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlVmFyaW50NjQodmFsLCBidWYsIHBvcykge1xyXG4gICAgd2hpbGUgKHZhbC5oaSkge1xyXG4gICAgICAgIGJ1Zltwb3MrK10gPSB2YWwubG8gJiAxMjcgfCAxMjg7XHJcbiAgICAgICAgdmFsLmxvID0gKHZhbC5sbyA+Pj4gNyB8IHZhbC5oaSA8PCAyNSkgPj4+IDA7XHJcbiAgICAgICAgdmFsLmhpID4+Pj0gNztcclxuICAgIH1cclxuICAgIHdoaWxlICh2YWwubG8gPiAxMjcpIHtcclxuICAgICAgICBidWZbcG9zKytdID0gdmFsLmxvICYgMTI3IHwgMTI4O1xyXG4gICAgICAgIHZhbC5sbyA9IHZhbC5sbyA+Pj4gNztcclxuICAgIH1cclxuICAgIGJ1Zltwb3MrK10gPSB2YWwubG87XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYW4gdW5zaWduZWQgNjQgYml0IHZhbHVlIGFzIGEgdmFyaW50LlxyXG4gKiBAcGFyYW0ge0xvbmd8bnVtYmVyfHN0cmluZ30gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYHZhbHVlYCBpcyBhIHN0cmluZyBhbmQgbm8gbG9uZyBsaWJyYXJ5IGlzIHByZXNlbnQuXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLnVpbnQ2NCA9IGZ1bmN0aW9uIHdyaXRlX3VpbnQ2NCh2YWx1ZSkge1xyXG4gICAgdmFyIGJpdHMgPSBMb25nQml0cy5mcm9tKHZhbHVlKTtcclxuICAgIHJldHVybiB0aGlzLl9wdXNoKHdyaXRlVmFyaW50NjQsIGJpdHMubGVuZ3RoKCksIGJpdHMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHNpZ25lZCA2NCBiaXQgdmFsdWUgYXMgYSB2YXJpbnQuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge0xvbmd8bnVtYmVyfHN0cmluZ30gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYHZhbHVlYCBpcyBhIHN0cmluZyBhbmQgbm8gbG9uZyBsaWJyYXJ5IGlzIHByZXNlbnQuXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmludDY0ID0gV3JpdGVyLnByb3RvdHlwZS51aW50NjQ7XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2lnbmVkIDY0IGJpdCB2YWx1ZSBhcyBhIHZhcmludCwgemlnLXphZyBlbmNvZGVkLlxyXG4gKiBAcGFyYW0ge0xvbmd8bnVtYmVyfHN0cmluZ30gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYHZhbHVlYCBpcyBhIHN0cmluZyBhbmQgbm8gbG9uZyBsaWJyYXJ5IGlzIHByZXNlbnQuXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLnNpbnQ2NCA9IGZ1bmN0aW9uIHdyaXRlX3NpbnQ2NCh2YWx1ZSkge1xyXG4gICAgdmFyIGJpdHMgPSBMb25nQml0cy5mcm9tKHZhbHVlKS56ekVuY29kZSgpO1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2god3JpdGVWYXJpbnQ2NCwgYml0cy5sZW5ndGgoKSwgYml0cyk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgYm9vbGlzaCB2YWx1ZSBhcyBhIHZhcmludC5cclxuICogQHBhcmFtIHtib29sZWFufSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuYm9vbCA9IGZ1bmN0aW9uIHdyaXRlX2Jvb2wodmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLl9wdXNoKHdyaXRlQnl0ZSwgMSwgdmFsdWUgPyAxIDogMCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiB3cml0ZUZpeGVkMzIodmFsLCBidWYsIHBvcykge1xyXG4gICAgYnVmW3BvcyAgICBdID0gIHZhbCAgICAgICAgICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDFdID0gIHZhbCA+Pj4gOCAgICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDJdID0gIHZhbCA+Pj4gMTYgICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDNdID0gIHZhbCA+Pj4gMjQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYW4gdW5zaWduZWQgMzIgYml0IHZhbHVlIGFzIGZpeGVkIDMyIGJpdHMuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuZml4ZWQzMiA9IGZ1bmN0aW9uIHdyaXRlX2ZpeGVkMzIodmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLl9wdXNoKHdyaXRlRml4ZWQzMiwgNCwgdmFsdWUgPj4+IDApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHNpZ25lZCAzMiBiaXQgdmFsdWUgYXMgZml4ZWQgMzIgYml0cy5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuc2ZpeGVkMzIgPSBXcml0ZXIucHJvdG90eXBlLmZpeGVkMzI7XHJcblxyXG4vKipcclxuICogV3JpdGVzIGFuIHVuc2lnbmVkIDY0IGJpdCB2YWx1ZSBhcyBmaXhlZCA2NCBiaXRzLlxyXG4gKiBAcGFyYW0ge0xvbmd8bnVtYmVyfHN0cmluZ30gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYHZhbHVlYCBpcyBhIHN0cmluZyBhbmQgbm8gbG9uZyBsaWJyYXJ5IGlzIHByZXNlbnQuXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmZpeGVkNjQgPSBmdW5jdGlvbiB3cml0ZV9maXhlZDY0KHZhbHVlKSB7XHJcbiAgICB2YXIgYml0cyA9IExvbmdCaXRzLmZyb20odmFsdWUpO1xyXG4gICAgcmV0dXJuIHRoaXMuX3B1c2god3JpdGVGaXhlZDMyLCA0LCBiaXRzLmxvKS5fcHVzaCh3cml0ZUZpeGVkMzIsIDQsIGJpdHMuaGkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHNpZ25lZCA2NCBiaXQgdmFsdWUgYXMgZml4ZWQgNjQgYml0cy5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7TG9uZ3xudW1iZXJ8c3RyaW5nfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHRocm93cyB7VHlwZUVycm9yfSBJZiBgdmFsdWVgIGlzIGEgc3RyaW5nIGFuZCBubyBsb25nIGxpYnJhcnkgaXMgcHJlc2VudC5cclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuc2ZpeGVkNjQgPSBXcml0ZXIucHJvdG90eXBlLmZpeGVkNjQ7XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgZmxvYXQgKDMyIGJpdCkuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmZsb2F0ID0gZnVuY3Rpb24gd3JpdGVfZmxvYXQodmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLl9wdXNoKHV0aWwuZmxvYXQud3JpdGVGbG9hdExFLCA0LCB2YWx1ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgZG91YmxlICg2NCBiaXQgZmxvYXQpLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5kb3VibGUgPSBmdW5jdGlvbiB3cml0ZV9kb3VibGUodmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLl9wdXNoKHV0aWwuZmxvYXQud3JpdGVEb3VibGVMRSwgOCwgdmFsdWUpO1xyXG59O1xyXG5cclxudmFyIHdyaXRlQnl0ZXMgPSB1dGlsLkFycmF5LnByb3RvdHlwZS5zZXRcclxuICAgID8gZnVuY3Rpb24gd3JpdGVCeXRlc19zZXQodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgIGJ1Zi5zZXQodmFsLCBwb3MpOyAvLyBhbHNvIHdvcmtzIGZvciBwbGFpbiBhcnJheSB2YWx1ZXNcclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICA6IGZ1bmN0aW9uIHdyaXRlQnl0ZXNfZm9yKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbC5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgYnVmW3BvcyArIGldID0gdmFsW2ldO1xyXG4gICAgfTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzZXF1ZW5jZSBvZiBieXRlcy5cclxuICogQHBhcmFtIHtVaW50OEFycmF5fHN0cmluZ30gdmFsdWUgQnVmZmVyIG9yIGJhc2U2NCBlbmNvZGVkIHN0cmluZyB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuYnl0ZXMgPSBmdW5jdGlvbiB3cml0ZV9ieXRlcyh2YWx1ZSkge1xyXG4gICAgdmFyIGxlbiA9IHZhbHVlLmxlbmd0aCA+Pj4gMDtcclxuICAgIGlmICghbGVuKVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9wdXNoKHdyaXRlQnl0ZSwgMSwgMCk7XHJcbiAgICBpZiAodXRpbC5pc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICB2YXIgYnVmID0gV3JpdGVyLmFsbG9jKGxlbiA9IGJhc2U2NC5sZW5ndGgodmFsdWUpKTtcclxuICAgICAgICBiYXNlNjQuZGVjb2RlKHZhbHVlLCBidWYsIDApO1xyXG4gICAgICAgIHZhbHVlID0gYnVmO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMudWludDMyKGxlbikuX3B1c2god3JpdGVCeXRlcywgbGVuLCB2YWx1ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLnN0cmluZyA9IGZ1bmN0aW9uIHdyaXRlX3N0cmluZyh2YWx1ZSkge1xyXG4gICAgdmFyIGxlbiA9IHV0ZjgubGVuZ3RoKHZhbHVlKTtcclxuICAgIHJldHVybiBsZW5cclxuICAgICAgICA/IHRoaXMudWludDMyKGxlbikuX3B1c2godXRmOC53cml0ZSwgbGVuLCB2YWx1ZSlcclxuICAgICAgICA6IHRoaXMuX3B1c2god3JpdGVCeXRlLCAxLCAwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGb3JrcyB0aGlzIHdyaXRlcidzIHN0YXRlIGJ5IHB1c2hpbmcgaXQgdG8gYSBzdGFjay5cclxuICogQ2FsbGluZyB7QGxpbmsgV3JpdGVyI3Jlc2V0fHJlc2V0fSBvciB7QGxpbmsgV3JpdGVyI2xkZWxpbXxsZGVsaW19IHJlc2V0cyB0aGUgd3JpdGVyIHRvIHRoZSBwcmV2aW91cyBzdGF0ZS5cclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmZvcmsgPSBmdW5jdGlvbiBmb3JrKCkge1xyXG4gICAgdGhpcy5zdGF0ZXMgPSBuZXcgU3RhdGUodGhpcyk7XHJcbiAgICB0aGlzLmhlYWQgPSB0aGlzLnRhaWwgPSBuZXcgT3Aobm9vcCwgMCwgMCk7XHJcbiAgICB0aGlzLmxlbiA9IDA7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldHMgdGhpcyBpbnN0YW5jZSB0byB0aGUgbGFzdCBzdGF0ZS5cclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXQoKSB7XHJcbiAgICBpZiAodGhpcy5zdGF0ZXMpIHtcclxuICAgICAgICB0aGlzLmhlYWQgICA9IHRoaXMuc3RhdGVzLmhlYWQ7XHJcbiAgICAgICAgdGhpcy50YWlsICAgPSB0aGlzLnN0YXRlcy50YWlsO1xyXG4gICAgICAgIHRoaXMubGVuICAgID0gdGhpcy5zdGF0ZXMubGVuO1xyXG4gICAgICAgIHRoaXMuc3RhdGVzID0gdGhpcy5zdGF0ZXMubmV4dDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5oZWFkID0gdGhpcy50YWlsID0gbmV3IE9wKG5vb3AsIDAsIDApO1xyXG4gICAgICAgIHRoaXMubGVuICA9IDA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldHMgdG8gdGhlIGxhc3Qgc3RhdGUgYW5kIGFwcGVuZHMgdGhlIGZvcmsgc3RhdGUncyBjdXJyZW50IHdyaXRlIGxlbmd0aCBhcyBhIHZhcmludCBmb2xsb3dlZCBieSBpdHMgb3BlcmF0aW9ucy5cclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmxkZWxpbSA9IGZ1bmN0aW9uIGxkZWxpbSgpIHtcclxuICAgIHZhciBoZWFkID0gdGhpcy5oZWFkLFxyXG4gICAgICAgIHRhaWwgPSB0aGlzLnRhaWwsXHJcbiAgICAgICAgbGVuICA9IHRoaXMubGVuO1xyXG4gICAgdGhpcy5yZXNldCgpLnVpbnQzMihsZW4pO1xyXG4gICAgaWYgKGxlbikge1xyXG4gICAgICAgIHRoaXMudGFpbC5uZXh0ID0gaGVhZC5uZXh0OyAvLyBza2lwIG5vb3BcclxuICAgICAgICB0aGlzLnRhaWwgPSB0YWlsO1xyXG4gICAgICAgIHRoaXMubGVuICs9IGxlbjtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZpbmlzaGVzIHRoZSB3cml0ZSBvcGVyYXRpb24uXHJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fSBGaW5pc2hlZCBidWZmZXJcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuZmluaXNoID0gZnVuY3Rpb24gZmluaXNoKCkge1xyXG4gICAgdmFyIGhlYWQgPSB0aGlzLmhlYWQubmV4dCwgLy8gc2tpcCBub29wXHJcbiAgICAgICAgYnVmICA9IHRoaXMuY29uc3RydWN0b3IuYWxsb2ModGhpcy5sZW4pLFxyXG4gICAgICAgIHBvcyAgPSAwO1xyXG4gICAgd2hpbGUgKGhlYWQpIHtcclxuICAgICAgICBoZWFkLmZuKGhlYWQudmFsLCBidWYsIHBvcyk7XHJcbiAgICAgICAgcG9zICs9IGhlYWQubGVuO1xyXG4gICAgICAgIGhlYWQgPSBoZWFkLm5leHQ7XHJcbiAgICB9XHJcbiAgICAvLyB0aGlzLmhlYWQgPSB0aGlzLnRhaWwgPSBudWxsO1xyXG4gICAgcmV0dXJuIGJ1ZjtcclxufTtcclxuXHJcbldyaXRlci5fY29uZmlndXJlID0gZnVuY3Rpb24oQnVmZmVyV3JpdGVyXykge1xyXG4gICAgQnVmZmVyV3JpdGVyID0gQnVmZmVyV3JpdGVyXztcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gQnVmZmVyV3JpdGVyO1xyXG5cclxuLy8gZXh0ZW5kcyBXcml0ZXJcclxudmFyIFdyaXRlciA9IHJlcXVpcmUoXCIuL3dyaXRlclwiKTtcclxuKEJ1ZmZlcldyaXRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFdyaXRlci5wcm90b3R5cGUpKS5jb25zdHJ1Y3RvciA9IEJ1ZmZlcldyaXRlcjtcclxuXHJcbnZhciB1dGlsID0gcmVxdWlyZShcIi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxudmFyIEJ1ZmZlciA9IHV0aWwuQnVmZmVyO1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgYnVmZmVyIHdyaXRlciBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBXaXJlIGZvcm1hdCB3cml0ZXIgdXNpbmcgbm9kZSBidWZmZXJzLlxyXG4gKiBAZXh0ZW5kcyBXcml0ZXJcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBCdWZmZXJXcml0ZXIoKSB7XHJcbiAgICBXcml0ZXIuY2FsbCh0aGlzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFsbG9jYXRlcyBhIGJ1ZmZlciBvZiB0aGUgc3BlY2lmaWVkIHNpemUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzaXplIEJ1ZmZlciBzaXplXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJ9IEJ1ZmZlclxyXG4gKi9cclxuQnVmZmVyV3JpdGVyLmFsbG9jID0gZnVuY3Rpb24gYWxsb2NfYnVmZmVyKHNpemUpIHtcclxuICAgIHJldHVybiAoQnVmZmVyV3JpdGVyLmFsbG9jID0gdXRpbC5fQnVmZmVyX2FsbG9jVW5zYWZlKShzaXplKTtcclxufTtcclxuXHJcbnZhciB3cml0ZUJ5dGVzQnVmZmVyID0gQnVmZmVyICYmIEJ1ZmZlci5wcm90b3R5cGUgaW5zdGFuY2VvZiBVaW50OEFycmF5ICYmIEJ1ZmZlci5wcm90b3R5cGUuc2V0Lm5hbWUgPT09IFwic2V0XCJcclxuICAgID8gZnVuY3Rpb24gd3JpdGVCeXRlc0J1ZmZlcl9zZXQodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgIGJ1Zi5zZXQodmFsLCBwb3MpOyAvLyBmYXN0ZXIgdGhhbiBjb3B5IChyZXF1aXJlcyBub2RlID49IDQgd2hlcmUgQnVmZmVycyBleHRlbmQgVWludDhBcnJheSBhbmQgc2V0IGlzIHByb3Blcmx5IGluaGVyaXRlZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWxzbyB3b3JrcyBmb3IgcGxhaW4gYXJyYXkgdmFsdWVzXHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgOiBmdW5jdGlvbiB3cml0ZUJ5dGVzQnVmZmVyX2NvcHkodmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgIGlmICh2YWwuY29weSkgLy8gQnVmZmVyIHZhbHVlc1xyXG4gICAgICAgICAgICB2YWwuY29weShidWYsIHBvcywgMCwgdmFsLmxlbmd0aCk7XHJcbiAgICAgICAgZWxzZSBmb3IgKHZhciBpID0gMDsgaSA8IHZhbC5sZW5ndGg7KSAvLyBwbGFpbiBhcnJheSB2YWx1ZXNcclxuICAgICAgICAgICAgYnVmW3BvcysrXSA9IHZhbFtpKytdO1xyXG4gICAgfTtcclxuXHJcbi8qKlxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcbkJ1ZmZlcldyaXRlci5wcm90b3R5cGUuYnl0ZXMgPSBmdW5jdGlvbiB3cml0ZV9ieXRlc19idWZmZXIodmFsdWUpIHtcclxuICAgIGlmICh1dGlsLmlzU3RyaW5nKHZhbHVlKSlcclxuICAgICAgICB2YWx1ZSA9IHV0aWwuX0J1ZmZlcl9mcm9tKHZhbHVlLCBcImJhc2U2NFwiKTtcclxuICAgIHZhciBsZW4gPSB2YWx1ZS5sZW5ndGggPj4+IDA7XHJcbiAgICB0aGlzLnVpbnQzMihsZW4pO1xyXG4gICAgaWYgKGxlbilcclxuICAgICAgICB0aGlzLl9wdXNoKHdyaXRlQnl0ZXNCdWZmZXIsIGxlbiwgdmFsdWUpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5mdW5jdGlvbiB3cml0ZVN0cmluZ0J1ZmZlcih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICBpZiAodmFsLmxlbmd0aCA8IDQwKSAvLyBwbGFpbiBqcyBpcyBmYXN0ZXIgZm9yIHNob3J0IHN0cmluZ3MgKHByb2JhYmx5IGR1ZSB0byByZWR1bmRhbnQgYXNzZXJ0aW9ucylcclxuICAgICAgICB1dGlsLnV0Zjgud3JpdGUodmFsLCBidWYsIHBvcyk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgYnVmLnV0ZjhXcml0ZSh2YWwsIHBvcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcbkJ1ZmZlcldyaXRlci5wcm90b3R5cGUuc3RyaW5nID0gZnVuY3Rpb24gd3JpdGVfc3RyaW5nX2J1ZmZlcih2YWx1ZSkge1xyXG4gICAgdmFyIGxlbiA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHZhbHVlKTtcclxuICAgIHRoaXMudWludDMyKGxlbik7XHJcbiAgICBpZiAobGVuKVxyXG4gICAgICAgIHRoaXMuX3B1c2god3JpdGVTdHJpbmdCdWZmZXIsIGxlbiwgdmFsdWUpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEZpbmlzaGVzIHRoZSB3cml0ZSBvcGVyYXRpb24uXHJcbiAqIEBuYW1lIEJ1ZmZlcldyaXRlciNmaW5pc2hcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJ9IEZpbmlzaGVkIGJ1ZmZlclxyXG4gKi9cclxuIiwiaW1wb3J0IHsgbGlzdCB9IGZyb20gXCIuLi9zcmNkZXBzL3Byb3RvLWdlbi10cy9hbGxwcm90b1wiXG5pbXBvcnQgeyBNeUxpc3RzIH0gZnJvbSBcIi4vTXlMaXN0c1wiXG5pbXBvcnQgeyBOb3cgfSBmcm9tIFwiLi9Ob3dcIlxuZXhwb3J0IGNsYXNzIEhlbGxvIHtcbiAgcHVibGljIHJ1bigpIHtcbiAgICBjb25zb2xlLmxvZyhcImhlbGxvIHdvcmxkIDEwXCIpXG4gICAgbmV3IE5vdygpLnByaW50KClcblxuICAgIGNvbnNvbGUubG9nKG5ldyBNeUxpc3RzKCkuZ2V0U2hvcHBpbmdMaXN0KCkpXG4gIH1cbn1cbiIsImltcG9ydCB7IGxpc3QgfSBmcm9tIFwiLi4vc3JjZGVwcy9wcm90by1nZW4tdHMvYWxscHJvdG9cIlxuXG5leHBvcnQgY2xhc3MgTXlMaXN0cyB7XG4gIHB1YmxpYyBnZXRTaG9wcGluZ0xpc3QoKTogbGlzdC5MaXN0IHtcbiAgICBjb25zdCBzaG9wcGluZ0xpc3QgPSBsaXN0Lkxpc3QuY3JlYXRlKHtuYW1lOiBcInNob3BwaW5nXCJ9KVxuICAgIHNob3BwaW5nTGlzdC5pdGVtcy5wdXNoKGxpc3QuSXRlbS5jcmVhdGUoe25hbWU6IFwiY29mZmVlXCJ9KSlcbiAgICBzaG9wcGluZ0xpc3QuaXRlbXMucHVzaChsaXN0Lkl0ZW0uY3JlYXRlKHtuYW1lOiBcImNhdCBmb29kXCJ9KSlcbiAgICByZXR1cm4gc2hvcHBpbmdMaXN0XG4gIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBOb3cge1xuICBwdWJsaWMgcHJpbnQoKSB7XG4gICAgY29uc29sZS5sb2cobmV3IERhdGUoKSwgXCJzb21ldGhpbmcgZWxzZSAyXCIpXG4gIH1cbn1cbiIsIi8qZXNsaW50LWRpc2FibGUgYmxvY2stc2NvcGVkLXZhciwgbm8tcmVkZWNsYXJlLCBuby1jb250cm9sLXJlZ2V4LCBuby1wcm90b3R5cGUtYnVpbHRpbnMqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciAkcHJvdG9idWYgPSByZXF1aXJlKFwiLi4vcHJvdG9idWZqcy9taW5pbWFsLmpzXCIpO1xuXG4vLyBDb21tb24gYWxpYXNlc1xudmFyICR1dGlsID0gJHByb3RvYnVmLnV0aWw7XG5cbi8vIEV4cG9ydGVkIHJvb3QgbmFtZXNwYWNlXG52YXIgJHJvb3QgPSAkcHJvdG9idWYucm9vdHNbXCIuLi9zcmNkZXBzL3Byb3RvLWdlbi10cy9hbGxwcm90b1wiXSB8fCAoJHByb3RvYnVmLnJvb3RzW1wiLi4vc3JjZGVwcy9wcm90by1nZW4tdHMvYWxscHJvdG9cIl0gPSB7fSk7XG5cbiRyb290Lmxpc3QgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAvKipcbiAgICAgKiBOYW1lc3BhY2UgbGlzdC5cbiAgICAgKiBAZXhwb3J0cyBsaXN0XG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqL1xuICAgIHZhciBsaXN0ID0ge307XG5cbiAgICBsaXN0Lkl0ZW0gPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFByb3BlcnRpZXMgb2YgYW4gSXRlbS5cbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3RcbiAgICAgICAgICogQGludGVyZmFjZSBJSXRlbVxuICAgICAgICAgKiBAcHJvcGVydHkge3N0cmluZ30gW25hbWVdIEl0ZW0gbmFtZVxuICAgICAgICAgKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29uc3RydWN0cyBhIG5ldyBJdGVtLlxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdFxuICAgICAgICAgKiBAY2xhc3NkZXNjIFJlcHJlc2VudHMgYW4gSXRlbS5cbiAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAqIEBwYXJhbSB7bGlzdC5JSXRlbT19IFtwcm9wZXJ0aWVzXSBQcm9wZXJ0aWVzIHRvIHNldFxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gSXRlbShwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBpZiAocHJvcGVydGllcylcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXlzID0gT2JqZWN0LmtleXMocHJvcGVydGllcyksIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNba2V5c1tpXV0gIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNba2V5c1tpXV0gPSBwcm9wZXJ0aWVzW2tleXNbaV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gbmFtZS5cbiAgICAgICAgICogQG1lbWJlciB7c3RyaW5nfW5hbWVcbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuSXRlbVxuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICovXG4gICAgICAgIEl0ZW0ucHJvdG90eXBlLm5hbWUgPSBcIlwiO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IEl0ZW0gaW5zdGFuY2UgdXNpbmcgdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzLlxuICAgICAgICAgKiBAZnVuY3Rpb24gY3JlYXRlXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkl0ZW1cbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAcGFyYW0ge2xpc3QuSUl0ZW09fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcbiAgICAgICAgICogQHJldHVybnMge2xpc3QuSXRlbX0gSXRlbSBpbnN0YW5jZVxuICAgICAgICAgKi9cbiAgICAgICAgSXRlbS5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUocHJvcGVydGllcykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBJdGVtKHByb3BlcnRpZXMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBWZXJpZmllcyBhbiBJdGVtIG1lc3NhZ2UuXG4gICAgICAgICAqIEBmdW5jdGlvbiB2ZXJpZnlcbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuSXRlbVxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IG1lc3NhZ2UgUGxhaW4gb2JqZWN0IHRvIHZlcmlmeVxuICAgICAgICAgKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IGBudWxsYCBpZiB2YWxpZCwgb3RoZXJ3aXNlIHRoZSByZWFzb24gd2h5IGl0IGlzIG5vdFxuICAgICAgICAgKi9cbiAgICAgICAgSXRlbS52ZXJpZnkgPSBmdW5jdGlvbiB2ZXJpZnkobWVzc2FnZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlICE9PSBcIm9iamVjdFwiIHx8IG1lc3NhZ2UgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2JqZWN0IGV4cGVjdGVkXCI7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5uYW1lICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcIm5hbWVcIikpXG4gICAgICAgICAgICAgICAgaWYgKCEkdXRpbC5pc1N0cmluZyhtZXNzYWdlLm5hbWUpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJuYW1lOiBzdHJpbmcgZXhwZWN0ZWRcIjtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGFuIEl0ZW0gbWVzc2FnZSBmcm9tIGEgcGxhaW4gb2JqZWN0LiBBbHNvIGNvbnZlcnRzIHZhbHVlcyB0byB0aGVpciByZXNwZWN0aXZlIGludGVybmFsIHR5cGVzLlxuICAgICAgICAgKiBAZnVuY3Rpb24gZnJvbU9iamVjdFxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5JdGVtXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gb2JqZWN0IFBsYWluIG9iamVjdFxuICAgICAgICAgKiBAcmV0dXJucyB7bGlzdC5JdGVtfSBJdGVtXG4gICAgICAgICAqL1xuICAgICAgICBJdGVtLmZyb21PYmplY3QgPSBmdW5jdGlvbiBmcm9tT2JqZWN0KG9iamVjdCkge1xuICAgICAgICAgICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mICRyb290Lmxpc3QuSXRlbSlcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBuZXcgJHJvb3QubGlzdC5JdGVtKCk7XG4gICAgICAgICAgICBpZiAob2JqZWN0Lm5hbWUgIT0gbnVsbClcbiAgICAgICAgICAgICAgICBtZXNzYWdlLm5hbWUgPSBTdHJpbmcob2JqZWN0Lm5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBwbGFpbiBvYmplY3QgZnJvbSBhbiBJdGVtIG1lc3NhZ2UuIEFsc28gY29udmVydHMgdmFsdWVzIHRvIG90aGVyIHR5cGVzIGlmIHNwZWNpZmllZC5cbiAgICAgICAgICogQGZ1bmN0aW9uIHRvT2JqZWN0XG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkl0ZW1cbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAcGFyYW0ge2xpc3QuSXRlbX0gbWVzc2FnZSBJdGVtXG4gICAgICAgICAqIEBwYXJhbSB7JHByb3RvYnVmLklDb252ZXJzaW9uT3B0aW9uc30gW29wdGlvbnNdIENvbnZlcnNpb24gb3B0aW9uc1xuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsKj59IFBsYWluIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgSXRlbS50b09iamVjdCA9IGZ1bmN0aW9uIHRvT2JqZWN0KG1lc3NhZ2UsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucylcbiAgICAgICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgICAgICB2YXIgb2JqZWN0ID0ge307XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5kZWZhdWx0cylcbiAgICAgICAgICAgICAgICBvYmplY3QubmFtZSA9IFwiXCI7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5uYW1lICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcIm5hbWVcIikpXG4gICAgICAgICAgICAgICAgb2JqZWN0Lm5hbWUgPSBtZXNzYWdlLm5hbWU7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyB0aGlzIEl0ZW0gdG8gSlNPTi5cbiAgICAgICAgICogQGZ1bmN0aW9uIHRvSlNPTlxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5JdGVtXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsKj59IEpTT04gb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBJdGVtLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci50b09iamVjdCh0aGlzLCAkcHJvdG9idWYudXRpbC50b0pTT05PcHRpb25zKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gSXRlbTtcbiAgICB9KSgpO1xuXG4gICAgbGlzdC5MaXN0ID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9wZXJ0aWVzIG9mIGEgTGlzdC5cbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3RcbiAgICAgICAgICogQGludGVyZmFjZSBJTGlzdFxuICAgICAgICAgKiBAcHJvcGVydHkge3N0cmluZ30gW25hbWVdIExpc3QgbmFtZVxuICAgICAgICAgKiBAcHJvcGVydHkge0FycmF5LjxsaXN0LklJdGVtPn0gW2l0ZW1zXSBMaXN0IGl0ZW1zXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IExpc3QuXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0XG4gICAgICAgICAqIEBjbGFzc2Rlc2MgUmVwcmVzZW50cyBhIExpc3QuXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAcGFyYW0ge2xpc3QuSUxpc3Q9fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIExpc3QocHJvcGVydGllcykge1xuICAgICAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICAgICAgaWYgKHByb3BlcnRpZXMpXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5cyA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW2tleXNbaV1dICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2tleXNbaV1dID0gcHJvcGVydGllc1trZXlzW2ldXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IG5hbWUuXG4gICAgICAgICAqIEBtZW1iZXIge3N0cmluZ31uYW1lXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkxpc3RcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBMaXN0LnByb3RvdHlwZS5uYW1lID0gXCJcIjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCBpdGVtcy5cbiAgICAgICAgICogQG1lbWJlciB7QXJyYXkuPGxpc3QuSUl0ZW0+fWl0ZW1zXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkxpc3RcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBMaXN0LnByb3RvdHlwZS5pdGVtcyA9ICR1dGlsLmVtcHR5QXJyYXk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBuZXcgTGlzdCBpbnN0YW5jZSB1c2luZyB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMuXG4gICAgICAgICAqIEBmdW5jdGlvbiBjcmVhdGVcbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuTGlzdFxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBwYXJhbSB7bGlzdC5JTGlzdD19IFtwcm9wZXJ0aWVzXSBQcm9wZXJ0aWVzIHRvIHNldFxuICAgICAgICAgKiBAcmV0dXJucyB7bGlzdC5MaXN0fSBMaXN0IGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBMaXN0LmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IExpc3QocHJvcGVydGllcyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFZlcmlmaWVzIGEgTGlzdCBtZXNzYWdlLlxuICAgICAgICAgKiBAZnVuY3Rpb24gdmVyaWZ5XG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkxpc3RcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBtZXNzYWdlIFBsYWluIG9iamVjdCB0byB2ZXJpZnlcbiAgICAgICAgICogQHJldHVybnMge3N0cmluZ3xudWxsfSBgbnVsbGAgaWYgdmFsaWQsIG90aGVyd2lzZSB0aGUgcmVhc29uIHdoeSBpdCBpcyBub3RcbiAgICAgICAgICovXG4gICAgICAgIExpc3QudmVyaWZ5ID0gZnVuY3Rpb24gdmVyaWZ5KG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gXCJvYmplY3RcIiB8fCBtZXNzYWdlID09PSBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiBcIm9iamVjdCBleHBlY3RlZFwiO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UubmFtZSAhPSBudWxsICYmIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJuYW1lXCIpKVxuICAgICAgICAgICAgICAgIGlmICghJHV0aWwuaXNTdHJpbmcobWVzc2FnZS5uYW1lKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibmFtZTogc3RyaW5nIGV4cGVjdGVkXCI7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5pdGVtcyAhPSBudWxsICYmIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJpdGVtc1wiKSkge1xuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShtZXNzYWdlLml0ZW1zKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiaXRlbXM6IGFycmF5IGV4cGVjdGVkXCI7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXNzYWdlLml0ZW1zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnJvciA9ICRyb290Lmxpc3QuSXRlbS52ZXJpZnkobWVzc2FnZS5pdGVtc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIml0ZW1zLlwiICsgZXJyb3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBMaXN0IG1lc3NhZ2UgZnJvbSBhIHBsYWluIG9iamVjdC4gQWxzbyBjb252ZXJ0cyB2YWx1ZXMgdG8gdGhlaXIgcmVzcGVjdGl2ZSBpbnRlcm5hbCB0eXBlcy5cbiAgICAgICAgICogQGZ1bmN0aW9uIGZyb21PYmplY3RcbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuTGlzdFxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IG9iamVjdCBQbGFpbiBvYmplY3RcbiAgICAgICAgICogQHJldHVybnMge2xpc3QuTGlzdH0gTGlzdFxuICAgICAgICAgKi9cbiAgICAgICAgTGlzdC5mcm9tT2JqZWN0ID0gZnVuY3Rpb24gZnJvbU9iamVjdChvYmplY3QpIHtcbiAgICAgICAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiAkcm9vdC5saXN0Lkxpc3QpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gbmV3ICRyb290Lmxpc3QuTGlzdCgpO1xuICAgICAgICAgICAgaWYgKG9iamVjdC5uYW1lICE9IG51bGwpXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5uYW1lID0gU3RyaW5nKG9iamVjdC5uYW1lKTtcbiAgICAgICAgICAgIGlmIChvYmplY3QuaXRlbXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkob2JqZWN0Lml0ZW1zKSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiLmxpc3QuTGlzdC5pdGVtczogYXJyYXkgZXhwZWN0ZWRcIik7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS5pdGVtcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0Lml0ZW1zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lml0ZW1zW2ldICE9PSBcIm9iamVjdFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiLmxpc3QuTGlzdC5pdGVtczogb2JqZWN0IGV4cGVjdGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLml0ZW1zW2ldID0gJHJvb3QubGlzdC5JdGVtLmZyb21PYmplY3Qob2JqZWN0Lml0ZW1zW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhIHBsYWluIG9iamVjdCBmcm9tIGEgTGlzdCBtZXNzYWdlLiBBbHNvIGNvbnZlcnRzIHZhbHVlcyB0byBvdGhlciB0eXBlcyBpZiBzcGVjaWZpZWQuXG4gICAgICAgICAqIEBmdW5jdGlvbiB0b09iamVjdFxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5MaXN0XG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQHBhcmFtIHtsaXN0Lkxpc3R9IG1lc3NhZ2UgTGlzdFxuICAgICAgICAgKiBAcGFyYW0geyRwcm90b2J1Zi5JQ29udmVyc2lvbk9wdGlvbnN9IFtvcHRpb25zXSBDb252ZXJzaW9uIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBQbGFpbiBvYmplY3RcbiAgICAgICAgICovXG4gICAgICAgIExpc3QudG9PYmplY3QgPSBmdW5jdGlvbiB0b09iamVjdChtZXNzYWdlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMpXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgdmFyIG9iamVjdCA9IHt9O1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXJyYXlzIHx8IG9wdGlvbnMuZGVmYXVsdHMpXG4gICAgICAgICAgICAgICAgb2JqZWN0Lml0ZW1zID0gW107XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5kZWZhdWx0cylcbiAgICAgICAgICAgICAgICBvYmplY3QubmFtZSA9IFwiXCI7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5uYW1lICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcIm5hbWVcIikpXG4gICAgICAgICAgICAgICAgb2JqZWN0Lm5hbWUgPSBtZXNzYWdlLm5hbWU7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5pdGVtcyAmJiBtZXNzYWdlLml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIG9iamVjdC5pdGVtcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbWVzc2FnZS5pdGVtcy5sZW5ndGg7ICsrailcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0Lml0ZW1zW2pdID0gJHJvb3QubGlzdC5JdGVtLnRvT2JqZWN0KG1lc3NhZ2UuaXRlbXNbal0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydHMgdGhpcyBMaXN0IHRvIEpTT04uXG4gICAgICAgICAqIEBmdW5jdGlvbiB0b0pTT05cbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuTGlzdFxuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBKU09OIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgTGlzdC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IudG9PYmplY3QodGhpcywgJHByb3RvYnVmLnV0aWwudG9KU09OT3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIExpc3Q7XG4gICAgfSkoKTtcblxuICAgIHJldHVybiBsaXN0O1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSAkcm9vdDtcbiIsImltcG9ydCB7IEhlbGxvIH0gZnJvbSBcIi4uL3NyYy9IZWxsb1wiXG5pbXBvcnQgeyBNeUxpc3RzIH0gZnJvbSBcIi4uL3NyYy9NeUxpc3RzXCJcbmltcG9ydCB7IGxpc3QgfSBmcm9tIFwiLi4vc3JjZGVwcy9wcm90by1nZW4tdHMvYWxscHJvdG9cIlxuXG5cbi8qIHRzbGludDpkaXNhYmxlICovXG4vLyBmb3Igbm93IHRoaXMgaXMganMtbGlrZSBjb2RlLCBzbyBkaXNhYmxlIHRzbGludFxuXG5jb25zb2xlLmxvZyhcIkluaXQgc3RhcnRcIilcblxuLy8gUmFuZG9tIGhlbGxvLXdvcmxkIHR5cGUgc3R1ZmYuIENoZWNrIHRoZSBicm93c2VyIGNvbnNvbGUuXG5uZXcgSGVsbG8oKS5ydW4oKVxuXG5cbi8vIFRoaXMgaXMgdHlwaWNhbCBtdmRvbSBjb2RlIGxpa2UgeW91J2QgZmluZCBpbiB0aGUgZXhhbXBsZXNcbi8vIGhlcmU6IGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL212ZG9tXG4vL1xuLy8gVGhlIGNvZGUgYmVsb3cgaXMgamF2YXNjcmlwdC13aXRoLWEtbGl0dGxlLXR5cGVzY3JpcHQuXG4vLyBOb3RlIHRoYXQgdGhlIG1vZGVsIG9iamVjdCAoc2hvcHBpbmdMaXN0KSBpcyBzdHJvbmdseSB0eXBlZCxcbi8vIGFuZCB3ZSBnZXQgdGhlIGJlbmVmaXQgb2YgY29kZSBjb21wbGV0aW9uLCBJREUgcmVkIHNxdWlnZ2xpZXMsIGV0Yy5cbi8vXG4vLyBFdmVuIGJldHRlciB3b3VsZCBiZSB0byBjcmVhdGUgYW4gbXZkb20gdHlwZXNjcmlwdCBkZWZpbml0aW9uLFxuLy8gYnV0IHRoYXQncyBvdXQgb2Ygc2NvcGUgZm9yIHRoaXMgcHJvamVjdC5cblxuZGVjbGFyZSBmdW5jdGlvbiByZXF1aXJlKG5hbWU6c3RyaW5nKTogYW55O1xubGV0IGQgPSByZXF1aXJlKFwiLi4vdWlkZXBzL212ZG9tXCIpXG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsICgpID0+IHtcbiAgZC5kaXNwbGF5KFwiU2hvcHBpbmdWaWV3XCIsIGQuZmlyc3QoXCIjc2hvcHBpbmdcIiksIG5ldyBNeUxpc3RzKCkuZ2V0U2hvcHBpbmdMaXN0KCkpXG59KVxuXG5kLnJlZ2lzdGVyKFwiU2hvcHBpbmdWaWV3XCIse1xuXHRjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz0nU2hvcHBpbmdWaWV3Jz5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxpc3RcIj5oaSwgaSdtIHRoZSBlbXB0eSBsaXN0PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5gXG5cdH0sXG5cblx0aW5pdDogZnVuY3Rpb24oc2hvcHBpbmdMaXN0OiBsaXN0Lkxpc3Qpe1xuICAgIGxldCB2aWV3ID0gdGhpc1xuICAgIGxldCBsaXN0RWwgPSBkLmZpcnN0KHZpZXcuZWwsIFwiLmxpc3RcIilcbiAgICBsaXN0RWwuaW5uZXJIVE1MID0gXCJcIlxuXG4gICAgbGV0IG5hbWVEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgbmFtZURpdi50ZXh0Q29udGVudCA9IHNob3BwaW5nTGlzdC5uYW1lXG4gICAgbGlzdEVsLmFwcGVuZENoaWxkKG5hbWVEaXYpXG5cbiAgICBsZXQgdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIilcbiAgICBmb3IgKGxldCBsaXN0SXRlbSBvZiBzaG9wcGluZ0xpc3QuaXRlbXMpIHtcbiAgICAgIGxldCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKVxuICAgICAgbGkudGV4dENvbnRlbnQgPSBsaXN0SXRlbS5uYW1lIHx8IFwiXCJcbiAgICAgIHVsLmFwcGVuZENoaWxkKGxpKVxuICAgIH1cblxuICAgIGxpc3RFbC5hcHBlbmRDaGlsZCh1bClcbiAgfVxufSlcblxuY29uc29sZS5sb2coXCJJbml0IGRvbmVcIilcbiJdfQ==
