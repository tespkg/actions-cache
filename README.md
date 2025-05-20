# actions-s3-cache

This action enables caching dependencies to s3 compatible storage, e.g. minio, AWS S3

It also has github [actions/cache@v2](https://github.com/actions/cache) fallback if s3 save & restore fails

## Usage

```yaml
name: dev ci

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build_test:
    runs-on: [ubuntu-latest]

    steps:
      - uses: tespkg/actions-cache@v1
        with:
          endpoint: play.min.io # optional, default s3.amazonaws.com
          insecure: false # optional, use http instead of https. default false
          accessKey: "Q3AM3UQ867SPQQA43P2F" # required
          secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG" # required
          sessionToken: "AQoDYXdzEJraDcqRtz123" # optional
          bucket: actions-cache # required
          use-fallback: true # optional, use github actions cache fallback, default true

          # actions/cache compatible properties: https://github.com/actions/cache
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          path: |
            node_modules
            .cache
          restore-keys: |
            ${{ runner.os }}-yarn-
```

You can also set env instead of using `with`:

```yaml
      - uses: tespkg/actions-cache@v1
        env:
          AWS_ACCESS_KEY_ID: "Q3AM3UQ867SPQQA43P2F"
          AWS_SECRET_ACCESS_KEY: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
          # AWS_SESSION_TOKEN: "xxx"
          AWS_REGION: "us-east-1"
        with:
          endpoint: play.min.io
          bucket: actions-cache
          use-fallback: false
          key: test-${{ runner.os }}-${{ github.run_id }}
          path: |
            test-cache
            ~/test-cache
```

To write to the cache only:

```yaml
      - uses: tespkg/actions-cache/save@v1
        with:
          accessKey: "Q3AM3UQ867SPQQA43P2F" # required
          secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG" # required
          bucket: actions-cache # required
          # actions/cache compatible properties: https://github.com/actions/cache
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          path: |
            node_modules
```

To restore from the cache only:

```yaml
      - uses: tespkg/actions-cache/restore@v1
        with:
          accessKey: "Q3AM3UQ867SPQQA43P2F" # required
          secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG" # required
          bucket: actions-cache # required
          # actions/cache compatible properties: https://github.com/actions/cache
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          path: |
            node_modules
```

To check if cache hits and size is not zero:

```yaml
      - name: Check cache
        id: cache
        uses: tespkg/actions-cache/check@v1
        with:
          accessKey: "Q3AM3UQ867SPQQA43P2F" # required
          secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG" # required
          bucket: actions-cache # required
          lookup-only: true
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          path: |
            node_modules

      - name: verify cache hit
        env:
          CACHE_HIT: ${{ steps.cache.outputs.cache-hit }}
          CACHE_SIZE: ${{ steps.cache.outputs.cache-size }}
        run: |
          echo "CACHE_HIT $CACHE_HIT"
          echo "CACHE_SIZE $CACHE_SIZE"
```


## Restore keys

`restore-keys` works similar to how github's `@actions/cache@v2` works: It search each item in `restore-keys`
as prefix in object names and use the latest one

## Amazon S3 permissions

When using this with Amazon S3, the following permissions are necessary:

 - `s3:PutObject`
 - `s3:GetObject`
 - `s3:ListBucket`
 - `s3:GetBucketLocation`
 - `s3:ListBucketMultipartUploads`
 - `s3:ListMultipartUploadParts`

# Note on release

This project follows semantic versioning. Backward incompatible changes will
increase major version.

There is also the `v1` compatible tag that's always pinned to the latest
`v1.x.y` release.

It's done using:

```
git tag -a v1 -f -m "v1 compatible release"
git push -f --tags
```
