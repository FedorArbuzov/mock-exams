#!/usr/bin/python
# -*- coding: utf-8 -*-
# Author picture for ~/nimbus-ch/library/. Runs on the ClickHouse node.

from __future__ import absolute_import, division, print_function

__metaclass__ = type

import re

from ansible.module_utils.basic import AnsibleModule

DOCUMENTATION = r"""
---
module: nimbus_clickhouse_table
short_description: Ensure or assert a ClickHouse table (DDL via clickhouse-client)
description:
  - Queries EXISTS TABLE, then optionally runs your ON CLUSTER DDL.
  - state=present is idempotent. state=exists never mutates.
options:
  database:
    type: str
    required: true
  table:
    type: str
    required: true
  ddl:
    type: str
    description: Full CREATE used when state=present and the table is missing.
  client:
    type: str
    default: clickhouse-client
  state:
    type: str
    default: present
    choices: [present, exists]
author:
  - Nimbus
"""

EXAMPLES = r"""
- name: Ensure shop.events
  nimbus_clickhouse_table:
    database: shop
    table: events
    ddl: CREATE TABLE IF NOT EXISTS shop.events ON CLUSTER nimbus (id UInt8) ENGINE = MergeTree ORDER BY id
    state: present

- name: Monday
  nimbus_clickhouse_table:
    database: shop
    table: events
    state: exists
"""

_IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _ident(module, value, field):
    if not _IDENT.match(value):
        module.fail_json(msg="invalid {0}: {1!r}".format(field, value))


def _query(module, client, sql):
    rc, out, err = module.run_command([client, "--query", sql])
    if rc != 0:
        module.fail_json(msg=err or out or "clickhouse-client failed", rc=rc)
    return out.strip()


def main():
    module = AnsibleModule(
        argument_spec=dict(
            database=dict(type="str", required=True),
            table=dict(type="str", required=True),
            ddl=dict(type="str", required=False, default=None),
            client=dict(type="str", default="clickhouse-client"),
            state=dict(type="str", default="present", choices=["present", "exists"]),
        ),
        supports_check_mode=True,
        required_if=[("state", "present", ["ddl"])],
    )
    p = module.params
    _ident(module, p["database"], "database")
    _ident(module, p["table"], "table")

    exists = _query(
        module,
        p["client"],
        "EXISTS TABLE {0}.{1}".format(p["database"], p["table"]),
    ) == "1"

    if p["state"] == "exists":
        if not exists:
            module.fail_json(
                msg="audit: table {0}.{1} missing".format(p["database"], p["table"]),
                exists=False,
                changed=False,
            )
        module.exit_json(changed=False, exists=True)

    if exists:
        module.exit_json(changed=False, exists=True)

    if module.check_mode:
        module.exit_json(changed=True, exists=False)

    _query(module, p["client"], p["ddl"])
    module.exit_json(changed=True, exists=True)


if __name__ == "__main__":
    main()
