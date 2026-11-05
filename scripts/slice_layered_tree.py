import os, struct, zlib

def parse_png_any(path):
    with open(path, "rb") as f:
        data = f.read()
    pos = 8
    width, height, bit_depth, color_type = 0, 0, 0, 0
    palette = []
    transparency = []
    idat_chunks = []
    
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos+4])[0]
        chunk_type = data[pos+4:pos+8].decode("ascii")
        chunk_data = data[pos+8:pos+8+length]
        pos += 12 + length
        
        if chunk_type == "IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", chunk_data[:10])
        elif chunk_type == "PLTE":
            for i in range(0, len(chunk_data), 3):
                palette.append((chunk_data[i], chunk_data[i+1], chunk_data[i+2]))
        elif chunk_type == "tRNS":
            for b in chunk_data:
                transparency.append(b)
        elif chunk_type == "IDAT":
            idat_chunks.append(chunk_data)
        elif chunk_type == "IEND":
            break
            
    decomp = zlib.decompress(b"".join(idat_chunks))
    
    rgba = bytearray(width * height * 4)
    if color_type == 3: # Palette
        stride = width
        raw_pos = 0
        indices = bytearray(width * height)
        for y in range(height):
            raw_pos += 1 # filter byte
            scanline = decomp[raw_pos:raw_pos + stride]
            raw_pos += stride
            indices[y*width:(y+1)*width] = scanline
            
        for i in range(width * height):
            idx = indices[i]
            r, g, b = palette[idx] if idx < len(palette) else (0, 0, 0)
            a = transparency[idx] if idx < len(transparency) else 255
            rgba[i*4:i*4+4] = bytes([r, g, b, a])
    elif color_type == 6: # RGBA
        bpp = 4
        stride = width * bpp
        raw_pos = 0
        for y in range(height):
            ft = decomp[raw_pos]
            raw_pos += 1
            scan = decomp[raw_pos:raw_pos + stride]
            raw_pos += stride
            row = y * stride
            prev = (y - 1) * stride
            for x in range(stride):
                val = scan[x]
                left = rgba[row + x - bpp] if x >= bpp else 0
                up = rgba[prev + x] if y > 0 else 0
                upleft = rgba[prev + x - bpp] if (y > 0 and x >= bpp) else 0
                if ft == 0: res = val
                elif ft == 1: res = (val + left) & 0xff
                elif ft == 2: res = (val + up) & 0xff
                elif ft == 3: res = (val + ((left + up) >> 1)) & 0xff
                elif ft == 4:
                    p = left + up - upleft
                    pa, pb, pc = abs(p - left), abs(p - up), abs(p - upleft)
                    pred = left if (pa <= pb and pa <= pc) else (up if pb <= pc else upleft)
                    res = (val + pred) & 0xff
                else: res = val
                rgba[row + x] = res
    return width, height, rgba

def write_png(width, height, rgba_pixels, output_path):
    raw_scanlines = bytearray()
    stride = width * 4
    for y in range(height):
        raw_scanlines.append(0)
        raw_scanlines.extend(rgba_pixels[y*stride:(y+1)*stride])
    compressed = zlib.compress(bytes(raw_scanlines), level=9)
    def make_chunk(chunk_type, data):
        c_type = chunk_type.encode("ascii")
        crc = zlib.crc32(c_type + data)
        return struct.pack(">I", len(data)) + c_type + data + struct.pack(">I", crc)
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    with open(output_path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(make_chunk("IHDR", ihdr_data))
        f.write(make_chunk("IDAT", compressed))
        f.write(make_chunk("IEND", b""))

w, h, orig = parse_png_any("public/assets/fantasy/vegetation/trees/ancient_oak_full.png")

# 1. Shadow slice
shadow_buf = bytearray(w * h * 4)
for y in range(96, 126):
    for x in range(24, 104):
        dx = (x - 64) / 36.0
        dy = (y - 110) / 10.0
        dist = dx*dx + dy*dy
        if dist <= 1.0:
            alpha = int(105 * (1.0 - dist * 0.75))
            idx = (y * w + x) * 4
            shadow_buf[idx] = 15
            shadow_buf[idx+1] = 25
            shadow_buf[idx+2] = 18
            shadow_buf[idx+3] = alpha
write_png(w, h, shadow_buf, "public/assets/fantasy/vegetation/trees/ancient_oak_shadow.png")

# 2. Trunk & roots
trunk_buf = bytearray(w * h * 4)
for y in range(68, h):
    for x in range(w):
        idx = (y * w + x) * 4
        if orig[idx+3] > 10:
            trunk_buf[idx:idx+4] = orig[idx:idx+4]
write_png(w, h, trunk_buf, "public/assets/fantasy/vegetation/trees/ancient_oak_trunk.png")

# 3. Lower foliage
lower_buf = bytearray(w * h * 4)
for y in range(40, 80):
    for x in range(w):
        idx = (y * w + x) * 4
        if orig[idx+3] > 10:
            lower_buf[idx:idx+4] = orig[idx:idx+4]
write_png(w, h, lower_buf, "public/assets/fantasy/vegetation/trees/ancient_oak_lower_foliage.png")

# 4. Upper canopy
upper_buf = bytearray(w * h * 4)
for y in range(0, 56):
    for x in range(w):
        idx = (y * w + x) * 4
        if orig[idx+3] > 10:
            upper_buf[idx:idx+4] = orig[idx:idx+4]
write_png(w, h, upper_buf, "public/assets/fantasy/vegetation/trees/ancient_oak_upper_canopy.png")

print("Successfully generated all 4 layered slices of Ancient Oak:")
print("- ancient_oak_shadow.png")
print("- ancient_oak_trunk.png")
print("- ancient_oak_lower_foliage.png")
print("- ancient_oak_upper_canopy.png")
