python#!/usr/bin/env python3
"""
Monitor Builder - Creates comprehensive monitoring and reporting system.
"""
import json
from pathlib import Path
from datetime import datetime

class MonitorBuilder:
    def __init__(self):
        self.components = []
        
    def build_all(self):
        """Build all monitoring components."""
        self._create_dashboard()
        self._create_health_checks()
        self._create_alerting()
        self._create_reporting()
        self._create_cli_tools()
        self._save_state()
        
    def _create_dashboard(self):
        """Create monitoring dashboard."""
        dashboard_path = Path("monitoring/dashboard.py")
        dashboard_path.parent.mkdir(exist_ok=True)
        
        dashboard_code = '''
# Auto-generated monitoring dashboard
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import json

dashboard_app = FastAPI()

@dashboard_app.get("/", response_class=HTMLResponse)
async def dashboard():
    """Serve monitoring dashboard."""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>SEO Analyst Monitor</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .metric { 
                display: inline-block; 
                margin: 10px; 
                padding: 20px; 
                background: #f0f0f0; 
                border-radius: 5px; 
            }
            .metric h3 { margin: 0 0 10px 0; }
            .metric .value { font-size: 2em; font-weight: bold; }
            #charts { margin-top: 20px; }
            canvas { max-width: 500px; margin: 20px; }
        </style>
    </head>
    <body>
        <h1>SEO Analyst System Monitor</h1>
        
        <div id="metrics">
            <div class="metric">
                <h3>System Status</h3>
                <div class="value" id="status">Loading...</div>
            </div>
            <div class="metric">
                <h3>Active Requests</h3>
                <div class="value" id="requests">0</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value" id="success">100%</div>
            </div>
            <div class="metric">
                <h3>Avg Response Time</h3>
                <div class="value" id="response">0ms</div>
            </div>
        </div>
        
        <div id="charts">
            <canvas id="performanceChart"></canvas>
            <canvas id="errorChart"></canvas>
        </div>
        
        <script>
            // Auto-refresh metrics
            async function updateMetrics() {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                
                document.getElementById('status').textContent = data.status;
                document.getElementById('requests').textContent = data.active_requests;
                document.getElementById('success').textContent = data.success_rate + '%';
                document.getElementById('response').textContent = data.avg_response_ms + 'ms';
                
                updateCharts(data);
            }
            
            // Update charts
            function updateCharts(data) {
                // Performance chart
                const perfCtx = document.getElementById('performanceChart').getContext('2d');
                new Chart(perfCtx, {
                    type: 'line',
                    data: {
                        labels: data.timestamps,
                        datasets: [{
                            label: 'Response Time (ms)',
                            data: data.response_times,
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1
                        }]
                    }
                });
                
                // Error chart
                const errorCtx = document.getElementById('errorChart').getContext('2d');
                new Chart(errorCtx, {
                    type: 'bar',
                    data: {
                        labels: data.error_types,
                        datasets: [{
                            label: 'Errors by Type',
                            data: data.error_counts,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)'
                        }]
                    }
                });
            }
            
            // Refresh every 5 seconds
            setInterval(updateMetrics, 5000);
            updateMetrics();
        </script>
    </body>
    </html>
    """

@dashboard_app.get("/api/metrics")
async def get_metrics():
    """Get current metrics."""
    # Read from monitoring system
    from utils.monitoring import monitor
    
    health = monitor.get_health_status()
    
    return {
        "status": health["status"],
        "active_requests": 0,  # Would track active requests
        "success_rate": round(health.get("success_rate", 1) * 100, 1),
        "avg_response_ms": round(health.get("avg_duration_ms", 0), 1),
        "timestamps": [],  # Would include time series data
        "response_times": [],
        "error_types": ["404", "500", "Timeout"],
        "error_counts": [5, 2, 1]  # Example data
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(dashboard_app, host="0.0.0.0", port=8001)
'''
        
        dashboard_path.write_text(dashboard_code)
        self.components.append("dashboard")
        
    def _create_health_checks(self):
        """Create health check endpoints."""
        health_path = Path("monitoring/health.py")
        
        health_code = '''
# Auto-generated health checks
import duckdb
import psutil
from pathlib import Path
from datetime import datetime

class HealthChecker:
    """Comprehensive health checks."""
    
    def check_all(self):
        """Run all health checks."""
        return {
            "timestamp": datetime.now().isoformat(),
            "database": self._check_database(),
            "disk": self._check_disk_space(),
            "memory": self._check_memory(),
            "services": self._check_services(),
            "overall": self._calculate_overall()
        }
        
    def _check_database(self):
        """Check database health."""
        try:
            con = duckdb.connect("seo_analyst.db")
            count = con.execute("SELECT COUNT(*) FROM backlinks").fetchone()[0]
            con.close()
            return {
                "status": "healthy",
                "records": count,
                "size_mb": Path("seo_analyst.db").stat().st_size / 1024 / 1024
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
            
    def _check_disk_space(self):
        """Check available disk space."""
        usage = psutil.disk_usage("/")
        return {
            "status": "healthy" if usage.percent < 90 else "warning",
            "used_percent": usage.percent,
            "free_gb": usage.free / 1024 / 1024 / 1024
        }
        
    def _check_memory(self):
        """Check memory usage."""
        mem = psutil.virtual_memory()
        return {
            "status": "healthy" if mem.percent < 85 else "warning",
            "used_percent": mem.percent,
            "available_gb": mem.available / 1024 / 1024 / 1024
        }
        
    def _check_services(self):
        """Check if services are running."""
        services = {
            "api": self._check_port(8000),
            "dashboard": self._check_port(8001)
        }
        return services
        
    def _check_port(self, port):
        """Check if port is listening."""
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(("localhost", port))
        sock.close()
        return "running" if result == 0 else "stopped"
        
    def _calculate_overall(self):
        """Calculate overall health status."""
        # Would aggregate all checks
        return "healthy"

health_checker = HealthChecker()
'''
        
        health_path.write_text(health_code)
        self.components.append("health_checks")
        
    def _create_alerting(self):
        """Create alerting system."""
        alert_path = Path("monitoring/alerts.py")
        
        alert_code = '''
# Auto-generated alerting system
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

class AlertManager:
    """Manage system alerts."""
    
    def __init__(self):
        self.alerts = []
        self.alert_file = Path("logs/alerts.json")
        self.rules = self._define_rules()
        
    def _define_rules(self):
        """Define alert rules."""
        return [
            {
                "name": "high_error_rate",
                "condition": lambda m: m.get("success_rate", 1) < 0.95,
                "severity": "warning",
                "message": "Error rate above 5%"
            },
            {
                "name": "slow_response",
                "condition": lambda m: m.get("avg_response_ms", 0) > 1000,
                "severity": "warning", 
                "message": "Average response time above 1 second"
            },
            {
                "name": "database_error",
                "condition": lambda m: m.get("database", {}).get("status") == "error",
                "severity": "critical",
                "message": "Database connection failed"
            }
        ]
        
    def check_alerts(self, metrics: Dict):
        """Check if any alerts should fire."""
        for rule in self.rules:
            if rule["condition"](metrics):
                self._create_alert(rule)
                
    def _create_alert(self, rule: Dict):
        """Create a new alert."""
        alert = {
            "timestamp": datetime.now().isoformat(),
            "name": rule["name"],
            "severity": rule["severity"],
            "message": rule["message"],
            "status": "active"
        }
        self.alerts.append(alert)
        self._save_alerts()
        
        # Would send notifications here
        print(f"ALERT: {rule['severity'].upper()} - {rule['message']}")
        
    def _save_alerts(self):
        """Save alerts to file."""
        self.alert_file.parent.mkdir(exist_ok=True)
        self.alert_file.write_text(
            json.dumps(self.alerts, indent=2)
        )

alert_manager = AlertManager()
'''
        
        alert_path.write_text(alert_code)
        self.components.append("alerting")
        
    def _create_reporting(self):
        """Create automated reporting."""
        report_path = Path("monitoring/reports.py")
        
        report_code = '''
# Auto-generated reporting system
import json
from datetime import datetime, timedelta
from pathlib import Path
import duckdb

class ReportGenerator:
    """Generate automated reports."""
    
    def __init__(self):
        self.report_dir = Path("outputs/reports")
        self.report_dir.mkdir(parents=True, exist_ok=True)
        
    def generate_daily_report(self):
        """Generate daily performance report."""
        report = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "type": "daily",
            "metrics": self._get_daily_metrics(),
            "top_issues": self._get_top_issues(),
            "recommendations": self._get_recommendations()
        }
        
        filename = f"daily_report_{report['date']}.json"
        (self.report_dir / filename).write_text(
            json.dumps(report, indent=2)
        )
        
        return report
        
    def _get_daily_metrics(self):
        """Get metrics for the day."""
        con = duckdb.connect("seo_analyst.db")
        
        metrics = {}
        
        # Backlinks added today
        metrics["new_backlinks"] = con.execute("""
            SELECT COUNT(*) FROM backlinks 
            WHERE DATE(created_at) = CURRENT_DATE
        """).fetchone()[0]
        
        # Total coverage
        metrics["total_coverage"] = con.execute("""
            SELECT COUNT(DISTINCT dst_url) FROM backlinks
        """).fetchone()[0]
        
        con.close()
        return metrics
        
    def _get_top_issues(self):
        """Get top issues from recommendations."""
        issues = []
        
        rec_file = Path("outputs/recommendations.json")
        if rec_file.exists():
            recs = json.loads(rec_file.read_text())
            # Get top 5 high severity issues
            high_severity = [r for r in recs if r.get("severity") == "high"]
            issues = high_severity[:5]
            
        return issues
        
    def _get_recommendations(self):
        """Get report recommendations."""
        return [
            "Focus on high-priority pages with low coverage",
            "Review and fix anchor text distribution violations",
            "Monitor Core Web Vitals impact on rankings"
        ]

report_generator = ReportGenerator()
'''
        
        report_path.write_text(report_code)
        self.components.append("reporting")
        
    def _create_cli_tools(self):
        """Create CLI management tools."""
        cli_path = Path("cli.py")
        
        cli_code = '''
#!/usr/bin/env python3
"""
SEO Analyst CLI - Management commands
"""
import click
import json
from pathlib import Path
from monitoring.health import health_checker
from monitoring.reports import report_generator
from monitoring.alerts import alert_manager

@click.group()
def cli():
    """SEO Analyst management CLI."""
    pass

@cli.command()
def status():
    """Check system status."""
    health = health_checker.check_all()
    
    click.echo(f"System Status: {health['overall']}")
    click.echo(f"Database: {health['database']['status']}")
    click.echo(f"Memory: {health['memory']['used_percent']:.1f}% used")
    click.echo(f"Disk: {health['disk']['used_percent']:.1f}% used")
    
@cli.command()
@click.option('--format', default='json', help='Output format (json/text)')
def report(format):
    """Generate daily report."""
    report = report_generator.generate_daily_report()
    
    if format == 'json':
        click.echo(json.dumps(report, indent=2))
    else:
        click.echo(f"Daily Report - {report['date']}")
        click.echo("=" * 50)
        for key, value in report['metrics'].items():
            click.echo(f"{key}: {value}")
            
@cli.command()
def alerts():
    """Show active alerts."""
    if alert_manager.alerts:
        for alert in alert_manager.alerts[-10:]:
            click.echo(f"[{alert['severity']}] {alert['message']} - {alert['timestamp']}")
    else:
        click.echo("No active alerts")
        
@cli.command()
@click.argument('file')
@click.argument('customer')
def import_data(file, customer):
    """Import data file."""
    from ingest.adapters.ahrefs_backlinks import AhrefsBacklinksAdapter
    
    adapter = AhrefsBacklinksAdapter()
    stats = adapter.process_file(file, customer)
    click.echo(f"Imported {stats['inserted_rows']} rows")

if __name__ == "__main__":
    cli()
'''
        
        cli_path.write_text(cli_code)
        self.components.append("cli_tools")
        
    def _save_state(self):
        """Save build state."""
        state = {
            "components_built": self.components,
            "timestamp": datetime.now().isoformat()
        }
        Path(".monitor_state.json").write_text(
            json.dumps(state, indent=2)
        )
        
        print(f"Built {len(self.components)} monitoring components")

if __name__ == "__main__":
    builder = MonitorBuilder()
    builder.build_all()