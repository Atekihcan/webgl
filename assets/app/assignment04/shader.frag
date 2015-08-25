precision mediump float;

varying vec4 fPos;
varying vec3 fNorm;

/* light uniforms */
const int NUM_LIGHTS = 3;
uniform int u_lightON;
uniform int u_pointLightOn[NUM_LIGHTS];
uniform int u_ambientLightOn; 
uniform vec4 u_ambientLight;
uniform vec4 u_pointLightSpecular[NUM_LIGHTS];
uniform vec4 u_pointLightDiffuse[NUM_LIGHTS];
uniform vec4 u_pointLightPos[NUM_LIGHTS];

/* object light properties */
uniform float u_matShininess;
uniform vec4 u_matAmbient;
uniform vec4 u_matDiffuse;
uniform vec4 u_matSpecular;

/* offscreen uniforms for picking */
uniform int u_offscreen;
uniform vec3 u_color;

void main()
{
    if (u_offscreen == 1) {
        gl_FragColor = vec4(u_color, 1.0);
    } else {
        vec4 finalColor = vec4(0.0, 0.0, 0.0, 0.0);
        if (u_lightON != 0) {
            vec4 eyeDirection = normalize(-fPos);
            for(int i = 0; i < NUM_LIGHTS; i++){					//For each light
                if (u_pointLightOn[i] != 0) {
                    float distance = length(u_pointLightPos[i] - fPos);
                    float attenuation = 1.0 / (1.0 + 0.05 * distance + 0.25 * distance * distance);
                    vec4 lightDirection = normalize(u_pointLightPos[i] - fPos);
                    float diffuse = max(dot(vec4(fNorm, 0.0), lightDirection), 0.0);
                    
                    vec4 reflectionDirection = reflect(-lightDirection, vec4(fNorm, 0.0));
                    float specular = pow(max(dot(reflectionDirection, eyeDirection), 0.0), u_matShininess);

                    finalColor += attenuation * (diffuse * u_pointLightDiffuse[i] * u_matDiffuse + specular * u_pointLightSpecular[i] * u_matSpecular);
                }
            }
            if (u_ambientLightOn != 0) {
                finalColor += u_ambientLight * u_matAmbient;
            }
        } else {
            finalColor = u_matDiffuse;
        }
        gl_FragColor = finalColor;
    }
}