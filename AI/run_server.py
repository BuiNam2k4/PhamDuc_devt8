#!/usr/bin/env python3
"""
Script khởi chạy AI Monitoring Server cho hệ thống giám sát thi online.
Chạy trên cổng 8000 (FastAPI + WebSockets).
"""

import sys
import os
import uvicorn

# Thêm directory hiện tại và backend vào Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Khởi động AI Exam Monitoring Service...")
    print("🌐 Host: http://0.0.0.0:8000")
    print("🔧 API Docs: http://localhost:8000/docs")
    print("⚡ WebSocket: ws://localhost:8000/ws")
    print("=" * 60)
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
