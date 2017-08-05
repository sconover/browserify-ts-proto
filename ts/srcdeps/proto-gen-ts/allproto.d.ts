import * as $protobuf from "../protobufjs";

/** Namespace list. */
export namespace list {

    /** Properties of an Item. */
    interface IItem {

        /** Item name */
        name?: string;
    }

    /** Represents an Item. */
    class Item {

        /**
         * Constructs a new Item.
         * @param [properties] Properties to set
         */
        constructor(properties?: list.IItem);

        /** Item name. */
        public name: string;

        /**
         * Creates a new Item instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Item instance
         */
        public static create(properties?: list.IItem): list.Item;

        /**
         * Verifies an Item message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Item message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Item
         */
        public static fromObject(object: { [k: string]: any }): list.Item;

        /**
         * Creates a plain object from an Item message. Also converts values to other types if specified.
         * @param message Item
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: list.Item, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Item to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a List. */
    interface IList {

        /** List name */
        name?: string;

        /** List item */
        item?: list.IItem[];
    }

    /** Represents a List. */
    class List {

        /**
         * Constructs a new List.
         * @param [properties] Properties to set
         */
        constructor(properties?: list.IList);

        /** List name. */
        public name: string;

        /** List item. */
        public item: list.IItem[];

        /**
         * Creates a new List instance using the specified properties.
         * @param [properties] Properties to set
         * @returns List instance
         */
        public static create(properties?: list.IList): list.List;

        /**
         * Verifies a List message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a List message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns List
         */
        public static fromObject(object: { [k: string]: any }): list.List;

        /**
         * Creates a plain object from a List message. Also converts values to other types if specified.
         * @param message List
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: list.List, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this List to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}
