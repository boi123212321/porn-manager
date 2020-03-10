import yargs from "yargs";
import * as logger from "./logger";

const argv = yargs.boolean("commit-import").number("index-slice-size").argv;
logger.log(argv);
export default argv;
