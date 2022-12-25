import asyncio
import json
import logging
import os
import signal
import threading
from types import FrameType
from typing import Dict, Optional

import click
from confluent_kafka import Consumer, KafkaException
from uvicorn.config import Config
from uvicorn.supervisors.multiprocess import HANDLED_SIGNALS

from ..producer import AIOProducer

logger = logging.getLogger("worker")


class Worker(object):
    def __init__(self, config: Config) -> None:
        self.config = config

        self.started = False
        self.should_exit = False
        self.force_exit = False
        self.last_notified = 0.0

    def run(self) -> None:
        asyncio.run(self.serve())

    async def serve(self) -> None:
        process_id = os.getpid()

        config = self.config
        if not config.loaded:
            config.load()

        self.lifespan = config.lifespan_class(config)

        self.install_signal_handlers()

        message = "Started server process [%d]"
        color_message = "Started server process [" + click.style("%d", fg="cyan") + "]"
        logger.info(message, process_id, extra={"color_message": color_message})

        await self.startup()
        if self.should_exit:
            return
        await self.main()
        await self.shutdown()

        message = "Finished server process [%d]"
        color_message = "Finished server process [" + click.style("%d", fg="cyan") + "]"
        logger.info(message, process_id, extra={"color_message": color_message})

    async def startup(self) -> None:
        await self.lifespan.startup()
        if self.lifespan.should_exit:
            self.should_exit = True
            return

        logger.info("Starting worker")
        self.started = True

    # See
    # https://github.com/confluentinc/confluent-kafka-python/blob/master/examples/consumer.py
    async def main(self) -> None:
        producer = AIOProducer({"bootstrap.servers": os.getenv("KAFKA_SERVER")})
        consumer = Consumer(
            {
                "bootstrap.servers": os.getenv("KAFKA_SERVER"),
                "group.id": "nf.worker",
                "enable.auto.offset.store": False,
                "partition.assignment.strategy": "roundrobin",
            },
            logger=logger,
            # debug="fetch",
        )

        consumer.subscribe(["nf.request"], on_assign=self.print_assignment)
        should_exit = await self.on_tick()
        try:
            while not should_exit:
                should_exit = await self.on_tick()
                # logger.debug(f"poll should_exit: {should_exit}")

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

                await self.produce_responses(producer, msg_value)

        except Exception as ex:
            logger.error(f"Unexpected error {ex}")
            raise

        finally:
            consumer.unsubscribe()
            consumer.close()
            producer.close()

    async def produce_responses(
        self, producer: AIOProducer, msg: Dict[str, str]
    ) -> None:
        try:
            await asyncio.sleep(1)
            if msg["responseType"] == "sse":
                for i in range(1, 6):
                    res = json.dumps({f"{i}": {"value": i}})
                    logger.info(f"produce message for SSR: {res}")
                    await producer.produce("nf.sse.response", res)
                    await asyncio.sleep(1)
            else:
                for i in range(1, 4):
                    res = json.dumps({f"{i}": {"value": i}})
                    logger.info(f"produce message for streaming: {res}")
                    await producer.produce(f"nf.streaming.response.{i}", res)
                    await asyncio.sleep(1)

        except KafkaException as ex:
            logger.error(f"Unexpected error: {ex}")
            raise

    async def on_tick(self) -> bool:
        if self.should_exit:
            return True
        return False

    async def shutdown(self) -> None:
        logger.info("Shutting down")

    def install_signal_handlers(self) -> None:
        if threading.current_thread() is not threading.main_thread():
            # Signals can only be listened to from the main thread.
            return

        # Reset signaling
        for s in HANDLED_SIGNALS:
            signal.signal(s, signal.SIG_DFL)

        signal.signal(signal.SIGTERM, self.handle_exit)
        signal.signal(signal.SIGINT, self.handle_exit)

    def handle_exit(self, sig: int, _: Optional[FrameType]) -> None:
        logger.debug(f"handling signal {sig}")
        if self.should_exit and sig == signal.SIGINT:
            logger.debug("setting force exit")
            self.force_exit = True
        else:
            self.should_exit = True

    def print_assignment(self, _: Consumer, partitions) -> None:
        logger.debug(f"assignment: {partitions}")
