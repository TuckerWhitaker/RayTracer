import React, { useEffect, useRef } from "react";
import "./GPUraytracer.css";

function GPUraytracer() {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const gl = canvas.getContext("webgl");

		if (gl === null) {
			alert("WebGL not supported");
			return;
		}

		Promise.all([
			fetch("./vertexShader.glsl").then((response) => response.text()),
			fetch("./fragmentShader.glsl").then((response) => response.text()),
		]).then((shaders) => {
			const [vertShaderCode, fragShaderCode] = shaders;
			const start = Date.now();
			// Create the Vertex Shader object
			var vertShader = gl.createShader(gl.VERTEX_SHADER);

			// Attach the source code to the shader object
			gl.shaderSource(vertShader, vertShaderCode);

			// Compile the shader
			gl.compileShader(vertShader);

			// Check for compilation errors
			if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
				console.error(
					"ERROR compiling vertex shader!",
					gl.getShaderInfoLog(vertShader)
				);
			}

			// Fragment Shader code

			// Create the Fragment Shader object
			var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

			// Attach the source code to the shader object
			gl.shaderSource(fragShader, fragShaderCode);

			// Compile the shader
			gl.compileShader(fragShader);

			// Check for compilation errors
			if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
				console.error(
					"ERROR compiling fragment shader!",
					gl.getShaderInfoLog(fragShader)
				);
			}

			// Create a shader program object
			var shaderProgram = gl.createProgram();

			// Attach the vertex shader to the program object
			gl.attachShader(shaderProgram, vertShader);

			// Attach the fragment shader to the program object
			gl.attachShader(shaderProgram, fragShader);

			// Link the program object to the WebGL context
			gl.linkProgram(shaderProgram);

			// Check for linking errors
			if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
				console.error(
					"ERROR linking program!",
					gl.getProgramInfoLog(shaderProgram)
				);
			}

			// Use the program object
			gl.useProgram(shaderProgram);
			// Create a buffer and put the vertices in it
			var vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
			var vertices = new Float32Array([
				-1, 1, 0, 1, -1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1,
			]);

			gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

			// Bind the buffer, i.e., let's use the buffer we've just created
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

			// Get the attribute location, enable it
			var coord = gl.getAttribLocation(shaderProgram, "coordinates");
			gl.vertexAttribPointer(
				coord,
				2,
				gl.FLOAT,
				false,
				4 * Float32Array.BYTES_PER_ELEMENT,
				0
			);
			gl.enableVertexAttribArray(coord);

			// Get the texture coordinate attribute location, enable it
			var textureCoord = gl.getAttribLocation(shaderProgram, "textureCoord");
			gl.vertexAttribPointer(
				textureCoord,
				2,
				gl.FLOAT,
				false,
				4 * Float32Array.BYTES_PER_ELEMENT,
				2 * Float32Array.BYTES_PER_ELEMENT
			);
			var u_timeLocation = gl.getUniformLocation(shaderProgram, "u_time");
			var time = (Date.now() - start) * 0.001; // convert milliseconds to seconds
			gl.uniform1f(u_timeLocation, time);

			gl.enableVertexAttribArray(textureCoord);

			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			// Draw the rectangle
			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			const end = Date.now();
			console.log(`Execution time: ${end - start} ms`);
		});
	}, []);

	return (
		<div className="GPUraytracer">
			<canvas ref={canvasRef} width={900} height={900}></canvas>
		</div>
	);
}

export default GPUraytracer;
