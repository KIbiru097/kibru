# VyOS Sentinel – Automated Network Security

An end-to-end automated network security system for VyOS environments. Four specialised components work together to **detect**, **classify**, **contain**, and **audit** threats in real time.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  THE WATCHER │────▶│  THE JUDGE   │────▶│  THE SURGEON │────▶│  THE AUDITOR │
│  (Monitor)   │     │  (Classify)  │     │  (Isolate)   │     │  (Audit)     │
│  Python/SSH  │     │  scikit-learn│     │  Nornir      │     │  Ansible     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Components

### 1. The Watcher (`src/watcher.py`)
Continuously monitors VyOS router logs and connection-tracking tables.

- **SSH mode** — connects to a remote VyOS router, polls syslog files and runs `conntrack -L`
- **Local mode** — tails a local syslog file (useful when the VyOS box forwards logs)
- Parses firewall log entries and conntrack output into normalised `FlowRecord` objects
- Feeds flow batches to The Judge for classification

### 2. The Judge (`src/judge.py`)
AI-powered traffic classifier built on **scikit-learn**.

- Uses a **Random Forest** model trained on network flow features (ports, protocol, packet/byte counts, TCP flags, duration)
- Ships with a synthetic data generator so the pipeline works out of the box — replace with real labelled data for production
- Classifies each flow as **benign**, **suspicious**, or **malicious** with a confidence score
- Configurable confidence threshold

### 3. The Surgeon (`src/surgeon.py`)
Precision threat containment powered by **Nornir + Netmiko**.

- Generates VyOS firewall commands to block a specific source IP or destination port
- Pushes rules to one or many routers in parallel via Nornir's threaded runner
- Tracks every isolation action in a JSON history file for accountability
- Supports **rollback** — remove any rule by number

### 4. The Auditor (`ansible/playbooks/audit_golden_image.yml`)
Post-incident (and scheduled) compliance verification via **Ansible**.

- Pulls each router's running configuration
- Compares it against a **golden image** (`config/golden_image.yml`)
- Checks: firewall hardening, SSH config, NTP, syslog
- Generates per-host YAML compliance reports
- Optional **auto-remediation** mode (`-e remediate=true`)

---

## Project Structure

```
vyos-sentinel/
├── config/
│   ├── config.yml            # Main runtime configuration
│   └── golden_image.yml      # Expected "known good" VyOS settings
├── src/
│   ├── watcher.py            # The Watcher
│   ├── judge.py              # The Judge
│   ├── surgeon.py            # The Surgeon
│   └── orchestrator.py       # Ties all four components together
├── ansible/
│   ├── ansible.cfg
│   ├── inventory/hosts.yml   # Ansible host inventory
│   └── playbooks/
│       └── audit_golden_image.yml  # The Auditor playbook
├── nornir_config/            # Nornir inventory for The Surgeon
│   ├── config.yml
│   ├── hosts.yml
│   ├── groups.yml
│   └── defaults.yml
├── models/                   # Trained model artifacts (gitignored)
├── tests/                    # pytest test suite
├── pyproject.toml
└── requirements.txt
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Ansible 9+ with `vyos.vyos` collection
- Access to one or more VyOS routers (SSH)

### Installation

```bash
# Clone & enter the project
git clone <repo-url> && cd vyos-sentinel

# Create a virtual environment
python3 -m venv .venv && source .venv/bin/activate

# Install Python dependencies
pip install -e ".[dev]"

# Install the Ansible VyOS collection
ansible-galaxy collection install vyos.vyos
```

### Configuration

1. **Edit `config/config.yml`** — set your VyOS router SSH credentials and connection details.
2. **Edit `nornir_config/hosts.yml`** — add your VyOS routers for The Surgeon.
3. **Edit `ansible/inventory/hosts.yml`** — add your VyOS routers for The Auditor.
4. **Edit `config/golden_image.yml`** — define your expected "secure baseline" settings.

---

## Usage

### Train the AI model

```bash
python -m src.judge train
```

This generates a synthetic dataset and trains a Random Forest classifier.
Replace the synthetic generator with your own labelled dataset for production use.

### Run The Watcher (standalone)

```bash
# Dry-run: print flows without classifying
python -m src.watcher --dry-run

# Full run: classify flows via The Judge
python -m src.watcher
```

### Run The Judge (demo classification)

```bash
python -m src.judge classify
```

### Run The Surgeon (manual isolation)

```bash
# Block a specific IP
python -m src.surgeon block-ip 192.168.1.100

# Block a port
python -m src.surgeon block-port 4444 --proto tcp

# Rollback a rule
python -m src.surgeon rollback --rule 1000

# View isolation history
python -m src.surgeon history
```

### Run The Auditor (standalone)

```bash
# Audit only
ansible-playbook ansible/playbooks/audit_golden_image.yml

# Audit + auto-remediate
ansible-playbook ansible/playbooks/audit_golden_image.yml -e remediate=true
```

### Full Orchestrator (all components)

```bash
# Dry-run (classify but don't isolate)
python -m src.orchestrator --dry-run

# Full automated response
python -m src.orchestrator

# Train model first, then start monitoring
python -m src.orchestrator --train

# Audit only (no monitoring)
python -m src.orchestrator --audit-only
```

---

## Running Tests

```bash
pytest -v
```

---

## How It All Fits Together

1. **Watcher** polls the VyOS router for new log entries and conntrack flows.
2. Each batch of flows is sent to **Judge** for AI classification.
3. If malicious traffic is found, **Surgeon** pushes targeted firewall rules to the router(s) to block the offending IP/port.
4. After containment, **Auditor** runs a full compliance sweep of all routers to ensure no configuration drift occurred.
5. Reports are saved, history is logged, and the cycle repeats.

---

## License

MIT
