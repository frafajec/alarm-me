#!/bin/sh

versionRaw=`jq .version public/manifest.json`
version="${versionRaw//\"/}"
echo "Creating build for version $version"

# validation of version
for file in $(ls releases)
do
 if [[ "$file" == *"$version"* ]]; then
  echo "Version already exists, change manifest.json!"
  exit 1
 fi
done

# creating a build
yarn build

name="alarmMe_$version.zip"
echo $name

# zip it
zip releases/$name -r build
