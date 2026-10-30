import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "../components/common/NotFoundPage.tsx";

export const Route = createFileRoute("/$")({
	head: () => ({
		meta: [
			{
				title: "404 Halaman Tidak Ditemukan — HomeeKost",
			},
		],
	}),
	component: SplatNotFound,
});

function SplatNotFound() {
	const params = Route.useParams();
	const path = params._splat ? `/${params._splat}` : undefined;

	return <NotFoundPage path={path} />;
}
