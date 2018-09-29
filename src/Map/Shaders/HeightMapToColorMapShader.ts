import { ShaderSource } from "../../Utils/Shader";
import { getTerrainColor } from "../../Utils/GLSLUtils/GLSLTextureUtils";

export const heightMapToColorMapShader: ShaderSource = {
    vertex: `
    in vec2 position;
    out vec2 v_texcoord;
    
    void main() {
        v_texcoord = position * 0.5f + 0.5f;
        gl_Position = vec4(position, 0.0, 1.0);
    }
    `,

    fragment: `
    precision mediump float;

    in vec2 v_texcoord;

    uniform sampler2D height_map;

    out vec4 frag_color;
    
    ${getTerrainColor()}

    void main() {
        vec3 color = getTerrainColor(texture(height_map, v_texcoord).r);
        frag_color = vec4(color, 1.0);
    }`
};