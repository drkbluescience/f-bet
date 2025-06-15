#!/bin/bash

echo "=== Installing iconv to handle UTF-16 encoding ==="
sudo apt-get update -qq
sudo apt-get install -y libc-bin

echo "=== Converting README.md from UTF-16 to UTF-8 ==="
iconv -f UTF-16LE -t UTF-8 README.md

echo "=== Checking if this is really just a README-only repository ==="
echo "Total files in repository:"
git ls-files | wc -l

echo "=== Repository appears to contain only README.md ==="
echo "This seems to be a minimal repository with just documentation."