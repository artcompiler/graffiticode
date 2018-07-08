"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const impl = utils.implSymbol;
const SVGGeometryElement = require("./SVGGeometryElement.js");

function SVGCircleElement() {
  throw new TypeError("Illegal constructor");
}

Object.setPrototypeOf(SVGCircleElement.prototype, SVGGeometryElement.interface.prototype);
Object.setPrototypeOf(SVGCircleElement, SVGGeometryElement.interface);

Object.defineProperty(SVGCircleElement, "prototype", {
  value: SVGCircleElement.prototype,
  writable: false,
  enumerable: false,
  configurable: false
});

SVGCircleElement.prototype.getPathData = function getPathData() {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  return utils.tryWrapperForImpl(this[impl].getPathData());
};

Object.defineProperty(SVGCircleElement.prototype, "cx", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "cx", () => {
      return utils.tryWrapperForImpl(this[impl]["cx"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGCircleElement.prototype, "cy", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "cy", () => {
      return utils.tryWrapperForImpl(this[impl]["cy"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGCircleElement.prototype, "r", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "r", () => {
      return utils.tryWrapperForImpl(this[impl]["r"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGCircleElement.prototype, Symbol.toStringTag, {
  value: "SVGCircleElement",
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
    throw new TypeError(`${context} is not of type 'SVGCircleElement'.`);
  },

  create(constructorArgs, privateData) {
    let obj = Object.create(SVGCircleElement.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  createImpl(constructorArgs, privateData) {
    let obj = Object.create(SVGCircleElement.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return utils.implForWrapper(obj);
  },
  _internalSetup(obj) {
    SVGGeometryElement._internalSetup(obj);
  },
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
  interface: SVGCircleElement,
  expose: {
    Window: { SVGCircleElement }
  }
}; // iface
module.exports = iface;

const Impl = require("../nodes/SVGCircleElement-impl.js");
