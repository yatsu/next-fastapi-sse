import asyncio
from threading import Thread
from typing import Any

import confluent_kafka
from confluent_kafka import KafkaException
from sseclient import logging

logger = logging.getLogger("worker")


# https://github.com/confluentinc/confluent-kafka-python/blob/master/examples/asyncio_example.py
class AIOProducer(object):
    def __init__(self, configs, loop=None) -> None:
        self._loop = loop or asyncio.get_event_loop()
        self._producer = confluent_kafka.Producer(configs)
        self._cancelled = False
        self._poll_thread = Thread(target=self._poll_loop)
        self._poll_thread.start()

    def _poll_loop(self) -> None:
        logger.info("Starting producer thread")
        while not self._cancelled:
            self._producer.poll(0.1)

    def close(self) -> None:
        logger.debug("Stopping producer thread")
        self._cancelled = True
        self._poll_thread.join()
        logger.debug("Joined producer thread")

    def produce(self, topic, value) -> asyncio.Future[Any]:
        result = self._loop.create_future()

        def ack(err, msg):
            if err:
                self._loop.call_soon_threadsafe(
                    result.set_exception, KafkaException(err)
                )
            else:
                self._loop.call_soon_threadsafe(result.set_result, msg)

        self._producer.produce(topic, value, on_delivery=ack)
        return result
