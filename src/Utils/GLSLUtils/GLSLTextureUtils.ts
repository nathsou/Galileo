import { GLSLFunction, preprocessor_isolate } from "./GLSLUtils";

export const getTerrainColor: GLSLFunction = (name = 'getTerrainColor'): string => {
    return preprocessor_isolate(name, `
        vec3 ${name}(float n) {
            if (n == 0.0f) {
                // return vec3(28.0f, 58.0f, 106.0f) / vec3(255.0f);
                // return vec3(0.0, 0.5, 0.5);
                return vec3(0.302f, 0.388f, 0.714f); //water
            } else if (n < 0.4f) {
                return mix(vec3(0.239f, 0.614f, 0.214f), vec3(0.686f, 0.671f, 0.412f), smoothstep(0.0f, 0.4f, n)); //land
            } else if (n < 0.7f) {
                vec3 color1 = vec3(0.686f, 0.671f, 0.412f);
                vec3 color2 = vec3(0.486f, 0.371f, 0.312f);
                return mix(color1, color2, smoothstep(0.4f, 0.7f, n));
            } else {
                return mix(vec3(0.486f, 0.371f, 0.312f), vec3(0.949f, 0.949f, 0.949f), smoothstep(0.7f, 1.0f, n)); //mountains
            }
        }
    `);
};