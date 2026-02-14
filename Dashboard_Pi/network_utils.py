"""
Network helper functions to get private ip4 address
"""

import socket
import ipaddress


LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}


def _is_private_ipv4(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False

    return (
        isinstance(addr, ipaddress.IPv4Address)
        and addr.is_private
        and not addr.is_loopback
        and not addr.is_link_local
    )


def _find_private_ip() -> str | None:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("1.1.1.1", 80))
            ip = s.getsockname()[0]
            if ip and _is_private_ipv4(ip):
                return ip
    except OSError:
        pass

    ips: set[str] = set()

    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if ip and _is_private_ipv4(ip):
                ips.add(ip)
    except OSError:
        pass

    try:
        for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
            if ip and _is_private_ipv4(ip):
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
