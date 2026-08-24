import { QueryClient } from "@tanstack/react-query";

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 30, // 30 detik: Navigasi bolak-balik dalam rentang ini 100% instan dari cache
				gcTime: 1000 * 60 * 5, // 5 menit: Simpan di memory sebelum garbage collection
				refetchOnWindowFocus: false, // Mencegah refetch agresif saat klik tab
				retry: 1,
			},
		},
	});

	return {
		queryClient,
	};
}

export default function TanstackQueryProvider() {}
