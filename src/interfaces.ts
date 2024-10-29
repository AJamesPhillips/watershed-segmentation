

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

export interface VertexGroup
{
    x: number
    y: number
    z: number
}

export interface LineArea
{
    start: Vertex
    end: Vertex
    total_area: number
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
    areas: WatershedArea[]
}
