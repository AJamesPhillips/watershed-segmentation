import {
    WatershedInputData,
    Watersheds,
    Vertex,
    GroupedVertex,
    WatershedMinimum,
    is_watershed_minimum,
} from "./interfaces"
import { iterate_2d_data } from "./iterate_2d_data"


export const DEFAULT_MAX_Z_DIFF = 0

export async function get_watersheds_from_image_url(canvas_el: HTMLCanvasElement, img_url: string, max_z_diff: number = DEFAULT_MAX_Z_DIFF, magnify: number = 1): Promise<Watersheds>
{
    const data = await load_image_and_extract_data(canvas_el, img_url, magnify)
    const watershed = construct_watersheds(data, max_z_diff)

    return watershed
}


export function get_watersheds_from_image_el(canvas_el: HTMLCanvasElement, img_el: HTMLImageElement, max_z_diff: number = DEFAULT_MAX_Z_DIFF, magnify: number = 1): Watersheds
{
    const data = extract_image_data(canvas_el, img_el, magnify)
    const watershed = construct_watersheds(data, max_z_diff)

    return watershed
}


export async function load_image_and_extract_data(canvas_el: HTMLCanvasElement, img_url: string, magnify=1): Promise<WatershedInputData>
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


export function extract_image_data(canvas_el: HTMLCanvasElement, image: HTMLImageElement, magnify: number = 1, warn_if_not_grayscale: boolean = true, flip_vertically: boolean = false): WatershedInputData
{
    const context = canvas_el.getContext("2d")!

    // image.width = 230
    // image.height = 10

    // Get image width and height
    const image_of_canvas_width = image.width * magnify
    canvas_el.width = image_of_canvas_width * 2
    canvas_el.height = image.height * magnify
    check_is_int(canvas_el.width, `image.width * magnify must be an integer but ${image.width} * ${magnify} = ${image.width * magnify}`)
    check_is_int(canvas_el.height, `image.height * magnify must be an integer but ${image.height} * ${magnify} = ${image.height * magnify}`)

    // Draw image onto canvas but magnified
    context.imageSmoothingEnabled = magnify < 1
    context.scale(magnify, magnify)
    context.drawImage(image, 0, 0)
    context.drawImage(image, image.width, 0)
    const img = context.getImageData(0, 0, image_of_canvas_width, canvas_el.height)

    // If magnify is <1 then we also scale down the image size and set magnify to 1
    let image_width = image.width
    let image_height = image.height
    if (magnify < 1)
    {
        image_width = image.width * magnify
        image_height = image.height * magnify
        magnify = 1
    }
    const len = image_width * image_height
    const image_data = new Uint8ClampedArray(len)

    for (var j = 0; j < image_height; ++j)
    {
        const j2 = flip_vertically ? image_height - j - 1 : j
        for (var i = 0; i < image_width; ++i)
        {
            const index = (4 * i * magnify) + (4 * image_width * j * magnify * magnify)
            image_data[i + (image_width * j2)] = img.data[index]
            // console.log(i, img.data.length, index, img.data[index])

            if (warn_if_not_grayscale && (img.data[index + 1] !== img.data[index] || (img.data[index + 2] !== img.data[index])))
            {
                console.warn("Image data is not grayscale. Only the red channel is being used.")
                warn_if_not_grayscale = false
            }
        }
    }

    return {
        image_data,
        width: image_width,
        height: image_height
    }
}


function check_is_int(value: number, message: string)
{
    if (value !== Math.round(value))
    {
        throw new Error(message)
    }
}


export function construct_watersheds(data: WatershedInputData, max_z_diff: number = DEFAULT_MAX_Z_DIFF): Watersheds
{
    const watershed = watershed_segmentation(data, max_z_diff)
    normalise_watershed_ids(watershed)

    return watershed
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


function watershed_segmentation(data: WatershedInputData, max_z_diff: number): Watersheds
{
    // Double check that the image data 2D array fits with the width and height
    if (data.image_data.length !== data.width * data.height)
    {
        throw new Error(`Image data length (${data.image_data.length}) does not match width * height of ${data.width * data.height} (${data.width} * ${data.height})`)
    }

    let next_watershed_id = 0
    const minima: (GroupedVertex & Vertex)[] = []

    // Convert into vertices
    const vertices: (GroupedVertex & Vertex)[] = []
    iterate_2d_data<number>(data as any, (x, y, z) =>
    {
        vertices.push({ x, y, z, watershed_ids: new Set() })
    })
    const get_2d_array_value = factory_get_2d_array_value({ image_data: vertices, width: data.width, height: data.height })

    // Order the vertices by z from lowest to highest, but keep the same vertex
    // objects in both arrays
    const sorted_vertices = vertices.slice().sort((a, b) => a.z - b.z)

    // Then iterate through the vertices from lowest to highest
    sorted_vertices.forEach((vertex, sorted_vertices_index) =>
    {
        // if (sorted_vertices_index % 10000 === 0) console.log(`watershed_segmentation ${sorted_vertices_index}/${sorted_vertices.length}. minimas: ${minima.length}`)
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
        const single_watershed_ids = new Set<number>()
        // const multi_watershed_ids = new Set<number>()
        neighbours.forEach(neighbor =>
        {
            if (!neighbor) return  // Skip if neighbor is null
            if (neighbor.watershed_ids.size === 1) neighbor.watershed_ids.forEach(v => single_watershed_ids.add(v))
            // else neighbor.watershed_ids.forEach(watershed_id => multi_watershed_ids.add(watershed_id))
        })

        // If the vertex is connected to one or more local minimum then assign
        // it to those watersheds
        if (single_watershed_ids.size)
        {
            vertex.watershed_ids = single_watershed_ids
            const minima_this_vertex_is_connected_to = Array.from(vertex.watershed_ids).map(watershed_id =>
            {
                return minima[watershed_id]
            })

            minima_this_vertex_is_connected_to.forEach(minimum =>
            {
                minimum.member_indices!.push(sorted_vertices_index)
            })

            // If the vertex is connected to more than one local minimum then
            // check if we can merge these watersheds
            if (single_watershed_ids.size > 1)
            {
                // If there's only one minimum connected to this vertex then we
                // return early as we can't merge anything.
                if (minima_this_vertex_is_connected_to.length <= 1) return

                // The logic here is that if this vertex is part of one or more watersheds
                // whose minima are at the same level as this vertex (or within
                // max_z_diff) then as we know we have not increased in height
                // since the previous minima (because we are moving from lowest
                // to highest point) then that means it is ok to merge the
                // watershed this vertex belongs to, with the other
                // watersheds this vertex is part of.
                const minima_at_similar_height: (GroupedVertex & Vertex)[] = []
                const deeper_minima: (GroupedVertex & Vertex)[] = []
                minima_this_vertex_is_connected_to.forEach(minimum =>
                {
                    if (minimum.z < (vertex.z - max_z_diff)) deeper_minima.push(minimum)
                    else minima_at_similar_height.push(minimum)
                })

                const minima_to_remove = deeper_minima.length ? minima_at_similar_height : minima_at_similar_height.slice(1)
                if (!minima_to_remove.length) return
                const minimum_to_keep = deeper_minima.length ? deeper_minima[0] : minima_at_similar_height[0]

                minima_to_remove.forEach(minimum =>
                {
                    minimum.member_indices!.forEach(index =>
                    {
                        const member_vertex = sorted_vertices[index]
                        member_vertex.watershed_ids.delete(minimum.watershed_id!)
                        if (minimum_to_keep.watershed_id === undefined) throw new Error(`minimum_to_keep.watershed_id is undefined`)
                        member_vertex.watershed_ids.add(minimum_to_keep.watershed_id!)
                    })

                    minimum_to_keep.member_indices = minimum_to_keep.member_indices!.concat(minimum.member_indices!)
                    minimum.member_indices = undefined
                    minimum.watershed_id = undefined
                })
            }
        }
        else
        {
            // If the vertex is not connected to any local minimum then create a
            // new minimum from it.
            vertex.watershed_id = next_watershed_id++
            vertex.watershed_ids = new Set([vertex.watershed_id])
            vertex.member_indices = [sorted_vertices_index]
            minima.push(vertex)
        }
    })

    // Remove minima which were merged into other minima
    const unique_minima = minima.filter(minimum => minimum.watershed_id !== undefined)

    const grouped_vertices: GroupedVertex[] = vertices.map(vertex =>
    {
        const grouped_vertex: GroupedVertex ={
            z: vertex.z,
            watershed_ids: vertex.watershed_ids,
            watershed_id: vertex.watershed_id,
        }

        return grouped_vertex
    })

    return {
        input_width: data.width,
        input_height: data.height,
        vertices: grouped_vertices,
        watershed_count: unique_minima.length,
    }
}


function normalise_watershed_ids(watersheds: Watersheds)
{
    const watershed_id_map = new Map<number, number>()

    const minima = get_minima_from_vertices(watersheds.vertices)
    minima.forEach((minimum, index) =>
    {
        watershed_id_map.set(minimum.watershed_id!, index)
        minimum.watershed_id = index
    })

    watersheds.vertices.forEach(vertex =>
    {
        const mapped_watershed_ids = Array.from(vertex.watershed_ids).map(watershed_id =>
        {
            return watershed_id_map.get(watershed_id)!
        })

        vertex.watershed_ids = new Set(mapped_watershed_ids.sort())
    })
}


export function get_minima_from_vertices(vertices: GroupedVertex[], sorted = true): (GroupedVertex & WatershedMinimum)[]
{
    const minima = vertices.filter(is_watershed_minimum)
    if (sorted) minima.sort((a, b) => a.z - b.z)
    return minima
}


export type GetWatershedMinimumById = (watershed_id: number) => (GroupedVertex & WatershedMinimum)
export function factory_get_watershed_minimum_by_id_from_vertices(vertices: GroupedVertex[]): GetWatershedMinimumById
{
    const minima = get_minima_from_vertices(vertices)
    const map_watershed_id_to_minima: {[id: number]: (GroupedVertex & WatershedMinimum)} = {}
    minima.forEach(m => map_watershed_id_to_minima[m.watershed_id] = m)

    return (watershed_id: number) => map_watershed_id_to_minima[watershed_id]
}


export function factory_get_minimum_for_vertex(vertices: GroupedVertex[], lowest_minimum: boolean = true): (vertex: GroupedVertex) => (GroupedVertex & WatershedMinimum)
{
    const get_watershed_minimum_by_id = factory_get_watershed_minimum_by_id_from_vertices(vertices)

    return (vertex: GroupedVertex) =>
    {
        const watershed_id = lowest_minimum ? Math.min(...vertex.watershed_ids) : Math.max(...vertex.watershed_ids)
        const minimum = get_watershed_minimum_by_id(watershed_id)

        return minimum
    }
}
