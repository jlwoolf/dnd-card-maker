"""Email sending logic.

Emails are stored in the database for dev inspection and optionally sent
via SMTP.  All public functions accept a SQLAlchemy ``Session`` so email
storage participates in the caller's transaction boundary.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from sqlalchemy.orm import Session

from app.config import settings
from app.models.email import SentEmail
from app.templates import render_template

logger = logging.getLogger(__name__)


def _store_email(db: Session, to_email: str, subject: str, html_body: str) -> None:
    """Persist an outgoing email in the ``sent_emails`` table."""
    try:
        email = SentEmail(to_email=to_email, subject=subject, html_body=html_body)
        db.add(email)
        db.commit()
    except Exception:
        logger.exception("Failed to store email in DB for %s", to_email)


def _try_send_smtp(to_email: str, subject: str, html_body: str) -> None:
    """Attempt to deliver an email via SMTP when configured."""
    if not settings.smtp_host or settings.smtp_host == "localhost":
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, to_email, msg.as_string())
    except Exception:
        logger.exception("Failed to send email to %s", to_email)


def _send_email(db: Session, to_email: str, subject: str, html_body: str) -> None:
    """Store the email in the database and attempt SMTP delivery."""
    _store_email(db, to_email, subject, html_body)
    _try_send_smtp(to_email, subject, html_body)


def send_verification_email(db: Session, email: str, token: str) -> None:
    """Send an account verification email to the given address.

    Includes a link to ``{frontend_url}/verify/{token}``. The email is stored
    in the database and, if SMTP is configured, sent via SMTP.
    """
    verify_url = f"{settings.frontend_url}/verify/{token}"
    html_body = render_template("verify_email.html", verify_url=verify_url)
    _send_email(db, email, "Verify your DnD Card Maker account", html_body)


def send_reset_email(db: Session, email: str, token: str) -> None:
    """Send a password-reset email to the given address.

    Includes a link to ``{frontend_url}/reset-password/{token}``. The email
    is stored in the database and, if SMTP is configured, sent via SMTP.
    """
    reset_url = f"{settings.frontend_url}/reset-password/{token}"
    html_body = render_template("reset_email.html", reset_url=reset_url)
    _send_email(db, email, "Reset your DnD Card Maker password", html_body)
