from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.constants import DEV_MAIL_LIST_LIMIT
from app.database import get_db
from app.dependencies import get_current_user
from app.models.email import SentEmail
from app.models.user import User

router = APIRouter(prefix="/api/dev", tags=["dev"])


@router.get("/mail")
def list_mail(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the 50 most recently sent emails (dev/testing endpoint).

    Requires authentication. Returns 200 with email summaries (to, subject, sent_at).
    """
    emails = db.query(SentEmail).order_by(SentEmail.sent_at.desc()).limit(DEV_MAIL_LIST_LIMIT).all()
    return [
        {
            "id": e.id,
            "to_email": e.to_email,
            "subject": e.subject,
            "sent_at": e.sent_at.isoformat(),
        }
        for e in emails
    ]


@router.get("/mail/{email_id}")
def get_mail(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single sent email by ID, including its HTML body (dev/testing).

    Requires authentication. Returns 200 on success or 404 if the email is
    not found.
    """
    email = db.query(SentEmail).filter(SentEmail.id == email_id).first()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )
    return {
        "id": email.id,
        "to_email": email.to_email,
        "subject": email.subject,
        "html_body": email.html_body,
        "sent_at": email.sent_at.isoformat(),
    }


@router.delete("/mail", status_code=status.HTTP_204_NO_CONTENT)
def clear_mail(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete all stored sent emails (dev/testing endpoint).

    Requires authentication. Returns 204 on success.
    """
    db.query(SentEmail).delete()
    db.commit()
