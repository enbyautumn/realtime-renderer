function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

let clamp = (num, min, max) => Math.min(Math.max(num, min), max)

let rad2deg = (rad) => (180 / Math.PI) * rad
let deg2rad = (deg) => deg * (Math.PI / 180)

export let MessageType = {
    render: 0,
    cancel: 1,
    status: 2,
    done: 3,
}

export class Vector {

    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }

    get length() {
        return Math.hypot(this.x, this.y, this.z)
    }

    normalize() {
        let length = this.length()
        this.x /= length
        this.y /= length
        this.z /= length
    }

    rotate(angle) {
        let roll = deg2rad(angle.roll)
        let pitch = deg2rad(angle.pitch)
        let yaw = deg2rad(angle.yaw)
        let result =  new Vector(
            ( this.x * (Math.cos(yaw) * Math.cos(pitch)) ) + ( this.y * ((Math.cos(yaw) * Math.sin(pitch) * Math.sin(roll)) - (Math.sin(yaw) * Math.cos(roll))) ) + ( this.z * ((Math.cos(yaw) * Math.sin(pitch) * Math.cos(roll)) + (Math.sin(yaw) * Math.sin(roll))) ),
            ( this.x * (Math.sin(yaw) * Math.cos(pitch)) ) + ( this.y * ((Math.sin(yaw) * Math.sin(pitch) * Math.sin(roll)) + (Math.cos(yaw) * Math.cos(roll))) ) + ( this.z * ((Math.sin(yaw) * Math.sin(pitch) * Math.cos(roll)) - (Math.cos(yaw) * Math.sin(roll))) ),
            ( this.x * (-Math.sin(pitch) )             )   + ( this.y * (Math.cos(pitch) * Math.sin(roll) ))                                                      + ( this.z * (Math.cos(pitch) * Math.cos(roll) )),
        )
        // this.x = result.x
        // this.y = result.y
        // this.z = result.z
        return result
    }

    static add(vector1, vector2) {
        return new Vector(
            vector1.x + vector2.x,
            vector1.y + vector2.y,
            vector1.z + vector2.z
        )
    }

    static subtract(vector1, vector2) {
        return new Vector(
            vector1.x - vector2.x,
            vector1.y - vector2.y,
            vector1.z - vector2.z
        )
    }

    static multiply(vector, scalar) {
        return new Vector(
            vector.x * scalar,
            vector.y * scalar,
            vector.z * scalar
        )
    }
}

export let localize = (v1, v2) => new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z)

export class Angle {
    constructor(roll, pitch, yaw) {
        this.roll = roll
        this.pitch = pitch
        this.yaw = yaw
    }
}

export class Color {
    constructor(r, g, b) {
        this.r = r
        this.g = g
        this.b = b
    }
}

let Types = {
    Plane: "Plane",
    Box: "Box",
    Sphere: "Sphere",
    Camera: "Camera",
}

class Object {
    constructor(color = new Color(255,255,255), roughness = .5) {
        this.color = color
        this.roughness = roughness
        this.uuid = uuidv4()
    }
}

export class Box extends Object {
    constructor(position, size, color, roughness, rotation = new Angle(0,0,0)) {
        super(color, roughness)
        this.position = position
        this.size = size
        this.rotation = rotation
        this.type = Types.Box
    }

    distance(point) {
        let p = localize(point, this.position).rotate(this.rotation)
        console.log(p)
        return Math.max(Math.abs(p.x) - this.size.x, Math.abs(p.y) - this.size.y, Math.abs(p.z) - this.size.z)
    }
}

export class Sphere extends Object {
    constructor(position, radius, color, roughness) {
        super(color, roughness)
        this.position = position
        this.radius = radius
        this.type = Types.Sphere
    }

    distance(point) {
        let p = localize(point, this.position)
        return p.length - this.radius
    }
}

export class Plane extends Object {
    constructor(position, shape, color, roughness, angle = new Angle(0,0,0)) {
        super(color, roughness)
        this.position = position
        this.shape = shape
        this.angle = angle
        this.type = Types.Plane
    }

    distance(point) {
        let p = localize(point, this.position).rotate(this.angle)
        // not sure which is up and down yet
        return Math.max(Math.abs(p.x) - this.shape.x, Math.abs(p.z), Math.abs(p.z) - this.shape.y)
    }
}

export class Camera {
    constructor(position, rotation, fov) {
        this.position = position
        this.rotation = rotation
        this.fov = fov
        this.type = Types.Camera
    }

    // not sure which is up and down yet - todo
    vector(x, y) {
        return new Vector(
            (x / this.fov) * 2 - 1,
            -(y / this.fov) * 2 + 1,
            1
        )
    }
}

export function reconstructObjects(objects) {
    let reconstructed = []
    objects.forEach(object => {
        switch (object.type) {
            case Types.Box:
                reconstructed.push(new Box(object.position, object.size, object.color, object.roughness, object.rotation))
                break
            case Types.Sphere:
                reconstructed.push(new Sphere(object.position, object.radius, object.color, object.roughness))
                break
            case Types.Plane:
                reconstructed.push(new Plane(object.position, object.shape, object.color, object.roughness, object.angle))
                break
            default:
                console.warn("Unknown object type", object)
                break
        }
    })
    return reconstructed
}

export function castRay(pos, vector, objects, maxDistance = 100, minDistance = 0.01, maxSteps = 100) {
    let position = new Vector(pos.x, pos.y, pos.z)
    let distance = Infinity
    let totalDistance = 0
    let steps = 0
    let hit
    do {
        objects.forEach(object => {
            if (object.distance(position) < distance) {
                distance = object.distance(position)
                hit = object
            }
        })

        position = Vector.add(position, Vector.multiply(vector, distance))

        totalDistance += distance
        steps++

    } while (!(totalDistance > maxDistance || steps > maxSteps || distance < minDistance))

    return {
        distance: clamp(distance, 0, maxDistance),
        steps: clamp(steps, 0, maxSteps),
        hit: distance < minDistance ? hit : null,
    }
}