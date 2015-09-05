#extension GL_OES_standard_derivatives : enable
precision mediump float;

varying float bump;
varying vec4 fPos;
varying vec3 fNorm;
varying vec3 fTangent;
varying vec3 fBiTangent;

/* texture */
varying vec2 fTexCoord;
uniform int u_fbumpEnabled;
uniform sampler2D u_bump;
uniform sampler2D u_texture;

/* light uniforms */
uniform int u_pointLightOn;
uniform vec4 u_ambientLight;
uniform vec4 u_pointLightSpecular;
uniform vec4 u_pointLightDiffuse;
uniform vec4 u_pointLightPos;

void main()
{
    vec4 normal      = vec4(fNorm, 0.0);
    vec4 texDiffuse  = texture2D(u_texture, fTexCoord);
    vec4 finalColor  = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 lightWeight = vec4(0.0, 0.0, 0.0, 0.0);

#ifdef GL_OES_standard_derivatives
    if (u_fbumpEnabled != 0) {
        // Differentiate the position vector
        vec3 dPositiondx = dFdx(normalize(fPos).xyz);
        vec3 dPositiondy = dFdy(normalize(fPos).xyz);
        float dDepthdx = dFdx(bump);
        float dDepthdy = dFdy(bump);
        dPositiondx -= 10.0 * dDepthdx * fNorm;
        dPositiondy -= 10.0 * dDepthdy * fNorm;
        // The normal is the cross product of the differentials
        normal = vec4(normalize(cross(dPositiondx, dPositiondy)), 0.0);
    }
#endif

    if (u_pointLightOn != 0) {
        vec4 lightDirection = normalize(u_pointLightPos - fPos);
        float diffuse = max(dot(normal, lightDirection), 0.0);
        finalColor = clamp(diffuse * u_pointLightDiffuse + u_ambientLight, 0.0, 1.0) * texDiffuse;
    } else {
        finalColor = texDiffuse;
    }
    gl_FragColor = finalColor;
}