/*!
 * js-i18n 1.1.7
 * https://github.com/danielgindi/js-i18n
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.i18n = factory());
}(this, function () { 'use strict';

  var fails = function (exec) {
    try {
      return !!exec();
    } catch (error) {
      return true;
    }
  };

  var toString = {}.toString;

  var classofRaw = function (it) {
    return toString.call(it).slice(8, -1);
  };

  // fallback for non-array-like ES3 and non-enumerable old V8 strings


  var split = ''.split;

  var indexedObject = fails(function () {
    // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
    // eslint-disable-next-line no-prototype-builtins
    return !Object('z').propertyIsEnumerable(0);
  }) ? function (it) {
    return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
  } : Object;

  // `RequireObjectCoercible` abstract operation
  // https://tc39.github.io/ecma262/#sec-requireobjectcoercible
  var requireObjectCoercible = function (it) {
    if (it == undefined) throw TypeError("Can't call method on " + it);
    return it;
  };

  // toObject with fallback for non-array-like ES3 strings



  var toIndexedObject = function (it) {
    return indexedObject(requireObjectCoercible(it));
  };

  var ceil = Math.ceil;
  var floor = Math.floor;

  // `ToInteger` abstract operation
  // https://tc39.github.io/ecma262/#sec-tointeger
  var toInteger = function (argument) {
    return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
  };

  var min = Math.min;

  // `ToLength` abstract operation
  // https://tc39.github.io/ecma262/#sec-tolength
  var toLength = function (argument) {
    return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
  };

  var max = Math.max;
  var min$1 = Math.min;

  // Helper for a popular repeating case of the spec:
  // Let integer be ? ToInteger(index).
  // If integer < 0, let result be max((length + integer), 0); else let result be min(length, length).
  var toAbsoluteIndex = function (index, length) {
    var integer = toInteger(index);
    return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
  };

  // `Array.prototype.{ indexOf, includes }` methods implementation
  // false -> Array#indexOf
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  // true  -> Array#includes
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  var arrayIncludes = function (IS_INCLUDES) {
    return function ($this, el, fromIndex) {
      var O = toIndexedObject($this);
      var length = toLength(O.length);
      var index = toAbsoluteIndex(fromIndex, length);
      var value;
      // Array#includes uses SameValueZero equality algorithm
      // eslint-disable-next-line no-self-compare
      if (IS_INCLUDES && el != el) while (length > index) {
        value = O[index++];
        // eslint-disable-next-line no-self-compare
        if (value != value) return true;
      // Array#indexOf ignores holes, Array#includes - not
      } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
        if (O[index] === el) return IS_INCLUDES || index || 0;
      } return !IS_INCLUDES && -1;
    };
  };

  var sloppyArrayMethod = function (METHOD_NAME, argument) {
    var method = [][METHOD_NAME];
    return !method || !fails(function () {
      // eslint-disable-next-line no-useless-call,no-throw-literal
      method.call(null, argument || function () { throw 1; }, 1);
    });
  };

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var O = 'object';
  var check = function (it) {
    return it && it.Math == Math && it;
  };

  // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
  var global_1 =
    // eslint-disable-next-line no-undef
    check(typeof globalThis == O && globalThis) ||
    check(typeof window == O && window) ||
    check(typeof self == O && self) ||
    check(typeof commonjsGlobal == O && commonjsGlobal) ||
    // eslint-disable-next-line no-new-func
    Function('return this')();

  // Thank's IE8 for his funny defineProperty
  var descriptors = !fails(function () {
    return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
  });

  var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
  var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

  // Nashorn ~ JDK8 bug
  var NASHORN_BUG = nativeGetOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

  var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
    var descriptor = nativeGetOwnPropertyDescriptor(this, V);
    return !!descriptor && descriptor.enumerable;
  } : nativePropertyIsEnumerable;

  var objectPropertyIsEnumerable = {
  	f: f
  };

  var createPropertyDescriptor = function (bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };

  var isObject = function (it) {
    return typeof it === 'object' ? it !== null : typeof it === 'function';
  };

  // 7.1.1 ToPrimitive(input [, PreferredType])

  // instead of the ES6 spec version, we didn't implement @@toPrimitive case
  // and the second argument - flag - preferred type is a string
  var toPrimitive = function (it, S) {
    if (!isObject(it)) return it;
    var fn, val;
    if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
    if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
    if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
    throw TypeError("Can't convert object to primitive value");
  };

  var hasOwnProperty = {}.hasOwnProperty;

  var has = function (it, key) {
    return hasOwnProperty.call(it, key);
  };

  var document$1 = global_1.document;
  // typeof document.createElement is 'object' in old IE
  var exist = isObject(document$1) && isObject(document$1.createElement);

  var documentCreateElement = function (it) {
    return exist ? document$1.createElement(it) : {};
  };

  // Thank's IE8 for his funny defineProperty
  var ie8DomDefine = !descriptors && !fails(function () {
    return Object.defineProperty(documentCreateElement('div'), 'a', {
      get: function () { return 7; }
    }).a != 7;
  });

  var nativeGetOwnPropertyDescriptor$1 = Object.getOwnPropertyDescriptor;

  var f$1 = descriptors ? nativeGetOwnPropertyDescriptor$1 : function getOwnPropertyDescriptor(O, P) {
    O = toIndexedObject(O);
    P = toPrimitive(P, true);
    if (ie8DomDefine) try {
      return nativeGetOwnPropertyDescriptor$1(O, P);
    } catch (error) { /* empty */ }
    if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
  };

  var objectGetOwnPropertyDescriptor = {
  	f: f$1
  };

  var anObject = function (it) {
    if (!isObject(it)) {
      throw TypeError(String(it) + ' is not an object');
    } return it;
  };

  var nativeDefineProperty = Object.defineProperty;

  var f$2 = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
    anObject(O);
    P = toPrimitive(P, true);
    anObject(Attributes);
    if (ie8DomDefine) try {
      return nativeDefineProperty(O, P, Attributes);
    } catch (error) { /* empty */ }
    if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
    if ('value' in Attributes) O[P] = Attributes.value;
    return O;
  };

  var objectDefineProperty = {
  	f: f$2
  };

  var hide = descriptors ? function (object, key, value) {
    return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
  } : function (object, key, value) {
    object[key] = value;
    return object;
  };

  var setGlobal = function (key, value) {
    try {
      hide(global_1, key, value);
    } catch (error) {
      global_1[key] = value;
    } return value;
  };

  var shared = createCommonjsModule(function (module) {
  var SHARED = '__core-js_shared__';
  var store = global_1[SHARED] || setGlobal(SHARED, {});

  (module.exports = function (key, value) {
    return store[key] || (store[key] = value !== undefined ? value : {});
  })('versions', []).push({
    version: '3.1.1',
    mode: 'global',
    copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
  });
  });

  var functionToString = shared('native-function-to-string', Function.toString);

  var WeakMap = global_1.WeakMap;

  var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(functionToString.call(WeakMap));

  var id = 0;
  var postfix = Math.random();

  var uid = function (key) {
    return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + postfix).toString(36));
  };

  var shared$1 = shared('keys');


  var sharedKey = function (key) {
    return shared$1[key] || (shared$1[key] = uid(key));
  };

  var hiddenKeys = {};

  var WeakMap$1 = global_1.WeakMap;
  var set, get, has$1;

  var enforce = function (it) {
    return has$1(it) ? get(it) : set(it, {});
  };

  var getterFor = function (TYPE) {
    return function (it) {
      var state;
      if (!isObject(it) || (state = get(it)).type !== TYPE) {
        throw TypeError('Incompatible receiver, ' + TYPE + ' required');
      } return state;
    };
  };

  if (nativeWeakMap) {
    var store = new WeakMap$1();
    var wmget = store.get;
    var wmhas = store.has;
    var wmset = store.set;
    set = function (it, metadata) {
      wmset.call(store, it, metadata);
      return metadata;
    };
    get = function (it) {
      return wmget.call(store, it) || {};
    };
    has$1 = function (it) {
      return wmhas.call(store, it);
    };
  } else {
    var STATE = sharedKey('state');
    hiddenKeys[STATE] = true;
    set = function (it, metadata) {
      hide(it, STATE, metadata);
      return metadata;
    };
    get = function (it) {
      return has(it, STATE) ? it[STATE] : {};
    };
    has$1 = function (it) {
      return has(it, STATE);
    };
  }

  var internalState = {
    set: set,
    get: get,
    has: has$1,
    enforce: enforce,
    getterFor: getterFor
  };

  var redefine = createCommonjsModule(function (module) {
  var getInternalState = internalState.get;
  var enforceInternalState = internalState.enforce;
  var TEMPLATE = String(functionToString).split('toString');

  shared('inspectSource', function (it) {
    return functionToString.call(it);
  });

  (module.exports = function (O, key, value, options) {
    var unsafe = options ? !!options.unsafe : false;
    var simple = options ? !!options.enumerable : false;
    var noTargetGet = options ? !!options.noTargetGet : false;
    if (typeof value == 'function') {
      if (typeof key == 'string' && !has(value, 'name')) hide(value, 'name', key);
      enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
    }
    if (O === global_1) {
      if (simple) O[key] = value;
      else setGlobal(key, value);
      return;
    } else if (!unsafe) {
      delete O[key];
    } else if (!noTargetGet && O[key]) {
      simple = true;
    }
    if (simple) O[key] = value;
    else hide(O, key, value);
  // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
  })(Function.prototype, 'toString', function toString() {
    return typeof this == 'function' && getInternalState(this).source || functionToString.call(this);
  });
  });

  var arrayIndexOf = arrayIncludes(false);


  var objectKeysInternal = function (object, names) {
    var O = toIndexedObject(object);
    var i = 0;
    var result = [];
    var key;
    for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
    // Don't enum bug & hidden keys
    while (names.length > i) if (has(O, key = names[i++])) {
      ~arrayIndexOf(result, key) || result.push(key);
    }
    return result;
  };

  // IE8- don't enum bug keys
  var enumBugKeys = [
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf'
  ];

  // 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)

  var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

  var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
    return objectKeysInternal(O, hiddenKeys$1);
  };

  var objectGetOwnPropertyNames = {
  	f: f$3
  };

  var f$4 = Object.getOwnPropertySymbols;

  var objectGetOwnPropertySymbols = {
  	f: f$4
  };

  var Reflect = global_1.Reflect;

  // all object keys, includes non-enumerable and symbols
  var ownKeys = Reflect && Reflect.ownKeys || function ownKeys(it) {
    var keys = objectGetOwnPropertyNames.f(anObject(it));
    var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
    return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
  };

  var copyConstructorProperties = function (target, source) {
    var keys = ownKeys(source);
    var defineProperty = objectDefineProperty.f;
    var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  };

  var replacement = /#|\.prototype\./;

  var isForced = function (feature, detection) {
    var value = data[normalize(feature)];
    return value == POLYFILL ? true
      : value == NATIVE ? false
      : typeof detection == 'function' ? fails(detection)
      : !!detection;
  };

  var normalize = isForced.normalize = function (string) {
    return String(string).replace(replacement, '.').toLowerCase();
  };

  var data = isForced.data = {};
  var NATIVE = isForced.NATIVE = 'N';
  var POLYFILL = isForced.POLYFILL = 'P';

  var isForced_1 = isForced;

  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;






  /*
    options.target      - name of the target object
    options.global      - target is the global object
    options.stat        - export as static methods of target
    options.proto       - export as prototype methods of target
    options.real        - real prototype method for the `pure` version
    options.forced      - export even if the native feature is available
    options.bind        - bind methods to the target, required for the `pure` version
    options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
    options.unsafe      - use the simple assignment of property instead of delete + defineProperty
    options.sham        - add a flag to not completely full polyfills
    options.enumerable  - export as enumerable property
    options.noTargetGet - prevent calling a getter on target
  */
  var _export = function (options, source) {
    var TARGET = options.target;
    var GLOBAL = options.global;
    var STATIC = options.stat;
    var FORCED, target, key, targetProperty, sourceProperty, descriptor;
    if (GLOBAL) {
      target = global_1;
    } else if (STATIC) {
      target = global_1[TARGET] || setGlobal(TARGET, {});
    } else {
      target = (global_1[TARGET] || {}).prototype;
    }
    if (target) for (key in source) {
      sourceProperty = source[key];
      if (options.noTargetGet) {
        descriptor = getOwnPropertyDescriptor(target, key);
        targetProperty = descriptor && descriptor.value;
      } else targetProperty = target[key];
      FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
      // contained in target
      if (!FORCED && targetProperty !== undefined) {
        if (typeof sourceProperty === typeof targetProperty) continue;
        copyConstructorProperties(sourceProperty, targetProperty);
      }
      // add a flag to not completely full polyfills
      if (options.sham || (targetProperty && targetProperty.sham)) {
        hide(sourceProperty, 'sham', true);
      }
      // extend global
      redefine(target, key, sourceProperty, options);
    }
  };

  var internalIndexOf = arrayIncludes(false);
  var nativeIndexOf = [].indexOf;

  var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0;
  var SLOPPY_METHOD = sloppyArrayMethod('indexOf');

  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  _export({ target: 'Array', proto: true, forced: NEGATIVE_ZERO || SLOPPY_METHOD }, {
    indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
      return NEGATIVE_ZERO
        // convert -0 to +0
        ? nativeIndexOf.apply(this, arguments) || 0
        : internalIndexOf(this, searchElement, arguments[1]);
    }
  });

  var nativeLastIndexOf = [].lastIndexOf;

  var NEGATIVE_ZERO$1 = !!nativeLastIndexOf && 1 / [1].lastIndexOf(1, -0) < 0;
  var SLOPPY_METHOD$1 = sloppyArrayMethod('lastIndexOf');

  // `Array.prototype.lastIndexOf` method implementation
  // https://tc39.github.io/ecma262/#sec-array.prototype.lastindexof
  var arrayLastIndexOf = (NEGATIVE_ZERO$1 || SLOPPY_METHOD$1) ? function lastIndexOf(searchElement /* , fromIndex = @[*-1] */) {
    // convert -0 to +0
    if (NEGATIVE_ZERO$1) return nativeLastIndexOf.apply(this, arguments) || 0;
    var O = toIndexedObject(this);
    var length = toLength(O.length);
    var index = length - 1;
    if (arguments.length > 1) index = Math.min(index, toInteger(arguments[1]));
    if (index < 0) index = length + index;
    for (;index >= 0; index--) if (index in O) if (O[index] === searchElement) return index || 0;
    return -1;
  } : nativeLastIndexOf;

  // `Array.prototype.lastIndexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.lastindexof
  _export({ target: 'Array', proto: true, forced: arrayLastIndexOf !== [].lastIndexOf }, {
    lastIndexOf: arrayLastIndexOf
  });

  // `IsArray` abstract operation
  // https://tc39.github.io/ecma262/#sec-isarray
  var isArray = Array.isArray || function isArray(arg) {
    return classofRaw(arg) == 'Array';
  };

  var createProperty = function (object, key, value) {
    var propertyKey = toPrimitive(key);
    if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
    else object[propertyKey] = value;
  };

  var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
    // Chrome 38 Symbol has incorrect toString conversion
    // eslint-disable-next-line no-undef
    return !String(Symbol());
  });

  var store$1 = shared('wks');

  var Symbol$1 = global_1.Symbol;


  var wellKnownSymbol = function (name) {
    return store$1[name] || (store$1[name] = nativeSymbol && Symbol$1[name]
      || (nativeSymbol ? Symbol$1 : uid)('Symbol.' + name));
  };

  var SPECIES = wellKnownSymbol('species');

  var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
    return !fails(function () {
      var array = [];
      var constructor = array.constructor = {};
      constructor[SPECIES] = function () {
        return { foo: 1 };
      };
      return array[METHOD_NAME](Boolean).foo !== 1;
    });
  };

  var SPECIES$1 = wellKnownSymbol('species');
  var nativeSlice = [].slice;
  var max$1 = Math.max;

  var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('slice');

  // `Array.prototype.slice` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.slice
  // fallback for not array-like ES3 strings and DOM objects
  _export({ target: 'Array', proto: true, forced: !SPECIES_SUPPORT }, {
    slice: function slice(start, end) {
      var O = toIndexedObject(this);
      var length = toLength(O.length);
      var k = toAbsoluteIndex(start, length);
      var fin = toAbsoluteIndex(end === undefined ? length : end, length);
      // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
      var Constructor, result, n;
      if (isArray(O)) {
        Constructor = O.constructor;
        // cross-realm fallback
        if (typeof Constructor == 'function' && (Constructor === Array || isArray(Constructor.prototype))) {
          Constructor = undefined;
        } else if (isObject(Constructor)) {
          Constructor = Constructor[SPECIES$1];
          if (Constructor === null) Constructor = undefined;
        }
        if (Constructor === Array || Constructor === undefined) {
          return nativeSlice.call(O, k, fin);
        }
      }
      result = new (Constructor === undefined ? Array : Constructor)(max$1(fin - k, 0));
      for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);
      result.length = n;
      return result;
    }
  });

  // `ToObject` abstract operation
  // https://tc39.github.io/ecma262/#sec-toobject
  var toObject = function (argument) {
    return Object(requireObjectCoercible(argument));
  };

  var SPECIES$2 = wellKnownSymbol('species');

  // `ArraySpeciesCreate` abstract operation
  // https://tc39.github.io/ecma262/#sec-arrayspeciescreate
  var arraySpeciesCreate = function (originalArray, length) {
    var C;
    if (isArray(originalArray)) {
      C = originalArray.constructor;
      // cross-realm fallback
      if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
      else if (isObject(C)) {
        C = C[SPECIES$2];
        if (C === null) C = undefined;
      }
    } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
  };

  var max$2 = Math.max;
  var min$2 = Math.min;
  var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
  var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

  var SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('splice');

  // `Array.prototype.splice` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.splice
  // with adding support of @@species
  _export({ target: 'Array', proto: true, forced: !SPECIES_SUPPORT$1 }, {
    splice: function splice(start, deleteCount /* , ...items */) {
      var O = toObject(this);
      var len = toLength(O.length);
      var actualStart = toAbsoluteIndex(start, len);
      var argumentsLength = arguments.length;
      var insertCount, actualDeleteCount, A, k, from, to;
      if (argumentsLength === 0) {
        insertCount = actualDeleteCount = 0;
      } else if (argumentsLength === 1) {
        insertCount = 0;
        actualDeleteCount = len - actualStart;
      } else {
        insertCount = argumentsLength - 2;
        actualDeleteCount = min$2(max$2(toInteger(deleteCount), 0), len - actualStart);
      }
      if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER) {
        throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
      }
      A = arraySpeciesCreate(O, actualDeleteCount);
      for (k = 0; k < actualDeleteCount; k++) {
        from = actualStart + k;
        if (from in O) createProperty(A, k, O[from]);
      }
      A.length = actualDeleteCount;
      if (insertCount < actualDeleteCount) {
        for (k = actualStart; k < len - actualDeleteCount; k++) {
          from = k + actualDeleteCount;
          to = k + insertCount;
          if (from in O) O[to] = O[from];
          else delete O[to];
        }
        for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
      } else if (insertCount > actualDeleteCount) {
        for (k = len - actualDeleteCount; k > actualStart; k--) {
          from = k + actualDeleteCount - 1;
          to = k + insertCount - 1;
          if (from in O) O[to] = O[from];
          else delete O[to];
        }
      }
      for (k = 0; k < insertCount; k++) {
        O[k + actualStart] = arguments[k + 2];
      }
      O.length = len - actualDeleteCount + insertCount;
      return A;
    }
  });

  var DatePrototype = Date.prototype;
  var INVALID_DATE = 'Invalid Date';
  var TO_STRING = 'toString';
  var nativeDateToString = DatePrototype[TO_STRING];
  var getTime = DatePrototype.getTime;

  // `Date.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-date.prototype.tostring
  if (new Date(NaN) + '' != INVALID_DATE) {
    redefine(DatePrototype, TO_STRING, function toString() {
      var value = getTime.call(this);
      // eslint-disable-next-line no-self-compare
      return value === value ? nativeDateToString.call(this) : INVALID_DATE;
    });
  }

  var TO_STRING_TAG = wellKnownSymbol('toStringTag');
  // ES3 wrong here
  var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

  // fallback for IE11 Script Access Denied error
  var tryGet = function (it, key) {
    try {
      return it[key];
    } catch (error) { /* empty */ }
  };

  // getting tag from ES6+ `Object.prototype.toString`
  var classof = function (it) {
    var O, tag, result;
    return it === undefined ? 'Undefined' : it === null ? 'Null'
      // @@toStringTag case
      : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG)) == 'string' ? tag
      // builtinTag case
      : CORRECT_ARGUMENTS ? classofRaw(O)
      // ES3 arguments fallback
      : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
  };

  var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
  var test = {};

  test[TO_STRING_TAG$1] = 'z';

  // `Object.prototype.toString` method implementation
  // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
  var objectToString = String(test) !== '[object z]' ? function toString() {
    return '[object ' + classof(this) + ']';
  } : test.toString;

  var ObjectPrototype = Object.prototype;

  // `Object.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
  if (objectToString !== ObjectPrototype.toString) {
    redefine(ObjectPrototype, 'toString', objectToString, { unsafe: true });
  }

  // a string of all valid unicode whitespaces
  // eslint-disable-next-line max-len
  var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

  var whitespace = '[' + whitespaces + ']';
  var ltrim = RegExp('^' + whitespace + whitespace + '*');
  var rtrim = RegExp(whitespace + whitespace + '*$');

  // 1 -> String#trimStart
  // 2 -> String#trimEnd
  // 3 -> String#trim
  var stringTrim = function (string, TYPE) {
    string = String(requireObjectCoercible(string));
    if (TYPE & 1) string = string.replace(ltrim, '');
    if (TYPE & 2) string = string.replace(rtrim, '');
    return string;
  };

  var nativeParseFloat = global_1.parseFloat;


  var FORCED = 1 / nativeParseFloat(whitespaces + '-0') !== -Infinity;

  var _parseFloat = FORCED ? function parseFloat(str) {
    var string = stringTrim(String(str), 3);
    var result = nativeParseFloat(string);
    return result === 0 && string.charAt(0) == '-' ? -0 : result;
  } : nativeParseFloat;

  // `parseFloat` method
  // https://tc39.github.io/ecma262/#sec-parsefloat-string
  _export({ global: true, forced: parseFloat != _parseFloat }, {
    parseFloat: _parseFloat
  });

  var nativeParseInt = global_1.parseInt;


  var hex = /^[+-]?0[Xx]/;
  var FORCED$1 = nativeParseInt(whitespaces + '08') !== 8 || nativeParseInt(whitespaces + '0x16') !== 22;

  var _parseInt = FORCED$1 ? function parseInt(str, radix) {
    var string = stringTrim(String(str), 3);
    return nativeParseInt(string, (radix >>> 0) || (hex.test(string) ? 16 : 10));
  } : nativeParseInt;

  // `parseInt` method
  // https://tc39.github.io/ecma262/#sec-parseint-string-radix
  _export({ global: true, forced: parseInt != _parseInt }, {
    parseInt: _parseInt
  });

  var validateSetPrototypeOfArguments = function (O, proto) {
    anObject(O);
    if (!isObject(proto) && proto !== null) {
      throw TypeError("Can't set " + String(proto) + ' as a prototype');
    }
  };

  // Works with __proto__ only. Old v8 can't work with null proto objects.
  /* eslint-disable no-proto */


  var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
    var correctSetter = false;
    var test = {};
    var setter;
    try {
      setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
      setter.call(test, []);
      correctSetter = test instanceof Array;
    } catch (error) { /* empty */ }
    return function setPrototypeOf(O, proto) {
      validateSetPrototypeOfArguments(O, proto);
      if (correctSetter) setter.call(O, proto);
      else O.__proto__ = proto;
      return O;
    };
  }() : undefined);

  var inheritIfRequired = function (that, target, C) {
    var S = target.constructor;
    var P;
    if (S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && isObject(P) && objectSetPrototypeOf) {
      objectSetPrototypeOf(that, P);
    } return that;
  };

  var MATCH = wellKnownSymbol('match');

  // `IsRegExp` abstract operation
  // https://tc39.github.io/ecma262/#sec-isregexp
  var isRegexp = function (it) {
    var isRegExp;
    return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classofRaw(it) == 'RegExp');
  };

  // `RegExp.prototype.flags` getter implementation
  // https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
  var regexpFlags = function () {
    var that = anObject(this);
    var result = '';
    if (that.global) result += 'g';
    if (that.ignoreCase) result += 'i';
    if (that.multiline) result += 'm';
    if (that.unicode) result += 'u';
    if (that.sticky) result += 'y';
    return result;
  };

  var path = global_1;

  var aFunction = function (variable) {
    return typeof variable == 'function' ? variable : undefined;
  };

  var getBuiltIn = function (namespace, method) {
    return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
      : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
  };

  var SPECIES$3 = wellKnownSymbol('species');

  var setSpecies = function (CONSTRUCTOR_NAME) {
    var C = getBuiltIn(CONSTRUCTOR_NAME);
    var defineProperty = objectDefineProperty.f;
    if (descriptors && C && !C[SPECIES$3]) defineProperty(C, SPECIES$3, {
      configurable: true,
      get: function () { return this; }
    });
  };

  var MATCH$1 = wellKnownSymbol('match');



  var defineProperty = objectDefineProperty.f;
  var getOwnPropertyNames = objectGetOwnPropertyNames.f;




  var NativeRegExp = global_1.RegExp;
  var RegExpPrototype = NativeRegExp.prototype;
  var re1 = /a/g;
  var re2 = /a/g;

  // "new" should create a new object, old webkit bug
  var CORRECT_NEW = new NativeRegExp(re1) !== re1;

  var FORCED$2 = isForced_1('RegExp', descriptors && (!CORRECT_NEW || fails(function () {
    re2[MATCH$1] = false;
    // RegExp constructor can alter flags and IsRegExp works correct with @@match
    return NativeRegExp(re1) != re1 || NativeRegExp(re2) == re2 || NativeRegExp(re1, 'i') != '/a/i';
  })));

  // `RegExp` constructor
  // https://tc39.github.io/ecma262/#sec-regexp-constructor
  if (FORCED$2) {
    var RegExpWrapper = function RegExp(pattern, flags) {
      var thisIsRegExp = this instanceof RegExpWrapper;
      var patternIsRegExp = isRegexp(pattern);
      var flagsAreUndefined = flags === undefined;
      return !thisIsRegExp && patternIsRegExp && pattern.constructor === RegExpWrapper && flagsAreUndefined ? pattern
        : inheritIfRequired(CORRECT_NEW
          ? new NativeRegExp(patternIsRegExp && !flagsAreUndefined ? pattern.source : pattern, flags)
          : NativeRegExp((patternIsRegExp = pattern instanceof RegExpWrapper)
            ? pattern.source
            : pattern, patternIsRegExp && flagsAreUndefined ? regexpFlags.call(pattern) : flags)
        , thisIsRegExp ? this : RegExpPrototype, RegExpWrapper);
    };
    var proxy = function (key) {
      key in RegExpWrapper || defineProperty(RegExpWrapper, key, {
        configurable: true,
        get: function () { return NativeRegExp[key]; },
        set: function (it) { NativeRegExp[key] = it; }
      });
    };
    var keys = getOwnPropertyNames(NativeRegExp);
    var i = 0;
    while (i < keys.length) proxy(keys[i++]);
    RegExpPrototype.constructor = RegExpWrapper;
    RegExpWrapper.prototype = RegExpPrototype;
    redefine(global_1, 'RegExp', RegExpWrapper);
  }

  // https://tc39.github.io/ecma262/#sec-get-regexp-@@species
  setSpecies('RegExp');

  var nativeExec = RegExp.prototype.exec;
  // This always refers to the native implementation, because the
  // String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
  // which loads this file before patching the method.
  var nativeReplace = String.prototype.replace;

  var patchedExec = nativeExec;

  var UPDATES_LAST_INDEX_WRONG = (function () {
    var re1 = /a/;
    var re2 = /b*/g;
    nativeExec.call(re1, 'a');
    nativeExec.call(re2, 'a');
    return re1.lastIndex !== 0 || re2.lastIndex !== 0;
  })();

  // nonparticipating capturing group, copied from es5-shim's String#split patch.
  var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

  var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED;

  if (PATCH) {
    patchedExec = function exec(str) {
      var re = this;
      var lastIndex, reCopy, match, i;

      if (NPCG_INCLUDED) {
        reCopy = new RegExp('^' + re.source + '$(?!\\s)', regexpFlags.call(re));
      }
      if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

      match = nativeExec.call(re, str);

      if (UPDATES_LAST_INDEX_WRONG && match) {
        re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
      }
      if (NPCG_INCLUDED && match && match.length > 1) {
        // Fix browsers whose `exec` methods don't consistently return `undefined`
        // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
        nativeReplace.call(match[0], reCopy, function () {
          for (i = 1; i < arguments.length - 2; i++) {
            if (arguments[i] === undefined) match[i] = undefined;
          }
        });
      }

      return match;
    };
  }

  var regexpExec = patchedExec;

  _export({ target: 'RegExp', proto: true, forced: /./.exec !== regexpExec }, {
    exec: regexpExec
  });

  var TO_STRING$1 = 'toString';
  var nativeToString = /./[TO_STRING$1];
  var RegExpPrototype$1 = RegExp.prototype;

  var NOT_GENERIC = fails(function () { return nativeToString.call({ source: 'a', flags: 'b' }) != '/a/b'; });
  // FF44- RegExp#toString has a wrong name
  var INCORRECT_NAME = nativeToString.name != TO_STRING$1;

  // `RegExp.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-regexp.prototype.tostring
  if (NOT_GENERIC || INCORRECT_NAME) {
    redefine(RegExp.prototype, TO_STRING$1, function toString() {
      var R = anObject(this);
      var p = String(R.source);
      var rf = R.flags;
      var f = String(rf === undefined && R instanceof RegExp && !('flags' in RegExpPrototype$1) ? regexpFlags.call(R) : rf);
      return '/' + p + '/' + f;
    }, { unsafe: true });
  }

  // CONVERT_TO_STRING: true  -> String#at
  // CONVERT_TO_STRING: false -> String#codePointAt
  var stringAt = function (that, pos, CONVERT_TO_STRING) {
    var S = String(requireObjectCoercible(that));
    var position = toInteger(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING ? S.charAt(position) : first
        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };

  // `AdvanceStringIndex` abstract operation
  // https://tc39.github.io/ecma262/#sec-advancestringindex
  var advanceStringIndex = function (S, index, unicode) {
    return index + (unicode ? stringAt(S, index, true).length : 1);
  };

  // `RegExpExec` abstract operation
  // https://tc39.github.io/ecma262/#sec-regexpexec
  var regexpExecAbstract = function (R, S) {
    var exec = R.exec;
    if (typeof exec === 'function') {
      var result = exec.call(R, S);
      if (typeof result !== 'object') {
        throw TypeError('RegExp exec method returned something other than an Object or null');
      }
      return result;
    }

    if (classofRaw(R) !== 'RegExp') {
      throw TypeError('RegExp#exec called on incompatible receiver');
    }

    return regexpExec.call(R, S);
  };

  var SPECIES$4 = wellKnownSymbol('species');

  var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
    // #replace needs built-in support for named groups.
    // #match works fine because it just return the exec results, even if it has
    // a "grops" property.
    var re = /./;
    re.exec = function () {
      var result = [];
      result.groups = { a: '7' };
      return result;
    };
    return ''.replace(re, '$<a>') !== '7';
  });

  // Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
  // Weex JS has frozen built-in prototypes, so use try / catch wrapper
  var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
    var re = /(?:)/;
    var originalExec = re.exec;
    re.exec = function () { return originalExec.apply(this, arguments); };
    var result = 'ab'.split(re);
    return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
  });

  var fixRegexpWellKnownSymbolLogic = function (KEY, length, exec, sham) {
    var SYMBOL = wellKnownSymbol(KEY);

    var DELEGATES_TO_SYMBOL = !fails(function () {
      // String methods call symbol-named RegEp methods
      var O = {};
      O[SYMBOL] = function () { return 7; };
      return ''[KEY](O) != 7;
    });

    var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
      // Symbol-named RegExp methods call .exec
      var execCalled = false;
      var re = /a/;
      re.exec = function () { execCalled = true; return null; };

      if (KEY === 'split') {
        // RegExp[@@split] doesn't call the regex's exec method, but first creates
        // a new one. We need to return the patched regex when creating the new one.
        re.constructor = {};
        re.constructor[SPECIES$4] = function () { return re; };
      }

      re[SYMBOL]('');
      return !execCalled;
    });

    if (
      !DELEGATES_TO_SYMBOL ||
      !DELEGATES_TO_EXEC ||
      (KEY === 'replace' && !REPLACE_SUPPORTS_NAMED_GROUPS) ||
      (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
    ) {
      var nativeRegExpMethod = /./[SYMBOL];
      var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
        if (regexp.exec === regexpExec) {
          if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
            // The native String method already delegates to @@method (this
            // polyfilled function), leasing to infinite recursion.
            // We avoid it by directly calling the native @@method method.
            return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
          }
          return { done: true, value: nativeMethod.call(str, regexp, arg2) };
        }
        return { done: false };
      });
      var stringMethod = methods[0];
      var regexMethod = methods[1];

      redefine(String.prototype, KEY, stringMethod);
      redefine(RegExp.prototype, SYMBOL, length == 2
        // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
        // 21.2.5.11 RegExp.prototype[@@split](string, limit)
        ? function (string, arg) { return regexMethod.call(string, this, arg); }
        // 21.2.5.6 RegExp.prototype[@@match](string)
        // 21.2.5.9 RegExp.prototype[@@search](string)
        : function (string) { return regexMethod.call(string, this); }
      );
      if (sham) hide(RegExp.prototype[SYMBOL], 'sham', true);
    }
  };

  // @@match logic
  fixRegexpWellKnownSymbolLogic(
    'match',
    1,
    function (MATCH, nativeMatch, maybeCallNative) {
      return [
        // `String.prototype.match` method
        // https://tc39.github.io/ecma262/#sec-string.prototype.match
        function match(regexp) {
          var O = requireObjectCoercible(this);
          var matcher = regexp == undefined ? undefined : regexp[MATCH];
          return matcher !== undefined ? matcher.call(regexp, O) : new RegExp(regexp)[MATCH](String(O));
        },
        // `RegExp.prototype[@@match]` method
        // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@match
        function (regexp) {
          var res = maybeCallNative(nativeMatch, regexp, this);
          if (res.done) return res.value;

          var rx = anObject(regexp);
          var S = String(this);

          if (!rx.global) return regexpExecAbstract(rx, S);

          var fullUnicode = rx.unicode;
          rx.lastIndex = 0;
          var A = [];
          var n = 0;
          var result;
          while ((result = regexpExecAbstract(rx, S)) !== null) {
            var matchStr = String(result[0]);
            A[n] = matchStr;
            if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
            n++;
          }
          return n === 0 ? null : A;
        }
      ];
    }
  );

  var max$3 = Math.max;
  var min$3 = Math.min;
  var floor$1 = Math.floor;
  var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d\d?|<[^>]*>)/g;
  var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d\d?)/g;

  var maybeToString = function (it) {
    return it === undefined ? it : String(it);
  };

  // @@replace logic
  fixRegexpWellKnownSymbolLogic(
    'replace',
    2,
    function (REPLACE, nativeReplace, maybeCallNative) {
      return [
        // `String.prototype.replace` method
        // https://tc39.github.io/ecma262/#sec-string.prototype.replace
        function replace(searchValue, replaceValue) {
          var O = requireObjectCoercible(this);
          var replacer = searchValue == undefined ? undefined : searchValue[REPLACE];
          return replacer !== undefined
            ? replacer.call(searchValue, O, replaceValue)
            : nativeReplace.call(String(O), searchValue, replaceValue);
        },
        // `RegExp.prototype[@@replace]` method
        // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
        function (regexp, replaceValue) {
          var res = maybeCallNative(nativeReplace, regexp, this, replaceValue);
          if (res.done) return res.value;

          var rx = anObject(regexp);
          var S = String(this);

          var functionalReplace = typeof replaceValue === 'function';
          if (!functionalReplace) replaceValue = String(replaceValue);

          var global = rx.global;
          if (global) {
            var fullUnicode = rx.unicode;
            rx.lastIndex = 0;
          }
          var results = [];
          while (true) {
            var result = regexpExecAbstract(rx, S);
            if (result === null) break;

            results.push(result);
            if (!global) break;

            var matchStr = String(result[0]);
            if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
          }

          var accumulatedResult = '';
          var nextSourcePosition = 0;
          for (var i = 0; i < results.length; i++) {
            result = results[i];

            var matched = String(result[0]);
            var position = max$3(min$3(toInteger(result.index), S.length), 0);
            var captures = [];
            // NOTE: This is equivalent to
            //   captures = result.slice(1).map(maybeToString)
            // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
            // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
            // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
            for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
            var namedCaptures = result.groups;
            if (functionalReplace) {
              var replacerArgs = [matched].concat(captures, position, S);
              if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
              var replacement = String(replaceValue.apply(undefined, replacerArgs));
            } else {
              replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
            }
            if (position >= nextSourcePosition) {
              accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
              nextSourcePosition = position + matched.length;
            }
          }
          return accumulatedResult + S.slice(nextSourcePosition);
        }
      ];

      // https://tc39.github.io/ecma262/#sec-getsubstitution
      function getSubstitution(matched, str, position, captures, namedCaptures, replacement) {
        var tailPos = position + matched.length;
        var m = captures.length;
        var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
        if (namedCaptures !== undefined) {
          namedCaptures = toObject(namedCaptures);
          symbols = SUBSTITUTION_SYMBOLS;
        }
        return nativeReplace.call(replacement, symbols, function (match, ch) {
          var capture;
          switch (ch.charAt(0)) {
            case '$': return '$';
            case '&': return matched;
            case '`': return str.slice(0, position);
            case "'": return str.slice(tailPos);
            case '<':
              capture = namedCaptures[ch.slice(1, -1)];
              break;
            default: // \d\d?
              var n = +ch;
              if (n === 0) return match;
              if (n > m) {
                var f = floor$1(n / 10);
                if (f === 0) return match;
                if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
                return match;
              }
              capture = captures[n - 1];
          }
          return capture === undefined ? '' : capture;
        });
      }
    }
  );

  var aFunction$1 = function (it) {
    if (typeof it != 'function') {
      throw TypeError(String(it) + ' is not a function');
    } return it;
  };

  var SPECIES$5 = wellKnownSymbol('species');

  // `SpeciesConstructor` abstract operation
  // https://tc39.github.io/ecma262/#sec-speciesconstructor
  var speciesConstructor = function (O, defaultConstructor) {
    var C = anObject(O).constructor;
    var S;
    return C === undefined || (S = anObject(C)[SPECIES$5]) == undefined ? defaultConstructor : aFunction$1(S);
  };

  var arrayPush = [].push;
  var min$4 = Math.min;
  var MAX_UINT32 = 0xFFFFFFFF;

  // babel-minify transpiles RegExp('x', 'y') -> /x/y and it causes SyntaxError
  var SUPPORTS_Y = !fails(function () { return !RegExp(MAX_UINT32, 'y'); });

  // @@split logic
  fixRegexpWellKnownSymbolLogic(
    'split',
    2,
    function (SPLIT, nativeSplit, maybeCallNative) {
      var internalSplit;
      if (
        'abbc'.split(/(b)*/)[1] == 'c' ||
        'test'.split(/(?:)/, -1).length != 4 ||
        'ab'.split(/(?:ab)*/).length != 2 ||
        '.'.split(/(.?)(.?)/).length != 4 ||
        '.'.split(/()()/).length > 1 ||
        ''.split(/.?/).length
      ) {
        // based on es5-shim implementation, need to rework it
        internalSplit = function (separator, limit) {
          var string = String(requireObjectCoercible(this));
          var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
          if (lim === 0) return [];
          if (separator === undefined) return [string];
          // If `separator` is not a regex, use native split
          if (!isRegexp(separator)) {
            return nativeSplit.call(string, separator, lim);
          }
          var output = [];
          var flags = (separator.ignoreCase ? 'i' : '') +
                      (separator.multiline ? 'm' : '') +
                      (separator.unicode ? 'u' : '') +
                      (separator.sticky ? 'y' : '');
          var lastLastIndex = 0;
          // Make `global` and avoid `lastIndex` issues by working with a copy
          var separatorCopy = new RegExp(separator.source, flags + 'g');
          var match, lastIndex, lastLength;
          while (match = regexpExec.call(separatorCopy, string)) {
            lastIndex = separatorCopy.lastIndex;
            if (lastIndex > lastLastIndex) {
              output.push(string.slice(lastLastIndex, match.index));
              if (match.length > 1 && match.index < string.length) arrayPush.apply(output, match.slice(1));
              lastLength = match[0].length;
              lastLastIndex = lastIndex;
              if (output.length >= lim) break;
            }
            if (separatorCopy.lastIndex === match.index) separatorCopy.lastIndex++; // Avoid an infinite loop
          }
          if (lastLastIndex === string.length) {
            if (lastLength || !separatorCopy.test('')) output.push('');
          } else output.push(string.slice(lastLastIndex));
          return output.length > lim ? output.slice(0, lim) : output;
        };
      // Chakra, V8
      } else if ('0'.split(undefined, 0).length) {
        internalSplit = function (separator, limit) {
          return separator === undefined && limit === 0 ? [] : nativeSplit.call(this, separator, limit);
        };
      } else internalSplit = nativeSplit;

      return [
        // `String.prototype.split` method
        // https://tc39.github.io/ecma262/#sec-string.prototype.split
        function split(separator, limit) {
          var O = requireObjectCoercible(this);
          var splitter = separator == undefined ? undefined : separator[SPLIT];
          return splitter !== undefined
            ? splitter.call(separator, O, limit)
            : internalSplit.call(String(O), separator, limit);
        },
        // `RegExp.prototype[@@split]` method
        // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@split
        //
        // NOTE: This cannot be properly polyfilled in engines that don't support
        // the 'y' flag.
        function (regexp, limit) {
          var res = maybeCallNative(internalSplit, regexp, this, limit, internalSplit !== nativeSplit);
          if (res.done) return res.value;

          var rx = anObject(regexp);
          var S = String(this);
          var C = speciesConstructor(rx, RegExp);

          var unicodeMatching = rx.unicode;
          var flags = (rx.ignoreCase ? 'i' : '') +
                      (rx.multiline ? 'm' : '') +
                      (rx.unicode ? 'u' : '') +
                      (SUPPORTS_Y ? 'y' : 'g');

          // ^(? + rx + ) is needed, in combination with some S slicing, to
          // simulate the 'y' flag.
          var splitter = new C(SUPPORTS_Y ? rx : '^(?:' + rx.source + ')', flags);
          var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
          if (lim === 0) return [];
          if (S.length === 0) return regexpExecAbstract(splitter, S) === null ? [S] : [];
          var p = 0;
          var q = 0;
          var A = [];
          while (q < S.length) {
            splitter.lastIndex = SUPPORTS_Y ? q : 0;
            var z = regexpExecAbstract(splitter, SUPPORTS_Y ? S : S.slice(q));
            var e;
            if (
              z === null ||
              (e = min$4(toLength(splitter.lastIndex + (SUPPORTS_Y ? 0 : q)), S.length)) === p
            ) {
              q = advanceStringIndex(S, q, unicodeMatching);
            } else {
              A.push(S.slice(p, q));
              if (A.length === lim) return A;
              for (var i = 1; i <= z.length - 1; i++) {
                A.push(z[i]);
                if (A.length === lim) return A;
              }
              q = p = e;
            }
          }
          A.push(S.slice(p));
          return A;
        }
      ];
    },
    !SUPPORTS_Y
  );

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function extendDotted(target, data) {
    if (data == null) return;
    var dotted, targetDotted, i;
    for (var key in data) {
      if (!data.hasOwnProperty(key) || !data[key]) continue;
      dotted = key.split('.');
      targetDotted = target;
      for (i = 0; i < dotted.length - 1; i++) {
        targetDotted = targetDotted[dotted[i]];
      }
      targetDotted[dotted[dotted.length - 1]] = data[key];
    }
  }

  var ESCAPE_REGEX = /([\/()[\]?{}|*+-\\:])/g;

  function regexEscape(string) {
    return string.replace(ESCAPE_REGEX, '\\$1');
  }

  function arrayToRegex(array) {
    var regex = '';
    for (var i = 0; i < array.length; i++) {
      if (i > 0) regex += '|';
      regex += regexEscape(array[i]);
    }
    return regex;
  }

  /**
     * Pad a value with characters on the left
     * @param {string|Number} value the value to pad
     * @param {Number} length minimum length for the output
     * @param {string} ch the character to use for the padding
     * @returns {*}
     */
  function padLeft(value, length, ch) {
    value = value.toString();
    while (value.length < length) {
      value = ch + value;}
    return value;
  }

  var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
  var MAX_SAFE_INTEGER$1 = 0x1FFFFFFFFFFFFF;
  var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

  var IS_CONCAT_SPREADABLE_SUPPORT = !fails(function () {
    var array = [];
    array[IS_CONCAT_SPREADABLE] = false;
    return array.concat()[0] !== array;
  });

  var SPECIES_SUPPORT$2 = arrayMethodHasSpeciesSupport('concat');

  var isConcatSpreadable = function (O) {
    if (!isObject(O)) return false;
    var spreadable = O[IS_CONCAT_SPREADABLE];
    return spreadable !== undefined ? !!spreadable : isArray(O);
  };

  var FORCED$3 = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT$2;

  // `Array.prototype.concat` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.concat
  // with adding support of @@isConcatSpreadable and @@species
  _export({ target: 'Array', proto: true, forced: FORCED$3 }, {
    concat: function concat(arg) { // eslint-disable-line no-unused-vars
      var O = toObject(this);
      var A = arraySpeciesCreate(O, 0);
      var n = 0;
      var i, k, length, len, E;
      for (i = -1, length = arguments.length; i < length; i++) {
        E = i === -1 ? O : arguments[i];
        if (isConcatSpreadable(E)) {
          len = toLength(E.length);
          if (n + len > MAX_SAFE_INTEGER$1) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
          for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
        } else {
          if (n >= MAX_SAFE_INTEGER$1) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
          createProperty(A, n++, E);
        }
      }
      A.length = n;
      return A;
    }
  });

  function recurse(results, lower, upper, hasCase, pre) {

    var len = lower.length;
    var currenLen = pre.length;

    while (currenLen < len && !hasCase[currenLen]) {
      pre += lower[currenLen++];
    }

    if (currenLen === len) {
      return results.push(pre);
    }

    recurse(results, lower, upper, hasCase, pre + lower[currenLen]);
    recurse(results, lower, upper, hasCase, pre + upper[currenLen]);
  }

  /**
     * Generate an array of all lowercase-uppercase combinations of a given string
     * @param {string} text
     * @returns {string[]}
     */
  function generateAllCasePermutations(text) {
    text = text + '';
    if (!text) return null;

    var results = [];
    var lower = text.split('');
    var upper = [];
    var hasCase = [];

    var i = 0;
    var len = text.length;
    for (; i < len; i++) {
      lower[i] = lower[i].toLowerCase();
      upper[i] = lower[i].toUpperCase();
      hasCase[i] = upper[i] !== lower[i];
    }

    recurse(results, lower, upper, hasCase, '');

    return results;
  }

  var DATE_FORMAT_REGEX = /d{1,4}|M{1,4}|yy(?:yy)?|([HhmsTt])\1?|[LloSZ]|UTC|('[^'\\]*(?:\\.[^'\\]*)*')|("[^"\\]*(?:\\.[^"\\]*)*")|(\[[^\]\\]*(?:\\.[^\]\\]*)*])/g;
  var DATE_TIMEZONE_REGEX = /\b(?:[PMCEA][SDP]T|[a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)?(?:[-+]\d{4})?)\b/g;
  var DATE_TIMEZONE_CLIP_REGEX = /[^-+\dA-Z]/g;

  /** @typedef {{d: function, D: function, M: function, y: function, H: function, m: function, s: function, L: function, o: function, utcd: function, utc: function}} FlagMap */

  /** @type {FlagMap} */
  var DATE_FLAG_SUBMAP_LOCAL = {
    /** @param {Date} d */
    /** @returns {number} */'d': function d(_d) {return _d.getDate();},
    /** @param {Date} d */
    /** @returns {number} */'D': function D(d) {return d.getDay();},
    /** @param {Date} d */
    /** @returns {number} */'M': function M(d) {return d.getMonth();},
    /** @param {Date} d */
    /** @returns {number} */'y': function y(d) {return d.getFullYear();},
    /** @param {Date} d */
    /** @returns {number} */'H': function H(d) {return d.getHours();},
    /** @param {Date} d */
    /** @returns {number} */'m': function m(d) {return d.getMinutes();},
    /** @param {Date} d */
    /** @returns {number} */'s': function s(d) {return d.getSeconds();},
    /** @param {Date} d */
    /** @returns {number} */'L': function L(d) {return d.getMilliseconds();},
    /** @param {Date} d */
    /** @returns {number} */'o': function o(d) {return 0;},
    /** @param {Date} d */
    /** @returns {string} */'utcd': function utcd(d) {return ((d + '').match(DATE_TIMEZONE_REGEX) || ['']).pop().replace(DATE_TIMEZONE_CLIP_REGEX, '');},
    /** @param {Date} d */
    /** @returns {string} */'utc': function utc(d) {
      var z = d.getTimezoneOffset();
      var s = z > 0 ? '-' : '+';
      z = z < 0 ? -z : z;
      var zm = z % 60;
      return s + padLeft((z - zm) / 60, 2, '0') + (zm ? padLeft(zm, 2, '0') : '');
    } };


  /** @type {FlagMap} */
  var DATE_FLAG_SUBMAP_UTC = {
    /** @param {Date} d */ /** @returns {number} */'d': function d(_d2) {return _d2.getUTCDate();},
    /** @param {Date} d */ /** @returns {number} */'D': function D(d) {return d.getUTCDay();},
    /** @param {Date} d */ /** @returns {number} */'M': function M(d) {return d.getUTCMonth();},
    /** @param {Date} d */ /** @returns {number} */'y': function y(d) {return d.getUTCFullYear();},
    /** @param {Date} d */ /** @returns {number} */'H': function H(d) {return d.getUTCHours();},
    /** @param {Date} d */ /** @returns {number} */'m': function m(d) {return d.getUTCMinutes();},
    /** @param {Date} d */ /** @returns {number} */'s': function s(d) {return d.getUTCSeconds();},
    /** @param {Date} d */ /** @returns {number} */'L': function L(d) {return d.getUTCMilliseconds();},
    /** @param {Date} d */ /** @returns {number} */'o': function o(d) {return d.getTimezoneOffset();},
    /** @param {Date} d */ /** @returns {string} */'utcd': function utcd() {return "UTC";},
    /** @param {Date} d */ /** @returns {string} */'utc': function utc() {return "Z";} };


  var DATE_FLAG_MAP = {
    /** @param {FlagMap} fmap */ /** @return {string} */
    'd': function d(o, fmap) {return fmap.d(o);},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'dd': function dd(o, fmap) {return padLeft(fmap.d(o), 2, '0');},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'ddd': function ddd(o, fmap, culture) {return culture['weekdays_short'][fmap.D(o)];},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'dddd': function dddd(o, fmap, culture) {return culture['weekdays'][fmap.D(o)];},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'M': function M(o, fmap) {return fmap.M(o) + 1;},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'MM': function MM(o, fmap) {return padLeft(fmap.M(o) + 1, 2, '0');},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'MMM': function MMM(o, fmap, culture) {return culture['months_short'][fmap.M(o)];},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'MMMM': function MMMM(o, fmap, culture) {return culture['months'][fmap.M(o)];},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'yy': function yy(o, fmap) {return String(fmap.y(o)).slice(2);},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'yyyy': function yyyy(o, fmap) {return fmap.y(o);},

    /** @param {FlagMap} fmap */ /** @return {number} */
    'h': function h(o, fmap) {return fmap.H(o) % 12 || 12;},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'hh': function hh(o, fmap) {return padLeft(fmap.H(o) % 12 || 12, 2, '0');},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'H': function H(o, fmap) {return fmap.H(o);},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'HH': function HH(o, fmap) {return padLeft(fmap.H(o), 2, '0');},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'm': function m(o, fmap) {return fmap.m(o);},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'mm': function mm(o, fmap) {return padLeft(fmap.m(o), 2, '0');},

    /** @param {FlagMap} fmap */ /** @return {string} */
    's': function s(o, fmap) {return fmap.s(o);},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'ss': function ss(o, fmap) {return padLeft(fmap.s(o), 2, '0');},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'l': function l(o, fmap) {return padLeft(fmap.L(o), 3, '0');},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'L': function L(o, fmap) {
      var L = fmap.L(o);
      return padLeft(L > 99 ? Math.round(L / 10) : L, 2, '0');
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'f': function f(o, fmap) {return Math.floor(fmap.L(o) / 100).toString();},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'ff': function ff(o, fmap) {return padLeft(Math.floor(fmap.L(o) / 10), 2, '0');},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'fff': function fff(o, fmap) {return padLeft(fmap.L(o), 3, '0');},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'ffff': function ffff(o, fmap) {return padLeft(fmap.L(o), 3, '0') + '0';},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'fffff': function fffff(o, fmap) {return padLeft(fmap.L(o), 3, '0') + '00';},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'ffffff': function ffffff(o, fmap) {return padLeft(fmap.L(o), 3, '0') + '000';},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'fffffff': function fffffff(o, fmap) {return padLeft(fmap.L(o), 3, '0') + '0000';},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'F': function F(o, fmap) {
      var v = Math.floor(fmap.L(o) / 100);
      if (v === 0) return '';
      return v.toString();
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FF': function FF(o, fmap) {
      var v = Math.floor(fmap.L(o) / 10);
      if (v === 0) return '';
      return padLeft(v, 2, '0');
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FFF': function FFF(o, fmap) {
      var v = fmap.L(o);
      if (v === 0) return '';
      return padLeft(v, 3, '0');
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FFFF': function FFFF(o, fmap) {
      var v = fmap.L(o);
      if (v === 0) return '';
      return padLeft(v, 3, '0') + '0';
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FFFFF': function FFFFF(o, fmap) {
      var v = fmap.L(o);
      if (v === 0) return '';
      return padLeft(v, 3, '0') + '00';
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FFFFFF': function FFFFFF(o, fmap) {
      var v = fmap.L(o);
      if (v === 0) return '';
      return padLeft(v, 3, '0') + '000';
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'FFFFFFF': function FFFFFFF(o, fmap) {
      var v = fmap.L(o);
      if (v === 0) return '';
      return padLeft(v, 3, '0') + '0000';
    },

    't': function t(o, fmap, culture) {return fmap.H(o) < 12 ?
      culture['am_short_lower'] || 'a' :
      culture['pm_short_lower'] || 'p';},

    'tt': function tt(o, fmap, culture) {return fmap.H(o) < 12 ?
      culture['am_lower'] || 'am' :
      culture['am_lower'] || 'pm';},

    'T': function T(o, fmap, culture) {return fmap.H(o) < 12 ?
      culture['am_short_upper'] || 'A' :
      culture['pm_short_upper'] || 'P';},

    'TT': function TT(o, fmap, culture) {return fmap.H(o) < 12 ?
      culture['am_upper'] || 'AM' :
      culture['pm_upper'] || 'PM';},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'Z': function Z(o, fmap) {return fmap.utc(o);},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'UTC': function UTC(o, fmap) {return fmap.utcd(o);},

    /** @param {FlagMap} fmap */ /** @return {string} */
    'o': function o(_o, fmap) {
      _o = fmap.o(_o);
      return (_o > 0 ? "-" : "+") + padLeft(Math.floor(Math.abs(_o) / 60) * 100 + Math.abs(_o) % 60, 4, '0');
    },

    /** @param {FlagMap} fmap */ /** @return {string} */
    'S': function S(o, fmap) {
      var d = /**@type number*/fmap.d(o);
      return ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10];
    } };


  var DATE_PARSER_FORMAT_REGEX = /('[^'\\]*(?:\\.[^'\\]*)*')|("[^"\\]*(?:\\.[^"\\]*)*")|(\[[^\]\\]*(?:\\.[^\]\\]*)*])|yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|l|L|f|ff|fff|ffff|fffff|ffffff|fffffff|F|FF|FFF|FFFF|FFFFF|FFFFFF|FFFFFFF|tt|t|TT|T|Z|UTC|o|S|.+?/g;

  var DATE_PARSER_MAP = {
    'yyyy': function yyyy(c, s) {return s ? '[0-9]{4}' : '[0-9]{2}|[0-9]{4}';},
    'yy': function yy() {return '[0-9]{2}';},
    'MMMM': function MMMM(c) {return arrayToRegex(c['months']);},
    'MMM': function MMM(c) {return arrayToRegex(c['months_short']);},
    'MM': function MM(c, s) {return s ? '[0-9]{2}' : '[0-9]{1,2}';},
    'M': function M() {return '[0-9]{1,2}';},
    'dddd': function dddd(c) {return arrayToRegex(c['days']);},
    'ddd': function ddd(c) {return arrayToRegex(c['days_short']);},
    'dd': function dd(c, s) {return s ? '[0-9]{2}' : '[0-9]{1,2}';},
    'd': function d() {return '[0-9]{1,2}';},
    'HH': function HH(c, s) {return s ? '[0-9]{2}' : '[0-9]{1,2}';},
    'H': function H() {return '[0-9]{1,2}';},
    'hh': function hh(c, s) {return s ? '[0-9]{2}' : '[0-9]{1,2}';},
    'h': function h() {return '[0-9]{1,2}';},
    'mm': function mm(c, s) {return s ? '[0-9]{2}' : '[0-9]{1,2}';},
    'm': function m() {return '[0-9]{1,2}';},
    'ss': function ss(c, s) {return s ? '[0-9]{2}' : '[0-9]{1,2}';},
    's': function s() {return '[0-9]{1,2}';},
    'l': function l() {return '[0-9]{3}';},
    'L': function L() {return '[0-9]{2}';},
    'f': function f() {return '[0-9]{1}';},
    'ff': function ff() {return '[0-9]{2}';},
    'fff': function fff() {return '[0-9]{3}';},
    'ffff': function ffff() {return '[0-9]{4}';},
    'fffff': function fffff() {return '[0-9]{5}';},
    'ffffff': function ffffff() {return '[0-9]{6}';},
    'fffffff': function fffffff() {return '[0-9]{7}';},
    'F': function F() {return '[0-9]{0,1}';},
    'FF': function FF() {return '[0-9]{0,2}';},
    'FFF': function FFF() {return '[0-9]{0,3}';},
    'FFFF': function FFFF() {return '[0-9]{0,4}';},
    'FFFFF': function FFFFF() {return '[0-9]{0,5}';},
    'FFFFFF': function FFFFFF() {return '[0-9]{0,6}';},
    'FFFFFFF': function FFFFFFF() {return '[0-9]{0,7}';},
    'tt': function tt(c) {
      var am1 = c['am_lower'] || 'am';
      var pm1 = c['pm_lower'] || 'pm';
      var am2 = c['am_upper'] || 'AM';
      var pm2 = c['pm_upper'] || 'PM';

      var all = generateAllCasePermutations(am1).
      concat(generateAllCasePermutations(pm1));

      if (am1.toLowerCase() !== am2.toLowerCase()) {
        all = all.concat(generateAllCasePermutations(am2));
      }

      if (pm1.toLowerCase() !== pm2.toLowerCase()) {
        all = all.concat(generateAllCasePermutations(pm2));
      }

      return arrayToRegex(all);
    },
    't': function t(c) {
      var am1 = c['am_short_lower'] || 'a';
      var pm1 = c['pm_short_lower'] || 'p';
      var am2 = c['am_short_upper'] || 'A';
      var pm2 = c['pm_short_upper'] || 'P';

      var all = generateAllCasePermutations(am1).
      concat(generateAllCasePermutations(pm1));

      if (am1.toLowerCase() !== am2.toLowerCase()) {
        all = all.concat(generateAllCasePermutations(am2));
      }

      if (pm1.toLowerCase() !== pm2.toLowerCase()) {
        all = all.concat(generateAllCasePermutations(pm2));
      }

      return arrayToRegex(all);
    },
    'TT': function TT(c, s) {return DATE_PARSER_MAP['tt'](c, s);},
    'T': function T(c, s) {return DATE_PARSER_MAP['t'](c, s);},
    'Z': function Z() {return 'Z|(?:GMT|UTC)?[+-][0-9]{2,4}(?:\\([a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time\\))?';},
    'UTC': function UTC() {return '[+-][0-9]{2,4}';},
    'o': function o() {return '[+-][0-9]{4}';},
    'S': function S() {return 'th|st|nd|rd';} };

  // `thisNumberValue` abstract operation
  // https://tc39.github.io/ecma262/#sec-thisnumbervalue
  var thisNumberValue = function (value) {
    if (typeof value != 'number' && classofRaw(value) != 'Number') {
      throw TypeError('Incorrect invocation');
    }
    return +value;
  };

  // `String.prototype.repeat` method implementation
  // https://tc39.github.io/ecma262/#sec-string.prototype.repeat
  var stringRepeat = ''.repeat || function repeat(count) {
    var str = String(requireObjectCoercible(this));
    var result = '';
    var n = toInteger(count);
    if (n < 0 || n == Infinity) throw RangeError('Wrong number of repetitions');
    for (;n > 0; (n >>>= 1) && (str += str)) if (n & 1) result += str;
    return result;
  };

  var nativeToFixed = 1.0.toFixed;
  var floor$2 = Math.floor;
  var data$1 = [0, 0, 0, 0, 0, 0];

  var multiply = function (n, c) {
    var i = -1;
    var c2 = c;
    while (++i < 6) {
      c2 += n * data$1[i];
      data$1[i] = c2 % 1e7;
      c2 = floor$2(c2 / 1e7);
    }
  };

  var divide = function (n) {
    var i = 6;
    var c = 0;
    while (--i >= 0) {
      c += data$1[i];
      data$1[i] = floor$2(c / n);
      c = (c % n) * 1e7;
    }
  };

  var numToString = function () {
    var i = 6;
    var s = '';
    while (--i >= 0) {
      if (s !== '' || i === 0 || data$1[i] !== 0) {
        var t = String(data$1[i]);
        s = s === '' ? t : s + stringRepeat.call('0', 7 - t.length) + t;
      }
    } return s;
  };

  var pow = function (x, n, acc) {
    return n === 0 ? acc : n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc);
  };

  var log = function (x) {
    var n = 0;
    var x2 = x;
    while (x2 >= 4096) {
      n += 12;
      x2 /= 4096;
    }
    while (x2 >= 2) {
      n += 1;
      x2 /= 2;
    } return n;
  };

  // `Number.prototype.toFixed` method
  // https://tc39.github.io/ecma262/#sec-number.prototype.tofixed
  _export({ target: 'Number', proto: true, forced: nativeToFixed && (
    0.00008.toFixed(3) !== '0.000' ||
    0.9.toFixed(0) !== '1' ||
    1.255.toFixed(2) !== '1.25' ||
    1000000000000000128.0.toFixed(0) !== '1000000000000000128'
  ) || !fails(function () {
    // V8 ~ Android 4.3-
    nativeToFixed.call({});
  }) }, {
    toFixed: function toFixed(fractionDigits) {
      var x = thisNumberValue(this);
      var f = toInteger(fractionDigits);
      var s = '';
      var m = '0';
      var e, z, j, k;
      if (f < 0 || f > 20) throw RangeError('Incorrect fraction digits');
      // eslint-disable-next-line no-self-compare
      if (x != x) return 'NaN';
      if (x <= -1e21 || x >= 1e21) return String(x);
      if (x < 0) {
        s = '-';
        x = -x;
      }
      if (x > 1e-21) {
        e = log(x * pow(2, 69, 1)) - 69;
        z = e < 0 ? x * pow(2, -e, 1) : x / pow(2, e, 1);
        z *= 0x10000000000000;
        e = 52 - e;
        if (e > 0) {
          multiply(0, z);
          j = f;
          while (j >= 7) {
            multiply(1e7, 0);
            j -= 7;
          }
          multiply(pow(10, j, 1), 0);
          j = e - 1;
          while (j >= 23) {
            divide(1 << 23);
            j -= 23;
          }
          divide(1 << j);
          multiply(1, 1);
          divide(2);
          m = numToString();
        } else {
          multiply(0, z);
          multiply(1 << -e, 0);
          m = numToString() + stringRepeat.call('0', f);
        }
      }
      if (f > 0) {
        k = m.length;
        m = s + (k <= f ? '0.' + stringRepeat.call('0', f - k) + m : m.slice(0, k - f) + '.' + m.slice(k - f));
      } else {
        m = s + m;
      } return m;
    }
  });

  var DEFAULT_DECIMAL_SEPARATOR = 1.1.toLocaleString().substr(1, 1);

  var DEFAULT_THOUSANDS_SEPARATOR = 1000 .toLocaleString().length === 5 ?
  1000 .toLocaleString().substr(1, 1) :
  DEFAULT_DECIMAL_SEPARATOR === ',' ? '.' : ',';

  //const DEFAULT_DECIMAL_SEPARATOR_REGEX = new RegExp('\\' + DEFAULT_DECIMAL_SEPARATOR, 'g');

  /**
   * This will process value with printf specifier format
   * @param {*} value the value to process
   * @param {string?} specifiers the printf style specifiers. i.e. '2.5f', 'E', '#x'
   * @param {string?} decimalSign the decimal separator character to use
   * @param {string?} thousandsSign the thousands separator character to use
   * @returns {string}
   */
  function applySpecifiers(value, specifiers, decimalSign, thousandsSign) {
    if (!specifiers) return value;

    var type = specifiers[specifiers.length - 1];
    specifiers = specifiers.substr(0, specifiers.length - 1);

    var isNumeric =
    type === 'b' ||
    type === 'c' ||
    type === 'd' ||
    type === 'i' ||
    type === 'e' ||
    type === 'E' ||
    type === 'f' ||
    type === 'g' ||
    type === 'o' ||
    type === 'u' ||
    type === 'x' ||
    type === 'X';
    var isDecimalNumeric =
    type === 'e' ||
    type === 'E' ||
    type === 'f' ||
    type === 'g';
    var isUpperCase =
    type === 'E' ||
    type === 'X';

    var forceSign, spaceSign, radiiOrDecimalSign, padZero, padCount, hasThousands, precision;

    if (isNumeric) {
      if (typeof value !== 'number') {
        value = parseInt(value, 10);
      }
      if (type === 'u') {
        value = value >>> 0;
      }

      var parsedSpecifiers = specifiers.match(/(\+)?( )?(#)?(0)?([0-9]+)?(,)?(.([0-9]+))?/);
      forceSign = parsedSpecifiers[1] === '+';
      spaceSign = parsedSpecifiers[2] === ' ';
      radiiOrDecimalSign = parsedSpecifiers[3] === '#';
      padZero = parsedSpecifiers[4] === '0';
      padCount = parsedSpecifiers[5] ? parseInt(parsedSpecifiers[5], 10) : 0;
      hasThousands = parsedSpecifiers[6];
      precision = parsedSpecifiers[8];

      if (precision) {
        precision = parseInt(precision, 10);
      }

      decimalSign = decimalSign || DEFAULT_DECIMAL_SEPARATOR;
      thousandsSign = thousandsSign || DEFAULT_THOUSANDS_SEPARATOR;
    }

    if (type === 'b') {
      value = /**@type number*/value.toString(2);
    } else if (type === 'c') {
      value = String.fromCharCode(value);
    } else if (type === 'd' || type === 'i' || type === 'u') {
      value = /**@type number*/value.toString();
    } else if (type === 'e' || type === 'E') {
      value = (precision !== undefined ?
      /**@type number*/value.toExponential(parseInt(precision, 10)) :
      /**@type number*/value.toExponential()).toString();
    } else if (type === 'f') {
      value = (precision !== undefined ?
      parseFloat(value).toFixed(parseInt(precision, 10)) :
      parseFloat(value)).toString();
    } else if (type === 'g') {
      value = parseFloat(value).toString();
      if (precision !== undefined) {
        var decimalIdx = value.indexOf('.');
        if (decimalIdx > -1) {
          value = value.substr(0, decimalIdx + (precision > 0 ? 1 : 0) + precision);
        }
      }
    } else if (type === 'o') {
      value = /**@type number*/value.toString(8);
    } else if (type === 'x' || type === 'X') {
      value = /**@type number*/value.toString(16);
    } else if (type === 's') {
      value = value.toString();
      if (precision !== undefined) {
        value.substr(0, precision);
      }
    } else {
      value = value.toString();
    }

    if (type === 'd' || type === 'i' || type === 'u' || type === 'x' || type === 'x' || type === 'X' || type === 'o') {
      if (precision !== undefined) {
        if (precision === 0 && value === '0') {
          value = '';
        } else {
          value = padLeft(value, precision, '0');
        }
      }
    }

    if (value.length === 0) {
      return value;
    }

    if (isDecimalNumeric) {
      if (radiiOrDecimalSign && value.indexOf('.') === -1) {
        value += '.';
      }
      value = value.replace(/\./g, decimalSign);
    }

    if (isUpperCase) {
      value = value.toUpperCase();
    }

    if (hasThousands) {
      var decIndex = value.indexOf(decimalSign);
      if (decIndex === -1) {
        decIndex = value.length;
      }
      var signIndex = value.charAt(0) === '-' ? 1 : 0;
      if (decIndex - signIndex > 3) {
        var sepValue = '';
        var major = value.substr(signIndex, decIndex - signIndex);
        var fromIndex = 0,toIndex = major.length % 3;
        while (fromIndex < major.length) {
          if (fromIndex > 0) {
            sepValue += thousandsSign;
          }
          sepValue += major.substring(fromIndex, toIndex);
          fromIndex = toIndex;
          toIndex = fromIndex + 3;
        }
        value = (signIndex ? '-' : '') + sepValue + value.substr(decIndex);
      }
    }

    if (isNumeric) {
      var sign = (value.charAt(0) === '-' ? '-' : forceSign ? '+' : '') || (spaceSign ? ' ' : '');

      // Remove the - sign
      if (sign === '-') {
        value = value.substr(1);
      }

      var radiiSign = '';

      // Prefix with the radii sign
      if (radiiOrDecimalSign) {
        if (type === 'x' || type === 'X') {
          radiiSign = '0x';
        } else if (type === 'o') {
          radiiSign = '0';
        }
      }

      // Zero padding - should be like "0x00005" for length of 7, where the radii sign is before padding
      if (padCount && padZero) {
        value = padLeft(value, padCount - sign.length - radiiSign.length, '0');
      }

      value = sign + radiiSign + value;

      // Space padding - should be like "    0x5" for length of 7, where the radii sign is after padding
      if (padCount && !padZero) {
        value = padLeft(value, padCount, ' ');
      }
    }

    return value;
  }

  /**
                                                        *
                                                        * To add a language, call i18n.add('language-code', {translation}, {options})
                                                        * Where options takes the following keys:
                                                        * "plural": function that takes a number, and returns a key suffix for plural form of that count.
                                                        * "decimal": decimal separator character. The default is auto-detected from the browser locale
                                                        * "thousands": thousands separator character. The default is auto-detected from the browser locale
                                                        *
                                                        */

  var DEFAULT_DECIMAL_SEPARATOR$1 = 1.1.toLocaleString().substr(1, 1);
  var EMPTY_ARRAY = [];

  var activeLanguage = '';
  var fallbackLanguage = '';
  var active = null;

  var locs = {}; // Here we will keep i18n objects, each key is a language code
  var originalLocs = {}; // Here we will keep original localizations before using extendLanguage

  /**
   * The default plural form specifier.
   * This function returns a specifier for plural form, for the specified count.
   * @param {Number} count the number that we need to inspect
   * @returns {string}
   */
  var defaultPlural = function defaultPlural(count) {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'plural';
  };

  /**
      * Encodes the value {value} using the specified {encoding}
      * @param {string} value the value to encode
      * @param {string} encoding for filters
      * @returns {*}
      */
  var encodeValue = function encodeValue(value, encoding) {
    if (encoding === 'html') {
      value = (value == null ? '' : value + '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    } else
    if (encoding === 'htmll') {
      value = (value == null ? '' : value + '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/\n/g, "<br />");
    } else
    if (encoding === 'json') {
      value = JSON.stringify(value);
    } else
    if (encoding === 'url') {
      value = encodeURIComponent(value);
    } else
    if (encoding === 'lower') {
      value = (value + '').toLowerCase();
    } else
    if (encoding === 'upper') {
      value = (value + '').toUpperCase();
    } else
    if (encoding === 'upperfirst') {
      value = value + '';
      value = value[0].toUpperCase() + value.substr(1).toLowerCase();
    } else
    if (encoding.substr(0, 7) === 'printf ') {
      var localeOptions = active.options;
      value = applySpecifiers(value, encoding.substr(7), localeOptions.decimal, localeOptions.thousands);
    }

    return value;
  };

  /** @typedef i18n */
  var i18n = {

    /**
                * Add a language to the localization object
                * @public
                * @param {string} langCode language code
                * @param {Object} data localization object
                * @param {AddLanguageOptions?} options options for this language
                * @returns {i18n} self
                */
    add: function add(langCode, data, options) {
      options = options || {};

      var locOptions = {};
      locOptions.plural = options.plural || defaultPlural;
      locOptions.decimal = options.decimal || DEFAULT_DECIMAL_SEPARATOR$1;
      locOptions.thousands = options.thousands || (locOptions.decimal === ',' ? '.' : ',');
      locOptions.decimalOrThousandsRegex = new RegExp(
      '(' + regexEscape(locOptions.decimal) +
      ')|(' + regexEscape(locOptions.thousands) + ')', 'g');

      locs[langCode] = {
        code: langCode,
        data: data,
        options: locOptions };


      if (!activeLanguage) {
        activeLanguage = langCode;
        active = locs[langCode];
      }

      return this;
    },

    /**
        * Get a language object from the localization
        * @public
        * @param {string} lang language code
        * @param {boolean?} tryFallbacks should we try to search in fallback scenarios i.e. 'en' for 'en-US'
        * @returns {{ code: string, data: Object, options: Object }} language object
        */
    getLanguage: function getLanguage(lang, tryFallbacks) {
      if (tryFallbacks) {
        if (lang === 'iw') lang = 'he'; // Fallback from Google's old spec, if the setting came from an old Android device
        if (!lang) {
          lang = this.getAvailableLanguages()[0];
        }
        var found = null;
        while (typeof lang === 'string') {
          if (found = locs[lang]) break;

          var idx = lang.lastIndexOf('-');

          if (idx < 0)
          idx = lang.lastIndexOf('_');

          if (idx > 0)
          lang = lang.substr(0, idx);else
          break;
        }

        if (!found) {
          lang = this.getAvailableLanguages()[0];
          found = locs[lang];
        }

        return found;
      } else {
        return locs[lang];
      }
    },

    /**
        * Retrieve a i18n value/object
        * Accepted arguments are in the following formats:
        *  (String keypath, [Boolean original], [Object options])
        *  (String key, String key, String key, [Boolean original], [Object options])
        *  (Array keypath, [Boolean original], [Object options])
        *
        * "keypath" is the path to the localized value.
        * When the keypath is a String, each part is separated by a period.
        * When the keypath is an Array, each part is a single part in the path.
        *
        * "original" specifies whether to access the original language, if the current language was extended. Default is false.
        * "options" contains values that can be used in the localization,
        *   and possibly the "count" property which is used for plural values,
        *   or the "gender" property for selecting a gender from the target value.
        *
        * @public
        * @param {...}
        * @returns {*} localized value or object
        */
    t: function t() {
      var args = arguments;
      var argIndex = 0,
      keys,
      useOriginal = false,
      locale,
      tryFallback = true,
      options,
      i,
      len;

      // Normalize key(s)
      if (typeof args[0] === 'string' && typeof args[1] !== 'string') {
        keys = args[argIndex++];
        if (keys.length === 0) {
          keys = EMPTY_ARRAY;
        } else {
          keys = keys.split('.');
        }
      } else if (_typeof(args[0]) === 'object' && 'length' in args[0]) {
        keys = args[argIndex++];
      } else if (typeof args[0] === 'string' && typeof args[1] === 'string') {
        var arg;
        keys = [];
        for (len = args.length; argIndex < len; argIndex++) {
          arg = args[argIndex];
          if (typeof arg === 'string') {
            keys.push(arg);
          } else {
            break;
          }
        }
      }

      // `useOriginal` argument
      options = args[argIndex++];
      if (typeof options === 'boolean') {
        useOriginal = options;
        options = args[argIndex];
      }

      // Choose locale
      if (useOriginal) {
        locale = originalLocs[activeLanguage] || active;
      } else {
        locale = active;
      }

      var loc = locale.data;

      // If no key is specified, return the root namespace
      if (!keys.length) {
        return loc;
      }

      // `while` because we might try multiple times,
      // like first try with active locale, second time with fallback locale.
      while (true) {

        if (options && typeof options['count'] === 'number') {// Try for plural form

          // Loop on all of them except the last. We are going to test the last key combined with plural specifiers
          for (i = 0, len = keys.length - 1; i < len; i++) {
            loc = loc[keys[i]];

            // Avoid stepping into an undefined. Make systems more stable.
            // Anyone who queries for an invalid `t(...)` should handle the `undefined` himself.
            if (loc === undefined) {
              break;
            }
          }

          var pluralSpec = locale.options.plural;
          pluralSpec = pluralSpec(options['count']);

          var key = keys[keys.length - 1]; // This is the last key in the keys array

          if (pluralSpec && loc[key + '_' + pluralSpec]) {
            // We have a match for the plural form
            loc = loc[key + '_' + pluralSpec];
          } else {
            // Take the bare one
            loc = loc[key];
          }

        } else {
          // No need for the plural form, as no 'count' was specified

          for (i = 0, len = keys.length; i < len; i++) {
            loc = loc[keys[i]];

            // Avoid stepping into an undefined. Make systems more stable.
            // Anyone who queries for an invalid `t(...)` should handle the `undefined` himself.
            if (loc === undefined) {
              break;
            }
          }
        }

        if (loc === undefined &&
        tryFallback &&
        fallbackLanguage &&
        fallbackLanguage !== activeLanguage) {

          tryFallback = false;

          if (locs.hasOwnProperty(fallbackLanguage)) {
            locale = locs[fallbackLanguage];
            loc = locale.data;
            continue;
          }
        }

        break;
      }

      if (options) {

        if (typeof options['gender'] === 'string') {// Try for gender form

          if (_typeof(loc) === 'object' &&
          !(loc instanceof Array)) {

            var gender = options['gender'];
            var genderized;

            // Allow any gender, you can invent new ones...
            genderized = loc[gender];

            if (genderized === undefined) {

              // Fallback for male/female to m/f
              if (gender === 'male') {
                genderized = loc['m'];
              } else if (gender === 'female') {
                genderized = loc['f'];
              }

              // Fallbacks for neutral gender
              if (genderized === undefined) {
                genderized = loc['neutral'];
              }

              if (genderized === undefined) {
                genderized = loc['n'];
              }

              if (genderized === undefined) {
                genderized = loc[''];
              }

              // Default fallback

              if (genderized === undefined) {
                genderized = loc;
              }
            }

            loc = genderized;
          }

        }
      }

      // Process special value contents based on whether there are `options` provided,
      // or the value contains a special character
      if (options ||
      typeof loc === 'string' && (loc.indexOf('{') > -1 || loc.indexOf('t(') > -1)) {
        loc = i18n.processLocalizedString(loc, options);
      }

      return loc;
    },

    /**
        * Get the decimal seperator for the active locale
        * @public
        * @returns {string} decimal separator
        */
    getDecimalSeparator: function getDecimalSeparator() {
      return active.options.decimal;
    },

    /**
        * Get the thousands seperator for the active locale
        * @public
        * @returns {string} thousands separator
        */
    getThousandsSeparator: function getThousandsSeparator() {
      return active.options.thousands;
    },

    /**
        * Set current active language using a language code.
        * The function will fall back from full to two-letter ISO codes (en-US to en) and from bad Android like codes (en_US to en).
        * @public
        * @param {string} lang the language code to use
        * @returns {i18n} self
        */
    setActiveLanguage: function setActiveLanguage(lang) {
      var found = this.getLanguage(lang, true);
      active = found;
      activeLanguage = found.code;
      return this;
    },

    /**
        * Set the language code of the fallback language.
        * By default there's no fallback language, so <code>undefined</code> could be returned when a key is not localized.
        * The function will fall back from full to two-letter ISO codes (en-US to en) and from bad Android like codes (en_US to en).
        * Note: For performance reasons, the fallback happens only if <code>setFallbackLanguage(...)</code> is called when all languages are already added. Otherwise, the specified language code is used as it is.
        * @public
        * @param {string} lang the language code to use
        * @returns {i18n} self
        */
    setFallbackLanguage: function setFallbackLanguage(lang) {
      var found = this.getLanguage(lang, true);
      fallbackLanguage = found ? found.code : lang;
      return this;
    },

    /**
        * Set current active language using a language code found in the document's lang attribute or a relevant meta tag.
        * Calls setActiveLanguage to do the dirty work after detecting language code.
        * @public
        * @returns {i18n} self
        */
    setActiveLanguageFromMetaTag: function setActiveLanguageFromMetaTag() {
      var lang = document.documentElement.getAttribute('lang') || document.documentElement.getAttribute('xml:lang');
      if (!lang) {
        var metas = document.getElementsByTagName('meta');
        var i = 0,meta;
        for (; i < metas.length; i++) {
          meta = metas[i];
          if ((meta.getAttribute('http-equiv') || '').toLowerCase() === 'content-language') {
            lang = meta.getAttribute('content');
            break;
          }
        }
      }
      return this.setActiveLanguage(lang);
    },

    /**
        * Get the current active language code.
        * @public
        * @returns {string} current active language code
        */
    getActiveLanguage: function getActiveLanguage() {
      return activeLanguage;
    },

    /**
        * Get an array of the available language codes
        * @public
        * @returns {string[]} array of the available language codes
        */
    getAvailableLanguages: function getAvailableLanguages() {
      var langs = [];
      for (var key in locs) {
        if (!locs.hasOwnProperty(key)) continue;
        langs.push(key);
      }
      return langs;
    },

    /**
        * Extend a specific language with data from a localized object.
        * In order to allow easy storage and retrieval of extensions from DBs, the extension data is built with
        *   dotted syntax instead of a hieararchy of objects. i.e {"parent.child": "value"}
        * @public
        * @param {string} lang language code
        * @param {Object} data localization object
        * @returns {i18n} self
        */
    extendLanguage: function extendLanguage(lang, data) {
      try {
        if (locs[lang]) {
          if (!originalLocs[lang]) {// Back it up first
            originalLocs[lang] = JSON.parse(JSON.stringify(locs[lang]));
          }
          extendDotted(locs[lang].data, data);
        }
      } catch (e) {}
      return this;
    },

    /**
        * Extend the entire languages array, with the help of the extendLanguage function.
        * @public
        * @param {Object} data the localization extension object. each language as the key and extension object as the value.
        * @returns {i18n} self
        */
    extendLanguages: function extendLanguages(data) {
      try {
        for (var lang in data) {
          if (!data.hasOwnProperty(lang)) continue;
          if (locs[lang]) {
            if (!originalLocs[lang]) {// Back it up first
              originalLocs[lang] = JSON.parse(JSON.stringify(locs[lang]));
            }
            extendDotted(locs[lang].data, data[lang]);
          }
        }
      } catch (e) {}
      return this;
    },

    /**
        * Retrieve a localized string of a physical file size, assuming that the "size_abbrs" key is available.
        * @public
        * @param {number} bytes the number of bytes
        * @returns {LocalizedPhysicalFileSize} localized size
        */
    physicalSize: function physicalSize(bytes) {
      var ret;
      var loc = i18n.t('size_abbrs');
      if (bytes < 100) ret = { size: bytes, name: loc['b'] };else
      if (bytes < 101376) ret = { size: bytes / 1024.0, name: loc['kb'] };else
      if (bytes < 103809024) ret = { size: bytes / 1024.0 / 1024.0, name: loc['mb'] };else
      if (bytes < 106300440576) ret = { size: bytes / 1024.0 / 1024.0 / 1024.0, name: loc['gb'] };else
      ret = { size: bytes / 1024.0 / 1024.0 / 1024.0 / 1024.0, name: loc['tb'] };
      ret.size = Math.ceil(ret.size * 100) / 100; // Max two decimal points
      return ret;
    },

    /**
        * Format a date to a localized string, assuming that the "calendar" key is available.
        * Supports all formatting codes known to humanity.
        * @public
        * @param {Date|string|number} date The date to format
        * @param {string} format The format
        * @param {string|Object|null|?} culture Can accept a culture code, a culture object,
        *                                       or a simple "calendar" object which contains the keys "months", "months_short", "days" and "days_short"
        * @returns {string} A localized date
        */
    formatDate: function formatDate(date, format, culture) {

      if (culture && typeof culture === 'string') {
        culture = i18n.getLanguage(culture, true);

        if (culture) {
          culture = culture['calendar'];
        }
      }

      culture = culture || i18n.t('calendar') || {};

      // Passing date through Date applies Date.parse, if necessary
      if (date == null) {
        date = new Date();
      } else if (typeof date === 'string') {
        date = i18n.parseDate(date, null, culture);
      } else if (date instanceof Date) ; else if (typeof date === 'number') {
        date = new Date(date);
      } else {
        date = NaN;
      }

      if (isNaN(date)) throw new SyntaxError("invalid date");

      var utc = false;

      if (!format) {
        format = 'yyyy-MM-dd'; // ISO
      }

      // Allow setting the utc argument via the a special UTC: specifier
      if (format.substr(0, 4) === 'UTC:') {
        utc = true;
        format = format.slice(4);
      }

      // Allow setting the utc argument via the Z specifier
      if (format.charAt(format.length - 1) === 'Z') {
        utc = true;
      }

      var f = utc ? DATE_FLAG_SUBMAP_UTC : DATE_FLAG_SUBMAP_LOCAL;

      return format.replace(
      DATE_FORMAT_REGEX,
      function (token) {return token in DATE_FLAG_MAP ?
        DATE_FLAG_MAP[token](date, f, culture) :
        token.slice(1, token.length - 1);});

    },

    /**
        * Parses a date from user input, based on a supplied format. This is the counterpart of the formatDate function.
        * Supports all formatting codes known to humanity.
        * Will automatically fall back if missing a digit i.e 1/2/34 for dd/MM/yyyy, unless `strict` is specified.
        * Forgiving behavior with "incorrect" separators, i.e 01.05 instead of 01/05, unless `strict` is specified.
        * If year is missing, it will default to current year. Anything else will default to zero.
        *
        * This function actually uses the `createDateParser(...)` function, and caches the result.
        * @public
        * @expose
        * @param {string} date The date to parse
        * @param {string?} format The format. Defaults to UTC ISO. (yyyy-MM-DD'T'HH:mm:ssZ)
        * @param {string|Object|null|?} culture Can accept a culture code, a culture object,
        *                                       or a simple "calendar" object which contains the keys "months", "months_short", "days" and "days_short"
        * @param {boolean?} strict Should the parser be strict? false by default, forgiving missing digits etc.
        * @returns {Date} The parsed date
        */
    parseDate: function parseDate(date, format, culture, strict) {

      if (culture && typeof culture === 'string') {
        culture = i18n.getLanguage(culture, true);

        if (culture) {
          culture = culture['calendar'];
        }
      }

      culture = culture || i18n.t('calendar') || {};

      if (!format) {
        if ('parse' in Date) {
          return new Date(date);
        } else {
          var parsed = this.parseDate(date, 'yyyy-MM-dd\'T\'HH:mm:ss[.FFFFFFF]Z', culture, true);
          if (isNaN(+parsed)) parsed = this.parseDate(date, 'yyyy-MM-dd', culture, true);
          if (isNaN(+parsed)) parsed = this.parseDate(date, 'ddd, dd, MMM yyyy HH:mm:ss Z', culture, true);
          if (isNaN(+parsed)) parsed = this.parseDate(date, 'dddd, dd-MMM-yy HH:mm:ss Z', culture, true);
          if (isNaN(+parsed)) parsed = this.parseDate(date, 'ddd MMM d HH:mm:ss yyyy', culture, true);
          return parsed;
        }
      }

      var compiled = culture[strict ? '_compiledParsersE' : '_compiledParsers'];
      if (!compiled) {
        culture[strict ? '_compiledParsersE' : '_compiledParsers'] = compiled = {};
      }

      if (!compiled[format]) {
        compiled[format] = i18n.createDateParser(format, culture, strict);
      }

      return compiled[format](date, culture);
    },

    /**
        * Creates a date parser. This is generally used (and cached) by `parseDate(...)`.
        * Supports all formatting codes known to humanity.
        * Will automatically fall back if missing a digit i.e 1/2/34 for dd/MM/yyyy, unless `strict` is specified.
        * Forgiving behavior with "incorrect" separators, i.e 01.05 instead of 01/05, unless `strict` is specified.
        * If year is missing, it will default to current year. Anything else will default to zero.
        * @public
        * @expose
        * @param {string} format The format
        * @param {Object} culture An object which contains the keys "months", "months_short", "days" and "days_short"
        * @param {boolean} strict Should the parser be strict? false by default, forgiving missing digits etc.
        * @returns {function(string):Date} The parser function
        */
    createDateParser: function createDateParser(format, culture, strict) {

      var regex = '';
      var regexParts = [];

      var processFormat = function processFormat(format) {
        var formatParts = format.match(DATE_PARSER_FORMAT_REGEX);

        var i, count, part, shouldStrict;

        // Remove all empty groups
        for (i = 0, count = formatParts.length; i < count; i++) {
          if (formatParts[i].length === 0 || formatParts[i] === '[]') {
            formatParts.splice(i, 1);
            i--;
            count--;
          }
        }

        // Go over all parts in the format, and create the parser regex part by part
        for (i = 0, count = formatParts.length; i < count; i++) {
          part = formatParts[i];
          if (part[0] === '[' && part[part.length - 1] === ']') {
            regex += '(?:';
            processFormat(part.substr(1, part.length - 2));
            regex += ')?';
          } else if (DATE_PARSER_MAP.hasOwnProperty(part)) {
            // An actually recognized part
            shouldStrict = strict || // We are specifically instructed to use strict mode
            i > 0 && DATE_PARSER_MAP.hasOwnProperty(formatParts[i - 1]) || // Previous part is not some kind of a boundary
            i < count - 1 && DATE_PARSER_MAP.hasOwnProperty(formatParts[i + 1]); // Next part is not some kind of a boundary

            regex += '(' + DATE_PARSER_MAP[part](culture, shouldStrict) + ')';
            regexParts.push(part);
          } else {
            // A free text node

            // Remove enclosing quotes if there are...
            if (part[0] === "'") {
              part = part.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/, '$1');
            } else if (part[0] === '"') {
              part = part.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/, '$1');
            }

            part = part.replace(/\\\\/g, '\\'); // Unescape
            if (!strict && (part === '/' || part === '.' || part === '-')) {
              regex += '([/\\.-])';
            } else {
              regex += '(' + regexEscape(part) + ')';
            }
            regexParts.push('');
          }
        }
      };

      processFormat(format);

      regex = new RegExp('^' + regex + '$');

      // This is for calculating which side to go for 2 digit years
      var baseYear = Math.floor(new Date().getFullYear() / 100) * 100;

      // Return a parser function
      return function (date) {
        date = date + '';
        var parts = date.match(regex);
        if (!parts) return null;

        parts.splice(0, 1); // Remove main capture group 0

        var now = new Date(),
        nowYear = now.getFullYear();
        var year = null,month = null,day = null,
        hours = null,hours12 = false,hoursTT,minutes = null,
        seconds = null,milliseconds = null,
        timezone = null;

        var i = 0;
        var len = parts.length;
        var part, tmp;
        for (; i < len; i++) {
          part = parts[i];
          switch (regexParts[i]) {
            case 'yyyy':
            case 'yy':
              year = parseInt(part, 10);
              if (year < 100) {
                year += baseYear;
                if (year - nowYear > 50) {
                  year -= 100;
                } else if (nowYear - year > 50) {
                  year += 100;
                }
              }
              break;

            case 'MMMM':
              tmp = culture['months'].indexOf(part);
              if (tmp > -1) month = tmp;
              break;

            case 'MMM':
              tmp = culture['months_short'].indexOf(part);
              if (tmp > -1) month = tmp;
              break;

            case 'MM':
            case 'M':
              month = parseInt(part, 10) - 1;
              break;

            case 'dddd':
              tmp = culture['days'].indexOf(part);
              if (tmp > -1) day = tmp;
              break;

            case 'ddd':
              tmp = culture['days_short'].indexOf(part);
              if (tmp > -1) day = tmp;
              break;

            case 'dd':
            case 'd':
              day = parseInt(part, 10);
              break;

            case 'HH':
            case 'H':
              hours = parseInt(part, 10);
              hours12 = false;
              break;

            case 'hh':
            case 'h':
              hours = parseInt(part, 10);
              hours12 = true;
              break;

            case 'mm':
            case 'm':
              minutes = parseInt(part, 10);
              break;

            case 'ss':
            case 's':
              seconds = parseInt(part, 10);
              break;

            case 'l':
              milliseconds = parseInt(part, 10);
              break;

            case 'L':
              milliseconds = parseInt(part, 10);
              if (milliseconds < 10) {
                milliseconds *= 100;
              } else {
                milliseconds *= 10;
              }
              break;

            case 'f':
            case 'ff':
            case 'fff':
            case 'ffff':
            case 'fffff':
            case 'ffffff':
            case 'fffffff':
            case 'F':
            case 'FF':
            case 'FFF':
            case 'FFFF':
            case 'FFFFF':
            case 'FFFFFF':
            case 'FFFFFFF':
              if (part.length > 3) {
                part = part.substr(0, 3) + '.' + part.substr(3);
              } else if (part.length < 3) {
                while (part.length < 3) {
                  part += '0';
                }
              }
              milliseconds = parseFloat(part);
              break;

            case 'tt':
            case 't':
            case 'TT':
            case 'T':
              if (hours12) {
                hoursTT = part.toLowerCase();
              }
              break;

            case 'Z':
            case 'UTC':
            case 'o':
              var tz = part.match(/(Z)|(?:GMT|UTC)?([+-][0-9]{2,4})(?:\([a-zA-Z ]+ (?:Standard|Daylight|Prevailing) Time\))?/);
              if (tz[1] === 'Z') {
                timezone = 0;
              } else if (tz[2]) {
                timezone = (parseInt(tz[2].substr(1, 2), 10) || 0) * 60 + (parseInt(tz[2].substr(3), 10) || 0);
                if (tz[2].charAt(0) === '-') {
                  timezone = -timezone;
                }
              }
              break;}

        }

        if (year === null) year = now.getFullYear();
        if (month === null) month = now.getMonth();
        if (day === null) day = 1;
        if (hours12) {
          if (hoursTT === (culture['am_lower'] || 'am').toLowerCase() ||
          hoursTT === (culture['am_short_lower'] || 'a').toLowerCase()) {
            if (hours === 12) hours = 0;
          } else if (hoursTT === (culture['pm_lower'] || 'pm').toLowerCase() ||
          hoursTT === (culture['pm_short_lower'] || 'p').toLowerCase()) {
            if (hours < 12) hours += 12;
          }
        }
        var parsedDate = new Date(year, month, day, hours || 0, minutes || 0, seconds || 0, milliseconds || 0);
        if (timezone !== null) {
          timezone += parsedDate.getTimezoneOffset();
        }
        parsedDate.setMinutes(parsedDate.getMinutes() - timezone);

        return parsedDate;
      };
    },

    /**
        * Try to detect, based on the browser's localization, which is the short date format appropriate.
        * So allegedly, a US user will have MM/dd/yyyy and GB will have d/MM/yyyy.
        * Currently browsers do not seem to behave and use the correct formats of the OS!
        * @public
        * @expose
        * @param {string} fallback a fallback date for a case where the browser does not support this functionality.
        * @returns {string} the detected format, the fallback, or dd/MM/yyyy as default.
        */
    detectShortDateFormat: function detectShortDateFormat(fallback) {
      if (!Date.prototype.toLocaleDateString) return fallback || 'dd/MM/yyyy';

      return new Date(2013, 1, 1).toLocaleDateString().
      replace(/\b2013\b/, 'yyyy').replace(/\b13\b/, 'yy').
      replace(/\b02\b/, 'MM').replace(/\b2\b/, 'M').
      replace(/\b01\b/, 'dd').replace(/\b1\b/, 'd');
    },

    /**
        * Format a number for display using the correct decimal separator detected from the browser.
        * @public
        * @expose
        * @param {number|string|null} value the value to format.
        * @param {boolean=} thousands should we add a thousands separator
        * @returns {string} The formatted number as string.
        *                   If null or empty string is supplied, then an empty string is returned.
        *                   If a string was supplied, it is returned as-is.
        */
    displayNumber: function displayNumber(value, thousands) {
      if (value === '' || value == null) return '';
      if (typeof value === 'number') {
        value = value.toString();

        var decimalSep = active.options.decimal,
        thousandsSep = active.options.thousands;

        if (decimalSep !== '.') {
          value = value.replace(/\./g, decimalSep);
        }
        if (thousands) {
          var decIndex = value.indexOf(decimalSep);
          if (decIndex === -1) {
            decIndex = value.length;
          }
          var sign = value.charAt(0) === '-' ? 1 : 0;
          if (decIndex - sign > 3) {
            var sepValue = '';
            var major = value.substr(sign, decIndex - sign);
            var fromIndex = 0,toIndex = major.length % 3;
            while (fromIndex < major.length) {
              if (fromIndex > 0) {
                sepValue += thousandsSep;
              }
              sepValue += major.substring(fromIndex, toIndex);
              fromIndex = toIndex;
              toIndex = fromIndex + 3;
            }
            value = (sign ? '-' : '') + sepValue + value.substr(decIndex);
          }
        }
        return value;
      }
      return value.toLocaleString();
    },

    /**
        * Parses a number from user input using the correct decimal separator detected from the browser.
        *
        * By default it will behave like `parseFloat`, where thousands separators are not supported.
        * If `thousands` is `true`, then it will allow parsing with the separator.
        * @public
        * @expose
        * @param {number|string|null} value the value to parse.
        * @param {boolean?} [thousands=false] - Don't break when there are thousands separators in the value
        * @returns {number|null} The parsed number.
        *                   If null or empty string is supplied, then null is returned.
        *                   If a number was supplied, it is returned as-is.
        */
    parseNumber: function parseNumber(value, thousands) {
      if (value === '' || value == null) return null;

      if (typeof value !== 'number') {
        return parseFloat(
        value.replace(active.options.decimalOrThousandsRegex, function (g0, dec, tho) {
          if (dec) return '.';
          if (tho) return thousands ? '' : ',';
          return g0;
        }));

      }

      return value;
    },

    /**
        * Process a localized string.
        *
        * Pass 1:
        *      Look for localization value specified in the form of:
        *          {key.subkey}
        *          {key.subkey|filter|filter...}
        *
        *      Possible filters are:
        *          html
        *          htmll - multiline HTML. replaces \n with <br />
        *          json
        *          url
        *          lower
        *          upper
        *          upperfirst
        *          printf [print-specifier]
        *
        *      * `printf-specifier`s are C-style format specifiers. i.e. 2.5f
        *      * The i18n keys will receive the `data` passed to `processLocalizedString`
        *
        *      And for placeholders from the passed options, in the form of:
        *          {{count}}
        *          {{data.value|filter|filter...}}
        *
        *          etc.
        *
        * Pass 2:
        *      Look for i18n calls in the form of:
        *          t("key.path") t('key.path') t(key.path) or t("key.path", {"count": 5})
        *      Where the options part must be a valid JSON
        *      This stage is affected by previous stages (i.e placeholders can be JSON encoded for t(...) calls
        *
        * localization format is {key.path[|filter][|filter]}
        * Placeholder format is {{key.path[|filter][|filter]}}
        *
        * Printf specifiers are in this order:
        *
        *  "[+][ ][#][0][width][,][.precision]" and then one of [bcdieEfgouxXs]
        *
        * +            : Forces to precede the result with a plus or minus sign (+ or -) even for positive numbers.
        * (space)      : If no sign is going to be written, a blank space is inserted before the value.
        * #            : For o, x or X specifiers the value is prefixed with 0, 0x or 0X respectively for values different than zero.
        *                For with e, E, f, g it forces the written output to contain a decimal point even if no more digits follow
        * 0            : Left-pads the number with zeroes (0) instead of spaces when padding is specified
        * (width)      : Minimum number of characters to be printed, left-padded with spaces or zeroes.
        *                If shorter than the number, then the number is not truncated.
        * ,            : For d, i, u, f, g specifiers, adds thousand grouping characters
        * (precision)  : For integer specifiers (d, i, u, o, x, X) - specifies the minimum number of digits to be written. Does not truncate, except for 0.
        *                For e, E, f specifiers: this is the number of digits to be printed after the decimal point
        *                For g specifier: This is the maximum number of significant digits to be printed.
        *                For s: this is the maximum number of characters to be printed
        *
        * @param {string} value - the value to process
        * @param {Object?} data - the data for post processing. Passed to {...} specifiers too.
        * @returns {string} the processed value
        */
    processLocalizedString: function processLocalizedString(value, data) {

      if (typeof value !== 'string') return value;

      value = value.replace(/(\\*)(\{{1,2})([^|{}"]+)((?:\|[^|{}]+)*?)(}{1,2})/g, function () {

        var precedingBackslahes = arguments[1];
        var openingBrackets = arguments[2];
        var closingBrackets = arguments[5];

        if ((precedingBackslahes.length & 1) === 1) {
          return arguments[0].substr(precedingBackslahes.length - (precedingBackslahes.length - 1) / 2);
        }

        if (openingBrackets.length > closingBrackets.length) {
          return arguments[0];
        }

        var value;
        var key = arguments[3];
        var i, len;

        var filters = arguments[4];
        if (filters)
        filters = filters.length > 0 ? filters.split('|') : EMPTY_ARRAY;

        if (openingBrackets.length === 1) {

          /** @type string|null */
          var gender = null;
          if (filters && filters[0][0] === 'g' && filters[0][1] === ':') {
            gender = i18n.t(filters[0].substr(2));

            if (gender === 'male') {
              gender = 'm';
            } else if (gender === 'female') {
              gender = 'f';
            }
          }

          if (gender !== null) {
            value = i18n.t(key + '.' + gender);
            if (value === undefined) value = i18n.t(key + '.neutral');
            if (value === undefined) value = i18n.t(key + '.');
            if (value === undefined) value = i18n.t(key + '.m');
            if (value === undefined) value = i18n.t(key + '.f');
          } else {
            value = i18n.t(key, data);
          }

        } else {

          var keys = key.split('.');
          value = data;
          for (i = 0, len = keys.length; i < len && value; i++) {
            value = value[keys[i]];
          }
          if (value == null) {
            value = '';
          }

        }

        for (i = 0, len = filters.length; i < len; i++) {
          if (filters[i].length === 0) continue;
          value = encodeValue(value, filters[i]);
        }

        if (closingBrackets.length > openingBrackets.length) {
          value = value + closingBrackets.substr(openingBrackets.length);
        }

        return (precedingBackslahes.length ?
        precedingBackslahes.substr(precedingBackslahes.length / 2) :
        '') + value;
      });

      value = value.replace(/t\(("[^"]+?"|'[^']+?'|[^,)]+?)(?:,\s*(\{.*?}))?\)/g, function () {

        var key = arguments[1],
        options = arguments[2];
        try {
          key = JSON.parse(key);
        } catch (e) {
          return arguments[0];
        }
        if (options) {
          try {
            options = JSON.parse(options);
          } catch (e) {
            options = null;
          }
        }

        return i18n.t(key, options);

      });

      return value;

    } };

  return i18n;

}));

//# sourceMappingURL=i18n.umd.js.map