# actions-s3-cache

This action installs dependencies or builds, and caches them in S3.

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
      - uses: actions/checkout@v2
      - uses: tespkg/actions-cache@v1
        with:
          endpoint: play.min.io # optional, default s3.amazonaws.com
          insecure: false # optional, default false
          accessKey: "Q3AM3UQ867SPQQA43P2F" # required
          secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG" # required
          bucket: actions-cache # required
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          path: |
            node_modules
            .cache
          restore-keys: |
            ${{ runner.os }}-yarn-
          use-fallback: true # optional, use github actions cache fallback, default true
```
