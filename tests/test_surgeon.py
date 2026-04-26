"""Tests for The Surgeon – command builders and history tracking."""

import json

from src.surgeon import (
    build_block_ip_commands,
    build_block_port_commands,
    build_commit_save,
    build_rollback_commands,
    record_action,
)


class TestBuildBlockIPCommands:
    def test_default_params(self):
        cmds = build_block_ip_commands("10.0.0.100")
        assert any("drop" in c for c in cmds)
        assert any("10.0.0.100" in c for c in cmds)
        assert any("SENTINEL-BLOCK" in c for c in cmds)
        assert any("1000" in c for c in cmds)

    def test_custom_rule_set(self):
        cmds = build_block_ip_commands(
            "1.2.3.4", rule_set="CUSTOM", rule_number=5000
        )
        assert any("CUSTOM" in c for c in cmds)
        assert any("5000" in c for c in cmds)


class TestBuildBlockPortCommands:
    def test_tcp_port(self):
        cmds = build_block_port_commands(22, protocol="tcp")
        assert any("22" in c and "port" in c for c in cmds)
        assert any("tcp" in c for c in cmds)

    def test_udp_port(self):
        cmds = build_block_port_commands(53, protocol="udp")
        assert any("udp" in c for c in cmds)


class TestBuildRollbackCommands:
    def test_delete_command(self):
        cmds = build_rollback_commands("SENTINEL-BLOCK", 1000)
        assert len(cmds) == 1
        assert "delete" in cmds[0]
        assert "1000" in cmds[0]


class TestCommitSave:
    def test_commit_save(self):
        cmds = build_commit_save()
        assert cmds == ["commit", "save"]


class TestHistory:
    def test_record_action(self, tmp_path, monkeypatch):
        history_file = tmp_path / "history.json"
        monkeypatch.setattr("src.surgeon.HISTORY_FILE", history_file)

        record_action("block_ip", "10.0.0.1", "SENTINEL-BLOCK", 1000, ["vyos-r1"])
        data = json.loads(history_file.read_text())
        assert len(data) == 1
        assert data[0]["action"] == "block_ip"
        assert data[0]["target"] == "10.0.0.1"

    def test_append_history(self, tmp_path, monkeypatch):
        history_file = tmp_path / "history.json"
        monkeypatch.setattr("src.surgeon.HISTORY_FILE", history_file)

        record_action("block_ip", "10.0.0.1", "S", 1000, ["r1"])
        record_action("block_port", "22/tcp", "S", 1010, ["r1"])
        data = json.loads(history_file.read_text())
        assert len(data) == 2
