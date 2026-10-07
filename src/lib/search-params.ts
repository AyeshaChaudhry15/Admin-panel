export type SearchParams = Record<string, string | string[] | undefined>;

type ParamValue = string | number | null | undefined;

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePage(value: string | string[] | undefined) {
  const page = Number(firstParam(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function parseOneOf<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  const param = firstParam(value);
  return allowed.find((item) => item === param);
}

export function hrefWith(
  pathname: string,
  current: SearchParams,
  patch: Record<string, ParamValue>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(current)) {
    const param = firstParam(value);
    if (param) params.set(key, param);
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "")
      params.delete(key);
    else params.set(key, String(value));
  }

  params.sort();

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
