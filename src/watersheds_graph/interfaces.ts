import { Vertex } from "../interfaces"


export interface Id
{
    id: number
}

export interface Exit extends Vertex, Id {}
