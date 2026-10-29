import { describe, expect, it } from "bun:test";
import { systemStatusService } from "../../src/data/services/system-status.service.ts";

describe("SystemStatusService Unit Tests", () => {
	it("should return valid system status payload with human-readable numbers and container breakdown", async () => {
		const status = await systemStatusService.getSystemStatus();

		expect(status).toBeDefined();
		expect(typeof status.timestamp).toBe("string");
		expect(["prima", "normal", "warning", "critical"]).toContain(status.overallStatus);
		expect(["Prima", "Normal", "Waspada", "Kritis"]).toContain(status.overallStatusLabel);

		// Server Hardware info
		expect(status.server).toBeDefined();
		expect(status.server.memory.totalBytes).toBeGreaterThan(0);
		expect(status.server.memory.usedBytes).toBeGreaterThanOrEqual(0);
		expect(status.server.memory.totalFormatted).toMatch(/GB|MB/);
		expect(status.server.memory.usedFormatted).toMatch(/GB|MB/);
		expect(status.server.memory.usedPercent).toBeGreaterThanOrEqual(0);
		expect(status.server.memory.usedPercent).toBeLessThanOrEqual(100);
		expect(["prima", "normal", "warning", "critical"]).toContain(
			status.server.memory.statusLevel,
		);

		// CPU info
		expect(status.server.cpu.cores).toBeGreaterThan(0);
		expect(["Ringan", "Sedang", "Tinggi"]).toContain(
			status.server.cpu.loadStatus,
		);

		// Host Uptime
		expect(status.server.uptimeSeconds).toBeGreaterThan(0);
		expect(typeof status.server.uptimeFormatted).toBe("string");

		// App Service Info
		expect(status.app).toBeDefined();
		expect(status.app.name).toBe("Layanan Aplikasi Kos");
		expect(status.app.memoryUsedBytes).toBeGreaterThan(0);
		expect(status.app.memoryUsedFormatted).toMatch(/MB|GB|KB/);
		expect(typeof status.app.isContainer).toBe("boolean");
		expect(typeof status.app.description).toBe("string");

		// Database Info
		expect(status.database).toBeDefined();
		expect(["connected", "disconnected"]).toContain(status.database.status);
		expect(typeof status.database.sizeFormatted).toBe("string");
		expect(typeof status.database.sharedBuffersFormatted).toBe("string");
		expect(status.database.activeConnections).toBeGreaterThanOrEqual(0);

		// Container Breakdown Info
		expect(status.containers).toBeDefined();
		expect(typeof status.containers.detected).toBe("boolean");
		expect(typeof status.containers.summary).toBe("string");
		expect(status.containers.items.length).toBeGreaterThanOrEqual(2);

		const appContainer = status.containers.items.find(
			(i) => i.role === "app",
		);
		expect(appContainer).toBeDefined();
		expect(appContainer?.name).toBe("Layanan Aplikasi Web");
		expect(appContainer?.memoryLimitFormatted).toContain("512 MB");

		const dbContainer = status.containers.items.find(
			(i) => i.role === "database",
		);
		expect(dbContainer).toBeDefined();
		expect(dbContainer?.name).toBe("Layanan Basis Data");
		expect(dbContainer?.memoryLimitFormatted).toContain("256 MB");

		// Recommendations
		expect(status.recommendation).toBeDefined();
		expect(typeof status.recommendation.headline).toBe("string");
		expect(typeof status.recommendation.description).toBe("string");
		expect(typeof status.recommendation.actionRequired).toBe("boolean");
	});
});
