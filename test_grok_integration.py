"""
Example: Using Grok API for 300+ Page Bill Analysis

This script demonstrates how to test the bill analysis endpoint
with efficient Grok API processing for large documents.
"""

import asyncio
import httpx
import json
from pathlib import Path


async def test_bill_analysis(bill_path: str = "sample_bills/digital_privacy_act.pdf"):
    """
    Test the bill analysis endpoint with a PDF file.
    
    Args:
        bill_path: Path to the PDF bill file
    
    Example:
        # Test with 300+ page bill
        python test_grok_integration.py
        
        # Get progress updates in real-time
        # See logs section of response for Grok processing details
    """
    
    bill_file = Path(bill_path)
    
    if not bill_file.exists():
        print(f"❌ Bill file not found: {bill_path}")
        print("   Create a PDF in the sample_bills directory first")
        return
    
    print(f"📄 Testing bill analysis with: {bill_path}")
    print(f"   File size: {bill_file.stat().st_size / 1024 / 1024:.2f} MB")
    print("   Uploading to /api/bill-analysis/analyze...")
    print("-" * 60)
    
    with open(bill_file, "rb") as f:
        files = {"file": ("bill.pdf", f, "application/pdf")}
        
        try:
            async with httpx.AsyncClient(timeout=300) as client:
                # POST the bill for analysis
                response = await client.post(
                    "http://localhost:8000/api/bill-analysis/analyze",
                    files=files
                )
                
                result = response.json()
                
                # Display progress and logs
                if "logs" in result:
                    print("\n📊 Analysis Progress:")
                    for log in result["logs"]:
                        print(f"   {log}")
                
                print("-" * 60)
                
                # Display results summary
                if result.get("success"):
                    data = result.get("data", {})
                    print(f"\n✅ Analysis Complete!")
                    print(f"   Bill Title: {data.get('bill_title', 'Unknown')}")
                    print(f"   Country: {data.get('country', 'Unknown')}")
                    print(f"   Pages: {data.get('pages', 'N/A')}")
                    print(f"   Words: {data.get('words', 'N/A')}")
                    print(f"   Risk Level: {data.get('risk_assessment', {}).get('risk_level', 'N/A')}")
                    print(f"   Risk Probability: {data.get('risk_assessment', {}).get('probability', 'N/A')}")
                    
                    # Summary preview
                    summary = data.get('bill_summary', '')
                    if summary:
                        preview = summary[:200] + "..." if len(summary) > 200 else summary
                        print(f"\n📝 Summary:\n   {preview}")
                    
                    # Pros/Cons
                    pros = data.get('pros', [])
                    cons = data.get('cons', [])
                    if pros:
                        print(f"\n✨ Top Pros:")
                        for pro in pros[:3]:
                            print(f"   • {pro}")
                    if cons:
                        print(f"\n⚠️  Top Cons:")
                        for con in cons[:3]:
                            print(f"   • {con}")
                    
                    # Full response for debugging
                    print("\n" + "=" * 60)
                    print("Full JSON Response (for debugging):")
                    print(json.dumps(result, indent=2)[:1000] + "...")
                else:
                    print(f"\n❌ Analysis failed: {result.get('error', 'Unknown error')}")
                    if "logs" in result:
                        print("   Logs:")
                        for log in result["logs"]:
                            print(f"   {log}")
        
        except httpx.ConnectError:
            print("❌ Connection Error")
            print("   Make sure backend is running:")
            print("   python -m uvicorn backend.main:app --reload --port 8000")
        except Exception as e:
            print(f"❌ Error: {str(e)}")


async def check_grok_status():
    """Check if Grok API is properly configured"""
    
    print("🔍 Checking Grok API Status...")
    print("-" * 60)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://localhost:8000/api/bill-analysis/status"
            )
            
            result = response.json()
            
            if result.get("success"):
                data = result.get("data", {})
                print(f"✅ Grok API Status Check:")
                print(f"   Grok Enabled: {data.get('grok_enabled', False)}")
                print(f"   Model: {data.get('model', 'N/A')}")
                print(f"   Chunk Size: {data.get('chunk_size', 'N/A')} words")
                print(f"   Max Tokens: {data.get('max_tokens', 'N/A')}")
                print(f"   Timeout: {data.get('timeout_sec', 'N/A')}s")
                print(f"   Max Retries: {data.get('max_retries', 'N/A')}")
                print(f"   Temperature: {data.get('temperature', 'N/A')}")
                
                if not data.get('grok_enabled'):
                    print("\n⚠️  Warning: Grok API is disabled!")
                    print("   Set GROK_API_KEY in .env and restart backend")
            else:
                print(f"❌ Status check failed: {result.get('error', 'Unknown')}")
    
    except httpx.ConnectError:
        print("❌ Cannot connect to backend")
        print("   Ensure backend is running on port 8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


async def main():
    """Main test runner"""
    
    print("\n" + "=" * 60)
    print("🚀 Bill Analysis - Grok API Integration Test")
    print("=" * 60)
    
    # Check Grok status first
    await check_grok_status()
    
    print("\n" + "=" * 60)
    
    # Then test bill analysis
    await test_bill_analysis()
    
    print("\n" + "=" * 60)
    print("✅ Test complete!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
