import signal
from socket import socket
from typing import Callable, List, Optional

import click
from sseclient import logging
from uvicorn.supervisors import Multiprocess
from uvicorn.supervisors.multiprocess import HANDLED_SIGNALS

from .config import WorkerConfig
from .subprocess import get_subprocess

logger = logging.getLogger("worker")


class WorkerMultiprocess(Multiprocess):
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
        message = "Started parent process [{}]".format(str(self.pid))
        color_message = "Started parent process [{}]".format(
            click.style(str(self.pid), fg="cyan", bold=True)
        )
        logger.info(message, extra={"color_message": color_message})

        for sig in HANDLED_SIGNALS:
            signal.signal(sig, self.signal_handler)

        for _ in range(self.config.workers):
            process = get_subprocess(config=self.config, target=self.target)
            process.start()
            self.processes.append(process)
