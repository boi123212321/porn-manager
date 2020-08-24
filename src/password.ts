import express from "express";
import { readFileSync } from "fs";
import { sha512 } from "js-sha512";

import { getConfig } from "./config";
import * as logger from "./logger";

const SIGN_IN_HTML = readFileSync("./views/signin.html", "utf-8");

function validatePassword(input: string | undefined, real: string | null): boolean {
  if (!real) return true;

  if (!input) return false;

  if (sha512(input) === real) return true;

  return real === input;
}

export function checkPassword(
  req: express.Request,
  res: express.Response
): express.Response<unknown> | undefined {
  const password = (<Record<string, unknown>>req.query).password as string | undefined;

  if (!password) return res.sendStatus(400);

  const config = getConfig();

  if (validatePassword(password, config.PASSWORD)) {
    return res.json(config.PASSWORD);
  }

  res.sendStatus(401);
}

export function passwordHandler(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void | express.Response<unknown> {
  const config = getConfig();
  if (!config.PASSWORD) return next();

  if (validatePassword(<string>req.headers["x-pass"], config.PASSWORD)) {
    logger.log("Auth OK");
    return next();
  }

  const password = (<Record<string, unknown>>req.query).password as string | undefined;

  if (validatePassword(password, config.PASSWORD)) {
    logger.log("Auth OK");
    return next();
  }

  try {
    return res.status(401).send(SIGN_IN_HTML);
  } catch (err) {
    console.error(err);
  }
}
