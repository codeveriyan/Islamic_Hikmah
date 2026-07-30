import os
import base64

assets_dir = r"C:\Users\smuha\OneDrive\Documents\GitHub\Islamic_Hikmah\frontend\assets\images\360\panos"
keys = ['hijr_ismail', 'rawdah', 'al_safa', 'maqam_ibrahim', 'al_aqsa', 'dome_of_rock', 'mount_arafat', 'cave_hira']
out_file = r"C:\Users\smuha\OneDrive\Documents\GitHub\Islamic_Hikmah\frontend\src\data\views360Assets.ts"

lines = ['// Base64 embedded 360° panoramas for instant offline rendering\n']
lines.append('export const PANORAMA_BASE64_MAP: Record<string, string> = {\n')

for k in keys:
    img_path = os.path.join(assets_dir, f"{k}.jpg")
    with open(img_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('utf-8')
    lines.append(f'  "{k}": "data:image/jpeg;base64,{b64}",\n')

lines.append('};\n')

with open(out_file, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Generated src/data/views360Assets.ts successfully!")
