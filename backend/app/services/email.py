import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings
from app.templates import render_template

logger = logging.getLogger(__name__)


def _store_email(to_email: str, subject: str, html_body: str) -> None:
    from app.database import SessionLocal
    from app.models.email import SentEmail

    db = SessionLocal()
    try:
        email = SentEmail(to_email=to_email, subject=subject, html_body=html_body)
        db.add(email)
        db.commit()
    except Exception as e:
        logger.error("Failed to store email in DB: %s", e)
    finally:
        db.close()


def _try_send_smtp(to_email: str, subject: str, html_body: str) -> None:
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
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)


def _send_email(to_email: str, subject: str, html_body: str) -> None:
    _store_email(to_email, subject, html_body)
    _try_send_smtp(to_email, subject, html_body)


def send_verification_email(email: str, token: str) -> None:
    verify_url = f"{settings.frontend_url}/verify/{token}"
    html_body = render_template("verify_email.html", verify_url=verify_url)
    _send_email(email, "Verify your DnD Card Maker account", html_body)


def send_reset_email(email: str, token: str) -> None:
    reset_url = f"{settings.frontend_url}/reset-password/{token}"
    html_body = render_template("reset_email.html", reset_url=reset_url)
    _send_email(email, "Reset your DnD Card Maker password", html_body)
