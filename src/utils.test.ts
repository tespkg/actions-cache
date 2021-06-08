import { findObject, listObjects } from "./utils";
import { getCompressionMethod } from "@actions/cache/lib/internal/cacheUtils";
import * as minio from "minio";

// describe("utils", () => {
//   // test("listObjects", async () => {
//   //   const mc = new minio.Client({
//   //     endPoint: "s3.meera.tech",
//   //     accessKey: "YOURACCESSKEY",
//   //     secretKey: "YOURSECRETKEY",
//   //     // endPoint: "play.min.io",
//   //     // accessKey: "Q3AM3UQ867SPQQA43P2F",
//   //     // secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
//   //   });
//   //   // console.log(await mc.bucketExists("actions-cache"));
//   //   // console.log(await mc.makeBucket("actions-cache", "default"));
//   //   console.log(await listObjects(mc, "actions-cache", "test"));
//   // });
//   // test("getLatestObj", async () => {
//   //   const mc = new minio.Client({
//   //     endPoint: "s3.meera.tech",
//   //     accessKey: "YOURACCESSKEY",
//   //     secretKey: "YOURSECRETKEY",
//   //   });
//   //   // console.log(await mc.bucketExists("actions-cache"));
//   //   // console.log(await mc.makeBucket("actions-cache", "default"));
//   //   console.log(
//   //     await findObject(
//   //       mc,
//   //       "actions-cache",
//   //       ["Linux-"],
//   //       await getCompressionMethod()
//   //     )
//   //   );
//   // });
// });
