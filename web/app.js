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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvYXNwcm9taXNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL2Jhc2U2NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9ldmVudGVtaXR0ZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvZmxvYXQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHByb3RvYnVmanMvaW5xdWlyZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AcHJvdG9idWZqcy9wb29sL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0Bwcm90b2J1ZmpzL3V0ZjgvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbXZkb20vc3JjL2RvbS5qcyIsIm5vZGVfbW9kdWxlcy9tdmRvbS9zcmMvZHguanMiLCJub2RlX21vZHVsZXMvbXZkb20vc3JjL2V2ZW50LmpzIiwibm9kZV9tb2R1bGVzL212ZG9tL3NyYy9odWIuanMiLCJub2RlX21vZHVsZXMvbXZkb20vdHMvdWlkZXBzL212ZG9tL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL212ZG9tL3NyYy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9tdmRvbS9zcmMvdmlldy1ldmVudC5qcyIsIm5vZGVfbW9kdWxlcy9tdmRvbS9zcmMvdmlldy1odWIuanMiLCJub2RlX21vZHVsZXMvbXZkb20vc3JjL3ZpZXcuanMiLCJub2RlX21vZHVsZXMvdHMvc3JjZGVwcy9wcm90b2J1ZmpzL21pbmltYWwuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvaW5kZXgtbWluaW1hbC5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9yZWFkZXIuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvcmVhZGVyX2J1ZmZlci5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9yb290cy5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy9ycGMuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvcnBjL3NlcnZpY2UuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvdXRpbC9sb25nYml0cy5qcyIsIm5vZGVfbW9kdWxlcy9wcm90b2J1ZmpzL3NyYy91dGlsL21pbmltYWwuanMiLCJub2RlX21vZHVsZXMvcHJvdG9idWZqcy9zcmMvd3JpdGVyLmpzIiwibm9kZV9tb2R1bGVzL3Byb3RvYnVmanMvc3JjL3dyaXRlcl9idWZmZXIuanMiLCIuLi90cy9zcmMvSGVsbG8udHMiLCIuLi90cy9zcmMvTXlMaXN0cy50cyIsIi4uL3RzL3NyYy9Ob3cudHMiLCIuLi90cy9zcmNkZXBzL3Byb3RvLWdlbi10cy9hbGxwcm90by5qcyIsIi4uL3RzL3VpL0luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUUEsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ2hDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNsQyxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUIsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVCLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFbEMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDM0IsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBRXpCLE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDaEIsT0FBTyxFQUFFLE9BQU87SUFFaEIsWUFBWTtJQUNaLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtJQUNmLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtJQUN2QixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87SUFDckIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO0lBQ25CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztJQUVqQixZQUFZO0lBQ1osRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFO0lBQ1osR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHO0lBQ2QsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO0lBRXRCLHNCQUFzQjtJQUN0QixLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUs7SUFDaEIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0lBQ1osT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPO0lBQ3BCLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtJQUNkLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtJQUVkLGNBQWM7SUFDZCxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07SUFDbEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO0lBRWQsZ0JBQWdCO0lBQ2hCLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSTtJQUNiLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSTtJQUNiLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTTtJQUNqQixNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU07SUFFakIsTUFBTTtJQUNOLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRztJQUVaLFFBQVE7SUFDUixHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUc7SUFDZCxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87Q0FDdEIsQ0FBQztBQUVGLHlDQUF5QztBQUN6QyxvSUFBb0k7QUFDcEksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUEsQ0FBQztJQUNYLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztBQUMvQixDQUFDOzs7QUN0REQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UUEsK0JBQStCO0FBRS9CLFlBQVksQ0FBQztBQUNiLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7OztBQ0hoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakZBLDZEQUF1RDtBQUN2RCxxQ0FBbUM7QUFDbkMsNkJBQTJCO0FBQzNCO0lBQUE7SUFjQSxDQUFDO0lBYkMsK0JBQWUsR0FBZjtRQUNFLElBQUksWUFBWSxHQUFHLGVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUE7UUFDdkQsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzNELFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUMsQ0FBQTtRQUM3RCxNQUFNLENBQUMsWUFBWSxDQUFBO0lBQ3JCLENBQUM7SUFFRCxtQkFBRyxHQUFIO1FBQ0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1FBQzdCLElBQUksU0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUE7UUFFakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlCQUFPLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFBO0lBQzlDLENBQUM7SUFDSCxZQUFDO0FBQUQsQ0FkQSxBQWNDLElBQUE7QUFkWSxzQkFBSzs7Ozs7QUNIbEIsNkRBQXVEO0FBRXZEO0lBQUE7SUFPQSxDQUFDO0lBTkMsaUNBQWUsR0FBZjtRQUNFLElBQUksWUFBWSxHQUFHLGVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUE7UUFDdkQsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzNELFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUMsQ0FBQTtRQUM3RCxNQUFNLENBQUMsWUFBWSxDQUFBO0lBQ3JCLENBQUM7SUFDSCxjQUFDO0FBQUQsQ0FQQSxBQU9DLElBQUE7QUFQWSwwQkFBTzs7Ozs7QUNGcEI7SUFBQTtJQUlBLENBQUM7SUFIQyxtQkFBSyxHQUFMO1FBQ0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFFLGtCQUFrQixDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUNILFVBQUM7QUFBRCxDQUpBLEFBSUMsSUFBQTtBQUpZLGtCQUFHOzs7QUNBaEIsMEZBQTBGO0FBQzFGLFlBQVksQ0FBQztBQUViLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBRXBELGlCQUFpQjtBQUNqQixJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBRTNCLDBCQUEwQjtBQUMxQixJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFFOUgsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDO0lBRVY7Ozs7T0FJRztJQUNILElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUVkLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQztRQUVUOzs7OztXQUtHO1FBRUg7Ozs7OztXQU1HO1FBQ0gsY0FBYyxVQUFVO1lBQ3BCLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQztnQkFDWCxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUNoRSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO3dCQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRDs7Ozs7V0FLRztRQUNILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUV6Qjs7Ozs7OztXQU9HO1FBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBZ0IsVUFBVTtZQUNwQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDO1FBRUY7Ozs7Ozs7V0FPRztRQUNILElBQUksQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLE9BQU87WUFDakMsRUFBRSxDQUFDLENBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxJQUFJLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztZQUM3QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM5QixNQUFNLENBQUMsdUJBQXVCLENBQUM7WUFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDLENBQUM7UUFFRjs7Ozs7OztXQU9HO1FBQ0gsSUFBSSxDQUFDLFVBQVUsR0FBRyxvQkFBb0IsTUFBTTtZQUN4QyxFQUFFLENBQUMsQ0FBQyxNQUFNLFlBQVksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsSUFBSSxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO2dCQUNwQixPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUNuQixDQUFDLENBQUM7UUFFRjs7Ozs7Ozs7V0FRRztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsa0JBQWtCLE9BQU8sRUFBRSxPQUFPO1lBQzlDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUNULE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDakIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUMvQixNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2xCLENBQUMsQ0FBQztRQUVGOzs7Ozs7V0FNRztRQUNILElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHO1lBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6RSxDQUFDLENBQUM7UUFFRixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFTCxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUM7UUFFVDs7Ozs7O1dBTUc7UUFFSDs7Ozs7O1dBTUc7UUFDSCxjQUFjLFVBQVU7WUFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDaEIsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUNYLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQ2hFLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7d0JBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRXpCOzs7OztXQUtHO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUV4Qzs7Ozs7OztXQU9HO1FBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBZ0IsVUFBVTtZQUNwQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDO1FBRUY7Ozs7Ozs7V0FPRztRQUNILElBQUksQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLE9BQU87WUFDakMsRUFBRSxDQUFDLENBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxJQUFJLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztZQUM3QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM5QixNQUFNLENBQUMsdUJBQXVCLENBQUM7WUFDdkMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzlCLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQztnQkFDbkMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUM1QyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7d0JBQ04sTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBQ2hDLENBQUM7WUFDTCxDQUFDO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDLENBQUM7UUFFRjs7Ozs7OztXQU9HO1FBQ0gsSUFBSSxDQUFDLFVBQVUsR0FBRyxvQkFBb0IsTUFBTTtZQUN4QyxFQUFFLENBQUMsQ0FBQyxNQUFNLFlBQVksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsSUFBSSxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO2dCQUNwQixPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDN0IsTUFBTSxTQUFTLENBQUMsa0NBQWtDLENBQUMsQ0FBQztnQkFDeEQsT0FBTyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ25CLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDM0MsRUFBRSxDQUFDLENBQUMsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsQ0FBQzt3QkFDcEMsTUFBTSxTQUFTLENBQUMsbUNBQW1DLENBQUMsQ0FBQztvQkFDekQsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxDQUFDO1lBQ0wsQ0FBQztZQUNELE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDbkIsQ0FBQyxDQUFDO1FBRUY7Ozs7Ozs7O1dBUUc7UUFDSCxJQUFJLENBQUMsUUFBUSxHQUFHLGtCQUFrQixPQUFPLEVBQUUsT0FBTztZQUM5QyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDVCxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNoQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUM7Z0JBQ25DLE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ3RCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUMvQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2xCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUN6QyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2xCLENBQUMsQ0FBQztRQUVGOzs7Ozs7V0FNRztRQUNILElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHO1lBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6RSxDQUFDLENBQUM7UUFFRixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFTCxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFFTCxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQzs7Ozs7QUN6UnZCLDBDQUF3QztBQUN4QyxzQ0FBb0M7QUFHcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUV6QixJQUFJLGFBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBTWpCLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0FBRWxDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRTtJQUM1QyxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksaUJBQU8sRUFBRSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUE7QUFDbEYsQ0FBQyxDQUFDLENBQUE7QUFFRixDQUFDLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBQztJQUN6QixNQUFNLEVBQUU7UUFDTCxNQUFNLENBQUMsZ0hBRVEsQ0FBQTtJQUNsQixDQUFDO0lBRUQsSUFBSSxFQUFFLFVBQVMsWUFBdUI7UUFDbkMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFBO1FBQ2YsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ3RDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO1FBRXJCLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDM0MsT0FBTyxDQUFDLFdBQVcsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFBO1FBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFM0IsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNyQyxHQUFHLENBQUMsQ0FBaUIsVUFBa0IsRUFBbEIsS0FBQSxZQUFZLENBQUMsS0FBSyxFQUFsQixjQUFrQixFQUFsQixJQUFrQjtZQUFsQyxJQUFJLFFBQVEsU0FBQTtZQUNmLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDckMsRUFBRSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQTtZQUNwQyxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1NBQ25CO1FBRUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUN4QixDQUFDO0NBQ0YsQ0FBQyxDQUFBO0FBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBhc1Byb21pc2U7XHJcblxyXG4vKipcclxuICogQ2FsbGJhY2sgYXMgdXNlZCBieSB7QGxpbmsgdXRpbC5hc1Byb21pc2V9LlxyXG4gKiBAdHlwZWRlZiBhc1Byb21pc2VDYWxsYmFja1xyXG4gKiBAdHlwZSB7ZnVuY3Rpb259XHJcbiAqIEBwYXJhbSB7RXJyb3J8bnVsbH0gZXJyb3IgRXJyb3IsIGlmIGFueVxyXG4gKiBAcGFyYW0gey4uLip9IHBhcmFtcyBBZGRpdGlvbmFsIGFyZ3VtZW50c1xyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmcm9tIGEgbm9kZS1zdHlsZSBjYWxsYmFjayBmdW5jdGlvbi5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHBhcmFtIHthc1Byb21pc2VDYWxsYmFja30gZm4gRnVuY3Rpb24gdG8gY2FsbFxyXG4gKiBAcGFyYW0geyp9IGN0eCBGdW5jdGlvbiBjb250ZXh0XHJcbiAqIEBwYXJhbSB7Li4uKn0gcGFyYW1zIEZ1bmN0aW9uIGFyZ3VtZW50c1xyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTwqPn0gUHJvbWlzaWZpZWQgZnVuY3Rpb25cclxuICovXHJcbmZ1bmN0aW9uIGFzUHJvbWlzZShmbiwgY3R4LyosIHZhcmFyZ3MgKi8pIHtcclxuICAgIHZhciBwYXJhbXMgID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKSxcclxuICAgICAgICBvZmZzZXQgID0gMCxcclxuICAgICAgICBpbmRleCAgID0gMixcclxuICAgICAgICBwZW5kaW5nID0gdHJ1ZTtcclxuICAgIHdoaWxlIChpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGgpXHJcbiAgICAgICAgcGFyYW1zW29mZnNldCsrXSA9IGFyZ3VtZW50c1tpbmRleCsrXTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiBleGVjdXRvcihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBwYXJhbXNbb2Zmc2V0XSA9IGZ1bmN0aW9uIGNhbGxiYWNrKGVyci8qLCB2YXJhcmdzICovKSB7XHJcbiAgICAgICAgICAgIGlmIChwZW5kaW5nKSB7XHJcbiAgICAgICAgICAgICAgICBwZW5kaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKVxyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG9mZnNldCA8IHBhcmFtcy5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtc1tvZmZzZXQrK10gPSBhcmd1bWVudHNbb2Zmc2V0XTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlLmFwcGx5KG51bGwsIHBhcmFtcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGZuLmFwcGx5KGN0eCB8fCBudWxsLCBwYXJhbXMpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBpZiAocGVuZGluZykge1xyXG4gICAgICAgICAgICAgICAgcGVuZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qKlxyXG4gKiBBIG1pbmltYWwgYmFzZTY0IGltcGxlbWVudGF0aW9uIGZvciBudW1iZXIgYXJyYXlzLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAbmFtZXNwYWNlXHJcbiAqL1xyXG52YXIgYmFzZTY0ID0gZXhwb3J0cztcclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGVzIHRoZSBieXRlIGxlbmd0aCBvZiBhIGJhc2U2NCBlbmNvZGVkIHN0cmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBCYXNlNjQgZW5jb2RlZCBzdHJpbmdcclxuICogQHJldHVybnMge251bWJlcn0gQnl0ZSBsZW5ndGhcclxuICovXHJcbmJhc2U2NC5sZW5ndGggPSBmdW5jdGlvbiBsZW5ndGgoc3RyaW5nKSB7XHJcbiAgICB2YXIgcCA9IHN0cmluZy5sZW5ndGg7XHJcbiAgICBpZiAoIXApXHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB2YXIgbiA9IDA7XHJcbiAgICB3aGlsZSAoLS1wICUgNCA+IDEgJiYgc3RyaW5nLmNoYXJBdChwKSA9PT0gXCI9XCIpXHJcbiAgICAgICAgKytuO1xyXG4gICAgcmV0dXJuIE1hdGguY2VpbChzdHJpbmcubGVuZ3RoICogMykgLyA0IC0gbjtcclxufTtcclxuXHJcbi8vIEJhc2U2NCBlbmNvZGluZyB0YWJsZVxyXG52YXIgYjY0ID0gbmV3IEFycmF5KDY0KTtcclxuXHJcbi8vIEJhc2U2NCBkZWNvZGluZyB0YWJsZVxyXG52YXIgczY0ID0gbmV3IEFycmF5KDEyMyk7XHJcblxyXG4vLyA2NS4uOTAsIDk3Li4xMjIsIDQ4Li41NywgNDMsIDQ3XHJcbmZvciAodmFyIGkgPSAwOyBpIDwgNjQ7KVxyXG4gICAgczY0W2I2NFtpXSA9IGkgPCAyNiA/IGkgKyA2NSA6IGkgPCA1MiA/IGkgKyA3MSA6IGkgPCA2MiA/IGkgLSA0IDogaSAtIDU5IHwgNDNdID0gaSsrO1xyXG5cclxuLyoqXHJcbiAqIEVuY29kZXMgYSBidWZmZXIgdG8gYSBiYXNlNjQgZW5jb2RlZCBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmZmVyIFNvdXJjZSBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0IFNvdXJjZSBzdGFydFxyXG4gKiBAcGFyYW0ge251bWJlcn0gZW5kIFNvdXJjZSBlbmRcclxuICogQHJldHVybnMge3N0cmluZ30gQmFzZTY0IGVuY29kZWQgc3RyaW5nXHJcbiAqL1xyXG5iYXNlNjQuZW5jb2RlID0gZnVuY3Rpb24gZW5jb2RlKGJ1ZmZlciwgc3RhcnQsIGVuZCkge1xyXG4gICAgdmFyIHBhcnRzID0gbnVsbCxcclxuICAgICAgICBjaHVuayA9IFtdO1xyXG4gICAgdmFyIGkgPSAwLCAvLyBvdXRwdXQgaW5kZXhcclxuICAgICAgICBqID0gMCwgLy8gZ290byBpbmRleFxyXG4gICAgICAgIHQ7ICAgICAvLyB0ZW1wb3JhcnlcclxuICAgIHdoaWxlIChzdGFydCA8IGVuZCkge1xyXG4gICAgICAgIHZhciBiID0gYnVmZmVyW3N0YXJ0KytdO1xyXG4gICAgICAgIHN3aXRjaCAoaikge1xyXG4gICAgICAgICAgICBjYXNlIDA6XHJcbiAgICAgICAgICAgICAgICBjaHVua1tpKytdID0gYjY0W2IgPj4gMl07XHJcbiAgICAgICAgICAgICAgICB0ID0gKGIgJiAzKSA8PCA0O1xyXG4gICAgICAgICAgICAgICAgaiA9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgICAgICAgY2h1bmtbaSsrXSA9IGI2NFt0IHwgYiA+PiA0XTtcclxuICAgICAgICAgICAgICAgIHQgPSAoYiAmIDE1KSA8PCAyO1xyXG4gICAgICAgICAgICAgICAgaiA9IDI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICAgICAgY2h1bmtbaSsrXSA9IGI2NFt0IHwgYiA+PiA2XTtcclxuICAgICAgICAgICAgICAgIGNodW5rW2krK10gPSBiNjRbYiAmIDYzXTtcclxuICAgICAgICAgICAgICAgIGogPSAwO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChpID4gODE5MSkge1xyXG4gICAgICAgICAgICAocGFydHMgfHwgKHBhcnRzID0gW10pKS5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjaHVuaykpO1xyXG4gICAgICAgICAgICBpID0gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoaikge1xyXG4gICAgICAgIGNodW5rW2krK10gPSBiNjRbdF07XHJcbiAgICAgICAgY2h1bmtbaSsrXSA9IDYxO1xyXG4gICAgICAgIGlmIChqID09PSAxKVxyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gNjE7XHJcbiAgICB9XHJcbiAgICBpZiAocGFydHMpIHtcclxuICAgICAgICBpZiAoaSlcclxuICAgICAgICAgICAgcGFydHMucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY2h1bmsuc2xpY2UoMCwgaSkpKTtcclxuICAgICAgICByZXR1cm4gcGFydHMuam9pbihcIlwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY2h1bmsuc2xpY2UoMCwgaSkpO1xyXG59O1xyXG5cclxudmFyIGludmFsaWRFbmNvZGluZyA9IFwiaW52YWxpZCBlbmNvZGluZ1wiO1xyXG5cclxuLyoqXHJcbiAqIERlY29kZXMgYSBiYXNlNjQgZW5jb2RlZCBzdHJpbmcgdG8gYSBidWZmZXIuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgU291cmNlIHN0cmluZ1xyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBEZXN0aW5hdGlvbiBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCBEZXN0aW5hdGlvbiBvZmZzZXRcclxuICogQHJldHVybnMge251bWJlcn0gTnVtYmVyIG9mIGJ5dGVzIHdyaXR0ZW5cclxuICogQHRocm93cyB7RXJyb3J9IElmIGVuY29kaW5nIGlzIGludmFsaWRcclxuICovXHJcbmJhc2U2NC5kZWNvZGUgPSBmdW5jdGlvbiBkZWNvZGUoc3RyaW5nLCBidWZmZXIsIG9mZnNldCkge1xyXG4gICAgdmFyIHN0YXJ0ID0gb2Zmc2V0O1xyXG4gICAgdmFyIGogPSAwLCAvLyBnb3RvIGluZGV4XHJcbiAgICAgICAgdDsgICAgIC8vIHRlbXBvcmFyeVxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOykge1xyXG4gICAgICAgIHZhciBjID0gc3RyaW5nLmNoYXJDb2RlQXQoaSsrKTtcclxuICAgICAgICBpZiAoYyA9PT0gNjEgJiYgaiA+IDEpXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGlmICgoYyA9IHM2NFtjXSkgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoaW52YWxpZEVuY29kaW5nKTtcclxuICAgICAgICBzd2l0Y2ggKGopIHtcclxuICAgICAgICAgICAgY2FzZSAwOlxyXG4gICAgICAgICAgICAgICAgdCA9IGM7XHJcbiAgICAgICAgICAgICAgICBqID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gdCA8PCAyIHwgKGMgJiA0OCkgPj4gNDtcclxuICAgICAgICAgICAgICAgIHQgPSBjO1xyXG4gICAgICAgICAgICAgICAgaiA9IDI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9ICh0ICYgMTUpIDw8IDQgfCAoYyAmIDYwKSA+PiAyO1xyXG4gICAgICAgICAgICAgICAgdCA9IGM7XHJcbiAgICAgICAgICAgICAgICBqID0gMztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gKHQgJiAzKSA8PCA2IHwgYztcclxuICAgICAgICAgICAgICAgIGogPSAwO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGogPT09IDEpXHJcbiAgICAgICAgdGhyb3cgRXJyb3IoaW52YWxpZEVuY29kaW5nKTtcclxuICAgIHJldHVybiBvZmZzZXQgLSBzdGFydDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBpZiB0aGUgc3BlY2lmaWVkIHN0cmluZyBhcHBlYXJzIHRvIGJlIGJhc2U2NCBlbmNvZGVkLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFN0cmluZyB0byB0ZXN0XHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgcHJvYmFibHkgYmFzZTY0IGVuY29kZWQsIG90aGVyd2lzZSBmYWxzZVxyXG4gKi9cclxuYmFzZTY0LnRlc3QgPSBmdW5jdGlvbiB0ZXN0KHN0cmluZykge1xyXG4gICAgcmV0dXJuIC9eKD86W0EtWmEtejAtOSsvXXs0fSkqKD86W0EtWmEtejAtOSsvXXsyfT09fFtBLVphLXowLTkrL117M309KT8kLy50ZXN0KHN0cmluZyk7XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IGV2ZW50IGVtaXR0ZXIgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgQSBtaW5pbWFsIGV2ZW50IGVtaXR0ZXIuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVnaXN0ZXJlZCBsaXN0ZW5lcnMuXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsKj59XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICB0aGlzLl9saXN0ZW5lcnMgPSB7fTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlZ2lzdGVycyBhbiBldmVudCBsaXN0ZW5lci5cclxuICogQHBhcmFtIHtzdHJpbmd9IGV2dCBFdmVudCBuYW1lXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGZuIExpc3RlbmVyXHJcbiAqIEBwYXJhbSB7Kn0gW2N0eF0gTGlzdGVuZXIgY29udGV4dFxyXG4gKiBAcmV0dXJucyB7dXRpbC5FdmVudEVtaXR0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2dCwgZm4sIGN0eCkge1xyXG4gICAgKHRoaXMuX2xpc3RlbmVyc1tldnRdIHx8ICh0aGlzLl9saXN0ZW5lcnNbZXZ0XSA9IFtdKSkucHVzaCh7XHJcbiAgICAgICAgZm4gIDogZm4sXHJcbiAgICAgICAgY3R4IDogY3R4IHx8IHRoaXNcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbiBldmVudCBsaXN0ZW5lciBvciBhbnkgbWF0Y2hpbmcgbGlzdGVuZXJzIGlmIGFyZ3VtZW50cyBhcmUgb21pdHRlZC5cclxuICogQHBhcmFtIHtzdHJpbmd9IFtldnRdIEV2ZW50IG5hbWUuIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBpZiBvbWl0dGVkLlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbZm5dIExpc3RlbmVyIHRvIHJlbW92ZS4gUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIG9mIGBldnRgIGlmIG9taXR0ZWQuXHJcbiAqIEByZXR1cm5zIHt1dGlsLkV2ZW50RW1pdHRlcn0gYHRoaXNgXHJcbiAqL1xyXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIG9mZihldnQsIGZuKSB7XHJcbiAgICBpZiAoZXZ0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJzID0ge307XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBpZiAoZm4gPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgdGhpcy5fbGlzdGVuZXJzW2V2dF0gPSBbXTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVyc1tldnRdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7KVxyXG4gICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXS5mbiA9PT0gZm4pXHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICArK2k7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogRW1pdHMgYW4gZXZlbnQgYnkgY2FsbGluZyBpdHMgbGlzdGVuZXJzIHdpdGggdGhlIHNwZWNpZmllZCBhcmd1bWVudHMuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBldnQgRXZlbnQgbmFtZVxyXG4gKiBAcGFyYW0gey4uLip9IGFyZ3MgQXJndW1lbnRzXHJcbiAqIEByZXR1cm5zIHt1dGlsLkV2ZW50RW1pdHRlcn0gYHRoaXNgXHJcbiAqL1xyXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2dCkge1xyXG4gICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVyc1tldnRdO1xyXG4gICAgaWYgKGxpc3RlbmVycykge1xyXG4gICAgICAgIHZhciBhcmdzID0gW10sXHJcbiAgICAgICAgICAgIGkgPSAxO1xyXG4gICAgICAgIGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDspXHJcbiAgICAgICAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaSsrXSk7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7KVxyXG4gICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2krK10uY3R4LCBhcmdzKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShmYWN0b3J5KTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyAvIHdyaXRlcyBmbG9hdHMgLyBkb3VibGVzIGZyb20gLyB0byBidWZmZXJzLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0XHJcbiAqIEBuYW1lc3BhY2VcclxuICovXHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgMzIgYml0IGZsb2F0IHRvIGEgYnVmZmVyIHVzaW5nIGxpdHRsZSBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC53cml0ZUZsb2F0TEVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgVGFyZ2V0IGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFRhcmdldCBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIDMyIGJpdCBmbG9hdCB0byBhIGJ1ZmZlciB1c2luZyBiaWcgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQud3JpdGVGbG9hdEJFXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRhcmdldCBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBUYXJnZXQgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIDMyIGJpdCBmbG9hdCBmcm9tIGEgYnVmZmVyIHVzaW5nIGxpdHRsZSBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC5yZWFkRmxvYXRMRVxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgU291cmNlIGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFNvdXJjZSBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblxyXG4vKipcclxuICogUmVhZHMgYSAzMiBiaXQgZmxvYXQgZnJvbSBhIGJ1ZmZlciB1c2luZyBiaWcgZW5kaWFuIGJ5dGUgb3JkZXIuXHJcbiAqIEBuYW1lIHV0aWwuZmxvYXQucmVhZEZsb2F0QkVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFNvdXJjZSBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBTb3VyY2UgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIDY0IGJpdCBkb3VibGUgdG8gYSBidWZmZXIgdXNpbmcgbGl0dGxlIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LndyaXRlRG91YmxlTEVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgVGFyZ2V0IGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFRhcmdldCBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIDY0IGJpdCBkb3VibGUgdG8gYSBidWZmZXIgdXNpbmcgYmlnIGVuZGlhbiBieXRlIG9yZGVyLlxyXG4gKiBAbmFtZSB1dGlsLmZsb2F0LndyaXRlRG91YmxlQkVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgVmFsdWUgdG8gd3JpdGVcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWYgVGFyZ2V0IGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gcG9zIFRhcmdldCBidWZmZXIgb2Zmc2V0XHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgNjQgYml0IGRvdWJsZSBmcm9tIGEgYnVmZmVyIHVzaW5nIGxpdHRsZSBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC5yZWFkRG91YmxlTEVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFNvdXJjZSBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBTb3VyY2UgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgNjQgYml0IGRvdWJsZSBmcm9tIGEgYnVmZmVyIHVzaW5nIGJpZyBlbmRpYW4gYnl0ZSBvcmRlci5cclxuICogQG5hbWUgdXRpbC5mbG9hdC5yZWFkRG91YmxlQkVcclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFNvdXJjZSBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBTb3VyY2UgYnVmZmVyIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLy8gRmFjdG9yeSBmdW5jdGlvbiBmb3IgdGhlIHB1cnBvc2Ugb2Ygbm9kZS1iYXNlZCB0ZXN0aW5nIGluIG1vZGlmaWVkIGdsb2JhbCBlbnZpcm9ubWVudHNcclxuZnVuY3Rpb24gZmFjdG9yeShleHBvcnRzKSB7XHJcblxyXG4gICAgLy8gZmxvYXQ6IHR5cGVkIGFycmF5XHJcbiAgICBpZiAodHlwZW9mIEZsb2F0MzJBcnJheSAhPT0gXCJ1bmRlZmluZWRcIikgKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgZjMyID0gbmV3IEZsb2F0MzJBcnJheShbIC0wIF0pLFxyXG4gICAgICAgICAgICBmOGIgPSBuZXcgVWludDhBcnJheShmMzIuYnVmZmVyKSxcclxuICAgICAgICAgICAgbGUgID0gZjhiWzNdID09PSAxMjg7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlRmxvYXRfZjMyX2NweSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGYzMlswXSA9IHZhbDtcclxuICAgICAgICAgICAgYnVmW3BvcyAgICBdID0gZjhiWzBdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMV0gPSBmOGJbMV07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAyXSA9IGY4YlsyXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDNdID0gZjhiWzNdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVGbG9hdF9mMzJfcmV2KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjMyWzBdID0gdmFsO1xyXG4gICAgICAgICAgICBidWZbcG9zICAgIF0gPSBmOGJbM107XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAxXSA9IGY4YlsyXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDJdID0gZjhiWzFdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgM10gPSBmOGJbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMud3JpdGVGbG9hdExFID0gbGUgPyB3cml0ZUZsb2F0X2YzMl9jcHkgOiB3cml0ZUZsb2F0X2YzMl9yZXY7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLndyaXRlRmxvYXRCRSA9IGxlID8gd3JpdGVGbG9hdF9mMzJfcmV2IDogd3JpdGVGbG9hdF9mMzJfY3B5O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkRmxvYXRfZjMyX2NweShidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmOGJbMF0gPSBidWZbcG9zICAgIF07XHJcbiAgICAgICAgICAgIGY4YlsxXSA9IGJ1Zltwb3MgKyAxXTtcclxuICAgICAgICAgICAgZjhiWzJdID0gYnVmW3BvcyArIDJdO1xyXG4gICAgICAgICAgICBmOGJbM10gPSBidWZbcG9zICsgM107XHJcbiAgICAgICAgICAgIHJldHVybiBmMzJbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkRmxvYXRfZjMyX3JldihidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmOGJbM10gPSBidWZbcG9zICAgIF07XHJcbiAgICAgICAgICAgIGY4YlsyXSA9IGJ1Zltwb3MgKyAxXTtcclxuICAgICAgICAgICAgZjhiWzFdID0gYnVmW3BvcyArIDJdO1xyXG4gICAgICAgICAgICBmOGJbMF0gPSBidWZbcG9zICsgM107XHJcbiAgICAgICAgICAgIHJldHVybiBmMzJbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMucmVhZEZsb2F0TEUgPSBsZSA/IHJlYWRGbG9hdF9mMzJfY3B5IDogcmVhZEZsb2F0X2YzMl9yZXY7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBleHBvcnRzLnJlYWRGbG9hdEJFID0gbGUgPyByZWFkRmxvYXRfZjMyX3JldiA6IHJlYWRGbG9hdF9mMzJfY3B5O1xyXG5cclxuICAgIC8vIGZsb2F0OiBpZWVlNzU0XHJcbiAgICB9KSgpOyBlbHNlIChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVGbG9hdF9pZWVlNzU0KHdyaXRlVWludCwgdmFsLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICB2YXIgc2lnbiA9IHZhbCA8IDAgPyAxIDogMDtcclxuICAgICAgICAgICAgaWYgKHNpZ24pXHJcbiAgICAgICAgICAgICAgICB2YWwgPSAtdmFsO1xyXG4gICAgICAgICAgICBpZiAodmFsID09PSAwKVxyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDEgLyB2YWwgPiAwID8gLyogcG9zaXRpdmUgKi8gMCA6IC8qIG5lZ2F0aXZlIDAgKi8gMjE0NzQ4MzY0OCwgYnVmLCBwb3MpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChpc05hTih2YWwpKVxyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDIxNDMyODkzNDQsIGJ1ZiwgcG9zKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAodmFsID4gMy40MDI4MjM0NjYzODUyODg2ZSszOCkgLy8gKy1JbmZpbml0eVxyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgMjEzOTA5NTA0MCkgPj4+IDAsIGJ1ZiwgcG9zKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAodmFsIDwgMS4xNzU0OTQzNTA4MjIyODc1ZS0zOCkgLy8gZGVub3JtYWxcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgoc2lnbiA8PCAzMSB8IE1hdGgucm91bmQodmFsIC8gMS40MDEyOTg0NjQzMjQ4MTdlLTQ1KSkgPj4+IDAsIGJ1ZiwgcG9zKTtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXhwb25lbnQgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbCkgLyBNYXRoLkxOMiksXHJcbiAgICAgICAgICAgICAgICAgICAgbWFudGlzc2EgPSBNYXRoLnJvdW5kKHZhbCAqIE1hdGgucG93KDIsIC1leHBvbmVudCkgKiA4Mzg4NjA4KSAmIDgzODg2MDc7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoKHNpZ24gPDwgMzEgfCBleHBvbmVudCArIDEyNyA8PCAyMyB8IG1hbnRpc3NhKSA+Pj4gMCwgYnVmLCBwb3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHBvcnRzLndyaXRlRmxvYXRMRSA9IHdyaXRlRmxvYXRfaWVlZTc1NC5iaW5kKG51bGwsIHdyaXRlVWludExFKTtcclxuICAgICAgICBleHBvcnRzLndyaXRlRmxvYXRCRSA9IHdyaXRlRmxvYXRfaWVlZTc1NC5iaW5kKG51bGwsIHdyaXRlVWludEJFKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZEZsb2F0X2llZWU3NTQocmVhZFVpbnQsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIHZhciB1aW50ID0gcmVhZFVpbnQoYnVmLCBwb3MpLFxyXG4gICAgICAgICAgICAgICAgc2lnbiA9ICh1aW50ID4+IDMxKSAqIDIgKyAxLFxyXG4gICAgICAgICAgICAgICAgZXhwb25lbnQgPSB1aW50ID4+PiAyMyAmIDI1NSxcclxuICAgICAgICAgICAgICAgIG1hbnRpc3NhID0gdWludCAmIDgzODg2MDc7XHJcbiAgICAgICAgICAgIHJldHVybiBleHBvbmVudCA9PT0gMjU1XHJcbiAgICAgICAgICAgICAgICA/IG1hbnRpc3NhXHJcbiAgICAgICAgICAgICAgICA/IE5hTlxyXG4gICAgICAgICAgICAgICAgOiBzaWduICogSW5maW5pdHlcclxuICAgICAgICAgICAgICAgIDogZXhwb25lbnQgPT09IDAgLy8gZGVub3JtYWxcclxuICAgICAgICAgICAgICAgID8gc2lnbiAqIDEuNDAxMjk4NDY0MzI0ODE3ZS00NSAqIG1hbnRpc3NhXHJcbiAgICAgICAgICAgICAgICA6IHNpZ24gKiBNYXRoLnBvdygyLCBleHBvbmVudCAtIDE1MCkgKiAobWFudGlzc2EgKyA4Mzg4NjA4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4cG9ydHMucmVhZEZsb2F0TEUgPSByZWFkRmxvYXRfaWVlZTc1NC5iaW5kKG51bGwsIHJlYWRVaW50TEUpO1xyXG4gICAgICAgIGV4cG9ydHMucmVhZEZsb2F0QkUgPSByZWFkRmxvYXRfaWVlZTc1NC5iaW5kKG51bGwsIHJlYWRVaW50QkUpO1xyXG5cclxuICAgIH0pKCk7XHJcblxyXG4gICAgLy8gZG91YmxlOiB0eXBlZCBhcnJheVxyXG4gICAgaWYgKHR5cGVvZiBGbG9hdDY0QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGY2NCA9IG5ldyBGbG9hdDY0QXJyYXkoWy0wXSksXHJcbiAgICAgICAgICAgIGY4YiA9IG5ldyBVaW50OEFycmF5KGY2NC5idWZmZXIpLFxyXG4gICAgICAgICAgICBsZSAgPSBmOGJbN10gPT09IDEyODtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVEb3VibGVfZjY0X2NweSh2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgICAgIGY2NFswXSA9IHZhbDtcclxuICAgICAgICAgICAgYnVmW3BvcyAgICBdID0gZjhiWzBdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgMV0gPSBmOGJbMV07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAyXSA9IGY4YlsyXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDNdID0gZjhiWzNdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgNF0gPSBmOGJbNF07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA1XSA9IGY4Yls1XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDZdID0gZjhiWzZdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgN10gPSBmOGJbN107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZURvdWJsZV9mNjRfcmV2KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgZjY0WzBdID0gdmFsO1xyXG4gICAgICAgICAgICBidWZbcG9zICAgIF0gPSBmOGJbN107XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyAxXSA9IGY4Yls2XTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDJdID0gZjhiWzVdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgM10gPSBmOGJbNF07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA0XSA9IGY4YlszXTtcclxuICAgICAgICAgICAgYnVmW3BvcyArIDVdID0gZjhiWzJdO1xyXG4gICAgICAgICAgICBidWZbcG9zICsgNl0gPSBmOGJbMV07XHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyA3XSA9IGY4YlswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy53cml0ZURvdWJsZUxFID0gbGUgPyB3cml0ZURvdWJsZV9mNjRfY3B5IDogd3JpdGVEb3VibGVfZjY0X3JldjtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMud3JpdGVEb3VibGVCRSA9IGxlID8gd3JpdGVEb3VibGVfZjY0X3JldiA6IHdyaXRlRG91YmxlX2Y2NF9jcHk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWREb3VibGVfZjY0X2NweShidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmOGJbMF0gPSBidWZbcG9zICAgIF07XHJcbiAgICAgICAgICAgIGY4YlsxXSA9IGJ1Zltwb3MgKyAxXTtcclxuICAgICAgICAgICAgZjhiWzJdID0gYnVmW3BvcyArIDJdO1xyXG4gICAgICAgICAgICBmOGJbM10gPSBidWZbcG9zICsgM107XHJcbiAgICAgICAgICAgIGY4Yls0XSA9IGJ1Zltwb3MgKyA0XTtcclxuICAgICAgICAgICAgZjhiWzVdID0gYnVmW3BvcyArIDVdO1xyXG4gICAgICAgICAgICBmOGJbNl0gPSBidWZbcG9zICsgNl07XHJcbiAgICAgICAgICAgIGY4Yls3XSA9IGJ1Zltwb3MgKyA3XTtcclxuICAgICAgICAgICAgcmV0dXJuIGY2NFswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWREb3VibGVfZjY0X3JldihidWYsIHBvcykge1xyXG4gICAgICAgICAgICBmOGJbN10gPSBidWZbcG9zICAgIF07XHJcbiAgICAgICAgICAgIGY4Yls2XSA9IGJ1Zltwb3MgKyAxXTtcclxuICAgICAgICAgICAgZjhiWzVdID0gYnVmW3BvcyArIDJdO1xyXG4gICAgICAgICAgICBmOGJbNF0gPSBidWZbcG9zICsgM107XHJcbiAgICAgICAgICAgIGY4YlszXSA9IGJ1Zltwb3MgKyA0XTtcclxuICAgICAgICAgICAgZjhiWzJdID0gYnVmW3BvcyArIDVdO1xyXG4gICAgICAgICAgICBmOGJbMV0gPSBidWZbcG9zICsgNl07XHJcbiAgICAgICAgICAgIGY4YlswXSA9IGJ1Zltwb3MgKyA3XTtcclxuICAgICAgICAgICAgcmV0dXJuIGY2NFswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRG91YmxlTEUgPSBsZSA/IHJlYWREb3VibGVfZjY0X2NweSA6IHJlYWREb3VibGVfZjY0X3JldjtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGV4cG9ydHMucmVhZERvdWJsZUJFID0gbGUgPyByZWFkRG91YmxlX2Y2NF9yZXYgOiByZWFkRG91YmxlX2Y2NF9jcHk7XHJcblxyXG4gICAgLy8gZG91YmxlOiBpZWVlNzU0XHJcbiAgICB9KSgpOyBlbHNlIChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVEb3VibGVfaWVlZTc1NCh3cml0ZVVpbnQsIG9mZjAsIG9mZjEsIHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICAgICAgdmFyIHNpZ24gPSB2YWwgPCAwID8gMSA6IDA7XHJcbiAgICAgICAgICAgIGlmIChzaWduKVxyXG4gICAgICAgICAgICAgICAgdmFsID0gLXZhbDtcclxuICAgICAgICAgICAgaWYgKHZhbCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDAsIGJ1ZiwgcG9zICsgb2ZmMCk7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoMSAvIHZhbCA+IDAgPyAvKiBwb3NpdGl2ZSAqLyAwIDogLyogbmVnYXRpdmUgMCAqLyAyMTQ3NDgzNjQ4LCBidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzTmFOKHZhbCkpIHtcclxuICAgICAgICAgICAgICAgIHdyaXRlVWludCgwLCBidWYsIHBvcyArIG9mZjApO1xyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDIxNDY5NTkzNjAsIGJ1ZiwgcG9zICsgb2ZmMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsID4gMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDgpIHsgLy8gKy1JbmZpbml0eVxyXG4gICAgICAgICAgICAgICAgd3JpdGVVaW50KDAsIGJ1ZiwgcG9zICsgb2ZmMCk7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVVpbnQoKHNpZ24gPDwgMzEgfCAyMTQ2NDM1MDcyKSA+Pj4gMCwgYnVmLCBwb3MgKyBvZmYxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBtYW50aXNzYTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWwgPCAyLjIyNTA3Mzg1ODUwNzIwMTRlLTMwOCkgeyAvLyBkZW5vcm1hbFxyXG4gICAgICAgICAgICAgICAgICAgIG1hbnRpc3NhID0gdmFsIC8gNWUtMzI0O1xyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlVWludChtYW50aXNzYSA+Pj4gMCwgYnVmLCBwb3MgKyBvZmYwKTtcclxuICAgICAgICAgICAgICAgICAgICB3cml0ZVVpbnQoKHNpZ24gPDwgMzEgfCBtYW50aXNzYSAvIDQyOTQ5NjcyOTYpID4+PiAwLCBidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZXhwb25lbnQgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbCkgLyBNYXRoLkxOMik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4cG9uZW50ID09PSAxMDI0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBvbmVudCA9IDEwMjM7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFudGlzc2EgPSB2YWwgKiBNYXRoLnBvdygyLCAtZXhwb25lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHdyaXRlVWludChtYW50aXNzYSAqIDQ1MDM1OTk2MjczNzA0OTYgPj4+IDAsIGJ1ZiwgcG9zICsgb2ZmMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVVaW50KChzaWduIDw8IDMxIHwgZXhwb25lbnQgKyAxMDIzIDw8IDIwIHwgbWFudGlzc2EgKiAxMDQ4NTc2ICYgMTA0ODU3NSkgPj4+IDAsIGJ1ZiwgcG9zICsgb2ZmMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4cG9ydHMud3JpdGVEb3VibGVMRSA9IHdyaXRlRG91YmxlX2llZWU3NTQuYmluZChudWxsLCB3cml0ZVVpbnRMRSwgMCwgNCk7XHJcbiAgICAgICAgZXhwb3J0cy53cml0ZURvdWJsZUJFID0gd3JpdGVEb3VibGVfaWVlZTc1NC5iaW5kKG51bGwsIHdyaXRlVWludEJFLCA0LCAwKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZERvdWJsZV9pZWVlNzU0KHJlYWRVaW50LCBvZmYwLCBvZmYxLCBidWYsIHBvcykge1xyXG4gICAgICAgICAgICB2YXIgbG8gPSByZWFkVWludChidWYsIHBvcyArIG9mZjApLFxyXG4gICAgICAgICAgICAgICAgaGkgPSByZWFkVWludChidWYsIHBvcyArIG9mZjEpO1xyXG4gICAgICAgICAgICB2YXIgc2lnbiA9IChoaSA+PiAzMSkgKiAyICsgMSxcclxuICAgICAgICAgICAgICAgIGV4cG9uZW50ID0gaGkgPj4+IDIwICYgMjA0NyxcclxuICAgICAgICAgICAgICAgIG1hbnRpc3NhID0gNDI5NDk2NzI5NiAqIChoaSAmIDEwNDg1NzUpICsgbG87XHJcbiAgICAgICAgICAgIHJldHVybiBleHBvbmVudCA9PT0gMjA0N1xyXG4gICAgICAgICAgICAgICAgPyBtYW50aXNzYVxyXG4gICAgICAgICAgICAgICAgPyBOYU5cclxuICAgICAgICAgICAgICAgIDogc2lnbiAqIEluZmluaXR5XHJcbiAgICAgICAgICAgICAgICA6IGV4cG9uZW50ID09PSAwIC8vIGRlbm9ybWFsXHJcbiAgICAgICAgICAgICAgICA/IHNpZ24gKiA1ZS0zMjQgKiBtYW50aXNzYVxyXG4gICAgICAgICAgICAgICAgOiBzaWduICogTWF0aC5wb3coMiwgZXhwb25lbnQgLSAxMDc1KSAqIChtYW50aXNzYSArIDQ1MDM1OTk2MjczNzA0OTYpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXhwb3J0cy5yZWFkRG91YmxlTEUgPSByZWFkRG91YmxlX2llZWU3NTQuYmluZChudWxsLCByZWFkVWludExFLCAwLCA0KTtcclxuICAgICAgICBleHBvcnRzLnJlYWREb3VibGVCRSA9IHJlYWREb3VibGVfaWVlZTc1NC5iaW5kKG51bGwsIHJlYWRVaW50QkUsIDQsIDApO1xyXG5cclxuICAgIH0pKCk7XHJcblxyXG4gICAgcmV0dXJuIGV4cG9ydHM7XHJcbn1cclxuXHJcbi8vIHVpbnQgaGVscGVyc1xyXG5cclxuZnVuY3Rpb24gd3JpdGVVaW50TEUodmFsLCBidWYsIHBvcykge1xyXG4gICAgYnVmW3BvcyAgICBdID0gIHZhbCAgICAgICAgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgMV0gPSAgdmFsID4+PiA4ICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAyXSA9ICB2YWwgPj4+IDE2ICYgMjU1O1xyXG4gICAgYnVmW3BvcyArIDNdID0gIHZhbCA+Pj4gMjQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdyaXRlVWludEJFKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIGJ1Zltwb3MgICAgXSA9ICB2YWwgPj4+IDI0O1xyXG4gICAgYnVmW3BvcyArIDFdID0gIHZhbCA+Pj4gMTYgJiAyNTU7XHJcbiAgICBidWZbcG9zICsgMl0gPSAgdmFsID4+PiA4ICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAzXSA9ICB2YWwgICAgICAgICYgMjU1O1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkVWludExFKGJ1ZiwgcG9zKSB7XHJcbiAgICByZXR1cm4gKGJ1Zltwb3MgICAgXVxyXG4gICAgICAgICAgfCBidWZbcG9zICsgMV0gPDwgOFxyXG4gICAgICAgICAgfCBidWZbcG9zICsgMl0gPDwgMTZcclxuICAgICAgICAgIHwgYnVmW3BvcyArIDNdIDw8IDI0KSA+Pj4gMDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZFVpbnRCRShidWYsIHBvcykge1xyXG4gICAgcmV0dXJuIChidWZbcG9zICAgIF0gPDwgMjRcclxuICAgICAgICAgIHwgYnVmW3BvcyArIDFdIDw8IDE2XHJcbiAgICAgICAgICB8IGJ1Zltwb3MgKyAyXSA8PCA4XHJcbiAgICAgICAgICB8IGJ1Zltwb3MgKyAzXSkgPj4+IDA7XHJcbn1cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gaW5xdWlyZTtcclxuXHJcbi8qKlxyXG4gKiBSZXF1aXJlcyBhIG1vZHVsZSBvbmx5IGlmIGF2YWlsYWJsZS5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHBhcmFtIHtzdHJpbmd9IG1vZHVsZU5hbWUgTW9kdWxlIHRvIHJlcXVpcmVcclxuICogQHJldHVybnMgez9PYmplY3R9IFJlcXVpcmVkIG1vZHVsZSBpZiBhdmFpbGFibGUgYW5kIG5vdCBlbXB0eSwgb3RoZXJ3aXNlIGBudWxsYFxyXG4gKi9cclxuZnVuY3Rpb24gaW5xdWlyZShtb2R1bGVOYW1lKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciBtb2QgPSBldmFsKFwicXVpcmVcIi5yZXBsYWNlKC9eLyxcInJlXCIpKShtb2R1bGVOYW1lKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1ldmFsXHJcbiAgICAgICAgaWYgKG1vZCAmJiAobW9kLmxlbmd0aCB8fCBPYmplY3Qua2V5cyhtb2QpLmxlbmd0aCkpXHJcbiAgICAgICAgICAgIHJldHVybiBtb2Q7XHJcbiAgICB9IGNhdGNoIChlKSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWVtcHR5XHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBwb29sO1xyXG5cclxuLyoqXHJcbiAqIEFuIGFsbG9jYXRvciBhcyB1c2VkIGJ5IHtAbGluayB1dGlsLnBvb2x9LlxyXG4gKiBAdHlwZWRlZiBQb29sQWxsb2NhdG9yXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtudW1iZXJ9IHNpemUgQnVmZmVyIHNpemVcclxuICogQHJldHVybnMge1VpbnQ4QXJyYXl9IEJ1ZmZlclxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIHNsaWNlciBhcyB1c2VkIGJ5IHtAbGluayB1dGlsLnBvb2x9LlxyXG4gKiBAdHlwZWRlZiBQb29sU2xpY2VyXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0IFN0YXJ0IG9mZnNldFxyXG4gKiBAcGFyYW0ge251bWJlcn0gZW5kIEVuZCBvZmZzZXRcclxuICogQHJldHVybnMge1VpbnQ4QXJyYXl9IEJ1ZmZlciBzbGljZVxyXG4gKiBAdGhpcyB7VWludDhBcnJheX1cclxuICovXHJcblxyXG4vKipcclxuICogQSBnZW5lcmFsIHB1cnBvc2UgYnVmZmVyIHBvb2wuXHJcbiAqIEBtZW1iZXJvZiB1dGlsXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge1Bvb2xBbGxvY2F0b3J9IGFsbG9jIEFsbG9jYXRvclxyXG4gKiBAcGFyYW0ge1Bvb2xTbGljZXJ9IHNsaWNlIFNsaWNlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gW3NpemU9ODE5Ml0gU2xhYiBzaXplXHJcbiAqIEByZXR1cm5zIHtQb29sQWxsb2NhdG9yfSBQb29sZWQgYWxsb2NhdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBwb29sKGFsbG9jLCBzbGljZSwgc2l6ZSkge1xyXG4gICAgdmFyIFNJWkUgICA9IHNpemUgfHwgODE5MjtcclxuICAgIHZhciBNQVggICAgPSBTSVpFID4+PiAxO1xyXG4gICAgdmFyIHNsYWIgICA9IG51bGw7XHJcbiAgICB2YXIgb2Zmc2V0ID0gU0laRTtcclxuICAgIHJldHVybiBmdW5jdGlvbiBwb29sX2FsbG9jKHNpemUpIHtcclxuICAgICAgICBpZiAoc2l6ZSA8IDEgfHwgc2l6ZSA+IE1BWClcclxuICAgICAgICAgICAgcmV0dXJuIGFsbG9jKHNpemUpO1xyXG4gICAgICAgIGlmIChvZmZzZXQgKyBzaXplID4gU0laRSkge1xyXG4gICAgICAgICAgICBzbGFiID0gYWxsb2MoU0laRSk7XHJcbiAgICAgICAgICAgIG9mZnNldCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBidWYgPSBzbGljZS5jYWxsKHNsYWIsIG9mZnNldCwgb2Zmc2V0ICs9IHNpemUpO1xyXG4gICAgICAgIGlmIChvZmZzZXQgJiA3KSAvLyBhbGlnbiB0byAzMiBiaXRcclxuICAgICAgICAgICAgb2Zmc2V0ID0gKG9mZnNldCB8IDcpICsgMTtcclxuICAgICAgICByZXR1cm4gYnVmO1xyXG4gICAgfTtcclxufVxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qKlxyXG4gKiBBIG1pbmltYWwgVVRGOCBpbXBsZW1lbnRhdGlvbiBmb3IgbnVtYmVyIGFycmF5cy5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIHV0ZjggPSBleHBvcnRzO1xyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgdGhlIFVURjggYnl0ZSBsZW5ndGggb2YgYSBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgU3RyaW5nXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IEJ5dGUgbGVuZ3RoXHJcbiAqL1xyXG51dGY4Lmxlbmd0aCA9IGZ1bmN0aW9uIHV0ZjhfbGVuZ3RoKHN0cmluZykge1xyXG4gICAgdmFyIGxlbiA9IDAsXHJcbiAgICAgICAgYyA9IDA7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIGMgPSBzdHJpbmcuY2hhckNvZGVBdChpKTtcclxuICAgICAgICBpZiAoYyA8IDEyOClcclxuICAgICAgICAgICAgbGVuICs9IDE7XHJcbiAgICAgICAgZWxzZSBpZiAoYyA8IDIwNDgpXHJcbiAgICAgICAgICAgIGxlbiArPSAyO1xyXG4gICAgICAgIGVsc2UgaWYgKChjICYgMHhGQzAwKSA9PT0gMHhEODAwICYmIChzdHJpbmcuY2hhckNvZGVBdChpICsgMSkgJiAweEZDMDApID09PSAweERDMDApIHtcclxuICAgICAgICAgICAgKytpO1xyXG4gICAgICAgICAgICBsZW4gKz0gNDtcclxuICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgbGVuICs9IDM7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbGVuO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIFVURjggYnl0ZXMgYXMgYSBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmZmVyIFNvdXJjZSBidWZmZXJcclxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0IFNvdXJjZSBzdGFydFxyXG4gKiBAcGFyYW0ge251bWJlcn0gZW5kIFNvdXJjZSBlbmRcclxuICogQHJldHVybnMge3N0cmluZ30gU3RyaW5nIHJlYWRcclxuICovXHJcbnV0ZjgucmVhZCA9IGZ1bmN0aW9uIHV0ZjhfcmVhZChidWZmZXIsIHN0YXJ0LCBlbmQpIHtcclxuICAgIHZhciBsZW4gPSBlbmQgLSBzdGFydDtcclxuICAgIGlmIChsZW4gPCAxKVxyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgdmFyIHBhcnRzID0gbnVsbCxcclxuICAgICAgICBjaHVuayA9IFtdLFxyXG4gICAgICAgIGkgPSAwLCAvLyBjaGFyIG9mZnNldFxyXG4gICAgICAgIHQ7ICAgICAvLyB0ZW1wb3JhcnlcclxuICAgIHdoaWxlIChzdGFydCA8IGVuZCkge1xyXG4gICAgICAgIHQgPSBidWZmZXJbc3RhcnQrK107XHJcbiAgICAgICAgaWYgKHQgPCAxMjgpXHJcbiAgICAgICAgICAgIGNodW5rW2krK10gPSB0O1xyXG4gICAgICAgIGVsc2UgaWYgKHQgPiAxOTEgJiYgdCA8IDIyNClcclxuICAgICAgICAgICAgY2h1bmtbaSsrXSA9ICh0ICYgMzEpIDw8IDYgfCBidWZmZXJbc3RhcnQrK10gJiA2MztcclxuICAgICAgICBlbHNlIGlmICh0ID4gMjM5ICYmIHQgPCAzNjUpIHtcclxuICAgICAgICAgICAgdCA9ICgodCAmIDcpIDw8IDE4IHwgKGJ1ZmZlcltzdGFydCsrXSAmIDYzKSA8PCAxMiB8IChidWZmZXJbc3RhcnQrK10gJiA2MykgPDwgNiB8IGJ1ZmZlcltzdGFydCsrXSAmIDYzKSAtIDB4MTAwMDA7XHJcbiAgICAgICAgICAgIGNodW5rW2krK10gPSAweEQ4MDAgKyAodCA+PiAxMCk7XHJcbiAgICAgICAgICAgIGNodW5rW2krK10gPSAweERDMDAgKyAodCAmIDEwMjMpO1xyXG4gICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICBjaHVua1tpKytdID0gKHQgJiAxNSkgPDwgMTIgfCAoYnVmZmVyW3N0YXJ0KytdICYgNjMpIDw8IDYgfCBidWZmZXJbc3RhcnQrK10gJiA2MztcclxuICAgICAgICBpZiAoaSA+IDgxOTEpIHtcclxuICAgICAgICAgICAgKHBhcnRzIHx8IChwYXJ0cyA9IFtdKSkucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY2h1bmspKTtcclxuICAgICAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHBhcnRzKSB7XHJcbiAgICAgICAgaWYgKGkpXHJcbiAgICAgICAgICAgIHBhcnRzLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rLnNsaWNlKDAsIGkpKSk7XHJcbiAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oXCJcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNodW5rLnNsaWNlKDAsIGkpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzdHJpbmcgYXMgVVRGOCBieXRlcy5cclxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBTb3VyY2Ugc3RyaW5nXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmZmVyIERlc3RpbmF0aW9uIGJ1ZmZlclxyXG4gKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IERlc3RpbmF0aW9uIG9mZnNldFxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBCeXRlcyB3cml0dGVuXHJcbiAqL1xyXG51dGY4LndyaXRlID0gZnVuY3Rpb24gdXRmOF93cml0ZShzdHJpbmcsIGJ1ZmZlciwgb2Zmc2V0KSB7XHJcbiAgICB2YXIgc3RhcnQgPSBvZmZzZXQsXHJcbiAgICAgICAgYzEsIC8vIGNoYXJhY3RlciAxXHJcbiAgICAgICAgYzI7IC8vIGNoYXJhY3RlciAyXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIGMxID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XHJcbiAgICAgICAgaWYgKGMxIDwgMTI4KSB7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMTtcclxuICAgICAgICB9IGVsc2UgaWYgKGMxIDwgMjA0OCkge1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgPj4gNiAgICAgICB8IDE5MjtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxICAgICAgICYgNjMgfCAxMjg7XHJcbiAgICAgICAgfSBlbHNlIGlmICgoYzEgJiAweEZDMDApID09PSAweEQ4MDAgJiYgKChjMiA9IHN0cmluZy5jaGFyQ29kZUF0KGkgKyAxKSkgJiAweEZDMDApID09PSAweERDMDApIHtcclxuICAgICAgICAgICAgYzEgPSAweDEwMDAwICsgKChjMSAmIDB4MDNGRikgPDwgMTApICsgKGMyICYgMHgwM0ZGKTtcclxuICAgICAgICAgICAgKytpO1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgPj4gMTggICAgICB8IDI0MDtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDEyICYgNjMgfCAxMjg7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSA+PiA2ICAmIDYzIHwgMTI4O1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgICAgICAgJiA2MyB8IDEyODtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBidWZmZXJbb2Zmc2V0KytdID0gYzEgPj4gMTIgICAgICB8IDIyNDtcclxuICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGMxID4+IDYgICYgNjMgfCAxMjg7XHJcbiAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQrK10gPSBjMSAgICAgICAmIDYzIHwgMTI4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvZmZzZXQgLSBzdGFydDtcclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdGZpcnN0OiBmaXJzdCwgXG5cdGFsbDogYWxsLCBcblx0Y2xvc2VzdDogY2xvc2VzdCxcblx0bmV4dDogbmV4dCxcblx0cHJldjogcHJldiwgXG5cdGFwcGVuZDogYXBwZW5kLFxuXHRmcmFnOiBmcmFnXG59O1xuXG5cbi8vIGZvciBFZGdlLCBzdGlsbCBkbyBub3Qgc3VwcG9ydCAubWF0Y2hlcyA6KFxudmFyIHRtcEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbnZhciBtYXRjaGVzRm4gPSB0bXBFbC5tYXRjaGVzIHx8IHRtcEVsLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCB0bXBFbC5tc01hdGNoZXNTZWxlY3Rvcjtcbm1vZHVsZS5leHBvcnRzLl9tYXRjaGVzRm4gPSBtYXRjaGVzRm47IC8vIG1ha2UgaXQgYXZhaWxhYmxlIGZvciB0aGlzIG1vZHVsZSAodGhpcyB3aWxsIGJlIGludGVybmFsIG9ubHkpXG5cbi8vIC0tLS0tLS0tLSBET00gUXVlcnkgU2hvcnRjdXRzIC0tLS0tLS0tLSAvL1xuXG4vLyBTaG9ydGN1dCBmb3IgLnF1ZXJ5U2VsZWN0b3Jcbi8vIHJldHVybiB0aGUgZmlyc3QgZWxlbWVudCBtYXRjaGluZyB0aGUgc2VsZWN0b3IgZnJvbSB0aGlzIGVsIChvciBkb2N1bWVudCBpZiBlbCBpcyBub3QgZ2l2ZW4pXG5mdW5jdGlvbiBmaXJzdChlbF9vcl9zZWxlY3Rvciwgc2VsZWN0b3Ipe1xuXHQvLyBXZSBkbyBub3QgaGF2ZSBhIHNlbGVjdG9yIGF0IGFsbCwgdGhlbiwgdGhpcyBjYWxsIGlzIGZvciBmaXJzdEVsZW1lbnRDaGlsZFxuXHRpZiAoIXNlbGVjdG9yICYmIHR5cGVvZiBlbF9vcl9zZWxlY3RvciAhPT0gXCJzdHJpbmdcIil7XG5cdFx0dmFyIGVsID0gZWxfb3Jfc2VsZWN0b3I7XG5cdFx0Ly8gdHJ5IHRvIGdldCBcblx0XHR2YXIgZmlyc3RFbGVtZW50Q2hpbGQgPSBlbC5maXJzdEVsZW1lbnRDaGlsZDtcblxuXHRcdC8vIGlmIGZpcnN0RWxlbWVudENoaWxkIGlzIG51bGwvdW5kZWZpbmVkLCBidXQgd2UgaGF2ZSBhIGZpcnN0Q2hpbGQsIGl0IGlzIHBlcmhhcHMgYmVjYXVzZSBub3Qgc3VwcG9ydGVkXG5cdFx0aWYgKCFmaXJzdEVsZW1lbnRDaGlsZCAmJiBlbC5maXJzdENoaWxkKXtcblxuXHRcdFx0Ly8gSWYgdGhlIGZpcnN0Q2hpbGQgaXMgb2YgdHlwZSBFbGVtZW50LCByZXR1cm4gaXQuIFxuXHRcdFx0aWYgKGVsLmZpcnN0Q2hpbGQubm9kZVR5cGUgPT09IDEgKXtcblx0XHRcdFx0cmV0dXJuIGVsLmZpcnN0Q2hpbGQ7XG5cdFx0XHR9XG5cdFx0XHQvLyBPdGhlcndpc2UsIHRyeSB0byBmaW5kIHRoZSBuZXh0IGVsZW1lbnQgKHVzaW5nIHRoZSBuZXh0KVxuXHRcdFx0ZWxzZXtcblx0XHRcdFx0cmV0dXJuIG5leHQoZWwuZmlyc3RDaGlsZCk7XG5cdFx0XHR9XHRcdFx0XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZpcnN0RWxlbWVudENoaWxkO1xuXHR9XG5cdC8vIG90aGVyd2lzZSwgdGhlIGNhbGwgd2FzIGVpdGhlciAoc2VsZWN0b3IpIG9yIChlbCwgc2VsZWN0b3IpLCBzbyBmb3dhcmQgdG8gdGhlIHF1ZXJ5U2VsZWN0b3Jcblx0ZWxzZXtcblx0XHRyZXR1cm4gX2V4ZWNRdWVyeVNlbGVjdG9yKGZhbHNlLCBlbF9vcl9zZWxlY3Rvciwgc2VsZWN0b3IpO1x0XG5cdH1cblx0XG59XG5cbi8vIFNob3J0Y3V0IGZvciAucXVlcnlTZWxlY3RvckFsbFxuLy8gcmV0dXJuIGFuIG5vZGVMaXN0IG9mIGFsbCBvZiB0aGUgZWxlbWVudHMgZWxlbWVudCBtYXRjaGluZyB0aGUgc2VsZWN0b3IgZnJvbSB0aGlzIGVsIChvciBkb2N1bWVudCBpZiBlbCBpcyBub3QgZ2l2ZW4pXG5mdW5jdGlvbiBhbGwoZWwsIHNlbGVjdG9yKXtcblx0cmV0dXJuIF9leGVjUXVlcnlTZWxlY3Rvcih0cnVlLCBlbCwgc2VsZWN0b3IpO1xufVxuXG4vLyByZXR1cm4gdGhlIGZpcnN0IGVsZW1lbnQgbmV4dCB0byB0aGUgZWwgbWF0Y2hpbmcgdGhlIHNlbGVjdG9yXG4vLyBpZiBubyBzZWxlY3Rvciwgd2lsbCByZXR1cm4gdGhlIG5leHQgRWxlbWVudFxuLy8gcmV0dXJuIG51bGwgaWYgbm90IGZvdW5kLlxuZnVuY3Rpb24gbmV4dChlbCwgc2VsZWN0b3Ipe1xuXHRyZXR1cm4gX3NpYmxpbmcodHJ1ZSwgZWwsIHNlbGVjdG9yKTtcbn1cblxuLy8gaWYgbm8gc2VsZWN0b3IsIHdpbGwgcmV0dXJuIHRoZSBwcmV2aW91cyBFbGVtZW50XG5mdW5jdGlvbiBwcmV2KGVsLCBzZWxlY3Rvcil7XG5cdHJldHVybiBfc2libGluZyhmYWxzZSwgZWwsIHNlbGVjdG9yKTtcbn1cblxuLy8gcmV0dXJuIHRoZSBlbGVtZW50IGNsb3Nlc3QgaW4gdGhlIGhpZXJhcmNoeSAodXApLCBpbmNsdWRpbmcgdGhpcyBlbCwgbWF0Y2hpbmcgdGhpcyBzZWxlY3RvclxuLy8gcmV0dXJuIG51bGwgaWYgbm90IGZvdW5kXG5mdW5jdGlvbiBjbG9zZXN0KGVsLCBzZWxlY3Rvcil7XG5cdHZhciB0bXBFbCA9IGVsO1xuXHRcblx0Ly8gdXNlIFwiIT1cIiBmb3IgbnVsbCBhbmQgdW5kZWZpbmVkXG5cdHdoaWxlICh0bXBFbCAhPSBudWxsICYmIHRtcEVsICE9PSBkb2N1bWVudCl7XG5cdFx0aWYgKG1hdGNoZXNGbi5jYWxsKHRtcEVsLHNlbGVjdG9yKSl7XG5cdFx0XHRyZXR1cm4gdG1wRWw7XG5cdFx0fVxuXHRcdHRtcEVsID0gdG1wRWwucGFyZW50RWxlbWVudDtcdFx0XG5cdH1cblx0cmV0dXJuIG51bGw7XG59XG5cbi8vIC0tLS0tLS0tLSAvRE9NIFF1ZXJ5IFNob3J0Y3V0cyAtLS0tLS0tLS0gLy9cblxuXG4vLyAtLS0tLS0tLS0gRE9NIEhlbHBlcnMgLS0tLS0tLS0tIC8vXG5mdW5jdGlvbiBhcHBlbmQocmVmRWwsIG5ld0VsLCBwb3NpdGlvbil7XG5cdHZhciBwYXJlbnRFbCwgbmV4dFNpYmxpbmcgPSBudWxsO1xuXHRcblx0Ly8gZGVmYXVsdCBpcyBcImxhc3RcIlxuXHRwb3NpdGlvbiA9IChwb3NpdGlvbik/cG9zaXRpb246XCJsYXN0XCI7XG5cblx0Ly8vLyAxKSBXZSBkZXRlcm1pbmUgdGhlIHBhcmVudEVsXG5cdGlmIChwb3NpdGlvbiA9PT0gXCJsYXN0XCIgfHwgcG9zaXRpb24gPT09IFwiZmlyc3RcIiAgfHwgcG9zaXRpb24gPT09IFwiZW1wdHlcIil7XG5cdFx0cGFyZW50RWwgPSByZWZFbDtcblx0fWVsc2UgaWYgKHBvc2l0aW9uID09PSBcImJlZm9yZVwiIHx8IHBvc2l0aW9uID09PSBcImFmdGVyXCIpe1xuXHRcdHBhcmVudEVsID0gcmVmRWwucGFyZW50Tm9kZTtcblx0XHRpZiAoIXBhcmVudEVsKXtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIm12ZG9tIEVSUk9SIC0gVGhlIHJlZmVyZW5jZUVsZW1lbnQgXCIgKyByZWZFbCArIFwiIGRvZXMgbm90IGhhdmUgYSBwYXJlbnROb2RlLiBDYW5ub3QgaW5zZXJ0IFwiICsgcG9zaXRpb24pO1xuXHRcdH1cblx0fVxuXG5cdC8vLy8gMikgV2UgZGV0ZXJtaW5lIGlmIHdlIGhhdmUgYSBuZXh0U2libGluZyBvciBub3Rcblx0Ly8gaWYgXCJmaXJzdFwiLCB3ZSB0cnkgdG8gc2VlIGlmIHRoZXJlIGlzIGEgZmlyc3QgY2hpbGRcblx0aWYgKHBvc2l0aW9uID09PSBcImZpcnN0XCIpe1xuXHRcdG5leHRTaWJsaW5nID0gZmlyc3QocmVmRWwpOyAvLyBpZiB0aGlzIGlzIG51bGwsIHRoZW4sIGl0IHdpbGwganVzdCBkbyBhbiBhcHBlbmRDaGlsZFxuXHRcdC8vIE5vdGU6IHRoaXMgbWlnaHQgYmUgYSB0ZXh0IG5vZGUgYnV0IHRoaXMgaXMgZmluZSBpbiB0aGlzIGNvbnRleHQuXG5cdH1cblx0Ly8gaWYgXCJiZWZvcmVcIiwgdGhlbiwgdGhlIHJlZkVsIGlzIHRoZSBuZXh0U2libGluZ1xuXHRlbHNlIGlmIChwb3NpdGlvbiA9PT0gXCJiZWZvcmVcIil7XG5cdFx0bmV4dFNpYmxpbmcgPSByZWZFbDtcblx0fVxuXHQvLyBpZiBcImFmdGVyXCIsIHRyeSB0byBmaW5kIHRoZSBuZXh0IFNpYmxpbmcgKGlmIG5vdCBmb3VuZCwgaXQgd2lsbCBiZSBqdXN0IGEgYXBwZW5kQ2hpbGQgdG8gYWRkIGxhc3QpXG5cdGVsc2UgaWYgKHBvc2l0aW9uID09PSBcImFmdGVyXCIpe1xuXHRcdG5leHRTaWJsaW5nID0gbmV4dChyZWZFbCk7XG5cdH1cblxuXHQvLy8vIDMpIFdlIGFwcGVuZCB0aGUgbmV3RWxcblx0Ly8gaWYgd2UgaGF2ZSBhIG5leHQgc2libGluZywgd2UgaW5zZXJ0IGl0IGJlZm9yZVxuXHRpZiAobmV4dFNpYmxpbmcpe1xuXHRcdHBhcmVudEVsLmluc2VydEJlZm9yZShuZXdFbCwgbmV4dFNpYmxpbmcpO1xuXHR9XG5cdC8vIG90aGVyd2lzZSwgd2UganVzdCBkbyBhIGFwcGVuZCBsYXN0XG5cdGVsc2V7XG5cdFx0aWYgKHBvc2l0aW9uID09PSBcImVtcHR5XCIpe1xuXHRcdFx0Ly8gVE9ETzogQ0lSQ1VMQVIgZGVwZW5kZW5jeS4gUmlnaHQgbm93LCB3ZSBkbyBuZWVkIHRvIGNhbGwgdGhlIHZpZXcuZW1wdHkgdG8gZG8gdGhlIGNvcnJlY3QgZW1wdHksIGJ1dCB2aWV3IGFsc28gdXNlIGRvbS5qc1xuXHRcdFx0Ly8gICAgICAgVGhpcyB3b3JrcyByaWdodCBub3cgYXMgYWxsIHRoZSBtb2R1bGVzIGdldCBtZXJnZWQgaW50byB0aGUgc2FtZSBvYmplY3QsIGJ1dCB3b3VsZCBiZSBnb29kIHRvIGZpbmQgYSBtb3JlIGVsZWdhbnQgc29sdXRpb25cblx0XHRcdHRoaXMuZW1wdHkocmVmRWwpO1xuXHRcdH1cblx0XHRwYXJlbnRFbC5hcHBlbmRDaGlsZChuZXdFbCk7XG5cdH1cblxuXHRyZXR1cm4gbmV3RWw7XHRcbn1cblxuXG5mdW5jdGlvbiBmcmFnKGh0bWwpe1xuXHQvLyBtYWtlIGl0IG51bGwgcHJvb2Zcblx0aHRtbCA9IChodG1sKT9odG1sLnRyaW0oKTpudWxsO1xuXHRpZiAoIWh0bWwpe1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0dmFyIHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xuXHRpZih0ZW1wbGF0ZS5jb250ZW50KXtcblx0XHR0ZW1wbGF0ZS5pbm5lckhUTUwgPSBodG1sO1xuXHRcdHJldHVybiB0ZW1wbGF0ZS5jb250ZW50O1xuXHR9XG5cdC8vIGZvciBJRSAxMVxuXHRlbHNle1xuXHRcdHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdHZhciB0bXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdHRtcC5pbm5lckhUTUwgPSBodG1sO1xuXHRcdHdoaWxlICh0bXAuZmlyc3RDaGlsZCkge1xuXHRcdFx0ZnJhZy5hcHBlbmRDaGlsZCh0bXAuZmlyc3RDaGlsZCk7XG5cdFx0fVxuXHRcdHJldHVybiBmcmFnO1xuXG5cdH1cdFxufVxuLy8gLS0tLS0tLS0tIC9ET00gSGVscGVycyAtLS0tLS0tLS0gLy9cblxuXG5cblxuZnVuY3Rpb24gX3NpYmxpbmcobmV4dCwgZWwsIHNlbGVjdG9yKXtcblx0dmFyIHNpYmxpbmcgPSAobmV4dCk/XCJuZXh0U2libGluZ1wiOlwicHJldmlvdXNTaWJsaW5nXCI7XG5cblx0dmFyIHRtcEVsID0gKGVsKT9lbFtzaWJsaW5nXTpudWxsO1xuXG5cdC8vIHVzZSBcIiE9XCIgZm9yIG51bGwgYW5kIHVuZGVmaW5lZFxuXHR3aGlsZSAodG1wRWwgIT0gbnVsbCAmJiB0bXBFbCAhPT0gZG9jdW1lbnQpe1xuXHRcdC8vIG9ubHkgaWYgbm9kZSB0eXBlIGlzIG9mIEVsZW1lbnQsIG90aGVyd2lzZSwgXG5cdFx0aWYgKHRtcEVsLm5vZGVUeXBlID09PSAxICYmICghc2VsZWN0b3IgfHwgbWF0Y2hlc0ZuLmNhbGwodG1wRWwsIHNlbGVjdG9yKSkpe1xuXHRcdFx0cmV0dXJuIHRtcEVsO1xuXHRcdH1cblx0XHR0bXBFbCA9IHRtcEVsW3NpYmxpbmddO1xuXHR9XG5cdHJldHVybiBudWxsO1xufVxuXG5cbi8vIHV0aWw6IHF1ZXJ5U2VsZWN0b3JbQWxsXSB3cmFwcGVyXG5mdW5jdGlvbiBfZXhlY1F1ZXJ5U2VsZWN0b3IoYWxsLCBlbCwgc2VsZWN0b3Ipe1xuXHQvLyBpZiBlbCBpcyBudWxsIG9yIHVuZGVmaW5lZCwgbWVhbnMgd2UgcmV0dXJuIG5vdGhpbmcuIFxuXHRpZiAodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiIHx8IGVsID09PSBudWxsKXtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXHQvLyBpZiBzZWxlY3RvciBpcyB1bmRlZmluZWQsIGl0IG1lYW5zIHdlIHNlbGVjdCBmcm9tIGRvY3VtZW50IGFuZCBlbCBpcyB0aGUgZG9jdW1lbnRcblx0aWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gXCJ1bmRlZmluZWRcIil7XG5cdFx0c2VsZWN0b3IgPSBlbDtcblx0XHRlbCA9IGRvY3VtZW50O1x0XHRcblx0fVxuXHRyZXR1cm4gKGFsbCk/ZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik6ZWwucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG59XG4iLCJcbnZhciBkb20gPSByZXF1aXJlKFwiLi9kb20uanNcIik7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHB1bGw6IHB1bGwsIFxuXHRwdXNoOiBwdXNoLCBcblx0cHVsbGVyOiBwdWxsZXIsIFxuXHRwdXNoZXI6IHB1c2hlclxufTtcblxudmFyIF9wdXNoZXJzID0gW1xuXG5cdFtcImlucHV0W3R5cGU9J2NoZWNrYm94J10sIGlucHV0W3R5cGU9J3JhZGlvJ11cIiwgZnVuY3Rpb24odmFsdWUpe1xuXHRcdHZhciBpcHRWYWx1ZSA9IHRoaXMudmFsdWUgfHwgXCJvblwiOyAvLyBhcyBzb21lIGJyb3dzZXJzIGRlZmF1bHQgdG8gdGhpc1xuXG5cdFx0Ly8gaWYgdGhlIHZhbHVlIGlzIGFuIGFycmF5LCBpdCBuZWVkIHRvIG1hdGNoIHRoaXMgaXB0VmFsdWVcblx0XHRpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSl7XG5cdFx0XHRpZiAodmFsdWUuaW5kZXhPZihpcHRWYWx1ZSkgPiAtMSl7XG5cdFx0XHRcdHRoaXMuY2hlY2tlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIG90aGVyd2lzZSwgaWYgdmFsdWUgaXMgbm90IGFuIGFycmF5LFxuXHRcdGVsc2UgaWYgKChpcHRWYWx1ZSA9PT0gXCJvblwiICYmIHZhbHVlKSB8fCBpcHRWYWx1ZSA9PT0gdmFsdWUpe1xuXHRcdFx0dGhpcy5jaGVja2VkID0gdHJ1ZTtcblx0XHR9XG5cdH1dLFxuXG5cdFtcImlucHV0XCIsIGZ1bmN0aW9uKHZhbHVlKXtcblx0XHRpZih0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHRoaXMudmFsdWUgPSB2YWx1ZTtcblx0fV0sXG5cblx0W1wic2VsZWN0XCIsIGZ1bmN0aW9uKHZhbHVlKXtcblx0XHRpZih0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHRoaXMudmFsdWUgPSB2YWx1ZTtcblx0fV0sXG5cblx0W1widGV4dGFyZWFcIiwgZnVuY3Rpb24odmFsdWUpe1xuXHRcdGlmKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikgdGhpcy52YWx1ZSA9IHZhbHVlO1xuXHR9XSxcblxuXHRbXCIqXCIsIGZ1bmN0aW9uKHZhbHVlKXtcblx0XHRpZih0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHRoaXMuaW5uZXJIVE1MID0gdmFsdWU7XG5cdH1dXG5dO1xuXG52YXIgX3B1bGxlcnMgPSBbXG5cdFtcImlucHV0W3R5cGU9J2NoZWNrYm94J10sIGlucHV0W3R5cGU9J3JhZGlvJ11cIiwgZnVuY3Rpb24oZXhpc3RpbmdWYWx1ZSl7XG5cblx0XHR2YXIgaXB0VmFsdWUgPSB0aGlzLnZhbHVlIHx8IFwib25cIjsgLy8gYXMgc29tZSBicm93c2VyIGRlZmF1bHQgdG8gdGhpc1xuXHRcdHZhciBuZXdWYWx1ZTtcblx0XHRpZiAodGhpcy5jaGVja2VkKXtcblx0XHRcdC8vIGNoYW5nZSBcIm9uXCIgYnkgdHJ1ZSB2YWx1ZSAod2hpY2ggdXN1YWxseSB3aGF0IHdlIHdhbnQgdG8gaGF2ZSlcblx0XHRcdC8vIFRPRE86IFdlIHNob3VsZCB0ZXN0IHRoZSBhdHRyaWJ1dGUgXCJ2YWx1ZVwiIHRvIGFsbG93IFwib25cIiBpZiBpdCBpcyBkZWZpbmVkXG5cdFx0XHRuZXdWYWx1ZSA9IChpcHRWYWx1ZSAmJiBpcHRWYWx1ZSAhPT0gXCJvblwiKT9pcHRWYWx1ZTp0cnVlO1xuXHRcdFx0aWYgKHR5cGVvZiBleGlzdGluZ1ZhbHVlICE9PSBcInVuZGVmaW5lZFwiKXtcblx0XHRcdFx0Ly8gaWYgd2UgaGF2ZSBhbiBleGlzdGluZ1ZhbHVlIGZvciB0aGlzIHByb3BlcnR5LCB3ZSBjcmVhdGUgYW4gYXJyYXlcblx0XHRcdFx0dmFyIHZhbHVlcyA9IHV0aWxzLmFzQXJyYXkoZXhpc3RpbmdWYWx1ZSk7XG5cdFx0XHRcdHZhbHVlcy5wdXNoKG5ld1ZhbHVlKTtcblx0XHRcdFx0bmV3VmFsdWUgPSB2YWx1ZXM7XG5cdFx0XHR9XHRcdFx0XHRcblx0XHR9XG5cdFx0cmV0dXJuIG5ld1ZhbHVlO1xuXHR9XSxcblxuXHRbXCJpbnB1dCwgc2VsZWN0XCIsIGZ1bmN0aW9uKGV4aXN0aW5nVmFsdWUpe1xuXHRcdHJldHVybiB0aGlzLnZhbHVlO1xuXHR9XSxcblxuXHRbXCJ0ZXh0YXJlYVwiLCBmdW5jdGlvbihleGlzdGluZ1ZhbHVlKXtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZTtcblx0fV0sXG5cblx0W1wiKlwiLCBmdW5jdGlvbihleGlzdGluZ1ZhbHVlKXtcblx0XHRyZXR1cm4gdGhpcy5pbm5lckhUTUw7XG5cdH1dXG5dO1xuXG5mdW5jdGlvbiBwdXNoZXIoc2VsZWN0b3IsZnVuYyl7XG5cdF9wdXNoZXJzLnVuc2hpZnQoW3NlbGVjdG9yLGZ1bmNdKTtcbn1cblxuZnVuY3Rpb24gcHVsbGVyKHNlbGVjdG9yLGZ1bmMpe1xuXHRfcHVsbGVycy51bnNoaWZ0KFtzZWxlY3RvcixmdW5jXSk7XG59XG5cbmZ1bmN0aW9uIHB1c2goZWwsIHNlbGVjdG9yX29yX2RhdGEsIGRhdGEpIHtcblx0dmFyIHNlbGVjdG9yO1xuXG5cdC8vIGlmIGRhdGEgaXMgbnVsbCBvciB1bmRlZmluZWRcblx0aWYgKGRhdGEgPT0gbnVsbCl7XG5cdFx0c2VsZWN0b3IgPSBcIi5keFwiO1xuXHRcdGRhdGEgPSBzZWxlY3Rvcl9vcl9kYXRhO1xuXHR9ZWxzZXtcblx0XHRzZWxlY3RvciA9IHNlbGVjdG9yX29yX2RhdGE7XG5cdH1cblxuXHR2YXIgZHhFbHMgPSBkb20uYWxsKGVsLCBzZWxlY3Rvcik7XG5cblx0dXRpbHMuYXNBcnJheShkeEVscykuZm9yRWFjaChmdW5jdGlvbihkeEVsKXtcblx0XHRcblx0XHR2YXIgcHJvcFBhdGggPSBnZXRQcm9wUGF0aChkeEVsKTtcblx0XHR2YXIgdmFsdWUgPSB1dGlscy52YWwoZGF0YSxwcm9wUGF0aCk7XG5cdFx0dmFyIGkgPSAwLCBwdXNoZXJTZWxlY3RvciwgZnVuLCBsID0gX3B1c2hlcnMubGVuZ3RoO1xuXHRcdGZvciAoOyBpPGwgOyBpKyspe1xuXHRcdFx0cHVzaGVyU2VsZWN0b3IgPSBfcHVzaGVyc1tpXVswXTtcblx0XHRcdGlmIChkb20uX21hdGNoZXNGbi5jYWxsKGR4RWwscHVzaGVyU2VsZWN0b3IpKXtcblx0XHRcdFx0ZnVuID0gX3B1c2hlcnNbaV1bMV07XG5cdFx0XHRcdGZ1bi5jYWxsKGR4RWwsdmFsdWUpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XHRcdFxuXHR9KTtcbn1cblxuZnVuY3Rpb24gcHVsbChlbCwgc2VsZWN0b3Ipe1xuXHR2YXIgb2JqID0ge307XG5cblx0c2VsZWN0b3IgPSAoc2VsZWN0b3IpP3NlbGVjdG9yOlwiLmR4XCI7XG5cblx0dmFyIGR4RWxzID0gZG9tLmFsbChlbCwgc2VsZWN0b3IpO1xuXG5cdHV0aWxzLmFzQXJyYXkoZHhFbHMpLmZvckVhY2goZnVuY3Rpb24oZHhFbCl7XG5cdFx0dmFyIHByb3BQYXRoID0gZ2V0UHJvcFBhdGgoZHhFbCk7XG5cdFx0dmFyIGkgPSAwLCBwdWxsZXJTZWxlY3RvciwgZnVuLCBsID0gX3B1bGxlcnMubGVuZ3RoO1x0XHRcblx0XHRmb3IgKDsgaTxsIDsgaSsrKXtcblx0XHRcdHB1bGxlclNlbGVjdG9yID0gX3B1bGxlcnNbaV1bMF07XG5cdFx0XHRpZiAoZG9tLl9tYXRjaGVzRm4uY2FsbChkeEVsLHB1bGxlclNlbGVjdG9yKSl7XG5cdFx0XHRcdGZ1biA9IF9wdWxsZXJzW2ldWzFdO1xuXHRcdFx0XHR2YXIgZXhpc3RpbmdWYWx1ZSA9IHV0aWxzLnZhbChvYmoscHJvcFBhdGgpO1xuXHRcdFx0XHR2YXIgdmFsdWUgPSBmdW4uY2FsbChkeEVsLGV4aXN0aW5nVmFsdWUpO1xuXHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlICE9PSBcInVuZGVmaW5lZFwiKXtcblx0XHRcdFx0XHR1dGlscy52YWwob2JqLHByb3BQYXRoLHZhbHVlKTtcdFxuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVx0XHRcdFx0XHRcblx0XHR9XHRcdFxuXHR9KTtcblxuXHRyZXR1cm4gb2JqO1xufVxuXG4vKiogXG4gKiBSZXR1cm4gdGhlIHZhcmlhYmxlIHBhdGggb2YgdGhlIGZpcnN0IGR4LS4gXCItXCIgaXMgY2hhbmdlZCB0byBcIi5cIlxuICogXG4gKiBAcGFyYW0gY2xhc3NBdHRyOiBsaWtlIFwicm93IGR4IGR4LWNvbnRhY3QubmFtZVwiXG4gKiBAcmV0dXJuczogd2lsbCByZXR1cm4gXCJjb250YWN0Lm5hbWVcIlxuICoqL1xuZnVuY3Rpb24gZ2V0UHJvcFBhdGgoZHhFbCl7XG5cdHZhciBwYXRoID0gbnVsbDtcblx0dmFyIGkgPTAsIGNsYXNzZXMgPSBkeEVsLmNsYXNzTGlzdCwgbCA9IGR4RWwuY2xhc3NMaXN0Lmxlbmd0aCwgbmFtZTtcblx0Zm9yICg7IGkgPCBsOyBpKyspe1xuXHRcdG5hbWUgPSBjbGFzc2VzW2ldO1xuXHRcdGlmIChuYW1lLmluZGV4T2YoXCJkeC1cIikgPT09IDApe1xuXHRcdFx0cGF0aCA9IG5hbWUuc3BsaXQoXCItXCIpLnNsaWNlKDEpLmpvaW4oXCIuXCIpO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cdC8vIGlmIHdlIGRvIG5vdCBoYXZlIGEgcGF0aCBpbiB0aGUgY3NzLCB0cnkgdGhlIGRhdGEtZHggYXR0cmlidXRlXG5cdGlmICghcGF0aCl7XG5cdFx0cGF0aCA9IGR4RWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1keFwiKTtcblx0fVxuXHRpZiAoIXBhdGgpe1xuXHRcdHBhdGggPSBkeEVsLmdldEF0dHJpYnV0ZShcIm5hbWVcIik7IC8vIGxhc3QgZmFsbCBiYWNrLCBhc3N1bWUgaW5wdXQgZmllbGRcblx0fVxuXHRyZXR1cm4gcGF0aDtcbn1cblxuXG5cbiIsInZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xudmFyIGRvbSA9IHJlcXVpcmUoXCIuL2RvbS5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdG9uOiBvbixcblx0b2ZmOiBvZmYsXG5cdHRyaWdnZXI6IHRyaWdnZXJcbn07XG5cbi8vIC0tLS0tLS0tLSBNb2R1bGUgQVBJcyAtLS0tLS0tLS0gLy9cblxuLy8gYmluZCBhIGV2ZW50IGNhbiBiZSBjYWxsIHdpdGggXG4vLyAtIGVsczogc2luZ2xlIG9yIGFycmF5IG9mIHRoZSBiYXNlIGRvbSBlbGVtZW50cyB0byBiaW5kIHRoZSBldmVudCBsaXN0ZW5lciB1cG9uLlxuLy8gLSB0eXBlOiBldmVudCB0eXBlIChsaWtlICdjbGljaycgb3IgY2FuIGJlIGN1c3RvbSBldmVudCkuXG4vLyAtIHNlbGVjdG9yOiAob3B0aW9uYWwpIHF1ZXJ5IHNlbGVjdG9yIHdoaWNoIHdpbGwgYmUgdGVzdGVkIG9uIHRoZSB0YXJnZXQgZWxlbWVudC4gXG4vLyAtIGxpc3RlbmVyOiBmdW5jdGlvbiB3aGljaCB3aWxsIGdldCB0aGUgXCJldmVudFwiIGFzIGZpcnN0IHBhcmFtZXRlclxuLy8gLSBvcHRzOiAob3B0aW9uYWwpIHtucyxjdHh9IG9wdGlvbmFsIG5hbWVzcGFjZSBhbmQgY3R4IChpLmUuIHRoaXMpXG5mdW5jdGlvbiBvbihlbHMsIHR5cGVzLCBzZWxlY3RvciwgbGlzdGVuZXIsIG9wdHMpe1xuXG5cdC8vIGlmIHRoZSBcInNlbGVjdG9yXCIgaXMgYSBmdW5jdGlvbiwgdGhlbiwgaXQgaXMgdGhlIGxpc3RlbmVyIGFuZCB0aGVyZSBpcyBubyBzZWxlY3RvclxuXHRpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbil7XG5cdFx0bGlzdGVuZXIgPSBzZWxlY3Rvcjtcblx0XHRzZWxlY3RvciA9IG51bGw7XG5cdFx0b3B0cyA9IGxpc3RlbmVyO1xuXHR9XG5cblx0dHlwZXMgPSB1dGlscy5zcGxpdEFuZFRyaW0odHlwZXMsIFwiLFwiKTtcblxuXHR0eXBlcy5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUpe1xuXHRcdHZhciB0eXBlU2VsZWN0b3JLZXkgPSBidWlsZFR5cGVTZWxlY3RvcktleSh0eXBlLCBzZWxlY3Rvcik7XG5cblx0XHR1dGlscy5hc0FycmF5KGVscykuZm9yRWFjaChmdW5jdGlvbihlbCl7XG5cblx0XHRcdC8vIFRoaXMgd2lsbCB0aGUgbGlzdGVuZXIgdXNlIGZvciB0aGUgZXZlbiBsaXN0ZW5lciwgd2hpY2ggbWlnaHQgZGlmZmVyXG5cdFx0XHQvLyBmcm9tIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiBwYXNzZWQgaW4gY2FzZSBvZiBhIHNlbGVjdG9yXG5cdFx0XHR2YXIgX2xpc3RlbmVyID0gbGlzdGVuZXI7IFxuXG5cdFx0XHQvLyBpZiB3ZSBoYXZlIGEgc2VsZWN0b3IsIGNyZWF0ZSB0aGUgd3JhcHBlciBsaXN0ZW5lciB0byBkbyB0aGUgbWF0Y2hlcyBvbiB0aGUgc2VsZWN0b3Jcblx0XHRcdGlmIChzZWxlY3Rvcil7XG5cdFx0XHRcdF9saXN0ZW5lciA9IGZ1bmN0aW9uKGV2dCl7XG5cdFx0XHRcdFx0dmFyIHRndCA9IG51bGw7XG5cdFx0XHRcdFx0dmFyIHRhcmdldCA9IGV2dC50YXJnZXQ7XG5cdFx0XHRcdFx0dmFyIGN1cnJlbnRUYXJnZXQgPSBldnQuY3VycmVudFRhcmdldDtcblx0XHRcdFx0XHR2YXIgY3R4ID0gKG9wdHMpP29wdHMuY3R4Om51bGw7XG5cdFx0XHRcdFx0Ly8gaWYgdGhlIHRhcmdldCBtYXRjaCB0aGUgc2VsZWN0b3IsIHRoZW4sIGVhc3ksIHdlIGNhbGwgdGhlIGxpc3RlbmVyXG5cdFx0XHRcdFx0aWYgKHRhcmdldCAmJiBkb20uX21hdGNoZXNGbi5jYWxsKHRhcmdldCxzZWxlY3Rvcikpe1xuXHRcdFx0XHRcdFx0Ly8gTm90ZTogV2hpbGUgbW91c2VFdmVudCBhcmUgcmVhZG9ubHkgZm9yIGl0cyBwcm9wZXJ0aWVzLCBpdCBkb2VzIGFsbG93IHRvIGFkZCBjdXN0b20gcHJvcGVydGllc1xuXHRcdFx0XHRcdFx0ZXZ0LnNlbGVjdFRhcmdldCA9IHRhcmdldDtcblx0XHRcdFx0XHRcdGxpc3RlbmVyLmNhbGwoY3R4LGV2dCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIG5vdywgaWYgaXQgZG9lcyBub3QsIHBlcmhhcHMgc29tZXRoaW5nIGluIGJldHdlZW4gdGhlIHRhcmdldCBhbmQgY3VycmVudFRhcmdldFxuXHRcdFx0XHRcdC8vIG1pZ2h0IG1hdGNoXG5cdFx0XHRcdFx0ZWxzZXtcblx0XHRcdFx0XHRcdHRndCA9IGV2dC50YXJnZXQucGFyZW50Tm9kZTtcblx0XHRcdFx0XHRcdC8vIFRPRE86IG1pZ2h0IG5lZWQgdG8gY2hlY2sgdGhhdCB0Z3QgaXMgbm90IHVuZGVmaW5lZCBhcyB3ZWxsLiBcblx0XHRcdFx0XHRcdHdoaWxlICh0Z3QgIT09IG51bGwgJiYgdGd0ICE9PSBjdXJyZW50VGFyZ2V0ICYmIHRndCAhPT0gZG9jdW1lbnQpe1xuXHRcdFx0XHRcdFx0XHRpZiAoZG9tLl9tYXRjaGVzRm4uY2FsbCh0Z3Qsc2VsZWN0b3IpKXtcblx0XHRcdFx0XHRcdFx0XHQvLyBOb3RlOiBXaGlsZSBtb3VzZUV2ZW50IGFyZSByZWFkb25seSBmb3IgaXRzIHByb3BlcnRpZXMsIGl0IGRvZXMgYWxsb3cgdG8gYWRkIGN1c3RvbSBwcm9wZXJ0aWVzXG5cdFx0XHRcdFx0XHRcdFx0ZXZ0LnNlbGVjdFRhcmdldCA9IHRndDtcblx0XHRcdFx0XHRcdFx0XHRsaXN0ZW5lci5jYWxsKGN0eCxldnQpO1xuXHRcdFx0XHRcdFx0XHRcdHRndCA9IG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHR0Z3QgPSB0Z3QucGFyZW50Tm9kZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHQvLyBpZiB3ZSBkbyBub3QgaGF2ZSBhIHNlbGVjdG9yLCBidXQgc3RpbGwgaGF2ZWEgIG9wdHMuY3R4LCB0aGVuLCBuZWVkIHRvIHdyYXBcblx0XHRcdGVsc2UgaWYgKG9wdHMgJiYgb3B0cy5jdHgpe1xuXHRcdFx0XHRfbGlzdGVuZXIgPSBmdW5jdGlvbihldnQpe1xuXHRcdFx0XHRcdGxpc3RlbmVyLmNhbGwob3B0cy5jdHgsZXZ0KTtcblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dmFyIGxpc3RlbmVyUmVmID0ge1xuXHRcdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsIC8vIHRoZSBsaXN0ZW5lciBhcyBwYXNzZWQgYnkgdGhlIHVzZXJcblx0XHRcdFx0X2xpc3RlbmVyOiBfbGlzdGVuZXIsIC8vIGFuIGV2ZW50dWFsIHdyYXAgb2YgdGhlIGxpc3RlbmVyLCBvciBqdXN0IHBvaW50IGxpc3RlbmVyLlxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHNlbGVjdG9yKXtcblx0XHRcdFx0bGlzdGVuZXJSZWYuc2VsZWN0b3IgPSBzZWxlY3Rvcjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgd2UgaGF2ZSBhIG5hbWVzcGFjZSwgdGhleSBhZGQgaXQgdG8gdGhlIFJlZiwgYW5kIHRvIHRoZSBsaXN0ZW5lclJlZnNCeU5zXG5cdFx0XHQvLyBUT0RPOiBuZWVkIHRvIGFkZCBsaXN0ZW5lclJlZiBpbiBhIG5zRGljIGlmIGlmIHRoZXJlIGEgb3B0cy5uc1xuXHRcdFx0aWYgKG9wdHMgJiYgb3B0cy5ucyl7XG5cdFx0XHRcdGxpc3RlbmVyUmVmLm5zID0gb3B0cy5ucztcblx0XHRcdFx0dmFyIGxpc3RlbmVyUmVmU2V0QnlOcyA9IHV0aWxzLmVuc3VyZU1hcChlbCxcImxpc3RlbmVyUmVmc0J5TnNcIik7XG5cdFx0XHRcdHZhciBsaXN0ZW5lclJlZlNldCA9IHV0aWxzLmVuc3VyZVNldChsaXN0ZW5lclJlZlNldEJ5TnMsIG9wdHMubnMpO1xuXHRcdFx0XHRsaXN0ZW5lclJlZlNldC5hZGQobGlzdGVuZXJSZWYpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBhZGQgdGhlIGxpc3RlbmVyUmVmIGFzIGxpc3RlbmVyOmxpc3RlbmVyUmVmIGVudHJ5IGZvciB0aGlzIHR5cGVTZWxlY3RvcktleSBpbiB0aGUgbGlzdGVuZXJEaWNcblx0XHRcdHZhciBsaXN0ZW5lckRpYyA9IHV0aWxzLmVuc3VyZU1hcChlbCxcImxpc3RlbmVyRGljXCIpO1xuXHRcdFx0dmFyIGxpc3RlbmVyUmVmQnlMaXN0ZW5lciA9IHV0aWxzLmVuc3VyZU1hcChsaXN0ZW5lckRpYyx0eXBlU2VsZWN0b3JLZXkpO1xuXHRcdFx0bGlzdGVuZXJSZWZCeUxpc3RlbmVyLnNldChsaXN0ZW5lciwgbGlzdGVuZXJSZWYpO1xuXG5cdFx0XHQvLyBkbyB0aGUgYmluZGluZ1xuXHRcdFx0ZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBfbGlzdGVuZXIpO1xuXG5cdFx0XHRyZXR1cm4gdGhpcztcblxuXHRcdH0pOyAvLyAvdXRpbHMuYXNBcnJheShlbHMpLmZvckVhY2goZnVuY3Rpb24oZWwpe1xuXG5cdH0pOyAvLyAvdHlwZXMuZm9yRWFjaChmdW5jdGlvbih0eXBlKXtcblxufVxuXG5cbi8vIHJlbW92ZSB0aGUgZXZlbnQgYmluZGluZ1xuLy8gLm9mZihlbHMpOyByZW1vdmUgYWxsIGV2ZW50cyBhZGRlZCB2aWEgLm9uXG4vLyAub2ZmKGVscywgdHlwZSk7IHJlbW92ZSBhbGwgZXZlbnRzIG9mIHR5cGUgYWRkZWQgdmlhIC5vblxuLy8gLm9mZihlbHMsIHR5cGUsIHNlbGVjdG9yKTsgcmVtb3ZlIGFsbCBldmVudHMgb2YgdHlwZSBhbmQgc2VsZWN0b3IgYWRkZWQgdmlhIC5vblxuLy8gLm9mZihlbHMsIHR5cGUsIHNlbGVjdG9yLCBsaXN0ZW5lcik7IHJlbW92ZSBldmVudCBvZiB0aGlzIHR5cGUsIHNlbGVjdG9yLCBhbmQgbGlzdGVuZXJcbi8vIC5vZmYoZWxzLHtuc30pOyByZW1vdmUgZXZlbnQgZnJvbSB0aGUgbmFtZXNwYWNlIG5zXG5mdW5jdGlvbiBvZmYoZWxzLCB0eXBlLCBzZWxlY3RvciwgbGlzdGVuZXIpe1xuXG5cdC8vIC0tLS0tLS0tLSBvZmYoZWxzLCB7bnN9KSAtLS0tLS0tLS0gLy9cblx0Ly8gaWYgd2UgaGF2ZSBhIC5vZmYoZWxzLHtuczouLn0pIHRoZW4gd2UgZG8gY2hlY2sgb25seSB0aGUgbnNcblx0aWYgKHR5cGUubnMpe1x0XHRcblx0XHR2YXIgbnMgPSB0eXBlLm5zO1xuXHRcdHV0aWxzLmFzQXJyYXkoZWxzKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKXtcblx0XHRcdHZhciBsaXN0ZW5lckRpYyA9IGVsW1wibGlzdGVuZXJEaWNcIl07XG5cdFx0XHR2YXIgbGlzdGVuZXJSZWZzQnlOcyA9IGVsW1wibGlzdGVuZXJSZWZzQnlOc1wiXTtcblx0XHRcdHZhciBsaXN0ZW5lclJlZlNldDtcblx0XHRcdGlmIChsaXN0ZW5lclJlZnNCeU5zKXtcblx0XHRcdFx0bGlzdGVuZXJSZWZTZXQgPSBsaXN0ZW5lclJlZnNCeU5zLmdldChucyk7XG5cdFx0XHRcdGlmIChsaXN0ZW5lclJlZlNldCl7XG5cdFx0XHRcdFx0Ly8gaWYgd2UgZ2V0IHRoZSBzZXQsIHdlIHJlbW92ZSB0aGVtIGFsbFxuXHRcdFx0XHRcdGxpc3RlbmVyUmVmU2V0LmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXJSZWYpe1xuXHRcdFx0XHRcdFx0Ly8gd2UgcmVtb3ZlIHRoZSBldmVudCBsaXN0ZW5lclxuXHRcdFx0XHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihsaXN0ZW5lclJlZi50eXBlLCBsaXN0ZW5lclJlZi5fbGlzdGVuZXIpO1xuXG5cdFx0XHRcdFx0XHQvLyBuZWVkIHRvIHJlbW92ZSBpdCBmcm9tIHRoZSBsaXN0ZW5lckRpY1xuXHRcdFx0XHRcdFx0dmFyIHR5cGVTZWxlY3RvcktleSA9IGJ1aWxkVHlwZVNlbGVjdG9yS2V5KGxpc3RlbmVyUmVmLnR5cGUsIGxpc3RlbmVyUmVmLnNlbGVjdG9yKTtcblx0XHRcdFx0XHRcdHZhciBsaXN0ZW5lclJlZk1hcEJ5TGlzdGVuZXIgPSBsaXN0ZW5lckRpYy5nZXQodHlwZVNlbGVjdG9yS2V5KTtcblx0XHRcdFx0XHRcdGlmIChsaXN0ZW5lclJlZk1hcEJ5TGlzdGVuZXIuaGFzKGxpc3RlbmVyUmVmLmxpc3RlbmVyKSl7XG5cdFx0XHRcdFx0XHRcdGxpc3RlbmVyUmVmTWFwQnlMaXN0ZW5lci5kZWxldGUobGlzdGVuZXJSZWYubGlzdGVuZXIpO1xuXHRcdFx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiSU5URVJOQUwgRVJST1Igc2hvdWxkIGhhdmUgYSBsaXN0ZW5lciBpbiBlbC5saXN0ZW5lckRpYyBmb3IgXCIgKyB0eXBlU2VsZWN0b3JLZXkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdC8vIHdlIHJlbW92ZSB0aGlzIG5hbWVzcGFjZSBub3cgdGhhdCBhbGwgZXZlbnQgaGFuZGxlcnMgaGFzIGJlZW4gcmVtb3ZlZFxuXHRcdFx0XHRcdGxpc3RlbmVyUmVmc0J5TnMuZGVsZXRlKG5zKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybjtcblx0fVxuXHQvLyAtLS0tLS0tLS0gL29mZihlbHMsIHtuc30pIC0tLS0tLS0tLSAvL1xuXG5cblx0Ly8gaWYgdGhlIFwic2VsZWN0b3JcIiBpcyBhIGZ1bmN0aW9uLCB0aGVuLCBpdCBpcyB0aGUgbGlzdGVuZXIgYW5kIHRoZXJlIGlzIG5vIHNlbGVjdG9yXG5cdGlmIChzZWxlY3RvciBpbnN0YW5jZW9mIEZ1bmN0aW9uKXtcblx0XHRsaXN0ZW5lciA9IHNlbGVjdG9yO1xuXHRcdHNlbGVjdG9yID0gbnVsbDtcblx0fVxuXG5cdHZhciB0eXBlU2VsZWN0b3JLZXkgPSBidWlsZFR5cGVTZWxlY3RvcktleSh0eXBlLCBzZWxlY3Rvcik7XG5cblx0dXRpbHMuYXNBcnJheShlbHMpLmZvckVhY2goZnVuY3Rpb24oZWwpe1xuXG5cdFx0Ly8gRmlyc3QsIGdldCB0aGUgbGlzdGVuZXJSZWZCeUxpc3RlbmVyIGZvciB0aGlzIHR5cGUvc2VsZWN0b3J5XG5cdFx0dmFyIGxpc3RlbmVyUmVmTWFwQnlMaXN0ZW5lciA9IHV0aWxzLnZhbChlbCxbXCJsaXN0ZW5lckRpY1wiLHR5cGVTZWxlY3RvcktleV0pO1xuXG5cdFx0Ly8gZm9yIG5vdywgaWYgd2UgZG8gbm90IGhhdmUgYSBsaXN0ZW5lclJlZiBmb3IgdGhpcyB0eXBlL1tzZWxlY3Rvcl0sIHdlIHRocm93IGFuIGVycm9yXG5cdFx0aWYgKCFsaXN0ZW5lclJlZk1hcEJ5TGlzdGVuZXIpe1xuXHRcdFx0Y29uc29sZS5sb2coXCJXQVJOSU5HIC0gQ2Fubm90IGRvIC5vZmYoKSBzaW5jZSB0aGlzIHR5cGUtc2VsZWN0b3IgJ1wiICsgdHlwZVNlbGVjdG9yS2V5ICsgXG5cdFx0XHRcdFwiJyBldmVudCB3YXMgbm90IGJvdW5kIHdpdGggLm9uKCkuIFdlIHdpbGwgYWRkIHN1cHBvcnQgZm9yIHRoaXMgbGF0ZXIuXCIpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIGlmIHdlIGRvIG5vdCBoYXZlIGEgbGlzdGVuZXIgZnVuY3Rpb24sIHRoaXMgbWVhbiB3ZSBuZWVkIHRvIHJlbW92ZSBhbGwgZXZlbnRzIGZvciB0aGlzIHR5cGUvc2VsZWN0b3Jcblx0XHRpZiAodHlwZW9mIGxpc3RlbmVyID09PSBcInVuZGVmaW5lZFwiKXtcblx0XHRcdGxpc3RlbmVyUmVmTWFwQnlMaXN0ZW5lci5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyUmVmKXtcblx0XHRcdFx0Ly8gTm90ZTogSGVyZSwgdHlwZSA9PT0gbGlzdGVuZXJSZWYudHlwZVxuXHRcdFx0XHQvLyByZW1vdmUgdGhlIGV2ZW50XG5cdFx0XHRcdGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXJSZWYuX2xpc3RlbmVyKTtcdFx0XHRcdFxuXHRcdFx0fSk7XG5cdFx0XHRlbFtcImxpc3RlbmVyRGljXCJdLmRlbGV0ZSh0eXBlU2VsZWN0b3JLZXkpO1xuXHRcdH1cblx0XHQvLyBpZiB3ZSBoYXZlIGEgbGlzdGVuZXIsIHRoZW4sIGp1c3QgcmVtb3ZlIHRoaXMgb25lLlxuXHRcdGVsc2V7XG5cdFx0XHQvLyBjaGVjayB0aGF0IHdlIGhhdmUgdGhlIG1hcC4gXG5cdFx0XHR2YXIgbGlzdGVuZXJSZWYgPSBsaXN0ZW5lclJlZk1hcEJ5TGlzdGVuZXIuZ2V0KGxpc3RlbmVyKTtcblxuXHRcdFx0aWYgKCFsaXN0ZW5lclJlZil7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiV0FSTklORyAtIENhbm5vdCBkbyAub2ZmKCkgc2luY2Ugbm8gbGlzdGVuZXJSZWYgZm9yIFwiICsgdHlwZVNlbGVjdG9yS2V5ICsgXG5cdFx0XHRcdFwiIGFuZCBmdW5jdGlvbiBcXG5cIiArIGxpc3RlbmVyICsgXCJcXG4gd2VyZSBmb3VuZC4gUHJvYmFibHkgd2FzIG5vdCByZWdpc3RlcmVkIHZpYSBvbigpXCIpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIHJlbW92ZSB0aGUgZXZlbnRcblx0XHRcdGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXJSZWYuX2xpc3RlbmVyKTtcblxuXHRcdFx0Ly8gcmVtb3ZlIGl0IGZyb20gdGhlIG1hcFxuXHRcdFx0bGlzdGVuZXJSZWZNYXBCeUxpc3RlbmVyLmRlbGV0ZShsaXN0ZW5lcik7XHRcdFx0XG5cdFx0fVxuXG5cblx0fSk7XHRcbn1cblxudmFyIGN1c3RvbURlZmF1bHRQcm9wcyA9IHtcblx0YnViYmxlczogdHJ1ZSxcblx0Y2FuY2VsYWJsZTogdHJ1ZVxufTtcblxuZnVuY3Rpb24gdHJpZ2dlcihlbHMsIHR5cGUsIGRhdGEpe1xuXHR2YXIgZXZ0ID0gbmV3IEN1c3RvbUV2ZW50KHR5cGUsIE9iamVjdC5hc3NpZ24oe30sY3VzdG9tRGVmYXVsdFByb3BzLGRhdGEpKTtcdFxuXHR1dGlscy5hc0FycmF5KGVscykuZm9yRWFjaChmdW5jdGlvbihlbCl7XG5cdFx0ZWwuZGlzcGF0Y2hFdmVudChldnQpO1xuXHR9KTtcbn1cbi8vIC0tLS0tLS0tLSAvTW9kdWxlIEFQSXMgLS0tLS0tLS0tIC8vXG5cblxuZnVuY3Rpb24gYnVpbGRUeXBlU2VsZWN0b3JLZXkodHlwZSwgc2VsZWN0b3Ipe1xuXHR2YXIgdiA9IHR5cGU7XG5cdHJldHVybiAoc2VsZWN0b3IpPyh2ICsgXCItLVwiICsgc2VsZWN0b3IpOnY7XG59XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGh1YjogaHViXG59O1xuXG4vLyBVc2VyIEh1YiBvYmplY3QgZXhwb3NpbmcgdGhlIHB1YmxpYyBBUElcbnZhciBodWJEaWMgPSBuZXcgTWFwKCk7XG5cbi8vIERhdGEgZm9yIGVhY2ggaHViIChieSBuYW1lKVxudmFyIGh1YkRhdGFEaWMgPSBuZXcgTWFwKCk7IFxuXG4vLyBnZXQgb3IgY3JlYXRlIGEgbmV3IGh1YjtcbmZ1bmN0aW9uIGh1YihuYW1lKXtcblx0aWYgKG5hbWUgPT0gbnVsbCl7XG5cdFx0dGhyb3cgXCJNVkRPTSBJTlZBTElEIEFQSSBDQUxMUzogZm9yIG5vdywgZC5odWIobmFtZSkgcmVxdWlyZSBhIG5hbWUgKG5vIG5hbWUgd2FzIGdpdmVuKS5cIjtcblx0fVxuXHR2YXIgaCA9IGh1YkRpYy5nZXQobmFtZSk7IFxuXHQvLyBpZiBpdCBkb2VzIG5vdCBleGlzdCwgd2UgY3JlYXRlIGFuZCBzZXQgaXQuIFxuXHRpZiAoIWgpe1xuXHRcdC8vIGNyZWF0ZSB0aGUgaHViXG5cdFx0aCA9IE9iamVjdC5jcmVhdGUoSHViUHJvdG8sIHtcblx0XHRcdG5hbWU6IHsgdmFsdWU6IG5hbWUgfSAvLyByZWFkIG9ubHlcblx0XHR9KTtcblx0XHRodWJEaWMuc2V0KG5hbWUsIGgpO1xuXG5cdFx0Ly8gY3JlYXRlIHRoZSBodWJEYXRhXG5cdFx0aHViRGF0YURpYy5zZXQobmFtZSwgbmV3IEh1YkRhdGFQcm90byhuYW1lKSk7XG5cdH1cblx0cmV0dXJuIGg7XG59XG5cbmh1Yi5kZWxldGUgPSBmdW5jdGlvbihuYW1lKXtcblx0aHViRGljLmRlbGV0ZShuYW1lKTtcblx0aHViRGF0YURpYy5kZWxldGUobmFtZSk7XG59O1xuXG4vLyAtLS0tLS0tLS0gSHViIC0tLS0tLS0tLSAvL1xudmFyIEh1YlByb3RvID0ge1xuXHRzdWI6IGZ1bmN0aW9uKHRvcGljcywgbGFiZWxzLCBoYW5kbGVyLCBvcHRzKXtcblx0XHQvLyBBUkcgU0hJRlRJTkc6IGlmIGxhYmVscyBhcmcgaXMgYSBmdW5jdGlvbiwgdGhlbiwgd2Ugc3dpdGggdGhlIGFyZ3VtZW50IGxlZnRcblx0XHRpZiAodHlwZW9mIGxhYmVscyA9PT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdG9wdHMgPSBoYW5kbGVyO1xuXHRcdFx0aGFuZGxlciA9IGxhYmVscztcdFx0XHRcblx0XHRcdGxhYmVscyA9IG51bGw7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIG1ha2UgYXJyYXlzXG5cdFx0dG9waWNzID0gdXRpbHMuc3BsaXRBbmRUcmltKHRvcGljcywgXCIsXCIpO1xuXHRcdGlmIChsYWJlbHMgIT0gbnVsbCl7XG5cdFx0XHRsYWJlbHMgPSB1dGlscy5zcGxpdEFuZFRyaW0obGFiZWxzLCBcIixcIik7XG5cdFx0fVxuXG5cdFx0Ly8gbWFrZSBvcHRzIChhbHdheXMgZGVmaW5lZCBhdCBsZWFzdCBhbiBlbXRweSBvYmplY3QpXG5cdFx0b3B0cyA9IG1ha2VPcHRzKG9wdHMpO1xuXG5cdFx0Ly8gYWRkIHRoZSBldmVudCB0byB0aGUgaHViRGF0YVxuXHRcdHZhciBodWJEYXRhID0gaHViRGF0YURpYy5nZXQodGhpcy5uYW1lKTtcblx0XHRodWJEYXRhLmFkZEV2ZW50KHRvcGljcywgbGFiZWxzLCBoYW5kbGVyLCBvcHRzKTtcblx0fSwgXG5cblx0dW5zdWI6IGZ1bmN0aW9uKG5zKXtcblx0XHR2YXIgaHViRGF0YSA9IGh1YkRhdGFEaWMuZ2V0KHRoaXMubmFtZSk7XG5cdFx0aHViRGF0YS5yZW1vdmVSZWZzRm9yTnMobnMpO1xuXHR9LCBcblxuXHRwdWI6IGZ1bmN0aW9uKHRvcGljcywgbGFiZWxzLCBkYXRhKXtcblx0XHQvLyBBUkcgU0hJRlRJTkc6IGlmIGRhdGEgaXMgdW5kZWZpbmVkLCB3ZSBzaGlmdCBhcmdzIHRvIHRoZSBSSUdIVFxuXHRcdGlmICh0eXBlb2YgZGF0YSA9PT0gXCJ1bmRlZmluZWRcIil7XG5cdFx0XHRkYXRhID0gbGFiZWxzO1xuXHRcdFx0bGFiZWxzID0gbnVsbDtcblx0XHR9XG5cblx0XHR0b3BpY3MgPSB1dGlscy5zcGxpdEFuZFRyaW0odG9waWNzLCBcIixcIik7XG5cblxuXHRcdGlmIChsYWJlbHMgIT0gbnVsbCl7XG5cdFx0XHRsYWJlbHMgPSB1dGlscy5zcGxpdEFuZFRyaW0obGFiZWxzLCBcIixcIik7XHRcdFxuXHRcdH1cblxuXHRcdHZhciBodWJEYXRhID0gaHViRGF0YURpYy5nZXQodGhpcy5uYW1lKTtcblxuXHRcdHZhciBoYXNMYWJlbHMgPSAobGFiZWxzICE9IG51bGwgJiYgbGFiZWxzLmxlbmd0aCA+IDApO1xuXG5cdFx0Ly8gaWYgd2UgaGF2ZSBsYWJlbHMsIHRoZW4sIHdlIHNlbmQgdGhlIGxhYmVscyBib3VuZCBldmVudHMgZmlyc3Rcblx0XHRpZiAoaGFzTGFiZWxzKXtcblx0XHRcdGh1YkRhdGEuZ2V0UmVmcyh0b3BpY3MsIGxhYmVscykuZm9yRWFjaChmdW5jdGlvbihyZWYpe1xuXHRcdFx0XHRpbnZva2VSZWYocmVmLCBkYXRhKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vIHRoZW4sIHdlIHNlbmQgdGhlIHRvcGljIG9ubHkgYm91bmRcblx0XHRodWJEYXRhLmdldFJlZnModG9waWNzKS5mb3JFYWNoKGZ1bmN0aW9uKHJlZil7XG5cdFx0XHQvLyBpZiB0aGlzIHNlbmQsIGhhcyBsYWJlbCwgdGhlbiwgd2UgbWFrZSBzdXJlIHdlIGludm9rZSBmb3IgZWFjaCBvZiB0aGlzIGxhYmVsXG5cdFx0XHRpZiAoaGFzTGFiZWxzKXtcblx0XHRcdFx0bGFiZWxzLmZvckVhY2goZnVuY3Rpb24obGFiZWwpe1xuXHRcdFx0XHRcdGludm9rZVJlZihyZWYsZGF0YSwgbGFiZWwpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdC8vIGlmIHdlIGRvIG5vdCBoYXZlIGxhYmVscywgdGhlbiwganVzdCBjYWxsIGl0LlxuXHRcdFx0ZWxzZXtcblx0XHRcdFx0aW52b2tlUmVmKHJlZiwgZGF0YSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0fSwgXG5cblx0ZGVsZXRlSHViOiBmdW5jdGlvbigpe1xuXHRcdGh1YkRpYy5kZWxldGUodGhpcy5uYW1lKTtcblx0XHRodWJEYXRhRGljLmRlbGV0ZSh0aGlzLm5hbWUpO1xuXHR9XG59O1xuLy8gLS0tLS0tLS0tIC9IdWIgLS0tLS0tLS0tIC8vXG5cbi8vIC0tLS0tLS0tLSBIdWJEYXRhIC0tLS0tLS0tLSAvL1xuZnVuY3Rpb24gSHViRGF0YVByb3RvKG5hbWUpe1xuXHR0aGlzLm5hbWUgPSBuYW1lO1xuXHR0aGlzLnJlZnNCeU5zID0gbmV3IE1hcCgpO1xuXHR0aGlzLnJlZnNCeVRvcGljID0gbmV3IE1hcCgpO1xuXHR0aGlzLnJlZnNCeVRvcGljTGFiZWwgPSBuZXcgTWFwKCk7XG59XG5cbkh1YkRhdGFQcm90by5wcm90b3R5cGUuYWRkRXZlbnQgPSBmdW5jdGlvbih0b3BpY3MsIGxhYmVscywgZnVuLCBvcHRzKXtcblx0dmFyIHJlZnMgPSBidWlsZFJlZnModG9waWNzLCBsYWJlbHMsIGZ1biwgb3B0cyk7XG5cdHZhciByZWZzQnlOcyA9IHRoaXMucmVmc0J5TnM7XG5cdHZhciByZWZzQnlUb3BpYyA9IHRoaXMucmVmc0J5VG9waWM7XG5cdHZhciByZWZzQnlUb3BpY0xhYmVsID0gdGhpcy5yZWZzQnlUb3BpY0xhYmVsO1xuXHRyZWZzLmZvckVhY2goZnVuY3Rpb24ocmVmKXtcblx0XHQvLyBhZGQgdGhpcyByZWYgdG8gdGhlIG5zIGRpY3Rpb25hcnlcblx0XHQvLyBUT0RPOiBwcm9iYWJseSBuZWVkIHRvIGFkZCBhbiBjdXN0b20gXCJuc1wiXG5cdFx0aWYgKHJlZi5ucyAhPSBudWxsKXtcblx0XHRcdHV0aWxzLmVuc3VyZUFycmF5KHJlZnNCeU5zLCByZWYubnMpLnB1c2gocmVmKTtcblx0XHR9XG5cdFx0Ly8gaWYgd2UgaGF2ZSBhIGxhYmVsLCBhZGQgdGhpcyByZWYgdG8gdGhlIHRvcGljTGFiZWwgZGljdGlvbmFyeVxuXHRcdGlmIChyZWYubGFiZWwgIT0gbnVsbCl7XG5cdFx0XHR1dGlscy5lbnN1cmVBcnJheShyZWZzQnlUb3BpY0xhYmVsLCBidWlsZFRvcGljTGFiZWxLZXkocmVmLnRvcGljLCByZWYubGFiZWwpKS5wdXNoKHJlZik7XG5cdFx0fVxuXHRcdC8vIE90aGVyd2lzZSwgYWRkIGl0IHRvIHRoaXMgcmVmIHRoaXMgdG9waWNcblx0XHRlbHNle1xuXHRcdFx0XG5cdFx0XHR1dGlscy5lbnN1cmVBcnJheShyZWZzQnlUb3BpYywgcmVmLnRvcGljKS5wdXNoKHJlZik7XG5cdFx0fVxuXHR9KTtcbn07XG5cbkh1YkRhdGFQcm90by5wcm90b3R5cGUuZ2V0UmVmcyA9IGZ1bmN0aW9uKHRvcGljcywgbGFiZWxzKSB7XG5cdHZhciByZWZzID0gW107XG5cdHZhciByZWZzQnlUb3BpYyA9IHRoaXMucmVmc0J5VG9waWM7XG5cdHZhciByZWZzQnlUb3BpY0xhYmVsID0gdGhpcy5yZWZzQnlUb3BpY0xhYmVsO1xuXHRcblx0dG9waWNzLmZvckVhY2goZnVuY3Rpb24odG9waWMpe1xuXHRcdC8vIGlmIHdlIGRvIG5vdCBoYXZlIGxhYmVscywgdGhlbiwganVzdCBsb29rIGluIHRoZSB0b3BpYyBkaWNcblx0XHRpZiAobGFiZWxzID09IG51bGwgfHwgbGFiZWxzLmxlbmd0aCA9PT0gMCl7XG5cdFx0XHR2YXIgdG9waWNSZWZzID0gcmVmc0J5VG9waWMuZ2V0KHRvcGljKTtcblx0XHRcdGlmICh0b3BpY1JlZnMpe1xuXHRcdFx0XHRyZWZzLnB1c2guYXBwbHkocmVmcywgdG9waWNSZWZzKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gaWYgd2UgaGF2ZSBzb21lIGxhYmVscywgdGhlbiwgdGFrZSB0aG9zZSBpbiBhY2NvdW50c1xuXHRcdGVsc2V7XG5cdFx0XHRsYWJlbHMuZm9yRWFjaChmdW5jdGlvbihsYWJlbCl7XG5cdFx0XHRcdHZhciB0b3BpY0xhYmVsUmVmcyA9IHJlZnNCeVRvcGljTGFiZWwuZ2V0KGJ1aWxkVG9waWNMYWJlbEtleSh0b3BpYywgbGFiZWwpKTtcblx0XHRcdFx0aWYgKHRvcGljTGFiZWxSZWZzKXtcblx0XHRcdFx0XHRyZWZzLnB1c2guYXBwbHkocmVmcywgdG9waWNMYWJlbFJlZnMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gcmVmcztcbn07XG5cbkh1YkRhdGFQcm90by5wcm90b3R5cGUucmVtb3ZlUmVmc0Zvck5zID0gZnVuY3Rpb24obnMpe1xuXHR2YXIgcmVmc0J5VG9waWMgPSB0aGlzLnJlZnNCeVRvcGljO1xuXHR2YXIgcmVmc0J5VG9waWNMYWJlbCA9IHRoaXMucmVmc0J5VG9waWNMYWJlbDtcblx0dmFyIHJlZnNCeU5zID0gdGhpcy5yZWZzQnlOcztcblxuXHR2YXIgcmVmcyA9IHRoaXMucmVmc0J5TnMuZ2V0KG5zKTtcblx0aWYgKHJlZnMgIT0gbnVsbCl7XG5cblx0XHQvLyB3ZSByZW1vdmUgZWFjaCByZWYgZnJvbSB0aGUgY29ycmVzcG9uZGluZyBkaWNcblx0XHRyZWZzLmZvckVhY2goZnVuY3Rpb24ocmVmKXtcblxuXHRcdFx0Ly8gRmlyc3QsIHdlIGdldCB0aGUgcmVmcyBmcm9tIHRoZSB0b3BpYyBvciB0b3BpY2xhYmVsXG5cdFx0XHR2YXIgcmVmTGlzdDtcblx0XHRcdGlmIChyZWYubGFiZWwgIT0gbnVsbCl7XG5cdFx0XHRcdHZhciB0b3BpY0xhYmVsS2V5ID0gYnVpbGRUb3BpY0xhYmVsS2V5KHJlZi50b3BpYywgcmVmLmxhYmVsKTtcblx0XHRcdFx0cmVmTGlzdCA9IHJlZnNCeVRvcGljTGFiZWwuZ2V0KHRvcGljTGFiZWxLZXkpO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHJlZkxpc3QgPSByZWZzQnlUb3BpYy5nZXQocmVmLnRvcGljKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVGhlbiwgZm9yIHRoZSByZWZMaXN0IGFycmF5LCB3ZSByZW1vdmUgdGhlIG9uZXMgdGhhdCBtYXRjaCB0aGlzIG9iamVjdFxuXHRcdFx0dmFyIGlkeDtcblx0XHRcdHdoaWxlKChpZHggPSByZWZMaXN0LmluZGV4T2YocmVmKSkgIT09IC0xKXtcblx0XHRcdFx0cmVmTGlzdC5zcGxpY2UoaWR4LCAxKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIHdlIHJlbW92ZSB0aGVtIGFsbCBmb3JtIHRoZSByZWZzQnlOc1xuXHRcdHJlZnNCeU5zLmRlbGV0ZShucyk7XG5cdH1cblxuXG59O1xuXG4vLyBzdGF0aWMvcHJpdmF0ZVxuZnVuY3Rpb24gYnVpbGRSZWZzKHRvcGljcywgbGFiZWxzLCBmdW4sIG9wdHMpe1xuXHR2YXIgcmVmcyA9IFtdO1xuXHR0b3BpY3MuZm9yRWFjaChmdW5jdGlvbih0b3BpYyl7XG5cdFx0Ly8gaWYgd2UgZG8gbm90IGhhdmUgYW55IGxhYmVscywgdGhlbiwganVzdCBhZGQgdGhpcyB0b3BpY1xuXHRcdGlmIChsYWJlbHMgPT0gbnVsbCB8fCBsYWJlbHMubGVuZ3RoID09PSAwKXtcblx0XHRcdHJlZnMucHVzaCh7XG5cdFx0XHRcdHRvcGljOiB0b3BpYyxcblx0XHRcdFx0ZnVuOiBmdW4sIFxuXHRcdFx0XHRuczogb3B0cy5ucywgXG5cdFx0XHRcdGN0eDogb3B0cy5jdHhcblx0XHRcdH0pO1xuXHRcdH1cblx0XHQvLyBpZiB3ZSBoYXZlIG9uZSBvciBtb3JlIGxhYmVscywgdGhlbiwgd2UgYWRkIGZvciB0aG9zZSBsYWJlbFxuXHRcdGVsc2V7XG5cdFx0XHRsYWJlbHMuZm9yRWFjaChmdW5jdGlvbihsYWJlbCl7XG5cdFx0XHRcdHJlZnMucHVzaCh7XG5cdFx0XHRcdFx0dG9waWM6IHRvcGljLCBcblx0XHRcdFx0XHRsYWJlbDogbGFiZWwsIFxuXHRcdFx0XHRcdGZ1bjogZnVuLCBcblx0XHRcdFx0XHRuczogb3B0cy5ucyxcblx0XHRcdFx0XHRjdHg6IG9wdHMuY3R4XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XHRcdFx0XG5cdFx0fVxuXG5cdH0pO1xuXG5cdHJldHVybiByZWZzO1xufVxuXG5cbi8vIHN0YXRpYy9wcml2YXRlOiByZXR1cm4gYSBzYWZlIG9wdHMuIElmIG9wdHMgaXMgYSBzdHJpbmcsIHRoZW4sIGFzc3VtZSBpcyBpdCB0aGUge25zfVxudmFyIGVtcHR5T3B0cyA9IHt9O1xuZnVuY3Rpb24gbWFrZU9wdHMob3B0cyl7XG5cdGlmIChvcHRzID09IG51bGwpe1xuXHRcdG9wdHMgPSBlbXB0eU9wdHM7XG5cdH1lbHNle1xuXHRcdGlmICh0eXBlb2Ygb3B0cyA9PT0gXCJzdHJpbmdcIil7XG5cdFx0XHRvcHRzID0ge25zOm9wdHN9O1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gb3B0cztcbn1cblxuLy8gc3RhdGljL3ByaXZhdGVcbmZ1bmN0aW9uIGJ1aWxkVG9waWNMYWJlbEtleSh0b3BpYywgbGFiZWwpe1xuXHRyZXR1cm4gdG9waWMgKyBcIi0hLVwiICsgbGFiZWw7XG59XG5cbi8vIHN0YXRpYy9wcml2YXRlOiBjYWxsIHJlZiBtZXRob2QgKHdpdGggb3B0aW9uYWwgbGFiZWwgb3ZlcnJpZGUpXG5mdW5jdGlvbiBpbnZva2VSZWYocmVmLCBkYXRhLCBsYWJlbCl7XG5cdHZhciBpbmZvID0ge1xuXHRcdHRvcGljOiByZWYudG9waWMsXG5cdFx0bGFiZWw6IHJlZi5sYWJlbCB8fCBsYWJlbCxcblx0XHRuczogcmVmLm5zXG5cdH07XG5cdHJlZi5mdW4uY2FsbChyZWYuY3R4LGRhdGEsaW5mbyk7XG59XG4vLyAtLS0tLS0tLS0gL0h1YkRhdGEgLS0tLS0tLS0tIC8vXG5cblxuIiwidmFyIHZpZXcgPSByZXF1aXJlKFwiLi92aWV3LmpzXCIpO1xudmFyIGV2ZW50ID0gcmVxdWlyZShcIi4vZXZlbnQuanNcIik7XG52YXIgZG9tID0gcmVxdWlyZShcIi4vZG9tLmpzXCIpO1xudmFyIGR4ID0gcmVxdWlyZShcIi4vZHguanNcIik7XG52YXIgaHViID0gcmVxdWlyZShcIi4vaHViLmpzXCIpO1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG5cbnJlcXVpcmUoXCIuL3ZpZXctZXZlbnQuanNcIik7XG5yZXF1aXJlKFwiLi92aWV3LWh1Yi5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHZlcnNpb246IFwiMC40LjNcIixcblx0XG5cdC8vIHZpZXcgQVBJc1xuXHRob29rOiB2aWV3Lmhvb2ssXG5cdHJlZ2lzdGVyOiB2aWV3LnJlZ2lzdGVyLFxuXHRkaXNwbGF5OiB2aWV3LmRpc3BsYXksXG5cdHJlbW92ZTogdmlldy5yZW1vdmUsXG5cdGVtcHR5OiB2aWV3LmVtcHR5LFxuXG5cdC8vIGV2ZW50IEFQSVxuXHRvbjogZXZlbnQub24sIFxuXHRvZmY6IGV2ZW50Lm9mZixcblx0dHJpZ2dlcjogZXZlbnQudHJpZ2dlcixcblxuXHQvLyBET00gUXVlcnkgU2hvcnRjdXRzXG5cdGZpcnN0OiBkb20uZmlyc3QsXG5cdGFsbDogZG9tLmFsbCxcblx0Y2xvc2VzdDogZG9tLmNsb3Nlc3QsXG5cdG5leHQ6IGRvbS5uZXh0LFxuXHRwcmV2OiBkb20ucHJldixcblxuXHQvLyBET00gSGVscGVyc1xuXHRhcHBlbmQ6IGRvbS5hcHBlbmQsXG5cdGZyYWc6IGRvbS5mcmFnLFxuXG5cdC8vIERPTSBQdXNoL1B1bGxcblx0cHVsbDogZHgucHVsbCxcblx0cHVzaDogZHgucHVzaCxcblx0cHVsbGVyOiBkeC5wdWxsZXIsXG5cdHB1c2hlcjogZHgucHVzaGVyLFxuXG5cdC8vIEh1YlxuXHRodWI6IGh1Yi5odWIsXG5cblx0Ly8gdXRpbHNcblx0dmFsOiB1dGlscy52YWwsXG5cdGFzQXJyYXk6IHV0aWxzLmFzQXJyYXlcbn07XG5cbi8vIHB1dCB0aGlzIGNvbXBvbmVudCBpbiB0aGUgZ2xvYmFsIHNjb3BlXG4vLyBUT0RPOiBXZSBtaWdodCB3YW50IHRvIGhhdmUgYSBpbmRleC1nbG9iYWwgZm9yIHB1dHRpbmcgdGhpcyBpbiB0aGUgZ2xvYmFsIHNjb3BlIGFuZCBpbmRleC5qcyBub3QgcHV0dGluZyBpdCBpbiB0aGUgZ2xvYmFsIHNjb3BlLiBcbmlmICh3aW5kb3cpe1xuXHR3aW5kb3cubXZkb20gPSBtb2R1bGUuZXhwb3J0cztcdFxufVxuXG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdC8vIE9iamVjdCBVdGlsc1xuXHRpc051bGw6IGlzTnVsbCxcblx0aXNFbXB0eTogaXNFbXB0eSxcblx0dmFsOiB2YWwsIC8vIHB1YmxpY1xuXHRlbnN1cmVNYXA6IGVuc3VyZU1hcCxcblx0ZW5zdXJlU2V0OiBlbnN1cmVTZXQsXG5cdGVuc3VyZUFycmF5OiBlbnN1cmVBcnJheSxcblxuXHQvLyBhc1R5cGVcblx0YXNBcnJheTogYXNBcnJheSwgLy8gcHVibGljXG5cblx0Ly8gc3RyaW5nIHV0aWxzXG5cdHNwbGl0QW5kVHJpbTogc3BsaXRBbmRUcmltXG59O1xuXG4vLyAtLS0tLS0tLS0gT2JqZWN0IFV0aWxzIC0tLS0tLS0tLSAvL1xudmFyIFVEID0gXCJ1bmRlZmluZWRcIjtcbnZhciBTVFIgPSBcInN0cmluZ1wiO1xudmFyIE9CSiA9IFwib2JqZWN0XCI7XG5cbi8vIHJldHVybiB0cnVlIGlmIHZhbHVlIGlzIG51bGwgb3IgdW5kZWZpbmVkXG5mdW5jdGlvbiBpc051bGwodil7XG5cdHJldHVybiAodHlwZW9mIHYgPT09IFVEIHx8IHYgPT09IG51bGwpO1xufVxuXG4vLyByZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgaXMgbnVsbCwgdW5kZWZpbmVkLCBlbXB0eSBhcnJheSwgZW1wdHkgc3RyaW5nLCBvciBlbXB0eSBvYmplY3RcbmZ1bmN0aW9uIGlzRW1wdHkodil7XG5cdHZhciB0b2YgPSB0eXBlb2Ygdjtcblx0aWYgKGlzTnVsbCh2KSl7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpZiAodiBpbnN0YW5jZW9mIEFycmF5IHx8IHRvZiA9PT0gU1RSKXtcblx0XHRyZXR1cm4gKHYubGVuZ3RoID09PSAwKT90cnVlOmZhbHNlO1xuXHR9XG5cblx0aWYgKHRvZiA9PT0gT0JKKXtcblx0XHQvLyBhcHBhcmVudGx5IDEweCBmYXN0ZXIgdGhhbiBPYmplY3Qua2V5c1xuXHRcdGZvciAodmFyIHggaW4gdikgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn1cblxuLy8gVE9ETzogbmVlZCB0byBkb2N1bWVudFxuZnVuY3Rpb24gdmFsKHJvb3RPYmosIHBhdGhUb1ZhbHVlLCB2YWx1ZSkge1xuXHR2YXIgc2V0TW9kZSA9ICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIpO1xuXG5cdGlmICghcm9vdE9iaikge1xuXHRcdHJldHVybiByb290T2JqO1xuXHR9XG5cdC8vIGZvciBub3csIHJldHVybiB0aGUgcm9vdE9iaiBpZiB0aGUgcGF0aFRvVmFsdWUgaXMgZW1wdHkgb3IgbnVsbCBvciB1bmRlZmluZWRcblx0aWYgKCFwYXRoVG9WYWx1ZSkge1xuXHRcdHJldHVybiByb290T2JqO1xuXHR9XG5cdC8vIGlmIHRoZSBwYXRoVG9WYWx1ZSBpcyBhbHJlYWR5IGFuIGFycmF5LCBkbyBub3QgcGFyc2UgaXQgKHRoaXMgYWxsb3cgdG8gc3VwcG9ydCAnLicgaW4gcHJvcCBuYW1lcylcblx0dmFyIG5hbWVzID0gKHBhdGhUb1ZhbHVlIGluc3RhbmNlb2YgQXJyYXkpP3BhdGhUb1ZhbHVlOnBhdGhUb1ZhbHVlLnNwbGl0KFwiLlwiKTtcblx0XG5cdHZhciBuYW1lLCBjdXJyZW50Tm9kZSA9IHJvb3RPYmosIGN1cnJlbnRJc01hcCwgbmV4dE5vZGU7XG5cblx0dmFyIGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoLCBsSWR4ID0gbCAtIDE7XG5cdGZvciAoaTsgaSA8IGw7IGkrKykge1xuXHRcdG5hbWUgPSBuYW1lc1tpXTtcblxuXHRcdGN1cnJlbnRJc01hcCA9IChjdXJyZW50Tm9kZSBpbnN0YW5jZW9mIE1hcCk7XG5cdFx0bmV4dE5vZGUgPSBjdXJyZW50SXNNYXA/Y3VycmVudE5vZGUuZ2V0KG5hbWUpOmN1cnJlbnROb2RlW25hbWVdO1xuXG5cdFx0aWYgKHNldE1vZGUpe1xuXHRcdFx0Ly8gaWYgbGFzdCBpbmRleCwgc2V0IHRoZSB2YWx1ZVxuXHRcdFx0aWYgKGkgPT09IGxJZHgpe1xuXHRcdFx0XHRpZiAoY3VycmVudElzTWFwKXtcblx0XHRcdFx0XHRjdXJyZW50Tm9kZS5zZXQobmFtZSx2YWx1ZSk7XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdGN1cnJlbnROb2RlW25hbWVdID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y3VycmVudE5vZGUgPSB2YWx1ZTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRpZiAodHlwZW9mIG5leHROb2RlID09PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRcdFx0bmV4dE5vZGUgPSB7fTtcblx0XHRcdFx0fSBcblx0XHRcdFx0Y3VycmVudE5vZGVbbmFtZV0gPSBuZXh0Tm9kZTtcblx0XHRcdFx0Y3VycmVudE5vZGUgPSBuZXh0Tm9kZTtcblx0XHRcdH1cblx0XHR9ZWxzZXtcblx0XHRcdGN1cnJlbnROb2RlID0gbmV4dE5vZGU7XG5cdFx0XHRpZiAodHlwZW9mIGN1cnJlbnROb2RlID09PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRcdGN1cnJlbnROb2RlID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cdFx0XHRcblx0XHR9XG5cblx0XHQvLyBpZiAobm9kZSA9PSBudWxsKSB7XG5cdFx0Ly8gXHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdC8vIH1cblx0XHQvLyAvLyBnZXQgdGhlIG5leHQgbm9kZVxuXHRcdC8vIG5vZGUgPSAobm9kZSBpbnN0YW5jZW9mIE1hcCk/bm9kZS5nZXQobmFtZSk6bm9kZVtuYW1lXTtcblx0XHQvLyBpZiAodHlwZW9mIG5vZGUgPT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHQvLyBcdHJldHVybiBub2RlO1xuXHRcdC8vIH1cblx0fVxuXHRpZiAoc2V0TW9kZSl7XG5cdFx0cmV0dXJuIHJvb3RPYmo7XG5cdH1lbHNle1xuXHRcdHJldHVybiBjdXJyZW50Tm9kZTtcblx0fVxufVxuXG4vLyAtLS0tLS0tLS0gL09iamVjdCBVdGlscyAtLS0tLS0tLS0gLy9cblxuLy8gLS0tLS0tLS0tIGVuc3VyZVR5cGUgLS0tLS0tLS0tIC8vXG4vLyBNYWtlIHN1cmUgdGhhdCB0aGlzIG9ialtwcm9wTmFtZV0gaXMgYSBqcyBNYXAgYW5kIHJldHVybnMgaXQuIFxuLy8gT3RoZXJ3aXNlLCBjcmVhdGUgYSBuZXcgb25lLCBzZXQgaXQsIGFuZCByZXR1cm4gaXQuXG5mdW5jdGlvbiBlbnN1cmVNYXAob2JqLCBwcm9wTmFtZSl7XG5cdHJldHVybiBfZW5zdXJlKG9iaiwgcHJvcE5hbWUsIE1hcCk7XG59XG5cbi8vIE1ha2Ugc3VyZSB0aGF0IHRoaXMgb2JqW3Byb3BOYW1lXSBpcyBhIGpzIFNldCBhbmQgcmV0dXJucyBpdC4gXG4vLyBPdGhlcndpc2UsIGNyZWF0ZSBhIG5ldyBvbmUsIHNldCBpdCwgYW5kIHJldHVybiBpdC5cbmZ1bmN0aW9uIGVuc3VyZVNldChvYmosIHByb3BOYW1lKXtcblx0cmV0dXJuIF9lbnN1cmUob2JqLCBwcm9wTmFtZSwgU2V0KTtcbn1cblxuLy8gc2FtZSBhcyBlbnN1cmVNYXAgYnV0IGZvciBhcnJheVxuZnVuY3Rpb24gZW5zdXJlQXJyYXkob2JqLCBwcm9wTmFtZSl7XG5cdHJldHVybiBfZW5zdXJlKG9iaiwgcHJvcE5hbWUsIEFycmF5KTtcbn1cblxuZnVuY3Rpb24gX2Vuc3VyZShvYmosIHByb3BOYW1lLCB0eXBlKXtcblx0dmFyIGlzTWFwID0gKG9iaiBpbnN0YW5jZW9mIE1hcCk7XG5cdHZhciB2ID0gKGlzTWFwKT9vYmouZ2V0KHByb3BOYW1lKTpvYmpbcHJvcE5hbWVdO1xuXHRpZiAoaXNOdWxsKHYpKXtcblx0XHR2ID0gKHR5cGUgPT09IEFycmF5KT9bXToobmV3IHR5cGUpO1xuXHRcdGlmIChpc01hcCl7XG5cdFx0XHRvYmouc2V0KHByb3BOYW1lLCB2KTtcblx0XHR9ZWxzZXtcblx0XHRcdG9ialtwcm9wTmFtZV0gPSB2O1x0XG5cdFx0fVx0XHRcblx0fVxuXHRyZXR1cm4gdjtcdFxufVxuXG4vLyAtLS0tLS0tLS0gL2Vuc3VyZVR5cGUgLS0tLS0tLS0tIC8vXG5cbi8vIC0tLS0tLS0tLSBhc1R5cGUgLS0tLS0tLS0tIC8vXG4vLyBSZXR1cm4gYW4gYXJyYXkgZnJvbSBhIHZhbHVlIG9iamVjdC4gSWYgdmFsdWUgaXMgbnVsbC91bmRlZmluZWQsIHJldHVybiBlbXB0eSBhcnJheS4gXG4vLyBJZiB2YWx1ZSBpcyBudWxsIG9yIHVuZGVmaW5lZCwgcmV0dXJuIGVtcHR5IGFycmF5XG4vLyBJZiB0aGUgdmFsdWUgaXMgYW4gYXJyYXkgaXQgaXMgcmV0dXJuZWQgYXMgaXNcbi8vIElmIHRoZSB2YWx1ZSBpcyBhIG9iamVjdCB3aXRoIGZvckVhY2gvbGVuZ3RoIHdpbGwgcmV0dXJuIGEgbmV3IGFycmF5IGZvciB0aGVzZSB2YWx1ZXNcbi8vIE90aGVyd2lzZSByZXR1cm4gc2luZ2xlIHZhbHVlIGFycmF5XG5mdW5jdGlvbiBhc0FycmF5KHZhbHVlKXtcblx0aWYgKCFpc051bGwodmFsdWUpKXtcblx0XHRpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSl7XG5cdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0fVxuXHRcdC8vIElmIGl0IGlzIGEgbm9kZUxpc3QsIGNvcHkgdGhlIGVsZW1lbnRzIGludG8gYSByZWFsIGFycmF5XG5cdFx0ZWxzZSBpZiAodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IubmFtZSA9PT0gXCJOb2RlTGlzdFwiKXtcblx0XHRcdHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh2YWx1ZSk7XG5cdFx0fSBcblx0XHQvLyBpZiBpdCBpcyBhIGZ1bmN0aW9uIGFyZ3VtZW50c1xuXHRcdGVsc2UgaWYgKHZhbHVlLnRvU3RyaW5nKCkgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpe1xuXHRcdFx0cmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHZhbHVlKTtcblx0XHR9XG5cdFx0Ly8gb3RoZXJ3aXNlIHdlIGFkZCB2YWx1ZVxuXHRcdGVsc2V7XG5cdFx0XHRyZXR1cm4gW3ZhbHVlXTtcblx0XHR9XG5cdH1cblx0Ly8gb3RoZXJ3aXNlLCByZXR1cm4gYW4gZW1wdHkgYXJyYXlcblx0cmV0dXJuIFtdO1xufVxuLy8gLS0tLS0tLS0tIC9hc1R5cGUgLS0tLS0tLS0tIC8vXG5cbi8vIC0tLS0tLS0tLSBTdHJpbmcgVXRpbHMgLS0tLS0tLS0tIC8vXG5mdW5jdGlvbiBzcGxpdEFuZFRyaW0oc3RyLCBzZXApe1xuXHRpZiAoc3RyID09IG51bGwpe1xuXHRcdHJldHVybiBbXTtcblx0fVxuXHRpZiAoc3RyLmluZGV4T2Yoc2VwKSA9PT0gLTEpe1xuXHRcdHJldHVybiBbc3RyLnRyaW0oKV07XG5cdH1cblx0cmV0dXJuIHN0ci5zcGxpdChzZXApLm1hcCh0cmltKTtcbn1cblxuZnVuY3Rpb24gdHJpbShzdHIpe1xuXHRyZXR1cm4gc3RyLnRyaW0oKTtcbn1cbi8vIC0tLS0tLS0tLSAvU3RyaW5nIFV0aWxzIC0tLS0tLS0tLSAvL1xuIiwidmFyIF92aWV3ID0gcmVxdWlyZShcIi4vdmlldy5qc1wiKTtcbnZhciBfZXZlbnQgPSByZXF1aXJlKFwiLi9ldmVudC5qc1wiKTtcblxuLy8gLS0tLS0tLS0tIEV2ZW50cyBIb29rIC0tLS0tLS0tLSAvL1xuX3ZpZXcuaG9vayhcIndpbGxJbml0XCIsIGZ1bmN0aW9uKHZpZXcpe1xuXHR2YXIgb3B0cyA9IHtuczogXCJ2aWV3X1wiICsgdmlldy5pZCwgY3R4OiB2aWV3fTtcblx0aWYgKHZpZXcuZXZlbnRzKXtcblx0XHRiaW5kRXZlbnRzKHZpZXcuZXZlbnRzLCB2aWV3LmVsLCBvcHRzKTtcblx0fVxuXG5cdGlmICh2aWV3LmRvY0V2ZW50cyl7XG5cdFx0YmluZEV2ZW50cyh2aWV3LmRvY0V2ZW50cywgZG9jdW1lbnQsIG9wdHMpO1xuXHR9XG5cblx0aWYgKHZpZXcud2luRXZlbnRzKXtcblx0XHRiaW5kRXZlbnRzKHZpZXcud2luZEV2ZW50cywgZG9jdW1lbnQsIG9wdHMpO1xuXHR9XG5cblx0Ly8gVE9ETzogbmVlZCB0byBhbGxvdyBjbG9zZXN0IGJpbmRpbmcuXG59KTtcblxuX3ZpZXcuaG9vayhcIndpbGxSZW1vdmVcIiwgZnVuY3Rpb24odmlldyl7XG5cdHZhciBucyA9IHtuczogXCJ2aWV3X1wiICsgdmlldy5pZH07XG5cdF9ldmVudC5vZmYoZG9jdW1lbnQsIG5zKTtcblx0X2V2ZW50Lm9mZih3aW5kb3csIG5zKTtcblx0Ly8gVE9ETzogbmVlZCB0byB1bmJpbmQgY2xvc2VzdC9wYXJlbnRzIGJpbmRpbmdcbn0pO1xuXG5mdW5jdGlvbiBiaW5kRXZlbnRzKGV2ZW50cywgZWwsIG9wdHMpe1xuXHR2YXIgZXR4dCwgZXR4dHMsIHR5cGUsIHNlbGVjdG9yO1xuXHRmb3IgKGV0eHQgaW4gZXZlbnRzKXtcblx0XHRldHh0cyA9IGV0eHQudHJpbSgpLnNwbGl0KFwiO1wiKTtcblx0XHR0eXBlID0gZXR4dHNbMF0udHJpbSgpO1xuXHRcdHNlbGVjdG9yID0gbnVsbDtcblx0XHRpZiAoZXR4dHMubGVuZ3RoID4gMSl7XG5cdFx0XHRzZWxlY3RvciA9IGV0eHRzWzFdLnRyaW0oKTtcblx0XHR9XG5cdFx0X2V2ZW50Lm9uKGVsLCB0eXBlLCBzZWxlY3RvciwgZXZlbnRzW2V0eHRdLCBvcHRzKTtcblx0fVxufVxuLy8gVE9ETzogbmVlZCB0byB1bmJpbmQgb24gXCJ3aWxsRGVzdHJveVwiXG5cbi8vIC0tLS0tLS0tLSAvRXZlbnRzIEhvb2sgLS0tLS0tLS0tIC8vIiwidmFyIF92aWV3ID0gcmVxdWlyZShcIi4vdmlldy5qc1wiKTtcbnZhciBfaHViID0gcmVxdWlyZShcIi4vaHViLmpzXCIpO1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG5cbi8vIC0tLS0tLS0tLSBFdmVudHMgSG9vayAtLS0tLS0tLS0gLy9cbl92aWV3Lmhvb2soXCJ3aWxsSW5pdFwiLCBmdW5jdGlvbih2aWV3KXtcblx0dmFyIG9wdHMgPSB7bnM6IFwidmlld19cIiArIHZpZXcuaWQsIGN0eDogdmlld307XG5cblx0aWYgKHZpZXcuaHViRXZlbnRzKXtcblx0XHQvLyBidWlsZCB0aGUgbGlzdCBvZiBiaW5kaW5nc1xuXG5cdFx0dmFyIGluZm9MaXN0ID0gbGlzdEh1YkluZm8odmlldy5odWJFdmVudHMpO1xuXHRcdGluZm9MaXN0LmZvckVhY2goZnVuY3Rpb24oaW5mbyl7XG5cdFx0XHRpbmZvLmh1Yi5zdWIoaW5mby50b3BpY3MsIGluZm8ubGFiZWxzLCBpbmZvLmZ1biwgb3B0cyk7XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBUT0RPOiBuZWVkIHRvIGFsbG93IGNsb3Nlc3QgYmluZGluZy5cbn0pO1xuXG5fdmlldy5ob29rKFwid2lsbFJlbW92ZVwiLCBmdW5jdGlvbih2aWV3KXtcblx0dmFyIG5zID0gXCJ2aWV3X1wiICsgdmlldy5pZDtcblx0dmFyIGluZm9MaXN0ID0gbGlzdEh1YkluZm8odmlldy5odWJFdmVudHMpO1xuXHRpbmZvTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGluZm8pe1xuXHRcdGluZm8uaHViLnVuc3ViKG5zKTtcblx0fSk7XG59KTtcblxuZnVuY3Rpb24gbGlzdEh1YkluZm8oaHViRXZlbnRzKXtcblx0dmFyIGtleSwgdmFsLCBrZXkyLCBodWIsIGluZm9MaXN0ID0gW107XG5cblx0Zm9yIChrZXkgaW4gaHViRXZlbnRzKXtcblx0XHR2YWwgPSBodWJFdmVudHNba2V5XTtcblx0XHRpZiAodHlwZW9mIHZhbCA9PT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdGluZm9MaXN0LnB1c2goZ2V0SHViSW5mbyhrZXksIG51bGwsIHZhbCkpO1xuXHRcdH1lbHNle1xuXHRcdFx0a2V5Mjtcblx0XHRcdGh1YiA9IF9odWIuaHViKGtleSk7XG5cdFx0XHRmb3IgKGtleTIgaW4gdmFsKXtcblx0XHRcdFx0aW5mb0xpc3QucHVzaChnZXRIdWJJbmZvKGtleTIsIGh1YiwgdmFsW2tleTJdKSk7XG5cdFx0XHR9XG5cdFx0fVx0XHRcdFxuXHR9XG5cdHJldHVybiBpbmZvTGlzdDtcbn1cblxuLy8gcmV0dXJucyB7aHViLCB0b3BpY3MsIGxhYmVsc31cbi8vIGh1YiBpcyBvcHRpb25hbCwgaWYgbm90IHByZXNlbnQsIGFzc3VtZSB0aGUgbmFtZSB3aWxsIGJlIHRoZSBmaXJzdCBpdGVtIHdpbGwgYmUgaW4gdGhlIHN0clxuZnVuY3Rpb24gZ2V0SHViSW5mbyhzdHIsIGh1YiwgZnVuKXtcblx0dmFyIGEgPSB1dGlscy5zcGxpdEFuZFRyaW0oc3RyLFwiO1wiKTtcblx0Ly8gaWYgbm8gaHViLCB0aGVuLCBhc3N1bWUgaXQgaXMgaW4gdGhlIHN0clxuXHR2YXIgdG9waWNJZHggPSAoaHViKT8wOjE7XG5cdHZhciBpbmZvID0ge1xuXHRcdHRvcGljczogYVt0b3BpY0lkeF0sXG5cdFx0ZnVuOiBmdW5cblx0fTtcblx0aWYgKGEubGVuZ3RoID4gdG9waWNJZHggKyAxKXtcblx0XHRpbmZvLmxhYmVscyA9IGFbdG9waWNJZHggKyAxXTtcblx0fVxuXHRpbmZvLmh1YiA9ICghaHViKT9faHViLmh1YihhWzBdKTpodWI7XG5cdHJldHVybiBpbmZvO1xufVxuXG4vLyBUT0RPOiBuZWVkIHRvIHVuYmluZCBvbiBcIndpbGxEZXN0cm95XCJcblxuLy8gLS0tLS0tLS0tIC9FdmVudHMgSG9vayAtLS0tLS0tLS0gLy8iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcbnZhciBkb20gPSByZXF1aXJlKFwiLi9kb20uanNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRob29rOiBob29rLFxuXHRyZWdpc3RlcjogcmVnaXN0ZXIsXG5cdGRpc3BsYXk6IGRpc3BsYXksIFxuXHRyZW1vdmU6IHJlbW92ZSwgXG5cdGVtcHR5OiBlbXB0eVxufTtcblxudmFyIHZpZXdEZWZEaWMgPSB7fTtcblxudmFyIHZpZXdJZFNlcSA9IDA7XG5cbnZhciBob29rcyA9IHtcblx0d2lsbENyZWF0ZTogW10sXG5cdGRpZENyZWF0ZTogW10sXG5cdHdpbGxJbml0OiBbXSxcblx0ZGlkSW5pdDogW10sXG5cdHdpbGxEaXNwbGF5OiBbXSxcblx0ZGlkRGlzcGxheTogW10sXG5cdHdpbGxQb3N0RGlzcGxheTogW10sXG5cdGRpZFBvc3REaXNwbGF5OiBbXSwgXG5cdHdpbGxSZW1vdmU6IFtdLFxuXHRkaWRSZW1vdmU6IFtdXG59O1xuXG52YXIgZGVmYXVsdENvbmZpZyA9IHtcblx0YXBwZW5kOiBcImxhc3RcIlxufTtcblxuLy8gLS0tLS0tLS0tIFB1YmxpYyBBUElzIC0tLS0tLS0tLSAvL1xuZnVuY3Rpb24gaG9vayhuYW1lLCBmdW4pe1xuXHRob29rc1tuYW1lXS5wdXNoKGZ1bik7XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyKG5hbWUsIGNvbnRyb2xsZXIsIGNvbmZpZyl7XG5cdHZhciB2aWV3RGVmID0ge1xuXHRcdG5hbWU6IG5hbWUsXG5cdFx0Y29udHJvbGxlcjogY29udHJvbGxlcixcblx0XHRjb25maWc6IGNvbmZpZ1xuXHR9OyBcblxuXHR2aWV3RGVmRGljW25hbWVdID0gdmlld0RlZjtcbn1cblxuZnVuY3Rpb24gZGlzcGxheShuYW1lLCBwYXJlbnRFbCwgZGF0YSwgY29uZmlnKXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHZhciB2aWV3ID0gZG9JbnN0YW50aWF0ZShuYW1lLCBjb25maWcpO1xuXHRcblx0cmV0dXJuIGRvQ3JlYXRlKHZpZXcsIGRhdGEpXG5cdC50aGVuKGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIGRvSW5pdCh2aWV3LCBkYXRhKTtcblx0fSlcblx0LnRoZW4oZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gZG9EaXNwbGF5LmNhbGwoc2VsZiwgdmlldywgcGFyZW50RWwsIGRhdGEpO1xuXHR9KVxuXHQudGhlbihmdW5jdGlvbigpe1xuXHRcdHJldHVybiBkb1Bvc3REaXNwbGF5KHZpZXcsIGRhdGEpO1xuXHR9KTtcblxufVxuXG5mdW5jdGlvbiBlbXB0eShlbHMpe1xuXHR1dGlscy5hc0FycmF5KGVscykuZm9yRWFjaChmdW5jdGlvbihlbCl7XG5cdFx0cmVtb3ZlRWwoZWwsIHRydWUpOyAvLyB0cnVlIHRvIHNheSBjaGlsZHJlbk9ubHlcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZShlbHMpe1xuXHR1dGlscy5hc0FycmF5KGVscykuZm9yRWFjaChmdW5jdGlvbihlbCl7XG5cdFx0cmVtb3ZlRWwoZWwpO1xuXHR9KTtcbn1cbi8vIC0tLS0tLS0tLSAvUHVibGljIEFQSXMgLS0tLS0tLS0tIC8vXG5cbi8vIHdpbGwgcmVtb3ZlIGEgZWwgb3IgaXRzIGNoaWxkcmVuXG5mdW5jdGlvbiByZW1vdmVFbChlbCwgY2hpbGRyZW5Pbmx5KXtcblx0Y2hpbGRyZW5Pbmx5ID0gKGNoaWxkcmVuT25seSA9PT0gdHJ1ZSkgO1xuXG5cdC8vLy8gRmlyc3Qgd2UgcmVtb3ZlL2Rlc3RvcnkgdGhlIHN1YiB2aWV3c1xuXHR2YXIgY2hpbGRyZW5WaWV3RWxzID0gdXRpbHMuYXNBcnJheShkb20uYWxsKGVsLCBcIi5kLXZpZXdcIikpO1xuXG5cdC8vIFJldmVyc2UgaXQgdG8gcmVtb3ZlL2Rlc3Ryb3kgZnJvbSB0aGUgbGVhZlxuXHR2YXIgdmlld0VscyA9IGNoaWxkcmVuVmlld0Vscy5yZXZlcnNlKCk7XG5cblx0Ly8gY2FsbCBkb1JlbW92ZSBvbiBlYWNoIHZpZXcgdG8gaGF2ZSB0aGUgbGlmZWN5Y2xlIHBlcmZvcm1lZCAod2lsbFJlbW92ZS9kaWRSZW1vdmUsIC5kZXN0cm95KVxuXHR2aWV3RWxzLmZvckVhY2goZnVuY3Rpb24odmlld0VsKXtcblx0XHRpZiAodmlld0VsLl92aWV3KXtcblx0XHRcdGRvUmVtb3ZlKHZpZXdFbC5fdmlldyk7XHRcblx0XHR9ZWxzZXtcblx0XHRcdC8vIHdlIHNob3VsZCBub3QgYmUgaGVyZSwgYnV0IHNvbWVob3cgaXQgaGFwcGVucyBpbiBzb21lIGFwcCBjb2RlIChsb2dnaW4gd2Fybm5pbmcpXG5cdFx0XHRjb25zb2xlLmxvZyhcIk1WRE9NIC0gV0FSTklORyAtIHRoZSBmb2xsb3dpbmcgZG9tIGVsZW1lbnQgc2hvdWxkIGhhdmUgYSAuX3ZpZXcgcHJvcGVydHkgYnV0IGl0IGlzIG5vdD8gKHNhZmUgaWdub3JlKVwiLCB2aWV3RWwpO1xuXHRcdFx0Ly8gTk9URTogd2UgZG8gbm90IG5lZWQgdG8gcmVtb3ZlIHRoZSBkb20gZWxlbWVudCBhcyBpdCB3aWxsIGJlIHRha2VuIGNhcmUgYnkgdGhlIGxvZ2ljIGJlbG93IChhdm9pZGluZyB1bmNlc3NhcnkgZG9tIHJlbW92ZSlcblx0XHR9XG5cdFx0XG5cdH0pO1xuXG5cdC8vIGlmIGl0IGlzIHJlbW92aW5nIG9ubHkgdGhlIGNoaWxkcmVuLCB0aGVuLCBsZXQncyBtYWtlIHN1cmUgdGhhdCBhbGwgZGlyZWN0IGNoaWxkcmVuIGVsZW1lbnRzIGFyZSByZW1vdmVkXG5cdC8vIChhcyB0aGUgbG9naWMgYWJvdmUgb25seSByZW1vdmUgdGhlIHZpZXdFbClcblx0aWYgKGNoaWxkcmVuT25seSl7XG5cdFx0Ly8gVGhlbiwgd2UgY2FuIHJlbW92ZSBhbGwgb2YgdGhlIGQuXG5cdFx0d2hpbGUgKGVsLmxhc3RDaGlsZCkge1xuXHRcdFx0ZWwucmVtb3ZlQ2hpbGQoZWwubGFzdENoaWxkKTtcblx0XHR9XG5cdH1lbHNle1xuXHRcdC8vIGlmIGl0IGlzIGEgdmlldywgd2UgcmVtb3ZlIHRoZSB2aWV3d2l0aCBkb1JlbW92ZVxuXHRcdGlmIChlbC5fdmlldyl7XG5cdFx0XHRkb1JlbW92ZShlbC5fdmlldyk7XG5cdFx0fWVsc2V7XG5cdFx0XHRpZiAoZWwucGFyZW50Tm9kZSl7XG5cdFx0XHRcdGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWwpO1x0XG5cdFx0XHR9XHRcdFx0XG5cdFx0fVxuXHR9XG5cbn1cblxuXG5cbi8vIHJldHVybiB0aGUgXCJ2aWV3XCIgaW5zdGFuY2Vcbi8vIFRPRE86IG5lZWQgdG8gYmUgYXN5bmMgYXMgd2VsbCBhbmQgYWxsb3dlZCBmb3IgbG9hZGluZyBjb21wb25lbnQgaWYgbm90IGV4aXN0XG5mdW5jdGlvbiBkb0luc3RhbnRpYXRlKG5hbWUsIGNvbmZpZyl7XG5cblx0Ly8gaWYgdGhlIGNvbmZpZyBpcyBhIHN0cmluZywgdGhlbiBhc3N1bWUgaXQgaXMgdGhlIGFwcGVuZCBkaXJlY3RpdmUuXG5cdGlmICh0eXBlb2YgY29uZmlnID09PSBcInN0cmluZ1wiKXtcblx0XHRjb25maWcgPSB7YXBwZW5kOiBjb25maWd9O1xuXHR9XG5cblxuXHQvLyBnZXQgdGhlIHZpZXcgZGVmIGZyb20gdGhlIGRpY3Rpb25hcnlcblx0dmFyIHZpZXdEZWYgPSB2aWV3RGVmRGljW25hbWVdO1xuXG5cdC8vIGlmIHZpZXdEZWYgbm90IGZvdW5kLCB0aHJvdyBhbiBleGNlcHRpb24gKFByb2JhYmx5IG5vdCByZWdpc3RlcmVkKVxuXHRpZiAoIXZpZXdEZWYpe1xuXHRcdHRocm93IG5ldyBFcnJvcihcIm12ZG9tIEVSUk9SIC0gVmlldyBkZWZpbml0aW9uIGZvciAnXCIgKyBuYW1lICsgXCInIG5vdCBmb3VuZC4gTWFrZSBzdXJlIHRvIGNhbGwgZC5yZWdpc3Rlcih2aWV3TmFtZSwgdmlld0NvbnRyb2xsZXIpLlwiKTtcblx0fVxuXG5cdC8vIGluc3RhbnRpYXRlIHRoZSB2aWV3IGluc3RhbmNlXG5cdHZhciB2aWV3ID0gT2JqZWN0LmFzc2lnbih7fSwgdmlld0RlZi5jb250cm9sbGVyKTtcblxuXHQvLyBzZXQgdGhlIGNvbmZpZ1xuXHR2aWV3LmNvbmZpZyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRDb25maWcsIHZpZXdEZWYuY29uZmlnLCBjb25maWcpO1xuXG5cdC8vIHNldCB0aGUgaWRcblx0dmlldy5pZCA9IHZpZXdJZFNlcSsrO1xuXG5cdC8vIHNldCB0aGUgbmFtZVxuXHR2aWV3Lm5hbWUgPSBuYW1lO1xuXG5cdHJldHVybiB2aWV3O1xufVxuXG4vLyByZXR1cm4gYSBwcm9taXNlIHRoYXQgcmVzb2x2ZSB3aXRoIG5vdGhpbmcuXG5mdW5jdGlvbiBkb0NyZWF0ZSh2aWV3LCBkYXRhKXtcblx0cGVyZm9ybUhvb2soXCJ3aWxsQ3JlYXRlXCIsIHZpZXcpO1xuXG5cdC8vIENhbGwgdGhlIHZpZXcuY3JlYXRlXG5cdHZhciBwID0gUHJvbWlzZS5yZXNvbHZlKHZpZXcuY3JlYXRlKGRhdGEpKTtcblxuXHRyZXR1cm4gcC50aGVuKGZ1bmN0aW9uKGh0bWxfb3Jfbm9kZSl7XG5cblx0XHR2YXIgbm9kZSA9ICh0eXBlb2YgaHRtbF9vcl9ub2RlID09PSBcInN0cmluZ1wiKT9kb20uZnJhZyhodG1sX29yX25vZGUpOmh0bWxfb3Jfbm9kZTtcblxuXHRcdC8vIElmIHdlIGhhdmUgYSBmcmFndW1lbnRcblx0XHRpZiAobm9kZS5ub2RlVHlwZSA9PT0gMTEpe1xuXHRcdFx0aWYgKG5vZGUuY2hpbGROb2Rlcy5sZW5ndGggPiAxKXtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJtdmRvbSAtIFdBUk5JTkcgLSB2aWV3IEhUTUwgZm9yIHZpZXdcIiwgdmlldywgXCJoYXMgbXVsdGlwbGUgY2hpbGROb2RlcywgYnV0IHNob3VsZCBoYXZlIG9ubHkgb25lLiBGYWxsYmFjayBieSB0YWtpbmcgdGhlIGZpcnN0IG9uZSwgYnV0IGNoZWNrIGNvZGUuXCIpO1xuXHRcdFx0fVxuXHRcdFx0bm9kZSA9IG5vZGUuZmlyc3RDaGlsZDtcblx0XHR9XG5cblx0XHQvLyBtYWtlIHN1cmUgdGhhdCB0aGUgbm9kZSBpcyBvZiB0aW1lIEVsZW1lbnRcblx0XHRpZiAobm9kZS5ub2RlVHlwZSAhPT0gMSl7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJlbCBmb3IgdmlldyBcIiArIHZpZXcubmFtZSArIFwiIGlzIG5vZGUgb2YgdHlwZSBFbGVtZW50LiBcIiArIG5vZGUpO1xuXHRcdH1cblxuXHRcdHZhciB2aWV3RWwgPSBub2RlO1xuXG5cdFx0Ly8gc2V0IHRoZSB2aWV3LmVsIGFuZCB2aWV3LmVsLl92aWV3XG5cdFx0dmlldy5lbCA9IHZpZXdFbDtcblx0XHR2aWV3LmVsLmNsYXNzTGlzdC5hZGQoXCJkLXZpZXdcIik7XG5cdFx0dmlldy5lbC5fdmlldyA9IHZpZXc7IFxuXG5cdFx0cGVyZm9ybUhvb2soXCJkaWRDcmVhdGVcIiwgdmlldyk7XHRcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGRvSW5pdCh2aWV3LCBkYXRhKXtcblx0cGVyZm9ybUhvb2soXCJ3aWxsSW5pdFwiLCB2aWV3KTtcblx0dmFyIHJlcztcblxuXHRpZiAodmlldy5pbml0KXtcblx0XHRyZXMgPSB2aWV3LmluaXQoZGF0YSk7XG5cdH1cblx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXMpLnRoZW4oZnVuY3Rpb24oKXtcblx0XHRwZXJmb3JtSG9vayhcImRpZEluaXRcIiwgdmlldyk7XHRcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGRvRGlzcGxheSh2aWV3LCByZWZFbCwgZGF0YSl7XG5cdHBlcmZvcm1Ib29rKFwid2lsbERpc3BsYXlcIiwgdmlldyk7XG5cblx0dHJ5e1x0XHRcblx0XHQvLyBXT1JLQVJPVU5EOiB0aGlzIG5lZWRzIHRvYmUgdGhlIG12ZG9tLCBzaW5jZSB3ZSBoYXZlIGN5Y2xpYyByZWZlcmVuY2UgYmV0d2VlbiBkb20uanMgYW5kIHZpZXcuanMgKG9uIGVtcHR5KVxuXHRcdGRvbS5hcHBlbmQuY2FsbCh0aGlzLCByZWZFbCwgdmlldy5lbCwgdmlldy5jb25maWcuYXBwZW5kKTtcblx0fWNhdGNoKGV4KXtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJtdmRvbSBFUlJPUiAtIENhbm5vdCBhZGQgdmlldy5lbCBcIiArIHZpZXcuZWwgKyBcIiB0byByZWZFbCBcIiArIHJlZkVsICsgXCIuIENhdXNlOiBcIiArIGV4LnRvU3RyaW5nKCkpO1xuXHR9XG5cblx0cGVyZm9ybUhvb2soXCJkaWREaXNwbGF5XCIsIHZpZXcpO1xuXG5cdHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCBmYWlsKXtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXNvbHZlKCk7XG5cdFx0fSwwKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGRvUG9zdERpc3BsYXkodmlldywgZGF0YSl7XG5cdHBlcmZvcm1Ib29rKFwid2lsbFBvc3REaXNwbGF5XCIsIHZpZXcpO1xuXG5cdHZhciByZXN1bHQ7XG5cdGlmICh2aWV3LnBvc3REaXNwbGF5KXtcblx0XHRyZXN1bHQgPSB2aWV3LnBvc3REaXNwbGF5KGRhdGEpO1xuXHR9XG5cblx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpLnRoZW4oZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdmlldztcblx0fSk7XG5cbn1cblxuZnVuY3Rpb24gZG9SZW1vdmUodmlldyl7XG5cdC8vIE5vdGU6IG9uIHdpbGxSZW1vdmUgYWxsIG9mIHRoZSBldmVudHMgYm91bmQgdG8gZG9jdW1lbnRzLCB3aW5kb3csIHBhcmVudEVsZW1lbnRzLCBodWJzIHdpbGwgYmUgdW5iaW5kLlxuXHRwZXJmb3JtSG9vayhcIndpbGxSZW1vdmVcIiwgdmlldyk7XG5cblx0Ly8gcmVtb3ZlIGl0IGZyb20gdGhlIERPTVxuXHQvLyBOT1RFOiB0aGlzIG1lYW5zIHRoYXQgdGhlIGRldGFjaCB3b24ndCByZW1vdmUgdGhlIG5vZGUgZnJvbSB0aGUgRE9NXG5cdC8vICAgICAgIHdoaWNoIGF2b2lkIHJlbW92aW5nIHVuY2Vzc2FyeSBub2RlLCBidXQgbWVhbnMgdGhhdCBkaWREZXRhY2ggd2lsbFxuXHQvLyAgICAgICBzdGlsbCBoYXZlIGEgdmlldy5lbCBpbiB0aGUgRE9NXG5cdHZhciBwYXJlbnRFbDtcblx0aWYgKHZpZXcuZWwgJiYgdmlldy5lbC5wYXJlbnROb2RlKXtcblx0XHRwYXJlbnRFbCA9IHZpZXcuZWwucGFyZW50Tm9kZTtcblx0XHR2aWV3LmVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodmlldy5lbCk7XG5cdH1cdFxuXG5cdC8vIHdlIGNhbGwgXG5cdGlmICh2aWV3LmRlc3Ryb3kpe1xuXHRcdHZpZXcuZGVzdHJveSh7cGFyZW50RWw6cGFyZW50RWx9KTtcblx0fVxuXHRcblx0cGVyZm9ybUhvb2soXCJkaWRSZW1vdmVcIiwgdmlldyk7XG59XG5cblxuZnVuY3Rpb24gcGVyZm9ybUhvb2sobmFtZSwgdmlldyl7XG5cdHZhciBob29rRnVucyA9IGhvb2tzW25hbWVdO1xuXHR2YXIgaT0gMCAsIGwgPSBob29rRnVucy5sZW5ndGgsIGZ1bjtcblx0Zm9yICg7IGkgPCBsOyBpKyspe1xuXHRcdGZ1biA9IGhvb2tGdW5zW2ldO1xuXHRcdGZ1bih2aWV3KTtcblx0fVxufVxuXG5cbiIsIi8vIG1pbmltYWwgbGlicmFyeSBlbnRyeSBwb2ludC5cclxuXHJcblwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC1taW5pbWFsXCIpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIHByb3RvYnVmID0gZXhwb3J0cztcclxuXHJcbi8qKlxyXG4gKiBCdWlsZCB0eXBlLCBvbmUgb2YgYFwiZnVsbFwiYCwgYFwibGlnaHRcImAgb3IgYFwibWluaW1hbFwiYC5cclxuICogQG5hbWUgYnVpbGRcclxuICogQHR5cGUge3N0cmluZ31cclxuICogQGNvbnN0XHJcbiAqL1xyXG5wcm90b2J1Zi5idWlsZCA9IFwibWluaW1hbFwiO1xyXG5cclxuLy8gU2VyaWFsaXphdGlvblxyXG5wcm90b2J1Zi5Xcml0ZXIgICAgICAgPSByZXF1aXJlKFwiLi93cml0ZXJcIik7XHJcbnByb3RvYnVmLkJ1ZmZlcldyaXRlciA9IHJlcXVpcmUoXCIuL3dyaXRlcl9idWZmZXJcIik7XHJcbnByb3RvYnVmLlJlYWRlciAgICAgICA9IHJlcXVpcmUoXCIuL3JlYWRlclwiKTtcclxucHJvdG9idWYuQnVmZmVyUmVhZGVyID0gcmVxdWlyZShcIi4vcmVhZGVyX2J1ZmZlclwiKTtcclxuXHJcbi8vIFV0aWxpdHlcclxucHJvdG9idWYudXRpbCAgICAgICAgID0gcmVxdWlyZShcIi4vdXRpbC9taW5pbWFsXCIpO1xyXG5wcm90b2J1Zi5ycGMgICAgICAgICAgPSByZXF1aXJlKFwiLi9ycGNcIik7XHJcbnByb3RvYnVmLnJvb3RzICAgICAgICA9IHJlcXVpcmUoXCIuL3Jvb3RzXCIpO1xyXG5wcm90b2J1Zi5jb25maWd1cmUgICAgPSBjb25maWd1cmU7XHJcblxyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4vKipcclxuICogUmVjb25maWd1cmVzIHRoZSBsaWJyYXJ5IGFjY29yZGluZyB0byB0aGUgZW52aXJvbm1lbnQuXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmUoKSB7XHJcbiAgICBwcm90b2J1Zi5SZWFkZXIuX2NvbmZpZ3VyZShwcm90b2J1Zi5CdWZmZXJSZWFkZXIpO1xyXG4gICAgcHJvdG9idWYudXRpbC5fY29uZmlndXJlKCk7XHJcbn1cclxuXHJcbi8vIENvbmZpZ3VyZSBzZXJpYWxpemF0aW9uXHJcbnByb3RvYnVmLldyaXRlci5fY29uZmlndXJlKHByb3RvYnVmLkJ1ZmZlcldyaXRlcik7XHJcbmNvbmZpZ3VyZSgpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBSZWFkZXI7XHJcblxyXG52YXIgdXRpbCAgICAgID0gcmVxdWlyZShcIi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxudmFyIEJ1ZmZlclJlYWRlcjsgLy8gY3ljbGljXHJcblxyXG52YXIgTG9uZ0JpdHMgID0gdXRpbC5Mb25nQml0cyxcclxuICAgIHV0ZjggICAgICA9IHV0aWwudXRmODtcclxuXHJcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbmZ1bmN0aW9uIGluZGV4T3V0T2ZSYW5nZShyZWFkZXIsIHdyaXRlTGVuZ3RoKSB7XHJcbiAgICByZXR1cm4gUmFuZ2VFcnJvcihcImluZGV4IG91dCBvZiByYW5nZTogXCIgKyByZWFkZXIucG9zICsgXCIgKyBcIiArICh3cml0ZUxlbmd0aCB8fCAxKSArIFwiID4gXCIgKyByZWFkZXIubGVuKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgcmVhZGVyIGluc3RhbmNlIHVzaW5nIHRoZSBzcGVjaWZpZWQgYnVmZmVyLlxyXG4gKiBAY2xhc3NkZXNjIFdpcmUgZm9ybWF0IHJlYWRlciB1c2luZyBgVWludDhBcnJheWAgaWYgYXZhaWxhYmxlLCBvdGhlcndpc2UgYEFycmF5YC5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmZmVyIEJ1ZmZlciB0byByZWFkIGZyb21cclxuICovXHJcbmZ1bmN0aW9uIFJlYWRlcihidWZmZXIpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlYWQgYnVmZmVyLlxyXG4gICAgICogQHR5cGUge1VpbnQ4QXJyYXl9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuYnVmID0gYnVmZmVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVhZCBidWZmZXIgcG9zaXRpb24uXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBvcyA9IDA7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWFkIGJ1ZmZlciBsZW5ndGguXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmxlbiA9IGJ1ZmZlci5sZW5ndGg7XHJcbn1cclxuXHJcbnZhciBjcmVhdGVfYXJyYXkgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gXCJ1bmRlZmluZWRcIlxyXG4gICAgPyBmdW5jdGlvbiBjcmVhdGVfdHlwZWRfYXJyYXkoYnVmZmVyKSB7XHJcbiAgICAgICAgaWYgKGJ1ZmZlciBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgfHwgQXJyYXkuaXNBcnJheShidWZmZXIpKVxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlYWRlcihidWZmZXIpO1xyXG4gICAgICAgIHRocm93IEVycm9yKFwiaWxsZWdhbCBidWZmZXJcIik7XHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgOiBmdW5jdGlvbiBjcmVhdGVfYXJyYXkoYnVmZmVyKSB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYnVmZmVyKSlcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWFkZXIoYnVmZmVyKTtcclxuICAgICAgICB0aHJvdyBFcnJvcihcImlsbGVnYWwgYnVmZmVyXCIpO1xyXG4gICAgfTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IHJlYWRlciB1c2luZyB0aGUgc3BlY2lmaWVkIGJ1ZmZlci5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheXxCdWZmZXJ9IGJ1ZmZlciBCdWZmZXIgdG8gcmVhZCBmcm9tXHJcbiAqIEByZXR1cm5zIHtSZWFkZXJ8QnVmZmVyUmVhZGVyfSBBIHtAbGluayBCdWZmZXJSZWFkZXJ9IGlmIGBidWZmZXJgIGlzIGEgQnVmZmVyLCBvdGhlcndpc2UgYSB7QGxpbmsgUmVhZGVyfVxyXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgYGJ1ZmZlcmAgaXMgbm90IGEgdmFsaWQgYnVmZmVyXHJcbiAqL1xyXG5SZWFkZXIuY3JlYXRlID0gdXRpbC5CdWZmZXJcclxuICAgID8gZnVuY3Rpb24gY3JlYXRlX2J1ZmZlcl9zZXR1cChidWZmZXIpIHtcclxuICAgICAgICByZXR1cm4gKFJlYWRlci5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGVfYnVmZmVyKGJ1ZmZlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gdXRpbC5CdWZmZXIuaXNCdWZmZXIoYnVmZmVyKVxyXG4gICAgICAgICAgICAgICAgPyBuZXcgQnVmZmVyUmVhZGVyKGJ1ZmZlcilcclxuICAgICAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgICAgICAgICA6IGNyZWF0ZV9hcnJheShidWZmZXIpO1xyXG4gICAgICAgIH0pKGJ1ZmZlcik7XHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgOiBjcmVhdGVfYXJyYXk7XHJcblxyXG5SZWFkZXIucHJvdG90eXBlLl9zbGljZSA9IHV0aWwuQXJyYXkucHJvdG90eXBlLnN1YmFycmF5IHx8IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIHV0aWwuQXJyYXkucHJvdG90eXBlLnNsaWNlO1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgdmFyaW50IGFzIGFuIHVuc2lnbmVkIDMyIGJpdCB2YWx1ZS5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUudWludDMyID0gKGZ1bmN0aW9uIHJlYWRfdWludDMyX3NldHVwKCkge1xyXG4gICAgdmFyIHZhbHVlID0gNDI5NDk2NzI5NTsgLy8gb3B0aW1pemVyIHR5cGUtaGludCwgdGVuZHMgdG8gZGVvcHQgb3RoZXJ3aXNlICg/ISlcclxuICAgIHJldHVybiBmdW5jdGlvbiByZWFkX3VpbnQzMigpIHtcclxuICAgICAgICB2YWx1ZSA9ICggICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcgICAgICAgKSA+Pj4gMDsgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KSByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgdmFsdWUgPSAodmFsdWUgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA8PCAgNykgPj4+IDA7IGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOCkgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIHZhbHVlID0gKHZhbHVlIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgMTQpID4+PiAwOyBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB2YWx1ZSA9ICh2YWx1ZSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IDIxKSA+Pj4gMDsgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KSByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgdmFsdWUgPSAodmFsdWUgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgIDE1KSA8PCAyOCkgPj4+IDA7IGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOCkgcmV0dXJuIHZhbHVlO1xyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICBpZiAoKHRoaXMucG9zICs9IDUpID4gdGhpcy5sZW4pIHtcclxuICAgICAgICAgICAgdGhpcy5wb3MgPSB0aGlzLmxlbjtcclxuICAgICAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDEwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHZhcmludCBhcyBhIHNpZ25lZCAzMiBiaXQgdmFsdWUuXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuaW50MzIgPSBmdW5jdGlvbiByZWFkX2ludDMyKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudWludDMyKCkgfCAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgemlnLXphZyBlbmNvZGVkIHZhcmludCBhcyBhIHNpZ25lZCAzMiBiaXQgdmFsdWUuXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuc2ludDMyID0gZnVuY3Rpb24gcmVhZF9zaW50MzIoKSB7XHJcbiAgICB2YXIgdmFsdWUgPSB0aGlzLnVpbnQzMigpO1xyXG4gICAgcmV0dXJuIHZhbHVlID4+PiAxIF4gLSh2YWx1ZSAmIDEpIHwgMDtcclxufTtcclxuXHJcbi8qIGVzbGludC1kaXNhYmxlIG5vLWludmFsaWQtdGhpcyAqL1xyXG5cclxuZnVuY3Rpb24gcmVhZExvbmdWYXJpbnQoKSB7XHJcbiAgICAvLyB0ZW5kcyB0byBkZW9wdCB3aXRoIGxvY2FsIHZhcnMgZm9yIG9jdGV0IGV0Yy5cclxuICAgIHZhciBiaXRzID0gbmV3IExvbmdCaXRzKDAsIDApO1xyXG4gICAgdmFyIGkgPSAwO1xyXG4gICAgaWYgKHRoaXMubGVuIC0gdGhpcy5wb3MgPiA0KSB7IC8vIGZhc3Qgcm91dGUgKGxvKVxyXG4gICAgICAgIGZvciAoOyBpIDwgNDsgKytpKSB7XHJcbiAgICAgICAgICAgIC8vIDFzdC4uNHRoXHJcbiAgICAgICAgICAgIGJpdHMubG8gPSAoYml0cy5sbyB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IGkgKiA3KSA+Pj4gMDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpdHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDV0aFxyXG4gICAgICAgIGJpdHMubG8gPSAoYml0cy5sbyB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IDI4KSA+Pj4gMDtcclxuICAgICAgICBiaXRzLmhpID0gKGJpdHMuaGkgfCAodGhpcy5idWZbdGhpcy5wb3NdICYgMTI3KSA+PiAgNCkgPj4+IDA7XHJcbiAgICAgICAgaWYgKHRoaXMuYnVmW3RoaXMucG9zKytdIDwgMTI4KVxyXG4gICAgICAgICAgICByZXR1cm4gYml0cztcclxuICAgICAgICBpID0gMDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZm9yICg7IGkgPCAzOyArK2kpIHtcclxuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmxlbilcclxuICAgICAgICAgICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzKTtcclxuICAgICAgICAgICAgLy8gMXN0Li4zdGhcclxuICAgICAgICAgICAgYml0cy5sbyA9IChiaXRzLmxvIHwgKHRoaXMuYnVmW3RoaXMucG9zXSAmIDEyNykgPDwgaSAqIDcpID4+PiAwO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5idWZbdGhpcy5wb3MrK10gPCAxMjgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYml0cztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gNHRoXHJcbiAgICAgICAgYml0cy5sbyA9IChiaXRzLmxvIHwgKHRoaXMuYnVmW3RoaXMucG9zKytdICYgMTI3KSA8PCBpICogNykgPj4+IDA7XHJcbiAgICAgICAgcmV0dXJuIGJpdHM7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5sZW4gLSB0aGlzLnBvcyA+IDQpIHsgLy8gZmFzdCByb3V0ZSAoaGkpXHJcbiAgICAgICAgZm9yICg7IGkgPCA1OyArK2kpIHtcclxuICAgICAgICAgICAgLy8gNnRoLi4xMHRoXHJcbiAgICAgICAgICAgIGJpdHMuaGkgPSAoYml0cy5oaSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IGkgKiA3ICsgMykgPj4+IDA7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOClcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaXRzO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZm9yICg7IGkgPCA1OyArK2kpIHtcclxuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvcyA+PSB0aGlzLmxlbilcclxuICAgICAgICAgICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzKTtcclxuICAgICAgICAgICAgLy8gNnRoLi4xMHRoXHJcbiAgICAgICAgICAgIGJpdHMuaGkgPSAoYml0cy5oaSB8ICh0aGlzLmJ1Zlt0aGlzLnBvc10gJiAxMjcpIDw8IGkgKiA3ICsgMykgPj4+IDA7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJ1Zlt0aGlzLnBvcysrXSA8IDEyOClcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaXRzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICB0aHJvdyBFcnJvcihcImludmFsaWQgdmFyaW50IGVuY29kaW5nXCIpO1xyXG59XHJcblxyXG4vKiBlc2xpbnQtZW5hYmxlIG5vLWludmFsaWQtdGhpcyAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgdmFyaW50IGFzIGEgc2lnbmVkIDY0IGJpdCB2YWx1ZS5cclxuICogQG5hbWUgUmVhZGVyI2ludDY0XHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7TG9uZ30gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHZhcmludCBhcyBhbiB1bnNpZ25lZCA2NCBiaXQgdmFsdWUuXHJcbiAqIEBuYW1lIFJlYWRlciN1aW50NjRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtMb25nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgemlnLXphZyBlbmNvZGVkIHZhcmludCBhcyBhIHNpZ25lZCA2NCBiaXQgdmFsdWUuXHJcbiAqIEBuYW1lIFJlYWRlciNzaW50NjRcclxuICogQGZ1bmN0aW9uXHJcbiAqIEByZXR1cm5zIHtMb25nfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGEgdmFyaW50IGFzIGEgYm9vbGVhbi5cclxuICogQHJldHVybnMge2Jvb2xlYW59IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuYm9vbCA9IGZ1bmN0aW9uIHJlYWRfYm9vbCgpIHtcclxuICAgIHJldHVybiB0aGlzLnVpbnQzMigpICE9PSAwO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gcmVhZEZpeGVkMzJfZW5kKGJ1ZiwgZW5kKSB7IC8vIG5vdGUgdGhhdCB0aGlzIHVzZXMgYGVuZGAsIG5vdCBgcG9zYFxyXG4gICAgcmV0dXJuIChidWZbZW5kIC0gNF1cclxuICAgICAgICAgIHwgYnVmW2VuZCAtIDNdIDw8IDhcclxuICAgICAgICAgIHwgYnVmW2VuZCAtIDJdIDw8IDE2XHJcbiAgICAgICAgICB8IGJ1ZltlbmQgLSAxXSA8PCAyNCkgPj4+IDA7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBmaXhlZCAzMiBiaXRzIGFzIGFuIHVuc2lnbmVkIDMyIGJpdCBpbnRlZ2VyLlxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLmZpeGVkMzIgPSBmdW5jdGlvbiByZWFkX2ZpeGVkMzIoKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAodGhpcy5wb3MgKyA0ID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDQpO1xyXG5cclxuICAgIHJldHVybiByZWFkRml4ZWQzMl9lbmQodGhpcy5idWYsIHRoaXMucG9zICs9IDQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGZpeGVkIDMyIGJpdHMgYXMgYSBzaWduZWQgMzIgYml0IGludGVnZXIuXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFZhbHVlIHJlYWRcclxuICovXHJcblJlYWRlci5wcm90b3R5cGUuc2ZpeGVkMzIgPSBmdW5jdGlvbiByZWFkX3NmaXhlZDMyKCkge1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKHRoaXMucG9zICsgNCA+IHRoaXMubGVuKVxyXG4gICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCA0KTtcclxuXHJcbiAgICByZXR1cm4gcmVhZEZpeGVkMzJfZW5kKHRoaXMuYnVmLCB0aGlzLnBvcyArPSA0KSB8IDA7XHJcbn07XHJcblxyXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cclxuXHJcbmZ1bmN0aW9uIHJlYWRGaXhlZDY0KC8qIHRoaXM6IFJlYWRlciAqLykge1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKHRoaXMucG9zICsgOCA+IHRoaXMubGVuKVxyXG4gICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCA4KTtcclxuXHJcbiAgICByZXR1cm4gbmV3IExvbmdCaXRzKHJlYWRGaXhlZDMyX2VuZCh0aGlzLmJ1ZiwgdGhpcy5wb3MgKz0gNCksIHJlYWRGaXhlZDMyX2VuZCh0aGlzLmJ1ZiwgdGhpcy5wb3MgKz0gNCkpO1xyXG59XHJcblxyXG4vKiBlc2xpbnQtZW5hYmxlIG5vLWludmFsaWQtdGhpcyAqL1xyXG5cclxuLyoqXHJcbiAqIFJlYWRzIGZpeGVkIDY0IGJpdHMuXHJcbiAqIEBuYW1lIFJlYWRlciNmaXhlZDY0XHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7TG9uZ30gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyB6aWctemFnIGVuY29kZWQgZml4ZWQgNjQgYml0cy5cclxuICogQG5hbWUgUmVhZGVyI3NmaXhlZDY0XHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7TG9uZ30gVmFsdWUgcmVhZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIGZsb2F0ICgzMiBiaXQpIGFzIGEgbnVtYmVyLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge251bWJlcn0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5mbG9hdCA9IGZ1bmN0aW9uIHJlYWRfZmxvYXQoKSB7XHJcblxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAodGhpcy5wb3MgKyA0ID4gdGhpcy5sZW4pXHJcbiAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMsIDQpO1xyXG5cclxuICAgIHZhciB2YWx1ZSA9IHV0aWwuZmxvYXQucmVhZEZsb2F0TEUodGhpcy5idWYsIHRoaXMucG9zKTtcclxuICAgIHRoaXMucG9zICs9IDQ7XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgYSBkb3VibGUgKDY0IGJpdCBmbG9hdCkgYXMgYSBudW1iZXIuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLmRvdWJsZSA9IGZ1bmN0aW9uIHJlYWRfZG91YmxlKCkge1xyXG5cclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgaWYgKHRoaXMucG9zICsgOCA+IHRoaXMubGVuKVxyXG4gICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCA0KTtcclxuXHJcbiAgICB2YXIgdmFsdWUgPSB1dGlsLmZsb2F0LnJlYWREb3VibGVMRSh0aGlzLmJ1ZiwgdGhpcy5wb3MpO1xyXG4gICAgdGhpcy5wb3MgKz0gODtcclxuICAgIHJldHVybiB2YWx1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWFkcyBhIHNlcXVlbmNlIG9mIGJ5dGVzIHByZWNlZWRlZCBieSBpdHMgbGVuZ3RoIGFzIGEgdmFyaW50LlxyXG4gKiBAcmV0dXJucyB7VWludDhBcnJheX0gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5ieXRlcyA9IGZ1bmN0aW9uIHJlYWRfYnl0ZXMoKSB7XHJcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy51aW50MzIoKSxcclxuICAgICAgICBzdGFydCAgPSB0aGlzLnBvcyxcclxuICAgICAgICBlbmQgICAgPSB0aGlzLnBvcyArIGxlbmd0aDtcclxuXHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgIGlmIChlbmQgPiB0aGlzLmxlbilcclxuICAgICAgICB0aHJvdyBpbmRleE91dE9mUmFuZ2UodGhpcywgbGVuZ3RoKTtcclxuXHJcbiAgICB0aGlzLnBvcyArPSBsZW5ndGg7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmJ1ZikpIC8vIHBsYWluIGFycmF5XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYnVmLnNsaWNlKHN0YXJ0LCBlbmQpO1xyXG4gICAgcmV0dXJuIHN0YXJ0ID09PSBlbmQgLy8gZml4IGZvciBJRSAxMC9XaW44IGFuZCBvdGhlcnMnIHN1YmFycmF5IHJldHVybmluZyBhcnJheSBvZiBzaXplIDFcclxuICAgICAgICA/IG5ldyB0aGlzLmJ1Zi5jb25zdHJ1Y3RvcigwKVxyXG4gICAgICAgIDogdGhpcy5fc2xpY2UuY2FsbCh0aGlzLmJ1Ziwgc3RhcnQsIGVuZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgYSBzdHJpbmcgcHJlY2VlZGVkIGJ5IGl0cyBieXRlIGxlbmd0aCBhcyBhIHZhcmludC5cclxuICogQHJldHVybnMge3N0cmluZ30gVmFsdWUgcmVhZFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5zdHJpbmcgPSBmdW5jdGlvbiByZWFkX3N0cmluZygpIHtcclxuICAgIHZhciBieXRlcyA9IHRoaXMuYnl0ZXMoKTtcclxuICAgIHJldHVybiB1dGY4LnJlYWQoYnl0ZXMsIDAsIGJ5dGVzLmxlbmd0aCk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2tpcHMgdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgYnl0ZXMgaWYgc3BlY2lmaWVkLCBvdGhlcndpc2Ugc2tpcHMgYSB2YXJpbnQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbbGVuZ3RoXSBMZW5ndGggaWYga25vd24sIG90aGVyd2lzZSBhIHZhcmludCBpcyBhc3N1bWVkXHJcbiAqIEByZXR1cm5zIHtSZWFkZXJ9IGB0aGlzYFxyXG4gKi9cclxuUmVhZGVyLnByb3RvdHlwZS5za2lwID0gZnVuY3Rpb24gc2tpcChsZW5ndGgpIHtcclxuICAgIGlmICh0eXBlb2YgbGVuZ3RoID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICAgICAgaWYgKHRoaXMucG9zICsgbGVuZ3RoID4gdGhpcy5sZW4pXHJcbiAgICAgICAgICAgIHRocm93IGluZGV4T3V0T2ZSYW5nZSh0aGlzLCBsZW5ndGgpO1xyXG4gICAgICAgIHRoaXMucG9zICs9IGxlbmd0aDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cclxuICAgICAgICAgICAgaWYgKHRoaXMucG9zID49IHRoaXMubGVuKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgaW5kZXhPdXRPZlJhbmdlKHRoaXMpO1xyXG4gICAgICAgIH0gd2hpbGUgKHRoaXMuYnVmW3RoaXMucG9zKytdICYgMTI4KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNraXBzIHRoZSBuZXh0IGVsZW1lbnQgb2YgdGhlIHNwZWNpZmllZCB3aXJlIHR5cGUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB3aXJlVHlwZSBXaXJlIHR5cGUgcmVjZWl2ZWRcclxuICogQHJldHVybnMge1JlYWRlcn0gYHRoaXNgXHJcbiAqL1xyXG5SZWFkZXIucHJvdG90eXBlLnNraXBUeXBlID0gZnVuY3Rpb24od2lyZVR5cGUpIHtcclxuICAgIHN3aXRjaCAod2lyZVR5cGUpIHtcclxuICAgICAgICBjYXNlIDA6XHJcbiAgICAgICAgICAgIHRoaXMuc2tpcCgpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICAgIHRoaXMuc2tpcCg4KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICB0aGlzLnNraXAodGhpcy51aW50MzIoKSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgZG8geyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnN0YW50LWNvbmRpdGlvblxyXG4gICAgICAgICAgICAgICAgaWYgKCh3aXJlVHlwZSA9IHRoaXMudWludDMyKCkgJiA3KSA9PT0gNClcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIHRoaXMuc2tpcFR5cGUod2lyZVR5cGUpO1xyXG4gICAgICAgICAgICB9IHdoaWxlICh0cnVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA1OlxyXG4gICAgICAgICAgICB0aGlzLnNraXAoNCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiaW52YWxpZCB3aXJlIHR5cGUgXCIgKyB3aXJlVHlwZSArIFwiIGF0IG9mZnNldCBcIiArIHRoaXMucG9zKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuUmVhZGVyLl9jb25maWd1cmUgPSBmdW5jdGlvbihCdWZmZXJSZWFkZXJfKSB7XHJcbiAgICBCdWZmZXJSZWFkZXIgPSBCdWZmZXJSZWFkZXJfO1xyXG5cclxuICAgIHZhciBmbiA9IHV0aWwuTG9uZyA/IFwidG9Mb25nXCIgOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBcInRvTnVtYmVyXCI7XHJcbiAgICB1dGlsLm1lcmdlKFJlYWRlci5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAgICAgaW50NjQ6IGZ1bmN0aW9uIHJlYWRfaW50NjQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWFkTG9uZ1ZhcmludC5jYWxsKHRoaXMpW2ZuXShmYWxzZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdWludDY0OiBmdW5jdGlvbiByZWFkX3VpbnQ2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWRMb25nVmFyaW50LmNhbGwodGhpcylbZm5dKHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNpbnQ2NDogZnVuY3Rpb24gcmVhZF9zaW50NjQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWFkTG9uZ1ZhcmludC5jYWxsKHRoaXMpLnp6RGVjb2RlKClbZm5dKGZhbHNlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmaXhlZDY0OiBmdW5jdGlvbiByZWFkX2ZpeGVkNjQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWFkRml4ZWQ2NC5jYWxsKHRoaXMpW2ZuXSh0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZml4ZWQ2NDogZnVuY3Rpb24gcmVhZF9zZml4ZWQ2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWRGaXhlZDY0LmNhbGwodGhpcylbZm5dKGZhbHNlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1ZmZlclJlYWRlcjtcclxuXHJcbi8vIGV4dGVuZHMgUmVhZGVyXHJcbnZhciBSZWFkZXIgPSByZXF1aXJlKFwiLi9yZWFkZXJcIik7XHJcbihCdWZmZXJSZWFkZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWFkZXIucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBCdWZmZXJSZWFkZXI7XHJcblxyXG52YXIgdXRpbCA9IHJlcXVpcmUoXCIuL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IGJ1ZmZlciByZWFkZXIgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgV2lyZSBmb3JtYXQgcmVhZGVyIHVzaW5nIG5vZGUgYnVmZmVycy5cclxuICogQGV4dGVuZHMgUmVhZGVyXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge0J1ZmZlcn0gYnVmZmVyIEJ1ZmZlciB0byByZWFkIGZyb21cclxuICovXHJcbmZ1bmN0aW9uIEJ1ZmZlclJlYWRlcihidWZmZXIpIHtcclxuICAgIFJlYWRlci5jYWxsKHRoaXMsIGJ1ZmZlcik7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWFkIGJ1ZmZlci5cclxuICAgICAqIEBuYW1lIEJ1ZmZlclJlYWRlciNidWZcclxuICAgICAqIEB0eXBlIHtCdWZmZXJ9XHJcbiAgICAgKi9cclxufVxyXG5cclxuLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cclxuaWYgKHV0aWwuQnVmZmVyKVxyXG4gICAgQnVmZmVyUmVhZGVyLnByb3RvdHlwZS5fc2xpY2UgPSB1dGlsLkJ1ZmZlci5wcm90b3R5cGUuc2xpY2U7XHJcblxyXG4vKipcclxuICogQG92ZXJyaWRlXHJcbiAqL1xyXG5CdWZmZXJSZWFkZXIucHJvdG90eXBlLnN0cmluZyA9IGZ1bmN0aW9uIHJlYWRfc3RyaW5nX2J1ZmZlcigpIHtcclxuICAgIHZhciBsZW4gPSB0aGlzLnVpbnQzMigpOyAvLyBtb2RpZmllcyBwb3NcclxuICAgIHJldHVybiB0aGlzLmJ1Zi51dGY4U2xpY2UodGhpcy5wb3MsIHRoaXMucG9zID0gTWF0aC5taW4odGhpcy5wb3MgKyBsZW4sIHRoaXMubGVuKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgYSBzZXF1ZW5jZSBvZiBieXRlcyBwcmVjZWVkZWQgYnkgaXRzIGxlbmd0aCBhcyBhIHZhcmludC5cclxuICogQG5hbWUgQnVmZmVyUmVhZGVyI2J5dGVzXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7QnVmZmVyfSBWYWx1ZSByZWFkXHJcbiAqL1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBOYW1lZCByb290cy5cclxuICogVGhpcyBpcyB3aGVyZSBwYmpzIHN0b3JlcyBnZW5lcmF0ZWQgc3RydWN0dXJlcyAodGhlIG9wdGlvbiBgLXIsIC0tcm9vdGAgc3BlY2lmaWVzIGEgbmFtZSkuXHJcbiAqIENhbiBhbHNvIGJlIHVzZWQgbWFudWFsbHkgdG8gbWFrZSByb290cyBhdmFpbGFibGUgYWNjcm9zcyBtb2R1bGVzLlxyXG4gKiBAbmFtZSByb290c1xyXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsUm9vdD59XHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vIHBianMgLXIgbXlyb290IC1vIGNvbXBpbGVkLmpzIC4uLlxyXG4gKlxyXG4gKiAvLyBpbiBhbm90aGVyIG1vZHVsZTpcclxuICogcmVxdWlyZShcIi4vY29tcGlsZWQuanNcIik7XHJcbiAqXHJcbiAqIC8vIGluIGFueSBzdWJzZXF1ZW50IG1vZHVsZTpcclxuICogdmFyIHJvb3QgPSBwcm90b2J1Zi5yb290c1tcIm15cm9vdFwiXTtcclxuICovXHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoqXHJcbiAqIFN0cmVhbWluZyBSUEMgaGVscGVycy5cclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIHJwYyA9IGV4cG9ydHM7XHJcblxyXG4vKipcclxuICogUlBDIGltcGxlbWVudGF0aW9uIHBhc3NlZCB0byB7QGxpbmsgU2VydmljZSNjcmVhdGV9IHBlcmZvcm1pbmcgYSBzZXJ2aWNlIHJlcXVlc3Qgb24gbmV0d29yayBsZXZlbCwgaS5lLiBieSB1dGlsaXppbmcgaHR0cCByZXF1ZXN0cyBvciB3ZWJzb2NrZXRzLlxyXG4gKiBAdHlwZWRlZiBSUENJbXBsXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtNZXRob2R8cnBjLlNlcnZpY2VNZXRob2Q8TWVzc2FnZTx7fT4sTWVzc2FnZTx7fT4+fSBtZXRob2QgUmVmbGVjdGVkIG9yIHN0YXRpYyBtZXRob2QgYmVpbmcgY2FsbGVkXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gcmVxdWVzdERhdGEgUmVxdWVzdCBkYXRhXHJcbiAqIEBwYXJhbSB7UlBDSW1wbENhbGxiYWNrfSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKiBAZXhhbXBsZVxyXG4gKiBmdW5jdGlvbiBycGNJbXBsKG1ldGhvZCwgcmVxdWVzdERhdGEsIGNhbGxiYWNrKSB7XHJcbiAqICAgICBpZiAocHJvdG9idWYudXRpbC5sY0ZpcnN0KG1ldGhvZC5uYW1lKSAhPT0gXCJteU1ldGhvZFwiKSAvLyBjb21wYXRpYmxlIHdpdGggc3RhdGljIGNvZGVcclxuICogICAgICAgICB0aHJvdyBFcnJvcihcIm5vIHN1Y2ggbWV0aG9kXCIpO1xyXG4gKiAgICAgYXN5bmNocm9ub3VzbHlPYnRhaW5BUmVzcG9uc2UocmVxdWVzdERhdGEsIGZ1bmN0aW9uKGVyciwgcmVzcG9uc2VEYXRhKSB7XHJcbiAqICAgICAgICAgY2FsbGJhY2soZXJyLCByZXNwb25zZURhdGEpO1xyXG4gKiAgICAgfSk7XHJcbiAqIH1cclxuICovXHJcblxyXG4vKipcclxuICogTm9kZS1zdHlsZSBjYWxsYmFjayBhcyB1c2VkIGJ5IHtAbGluayBSUENJbXBsfS5cclxuICogQHR5cGVkZWYgUlBDSW1wbENhbGxiYWNrXHJcbiAqIEB0eXBlIHtmdW5jdGlvbn1cclxuICogQHBhcmFtIHtFcnJvcnxudWxsfSBlcnJvciBFcnJvciwgaWYgYW55LCBvdGhlcndpc2UgYG51bGxgXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheXxudWxsfSBbcmVzcG9uc2VdIFJlc3BvbnNlIGRhdGEgb3IgYG51bGxgIHRvIHNpZ25hbCBlbmQgb2Ygc3RyZWFtLCBpZiB0aGVyZSBoYXNuJ3QgYmVlbiBhbiBlcnJvclxyXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbnJwYy5TZXJ2aWNlID0gcmVxdWlyZShcIi4vcnBjL3NlcnZpY2VcIik7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZpY2U7XHJcblxyXG52YXIgdXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsL21pbmltYWxcIik7XHJcblxyXG4vLyBFeHRlbmRzIEV2ZW50RW1pdHRlclxyXG4oU2VydmljZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHV0aWwuRXZlbnRFbWl0dGVyLnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yID0gU2VydmljZTtcclxuXHJcbi8qKlxyXG4gKiBBIHNlcnZpY2UgbWV0aG9kIGNhbGxiYWNrIGFzIHVzZWQgYnkge0BsaW5rIHJwYy5TZXJ2aWNlTWV0aG9kfFNlcnZpY2VNZXRob2R9LlxyXG4gKlxyXG4gKiBEaWZmZXJzIGZyb20ge0BsaW5rIFJQQ0ltcGxDYWxsYmFja30gaW4gdGhhdCBpdCBpcyBhbiBhY3R1YWwgY2FsbGJhY2sgb2YgYSBzZXJ2aWNlIG1ldGhvZCB3aGljaCBtYXkgbm90IHJldHVybiBgcmVzcG9uc2UgPSBudWxsYC5cclxuICogQHR5cGVkZWYgcnBjLlNlcnZpY2VNZXRob2RDYWxsYmFja1xyXG4gKiBAdGVtcGxhdGUgVFJlcyBleHRlbmRzIE1lc3NhZ2U8VFJlcz5cclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge0Vycm9yfG51bGx9IGVycm9yIEVycm9yLCBpZiBhbnlcclxuICogQHBhcmFtIHtUUmVzfSBbcmVzcG9uc2VdIFJlc3BvbnNlIG1lc3NhZ2VcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogQSBzZXJ2aWNlIG1ldGhvZCBwYXJ0IG9mIGEge0BsaW5rIHJwYy5TZXJ2aWNlfSBhcyBjcmVhdGVkIGJ5IHtAbGluayBTZXJ2aWNlLmNyZWF0ZX0uXHJcbiAqIEB0eXBlZGVmIHJwYy5TZXJ2aWNlTWV0aG9kXHJcbiAqIEB0ZW1wbGF0ZSBUUmVxIGV4dGVuZHMgTWVzc2FnZTxUUmVxPlxyXG4gKiBAdGVtcGxhdGUgVFJlcyBleHRlbmRzIE1lc3NhZ2U8VFJlcz5cclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge1RSZXF8UHJvcGVydGllczxUUmVxPn0gcmVxdWVzdCBSZXF1ZXN0IG1lc3NhZ2Ugb3IgcGxhaW4gb2JqZWN0XHJcbiAqIEBwYXJhbSB7cnBjLlNlcnZpY2VNZXRob2RDYWxsYmFjazxUUmVzPn0gW2NhbGxiYWNrXSBOb2RlLXN0eWxlIGNhbGxiYWNrIGNhbGxlZCB3aXRoIHRoZSBlcnJvciwgaWYgYW55LCBhbmQgdGhlIHJlc3BvbnNlIG1lc3NhZ2VcclxuICogQHJldHVybnMge1Byb21pc2U8TWVzc2FnZTxUUmVzPj59IFByb21pc2UgaWYgYGNhbGxiYWNrYCBoYXMgYmVlbiBvbWl0dGVkLCBvdGhlcndpc2UgYHVuZGVmaW5lZGBcclxuICovXHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBSUEMgc2VydmljZSBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBBbiBSUEMgc2VydmljZSBhcyByZXR1cm5lZCBieSB7QGxpbmsgU2VydmljZSNjcmVhdGV9LlxyXG4gKiBAZXhwb3J0cyBycGMuU2VydmljZVxyXG4gKiBAZXh0ZW5kcyB1dGlsLkV2ZW50RW1pdHRlclxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtSUENJbXBsfSBycGNJbXBsIFJQQyBpbXBsZW1lbnRhdGlvblxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXF1ZXN0RGVsaW1pdGVkPWZhbHNlXSBXaGV0aGVyIHJlcXVlc3RzIGFyZSBsZW5ndGgtZGVsaW1pdGVkXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Jlc3BvbnNlRGVsaW1pdGVkPWZhbHNlXSBXaGV0aGVyIHJlc3BvbnNlcyBhcmUgbGVuZ3RoLWRlbGltaXRlZFxyXG4gKi9cclxuZnVuY3Rpb24gU2VydmljZShycGNJbXBsLCByZXF1ZXN0RGVsaW1pdGVkLCByZXNwb25zZURlbGltaXRlZCkge1xyXG5cclxuICAgIGlmICh0eXBlb2YgcnBjSW1wbCAhPT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcInJwY0ltcGwgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xyXG5cclxuICAgIHV0aWwuRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSUEMgaW1wbGVtZW50YXRpb24uIEJlY29tZXMgYG51bGxgIG9uY2UgdGhlIHNlcnZpY2UgaXMgZW5kZWQuXHJcbiAgICAgKiBAdHlwZSB7UlBDSW1wbHxudWxsfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJwY0ltcGwgPSBycGNJbXBsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciByZXF1ZXN0cyBhcmUgbGVuZ3RoLWRlbGltaXRlZC5cclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICB0aGlzLnJlcXVlc3REZWxpbWl0ZWQgPSBCb29sZWFuKHJlcXVlc3REZWxpbWl0ZWQpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciByZXNwb25zZXMgYXJlIGxlbmd0aC1kZWxpbWl0ZWQuXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5yZXNwb25zZURlbGltaXRlZCA9IEJvb2xlYW4ocmVzcG9uc2VEZWxpbWl0ZWQpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsbHMgYSBzZXJ2aWNlIG1ldGhvZCB0aHJvdWdoIHtAbGluayBycGMuU2VydmljZSNycGNJbXBsfHJwY0ltcGx9LlxyXG4gKiBAcGFyYW0ge01ldGhvZHxycGMuU2VydmljZU1ldGhvZDxUUmVxLFRSZXM+fSBtZXRob2QgUmVmbGVjdGVkIG9yIHN0YXRpYyBtZXRob2RcclxuICogQHBhcmFtIHtDb25zdHJ1Y3RvcjxUUmVxPn0gcmVxdWVzdEN0b3IgUmVxdWVzdCBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge0NvbnN0cnVjdG9yPFRSZXM+fSByZXNwb25zZUN0b3IgUmVzcG9uc2UgY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtUUmVxfFByb3BlcnRpZXM8VFJlcT59IHJlcXVlc3QgUmVxdWVzdCBtZXNzYWdlIG9yIHBsYWluIG9iamVjdFxyXG4gKiBAcGFyYW0ge3JwYy5TZXJ2aWNlTWV0aG9kQ2FsbGJhY2s8VFJlcz59IGNhbGxiYWNrIFNlcnZpY2UgY2FsbGJhY2tcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICogQHRlbXBsYXRlIFRSZXEgZXh0ZW5kcyBNZXNzYWdlPFRSZXE+XHJcbiAqIEB0ZW1wbGF0ZSBUUmVzIGV4dGVuZHMgTWVzc2FnZTxUUmVzPlxyXG4gKi9cclxuU2VydmljZS5wcm90b3R5cGUucnBjQ2FsbCA9IGZ1bmN0aW9uIHJwY0NhbGwobWV0aG9kLCByZXF1ZXN0Q3RvciwgcmVzcG9uc2VDdG9yLCByZXF1ZXN0LCBjYWxsYmFjaykge1xyXG5cclxuICAgIGlmICghcmVxdWVzdClcclxuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJyZXF1ZXN0IG11c3QgYmUgc3BlY2lmaWVkXCIpO1xyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIGlmICghY2FsbGJhY2spXHJcbiAgICAgICAgcmV0dXJuIHV0aWwuYXNQcm9taXNlKHJwY0NhbGwsIHNlbGYsIG1ldGhvZCwgcmVxdWVzdEN0b3IsIHJlc3BvbnNlQ3RvciwgcmVxdWVzdCk7XHJcblxyXG4gICAgaWYgKCFzZWxmLnJwY0ltcGwpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhFcnJvcihcImFscmVhZHkgZW5kZWRcIikpOyB9LCAwKTtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIHNlbGYucnBjSW1wbChcclxuICAgICAgICAgICAgbWV0aG9kLFxyXG4gICAgICAgICAgICByZXF1ZXN0Q3RvcltzZWxmLnJlcXVlc3REZWxpbWl0ZWQgPyBcImVuY29kZURlbGltaXRlZFwiIDogXCJlbmNvZGVcIl0ocmVxdWVzdCkuZmluaXNoKCksXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJwY0NhbGxiYWNrKGVyciwgcmVzcG9uc2UpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbWl0KFwiZXJyb3JcIiwgZXJyLCBtZXRob2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZW5kKC8qIGVuZGVkQnlSUEMgKi8gdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIShyZXNwb25zZSBpbnN0YW5jZW9mIHJlc3BvbnNlQ3RvcikpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IHJlc3BvbnNlQ3RvcltzZWxmLnJlc3BvbnNlRGVsaW1pdGVkID8gXCJkZWNvZGVEZWxpbWl0ZWRcIiA6IFwiZGVjb2RlXCJdKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbWl0KFwiZXJyb3JcIiwgZXJyLCBtZXRob2QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5lbWl0KFwiZGF0YVwiLCByZXNwb25zZSwgbWV0aG9kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgc2VsZi5lbWl0KFwiZXJyb3JcIiwgZXJyLCBtZXRob2QpO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGVycik7IH0sIDApO1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRW5kcyB0aGlzIHNlcnZpY2UgYW5kIGVtaXRzIHRoZSBgZW5kYCBldmVudC5cclxuICogQHBhcmFtIHtib29sZWFufSBbZW5kZWRCeVJQQz1mYWxzZV0gV2hldGhlciB0aGUgc2VydmljZSBoYXMgYmVlbiBlbmRlZCBieSB0aGUgUlBDIGltcGxlbWVudGF0aW9uLlxyXG4gKiBAcmV0dXJucyB7cnBjLlNlcnZpY2V9IGB0aGlzYFxyXG4gKi9cclxuU2VydmljZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gZW5kKGVuZGVkQnlSUEMpIHtcclxuICAgIGlmICh0aGlzLnJwY0ltcGwpIHtcclxuICAgICAgICBpZiAoIWVuZGVkQnlSUEMpIC8vIHNpZ25hbCBlbmQgdG8gcnBjSW1wbFxyXG4gICAgICAgICAgICB0aGlzLnJwY0ltcGwobnVsbCwgbnVsbCwgbnVsbCk7XHJcbiAgICAgICAgdGhpcy5ycGNJbXBsID0gbnVsbDtcclxuICAgICAgICB0aGlzLmVtaXQoXCJlbmRcIikub2ZmKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbm1vZHVsZS5leHBvcnRzID0gTG9uZ0JpdHM7XHJcblxyXG52YXIgdXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsL21pbmltYWxcIik7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBuZXcgbG9uZyBiaXRzLlxyXG4gKiBAY2xhc3NkZXNjIEhlbHBlciBjbGFzcyBmb3Igd29ya2luZyB3aXRoIHRoZSBsb3cgYW5kIGhpZ2ggYml0cyBvZiBhIDY0IGJpdCB2YWx1ZS5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsbyBMb3cgMzIgYml0cywgdW5zaWduZWRcclxuICogQHBhcmFtIHtudW1iZXJ9IGhpIEhpZ2ggMzIgYml0cywgdW5zaWduZWRcclxuICovXHJcbmZ1bmN0aW9uIExvbmdCaXRzKGxvLCBoaSkge1xyXG5cclxuICAgIC8vIG5vdGUgdGhhdCB0aGUgY2FzdHMgYmVsb3cgYXJlIHRoZW9yZXRpY2FsbHkgdW5uZWNlc3NhcnkgYXMgb2YgdG9kYXksIGJ1dCBvbGRlciBzdGF0aWNhbGx5XHJcbiAgICAvLyBnZW5lcmF0ZWQgY29udmVydGVyIGNvZGUgbWlnaHQgc3RpbGwgY2FsbCB0aGUgY3RvciB3aXRoIHNpZ25lZCAzMmJpdHMuIGtlcHQgZm9yIGNvbXBhdC5cclxuXHJcbiAgICAvKipcclxuICAgICAqIExvdyBiaXRzLlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5sbyA9IGxvID4+PiAwO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGlnaCBiaXRzLlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5oaSA9IGhpID4+PiAwO1xyXG59XHJcblxyXG4vKipcclxuICogWmVybyBiaXRzLlxyXG4gKiBAbWVtYmVyb2YgdXRpbC5Mb25nQml0c1xyXG4gKiBAdHlwZSB7dXRpbC5Mb25nQml0c31cclxuICovXHJcbnZhciB6ZXJvID0gTG9uZ0JpdHMuemVybyA9IG5ldyBMb25nQml0cygwLCAwKTtcclxuXHJcbnplcm8udG9OdW1iZXIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XHJcbnplcm8uenpFbmNvZGUgPSB6ZXJvLnp6RGVjb2RlID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9O1xyXG56ZXJvLmxlbmd0aCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMTsgfTtcclxuXHJcbi8qKlxyXG4gKiBaZXJvIGhhc2guXHJcbiAqIEBtZW1iZXJvZiB1dGlsLkxvbmdCaXRzXHJcbiAqIEB0eXBlIHtzdHJpbmd9XHJcbiAqL1xyXG52YXIgemVyb0hhc2ggPSBMb25nQml0cy56ZXJvSGFzaCA9IFwiXFwwXFwwXFwwXFwwXFwwXFwwXFwwXFwwXCI7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBuZXcgbG9uZyBiaXRzIGZyb20gdGhlIHNwZWNpZmllZCBudW1iZXIuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZVxyXG4gKiBAcmV0dXJucyB7dXRpbC5Mb25nQml0c30gSW5zdGFuY2VcclxuICovXHJcbkxvbmdCaXRzLmZyb21OdW1iZXIgPSBmdW5jdGlvbiBmcm9tTnVtYmVyKHZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUgPT09IDApXHJcbiAgICAgICAgcmV0dXJuIHplcm87XHJcbiAgICB2YXIgc2lnbiA9IHZhbHVlIDwgMDtcclxuICAgIGlmIChzaWduKVxyXG4gICAgICAgIHZhbHVlID0gLXZhbHVlO1xyXG4gICAgdmFyIGxvID0gdmFsdWUgPj4+IDAsXHJcbiAgICAgICAgaGkgPSAodmFsdWUgLSBsbykgLyA0Mjk0OTY3Mjk2ID4+PiAwO1xyXG4gICAgaWYgKHNpZ24pIHtcclxuICAgICAgICBoaSA9IH5oaSA+Pj4gMDtcclxuICAgICAgICBsbyA9IH5sbyA+Pj4gMDtcclxuICAgICAgICBpZiAoKytsbyA+IDQyOTQ5NjcyOTUpIHtcclxuICAgICAgICAgICAgbG8gPSAwO1xyXG4gICAgICAgICAgICBpZiAoKytoaSA+IDQyOTQ5NjcyOTUpXHJcbiAgICAgICAgICAgICAgICBoaSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBMb25nQml0cyhsbywgaGkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgbmV3IGxvbmcgYml0cyBmcm9tIGEgbnVtYmVyLCBsb25nIG9yIHN0cmluZy5cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlXHJcbiAqIEByZXR1cm5zIHt1dGlsLkxvbmdCaXRzfSBJbnN0YW5jZVxyXG4gKi9cclxuTG9uZ0JpdHMuZnJvbSA9IGZ1bmN0aW9uIGZyb20odmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIpXHJcbiAgICAgICAgcmV0dXJuIExvbmdCaXRzLmZyb21OdW1iZXIodmFsdWUpO1xyXG4gICAgaWYgKHV0aWwuaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cclxuICAgICAgICBpZiAodXRpbC5Mb25nKVxyXG4gICAgICAgICAgICB2YWx1ZSA9IHV0aWwuTG9uZy5mcm9tU3RyaW5nKHZhbHVlKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBMb25nQml0cy5mcm9tTnVtYmVyKHBhcnNlSW50KHZhbHVlLCAxMCkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlLmxvdyB8fCB2YWx1ZS5oaWdoID8gbmV3IExvbmdCaXRzKHZhbHVlLmxvdyA+Pj4gMCwgdmFsdWUuaGlnaCA+Pj4gMCkgOiB6ZXJvO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoaXMgbG9uZyBiaXRzIHRvIGEgcG9zc2libHkgdW5zYWZlIEphdmFTY3JpcHQgbnVtYmVyLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1bnNpZ25lZD1mYWxzZV0gV2hldGhlciB1bnNpZ25lZCBvciBub3RcclxuICogQHJldHVybnMge251bWJlcn0gUG9zc2libHkgdW5zYWZlIG51bWJlclxyXG4gKi9cclxuTG9uZ0JpdHMucHJvdG90eXBlLnRvTnVtYmVyID0gZnVuY3Rpb24gdG9OdW1iZXIodW5zaWduZWQpIHtcclxuICAgIGlmICghdW5zaWduZWQgJiYgdGhpcy5oaSA+Pj4gMzEpIHtcclxuICAgICAgICB2YXIgbG8gPSB+dGhpcy5sbyArIDEgPj4+IDAsXHJcbiAgICAgICAgICAgIGhpID0gfnRoaXMuaGkgICAgID4+PiAwO1xyXG4gICAgICAgIGlmICghbG8pXHJcbiAgICAgICAgICAgIGhpID0gaGkgKyAxID4+PiAwO1xyXG4gICAgICAgIHJldHVybiAtKGxvICsgaGkgKiA0Mjk0OTY3Mjk2KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmxvICsgdGhpcy5oaSAqIDQyOTQ5NjcyOTY7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhpcyBsb25nIGJpdHMgdG8gYSBsb25nLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1bnNpZ25lZD1mYWxzZV0gV2hldGhlciB1bnNpZ25lZCBvciBub3RcclxuICogQHJldHVybnMge0xvbmd9IExvbmdcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS50b0xvbmcgPSBmdW5jdGlvbiB0b0xvbmcodW5zaWduZWQpIHtcclxuICAgIHJldHVybiB1dGlsLkxvbmdcclxuICAgICAgICA/IG5ldyB1dGlsLkxvbmcodGhpcy5sbyB8IDAsIHRoaXMuaGkgfCAwLCBCb29sZWFuKHVuc2lnbmVkKSlcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIDogeyBsb3c6IHRoaXMubG8gfCAwLCBoaWdoOiB0aGlzLmhpIHwgMCwgdW5zaWduZWQ6IEJvb2xlYW4odW5zaWduZWQpIH07XHJcbn07XHJcblxyXG52YXIgY2hhckNvZGVBdCA9IFN0cmluZy5wcm90b3R5cGUuY2hhckNvZGVBdDtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIG5ldyBsb25nIGJpdHMgZnJvbSB0aGUgc3BlY2lmaWVkIDggY2hhcmFjdGVycyBsb25nIGhhc2guXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBoYXNoIEhhc2hcclxuICogQHJldHVybnMge3V0aWwuTG9uZ0JpdHN9IEJpdHNcclxuICovXHJcbkxvbmdCaXRzLmZyb21IYXNoID0gZnVuY3Rpb24gZnJvbUhhc2goaGFzaCkge1xyXG4gICAgaWYgKGhhc2ggPT09IHplcm9IYXNoKVxyXG4gICAgICAgIHJldHVybiB6ZXJvO1xyXG4gICAgcmV0dXJuIG5ldyBMb25nQml0cyhcclxuICAgICAgICAoIGNoYXJDb2RlQXQuY2FsbChoYXNoLCAwKVxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDEpIDw8IDhcclxuICAgICAgICB8IGNoYXJDb2RlQXQuY2FsbChoYXNoLCAyKSA8PCAxNlxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDMpIDw8IDI0KSA+Pj4gMFxyXG4gICAgLFxyXG4gICAgICAgICggY2hhckNvZGVBdC5jYWxsKGhhc2gsIDQpXHJcbiAgICAgICAgfCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgNSkgPDwgOFxyXG4gICAgICAgIHwgY2hhckNvZGVBdC5jYWxsKGhhc2gsIDYpIDw8IDE2XHJcbiAgICAgICAgfCBjaGFyQ29kZUF0LmNhbGwoaGFzaCwgNykgPDwgMjQpID4+PiAwXHJcbiAgICApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnRzIHRoaXMgbG9uZyBiaXRzIHRvIGEgOCBjaGFyYWN0ZXJzIGxvbmcgaGFzaC5cclxuICogQHJldHVybnMge3N0cmluZ30gSGFzaFxyXG4gKi9cclxuTG9uZ0JpdHMucHJvdG90eXBlLnRvSGFzaCA9IGZ1bmN0aW9uIHRvSGFzaCgpIHtcclxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKFxyXG4gICAgICAgIHRoaXMubG8gICAgICAgICYgMjU1LFxyXG4gICAgICAgIHRoaXMubG8gPj4+IDggICYgMjU1LFxyXG4gICAgICAgIHRoaXMubG8gPj4+IDE2ICYgMjU1LFxyXG4gICAgICAgIHRoaXMubG8gPj4+IDI0ICAgICAgLFxyXG4gICAgICAgIHRoaXMuaGkgICAgICAgICYgMjU1LFxyXG4gICAgICAgIHRoaXMuaGkgPj4+IDggICYgMjU1LFxyXG4gICAgICAgIHRoaXMuaGkgPj4+IDE2ICYgMjU1LFxyXG4gICAgICAgIHRoaXMuaGkgPj4+IDI0XHJcbiAgICApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFppZy16YWcgZW5jb2RlcyB0aGlzIGxvbmcgYml0cy5cclxuICogQHJldHVybnMge3V0aWwuTG9uZ0JpdHN9IGB0aGlzYFxyXG4gKi9cclxuTG9uZ0JpdHMucHJvdG90eXBlLnp6RW5jb2RlID0gZnVuY3Rpb24genpFbmNvZGUoKSB7XHJcbiAgICB2YXIgbWFzayA9ICAgdGhpcy5oaSA+PiAzMTtcclxuICAgIHRoaXMuaGkgID0gKCh0aGlzLmhpIDw8IDEgfCB0aGlzLmxvID4+PiAzMSkgXiBtYXNrKSA+Pj4gMDtcclxuICAgIHRoaXMubG8gID0gKCB0aGlzLmxvIDw8IDEgICAgICAgICAgICAgICAgICAgXiBtYXNrKSA+Pj4gMDtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFppZy16YWcgZGVjb2RlcyB0aGlzIGxvbmcgYml0cy5cclxuICogQHJldHVybnMge3V0aWwuTG9uZ0JpdHN9IGB0aGlzYFxyXG4gKi9cclxuTG9uZ0JpdHMucHJvdG90eXBlLnp6RGVjb2RlID0gZnVuY3Rpb24genpEZWNvZGUoKSB7XHJcbiAgICB2YXIgbWFzayA9IC0odGhpcy5sbyAmIDEpO1xyXG4gICAgdGhpcy5sbyAgPSAoKHRoaXMubG8gPj4+IDEgfCB0aGlzLmhpIDw8IDMxKSBeIG1hc2spID4+PiAwO1xyXG4gICAgdGhpcy5oaSAgPSAoIHRoaXMuaGkgPj4+IDEgICAgICAgICAgICAgICAgICBeIG1hc2spID4+PiAwO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9mIHRoaXMgbG9uZ2JpdHMgd2hlbiBlbmNvZGVkIGFzIGEgdmFyaW50LlxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBMZW5ndGhcclxuICovXHJcbkxvbmdCaXRzLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiBsZW5ndGgoKSB7XHJcbiAgICB2YXIgcGFydDAgPSAgdGhpcy5sbyxcclxuICAgICAgICBwYXJ0MSA9ICh0aGlzLmxvID4+PiAyOCB8IHRoaXMuaGkgPDwgNCkgPj4+IDAsXHJcbiAgICAgICAgcGFydDIgPSAgdGhpcy5oaSA+Pj4gMjQ7XHJcbiAgICByZXR1cm4gcGFydDIgPT09IDBcclxuICAgICAgICAgPyBwYXJ0MSA9PT0gMFxyXG4gICAgICAgICAgID8gcGFydDAgPCAxNjM4NFxyXG4gICAgICAgICAgICAgPyBwYXJ0MCA8IDEyOCA/IDEgOiAyXHJcbiAgICAgICAgICAgICA6IHBhcnQwIDwgMjA5NzE1MiA/IDMgOiA0XHJcbiAgICAgICAgICAgOiBwYXJ0MSA8IDE2Mzg0XHJcbiAgICAgICAgICAgICA/IHBhcnQxIDwgMTI4ID8gNSA6IDZcclxuICAgICAgICAgICAgIDogcGFydDEgPCAyMDk3MTUyID8gNyA6IDhcclxuICAgICAgICAgOiBwYXJ0MiA8IDEyOCA/IDkgOiAxMDtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciB1dGlsID0gZXhwb3J0cztcclxuXHJcbi8vIHVzZWQgdG8gcmV0dXJuIGEgUHJvbWlzZSB3aGVyZSBjYWxsYmFjayBpcyBvbWl0dGVkXHJcbnV0aWwuYXNQcm9taXNlID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL2FzcHJvbWlzZVwiKTtcclxuXHJcbi8vIGNvbnZlcnRzIHRvIC8gZnJvbSBiYXNlNjQgZW5jb2RlZCBzdHJpbmdzXHJcbnV0aWwuYmFzZTY0ID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL2Jhc2U2NFwiKTtcclxuXHJcbi8vIGJhc2UgY2xhc3Mgb2YgcnBjLlNlcnZpY2VcclxudXRpbC5FdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiQHByb3RvYnVmanMvZXZlbnRlbWl0dGVyXCIpO1xyXG5cclxuLy8gZmxvYXQgaGFuZGxpbmcgYWNjcm9zcyBicm93c2Vyc1xyXG51dGlsLmZsb2F0ID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL2Zsb2F0XCIpO1xyXG5cclxuLy8gcmVxdWlyZXMgbW9kdWxlcyBvcHRpb25hbGx5IGFuZCBoaWRlcyB0aGUgY2FsbCBmcm9tIGJ1bmRsZXJzXHJcbnV0aWwuaW5xdWlyZSA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy9pbnF1aXJlXCIpO1xyXG5cclxuLy8gY29udmVydHMgdG8gLyBmcm9tIHV0ZjggZW5jb2RlZCBzdHJpbmdzXHJcbnV0aWwudXRmOCA9IHJlcXVpcmUoXCJAcHJvdG9idWZqcy91dGY4XCIpO1xyXG5cclxuLy8gcHJvdmlkZXMgYSBub2RlLWxpa2UgYnVmZmVyIHBvb2wgaW4gdGhlIGJyb3dzZXJcclxudXRpbC5wb29sID0gcmVxdWlyZShcIkBwcm90b2J1ZmpzL3Bvb2xcIik7XHJcblxyXG4vLyB1dGlsaXR5IHRvIHdvcmsgd2l0aCB0aGUgbG93IGFuZCBoaWdoIGJpdHMgb2YgYSA2NCBiaXQgdmFsdWVcclxudXRpbC5Mb25nQml0cyA9IHJlcXVpcmUoXCIuL2xvbmdiaXRzXCIpO1xyXG5cclxuLyoqXHJcbiAqIEFuIGltbXVhYmxlIGVtcHR5IGFycmF5LlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAdHlwZSB7QXJyYXkuPCo+fVxyXG4gKiBAY29uc3RcclxuICovXHJcbnV0aWwuZW1wdHlBcnJheSA9IE9iamVjdC5mcmVlemUgPyBPYmplY3QuZnJlZXplKFtdKSA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIFtdOyAvLyB1c2VkIG9uIHByb3RvdHlwZXNcclxuXHJcbi8qKlxyXG4gKiBBbiBpbW11dGFibGUgZW1wdHkgb2JqZWN0LlxyXG4gKiBAdHlwZSB7T2JqZWN0fVxyXG4gKiBAY29uc3RcclxuICovXHJcbnV0aWwuZW1wdHlPYmplY3QgPSBPYmplY3QuZnJlZXplID8gT2JqZWN0LmZyZWV6ZSh7fSkgOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyB7fTsgLy8gdXNlZCBvbiBwcm90b3R5cGVzXHJcblxyXG4vKipcclxuICogV2hldGhlciBydW5uaW5nIHdpdGhpbiBub2RlIG9yIG5vdC5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQHR5cGUge2Jvb2xlYW59XHJcbiAqIEBjb25zdFxyXG4gKi9cclxudXRpbC5pc05vZGUgPSBCb29sZWFuKGdsb2JhbC5wcm9jZXNzICYmIGdsb2JhbC5wcm9jZXNzLnZlcnNpb25zICYmIGdsb2JhbC5wcm9jZXNzLnZlcnNpb25zLm5vZGUpO1xyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGlmIHRoZSBzcGVjaWZpZWQgdmFsdWUgaXMgYW4gaW50ZWdlci5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVmFsdWUgdG8gdGVzdFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHRoZSB2YWx1ZSBpcyBhbiBpbnRlZ2VyXHJcbiAqL1xyXG51dGlsLmlzSW50ZWdlciA9IE51bWJlci5pc0ludGVnZXIgfHwgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gZnVuY3Rpb24gaXNJbnRlZ2VyKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIGlzRmluaXRlKHZhbHVlKSAmJiBNYXRoLmZsb29yKHZhbHVlKSA9PT0gdmFsdWU7XHJcbn07XHJcblxyXG4vKipcclxuICogVGVzdHMgaWYgdGhlIHNwZWNpZmllZCB2YWx1ZSBpcyBhIHN0cmluZy5cclxuICogQHBhcmFtIHsqfSB2YWx1ZSBWYWx1ZSB0byB0ZXN0XHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgdGhlIHZhbHVlIGlzIGEgc3RyaW5nXHJcbiAqL1xyXG51dGlsLmlzU3RyaW5nID0gZnVuY3Rpb24gaXNTdHJpbmcodmFsdWUpIHtcclxuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgfHwgdmFsdWUgaW5zdGFuY2VvZiBTdHJpbmc7XHJcbn07XHJcblxyXG4vKipcclxuICogVGVzdHMgaWYgdGhlIHNwZWNpZmllZCB2YWx1ZSBpcyBhIG5vbi1udWxsIG9iamVjdC5cclxuICogQHBhcmFtIHsqfSB2YWx1ZSBWYWx1ZSB0byB0ZXN0XHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBgdHJ1ZWAgaWYgdGhlIHZhbHVlIGlzIGEgbm9uLW51bGwgb2JqZWN0XHJcbiAqL1xyXG51dGlsLmlzT2JqZWN0ID0gZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCI7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcHJvcGVydHkgb24gYSBtZXNzYWdlIGlzIGNvbnNpZGVyZWQgdG8gYmUgcHJlc2VudC5cclxuICogVGhpcyBpcyBhbiBhbGlhcyBvZiB7QGxpbmsgdXRpbC5pc1NldH0uXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFBsYWluIG9iamVjdCBvciBtZXNzYWdlIGluc3RhbmNlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wIFByb3BlcnR5IG5hbWVcclxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiBjb25zaWRlcmVkIHRvIGJlIHByZXNlbnQsIG90aGVyd2lzZSBgZmFsc2VgXHJcbiAqL1xyXG51dGlsLmlzc2V0ID1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYSBwcm9wZXJ0eSBvbiBhIG1lc3NhZ2UgaXMgY29uc2lkZXJlZCB0byBiZSBwcmVzZW50LlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFBsYWluIG9iamVjdCBvciBtZXNzYWdlIGluc3RhbmNlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wIFByb3BlcnR5IG5hbWVcclxuICogQHJldHVybnMge2Jvb2xlYW59IGB0cnVlYCBpZiBjb25zaWRlcmVkIHRvIGJlIHByZXNlbnQsIG90aGVyd2lzZSBgZmFsc2VgXHJcbiAqL1xyXG51dGlsLmlzU2V0ID0gZnVuY3Rpb24gaXNTZXQob2JqLCBwcm9wKSB7XHJcbiAgICB2YXIgdmFsdWUgPSBvYmpbcHJvcF07XHJcbiAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiBvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxLCBuby1wcm90b3R5cGUtYnVpbHRpbnNcclxuICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiIHx8IChBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlLmxlbmd0aCA6IE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGgpID4gMDtcclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBbnkgY29tcGF0aWJsZSBCdWZmZXIgaW5zdGFuY2UuXHJcbiAqIFRoaXMgaXMgYSBtaW5pbWFsIHN0YW5kLWFsb25lIGRlZmluaXRpb24gb2YgYSBCdWZmZXIgaW5zdGFuY2UuIFRoZSBhY3R1YWwgdHlwZSBpcyB0aGF0IGV4cG9ydGVkIGJ5IG5vZGUncyB0eXBpbmdzLlxyXG4gKiBAaW50ZXJmYWNlIEJ1ZmZlclxyXG4gKiBAZXh0ZW5kcyBVaW50OEFycmF5XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIE5vZGUncyBCdWZmZXIgY2xhc3MgaWYgYXZhaWxhYmxlLlxyXG4gKiBAdHlwZSB7Q29uc3RydWN0b3I8QnVmZmVyPn1cclxuICovXHJcbnV0aWwuQnVmZmVyID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgQnVmZmVyID0gdXRpbC5pbnF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcjtcclxuICAgICAgICAvLyByZWZ1c2UgdG8gdXNlIG5vbi1ub2RlIGJ1ZmZlcnMgaWYgbm90IGV4cGxpY2l0bHkgYXNzaWduZWQgKHBlcmYgcmVhc29ucyk6XHJcbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5wcm90b3R5cGUudXRmOFdyaXRlID8gQnVmZmVyIDogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gbnVsbDtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59KSgpO1xyXG5cclxuLy8gSW50ZXJuYWwgYWxpYXMgb2Ygb3IgcG9seWZ1bGwgZm9yIEJ1ZmZlci5mcm9tLlxyXG51dGlsLl9CdWZmZXJfZnJvbSA9IG51bGw7XHJcblxyXG4vLyBJbnRlcm5hbCBhbGlhcyBvZiBvciBwb2x5ZmlsbCBmb3IgQnVmZmVyLmFsbG9jVW5zYWZlLlxyXG51dGlsLl9CdWZmZXJfYWxsb2NVbnNhZmUgPSBudWxsO1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgYnVmZmVyIG9mIHdoYXRldmVyIHR5cGUgc3VwcG9ydGVkIGJ5IHRoZSBlbnZpcm9ubWVudC5cclxuICogQHBhcmFtIHtudW1iZXJ8bnVtYmVyW119IFtzaXplT3JBcnJheT0wXSBCdWZmZXIgc2l6ZSBvciBudW1iZXIgYXJyYXlcclxuICogQHJldHVybnMge1VpbnQ4QXJyYXl8QnVmZmVyfSBCdWZmZXJcclxuICovXHJcbnV0aWwubmV3QnVmZmVyID0gZnVuY3Rpb24gbmV3QnVmZmVyKHNpemVPckFycmF5KSB7XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgcmV0dXJuIHR5cGVvZiBzaXplT3JBcnJheSA9PT0gXCJudW1iZXJcIlxyXG4gICAgICAgID8gdXRpbC5CdWZmZXJcclxuICAgICAgICAgICAgPyB1dGlsLl9CdWZmZXJfYWxsb2NVbnNhZmUoc2l6ZU9yQXJyYXkpXHJcbiAgICAgICAgICAgIDogbmV3IHV0aWwuQXJyYXkoc2l6ZU9yQXJyYXkpXHJcbiAgICAgICAgOiB1dGlsLkJ1ZmZlclxyXG4gICAgICAgICAgICA/IHV0aWwuX0J1ZmZlcl9mcm9tKHNpemVPckFycmF5KVxyXG4gICAgICAgICAgICA6IHR5cGVvZiBVaW50OEFycmF5ID09PSBcInVuZGVmaW5lZFwiXHJcbiAgICAgICAgICAgICAgICA/IHNpemVPckFycmF5XHJcbiAgICAgICAgICAgICAgICA6IG5ldyBVaW50OEFycmF5KHNpemVPckFycmF5KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBcnJheSBpbXBsZW1lbnRhdGlvbiB1c2VkIGluIHRoZSBicm93c2VyLiBgVWludDhBcnJheWAgaWYgc3VwcG9ydGVkLCBvdGhlcndpc2UgYEFycmF5YC5cclxuICogQHR5cGUge0NvbnN0cnVjdG9yPFVpbnQ4QXJyYXk+fVxyXG4gKi9cclxudXRpbC5BcnJheSA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSBcInVuZGVmaW5lZFwiID8gVWludDhBcnJheSAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyA6IEFycmF5O1xyXG5cclxuLyoqXHJcbiAqIEFueSBjb21wYXRpYmxlIExvbmcgaW5zdGFuY2UuXHJcbiAqIFRoaXMgaXMgYSBtaW5pbWFsIHN0YW5kLWFsb25lIGRlZmluaXRpb24gb2YgYSBMb25nIGluc3RhbmNlLiBUaGUgYWN0dWFsIHR5cGUgaXMgdGhhdCBleHBvcnRlZCBieSBsb25nLmpzLlxyXG4gKiBAaW50ZXJmYWNlIExvbmdcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGxvdyBMb3cgYml0c1xyXG4gKiBAcHJvcGVydHkge251bWJlcn0gaGlnaCBIaWdoIGJpdHNcclxuICogQHByb3BlcnR5IHtib29sZWFufSB1bnNpZ25lZCBXaGV0aGVyIHVuc2lnbmVkIG9yIG5vdFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBMb25nLmpzJ3MgTG9uZyBjbGFzcyBpZiBhdmFpbGFibGUuXHJcbiAqIEB0eXBlIHtDb25zdHJ1Y3RvcjxMb25nPn1cclxuICovXHJcbnV0aWwuTG9uZyA9IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIGdsb2JhbC5kY29kZUlPICYmIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIGdsb2JhbC5kY29kZUlPLkxvbmcgfHwgdXRpbC5pbnF1aXJlKFwibG9uZ1wiKTtcclxuXHJcbi8qKlxyXG4gKiBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byB2ZXJpZnkgMiBiaXQgKGBib29sYCkgbWFwIGtleXMuXHJcbiAqIEB0eXBlIHtSZWdFeHB9XHJcbiAqIEBjb25zdFxyXG4gKi9cclxudXRpbC5rZXkyUmUgPSAvXnRydWV8ZmFsc2V8MHwxJC87XHJcblxyXG4vKipcclxuICogUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gdmVyaWZ5IDMyIGJpdCAoYGludDMyYCBldGMuKSBtYXAga2V5cy5cclxuICogQHR5cGUge1JlZ0V4cH1cclxuICogQGNvbnN0XHJcbiAqL1xyXG51dGlsLmtleTMyUmUgPSAvXi0/KD86MHxbMS05XVswLTldKikkLztcclxuXHJcbi8qKlxyXG4gKiBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byB2ZXJpZnkgNjQgYml0IChgaW50NjRgIGV0Yy4pIG1hcCBrZXlzLlxyXG4gKiBAdHlwZSB7UmVnRXhwfVxyXG4gKiBAY29uc3RcclxuICovXHJcbnV0aWwua2V5NjRSZSA9IC9eKD86W1xcXFx4MDAtXFxcXHhmZl17OH18LT8oPzowfFsxLTldWzAtOV0qKSkkLztcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyBhIG51bWJlciBvciBsb25nIHRvIGFuIDggY2hhcmFjdGVycyBsb25nIGhhc2ggc3RyaW5nLlxyXG4gKiBAcGFyYW0ge0xvbmd8bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byBjb252ZXJ0XHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEhhc2hcclxuICovXHJcbnV0aWwubG9uZ1RvSGFzaCA9IGZ1bmN0aW9uIGxvbmdUb0hhc2godmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZVxyXG4gICAgICAgID8gdXRpbC5Mb25nQml0cy5mcm9tKHZhbHVlKS50b0hhc2goKVxyXG4gICAgICAgIDogdXRpbC5Mb25nQml0cy56ZXJvSGFzaDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyBhbiA4IGNoYXJhY3RlcnMgbG9uZyBoYXNoIHN0cmluZyB0byBhIGxvbmcgb3IgbnVtYmVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaGFzaCBIYXNoXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Vuc2lnbmVkPWZhbHNlXSBXaGV0aGVyIHVuc2lnbmVkIG9yIG5vdFxyXG4gKiBAcmV0dXJucyB7TG9uZ3xudW1iZXJ9IE9yaWdpbmFsIHZhbHVlXHJcbiAqL1xyXG51dGlsLmxvbmdGcm9tSGFzaCA9IGZ1bmN0aW9uIGxvbmdGcm9tSGFzaChoYXNoLCB1bnNpZ25lZCkge1xyXG4gICAgdmFyIGJpdHMgPSB1dGlsLkxvbmdCaXRzLmZyb21IYXNoKGhhc2gpO1xyXG4gICAgaWYgKHV0aWwuTG9uZylcclxuICAgICAgICByZXR1cm4gdXRpbC5Mb25nLmZyb21CaXRzKGJpdHMubG8sIGJpdHMuaGksIHVuc2lnbmVkKTtcclxuICAgIHJldHVybiBiaXRzLnRvTnVtYmVyKEJvb2xlYW4odW5zaWduZWQpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNZXJnZXMgdGhlIHByb3BlcnRpZXMgb2YgdGhlIHNvdXJjZSBvYmplY3QgaW50byB0aGUgZGVzdGluYXRpb24gb2JqZWN0LlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBkc3QgRGVzdGluYXRpb24gb2JqZWN0XHJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IHNyYyBTb3VyY2Ugb2JqZWN0XHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lmTm90U2V0PWZhbHNlXSBNZXJnZXMgb25seSBpZiB0aGUga2V5IGlzIG5vdCBhbHJlYWR5IHNldFxyXG4gKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsKj59IERlc3RpbmF0aW9uIG9iamVjdFxyXG4gKi9cclxuZnVuY3Rpb24gbWVyZ2UoZHN0LCBzcmMsIGlmTm90U2V0KSB7IC8vIHVzZWQgYnkgY29udmVydGVyc1xyXG4gICAgZm9yICh2YXIga2V5cyA9IE9iamVjdC5rZXlzKHNyYyksIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSlcclxuICAgICAgICBpZiAoZHN0W2tleXNbaV1dID09PSB1bmRlZmluZWQgfHwgIWlmTm90U2V0KVxyXG4gICAgICAgICAgICBkc3Rba2V5c1tpXV0gPSBzcmNba2V5c1tpXV07XHJcbiAgICByZXR1cm4gZHN0O1xyXG59XHJcblxyXG51dGlsLm1lcmdlID0gbWVyZ2U7XHJcblxyXG4vKipcclxuICogQ29udmVydHMgdGhlIGZpcnN0IGNoYXJhY3RlciBvZiBhIHN0cmluZyB0byBsb3dlciBjYXNlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyIFN0cmluZyB0byBjb252ZXJ0XHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9IENvbnZlcnRlZCBzdHJpbmdcclxuICovXHJcbnV0aWwubGNGaXJzdCA9IGZ1bmN0aW9uIGxjRmlyc3Qoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b0xvd2VyQ2FzZSgpICsgc3RyLnN1YnN0cmluZygxKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgY3VzdG9tIGVycm9yIGNvbnN0cnVjdG9yLlxyXG4gKiBAbWVtYmVyb2YgdXRpbFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBFcnJvciBuYW1lXHJcbiAqIEByZXR1cm5zIHtDb25zdHJ1Y3RvcjxFcnJvcj59IEN1c3RvbSBlcnJvciBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gbmV3RXJyb3IobmFtZSkge1xyXG5cclxuICAgIGZ1bmN0aW9uIEN1c3RvbUVycm9yKG1lc3NhZ2UsIHByb3BlcnRpZXMpIHtcclxuXHJcbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEN1c3RvbUVycm9yKSlcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBDdXN0b21FcnJvcihtZXNzYWdlLCBwcm9wZXJ0aWVzKTtcclxuXHJcbiAgICAgICAgLy8gRXJyb3IuY2FsbCh0aGlzLCBtZXNzYWdlKTtcclxuICAgICAgICAvLyBeIGp1c3QgcmV0dXJucyBhIG5ldyBlcnJvciBpbnN0YW5jZSBiZWNhdXNlIHRoZSBjdG9yIGNhbiBiZSBjYWxsZWQgYXMgYSBmdW5jdGlvblxyXG5cclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJtZXNzYWdlXCIsIHsgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1lc3NhZ2U7IH0gfSk7XHJcblxyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSAvLyBub2RlXHJcbiAgICAgICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIEN1c3RvbUVycm9yKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInN0YWNrXCIsIHsgdmFsdWU6IChuZXcgRXJyb3IoKSkuc3RhY2sgfHwgXCJcIiB9KTtcclxuXHJcbiAgICAgICAgaWYgKHByb3BlcnRpZXMpXHJcbiAgICAgICAgICAgIG1lcmdlKHRoaXMsIHByb3BlcnRpZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIChDdXN0b21FcnJvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yID0gQ3VzdG9tRXJyb3I7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEN1c3RvbUVycm9yLnByb3RvdHlwZSwgXCJuYW1lXCIsIHsgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG5hbWU7IH0gfSk7XHJcblxyXG4gICAgQ3VzdG9tRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZSArIFwiOiBcIiArIHRoaXMubWVzc2FnZTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEN1c3RvbUVycm9yO1xyXG59XHJcblxyXG51dGlsLm5ld0Vycm9yID0gbmV3RXJyb3I7XHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyBwcm90b2NvbCBlcnJvci5cclxuICogQGNsYXNzZGVzYyBFcnJvciBzdWJjbGFzcyBpbmRpY2F0aW5nIGEgcHJvdG9jb2wgc3BlY2lmYyBlcnJvci5cclxuICogQG1lbWJlcm9mIHV0aWxcclxuICogQGV4dGVuZHMgRXJyb3JcclxuICogQHRlbXBsYXRlIFQgZXh0ZW5kcyBNZXNzYWdlPFQ+XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBFcnJvciBtZXNzYWdlXHJcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IFtwcm9wZXJ0aWVzXSBBZGRpdGlvbmFsIHByb3BlcnRpZXNcclxuICogQGV4YW1wbGVcclxuICogdHJ5IHtcclxuICogICAgIE15TWVzc2FnZS5kZWNvZGUoc29tZUJ1ZmZlcik7IC8vIHRocm93cyBpZiByZXF1aXJlZCBmaWVsZHMgYXJlIG1pc3NpbmdcclxuICogfSBjYXRjaCAoZSkge1xyXG4gKiAgICAgaWYgKGUgaW5zdGFuY2VvZiBQcm90b2NvbEVycm9yICYmIGUuaW5zdGFuY2UpXHJcbiAqICAgICAgICAgY29uc29sZS5sb2coXCJkZWNvZGVkIHNvIGZhcjogXCIgKyBKU09OLnN0cmluZ2lmeShlLmluc3RhbmNlKSk7XHJcbiAqIH1cclxuICovXHJcbnV0aWwuUHJvdG9jb2xFcnJvciA9IG5ld0Vycm9yKFwiUHJvdG9jb2xFcnJvclwiKTtcclxuXHJcbi8qKlxyXG4gKiBTbyBmYXIgZGVjb2RlZCBtZXNzYWdlIGluc3RhbmNlLlxyXG4gKiBAbmFtZSB1dGlsLlByb3RvY29sRXJyb3IjaW5zdGFuY2VcclxuICogQHR5cGUge01lc3NhZ2U8VD59XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgT25lT2YgZ2V0dGVyIGFzIHJldHVybmVkIGJ5IHtAbGluayB1dGlsLm9uZU9mR2V0dGVyfS5cclxuICogQHR5cGVkZWYgT25lT2ZHZXR0ZXJcclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfHVuZGVmaW5lZH0gU2V0IGZpZWxkIG5hbWUsIGlmIGFueVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBCdWlsZHMgYSBnZXR0ZXIgZm9yIGEgb25lb2YncyBwcmVzZW50IGZpZWxkIG5hbWUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nW119IGZpZWxkTmFtZXMgRmllbGQgbmFtZXNcclxuICogQHJldHVybnMge09uZU9mR2V0dGVyfSBVbmJvdW5kIGdldHRlclxyXG4gKi9cclxudXRpbC5vbmVPZkdldHRlciA9IGZ1bmN0aW9uIGdldE9uZU9mKGZpZWxkTmFtZXMpIHtcclxuICAgIHZhciBmaWVsZE1hcCA9IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZE5hbWVzLmxlbmd0aDsgKytpKVxyXG4gICAgICAgIGZpZWxkTWFwW2ZpZWxkTmFtZXNbaV1dID0gMTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8dW5kZWZpbmVkfSBTZXQgZmllbGQgbmFtZSwgaWYgYW55XHJcbiAgICAgKiBAdGhpcyBPYmplY3RcclxuICAgICAqIEBpZ25vcmVcclxuICAgICAqL1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtcmV0dXJuXHJcbiAgICAgICAgZm9yICh2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMpLCBpID0ga2V5cy5sZW5ndGggLSAxOyBpID4gLTE7IC0taSlcclxuICAgICAgICAgICAgaWYgKGZpZWxkTWFwW2tleXNbaV1dID09PSAxICYmIHRoaXNba2V5c1tpXV0gIT09IHVuZGVmaW5lZCAmJiB0aGlzW2tleXNbaV1dICE9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleXNbaV07XHJcbiAgICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEEgT25lT2Ygc2V0dGVyIGFzIHJldHVybmVkIGJ5IHtAbGluayB1dGlsLm9uZU9mU2V0dGVyfS5cclxuICogQHR5cGVkZWYgT25lT2ZTZXR0ZXJcclxuICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHZhbHVlIEZpZWxkIG5hbWVcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICovXHJcblxyXG4vKipcclxuICogQnVpbGRzIGEgc2V0dGVyIGZvciBhIG9uZW9mJ3MgcHJlc2VudCBmaWVsZCBuYW1lLlxyXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBmaWVsZE5hbWVzIEZpZWxkIG5hbWVzXHJcbiAqIEByZXR1cm5zIHtPbmVPZlNldHRlcn0gVW5ib3VuZCBzZXR0ZXJcclxuICovXHJcbnV0aWwub25lT2ZTZXR0ZXIgPSBmdW5jdGlvbiBzZXRPbmVPZihmaWVsZE5hbWVzKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBGaWVsZCBuYW1lXHJcbiAgICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gICAgICogQHRoaXMgT2JqZWN0XHJcbiAgICAgKiBAaWdub3JlXHJcbiAgICAgKi9cclxuICAgIHJldHVybiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZE5hbWVzLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICBpZiAoZmllbGROYW1lc1tpXSAhPT0gbmFtZSlcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzW2ZpZWxkTmFtZXNbaV1dO1xyXG4gICAgfTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0IGNvbnZlcnNpb24gb3B0aW9ucyB1c2VkIGZvciB7QGxpbmsgTWVzc2FnZSN0b0pTT059IGltcGxlbWVudGF0aW9ucy5cclxuICpcclxuICogVGhlc2Ugb3B0aW9ucyBhcmUgY2xvc2UgdG8gcHJvdG8zJ3MgSlNPTiBtYXBwaW5nIHdpdGggdGhlIGV4Y2VwdGlvbiB0aGF0IGludGVybmFsIHR5cGVzIGxpa2UgQW55IGFyZSBoYW5kbGVkIGp1c3QgbGlrZSBtZXNzYWdlcy4gTW9yZSBwcmVjaXNlbHk6XHJcbiAqXHJcbiAqIC0gTG9uZ3MgYmVjb21lIHN0cmluZ3NcclxuICogLSBFbnVtcyBiZWNvbWUgc3RyaW5nIGtleXNcclxuICogLSBCeXRlcyBiZWNvbWUgYmFzZTY0IGVuY29kZWQgc3RyaW5nc1xyXG4gKiAtIChTdWItKU1lc3NhZ2VzIGJlY29tZSBwbGFpbiBvYmplY3RzXHJcbiAqIC0gTWFwcyBiZWNvbWUgcGxhaW4gb2JqZWN0cyB3aXRoIGFsbCBzdHJpbmcga2V5c1xyXG4gKiAtIFJlcGVhdGVkIGZpZWxkcyBiZWNvbWUgYXJyYXlzXHJcbiAqIC0gTmFOIGFuZCBJbmZpbml0eSBmb3IgZmxvYXQgYW5kIGRvdWJsZSBmaWVsZHMgYmVjb21lIHN0cmluZ3NcclxuICpcclxuICogQHR5cGUge0lDb252ZXJzaW9uT3B0aW9uc31cclxuICogQHNlZSBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9wcm90b2NvbC1idWZmZXJzL2RvY3MvcHJvdG8zP2hsPWVuI2pzb25cclxuICovXHJcbnV0aWwudG9KU09OT3B0aW9ucyA9IHtcclxuICAgIGxvbmdzOiBTdHJpbmcsXHJcbiAgICBlbnVtczogU3RyaW5nLFxyXG4gICAgYnl0ZXM6IFN0cmluZyxcclxuICAgIGpzb246IHRydWVcclxufTtcclxuXHJcbnV0aWwuX2NvbmZpZ3VyZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIEJ1ZmZlciA9IHV0aWwuQnVmZmVyO1xyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXHJcbiAgICBpZiAoIUJ1ZmZlcikge1xyXG4gICAgICAgIHV0aWwuX0J1ZmZlcl9mcm9tID0gdXRpbC5fQnVmZmVyX2FsbG9jVW5zYWZlID0gbnVsbDtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAvLyBiZWNhdXNlIG5vZGUgNC54IGJ1ZmZlcnMgYXJlIGluY29tcGF0aWJsZSAmIGltbXV0YWJsZVxyXG4gICAgLy8gc2VlOiBodHRwczovL2dpdGh1Yi5jb20vZGNvZGVJTy9wcm90b2J1Zi5qcy9wdWxsLzY2NVxyXG4gICAgdXRpbC5fQnVmZmVyX2Zyb20gPSBCdWZmZXIuZnJvbSAhPT0gVWludDhBcnJheS5mcm9tICYmIEJ1ZmZlci5mcm9tIHx8XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBmdW5jdGlvbiBCdWZmZXJfZnJvbSh2YWx1ZSwgZW5jb2RpbmcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXIodmFsdWUsIGVuY29kaW5nKTtcclxuICAgICAgICB9O1xyXG4gICAgdXRpbC5fQnVmZmVyX2FsbG9jVW5zYWZlID0gQnVmZmVyLmFsbG9jVW5zYWZlIHx8XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBmdW5jdGlvbiBCdWZmZXJfYWxsb2NVbnNhZmUoc2l6ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJ1ZmZlcihzaXplKTtcclxuICAgICAgICB9O1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxubW9kdWxlLmV4cG9ydHMgPSBXcml0ZXI7XHJcblxyXG52YXIgdXRpbCAgICAgID0gcmVxdWlyZShcIi4vdXRpbC9taW5pbWFsXCIpO1xyXG5cclxudmFyIEJ1ZmZlcldyaXRlcjsgLy8gY3ljbGljXHJcblxyXG52YXIgTG9uZ0JpdHMgID0gdXRpbC5Mb25nQml0cyxcclxuICAgIGJhc2U2NCAgICA9IHV0aWwuYmFzZTY0LFxyXG4gICAgdXRmOCAgICAgID0gdXRpbC51dGY4O1xyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgd3JpdGVyIG9wZXJhdGlvbiBpbnN0YW5jZS5cclxuICogQGNsYXNzZGVzYyBTY2hlZHVsZWQgd3JpdGVyIG9wZXJhdGlvbi5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKiwgVWludDhBcnJheSwgbnVtYmVyKX0gZm4gRnVuY3Rpb24gdG8gY2FsbFxyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuIFZhbHVlIGJ5dGUgbGVuZ3RoXHJcbiAqIEBwYXJhbSB7Kn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmZ1bmN0aW9uIE9wKGZuLCBsZW4sIHZhbCkge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRnVuY3Rpb24gdG8gY2FsbC5cclxuICAgICAqIEB0eXBlIHtmdW5jdGlvbihVaW50OEFycmF5LCBudW1iZXIsICopfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmZuID0gZm47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBWYWx1ZSBieXRlIGxlbmd0aC5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubGVuID0gbGVuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTmV4dCBvcGVyYXRpb24uXHJcbiAgICAgKiBAdHlwZSB7V3JpdGVyLk9wfHVuZGVmaW5lZH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5uZXh0ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmFsdWUgdG8gd3JpdGUuXHJcbiAgICAgKiBAdHlwZSB7Kn1cclxuICAgICAqL1xyXG4gICAgdGhpcy52YWwgPSB2YWw7IC8vIHR5cGUgdmFyaWVzXHJcbn1cclxuXHJcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbmZ1bmN0aW9uIG5vb3AoKSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWVtcHR5LWZ1bmN0aW9uXHJcblxyXG4vKipcclxuICogQ29uc3RydWN0cyBhIG5ldyB3cml0ZXIgc3RhdGUgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgQ29waWVkIHdyaXRlciBzdGF0ZS5cclxuICogQG1lbWJlcm9mIFdyaXRlclxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtXcml0ZXJ9IHdyaXRlciBXcml0ZXIgdG8gY29weSBzdGF0ZSBmcm9tXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmZ1bmN0aW9uIFN0YXRlKHdyaXRlcikge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3VycmVudCBoZWFkLlxyXG4gICAgICogQHR5cGUge1dyaXRlci5PcH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5oZWFkID0gd3JpdGVyLmhlYWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDdXJyZW50IHRhaWwuXHJcbiAgICAgKiBAdHlwZSB7V3JpdGVyLk9wfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnRhaWwgPSB3cml0ZXIudGFpbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEN1cnJlbnQgYnVmZmVyIGxlbmd0aC5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubGVuID0gd3JpdGVyLmxlbjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE5leHQgc3RhdGUuXHJcbiAgICAgKiBAdHlwZSB7U3RhdGV8bnVsbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5uZXh0ID0gd3JpdGVyLnN0YXRlcztcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgd3JpdGVyIGluc3RhbmNlLlxyXG4gKiBAY2xhc3NkZXNjIFdpcmUgZm9ybWF0IHdyaXRlciB1c2luZyBgVWludDhBcnJheWAgaWYgYXZhaWxhYmxlLCBvdGhlcndpc2UgYEFycmF5YC5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBXcml0ZXIoKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDdXJyZW50IGxlbmd0aC5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHRoaXMubGVuID0gMDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9wZXJhdGlvbnMgaGVhZC5cclxuICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuaGVhZCA9IG5ldyBPcChub29wLCAwLCAwKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9wZXJhdGlvbnMgdGFpbFxyXG4gICAgICogQHR5cGUge09iamVjdH1cclxuICAgICAqL1xyXG4gICAgdGhpcy50YWlsID0gdGhpcy5oZWFkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGlua2VkIGZvcmtlZCBzdGF0ZXMuXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fG51bGx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuc3RhdGVzID0gbnVsbDtcclxuXHJcbiAgICAvLyBXaGVuIGEgdmFsdWUgaXMgd3JpdHRlbiwgdGhlIHdyaXRlciBjYWxjdWxhdGVzIGl0cyBieXRlIGxlbmd0aCBhbmQgcHV0cyBpdCBpbnRvIGEgbGlua2VkXHJcbiAgICAvLyBsaXN0IG9mIG9wZXJhdGlvbnMgdG8gcGVyZm9ybSB3aGVuIGZpbmlzaCgpIGlzIGNhbGxlZC4gVGhpcyBib3RoIGFsbG93cyB1cyB0byBhbGxvY2F0ZVxyXG4gICAgLy8gYnVmZmVycyBvZiB0aGUgZXhhY3QgcmVxdWlyZWQgc2l6ZSBhbmQgcmVkdWNlcyB0aGUgYW1vdW50IG9mIHdvcmsgd2UgaGF2ZSB0byBkbyBjb21wYXJlZFxyXG4gICAgLy8gdG8gZmlyc3QgY2FsY3VsYXRpbmcgb3ZlciBvYmplY3RzIGFuZCB0aGVuIGVuY29kaW5nIG92ZXIgb2JqZWN0cy4gSW4gb3VyIGNhc2UsIHRoZSBlbmNvZGluZ1xyXG4gICAgLy8gcGFydCBpcyBqdXN0IGEgbGlua2VkIGxpc3Qgd2FsayBjYWxsaW5nIG9wZXJhdGlvbnMgd2l0aCBhbHJlYWR5IHByZXBhcmVkIHZhbHVlcy5cclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgd3JpdGVyLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHJldHVybnMge0J1ZmZlcldyaXRlcnxXcml0ZXJ9IEEge0BsaW5rIEJ1ZmZlcldyaXRlcn0gd2hlbiBCdWZmZXJzIGFyZSBzdXBwb3J0ZWQsIG90aGVyd2lzZSBhIHtAbGluayBXcml0ZXJ9XHJcbiAqL1xyXG5Xcml0ZXIuY3JlYXRlID0gdXRpbC5CdWZmZXJcclxuICAgID8gZnVuY3Rpb24gY3JlYXRlX2J1ZmZlcl9zZXR1cCgpIHtcclxuICAgICAgICByZXR1cm4gKFdyaXRlci5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGVfYnVmZmVyKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJ1ZmZlcldyaXRlcigpO1xyXG4gICAgICAgIH0pKCk7XHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgOiBmdW5jdGlvbiBjcmVhdGVfYXJyYXkoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXcml0ZXIoKTtcclxuICAgIH07XHJcblxyXG4vKipcclxuICogQWxsb2NhdGVzIGEgYnVmZmVyIG9mIHRoZSBzcGVjaWZpZWQgc2l6ZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IHNpemUgQnVmZmVyIHNpemVcclxuICogQHJldHVybnMge1VpbnQ4QXJyYXl9IEJ1ZmZlclxyXG4gKi9cclxuV3JpdGVyLmFsbG9jID0gZnVuY3Rpb24gYWxsb2Moc2l6ZSkge1xyXG4gICAgcmV0dXJuIG5ldyB1dGlsLkFycmF5KHNpemUpO1xyXG59O1xyXG5cclxuLy8gVXNlIFVpbnQ4QXJyYXkgYnVmZmVyIHBvb2wgaW4gdGhlIGJyb3dzZXIsIGp1c3QgbGlrZSBub2RlIGRvZXMgd2l0aCBidWZmZXJzXHJcbi8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXHJcbmlmICh1dGlsLkFycmF5ICE9PSBBcnJheSlcclxuICAgIFdyaXRlci5hbGxvYyA9IHV0aWwucG9vbChXcml0ZXIuYWxsb2MsIHV0aWwuQXJyYXkucHJvdG90eXBlLnN1YmFycmF5KTtcclxuXHJcbi8qKlxyXG4gKiBQdXNoZXMgYSBuZXcgb3BlcmF0aW9uIHRvIHRoZSBxdWV1ZS5cclxuICogQHBhcmFtIHtmdW5jdGlvbihVaW50OEFycmF5LCBudW1iZXIsICopfSBmbiBGdW5jdGlvbiB0byBjYWxsXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW4gVmFsdWUgYnl0ZSBsZW5ndGhcclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbCBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICogQHByaXZhdGVcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuX3B1c2ggPSBmdW5jdGlvbiBwdXNoKGZuLCBsZW4sIHZhbCkge1xyXG4gICAgdGhpcy50YWlsID0gdGhpcy50YWlsLm5leHQgPSBuZXcgT3AoZm4sIGxlbiwgdmFsKTtcclxuICAgIHRoaXMubGVuICs9IGxlbjtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGVCeXRlKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIGJ1Zltwb3NdID0gdmFsICYgMjU1O1xyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZVZhcmludDMyKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIHdoaWxlICh2YWwgPiAxMjcpIHtcclxuICAgICAgICBidWZbcG9zKytdID0gdmFsICYgMTI3IHwgMTI4O1xyXG4gICAgICAgIHZhbCA+Pj49IDc7XHJcbiAgICB9XHJcbiAgICBidWZbcG9zXSA9IHZhbDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbnN0cnVjdHMgYSBuZXcgdmFyaW50IHdyaXRlciBvcGVyYXRpb24gaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgU2NoZWR1bGVkIHZhcmludCB3cml0ZXIgb3BlcmF0aW9uLlxyXG4gKiBAZXh0ZW5kcyBPcFxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtudW1iZXJ9IGxlbiBWYWx1ZSBieXRlIGxlbmd0aFxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmZ1bmN0aW9uIFZhcmludE9wKGxlbiwgdmFsKSB7XHJcbiAgICB0aGlzLmxlbiA9IGxlbjtcclxuICAgIHRoaXMubmV4dCA9IHVuZGVmaW5lZDtcclxuICAgIHRoaXMudmFsID0gdmFsO1xyXG59XHJcblxyXG5WYXJpbnRPcC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE9wLnByb3RvdHlwZSk7XHJcblZhcmludE9wLnByb3RvdHlwZS5mbiA9IHdyaXRlVmFyaW50MzI7XHJcblxyXG4vKipcclxuICogV3JpdGVzIGFuIHVuc2lnbmVkIDMyIGJpdCB2YWx1ZSBhcyBhIHZhcmludC5cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS51aW50MzIgPSBmdW5jdGlvbiB3cml0ZV91aW50MzIodmFsdWUpIHtcclxuICAgIC8vIGhlcmUsIHRoZSBjYWxsIHRvIHRoaXMucHVzaCBoYXMgYmVlbiBpbmxpbmVkIGFuZCBhIHZhcmludCBzcGVjaWZpYyBPcCBzdWJjbGFzcyBpcyB1c2VkLlxyXG4gICAgLy8gdWludDMyIGlzIGJ5IGZhciB0aGUgbW9zdCBmcmVxdWVudGx5IHVzZWQgb3BlcmF0aW9uIGFuZCBiZW5lZml0cyBzaWduaWZpY2FudGx5IGZyb20gdGhpcy5cclxuICAgIHRoaXMubGVuICs9ICh0aGlzLnRhaWwgPSB0aGlzLnRhaWwubmV4dCA9IG5ldyBWYXJpbnRPcChcclxuICAgICAgICAodmFsdWUgPSB2YWx1ZSA+Pj4gMClcclxuICAgICAgICAgICAgICAgIDwgMTI4ICAgICAgID8gMVxyXG4gICAgICAgIDogdmFsdWUgPCAxNjM4NCAgICAgPyAyXHJcbiAgICAgICAgOiB2YWx1ZSA8IDIwOTcxNTIgICA/IDNcclxuICAgICAgICA6IHZhbHVlIDwgMjY4NDM1NDU2ID8gNFxyXG4gICAgICAgIDogICAgICAgICAgICAgICAgICAgICA1LFxyXG4gICAgdmFsdWUpKS5sZW47XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzaWduZWQgMzIgYml0IHZhbHVlIGFzIGEgdmFyaW50LlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5pbnQzMiA9IGZ1bmN0aW9uIHdyaXRlX2ludDMyKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgPCAwXHJcbiAgICAgICAgPyB0aGlzLl9wdXNoKHdyaXRlVmFyaW50NjQsIDEwLCBMb25nQml0cy5mcm9tTnVtYmVyKHZhbHVlKSkgLy8gMTAgYnl0ZXMgcGVyIHNwZWNcclxuICAgICAgICA6IHRoaXMudWludDMyKHZhbHVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSAzMiBiaXQgdmFsdWUgYXMgYSB2YXJpbnQsIHppZy16YWcgZW5jb2RlZC5cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5zaW50MzIgPSBmdW5jdGlvbiB3cml0ZV9zaW50MzIodmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLnVpbnQzMigodmFsdWUgPDwgMSBeIHZhbHVlID4+IDMxKSA+Pj4gMCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiB3cml0ZVZhcmludDY0KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIHdoaWxlICh2YWwuaGkpIHtcclxuICAgICAgICBidWZbcG9zKytdID0gdmFsLmxvICYgMTI3IHwgMTI4O1xyXG4gICAgICAgIHZhbC5sbyA9ICh2YWwubG8gPj4+IDcgfCB2YWwuaGkgPDwgMjUpID4+PiAwO1xyXG4gICAgICAgIHZhbC5oaSA+Pj49IDc7XHJcbiAgICB9XHJcbiAgICB3aGlsZSAodmFsLmxvID4gMTI3KSB7XHJcbiAgICAgICAgYnVmW3BvcysrXSA9IHZhbC5sbyAmIDEyNyB8IDEyODtcclxuICAgICAgICB2YWwubG8gPSB2YWwubG8gPj4+IDc7XHJcbiAgICB9XHJcbiAgICBidWZbcG9zKytdID0gdmFsLmxvO1xyXG59XHJcblxyXG4vKipcclxuICogV3JpdGVzIGFuIHVuc2lnbmVkIDY0IGJpdCB2YWx1ZSBhcyBhIHZhcmludC5cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGB2YWx1ZWAgaXMgYSBzdHJpbmcgYW5kIG5vIGxvbmcgbGlicmFyeSBpcyBwcmVzZW50LlxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS51aW50NjQgPSBmdW5jdGlvbiB3cml0ZV91aW50NjQodmFsdWUpIHtcclxuICAgIHZhciBiaXRzID0gTG9uZ0JpdHMuZnJvbSh2YWx1ZSk7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZVZhcmludDY0LCBiaXRzLmxlbmd0aCgpLCBiaXRzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzaWduZWQgNjQgYml0IHZhbHVlIGFzIGEgdmFyaW50LlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGB2YWx1ZWAgaXMgYSBzdHJpbmcgYW5kIG5vIGxvbmcgbGlicmFyeSBpcyBwcmVzZW50LlxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5pbnQ2NCA9IFdyaXRlci5wcm90b3R5cGUudWludDY0O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHNpZ25lZCA2NCBiaXQgdmFsdWUgYXMgYSB2YXJpbnQsIHppZy16YWcgZW5jb2RlZC5cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGB2YWx1ZWAgaXMgYSBzdHJpbmcgYW5kIG5vIGxvbmcgbGlicmFyeSBpcyBwcmVzZW50LlxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5zaW50NjQgPSBmdW5jdGlvbiB3cml0ZV9zaW50NjQodmFsdWUpIHtcclxuICAgIHZhciBiaXRzID0gTG9uZ0JpdHMuZnJvbSh2YWx1ZSkuenpFbmNvZGUoKTtcclxuICAgIHJldHVybiB0aGlzLl9wdXNoKHdyaXRlVmFyaW50NjQsIGJpdHMubGVuZ3RoKCksIGJpdHMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIGJvb2xpc2ggdmFsdWUgYXMgYSB2YXJpbnQuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmJvb2wgPSBmdW5jdGlvbiB3cml0ZV9ib29sKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZUJ5dGUsIDEsIHZhbHVlID8gMSA6IDApO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGVGaXhlZDMyKHZhbCwgYnVmLCBwb3MpIHtcclxuICAgIGJ1Zltwb3MgICAgXSA9ICB2YWwgICAgICAgICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAxXSA9ICB2YWwgPj4+IDggICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAyXSA9ICB2YWwgPj4+IDE2ICAmIDI1NTtcclxuICAgIGJ1Zltwb3MgKyAzXSA9ICB2YWwgPj4+IDI0O1xyXG59XHJcblxyXG4vKipcclxuICogV3JpdGVzIGFuIHVuc2lnbmVkIDMyIGJpdCB2YWx1ZSBhcyBmaXhlZCAzMiBiaXRzLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmZpeGVkMzIgPSBmdW5jdGlvbiB3cml0ZV9maXhlZDMyKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZUZpeGVkMzIsIDQsIHZhbHVlID4+PiAwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzaWduZWQgMzIgYml0IHZhbHVlIGFzIGZpeGVkIDMyIGJpdHMuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLnNmaXhlZDMyID0gV3JpdGVyLnByb3RvdHlwZS5maXhlZDMyO1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhbiB1bnNpZ25lZCA2NCBiaXQgdmFsdWUgYXMgZml4ZWQgNjQgYml0cy5cclxuICogQHBhcmFtIHtMb25nfG51bWJlcnxzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKiBAdGhyb3dzIHtUeXBlRXJyb3J9IElmIGB2YWx1ZWAgaXMgYSBzdHJpbmcgYW5kIG5vIGxvbmcgbGlicmFyeSBpcyBwcmVzZW50LlxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5maXhlZDY0ID0gZnVuY3Rpb24gd3JpdGVfZml4ZWQ2NCh2YWx1ZSkge1xyXG4gICAgdmFyIGJpdHMgPSBMb25nQml0cy5mcm9tKHZhbHVlKTtcclxuICAgIHJldHVybiB0aGlzLl9wdXNoKHdyaXRlRml4ZWQzMiwgNCwgYml0cy5sbykuX3B1c2god3JpdGVGaXhlZDMyLCA0LCBiaXRzLmhpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgYSBzaWduZWQgNjQgYml0IHZhbHVlIGFzIGZpeGVkIDY0IGJpdHMuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge0xvbmd8bnVtYmVyfHN0cmluZ30gdmFsdWUgVmFsdWUgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqIEB0aHJvd3Mge1R5cGVFcnJvcn0gSWYgYHZhbHVlYCBpcyBhIHN0cmluZyBhbmQgbm8gbG9uZyBsaWJyYXJ5IGlzIHByZXNlbnQuXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLnNmaXhlZDY0ID0gV3JpdGVyLnByb3RvdHlwZS5maXhlZDY0O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIGZsb2F0ICgzMiBiaXQpLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5mbG9hdCA9IGZ1bmN0aW9uIHdyaXRlX2Zsb2F0KHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh1dGlsLmZsb2F0LndyaXRlRmxvYXRMRSwgNCwgdmFsdWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIGRvdWJsZSAoNjQgYml0IGZsb2F0KS5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSBWYWx1ZSB0byB3cml0ZVxyXG4gKiBAcmV0dXJucyB7V3JpdGVyfSBgdGhpc2BcclxuICovXHJcbldyaXRlci5wcm90b3R5cGUuZG91YmxlID0gZnVuY3Rpb24gd3JpdGVfZG91YmxlKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcHVzaCh1dGlsLmZsb2F0LndyaXRlRG91YmxlTEUsIDgsIHZhbHVlKTtcclxufTtcclxuXHJcbnZhciB3cml0ZUJ5dGVzID0gdXRpbC5BcnJheS5wcm90b3R5cGUuc2V0XHJcbiAgICA/IGZ1bmN0aW9uIHdyaXRlQnl0ZXNfc2V0KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICBidWYuc2V0KHZhbCwgcG9zKTsgLy8gYWxzbyB3b3JrcyBmb3IgcGxhaW4gYXJyYXkgdmFsdWVzXHJcbiAgICB9XHJcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgOiBmdW5jdGlvbiB3cml0ZUJ5dGVzX2Zvcih2YWwsIGJ1ZiwgcG9zKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIGJ1Zltwb3MgKyBpXSA9IHZhbFtpXTtcclxuICAgIH07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgc2VxdWVuY2Ugb2YgYnl0ZXMuXHJcbiAqIEBwYXJhbSB7VWludDhBcnJheXxzdHJpbmd9IHZhbHVlIEJ1ZmZlciBvciBiYXNlNjQgZW5jb2RlZCBzdHJpbmcgdG8gd3JpdGVcclxuICogQHJldHVybnMge1dyaXRlcn0gYHRoaXNgXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmJ5dGVzID0gZnVuY3Rpb24gd3JpdGVfYnl0ZXModmFsdWUpIHtcclxuICAgIHZhciBsZW4gPSB2YWx1ZS5sZW5ndGggPj4+IDA7XHJcbiAgICBpZiAoIWxlbilcclxuICAgICAgICByZXR1cm4gdGhpcy5fcHVzaCh3cml0ZUJ5dGUsIDEsIDApO1xyXG4gICAgaWYgKHV0aWwuaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgdmFyIGJ1ZiA9IFdyaXRlci5hbGxvYyhsZW4gPSBiYXNlNjQubGVuZ3RoKHZhbHVlKSk7XHJcbiAgICAgICAgYmFzZTY0LmRlY29kZSh2YWx1ZSwgYnVmLCAwKTtcclxuICAgICAgICB2YWx1ZSA9IGJ1ZjtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnVpbnQzMihsZW4pLl9wdXNoKHdyaXRlQnl0ZXMsIGxlbiwgdmFsdWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBhIHN0cmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFZhbHVlIHRvIHdyaXRlXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5zdHJpbmcgPSBmdW5jdGlvbiB3cml0ZV9zdHJpbmcodmFsdWUpIHtcclxuICAgIHZhciBsZW4gPSB1dGY4Lmxlbmd0aCh2YWx1ZSk7XHJcbiAgICByZXR1cm4gbGVuXHJcbiAgICAgICAgPyB0aGlzLnVpbnQzMihsZW4pLl9wdXNoKHV0Zjgud3JpdGUsIGxlbiwgdmFsdWUpXHJcbiAgICAgICAgOiB0aGlzLl9wdXNoKHdyaXRlQnl0ZSwgMSwgMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogRm9ya3MgdGhpcyB3cml0ZXIncyBzdGF0ZSBieSBwdXNoaW5nIGl0IHRvIGEgc3RhY2suXHJcbiAqIENhbGxpbmcge0BsaW5rIFdyaXRlciNyZXNldHxyZXNldH0gb3Ige0BsaW5rIFdyaXRlciNsZGVsaW18bGRlbGltfSByZXNldHMgdGhlIHdyaXRlciB0byB0aGUgcHJldmlvdXMgc3RhdGUuXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5mb3JrID0gZnVuY3Rpb24gZm9yaygpIHtcclxuICAgIHRoaXMuc3RhdGVzID0gbmV3IFN0YXRlKHRoaXMpO1xyXG4gICAgdGhpcy5oZWFkID0gdGhpcy50YWlsID0gbmV3IE9wKG5vb3AsIDAsIDApO1xyXG4gICAgdGhpcy5sZW4gPSAwO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXRzIHRoaXMgaW5zdGFuY2UgdG8gdGhlIGxhc3Qgc3RhdGUuXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIHJlc2V0KCkge1xyXG4gICAgaWYgKHRoaXMuc3RhdGVzKSB7XHJcbiAgICAgICAgdGhpcy5oZWFkICAgPSB0aGlzLnN0YXRlcy5oZWFkO1xyXG4gICAgICAgIHRoaXMudGFpbCAgID0gdGhpcy5zdGF0ZXMudGFpbDtcclxuICAgICAgICB0aGlzLmxlbiAgICA9IHRoaXMuc3RhdGVzLmxlbjtcclxuICAgICAgICB0aGlzLnN0YXRlcyA9IHRoaXMuc3RhdGVzLm5leHQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGVhZCA9IHRoaXMudGFpbCA9IG5ldyBPcChub29wLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmxlbiAgPSAwO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXRzIHRvIHRoZSBsYXN0IHN0YXRlIGFuZCBhcHBlbmRzIHRoZSBmb3JrIHN0YXRlJ3MgY3VycmVudCB3cml0ZSBsZW5ndGggYXMgYSB2YXJpbnQgZm9sbG93ZWQgYnkgaXRzIG9wZXJhdGlvbnMuXHJcbiAqIEByZXR1cm5zIHtXcml0ZXJ9IGB0aGlzYFxyXG4gKi9cclxuV3JpdGVyLnByb3RvdHlwZS5sZGVsaW0gPSBmdW5jdGlvbiBsZGVsaW0oKSB7XHJcbiAgICB2YXIgaGVhZCA9IHRoaXMuaGVhZCxcclxuICAgICAgICB0YWlsID0gdGhpcy50YWlsLFxyXG4gICAgICAgIGxlbiAgPSB0aGlzLmxlbjtcclxuICAgIHRoaXMucmVzZXQoKS51aW50MzIobGVuKTtcclxuICAgIGlmIChsZW4pIHtcclxuICAgICAgICB0aGlzLnRhaWwubmV4dCA9IGhlYWQubmV4dDsgLy8gc2tpcCBub29wXHJcbiAgICAgICAgdGhpcy50YWlsID0gdGFpbDtcclxuICAgICAgICB0aGlzLmxlbiArPSBsZW47XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGaW5pc2hlcyB0aGUgd3JpdGUgb3BlcmF0aW9uLlxyXG4gKiBAcmV0dXJucyB7VWludDhBcnJheX0gRmluaXNoZWQgYnVmZmVyXHJcbiAqL1xyXG5Xcml0ZXIucHJvdG90eXBlLmZpbmlzaCA9IGZ1bmN0aW9uIGZpbmlzaCgpIHtcclxuICAgIHZhciBoZWFkID0gdGhpcy5oZWFkLm5leHQsIC8vIHNraXAgbm9vcFxyXG4gICAgICAgIGJ1ZiAgPSB0aGlzLmNvbnN0cnVjdG9yLmFsbG9jKHRoaXMubGVuKSxcclxuICAgICAgICBwb3MgID0gMDtcclxuICAgIHdoaWxlIChoZWFkKSB7XHJcbiAgICAgICAgaGVhZC5mbihoZWFkLnZhbCwgYnVmLCBwb3MpO1xyXG4gICAgICAgIHBvcyArPSBoZWFkLmxlbjtcclxuICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xyXG4gICAgfVxyXG4gICAgLy8gdGhpcy5oZWFkID0gdGhpcy50YWlsID0gbnVsbDtcclxuICAgIHJldHVybiBidWY7XHJcbn07XHJcblxyXG5Xcml0ZXIuX2NvbmZpZ3VyZSA9IGZ1bmN0aW9uKEJ1ZmZlcldyaXRlcl8pIHtcclxuICAgIEJ1ZmZlcldyaXRlciA9IEJ1ZmZlcldyaXRlcl87XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1ZmZlcldyaXRlcjtcclxuXHJcbi8vIGV4dGVuZHMgV3JpdGVyXHJcbnZhciBXcml0ZXIgPSByZXF1aXJlKFwiLi93cml0ZXJcIik7XHJcbihCdWZmZXJXcml0ZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShXcml0ZXIucHJvdG90eXBlKSkuY29uc3RydWN0b3IgPSBCdWZmZXJXcml0ZXI7XHJcblxyXG52YXIgdXRpbCA9IHJlcXVpcmUoXCIuL3V0aWwvbWluaW1hbFwiKTtcclxuXHJcbnZhciBCdWZmZXIgPSB1dGlsLkJ1ZmZlcjtcclxuXHJcbi8qKlxyXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IGJ1ZmZlciB3cml0ZXIgaW5zdGFuY2UuXHJcbiAqIEBjbGFzc2Rlc2MgV2lyZSBmb3JtYXQgd3JpdGVyIHVzaW5nIG5vZGUgYnVmZmVycy5cclxuICogQGV4dGVuZHMgV3JpdGVyXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gQnVmZmVyV3JpdGVyKCkge1xyXG4gICAgV3JpdGVyLmNhbGwodGhpcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBbGxvY2F0ZXMgYSBidWZmZXIgb2YgdGhlIHNwZWNpZmllZCBzaXplLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gc2l6ZSBCdWZmZXIgc2l6ZVxyXG4gKiBAcmV0dXJucyB7QnVmZmVyfSBCdWZmZXJcclxuICovXHJcbkJ1ZmZlcldyaXRlci5hbGxvYyA9IGZ1bmN0aW9uIGFsbG9jX2J1ZmZlcihzaXplKSB7XHJcbiAgICByZXR1cm4gKEJ1ZmZlcldyaXRlci5hbGxvYyA9IHV0aWwuX0J1ZmZlcl9hbGxvY1Vuc2FmZSkoc2l6ZSk7XHJcbn07XHJcblxyXG52YXIgd3JpdGVCeXRlc0J1ZmZlciA9IEJ1ZmZlciAmJiBCdWZmZXIucHJvdG90eXBlIGluc3RhbmNlb2YgVWludDhBcnJheSAmJiBCdWZmZXIucHJvdG90eXBlLnNldC5uYW1lID09PSBcInNldFwiXHJcbiAgICA/IGZ1bmN0aW9uIHdyaXRlQnl0ZXNCdWZmZXJfc2V0KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICBidWYuc2V0KHZhbCwgcG9zKTsgLy8gZmFzdGVyIHRoYW4gY29weSAocmVxdWlyZXMgbm9kZSA+PSA0IHdoZXJlIEJ1ZmZlcnMgZXh0ZW5kIFVpbnQ4QXJyYXkgYW5kIHNldCBpcyBwcm9wZXJseSBpbmhlcml0ZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsc28gd29ya3MgZm9yIHBsYWluIGFycmF5IHZhbHVlc1xyXG4gICAgfVxyXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgIDogZnVuY3Rpb24gd3JpdGVCeXRlc0J1ZmZlcl9jb3B5KHZhbCwgYnVmLCBwb3MpIHtcclxuICAgICAgICBpZiAodmFsLmNvcHkpIC8vIEJ1ZmZlciB2YWx1ZXNcclxuICAgICAgICAgICAgdmFsLmNvcHkoYnVmLCBwb3MsIDAsIHZhbC5sZW5ndGgpO1xyXG4gICAgICAgIGVsc2UgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOykgLy8gcGxhaW4gYXJyYXkgdmFsdWVzXHJcbiAgICAgICAgICAgIGJ1Zltwb3MrK10gPSB2YWxbaSsrXTtcclxuICAgIH07XHJcblxyXG4vKipcclxuICogQG92ZXJyaWRlXHJcbiAqL1xyXG5CdWZmZXJXcml0ZXIucHJvdG90eXBlLmJ5dGVzID0gZnVuY3Rpb24gd3JpdGVfYnl0ZXNfYnVmZmVyKHZhbHVlKSB7XHJcbiAgICBpZiAodXRpbC5pc1N0cmluZyh2YWx1ZSkpXHJcbiAgICAgICAgdmFsdWUgPSB1dGlsLl9CdWZmZXJfZnJvbSh2YWx1ZSwgXCJiYXNlNjRcIik7XHJcbiAgICB2YXIgbGVuID0gdmFsdWUubGVuZ3RoID4+PiAwO1xyXG4gICAgdGhpcy51aW50MzIobGVuKTtcclxuICAgIGlmIChsZW4pXHJcbiAgICAgICAgdGhpcy5fcHVzaCh3cml0ZUJ5dGVzQnVmZmVyLCBsZW4sIHZhbHVlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGVTdHJpbmdCdWZmZXIodmFsLCBidWYsIHBvcykge1xyXG4gICAgaWYgKHZhbC5sZW5ndGggPCA0MCkgLy8gcGxhaW4ganMgaXMgZmFzdGVyIGZvciBzaG9ydCBzdHJpbmdzIChwcm9iYWJseSBkdWUgdG8gcmVkdW5kYW50IGFzc2VydGlvbnMpXHJcbiAgICAgICAgdXRpbC51dGY4LndyaXRlKHZhbCwgYnVmLCBwb3MpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGJ1Zi51dGY4V3JpdGUodmFsLCBwb3MpO1xyXG59XHJcblxyXG4vKipcclxuICogQG92ZXJyaWRlXHJcbiAqL1xyXG5CdWZmZXJXcml0ZXIucHJvdG90eXBlLnN0cmluZyA9IGZ1bmN0aW9uIHdyaXRlX3N0cmluZ19idWZmZXIodmFsdWUpIHtcclxuICAgIHZhciBsZW4gPSBCdWZmZXIuYnl0ZUxlbmd0aCh2YWx1ZSk7XHJcbiAgICB0aGlzLnVpbnQzMihsZW4pO1xyXG4gICAgaWYgKGxlbilcclxuICAgICAgICB0aGlzLl9wdXNoKHdyaXRlU3RyaW5nQnVmZmVyLCBsZW4sIHZhbHVlKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGaW5pc2hlcyB0aGUgd3JpdGUgb3BlcmF0aW9uLlxyXG4gKiBAbmFtZSBCdWZmZXJXcml0ZXIjZmluaXNoXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcmV0dXJucyB7QnVmZmVyfSBGaW5pc2hlZCBidWZmZXJcclxuICovXHJcbiIsImltcG9ydCB7IGxpc3QgfSBmcm9tIFwiLi4vc3JjZGVwcy9wcm90by1nZW4tdHMvYWxscHJvdG9cIlxuaW1wb3J0IHsgTXlMaXN0cyB9IGZyb20gXCIuL015TGlzdHNcIlxuaW1wb3J0IHsgTm93IH0gZnJvbSBcIi4vTm93XCJcbmV4cG9ydCBjbGFzcyBIZWxsbyB7XG4gIGdldFNob3BwaW5nTGlzdCgpOiBsaXN0Lkxpc3Qge1xuICAgIGxldCBzaG9wcGluZ0xpc3QgPSBsaXN0Lkxpc3QuY3JlYXRlKHtuYW1lOiBcInNob3BwaW5nXCJ9KVxuICAgIHNob3BwaW5nTGlzdC5pdGVtcy5wdXNoKGxpc3QuSXRlbS5jcmVhdGUoe25hbWU6IFwiY29mZmVlXCJ9KSlcbiAgICBzaG9wcGluZ0xpc3QuaXRlbXMucHVzaChsaXN0Lkl0ZW0uY3JlYXRlKHtuYW1lOiBcImNhdCBmb29kXCJ9KSlcbiAgICByZXR1cm4gc2hvcHBpbmdMaXN0XG4gIH1cblxuICBydW4oKSB7XG4gICAgY29uc29sZS5sb2coXCJoZWxsbyB3b3JsZCAxMFwiKVxuICAgIG5ldyBOb3coKS5wcmludCgpXG5cbiAgICBjb25zb2xlLmxvZyhuZXcgTXlMaXN0cygpLmdldFNob3BwaW5nTGlzdCgpKVxuICB9XG59IiwiaW1wb3J0IHsgbGlzdCB9IGZyb20gXCIuLi9zcmNkZXBzL3Byb3RvLWdlbi10cy9hbGxwcm90b1wiXG5cbmV4cG9ydCBjbGFzcyBNeUxpc3RzIHtcbiAgZ2V0U2hvcHBpbmdMaXN0KCk6IGxpc3QuTGlzdCB7XG4gICAgbGV0IHNob3BwaW5nTGlzdCA9IGxpc3QuTGlzdC5jcmVhdGUoe25hbWU6IFwic2hvcHBpbmdcIn0pXG4gICAgc2hvcHBpbmdMaXN0Lml0ZW1zLnB1c2gobGlzdC5JdGVtLmNyZWF0ZSh7bmFtZTogXCJjb2ZmZWVcIn0pKVxuICAgIHNob3BwaW5nTGlzdC5pdGVtcy5wdXNoKGxpc3QuSXRlbS5jcmVhdGUoe25hbWU6IFwiY2F0IGZvb2RcIn0pKVxuICAgIHJldHVybiBzaG9wcGluZ0xpc3RcbiAgfVxufSIsImV4cG9ydCBjbGFzcyBOb3cge1xuICBwcmludCgpIHtcbiAgICBjb25zb2xlLmxvZyhuZXcgRGF0ZSgpLCBcInNvbWV0aGluZyBlbHNlIDJcIilcbiAgfVxufSIsIi8qZXNsaW50LWRpc2FibGUgYmxvY2stc2NvcGVkLXZhciwgbm8tcmVkZWNsYXJlLCBuby1jb250cm9sLXJlZ2V4LCBuby1wcm90b3R5cGUtYnVpbHRpbnMqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciAkcHJvdG9idWYgPSByZXF1aXJlKFwiLi4vcHJvdG9idWZqcy9taW5pbWFsLmpzXCIpO1xuXG4vLyBDb21tb24gYWxpYXNlc1xudmFyICR1dGlsID0gJHByb3RvYnVmLnV0aWw7XG5cbi8vIEV4cG9ydGVkIHJvb3QgbmFtZXNwYWNlXG52YXIgJHJvb3QgPSAkcHJvdG9idWYucm9vdHNbXCIuLi9zcmNkZXBzL3Byb3RvLWdlbi10cy9hbGxwcm90b1wiXSB8fCAoJHByb3RvYnVmLnJvb3RzW1wiLi4vc3JjZGVwcy9wcm90by1nZW4tdHMvYWxscHJvdG9cIl0gPSB7fSk7XG5cbiRyb290Lmxpc3QgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAvKipcbiAgICAgKiBOYW1lc3BhY2UgbGlzdC5cbiAgICAgKiBAZXhwb3J0cyBsaXN0XG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqL1xuICAgIHZhciBsaXN0ID0ge307XG5cbiAgICBsaXN0Lkl0ZW0gPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFByb3BlcnRpZXMgb2YgYW4gSXRlbS5cbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3RcbiAgICAgICAgICogQGludGVyZmFjZSBJSXRlbVxuICAgICAgICAgKiBAcHJvcGVydHkge3N0cmluZ30gW25hbWVdIEl0ZW0gbmFtZVxuICAgICAgICAgKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29uc3RydWN0cyBhIG5ldyBJdGVtLlxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdFxuICAgICAgICAgKiBAY2xhc3NkZXNjIFJlcHJlc2VudHMgYW4gSXRlbS5cbiAgICAgICAgICogQGNvbnN0cnVjdG9yXG4gICAgICAgICAqIEBwYXJhbSB7bGlzdC5JSXRlbT19IFtwcm9wZXJ0aWVzXSBQcm9wZXJ0aWVzIHRvIHNldFxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gSXRlbShwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBpZiAocHJvcGVydGllcylcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXlzID0gT2JqZWN0LmtleXMocHJvcGVydGllcyksIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNba2V5c1tpXV0gIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNba2V5c1tpXV0gPSBwcm9wZXJ0aWVzW2tleXNbaV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZW0gbmFtZS5cbiAgICAgICAgICogQG1lbWJlciB7c3RyaW5nfW5hbWVcbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuSXRlbVxuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICovXG4gICAgICAgIEl0ZW0ucHJvdG90eXBlLm5hbWUgPSBcIlwiO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgbmV3IEl0ZW0gaW5zdGFuY2UgdXNpbmcgdGhlIHNwZWNpZmllZCBwcm9wZXJ0aWVzLlxuICAgICAgICAgKiBAZnVuY3Rpb24gY3JlYXRlXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkl0ZW1cbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAcGFyYW0ge2xpc3QuSUl0ZW09fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcbiAgICAgICAgICogQHJldHVybnMge2xpc3QuSXRlbX0gSXRlbSBpbnN0YW5jZVxuICAgICAgICAgKi9cbiAgICAgICAgSXRlbS5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUocHJvcGVydGllcykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBJdGVtKHByb3BlcnRpZXMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBWZXJpZmllcyBhbiBJdGVtIG1lc3NhZ2UuXG4gICAgICAgICAqIEBmdW5jdGlvbiB2ZXJpZnlcbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuSXRlbVxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IG1lc3NhZ2UgUGxhaW4gb2JqZWN0IHRvIHZlcmlmeVxuICAgICAgICAgKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9IGBudWxsYCBpZiB2YWxpZCwgb3RoZXJ3aXNlIHRoZSByZWFzb24gd2h5IGl0IGlzIG5vdFxuICAgICAgICAgKi9cbiAgICAgICAgSXRlbS52ZXJpZnkgPSBmdW5jdGlvbiB2ZXJpZnkobWVzc2FnZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlICE9PSBcIm9iamVjdFwiIHx8IG1lc3NhZ2UgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2JqZWN0IGV4cGVjdGVkXCI7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5uYW1lICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcIm5hbWVcIikpXG4gICAgICAgICAgICAgICAgaWYgKCEkdXRpbC5pc1N0cmluZyhtZXNzYWdlLm5hbWUpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJuYW1lOiBzdHJpbmcgZXhwZWN0ZWRcIjtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGFuIEl0ZW0gbWVzc2FnZSBmcm9tIGEgcGxhaW4gb2JqZWN0LiBBbHNvIGNvbnZlcnRzIHZhbHVlcyB0byB0aGVpciByZXNwZWN0aXZlIGludGVybmFsIHR5cGVzLlxuICAgICAgICAgKiBAZnVuY3Rpb24gZnJvbU9iamVjdFxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5JdGVtXG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gb2JqZWN0IFBsYWluIG9iamVjdFxuICAgICAgICAgKiBAcmV0dXJucyB7bGlzdC5JdGVtfSBJdGVtXG4gICAgICAgICAqL1xuICAgICAgICBJdGVtLmZyb21PYmplY3QgPSBmdW5jdGlvbiBmcm9tT2JqZWN0KG9iamVjdCkge1xuICAgICAgICAgICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mICRyb290Lmxpc3QuSXRlbSlcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBuZXcgJHJvb3QubGlzdC5JdGVtKCk7XG4gICAgICAgICAgICBpZiAob2JqZWN0Lm5hbWUgIT0gbnVsbClcbiAgICAgICAgICAgICAgICBtZXNzYWdlLm5hbWUgPSBTdHJpbmcob2JqZWN0Lm5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBwbGFpbiBvYmplY3QgZnJvbSBhbiBJdGVtIG1lc3NhZ2UuIEFsc28gY29udmVydHMgdmFsdWVzIHRvIG90aGVyIHR5cGVzIGlmIHNwZWNpZmllZC5cbiAgICAgICAgICogQGZ1bmN0aW9uIHRvT2JqZWN0XG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkl0ZW1cbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAcGFyYW0ge2xpc3QuSXRlbX0gbWVzc2FnZSBJdGVtXG4gICAgICAgICAqIEBwYXJhbSB7JHByb3RvYnVmLklDb252ZXJzaW9uT3B0aW9uc30gW29wdGlvbnNdIENvbnZlcnNpb24gb3B0aW9uc1xuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsKj59IFBsYWluIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgSXRlbS50b09iamVjdCA9IGZ1bmN0aW9uIHRvT2JqZWN0KG1lc3NhZ2UsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucylcbiAgICAgICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgICAgICB2YXIgb2JqZWN0ID0ge307XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5kZWZhdWx0cylcbiAgICAgICAgICAgICAgICBvYmplY3QubmFtZSA9IFwiXCI7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5uYW1lICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcIm5hbWVcIikpXG4gICAgICAgICAgICAgICAgb2JqZWN0Lm5hbWUgPSBtZXNzYWdlLm5hbWU7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZXJ0cyB0aGlzIEl0ZW0gdG8gSlNPTi5cbiAgICAgICAgICogQGZ1bmN0aW9uIHRvSlNPTlxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5JdGVtXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsKj59IEpTT04gb2JqZWN0XG4gICAgICAgICAqL1xuICAgICAgICBJdGVtLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci50b09iamVjdCh0aGlzLCAkcHJvdG9idWYudXRpbC50b0pTT05PcHRpb25zKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gSXRlbTtcbiAgICB9KSgpO1xuXG4gICAgbGlzdC5MaXN0ID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9wZXJ0aWVzIG9mIGEgTGlzdC5cbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3RcbiAgICAgICAgICogQGludGVyZmFjZSBJTGlzdFxuICAgICAgICAgKiBAcHJvcGVydHkge3N0cmluZ30gW25hbWVdIExpc3QgbmFtZVxuICAgICAgICAgKiBAcHJvcGVydHkge0FycmF5LjxsaXN0LklJdGVtPn0gW2l0ZW1zXSBMaXN0IGl0ZW1zXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IExpc3QuXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0XG4gICAgICAgICAqIEBjbGFzc2Rlc2MgUmVwcmVzZW50cyBhIExpc3QuXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKiBAcGFyYW0ge2xpc3QuSUxpc3Q9fSBbcHJvcGVydGllc10gUHJvcGVydGllcyB0byBzZXRcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIExpc3QocHJvcGVydGllcykge1xuICAgICAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICAgICAgaWYgKHByb3BlcnRpZXMpXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5cyA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzW2tleXNbaV1dICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2tleXNbaV1dID0gcHJvcGVydGllc1trZXlzW2ldXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IG5hbWUuXG4gICAgICAgICAqIEBtZW1iZXIge3N0cmluZ31uYW1lXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkxpc3RcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBMaXN0LnByb3RvdHlwZS5uYW1lID0gXCJcIjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCBpdGVtcy5cbiAgICAgICAgICogQG1lbWJlciB7QXJyYXkuPGxpc3QuSUl0ZW0+fWl0ZW1zXG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkxpc3RcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBMaXN0LnByb3RvdHlwZS5pdGVtcyA9ICR1dGlsLmVtcHR5QXJyYXk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBuZXcgTGlzdCBpbnN0YW5jZSB1c2luZyB0aGUgc3BlY2lmaWVkIHByb3BlcnRpZXMuXG4gICAgICAgICAqIEBmdW5jdGlvbiBjcmVhdGVcbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuTGlzdFxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBwYXJhbSB7bGlzdC5JTGlzdD19IFtwcm9wZXJ0aWVzXSBQcm9wZXJ0aWVzIHRvIHNldFxuICAgICAgICAgKiBAcmV0dXJucyB7bGlzdC5MaXN0fSBMaXN0IGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBMaXN0LmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IExpc3QocHJvcGVydGllcyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFZlcmlmaWVzIGEgTGlzdCBtZXNzYWdlLlxuICAgICAgICAgKiBAZnVuY3Rpb24gdmVyaWZ5XG4gICAgICAgICAqIEBtZW1iZXJvZiBsaXN0Lkxpc3RcbiAgICAgICAgICogQHN0YXRpY1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCo+fSBtZXNzYWdlIFBsYWluIG9iamVjdCB0byB2ZXJpZnlcbiAgICAgICAgICogQHJldHVybnMge3N0cmluZ3xudWxsfSBgbnVsbGAgaWYgdmFsaWQsIG90aGVyd2lzZSB0aGUgcmVhc29uIHdoeSBpdCBpcyBub3RcbiAgICAgICAgICovXG4gICAgICAgIExpc3QudmVyaWZ5ID0gZnVuY3Rpb24gdmVyaWZ5KG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gXCJvYmplY3RcIiB8fCBtZXNzYWdlID09PSBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiBcIm9iamVjdCBleHBlY3RlZFwiO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UubmFtZSAhPSBudWxsICYmIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJuYW1lXCIpKVxuICAgICAgICAgICAgICAgIGlmICghJHV0aWwuaXNTdHJpbmcobWVzc2FnZS5uYW1lKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibmFtZTogc3RyaW5nIGV4cGVjdGVkXCI7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5pdGVtcyAhPSBudWxsICYmIG1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJpdGVtc1wiKSkge1xuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShtZXNzYWdlLml0ZW1zKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiaXRlbXM6IGFycmF5IGV4cGVjdGVkXCI7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXNzYWdlLml0ZW1zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnJvciA9ICRyb290Lmxpc3QuSXRlbS52ZXJpZnkobWVzc2FnZS5pdGVtc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIml0ZW1zLlwiICsgZXJyb3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBMaXN0IG1lc3NhZ2UgZnJvbSBhIHBsYWluIG9iamVjdC4gQWxzbyBjb252ZXJ0cyB2YWx1ZXMgdG8gdGhlaXIgcmVzcGVjdGl2ZSBpbnRlcm5hbCB0eXBlcy5cbiAgICAgICAgICogQGZ1bmN0aW9uIGZyb21PYmplY3RcbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuTGlzdFxuICAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IG9iamVjdCBQbGFpbiBvYmplY3RcbiAgICAgICAgICogQHJldHVybnMge2xpc3QuTGlzdH0gTGlzdFxuICAgICAgICAgKi9cbiAgICAgICAgTGlzdC5mcm9tT2JqZWN0ID0gZnVuY3Rpb24gZnJvbU9iamVjdChvYmplY3QpIHtcbiAgICAgICAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiAkcm9vdC5saXN0Lkxpc3QpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gbmV3ICRyb290Lmxpc3QuTGlzdCgpO1xuICAgICAgICAgICAgaWYgKG9iamVjdC5uYW1lICE9IG51bGwpXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5uYW1lID0gU3RyaW5nKG9iamVjdC5uYW1lKTtcbiAgICAgICAgICAgIGlmIChvYmplY3QuaXRlbXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkob2JqZWN0Lml0ZW1zKSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiLmxpc3QuTGlzdC5pdGVtczogYXJyYXkgZXhwZWN0ZWRcIik7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS5pdGVtcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0Lml0ZW1zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Lml0ZW1zW2ldICE9PSBcIm9iamVjdFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiLmxpc3QuTGlzdC5pdGVtczogb2JqZWN0IGV4cGVjdGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLml0ZW1zW2ldID0gJHJvb3QubGlzdC5JdGVtLmZyb21PYmplY3Qob2JqZWN0Lml0ZW1zW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlcyBhIHBsYWluIG9iamVjdCBmcm9tIGEgTGlzdCBtZXNzYWdlLiBBbHNvIGNvbnZlcnRzIHZhbHVlcyB0byBvdGhlciB0eXBlcyBpZiBzcGVjaWZpZWQuXG4gICAgICAgICAqIEBmdW5jdGlvbiB0b09iamVjdFxuICAgICAgICAgKiBAbWVtYmVyb2YgbGlzdC5MaXN0XG4gICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgICogQHBhcmFtIHtsaXN0Lkxpc3R9IG1lc3NhZ2UgTGlzdFxuICAgICAgICAgKiBAcGFyYW0geyRwcm90b2J1Zi5JQ29udmVyc2lvbk9wdGlvbnN9IFtvcHRpb25zXSBDb252ZXJzaW9uIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBQbGFpbiBvYmplY3RcbiAgICAgICAgICovXG4gICAgICAgIExpc3QudG9PYmplY3QgPSBmdW5jdGlvbiB0b09iamVjdChtZXNzYWdlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMpXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgdmFyIG9iamVjdCA9IHt9O1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXJyYXlzIHx8IG9wdGlvbnMuZGVmYXVsdHMpXG4gICAgICAgICAgICAgICAgb2JqZWN0Lml0ZW1zID0gW107XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5kZWZhdWx0cylcbiAgICAgICAgICAgICAgICBvYmplY3QubmFtZSA9IFwiXCI7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5uYW1lICE9IG51bGwgJiYgbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcIm5hbWVcIikpXG4gICAgICAgICAgICAgICAgb2JqZWN0Lm5hbWUgPSBtZXNzYWdlLm5hbWU7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS5pdGVtcyAmJiBtZXNzYWdlLml0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIG9iamVjdC5pdGVtcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbWVzc2FnZS5pdGVtcy5sZW5ndGg7ICsrailcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0Lml0ZW1zW2pdID0gJHJvb3QubGlzdC5JdGVtLnRvT2JqZWN0KG1lc3NhZ2UuaXRlbXNbal0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydHMgdGhpcyBMaXN0IHRvIEpTT04uXG4gICAgICAgICAqIEBmdW5jdGlvbiB0b0pTT05cbiAgICAgICAgICogQG1lbWJlcm9mIGxpc3QuTGlzdFxuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCo+fSBKU09OIG9iamVjdFxuICAgICAgICAgKi9cbiAgICAgICAgTGlzdC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IudG9PYmplY3QodGhpcywgJHByb3RvYnVmLnV0aWwudG9KU09OT3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIExpc3Q7XG4gICAgfSkoKTtcblxuICAgIHJldHVybiBsaXN0O1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSAkcm9vdDtcbiIsImltcG9ydCB7IE15TGlzdHMgfSBmcm9tIFwiLi4vc3JjL015TGlzdHNcIlxuaW1wb3J0IHsgSGVsbG8gfSBmcm9tIFwiLi4vc3JjL0hlbGxvXCJcbmltcG9ydCB7IGxpc3QgfSBmcm9tIFwiLi4vc3JjZGVwcy9wcm90by1nZW4tdHMvYWxscHJvdG9cIlxuXG5jb25zb2xlLmxvZyhcIkluaXQgc3RhcnRcIilcblxubmV3IEhlbGxvKCkucnVuKClcblxuXG4vLyBtdmRvbVxuXG5kZWNsYXJlIGZ1bmN0aW9uIHJlcXVpcmUobmFtZTpzdHJpbmcpO1xubGV0IGQgPSByZXF1aXJlKFwiLi4vdWlkZXBzL212ZG9tXCIpXG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsICgpID0+IHtcbiAgZC5kaXNwbGF5KFwiU2hvcHBpbmdWaWV3XCIsIGQuZmlyc3QoXCIjc2hvcHBpbmdcIiksIG5ldyBNeUxpc3RzKCkuZ2V0U2hvcHBpbmdMaXN0KCkpXG59KVxuXG5kLnJlZ2lzdGVyKFwiU2hvcHBpbmdWaWV3XCIse1xuXHRjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz0nU2hvcHBpbmdWaWV3Jz5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxpc3RcIj5oaSwgaSdtIHRoZSBlbXB0eSBsaXN0PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5gXG5cdH0sXG5cdFx0XHRcdFx0XG5cdGluaXQ6IGZ1bmN0aW9uKHNob3BwaW5nTGlzdDogbGlzdC5MaXN0KXtcbiAgICBsZXQgdmlldyA9IHRoaXNcbiAgICBsZXQgbGlzdEVsID0gZC5maXJzdCh2aWV3LmVsLCBcIi5saXN0XCIpXG4gICAgbGlzdEVsLmlubmVySFRNTCA9IFwiXCJcblxuICAgIGxldCBuYW1lRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICAgIG5hbWVEaXYudGV4dENvbnRlbnQgPSBzaG9wcGluZ0xpc3QubmFtZVxuICAgIGxpc3RFbC5hcHBlbmRDaGlsZChuYW1lRGl2KVxuXG4gICAgbGV0IHVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpXG4gICAgZm9yIChsZXQgbGlzdEl0ZW0gb2Ygc2hvcHBpbmdMaXN0Lml0ZW1zKSB7XG4gICAgICBsZXQgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIilcbiAgICAgIGxpLnRleHRDb250ZW50ID0gbGlzdEl0ZW0ubmFtZSB8fCBcIlwiXG4gICAgICB1bC5hcHBlbmRDaGlsZChsaSlcbiAgICB9XG4gICAgXG4gICAgbGlzdEVsLmFwcGVuZENoaWxkKHVsKVxuICB9XG59KVxuXG5jb25zb2xlLmxvZyhcIkluaXQgZG9uZVwiKVxuIl19
