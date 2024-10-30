
export function iterate_2d_data<U>(data: { image_data: U[], width: number, height: number }, iterator: (x: number, y: number, z: U) => void)
{
    const { image_data, width, height } = data

    for (let i = 0; i < image_data.length; ++i)
    {
        const x = i % width
        const y = Math.floor(i / width)
        const z = image_data[i]
        iterator(x, y, z)
    }
}
