import { ShaderSource } from "../../Utils/Shader";

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
    
    vec3 getTerrainColor(float n) {

        if (n < 0.5f) {
            n = 0.5f;
            //return vec3(0.0, 0.5, 0.5);
            return vec3(0.302f, 0.388f, 0.714f); //water
        } else if (n < 0.7f){
            return mix(vec3(0.239f, 0.614f, 0.214f), vec3(0.686f, 0.671f, 0.412f), smoothstep(0.52f, 0.7f, n)); //land
        } else {
            return mix(vec3(0.686f, 0.671f, 0.412f), vec3(0.949f, 0.949f, 0.949f), smoothstep(0.7f, 1.0f, n)); //mountains
        }
    }

    void main() {
        vec3 color = getTerrainColor(texture(height_map, v_texcoord).r);
        frag_color = vec4(color, 1.0);
    }`
};