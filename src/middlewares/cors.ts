import express from "express";

export default function cors(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");

  // intercept OPTIONS method
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
}
