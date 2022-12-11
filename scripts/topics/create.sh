#!/bin/bash -eu

[ -f .env.development ] && source .env.development
[ -f .env.local ] && source .env.local
[ -f .env ] && source .env

kafka-topics --create --topic "nf.request" --bootstrap-server ${KAFKA_SERVER} \
    --replication-factor 1 --partitions 1 || true

kafka-topics --create --topic "nf.sse.response" --bootstrap-server ${KAFKA_SERVER} \
    --replication-factor 1 --partitions 1 || true

kafka-topics --create --topic "nf.streaming.request" --bootstrap-server ${KAFKA_SERVER} \
    --replication-factor 1 --partitions 1 || true
kafka-topics --create --topic "nf.streaming.response.1" --bootstrap-server ${KAFKA_SERVER} \
    --replication-factor 1 --partitions 1 || true
kafka-topics --create --topic "nf.streaming.response.2" --bootstrap-server ${KAFKA_SERVER} \
    --replication-factor 1 --partitions 1 || true
kafka-topics --create --topic "nf.streaming.response.3" --bootstrap-server ${KAFKA_SERVER} \
    --replication-factor 1 --partitions 1 || true
