# actions-s3-cache

This action allows caching dependencies to s3 compatible storage, e.g. minio

It also has github's actions/cache@v2 fallback if s3 save & restore fails

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
          use-fallback: true # optional, use github actions cache fallback, default true

          # actions/cache compatible properties: https://github.com/actions/cache
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          path: |
            node_modules
            .cache
          restore-keys: |
            ${{ runner.os }}-yarn-
```
