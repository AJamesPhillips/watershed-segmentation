import { WatershedData, Watershed, Vertex, GroupedVertex } from "./interfaces"
import { iterate_2d_data } from "./iterate_2d_data"


export const DEFAULT_MAX_Z_DIFF = 0

export async function get_watershed_from_image(canvas_el: HTMLCanvasElement, img_url: string, max_z_diff: number = DEFAULT_MAX_Z_DIFF): Promise<Watershed>
{
    const data = await load_image_and_extract_data(canvas_el, img_url)
    const watershed = construct_watershed(data, max_z_diff)

    return watershed
}


export async function load_image_and_extract_data(canvas_el: HTMLCanvasElement, img_url: string, magnify=1): Promise<WatershedData>
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
        for (var i = 0; i < image_width; ++i)
        {
            const index = (4 * i * magnify) + (4 * image_width * j * magnify * magnify)
            image_data[i + (image_width * j)] = img.data[index]
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


export function construct_watershed(data: WatershedData, max_z_diff: number = DEFAULT_MAX_Z_DIFF): Watershed
{
    const watershed = watershed_segmentation(data, max_z_diff)
    normalise_watershed_group_ids(watershed)

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


function watershed_segmentation(data: WatershedData, max_z_diff: number): Watershed
{
    let next_group_id = 0
    const minima: (GroupedVertex & Vertex)[] = []

    // Convert into vertices
    const vertices: (GroupedVertex & Vertex)[] = []
    iterate_2d_data<number>(data as any, (x, y, z) =>
    {
        vertices.push({ x, y, z, group_ids: new Set() })
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
        const single_group_ids = new Set<number>()
        // const multi_group_ids = new Set<number>()
        neighbours.forEach(neighbor =>
        {
            if (!neighbor) return  // Skip if neighbor is null
            if (neighbor.group_ids.size === 1) neighbor.group_ids.forEach(v => single_group_ids.add(v))
            // else neighbor.group_ids.forEach(group_id => multi_group_ids.add(group_id))
        })

        // If the vertex is connected to one or more local minimum then assign
        // it to those groups
        if (single_group_ids.size)
        {
            vertex.group_ids = single_group_ids
            const minima_this_vertex_is_connected_to = Array.from(vertex.group_ids).map(group_id =>
            {
                return minima[group_id]
            })

            minima_this_vertex_is_connected_to.forEach(minimum =>
            {
                minimum.member_indices!.push(sorted_vertices_index)
            })

            if (single_group_ids.size > 1)
            {
                // Check if we can merge these groups.

                // If there's only one minimum connected to this vertex then we
                // return early as we can't merge anything.
                if (minima_this_vertex_is_connected_to.length <= 1) return

                // The logic here is that
                // if this vertex is part of a group whose minima is at the same
                // level as this vertex (or within max_z_diff) then we know we
                // have not increased in height since the last minima because we
                // are moving from lowest to highest point, so that means it is
                // to merge the groups.
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
                        member_vertex.group_ids.delete(minimum.minimum_id!)
                        member_vertex.group_ids.add(minimum_to_keep.minimum_id!)
                    })

                    minimum_to_keep.member_indices = minimum_to_keep.member_indices!.concat(minimum.member_indices!)
                    minimum.member_indices = undefined
                    minimum.minimum_id = undefined
                })
            }
        }
        else
        {
            vertex.minimum_id = next_group_id++
            vertex.group_ids = new Set([vertex.minimum_id])
            vertex.member_indices = [sorted_vertices_index]
            minima.push(vertex)
        }
    })

    // Remove minima which were merged into other minima
    const unique_minima = minima.filter(minimum => minimum.minimum_id !== undefined)

    const grouped_vertices: GroupedVertex[] = vertices.map(vertex =>
    {
        return {
            z: vertex.z,
            group_ids: vertex.group_ids,
            minimum_id: vertex.minimum_id,
        }
    })

    return { vertices: grouped_vertices, area_count: unique_minima.length }
}


function normalise_watershed_group_ids(watershed: Watershed)
{
    const group_id_map = new Map<number, number>()

    const minima = watershed.vertices.filter(vertex => vertex.minimum_id !== undefined)
    minima.sort((a, b) => a.z - b.z)
    minima.forEach((minimum, index) =>
    {
        group_id_map.set(minimum.minimum_id!, index)
    })

    watershed.vertices.forEach(vertex =>
    {
        const mapped_group_ids = Array.from(vertex.group_ids).map(group_id =>
        {
            return group_id_map.get(group_id)!
        })

        vertex.group_ids = new Set(mapped_group_ids.sort())
    })
}
