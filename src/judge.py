"""
The Judge – AI-based network traffic classifier.

Uses a pre-trained scikit-learn model to classify each FlowRecord as
'benign', 'suspicious', or 'malicious'. If no model file exists on disk,
a synthetic training set is generated and a RandomForest is trained so
the pipeline works out of the box.
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from src.watcher import FlowRecord, flow_to_feature_vector

logger = logging.getLogger("sentinel.judge")

FEATURE_COLS = [
    "src_port",
    "dst_port",
    "protocol",
    "packet_count",
    "byte_count",
    "duration",
    "flags_syn",
    "flags_ack",
    "flags_fin",
    "flags_rst",
]

LABELS = ["benign", "suspicious", "malicious"]
DEFAULT_THRESHOLD = 0.75


# ---------------------------------------------------------------------------
# Synthetic data generation (bootstrap when no real dataset is available)
# ---------------------------------------------------------------------------


def _generate_synthetic_dataset(n_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """Generate a synthetic labelled dataset for demonstration purposes."""
    rng = np.random.default_rng(seed)

    records: list[dict[str, Any]] = []

    # Benign traffic (~60 %)
    n_benign = int(n_samples * 0.6)
    for _ in range(n_benign):
        records.append(
            {
                "src_port": int(rng.integers(1024, 65535)),
                "dst_port": int(rng.choice([80, 443, 53, 8080, 8443])),
                "protocol": int(rng.choice([6, 17])),  # TCP / UDP
                "packet_count": int(rng.integers(1, 500)),
                "byte_count": int(rng.integers(64, 150_000)),
                "duration": float(rng.uniform(0.01, 120)),
                "flags_syn": 1,
                "flags_ack": 1,
                "flags_fin": int(rng.choice([0, 1])),
                "flags_rst": 0,
                "label": "benign",
            }
        )

    # Suspicious traffic (~25 %)
    n_suspicious = int(n_samples * 0.25)
    for _ in range(n_suspicious):
        records.append(
            {
                "src_port": int(rng.integers(1024, 65535)),
                "dst_port": int(rng.choice([22, 23, 3389, 445, 139, 1433, 3306])),
                "protocol": int(rng.choice([6, 17])),
                "packet_count": int(rng.integers(1, 50)),
                "byte_count": int(rng.integers(40, 5_000)),
                "duration": float(rng.uniform(0.001, 2)),
                "flags_syn": 1,
                "flags_ack": 0,
                "flags_fin": 0,
                "flags_rst": int(rng.choice([0, 1])),
                "label": "suspicious",
            }
        )

    # Malicious traffic (~15 %)
    n_malicious = n_samples - n_benign - n_suspicious
    for _ in range(n_malicious):
        records.append(
            {
                "src_port": int(rng.integers(1, 1024)),
                "dst_port": int(rng.choice([22, 23, 445, 3389, 4444, 5555, 6666, 31337])),
                "protocol": int(rng.choice([6, 17, 1])),
                "packet_count": int(rng.integers(500, 100_000)),
                "byte_count": int(rng.integers(100_000, 50_000_000)),
                "duration": float(rng.uniform(0.0001, 0.5)),
                "flags_syn": 1,
                "flags_ack": 0,
                "flags_fin": 0,
                "flags_rst": 1,
                "label": "malicious",
            }
        )

    return pd.DataFrame(records)


# ---------------------------------------------------------------------------
# Model training
# ---------------------------------------------------------------------------


def train_model(output_path: str = "models/traffic_classifier.joblib") -> dict[str, Any]:
    """Train a RandomForest classifier on synthetic data and persist it."""
    logger.info("Generating synthetic training data …")
    df = _generate_synthetic_dataset()

    X = df[FEATURE_COLS].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train_scaled, y_train)

    y_pred = clf.predict(X_test_scaled)
    report = classification_report(y_test, y_pred, output_dict=True)

    logger.info(
        "Model accuracy: %.2f%%", report["accuracy"] * 100  # type: ignore[arg-type]
    )
    logger.info("\n%s", classification_report(y_test, y_pred))

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    artifact = {"model": clf, "scaler": scaler, "features": FEATURE_COLS}
    joblib.dump(artifact, out)
    logger.info("Model saved to %s", out)

    return report


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------


def _load_model(model_path: str) -> dict[str, Any]:
    p = Path(model_path)
    if not p.exists():
        logger.warning("Model not found at %s – training from scratch …", p)
        train_model(output_path=model_path)
    return joblib.load(p)


def classify_flows(
    flows: list[FlowRecord],
    model_path: str = "models/traffic_classifier.joblib",
    threshold: float = DEFAULT_THRESHOLD,
) -> list[dict[str, Any]]:
    """Classify a batch of FlowRecords.

    Returns a list of dicts with keys: label, confidence, probabilities.
    """
    if not flows:
        return []

    artifact = _load_model(model_path)
    clf: RandomForestClassifier = artifact["model"]
    scaler: StandardScaler = artifact["scaler"]

    feature_dicts = [flow_to_feature_vector(f) for f in flows]
    df = pd.DataFrame(feature_dicts, columns=FEATURE_COLS)
    X = scaler.transform(df.values)

    probas = clf.predict_proba(X)
    classes = clf.classes_

    results: list[dict[str, Any]] = []
    for proba in probas:
        max_idx = int(np.argmax(proba))
        confidence = float(proba[max_idx])
        label = str(classes[max_idx])

        if confidence < threshold and label == "benign":
            label = "suspicious"

        results.append(
            {
                "label": label,
                "confidence": confidence,
                "probabilities": {str(c): round(float(p), 4) for c, p in zip(classes, proba)},
            }
        )

    return results


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="The Judge – AI traffic classifier")
    sub = parser.add_subparsers(dest="command")

    train_p = sub.add_parser("train", help="Train model on synthetic data")
    train_p.add_argument(
        "-o",
        "--output",
        default="models/traffic_classifier.joblib",
        help="Output model path",
    )

    classify_p = sub.add_parser("classify", help="Classify sample flows (demo)")
    classify_p.add_argument(
        "-m",
        "--model",
        default="models/traffic_classifier.joblib",
        help="Model path",
    )

    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

    if args.command == "train":
        train_model(output_path=args.output)

    elif args.command == "classify":
        demo_flows = [
            FlowRecord(
                src_ip="10.0.0.5",
                dst_ip="8.8.8.8",
                src_port=54321,
                dst_port=443,
                protocol="tcp",
                packet_count=100,
                byte_count=50000,
                duration=30.0,
                flags_syn=1,
                flags_ack=1,
            ),
            FlowRecord(
                src_ip="192.168.1.100",
                dst_ip="10.0.0.1",
                src_port=12345,
                dst_port=22,
                protocol="tcp",
                packet_count=50000,
                byte_count=25000000,
                duration=0.1,
                flags_syn=1,
                flags_rst=1,
            ),
        ]
        results = classify_flows(demo_flows, model_path=args.model)
        for flow, result in zip(demo_flows, results):
            logger.info(
                "%s:%d -> %s:%d  =>  %s (%.2f)",
                flow.src_ip,
                flow.src_port,
                flow.dst_ip,
                flow.dst_port,
                result["label"],
                result["confidence"],
            )
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
