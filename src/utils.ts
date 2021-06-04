import * as core from "@actions/core";
import * as minio from "minio";

export function newMinio() {
  return new minio.Client({
    endPoint: core.getInput("endpoint"),
    port: getInputAsInt("port"),
    useSSL: getInputAsBoolean("insecure"),
    accessKey: core.getInput("accessKey"),
    secretKey: core.getInput("secretKey"),
  });
}

export function getInputAsBoolean(
  name: string,
  options?: core.InputOptions
): boolean {
  return Boolean(core.getInput(name, options));
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
  const [multiple, k, suffix] = (format === "bi"
    ? [1000, "k", "B"]
    : [1024, "K", "iB"]) as [number, string, string];
  const exp = (Math.log(value) / Math.log(multiple)) | 0;
  const size = Number((value / Math.pow(multiple, exp)).toFixed(2));
  return (
    size +
    (exp ? (k + "MGTPEZY")[exp - 1] + suffix : "byte" + (size !== 1 ? "s" : ""))
  );
}
