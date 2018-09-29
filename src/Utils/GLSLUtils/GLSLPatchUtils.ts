import { GLSLFunction, preprocessor_isolate } from "./GLSLUtils";

export const getMorphFactor: GLSLFunction = (
    name = 'getMorphFactor',
    dist_LUT_name = 'distanceLUT'
): string => {
    return preprocessor_isolate(name, `
        float ${name}(const float dist, const int level, const float morph_range) {
            float low = ${dist_LUT_name}[level - 1];
            float high = ${dist_LUT_name}[level];
            
            float a = (dist - low) / (high - low);
        
            return 1.0 - clamp(a / morph_range, 0.0, 1.0);
        }
    `);
};

export const getPatchPosition: GLSLFunction = (name = 'getPatchPosition'): string => {
    return preprocessor_isolate(name, `

        ${getMorphFactor()}

        vec3 ${name}(
            const vec3 A, 
            const vec3 R, 
            const vec3 S, 
            const vec2 pos,
            const vec2 morph,
            const vec3 cam_pos,
            const int level,
            const float morph_range
            ){
                vec3 tri_pos = A + R * pos.x + S * pos.y;
                float dist = distance(cam_pos, tri_pos);
                float factor = getMorphFactor(dist, v_level, morph_range);
                tri_pos += factor * (R * morph.x + S * morph.y);
        
                return tri_pos;
            } 
        `);
};

export const getLevelColor: GLSLFunction = (name = 'getLevelColor'): string => {
    return preprocessor_isolate(name, `
        vec3 ${name}(const int level) {
            if (level == 9) {
                return vec3(1.0);
            } if (level == 8) {
                return vec3(0, 0.5, 0.5);
            } else if (level == 7) {
                return vec3(1.0, 0.0, 0.0);
            } else if (level == 6) {
                return vec3(0.0, 1.0, 0.0);
            } else if (level == 5) {
                return vec3(1.0, 0.0, 1.0);
            } else if (level == 4) {
                return vec3(0.0, 1.0, 1.0);
            } else if (level == 3) {
                return vec3(1.0, 1.0, 0.0);
            } else if (level == 2) {
                return vec3(0.0, 0.5, 0.5);
            } else if (level == 1) {
                return vec3(1.0, 0.0, 0.5);
            } else if (level == 0) {
                return vec3(1.0);
            }
        
            return vec3(1.0, 0.0, 1.0);
        }
    `);
};

export const getFaceNormal: GLSLFunction = (name = 'getFaceNormal'): string => {
    return preprocessor_isolate(name, `
        vec3 ${name}(const vec3 frag_pos) {
            vec3 fdx = vec3(dFdx(frag_pos.x), dFdx(frag_pos.y), dFdx(frag_pos.z));
            vec3 fdy = vec3(dFdy(frag_pos.x), dFdy(frag_pos.y), dFdy(frag_pos.z));
            vec3 normal = normalize(cross(fdx, fdy));
            return normal;
        }
    `);
};

export const spherize: GLSLFunction = (name = 'spherize'): string => {
    return preprocessor_isolate(name, `
        vec3 ${name}(vec2 st) {
            float theta = st.y * 3.14159265359;
            float phi = st.x * 6.28318530718;
            float cos_theta = cos(theta);
            float cos_phi = cos(phi);
            float sin_theta = sin(theta);
            float sin_phi = sin(phi);
            float x = sin_theta * cos_phi;
            float y = sin_theta * sin_phi;
            float z = cos_theta;
        
            return vec3(x, y, z);
        }
    `);
};