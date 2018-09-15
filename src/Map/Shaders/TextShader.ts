import { ShaderSource } from "../../Utils/Shader";

export const textShader: ShaderSource = {
    vertex: `#version 300 es
    in vec4 position;
    in vec2 texcoord;
    
    uniform mat4 u_matrix;
    
    out vec2 v_texcoord;
    
    void main() {
      // Multiply the position by the matrix.
      gl_Position = u_matrix * position;
    
      // Pass the texcoord to the fragment shader.
      v_texcoord = texcoord;
    }
    `,

    fragment: `#version 300 es
    precision mediump float;

    // Passed in from the vertex shader.
    in vec2 v_texcoord;
    
    uniform sampler2D u_texture;
    
    out vec4 outColor;
    
    void main() {
       outColor = texture(u_texture, v_texcoord);
    }
    `
};