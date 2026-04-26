"""
The Watcher – Continuous VyOS log and traffic monitor.

Connects to a VyOS router via SSH (or reads local log files) and streams
parsed log entries and conntrack flow records to The Judge for classification.
"""

from __future__ import annotations

import argparse
import logging
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Generator

import paramiko
import yaml

logger = logging.getLogger("sentinel.watcher")

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

CONNTRACK_RE = re.compile(
    r"(?P<proto>\w+)\s+\d+\s+\d+\s+"
    r"(?:.*?src=(?P<src>[0-9.]+))?\s*"
    r"(?:.*?dst=(?P<dst>[0-9.]+))?\s*"
    r"(?:.*?sport=(?P<sport>\d+))?\s*"
    r"(?:.*?dport=(?P<dport>\d+))?\s*"
    r"(?:.*?packets=(?P<packets>\d+))?\s*"
    r"(?:.*?bytes=(?P<bytes>\d+))?"
)

SYSLOG_RE = re.compile(
    r"(?P<timestamp>\w+\s+\d+\s+[\d:]+)\s+"
    r"(?P<host>\S+)\s+"
    r"(?P<process>\S+?)(?:\[(?P<pid>\d+)\])?:\s+"
    r"(?P<message>.*)"
)

FIREWALL_LOG_RE = re.compile(
    r"\[(?P<rule_name>[^\]]+)\].*?"
    r"IN=(?P<in_iface>\S*)\s+OUT=(?P<out_iface>\S*)\s+"
    r".*?SRC=(?P<src>[0-9.]+)\s+DST=(?P<dst>[0-9.]+)\s+"
    r".*?PROTO=(?P<proto>\w+)"
    r"(?:.*?SPT=(?P<sport>\d+))?"
    r"(?:.*?DPT=(?P<dport>\d+))?"
)


@dataclass
class FlowRecord:
    """A single network flow extracted from conntrack or logs."""

    src_ip: str = ""
    dst_ip: str = ""
    src_port: int = 0
    dst_port: int = 0
    protocol: str = "tcp"
    packet_count: int = 0
    byte_count: int = 0
    duration: float = 0.0
    flags_syn: int = 0
    flags_ack: int = 0
    flags_fin: int = 0
    flags_rst: int = 0
    raw: str = ""


@dataclass
class LogEntry:
    """A parsed syslog entry."""

    timestamp: str = ""
    host: str = ""
    process: str = ""
    pid: str = ""
    message: str = ""
    raw: str = ""


@dataclass
class WatcherConfig:
    """Runtime configuration for The Watcher."""

    mode: str = "ssh"
    ssh_host: str = "192.168.1.1"
    ssh_port: int = 22
    ssh_user: str = "vyos"
    ssh_key_file: str = "~/.ssh/id_rsa"
    ssh_password: str = ""
    local_log_path: str = "/var/log/vyos/vyos.log"
    poll_interval: int = 10
    log_sources: list[str] = field(default_factory=lambda: ["/var/log/messages"])
    conntrack_cmd: str = "sudo conntrack -L"

    @classmethod
    def from_dict(cls, data: dict) -> WatcherConfig:
        w = data.get("watcher", {})
        ssh = w.get("ssh", {})
        local = w.get("local", {})
        return cls(
            mode=w.get("mode", "ssh"),
            ssh_host=ssh.get("host", "192.168.1.1"),
            ssh_port=ssh.get("port", 22),
            ssh_user=ssh.get("username", "vyos"),
            ssh_key_file=ssh.get("key_file", "~/.ssh/id_rsa"),
            ssh_password=ssh.get("password", ""),
            local_log_path=local.get("log_path", "/var/log/vyos/vyos.log"),
            poll_interval=w.get("poll_interval", 10),
            log_sources=w.get("log_sources", ["/var/log/messages"]),
            conntrack_cmd=w.get("conntrack_cmd", "sudo conntrack -L"),
        )


# ---------------------------------------------------------------------------
# SSH helper
# ---------------------------------------------------------------------------


class SSHSession:
    """Persistent SSH connection to a VyOS router."""

    def __init__(self, config: WatcherConfig) -> None:
        self._cfg = config
        self._client: paramiko.SSHClient | None = None

    def connect(self) -> None:
        self._client = paramiko.SSHClient()
        self._client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        connect_kwargs: dict = {
            "hostname": self._cfg.ssh_host,
            "port": self._cfg.ssh_port,
            "username": self._cfg.ssh_user,
        }
        key_path = Path(self._cfg.ssh_key_file).expanduser()
        if key_path.exists():
            connect_kwargs["key_filename"] = str(key_path)
        elif self._cfg.ssh_password:
            connect_kwargs["password"] = self._cfg.ssh_password
        else:
            connect_kwargs["look_for_keys"] = True

        logger.info("Connecting to %s:%d …", self._cfg.ssh_host, self._cfg.ssh_port)
        self._client.connect(**connect_kwargs)
        logger.info("SSH connection established.")

    def run(self, command: str) -> str:
        if self._client is None:
            self.connect()
        assert self._client is not None
        _, stdout, stderr = self._client.exec_command(command, timeout=30)
        output = stdout.read().decode(errors="replace")
        err = stderr.read().decode(errors="replace")
        if err:
            logger.debug("stderr: %s", err.strip())
        return output

    def close(self) -> None:
        if self._client:
            self._client.close()
            self._client = None


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------


def parse_conntrack(raw_output: str) -> list[FlowRecord]:
    """Parse conntrack -L output into FlowRecords."""
    records: list[FlowRecord] = []
    for line in raw_output.strip().splitlines():
        m = CONNTRACK_RE.search(line)
        if not m:
            continue
        records.append(
            FlowRecord(
                src_ip=m.group("src") or "",
                dst_ip=m.group("dst") or "",
                src_port=int(m.group("sport") or 0),
                dst_port=int(m.group("dport") or 0),
                protocol=(m.group("proto") or "tcp").lower(),
                packet_count=int(m.group("packets") or 0),
                byte_count=int(m.group("bytes") or 0),
                raw=line,
            )
        )
    return records


def parse_syslog(raw_output: str) -> list[LogEntry]:
    """Parse syslog lines into LogEntry objects."""
    entries: list[LogEntry] = []
    for line in raw_output.strip().splitlines():
        m = SYSLOG_RE.match(line)
        if m:
            entries.append(
                LogEntry(
                    timestamp=m.group("timestamp"),
                    host=m.group("host"),
                    process=m.group("process"),
                    pid=m.group("pid") or "",
                    message=m.group("message"),
                    raw=line,
                )
            )
    return entries


def extract_flows_from_firewall_log(entries: list[LogEntry]) -> list[FlowRecord]:
    """Extract FlowRecords from VyOS firewall log messages."""
    flows: list[FlowRecord] = []
    for entry in entries:
        m = FIREWALL_LOG_RE.search(entry.message)
        if m:
            flows.append(
                FlowRecord(
                    src_ip=m.group("src") or "",
                    dst_ip=m.group("dst") or "",
                    src_port=int(m.group("sport") or 0),
                    dst_port=int(m.group("dport") or 0),
                    protocol=(m.group("proto") or "tcp").lower(),
                    raw=entry.raw,
                )
            )
    return flows


# ---------------------------------------------------------------------------
# Protocol encoding
# ---------------------------------------------------------------------------

PROTOCOL_MAP = {"tcp": 6, "udp": 17, "icmp": 1}


def encode_protocol(proto: str) -> int:
    return PROTOCOL_MAP.get(proto.lower(), 0)


def flow_to_feature_vector(flow: FlowRecord) -> dict:
    """Convert a FlowRecord to a flat dict the Judge model expects."""
    return {
        "src_port": flow.src_port,
        "dst_port": flow.dst_port,
        "protocol": encode_protocol(flow.protocol),
        "packet_count": flow.packet_count,
        "byte_count": flow.byte_count,
        "duration": flow.duration,
        "flags_syn": flow.flags_syn,
        "flags_ack": flow.flags_ack,
        "flags_fin": flow.flags_fin,
        "flags_rst": flow.flags_rst,
    }


# ---------------------------------------------------------------------------
# Core watch loop
# ---------------------------------------------------------------------------


def watch_ssh(config: WatcherConfig) -> Generator[list[FlowRecord], None, None]:
    """Continuously poll a VyOS router over SSH and yield flow batches."""
    session = SSHSession(config)
    session.connect()

    seen_lines: set[str] = set()

    try:
        while True:
            # 1. Grab conntrack table
            conntrack_raw = session.run(config.conntrack_cmd)
            flows = parse_conntrack(conntrack_raw)

            # 2. Grab firewall log entries from each log source
            for log_src in config.log_sources:
                tail_output = session.run(f"sudo tail -n 200 {log_src}")
                new_lines = []
                for line in tail_output.strip().splitlines():
                    if line not in seen_lines:
                        seen_lines.add(line)
                        new_lines.append(line)

                if new_lines:
                    entries = parse_syslog("\n".join(new_lines))
                    flows.extend(extract_flows_from_firewall_log(entries))

            if flows:
                yield flows

            time.sleep(config.poll_interval)
    finally:
        session.close()


def watch_local(config: WatcherConfig) -> Generator[list[FlowRecord], None, None]:
    """Watch a local log file and yield flow batches as new lines appear."""
    log_path = Path(config.local_log_path)

    if not log_path.exists():
        logger.error("Log file %s does not exist.", log_path)
        return

    with open(log_path) as fh:
        fh.seek(0, 2)  # seek to end
        while True:
            new_data = fh.read()
            if new_data:
                entries = parse_syslog(new_data)
                flows = extract_flows_from_firewall_log(entries)
                if flows:
                    yield flows
            time.sleep(config.poll_interval)


def watch(config: WatcherConfig) -> Generator[list[FlowRecord], None, None]:
    """Dispatcher – choose watch strategy based on config mode."""
    if config.mode == "ssh":
        yield from watch_ssh(config)
    else:
        yield from watch_local(config)


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------


def load_config(path: str) -> dict:
    with open(path) as fh:
        return yaml.safe_load(fh)


def main() -> None:
    parser = argparse.ArgumentParser(description="The Watcher – VyOS log monitor")
    parser.add_argument(
        "-c", "--config", default="config/config.yml", help="Path to config file"
    )
    parser.add_argument("--dry-run", action="store_true", help="Print flows without classifying")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

    raw_cfg = load_config(args.config)
    config = WatcherConfig.from_dict(raw_cfg)

    logger.info("Starting The Watcher (mode=%s) …", config.mode)

    for batch in watch(config):
        if args.dry_run:
            for flow in batch:
                logger.info(
                    "FLOW  %s:%d -> %s:%d  proto=%s  pkts=%d  bytes=%d",
                    flow.src_ip,
                    flow.src_port,
                    flow.dst_ip,
                    flow.dst_port,
                    flow.protocol,
                    flow.packet_count,
                    flow.byte_count,
                )
        else:
            from src.judge import classify_flows

            verdicts = classify_flows(
                batch, model_path=raw_cfg.get("judge", {}).get("model_path", "")
            )
            for flow, verdict in zip(batch, verdicts):
                level = logging.WARNING if verdict["label"] == "malicious" else logging.INFO
                logger.log(
                    level,
                    "%-10s  conf=%.2f  %s:%d -> %s:%d  proto=%s",
                    verdict["label"],
                    verdict["confidence"],
                    flow.src_ip,
                    flow.src_port,
                    flow.dst_ip,
                    flow.dst_port,
                    flow.protocol,
                )


if __name__ == "__main__":
    main()
