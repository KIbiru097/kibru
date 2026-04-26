"""
The Surgeon – Precision threat isolation via Nornir + Netmiko.

When The Judge flags malicious traffic, The Surgeon pushes targeted
firewall rules to the VyOS router(s) to block the offending IP or port.
Supports rollback so rules can be lifted after investigation.
"""

from __future__ import annotations

import argparse
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml
from nornir import InitNornir
from nornir.core.task import Result, Task
from nornir_netmiko.tasks import netmiko_send_command, netmiko_send_config
from nornir_utils.plugins.functions import print_result

from src.watcher import FlowRecord

logger = logging.getLogger("sentinel.surgeon")

HISTORY_FILE = Path("models/isolation_history.json")


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


def _load_config(path: str = "config/config.yml") -> dict:
    with open(path) as fh:
        return yaml.safe_load(fh).get("surgeon", {})


# ---------------------------------------------------------------------------
# VyOS command builders
# ---------------------------------------------------------------------------


def build_block_ip_commands(
    ip: str,
    rule_set: str = "SENTINEL-BLOCK",
    rule_number: int = 1000,
    direction: str = "in",
) -> list[str]:
    """Generate VyOS set commands to block a specific source IP."""
    return [
        f"set firewall name {rule_set} rule {rule_number} action drop",
        f"set firewall name {rule_set} rule {rule_number} source address {ip}",
        f"set firewall name {rule_set} rule {rule_number} description 'Sentinel block {ip}'",
        f"set firewall name {rule_set} rule {rule_number} log enable",
        f"set firewall name {rule_set} default-action accept",
    ]


def build_block_port_commands(
    port: int,
    protocol: str = "tcp",
    rule_set: str = "SENTINEL-BLOCK",
    rule_number: int = 1010,
) -> list[str]:
    """Generate VyOS set commands to block a specific destination port."""
    return [
        f"set firewall name {rule_set} rule {rule_number} action drop",
        f"set firewall name {rule_set} rule {rule_number} destination port {port}",
        f"set firewall name {rule_set} rule {rule_number} protocol {protocol}",
        f"set firewall name {rule_set} rule {rule_number} description "
        f"'Sentinel block port {port}/{protocol}'",
        f"set firewall name {rule_set} rule {rule_number} log enable",
        f"set firewall name {rule_set} default-action accept",
    ]


def build_rollback_commands(rule_set: str, rule_number: int) -> list[str]:
    """Remove a previously applied rule."""
    return [f"delete firewall name {rule_set} rule {rule_number}"]


def build_commit_save() -> list[str]:
    return ["commit", "save"]


# ---------------------------------------------------------------------------
# Nornir tasks
# ---------------------------------------------------------------------------


def apply_firewall_rules(task: Task, commands: list[str]) -> Result:
    """Enter configure mode, apply commands, commit and save."""
    config_cmds = commands + build_commit_save()
    result = task.run(
        task=netmiko_send_config,
        config_commands=config_cmds,
        cmd_verify=False,
        enter_config_mode=True,
        config_mode_command="configure",
        exit_config_mode=True,
    )
    return result


def verify_firewall(task: Task, rule_set: str = "SENTINEL-BLOCK") -> Result:
    """Show the current state of the sentinel firewall rule set."""
    result = task.run(
        task=netmiko_send_command,
        command_string=f"show firewall name {rule_set}",
    )
    return result


# ---------------------------------------------------------------------------
# History tracking
# ---------------------------------------------------------------------------


def _load_history() -> list[dict[str, Any]]:
    if HISTORY_FILE.exists():
        return json.loads(HISTORY_FILE.read_text())
    return []


def _save_history(history: list[dict[str, Any]]) -> None:
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    HISTORY_FILE.write_text(json.dumps(history, indent=2))


def record_action(
    action: str,
    target: str,
    rule_set: str,
    rule_number: int,
    hosts: list[str],
) -> None:
    history = _load_history()
    history.append(
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "target": target,
            "rule_set": rule_set,
            "rule_number": rule_number,
            "hosts": hosts,
        }
    )
    _save_history(history)


# ---------------------------------------------------------------------------
# High-level API
# ---------------------------------------------------------------------------


def isolate_ip(
    ip: str,
    nornir_config: str = "nornir_config/config.yml",
    rule_set: str = "SENTINEL-BLOCK",
    rule_number: int = 1000,
    hosts_filter: list[str] | None = None,
) -> None:
    """Block a source IP on all (or selected) VyOS routers."""
    nr = InitNornir(config_file=nornir_config)
    if hosts_filter:
        nr = nr.filter(filter_func=lambda h: h.name in hosts_filter)

    commands = build_block_ip_commands(ip, rule_set=rule_set, rule_number=rule_number)
    logger.warning("Isolating IP %s with rule %s/%d …", ip, rule_set, rule_number)

    result = nr.run(task=apply_firewall_rules, commands=commands)
    print_result(result)

    record_action("block_ip", ip, rule_set, rule_number, list(nr.inventory.hosts.keys()))
    logger.info("IP %s isolated successfully.", ip)


def isolate_port(
    port: int,
    protocol: str = "tcp",
    nornir_config: str = "nornir_config/config.yml",
    rule_set: str = "SENTINEL-BLOCK",
    rule_number: int = 1010,
    hosts_filter: list[str] | None = None,
) -> None:
    """Block a destination port on all (or selected) VyOS routers."""
    nr = InitNornir(config_file=nornir_config)
    if hosts_filter:
        nr = nr.filter(filter_func=lambda h: h.name in hosts_filter)

    commands = build_block_port_commands(
        port, protocol=protocol, rule_set=rule_set, rule_number=rule_number
    )
    logger.warning("Isolating port %d/%s with rule %s/%d …", port, protocol, rule_set, rule_number)

    result = nr.run(task=apply_firewall_rules, commands=commands)
    print_result(result)

    record_action(
        "block_port", f"{port}/{protocol}", rule_set, rule_number, list(nr.inventory.hosts.keys())
    )
    logger.info("Port %d/%s isolated successfully.", port, protocol)


def rollback_rule(
    rule_set: str = "SENTINEL-BLOCK",
    rule_number: int = 1000,
    nornir_config: str = "nornir_config/config.yml",
    hosts_filter: list[str] | None = None,
) -> None:
    """Remove a previously applied Sentinel firewall rule."""
    nr = InitNornir(config_file=nornir_config)
    if hosts_filter:
        nr = nr.filter(filter_func=lambda h: h.name in hosts_filter)

    commands = build_rollback_commands(rule_set, rule_number) + build_commit_save()
    logger.info("Rolling back rule %s/%d …", rule_set, rule_number)

    result = nr.run(task=apply_firewall_rules, commands=commands)
    print_result(result)

    record_action(
        "rollback", f"{rule_set}/{rule_number}", rule_set, rule_number,
        list(nr.inventory.hosts.keys()),
    )


def isolate_flow(
    flow: FlowRecord,
    nornir_config: str = "nornir_config/config.yml",
    rule_set: str = "SENTINEL-BLOCK",
    rule_start: int = 1000,
) -> None:
    """Block the source IP and destination port of a flagged flow."""
    isolate_ip(flow.src_ip, nornir_config=nornir_config, rule_set=rule_set, rule_number=rule_start)
    isolate_port(
        flow.dst_port,
        protocol=flow.protocol,
        nornir_config=nornir_config,
        rule_set=rule_set,
        rule_number=rule_start + 10,
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="The Surgeon – threat isolation")
    parser.add_argument(
        "-c", "--config", default="config/config.yml", help="Main config file"
    )

    sub = parser.add_subparsers(dest="command")

    blk_ip = sub.add_parser("block-ip", help="Block a source IP")
    blk_ip.add_argument("ip", help="IP address to block")
    blk_ip.add_argument("--rule", type=int, default=1000, help="Rule number")

    blk_port = sub.add_parser("block-port", help="Block a destination port")
    blk_port.add_argument("port", type=int, help="Port to block")
    blk_port.add_argument("--proto", default="tcp", help="Protocol (tcp/udp)")
    blk_port.add_argument("--rule", type=int, default=1010, help="Rule number")

    rb = sub.add_parser("rollback", help="Remove a Sentinel rule")
    rb.add_argument("--rule", type=int, required=True, help="Rule number to remove")

    sub.add_parser("history", help="Show isolation history")
    sub.add_parser("verify", help="Show current Sentinel firewall rules")

    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

    cfg = _load_config(args.config)
    nornir_cfg = cfg.get("nornir_config", "nornir_config/config.yml")
    rule_set = cfg.get("firewall", {}).get("rule_set_name", "SENTINEL-BLOCK")

    if args.command == "block-ip":
        isolate_ip(args.ip, nornir_config=nornir_cfg, rule_set=rule_set, rule_number=args.rule)

    elif args.command == "block-port":
        isolate_port(
            args.port,
            protocol=args.proto,
            nornir_config=nornir_cfg,
            rule_set=rule_set,
            rule_number=args.rule,
        )

    elif args.command == "rollback":
        rollback_rule(rule_set=rule_set, rule_number=args.rule, nornir_config=nornir_cfg)

    elif args.command == "history":
        for entry in _load_history():
            print(
                f"{entry['timestamp']}  {entry['action']:<12}  {entry['target']:<25}  "
                f"rule={entry['rule_set']}/{entry['rule_number']}  hosts={entry['hosts']}"
            )

    elif args.command == "verify":
        nr = InitNornir(config_file=nornir_cfg)
        result = nr.run(task=verify_firewall, rule_set=rule_set)
        print_result(result)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
