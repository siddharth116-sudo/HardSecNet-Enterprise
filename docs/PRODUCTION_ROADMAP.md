# Production Roadmap & Best Practices

To move **HardSecNet** from a development lab/prototype to a production-ready enterprise solution, implement the following changes:

## 1. Security & Infrastructure
*   **HTTPS/SSL**: Replace the Flask development server with **Gunicorn** (WSGI) behind **Nginx** or **Apache** as a reverse proxy. Configure SSL certificates (Let's Encrypt or Enterprise CA) to encrypt all traffic.
*   **Secrets Management**: Do not store `JWT_SECRET_KEY` or database credentials in `app.py`. Use Environment Variables (`.env`) or a Secret Vault (e.g., HashiCorp Vault).
*   **WinRM Security**: The current implementation uses Basic/NTLM over HTTP (5985). For production, configure **WinRM over HTTPS (5986)** using proper certificates to prevent credential interception.

## 2. Database (MongoDB)
*   **Authentication**: Enable MongoDB authentication. Currently, it connects to `mongodb://127.0.0.1:27017` without a user. Create a dedicated user with `readWrite` access to the `HardSecNet` database.
*   **Replica Sets**: Use MongoDB Replica Sets for high availability and redundancy.
*   **Backups**: Implement automated daily backups of the Mongo database (nodes, users, history).

## 3. Logging & Monitoring
*   **Centralized Logging**: Development uses `activity.log`. In production, ship logs to an ELK Stack (Elasticsearch, Logstash, Kibana) or Splunk for advanced analysis and retention.
*   **Metrics**: Expose Prometheus metrics from the Flask app to monitor API latency and error rates.

## 4. Scalability (Containerization)
*   **Docker**: Containerize the `Backend` (Flask) and `Frontend` (React/Vite).
*   **Orchestration**: Deploy on **Kubernetes (K8s)** or Docker Swarm. This allows you to scale the backend workers horizontally to handle thousands of nodes.

## 5. Role-Based Access Control (RBAC)
*   Current RBAC is basic (Admin vs Auditor). Expand this to granular permissions (e.g., `NodeManager`, `RiskAnalyst`, `ReadOnly`).

## 6. Input Validation
*   Ensure all inputs from the API (especially IPs and Hostnames) are strictly validated to prevent Command Injection, even though `subprocess` calls are generally parameterized.

---
**Prepared by**: Antigravity AI - Google DeepMind
**Date**: 2026-02-14
