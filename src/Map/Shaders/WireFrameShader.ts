import { ShaderSource } from "../../Utils/Shader";

export const wireFrameShader: ShaderSource = {
    vertex: `#version 300 es
    in vec3 position;

    uniform mat4 model_view_proj;
	
	void main() {
		gl_Position = model_view_proj * vec4(position, 1.0f);
	}
    `,

    fragment: `#version 300 es
    precision mediump float;

    uniform vec3 color;

    out vec4 frag_color;
    
    void main() {
        frag_color = vec4(color, 1.0);
    }`
};