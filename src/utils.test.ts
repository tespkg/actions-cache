import { getCompressionMethod } from "@actions/cache/lib/internal/cacheUtils";
import * as minio from "minio";
import { findObject } from "./utils";

describe("utils", () => {
  test("getLatestObj", async () => {
    const mc = new minio.Client({
      endPoint: "play.min.io",
      accessKey: "Q3AM3UQ867SPQQA43P2F",
      secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
    });
    const got = await findObject(
      mc,
      "actions-cache",
      "foo.bar",
      ["test-Linux-"],
      await getCompressionMethod()
    );
    expect(got).toBeTruthy();
    console.log(got);
  });
});
