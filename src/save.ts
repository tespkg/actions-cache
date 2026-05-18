import * as core from "@actions/core";
import {
  getInputAsBoolean,
  saveCache,
} from "./utils";

process.on("uncaughtException", (e) => core.info("warning: " + e.message));

const restoreOnly = getInputAsBoolean("restore-only");

if (!restoreOnly) {
  saveCache(false);
}
