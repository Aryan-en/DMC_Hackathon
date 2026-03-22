#!/usr/bin/env python3
"""
Create sample PDF bills for testing the bill analysis system.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from pathlib import Path

def create_sample_bill(filename: str, title: str, content: str) -> str:
    """Create a sample bill PDF."""
    doc = SimpleDocTemplate(filename, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor='#000000',
        spaceAfter=12,
        alignment=1  # Center alignment
    )
    
    # Add title
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Add content paragraphs
    for paragraph in content.split('\n\n'):
        if paragraph.strip():
            story.append(Paragraph(paragraph, styles['BodyText']))
            story.append(Spacer(1, 0.1*inch))
    
    # Build PDF
    doc.build(story)
    return filename

# Create sample bills
bills_dir = Path("sample_bills")
bills_dir.mkdir(exist_ok=True)

# Bill 1: Digital Privacy Act
bill1_content = """
<b>An Act to Establish Data Protection Standards and Consumer Privacy Rights</b>

Be it enacted by the Senate and House of Representatives of the United States of America in Congress assembled:

<b>SEC. 1. SHORT TITLE AND FINDINGS</b>

This Act may be cited as the 'Digital Privacy Protection Act of 2025'. Congress finds that:

(1) Personal data has become a valuable asset in the digital economy;
(2) Consumers are often unaware of how their data is collected, used, and shared;
(3) The current fragmented regulatory landscape creates confusion and inconsistency;
(4) There is a strong need for uniform privacy standards across all states;
(5) Data breaches have increased exponentially in recent years.

<b>SEC. 2. DEFINITIONS</b>

As used in this Act:

(1) 'Personal data' means information that identifies or reasonably could identify an individual;
(2) 'Data controller' means any entity that determines the purposes of data processing;
(3) 'Data processor' means any entity that processes personal data on behalf of the controller;
(4) 'Consumer' means a natural person whose personal data is collected;
(5) 'Data breach' means unauthorized access or disclosure of personal data.

<b>SEC. 3. CONSUMER RIGHTS</b>

(a) Right to Know: Consumers shall have the right to know what personal data is collected about them.
(b) Right to Access: Consumers may request and obtain a copy of their personal data.
(c) Right to Portability: Consumers may obtain their data in a portable format.
(d) Right to Deletion: Consumers may request deletion of their personal data in most contexts.
(e) Right to Opt-Out: Consumers may opt out of sale or sharing of their data.
(f) Right to Non-Discrimination: Businesses shall not discriminate against consumers for exercising privacy rights.

<b>SEC. 4. BUSINESS OBLIGATIONS</b>

(a) Data minimization: Businesses shall only collect data that is necessary for specified purposes.
(b) Security requirements: All personal data must be protected with appropriate technical and organizational measures.
(c) Breach notification: Entities must notify consumers without unreasonable delay of breaches.
(d) Privacy policies: Clear, concise privacy policies must be maintained and be easily accessible.
(e) Data protection assessments: High-risk processing requires impact assessments.
(f) Appointment of data protection officer: Large entities processing substantial amounts of data shall designate a DPO.

<b>SEC. 5. ENFORCEMENT AND PENALTIES</b>

(a) The Federal Trade Commission shall enforce this Act;
(b) Violations may result in civil penalties up to $5,000 per violation or 2% of gross revenue, whichever is greater;
(c) Private right of action for consumers: Consumers may sue for violations resulting in damages;
(d) The FTC may seek injunctive relief and consumer restitution.

<b>SEC. 6. EFFECTIVE DATE</b>

This Act shall take effect eighteen months after enactment.
"""

create_sample_bill(
    str(bills_dir / "digital_privacy_act.pdf"),
    "Digital Privacy Protection Act",
    bill1_content
)

print("[+] Created sample_bills/digital_privacy_act.pdf")

# Bill 2: Climate Action Initiative
bill2_content = """
<b>An Act to Accelerate Transition to Clean Energy and Reduce Greenhouse Gas Emissions</b>

Be it enacted by the Senate and House of Representatives:

<b>SEC. 1. PURPOSE</b>

The purpose of this Act is to:
(1) Transition the United States to 80% clean energy by 2035;
(2) Create millions of clean energy jobs;
(3) Reduce greenhouse gas emissions by 75% below 2005 levels;
(4) Invest in renewable energy infrastructure;
(5) Support affected workers and communities.

<b>SEC. 2. CLEAN ENERGY INVESTMENT PROGRAM</b>

(a) Authorization: $500 billion is authorized to be appropriated for clean energy development;
(b) Focus areas: Solar, wind, geothermal, hydroelectric, and emerging technologies;
(c) Geographic distribution: Investment shall prioritize historically disadvantaged communities;
(d) Private sector matching: Tax incentives for private investment in clean energy.

<b>SEC. 3. FOSSIL FUEL PHASE-OUT</b>

(a) Coal power plant phase-out by 2030;
(b) Natural gas requirements reduced by 30% by 2030;
(c) Oil and gas subsidies eliminated;
(d) Carbon pricing mechanism established.

<b>SEC. 4. WORKFORCE DEVELOPMENT</b>

(a) $100 billion in training programs for affected workers;
(b) Wage guarantees for clean energy workers;
(c) Pension protection for displaced coal miners;
(d) Community support programs for fossil fuel-dependent regions.

<b>SEC. 5. EFFECTIVE DATE</b>

This Act takes effect upon enactment.
"""

create_sample_bill(
    str(bills_dir / "climate_action_initiative.pdf"),
    "Climate Action Initiative",
    bill2_content
)

print("[+] Created sample_bills/climate_action_initiative.pdf")

# Bill 3: Trade Facilitation Act
bill3_content = """
<b>An Act to Simplify and Streamline International Trade Procedures</b>

Be it enacted by the Senate and House of Representatives:

<b>SEC. 1. TITLE</b>

This Act may be cited as the 'Trade Facilitation and Competitiveness Act of 2025'.

<b>SEC. 2. CUSTOMS MODERNIZATION</b>

(a) Advance filing requirements reduced from 24 hours to 2 hours;
(b) Harmonization with international standards;
(c) Risk assessment modernization for improved clearance;
(d) Single window for trade documentation;
(e) Enhanced enforcement against counterfeits and smuggling.

<b>SEC. 3. EXPORT PROMOTION</b>

(a) $50 billion for small and medium enterprise export funding;
(b) Trade mission grants for business development;
(c) Export financing improvements;
(d) Market research assistance programs.

<b>SEC. 4. DISPUTE RESOLUTION</b>

(a) Expedited procedures for trade disputes;
(b) Establishment of trade arbitration centers;
(c) Support for businesses in dispute resolution;
(d) Enhanced cooperation with trading partners.

<b>SEC. 5. IMPLEMENTATION</b>

This Act shall be implemented within 12 months of enactment and its provisions shall be effective for 5 fiscal years.
"""

create_sample_bill(
    str(bills_dir / "trade_facilitation_act.pdf"),
    "Trade Facilitation Act",
    bill3_content
)

print("[+] Created sample_bills/trade_facilitation_act.pdf")

print("\n[OK] Sample bills created in sample_bills/ directory")
print("Use these files to test the Bill Amendment analysis feature")
