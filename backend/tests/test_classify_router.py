from fastapi.testclient import TestClient

from backend.main import app
from backend.routers import classify as classify_router

client = TestClient(app)


def test_classify_requires_incident_text():
    response = client.post('/classify', json={'incident_text': '   '})
    assert response.status_code == 400
    assert response.json()['detail'] == 'incident_text cannot be empty'


def test_classify_success(monkeypatch):
    async def fake_classify_crisis(incident_text: str, language: str, hotel_name: str):
        return {
            'crisis_type': 'fire',
            'severity': 'critical',
            'severity_score': 96,
            'confidence': 0.96,
            'summary_english': 'Smoke reported near room 312.',
            'guest_instruction': 'Stay calm and avoid elevators.',
            'staff_instructions': {
                'front_desk': 'Call fire services and announce evacuation.',
                'security': 'Move to floor 3 and assist evacuation.',
                'housekeeping': 'Guide rooms 301-320 toward staircases.',
                'management': 'Activate fire protocol and coordinate agencies.',
            },
            'tactical_objectives': [
                'Confirm smoke source near room 312',
                'Clear guests using stair routes',
                'Stage responders at the nearest safe approach',
            ],
            'call_emergency_services': True,
            'emergency_number': '101',
        }

    monkeypatch.setattr(classify_router, 'classify_crisis', fake_classify_crisis)

    response = client.post(
        '/classify',
        json={
            'incident_text': 'Fire in corridor near room 312.',
            'language': 'English',
            'hotel_name': 'Grand Meridian',
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['crisis_type'] == 'fire'
    assert payload['severity'] == 'critical'
    assert payload['severity_score'] == 96
    assert payload['emergency_number'] == '101'


def test_classify_fallback_on_exception(monkeypatch):
    async def fake_classify_crisis(incident_text: str, language: str, hotel_name: str):
        raise RuntimeError('upstream failure')

    monkeypatch.setattr(classify_router, 'classify_crisis', fake_classify_crisis)

    response = client.post(
        '/classify',
        json={
            'incident_text': 'Security intruder near lobby entrance.',
            'language': 'English',
            'hotel_name': 'Grand Meridian',
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['crisis_type'] == 'security'
    assert payload['severity'] in ['high', 'critical']
    assert payload['guest_instruction']
    assert len(payload['tactical_objectives']) == 3
