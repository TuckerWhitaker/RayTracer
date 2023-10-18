#include <stdlib.h>
#include <stdbool.h>
#include <math.h>

bool visualizeNormals = true;



typedef struct {
    double x, y, z;
} Vector3;

typedef struct {
    Vector3 origin;
    Vector3 direction;
} Ray;

typedef struct{
    Vector3 color;
    float roughness;
    float metallic;
    Vector3 emission;

} Material;

typedef struct {
    Vector3 center;
    double radius;
    Material material;
} Sphere;

typedef struct {
    Vector3 normal;
    double distance; // Distance from the origin along the plane's normal
    Material material;
} Plane;




double dot(Vector3 a, Vector3 b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

Vector3 multiply(Vector3 v, Vector3 v1){
    return (Vector3){v.x * v1.x, v.y * v1.y, v.z * v1.z};
}

Vector3 normalize(Vector3 v) {

    double length = sqrt(dot(v, v));
     if (length == 0.0) {
        return (Vector3){0.0, 0.0, 0.0};
    }
    return (Vector3){v.x / length, v.y / length, v.z / length};
}

Vector3 add(Vector3 v, Vector3 v2){
    return(Vector3){v.x + v2.x, v.y + v2.y, v.z + v2.z};
}


Vector3 reflect(Vector3 incident, Vector3 normal) {
    double idotn = dot(incident, normal);
    return (Vector3) {
        incident.x - 2.0 * idotn * normal.x,
        incident.y - 2.0 * idotn * normal.y,
        incident.z - 2.0 * idotn * normal.z
    };
}

Vector3 computeIntersectionPoint(Ray ray, double t) {
    return (Vector3){
        ray.origin.x + t * ray.direction.x,
        ray.origin.y + t * ray.direction.y,
        ray.origin.z + t * ray.direction.z
    };
}

Vector3 computeNormal(Vector3 intersectionPoint, Sphere sphere) {
    Vector3 normal = {
        intersectionPoint.x - sphere.center.x,
        intersectionPoint.y - sphere.center.y,
        intersectionPoint.z - sphere.center.z
    };
    return normalize(normal);
}


Vector3 visualizeNormal(Vector3 intersectionPoint, Sphere sphere) {
    Vector3 normal = computeNormal(intersectionPoint, sphere);
    return (Vector3){((normal.x + 1) * 0.5) * 255, ((normal.y + 1) * 0.5) * 255, ((normal.z + 1) * 0.5) * 255};
}


Vector3 calculateColor(Vector3 normal, Vector3 lightDirection, Vector3 color, bool VisualizeNormals) {
if(VisualizeNormals){
    return (Vector3){((normal.x + 1) * 0.5) * 255, ((normal.y + 1) * 0.5) * 255, ((normal.z + 1) * 0.5) * 255};
}
else{
    //double intensity = fmax(0, dot(normal, lightDirection)); // Clamp negative values to zero
    double intensity = 1; // Clamp negative values to zero
    return (Vector3){color.x * intensity, color.y * intensity, color.z * intensity};
}
}

bool intersectRayPlane(Ray ray, Plane plane, double* t) {
    double denominator = dot(plane.normal, ray.direction);

    if (fabs(denominator) > 0.0001) {
                *t = (dot(plane.normal, ray.origin) + plane.distance) / denominator;

        if (*t >= 0) {
            return true;
        }
    }

    return false;
}




bool intersectRaySphere(Ray ray, Sphere sphere, double* t) {
    Vector3 oc = {
        ray.origin.x - sphere.center.x,
        ray.origin.y - sphere.center.y,
        ray.origin.z - sphere.center.z
    };

    double a = dot(ray.direction, ray.direction);
    double b = 2.0 * dot(oc, ray.direction);
    double c = dot(oc, oc) - sphere.radius * sphere.radius;

    double discriminant = b*b - (double)4*a*c;

    if (discriminant < 0) {
        return false;
    } else {
        double t0 = (-b - sqrt(discriminant)) / (2.0*a);
        double t1 = (-b + sqrt(discriminant)) / (2.0*a);
        if(t0 > 0 && t1 > 0) *t = fmin(t0, t1);
        else if(t0 > 0) *t = t0;
        else if(t1 > 0) *t = t1;
        else return false;  // both t0 and t1 are negative, which means the sphere is behind the ray
        return true;
    }
}
Vector3 getColorForRay(Ray ray, Sphere *spheres, Plane *planes, Vector3 lightDirection, Vector3 normal) {
    const int MAX_REFLECTIONS = 5; // maximum number of reflections
    Vector3 reflectionMultiplier = {1, 1, 1};
    double EmissionMult = 10;
    //double attenuation = 0.9; // reflection attenuation factor
    Vector3 accumulatedColor = {0, 0, 0};
    //Vector3 skyColor = {0.5, 0.5, 1};  // the background color
    Vector3 skyColor = {0, 0, 0};  // the background color

    for (int reflection = 0; reflection < MAX_REFLECTIONS; reflection++) {
        double t;
        int lowest = 9999999;
        int lowestIndex = -1;
        int type = -1;
        for(int i = 0; i < 3; i++) {
            if (intersectRaySphere(ray, spheres[i], &t)) {
                if(t < lowest) {
                    lowest = t;
                    lowestIndex = i;
                    type = 0;
                }
            }
        }
        for(int i = 0; i < 2; i++) {
            if (intersectRayPlane(ray, planes[i], &t)) {
                if(t < lowest) {
                    lowest = t;
                    lowestIndex = i;
                    type = 1;
                }
            }
        }

        if(lowestIndex < 0) {
        accumulatedColor.x += skyColor.x * reflectionMultiplier.x;
        accumulatedColor.y += skyColor.y * reflectionMultiplier.y;
        accumulatedColor.z += skyColor.z * reflectionMultiplier.z;
           break;
        }


        Vector3 intersectionPoint = {
            ray.origin.x + (lowest * ray.direction.x),
            ray.origin.y + (lowest * ray.direction.y),
            ray.origin.z + (lowest * ray.direction.z)
        };

        double epsilon = 0.0001;  // small offset value
        double roughness = -1;
        if(type == 0){
            roughness = spheres[lowestIndex].material.roughness;
        }
        else{
            roughness = planes[lowestIndex].material.roughness;
        }


    Vector3 offset = {((rand() / (double)RAND_MAX) - 0.5) * roughness, ((rand() / (double)RAND_MAX) - 0.5) * roughness, ((rand() / (double)RAND_MAX) - 0.5) * roughness};
    normal = add(normal, offset);
    normal = normalize(normal);
    intersectionPoint.x += epsilon * normal.x;
    intersectionPoint.y += epsilon * normal.y;
    intersectionPoint.z += epsilon * normal.z;

    Vector3 color;

    if(type == 0){
        
            color = calculateColor(normal, lightDirection, spheres[lowestIndex].material.color, false);

        }
        if(type == 1)
        {

            color = calculateColor(normal, lightDirection, planes[lowestIndex].material.color, false);
        }
         
        ray.origin = intersectionPoint;

        //ray.direction = normalize(reflect(ray.direction, normal));
        
        Vector3 randomDirection = {((rand() / (double)RAND_MAX) * 2)-1, ((rand() / (double)RAND_MAX) * 2)-1, ((rand() / (double)RAND_MAX) * 2)-1};
        ray.direction = normalize(add(randomDirection, normal));
        
        if(type == 0){
             reflectionMultiplier = multiply(reflectionMultiplier,  spheres[lowestIndex].material.color);
        }
        else if(type == 1)
        {
            reflectionMultiplier =  multiply(reflectionMultiplier, planes[lowestIndex].material.color);
        }
        else{
                //accumulatedColor.x += 120 * reflectionMultiplier.x;
                //accumulatedColor.y += 120 * reflectionMultiplier.y;
                //accumulatedColor.z += 255 * reflectionMultiplier.z;
            }
        
        accumulatedColor.x += (spheres[lowestIndex].material.emission.x * EmissionMult);
        accumulatedColor.y += (spheres[lowestIndex].material.emission.y * EmissionMult);
        accumulatedColor.z += (spheres[lowestIndex].material.emission.z * EmissionMult);
      //accumulatedColor = reflectionMultiplier;

    }

    return accumulatedColor;
}




int* createArray(int width, int height, bool useSampling, float scale) {
    const int samplesPerPixel = 10;
    int* arr = (int*)malloc(width * height * 3 * sizeof(int));
    float* AccumulationArray = (float*)malloc(width * height * 3 * sizeof(float));
    Vector3 lightDirection = normalize((Vector3){-3, -3, -5});
    Material material1 = {{1, 0.3, 1}, 0, 1, {0, 0, 0}};
    Material material2 = {{1, 1, 0.7}, 0, 1, {1, 1, 0.7}};
    Material material3 = {{1, 0, 0}, 0, 1, {0, 0, 0}};

    Sphere sphere = {{0, 1005, 0}, 1000, material1};
    Sphere sphere1 = {{30, -60, 100}, 40, material2};
    Sphere sphere2 = {{-2, 0, -8}, 1, material3};
    Sphere spheres[3] = {sphere, sphere1, sphere2};

    Material planeMaterial = {{0, 0, 0}, 0, 0, {0, 0, 0}}; // Material for the plane
    //Plane plane = {{0, -1, 0}, -3, planeMaterial2}; // Normal vector {0, 1, 0}, distance from the origin -5
    Plane plane = {{0, 0, 0}, 0, planeMaterial}; // Normal vector {0, 1, 0}, distance from the origin -5
    Plane plane1 = {{0, 0, 0}, 0, planeMaterial}; // Normal vector {0, 1, 0}, distance from the origin -5
    Plane planes[] = {plane, plane1}; // Add more planes if needed
    
    int accumulationNum = 100;

    for(int acc = 1; acc < accumulationNum; acc++){

    
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            Vector3 accumulatedColor = {0, 0, 0};
            int samples = useSampling ? samplesPerPixel : 1;

            for (int sample = 0; sample < samples; sample++) {
                double offsetX = useSampling ? (rand() / (double)RAND_MAX) : 0;
                double offsetY = useSampling ? (rand() / (double)RAND_MAX) : 0;
                double u = (2.0 * (x + offsetX) - width) / width;
                double v = (2.0 * (y + offsetY) - height) / height;
                Vector3 rayDirection = {u - 0.5, v, 1};
                rayDirection = normalize(rayDirection);
                Ray ray = {{0, 0, -10}, rayDirection};

              
                double t;
                double closestT = INFINITY;
                int closestIndex = -1;
                Sphere* closestSphere = NULL;
                int type = -1;

                for (int i = 0; i < 3; i++) {
                    if (intersectRaySphere(ray, spheres[i], &t) && t < closestT) {
                        closestT = t;
                        closestSphere = &spheres[i];
                         closestIndex = i;
                        type = 0;
                    }
                }
                for (int i = 0; i < 2; i++) {
                    if (intersectRayPlane(ray, planes[i], &t) && t < closestT) {
                        closestT = t;
                        closestIndex = i;
                        closestSphere = NULL;
                        type = 1;
                    }
                }

                if (type == 0) {
                    Vector3 intersectionPoint = computeIntersectionPoint(ray, closestT);
                    Vector3 normal = computeNormal(intersectionPoint, *closestSphere);
                    Vector3 color = getColorForRay(ray, spheres, planes, lightDirection, normal);
                    //Vector3 color = visualizeNormal(intersectionPoint, *closestSphere);
                    
                    accumulatedColor.x += color.x;
                    accumulatedColor.y += color.y;
                    accumulatedColor.z += color.z;
                }
                else if(type == 1){
                    Vector3 intersectionPoint = computeIntersectionPoint(ray, closestT);
                    Vector3 color = getColorForRay(ray, spheres, planes, lightDirection, planes[closestIndex].normal);
                    //Vector3 color = visualizeNormal(intersectionPoint, *closestSphere);
                    
                    accumulatedColor.x += color.x;
                    accumulatedColor.y += color.y;
                    accumulatedColor.z += color.z;
                }
                else{
                    Vector3 color = getColorForRay(ray, spheres, planes, lightDirection, planes[closestIndex].normal);
                    accumulatedColor.x += color.x;
                    accumulatedColor.y += color.y;
                    accumulatedColor.z += color.z;
                }
                /*
                else{
                    accumulatedColor.x += 120;
                    accumulatedColor.y += 120;
                    accumulatedColor.z += 255;
                }
                */
            }
            
            accumulatedColor.x /= (float)samples;
            accumulatedColor.y /= (float)samples;
            accumulatedColor.z /= (float)samples;

            int index = (y * width + x) * 3;


            AccumulationArray[index] += accumulatedColor.x;
            AccumulationArray[index + 1] += accumulatedColor.y;
            AccumulationArray[index + 2] += accumulatedColor.z;
        }
    }
 }

    int length = width * height * 3;

    for (int i = 0; i < length; i++) {
        arr[i] = round((AccumulationArray[i] / accumulationNum) * 255);
    }


    return arr;
}
