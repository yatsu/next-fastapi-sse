import json
import pprint

import requests
import sseclient


def main():
    url = "http://localhost:4210/api/stream"
    headers = {"Accept": "text/event-stream"}
    response = requests.get(url, stream=True, headers=headers)
    client = sseclient.SSEClient(response)
    for event in client.events():
        pprint.pprint(json.loads(event.data))


if __name__ == "__main__":
    main()
