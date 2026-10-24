export type HealthLevel = "normal" | "warning" | "critical";

export interface SystemMemoryInfo {
	totalFormatted: string;
	usedFormatted: string;
	freeFormatted: string;
	totalBytes: number;
	usedBytes: number;
	freeBytes: number;
	usedPercent: number;
	statusLevel: HealthLevel;
	statusLabel: string;
}

export interface SystemStorageInfo {
	totalFormatted: string;
	usedFormatted: string;
	freeFormatted: string;
	totalBytes: number;
	usedBytes: number;
	freeBytes: number;
	usedPercent: number;
	statusLevel: HealthLevel;
	statusLabel: string;
}

export interface SystemCpuInfo {
	cores: number;
	model: string;
	loadAvg1m: number;
	loadStatus: "Ringan" | "Sedang" | "Tinggi";
}

export interface SystemAppInfo {
	isContainer: boolean;
	name: string;
	memoryUsedFormatted: string;
	memoryUsedBytes: number;
	memoryPercentOfServer: number;
	uptimeFormatted: string;
	uptimeSeconds: number;
	statusLevel: HealthLevel;
	statusLabel: string;
	description: string;
}

export interface SystemDatabaseInfo {
	status: "connected" | "disconnected";
	statusLabel: string;
	statusLevel: HealthLevel;
	latencyMs: number;
	sizeFormatted: string;
	sharedBuffersFormatted: string;
	activeConnections: number;
}

export interface ContainerServiceItem {
	id: string;
	name: string;
	role: "app" | "database" | "system";
	memoryUsedFormatted: string;
	memoryLimitFormatted: string;
	memoryPercentOfLimit: number;
	statusLevel: HealthLevel;
	statusLabel: string;
	description: string;
}

export interface SystemContainerBreakdown {
	detected: boolean;
	summary: string;
	items: ContainerServiceItem[];
}

export interface SystemRecommendation {
	level: HealthLevel;
	headline: string;
	description: string;
	actionRequired: boolean;
}

export interface SystemStatusData {
	timestamp: string;
	overallStatus: HealthLevel;
	overallStatusLabel: string;
	server: {
		memory: SystemMemoryInfo;
		storage: SystemStorageInfo | null;
		cpu: SystemCpuInfo;
		uptimeFormatted: string;
		uptimeSeconds: number;
		platform: string;
	};
	app: SystemAppInfo;
	database: SystemDatabaseInfo;
	containers: SystemContainerBreakdown;
	recommendation: SystemRecommendation;
}
