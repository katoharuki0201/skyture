import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { getRouter } from "./router";

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("アプリの表示先が見つかりません。");
if (!rootElement.innerHTML)
	ReactDOM.createRoot(rootElement).render(
		<RouterProvider router={getRouter()} />,
	);
