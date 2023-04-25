import { getCompressionMethod } from "@actions/cache/lib/internal/cacheUtils";
import * as opendal from "opendal";
import { findObject } from "./utils";

describe("utils", () => {
  test("getLatestObj", async () => {
    const op = new opendal.Operator("s3", {
      endpoint: "play.min.io",
      bucket: "actions-cache",
      accessKeyId: "Q3AM3UQ867SPQQA43P2F",
      secretAccessKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
    });
    const got = await findObject(
      op,
      "foo.bar",
      ["test/Linux/"],
      await getCompressionMethod()
    );
    expect(got).toBeTruthy();
    console.log(got);
  });
});
