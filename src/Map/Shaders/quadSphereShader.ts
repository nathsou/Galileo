import { ShaderSource } from "../../Utils/Shader";

export const quadSphereShader: ShaderSource = {
    vertex: `
precision mediump float;

in vec3 position;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

uniform vec3 cam_pos;
uniform bool points;

out vec3 frag_pos;

void main() {

    vec3 pos = normalize(position);

    frag_pos = (model * vec4(pos, 1.0)).xyz;

    gl_Position = projection * view * model * vec4(pos, 1.0);
    if (points) {
        gl_PointSize = 2.0f;
    }
}
`,

    fragment: `
precision mediump float;

uniform bool points;
uniform vec3 light_dir;

in vec3 frag_pos;

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
    color += clamp(dot(light_dir, normal), 0.0, 1.0);

    return color;
}

void main() {

    vec3 color = vec3(0.0, 0.5, 0.5);

    color *= getLighting();

    frag_color = vec4(color, 1.0);
}
`
}