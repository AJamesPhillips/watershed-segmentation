import {
    Vertex,
    Watersheds,
} from "../interfaces"
import { factory_get_watershed_minimum_by_id_from_vertices, GetWatershedMinimumById } from "../watersheds"
import { Exit, WatershedHeightsInfo } from "./interfaces"


export function get_watershed_id_to_heights_info(watersheds: Watersheds, exits: Exit[], connections_graph: Map<number, Map<number, Vertex>>): Map<number, WatershedHeightsInfo>
{
    if (exits.length === 0) throw new Error(`Must provide at least one exit for collapsing watershed connections graph`)

    const watershed_id_to_heights_info = new Map<number, WatershedHeightsInfo>()
    const get_watershed_minimum_by_id = factory_get_watershed_minimum_by_id_from_vertices(watersheds.vertices)

    set_exit_values(watersheds, get_watershed_minimum_by_id, exits, watershed_id_to_heights_info)

    // Now use these values seeded by the exits to recurse through all the
    // other watersheds connected from these watersheds and set their max height
    Array.from(watershed_id_to_heights_info.keys()).forEach(watershed_id =>
    {
        process_watershed_id({
            watershed_id,
            get_watershed_minimum_by_id,
            connections_graph,
            watershed_id_to_heights_info,
        })
    })

    return watershed_id_to_heights_info
}


function set_exit_values(watersheds: Watersheds, get_watershed_minimum_by_id: GetWatershedMinimumById, exits: Exit[], watershed_id_to_heights_info: Map<number, WatershedHeightsInfo>)
{
    exits.forEach(exit =>
    {
        const vertex = watersheds.vertices[exit.x + exit.y * watersheds.input_width]

        const watershed_ids_to_process = Array.from(vertex.watershed_ids)

        watershed_ids_to_process.forEach(watershed_id =>
        {
            const watershed_minimum = get_watershed_minimum_by_id(watershed_id)

            let entry = watershed_id_to_heights_info.get(watershed_id)
            if (!entry)
            {
                entry = {
                    ground_z: watershed_minimum.z,
                    max_z: exit.z,
                }
            }
            // check if exit is lower than existing entry
            else if (exit.z < entry.max_z)
            {
                entry.max_z = exit.z
            }

            watershed_id_to_heights_info.set(watershed_id, entry)
        })
    })
}


interface ProcessWatershedIdArgs
{
    watershed_id: number
    get_watershed_minimum_by_id: GetWatershedMinimumById
    connections_graph: Map<number, Map<number, Vertex>>
    watershed_id_to_heights_info: Map<number, WatershedHeightsInfo>
    visited_watershed_ids?: Set<number>
}
function process_watershed_id(args: ProcessWatershedIdArgs)
{
    const {
        watershed_id: originating_watershed_id,
        get_watershed_minimum_by_id,
        connections_graph,
        watershed_id_to_heights_info,
        visited_watershed_ids = new Set<number>(),
    } = args

    // Protect against infinite loops
    if (visited_watershed_ids.has(originating_watershed_id))
    {
        return
    }
    visited_watershed_ids.add(originating_watershed_id)

    const originating_watershed_heights_info = watershed_id_to_heights_info.get(originating_watershed_id)
    if (!originating_watershed_heights_info) // type guard
    {
        throw new Error(`No watershed height info found for originating_watershed_id ${originating_watershed_id}`)
    }

    const connections_for_watershed = connections_graph.get(originating_watershed_id)
    if (connections_for_watershed === undefined) // type guard
    {
        throw new Error(`No connections map found for watershed_id ${originating_watershed_id}`)
    }


    const watershed_ids_and_connections_to_process = Array.from(connections_for_watershed.entries())
    const watershed_ids_to_process = new Set<number>()
    watershed_ids_and_connections_to_process.forEach(([next_watershed_id, connection]) =>
    {
        if (visited_watershed_ids.has(next_watershed_id)) return

        const new_max_z = Math.max(originating_watershed_heights_info.max_z, connection.z)

        let next_watershed_heights_info = watershed_id_to_heights_info.get(next_watershed_id)
        if (!next_watershed_heights_info || new_max_z <= next_watershed_heights_info.max_z)
        {
            const watershed_minimum = args.get_watershed_minimum_by_id(next_watershed_id)

            next_watershed_heights_info = {
                ground_z: watershed_minimum.z,
                max_z: new_max_z,
            }

            watershed_id_to_heights_info.set(next_watershed_id, next_watershed_heights_info)
            watershed_ids_to_process.add(next_watershed_id)
        }
    })

    watershed_ids_to_process.forEach(watershed_id =>
    {
        process_watershed_id({
            watershed_id,
            get_watershed_minimum_by_id,
            connections_graph,
            watershed_id_to_heights_info,
            visited_watershed_ids,
        })
    })
}
