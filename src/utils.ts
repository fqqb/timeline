export function toDate(obj: any): Date {
  if (!obj) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj;
  } else if (typeof obj === 'number') {
    return new Date(obj);
  } else if (typeof obj === 'string') {
    return new Date(Date.parse(obj));
  } else {
    throw new Error(`Cannot convert '${obj}' to Date`);
  }
}
