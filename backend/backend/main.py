import asyncio
import concurrent.futures
import json

# import json
import os

from confluent_kafka import KafkaException

# from confluent_kafka import Consumer, KafkaException
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from .logging import logger
from .producer import AIOProducer

# from functools import partial


app = FastAPI()

# Both `127.0.0.1` and `localhost` must be allowed
origins = [os.getenv("NEXT_PUBLIC_TOP_URL"), f"http://localhost:{os.getenv('PORT')}"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"kafka server: {os.getenv('KAFKA_SERVER')}")
producer = AIOProducer({"bootstrap.servers": os.getenv("KAFKA_SERVER")})

executor = concurrent.futures.ThreadPoolExecutor()


@app.on_event("shutdown")
def shutdown_event():
    producer.close()


@app.get("/api/v1/data")
async def data():
    return {"result": "ok"}


@app.get("/api/v1/sse_req")
async def sse_req():
    try:
        await producer.produce("nf.request", json.dumps({"responseType": "sse"}))
    except KafkaException as ex:
        logger.error(f"Error: {ex}")
        raise HTTPException(status_code=500, detail=ex.args[0].str())

    return {"result": "ok"}


@app.get("/api/v1/streaming_req")
async def streaing_req():
    try:
        await producer.produce("nf.request", json.dumps({"responseType": "streaming"}))
    except KafkaException as ex:
        logger.error(f"Error: {ex}")
        raise HTTPException(status_code=500, detail=ex.args[0].str())

    return {"result": "ok"}


# This does not work well asynchronously because the consumer does not support asyncio.
@app.get("/api/v1/events")
async def stream(request: Request):
    async def event_generator():
        # consumer = Consumer(
        #     {
        #         "bootstrap.servers": os.getenv("KAFKA_SERVER"),
        #         "group.id": "nf.worker",
        #         "enable.auto.offset.store": False,
        #     }
        # )
        # consumer.subscribe(["nf.response"])
        # loop = asyncio.get_running_loop()
        #
        # count = 0
        # try:
        #     while True:
        #         if await request.is_disconnected():
        #             break
        #
        #         msg = await loop.run_in_executor(
        #             executor, partial(consumer.poll, 1.0)
        #         )
        #         if msg is None:
        #             continue
        #         if msg.error():
        #             logger.error(f"Consumer error: {msg.error()}")
        #             continue
        #
        #         consumer.store_offsets(msg)
        #
        #         data = json.loads(msg.value())
        #
        #         logger.info(f"produce message {data}")
        #         yield {
        #             "event": "message",
        #             "id": f"msg-{count}",
        #             "retry": 30000,
        #             "data": json.dumps(data),
        #         }
        #         count += 1
        # finally:
        #     consumer.close()

        for i in range(5):
            await asyncio.sleep(1)
            if await request.is_disconnected():
                break

            yield {
                "event": "message",
                "id": f"msg-{i}",
                "retry": 30000,
                "data": f'{{"value": {i + 1}}}',
            }

    # Disable `Content-Encoding: gzip` to let each event can reach the client
    # immediately
    return EventSourceResponse(event_generator(), headers={"Content-Encoding": "none"})
