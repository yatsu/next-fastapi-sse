import asyncio

from fastapi import FastAPI, Request
from sse_starlette.sse import EventSourceResponse

app = FastAPI()


@app.get("/api/data")
def hello():
    return {"data": "hello"}


@app.get("/api/stream")
async def stream(request: Request):
    async def event_generator():
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
