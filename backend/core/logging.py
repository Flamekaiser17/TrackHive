import structlog
import logging
import logging.config
import os
from pathlib import Path

def setup_logging():
    LOGS_DIR = Path(__file__).resolve().parent.parent / "logs"
    os.makedirs(LOGS_DIR, exist_ok=True)
    LOG_FILE = LOGS_DIR / "trackhive.log"

    # 1. Standard Python logging config
    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json_formatter": {
                "()": structlog.stdlib.ProcessorFormatter,
                "processor": structlog.processors.JSONRenderer(),
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json_formatter",
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": str(LOG_FILE),
                "maxBytes": 10 * 1024 * 1024,  # 10MB
                "backupCount": 5,
                "formatter": "json_formatter",
            },
        },
        "loggers": {
            "": {
                "handlers": ["console", "file"],
                "level": "INFO",
            },
        },
    })

    # 2. Structlog setup
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.stdlib.ProcessorFormatter.wrap_for_stdlib,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

setup_logging()
logger = structlog.get_logger()
