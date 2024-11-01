import { WatershedData } from "./interfaces"
import { iterate_2d_data } from "./iterate_2d_data"
import { draw_group_colours_onto_canvas } from "./plotting"
import { construct_watershed, DEFAULT_MAX_Z_DIFF, load_image_and_extract_data } from "./watershed"


if (typeof document !== "undefined")
{
    interface ShowWatershedFromImageArgs
    {
        canvas_el: HTMLCanvasElement
        image_url: string
        max_z_diff?: number
        magnify?: number
        colour_size?: number
    }
    async function show_watershed_from_image(args: ShowWatershedFromImageArgs) //: Promise<Watershed>
    {
        const {
            canvas_el,
            image_url,
            max_z_diff = DEFAULT_MAX_Z_DIFF,
            magnify = 1,
            colour_size = 0.9,
        } = args

        const data = await load_image_and_extract_data(canvas_el, image_url, magnify)
        const watershed = construct_watershed(data, max_z_diff)

        const context = canvas_el.getContext("2d")!
        draw_group_colours_onto_canvas({
            watershed,
            data,
            context,
            magnify: magnify < 1 ? 1 / magnify : magnify,
            colour_size,
        })
    }


    async function show_watershed_from_data(canvas_el: HTMLCanvasElement, data: WatershedData, max_z_diff: number = DEFAULT_MAX_Z_DIFF, magnify: number = 50) //: Promise<Watershed>
    {
        const context = canvas_el.getContext("2d")!

        // draw greyscale image
        iterate_2d_data<number>(data as any, (x, y, z) =>
        {
            // draw a pixel at x, y with greyscale intensity of z
            context.fillStyle = `rgb(${z}, ${z}, ${z})`
            context.fillRect(x*magnify, y*magnify, magnify, magnify)
            context.fillRect((x + data.width)*magnify, y*magnify, magnify, magnify)
        })

        const watershed = construct_watershed(data, max_z_diff)

        // draw_group_colours_onto_canvas(watershed, data, context, magnify)
        draw_group_colours_onto_canvas({
            watershed,
            data,
            context,
            magnify, // not sure if we need this: `magnify < 1 ? 1 / magnify : magnify,`
            colour_size: 1,
            colour_size_boundary: 0.5,
            x_offset_group_outlines: 0,
        })
    }


    const canvas_el1 = document.getElementById("canvas1") as HTMLCanvasElement
    // Shows demon_screenshot_1.png
    show_watershed_from_image({
        canvas_el: canvas_el1,
        image_url: "./input_dtm.png",
        max_z_diff: 2,
        magnify: Math.pow(2, -2),
        colour_size: 0.9,
    })

    const canvas_el2 = document.getElementById("canvas2") as HTMLCanvasElement
    show_watershed_from_image({
        canvas_el: canvas_el2,
        image_url: "./input_dtm2.png",
        max_z_diff: 2,
        magnify: Math.pow(2, -2),
        colour_size: 0.9,
    })

    const image_data: WatershedData = {
        image_data: new Uint8ClampedArray([
            1, 0, 2, 2, 1,
            0, 1, 2, 2, 2,
            1, 2, 2, 0, 2,
            1, 2, 2, 2, 2,
            1, 0, 2, 2, 2,
            1, 0, 2, 2, 1,
        ]),
        width: 5,
        height: 6
    }
    image_data.image_data.forEach((z, i) => image_data.image_data[i] = z * 100)
    // Shows demo_screenshot_2.png
    const canvas_el3 = document.getElementById("canvas3") as HTMLCanvasElement
    show_watershed_from_data(canvas_el3, image_data)

    // Shows effect of max_z_diff
    const canvas_el4 = document.getElementById("canvas4") as HTMLCanvasElement
    show_watershed_from_data(canvas_el4, image_data, 100)
}