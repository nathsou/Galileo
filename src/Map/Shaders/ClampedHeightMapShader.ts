import { simplex_noise4D } from "../../Utils/GLSLUtils/GLSLNoiseUtils";
import { spherize } from "../../Utils/GLSLUtils/GLSLPatchUtils";
import { ShaderSource } from "../../Utils/Shader";

export const clampedHeightMapShader: ShaderSource = {
    vertex: `
    in vec2 position;
    out vec2 a_pos;
    
    void main() {
        a_pos = position;
        gl_Position = vec4(position, 0.0, 1.0);
    }`,

    fragment: `
    precision mediump float;

    in vec2 a_pos;

    uniform float clamp_height;

    out vec4 color;
    
    ${simplex_noise4D('snoise')}
    
    float fbm(in vec3 st) {
         // Initial values
         float value = 0.0f;
         float amplitude = 0.5f;
         // Loop of octaves
         for (int i = 0; i < OCTAVES; i++) {
             value += amplitude * snoise(vec4(st, SEED));
             st *= 2.0f;
             amplitude *= 0.5f;
         }
    
     return value;
    }
    
    ${spherize()}

    void main() {
    
        vec2 st = a_pos * 0.5f + 0.5f;
    
        float h = fbm(spherize(st) * FREQUENCY) * 0.5f + 0.5f;

        if (h < clamp_height) {
            h = 0.0f;
        } else {
            // map [clamp_height, 1.0] to [0.0, 1.0]
            h = (h - clamp_height) * (1.0 / (1.0 - clamp_height));
        }

        color = vec4(vec3(h), 1.0f);
    }
    `
};