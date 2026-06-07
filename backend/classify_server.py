import sys
import os
import joblib
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse

# Load model once at startup (singleton pattern)
MODEL_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), "../query_router_model.joblib"))
print(f"Loading classifier model from {MODEL_PATH}...", flush=True)

try:
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully. Ready to route queries.", flush=True)
except Exception as e:
    print(f"CRITICAL: Failed to load model: {e}", file=sys.stderr, flush=True)
    sys.exit(1)

class ClassifierHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Silence default request logging to avoid cluttering logs
        pass

    def do_POST(self):
        if self.path == '/classify':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                query = data.get('query', '')
                
                label = self.classify(query)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'label': label}).encode('utf-8'))
            except Exception as e:
                self.send_error(400, f"Error processing query: {e}")
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path.startswith('/classify'):
            try:
                parsed_url = urllib.parse.urlparse(self.path)
                params = urllib.parse.parse_qs(parsed_url.query)
                query = params.get('q', [''])[0]
                
                label = self.classify(query)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'label': label}).encode('utf-8'))
            except Exception as e:
                self.send_error(400, f"Error processing query: {e}")
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def classify(self, query):
        if not query or not isinstance(query, str) or not query.strip():
            return 'KW'  # Safe default fallback for empty/invalid queries
            
        clean_query = query.strip()
        try:
            # Predict using scikit-learn pipeline (inherits vectorization & tokenization)
            pred = model.predict([clean_query])
            label = str(pred[0]).upper()
            if label in ['KW', 'NL']:
                return label
            return 'KW'
        except Exception as err:
            print(f"Prediction error for query '{query}': {err}", file=sys.stderr, flush=True)
            return 'KW'

def run(port=3005):
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, ClassifierHandler)
    print(f"Starting classifier microservice on 127.0.0.1:{port}...", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping classifier microservice.", flush=True)
        httpd.server_close()

if __name__ == '__main__':
    port = 3005
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run(port)
