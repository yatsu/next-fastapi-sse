import multiprocessing
import os
import sys
from typing import Callable, Optional

from uvicorn.config import Config

multiprocessing.allow_connection_pickling()
spawn = multiprocessing.get_context("spawn")


def get_subprocess(config: Config, target: Callable[..., None]):
    stdin_fileno: Optional[int]
    try:
        stdin_fileno = sys.stdin.fileno()
    except OSError:
        stdin_fileno = None

    kwargs = {
        "config": config,
        "target": target,
        "stdin_fileno": stdin_fileno,
    }

    return spawn.Process(target=subprocess_started, kwargs=kwargs)


def subprocess_started(
    config: Config, target: Callable[..., None], stdin_fileno: Optional[int]
) -> None:
    # Re-open stdin.
    if stdin_fileno is not None:
        sys.stdin = os.fdopen(stdin_fileno)

    # Logging needs to be setup again for each child.
    config.configure_logging()

    target()
