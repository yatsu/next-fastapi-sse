import os
import sys
import threading
from typing import List

import click
from sseclient import logging
from uvicorn.config import LifespanType
from uvicorn.main import LIFESPAN_CHOICES

from .config import LOG_LEVELS, LOGGING_CONFIG, WorkerConfig
from .multiprocess import WorkerMultiprocess
from .reload import WorkerChangeReload
from .worker import Worker

STARTUP_FAILURE = 3

LEVEL_CHOICES = click.Choice(list(LOG_LEVELS.keys()))

logger = logging.getLogger("worker")


@click.command(context_settings={"auto_envvar_prefix": "WORKER"})
@click.option("--reload", is_flag=True, default=False, help="Enable auto-reload.")
@click.option(
    "--reload-dir",
    "reload_dirs",
    multiple=True,
    help="Set reload directories explicitly, instead of using the current working"
    " directory.",
    type=click.Path(exists=True),
)
@click.option(
    "--reload-include",
    "reload_includes",
    multiple=True,
    help="Set glob patterns to include while watching for files. Includes '*.py' "
    "by default; these defaults can be overridden with `--reload-exclude`. "
    "This option has no effect unless watchfiles is installed.",
)
@click.option(
    "--reload-exclude",
    "reload_excludes",
    multiple=True,
    help="Set glob patterns to exclude while watching for files. Includes "
    "'.*, .py[cod], .sw.*, ~*' by default; these defaults can be overridden "
    "with `--reload-include`. This option has no effect unless watchfiles is "
    "installed.",
)
@click.option(
    "--reload-delay",
    type=float,
    default=0.25,
    show_default=True,
    help="Delay between previous and next check if application needs to be."
    " Defaults to 0.25s.",
)
@click.option(
    "--workers",
    default=None,
    type=int,
    help="Number of worker processes. Defaults to the $WEB_CONCURRENCY environment"
    " variable if available, or 1. Not valid with --reload.",
)
@click.option(
    "--lifespan",
    type=LIFESPAN_CHOICES,
    default="auto",
    help="Lifespan implementation.",
    show_default=True,
)
@click.option(
    "--env-file",
    type=click.Path(exists=True),
    default=None,
    help="Environment configuration file.",
    show_default=True,
)
@click.option(
    "--log-config",
    type=click.Path(exists=True),
    default=None,
    help="Logging configuration file. Supported formats: .ini, .json, .yaml.",
    show_default=True,
)
@click.option(
    "--log-level",
    type=LEVEL_CHOICES,
    default=None,
    help="Log level. [default: info]",
    show_default=True,
)
@click.option(
    "--access-log/--no-access-log",
    is_flag=True,
    default=True,
    help="Enable/Disable access log.",
)
@click.option(
    "--use-colors/--no-use-colors",
    is_flag=True,
    default=None,
    help="Enable/Disable colorized logging.",
)
def main(
    lifespan: LifespanType,
    reload: bool,
    reload_dirs: List[str],
    reload_includes: List[str],
    reload_excludes: List[str],
    reload_delay: float,
    workers: int,
    env_file: str,
    log_config: str,
    log_level: str,
    access_log: bool,
    use_colors: bool,
) -> None:
    config = WorkerConfig(
        lifespan=lifespan,
        reload=reload,
        reload_dirs=reload_dirs,
        reload_includes=reload_includes,
        reload_excludes=reload_excludes,
        reload_delay=reload_delay,
        workers=workers,
        env_file=env_file,
        log_config=LOGGING_CONFIG if log_config is None else log_config,
        log_level=log_level,
        access_log=access_log,
        use_colors=use_colors,
    )

    worker = Worker(config)

    if config.should_reload:
        logger.debug("Starting WorkerChangeReload")
        WorkerChangeReload(config, target=worker.run).run()
    elif config.workers > 1:
        logger.debug("Starting WorkerMultiprocess")
        WorkerMultiprocess(config, target=worker.run).run()
    else:
        logger.debug("Staring Worker directly")
        worker.run()

    if not worker.started and not config.should_reload and config.workers == 1:
        sys.exit(STARTUP_FAILURE)
