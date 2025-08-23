#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "flask",
#   "flask-cors",
#   "requests",
#   "python-dotenv",
# ]
# ///

"""
Flask API server for Vapi voice agent calls.
Provides REST endpoints that can be called from Convex to initiate calls.

Usage: uv run voice/api_server.py
"""

import os
import json
from typing import Optional, Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
VAPI_API_URL = os.getenv("VAPI_API_URL", "https://api.vapi.ai/call")
VAPI_API_KEY = os.getenv("VAPI_API_KEY", "b962acc4-6061-4e74-b98e-ce9cecbf7500")
VAPI_ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID", "9f70c5af-7228-446a-85d0-25e4b31263e2")
VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID", "5f95b4e2-ecfc-4733-8d3e-8ce6d216baf6")

# Default phone number for testing (must be E.164 format with + sign)
DEFAULT_PHONE_NUMBER = "+17657469771"  # Added US country code


def create_vapi_call(
    api_key: str,
    assistant_id: str,
    customer_number: str,
    phone_number_id: Optional[str],
    variable_values: Optional[Dict[str, Any]] = None
) -> dict:
    """Make the actual call to Vapi API."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "assistantId": assistant_id,
        "customer": {"number": customer_number},
    }
    if phone_number_id:
        payload["phoneNumberId"] = phone_number_id
    
    if variable_values:
        payload["assistantOverrides"] = {
            "variableValues": variable_values,
            "metadata": variable_values.get("metadata", {}),
            "server": {
                "url": "https://scintillating-sturgeon-599.convex.site/vapi"
            },
            "serverMessages": [
                "transcript",
                "status-update",
                "speech-update",
                "end-of-call-report"
            ]
        }

    resp = requests.post(VAPI_API_URL, json=payload, headers=headers, timeout=30)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Vapi error {resp.status_code}: {resp.text}")
    return resp.json()


@app.route("/api/initiate-call", methods=["POST"])
def initiate_call():
    """
    Initiate a Vapi call with invoice collection parameters.
    
    Expected request body:
    {
        "phoneNumber": "+1234567890",  // Optional, defaults to test number
        "vendorId": "vendor_123",
        "vendorName": "Acme Corp",
        "vendorEmail": "ap@acmecorp.com",
        "invoiceNo": "INV-2024-001",
        "invoiceAmountCents": 125000,
        "invoiceDueDate": "2024-01-10",
        "companyName": "TechFlow Solutions"  // Optional
    }
    """
    try:
        data = request.get_json()
        print(f"Received request data: {json.dumps(data, indent=2)}")
        
        # Extract parameters with defaults
        phone_number = data.get("phoneNumber", DEFAULT_PHONE_NUMBER)
        
        # Ensure phone number has proper E.164 format
        if phone_number and not phone_number.startswith('+'):
            phone_number = '+' + phone_number
        
        print(f"Using phone number: {phone_number}")
        
        vendor_id = data.get("vendorId")
        invoice_id = data.get("invoiceId")
        vendor_name = data.get("vendorName", "Vendor")
        vendor_email = data.get("vendorEmail", "ap@vendor.com")
        invoice_no = data.get("invoiceNo", "INV-001")
        invoice_amount_cents = data.get("invoiceAmountCents", 75000)
        invoice_due_date = data.get("invoiceDueDate", "2024-01-10")
        company_name = data.get("companyName", "TechFlow Solutions")
        
        # Calculate derived values
        formatted_amount = f"${invoice_amount_cents / 100:.2f}"
        min_payment_percentage = 25  # 25% minimum
        min_payment_amount = f"${(invoice_amount_cents * min_payment_percentage / 100) / 100:.2f}"
        discount_percentage = 2.0  # 200 bps = 2%
        
        # Build variable values for Vapi assistant
        variable_values = {
            "companyName": company_name,
            "invoiceNo": invoice_no,
            "formattedAmount": formatted_amount,
            "formattedDueDate": invoice_due_date,
            "minPaymentPercentage": min_payment_percentage,
            "minPaymentAmount": min_payment_amount,
            "maxInstallments": 3,
            "maxDaysToSettle": 30,
            "allowZeroTodayIfDaysLateLt": 7,
            "discountPercentage": discount_percentage,
            "lateFeeWaive": True,
            "vendorName": vendor_name,
            "vendorNotes": "",
            "vendorDoNotCall": False,
            "vendorMinPaymentPercentage": 30,
            "neverCollectCardOnCall": True,
            "contactWindowStart": "09:00",
            "contactWindowEnd": "17:00",
            "timezone": "America/New_York",
            "currentAttemptNumber": 1,
            "maxAttemptsPerWeek": 3,
            "allowedTools": ["payments", "email"],
            "allowedToolsList": "payments, email",
            "agentMailFrom": "collections@company.com",
            "email": vendor_email,
            "historicalMode": "standard",
            "lastOutcome": "n/a",
            "lastPromiseDate": "n/a",
            "totalRecovered": "0.00",
            "totalOutstanding": formatted_amount,
            "suggestedDate": "within 7 days"
        }
        
        # Create the call
        print(f"Calling Vapi with phone: {phone_number}")
        result = create_vapi_call(
            api_key=VAPI_API_KEY,
            assistant_id=VAPI_ASSISTANT_ID,
            customer_number=phone_number,
            phone_number_id=VAPI_PHONE_NUMBER_ID,
            variable_values=variable_values,
        )
        print(f"Vapi call result: {result}")
        
        call_id = result.get("id") or result.get("call", {}).get("id")
        status = result.get("status") or result.get("call", {}).get("status")
        
        return jsonify({
            "success": True,
            "callId": call_id,
            "status": status,
            "phoneNumber": phone_number,
            "vendorName": vendor_name,
            "invoiceNo": invoice_no,
            "amount": formatted_amount
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/call-status/<call_id>", methods=["GET"])
def get_call_status(call_id):
    """Get the status of a Vapi call."""
    try:
        headers = {
            "Authorization": f"Bearer {VAPI_API_KEY}",
        }
        
        resp = requests.get(
            f"https://api.vapi.ai/call/{call_id}",
            headers=headers,
            timeout=30
        )
        
        if resp.status_code != 200:
            raise RuntimeError(f"Vapi error {resp.status_code}: {resp.text}")
        
        data = resp.json()
        
        return jsonify({
            "success": True,
            "callId": call_id,
            "status": data.get("status"),
            "startedAt": data.get("startedAt"),
            "endedAt": data.get("endedAt"),
            "duration": data.get("duration"),
            "transcript": data.get("transcript", [])
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "vapi-voice-agent",
        "assistant_id": VAPI_ASSISTANT_ID
    }), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    print(f"Starting Vapi Voice Agent API Server on port {port}...")
    print(f"API endpoints available at http://localhost:{port}/api/")
    app.run(host="0.0.0.0", port=port, debug=True)