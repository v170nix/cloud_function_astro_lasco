export function pad(n1, width, z1 = '0'): string {
    const z = z1 || '0';
    const n = n1 + '';
    return n.length >= width ? n : new Array(width - n.length +1).join(z) + n;
}