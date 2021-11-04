import { Camera, castRay, MessageType, reconstructObjects, Vector } from "./module.js";


self.addEventListener("message", (e) => {
    switch (e.data.messageType) {
        case MessageType.render:
            render(e.data);
            
    }
})

let imageData = new ImageData(1,1);

function render(data) {
    let stepCount = 0;
    let rays = 0;

    let width = data.width;
    let height = data.height;
    let aspectRatio = width / height;
    let camera = new Camera(data.camera.position, data.camera.rotation, data.camera.fov);
    // imageData.data = null;
    imageData = new ImageData(width, height);
    let objects = reconstructObjects(data.objects);

    for (let y = 0; y < height; y++){
        for (let x = 0; x < width; x++) {
            let vector = new Vector(1, (((y / height) * 2) - 1) * camera.fov, ((((x / width)) * 2) - 1) * camera.fov * aspectRatio).rotate(camera.rotation);
            let ray = castRay(camera.position, vector, objects);

            let pixelindex = (y * data.width + x) * 4
            imageData.data[pixelindex]   = ray.hit == null ? 0 : ray.hit.color.r
            imageData.data[pixelindex+1] = ray.hit == null ? 0 : ray.hit.color.g
            imageData.data[pixelindex+2] = ray.hit == null ? 0 : ray.hit.color.b
            imageData.data[pixelindex+3] = 255

            stepCount += ray.steps;
            rays++
        }
    }

    console.log("Step Count:", stepCount);
    console.log("Rays:", rays);

    let bytes = new Uint8ClampedArray( imageData.data );

    self.postMessage( {
        messageType: MessageType.done,
        bytes: bytes
    }, [bytes.buffer] );

}