
import { GroupedVertex, Watershed } from "./interfaces"
import {
    fixture_input_data_1,
    fixture_input_data_2,
    fixture_input_data_3,
} from "./test_fixtures"
import {
    construct_watershed,
}  from "./watershed"


describe("watershed_segmentation", () =>
{
    function simplify_watershed_vertices (watershed: Watershed): string[]
    {
        const return_rows: string[] = []
        let current_row: string[] = []

        function to_row_string (vertex: GroupedVertex): string
        {
            let row_string = ""
            for (let i = 0; i < watershed.area_count; i++)
            {
                const is_minima = vertex.minimum_id !== undefined ? "*" : " "
                row_string += vertex.group_ids.has(i) ? `${is_minima}${i}` : "  "
            }
            return row_string
        }

        watershed.vertices.map((vertex, i) =>
        {
            current_row.push(to_row_string(vertex))
            if (i % watershed.width === watershed.width - 1)
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
        const watershed = construct_watershed(image_data)
        expect(watershed.area_count).toBe(2)
        const simplified = simplify_watershed_vertices(watershed)
        expect(simplified).toStrictEqual([
            "*0  | 0  | 0  ",
            " 0  | 0 1| 0 1",
            " 0  | 0 1|  *1",
        ])
    })

    test("test fixture 2", () =>
    {
        const image_data = fixture_input_data_2()
        const watershed = construct_watershed(image_data)
        expect(watershed.area_count).toBe(2)
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
        const watershed = construct_watershed(image_data)
        expect(watershed.area_count).toBe(5)
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
        const watershed = construct_watershed(image_data, 1)
        expect(watershed.area_count).toBe(2)
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
})
