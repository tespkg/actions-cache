import * as cache from "@actions/cache";
import * as utils from "@actions/cache/lib/internal/cacheUtils";
import { createTar, listTar } from "@actions/cache/lib/internal/tar";
import * as core from "@actions/core";
import * as path from "path";
import { getInputAsArray, getInputAsBoolean, newMinio } from "./utils";

process.on("uncaughtException", (e) => core.info("warning: " + e.message));

async function saveCache() {
  try {
    const bucket = core.getInput("bucket", { required: true });
    const key = core.getInput("key", { required: true });
    const useFallback = getInputAsBoolean("use-fallback");
    const paths = getInputAsArray("path");

    try {
      const mc = newMinio();

      const compressionMethod = await utils.getCompressionMethod();
      const cachePaths = await utils.resolvePaths(paths);
      core.debug("Cache Paths:");
      core.debug(`${JSON.stringify(cachePaths)}`);

      const archiveFolder = await utils.createTempDirectory();
      const archivePath = path.join(
        archiveFolder,
        utils.getCacheFileName(compressionMethod)
      );

      core.debug(`Archive Path: ${archivePath}`);

      await createTar(archiveFolder, cachePaths, compressionMethod);
      if (core.isDebug()) {
        await listTar(archivePath, compressionMethod);
      }

      core.debug(`Uploading tar to s3. Bucket: ${bucket}, Object: ${key}`);
      await mc.fPutObject(bucket, key, archivePath, {});
      core.info("Cache saved to s3 successfully");
    } catch (e) {
      core.info("save s3 cache failed: " + e.message);
      if (useFallback) {
        core.info("save cache using fallback cache");
        await cache.saveCache(paths, key);
      }
    }
  } catch (e) {
    core.info("warning: " + e.message);
  }
}

saveCache();
