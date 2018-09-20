import { ShaderSource } from "../../Utils/Shader";

export const textShader: ShaderSource = {
  vertex: `
    in vec4 position;
    in vec2 texcoords;
    
    uniform mat4 transfo;
    
    out vec2 v_texcoord;
    
    void main() {
      gl_Position = transfo * (position * 2.0) - 1.0;
  
      v_texcoord = texcoords;
    }
    `,

  fragment: `
    precision mediump float;
    
    uniform sampler2D u_texture;
    in vec2 v_texcoord;
    
    out vec4 outColor;
    
    void main() {

      vec4 color = texture(u_texture, v_texcoord);
      
/*       if (color.rgb == vec3(0.0)) {
        discard;
      } */

      outColor = vec4(color);
    }
    `
};