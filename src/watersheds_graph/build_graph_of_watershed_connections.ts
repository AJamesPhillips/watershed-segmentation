import { Watersheds, Vertex } from "../interfaces"
import { Exit, Id } from "./interfaces"


export function build_graph_of_watershed_connections(watershed: Watersheds, exits: Exit[]): Map<number, Map<number, (Vertex & Id)>>
{
    const connections = get_empty_connections_map(watershed.watershed_count)
    mutate_connections_with_exits(watershed, exits, connections)

    for(let x = 0; x < watershed.input_width; ++x)
    {
        for(let y = 0; y < watershed.input_height; ++y)
        {
            const vertex = watershed.vertices[x + y * watershed.input_width]

            if (vertex.watershed_ids.size === 1) continue

            vertex.watershed_ids.forEach(watershed_id_1 =>
            {
                vertex.watershed_ids.forEach(watershed_id_2 =>
                {
                    if (watershed_id_1 === watershed_id_2) return
                    const existing_boundary = connections.get(watershed_id_1)?.get(watershed_id_2)
                    if (existing_boundary === undefined || existing_boundary.z > vertex.z)
                    {
                        connections.get(watershed_id_1)!.set(watershed_id_2, { x, y, z: vertex.z, id: watershed_id_2 })
                    }
                })
            })
        }
    }

    return connections
}


function get_empty_connections_map(watershed_count: number)
{
    const connections: Map<number, Map<number, (Vertex & Id)>> = new Map()

    for(let minimum_id = 0; minimum_id < watershed_count; ++minimum_id)
    {
        connections.set(minimum_id, new Map())
    }

    return connections
}


function mutate_connections_with_exits(watershed: Watersheds, exits: Exit[], connections: Map<number, Map<number, (Vertex & Id)>>)
{
    exits.forEach(exit =>
    {
        const vertex = watershed.vertices[exit.x + exit.y * watershed.input_width]
        vertex.watershed_ids.forEach(watershed_id =>
        {
            connections.get(watershed_id)!.set(exit.id, exit)
        })
    })
}
