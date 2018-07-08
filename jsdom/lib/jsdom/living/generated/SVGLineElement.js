"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const impl = utils.implSymbol;
const SVGGeometryElement = require("./SVGGeometryElement.js");

function SVGLineElement() {
  throw new TypeError("Illegal constructor");
}

Object.setPrototypeOf(SVGLineElement.prototype, SVGGeometryElement.interface.prototype);
Object.setPrototypeOf(SVGLineElement, SVGGeometryElement.interface);

Object.defineProperty(SVGLineElement, "prototype", {
  value: SVGLineElement.prototype,
  writable: false,
  enumerable: false,
  configurable: false
});

SVGLineElement.prototype.getPathData = function getPathData() {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  return utils.tryWrapperForImpl(this[impl].getPathData());
};

Object.defineProperty(SVGLineElement.prototype, "x1", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "x1", () => {
      return utils.tryWrapperForImpl(this[impl]["x1"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGLineElement.prototype, "y1", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "y1", () => {
      return utils.tryWrapperForImpl(this[impl]["y1"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGLineElement.prototype, "x2", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "x2", () => {
      return utils.tryWrapperForImpl(this[impl]["x2"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGLineElement.prototype, "y2", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "y2", () => {
      return utils.tryWrapperForImpl(this[impl]["y2"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGLineElement.prototype, Symbol.toStringTag, {
  value: "SVGLineElement",
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
    throw new TypeError(`${context} is not of type 'SVGLineElement'.`);
  },

  create(constructorArgs, privateData) {
    let obj = Object.create(SVGLineElement.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  createImpl(constructorArgs, privateData) {
    let obj = Object.create(SVGLineElement.prototype);
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
  interface: SVGLineElement,
  expose: {
    Window: { SVGLineElement }
  }
}; // iface
module.exports = iface;

const Impl = require("../nodes/SVGLineElement-impl.js");
