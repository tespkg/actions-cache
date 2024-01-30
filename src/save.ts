import * as cache from "@actions/cache";
import * as utils from "@actions/cache/lib/internal/cacheUtils";
import { createTar, listTar } from "@actions/cache/lib/internal/tar";
import * as core from "@actions/core";
import * as path from "path";
import { State } from "./state";
import {
  getInputAsArray,
  isGhes,
  newMinio,
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

    const bucket = core.getInput("bucket", { required: true });
    // Inputs are re-evaluted before the post action, so we want the original key
    const key = core.getState(State.PrimaryKey);
    const useFallback = getInputAsBoolean("use-fallback");
    const paths = getInputAsArray("path");

    try {
      const mc = newMinio({
        // Inputs are re-evaluted before the post action, so we want the original keys & tokens
        accessKey: core.getState(State.AccessKey),
        secretKey: core.getState(State.SecretKey),
        sessionToken: core.getState(State.SessionToken),
        region: core.getState(State.Region),
      });

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

      const object = path.join(key, cacheFileName);

      core.info(`Uploading tar to s3. Bucket: ${bucket}, Object: ${object}`);
      await mc.fPutObject(bucket, object, archivePath, {});
      core.info("Cache saved to s3 successfully");
    } catch (e) {
      core.info("Save s3 cache failed: " + e.message);
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
    core.info("warning: " + e.message);
  }
}

saveCache();
