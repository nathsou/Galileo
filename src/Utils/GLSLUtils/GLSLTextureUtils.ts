import { preprocessor_isolate, glslify_vec } from "./GLSLUtils";
import { color, hex2vec3 } from "../ColorUtils";

export function getTerrainColor(
    name = 'getTerrainColor',
    colors = {
        low_water_color: hex2vec3(0x536fac), // vec3(28.0f, 58.0f, 106.0f) / vec3(255.0f)
        high_water_color: hex2vec3(0x182a65), // vec3(0.302f, 0.388f, 0.714f)
        low_land_color: hex2vec3(0x8c8d76), // vec3(0.239f, 0.614f, 0.214f)
        high_land_color: hex2vec3(0x2f5136), // vec3(0.686f, 0.671f, 0.412f)
        low_mountain_color: hex2vec3(0xded9c7), // vec3(0.686f, 0.671f, 0.412f)
        high_mountain_color: hex2vec3(0xe3e5e5),
        snow_color: hex2vec3(0xe3e5e5)
    },
    heights = {
        water: 0.5,
        land: 0.7,
        mountains: 0.9
    }
): string {
    return preprocessor_isolate(name, `
        vec3 ${name}(float n) {
            if (n < ${heights.water}) {
                return mix(
                    ${glslify_vec(colors.low_water_color)},
                    ${glslify_vec(colors.high_water_color)},
                    smoothstep(0.0f, ${heights.water}, n)
                );
            } else if (n < ${heights.land}) { // land
                return mix(
                    ${glslify_vec(colors.high_land_color)},
                    ${glslify_vec(colors.low_land_color)},
                    smoothstep(${heights.water}, ${heights.land}, n)
                );
            } else if (n < ${heights.mountains}) { // mountain
                return mix(
                    ${glslify_vec(colors.low_mountain_color)},
                    ${glslify_vec(colors.high_mountain_color)},
                    smoothstep(${heights.land}, ${heights.mountains}, n)
                );
            } else {
                return mix(
                    ${glslify_vec(colors.high_mountain_color)},
                    ${glslify_vec(colors.snow_color)},
                    smoothstep(${heights.mountains}, 1.0f, n)
                );
            }
        }
`);
};