#!/usr/bin/env python3
"""
Generate country area data by matching map countries with real area data.
"""
import json

# 读取地图数据中的国家名称
with open('app/public/maps/world-countries.json', 'r') as f:
    topo = json.load(f)

map_countries = {}
for g in topo['objects']['countries']['geometries']:
    name = g.get('properties', {}).get('name', '')
    fid = str(g.get('id', ''))
    map_countries[name] = fid

# 读取面积数据
with open('/tmp/country-areas.json', 'r') as f:
    areas = json.load(f)

area_map = {a['country']: a['area'] for a in areas}

# 名称映射 (地图名称 -> 面积数据名称)
name_mapping = {
    'Vatican': 'Holy See (Vatican City State)',
    'Micronesia': 'Micronesia',
    'Marshall Is.': 'Marshall Islands',
    'N. Mariana Is.': 'Northern Mariana Islands',
    'U.S. Virgin Is.': 'Virgin Islands',
    'United States of America': 'United States',
    'S. Geo. and the Is.': 'South Georgia and the South Sandwich Islands',
    'Br. Indian Ocean Ter.': 'British Indian Ocean Territory',
    'Pitcairn Is.': 'Pitcairn Islands',
    'Falkland Is.': 'Falkland Islands',
    'Cayman Is.': 'Cayman Islands',
    'British Virgin Is.': 'British Virgin Islands',
    'Turks and Caicos Is.': 'Turks and Caicos Islands',
    'Timor-Leste': 'East Timor',
    'eSwatini': 'Swaziland',
    'S. Sudan': 'South Sudan',
    'Solomon Is.': 'Solomon Islands',
    'São Tomé and Principe': 'Sao Tome and Principe',
    'St. Vin. and Gren.': 'Saint Vincent and the Grenadines',
    'St. Kitts and Nevis': 'Saint Kitts and Nevis',
    'Cook Is.': 'Cook Islands',
    'W. Sahara': 'Western Sahara',
    'Macedonia': 'North Macedonia',
    'Dem. Rep. Congo': 'Congo, Democratic Republic of the',
    'Central African Rep.': 'Central African Republic',
    'Eq. Guinea': 'Equatorial Guinea',
    'Dominican Rep.': 'Dominican Republic',
    'Czech Rep.': 'Czech Republic',
    'Bosnia and Herz.': 'Bosnia and Herzegovina',
    'Côte d\'Ivoire': 'Ivory Coast',
    'Congo': 'Congo',
    'Lao PDR': 'Laos',
    'Korea': 'South Korea',
    'Dem. Rep. Korea': 'North Korea',
    'Fr. Polynesia': 'French Polynesia',
    'Fr. S. Antarctic Lands': 'French Southern Territories',
    'New Caledonia': 'New Caledonia',
    'Antigua and Barb.': 'Antigua and Barbuda',
    'Trinidad and Tobago': 'Trinidad and Tobago',
    'St. Pierre and Miquelon': 'Saint Pierre and Miquelon',
    'Faeroe Is.': 'Faroe Islands',
    'Greenland': 'Greenland',
    'Antarctica': 'Antarctica',
}

# 一些小岛/地区使用估计面积 (km²)
estimated_areas = {
    'Somaliland': 176120,
    'Kosovo': 10887,
    'Montenegro': 13812,
    'Jersey': 116,
    'Guernsey': 78,
    'Isle of Man': 572,
    'Curaçao': 444,
    'Sint Maarten': 34,
    'Åland': 1580,
    'N. Cyprus': 3355,
    # Additional estimated/known areas
    'Vatican': 0.44,
    'Micronesia': 702,
    'U.S. Virgin Is.': 347,
    'Pitcairn Is.': 47,
    'eSwatini': 17364,
    'Wallis and Futuna Is.': 142,
    'St-Martin': 53,
    'St-Barthélemy': 21,
    'Fr. S. Antarctic Lands': 7747,
    'Fiji': 18274,
    'Czechia': 78866,
    'Dem. Rep. Congo': 2344858,
    'Cabo Verde': 4033,
    'Indian Ocean Ter.': 60,
    'Heard I. and McDonald Is.': 412,
    'Ashmore and Cartier Is.': 199,
    'Siachen Glacier': 700,
}

# 构建最终映射
final_areas = {}
unmatched = []

for map_name, fid in map_countries.items():
    area = None
    
    # 直接匹配
    if map_name in area_map:
        area = area_map[map_name]
    # 使用名称映射
    elif map_name in name_mapping:
        mapped_name = name_mapping[map_name]
        if mapped_name in area_map:
            area = area_map[mapped_name]
    # 使用估计值
    if area is None and map_name in estimated_areas:
        area = estimated_areas[map_name]
    
    if area is not None:
        final_areas[map_name] = {'id': fid, 'area': area}
    else:
        unmatched.append(map_name)

print(f"Final matched: {len(final_areas)}")
print(f"Still unmatched: {len(unmatched)}")
if unmatched:
    print("Unmatched countries:")
    for n in unmatched:
        print(f"  - {n}")

# 生成 TypeScript 数据文件
ts_output = '''/**
 * Real country area data (km²)
 * Source: https://github.com/samayo/country-json
 * 
 * Map key: country name (as used in world-countries.json)
 * Value: area in km²
 */
export const COUNTRY_AREAS: Record<string, number> = {
'''

for name, data in sorted(final_areas.items()):
    # Escape single quotes in country names
    escaped_name = name.replace("'", "\\'")
    ts_output += f"  '{escaped_name}': {data['area']},\n"

ts_output += '};\n'

# 保存 TypeScript 文件
with open('app/src/data/countryAreas.ts', 'w') as f:
    f.write(ts_output)

print(f"\nGenerated: app/src/data/countryAreas.ts")
