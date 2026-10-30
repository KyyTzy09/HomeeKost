import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { getContext } from "./common/integrations/tanstack-query/root-provider";
import { Error500Page } from "./components/common/Error500Page.tsx";
import { NotFoundPage } from "./components/common/NotFoundPage.tsx";
import { logger } from "./lib/logger.ts";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const context = getContext();

	const router = createTanStackRouter({
		routeTree,
		context,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultErrorComponent: Error500Page,
		defaultNotFoundComponent: () => <NotFoundPage />,
	});

	setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

	// Development Navigation Logger
	if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
		router.subscribe("onResolved", ({ toLocation, fromLocation }) => {
			logger.route(toLocation.pathname, fromLocation?.pathname);
		});
	}

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
