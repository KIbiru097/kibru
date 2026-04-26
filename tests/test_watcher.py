"""Tests for The Watcher – log and conntrack parsers."""

from src.watcher import (
    FlowRecord,
    LogEntry,
    WatcherConfig,
    encode_protocol,
    extract_flows_from_firewall_log,
    flow_to_feature_vector,
    parse_conntrack,
    parse_syslog,
)


class TestParseConntrack:
    def test_tcp_entry(self):
        line = (
            "tcp      6 117 TIME_WAIT src=10.0.0.5 dst=93.184.216.34 "
            "sport=54321 dport=443 packets=12 bytes=1500 "
            "src=93.184.216.34 dst=10.0.0.5 sport=443 dport=54321 "
            "packets=10 bytes=8000 [ASSURED] mark=0 use=1"
        )
        records = parse_conntrack(line)
        assert len(records) == 1
        r = records[0]
        assert r.src_ip == "10.0.0.5"
        assert r.dst_ip == "93.184.216.34"
        assert r.src_port == 54321
        assert r.dst_port == 443
        assert r.protocol == "tcp"
        assert r.packet_count == 12
        assert r.byte_count == 1500

    def test_empty_input(self):
        assert parse_conntrack("") == []

    def test_multiple_entries(self):
        lines = (
            "tcp  6 10 SYN_SENT src=1.1.1.1 dst=2.2.2.2 sport=111 dport=80 packets=1 bytes=60\n"
            "udp  17 30 src=3.3.3.3 dst=4.4.4.4 sport=5353 dport=53 packets=5 bytes=400\n"
        )
        records = parse_conntrack(lines)
        assert len(records) == 2
        assert records[1].protocol == "udp"


class TestParseSyslog:
    def test_standard_entry(self):
        line = "Jan  5 12:34:56 vyos-r1 kernel[1234]: some firewall message"
        entries = parse_syslog(line)
        assert len(entries) == 1
        assert entries[0].host == "vyos-r1"
        assert entries[0].process == "kernel"
        assert entries[0].pid == "1234"

    def test_no_pid(self):
        line = "Jan  5 12:34:56 vyos-r1 dhclient: DHCPACK from 10.0.0.1"
        entries = parse_syslog(line)
        assert len(entries) == 1
        assert entries[0].pid == ""

    def test_empty(self):
        assert parse_syslog("") == []


class TestExtractFirewallFlows:
    def test_firewall_log_line(self):
        entry = LogEntry(
            message=(
                "[WAN-LOCAL-default-D] IN=eth0 OUT= "
                "MAC=00:11:22:33:44:55 SRC=192.168.1.100 DST=10.0.0.1 "
                "LEN=60 PROTO=TCP SPT=12345 DPT=22"
            ),
            raw="raw line",
        )
        flows = extract_flows_from_firewall_log([entry])
        assert len(flows) == 1
        assert flows[0].src_ip == "192.168.1.100"
        assert flows[0].dst_port == 22
        assert flows[0].protocol == "tcp"

    def test_no_match(self):
        entry = LogEntry(message="unrelated log message", raw="raw")
        assert extract_flows_from_firewall_log([entry]) == []


class TestFlowToFeature:
    def test_feature_dict_keys(self):
        flow = FlowRecord(src_port=443, dst_port=80, protocol="tcp")
        fv = flow_to_feature_vector(flow)
        expected_keys = {
            "src_port", "dst_port", "protocol", "packet_count",
            "byte_count", "duration", "flags_syn", "flags_ack",
            "flags_fin", "flags_rst",
        }
        assert set(fv.keys()) == expected_keys

    def test_protocol_encoding(self):
        assert encode_protocol("tcp") == 6
        assert encode_protocol("udp") == 17
        assert encode_protocol("icmp") == 1
        assert encode_protocol("gre") == 0


class TestWatcherConfig:
    def test_from_dict_defaults(self):
        cfg = WatcherConfig.from_dict({})
        assert cfg.mode == "ssh"
        assert cfg.poll_interval == 10

    def test_from_dict_custom(self):
        data = {
            "watcher": {
                "mode": "local",
                "poll_interval": 5,
                "ssh": {"host": "10.0.0.1", "port": 2222},
                "local": {"log_path": "/tmp/test.log"},
            }
        }
        cfg = WatcherConfig.from_dict(data)
        assert cfg.mode == "local"
        assert cfg.ssh_host == "10.0.0.1"
        assert cfg.ssh_port == 2222
        assert cfg.local_log_path == "/tmp/test.log"
