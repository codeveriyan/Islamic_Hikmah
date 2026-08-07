import time
import re
from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator
import os

html_path = r"C:\Users\smuha\OneDrive\Documents\baby names\ExportBlock-0f846f1f-17ca-468a-a881-105aa3186d7f-Part-1\1,000+ Muslim Baby Names (Boys & Girls) with Meani f43990ceb0ff4955a9672ae6eb2d8678.html"
ts_path = r"C:\Users\smuha\OneDrive\Documents\GitHub\Islamic_Hikmah\frontend\src\data\baby-names.ts"

def main():
    print("Reading HTML file...")
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, "html.parser")
    
    names_data = []
    current_gender = None
    
    print("Parsing HTML...")
    # The structure seems to have <h2> and <h3> for headers, and <table> for the data.
    # We can iterate through all descendants of the page body.
    body = soup.find('div', class_='page-body')
    if not body:
        print("Could not find page-body")
        return
        
    for child in body.children:
        if child.name in ['h2', 'h3']:
            text = child.get_text().lower()
            if 'boy' in text:
                current_gender = 'male'
            elif 'girl' in text:
                current_gender = 'female'
        elif child.name == 'table':
            if not current_gender:
                continue
            
            tbody = child.find('tbody')
            if not tbody:
                continue
                
            for tr in tbody.find_all('tr'):
                tds = tr.find_all('td')
                if len(tds) >= 2:
                    name = tds[0].get_text(strip=True)
                    meaning = tds[1].get_text(strip=True)
                    if name and meaning:
                        names_data.append({
                            'name': name,
                            'meaning': meaning,
                            'gender': current_gender
                        })
                        
    print(f"Extracted {len(names_data)} names from HTML.")
    
    print("Reading existing TS file...")
    with open(ts_path, "r", encoding="utf-8") as f:
        ts_content = f.read()
        
    # Extract existing names using a simple regex
    existing_names = set()
    matches = re.finditer(r'name:\s*"([^"]+)"', ts_content)
    for m in matches:
        existing_names.add(m.group(1).lower())
        
    print(f"Found {len(existing_names)} existing names.")
    
    new_names = [d for d in names_data if d['name'].lower() not in existing_names]
    print(f"Filtering complete. {len(new_names)} new names to process.")
    
    if not new_names:
        print("No new names to add.")
        return
        
    # Batch translation
    print("Translating names to Arabic in batches...")
    translator = GoogleTranslator(source='en', target='ar')
    
    translated_names = []
    batch_size = 50
    for i in range(0, len(new_names), batch_size):
        batch = new_names[i:i+batch_size]
        text_to_translate = "\n".join([item['name'] for item in batch])
        try:
            res = translator.translate(text_to_translate)
            ar_names = res.split('\n')
            
            for j, item in enumerate(batch):
                ar_name = ar_names[j].strip() if j < len(ar_names) else ""
                item['arabic'] = ar_name
                translated_names.append(item)
                
            print(f"Translated batch {i//batch_size + 1}/{(len(new_names) + batch_size - 1)//batch_size}")
            time.sleep(1) # Be nice to the API
        except Exception as e:
            print(f"Error translating batch {i//batch_size + 1}: {e}")
            # Fallback to individual translation if batch fails or size mismatch
            for item in batch:
                try:
                    item['arabic'] = translator.translate(item['name']).strip()
                except Exception as ex:
                    print(f"Failed to translate {item['name']}: {ex}")
                    item['arabic'] = ""
                translated_names.append(item)
                time.sleep(0.5)

    print("Appending new names to TS file...")
    # Find the closing bracket of the array
    end_idx = ts_content.rfind('];')
    if end_idx == -1:
        print("Could not find end of array in TS file.")
        return
        
    # Generate new TS content
    new_ts_lines = []
    # Count the existing male and female IDs to continue numbering, though we can use UUID or simple increment
    # Just use generic id like 'new_m_1', 'new_f_1'
    m_count = 1
    f_count = 1
    
    for item in translated_names:
        escaped_name = item['name'].replace('"', '\\"')
        escaped_arabic = item['arabic'].replace('"', '\\"')
        escaped_meaning = item['meaning'].replace('"', '\\"').replace('\n', ' ')
        
        if item['gender'] == 'male':
            nid = f"nm_{m_count}"
            m_count += 1
        else:
            nid = f"nf_{f_count}"
            f_count += 1
            
        line = f'  {{ id: "{nid}", name: "{escaped_name}", arabic: "{escaped_arabic}", gender: "{item["gender"]}", meaning: "{escaped_meaning}" }},'
        new_ts_lines.append(line)
        
    inserted_content = "\n" + "\n".join(new_ts_lines) + "\n"
    
    final_ts_content = ts_content[:end_idx] + inserted_content + ts_content[end_idx:]
    
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write(final_ts_content)
        
    print(f"Successfully added {len(translated_names)} names to {ts_path}")

if __name__ == "__main__":
    main()
