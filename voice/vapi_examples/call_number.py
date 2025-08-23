"""
Simple CLI to place an outbound phone call using a Vapi assistant.

Usage:
  - Ensure VAPI_API_KEY is set in your environment (or a .env file)
  - Run: python voice/vapi_examples/call_number.py +1234567890
  - Optionally override assistant via --assistant-id
"""

import os
import sys
import argparse
from typing import Optional

from dotenv import load_dotenv
from vapi import Vapi


DEFAULT_ASSISTANT_ID = os.getenv(
    "VAPI_ASSISTANT_ID",
    "9f70c5af-7228-446a-85d0-25e4b31263e2",
)


def get_vapi_client(override_api_key: Optional[str] = None) -> Vapi:
    """Initialize and return a Vapi client using an override or VAPI_API_KEY from env."""
    load_dotenv()
    api_key = override_api_key or os.getenv("VAPI_API_KEY")
    if not api_key:
        print(
            "Error: Missing API key. Set VAPI_API_KEY or pass --api-key.",
            file=sys.stderr,
        )
        sys.exit(1)
    return Vapi(api_key=api_key)


def place_call(client: Vapi, assistant_id: str, phone_number: str):
    """Create an outbound call to the provided E.164 phone number."""
    try:
        call = client.calls.create(
            assistantId=assistant_id,
            customer={"number": phone_number},
        )
        print(f"Call initiated. ID: {call.id}")
        print(f"Status: {call.status}")
        return call
    except Exception as exc:  # noqa: BLE001 - bubble up readable error
        print(f"Error making call: {exc}", file=sys.stderr)
        sys.exit(1)


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Place an outbound Vapi call")
    parser.add_argument(
        "phone_number",
        help="Destination phone in E.164 format (e.g., +14155550123)",
    )
    parser.add_argument(
        "--assistant-id",
        default=DEFAULT_ASSISTANT_ID,
        help=(
            "Vapi assistant ID to use. Defaults to env VAPI_ASSISTANT_ID or"
            f" {DEFAULT_ASSISTANT_ID}"
        ),
    )
    parser.add_argument(
        "--api-key",
        help="Vapi API key. If omitted, uses env VAPI_API_KEY",
    )
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> None:
    args = parse_args(argv)
    client = get_vapi_client(args.api_key)

    assistant_id = args.assistant_id
    phone_number = args.phone_number

    print(
        f"Placing call to {phone_number} using assistant {assistant_id}...",
        flush=True,
    )
    place_call(client, assistant_id, phone_number)
    print(
        "Call requested. Monitor your Vapi dashboard or webhooks for live updates.",
        flush=True,
    )


if __name__ == "__main__":
    main()


