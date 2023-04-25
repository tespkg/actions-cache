import * as cache from "@actions/cache";
import * as utils from "@actions/cache/lib/internal/cacheUtils";
import { createTar, listTar } from "@actions/cache/lib/internal/tar";
import * as core from "@actions/core";
import * as path from "path";
import { State } from "./state";
import { Operator } from "opendal";
import axios from "axios";
import * as fs from "fs";
import {
  getInputAsArray,
  isGhes,
  isExactKeyMatch,
  getInputAsBoolean,
} from "./utils";

process.on("uncaughtException", (e) => core.info("warning: " + e.message));

async function saveCache() {
  try {
    if (isExactKeyMatch()) {
      core.info("Cache was exact key match, not saving");
      return;
    }

    const provider = core.getInput("provider", { required: true });
    const endpoint = core.getInput("endpoint");
    const bucket = core.getInput("bucket", { required: true });
    const root = core.getInput("root");
    // Inputs are re-evaluted before the post action, so we want the original key
    const key = core.getState(State.PrimaryKey);
    const useFallback = getInputAsBoolean("use-fallback");
    const paths = getInputAsArray("path");

    try {
      const op = new Operator(provider, { endpoint, bucket, root });

      const compressionMethod = await utils.getCompressionMethod();
      const cachePaths = await utils.resolvePaths(paths);
      core.debug("Cache Paths:");
      core.debug(`${JSON.stringify(cachePaths)}`);

      const archiveFolder = await utils.createTempDirectory();
      const cacheFileName = utils.getCacheFileName(compressionMethod);
      const archivePath = path.join(archiveFolder, cacheFileName);

      core.debug(`Archive Path: ${archivePath}`);

      await createTar(archiveFolder, cachePaths, compressionMethod);
      if (core.isDebug()) {
        await listTar(archivePath, compressionMethod);
      }

      const object = path.posix.join(key, cacheFileName);

      core.info(`Uploading tar to s3. Bucket: ${bucket}, root: ${root}, Object: ${object}`);
      const data = fs.createReadStream(archivePath);
      const req = await op.presignWrite(object, 600);
      core.debug(`Presigned request Method: ${req.method}, Url: ${req.url}`);
      const headers: Record<string, string> = {};
      for (const key in req.headers) {
        core.debug(`Header: ${key}: ${req.headers[key]}`);
        headers[key] = req.headers[key];
      }
      headers["Content-Length"] = fs.statSync(archivePath).size.toString();
      await axios({
        method: req.method,
        url: req.url,
        headers: headers,
        data: data,
      });
      core.info("Cache saved to s3 successfully");
    } catch (e) {
      core.info("Save s3 cache failed: " + e);
      if (useFallback) {
        if (isGhes()) {
          core.warning("Cache fallback is not supported on Github Enterpise.");
        } else {
          core.info("Saving cache using fallback");
          await cache.saveCache(paths, key);
          core.info("Save cache using fallback successfully");
        }
      } else {
        core.debug("skipped fallback cache");
      }
    }
  } catch (e) {
    core.info("warning: " + e);
  }
}

saveCache();
