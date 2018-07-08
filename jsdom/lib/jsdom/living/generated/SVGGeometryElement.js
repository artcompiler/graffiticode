"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const impl = utils.implSymbol;
const SVGGraphicsElement = require("./SVGGraphicsElement.js");

function SVGGeometryElement() {
  throw new TypeError("Illegal constructor");
}

Object.setPrototypeOf(SVGGeometryElement.prototype, SVGGraphicsElement.interface.prototype);
Object.setPrototypeOf(SVGGeometryElement, SVGGraphicsElement.interface);

Object.defineProperty(SVGGeometryElement, "prototype", {
  value: SVGGeometryElement.prototype,
  writable: false,
  enumerable: false,
  configurable: false
});

SVGGeometryElement.prototype.isPointInFill = function isPointInFill(point) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 1) {
    throw new TypeError(
      "Failed to execute 'isPointInFill' on 'SVGGeometryElement': 1 argument required, but only " +
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
  return this[impl].isPointInFill(...args);
};

SVGGeometryElement.prototype.isPointInStroke = function isPointInStroke(point) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 1) {
    throw new TypeError(
      "Failed to execute 'isPointInStroke' on 'SVGGeometryElement': 1 argument required, but only " +
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
  return this[impl].isPointInStroke(...args);
};

SVGGeometryElement.prototype.getTotalLength = function getTotalLength() {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  return this[impl].getTotalLength();
};

SVGGeometryElement.prototype.getPointAtLength = function getPointAtLength(distance) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 1) {
    throw new TypeError(
      "Failed to execute 'getPointAtLength' on 'SVGGeometryElement': 1 argument required, but only " +
        arguments.length +
        " present."
    );
  }
  const args = [];
  {
    let curArg = arguments[0];
    curArg = conversions["float"](curArg, {
      context: "Failed to execute 'getPointAtLength' on 'SVGGeometryElement': parameter 1"
    });
    args.push(curArg);
  }
  return utils.tryWrapperForImpl(this[impl].getPointAtLength(...args));
};

Object.defineProperty(SVGGeometryElement.prototype, Symbol.toStringTag, {
  value: "SVGGeometryElement",
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
    throw new TypeError(`${context} is not of type 'SVGGeometryElement'.`);
  },

  create(constructorArgs, privateData) {
    let obj = Object.create(SVGGeometryElement.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  createImpl(constructorArgs, privateData) {
    let obj = Object.create(SVGGeometryElement.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return utils.implForWrapper(obj);
  },
  _internalSetup(obj) {
    SVGGraphicsElement._internalSetup(obj);
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
  interface: SVGGeometryElement,
  expose: {
    Window: { SVGGeometryElement }
  }
}; // iface
module.exports = iface;

const Impl = require("../nodes/SVGGeometryElement-impl.js");
