"""
PostDraft Application Runner
Starts the FastAPI backend and Next.js frontend concurrently.
"""

import os
import sys
import time
import signal
import argparse
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
VENV_PYTHON = ROOT_DIR / ".venv" / "Scripts" / "python.exe"

def get_python_executable():
    if VENV_PYTHON.exists():
        return str(VENV_PYTHON)
    return sys.executable

def get_npm_cmd():
    return "npm.cmd" if sys.platform == "win32" else "npm"

def kill_process_tree(pid: int):
    """Cleanly terminate process and any child processes on Windows or Unix."""
    if sys.platform == "win32":
        try:
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception:
            pass
    else:
        try:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        except Exception:
            pass

def check_frontend_node_modules():
    node_modules = FRONTEND_DIR / "node_modules"
    if not node_modules.exists():
        print("[PostDraft] 'node_modules' not found in frontend directory.")
        print("[PostDraft] Installing frontend dependencies via npm install...")
        npm_cmd = get_npm_cmd()
        subprocess.run([npm_cmd, "install"], cwd=str(FRONTEND_DIR), check=True)
        print("[PostDraft] Frontend dependencies installed successfully.\n")

def main():
    parser = argparse.ArgumentParser(description="Start PostDraft Application")
    parser.add_argument(
        "--backend-only", "-b", action="store_true", help="Start only the FastAPI backend server"
    )
    parser.add_argument(
        "--frontend-only", "-f", action="store_true", help="Start only the Next.js frontend"
    )
    parser.add_argument(
        "--backend-port", default=8000, type=int, help="Port for FastAPI backend (default: 8000)"
    )
    parser.add_argument(
        "--frontend-port", default=3000, type=int, help="Port for Next.js frontend (default: 3000)"
    )
    parser.add_argument(
        "--no-browser", action="store_true", help="Do not automatically open the browser"
    )
    args = parser.parse_args()

    python_bin = get_python_executable()
    npm_cmd = get_npm_cmd()

    print("=" * 65)
    print("           PostDraft: Agentic LinkedIn Post Generator           ")
    print("=" * 65)
    print(f" Python Executable : {python_bin}")
    print(f" Working Directory : {ROOT_DIR}")
    print("=" * 65)

    processes = []

    try:
        # 1. Start Backend
        if not args.frontend_only:
            backend_cmd = [
                python_bin,
                "-m",
                "uvicorn",
                "backend.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(args.backend_port),
                "--reload",
            ]
            print(f"\n[1/2] Starting FastAPI Backend on http://127.0.0.1:{args.backend_port}...")
            backend_proc = subprocess.Popen(
                backend_cmd,
                cwd=str(ROOT_DIR),
            )
            processes.append(("Backend", backend_proc))
            time.sleep(1.5)

        # 2. Start Frontend
        if not args.backend_only:
            check_frontend_node_modules()
            frontend_cmd = [
                npm_cmd,
                "run",
                "dev",
                "--",
                "-p",
                str(args.frontend_port),
            ]
            print(f"[2/2] Starting Next.js Frontend on http://localhost:{args.frontend_port}...")
            frontend_proc = subprocess.Popen(
                frontend_cmd,
                cwd=str(FRONTEND_DIR),
            )
            processes.append(("Frontend", frontend_proc))

        print("\n" + "=" * 65)
        print("  PostDraft is running!")
        if not args.frontend_only:
            print(f"  - Backend API: http://127.0.0.1:{args.backend_port}")
            print(f"  - Swagger Docs: http://127.0.0.1:{args.backend_port}/docs")
        if not args.backend_only:
            print(f"  - Web UI: http://localhost:{args.frontend_port}")
        print("  Press Ctrl+C to stop all services.")
        print("=" * 65 + "\n")

        # Keep parent script alive while monitoring child processes
        while True:
            time.sleep(1)
            for name, proc in processes:
                poll = proc.poll()
                if poll is not None:
                    print(f"\n[PostDraft] {name} process exited with code {poll}.")
                    return

    except KeyboardInterrupt:
        print("\n[PostDraft] Shutting down all services...")
    finally:
        for name, proc in processes:
            print(f"[PostDraft] Stopping {name} (PID: {proc.pid})...")
            kill_process_tree(proc.pid)
            try:
                proc.wait(timeout=3)
            except Exception:
                pass
        print("[PostDraft] All services stopped.")

if __name__ == "__main__":
    main()
