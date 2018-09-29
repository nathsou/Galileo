import { ShaderSource } from "../../Utils/Shader";

export const pointShader: ShaderSource = {
    vertex: `
    in vec3 position;

    uniform mat4 model_view_proj;
	
	void main() {
        gl_Position = model_view_proj * vec4(position, 1.0f);
        gl_PointSize = 2.0f;
	}
    `,

    fragment: `
    precision mediump float;

    uniform vec3 color;

    out vec4 frag_color;
    
    void main() {
        frag_color = vec4(color, 1.0);
    }`
};