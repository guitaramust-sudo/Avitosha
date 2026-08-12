#!/bin/sh
set -eu

source_url="https://storage.yandexcloud.net/avitosha-demo-images"
objects="
lamp-1.jpg lamp-2.jpg lamp-3.jpg
desk-1.jpg desk-2.jpg desk-3.jpg
headphones-1.jpg headphones-2.jpg headphones-3.jpg
service-1.webp service-2.webp
chair-1.jpg chair-2.jpg chair-3.jpg
bookshelf-1.jpg bookshelf-2.jpg bookshelf-3.jpg
cabinet-1.jpg cabinet-2.jpg cabinet-3.jpg
"

mkdir -p /seed
for object in $objects; do
  if [ -s "/seed/$object" ]; then
    continue
  fi
  curl --fail --silent --show-error --location \
    --output "/seed/$object.part" "$source_url/$object"
  mv "/seed/$object.part" "/seed/$object"
done
