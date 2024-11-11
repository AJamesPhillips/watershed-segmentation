
import { WatershedInputData } from "./interfaces"

export function fixture_input_data_1 (): WatershedInputData
{
    const image_data: WatershedInputData = {
        image_data: new Uint8ClampedArray([
            0, 0, 0,
            0, 1, 1,
            0, 1, 0,
        ]),
        width: 3,
        height: 3
    }

    return image_data
}


export function fixture_input_data_2 (): WatershedInputData
{
    const image_data: WatershedInputData = {
        image_data: new Uint8ClampedArray([
            1, 0, 0, 0, 0,
            0, 0, 2, 2, 2,
            1, 0, 2, 1, 2,
            1, 0, 2, 2, 2,
            1, 0, 1, 0, 0,
            1, 0, 0, 0, 0,
        ]),
        width: 5,
        height: 6
    }

    return image_data
}


export function fixture_input_data_3 (): WatershedInputData
{
    const image_data: WatershedInputData = {
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

    return image_data
}
