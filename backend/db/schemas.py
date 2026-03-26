"""
SQLAlchemy Database Models for PostgreSQL
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text, Enum, ForeignKey, Table, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from db.postgres import Base


class Country(Base):
    """Country entity"""
    __tablename__ = "countries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    iso_code = Column(String(3), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)  # Add index for name lookups
    region = Column(String(100), nullable=True, index=True)  # Add index for region filtering
    continent = Column(String(50), nullable=True, index=True)  # Add index for continent filtering
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Add index for time-based queries
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    economic_indicators = relationship("EconomicIndicator", back_populates="country")
    relations_as_a = relationship(
        "CountryRelation",
        foreign_keys="CountryRelation.country_a_id",
        back_populates="country_a",
    )
    relations_as_b = relationship(
        "CountryRelation",
        foreign_keys="CountryRelation.country_b_id",
        back_populates="country_b",
    )
    
    # Indexes for common query patterns
    __table_args__ = (
        Index("idx_countries_name_region", "name", "region"),
        Index("idx_countries_continent_name", "continent", "name"),
    )


class CountryRelation(Base):
    """Bilateral relations between countries"""
    __tablename__ = "country_relations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_a_id = Column(UUID(as_uuid=True), ForeignKey("countries.id"), nullable=False, index=True)
    country_b_id = Column(UUID(as_uuid=True), ForeignKey("countries.id"), nullable=False, index=True)
    relation_type = Column(String(50), nullable=False, index=True)  # 'bilateral', 'multilateral', 'disputed'
    status = Column(String(50), nullable=False, index=True)  # 'stable', 'tense', 'active_dispute', 'conflict'
    trade_volume = Column(Float, nullable=True, index=True)  # USD millions
    sentiment = Column(String(50), nullable=True, index=True)  # 'positive', 'neutral', 'negative'
    confidence_score = Column(Float, nullable=True, index=True)  # 0-1
    agreements = Column(JSONB, nullable=True)  # List of agreements
    key_issues = Column(JSONB, nullable=True)  # List of current issues
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    source = Column(String(50), default="MEA", index=True)
    
    # Relationships
    country_a = relationship("Country", foreign_keys=[country_a_id], back_populates="relations_as_a")
    country_b = relationship("Country", foreign_keys=[country_b_id], back_populates="relations_as_b")
    
    # Indexes for common query patterns in bilateral relations
    __table_args__ = (
        Index("idx_country_relations_a_b", "country_a_id", "country_b_id"),
        Index("idx_country_relations_status", "status"),
        Index("idx_country_relations_type", "relation_type"),
        Index("idx_country_relations_confidence", "confidence_score"),
        Index("idx_country_relations_updated", "last_updated"),
    )


class EconomicIndicator(Base):
    """World Bank economic indicators"""
    __tablename__ = "economic_indicators"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_id = Column(UUID(as_uuid=True), ForeignKey("countries.id"), nullable=False)
    indicator_code = Column(String(50), nullable=False)  # e.g., 'NY.GDP.MKTP.CD'
    indicator_name = Column(String(255), nullable=False)
    value = Column(Float, nullable=True)
    year = Column(Integer, nullable=False)
    unit = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    country = relationship("Country", back_populates="economic_indicators")
    
    # Index for efficient querying
    __table_args__ = (
        Index("idx_country_indicator_year", "country_id", "indicator_code", "year"),
    )


class Document(Base):
    """Raw documents (news, relations data, etc.)"""
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=True)
    content = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)  # 'MEA', 'NEWS', 'SOCIAL'
    language = Column(String(10), default='en')
    url = Column(String(2000), nullable=True)
    published_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
    doc_metadata = Column(JSONB, nullable=True)


class Entity(Base):
    """Extracted entities (persons, organizations, etc.)"""
    __tablename__ = "entities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False, index=True)  # 'PERSON', 'ORG', 'GPE', 'EVENT', 'CONCEPT'
    name = Column(String(500), nullable=False, index=True)  # Add index for name lookups
    description = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True, index=True)  # Add index for confidence filtering
    mention_count = Column(Integer, default=1, index=True)  # Add index for popular entity detection
    sentiment = Column(String(20), nullable=True, index=True)  # Add index for sentiment filtering
    properties = Column(JSONB, nullable=True)  # Core OWL/Ontology properties
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Add index for time-based queries
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes for common query patterns in knowledge graph
    __table_args__ = (
        Index("idx_entities_type_name", "entity_type", "name"),
        Index("idx_entities_created_at", "created_at"),
        Index("idx_entities_confidence", "confidence_score"),
    )


class Relationship(Base):
    """Extracted relationships (triplets)"""
    __tablename__ = "relationships"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False, index=True)
    predicate = Column(String(100), nullable=False, index=True)
    object_entity_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False, index=True)
    confidence_score = Column(Float, nullable=True, index=True)
    source_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True, index=True)
    url = Column(String(2000), nullable=True) # Direct source link for quick access
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Indexes for common query patterns in knowledge graph traversal
    __table_args__ = (
        Index("idx_relationships_subject_predicate", "subject_entity_id", "predicate"),
        Index("idx_relationships_predicate_object", "predicate", "object_entity_id"),
        Index("idx_relationships_subject_object", "subject_entity_id", "object_entity_id"),
        Index("idx_relationships_confidence", "confidence_score"),
        Index("idx_relationships_created_at", "created_at"),
    )


class AuditLog(Base):
    """Audit log for access control and compliance"""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)  # 'READ', 'WRITE', 'EXPORT', 'DELETE'
    resource = Column(String(255), nullable=False)
    classification = Column(String(20), nullable=True)  # 'UNCLASS', 'SECRET', 'TS'
    status = Column(String(20), nullable=False)  # 'ALLOW', 'DENY'
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    details = Column(JSONB, nullable=True)


class User(Base):
    """User accounts"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    roles = Column(JSONB, default=['analyst'], nullable=False)  # List of roles: admin, analyst, viewer, etc.
    clearance_level = Column(String(20), default='FOUO')  # UNCLASS, FOUO, SECRET, TS, TS/SCI
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SystemMetric(Base):
    """System performance and health metrics"""
    __tablename__ = "system_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    tags = Column(JSONB, nullable=True)


class BillAnalysis(Base):
    """Legislative bill analysis results"""
    __tablename__ = "bill_analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bill_title = Column(String(500), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    status = Column(String(50), default="completed") # processing, completed, failed
    analysis_data = Column(JSONB, nullable=False) # The full JSON result
    model_used = Column(String(100), nullable=True)
    provider = Column(String(50), nullable=True)
    pages = Column(Integer, nullable=True)
    words = Column(Integer, nullable=True)
    source_url = Column(String(2000), nullable=True) # If analyzed from URL
    created_at = Column(DateTime, default=datetime.utcnow)

class OntologyVersion(Base):
    """Ontology/versioning metadata for schema evolution."""
    __tablename__ = "ontology_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version = Column(String(50), nullable=False, unique=True, index=True)
    applied_at = Column(DateTime, default=datetime.utcnow, index=True)
    previous_version = Column(String(50), nullable=True)
    changes = Column(JSONB, nullable=True)
    current = Column(Boolean, default=True, index=True)


