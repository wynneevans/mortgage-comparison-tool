"""
Shared App Check token verification logic.
"""
import logging
from typing import Optional

from firebase_admin import app_check
from firebase_admin.exceptions import FirebaseError

logger = logging.getLogger(__name__)


def verify_token(token: Optional[str]) -> tuple[bool, Optional[str]]:
    """
    Verify an App Check token.

    Args:
        token: The App Check token to verify, or None

    Returns:
        A tuple of (is_valid, error_message).
        If valid, returns (True, None).
        If invalid, returns (False, error_message).
    """
    if not token:
        logger.warning("App Check token missing from request")
        return False, "Missing App Check token"

    try:
        app_check.verify_token(token)
        logger.info("App Check token verified successfully")
        return True, None
    except (ValueError, FirebaseError) as e:
        logger.warning(f"App Check token verification failed: {e}")
        return False, f"Invalid App Check token: {str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error during App Check verification: {type(e).__name__}: {e}")
        return False, "App Check verification failed"
