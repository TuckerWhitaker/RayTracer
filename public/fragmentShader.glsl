precision mediump float;
uniform float u_time;

struct Material {
    vec3 color;
    float roughness;
    float metallic;
    vec3 emission;
};

struct HitInfo {
    bool hit;
    float distance;
    vec3 sphereCenter;
    vec3 color;
    float roughness;
    float metallic;
    vec3 emission;
};

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233 * u_time))) * 43758.5453123);
}

const int numSpheres = 2;
vec3 sphereCenters[numSpheres];
float sphereRadii[numSpheres];
Material materials[numSpheres];

bool IntersectRaySphere(vec3 rayOrigin, vec3 rayDirection, vec3 sphereCenter, float sphereRadius, out float t) {
    vec3 oc = rayOrigin - sphereCenter;
    float a = dot(rayDirection, rayDirection);
    float b = 2.0 * dot(oc, rayDirection);
    float c = dot(oc, oc) - sphereRadius * sphereRadius;
    float discriminant = b*b - 4.0*a*c;

    if (discriminant < 0.0) {
        return false;
    } else {
        float sqrtDiscriminant = sqrt(discriminant);
        float t0 = (-b - sqrtDiscriminant) / (2.0*a);
        float t1 = (-b + sqrtDiscriminant) / (2.0*a);
        if(t0 > 0.0 && t1 > 0.0) t = min(t0, t1);
        else if(t0 > 0.0) t = t0;
        else if(t1 > 0.0) t = t1;
        else return false;
        return true;
    }
}

HitInfo castRay(vec3 rayOrigin, vec3 rayDirection) {
    HitInfo closestHit;
    closestHit.hit = false;
    closestHit.distance = 999999.0;

    for (int i = 0; i < numSpheres; ++i) {
        float t;
        if (IntersectRaySphere(rayOrigin, rayDirection, sphereCenters[i], sphereRadii[i], t)) {
            if (t < closestHit.distance) {
                closestHit.hit = true;
                closestHit.distance = t;
                closestHit.sphereCenter = sphereCenters[i];
                closestHit.color = materials[i].color;
                closestHit.roughness = materials[i].roughness;
                closestHit.metallic = materials[i].metallic;
                closestHit.emission = materials[i].emission;

            }
        }
    }
    return closestHit;
}

vec3 calculateHitPosition(vec3 rayOrigin, vec3 rayDirection, float dist){
    return(rayOrigin + (rayDirection * dist));
}

vec3 calculateNormal(vec3 rayOrigin, vec3 rayDirection, float dist, vec3 sphereCenter){
    return normalize((calculateHitPosition(rayOrigin, rayDirection, dist) - sphereCenter));
}

const int maxBounces = 5;
vec3 skyColor = vec3(0.8, 0.9, 0.99);
//vec3 skyColor = vec3(0.0, 0.0, 0.0);

vec3 calculateReflectionRay(vec3 rayDirection, vec3 normal) {
    return rayDirection - 2.0 * dot(rayDirection, normal) * normal;
}


void main(void) {
    vec2 resolution = vec2(900.0, 900.0);
    vec2 uv = (gl_FragCoord.xy / resolution - 0.5) * 2.0;
    uv.x *= resolution.x / resolution.y;

    vec3 rayOrigin = vec3(0.0, 0.0, 0.0);
    vec3 rayDirection = normalize(vec3(uv, -1.0));

    sphereCenters[0] = vec3(0.0, 0.0, -5.0);
    sphereRadii[0] = 1.0;
    sphereCenters[1] = vec3(0.0, -101.1, -5.0);
    sphereRadii[1] = 100.0;

    materials[0] = Material(vec3(1.0, 0.0, 0.0), 0.0, 0.5, vec3(0.0));  
    materials[1] = Material(vec3(0.1, 0.1, 0.1), 0.05, 0.5, vec3(0.0));  


    vec3 accumulatedColor = vec3(0.0);
    vec3 reflectionMultiplier = vec3(1.0);  // Initialize reflection multiplier to 1

    for (int bounce = 0; bounce < maxBounces; ++bounce) {
        HitInfo hitInfo = castRay(rayOrigin, rayDirection);

        if (hitInfo.hit) {
            vec3 hitPosition = calculateHitPosition(rayOrigin, rayDirection, hitInfo.distance);
            vec3 normal = calculateNormal(rayOrigin, rayDirection, hitInfo.distance, hitInfo.sphereCenter);

            vec3 localColor = hitInfo.color;  // Assuming diffuse shading for simplicity

            // Modulate local color and accumulated color
            accumulatedColor += reflectionMultiplier * localColor;  // Modulate local color by reflectionMultiplier
            accumulatedColor += reflectionMultiplier * hitInfo.emission;  // Adding emissive color
            // Compute reflection
            rayDirection = calculateReflectionRay(rayDirection, normal);
            rayOrigin = hitPosition + normal * 0.01;
            vec3 randomVector = vec3(
                    random(gl_FragCoord.xy + vec2(0.0, 0.0))-0.5,
                    random(gl_FragCoord.xy + vec2(12.99, 78.23))-0.5,
                    random(gl_FragCoord.xy + vec2(24.53, 9.49))-0.5
            );

            rayDirection = mix(rayDirection, normalize(randomVector), hitInfo.roughness);



            // Attenuate reflection multiplier for next bounce
            reflectionMultiplier *= hitInfo.metallic;  // Example attenuation factor
        } 
        else
        {
            accumulatedColor += reflectionMultiplier * skyColor;  // Modulate sky color by reflectionMultiplier
            reflectionMultiplier *= 0.0;

        }
}

    gl_FragColor = vec4(accumulatedColor, 1.0);
}