

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

export interface WatershedMinimum
{
    member_indices: number[]
    minimum_id: number
}


export function is_watershed_minimum<U extends Partial<WatershedMinimum>, T extends U & WatershedMinimum>(obj: U): obj is T
{
    return obj.minimum_id !== undefined
}

export interface GroupedVertex extends Partial<WatershedMinimum>
{
    z: number
    // The ids of the watershed this vertex belongs to
    watershed_ids: Set<number>
}

interface WatershedArea
{
    // area: number
    // perimeter: number
    // centroid: {x: number, y: number}
    vertices: Vertex[]
}

export interface Watersheds
{
    input_width: number
    input_height: number
    vertices: GroupedVertex[]
    watershed_count: number
}
