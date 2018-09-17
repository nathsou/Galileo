import { ShaderSource } from "../../Utils/Shader";

export const plainColorShader: ShaderSource = {
    vertex: `#version 300 es
    in vec4 position;
    
    void main() {
        gl_Position = position;
    }
    `,

    fragment: `#version 300 es
    precision mediump float;

    uniform vec3 u_color;
    out vec4 frag_color;
    
    void main() {
        frag_color = vec4(u_color, 1.0);
    }`
};