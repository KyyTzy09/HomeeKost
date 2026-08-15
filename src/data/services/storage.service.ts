import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export interface StorageUploadOptions {
	folder?: string;
	filename?: string;
	mimeType?: string;
}

export interface StorageUploadResult {
	url: string;
	publicId: string;
	format?: string;
	bytes?: number;
}

export class StorageService {
	private readonly cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
	private readonly apiKey = process.env.CLOUDINARY_API_KEY || "";
	private readonly apiSecret = process.env.CLOUDINARY_API_SECRET || "";
	private readonly uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "";
	private readonly driver = (
		process.env.STORAGE_DRIVER || "cloudinary"
	).toLowerCase();

	private isCloudinaryConfigured(): boolean {
		return Boolean(
			this.cloudName && ((this.apiKey && this.apiSecret) || this.uploadPreset),
		);
	}

	/**
	 * Upload image (PNG, JPG, WebP, etc.) to Cloudinary or Local Storage
	 */
	async uploadImage(
		base64OrDataUrl: string,
		options: StorageUploadOptions = {},
	): Promise<StorageUploadResult> {
		const folder = options.folder || "homeekost/properties";

		if (this.driver === "cloudinary" && this.isCloudinaryConfigured()) {
			return this.uploadToCloudinary(base64OrDataUrl, {
				...options,
				folder,
				resourceType: "image",
			});
		}

		// Fallback to local file storage
		return this.uploadToLocalStorage(base64OrDataUrl, {
			...options,
			folder,
			resourceType: "image",
		});
	}

	/**
	 * Upload document (PDF Invoice, Financial Report) to Cloudinary or Local Storage
	 */
	async uploadDocument(
		base64OrDataUrl: string,
		options: StorageUploadOptions = {},
	): Promise<StorageUploadResult> {
		const folder = options.folder || "homeekost/documents";

		if (this.driver === "cloudinary" && this.isCloudinaryConfigured()) {
			return this.uploadToCloudinary(base64OrDataUrl, {
				...options,
				folder,
				resourceType: "raw",
			});
		}

		// Fallback to local file storage
		return this.uploadToLocalStorage(base64OrDataUrl, {
			...options,
			folder,
			resourceType: "raw",
		});
	}

	/**
	 * Upload directly to Cloudinary REST API
	 */
	private async uploadToCloudinary(
		dataUrl: string,
		options: StorageUploadOptions & { resourceType: "image" | "raw" | "auto" },
	): Promise<StorageUploadResult> {
		const timestamp = Math.round(Date.now() / 1000);
		const folder = options.folder || "homeekost";
		const resourceType = options.resourceType || "image";

		const formData = new FormData();
		formData.append("file", dataUrl);
		formData.append("timestamp", timestamp.toString());
		formData.append("folder", folder);

		if (this.uploadPreset) {
			formData.append("upload_preset", this.uploadPreset);
		} else if (this.apiKey && this.apiSecret) {
			formData.append("api_key", this.apiKey);

			// Generate signature
			const paramsToSign: Record<string, string | number> = {
				folder,
				timestamp,
			};
			const signature = this.generateSignature(paramsToSign, this.apiSecret);
			formData.append("signature", signature);
		}

		const endpoint = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

		const response = await fetch(endpoint, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Cloudinary upload failed (${response.status}): ${errorText}`,
			);
		}

		const result = (await response.json()) as {
			secure_url: string;
			public_id: string;
			format?: string;
			bytes?: number;
		};

		return {
			url: result.secure_url,
			publicId: result.public_id,
			format: result.format,
			bytes: result.bytes,
		};
	}

	/**
	 * Local Storage fallback (stored inside public/uploads)
	 */
	private async uploadToLocalStorage(
		dataUrl: string,
		options: StorageUploadOptions & { resourceType: string },
	): Promise<StorageUploadResult> {
		const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
		let buffer: Buffer;
		let ext = "png";

		if (matches && matches.length === 3) {
			const mime = matches[1];
			ext = mime.split("/")[1] || "png";
			if (ext === "jpeg") ext = "jpg";
			buffer = Buffer.from(matches[2], "base64");
		} else {
			buffer = Buffer.from(dataUrl, "base64");
		}

		const filename = `${options.filename || `file-${Date.now()}`}.${ext}`;
		const uploadsDir = path.resolve(
			process.cwd(),
			"public",
			"uploads",
			options.folder || "general",
		);

		await fs.mkdir(uploadsDir, { recursive: true });
		const filePath = path.join(uploadsDir, filename);
		await fs.writeFile(filePath, buffer);

		const relativeUrl = `/uploads/${options.folder || "general"}/${filename}`;

		return {
			url: relativeUrl,
			publicId: filename,
			format: ext,
			bytes: buffer.length,
		};
	}

	private generateSignature(
		params: Record<string, string | number>,
		apiSecret: string,
	): string {
		const sortedKeys = Object.keys(params).sort();
		const serialized = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
		return crypto
			.createHash("sha1")
			.update(serialized + apiSecret)
			.digest("hex");
	}
}

export const storageService = new StorageService();
