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
      const cacheFileName = utils.getCacheFileName(compressionMethod);
      const archivePath = path.join(
        await utils.createTempDirectory(),
        cacheFileName
      );

      const object = path.join(key, cacheFileName);
      core.info(
        `downloading cache from s3 to ${archivePath}. bucket: ${bucket}, object: ${object}`
      );
      const stat = await mc.statObject(bucket, object);
      await mc.fGetObject(bucket, object, archivePath);

      if (core.isDebug()) {
        await listTar(archivePath, compressionMethod);
      }

      core.info(`Cache Size: ${formatSize(stat.size)} (${stat.size} bytes)`);

      await extractTar(archivePath, compressionMethod);
      setCacheHitOutput(true);
      core.info("Cache restored from s3 successfully");
    } catch (e) {
      core.info("restore s3 cache failed: " + e.message);
      setCacheHitOutput(false);
      if (useFallback) {
        core.info("restore cache using fallback cache");
        if (await cache.restoreCache(paths, key, restoreKeys)) {
          setCacheHitOutput(true);
          core.info("fallback cache restored successfully");
        }
      }
    }
  } catch (e) {
    core.setFailed(e.message);
  }
}

restoreCache();
