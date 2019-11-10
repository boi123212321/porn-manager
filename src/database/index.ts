const lowdb = require("lowdb");
import FileSync from "lowdb/adapters/FileSync";
import mkdirp from "mkdirp";
import { libraryPath } from "../types/utility";

try {
  mkdirp.sync(libraryPath("scenes/"));
  mkdirp.sync(libraryPath("images/"));
  mkdirp.sync(libraryPath("thumbnails/"));
}
catch (err) { }

const adapter = new FileSync(libraryPath("db.json"));
const database = lowdb(adapter);

database
  .defaults({
    actors: [],
    labels: [],
    scenes: [],
    images: [],
    movies: [],
    studios: []
  })
  .write()

export { database };