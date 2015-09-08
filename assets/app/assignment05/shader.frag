precision mediump float;

varying float bump;
varying vec4 fPos;
varying vec3 fNorm;
varying vec3 fTangent;
varying vec3 fBiTangent;

/* texture */
varying vec2 fTexCoord;
uniform int u_ftextureType;
uniform float u_fcheckerSize;
uniform sampler2D u_normal;
uniform sampler2D u_texture;
uniform vec4 u_checkerColor_1;
uniform vec4 u_checkerColor_2;

/* light uniforms */
uniform int u_pointLightOn;
uniform vec4 u_ambientLight;
uniform vec4 u_pointLightSpecular;
uniform vec4 u_pointLightDiffuse;
uniform vec4 u_pointLightPos;

vec4 createCheckerBoard(vec2 uv) {
    float fmodResult = mod(floor(u_fcheckerSize * uv.x) + floor(u_fcheckerSize * uv.y), 2.0);
    if (fmodResult < 1.0) {
        return u_checkerColor_1;
    } else {
        return u_checkerColor_2;
    }
}

void main()
{
    vec4 normal      = vec4(fNorm, 0.0);
    vec4 texDiffuse  = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 finalColor  = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 lightWeight = vec4(0.0, 0.0, 0.0, 0.0);

    if (u_ftextureType != 0) {
        texDiffuse = texture2D(u_texture, fTexCoord);
        vec4 map = 2.0 * texture2D(u_normal, fTexCoord) - 1.0;
        vec3 t = normalize(cross(fNorm, vec3(0.0, 1.0, 0.0)));
        vec3 b = normalize(cross(fNorm, t));
        normal = vec4(normalize(map.r * t + map.g * b + map.b * fNorm), 0.0);
    } else {
        texDiffuse = createCheckerBoard(fTexCoord);
    }

    if (u_pointLightOn != 0) {
        vec4 lightDirection = normalize(u_pointLightPos - fPos);
        float diffuse = max(dot(normal, lightDirection), 0.0);
        finalColor = clamp(diffuse * u_pointLightDiffuse + u_ambientLight, 0.0, 1.0) * texDiffuse;
    } else {
        finalColor = texDiffuse;
    }
    gl_FragColor = finalColor;
}