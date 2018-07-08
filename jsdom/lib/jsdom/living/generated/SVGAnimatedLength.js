"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const impl = utils.implSymbol;

function SVGAnimatedLength() {
  throw new TypeError("Illegal constructor");
}

Object.defineProperty(SVGAnimatedLength, "prototype", {
  value: SVGAnimatedLength.prototype,
  writable: false,
  enumerable: false,
  configurable: false
});

Object.defineProperty(SVGAnimatedLength.prototype, "baseVal", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "baseVal", () => {
      return utils.tryWrapperForImpl(this[impl]["baseVal"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGAnimatedLength.prototype, "animVal", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "animVal", () => {
      return utils.tryWrapperForImpl(this[impl]["animVal"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGAnimatedLength.prototype, Symbol.toStringTag, {
  value: "SVGAnimatedLength",
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
    throw new TypeError(`${context} is not of type 'SVGAnimatedLength'.`);
  },

  create(constructorArgs, privateData) {
    let obj = Object.create(SVGAnimatedLength.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  createImpl(constructorArgs, privateData) {
    let obj = Object.create(SVGAnimatedLength.prototype);
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

    obj[impl][utils.wrapperSymbol] = obj;
    if (Impl.init) {
      Impl.init(obj[impl], privateData);
    }
    return obj;
  },
  interface: SVGAnimatedLength,
  expose: {
    Window: { SVGAnimatedLength }
  }
}; // iface
module.exports = iface;

const Impl = require("../nodes/SVGAnimatedLength-impl.js");
