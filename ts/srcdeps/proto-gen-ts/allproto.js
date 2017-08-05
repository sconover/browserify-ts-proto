/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
"use strict";

var $protobuf = require("../protobufjs/minimal.js");

// Common aliases
var $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["../srcdeps/proto-gen-ts/allproto"] || ($protobuf.roots["../srcdeps/proto-gen-ts/allproto"] = {});

$root.list = (function() {

    /**
     * Namespace list.
     * @exports list
     * @namespace
     */
    var list = {};

    list.Item = (function() {

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

    list.List = (function() {

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
