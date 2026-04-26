"""
The Orchestrator – Ties Watcher, Judge, Surgeon, and Auditor together.

Flow:
  1. Watcher monitors VyOS logs/traffic.
  2. Judge classifies each flow batch.
  3. If malicious flows are found, Surgeon isolates them.
  4. Auditor runs a golden-image compliance sweep afterward.
"""

from __future__ import annotations

import argparse
import logging
import subprocess
import sys
from pathlib import Path

import yaml
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from src.judge import classify_flows
from src.surgeon import isolate_flow
from src.watcher import FlowRecord, WatcherConfig, watch

logger = logging.getLogger("sentinel.orchestrator")
console = Console()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def load_config(path: str) -> dict:
    with open(path) as fh:
        return yaml.safe_load(fh)


def run_auditor(config: dict) -> int:
    """Execute the Ansible auditor playbook."""
    auditor_cfg = config.get("auditor", {})
    playbook = auditor_cfg.get("playbook", "ansible/playbooks/audit_golden_image.yml")
    inventory = auditor_cfg.get("inventory", "ansible/inventory/hosts.yml")

    if not Path(playbook).exists():
        logger.error("Auditor playbook not found: %s", playbook)
        return 1

    cmd = [
        "ansible-playbook",
        playbook,
        "-i",
        inventory,
    ]
    logger.info("Running Auditor: %s", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode


# ---------------------------------------------------------------------------
# Display helpers
# ---------------------------------------------------------------------------


def print_banner() -> None:
    banner = """
[bold cyan]╔═══════════════════════════════════════════════╗
║         VyOS SENTINEL — Network Guardian      ║
╠═══════════════════════════════════════════════╣
║  Watcher  ·  Judge  ·  Surgeon  ·  Auditor   ║
╚═══════════════════════════════════════════════╝[/]
"""
    console.print(banner)


def print_flow_table(
    flows: list[FlowRecord],
    verdicts: list[dict],
) -> None:
    table = Table(title="Traffic Classification Results", show_lines=True)
    table.add_column("Source", style="cyan")
    table.add_column("Destination", style="cyan")
    table.add_column("Proto")
    table.add_column("Packets", justify="right")
    table.add_column("Bytes", justify="right")
    table.add_column("Verdict", justify="center")
    table.add_column("Confidence", justify="right")

    for flow, verdict in zip(flows, verdicts):
        label = verdict["label"]
        if label == "malicious":
            style = "bold red"
        elif label == "suspicious":
            style = "bold yellow"
        else:
            style = "green"

        table.add_row(
            f"{flow.src_ip}:{flow.src_port}",
            f"{flow.dst_ip}:{flow.dst_port}",
            flow.protocol.upper(),
            str(flow.packet_count),
            str(flow.byte_count),
            f"[{style}]{label}[/]",
            f"{verdict['confidence']:.2%}",
        )

    console.print(table)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------


def sentinel_loop(config: dict, dry_run: bool = False) -> None:
    """Core monitoring loop that ties all components together."""
    watcher_cfg = WatcherConfig.from_dict(config)
    judge_cfg = config.get("judge", {})
    surgeon_cfg = config.get("surgeon", {})

    model_path = judge_cfg.get("model_path", "models/traffic_classifier.joblib")
    threshold = judge_cfg.get("confidence_threshold", 0.75)
    nornir_config = surgeon_cfg.get("nornir_config", "nornir_config/config.yml")
    rule_set = surgeon_cfg.get("firewall", {}).get("rule_set_name", "SENTINEL-BLOCK")
    rule_start = surgeon_cfg.get("firewall", {}).get("rule_start_number", 1000)

    threat_count = 0

    console.print(Panel("[bold green]Watcher is active. Monitoring traffic …[/]"))

    for batch in watch(watcher_cfg):
        console.print(f"\n[dim]Received batch of {len(batch)} flows[/]")

        verdicts = classify_flows(batch, model_path=model_path, threshold=threshold)
        print_flow_table(batch, verdicts)

        malicious = [
            (flow, v) for flow, v in zip(batch, verdicts) if v["label"] == "malicious"
        ]

        if malicious:
            threat_count += len(malicious)
            console.print(
                Panel(
                    f"[bold red]ALERT: {len(malicious)} malicious flow(s) detected![/]",
                    border_style="red",
                )
            )

            if dry_run:
                console.print("[yellow]Dry-run mode — skipping isolation.[/]")
            else:
                for flow, verdict in malicious:
                    console.print(
                        f"[red]Isolating {flow.src_ip}:{flow.src_port} → "
                        f"{flow.dst_ip}:{flow.dst_port}[/]"
                    )
                    isolate_flow(
                        flow,
                        nornir_config=nornir_config,
                        rule_set=rule_set,
                        rule_start=rule_start,
                    )
                    rule_start += 20  # stagger rules

                # After containment, run the Auditor
                console.print(
                    Panel(
                        "[bold blue]Running Auditor – verifying golden image compliance …[/]",
                        border_style="blue",
                    )
                )
                rc = run_auditor(config)
                if rc == 0:
                    console.print("[green]Audit passed — all routers compliant.[/]")
                else:
                    console.print("[red]Audit found deviations — review the report.[/]")

    console.print(f"\n[bold]Session complete. Threats detected: {threat_count}[/]")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="VyOS Sentinel Orchestrator – automated threat response"
    )
    parser.add_argument(
        "-c", "--config", default="config/config.yml", help="Path to config file"
    )
    parser.add_argument("--dry-run", action="store_true", help="Classify only, do not isolate")
    parser.add_argument(
        "--audit-only",
        action="store_true",
        help="Skip monitoring; run only the Auditor playbook",
    )
    parser.add_argument(
        "--train",
        action="store_true",
        help="Train the Judge model before starting",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(name)-22s  %(levelname)-7s  %(message)s",
    )

    config = load_config(args.config)
    print_banner()

    if args.train:
        from src.judge import train_model

        console.print("[cyan]Training The Judge …[/]")
        model_out = config.get("judge", {}).get(
            "model_path", "models/traffic_classifier.joblib"
        )
        train_model(output_path=model_out)
        console.print("[green]Training complete.[/]")
        if args.audit_only:
            pass  # continue to audit
        elif not args.audit_only:
            pass  # continue to loop

    if args.audit_only:
        console.print(Panel("[bold blue]Running Auditor only …[/]", border_style="blue"))
        rc = run_auditor(config)
        sys.exit(rc)

    sentinel_loop(config, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
