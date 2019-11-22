import debug from "debug";

if (process.env.NODE_ENV == "development") {
  debug.enable("porn:*");
} else {
  debug.enable("porn:warn,porn:error");
}

export const log = debug("porn:log");
export const success = debug("porn:success");
export const warn = debug("porn:warn");
export const http = debug("porn:http");
export const error = debug("porn:error");
