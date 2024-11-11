import { Watersheds, WatershedInputData } from "./interfaces"
import { iterate_2d_data } from "./iterate_2d_data"


interface DrawWatershedColoursOntoCanvasArgs
{
    watershed: Watersheds
    data: WatershedInputData
    context: CanvasRenderingContext2D
    magnify: number
    // 1 to 0 where 0 means nothing will be shown, and 1 means
    // the colour of each pixel will fill the whole pixel.
    colour_size?: number
    colour_size_boundary?: number

    x_offset_watershed_outlines?: number
}
export function draw_watershed_colours_onto_canvas(args: DrawWatershedColoursOntoCanvasArgs)
{
    const {
        watershed,
        data,
        context,
        magnify,
        colour_size = 1,
        colour_size_boundary = 1,
    } = args
    let x_offset_watershed_outlines = args.x_offset_watershed_outlines ?? (data.width * magnify)

    fill_watershed_area({
        watershed,
        data,
        context,
        magnify,
        colour_size,
    })
    outline_watershed_area({
        watershed,
        data,
        context,
        magnify,
        colour_size: colour_size_boundary,
        offset_x: x_offset_watershed_outlines,
    })
    mark_watershed_minimum({
        watershed,
        data,
        context,
        magnify,
    })
}


interface FillWatershedAreaArgs
{
    watershed: Watersheds
    data: WatershedInputData
    context: CanvasRenderingContext2D
    magnify: number
    colour_size: number
}
function fill_watershed_area(args: FillWatershedAreaArgs)
{
    const {
        watershed,
        data,
        context,
        magnify,
        colour_size,
    } = args

    const border = (1 - colour_size) * 0.5

    iterate_2d_data({ image_data: watershed.vertices, width: data.width, height: data.height }, (x, y, element) =>
    {
        const { watershed_ids } = element
        if (watershed_ids.size === 1)
        {
            context.fillStyle = color_for_watershed_id(Array.from(watershed_ids)[0], watershed.watershed_count)
            context.fillRect((x + border) * magnify, (y + border) * magnify, (magnify * colour_size), (magnify * colour_size))
        }
    })
}


interface OutlineWatershedAreaArgs
{
    watershed: Watersheds
    data: WatershedInputData
    context: CanvasRenderingContext2D
    magnify: number
    colour_size: number
    offset_x: number
}
function outline_watershed_area(args: OutlineWatershedAreaArgs)
{
    const {
        watershed,
        data,
        context,
        magnify,
        colour_size,
        offset_x,
    } = args
    const border = (1 - colour_size) * 0.5

    iterate_2d_data({ image_data: watershed.vertices, width: data.width, height: data.height }, (x, y, element) =>
    {
        const { watershed_ids } = element
        if (watershed_ids.size > 1)
        {
            const group_count = watershed_ids.size
            const group_width = (magnify / group_count) * colour_size
            Array.from(watershed_ids).forEach((watershed_id, group_index) => {
                context.fillStyle = color_for_watershed_id(watershed_id, watershed.watershed_count)
                context.fillRect(offset_x + ((x + border) * magnify) + (group_width * group_index), (y + border) * magnify, group_width, magnify * colour_size)
            })
        }
    })
}


interface MarkWatershedMinimumArgs
{
    watershed: Watersheds
    data: WatershedInputData
    context: CanvasRenderingContext2D
    magnify: number
}
function mark_watershed_minimum (args: MarkWatershedMinimumArgs)
{
    const { watershed, data, context, magnify } = args

    iterate_2d_data({ image_data: watershed.vertices, width: data.width, height: data.height }, (x, y, element) =>
    {
        if (element.minimum_id === undefined) return

        context.fillStyle = "rgba(0, 0, 0, 0.5)"
        const size = 2
        context.fillStyle = "rgba(1, 1, 1, 1)"
        context.fillRect(((x + 0.5)*magnify) - size, ((y + 0.5)*magnify)-size, size*2, size*2)
        // // set colour of stroke for the rectangle to white
        // context.strokeStyle = "rgba(255, 255, 255, 1)"
        // context.lineWidth = 1
        // context.strokeRect(x*magnify, y*magnify, size*2, size*2)
    })
}


function color_for_watershed_id(watershed_id: number, total_watersheds: number): string
{
    return `hsla(${(watershed_id / total_watersheds) * 360}, 100%, 50%, 50%)`
}
