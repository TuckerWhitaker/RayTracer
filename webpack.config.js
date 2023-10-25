const path = require("path");

module.exports = {
	entry: "./src/index.js", // Adjust with the path to your app's entry point
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "dist"),
		publicPath: "/",
	},
	devServer: {
		static: {
			directory: path.resolve(__dirname, "dist"), // replace contentBase with static.directory
		},
		hot: true,
		historyApiFallback: true,
	},
	module: {
		rules: [
			{
				test: /\.wasm$/,
				type: "asset/resource",
				loader: "file-loader",
				options: { name: "[name].[ext]" },
			},
			{
				test: /\.worker\.js$/,
				use: { loader: "worker-loader" },
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env", "@babel/preset-react"],
					},
				},
			},
		],
	},

	externals: {
		"wasmer_wasi_js_bg.wasm": true, // This line helps bypass the error you were facing
	},
	resolve: {
		extensions: [".js", ".jsx"],
	},
};
