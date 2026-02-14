"""
Network helper functions to get private ip4 address
"""

import socket
import ipaddress


LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}


def _find_private_ip() -> str | None:
    ips: set[str] = set()

    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if not ip:
                continue

            try:
                addr = ipaddress.ip_address(ip)
            except ValueError:
                continue

            # RFC1918 private IPv4 ranges only
            if (
                isinstance(addr, ipaddress.IPv4Address)
                and (
                    ip.startswith("10.")
                    or ip.startswith("192.168.")
                    or (ip.startswith("172.") and 16 <= int(ip.split(".")[1]) <= 31)
                )
            ):
                ips.add(ip)
    except OSError:
        pass

    if ips:
        return sorted(ips)[0]

    return None


def resolve_current_endpoint(request_host: str, request_host_url: str, port: int) -> str:
    host = (request_host or "").split(":")[0].strip().lower()
    current_endpoint = request_host_url.rstrip("/")

    if host in LOOPBACK_HOSTS:
        private_ip = _find_private_ip()
        if private_ip:
            if port in (80, 443):
                return f"http://{private_ip}"
            return f"http://{private_ip}:{port}"

    return current_endpoint
