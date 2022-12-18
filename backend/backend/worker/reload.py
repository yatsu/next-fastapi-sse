import logging
import signal
from socket import socket
from typing import Callable, List, Optional

import click
from uvicorn.supervisors import ChangeReload
from uvicorn.supervisors.basereload import HANDLED_SIGNALS

from .config import WorkerConfig
from .subprocess import get_subprocess

logger = logging.getLogger("worker")


class WorkerChangeReload(ChangeReload):
    def __init__(
        self,
        config: WorkerConfig,
        target: Callable[[], None],
    ) -> None:
        super().__init__(config, self._target, [])
        self.target = target

    def _target(self, _: Optional[List[socket]] = []) -> None:
        self.target()

    def startup(self) -> None:
        message = f"Started reloader process [{self.pid}] using {self.reloader_name}"
        color_message = "Started reloader process [{}] using {}".format(
            click.style(str(self.pid), fg="cyan", bold=True),
            click.style(str(self.reloader_name), fg="cyan", bold=True),
        )
        logger.info(message, extra={"color_message": color_message})

        for sig in HANDLED_SIGNALS:
            signal.signal(sig, self.signal_handler)

        self.process = get_subprocess(config=self.config, target=self.target)
        self.process.start()

    def restart(self) -> None:
        logger.debug("Restating WorkerChangeReload")
        self.process.terminate()
        self.process.join()

        self.process = get_subprocess(config=self.config, target=self.target)
        self.process.start()

    def shutdown(self) -> None:
        logger.debug("Shutting down WorkerChangeReload")
        self.process.terminate()
        self.process.join()

        for sock in self.sockets:
            sock.close()

        message = "Stopping reloader process [{}]".format(str(self.pid))
        color_message = "Stopping reloader process [{}]".format(
            click.style(str(self.pid), fg="cyan", bold=True)
        )
        logger.info(message, extra={"color_message": color_message})
