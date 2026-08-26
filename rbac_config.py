
# DEFINING ROLES AND PERMISSIONS

ROLES = {
    "super_admin": {
        "description": "Full access to all system features and user management",
        "permissions": [
            "dashboard.view", "network.monitor", "logs.view", "reports.export",
            "processes.kill", "agents.manage", "settings.modify", "users.manage",
            "hardening.execute", "remediation.toggle"
        ]
    },
    "security_admin": {
        "description": "Operational access for security monitoring and response",
        "permissions": [
            "dashboard.view", "network.monitor", "logs.view", "reports.export",
            "processes.kill", "agents.manage", "settings.modify",
            "hardening.execute", "remediation.toggle"
        ]
    },
    "auditor": {
        "description": "Read-only access for compliance verification and reporting",
        "permissions": [
            "dashboard.view", "network.monitor", "logs.view", "reports.export"
        ]
    },
    "viewer": {
        "description": "Basic read-only access for monitoring",
        "permissions": [
            "dashboard.view", "network.monitor"
        ]
    }
}

def get_role_permissions(role_name):
    return ROLES.get(role_name, {}).get("permissions", [])

def check_permission(user_role, required_permission):
    perms = get_role_permissions(user_role)
    return required_permission in perms
