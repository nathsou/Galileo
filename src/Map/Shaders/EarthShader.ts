
export const vertex_shader_source = `#version 300 es

in vec3 a_position;

uniform mat4 model_view;
uniform mat4 projection;
uniform bool points;

out vec3 v_view_position;

void main() {
  vec4 model_view_pos = model_view * vec4(a_position, 1.0);
  v_view_position = -model_view_pos.xyz;
  if (points) {
    gl_PointSize = 5.0f;
  }
  gl_Position = projection * model_view_pos;
}
`;

export const fragment_shader_source = `#version 300 es

precision mediump float;
 
uniform vec3 light_dir;
uniform mat4 world_inverse_transpose;
uniform bool points;

in vec3 v_view_position;

out vec4 frag_color;

vec3 getFaceNormal(const in vec3 view_pos) {
    vec3 fdx = vec3(dFdx(view_pos.x), dFdx(view_pos.y), dFdx(view_pos.z));
    vec3 fdy = vec3(dFdy(view_pos.x), dFdy(view_pos.y), dFdy(view_pos.z));
    vec3 normal = normalize(cross(fdx, fdy));
    return normal; //mat3(world_inverse_transpose) * normal;
}

vec3 getLighting(const in vec3 view_pos) {

    vec3 color = vec3(0.0);

    color = vec3(0.0);
    vec3 normal = getFaceNormal(view_pos);

    color += clamp(dot(light_dir, normal), 0.0, 1.0);

    return color;
}

void main() {

    if (points) {
        frag_color = vec4(0.0, 1.0, 0.0, 1.0);
        return;
    }

    vec3 color = getLighting(v_view_position) * vec3(0.0, 0.3, 0.7);
    frag_color = vec4(color, 1.0);
}
`;