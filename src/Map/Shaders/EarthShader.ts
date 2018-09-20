import { ShaderSource } from "../../Utils/Shader";

export const earthShader: ShaderSource = {
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

uniform sampler2D height_map;
uniform sampler2D normal_map;

uniform vec3 cam_pos;
uniform float morph_range;
uniform float distanceLUT[32];
uniform bool points;

out vec3 frag_pos;
flat out int v_level;
out vec2 uv;

float getMorphFactor(float dist, int level) {
    float low = distanceLUT[level - 1];
    float high = distanceLUT[level];
    
    float a = (dist - low) / (high - low);

    return 1.0 - clamp(a / morph_range, 0.0, 1.0);
}

float getHeight(vec3 pos) {
    uv = vec2(atan(pos.z, pos.x), acos(pos.y)) / vec2(6.28318530718, 3.14159265359);
    return texture(height_map, uv).r;
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

void main() {
    v_level = int(level);

    vec3 tri_pos = A + R * pos.x + S * pos.y;
    
    float dist = distance(cam_pos, tri_pos);
    float factor = getMorphFactor(dist, v_level);

    tri_pos += factor * (R * morph.x + S * morph.y);
    tri_pos = mapToUnitSphere(tri_pos);

    float h = getHeight(tri_pos);
    tri_pos += tri_pos * pow(h, 2.5f) * (400.0f / 6371.0f);
    
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
flat in int v_level;
in vec2 uv;

uniform bool points;
uniform vec3 light_dir;
uniform sampler2D height_map;
//uniform sampler2D color_map;
uniform sampler2D normal_map;

uniform mat4 model;

out vec4 frag_color;

vec3 getFaceNormal() {
    vec3 fdx = vec3(dFdx(frag_pos.x), dFdx(frag_pos.y), dFdx(frag_pos.z));
    vec3 fdy = vec3(dFdy(frag_pos.x), dFdy(frag_pos.y), dFdy(frag_pos.z));
    vec3 normal = normalize(cross(fdx, fdy));
    return normal;
}

vec3 getNormal() {
    #ifdef SMOOTH_SHADING
        return normalize(texture(normal_map, uv).rgb * 2.0 - 1.0);
        // return (model * vec4(normalize(texture(normal_map, uv).rgb), 0.0)).xyz;
        // return normalize(frag_pos);
    #endif

    return getFaceNormal();
}

vec3 getLighting() {

    vec3 color = vec3(0.0);

    color = vec3(0.0);
    vec3 normal = getNormal();

    // point light :
    // vec3 light_dir = normalize(light_pos - frag_pos);

    color += clamp(dot(light_dir, normal), 0.0, 1.0);

    return color;
}

float edgeFactor(in vec3 vBC) {
    vec3 d = fwidth(vBC);
    vec3 a3 = smoothstep(vec3(0.0), d * 1.5, vBC);
    return min(min(a3.x, a3.y), a3.z);
}

vec3 getLevelColor(const int level) {
    if (level == 9) {
        return vec3(1.0);
    } if (level == 8) {
        return vec3(0, 0.5, 0.5);
    } else if (level == 7) {
        return vec3(1.0, 0.0, 0.0);
    } else if (level == 6) {
        return vec3(0.0, 1.0, 0.0);
    } else if (level == 5) {
        return vec3(0.541, 0.169, 0.886);
    } else if (level == 4) {
        return vec3(1.0, 1.0, 0.0);
    } else if (level == 3) {
        return vec3(0.0, 1.0, 1.0);
    } else if (level == 2) {
        return vec3(1.0, 0.0, 1.0);
    } else if (level == 1) {
        return vec3(1.0);
    } else if (level == 0) {
        return vec3(1.0);
    }

    return vec3(1.0, 0.0, 1.0);
}

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

    vec3 color;
    
    if (points) {
        color = getLevelColor(v_level);
    } else {
        vec3 terrain_color = getTerrainColor(texture(height_map, uv).r);
        //vec3 terrain_color = texture(color_map, uv).rgb;
        //color = texture(normal_map, uv).rgb;
        color = getLighting() * terrain_color;
        //color = texture(height_map, uv).rgb;
    }

    frag_color = vec4(color, 1.0);
}
`
}