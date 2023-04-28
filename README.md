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
        env:
          AWS_ACCESS_KEY_ID: Q3AM3UQ867SPQQA43P2F
          AWS_SECRET_ACCESS_KEY: zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG
        with:
          endpoint: play.min.io # optional
          bucket: actions-cache # required
          root: test # optional
          use-fallback: false # optional, use github actions cache fallback, default false
          path: |
            node_modules
            .cache
          key: ${{ runner.os }}/yarn/${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}/yarn/
```

Or you can just call aws-configure before

```yaml
name: dev ci

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  build_test:
    runs-on: [ubuntu-latest]

    steps:
      - name: Configure AWS credentials
         uses: aws-actions/configure-aws-credentials@v2
         with:
           role-duration-seconds: 1500
           role-to-assume: arn:aws:iam::00000000:role/ci
           aws-region: us-east-2
      - uses: everpcpc/actions-cache@v1
        with:
          bucket: ci # required
          root: test # optional
          path: |
            node_modules
            .cache
          key: ${{ runner.os }}/yarn/${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}/yarn/
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
