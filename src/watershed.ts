import { WatershedData, Watershed, Vertex, LineArea } from "./interfaces"


export async function get_watershed_from_image(canvas_el: HTMLCanvasElement, img_url: string, minimum_minima_area: number = 20) //: Promise<Watershed>
{
    const data = await load_image_and_extract_data(canvas_el, img_url)
    const watershed = construct_watershed(data, minimum_minima_area)

    const context = canvas_el.getContext("2d")!
    watershed.areas.forEach(area =>
    {
        context.fillStyle = "rgba(255, 0, 0, 0.5)"
        context.beginPath()
        area.vertices.forEach((vertex, i) =>
        {
            if (i === 0)
            {
                context.moveTo(vertex.x, vertex.y)
            }
            else
            {
                context.lineTo(vertex.x, vertex.y)
            }
        })
        context.closePath()
        context.fill()
    })
}


async function load_image_and_extract_data(canvas_el: HTMLCanvasElement, img_url: string): Promise<WatershedData>
{
    const img = await load_image(img_url)
    return extract_image_data(canvas_el, img)
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


function extract_image_data(canvas_el: HTMLCanvasElement, image: HTMLImageElement, warn_if_not_grayscale: boolean = true): WatershedData
{
    const context = canvas_el.getContext("2d")!

    // Get image width and height
    canvas_el.width = image.width
    canvas_el.height = image.height

    context.drawImage(image, 0, 0)
    const img = context.getImageData(0, 0, canvas_el.width, canvas_el.height)

    const len = img.data.length / 4
    const image_data = new Uint8ClampedArray(len)

    for (var i = 0; i < len; i++)
    {
        image_data[i] = img.data[4 * i]

        if (warn_if_not_grayscale && (img.data[4 * i + 1] !== img.data[4 * i] || (img.data[4 * i + 2] !== img.data[4 * i])))
        {
            console.warn("Image data is not grayscale. Only the red channel is being used.")
            warn_if_not_grayscale = false
        }
    }

    return {
        image_data,
        width: canvas_el.width,
        height: canvas_el.height
    }
}


function construct_watershed(data: WatershedData, minimum_minima_area: number): Watershed
{
    const local_minima_candidate_lines = get_local_minima_candidate_lines_from_image_data(data)
    const condensed_lines = condense_local_minima_candidate_lines(local_minima_candidate_lines)
    const local_minima = convert_minima_lines_to_vertices(condensed_lines, minimum_minima_area)
    const watershed = watershed_segmentation(data)//, local_minima)

    return watershed
}


function iterate_image_data(data: WatershedData, iterator: (x: number, y: number, z: number) => void)
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


function factor_get_pixel_value(data: WatershedData)
{
    const { image_data, width, height } = data

    function get_pixel_value(x: number, y: number): number | null
    {
        if (x < 0 || x >= width || y < 0 || y >= height)
        {
            return null
        }

        return image_data[y * width + x]
    }

    return get_pixel_value
}


export function get_local_minima_candidate_lines_from_image_data(data: WatershedData): LineArea[][]
{
    const { image_data, width, height } = data

    const local_minima_candidate_lines: LineArea[][] = Array(height).fill(null).map(() => [])
    const get_pixel_value = factor_get_pixel_value(data)

    let last_vertex_on_same_line: Vertex | null = null
    let start_line: Vertex | null = null

    iterate_image_data(data, (x, y, z) =>
    {
        const vertex = { x, y, z }

        // Check 8 neighbors
        const neighbors = [
            get_pixel_value(x - 1, y - 1), // top-left
            get_pixel_value(x, y - 1),     // top
            get_pixel_value(x + 1, y - 1), // top-right
            get_pixel_value(x - 1, y),     // left
            get_pixel_value(x + 1, y),     // right
            get_pixel_value(x - 1, y + 1), // bottom-left
            get_pixel_value(x, y + 1),     // bottom
            get_pixel_value(x + 1, y + 1)  // bottom-right
        ]

        const potential_local_minima = neighbors.every(neighbor => neighbor === null || neighbor >= z)
        const got_to_end_of_row = x === width - 1

        // const debug_log_condition = y == 2
        // debug_log_condition && console.log(x, "potential_local_minima", potential_local_minima, "got_to_end_of_row", got_to_end_of_row, start_line, last_vertex_on_same_line)

        if (!start_line && potential_local_minima)
        {
            // debug_log_condition && console.log("set start_line")
            start_line = vertex
        }
        else if (!potential_local_minima && start_line && last_vertex_on_same_line)
        {
            const new_candidate_line: LineArea = {
                start: start_line,
                end: last_vertex_on_same_line,
                total_area: last_vertex_on_same_line.x - start_line.x + 1,
            }
            local_minima_candidate_lines[y].push(new_candidate_line)
            // debug_log_condition && console.log("add new_candidate_line when !potential_local_minima", new_candidate_line)

            start_line = null
        }
        else if (got_to_end_of_row && start_line)
        {
            const new_candidate_line: LineArea = {
                start: start_line,
                end: vertex,
                total_area: vertex.x - start_line.x + 1,
            }
            local_minima_candidate_lines[y].push(new_candidate_line)
            // debug_log_condition && console.log("add new_candidate_line when got_to_end_of_row", new_candidate_line)

            start_line = null
        }

        last_vertex_on_same_line = vertex
        if (got_to_end_of_row)
        {
            start_line = null
            last_vertex_on_same_line = null
        }
    })

    return local_minima_candidate_lines
}


export function condense_local_minima_candidate_lines(lines: LineArea[][]): LineArea[][]
{
    const cloned_lines = JSON.parse(JSON.stringify(lines)) as LineArea[][]

    cloned_lines.forEach((current_row_lines, y) =>
    {
        if (y === 0) return

        current_row_lines.forEach(new_candidate_line =>
        {
            // Check if the previous row has any lines which overlap with
            // this line, and if so, remove them from the previous row
            const previous_row_lines = cloned_lines[y - 1]
            for (let j = 0; j < previous_row_lines.length; ++j)
            {
                const previous_line = previous_row_lines[j]
                if (previous_line.start.x <= new_candidate_line.end.x && previous_line.end.x >= new_candidate_line.start.x)
                {
                    new_candidate_line.total_area += previous_line.total_area
                    previous_row_lines.splice(j, 1)
                    j--
                }
            }
        })
    })

    return cloned_lines
}


export function convert_minima_lines_to_vertices(local_minima_lines: LineArea[][], minimum_minima_area: number): Vertex[]
{
    const local_minima: Vertex[] = []

    local_minima_lines.forEach((lines, y) =>
    {
        for (let i = 0; i < lines.length; ++i)
        {
            const line = lines[i]
            if (line.total_area >= minimum_minima_area)
            {
                local_minima.push(line.start)
            }
        }
    })

    return local_minima
}


export function watershed_segmentation(data: WatershedData): Watershed
{
    const get_pixel_value = factor_get_pixel_value(data)

    // // Convert into vertices
    // const vertices: Vertex[] = []
    // iterate_image_data(data, (x, y, z) =>
    // {
    //     vertices.push({ x, y, z })
    // })
    // // Order the vertices by z from lowest to highest
    // vertices.sort((a, b) => a.z - b.z)
    // // Then iterate through the vertices from lowest to highest
    // vertices.forEach(vertex =>
    // {
    //     // Assign each vertex to the nearest local minimum and if the vertex is not
    //     // connected to a local minimum then add it as a new local minimum
    //     // And if the vertex is connected to multiple local minima then set it as
    //     // a boundary vertex (i.e. infinite height)

    // })

    // iterate_image_data(data, (x, y, z) =>
    // {

    // })

    return { areas: [] }
}


if (typeof document !== "undefined")
{
    const canvas_el = document.getElementById("canvas") as HTMLCanvasElement
    get_watershed_from_image(canvas_el, "./input.png")
}


// export interface VertexOptions
// {
//     // This is implementation that does not factor in ground water level or
//     // ground water flow
//     w: number // water level
//     p: number // permeability of ground surface: 0 = impermeable, 1 = fully permeable (i.e. an "infinitely" large hole)
// }

// export interface Vertex extends VertexOptions
// {
//     x: number
//     y: number
//     z: number
// }

// export interface ConnectedVertex extends Vertex
// {
//     neighbours: number[]
// }

// export interface TerrainMesh
// {
//     vertices: ConnectedVertex[]
// }

