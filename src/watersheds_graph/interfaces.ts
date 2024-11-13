import { GroupedVertex, Vertex } from "../interfaces"


export interface Id
{
    id: number
}

export interface Exit extends Vertex, Id {}


export interface WatershedHeightsInfo
{
    ground_z: number
    max_z: number
}


export interface WatershedGraph
{
    get_watershed_heights_info: (vertex: GroupedVertex) => WatershedHeightsInfo
}
