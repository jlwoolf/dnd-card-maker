import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, html_body: str) -> None:
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
        raise


def send_verification_email(email: str, token: str) -> None:
    verify_url = f"{settings.frontend_url}/verify/{token}"
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verify your DnD Card Maker account</h2>
        <p>Click the link below to verify your email address:</p>
        <p>
          <a href="{verify_url}" style="padding: 10px 20px; background: #48534b;
             color: white; text-decoration: none; border-radius: 4px;">
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this URL:</p>
        <p>{verify_url}</p>
        <p>If you didn't create this account, you can ignore this email.</p>
      </body>
    </html>
    """
    _send_email(email, "Verify your DnD Card Maker account", html_body)


def send_reset_email(email: str, token: str) -> None:
    reset_url = f"{settings.frontend_url}/reset-password/{token}"
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Reset your DnD Card Maker password</h2>
        <p>Click the link below to reset your password:</p>
        <p>
          <a href="{reset_url}" style="padding: 10px 20px; background: #48534b;
             color: white; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this URL:</p>
        <p>{reset_url}</p>
        <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </body>
    </html>
    """
    _send_email(email, "Reset your DnD Card Maker password", html_body)
