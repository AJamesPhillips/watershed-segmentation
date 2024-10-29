import { WatershedData, Watershed, Vertex, GroupedVertex } from "./interfaces"


export async function get_watershed_from_image(canvas_el: HTMLCanvasElement, img_url: string, minimum_minima_area: number = 20): Promise<Watershed>
{
    const data = await load_image_and_extract_data(canvas_el, img_url)
    const watershed = construct_watershed(data, minimum_minima_area)

    return watershed
}

async function show_watershed_from_image(canvas_el: HTMLCanvasElement, img_url: string, minimum_minima_area: number = 20, magnify: number = 1) //: Promise<Watershed>
{
    const data = await load_image_and_extract_data(canvas_el, img_url, magnify)
    const watershed = construct_watershed(data, minimum_minima_area)

    const context = canvas_el.getContext("2d")!
    draw_group_colours_onto_canvas(watershed, data, context, 1)
}


async function show_watershed_from_data(canvas_el: HTMLCanvasElement, data: WatershedData, minimum_minima_area: number = 20, magnify: number = 50) //: Promise<Watershed>
{
    const context = canvas_el.getContext("2d")!

    iterate_2d_data<number>(data as any, (x, y, z) =>
    {
        // draw a pixel at x, y with greyscale intensity of z
        context.fillStyle = `rgb(${z}, ${z}, ${z})`
        context.fillRect(x*magnify, y*magnify, magnify, magnify)
    })

    const watershed = construct_watershed(data, minimum_minima_area)

    draw_group_colours_onto_canvas(watershed, data, context, magnify)
}


async function load_image_and_extract_data(canvas_el: HTMLCanvasElement, img_url: string, magnify=1): Promise<WatershedData>
{
    const img = await load_image(img_url)
    return extract_image_data(canvas_el, img, magnify)
}


async function load_image(image_url: string): Promise<HTMLImageElement>
{
    const image = new Image()

    return new Promise((resolve, reject) =>
    {
        image.onload = () => resolve(image)
        image.src = image_url
    })
}


function extract_image_data(canvas_el: HTMLCanvasElement, image: HTMLImageElement, magnify: number = 1, warn_if_not_grayscale: boolean = true): WatershedData
{
    const context = canvas_el.getContext("2d")!

    // image.width = 230
    // image.height = 10

    // Get image width and height
    canvas_el.width = image.width * magnify
    canvas_el.height = image.height * magnify

    // Draw image onto canvas but magnified
    context.imageSmoothingEnabled = false
    context.scale(magnify, magnify)
    context.drawImage(image, 0, 0)
    const img = context.getImageData(0, 0, canvas_el.width, canvas_el.height)
    const len = image.width * image.height
    const image_data = new Uint8ClampedArray(len)

    for (var j = 0; j < image.height; ++j)
    {
        for (var i = 0; i < image.width; ++i)
        {
            const index = (4 * i * magnify) + (4 * image.width * j * magnify * magnify)
            image_data[i + (image.width * j)] = img.data[index]
            console.log(i, img.data.length, index, img.data[index])

            if (warn_if_not_grayscale && (img.data[index + 1] !== img.data[index] || (img.data[index + 2] !== img.data[index])))
            {
                console.warn("Image data is not grayscale. Only the red channel is being used.")
                warn_if_not_grayscale = false
            }
        }
    }

    return {
        image_data,
        width: image.width,
        height: image.height
    }
}


export function construct_watershed(data: WatershedData, minimum_minima_area: number = 1): Watershed
{
    const watershed = watershed_segmentation(data)
    normalise_watershed_group_ids(watershed)

    return watershed
}


function iterate_2d_data<U>(data: { image_data: U[], width: number, height: number }, iterator: (x: number, y: number, z: U) => void)
{
    const { image_data, width, height } = data

    for (let i = 0; i < image_data.length; ++i)
    {
        const x = i % width
        const y = Math.floor(i / width)
        const z = image_data[i]
        iterator(x, y, z)
    }
}


function factory_get_2d_array_value<U>(data: { image_data: U[], width: number, height: number })
{
    const { image_data, width, height } = data

    function get_pixel_value(x: number, y: number): U | null
    {
        if (x < 0 || x >= width || y < 0 || y >= height)
        {
            return null
        }

        return image_data[y * width + x]
    }

    return get_pixel_value
}


function watershed_segmentation(data: WatershedData): Watershed
{
    let next_group_id = 0
    const minima: (GroupedVertex & Vertex)[] = []

    // Convert into vertices
    const vertices: (GroupedVertex & Vertex)[] = []
    iterate_2d_data<number>(data as any, (x, y, z) =>
    {
        vertices.push({ x, y, z, group_ids: [] })
    })
    const get_2d_array_value = factory_get_2d_array_value({ image_data: vertices, width: data.width, height: data.height })

    // Order the vertices by z from lowest to highest, but keep the same vertex
    // objects in both arrays
    const sorted_vertices = vertices.slice().sort((a, b) => a.z - b.z)

    // Then iterate through the vertices from lowest to highest
    sorted_vertices.forEach((vertex, sorted_vertices_index) =>
    {
        const { x, y } = vertex
        // Define 8 neighbors
        const neighbours = [
            get_2d_array_value(x - 1, y - 1), // top-left
            get_2d_array_value(x, y - 1),     // top
            get_2d_array_value(x + 1, y - 1), // top-right
            get_2d_array_value(x - 1, y),     // left
            get_2d_array_value(x + 1, y),     // right
            get_2d_array_value(x - 1, y + 1), // bottom-left
            get_2d_array_value(x, y + 1),     // bottom
            get_2d_array_value(x + 1, y + 1)  // bottom-right
        ]
        // Check how many of the neighbors are connected to a local minimum
        const single_group_ids = new Set<number>()
        // const multi_group_ids = new Set<number>()
        neighbours.forEach(neighbor =>
        {
            if (!neighbor) return  // Skip if neighbor is null
            if (neighbor.group_ids.length === 1) single_group_ids.add(neighbor.group_ids[0])
            // else neighbor.group_ids.forEach(group_id => multi_group_ids.add(group_id))
        })

        // If the vertex is connected to one or more local minimum then assign
        // it to those groups
        if (single_group_ids.size)
        {
            vertex.group_ids = Array.from(single_group_ids).sort()

            if (single_group_ids.size > 1)
            {
                // Check if we can merge these groups.  The logic here is that
                // if this vertex is part of a group whose minima is at the same
                // level as this vertex then we know we have not increased in
                // height since the last minima, so we can merge the groups
                const minima_this_vertex_is_connected_to = vertex.group_ids.map(group_id => minima[group_id])
                if (minima_this_vertex_is_connected_to.length <= 1) return
                const minima_at_same_height = minima_this_vertex_is_connected_to.filter(minima => minima.z === vertex.z)
                const deeper_minima = minima_this_vertex_is_connected_to.filter(minima => minima.z < vertex.z)
                const minima_to_remove = deeper_minima.length ? minima_at_same_height : minima_at_same_height.slice(1)
                if (!minima_to_remove.length) return
                const minima_to_keep = deeper_minima.length ? deeper_minima[0] : minima_at_same_height[0]
                const minima_ids_to_remove = minima_to_remove.map(minima => minima.minima_id)
                sorted_vertices.slice(0, sorted_vertices_index + 1).forEach(earlier_vertex =>
                {
                    if (earlier_vertex.group_ids.some(group_id => minima_ids_to_remove.includes(group_id)))
                    {
                        earlier_vertex.group_ids = earlier_vertex.group_ids.filter(group_id => !minima_ids_to_remove.includes(group_id))
                        earlier_vertex.group_ids.push(minima_to_keep.minima_id!)
                        earlier_vertex.group_ids = Array.from(new Set(earlier_vertex.group_ids)).sort()
                    }
                })

                minima_to_remove.forEach(minima => minima.minima_id = undefined)
            }
        }
        else
        {
            vertex.minima_id = next_group_id++
            vertex.group_ids = [vertex.minima_id]
            minima.push(vertex)
        }
    })

    // Remove minima which were merged into other minima
    const unique_minima = minima.filter(minima => minima.minima_id !== undefined)

    const grouped_vertices: GroupedVertex[] = vertices.map(vertex =>
    {
        return {
            z: vertex.z,
            group_ids: vertex.group_ids,
            minima_id: vertex.minima_id,
        }
    })

    return { vertices: grouped_vertices, area_count: unique_minima.length }
}


function normalise_watershed_group_ids(watershed: Watershed)
{
    const group_id_map = new Map<number, number>()

    const minimas = watershed.vertices.filter(vertex => vertex.minima_id !== undefined)
    minimas.sort((a, b) => a.z - b.z)
    minimas.forEach((minima, index) =>
    {
        group_id_map.set(minima.minima_id!, index)
    })

    watershed.vertices.forEach(vertex =>
    {
        vertex.group_ids = vertex.group_ids.map(group_id =>
        {
            return group_id_map.get(group_id)!
        })
    })
}


function draw_group_colours_onto_canvas(watershed: Watershed, data: WatershedData, context: CanvasRenderingContext2D, magnify: number)
{
    iterate_2d_data({ image_data: watershed.vertices, width: data.width, height: data.height }, (x, y, element) =>
    {
        const { group_ids } = element
        if (group_ids.length === 1)
        {
            context.fillStyle = color_for_group_id(group_ids[0], watershed.area_count)
            context.fillRect(x * magnify, y * magnify, magnify, magnify)
        }
        else
        {
            const group_count = group_ids.length
            const group_width = magnify / group_count
            group_ids.forEach((group_id, group_index) => {
                context.fillStyle = color_for_group_id(group_id, watershed.area_count)
                context.fillRect(x * magnify + (group_width * group_index), y * magnify, group_width, magnify)
            })
        }
    })


    iterate_2d_data({ image_data: watershed.vertices, width: data.width, height: data.height }, (x, y, element) =>
    {
        if (element.minima_id === undefined) return

        context.fillStyle = "rgba(0, 0, 0, 0.5)"
        const size = 1
        // context.fillRect((x-size)*magnify, (y-size)*magnify, size*2*magnify, size*2*magnify)
        // context.fillStyle = "rgba(1, 1, 1, 1)"
        // set colour of stroke for the rectangle to white
        context.strokeStyle = "rgba(255, 255, 255, 0.5)"
        context.lineWidth = 0.1
        context.strokeRect(x*magnify, y*magnify, magnify, magnify)
    })
}


function color_for_group_id(group_id: number, total_groups: number): string
{
    return `hsla(${(group_id / total_groups) * 360}, 100%, 50%, 50%)`
}


if (typeof document !== "undefined")
{
    const canvas_el = document.getElementById("canvas") as HTMLCanvasElement
    show_watershed_from_image(canvas_el, "./input.png", 20, 1)
    // show_watershed_from_image(canvas_el, "./input2.png", 20, 1)
    // show_watershed_from_image(canvas_el, "./input3.png", 20, 50)

    const image_data: WatershedData = {
        image_data: new Uint8ClampedArray([
            1, 0, 2, 2, 1,
            0, 1, 2, 2, 2,
            1, 2, 2, 1, 2,
            1, 2, 2, 2, 2,
            1, 0, 2, 2, 2,
            1, 0, 2, 2, 1,
        ]),
        width: 5,
        height: 6
    }
    image_data.image_data.forEach((z, i) => image_data.image_data[i] = z * 100)
    // show_watershed_from_data(canvas_el, image_data)
}
