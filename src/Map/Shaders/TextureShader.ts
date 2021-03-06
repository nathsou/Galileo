import { ShaderSource } from "../../Utils/Shader";

export const textureShader: ShaderSource = {
    vertex: `
    in vec2 position;
    
    
    out vec2 uv;
    
    void main() {
        uv = tex_coords;
        gl_Position = vec4(position.x, position.y, 0.0, 1.0);
    }
    `,

    fragment: `
    precision mediump float;

    out vec4 frag_color;
    in vec2 uv;
    
    uniform sampler2D tex;
    
    void main() {
        frag_color = texture(tex, uv);
        //frag_color = vec4(0.0, 0.0, 1.0, 1.0);
    }`
};