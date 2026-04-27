import os
import asyncio
from backend.services.gemini_service import classify_crisis

# Mock incident scenarios for testing
SCENARIOS = [
    {
        "text": "Fire in the main kitchen on the ground floor. Heavy smoke, alarm is sounding.",
        "expected_type": "fire",
        "expected_severity": "critical"
    },
    {
        "text": "A guest has collapsed in the lobby. Unconscious but breathing. Need a doctor immediately.",
        "expected_type": "medical",
        "expected_severity": "critical"
    },
    {
        "text": "Power failure throughout the hotel. Elevators are stuck between floors with guests inside.",
        "expected_type": "power",
        "expected_severity": "high"
    }
]

def test_scenarios():
    print("\n=== Running Crisis Classification Integration Tests ===")
    for scenario in SCENARIOS:
        print(f"\nTesting Scenario: {scenario['text']}")
        try:
            result = asyncio.run(classify_crisis(scenario['text'], "English", "CrisisSync Hotel"))
            print(f"Result Type: {result.get('crisis_type')}")
            print(f"Result Severity: {result.get('severity')}")
            print(f"Guest Instructions: {result.get('guest_instruction')}")
            
            # Basic validation
            assert result.get('crisis_type') == scenario['expected_type']
            print("✅ TEST PASSED")
        except Exception as e:
            print(f"❌ TEST FAILED: {e}")
            if "Permission Denied" in str(e) or "403" in str(e):
                print("Note: This failure is expected until you enable the 'Generative Language API'.")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=".env.local")
    asyncio.run(test_scenarios())
