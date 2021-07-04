import express, { Application } from "express";

export function applyFlagRoute(app: Application): void {
  app.get("/flag/:code", (req, res) => {
    res.redirect(`/assets/flags/${req.params.code.toLowerCase()}.svg`);
  });
}

export function applyStaticRoutes(app: Application): void {
  app.use("/js", express.static("./app/dist/js"));
  app.use("/css", express.static("./app/dist/css"));
  app.use("/fonts", express.static("./app/dist/fonts"));
  app.use("/previews", express.static("./library/previews"));
  app.use("/assets", express.static("./assets"));
}
