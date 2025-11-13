export const BigIntTransformer = {
  to: (value?: bigint | number | string | null) => {
    if (value === undefined || value === null) return null;
    return value.toString();
  },
  from: (value: string | null) => {
    if (value === null || value === undefined) return BigInt(0);
    return BigInt(value);
  },
};
