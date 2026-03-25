#!/usr/bin/env python
"""
Production Readiness Validation Script - Week 15

Validates that the ONTORA backend meets production security and reliability standards.
Run this before deployments to catch configuration issues early.
"""

import sys
import os
import json
import subprocess
import re
from pathlib import Path
from typing import List, Tuple, Dict

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class ValidationCheck:
    """Represents a single validation check."""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.passed = False
        self.message = ""
    
    def __str__(self):
        status = f"{Colors.GREEN}✓ PASS{Colors.END}" if self.passed else f"{Colors.RED}✗ FAIL{Colors.END}"
        return f"{status} {self.name}: {self.message}"

class ProductionValidator:
    """Validates production readiness."""
    
    def __init__(self):
        self.checks: List[ValidationCheck] = []
        self.backend_dir = Path(__file__).parent / "backend"
    
    def add_check(self, check: ValidationCheck):
        self.checks.append(check)
    
    def validate_environment(self) -> bool:
        """Check environment configuration."""
        check = ValidationCheck("Environment Configuration", "Check environment variables")
        
        required_vars = [
            "ENVIRONMENT",
            "DEBUG",
            "JWT_SECRET",
            "POSTGRES_PASSWORD",
            "NEO4J_PASSWORD"
        ]
        
        missing = [var for var in required_vars if not os.getenv(var)]
        
        if missing:
            check.message = f"Missing: {', '.join(missing)}"
            self.add_check(check)
            return False
        
        if os.getenv("ENVIRONMENT") != "production":
            check.message = f"Environment is {os.getenv('ENVIRONMENT')}, not production"
            self.add_check(check)
            return False
        
        if os.getenv("DEBUG").lower() == "true":
            check.message = "DEBUG is enabled in production!"
            self.add_check(check)
            return False
        
        jwt_secret = os.getenv("JWT_SECRET", "")
        if len(jwt_secret) < 32:
            check.message = f"JWT_SECRET too short ({len(jwt_secret)} chars, minimum 32)"
            self.add_check(check)
            return False
        
        check.passed = True
        check.message = "All required environment variables configured correctly"
        self.add_check(check)
        return True
    
    def validate_no_secrets_in_code(self) -> bool:
        """Verify no secrets are hardcoded in source files."""
        check = ValidationCheck("Secret Scanning", "Scan for hardcoded secrets")
        
        secret_patterns = [
            r"password\s*=\s*['\"].*['\"]",
            r"secret\s*=\s*['\"].*['\"]",
            r"api_key\s*=\s*['\"].*['\"]",
            r"token\s*=\s*['\"].*['\"]",
        ]
        
        found_secrets = []
        
        for py_file in self.backend_dir.rglob("*.py"):
            # Skip tests and migrations
            if "test" in str(py_file) or "__pycache__" in str(py_file):
                continue
            
            try:
                with open(py_file, "r") as f:
                    content = f.read()
                    for pattern in secret_patterns:
                        if re.search(pattern, content, re.IGNORECASE):
                            found_secrets.append(str(py_file))
                            break
            except Exception:
                pass
        
        if found_secrets:
            check.message = f"Potential secrets found in {len(found_secrets)} files"
            self.add_check(check)
            return False
        
        check.passed = True
        check.message = "No hardcoded secrets detected"
        self.add_check(check)
        return True
    
    def validate_security_headers(self) -> bool:
        """Verify security headers middleware is configured."""
        check = ValidationCheck("Security Headers", "Check for security headers middleware")
        
        try:
            with open(self.backend_dir / "middleware" / "security_hardening.py", "r") as f:
                content = f.read()
                
            required_headers = [
                "Strict-Transport-Security",
                "X-Frame-Options",
                "X-Content-Type-Options",
                "Content-Security-Policy"
            ]
            
            missing = [h for h in required_headers if h not in content]
            
            if missing:
                check.message = f"Missing headers: {', '.join(missing)}"
                self.add_check(check)
                return False
            
            check.passed = True
            check.message = "All security headers configured"
            self.add_check(check)
            return True
        except FileNotFoundError:
            check.message = "Security hardening middleware not found"
            self.add_check(check)
            return False
    
    def validate_rate_limiting(self) -> bool:
        """Verify rate limiting is configured."""
        check = ValidationCheck("Rate Limiting", "Check rate limiting middleware")
        
        try:
            with open(self.backend_dir / "middleware" / "security_hardening.py", "r") as f:
                content = f.read()
                
            if "RateLimitMiddleware" not in content:
                check.message = "Rate limiting middleware not found"
                self.add_check(check)
                return False
            
            check.passed = True
            check.message = "Rate limiting middleware configured"
            self.add_check(check)
            return True
        except FileNotFoundError:
            check.message = "Middleware file not found"
            self.add_check(check)
            return False
    
    def validate_audit_logging(self) -> bool:
        """Verify audit logging is implemented."""
        check = ValidationCheck("Audit Logging", "Check audit logging system")
        
        try:
            with open(self.backend_dir / "services" / "audit.py", "r") as f:
                content = f.read()
                
            if "AuditLogger" not in content:
                check.message = "Audit logger not found"
                self.add_check(check)
                return False
            
            check.passed = True
            check.message = "Audit logging system configured"
            self.add_check(check)
            return True
        except FileNotFoundError:
            check.message = "Audit service not found"
            self.add_check(check)
            return False
    
    def validate_rbac(self) -> bool:
        """Verify RBAC is implemented."""
        check = ValidationCheck("RBAC", "Check role-based access control")
        
        try:
            with open(self.backend_dir / "services" / "rbac.py", "r") as f:
                content = f.read()
                
            if "UserRole" not in content or "RBACContext" not in content:
                check.message = "RBAC definitions not found"
                self.add_check(check)
                return False
            
            check.passed = True
            check.message = "RBAC system configured"
            self.add_check(check)
            return True
        except FileNotFoundError:
            check.message = "RBAC service not found"
            self.add_check(check)
            return False
    
    def validate_requirements(self) -> bool:
        """Check for security-related package requirements."""
        check = ValidationCheck("Security Dependencies", "Check for secure package versions")
        
        try:
            with open(self.backend_dir / "requirements.txt", "r") as f:
                content = f.read()
            
            # Check for important security packages
            required_packages = [
                "fastapi",
                "pydantic",
                "sqlalchemy",
                "bcrypt",
                "pyjwt"
            ]
            
            missing = [pkg for pkg in required_packages if pkg not in content]
            
            if missing:
                check.message = f"Missing security packages: {', '.join(missing)}"
                self.add_check(check)
                return False
            
            check.passed = True
            check.message = "All security packages specified"
            self.add_check(check)
            return True
        except FileNotFoundError:
            check.message = "Requirements file not found"
            self.add_check(check)
            return False
    
    def validate_production_docker(self) -> bool:
        """Check Docker configuration for production."""
        check = ValidationCheck("Docker Config", "Check Dockerfile security")
        
        try:
            with open(self.backend_dir / "Dockerfile", "r") as f:
                content = f.read()
            
            issues = []
            
            # Check for non-root user (if specified)
            if "USER" not in content:
                issues.append("No non-root user specified")
            
            # Check for minimal base image
            if "python:3.11-slim" not in content and "python:3.12-slim" not in content:
                issues.append("Not using slim Python image")
            
            # Check for proper cleanup
            if "apt-get clean" not in content or "rm -rf /var/lib/apt/lists/" not in content:
                issues.append("Proper APT cleanup not found")
            
            if issues:
                check.message = f"Docker issues: {'; '.join(issues)}"
                self.add_check(check)
                return False
            
            check.passed = True
            check.message = "Dockerfile configured for production"
            self.add_check(check)
            return True
        except FileNotFoundError:
            check.message = "Dockerfile not found"
            self.add_check(check)
            return False
    
    def run_all_checks(self) -> Tuple[int, int]:
        """Run all validation checks."""
        print(f"\n{Colors.BLUE}=== ONTORA Production Readiness Validation ==={Colors.END}\n")
        
        self.validate_environment()
        self.validate_no_secrets_in_code()
        self.validate_security_headers()
        self.validate_rate_limiting()
        self.validate_audit_logging()
        self.validate_rbac()
        self.validate_requirements()
        self.validate_production_docker()
        
        passed = sum(1 for check in self.checks if check.passed)
        total = len(self.checks)
        
        print("\n--- Validation Results ---\n")
        for check in self.checks:
            print(check)
        
        print(f"\n{Colors.BLUE}Summary: {passed}/{total} checks passed{Colors.END}\n")
        
        return passed, total
    
    def print_summary(self, passed: int, total: int):
        """Print validation summary."""
        if passed == total:
            print(f"{Colors.GREEN}✓ All checks passed! Ready for production.{Colors.END}\n")
            return 0
        else:
            failed = total - passed
            print(f"{Colors.RED}✗ {failed} check(s) failed. Address issues before deploying.{Colors.END}\n")
            return 1
    
    def generate_report(self) -> Dict:
        """Generate validation report as JSON."""
        report = {
            "timestamp": str(os.popen("date").read().strip()),
            "total_checks": len(self.checks),
            "passed_checks": sum(1 for check in self.checks if check.passed),
            "checks": [
                {
                    "name": check.name,
                    "passed": check.passed,
                    "message": check.message
                }
                for check in self.checks
            ]
        }
        return report

def main():
    validator = ProductionValidator()
    passed, total = validator.run_all_checks()
    exit_code = validator.print_summary(passed, total)
    
    # Optionally save report
    if os.getenv("SAVE_VALIDATION_REPORT"):
        report = validator.generate_report()
        with open("validation_report.json", "w") as f:
            json.dump(report, f, indent=2)
        print(f"Report saved to validation_report.json\n")
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
