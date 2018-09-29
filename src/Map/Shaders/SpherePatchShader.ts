import { ShaderSource } from "../../Utils/Shader";
import { getPatchPosition, getLevelColor, getFaceNormal } from "../../Utils/GLSLUtils/GLSLPatchUtils";

export const spherePatchShader: ShaderSource = {
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

uniform vec3 cam_pos;
uniform float morph_range;
uniform float distanceLUT[32];
uniform bool points;

out vec3 frag_pos;
flat out int v_level;
out vec2 uv;

${getPatchPosition()}

void main() {
    v_level = int(level);

    vec3 tri_pos = getPatchPosition(A, R, S, pos, morph, cam_pos, v_level, morph_range);

    tri_pos = normalize(tri_pos);
    
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

out vec4 frag_color;

${getFaceNormal()}

${getLevelColor()}


void main() {

    vec3 color = getLevelColor(v_level);

    frag_color = vec4(color, 1.0);
}
`
}