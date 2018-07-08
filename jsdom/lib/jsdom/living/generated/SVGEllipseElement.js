"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const impl = utils.implSymbol;
const SVGGeometryElement = require("./SVGGeometryElement.js");

function SVGEllipseElement() {
  throw new TypeError("Illegal constructor");
}

Object.setPrototypeOf(SVGEllipseElement.prototype, SVGGeometryElement.interface.prototype);
Object.setPrototypeOf(SVGEllipseElement, SVGGeometryElement.interface);

Object.defineProperty(SVGEllipseElement, "prototype", {
  value: SVGEllipseElement.prototype,
  writable: false,
  enumerable: false,
  configurable: false
});

SVGEllipseElement.prototype.getPathData = function getPathData() {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  return utils.tryWrapperForImpl(this[impl].getPathData());
};

Object.defineProperty(SVGEllipseElement.prototype, "cx", {
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

Object.defineProperty(SVGEllipseElement.prototype, "cy", {
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

Object.defineProperty(SVGEllipseElement.prototype, "rx", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "rx", () => {
      return utils.tryWrapperForImpl(this[impl]["rx"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGEllipseElement.prototype, "ry", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "ry", () => {
      return utils.tryWrapperForImpl(this[impl]["ry"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGEllipseElement.prototype, Symbol.toStringTag, {
  value: "SVGEllipseElement",
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
    throw new TypeError(`${context} is not of type 'SVGEllipseElement'.`);
  },

  create(constructorArgs, privateData) {
    let obj = Object.create(SVGEllipseElement.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  createImpl(constructorArgs, privateData) {
    let obj = Object.create(SVGEllipseElement.prototype);
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
  interface: SVGEllipseElement,
  expose: {
    Window: { SVGEllipseElement }
  }
}; // iface
module.exports = iface;

const Impl = require("../nodes/SVGEllipseElement-impl.js");
