import os
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
import datetime
import ipaddress

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CERTS_DIR = os.path.join(BASE_DIR, "certs")
CA_DIR = os.path.join(CERTS_DIR, "ca")
SERVER_DIR = os.path.join(CERTS_DIR, "server")
CLIENT_DIR = os.path.join(CERTS_DIR, "clients")

def generate_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)

def save_key(key, filename):
    with open(filename, "wb") as f:
        f.write(key.private_bytes(
            encoding=Encoding.PEM,
            format=PrivateFormat.PKCS8,
            encryption_algorithm=NoEncryption()
        ))

def save_cert(cert, filename):
    with open(filename, "wb") as f:
        f.write(cert.public_bytes(Encoding.PEM))

def create_ca():
    print("[*] Generating CA Root Certificate...")
    os.makedirs(CA_DIR, exist_ok=True)
    
    key = generate_key()
    save_key(key, os.path.join(CA_DIR, "ca.key"))

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, u"US"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"CyberSpace"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"HardSecNet CA"),
        x509.NameAttribute(NameOID.COMMON_NAME, u"HardSecNet Root CA"),
    ])

    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        # Valid for 10 years
        datetime.datetime.utcnow() + datetime.timedelta(days=3650)
    ).add_extension(
        x509.BasicConstraints(ca=True, path_length=None), critical=True,
    ).add_extension(
        x509.SubjectKeyIdentifier.from_public_key(key.public_key()), critical=False,
    ).add_extension(
        x509.KeyUsage(
            digital_signature=True,
            content_commitment=False,
            key_encipherment=False,
            data_encipherment=False,
            key_agreement=False,
            key_cert_sign=True,
            crl_sign=True,
            encipher_only=False,
            decipher_only=False
        ), critical=True,
    ).sign(key, hashes.SHA256())

    save_cert(cert, os.path.join(CA_DIR, "ca.crt"))
    print(f"    [+] CA Certificate created at {CA_DIR}")
    return key, cert

def create_server_cert(ca_key, ca_cert):
    print("[*] Generating Server Certificate...")
    os.makedirs(SERVER_DIR, exist_ok=True)
    
    key = generate_key()
    save_key(key, os.path.join(SERVER_DIR, "server.key"))

    subject = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, u"US"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"HardSecNet Server"),
        x509.NameAttribute(NameOID.COMMON_NAME, u"localhost"),
    ])

    # SANs (Subject Alternative Names) - Critical for IP connection
    alt_names = [
        x509.DNSName(u"localhost"),
        x509.DNSName(u"hardsecnet-server"),
        x509.IPAddress(ipaddress.IPv4Address(u"127.0.0.1")),
        # Add your local network IP here if needed for remote access
        x509.IPAddress(ipaddress.IPv4Address(u"0.0.0.0")) 
    ]

    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        ca_cert.subject
    ).public_key(
        key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        datetime.datetime.utcnow() + datetime.timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName(alt_names), critical=False,
    ).add_extension(
        x509.AuthorityKeyIdentifier.from_issuer_public_key(ca_key.public_key()), critical=False,
    ).sign(ca_key, hashes.SHA256())

    save_cert(cert, os.path.join(SERVER_DIR, "server.crt"))
    print(f"    [+] Server Certificate created at {SERVER_DIR}")

def create_client_cert(ca_key, ca_cert, client_name="agent-001"):
    print(f"[*] Generating Client Certificate for {client_name}...")
    client_path = os.path.join(CLIENT_DIR, client_name)
    os.makedirs(client_path, exist_ok=True)
    
    key = generate_key()
    save_key(key, os.path.join(client_path, "client.key"))

    subject = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, u"US"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"HardSecNet Agent"),
        x509.NameAttribute(NameOID.COMMON_NAME, client_name),
    ])

    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        ca_cert.subject
    ).public_key(
        key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        datetime.datetime.utcnow() + datetime.timedelta(days=365)
    ).add_extension(
        x509.BasicConstraints(ca=False, path_length=None), critical=True,
    ).add_extension(
        x509.AuthorityKeyIdentifier.from_issuer_public_key(ca_key.public_key()), critical=False,
    ).sign(ca_key, hashes.SHA256())

    save_cert(cert, os.path.join(client_path, "client.crt"))
    print(f"    [+] Client Certificate created at {client_path}")

if __name__ == "__main__":
    # Clean up old certs? Optional, but safer to overwrite.
    print(f"Generating PKI Infrastructure in {CERTS_DIR}...")
    ca_key, ca_cert = create_ca()
    create_server_cert(ca_key, ca_cert)
    create_client_cert(ca_key, ca_cert, "agent-001")
    print("\n[OK] PKI Setup Complete. You can now build the Docker container.")
