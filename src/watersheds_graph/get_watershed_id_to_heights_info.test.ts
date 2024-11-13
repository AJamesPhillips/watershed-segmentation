import { WatershedInputData } from "../interfaces"
import { construct_watersheds } from "../watersheds"
import { Exit } from "./interfaces"
import { get_watershed_id_to_heights_info } from "./get_watershed_id_to_heights_info"
import { build_graph_of_watershed_connections } from "./build_graph_of_watershed_connections"


describe("collapse_graph_from_exits", () =>
{
    test("it should handle an exit lower than the terrain", () =>
    {
        const image_data: WatershedInputData = {
            image_data: new Uint8ClampedArray([
                // A linear strip of land the slopes to the right
                3, 1
            ]),
            width: 2,
            height: 1
        }
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(1)

        const exits: Exit[] = [
            // An exit that is lower than the terrain, such as a sinkhole or cave
            { x: 0, y: 0, z: 0, id: -1 },
        ]
        const connections = build_graph_of_watershed_connections(watershed, exits)
        expect(Array.from(connections.keys())).toStrictEqual([0])

        const watershed_id_to_heights_info = get_watershed_id_to_heights_info(watershed, exits, connections)
        expect(Array.from(watershed_id_to_heights_info.keys())).toStrictEqual([0])
        expect(watershed_id_to_heights_info.get(0)).toEqual({ ground_z: 1, max_z: 0})
    })

    test("it should handle an exit higher than the terrain", () =>
    {
        const image_data: WatershedInputData = {
            image_data: new Uint8ClampedArray([
                // A linear strip of land the slopes to the right
                3, 1
            ]),
            width: 2,
            height: 1
        }
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(1)

        const exits: Exit[] = [
            // An exit that is higher than the terrain, but which is still the
            // exit for this area of watersheds
            { x: 0, y: 0, z: 10, id: -1 },
        ]
        const connections = build_graph_of_watershed_connections(watershed, exits)
        expect(Array.from(connections.keys())).toStrictEqual([0])

        const watershed_id_to_heights_info = get_watershed_id_to_heights_info(watershed, exits, connections)
        expect(Array.from(watershed_id_to_heights_info.keys())).toStrictEqual([0])
        expect(watershed_id_to_heights_info.get(0)).toEqual({ ground_z: 1, max_z: 10 })
    })

    test("it should handle multiple watersheds and exits", () =>
    {
        const image_data: WatershedInputData = {
            image_data: new Uint8ClampedArray([
                // Alternating peaks and valleys
                0, 3, 1, 7, 1, 2, 0
            ]),
            width: 7,
            height: 1
        }
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(4)

        const exits: Exit[] = [
            { x: 0, y: 0, z: 1, id: -1 },
            { x: 6, y: 0, z: 1, id: -2 },
        ]
        const connections = build_graph_of_watershed_connections(watershed, exits)
        expect(Array.from(connections.keys())).toStrictEqual([0, 1, 2, 3])

        const watershed_id_to_heights_info = get_watershed_id_to_heights_info(watershed, exits, connections)
        expect(Array.from(watershed_id_to_heights_info.keys()).sort()).toStrictEqual([0, 1, 2, 3])
        expect(watershed_id_to_heights_info.get(0)).toEqual({ ground_z: 0, max_z: 1 })
        expect(watershed_id_to_heights_info.get(1)).toEqual({ ground_z: 0, max_z: 1 })
        expect(watershed_id_to_heights_info.get(2)).toEqual({ ground_z: 1, max_z: 3 })
        expect(watershed_id_to_heights_info.get(3)).toEqual({ ground_z: 1, max_z: 2 })
    })

    test("it should handle multiple watersheds decreasing down towards the same exit", () =>
    {
        const image_data: WatershedInputData = {
            image_data: new Uint8ClampedArray([
                // Alternating peaks and valleys
                0, 3, 1, 7, 2, 9
            ]),
            width: 6,
            height: 1
        }
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(3)

        const exits: Exit[] = [
            { x: 0, y: 0, z: 1, id: -1 },
        ]
        const connections = build_graph_of_watershed_connections(watershed, exits)
        expect(Array.from(connections.keys())).toStrictEqual([0, 1, 2])

        const watershed_id_to_heights_info = get_watershed_id_to_heights_info(watershed, exits, connections)
        expect(Array.from(watershed_id_to_heights_info.keys()).sort()).toStrictEqual([0, 1, 2])
        expect(watershed_id_to_heights_info.get(0)).toEqual({ ground_z: 0, max_z: 1 })
        expect(watershed_id_to_heights_info.get(1)).toEqual({ ground_z: 1, max_z: 3 })
        expect(watershed_id_to_heights_info.get(2)).toEqual({ ground_z: 2, max_z: 7 })
    })

    test("it should handle multiple watersheds increasing up towards the same exit", () =>
    {
        const image_data: WatershedInputData = {
            image_data: new Uint8ClampedArray([
                // Alternating peaks and valleys
                10, 8, 9, 6, 7, 4, 5
            ]),
            width: 7,
            height: 1
        }
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(3)

        const exits: Exit[] = [
            { x: 0, y: 0, z: 11, id: -1 },
        ]
        const connections = build_graph_of_watershed_connections(watershed, exits)
        expect(Array.from(connections.keys())).toStrictEqual([0, 1, 2])

        const watershed_id_to_heights_info = get_watershed_id_to_heights_info(watershed, exits, connections)
        expect(Array.from(watershed_id_to_heights_info.keys()).sort()).toStrictEqual([0, 1, 2])
        expect(watershed_id_to_heights_info.get(0)).toEqual({ ground_z: 4, max_z: 11 })
        expect(watershed_id_to_heights_info.get(1)).toEqual({ ground_z: 6, max_z: 11 })
        expect(watershed_id_to_heights_info.get(2)).toEqual({ ground_z: 8, max_z: 11 })
    })

    test("it should handle multiple watersheds increasing up and down towards the same exit", () =>
    {
        const image_data: WatershedInputData = {
            image_data: new Uint8ClampedArray([
                // Alternating peaks and valleys
                0, 3, 1, 7, 1, 2, 0
            ]),
            width: 7,
            height: 1
        }
        const watershed = construct_watersheds(image_data)
        expect(watershed.watershed_count).toBe(4)

        const exits: Exit[] = [
            { x: 0, y: 0, z: 1, id: -1 },
        ]
        const connections = build_graph_of_watershed_connections(watershed, exits)
        expect(Array.from(connections.keys())).toStrictEqual([0, 1, 2, 3])

        const watershed_id_to_heights_info = get_watershed_id_to_heights_info(watershed, exits, connections)
        expect(Array.from(watershed_id_to_heights_info.keys()).sort()).toStrictEqual([0, 1, 2, 3])
        expect(watershed_id_to_heights_info.get(0)).toEqual({ ground_z: 0, max_z: 1 })
        expect(watershed_id_to_heights_info.get(1)).toEqual({ ground_z: 0, max_z: 7 })
        expect(watershed_id_to_heights_info.get(2)).toEqual({ ground_z: 1, max_z: 3 })
        expect(watershed_id_to_heights_info.get(3)).toEqual({ ground_z: 1, max_z: 7 })
    })
})
