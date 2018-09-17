import { ShaderSource } from "../../Utils/Shader";

export const patchShader: ShaderSource = {
    vertex: `#version 300 es
precision mediump float;

in vec2 pos;
in vec2 morph;
in vec3 barycentric;

in float level;
in vec3 A;
in vec3 R;
in vec3 S;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

uniform sampler2D height_map;
//uniform sampler2D normal_map;

uniform vec3 cam_pos;
uniform float morph_range;
uniform float distanceLUT[32];
uniform float time;
uniform float radius;
uniform bool points;

out vec3 frag_pos;
flat out int v_level;
out vec3 v_barycentric;
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

void main() {
    v_barycentric = barycentric;
    v_level = int(level);

    vec3 tri_pos = A + R * pos.x + S * pos.y;
    
    float dist = distance(cam_pos, tri_pos);
    float factor = getMorphFactor(dist, v_level);

    tri_pos += factor * (R * morph.x + S * morph.y);
    tri_pos = normalize(tri_pos);

    float h = getHeight(tri_pos);
    tri_pos += tri_pos * pow(h, 2.5f) * (400.0f / 6371.0f);
    
    frag_pos = (model * vec4(tri_pos, 0.0)).xyz;

    gl_Position = projection * view * model * vec4(tri_pos, 1.0);
    if (points) {
        gl_PointSize = 2.0f;
    }
}
`,

    fragment: `#version 300 es
precision mediump float;

in vec3 frag_pos;
flat in int v_level;
in vec3 v_barycentric;
in vec2 uv;

uniform bool points;
uniform vec3 light_dir;
uniform sampler2D height_map;
//uniform sampler2D color_map;
//uniform sampler2D normal_map;

out vec4 frag_color;

vec3 getFaceNormal() {
    vec3 fdx = vec3(dFdx(frag_pos.x), dFdx(frag_pos.y), dFdx(frag_pos.z));
    vec3 fdy = vec3(dFdy(frag_pos.x), dFdy(frag_pos.y), dFdy(frag_pos.z));
    vec3 normal = normalize(cross(fdx, fdy));
    return normal;
}

vec3 getLighting() {

    vec3 color = vec3(0.0);

    color = vec3(0.0);
    vec3 normal = getFaceNormal();
    //vec3 normal = normalize(texture(normal_map, uv).rgb * 2.0 - 1.0);
    //vec3 normal = normalize(frag_pos);

    //point light :
    //vec3 light_dir = normalize(light_pos - frag_pos);

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
        //color = v_barycentric;
        //color = mix(vec3(0.0), vec3(1.0, 0.0, 1.0), edgeFactor(v_barycentric));
        vec3 terrain_color = getTerrainColor(texture(height_map, uv).r);
        //vec3 terrain_color = texture(color_map, uv).rgb;
        //color = texture(normal_map, uv).rgb;
        color = clamp(getLighting() + 0.1, 0.0, 1.0) * terrain_color;
        //color = texture(height_map, uv).rgb;
    }

    frag_color = vec4(color, 1.0);
}
`
}