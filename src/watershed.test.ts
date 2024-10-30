
import { WatershedData } from "./interfaces"
import {
    construct_watershed,
}  from "./watershed"



function fixture_image_1 (): WatershedData
{
    const image_data: WatershedData = {
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


function fixture_image_2 (): WatershedData
{
    const image_data: WatershedData = {
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


function fixture_image_3 (): WatershedData
{
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

    return image_data
}


describe("watershed_segmentation", () =>
{
    function simplify_watershed_vertices (vertices: { z: number, group_ids: Set<number> }[]): number[][]
    {
        return vertices.map(vertex =>
        {
            return Array.from(vertex.group_ids)
        })
    }

    test("test fixture 1", () =>
    {
        const image_data = fixture_image_1()
        const watershed = construct_watershed(image_data)
        const simplified = simplify_watershed_vertices(watershed.vertices)
        expect(watershed.area_count).toBe(2)
        expect(simplified).toStrictEqual([
            [0],    [0],    [0],
            [0], [0, 1], [0, 1],
            [0], [0, 1],    [1],
        ])
    })

    test("test fixture 2", () =>
    {
        const image_data = fixture_image_2()
        const watershed = construct_watershed(image_data)
        const simplified = simplify_watershed_vertices(watershed.vertices)
        expect(watershed.area_count).toBe(2)
        expect(simplified).toStrictEqual([
            [0],    [0],    [0],    [0],    [0],
            [0],    [0], [0, 1], [0, 1], [0, 1],
            [0],    [0], [0, 1],    [1],    [1],
            [0],    [0], [0, 1], [0, 1], [0, 1],
            [0],    [0],    [0],    [0],    [0],
            [0],    [0],    [0],    [0],    [0],
        ])
    })

    test("test fixture 3", () =>
    {
        const image_data = fixture_image_3()
        const watershed = construct_watershed(image_data)
        const simplified = simplify_watershed_vertices(watershed.vertices)
        expect(watershed.area_count).toBe(5)
        expect(simplified).toStrictEqual([

               [0],    [0],       [0],    [0, 2],       [2],
               [0],    [0],    [0, 3], [0, 2, 3],    [2, 3],
               [0],    [0],    [0, 3],       [3],       [3],
            [0, 1], [0, 1], [0, 1, 3],       [3],       [3],
               [1],    [1],    [1, 3],    [3, 4],    [3, 4],
               [1],    [1],       [1],    [1, 4],       [4],
        ])
    })

    test("test max_z_diff of 1", () =>
        {
            const image_data = fixture_image_3()
            image_data.image_data[3 + (2 * 5)] = 0 // set pixel at x 3, y 2, to 0
            const watershed = construct_watershed(image_data, 1)
            const simplified = simplify_watershed_vertices(watershed.vertices)
            expect(watershed.area_count).toBe(2)
            expect(simplified).toStrictEqual([

                   [0],    [0],    [0],    [0],    [0],
                   [0],    [0], [0, 1], [0, 1], [0, 1],
                   [0],    [0], [0, 1],    [1],    [1],
                   [0],    [0], [0, 1],    [1],    [1],
                   [0],    [0], [0, 1],    [1],    [1],
                   [0],    [0], [0, 1],    [1],    [1],
            ])
        })
})
