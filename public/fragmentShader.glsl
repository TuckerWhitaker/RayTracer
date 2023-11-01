precision mediump float;
uniform float u_time;

struct Material {
    vec3 color;
    float roughness;
    float metallic;
    vec3 emission;
};

struct Sphere { 
    vec3 center;
    float radius;
    Material material;
};

struct HitInfo {
    bool hit;
    float distance;
    vec3 sphereCenter;
    vec3 color;
    float roughness;
    float metallic;
    vec3 emission;
    vec3 normal;
};

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233 * u_time))) * 43758.5453123);
}

vec3 calculateHitPosition(vec3 rayOrigin, vec3 rayDirection, float dist){
    return(rayOrigin + (rayDirection * dist));
}

vec3 calculateTriangleNormal(vec3 v0, vec3 v1, vec3 v2) {
    vec3 edge1 = v1 - v0;
    vec3 edge2 = v2 - v0;
    vec3 normal = normalize(cross(edge1, edge2));
    return normal;
}
vec3 calculateNormal(vec3 rayOrigin, vec3 rayDirection, float dist, vec3 sphereCenter){
    return normalize((calculateHitPosition(rayOrigin, rayDirection, dist) - sphereCenter));
}

const int numSpheres = 5;
Sphere spheres[numSpheres];
Material materials[numSpheres];

bool IntersectRaySphere(vec3 rayOrigin, vec3 rayDirection, Sphere sphere, out float t) {
    vec3 oc = rayOrigin - sphere.center;
    float a = dot(rayDirection, rayDirection);
    float b = 2.0 * dot(oc, rayDirection);
    float c = dot(oc, oc) - sphere.radius * sphere.radius;
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
const int numTriangles = 2;  // Example: Two triangles for demonstration
vec3 triangleVertices[numTriangles * 3];
Material triangleMaterials[numTriangles];

bool IntersectRayTriangle(vec3 rayOrigin, vec3 rayDirection, vec3 v0, vec3 v1, vec3 v2, out float t) {
    vec3 edge1 = v1 - v0;
    vec3 edge2 = v2 - v0;
    vec3 h = cross(rayDirection, edge2);
    float a = dot(edge1, h);

    if (a > -0.00001 && a < 0.00001)
        return false;

    float f = 1.0/a;
    vec3 s = rayOrigin - v0;
    float u = f * dot(s, h);

    if (u < 0.0 || u > 1.0)
        return false;

    vec3 q = cross(s, edge1);
    float v = f * dot(rayDirection, q);

    if (v < 0.0 || u + v > 1.0)
        return false;

    t = f * dot(edge2, q);
    if (t > 0.001)
        return true;

    return false;
}

HitInfo castRay(vec3 rayOrigin, vec3 rayDirection) {
    HitInfo closestHit;
    closestHit.hit = false;
    closestHit.distance = 999999.0;
    float t;
    for (int i = 0; i < numSpheres; ++i) {
    if (IntersectRaySphere(rayOrigin, rayDirection, spheres[i], t)) {
        if (t < closestHit.distance && t > 0.001) {
            closestHit.hit = true;
            closestHit.distance = t;
            closestHit.sphereCenter = spheres[i].center;
            closestHit.color = spheres[i].material.color;
            closestHit.roughness = spheres[i].material.roughness;
            closestHit.metallic = spheres[i].material.metallic;
            closestHit.emission = spheres[i].material.emission;
            closestHit.normal = calculateNormal(rayOrigin, rayDirection, t, spheres[i].center);
        }
    }
}
    for (int i = 0; i < numTriangles; ++i) {
        vec3 v0 = triangleVertices[i * 3 + 0];
        vec3 v1 = triangleVertices[i * 3 + 1];
        vec3 v2 = triangleVertices[i * 3 + 2];
       
        if (IntersectRayTriangle(rayOrigin, rayDirection, v0, v1, v2, t)) {
            if (t < closestHit.distance && t > 0.001) {
                closestHit.hit = true;
                closestHit.distance = t;
                // Note: We don't have a "triangleCenter", just taking v0 for demonstration
                closestHit.sphereCenter = v0;
                closestHit.color = triangleMaterials[i].color;
                closestHit.roughness = triangleMaterials[i].roughness;
                closestHit.metallic = triangleMaterials[i].metallic;
                closestHit.emission = triangleMaterials[i].emission;
                closestHit.normal = calculateTriangleNormal(v0, v1, v2);
            }
        }
    }
    return closestHit;
}

const int maxBounces = 10;
vec3 skyColor = vec3(0.7, 0.7, 0.9);
//vec3 skyColor = vec3(0.0, 0.0, 0.0);

vec3 calculateReflectionRay(vec3 rayDirection, vec3 normal) {
    return rayDirection - 2.0 * dot(rayDirection, normal) * normal;
}

uniform vec3 u_greenSpherePosition;


void main(void) {
    vec2 resolution = vec2(900.0, 900.0);
    vec2 uv = (gl_FragCoord.xy / resolution - 0.5) * 2.0;
    uv.x *= resolution.x / resolution.y;

    vec3 rayOrigin = vec3(0.0, 0.0, 0.0);
    vec3 rayDirection = normalize(vec3(uv, -1.0));

    materials[0] = Material(vec3(0.4, 0.5, 0.4), 0.5, 0.0, vec3(0.4, 0.5, 0.4));  
    materials[1] = Material(vec3(0.1, 0.2, 0.5), 1.0, 0.5, vec3(0.0));  
    materials[2] = Material(vec3(0.1, 1.0, 0.1), 1.0, 0.5, vec3(0.0));  
    materials[3] = Material(vec3(0.7, 0.7, 1.0), 0.0, 1.0, vec3(0.0, 0.0, 0.0));  
    materials[4] = Material(vec3(1.0, 0.0, 1.0), 0.9, 1.0, vec3(1.0, 0.0, 1.0));  



    spheres[0] = Sphere(vec3(75.0, 100.0, 150.0), 125.0, materials[0]);
    spheres[1] = Sphere(vec3(0.0, -201.1, -5.0), 200.0, materials[1]);
    spheres[2] = Sphere(vec3(0.5, -0.1, -3.0), 1.0, materials[2]);
    spheres[3] = Sphere(vec3(-6.0, 2.0, -8.0), 5.0, materials[3]);
    spheres[4] = Sphere(vec3(5.0, -1.0, 5.0), 0.5, materials[4]);

    triangleVertices[0] = vec3(-1.0, -1.0, 50.5);
    triangleVertices[1] = vec3( 1.0, -1.0, 50.5);
    triangleVertices[2] = vec3(-1.0,  1.0, 50.5);
    triangleVertices[3] = vec3( 1.0, -1.0, 50.5);
    triangleVertices[4] = vec3( 1.0,  1.0, 50.5);
    triangleVertices[5] = vec3(-1.0,  1.0, 50.5);
    triangleMaterials[0] = Material(vec3(0.0, 0.0, 0.0), 1.0, 0.5, vec3(0.0));
    triangleMaterials[1] = Material(vec3(0.0, 0.0, 0.0), 1.0, 0.5, vec3(0.0));


    


    vec3 accumulatedColor = vec3(0.0);
    vec3 reflectionMultiplier = vec3(1.0);  // Initialize reflection multiplier to 1

    for (int bounce = 0; bounce < maxBounces; ++bounce) {

        HitInfo hitInfo = castRay(rayOrigin, rayDirection);

        if (hitInfo.hit) {
            vec3 hitPosition = calculateHitPosition(rayOrigin, rayDirection, hitInfo.distance);
            vec3 normal = hitInfo.normal;
            vec3 localColor = hitInfo.color;  

            accumulatedColor += reflectionMultiplier * localColor * hitInfo.emission * 10.0;  
            reflectionMultiplier *= localColor;
           
            rayOrigin = hitPosition + normal * 0.001;
            vec3 randomVector = vec3(
                    (random(gl_FragCoord.xy + vec2(0.0, 0.0))*2.0)-1.0,
                    (random(gl_FragCoord.xy + vec2(12.99, 78.23))*2.0)-1.0,
                    (random(gl_FragCoord.xy + vec2(24.53, 9.49))*2.0)-1.0
            );

            rayDirection = mix(normal, normalize(randomVector), hitInfo.roughness);
        } 
        else
        {
            accumulatedColor += reflectionMultiplier * skyColor;  // Modulate sky color by reflectionMultiplier
            reflectionMultiplier *= 0.0;

        }
}
    accumulatedColor = sqrt(accumulatedColor);
    gl_FragColor = vec4(accumulatedColor, 1.0);
}