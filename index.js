import { Angle, Camera, Color, MessageType, Sphere, Vector } from "./module.js";

let canvas = document.getElementById("canvas")
let ctx = canvas.getContext("2d")

let color = new Worker('color.js', {type: "module"});

let imageData = new ImageData(canvas.width, canvas.height)

let time = performance.now()

color.addEventListener("message", (e) => {
    switch (e.data.messageType) {
        case MessageType.done:
            imageData.data.set(e.data.bytes)
            ctx.putImageData(imageData, 0, 0)
            console.log("Time (ms):", performance.now() - time)
            console.log("FPS:", 1000 / (performance.now() - time))
            break;
    }
})

let camera = new Camera(new Vector(0,0,0), new Angle(0,0,0), 1)

let objects = [
    new Sphere(new Vector(5,0,0), 3, new Color(255,255,255), 1)
]

color.postMessage({
    messageType: MessageType.render,
    width: canvas.width,
    height: canvas.height,
    camera: camera,
    objects: objects,
})

document.getElementById("render").addEventListener("click", (e) => {
    time = performance.now()
    main()
})

function main() {
    color.postMessage({
        messageType: MessageType.render,
        width: canvas.width,
        height: canvas.height,
        camera: camera,
        objects: objects,
    })
}