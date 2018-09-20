import { ShaderSource } from "../../Utils/Shader";

export const plainColorShader: ShaderSource = {
    vertex: `
    in vec4 position;
    
    void main() {
        gl_Position = position;
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