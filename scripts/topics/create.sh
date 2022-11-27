#!/bin/bash -eu

[ -f .env.development ] && source .env.development
[ -f .env.local ] && source .env.local
[ -f .env ] && source .env

kafka-topics --create --topic "nf.request" --bootstrap-server ${KAFKA_SERVER} \
    --replication-factor 1 --partitions 1
kafka-topics --create --topic "nf.response" --bootstrap-server ${KAFKA_SERVER} \
    --replication-factor 1 --partitions 1
