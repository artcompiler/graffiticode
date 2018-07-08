"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const impl = utils.implSymbol;

function SVGPointList() {
  throw new TypeError("Illegal constructor");
}

Object.defineProperty(SVGPointList, "prototype", {
  value: SVGPointList.prototype,
  writable: false,
  enumerable: false,
  configurable: false
});

Object.defineProperty(SVGPointList.prototype, Symbol.iterator, {
  writable: true,
  enumerable: false,
  configurable: true,
  value: Array.prototype[Symbol.iterator]
});

SVGPointList.prototype.clear = function clear() {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  return this[impl].clear();
};

SVGPointList.prototype.initialize = function initialize(newItem) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 1) {
    throw new TypeError(
      "Failed to execute 'initialize' on 'SVGPointList': 1 argument required, but only " +
        arguments.length +
        " present."
    );
  }
  const args = [];
  {
    let curArg = arguments[0];
    curArg = utils.tryImplForWrapper(curArg);
    args.push(curArg);
  }
  return utils.tryWrapperForImpl(this[impl].initialize(...args));
};

SVGPointList.prototype.getItem = function getItem(index) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 1) {
    throw new TypeError(
      "Failed to execute 'getItem' on 'SVGPointList': 1 argument required, but only " + arguments.length + " present."
    );
  }
  const args = [];
  {
    let curArg = arguments[0];
    curArg = conversions["unsigned long"](curArg, {
      context: "Failed to execute 'getItem' on 'SVGPointList': parameter 1"
    });
    args.push(curArg);
  }
  return utils.tryWrapperForImpl(this[impl].getItem(...args));
};

SVGPointList.prototype.insertItemBefore = function insertItemBefore(newItem, index) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 2) {
    throw new TypeError(
      "Failed to execute 'insertItemBefore' on 'SVGPointList': 2 arguments required, but only " +
        arguments.length +
        " present."
    );
  }
  const args = [];
  {
    let curArg = arguments[0];
    curArg = utils.tryImplForWrapper(curArg);
    args.push(curArg);
  }
  {
    let curArg = arguments[1];
    curArg = conversions["unsigned long"](curArg, {
      context: "Failed to execute 'insertItemBefore' on 'SVGPointList': parameter 2"
    });
    args.push(curArg);
  }
  return utils.tryWrapperForImpl(this[impl].insertItemBefore(...args));
};

SVGPointList.prototype.replaceItem = function replaceItem(newItem, index) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 2) {
    throw new TypeError(
      "Failed to execute 'replaceItem' on 'SVGPointList': 2 arguments required, but only " +
        arguments.length +
        " present."
    );
  }
  const args = [];
  {
    let curArg = arguments[0];
    curArg = utils.tryImplForWrapper(curArg);
    args.push(curArg);
  }
  {
    let curArg = arguments[1];
    curArg = conversions["unsigned long"](curArg, {
      context: "Failed to execute 'replaceItem' on 'SVGPointList': parameter 2"
    });
    args.push(curArg);
  }
  return utils.tryWrapperForImpl(this[impl].replaceItem(...args));
};

SVGPointList.prototype.removeItem = function removeItem(index) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 1) {
    throw new TypeError(
      "Failed to execute 'removeItem' on 'SVGPointList': 1 argument required, but only " +
        arguments.length +
        " present."
    );
  }
  const args = [];
  {
    let curArg = arguments[0];
    curArg = conversions["unsigned long"](curArg, {
      context: "Failed to execute 'removeItem' on 'SVGPointList': parameter 1"
    });
    args.push(curArg);
  }
  return utils.tryWrapperForImpl(this[impl].removeItem(...args));
};

SVGPointList.prototype.appendItem = function appendItem(newItem) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 1) {
    throw new TypeError(
      "Failed to execute 'appendItem' on 'SVGPointList': 1 argument required, but only " +
        arguments.length +
        " present."
    );
  }
  const args = [];
  {
    let curArg = arguments[0];
    curArg = utils.tryImplForWrapper(curArg);
    args.push(curArg);
  }
  return utils.tryWrapperForImpl(this[impl].appendItem(...args));
};

Object.defineProperty(SVGPointList.prototype, "length", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return this[impl]["length"];
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGPointList.prototype, "numberOfItems", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return this[impl]["numberOfItems"];
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGPointList.prototype, Symbol.toStringTag, {
  value: "SVGPointList",
  writable: false,
  enumerable: false,
  configurable: true
});

const iface = {
  // When an interface-module that implements this interface as a mixin is loaded, it will append its own `.is()`
  // method into this array. It allows objects that directly implements *those* interfaces to be recognized as
  // implementing this mixin interface.
  _mixedIntoPredicates: [],
  is(obj) {
    if (obj) {
      if (utils.hasOwn(obj, impl) && obj[impl] instanceof Impl.implementation) {
        return true;
      }
      for (const isMixedInto of module.exports._mixedIntoPredicates) {
        if (isMixedInto(obj)) {
          return true;
        }
      }
    }
    return false;
  },
  isImpl(obj) {
    if (obj) {
      if (obj instanceof Impl.implementation) {
        return true;
      }

      const wrapper = utils.wrapperForImpl(obj);
      for (const isMixedInto of module.exports._mixedIntoPredicates) {
        if (isMixedInto(wrapper)) {
          return true;
        }
      }
    }
    return false;
  },
  convert(obj, { context = "The provided value" } = {}) {
    if (module.exports.is(obj)) {
      return utils.implForWrapper(obj);
    }
    throw new TypeError(`${context} is not of type 'SVGPointList'.`);
  },

  create(constructorArgs, privateData) {
    let obj = Object.create(SVGPointList.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  createImpl(constructorArgs, privateData) {
    let obj = Object.create(SVGPointList.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return utils.implForWrapper(obj);
  },
  _internalSetup(obj) {},
  setup(obj, constructorArgs, privateData) {
    if (!privateData) privateData = {};

    privateData.wrapper = obj;

    this._internalSetup(obj);
    Object.defineProperty(obj, impl, {
      value: new Impl.implementation(constructorArgs, privateData),
      writable: false,
      enumerable: false,
      configurable: true
    });

    obj = new Proxy(obj, {
      get(target, P, receiver) {
        if (typeof P === "symbol") {
          return Reflect.get(target, P, receiver);
        }
        const desc = this.getOwnPropertyDescriptor(target, P);
        if (desc === undefined) {
          const parent = Object.getPrototypeOf(target);
          if (parent === null) {
            return undefined;
          }
          return Reflect.get(target, P, receiver);
        }
        if (!desc.get && !desc.set) {
          return desc.value;
        }
        const getter = desc.get;
        if (getter === undefined) {
          return undefined;
        }
        return Reflect.apply(getter, receiver, []);
      },

      has(target, P) {
        if (typeof P === "symbol") {
          return Reflect.has(target, P);
        }
        const desc = this.getOwnPropertyDescriptor(target, P);
        if (desc !== undefined) {
          return true;
        }
        const parent = Object.getPrototypeOf(target);
        if (parent !== null) {
          return Reflect.has(parent, P);
        }
        return false;
      },

      ownKeys(target) {
        const keys = new Set();

        for (const key of target[impl][utils.supportedPropertyIndices]) {
          keys.add(`${key}`);
        }

        for (const key of Reflect.ownKeys(target)) {
          keys.add(key);
        }
        return [...keys];
      },

      getOwnPropertyDescriptor(target, P) {
        if (typeof P === "symbol") {
          return Reflect.getOwnPropertyDescriptor(target, P);
        }
        let ignoreNamedProps = false;

        if (utils.isArrayIndexPropName(P)) {
          const index = P >>> 0;

          if (target[impl][utils.supportsPropertyIndex](index)) {
            const indexedValue = target[impl].getItem(index);
            return {
              writable: true,
              enumerable: true,
              configurable: true,
              value: utils.tryWrapperForImpl(indexedValue)
            };
          }
          ignoreNamedProps = true;
        }

        return Reflect.getOwnPropertyDescriptor(target, P);
      },

      set(target, P, V, receiver) {
        if (typeof P === "symbol") {
          return Reflect.set(target, P, V, receiver);
        }
        if (target === receiver) {
          if (utils.isArrayIndexPropName(P)) {
            const index = P >>> 0;
            let indexedValue = V;

            indexedValue = utils.tryImplForWrapper(indexedValue);

            const creating = !target[impl][utils.supportsPropertyIndex](index);
            if (creating) {
              target[impl][utils.indexedSetNew](index, indexedValue);
            } else {
              target[impl][utils.indexedSetExisting](index, indexedValue);
            }

            return true;
          }
        }
        let ownDesc;

        if (utils.isArrayIndexPropName(P)) {
          const index = P >>> 0;

          if (target[impl][utils.supportsPropertyIndex](index)) {
            const indexedValue = target[impl].getItem(index);
            ownDesc = {
              writable: true,
              enumerable: true,
              configurable: true,
              value: utils.tryWrapperForImpl(indexedValue)
            };
          }
        }

        if (ownDesc === undefined) {
          ownDesc = Reflect.getOwnPropertyDescriptor(target, P);
        }
        if (ownDesc === undefined) {
          const parent = Reflect.getPrototypeOf(target);
          if (parent !== null) {
            return Reflect.set(parent, P, V, receiver);
          }
          ownDesc = { writable: true, enumerable: true, configurable: true, value: undefined };
        }
        if (!ownDesc.writable) {
          return false;
        }
        if (!utils.isObject(receiver)) {
          return false;
        }
        const existingDesc = Reflect.getOwnPropertyDescriptor(receiver, P);
        let valueDesc;
        if (existingDesc !== undefined) {
          if (existingDesc.get || existingDesc.set) {
            return false;
          }
          if (!existingDesc.writable) {
            return false;
          }
          valueDesc = { value: V };
        } else {
          valueDesc = { writable: true, enumerable: true, configurable: true, value: V };
        }
        return Reflect.defineProperty(receiver, P, valueDesc);
      },

      defineProperty(target, P, desc) {
        if (typeof P === "symbol") {
          return Reflect.defineProperty(target, P, desc);
        }

        if (utils.isArrayIndexPropName(P)) {
          if (desc.get || desc.set) {
            return false;
          }

          const index = P >>> 0;
          let indexedValue = desc.value;

          indexedValue = utils.tryImplForWrapper(indexedValue);

          const creating = !target[impl][utils.supportsPropertyIndex](index);
          if (creating) {
            target[impl][utils.indexedSetNew](index, indexedValue);
          } else {
            target[impl][utils.indexedSetExisting](index, indexedValue);
          }

          return true;
        }

        return Reflect.defineProperty(target, P, desc);
      },

      deleteProperty(target, P) {
        if (typeof P === "symbol") {
          return Reflect.deleteProperty(target, P);
        }

        if (utils.isArrayIndexPropName(P)) {
          const index = P >>> 0;
          return !target[impl][utils.supportsPropertyIndex](index);
        }

        return Reflect.deleteProperty(target, P);
      },

      preventExtensions() {
        return false;
      }
    });

    obj[impl][utils.wrapperSymbol] = obj;
    if (Impl.init) {
      Impl.init(obj[impl], privateData);
    }
    return obj;
  },
  interface: SVGPointList,
  expose: {
    Window: { SVGPointList }
  }
}; // iface
module.exports = iface;

const Impl = require("../nodes/SVGPointList-impl.js");
