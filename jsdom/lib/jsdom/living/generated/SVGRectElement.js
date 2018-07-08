"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const impl = utils.implSymbol;
const SVGGeometryElement = require("./SVGGeometryElement.js");

function SVGRectElement() {
  throw new TypeError("Illegal constructor");
}

Object.setPrototypeOf(SVGRectElement.prototype, SVGGeometryElement.interface.prototype);
Object.setPrototypeOf(SVGRectElement, SVGGeometryElement.interface);

Object.defineProperty(SVGRectElement, "prototype", {
  value: SVGRectElement.prototype,
  writable: false,
  enumerable: false,
  configurable: false
});

SVGRectElement.prototype.getPathData = function getPathData() {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  return utils.tryWrapperForImpl(this[impl].getPathData());
};

Object.defineProperty(SVGRectElement.prototype, "x", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "x", () => {
      return utils.tryWrapperForImpl(this[impl]["x"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGRectElement.prototype, "y", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "y", () => {
      return utils.tryWrapperForImpl(this[impl]["y"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGRectElement.prototype, "width", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "width", () => {
      return utils.tryWrapperForImpl(this[impl]["width"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGRectElement.prototype, "height", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return utils.getSameObject(this, "height", () => {
      return utils.tryWrapperForImpl(this[impl]["height"]);
    });
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGRectElement.prototype, "rx", {
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

Object.defineProperty(SVGRectElement.prototype, "ry", {
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

Object.defineProperty(SVGRectElement.prototype, Symbol.toStringTag, {
  value: "SVGRectElement",
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
    throw new TypeError(`${context} is not of type 'SVGRectElement'.`);
  },

  create(constructorArgs, privateData) {
    let obj = Object.create(SVGRectElement.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  createImpl(constructorArgs, privateData) {
    let obj = Object.create(SVGRectElement.prototype);
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
  interface: SVGRectElement,
  expose: {
    Window: { SVGRectElement }
  }
}; // iface
module.exports = iface;

const Impl = require("../nodes/SVGRectElement-impl.js");
