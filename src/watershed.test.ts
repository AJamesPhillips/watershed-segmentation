
import { LineArea, WatershedData } from "./interfaces"
import {
    condense_local_minima_candidate_lines,
    convert_minima_lines_to_vertices,
    get_local_minima_candidate_lines_from_image_data,
    watershed_segmentation,
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


// describe("get_local_minima_candidate_lines_from_image_data", () =>
// {

//     function simplify_lines (lines: LineArea[][]): { start_x: number, end_x: number }[][]
//     {
//         return lines.map((row_lines, y) =>
//         {
//             return row_lines.map(row_line =>
//             {
//                 if (row_line.start.y !== y || row_line.end.y !== y)
//                 {
//                     throw new Error(`Invalid line: ${JSON.stringify(row_line)}`)
//                 }

//                 return {
//                     start_x: row_line.start.x,
//                     end_x: row_line.end.x,
//                 }
//             })
//         })
//     }

//     test("test fixture 1", () => {
//         let result = get_local_minima_candidate_lines_from_image_data(fixture_image_2())
//         let simplified = simplify_lines(result)
//         expect(simplified).toStrictEqual([
//             [{ start_x: 1, end_x: 4 }],
//             [{ start_x: 0, end_x: 1 }],
//             [{ start_x: 1, end_x: 1 }, { start_x: 3, end_x: 3 }],
//             [{ start_x: 1, end_x: 1 }],
//             [{ start_x: 1, end_x: 1 }, { start_x: 3, end_x: 4 }],
//             [{ start_x: 1, end_x: 4 }],
//         ])
//     })
// })


// describe("condense_local_minima_candidate_lines", () =>
// {
//     function simplify_lines (lines: LineArea[][]): { start_x: number, end_x: number }[][]
//     {
//         return lines.map((row_lines, y) =>
//         {
//             return row_lines.map(row_line =>
//             {
//                 if (row_line.start.y !== y || row_line.end.y !== y)
//                 {
//                     throw new Error(`Invalid line: ${JSON.stringify(row_line)}`)
//                 }

//                 return {
//                     start_x: row_line.start.x,
//                     end_x: row_line.end.x,
//                     area: row_line.total_area,
//                 }
//             })
//         })
//     }

//     test("test fixture 1", () => {
//         const lines = get_local_minima_candidate_lines_from_image_data(fixture_image_2())
//         let result = condense_local_minima_candidate_lines(lines)
//         let simplified = simplify_lines(result)
//         expect(simplified).toStrictEqual([
//             [],
//             [],
//             [{ start_x: 3, end_x: 3, area: 1 }],
//             [],
//             [],
//             [{ start_x: 1, end_x: 4, area: 15 }],
//         ])
//     })
// })


// describe("convert_minima_lines_to_vertices", () =>
// {
//     const lines = get_local_minima_candidate_lines_from_image_data(fixture_image_2())
//     const condensed_lines = condense_local_minima_candidate_lines(lines)

//     test("test with minimum_minima_area of 1", () =>
//     {
//         const vertices = convert_minima_lines_to_vertices(condensed_lines, 1)
//         expect(vertices).toStrictEqual([
//             { x: 3, y: 2, z: 1 },
//             { x: 1, y: 5, z: 0 },
//         ])
//     })

//     test("test with minimum_minima_area of 2", () =>
//     {
//         const vertices = convert_minima_lines_to_vertices(condensed_lines, 2)
//         expect(vertices).toStrictEqual([
//             { x: 1, y: 5, z: 0 },
//         ])
//     })
// })


describe("watershed_segmentation", () =>
{
    function simplify_watershed_vertices (vertices: { z: number, group_ids: number[] }[]): number[][]
    {
        return vertices.map(vertex =>
        {
            return vertex.group_ids
        })
    }

    test("test fixture 1", () =>
    {
        const image_data = fixture_image_1()
        const watershed = watershed_segmentation(image_data)
        const simplified = simplify_watershed_vertices(watershed.vertices)
        expect(watershed.area_count).toBe(2)
        expect(simplified).toStrictEqual([
            [0],    [0],    [0],
            [0], [0, 1], [0, 1],
            [0], [0, 1],    [1],
        ])
    })

    // test("test fixture 2", () =>
    // {
    //     const image_data = fixture_image_2()
    //     const watershed = watershed_segmentation(image_data)
    //     const simplified = simplify_watershed_vertices(watershed.vertices)
    //     expect(watershed.area_count).toBe(2)
    //     expect(simplified).toStrictEqual([
    //         [0],    [0],    [0],    [0],    [0],
    //         [0],    [0], [0, 2], [0, 2], [0, 2],
    //         [0],    [0], [0, 2],    [2], [0, 2],
    //         [0],    [0], [0, 2], [0, 2], [0, 2],
    //         [0],    [0],    [0],    [0],    [0],
    //         [0],    [0],    [0],    [0],    [0],
    //     ])
    // })

    // test("test fixture 3", () =>
    // {
    //     const image_data = fixture_image_3()
    //     const watershed = watershed_segmentation(image_data)
    //     const simplified = simplify_watershed_vertices(watershed.vertices)
    //     expect(watershed.area_count).toBe(5)
    //     console.log(simplified)
    //     expect(simplified).toStrictEqual([
    //         [0],    [0],       [0], [0, 2],    [2],
    //         [0],    [0], [0, 2, 3], [0, 2], [0, 2],
    //         [0],    [0],    [0, 2],    [2], [0, 2],
    //         [0],    [0],    [0, 2], [0, 2], [0, 2],
    //         [0],    [0],       [0],    [0],    [0],
    //         [0],    [0],       [0],    [0],    [0],
    //     ])
    // })
})

// [ 0 ],
// [ 0 ],             [ 0, 2, 3 ],
// [ 0, 2, 3 ],       [ 0, 2, 3 ],
// [ 0 ],             [ 0, 1, 2, 3 ],
// [ 0, 1, 2, 3 ],    [ 3 ],
// [ 0, 2, 3 ],       [ 0, 1 ],
// [ 0, 1, 2, 3 ],    [ 0, 1, 2, 3 ],
// [ 0, 1, 2, 3 ],    [ 0, 1, 2, 3 ],
// [ 0, 1 ],          [ 1 ],
// [ 0, 1, 2, 3 ],    [ 0, 1, 2, 3, 4 ],
// [ 0, 1, 2, 3, 4 ], [ 0, 1 ],
// [ 1 ],             [ 0, 1, 2, 3, 4 ],
// [ 0, 1, 2, 3, 4 ], [ 4 ]

const a = [
    1, 0, 2, 2, 1,
    0, 1, 2, 2, 2,
    1, 2, 2, 1, 2,
    1, 2, 2, 2, 2,
    1, 0, 2, 2, 2,
    1, 0, 2, 2, 1,
]