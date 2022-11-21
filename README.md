# object-diff
**Usage: D**etect changes between two objects

**Context:** This function is used on our backend to detect and track changes upon database update of a resource

**Goal**

Design a **generic** function taking: 

- `source` an object of type `T` as source
- `target` an object of type `T` as target

The function should return an object where

- the keys are within `T`'s keys
- the values as objects of the shape `{old: oldValue, new: newValue}` 
corresponding to the `source[key]` for `oldValue` and `target[key]` for the `newValue` only if the value **differs** between the source and target

**Remark**

Keys should only be present in the returned record if changes occurred for that key between the source and target

**Example**
```typescript
type Data = {id: string, name?: string, count: number}

const before: Data = {id: '1', count: 0} 
const after: Data = {id: '1', name: 'khan', count: 1}

// should read {name: {old: undefined, new: 'khan'}, count: {old: 0, new: 1}}
console.log(objectDiff(before, after))
```
