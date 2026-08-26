
# Role-Based Access Control (RBAC) System

The HardSecNet dashboard now uses a centralized RBAC system to manage user permissions.

## 1. Defined Roles
Roles are defined in `rbac_config.py` and synced to the database on startup.

| Role | Permissions |
|------|-------------|
| **Super Admin** (`admin`) | Full access (`*`) |
| **Security Admin** (`secops`) | Can kill processes, manage agents, execute hardening. Cannot manage users. |
| **Auditor** (`auditor`) | Read-only + Export Reports. Cannot make changes. |
| **Viewer** (`viewer`) | Read-only dashboard access. |

## 2. Default Credentials
| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | `super_admin` |
| `secops` | `secops123` | `security_admin` |
| `auditor` | `audit123` | `auditor` |
| `viewer` | `view123` | `viewer` |

## 3. Implementation Details
- **Backend**:
  - `rbac_config.py`: Single source of truth for Role/Permission definitions.
  - `app.py`: Uses `@permission_required("perm.name")` decorator on endpoints.
  - **Login**: Returns list of permissions to the frontend.
  
- **Frontend**:
  - `LoginScreen.jsx` should store the permissions list in LocalStorage/Context.
  - UI components should check `permissions.includes("action")` before rendering sensitive buttons.

## 4. How to Add a New Role
1. Open `rbac_config.py`.
2. Add a new key to the `ROLES` dictionary.
3. Restart the backend (`python app.py`).
4. The new role will be automatically created in the database.
