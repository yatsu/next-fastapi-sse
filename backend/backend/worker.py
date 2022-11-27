import asyncio
import json
import logging
import os

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
            logger.info(f"consume message: {msg.value()}")
            consumer.store_offsets(msg)

            await produce_responses(producer)

    except KeyboardInterrupt:
        logger.info("Aborted")

    except Exception as ex:
        logger.error(f"Unexpected error {ex}")
        raise

    finally:
        consumer.close()


async def produce_responses(producer: AIOProducer):
    try:
        for i in range(5):
            msg = json.dumps({"value": i + 1})
            logger.info(f"produce message: {msg}")
            await producer.produce("nf.response", msg)
            await asyncio.sleep(1)

    except KafkaException as ex:
        logger.error(f"Unexpected error: {ex}")
        raise


def print_assignment(_: Consumer, partitions):
    logger.info(f"assignment: {partitions}")


if __name__ == "__main__":
    asyncio.run(main())
