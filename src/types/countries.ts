import countries, { ICountry } from "../data/countries";

const countryMap = (() => {
  const map = {} as Record<string, ICountry>;
  countries.forEach((c) => {
    map[c.alpha2] = c;
  });
  return map;
})();

export function getNationality(str: string) {
  return countryMap[str.toUpperCase()];
}

export function isValidCountryCode(str: string) {
  return !!getNationality(str);
}
