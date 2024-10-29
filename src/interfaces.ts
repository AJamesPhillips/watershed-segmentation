

export interface WatershedData
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
    group_ids: number[]
    minima_id?: number
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
    vertices: GroupedVertex[]
    area_count: number
}
