import asyncio
import json
import logging
import os
from typing import Dict

from confluent_kafka import Consumer, KafkaException

from .producer import AIOProducer

# https://github.com/confluentinc/confluent-kafka-python/blob/master/examples/consumer.py

logger = logging.getLogger("consumer")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)-15s %(levelname)-8s %(message)s"))
logger.addHandler(handler)


async def main():
    logger.info("Starting worker")
    producer = AIOProducer({"bootstrap.servers": os.getenv("KAFKA_SERVER")})
    consumer = Consumer(
        {
            "bootstrap.servers": os.getenv("KAFKA_SERVER"),
            "group.id": "nf.worker",
            "enable.auto.offset.store": False,
        },
        logger=logger,
        # debug="fetch",
    )

    consumer.subscribe(["nf.request"], on_assign=print_assignment)
    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                raise KafkaException(msg.error())

            logger.debug(
                f"{msg.topic()} [{msg.partition()}] at offset {msg.offset()} "
                f"with key {str(msg.key())}"
            )
            msg_value = json.loads(msg.value())
            logger.info(f"consume message: {msg_value}")
            consumer.store_offsets(msg)

            await produce_responses(producer, msg_value)

    except KeyboardInterrupt:
        logger.info("Aborted")

    except Exception as ex:
        logger.error(f"Unexpected error {ex}")
        raise

    finally:
        consumer.close()


async def produce_responses(producer: AIOProducer, msg: Dict[str, str]):
    try:
        await asyncio.sleep(1)
        if msg["responseType"] == "sse":
            for i in range(5):
                res = json.dumps({"value": i + 1})
                logger.info(f"produce message for SSR: {res}")
                await producer.produce("nf.sse.response", res)
                await asyncio.sleep(1)
        else:
            for i in range(3):
                res = json.dumps({"value": i + 1})
                logger.info(f"produce message for streaming: {res}")
                await producer.produce(f"nf.streaming.response.{i + 1}", res)
                await asyncio.sleep(1)

    except KafkaException as ex:
        logger.error(f"Unexpected error: {ex}")
        raise


def print_assignment(_: Consumer, partitions):
    logger.info(f"assignment: {partitions}")


if __name__ == "__main__":
    asyncio.run(main())
