import artData from '../data/art.json'

const imageModules = import.meta.glob('../assets/art/*.{png,jpg,jpeg,webp}', {
    eager: true,
    import: 'default',
})

const imageMap = Object.entries(imageModules).reduce((acc, [path, src]) => {
    const file = path.split('/').pop()
    acc[file] = src
    return acc
}, {})

export function getArtPieces() {
    return artData
        .filter(piece => piece.published)
        .map(piece => ({
            ...piece,
            src: imageMap[piece.file] || '',
        }))
        .filter(piece => piece.src)
}