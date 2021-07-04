import "winston-daily-rotate-file";

import express from "express";
import winston from "winston";

import { getConfig } from "../config";
import { configPath } from "./path";

export function formatMessage(message: unknown) {
  if (message instanceof Error) {
    return message.message;
  }
  return typeof message === "string" ? message : JSON.stringify(message, null, 2);
}

let logger = createVaultLogger(process.env.PV_LOG_LEVEL || "info", []);

export function handleError(message: string, error: unknown, bail = false) {
  logger.error(`${message}: ${formatMessage(error)}`);
  if (error instanceof Error) {
    logger.debug(error.stack);
  }
  if (bail) {
    process.exit(1);
  }
}

function fileTransports(items: { level: string; prefix: string; silent: boolean }[]) {
  return items.map(({ level, prefix, silent }) => createFileTransport(level, prefix, silent));
}

function createFileTransport(level: string, prefix = "", silent: boolean) {
  const config = getConfig();

  return new winston.transports.DailyRotateFile({
    filename: `${prefix}pv-%DATE%`,
    datePattern: "YYYY-MM-DD-HH",
    maxSize: config.log.maxSize,
    maxFiles: config.log.maxFiles,
    level,
    extension: ".log",
    silent,
    dirname: configPath("logs"),
    auditFile: configPath("logs", `${prefix}pv_audit.json`),
  });
}

export function createVaultLogger(
  consoleLevel: string,
  files: { level: string; prefix: string; silent: boolean }[]
) {
  return winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp }) => {
        const msg = formatMessage(message);
        return `${<string>timestamp} [vault] ${level}: ${msg}`;
      })
    ),
    transports: [
      new winston.transports.Console({
        level: consoleLevel,
      }),
      ...fileTransports(files),
    ],
  });
}

export function setLogger(_logger: winston.Logger) {
  logger.debug("Setting logger");
  logger = _logger;
}

export { logger };

export function createPluginLogger(
  name: string,
  files: { level: string; prefix: string; silent: boolean }[]
) {
  const config = getConfig();
  const { level } = config.log;

  logger.debug(`Creating plugin logger: ${name}`);

  return winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp }) => {
        const msg = typeof message === "string" ? message : JSON.stringify(message, null, 2);
        return `${<string>timestamp} [plugin:${name}] ${level}: ${msg}`;
      })
    ),
    transports: [
      new winston.transports.Console({
        level,
      }),
      ...fileTransports(files),
    ],
  });
}

export const httpLog = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  // http(`${req.method} ${req.path}: ${new Date().toLocaleString()}`);
  logger.http(`${req.method} ${req.path}: ${new Date().toLocaleString()}`);
  next();
};
