import { Watersheds, WatershedInputData } from "./interfaces"
import { iterate_2d_data } from "./iterate_2d_data"


interface DrawGroupColoursOntoCanvasArgs
{
    watershed: Watersheds
    data: WatershedInputData
    context: CanvasRenderingContext2D
    magnify: number
    // 1 to 0 where 0 means nothing will be shown, and 1 means
    // the colour of each pixel will fill the whole pixel.
    colour_size?: number
    colour_size_boundary?: number

    x_offset_group_outlines?: number
}
export function draw_group_colours_onto_canvas(args: DrawGroupColoursOntoCanvasArgs)
{
    const {
        watershed,
        data,
        context,
        magnify,
        colour_size = 1,
        colour_size_boundary = 1,
    } = args
    let x_offset_group_outlines = args.x_offset_group_outlines ?? (data.width * magnify)

    fill_group_area({
        watershed,
        data,
        context,
        magnify,
        colour_size,
    })
    outline_group_area({
        watershed,
        data,
        context,
        magnify,
        colour_size: colour_size_boundary,
        offset_x: x_offset_group_outlines,
    })
    mark_group_minimum({
        watershed,
        data,
        context,
        magnify,
    })
}


interface FillGroupAreaArgs
{
    watershed: Watersheds
    data: WatershedInputData
    context: CanvasRenderingContext2D
    magnify: number
    colour_size: number
}
function fill_group_area(args: FillGroupAreaArgs)
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
            context.fillStyle = color_for_group_id(Array.from(watershed_ids)[0], watershed.watershed_count)
            context.fillRect((x + border) * magnify, (y + border) * magnify, (magnify * colour_size), (magnify * colour_size))
        }
    })
}


interface OutlineGroupAreaArgs
{
    watershed: Watersheds
    data: WatershedInputData
    context: CanvasRenderingContext2D
    magnify: number
    colour_size: number
    offset_x: number
}
function outline_group_area(args: OutlineGroupAreaArgs)
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
            Array.from(watershed_ids).forEach((group_id, group_index) => {
                context.fillStyle = color_for_group_id(group_id, watershed.watershed_count)
                context.fillRect(offset_x + ((x + border) * magnify) + (group_width * group_index), (y + border) * magnify, group_width, magnify * colour_size)
            })
        }
    })
}


interface MarkGroupMinimumArgs
{
    watershed: Watersheds
    data: WatershedInputData
    context: CanvasRenderingContext2D
    magnify: number
}
function mark_group_minimum (args: MarkGroupMinimumArgs)
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


function color_for_group_id(group_id: number, total_groups: number): string
{
    return `hsla(${(group_id / total_groups) * 360}, 100%, 50%, 50%)`
}
