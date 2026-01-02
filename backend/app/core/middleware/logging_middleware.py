import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        # Log Request (Optional, can be noisy)
        # logger.info(f"Request started: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            process_time = time.perf_counter() - start_time
            
            # Log Response
            logger.info(
                f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration": process_time
                }
            )
            
            return response
        except Exception as e:
            process_time = time.perf_counter() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path} - {process_time:.4f}s",
                exc_info=True,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "duration": process_time
                }
            )
            raise e
