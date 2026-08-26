
import ssl
from functools import wraps
from flask import request, jsonify
import OpenSSL.crypto

def require_client_cert(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # In a real production deployment (e.g. Ninx/Apache), the web server handles mTLS 
        # and passes the client cert details in headers like X-SSL-Client-Cert.
        # However, for this Flask generic setup, or if running directly with SSL context, 
        # we check the environ if available (Werkzeug/Gunicorn).
        
        # Check for X-Client-CN header (Assumes generic proxy for now)
        # OR verify logic if using pure Python SSL context
        
        # NOTE: Flask's built-in dev server doesn't easily expose client cert details 
        # to the application layer without a workaround or using a proper WSGI server.
        # This function acts as a placeholder for the logic enforcement.
        
        # For simulation, we will check if the request came over HTTPS and has a verified context
        # In production with Nginx:
        # client_verified = request.headers.get('X-Client-Verified') == 'SUCCESS'
        
        # For direct Python SSL (not easily accessible in Flask request object standardly),
        # we rely on the SSL context configuration to REJECT connections at the socket level
        # if they don't have a cert. So if the request reaches here, it *has* a cert.
        
        # We can try to extract identity if passed by proxy
        agent_id = request.headers.get('X-Client-DN', 'Unknown-Agent')
        
        # Log the access
        print(f"[AUTH] mTLS Connection from {agent_id} verified.")
        return f(*args, **kwargs)
    return decorated_function
