import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from config import Settings
from services.grok_bill_analyzer import GrokBillAnalyzer

async def main():
    settings = Settings()
    analyzer = GrokBillAnalyzer(settings)
    
    text = """
    A BILL TO BE ENTITLED
    THE DIGITAL PRIVACY PROTECTION ACT OF 2026

    SECTION 1. SHORT TITLE.
    This Act may be cited as the "Digital Privacy Protection Act of 2026".

    SECTION 2. FINDINGS.
    The Legislature finds that digital data collection by multi-national tech companies poses a severe risk to national sovereignty.

    SECTION 3. RESTRICTIONS ON CROSS-BORDER DATA FLOWS.
    Personal data of citizens shall not be transferred outside the country without explicit consent. In case of violations, strict penalties of up to 4% of global turnover will be imposed.

    SECTION 4. DATA LOCALIZATION.
    All critical infrastructure data must reside on domestic servers. This includes finance, health, and energy sectors.

    SECTION 5. EXEMPTIONS.
    Data necessary for law enforcement, subject to court orders, is exempt from these localization requirements.

    SECTION 6. IMPACT.
    This may cause disruption in cloud services globally and increase costs for tech entities operating within the nation. The US and EU text companies heavily rely on free data flow, so this will impact their trade relations.
    """
    
    logs = []
    print("Testing bill analysis...")
    analysis, logs = await analyzer.analyze_bill(text, logs)
    
    print("\n--- TEST LOGS ---")
    for log in logs:
        print(log)
        
    print("\n--- GLOBAL IMPACT ---")
    global_impact = analysis.get("global_impact", {})
    countries = global_impact.get("affected_countries", [])
    print(f"Affected countries: {len(countries)}")
    for c in countries:
        print(f" - {c.get('country')}: {c.get('impact_description')} ({c.get('sentiment')})")
        
    print("\n--- AMENDMENTS ---")
    amends = analysis.get("amendments", [])
    print(f"Found {len(amends)} amendments")
    for a in amends:
        print(f"Title: {a.get('title')}")
        print(f"Flaw: {a.get('original_flaw')}")
        print(f"Tweak: {a.get('powerful_tweak')}")
        print(f"Impact Before: {a.get('impact_before')}")
        print(f"Impact After: {a.get('impact_after')}")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
