from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import DEV_MAIL_LIST_LIMIT
from app.dependencies import DBSession, check_dev_mode
from app.models.email import SentEmail

router = APIRouter(prefix="/api/dev", tags=["dev"], dependencies=[Depends(check_dev_mode)])


@router.get("/mail")
def list_mail(
    db: DBSession,
):
    """List the 50 most recently sent emails (dev/testing endpoint — no auth)."""
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
    db: DBSession,
):
    """Retrieve a single sent email by ID, including its HTML body (dev/testing — no auth)."""
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
    db: DBSession,
):
    """Delete all stored sent emails (dev/testing endpoint — no auth)."""
    db.query(SentEmail).delete()
    db.commit()
