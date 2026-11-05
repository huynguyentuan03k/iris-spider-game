import zlib
import struct
import json

def parse_png(path):
    with open(path, "rb") as f:
        data = f.read()
    
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "Invalid PNG header"
    
    pos = 8
    width, height, bit_depth, color_type = 0, 0, 0, 0
    idat_chunks = []
    
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos+4])[0]
        chunk_type = data[pos+4:pos+8].decode("ascii")
        chunk_data = data[pos+8:pos+8+length]
        pos += 12 + length
        
        if chunk_type == "IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", chunk_data[:10])
        elif chunk_type == "IDAT":
            idat_chunks.append(chunk_data)
        elif chunk_type == "IEND":
            break
            
    decompressed = zlib.decompress(b"".join(idat_chunks))
    return width, height, bit_depth, color_type, decompressed

def unfilter_rgba(width, height, raw):
    bpp = 4 # RGBA 8-bit
    stride = width * bpp
    pixels = bytearray(width * height * 4)
    raw_pos = 0
    
    for y in range(height):
        filter_type = raw[raw_pos]
        raw_pos += 1
        scanline = raw[raw_pos:raw_pos + stride]
        raw_pos += stride
        
        row_offset = y * stride
        prev_row_offset = (y - 1) * stride
        
        for x in range(stride):
            val = scanline[x]
            left = pixels[row_offset + x - bpp] if x >= bpp else 0
            up = pixels[prev_row_offset + x] if y > 0 else 0
            upleft = pixels[prev_row_offset + x - bpp] if (y > 0 and x >= bpp) else 0
            
            if filter_type == 0: # None
                res = val
            elif filter_type == 1: # Sub
                res = (val + left) & 0xff
            elif filter_type == 2: # Up
                res = (val + up) & 0xff
            elif filter_type == 3: # Average
                res = (val + ((left + up) >> 1)) & 0xff
            elif filter_type == 4: # Paeth
                p = left + up - upleft
                pa = abs(p - left)
                pb = abs(p - up)
                pc = abs(p - upleft)
                if pa <= pb and pa <= pc:
                    pred = left
                elif pb <= pc:
                    pred = up
                else:
                    pred = upleft
                res = (val + pred) & 0xff
            else:
                res = val
            pixels[row_offset + x] = res
            
    return pixels

def write_png(width, height, rgba_pixels, output_path):
    raw_scanlines = bytearray()
    stride = width * 4
    for y in range(height):
        raw_scanlines.append(0) # filter type 0
        raw_scanlines.extend(rgba_pixels[y*stride:(y+1)*stride])
        
    compressed = zlib.compress(bytes(raw_scanlines), level=9)
    
    def make_chunk(chunk_type, data):
        c_type = chunk_type.encode("ascii")
        crc = zlib.crc32(c_type + data)
        return struct.pack(">I", len(data)) + c_type + data + struct.pack(">I", crc)
        
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = make_chunk("IHDR", ihdr_data)
    idat_chunk = make_chunk("IDAT", compressed)
    iend_chunk = make_chunk("IEND", b"")
    
    with open(output_path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(ihdr_chunk)
        f.write(idat_chunk)
        f.write(iend_chunk)

# Extract deer and wolf from outside_atlas.png
with open("public/assets/fantasy/atlases/outside_atlas.json") as f:
    atlas = json.load(f)

w, h, bd, ct, decompressed = parse_png("public/assets/fantasy/atlases/outside_atlas.png")
pixels = unfilter_rgba(w, h, decompressed)

def crop_and_save(frame_key, dest_path):
    info = atlas["frames"][frame_key]["frame"]
    fx, fy, fw, fh = info["x"], info["y"], info["w"], info["h"]
    cropped = bytearray(fw * fh * 4)
    
    for row in range(fh):
        src_start = ((fy + row) * w + fx) * 4
        src_end = src_start + fw * 4
        dst_start = row * fw * 4
        cropped[dst_start:dst_start + fw*4] = pixels[src_start:src_end]
        
    write_png(fw, fh, cropped, dest_path)
    print(f"Extracted {frame_key} -> {dest_path} ({fw}x{fh})")

crop_and_save("deer.png", "public/assets/fantasy/animals/fantasy_deer.png")
crop_and_save("wolf.png", "public/assets/fantasy/animals/forest_wolf.png")

# Now let's create wild_boar and forest_rabbit in stylized hand-painted 3/4 perspective matching the palette
# Let's generate 64x64 detailed pixel/painterly sprites for boar and rabbit
def create_wild_boar(dest_path):
    bw, bh = 64, 64
    buf = bytearray(bw * bh * 4)
    
    # Palette for Wild Boar (deep russet-brown bristly fur, sturdy dark tusks, dark snout)
    c_fur_dark = (58, 38, 26, 255)
    c_fur_med = (92, 58, 38, 255)
    c_fur_light = (130, 85, 55, 255)
    c_mane = (38, 24, 16, 255)
    c_tusk = (235, 230, 210, 255)
    c_snout = (45, 28, 20, 255)
    c_eye = (220, 50, 40, 255)
    c_shadow = (20, 30, 20, 80)
    
    def set_p(x, y, c):
        if 0 <= x < bw and 0 <= y < bh:
            idx = (y * bw + x) * 4
            buf[idx:idx+4] = bytes(c)
            
    # Ground shadow (oval)
    for y in range(46, 56):
        for x in range(12, 54):
            dx = (x - 33) / 18.0
            dy = (y - 50) / 4.5
            if dx*dx + dy*dy <= 1.0:
                set_p(x, y, c_shadow)
                
    # Boar body (stout, bulky hunchback)
    for y in range(22, 48):
        for x in range(16, 50):
            # Bulky body outline
            dx = (x - 32) / 15.0
            dy = (y - 35) / 11.0
            if dx*dx + dy*dy <= 1.0:
                # Add fur bristle texture
                if y < 30:
                    set_p(x, y, c_mane)
                elif (x + y) % 3 == 0:
                    set_p(x, y, c_fur_light)
                elif (x + y) % 2 == 0:
                    set_p(x, y, c_fur_med)
                else:
                    set_p(x, y, c_fur_dark)
                    
    # Sturdy legs
    for lx in [20, 26, 38, 44]:
        for ly in range(42, 51):
            for w in range(4):
                set_p(lx + w, ly, c_fur_dark if ly > 46 else c_fur_med)
                
    # Head & Snout (facing left 3/4)
    for hy in range(26, 42):
        for hx in range(10, 26):
            dx = (hx - 18) / 7.0
            dy = (hy - 34) / 7.0
            if dx*dx + dy*dy <= 1.0:
                set_p(hx, hy, c_fur_med if hy < 34 else c_fur_dark)
                
    # Flat snout
    for sy in range(33, 39):
        for sx in range(8, 14):
            set_p(sx, sy, c_snout)
            
    # Curved tusks
    set_p(11, 35, c_tusk)
    set_p(10, 34, c_tusk)
    set_p(9, 33, c_tusk)
    set_p(11, 37, c_tusk)
    set_p(10, 36, c_tusk)
    
    # Fierce eye
    set_p(16, 30, c_eye)
    set_p(17, 30, (255, 200, 50, 255))
    
    # Spiky bristly back mane
    for mx in range(22, 44, 2):
        set_p(mx, 22, c_mane)
        set_p(mx+1, 21, c_mane)
        set_p(mx, 20, c_mane)
        
    write_png(bw, bh, buf, dest_path)
    print(f"Generated {dest_path} ({bw}x{bh})")

def create_forest_rabbit(dest_path):
    rw, rh = 48, 48
    buf = bytearray(rw * rh * 4)
    
    c_fur_base = (175, 140, 110, 255)
    c_fur_light = (215, 185, 155, 255)
    c_fur_dark = (120, 90, 70, 255)
    c_belly = (245, 240, 230, 255)
    c_inner_ear = (235, 175, 175, 255)
    c_eye = (35, 25, 20, 255)
    c_nose = (230, 150, 150, 255)
    c_shadow = (20, 30, 20, 70)
    
    def set_p(x, y, c):
        if 0 <= x < rw and 0 <= y < rh:
            idx = (y * rw + x) * 4
            buf[idx:idx+4] = bytes(c)
            
    # Ground shadow
    for y in range(36, 44):
        for x in range(12, 38):
            dx = (x - 24) / 11.0
            dy = (y - 40) / 3.0
            if dx*dx + dy*dy <= 1.0:
                set_p(x, y, c_shadow)
                
    # Rabbit body
    for y in range(22, 39):
        for x in range(16, 36):
            dx = (x - 26) / 9.0
            dy = (y - 31) / 7.5
            if dx*dx + dy*dy <= 1.0:
                if x < 24 and y > 28:
                    set_p(x, y, c_belly)
                elif (x + y) % 2 == 0:
                    set_p(x, y, c_fur_light)
                else:
                    set_p(x, y, c_fur_base)
                    
    # Head
    for y in range(16, 28):
        for x in range(12, 24):
            dx = (x - 17) / 5.5
            dy = (y - 22) / 5.5
            if dx*dx + dy*dy <= 1.0:
                set_p(x, y, c_fur_base if x > 14 else c_belly)
                
    # Long Ears
    for ey in range(6, 17):
        # Left ear
        set_p(15, ey, c_fur_dark)
        set_p(16, ey, c_inner_ear)
        set_p(17, ey, c_fur_base)
        # Right ear
        set_p(19, ey, c_fur_dark)
        set_p(20, ey, c_inner_ear)
        set_p(21, ey, c_fur_base)
        
    # Fluffy tail
    for ty in range(27, 33):
        for tx in range(33, 38):
            if (tx - 35)**2 + (ty - 30)**2 <= 6:
                set_p(tx, ty, c_belly)
                
    # Eye & Nose
    set_p(14, 20, c_eye)
    set_p(11, 23, c_nose)
    
    # Whiskers
    set_p(9, 22, (255, 255, 255, 200))
    set_p(8, 21, (255, 255, 255, 160))
    set_p(9, 24, (255, 255, 255, 200))
    set_p(8, 25, (255, 255, 255, 160))
    
    # Paws
    for px in [14, 18, 24, 28]:
        set_p(px, 38, c_fur_light)
        set_p(px+1, 38, c_fur_dark)
        
    write_png(rw, rh, buf, dest_path)
    print(f"Generated {dest_path} ({rw}x{rh})")

create_wild_boar("public/assets/fantasy/animals/wild_boar.png")
create_forest_rabbit("public/assets/fantasy/animals/forest_rabbit.png")
