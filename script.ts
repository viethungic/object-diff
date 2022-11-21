type EqualsFunction = (
  a: unknown,
  b: unknown,
  strictCheck?: boolean,
) => boolean;

const equals: EqualsFunction = (a, b, strictCheck) => {
  return eq(a, b, [], [], strictCheck);
};

function isAsymmetric(obj: any) {
  return !!obj && isA('Function', obj.asymmetricMatch);
}

function asymmetricMatch(a: any, b: any) {
  const asymmetricA = isAsymmetric(a);
  const asymmetricB = isAsymmetric(b);

  if (asymmetricA && asymmetricB) {
    return undefined;
  }

  if (asymmetricA) {
    return a.asymmetricMatch(b);
  }

  if (asymmetricB) {
    return b.asymmetricMatch(a);
  }
}

function eq(
  a: any,
  b: any,
  aStack: Array<unknown>,
  bStack: Array<unknown>,
  strictCheck: boolean | undefined,
): boolean {
  let result = true;

  const asymmetricResult = asymmetricMatch(a, b);
  if (asymmetricResult !== undefined) {
    return asymmetricResult;
  }

  if (a instanceof Error && b instanceof Error) {
    return a.message == b.message;
  }

  if (Object.is(a, b)) {
    return true;
  }
  // A strict comparison is necessary because `null == undefined`.
  if (a === null || b === null) {
    return a === b;
  }
  const className = Object.prototype.toString.call(a);
  if (className != Object.prototype.toString.call(b)) {
    return false;
  }
  switch (className) {
    case '[object Boolean]':
    case '[object String]':
    case '[object Number]':
      if (typeof a !== typeof b) {
        // One is a primitive, one a `new Primitive()`
        return false;
      } else if (typeof a !== 'object' && typeof b !== 'object') {
        // both are proper primitives
        return Object.is(a, b);
      } else {
        // both are `new Primitive()`s
        return Object.is(a.valueOf(), b.valueOf());
      }
    case '[object Date]':
      // Coerce dates to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a == +b;
    // RegExps are compared by their source patterns and flags.
    case '[object RegExp]':
      return a.source === b.source && a.flags === b.flags;
  }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }

  // Use DOM3 method isEqualNode (IE>=9)
  if (isDomNode(a) && isDomNode(b)) {
    return a.isEqualNode(b);
  }

  // Used to detect circular references.
  let length = aStack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    // circular references at same depth are equal
    // circular reference is not equal to non-circular one
    if (aStack[length] === a) {
      return bStack[length] === b;
    } else if (bStack[length] === b) {
      return false;
    }
  }
  // Add the first object to the stack of traversed objects.
  aStack.push(a);
  bStack.push(b);
  // Recursively compare objects and arrays.
  // Compare array lengths to determine if a deep comparison is necessary.
  if (strictCheck && className == '[object Array]' && a.length !== b.length) {
    return false;
  }

  // Deep compare objects.
  const aKeys = keys(a, hasKey);
  let key;

  const bKeys = keys(b, hasKey);
  // Add keys corresponding to asymmetric matchers if they miss in non strict check mode
  if (!strictCheck) {
    for (let index = 0; index !== bKeys.length; ++index) {
      key = bKeys[index];
      if ((isAsymmetric(b[key]) || b[key] === undefined) && !hasKey(a, key)) {
        aKeys.push(key);
      }
    }
    for (let index = 0; index !== aKeys.length; ++index) {
      key = aKeys[index];
      if ((isAsymmetric(a[key]) || a[key] === undefined) && !hasKey(b, key)) {
        bKeys.push(key);
      }
    }
  }

  // Ensure that both objects contain the same number of properties before comparing deep equality.
  let size = aKeys.length;
  if (bKeys.length !== size) {
    return false;
  }

  while (size--) {
    key = aKeys[size];

    // Deep compare each member
    if (strictCheck)
      result =
        hasKey(b, key) &&
        eq(a[key], b[key], aStack, bStack, strictCheck);
    else
      result =
        (hasKey(b, key) || isAsymmetric(a[key]) || a[key] === undefined) &&
        eq(a[key], b[key], aStack, bStack, strictCheck);

    if (!result) {
      return false;
    }
  }
  // Remove the first object from the stack of traversed objects.
  aStack.pop();
  bStack.pop();

  return result;
}

function keys(obj: object, hasKey: (obj: object, key: string) => boolean) {
  const keys = [];
  for (const key in obj) {
    if (hasKey(obj, key)) {
      keys.push(key);
    }
  }
  return keys.concat(
    (Object.getOwnPropertySymbols(obj) as Array<any>).filter(
      symbol => Object.getOwnPropertyDescriptor(obj, symbol)!.enumerable,
    ),
  );
}

function hasKey(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isA<T>(typeName: string, value: unknown): value is T {
  return Object.prototype.toString.apply(value) === `[object ${typeName}]`;
}

function isDomNode(obj: any): boolean {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.nodeType === 'number' &&
    typeof obj.nodeName === 'string' &&
    typeof obj.isEqualNode === 'function'
  );
}

function uniqueArray(arr) {
  var a = [];
  for (var i=0, l=arr.length; i<l; i++)
    if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
      a.push(arr[i]);
  return a;
}
function objectDiff<T>(a: T, b: T) {
  const keys =uniqueArray([...Object.keys(a), ...Object.keys(b)]);
  console.log('keys: ', keys);
  if (equals(a, b)) {
    return {};
  } else {
    const obj = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!equals(a[key], b[key])) {
        obj[key] = {old: a[key], new: b[key]};
      }
    }

    return obj;
  }
}

type Data = { id: string, name?: string, count: number }

const before: Data = {id: '1', count: 0}
const after: Data = {id: '1', name: 'khan', count: 1}

// should read {name: {old: undefined, new: 'khan'}, count: {old: 0, new: 1}}
console.log(objectDiff(before, after))