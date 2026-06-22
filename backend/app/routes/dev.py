from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.email import SentEmail

router = APIRouter(prefix="/api/dev", tags=["dev"])


@router.get("/mail")
def list_mail(db: Session = Depends(get_db)):
    emails = (
        db.query(SentEmail)
        .order_by(SentEmail.sent_at.desc())
        .limit(50)
        .all()
    )
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
def get_mail(email_id: str, db: Session = Depends(get_db)):
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
def clear_mail(db: Session = Depends(get_db)):
    db.query(SentEmail).delete()
    db.commit()
