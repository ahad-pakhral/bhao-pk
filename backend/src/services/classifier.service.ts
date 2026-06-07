import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

const BACKEND_DIR = path.join(__dirname, '../..');
const SCRAPERS_DIR = path.join(BACKEND_DIR, 'scrapers');
const VENV_PYTHON = path.join(SCRAPERS_DIR, '.venv', 'bin', 'python3');
const PYTHON_BIN = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';
const CLASSIFY_SERVER_SCRIPT = path.join(BACKEND_DIR, 'classify_server.py');
const PORT = 3005;

let pythonProcess: ChildProcess | null = null;

export function initClassifierService() {
  if (pythonProcess) return;

  console.log(`[ClassifierService] Spawning classifier server with ${PYTHON_BIN}...`);
  pythonProcess = spawn(PYTHON_BIN, [CLASSIFY_SERVER_SCRIPT, String(PORT)], {
    stdio: 'inherit',
    detached: false,
  });

  pythonProcess.on('error', (err) => {
    console.error('[ClassifierService] Python spawn error:', err);
  });

  pythonProcess.on('exit', (code, signal) => {
    console.log(`[ClassifierService] Python process exited with code ${code} and signal ${signal}`);
    pythonProcess = null;
  });

  // Ensure python process is terminated when the node app exits
  const cleanup = () => {
    if (pythonProcess) {
      console.log('[ClassifierService] Terminating python process...');
      pythonProcess.kill('SIGTERM');
      pythonProcess = null;
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(); });
  process.on('SIGTERM', () => { cleanup(); process.exit(); });
}

export async function classifyQuery(query: string): Promise<'KW' | 'NL'> {
  if (!query || !query.trim()) {
    return 'KW';
  }

  try {
    const response = await fetch(`http://127.0.0.1:${PORT}/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: query.trim() }),
    });

    if (response.ok) {
      const data = await response.json() as { label: string };
      if (data.label === 'NL' || data.label === 'KW') {
        return data.label as 'KW' | 'NL';
      }
    }
  } catch (err) {
    console.error('[ClassifierService] Classification request failed, falling back to local NLP heuristics:', err);
  }

  // Fallback heuristic check if the classifier microservice is unavailable
  return fallbackNlDetector(query);
}

function fallbackNlDetector(query: string): 'KW' | 'NL' {
  const words = query.trim().split(/\s+/);
  const hasNlIndicator = /^(i|im|ill|want|need|looking|prefer|like|buy|for|budget|cheap|expensive|vs|but|so|instead)\b/i.test(query) || words.length > 3;
  return hasNlIndicator ? 'NL' : 'KW';
}
