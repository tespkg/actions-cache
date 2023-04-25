import { CompressionMethod } from "@actions/cache/lib/internal/constants";
import * as utils from "@actions/cache/lib/internal/cacheUtils";
import * as core from "@actions/core";
import * as opendal from "opendal";
import { State } from "./state";

export function isGhes(): boolean {
  const ghUrl = new URL(
    process.env["GITHUB_SERVER_URL"] || "https://github.com"
  );
  return ghUrl.hostname.toUpperCase() !== "GITHUB.COM";
}

export function getInputAsBoolean(
  name: string,
  options?: core.InputOptions
): boolean {
  return core.getInput(name, options) === "true";
}

export function getInputAsArray(
  name: string,
  options?: core.InputOptions
): string[] {
  return core
    .getInput(name, options)
    .split("\n")
    .map((s) => s.trim())
    .filter((x) => x !== "");
}

export function getInputAsInt(
  name: string,
  options?: core.InputOptions
): number | undefined {
  const value = parseInt(core.getInput(name, options));
  if (isNaN(value) || value < 0) {
    return undefined;
  }
  return value;
}

export function formatSize(value?: number, format = "bi") {
  if (!value) return "";
  const [multiple, k, suffix] = (
    format === "bi" ? [1000, "k", "B"] : [1024, "K", "iB"]
  ) as [number, string, string];
  const exp = (Math.log(value) / Math.log(multiple)) | 0;
  const size = Number((value / Math.pow(multiple, exp)).toFixed(2));
  return (
    size +
    (exp ? (k + "MGTPEZY")[exp - 1] + suffix : "byte" + (size !== 1 ? "s" : ""))
  );
}

export function setCacheHitOutput(isCacheHit: boolean): void {
  core.setOutput("cache-hit", isCacheHit.toString());
}

type FindObjectResult = {
  item: string;
  metadata: opendal.Metadata;
  matchingKey: string;
};

export async function findObject(
  op: opendal.Operator,
  key: string,
  restoreKeys: string[],
  compressionMethod: CompressionMethod
): Promise<FindObjectResult> {
  core.debug("Key: " + JSON.stringify(key));
  core.debug("Restore keys: " + JSON.stringify(restoreKeys));

  core.debug(`Finding exact macth for: ${key}`);
  const exactMatch = await listObjects(op, key);
  core.debug(`Found ${JSON.stringify(exactMatch, null, 2)}`);
  if (exactMatch.length) {
    const metadata = await op.stat(exactMatch[0]);
    const result = { item: exactMatch[0], metadata, matchingKey: key };
    core.debug(`Using ${JSON.stringify(result)}`);
    return result;
  }

  for (const restoreKey of restoreKeys) {
    const fn = utils.getCacheFileName(compressionMethod);
    core.debug(`Finding object with prefix: ${restoreKey}`);
    let objects = await listObjects(op, restoreKey);
    objects = objects.filter((o) => o.includes(fn));
    core.debug(`Found ${JSON.stringify(objects, null, 2)}`);
    if (objects.length < 1) {
      continue;
    }
    let metadata: opendal.Metadata = await op.stat(objects[0]);;
    let object: string = objects[0];
    for (const obj of objects) {
      const m = await op.stat(obj);
      if (!metadata) {
        metadata = m;
        object = obj;
        continue;
      }
      if (m?.lastModified === null) {
        continue;
      }
      if (metadata?.lastModified === null) {
        metadata = m;
        object = obj;
        continue;
      }
      if (Date.parse(m?.lastModified) > Date.parse(metadata?.lastModified)) {
        metadata = m;
        object = obj;
      }
    }

    const result = { item: object, metadata, matchingKey: restoreKey };
    core.debug(`Using latest ${JSON.stringify(result)}`);
    return result;
  }
  throw new Error("Cache item not found");
}

export async function listObjects(
  op: opendal.Operator,
  prefix: string
): Promise<string[]> {
  if (!prefix.endsWith("/")) {
    prefix += "/";
  }
  const r: string[] = [];
  const lister = await op.scan(prefix);
  while (true) {
    const entry = await lister.next();
    if (entry === null) {
      break;
    }
    r.push(entry.path());
  }
  return r;
}

export function saveMatchedKey(matchedKey: string) {
  return core.saveState(State.MatchedKey, matchedKey);
}

function getMatchedKey() {
  return core.getState(State.MatchedKey);
}

export function isExactKeyMatch(): boolean {
  const matchedKey = getMatchedKey();
  const inputKey = core.getState(State.PrimaryKey);
  const result = getMatchedKey() === inputKey;
  core.debug(
    `isExactKeyMatch: matchedKey=${matchedKey} inputKey=${inputKey}, result=${result}`
  );
  return result;
}
