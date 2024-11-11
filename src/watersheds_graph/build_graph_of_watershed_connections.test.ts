import { Watersheds } from "../interfaces"
import { Exit } from "./interfaces"
import { build_graph_of_watershed_connections } from "./build_graph_of_watershed_connections"


describe("build_graph_of_watershed_connections", () =>
{
    test("it should handle a simple case", () =>
    {
        const watershed: Watersheds = {
            input_width: 3,
            input_height: 1,
            watershed_count: 2,
            vertices: [
                { z: 0, watershed_ids: new Set([0   ]) },
                { z: 3, watershed_ids: new Set([0, 1]) },
                { z: 0, watershed_ids: new Set([   1]) },
            ]
        }

        const exits: Exit[] = [
            { x: 0, y: 0, z: -2, id: -1 },
        ]

        const connections = build_graph_of_watershed_connections(watershed, exits)

        expect(Array.from(connections.keys())).toEqual([0, 1])
        expect(connections.get(0)).toEqual(new Map([[-1, { x: 0, y: 0, z: -2, id: -1 }], [1, { x: 1, y: 0, z: 3, id: 1 }]]))
        expect(connections.get(1)).toEqual(new Map([[0, { x: 1, y: 0, z: 3, id: 0 }]]))
    })

    test("it should handle many watersheds and exits", () =>
    {
        const watershed: Watersheds = {
            input_width: 7,
            input_height: 1,
            watershed_count: 4,
            vertices: [
                { z: 0, watershed_ids: new Set([0         ]) },
                { z: 7, watershed_ids: new Set([0, 1      ]) },
                { z: 0, watershed_ids: new Set([   1      ]) },
                { z: 5, watershed_ids: new Set([   1, 2   ]) },
                { z: 0, watershed_ids: new Set([      2   ]) },
                { z: 9, watershed_ids: new Set([      2, 3]) },
                { z: 0, watershed_ids: new Set([         3]) },
            ]
        }

        const exits: Exit[] = [
            { x: 0, y: 0, z: -2, id: -1 },
            { x: 3, y: 0, z: -3, id: -2 },
            { x: 6, y: 0, z: -4, id: -3 },
        ]

        const connections = build_graph_of_watershed_connections(watershed, exits)

        expect(Array.from(connections.keys())).toEqual([0, 1, 2, 3])
        expect(connections.get(0)).toEqual(new Map([[-1, { x: 0, y: 0, z: -2, id: -1 }], [1, { x: 1, y: 0, z: 7, id: 1 }]]))
        expect(connections.get(1)).toEqual(new Map([[-2, { x: 3, y: 0, z: -3, id: -2 }], [0, { x: 1, y: 0, z: 7, id: 0 }], [2, { x: 3, y: 0, z: 5, id: 2 }]]))
        expect(connections.get(2)).toEqual(new Map([[-2, { x: 3, y: 0, z: -3, id: -2 }], [1, { x: 3, y: 0, z: 5, id: 1 }], [3, { x: 5, y: 0, z: 9, id: 3 }]]))
        expect(connections.get(3)).toEqual(new Map([[-3, { x: 6, y: 0, z: -4, id: -3 }], [2, { x: 5, y: 0, z: 9, id: 2 }]]))
    })

    test("it should handle 2d watersheds and internal exit", () =>
    {
        const watershed: Watersheds = {
            input_width: 3,
            input_height: 3,
            watershed_count: 2,
            vertices: [
                // A ridge running north to south
                { z: 0, watershed_ids: new Set([0   ]) },
                { z: 1, watershed_ids: new Set([0, 1]) },
                { z: 0, watershed_ids: new Set([   1]) },

                { z: 0, watershed_ids: new Set([0   ]) },
                { z: 1, watershed_ids: new Set([0, 1]) },
                { z: 0, watershed_ids: new Set([   1]) },

                { z: 0, watershed_ids: new Set([0   ]) },
                { z: 1, watershed_ids: new Set([0, 1]) },
                { z: 0, watershed_ids: new Set([   1]) },
            ]
        }

        const exits: Exit[] = [
            // An internal exit like a cave system in the middle of the ridge
            { x: 1, y: 1, z: -2, id: -1 },
        ]

        const connections = build_graph_of_watershed_connections(watershed, exits)

        expect(Array.from(connections.keys())).toEqual([0, 1])
        expect(connections.get(0)).toEqual(new Map([[-1, { x: 1, y: 1, z: -2, id: -1 }], [1, { x: 1, y: 0, z: 1, id: 1 }]]))
        expect(connections.get(1)).toEqual(new Map([[-1, { x: 1, y: 1, z: -2, id: -1 }], [0, { x: 1, y: 0, z: 1, id: 0 }]]))
    })
})
