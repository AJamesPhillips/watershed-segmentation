
import { GroupedVertex, Vertex, Watersheds } from "../interfaces"
import {
    fixture_input_data_1b,
} from "../test_fixtures"
import {
    calculate_watersheds_graph,
} from "./watersheds_graph"
import {
    construct_watersheds,
    factory_get_watershed_minimum_by_id_from_vertices,
} from "../watersheds"


describe("watershed_graph", () =>
{
    const image_data_1b = fixture_input_data_1b()
    const watershed_1b = construct_watersheds(image_data_1b)
    const get_watershed_minimum_by_id_1b = factory_get_watershed_minimum_by_id_from_vertices(watershed_1b.vertices)

    test("should error when no exits given", () =>
    {
        expect(() => calculate_watersheds_graph(watershed_1b, []))
        .toThrow(new Error("Must provide at least one exit for calculating watershed graph"))
    })

    test("should error when exit is not in terrain", () =>
    {
        const positions_outside_terrain: [Vertex, string][] = [
            [{ x: -1, y:  0, z: 0 }, `exit.x of {x:-1,y:0,z:0} must be in range 0 <= x < 4`],
            [{ x:  0, y: -1, z: 0 }, `exit.y of {x:0,y:-1,z:0} must be in range 0 <= y < 3`],
            [{ x: 10, y:  0, z: 0 }, `exit.x of {x:10,y:0,z:0} must be in range 0 <= x < 4`],
            [{ x:  0, y: 10, z: 0 }, `exit.y of {x:0,y:10,z:0} must be in range 0 <= y < 3`],
        ]

        positions_outside_terrain.forEach(([vertex, expected_error_message]) =>
        {
            expect(() => calculate_watersheds_graph(watershed_1b, [vertex]))
            .toThrow(new Error(expected_error_message))
        })
    })

    test("should error when exit x,y is not an integer", () =>
    {
        const non_integer_positions: [Vertex, string][] = [
            [{ x: 1.1, y:   0, z: 0 }, `exit.x of {x:1.1,y:0,z:0} must be an integer`],
            [{ x:   0, y: 1.1, z: 0 }, `exit.y of {x:0,y:1.1,z:0} must be an integer`],
        ]

        non_integer_positions.forEach(([vertex, expected_error_message]) =>
        {
            expect(() => calculate_watersheds_graph(watershed_1b, [vertex]))
            .toThrow(new Error(expected_error_message))
        })
    })

    test("minima connected indirectly to exit should have maximum height of intervening terrain", () =>
    {
        const exits: Vertex[] = [{
            x: 0, y: 1, z: 0
        }]
        const watershed_graph = calculate_watersheds_graph(watershed_1b, exits)

        const watershed_minimum_0 = get_watershed_minimum_by_id_1b(0)
        const watershed_minimum_1 = get_watershed_minimum_by_id_1b(1)
        expect(watershed_graph.get_watershed_heights_info(watershed_minimum_0)).toStrictEqual({ ground_z: 0, max_z: 0 })
        expect(watershed_graph.get_watershed_heights_info(watershed_minimum_1)).toStrictEqual({ ground_z: 0, max_z: 1 })
    })
})
