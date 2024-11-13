
import { GroupedVertex, WatershedInputData, Watersheds } from "./interfaces"
import {
    fixture_input_data_1,
    fixture_input_data_1b,
    fixture_input_data_2,
    fixture_input_data_3,
} from "./test_fixtures"
import {
    construct_watersheds,
    factory_get_watershed_minimum_by_id_from_vertices,
    factory_get_minimum_for_vertex,
}  from "./watersheds"


describe("watershed functions", () =>
{
    const image_data = fixture_input_data_1()
    const watershed = construct_watersheds(image_data)

    test("construct_watersheds", () =>
    {
        expect(watershed.input_width).toBe(3)
        expect(watershed.input_height).toBe(3)
        expect(watershed.vertices.length).toBe(9)
        expect(watershed.watershed_count).toBe(2)
    })

    test("factory_get_watershed_minimum_by_id_from_vertices", () =>
    {
        const get_watershed_minimum_by_id = factory_get_watershed_minimum_by_id_from_vertices(watershed.vertices)
        expect(get_watershed_minimum_by_id(0)).toBe(watershed.vertices[0])
        expect(get_watershed_minimum_by_id(1)).toBe(watershed.vertices[8])
    })

    test("factory_get_minimum_for_vertex", () =>
    {
        const get_minimum_for_vertex = factory_get_minimum_for_vertex(watershed.vertices)
        const vertex = watershed.vertices[4]
        // This test is here as a reminder that this vertex should belong to
        // both watershed areas / minimums
        expect(vertex.watershed_ids).toStrictEqual(new Set([0, 1]))
        // Should be the lowest minimum
        expect(get_minimum_for_vertex(vertex)).toBe(watershed.vertices[0])
    })

    test("factory_get_minimum_for_vertex highest minimum", () =>
    {
        const get_minimum_for_vertex = factory_get_minimum_for_vertex(watershed.vertices, false)
        const vertex = watershed.vertices[4]
        // This test is here as a reminder that this vertex should belong to
        // both watershed areas / minimums
        expect(vertex.watershed_ids).toStrictEqual(new Set([0, 1]))
        // Should be the highest minimum
        expect(get_minimum_for_vertex(vertex)).toBe(watershed.vertices[8])
    })
})


describe("watershed_segmentation", () =>
{
    function simplify_watershed_vertices (watershed: Watersheds): string[]
    {
        const return_rows: string[] = []
        let current_row: string[] = []

        function to_row_string (vertex: GroupedVertex): string
        {
            let row_string = ""
            for (let i = 0; i < watershed.watershed_count; i++)
            {
                const is_minima = vertex.watershed_id !== undefined ? "*" : " "
                row_string += vertex.watershed_ids.has(i) ? `${is_minima}${i}` : "  "
            }
            return row_string
        }

        watershed.vertices.map((vertex, i) =>
        {
            current_row.push(to_row_string(vertex))
            if (i % watershed.input_width === watershed.input_width - 1)
            {
                return_rows.push(current_row.join("|"))
                current_row = []
            }
        })

        return return_rows
    }


    test("test fixture 1", () =>
    {
        const image_data = fixture_input_data_1()
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(2)
        const simplified = simplify_watershed_vertices(watershed)
        expect(simplified).toStrictEqual([
            "*0  | 0  | 0  ",
            " 0  | 0 1| 0 1",
            " 0  | 0 1|  *1",
        ])
    })

    test("test fixture 1b", () =>
    {
        const image_data = fixture_input_data_1b()
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(2)
        const simplified = simplify_watershed_vertices(watershed)
        expect(simplified).toStrictEqual([
            " 0  | 0  | 0 1|   1",
            " 0  |*0  | 0 1|  *1",
            " 0  | 0  | 0 1|   1",
        ])
    })

    test("test fixture 2", () =>
    {
        const image_data = fixture_input_data_2()
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(2)
        const simplified = simplify_watershed_vertices(watershed)
        expect(simplified).toStrictEqual([
            " 0  |*0  | 0  | 0  | 0  ",
            " 0  | 0  | 0 1| 0 1| 0 1",
            " 0  | 0  | 0 1|  *1|   1",
            " 0  | 0  | 0 1| 0 1| 0 1",
            " 0  | 0  | 0  | 0  | 0  ",
            " 0  | 0  | 0  | 0  | 0  ",
        ])
    })

    test("test fixture 3", () =>
    {
        const image_data = fixture_input_data_3()
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(5)
        const simplified = simplify_watershed_vertices(watershed)
        expect(simplified).toStrictEqual([
            " 0        |*0        | 0        | 0   2    |    *2    ",
            " 0        | 0        | 0     3  | 0   2 3  |     2 3  ",
            " 0        | 0        | 0     3  |      *3  |       3  ",
            " 0 1      | 0 1      | 0 1   3  |       3  |       3  ",
            "   1      |  *1      |   1   3  |       3 4|       3 4",
            "   1      |   1      |   1      |   1     4|        *4",
        ])
    })

    test("test max_z_diff of 1", () =>
    {
        const image_data = fixture_input_data_3()
        image_data.image_data[3 + (2 * 5)] = 0 // set pixel at x 3, y 2, to 0
        const watershed = construct_watersheds(image_data, 1)
        expect(watershed.watershed_count).toBe(2)
        const simplified = simplify_watershed_vertices(watershed)
        expect(simplified).toStrictEqual([
            " 0  |*0  | 0  | 0  | 0  ",
            " 0  | 0  | 0 1| 0 1| 0 1",
            " 0  | 0  | 0 1|  *1|   1",
            " 0  | 0  | 0 1|   1|   1",
            " 0  | 0  | 0 1|   1|   1",
            " 0  | 0  | 0 1|   1|   1",
        ])
    })

    test("flattens negative numbers", () =>
    {
        const image_data: WatershedInputData = {
            image_data: new Uint8ClampedArray([
                0, -1, 0, -1, 0
            ]),
            width: 5,
            height: 1
        }
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(1)
        const simplified = simplify_watershed_vertices(watershed)
        expect(simplified).toStrictEqual([
            "*0| 0| 0| 0| 0",
        ])
    })
})
