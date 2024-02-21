import { STORAGE_KEY } from "../components/constants";

// Using UNION to allow for any string as well
// eslint-disable-next-line @typescript-eslint/ban-types
type Key = STORAGE_KEY | (string & {});

export const storage = {
  get: ( key: Key, defaultData?: unknown ) => {
    const data = localStorage.getItem(key) as string ?? JSON.stringify(defaultData);
    if (!data) return null;
    try {
      return JSON.parse(data)
    } catch (err) {
      return data
    }
  },
  set: ( key: Key, data: unknown ) => {
    if (!data) return
    window.dispatchEvent(new Event('storage'))
    localStorage.setItem(key, JSON.stringify(data));
  },
};