attribute vec4 vPos;
attribute vec3 vNorm;

varying vec3 fLightWeight;

uniform int u_lightON;
uniform vec4 u_ambientLight;
uniform vec4 u_pointLightSpecular;
uniform vec4 u_pointLightDiffuse;
uniform vec4 u_pointLightPos;
uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;

void main()
{
    if (u_lightON != 0) {
    vec3 pos = -(u_mvMatrix * vPos).xyz;
    vec3 light = u_pointLightPos.xyz;
    vec3 L = normalize( light - pos );
    vec3 E = normalize( -pos );
    vec3 H = normalize( L + E );

    vec4 NN = vec4(vNorm, 0);

    // Transform vertex normal into eye coordinates
    vec3 N = normalize((u_mvMatrix * NN).xyz);

    // Compute terms in the illumination equation
    float Kd = max(dot(L, N), 0.0);
    float Ks = pow(max(dot(N, H), 0.0), 30.0);

    fLightWeight = u_ambientLight.rgb + Kd * u_pointLightDiffuse.rgb + Ks * u_pointLightSpecular.rgb;
    } else {
        fLightWeight = vec3(1.0, 1.0, 1.0);
    }
    gl_Position = u_pMatrix * u_mvMatrix * vPos;
}