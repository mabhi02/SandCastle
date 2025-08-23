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
import os
import sys
from typing import Optional

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
    return parser.parse_args(argv)


def create_call(api_key: str, assistant_id: str, customer_number: str, phone_number_id: Optional[str]) -> dict:
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

    print(
        f"Placing call to {args.phone_number} using assistant {args.assistant_id}...",
        flush=True,
    )

    try:
        data = create_call(
            api_key=args.api_key,
            assistant_id=args.assistant_id,
            customer_number=args.phone_number,
            phone_number_id=args.phone_number_id,
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


