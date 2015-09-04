#extension GL_OES_standard_derivatives : enable
precision mediump float;

varying float bump;
varying vec4 fPos;
varying vec3 fNorm;
varying vec3 fTangent;
varying vec3 fBiTangent;

/* texture */
varying vec2 fTexCoord;
uniform int u_ftextureType;
uniform int u_fbumpEnabled;
uniform float u_fcheckerSize;
uniform sampler2D u_bump;
uniform sampler2D u_texture;
uniform vec4 u_checkerColor_1;
uniform vec4 u_checkerColor_2;

/* light uniforms */
const int NUM_LIGHTS = 1;
uniform vec4 u_ambientLight;
uniform vec4 u_pointLightSpecular[NUM_LIGHTS];
uniform vec4 u_pointLightDiffuse[NUM_LIGHTS];
uniform vec4 u_pointLightPos[NUM_LIGHTS];

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
    } else {
        texDiffuse = createCheckerBoard(fTexCoord);
    }
    
    if (u_fbumpEnabled != 0) {
#ifdef GL_OES_standard_derivatives
        // Differentiate the position vector
        vec3 dPositiondx = dFdx(normalize(fPos).xyz);
        vec3 dPositiondy = dFdy(normalize(fPos).xyz);
        float dDepthdx = dFdx(bump);
        float dDepthdy = dFdy(bump);
        dPositiondx -= 0.02 * dDepthdx * fNorm;
        dPositiondy -= 0.02 * dDepthdy * fNorm;
        // The normal is the cross product of the differentials
        normal = vec4(normalize(cross(dPositiondx, dPositiondy)), 0.0);
#endif
    }
    
    vec4 eyeDirection = normalize(-fPos);
    for(int i = 0; i < NUM_LIGHTS; i++) {
        vec4 lightDirection = normalize(u_pointLightPos[i] - fPos);
        float diffuse = max(dot(normal, lightDirection), 0.0);
        finalColor = (diffuse * u_pointLightDiffuse[i] + u_ambientLight) * texDiffuse;
    }
    gl_FragColor = finalColor;
}