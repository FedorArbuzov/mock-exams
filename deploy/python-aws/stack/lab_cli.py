#!/usr/bin/env python3
import argparse
import subprocess
import sys

from shop_aws.clients import client


def cmd_health() -> int:
    c = client("sts")
    c.get_caller_identity()
    print('{"status":"ok","framework":"python-aws-lab"}')
    return 0


def cmd_bootstrap() -> int:
    return subprocess.call([sys.executable, "scripts/bootstrap_localstack.py"])


def main() -> int:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("health")
    sub.add_parser("bootstrap")
    args = p.parse_args()
    return cmd_health() if args.cmd == "health" else cmd_bootstrap()


if __name__ == "__main__":
    sys.exit(main())
