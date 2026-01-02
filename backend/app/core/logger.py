import logging
import sys
from pythonjsonlogger import jsonlogger
from app.core.config import settings

def setup_logging():
    """
    Setup logging configuration
    """
    log_level = settings.LOG_LEVEL.upper()
    
    # Root logger
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    # Remove existing handlers
    for handler in logger.handlers:
        logger.removeHandler(handler)
        
    # Stream Handler (Stdout)
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)
    
    if settings.LOG_JSON_FORMAT:
        # JSON Formatter for Production
        formatter = jsonlogger.JsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s',
            timestamp=True,
            rename_fields={'levelname': 'level', 'asctime': 'timestamp'}
        )
    else:
        # Standard Formatter for Local Development
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s [%(name)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    # Set specific loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING) # Suppress default access log to avoid duplicate
