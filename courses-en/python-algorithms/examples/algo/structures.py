"""Common structures for the python-algorithms course problems."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Iterable


@dataclass
class ListNode:
    val: int = 0
    next: ListNode | None = None


@dataclass
class TreeNode:
    val: int = 0
    left: TreeNode | None = None
    right: TreeNode | None = None


def list_to_linked(values: Iterable[int]) -> ListNode | None:
    it = iter(values)
    try:
        head = ListNode(next=None, val=next(it))
    except StopIteration:
        return None
    cur = head
    for v in it:
        cur.next = ListNode(val=v)
        cur = cur.next
    return head


def linked_to_list(node: ListNode | None) -> list[int]:
    out: list[int] = []
    while node:
        out.append(node.val)
        node = node.next
    return out


def tree_level_order(root: TreeNode | None) -> list[list[int]]:
    if not root:
        return []
    q: deque[TreeNode] = deque([root])
    levels: list[list[int]] = []
    while q:
        level: list[int] = []
        for _ in range(len(q)):
            n = q.popleft()
            level.append(n.val)
            if n.left:
                q.append(n.left)
            if n.right:
                q.append(n.right)
        levels.append(level)
    return levels
