import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import GPUraytracer from "./GPUraytracer";
import Test from "./Test";
import "./index.css";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<GPUraytracer />
	</React.StrictMode>
);
