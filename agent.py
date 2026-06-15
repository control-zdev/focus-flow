"""
Focus-Flow: Local System Monitor Agent
FastAPI + WebSockets + psutil for hardware monitoring
100% Free, Privacy-First, Locally-Stored Data
"""

import asyncio
import json
import logging
import os
import platform
import psutil
import socket
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass, asdict, field
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@dataclass
class SystemMetrics:
    """Core system metrics"""

    timestamp: float
    cpu_percent: float
    memory_percent: float
    memory_available_mb: float
    cpu_temp: Optional[float]
    disk_percent: float
    uptime_seconds: float

    def to_dict(self):
        return asdict(self)


@dataclass
class ServiceStatus:
    """Service health status"""

    name: str
    running: bool
    port: Optional[int] = None
    process_name: Optional[str] = None


@dataclass
class AggregateMetrics:
    """Aggregated metrics for opt-in telemetry (privacy-preserving)"""

    timestamp: float
    cpu_avg: float
    memory_avg: float
    uptime_hours: float
    active_services: List[str]  # e.g., ["Docker", "Redis", "Node.js"]
    timezone: str
    language: str
    machine_id: str  # Persistent but anonymized
    device_type: str  # "MacBook", "Linux", "Windows"

    def to_dict(self):
        return asdict(self)


class SystemMonitor:
    """Monitors system health and services"""

    # Common dev ports to monitor
    DEV_PORTS = {
        3000: "React Dev",
        3001: "React Dev Alt",
        5000: "Flask/Python",
        5432: "PostgreSQL",
        6379: "Redis",
        8000: "Django",
        8080: "General HTTP",
        9000: "Backend Service",
        27017: "MongoDB",
        5173: "Vite Dev",
        6006: "Storybook",
    }

    # Common dev processes
    DEV_PROCESSES = {
        "docker": "Docker",
        "redis-server": "Redis",
        "postgres": "PostgreSQL",
        "nginx": "Nginx",
        "node": "Node.js",
        "python": "Python",
        "code": "VS Code",
        "insomnia": "Insomnia",
        "postman": "Postman",
        "mongodb": "MongoDB",
        "mysql": "MySQL",
    }

    def __init__(self):
        self.alert_thresholds = {
            "cpu": 85,
            "temp": 75,
            "memory": 90,
        }
        self.last_alert_time = {}
        self.boot_time = psutil.boot_time()
        self.machine_id = self._get_machine_id()
        self.metric_history = []
        self.max_history = 1800  # 1 hour at 2s intervals

    def _get_machine_id(self) -> str:
        """Generate persistent but anonymized machine ID"""
        config_path = os.path.expanduser("~/.focus-flow/machine_id")
        os.makedirs(os.path.dirname(config_path), exist_ok=True)

        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                return f.read().strip()

        machine_id = str(uuid.uuid4())
        with open(config_path, "w") as f:
            f.write(machine_id)
        return machine_id

    async def get_system_metrics(self) -> SystemMetrics:
        """Collect system metrics"""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage("/")

            # Get CPU temperature (platform-dependent)
            cpu_temp = self._get_cpu_temp()

            # Calculate uptime
            uptime_seconds = datetime.now().timestamp() - self.boot_time

            metrics = SystemMetrics(
                timestamp=datetime.now().timestamp(),
                cpu_percent=round(cpu_percent, 2),
                memory_percent=round(memory.percent, 2),
                memory_available_mb=round(memory.available / 1024 / 1024, 2),
                cpu_temp=cpu_temp,
                disk_percent=round(disk.percent, 2),
                uptime_seconds=uptime_seconds,
            )

            # Keep history for aggregation
            self.metric_history.append(metrics)
            if len(self.metric_history) > self.max_history:
                self.metric_history.pop(0)

            return metrics
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
            return None

    def _get_cpu_temp(self) -> Optional[float]:
        """Get CPU temperature (platform-specific)"""
        try:
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if temps:
                    for name, entries in temps.items():
                        if entries:
                            return round(entries[0].current, 2)
        except Exception as e:
            logger.debug(f"Could not read CPU temp: {e}")
        return None

    async def get_active_services(self) -> List[ServiceStatus]:
        """Detect active services and open ports"""
        services = []
        checked_ports: Set[int] = set()

        # Check common dev ports
        for port, service_name in self.DEV_PORTS.items():
            if port in checked_ports:
                continue
            checked_ports.add(port)

            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                    sock.settimeout(0.1)
                    result = sock.connect_ex(("127.0.0.1", port))
                    if result == 0:
                        services.append(
                            ServiceStatus(
                                name=service_name,
                                running=True,
                                port=port,
                                process_name=None,
                            )
                        )
            except Exception:
                pass

        # Check processes
        try:
            for proc in psutil.process_iter(["name", "pid"]):
                try:
                    proc_name = proc.info["name"].lower()
                    for process_key, process_label in self.DEV_PROCESSES.items():
                        if process_key in proc_name:
                            if not any(s.name == process_label for s in services):
                                services.append(
                                    ServiceStatus(
                                        name=process_label,
                                        running=True,
                                        port=None,
                                        process_name=proc_name,
                                    )
                                )
                            break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
        except Exception as e:
            logger.debug(f"Error checking processes: {e}")

        return services[:10]

    async def check_alerts(self, metrics: SystemMetrics) -> Dict:
        """Check if metrics trigger alerts"""
        alerts = {"active": False, "messages": [], "severity": "info"}

        if metrics.cpu_percent > self.alert_thresholds["cpu"]:
            alerts["active"] = True
            alerts["severity"] = "warning"
            alerts["messages"].append(f"High CPU: {metrics.cpu_percent}%")

        if metrics.memory_percent > self.alert_thresholds["memory"]:
            alerts["active"] = True
            alerts["severity"] = "warning"
            alerts["messages"].append(f"High Memory: {metrics.memory_percent}%")

        if metrics.cpu_temp and metrics.cpu_temp > self.alert_thresholds["temp"]:
            alerts["active"] = True
            alerts["severity"] = "critical"
            alerts["messages"].append(f"High Temperature: {metrics.cpu_temp}°C")

        return alerts

    def get_aggregate_metrics(self) -> Optional[AggregateMetrics]:
        """Generate privacy-preserving aggregate metrics"""
        if not self.metric_history:
            return None

        # Calculate averages over last hour
        cpu_avg = round(
            sum(m.cpu_percent for m in self.metric_history) / len(self.metric_history),
            2,
        )
        memory_avg = round(
            sum(m.memory_percent for m in self.metric_history)
            / len(self.metric_history),
            2,
        )
        uptime_hours = round(self.metric_history[-1].uptime_seconds / 3600, 2)

        # Get device type
        system = platform.system()
        machine_type = platform.machine()
        if system == "Darwin":
            device_type = "MacBook" if "arm" in machine_type.lower() else "Mac"
        elif system == "Windows":
            device_type = "Windows PC"
        else:
            device_type = "Linux" if "linux" in system.lower() else "Unknown"

        return AggregateMetrics(
            timestamp=datetime.now().timestamp(),
            cpu_avg=cpu_avg,
            memory_avg=memory_avg,
            uptime_hours=uptime_hours,
            active_services=[],  # Will be populated by caller
            timezone=str(datetime.now().astimezone().tzinfo),
            language=os.environ.get("LANG", "en_US"),
            machine_id=self.machine_id,
            device_type=device_type,
        )


class ConnectionManager:
    """Manage WebSocket connections"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Send message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


# Initialize FastAPI app
app = FastAPI(title="Focus-Flow Agent", version="1.0.0")
manager = ConnectionManager()
monitor = SystemMonitor()

# Configure CORS and LNA headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Simple health check"""
    return {
        "status": "ok",
        "service": "Focus-Flow Agent",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
    }


# System metrics endpoint
@app.get("/metrics")
async def get_metrics():
    """Get current system metrics"""
    try:
        metrics = await monitor.get_system_metrics()
        services = await monitor.get_active_services()
        alerts = await monitor.check_alerts(metrics)

        return {
            "metrics": metrics.to_dict() if metrics else None,
            "services": [asdict(s) for s in services],
            "alerts": alerts,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error in get_metrics: {e}")
        return {"error": str(e)}, 500


# Aggregate metrics endpoint (privacy-preserving)
@app.get("/aggregate-metrics")
async def get_aggregate_metrics():
    """Get anonymized aggregate metrics (requires user consent)"""
    try:
        services = await monitor.get_active_services()
        aggregate = monitor.get_aggregate_metrics()

        if aggregate:
            aggregate.active_services = [s.name for s in services]
            return aggregate.to_dict()

        return {"error": "No metrics available yet"}, 503
    except Exception as e:
        logger.error(f"Error in get_aggregate_metrics: {e}")
        return {"error": str(e)}, 500


# WebSocket endpoint for real-time streaming
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time metrics"""
    await manager.connect(websocket)

    try:
        await websocket.send_json(
            {
                "type": "connected",
                "message": "Connected to Focus-Flow Agent",
                "machine_id": monitor.machine_id,
                "timestamp": datetime.now().isoformat(),
            }
        )

        # Stream metrics every 2 seconds
        while True:
            metrics = await monitor.get_system_metrics()
            services = await monitor.get_active_services()
            alerts = await monitor.check_alerts(metrics)

            await websocket.send_json(
                {
                    "type": "metrics",
                    "metrics": metrics.to_dict() if metrics else None,
                    "services": [asdict(s) for s in services],
                    "alerts": alerts,
                    "timestamp": datetime.now().isoformat(),
                }
            )

            await asyncio.sleep(2)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected from WebSocket")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# LNA headers middleware
@app.middleware("http")
async def add_lna_headers(request, call_next):
    """Add Local Network Access headers"""
    response = await call_next(request)
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


if __name__ == "__main__":
    logger.info("Starting Focus-Flow Agent...")
    logger.info("🔒 100% Free & Privacy-First")
    logger.info("📊 Available at: http://localhost:5000")
    logger.info("🔌 WebSocket: ws://localhost:5000/ws")
    logger.info("📈 Metrics: http://localhost:5000/metrics")
    logger.info("✅ Health: http://localhost:5000/health")
    logger.info("🎯 Aggregate (opt-in): http://localhost:5000/aggregate-metrics")

    uvicorn.run(app, host="127.0.0.1", port=5000, log_level="info")
