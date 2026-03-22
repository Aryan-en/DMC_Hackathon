# ONTORA Security & Compliance Guide

## Table of Contents
1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Infrastructure Security](#infrastructure-security)
5. [API Security](#api-security)
6. [Compliance Standards](#compliance-standards)
7. [Security Incident Response](#security-incident-response)
8. [Security Audit Checklist](#security-audit-checklist)

---

## Security Overview

### Security Principles
1. **Defense in Depth** - Multiple layers of security controls
2. **Least Privilege** - Users/services have minimum required permissions
3. **Zero Trust** - Never trust, always verify
4. **Secure by Default** - Security enabled out-of-box
5. **Encryption Everywhere** - Data encrypted in transit and at rest

### Security Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Internet                            │
└──────────────────────┬────────────────────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │  Nginx (WAF + Rate Limit)  │
         └─────────────┬──────────────┘
                       │
         ┌─────────────▼──────────────┐
         │  TLS/SSL Termination       │
         └─────────────┬──────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼────┐        ┌───▼─────┐       ┌───▼────┐
│Backend  │        │Frontend │       │Workers │
│(Private)│        │(Private)│       │        │
└───┬────┘        └───┬─────┘       └────────┘
    │                 │
    │         ┌───────┼────────┐
    │         │       │        │
┌───▼─┬──────▼──┬────▼───┬───▼────┐
│PG   │ Redis   │Neo4j   │Kafka   │
│(PW) │(Auth)   │(Auth)  │(SASL)  │
└─────┴─────────┴────────┴────────┘

(PW) = Password protected
(Auth) = Authentication required
(SASL) = SASL/SSL authentication
```

---

## Authentication & Authorization

### User Authentication

#### OAuth2 / OpenID Connect

```yaml
# .env.prod configuration
OAUTH_PROVIDER: "google"  # or "github", "azure", "okta"
OAUTH_CLIENT_ID: "your-client-id"
OAUTH_CLIENT_SECRET: "${OAUTH_CLIENT_SECRET}"  # from secrets manager
OAUTH_REDIRECT_URI: "https://ontora.example.com/auth/callback"
```

#### Multi-Factor Authentication (MFA)

```python
# Backend: MFA implementation
from pyotp import totp

def setup_mfa(user_id):
    secret = pyotp.random_base32()
    user = User.query.get(user_id)
    user.mfa_secret = encrypt_secret(secret)  # encrypt before storing
    user.mfa_enabled = False  # requires verification
    db.session.commit()
    return secret

def verify_mfa_token(user_id, token):
    user = User.query.get(user_id)
    totp = pyotp.TOTP(decrypt_secret(user.mfa_secret))
    return totp.verify(token)
```

#### Password Policy

```python
# Password requirements
PASSWORD_MIN_LENGTH = 12
PASSWORD_COMPLEXITY = {
    'uppercase': True,      # At least one A-Z
    'lowercase': True,      # At least one a-z
    'numbers': True,        # At least one 0-9
    'special': True,        # At least one !@#$%^&*
}
PASSWORD_EXPIRY_DAYS = 90   # Force password change
PASSWORD_HISTORY = 5        # Can't reuse last 5 passwords
FAILED_LOGIN_LOCKOUT = 5    # Lock after 5 failed attempts
```

#### API Key Management

```python
# Secure API key handling
class APIKey(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    key_hash = db.Column(db.String(256), unique=True, nullable=False)
    # Never store raw key!
    permissions = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    last_used_at = db.Column(db.DateTime)
    revoked = db.Column(db.Boolean, default=False)

def create_api_key(user_id, permissions):
    key = secrets.token_urlsafe(32)
    key_hash = sha256(key.encode()).hexdigest()
    
    api_key = APIKey(
        id=str(uuid4()),
        user_id=user_id,
        key_hash=key_hash,
        permissions=permissions,
        expires_at=datetime.utcnow() + timedelta(days=90)
    )
    db.session.add(api_key)
    db.session.commit()
    
    return key  # Return only once!
```

### Authorization

#### Role-Based Access Control (RBAC)

```python
# Roles and permissions
ROLES = {
    'admin': ['read:*', 'write:*', 'delete:*', 'manage:users', 'manage:settings'],
    'analyst': ['read:*', 'write:predictions', 'write:exports'],
    'viewer': ['read:*'],
    'data_manager': ['read:*', 'write:data', 'manage:uploads'],
}

# Decorator for route protection
def require_permission(permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = current_user
            if not user.has_permission(permission):
                return {'error': 'Forbidden'}, 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/admin/users')
@require_permission('manage:users')
def manage_users():
    return jsonify(User.query.all())
```

#### Attribute-Based Access Control (ABAC)

```python
# More fine-grained control
class DataClassification:
    PUBLIC = 0
    INTERNAL = 1
    CONFIDENTIAL = 2
    RESTRICTED = 3

class Document(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    content = db.Column(db.Text)
    classification = db.Column(db.Integer, default=DataClassification.INTERNAL)
    required_clearance = db.Column(db.Integer, default=DataClassification.INTERNAL)
    department = db.Column(db.String(50))
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'))

def can_access_document(user, document):
    # User's clearance must meet document's required clearance
    if user.clearance_level < document.required_clearance:
        return False
    
    # Department check for RESTRICTED documents
    if document.classification == DataClassification.RESTRICTED:
        return user.department == document.department or user.is_admin
    
    return True
```

---

## Data Protection

### Encryption in Transit (TLS/SSL)

```yaml
# Nginx configuration
server {
    listen 443 ssl http2;
    server_name ontora.example.com;
    
    # SSL certificates
    ssl_certificate /etc/ssl/certs/ontora.crt;
    ssl_certificate_key /etc/ssl/private/ontora.key;
    ssl_trusted_certificate /etc/ssl/certs/ca-bundle.crt;
    
    # Strong cipher suites (TLS 1.3 preferred, 1.2 minimum)
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS (force HTTPS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Additional security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" always;
    
    location / {
        proxy_pass http://frontend-app;
        proxy_ssl_verify off;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ontora.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Encryption at Rest

#### Database Encryption

```python
# PostgreSQL Transparent Data Encryption (TDE)
# Enable in production hosting (AWS RDS, GCP Cloud SQL, Azure Database)

# Column-level encryption for sensitive data
from cryptography.fernet import Fernet
import os

class EncryptedValue:
    def __init__(self, key=None):
        self.cipher = Fernet(key or os.getenv('ENCRYPTION_KEY').encode())
    
    def encrypt(self, value):
        return self.cipher.encrypt(value.encode()).decode()
    
    def decrypt(self, encrypted_value):
        return self.cipher.decrypt(encrypted_value.encode()).decode()

# Usage in model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True)
    
    _ssn = db.Column('ssn', db.String(255))
    
    @property
    def ssn(self):
        return EncryptedValue().decrypt(self._ssn)
    
    @ssn.setter
    def ssn(self, value):
        self._ssn = EncryptedValue().encrypt(value)
```

#### Backup Encryption

```bash
# Encrypt database backups
pg_dump ontora_prod | gpg --encrypt --recipient admin@example.com > backup.sql.gpg

# Verify encrypted backup
gpg --list-only backup.sql.gpg

# Restore from encrypted backup
gpg --decrypt backup.sql.gpg | psql ontora_prod

# Store backup encryption key securely
# - Use HSM (Hardware Security Module) for key storage
# - Or AWS KMS / GCP Cloud KMS / Azure Key Vault
```

### Data Retention & Purging

```python
# Automatic deletion of old data
from datetime import datetime, timedelta

class DataRetention:
    # Retention periods by data type
    RETENTION_POLICIES = {
        'access_logs': timedelta(days=90),
        'audit_logs': timedelta(days=365),
        'error_logs': timedelta(days=30),
        'export_history': timedelta(days=180),
        'session_data': timedelta(days=7),
    }

# Cleanup job
def purge_old_data():
    now = datetime.utcnow()
    
    # Purge access logs
    AccessLog.query.filter(
        AccessLog.created_at < now - DataRetention.RETENTION_POLICIES['access_logs']
    ).delete()
    
    # Purge audit logs
    AuditLog.query.filter(
        AuditLog.created_at < now - DataRetention.RETENTION_POLICIES['audit_logs']
    ).delete()
    
    db.session.commit()

# Schedule with APScheduler
from apscheduler.schedulers.background import BackgroundScheduler
scheduler = BackgroundScheduler()
scheduler.add_job(func=purge_old_data, trigger="cron", hour=2, minute=0)
scheduler.start()
```

---

## Infrastructure Security

### Network Security

#### Firewall Rules

```bash
# Example: UFW (Uncomplicated Firewall) on Linux

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (restricted to admin IPs)
ufw allow from 203.0.113.0/24 to any port 22

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow internal service communication (Docker)
ufw allow from 172.16.0.0/12

# Deny all else
ufw enable

# View rules
ufw status verbose
```

#### VPC/Network Segmentation

```yaml
# Docker network architecture
networks:
  ontora_public:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  
  ontora_private:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16
  
  ontora_database:
    driver: bridge
    ipam:
      config:
        - subnet: 172.22.0.0/16

services:
  nginx:
    networks:
      - ontora_public
    # Accessible from internet
  
  backend:
    networks:
      - ontora_private
      - ontora_database
    # Only accessible from nginx and internal services
  
  postgres:
    networks:
      - ontora_database
    # Only accessible from backend
```

### Container Security

#### Container Image Scanning

```bash
# Scan for vulnerabilities
trivy image ontora-backend:latest
trivy image ontora-frontend:latest

# Fix vulnerabilities in Dockerfile
# Use specific base image versions
FROM python:3.11.4-slim  # Pin version, use slim variant
# Docker official image, no 'latest'

# Update base packages
RUN apt-get update && apt-get upgrade -y

# Remove unnecessary packages
RUN apt-get remove -y wget curl

# Use non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Enable security scanning in CI/CD
# Add to GitHub Actions, GitLab CI, or Jenkins
```

#### Container Runtime Security

```yaml
# docker-compose.prod.yml security settings
backend:
  image: ontora-backend:1.0.0
  
  # Run as non-root user
  user: 1000:1000
  
  # Read-only root filesystem
  read_only: true
  
  # Drop unnecessary capabilities
  cap_drop:
    - ALL
  cap_add:
    - NET_BIND_SERVICE
    - SYS_SIGNAL
  
  # Resource limits
  mem_limit: 2g
  memswap_limit: 2g
  cpus: 2.0
  
  # No new privileges
  security_opt:
    - no-new-privileges:true
  
  # Disable privileged mode
  privileged: false
  
  # Volume mounts
  volumes:
    - app_data:/app/data:rw
    - /tmp:/tmp:rw
  
  # tmpfs for sensitive temporary data
  tmpfs:
    - /tmp
    - /var/tmp
```

### Secret Management

```python
# Use secrets manager instead of environment variables
import os
from google.cloud import secretmanager  # or AWS Secrets Manager, Azure Key Vault

def access_secret(secret_id, project_id='your-project'):
    """Access secret from Google Secret Manager"""
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

# Usage
DATABASE_URL = access_secret('DATABASE_URL')
JWT_SECRET = access_secret('JWT_SECRET_KEY')
STRIPE_API_KEY = access_secret('STRIPE_SECRET_KEY')

# Never log secrets
import logging
class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        # Redact sensitive data from logs
        record.msg = str(record.msg).replace(DATABASE_URL, '***')
        return True

logging.getLogger().addFilter(SensitiveDataFilter())
```

---

## API Security

### Input Validation

```python
from marshmallow import Schema, fields, validate, ValidationError

class ConflictPredictionSchema(Schema):
    """Input validation for conflict prediction API"""
    region = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100)
    )
    date_range_start = fields.DateTime(
        required=True,
        validate=validate.Range(min=datetime(2020, 1, 1))
    )
    date_range_end = fields.DateTime(
        required=True,
    )
    factors = fields.List(
        fields.Str(validate=validate.OneOf([
            'political', 'economic', 'social', 'military'
        ])),
        validate=validate.Length(min=1, max=10)
    )
    confidence_threshold = fields.Float(
        validate=validate.Range(min=0, max=1),
        missing=0.7
    )

# Route with validation
@app.route('/api/predictions/conflict-risk', methods=['POST'])
@require_permission('read:*')
def predict_conflict_risk():
    schema = ConflictPredictionSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return {'errors': err.messages}, 400
    
    # Process validated data
    return jsonify(conflict_service.predict(**data))
```

### Rate Limiting

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_limiter.strategies import MovingWindowRateLimiter

limiter = Limiter(
    key_func=get_remote_address,
    strategy="moving-window",
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/predictions/conflict-risk', methods=['POST'])
@limiter.limit("10 per minute")  # Expensive endpoint
def predict_conflict_risk():
    return jsonify(...)

@app.route('/api/data/export', methods=['POST'])
@limiter.limit("5 per hour")  # Restricted endpoint
def request_export():
    return jsonify(...)

# Custom limits per user
@app.route('/api/streams/events', methods=['GET'])
@limiter.limit(lambda: "1000 per hour" if current_user.is_premium else "100 per hour")
def stream_events():
    return jsonify(...)
```

### SQL Injection Prevention

```python
# Always use parameterized queries with SQLAlchemy (ORM)
GOOD:
predictions = Prediction.query.filter(
    Prediction.region == region,
    Prediction.timestamp > start_date
).all()

BAD (Never do this):
query = f"SELECT * FROM predictions WHERE region = '{region}'"
predictions = db.session.execute(query)

# For raw SQL, use parameters
query = """
    SELECT * FROM predictions 
    WHERE region = :region AND timestamp > :start_date
"""
predictions = db.session.execute(query, {'region': region, 'start_date': start_date})
```

### CORS Configuration

```python
from flask_cors import CORS

# Restrict CORS to specific origins
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://ontora.example.com",
            "https://app.ontora.example.com"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["X-Total-Count"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Don't allow all origins
CORS(app, resources={r"/api/*": {"origins": "*"}})  # NOT RECOMMENDED
```

---

## Compliance Standards

### GDPR Compliance

- **Data Minimization**: Collect only necessary data
- **Consent Management**: Explicit opt-in, easy opt-out
- **Right to Access**: User can download their data
- **Right to Erasure**: User can request data deletion
- **Data Portability**: Export in standard format
- **Breach Notification**: 72-hour notification requirement

```python
class GDPRCompliance:
    @staticmethod
    def export_user_data(user_id):
        """Export all user data in portable format"""
        user = User.query.get(user_id)
        data = {
            'profile': user.to_dict(),
            'access_logs': [log.to_dict() for log in user.access_logs],
            'exports': [exp.to_dict() for exp in user.export_requests],
            'predictions': [pred.to_dict() for pred in user.predictions],
        }
        return data

    @staticmethod
    def delete_user_data(user_id):
        """Delete user and related data"""
        user = User.query.get(user_id)
        # Soft delete - mark as deleted but keep for legal requirements
        user.deleted_at = datetime.utcnow()
        user.email = f"deleted-{user_id}@deleted.invalid"
        db.session.commit()

    @staticmethod
    def notify_breach(affected_user_count, breach_date, description):
        """Notify users of data breach within 72 hours"""
        # Send email to affected users
        # Notify regulatory authorities
        # Log incident
        pass
```

### SOC 2 Type II

- **Security**: Access controls, encryption, monitoring
- **Availability**: Uptime targets (99.9%), redundancy
- **Processing Integrity**: Data accuracy, completeness
- **Confidentiality**: Encryption, access controls
- **Privacy**: GDPR/CCPA compliance

### ISO 27001

- Comprehensive information security management
- Risk assessment and treatment
- Access control and authentication
- Cryptography
- Audit logging and monitoring

### Deployment Compliance Checklist

```yaml
Security Controls Checklist:
Encryption:
  - [ ] TLS 1.3 for all external communication
  - [ ] AES-256 for data at rest
  - [ ] Encrypted backups
  - [ ] Encrypted secrets management

Access Control:
  - [ ] Multi-factor authentication for admin accounts
  - [ ] Role-based access control (RBAC)
  - [ ] Service accounts with minimum privileges
  - [ ] Regular access reviews

Monitoring:
  - [ ] Audit logging enabled
  - [ ] Security event monitoring
  - [ ] Intrusion detection
  - [ ] Regular log review

Vulnerability Management:
  - [ ] Regular vulnerability scans
  - [ ] Patch management process
  - [ ] Security testing in CI/CD
  - [ ] Incident response plan

Data Protection:
  - [ ] Data classification
  - [ ] Retention policies enforced
  - [ ] Secure deletion procedures
  - [ ] Data export controls
```

---

## Security Incident Response

### Incident Response Plan

#### Step 1: Detect & Report
```
- Security tool alerts
- User reports
- Third-party notifications

⬇️
Create incident ticket with:
- Timestamp
- Severity (Critical/High/Medium/Low)
- Affected systems
- Initial assessment
```

#### Step 2: Contain
```
- Isolate affected systems
- Prevent further damage
- Preserve evidence

Examples:
- Revoke compromised credentials
- Block malicious IP addresses
- Take affected service offline if necessary
```

#### Step 3: Eradicate
```
- Identify root cause
- Remove malware/backdoors
- Patch vulnerabilities
- Verify fixes
```

#### Step 4: Recover
```
- Restore from clean backups
- Rebuild affected systems
- Restore normal operations
- Verify data integrity
```

#### Step 5: Lessons Learned
```
- Document incident
- Analyze failure points
- Update safeguards
- Communicate findings
```

### Incident Response Contacts

```
Primary Incident Commander: [Name] - [Phone] - [Email]
Security Lead: [Name] - [Phone] - [Email]
Database Administrator: [Name] - [Phone] - [Email]
Legal Counsel: [Name] - [Phone] - [Email]
Communications: [Name] - [Phone] - [Email]

Escalation Path:
- Incident Commander → Engineering Manager → Director of Engineering → Chief Security Officer
```

---

## Security Audit Checklist

### Pre-Deployment Audit
- [ ] All components built from approved base images
- [ ] No hardcoded secrets in code
- [ ] Dependencies scanned for vulnerabilities
- [ ] Code reviewed by security team
- [ ] Security tests passing
- [ ] SAST (Static Analysis) passing
- [ ] DAST (Dynamic Analysis) passing

### Post-Deployment Audit
- [ ] SSL certificate valid and not self-signed
- [ ] Security headers present
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Audit logging active
- [ ] Monitoring alerts configured
- [ ] Backups working and tested
- [ ] Access logs being retained

### Monthly Audit
- [ ] Review access logs for anomalies
- [ ] Verify backup integrity
- [ ] Check certificate expiration (< 30 days warning)
- [ ] Review security headers
- [ ] Audit user permissions
- [ ] Verify deletion of old logs per policy
- [ ] Review API usage for abuse patterns

### Annual Audit
- [ ] Full security assessment
- [ ] Vulnerability scanning
- [ ] Penetration testing
- [ ] Compliance audit
- [ ] Disaster recovery drill
- [ ] Update security policies

---

**Last Updated**: 2026-03-22
**Review Schedule**: Quarterly
**Next Audit**: 2026-06-22
