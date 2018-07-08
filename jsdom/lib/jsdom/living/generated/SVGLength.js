"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const impl = utils.implSymbol;

function SVGLength() {
  throw new TypeError("Illegal constructor");
}

Object.defineProperty(SVGLength, "prototype", {
  value: SVGLength.prototype,
  writable: false,
  enumerable: false,
  configurable: false
});

SVGLength.prototype.newValueSpecifiedUnits = function newValueSpecifiedUnits(unitType, valueInSpecifiedUnits) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 2) {
    throw new TypeError(
      "Failed to execute 'newValueSpecifiedUnits' on 'SVGLength': 2 arguments required, but only " +
        arguments.length +
        " present."
    );
  }
  const args = [];
  {
    let curArg = arguments[0];
    curArg = conversions["unsigned short"](curArg, {
      context: "Failed to execute 'newValueSpecifiedUnits' on 'SVGLength': parameter 1"
    });
    args.push(curArg);
  }
  {
    let curArg = arguments[1];
    curArg = conversions["float"](curArg, {
      context: "Failed to execute 'newValueSpecifiedUnits' on 'SVGLength': parameter 2"
    });
    args.push(curArg);
  }
  return this[impl].newValueSpecifiedUnits(...args);
};

SVGLength.prototype.convertToSpecifiedUnits = function convertToSpecifiedUnits(unitType) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }

  if (arguments.length < 1) {
    throw new TypeError(
      "Failed to execute 'convertToSpecifiedUnits' on 'SVGLength': 1 argument required, but only " +
        arguments.length +
        " present."
    );
  }
  const args = [];
  {
    let curArg = arguments[0];
    curArg = conversions["unsigned short"](curArg, {
      context: "Failed to execute 'convertToSpecifiedUnits' on 'SVGLength': parameter 1"
    });
    args.push(curArg);
  }
  return this[impl].convertToSpecifiedUnits(...args);
};

Object.defineProperty(SVGLength.prototype, "unitType", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return this[impl]["unitType"];
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGLength.prototype, "value", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return this[impl]["value"];
  },

  set(V) {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    V = conversions["float"](V, { context: "Failed to set the 'value' property on 'SVGLength': The provided value" });

    this[impl]["value"] = V;
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGLength.prototype, "valueInSpecifiedUnits", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return this[impl]["valueInSpecifiedUnits"];
  },

  set(V) {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    V = conversions["float"](V, {
      context: "Failed to set the 'valueInSpecifiedUnits' property on 'SVGLength': The provided value"
    });

    this[impl]["valueInSpecifiedUnits"] = V;
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGLength.prototype, "valueAsString", {
  get() {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    return this[impl]["valueAsString"];
  },

  set(V) {
    if (!this || !module.exports.is(this)) {
      throw new TypeError("Illegal invocation");
    }

    V = conversions["DOMString"](V, {
      context: "Failed to set the 'valueAsString' property on 'SVGLength': The provided value"
    });

    this[impl]["valueAsString"] = V;
  },

  enumerable: true,
  configurable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_UNKNOWN", {
  value: 0,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_UNKNOWN", {
  value: 0,
  enumerable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_NUMBER", {
  value: 1,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_NUMBER", {
  value: 1,
  enumerable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_PERCENTAGE", {
  value: 2,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_PERCENTAGE", {
  value: 2,
  enumerable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_EMS", {
  value: 3,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_EMS", {
  value: 3,
  enumerable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_EXS", {
  value: 4,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_EXS", {
  value: 4,
  enumerable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_PX", {
  value: 5,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_PX", {
  value: 5,
  enumerable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_CM", {
  value: 6,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_CM", {
  value: 6,
  enumerable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_MM", {
  value: 7,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_MM", {
  value: 7,
  enumerable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_IN", {
  value: 8,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_IN", {
  value: 8,
  enumerable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_PT", {
  value: 9,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_PT", {
  value: 9,
  enumerable: true
});

Object.defineProperty(SVGLength, "SVG_LENGTHTYPE_PC", {
  value: 10,
  enumerable: true
});
Object.defineProperty(SVGLength.prototype, "SVG_LENGTHTYPE_PC", {
  value: 10,
  enumerable: true
});

Object.defineProperty(SVGLength.prototype, Symbol.toStringTag, {
  value: "SVGLength",
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
    throw new TypeError(`${context} is not of type 'SVGLength'.`);
  },

  create(constructorArgs, privateData) {
    let obj = Object.create(SVGLength.prototype);
    obj = this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  createImpl(constructorArgs, privateData) {
    let obj = Object.create(SVGLength.prototype);
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
  interface: SVGLength,
  expose: {
    Window: { SVGLength }
  }
}; // iface
module.exports = iface;

const Impl = require("../nodes/SVGLength-impl.js");
