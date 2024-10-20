import json
import re

default_filename = "term_meta_bank_1.json"
filename = input(f"Enter the filename (default: {default_filename}): ")
if not filename:
    filename = default_filename

items = []

def remove_non_kanji(text):
    text = re.sub(r'[Ａ-Ｚａ-ｚ０-９]', '', text)
    chars = [c for c in text if "\u4e00" <= c <= "\u9fff"]
    return "".join(chars) 

with open(filename, mode="r", encoding="utf-8") as f:
    data = json.load(f)
    for row in data:
        if row[2].get("reading") is None:
            continue
        term = row[0]
        term_data = row[2]
        reading = term_data["reading"]
        kanji_string = remove_non_kanji(term)
        freq = term_data["frequency"]["value"]
        if len(kanji_string) > 0:
            items.append([term, kanji_string, reading, freq])


print("Output:")
for i in range(20):
    print(items[i])
print(f"Total terms: {len(data)}")
print(f"Total terms with kanji: {len(items)}")
with open("dict.json", mode="w", encoding="utf-8") as f:
    json.dump(items, f, ensure_ascii=False, separators=(',', ':'))
    print("Done.")