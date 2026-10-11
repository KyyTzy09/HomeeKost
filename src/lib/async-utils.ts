/**
 * Utility untuk jeda tunggu asinkron dengan variasi acak (Random Jitter).
 * Berguna untuk pacing pengiriman pesan WhatsApp agar terdistribusi alami
 * dan meminimalisir risiko deteksi bot / pembatasan rate limit (ban).
 *
 * @param baseMs Waktu jeda dasar dalam milidetik (default: 800ms)
 * @param jitterMs Rentang variasi acak maksimum yang ditambahkan (default: 400ms)
 */
export async function sleepWithJitter(
	baseMs: number = 800,
	jitterMs: number = 400,
): Promise<void> {
	const delay = baseMs + Math.floor(Math.random() * jitterMs);
	return new Promise((resolve) => setTimeout(resolve, delay));
}
