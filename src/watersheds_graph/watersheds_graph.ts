
import {
    GroupedVertex,
    Vertex,
    Watersheds,
} from "../interfaces"
import { build_graph_of_watershed_connections } from "./build_graph_of_watershed_connections"
import { get_watershed_id_to_heights_info } from "./get_watershed_id_to_heights_info"
import { Exit, WatershedGraph, WatershedHeightsInfo } from "./interfaces"



export function calculate_watersheds_graph(watershed: Watersheds, exits: Vertex[]): WatershedGraph
{
    if (exits.length === 0) throw new Error(`Must provide at least one exit for calculating watershed graph`)

    validate_exits(watershed, exits)
    const exits_with_ids: Exit[] = exits.map((exit, i) => ({ ...exit, id: (-i) - 1 }))

    const connections_graph = build_graph_of_watershed_connections(watershed, exits_with_ids)
    const watershed_id_to_heights_info = get_watershed_id_to_heights_info(watershed, exits_with_ids, connections_graph)

    const cache_watershed_ids_to_lowest_heights_info: Map<string, WatershedHeightsInfo> = new Map()
    function vertex_watershed_ids_to_string(vertex: GroupedVertex)
    {
        return Array.from(vertex.watershed_ids).sort().join(",")
    }

    return {
        get_watershed_heights_info: (vertex: GroupedVertex) =>
        {
            let lowest_heights_info = cache_watershed_ids_to_lowest_heights_info.get(vertex_watershed_ids_to_string(vertex))

            if (!lowest_heights_info)
            {
                const watershed_ids = Array.from(vertex.watershed_ids)
                let lowest_max_z = Infinity

                watershed_ids.forEach(watershed_id =>
                {
                    const heights_info = watershed_id_to_heights_info.get(watershed_id)
                    if (!heights_info) throw new Error(`No heights info for watershed_id ${watershed_id}`)

                    if (heights_info.max_z < lowest_max_z)
                    {
                        lowest_max_z = heights_info.max_z
                        lowest_heights_info = heights_info
                    }
                })

                if (!lowest_heights_info) throw new Error(`No lowest heights info for vertex ${JSON.stringify(vertex)}, watershed_ids ${JSON.stringify(watershed_ids)}`)
                cache_watershed_ids_to_lowest_heights_info.set(vertex_watershed_ids_to_string(vertex), lowest_heights_info)
            }

            return lowest_heights_info
        }
    }
}


function validate_exits(watershed: Watersheds, exits: Vertex[])
{
    const exit_as_string = (exit: Vertex) => JSON.stringify(exit).replace(/\"/g, "")

    exits.forEach(exit =>
    {

        if (exit.x < 0 || exit.x >= watershed.input_width)
        {
            throw new Error(`exit.x of ${exit_as_string(exit)} must be in range 0 <= x < ${watershed.input_width}`)
        }

        if (exit.y < 0 || exit.y >= watershed.input_height)
        {
            throw new Error(`exit.y of ${exit_as_string(exit)} must be in range 0 <= y < ${watershed.input_height}`)
        }

        const validated_exit = {
            z: exit.z,
            // Ensure they are integers
            x: Math.round(exit.x),
            y: Math.round(exit.y),
        }

        if (validated_exit.x !== exit.x) throw new Error(`exit.x of ${exit_as_string(exit)} must be an integer`)
        if (validated_exit.y !== exit.y) throw new Error(`exit.y of ${exit_as_string(exit)} must be an integer`)
    })
}
