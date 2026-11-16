from datetime import datetime, timezone
from sqlalchemy import JSON, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def now():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Student(Base):
    __tablename__ = 'students'
    id: Mapped[int] = mapped_column(primary_key=True)
    source_key: Mapped[str] = mapped_column(String(100), unique=True)
    features: Mapped[dict] = mapped_column(JSON)
    target: Mapped[str] = mapped_column(String(20))


class ModelRun(Base):
    __tablename__ = 'model_runs'
    __table_args__ = (UniqueConstraint('name', 'version'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(40))
    version: Mapped[str] = mapped_column(String(80))
    metrics: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Prediction(Base):
    __tablename__ = 'predictions'
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey('students.id'))
    model_run_id: Mapped[int] = mapped_column(ForeignKey('model_runs.id'))
    result: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ClusterAssignment(Base):
    __tablename__ = 'cluster_assignments'
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey('students.id'))
    model_run_id: Mapped[int] = mapped_column(ForeignKey('model_runs.id'))
    result: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
