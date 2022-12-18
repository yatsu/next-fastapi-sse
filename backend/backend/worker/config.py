import logging
import logging.config
import os
from typing import Any, Dict, List, Optional, Union

from uvicorn.config import LIFESPAN, LOG_LEVELS, LOGGING_CONFIG, Config, LifespanType
from uvicorn.importer import import_from_string

LOGGING_CONFIG["loggers"] = {
    "worker": {"handlers": ["default"], "level": "INFO", "propagate": False},
    "worker.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
}

logger = logging.getLogger("worker")


class WorkerConfig(Config):
    def __init__(
        self,
        lifespan: LifespanType = "auto",
        reload: bool = False,
        reload_dirs: Optional[Union[List[str], str]] = None,
        reload_delay: float = 0.25,
        reload_includes: Optional[Union[List[str], str]] = None,
        reload_excludes: Optional[Union[List[str], str]] = None,
        workers: Optional[int] = None,
        env_file: Optional[Union[str, os.PathLike]] = None,
        log_config: Optional[Union[Dict[str, Any], str]] = LOGGING_CONFIG,
        log_level: Optional[Union[str, int]] = None,
        access_log: bool = True,
        use_colors: Optional[bool] = None,
    ) -> None:
        super().__init__(
            app="",
            lifespan=lifespan,
            reload=reload,
            reload_dirs=reload_dirs,
            reload_delay=reload_delay,
            reload_includes=reload_includes,
            reload_excludes=reload_excludes,
            workers=workers,
            env_file=env_file,
            log_config=log_config,
            log_level=log_level,
            access_log=access_log,
            use_colors=use_colors,
        )

    def load(self) -> None:
        assert not self.loaded

        self.lifespan_class = import_from_string(
            LIFESPAN[self.lifespan]  # type: ignore
        )

        self.loaded = True

    def configure_logging(self) -> None:
        super().configure_logging()

        if self.log_level is not None:
            if isinstance(self.log_level, str):
                log_level = LOG_LEVELS[self.log_level]
            else:
                log_level = self.log_level
            logging.getLogger("worker").setLevel(log_level)
            logging.getLogger("worker.access").setLevel(log_level)
        if self.access_log is False:
            logging.getLogger("worker.access").handlers = []
            logging.getLogger("worker.access").propagate = False
