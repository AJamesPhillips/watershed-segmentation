

export interface WatershedInputData
{
    image_data: Uint8ClampedArray
    width: number
    height: number
}

export interface Vertex
{
    x: number
    y: number
    z: number
}

export interface GroupedVertex
{
    z: number
    // The ids of the watershed minimum/minima this vertex belongs to
    group_ids: Set<number>

    // Used my vertices which are at a minimum
    member_indices?: number[]
    minimum_id?: number
}

interface WatershedArea
{
    // area: number
    // perimeter: number
    // centroid: {x: number, y: number}
    vertices: Vertex[]
}

export interface Watershed
{
    width: number
    height: number
    vertices: GroupedVertex[]
    area_count: number
}
