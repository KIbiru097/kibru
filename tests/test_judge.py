"""Tests for The Judge – AI traffic classifier."""


from src.judge import (
    FEATURE_COLS,
    _generate_synthetic_dataset,
    classify_flows,
    train_model,
)
from src.watcher import FlowRecord


class TestSyntheticDataset:
    def test_shape(self):
        df = _generate_synthetic_dataset(n_samples=100)
        assert len(df) == 100
        assert "label" in df.columns
        for col in FEATURE_COLS:
            assert col in df.columns

    def test_labels(self):
        df = _generate_synthetic_dataset(n_samples=1000)
        labels = set(df["label"].unique())
        assert labels == {"benign", "suspicious", "malicious"}

    def test_no_nans(self):
        df = _generate_synthetic_dataset()
        assert not df.isnull().any().any()


class TestTrainModel:
    def test_train_produces_model(self, tmp_path):
        out = str(tmp_path / "test_model.joblib")
        report = train_model(output_path=out)
        assert "accuracy" in report
        assert report["accuracy"] > 0.5  # sanity check

    def test_model_file_created(self, tmp_path):
        out = tmp_path / "test_model.joblib"
        train_model(output_path=str(out))
        assert out.exists()


class TestClassifyFlows:
    def test_classify_benign(self, tmp_path):
        model_path = str(tmp_path / "clf.joblib")
        train_model(output_path=model_path)

        flows = [
            FlowRecord(
                src_port=54321,
                dst_port=443,
                protocol="tcp",
                packet_count=100,
                byte_count=50000,
                duration=30.0,
                flags_syn=1,
                flags_ack=1,
            )
        ]
        results = classify_flows(flows, model_path=model_path)
        assert len(results) == 1
        assert results[0]["label"] in {"benign", "suspicious", "malicious"}
        assert 0 <= results[0]["confidence"] <= 1

    def test_classify_empty(self, tmp_path):
        model_path = str(tmp_path / "clf.joblib")
        train_model(output_path=model_path)
        assert classify_flows([], model_path=model_path) == []

    def test_classify_suspicious_traffic(self, tmp_path):
        model_path = str(tmp_path / "clf.joblib")
        train_model(output_path=model_path)

        flows = [
            FlowRecord(
                src_port=100,
                dst_port=31337,
                protocol="tcp",
                packet_count=80000,
                byte_count=40000000,
                duration=0.01,
                flags_syn=1,
                flags_rst=1,
            )
        ]
        results = classify_flows(flows, model_path=model_path)
        assert len(results) == 1
        assert results[0]["label"] in {"suspicious", "malicious"}
