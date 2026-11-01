"""Read the supplied workbook without editing it; retain every row and its inclusion flag."""
import json
import sys
from pathlib import Path
import openpyxl

workbook = openpyxl.load_workbook(sys.argv[1], data_only=True)
sheet = workbook['Danh sách thửa']
records = []
for row_number, row in enumerate(list(sheet.values)[1:], 2):
    if not any(value is not None for value in row):
        continue
    parcel, sheet_no, lat, lng, area, land, commune, batch, included, url, note = row
    if not (-90 <= lat <= 90 and -180 <= lng <= 180 and area > 0):
        raise ValueError(f'Invalid coordinate or area at source row {row_number}')
    records.append(dict(sourceRow=row_number, parcelNumber=str(parcel), sheetNumber=str(sheet_no),
                        lat=lat, lng=lng, estimatedAreaM2=area, landUse=land, commune=commune,
                        imageBatch=batch, included=included == 'Có', googleMaps=url, note=note or ''))
output = dict(sourceFile=Path(sys.argv[1]).name, sourceSheet=sheet.title,
              importedAt='2026-10-23', targetHa=workbook['Tiến độ']['B2'].value, records=records)
Path(sys.argv[2]).write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
active = [r for r in records if r['included']]
print(json.dumps(dict(rows=len(records), active=len(active), excluded=len(records)-len(active),
                     areaHa=sum(r['estimatedAreaM2'] for r in active)/10000), ensure_ascii=False))
