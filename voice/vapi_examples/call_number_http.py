"""
HTTP-only CLI to place an outbound phone call using a Vapi assistant.

This avoids the vapi-python SDK (and its platform-specific deps) by calling
the REST API directly.

Usage (examples):
  python voice/vapi_examples/call_number_http.py +17657469771 \
    --assistant-id e56451cc-dd26-4820-87f4-e39105f372f1 \
    --api-key <YOUR_VAPI_API_KEY> \
    --phone-number-id <YOUR_VAPI_PHONE_NUMBER_ID(optional)>

Env vars respected:
  - VAPI_API_KEY
  - VAPI_ASSISTANT_ID
  - VAPI_PHONE_NUMBER_ID
"""

import argparse
import json
import os
import sys
from typing import Optional, Dict, Any

import requests
from dotenv import load_dotenv


API_URL = os.getenv("VAPI_API_URL", "https://api.vapi.ai/call")


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Place an outbound Vapi call (HTTP)")
    parser.add_argument(
        "phone_number",
        help="Destination phone in E.164 format (e.g., +14155550123)",
    )
    parser.add_argument(
        "--assistant-id",
        default=os.getenv("VAPI_ASSISTANT_ID"),
        help="Vapi assistant ID (or set VAPI_ASSISTANT_ID)",
    )
    parser.add_argument(
        "--api-key",
        default=os.getenv("VAPI_API_KEY"),
        help="Vapi API key (server secret, not public web key) or set VAPI_API_KEY",
    )
    parser.add_argument(
        "--phone-number-id",
        default=os.getenv("VAPI_PHONE_NUMBER_ID"),
        help="Your Vapi phone number ID (optional; if you have multiple, set this)",
    )
    # AR Collections variables
    parser.add_argument("--company-name", default="TechFlow Solutions", help="Company name")
    parser.add_argument("--timezone", default="America/New_York", help="Timezone")
    parser.add_argument("--contact-window-start", default="09:00", help="Contact window start time")
    parser.add_argument("--contact-window-end", default="17:00", help="Contact window end time")
    parser.add_argument("--max-attempts-per-week", type=int, default=3, help="Max attempts per week")
    parser.add_argument("--allowed-tools", default="payments, email", help="Allowed tools")
    parser.add_argument("--agent-mail-from", default="collections@company.com", help="Agent email")
    parser.add_argument("--voice-number", default="+1-800-555-0123", help="Voice callback number")
    parser.add_argument("--currency", default="USD", help="Currency")
    parser.add_argument("--vendor-name", default="Acme Corp", help="Vendor name")
    parser.add_argument("--vendor-email", default="ap@vendor.com", help="Vendor email")
    parser.add_argument("--vendor-phone", help="Vendor phone (defaults to call destination)")
    parser.add_argument("--invoice-no", default="INV-2024-001", help="Invoice number")
    parser.add_argument("--invoice-amount-cents", type=int, default=75000, help="Invoice amount in cents")
    parser.add_argument("--invoice-due-date", default="2024-01-10", help="Invoice due date (ISO)")
    parser.add_argument("--invoice-memo", default="Outstanding payment", help="Invoice memo")
    return parser.parse_args(argv)


def create_call(api_key: str, assistant_id: str, customer_number: str, phone_number_id: Optional[str], variable_values: Optional[Dict[str, Any]] = None) -> dict:
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
            "variableValues": variable_values
        }

    resp = requests.post(API_URL, json=payload, headers=headers, timeout=30)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Vapi error {resp.status_code}: {resp.text}")
    return resp.json()


def main(argv: Optional[list[str]] = None) -> None:
    load_dotenv()
    args = parse_args(argv)

    if not args.api_key:
        print("Error: Missing API key. Provide --api-key or set VAPI_API_KEY.", file=sys.stderr)
        sys.exit(1)
    if not args.assistant_id:
        print("Error: Missing assistant ID. Provide --assistant-id or set VAPI_ASSISTANT_ID.", file=sys.stderr)
        sys.exit(1)

    # Calculate derived values
    formatted_amount = f"${args.invoice_amount_cents / 100:.2f}"
    min_payment_percentage = 25  # 25% minimum
    min_payment_amount = f"${(args.invoice_amount_cents * min_payment_percentage / 100) / 100:.2f}"
    discount_percentage = 2.0  # 200 bps = 2%
    
    # Build variable values from arguments matching the new prompt format
    variable_values = {
        "companyName": args.company_name,
        "invoiceNo": args.invoice_no,
        "formattedAmount": formatted_amount,
        "formattedDueDate": args.invoice_due_date,
        "minPaymentPercentage": min_payment_percentage,
        "minPaymentAmount": min_payment_amount,
        "maxInstallments": 3,
        "maxDaysToSettle": 30,
        "allowZeroTodayIfDaysLateLt": 7,
        "discountPercentage": discount_percentage,
        "lateFeeWaive": True,
        "vendorName": args.vendor_name,
        "vendorNotes": "",
        "vendorDoNotCall": False,
        "vendorMinPaymentPercentage": 30,
        "neverCollectCardOnCall": True,
        "contactWindowStart": args.contact_window_start,
        "contactWindowEnd": args.contact_window_end,
        "timezone": args.timezone,
        "currentAttemptNumber": 1,
        "maxAttemptsPerWeek": args.max_attempts_per_week,
        "allowedTools": ["payments", "email"],
        "allowedToolsList": args.allowed_tools,
        "agentMailFrom": args.agent_mail_from,
        "email": args.vendor_email,
        "historicalMode": "standard",
        "lastOutcome": "n/a",
        "lastPromiseDate": "n/a",
        "totalRecovered": "0.00",
        "totalOutstanding": formatted_amount,
        "suggestedDate": "within 7 days"
    }

    print(
        f"Placing call to {args.phone_number} using assistant {args.assistant_id}...",
        flush=True,
    )
    if variable_values:
        print(f"Using {len(variable_values)} variable overrides", flush=True)

    try:
        data = create_call(
            api_key=args.api_key,
            assistant_id=args.assistant_id,
            customer_number=args.phone_number,
            phone_number_id=args.phone_number_id,
            variable_values=variable_values,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"Failed to create call: {exc}", file=sys.stderr)
        sys.exit(1)

    call_id = data.get("id") or data.get("call", {}).get("id")
    status = data.get("status") or data.get("call", {}).get("status")
    print(f"Call created. ID: {call_id}  Status: {status}")
    print("Full response:")
    print(data)


if __name__ == "__main__":
    main()


