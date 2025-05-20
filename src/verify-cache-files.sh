#!/bin/sh

# Validate args
prefix="$1"
if [ -z "$prefix" ]; then
  echo "Must supply prefix argument"
  exit 1
fi

path="$2"
if [ -z "$path" ]; then
  echo "Must specify path argument"
  exit 1
fi

# Sanity check GITHUB_RUN_ID defined
if [ -z "$GITHUB_RUN_ID" ]; then
  echo "GITHUB_RUN_ID not defined"
  exit 1
fi

# Verify file exists
check_not_exists="$3"
file="$path/test-file.txt"

if [ -n "$check_not_exists" ]; then
  echo "CACHE_HIT $CACHE_HIT"
  echo "CACHE_SIZE $CACHE_SIZE"
  echo "Checking for $file to not exist"
  if [ -e $file ]; then
    echo "File exists when it should not"
    exit 1
  fi
  exit 0
fi

echo "Checking for $file"
if [ ! -e $file ]; then
  echo "File does not exist"
  exit 1
fi

# Verify file content
content="$(cat $file)"
echo -e "File content:\n$content"
if [ -z "$(echo $content | grep --fixed-strings "$prefix $GITHUB_RUN_ID")" ]; then
  echo "Unexpected file content"
  echo "Expect $GITHUB_RUN_ID to be in the file content"
  exit 1
fi
