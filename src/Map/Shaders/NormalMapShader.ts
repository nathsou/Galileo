import { ShaderSource } from "../../Utils/Shader";

export const normalMapShader: ShaderSource = {
    vertex: `
    in vec2 position;

    out vec2 a_pos;

    void main() {
        a_pos = position * 0.5f + 0.5f;
        gl_Position = vec4(position, 0.0, 1.0);
    }
    `,


    fragment: `
    precision mediump float;

    #define USE_SOBEL
    #define SENSITIVITY 0.9f
    
    in vec2 a_pos;
    
    out vec4 FragColor;
    
    uniform sampler2D height_map;
    
    void main() {
    
        vec2 uv = a_pos;
        vec3 n;
    
        #ifdef USE_SOBEL
            float h00 = textureOffset(height_map, uv, ivec2(-1, -1)).r;
            float h10 = textureOffset(height_map, uv, ivec2(0, -1)).r;
            float h20 = textureOffset(height_map, uv, ivec2(1, -1)).r;
            float h01 = textureOffset(height_map, uv, ivec2(-1, 0)).r;
            float h21 = textureOffset(height_map, uv, ivec2(1, 0)).r;
            float h02 = textureOffset(height_map, uv, ivec2(-1, 1)).r;
            float h12 = textureOffset(height_map, uv, ivec2(0, 1)).r;
            float h22 = textureOffset(height_map, uv, ivec2(1, 1)).r;
    
            float Gx = h00 - h20 + 2.0f * h01 - 2.0f * h21 + h02 - h22;
            float Gy = h00 + 2.0f * h10 + h20 - h02 - 2.0f * h12 - h22;
            float Gz = SENSITIVITY * sqrt(1.0f - Gx * Gx - Gy * Gy);
            n = vec3(2.0f * Gx, 2.0f * Gy, Gz);
        #else
            float h0 = texture(height_map, uv).r;
            float h1 = textureOffset(height_map, uv, ivec2(1, 0)).r;
            float h2 = textureOffset(height_map, uv, ivec2(0, 1)).r;
    
            vec3 v01 = vec3(1.0, 0.0, h1 - h0);
            vec3 v02 = vec3(0, 1, h2 - h0);
    
            n = cross(v01, v02);
            n.z *= SENSITIVITY;
        #endif
    
        n = normalize(n) * 0.5f + 0.5f;

        FragColor = vec4(n, 1.0f);
    }
    `
};