import * as cache from "@actions/cache";
import * as utils from "@actions/cache/lib/internal/cacheUtils";
import { extractTar, listTar } from "@actions/cache/lib/internal/tar";
import * as core from "@actions/core";
import * as path from "path";
import {
  formatSize,
  getInputAsArray,
  getInputAsBoolean,
  newMinio,
  setCacheHitOutput,
} from "./utils";

process.on("uncaughtException", (e) => core.info("warning: " + e.message));

async function restoreCache() {
  try {
    const bucket = core.getInput("bucket", { required: true });
    const key = core.getInput("key", { required: true });
    const useFallback = getInputAsBoolean("use-fallback");
    const paths = getInputAsArray("path");
    const restoreKeys = getInputAsArray("restore-keys");

    try {
      const mc = newMinio();

      const compressionMethod = await utils.getCompressionMethod();
      const archivePath = path.join(
        await utils.createTempDirectory(),
        utils.getCacheFileName(compressionMethod)
      );

      core.debug(`downloading cache from s3 to ${archivePath}`);
      const stat = await mc.statObject(bucket, key);
      await mc.fGetObject(bucket, key, archivePath);

      if (core.isDebug()) {
        await listTar(archivePath, compressionMethod);
      }

      core.info(`Cache Size: ~${formatSize(stat.size)} MB (${stat.size} B)`);

      await extractTar(archivePath, compressionMethod);
      core.info("Cache restored from s3 successfully");
      setCacheHitOutput(true);
    } catch (e) {
      core.info("restore s3 cache failed: " + e.message);
      setCacheHitOutput(false);
      if (useFallback) {
        core.info("restore cache using fallback cache");
        await cache.restoreCache(paths, key, restoreKeys);
        setCacheHitOutput(true);
      }
    }
  } catch (e) {
    core.setFailed(e.message);
  }
}

restoreCache();
