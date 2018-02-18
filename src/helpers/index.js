import history from './history';

export { history as history};

export const env = ($key, $default = "") => process.env[$key] || $default;

export const getProp = ($obj, $key, $default = '-') => $obj ? $obj[$key] : $default;
