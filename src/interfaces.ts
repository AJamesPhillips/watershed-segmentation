import { WatershedHeightsInfo } from "./watersheds_graph/interfaces"


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
    watershed_id: number
}


export function is_watershed_minimum<U extends Partial<WatershedMinimum>, T extends U & WatershedMinimum>(obj: U): obj is T
{
    return obj.watershed_id !== undefined
}

export interface GroupedVertex extends Partial<WatershedMinimum>
{
    z: number
    // The ids of the watershed this vertex belongs to
    watershed_ids: Set<number>
}


export interface Watersheds
{
    input_width: number
    input_height: number
    vertices: GroupedVertex[]
    watershed_count: number
}
