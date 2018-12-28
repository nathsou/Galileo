import { getFaceNormal, getLevelColor, getPatchPosition } from "../../Utils/GLSLUtils/GLSLPatchUtils";
import { getTerrainColor } from "../../Utils/GLSLUtils/GLSLTextureUtils";
import { ShaderSource } from "../../Utils/Shader";

export const planetShader: ShaderSource = {
    vertex: `
precision mediump float;

in vec2 pos;
in vec2 morph;

in float level;
in vec3 A;
in vec3 R;
in vec3 S;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

#ifdef HEIGHT_MAP
    uniform sampler2D height_map;
#endif

uniform vec3 cam_pos;
uniform float morph_range;
uniform float distanceLUT[15];
uniform bool points;

out vec3 frag_pos;
flat out int v_level;
out vec3 v_cam_pos;

float getHeight(vec3 pos) {
    #ifdef HEIGHT_MAP
        vec2 uv = vec2(atan(pos.z, pos.x), acos(pos.y)) / vec2(6.28318530718f, 3.14159265359f);
        float h = texture(height_map, uv).r;
        
        if (h <= 0.5f) {
            h = 0.5f;
        }

        return h * (MAX_HEIGHT / RADIUS);
    #endif

    return 0.0f;
}

// http://mathproofs.blogspot.com/2005/07/mapping-cube-to-sphere.html
vec3 mapToUnitSphere(vec3 u) {
    
    #ifdef QUAD_SPHERE
        float x2 = pow(u.x, 2.0f);
        float y2 = pow(u.y, 2.0f);
        float z2 = pow(u.z, 2.0f);

        return vec3(
            u.x * sqrt(1.0f - (y2 * 0.5f) - (z2 * 0.5f) + ((y2 * z2) / 3.0f)),
            u.y * sqrt(1.0f - (z2 * 0.5f) - (x2 * 0.5f) + ((z2 * x2) / 3.0f)),
            u.z * sqrt(1.0f - (x2 * 0.5f) - (y2 * 0.5f) + ((x2 * y2) / 3.0f))
        );
    #else
        return normalize(u);
    #endif
}

${getPatchPosition()}

void main() {
    v_level = int(level);
    v_cam_pos = cam_pos;

    vec3 tri_pos = getPatchPosition(A, R, S, pos, morph, cam_pos, v_level, morph_range);
    
    vec3 N = mapToUnitSphere(tri_pos);
    tri_pos = N * (1.0 + getHeight(N));

    frag_pos = (model * vec4(tri_pos, 0.0)).xyz;

    gl_Position = projection * view * model * vec4(tri_pos, 1.0);

    if (points) {
        gl_PointSize = 2.0f;
    }
}
`,

    fragment: `
precision mediump float;

in vec3 frag_pos;
in vec3 v_cam_pos;
flat in int v_level;

uniform bool points;
uniform vec3 light_pos;

#ifdef HEIGHT_MAP
    uniform sampler2D height_map;
    uniform bool show_height_map;
#endif

#ifdef SMOOTH_SHADING
    uniform sampler2D normal_map;
    uniform bool show_normal_map;
#endif

#ifdef COLOR_MAP
    uniform sampler2D color_map;
#endif

uniform float seed;

uniform mat4 model;

out vec4 frag_color;

#ifdef FLAT_SHADING
    ${getFaceNormal()}
#endif

vec3 getNormal(const vec2 uv) {
    #ifdef SMOOTH_SHADING
        vec3 N = normalize(texture(normal_map, uv).rgb * 2.0f - 1.0f);
        vec3 norm = normalize(frag_pos);
        vec3 up = vec3(0, 1, 0) - norm;
        vec3 T = normalize(cross(norm, up));
        vec3 B = normalize(cross(norm, T));
        mat3 TBN = mat3(T, B, norm);
        return normalize(TBN * normalize(N));
    #else // flat shading
        return getFaceNormal(frag_pos);
    #endif
}

vec3 getLighting(const vec2 uv) {

    float intensity = 0.0f;

    vec3 normal = getNormal(uv);

    // point light :
    vec3 light_dir = normalize(light_pos - normalize(frag_pos));

    float diffuse = clamp(dot(light_dir, normal), 0.0f, 1.0f);
    intensity += diffuse;

    #ifdef SPECULAR
        vec3 view_dir = normalize(v_cam_pos - frag_pos);
        vec3 reflect_dir = reflect(light_dir, normal);

        float spec_intensity = 0.0f;

        if (texture(height_map, uv).r == 0.0f) {
            spec_intensity = 0.5f;
        }

        float specular = pow(max(dot(view_dir, reflect_dir), 0.0f), 128.0f) * spec_intensity;
        intensity += specular;
    #endif

    return vec3(intensity);
}

${getLevelColor()}

#ifndef COLOR_MAP
    ${getTerrainColor()}
#endif

void main() {

    if (points) {
        frag_color = vec4(getLevelColor(v_level), 1.0);
        return;
    }

    vec3 N = normalize(frag_pos);
    vec2 uv = vec2(atan(N.z, N.x), acos(N.y)) / vec2(6.28318530718f, 3.14159265359f);
    vec3 color;

    #ifdef HEIGHT_MAP
        if (show_height_map) {
            color = texture(height_map, uv).rgb;
        } 
        #ifdef SMOOTH_SHADING
            else if (show_normal_map) {
                color = texture(normal_map, uv).rgb;
            } 
        #endif
            else {
                vec3 terrain_color;

                #ifdef COLOR_MAP
                    terrain_color = texture(color_map, uv).rgb;
                #else
                    #ifdef HEIGHT_MAP
                        terrain_color = getTerrainColor(texture(height_map, uv).r);
                    #else
                        terrain_color = vec3(1.0);
                    #endif
                #endif

                color = terrain_color;
            }
    #else
        color = getLevelColor(v_level);
    #endif

    frag_color = vec4(color * getLighting(uv), 1.0);
}
`
}