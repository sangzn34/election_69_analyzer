"""
Pre-process election data into a single JSON file for React visualization.
"""
import json
import os
import glob

BASE_DIR = os.path.join(os.path.dirname(__file__), '..', '..')
MP_DIR = os.path.join(BASE_DIR, 'data', 'mp')
PL_DIR = os.path.join(BASE_DIR, 'data', 'pl')
AREA_CODE_FILE = os.path.join(BASE_DIR, 'data', 'area_code', 'area_code.json')
CANDIDATE_FILE = os.path.join(BASE_DIR, 'data', 'candidates', 'candidate-data.json')
CONSTITUENCY_FILE = os.path.join(BASE_DIR, 'data', 'constituency.json')
PARTYLIST_FILE = os.path.join(BASE_DIR, 'data', 'party_list.json')
REFERENDUM_FILE = os.path.join(BASE_DIR, 'data', 'referendum.json')
FOCUS_AREAS_FILE = os.path.join(BASE_DIR, 'data', 'focus_areas.json')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', 'election_data.json')

PARTY_META = {
    'PARTY-0001': {'name': 'ไทยทรัพย์ทวี', 'num': 1, 'color': '#aaaaaa'},
    'PARTY-0002': {'name': 'เพื่อชาติไทย', 'num': 2, 'color': '#c2a84d'},
    'PARTY-0003': {'name': 'ใหม่', 'num': 3, 'color': '#aaaaaa'},
    'PARTY-0004': {'name': 'มิติใหม่', 'num': 4, 'color': '#aaaaaa'},
    'PARTY-0005': {'name': 'รวมใจไทย', 'num': 5, 'color': '#aaaaaa'},
    'PARTY-0006': {'name': 'รวมไทยสร้างชาติ', 'num': 6, 'color': '#5b8fd4'},
    'PARTY-0007': {'name': 'พลวัต', 'num': 7, 'color': '#aaaaaa'},
    'PARTY-0008': {'name': 'ประชาธิปไตยใหม่', 'num': 8, 'color': '#aaaaaa'},
    'PARTY-0009': {'name': 'เพื่อไทย', 'num': 9, 'color': '#f44853'},
    'PARTY-0010': {'name': 'ทางเลือกใหม่', 'num': 10, 'color': '#aaaaaa'},
    'PARTY-0011': {'name': 'เศรษฐกิจ', 'num': 11, 'color': '#e0c232'},
    'PARTY-0012': {'name': 'เสรีรวมไทย', 'num': 12, 'color': '#9572e8'},
    'PARTY-0013': {'name': 'รวมพลังประชาชน', 'num': 13, 'color': '#aaaaaa'},
    'PARTY-0014': {'name': 'ท้องที่ไทย', 'num': 14, 'color': '#aaaaaa'},
    'PARTY-0015': {'name': 'อนาคตไทย', 'num': 15, 'color': '#aaaaaa'},
    'PARTY-0016': {'name': 'พลังเพื่อไทย', 'num': 16, 'color': '#aaaaaa'},
    'PARTY-0017': {'name': 'ไทยชนะ', 'num': 17, 'color': '#aaaaaa'},
    'PARTY-0018': {'name': 'พลังสังคมใหม่', 'num': 18, 'color': '#aaaaaa'},
    'PARTY-0019': {'name': 'สังคมประชาธิปไตยไทย', 'num': 19, 'color': '#aaaaaa'},
    'PARTY-0020': {'name': 'ฟิวชัน', 'num': 20, 'color': '#aaaaaa'},
    'PARTY-0021': {'name': 'ไทรวมพลัง', 'num': 21, 'color': '#65c76e'},
    'PARTY-0022': {'name': 'ก้าวอิสระ', 'num': 22, 'color': '#aaaaaa'},
    'PARTY-0023': {'name': 'ปวงชนไทย', 'num': 23, 'color': '#aaaaaa'},
    'PARTY-0024': {'name': 'วิชชั่นใหม่', 'num': 24, 'color': '#aaaaaa'},
    'PARTY-0025': {'name': 'เพื่อชีวิตใหม่', 'num': 25, 'color': '#aaaaaa'},
    'PARTY-0026': {'name': 'คลองไทย', 'num': 26, 'color': '#aaaaaa'},
    'PARTY-0027': {'name': 'ประชาธิปัตย์', 'num': 27, 'color': '#42b8ff'},
    'PARTY-0028': {'name': 'ไทยก้าวหน้า', 'num': 28, 'color': '#aaaaaa'},
    'PARTY-0029': {'name': 'ไทยภักดี', 'num': 29, 'color': '#c49a3e'},
    'PARTY-0030': {'name': 'แรงงานสร้างชาติ', 'num': 30, 'color': '#aaaaaa'},
    'PARTY-0031': {'name': 'ประชากรไทย', 'num': 31, 'color': '#aaaaaa'},
    'PARTY-0032': {'name': 'ครูไทยเพื่อประชาชน', 'num': 32, 'color': '#aaaaaa'},
    'PARTY-0033': {'name': 'ประชาชาติ', 'num': 33, 'color': '#3ec4a0'},
    'PARTY-0034': {'name': 'สร้างอนาคตไทย', 'num': 34, 'color': '#aaaaaa'},
    'PARTY-0035': {'name': 'รักชาติ', 'num': 35, 'color': '#aaaaaa'},
    'PARTY-0036': {'name': 'ไทยพร้อม', 'num': 36, 'color': '#aaaaaa'},
    'PARTY-0037': {'name': 'ภูมิใจไทย', 'num': 37, 'color': '#7b6be6'},
    'PARTY-0038': {'name': 'พลังธรรมใหม่', 'num': 38, 'color': '#aaaaaa'},
    'PARTY-0039': {'name': 'กรีน', 'num': 39, 'color': '#aaaaaa'},
    'PARTY-0040': {'name': 'ไทยธรรม', 'num': 40, 'color': '#aaaaaa'},
    'PARTY-0041': {'name': 'แผ่นดินธรรม', 'num': 41, 'color': '#aaaaaa'},
    'PARTY-0042': {'name': 'กล้าธรรม', 'num': 42, 'color': '#5ed88a'},
    'PARTY-0043': {'name': 'พลังประชารัฐ', 'num': 43, 'color': '#6c5ce7'},
    'PARTY-0044': {'name': 'โอกาสใหม่', 'num': 44, 'color': '#f58b93'},
    'PARTY-0045': {'name': 'เป็นธรรม', 'num': 45, 'color': '#aaaaaa'},
    'PARTY-0046': {'name': 'ประชาชน', 'num': 46, 'color': '#ff8a4d'},
    'PARTY-0047': {'name': 'ประชาไทย', 'num': 47, 'color': '#aaaaaa'},
    'PARTY-0048': {'name': 'ไทยสร้างไทย', 'num': 48, 'color': '#e8596e'},
    'PARTY-0049': {'name': 'ไทยก้าวใหม่', 'num': 49, 'color': '#26d4e8'},
    'PARTY-0050': {'name': 'ประชาอาสาชาติ', 'num': 50, 'color': '#aaaaaa'},
    'PARTY-0051': {'name': 'พร้อม', 'num': 51, 'color': '#aaaaaa'},
    'PARTY-0052': {'name': 'เครือข่ายชาวนาแห่งประเทศไทย', 'num': 52, 'color': '#aaaaaa'},
    'PARTY-0053': {'name': 'ไทยพิทักษ์ธรรม', 'num': 53, 'color': '#aaaaaa'},
    'PARTY-0054': {'name': 'ความหวังใหม่', 'num': 54, 'color': '#aaaaaa'},
    'PARTY-0055': {'name': 'ไทยรวมไทย', 'num': 55, 'color': '#aaaaaa'},
    'PARTY-0056': {'name': 'เพื่อบ้านเมือง', 'num': 56, 'color': '#aaaaaa'},
    'PARTY-0057': {'name': 'พลังไทยรักชาติ', 'num': 57, 'color': '#aaaaaa'},
    'PARTY-0058': {'name': 'รักษ์ธรรม', 'num': 58, 'color': '#aaaaaa'},
    'PARTY-0059': {'name': 'รวมพลัง', 'num': 59, 'color': '#aaaaaa'},
    'PARTY-0060': {'name': 'สัมมาธิปไตย', 'num': 60, 'color': '#aaaaaa'},
}

def get_party_name(party_code):
    return PARTY_META.get(party_code, {}).get('name', party_code)

def get_party_color(party_code):
    return PARTY_META.get(party_code, {}).get('color', '#cccccc')

def get_party_num(party_code):
    try:
        return int(party_code.replace('PARTY-', ''))
    except:
        return 0

def main():
    # Load area codes
    with open(AREA_CODE_FILE, 'r', encoding='utf-8') as f:
        area_data = json.load(f)
    area_name_map = {item['code']: item['name'] for item in area_data['areas']}

    # Load candidate data
    with open(CANDIDATE_FILE, 'r', encoding='utf-8') as f:
        candidate_raw = json.load(f)
    # Build lookup: candidateCode -> candidate info
    candidate_lookup = {}
    for c in candidate_raw['candidates']:
        candidate_lookup[c['code']] = c
    # Build area-based lookup: areaCode (e.g. "1001") -> list of candidates
    candidates_by_area = {}
    for c in candidate_raw['candidates']:
        area_key = c['areaCode'].replace('AREA-', '')
        if area_key not in candidates_by_area:
            candidates_by_area[area_key] = []
        candidates_by_area[area_key].append(c)

    # Extract province from area name
    def get_province(area_name):
        return area_name.split(' เขต')[0] if ' เขต' in area_name else area_name

    # Process all areas
    areas = []
    vote_buying_analysis = []
    party_vote_totals = {}  # partyCode -> total PL votes
    province_data = {}

    mp_files = sorted(glob.glob(os.path.join(MP_DIR, '*.json')))

    for mp_file in mp_files:
        area_code = os.path.basename(mp_file).replace('.json', '')
        pl_file = os.path.join(PL_DIR, f'{area_code}.json')

        if not os.path.exists(pl_file):
            continue

        with open(mp_file, 'r', encoding='utf-8') as f:
            mp_data = json.load(f)
        with open(pl_file, 'r', encoding='utf-8') as f:
            pl_data = json.load(f)

        area_name = area_name_map.get(area_code, f'เขต {area_code}')
        province = get_province(area_name)

        # MP entries
        mp_entries = []
        for entry in mp_data['entries']:
            mp_entries.append({
                'candidateCode': entry['candidateCode'],
                'partyCode': entry['partyCode'],
                'partyName': get_party_name(entry['partyCode']),
                'partyColor': get_party_color(entry['partyCode']),
                'rank': entry['rank'],
                'voteTotal': entry['voteTotal'],
                'votePercent': entry['votePercent'],
                'candidateNum': int(entry['candidateCode'][-2:]),
            })

        # PL entries (top 10)
        pl_entries = []
        for entry in sorted(pl_data['entries'], key=lambda x: x['rank'])[:10]:
            pl_entries.append({
                'partyCode': entry['partyCode'],
                'partyName': get_party_name(entry['partyCode']),
                'partyColor': get_party_color(entry['partyCode']),
                'partyNum': get_party_num(entry['partyCode']),
                'rank': entry['rank'],
                'voteTotal': entry['voteTotal'],
                'votePercent': entry['votePercent'],
            })

        # Accumulate PL votes
        for entry in pl_data['entries']:
            pc = entry['partyCode']
            if pc not in party_vote_totals:
                party_vote_totals[pc] = 0
            party_vote_totals[pc] += entry['voteTotal']

        # Vote buying analysis
        winner = next((e for e in mp_data['entries'] if e['rank'] == 1), None)
        if winner:
            candidate_num = int(winner['candidateCode'][-2:])
            target_party_id = f'PARTY-{str(candidate_num).zfill(4)}'
            winner_party_id = winner['partyCode']

            top_pl = sorted(pl_data['entries'], key=lambda x: x['rank'])[:7]
            top_pl_codes = [p['partyCode'] for p in top_pl]

            is_in_top_7 = target_party_id in top_pl_codes
            is_cross_party = target_party_id != winner_party_id
            is_suspicious = is_in_top_7 and is_cross_party

            # Get target party rank and votes in PL
            target_pl_entry = next((p for p in pl_data['entries'] if p['partyCode'] == target_party_id), None)

            vote_buying_analysis.append({
                'areaCode': area_code,
                'areaName': area_name,
                'province': province,
                'winnerPartyCode': winner_party_id,
                'winnerPartyName': get_party_name(winner_party_id),
                'winnerPartyColor': get_party_color(winner_party_id),
                'candidateNum': candidate_num,
                'targetPartyCode': target_party_id,
                'targetPartyName': get_party_name(target_party_id),
                'targetPartyNum': candidate_num,
                'isInTop7': is_in_top_7,
                'isCrossParty': is_cross_party,
                'isSuspicious': is_suspicious,
                'targetPlRank': target_pl_entry['rank'] if target_pl_entry else None,
                'targetPlVotes': target_pl_entry['voteTotal'] if target_pl_entry else 0,
                'targetPlPercent': target_pl_entry['votePercent'] if target_pl_entry else 0,
                'winnerVotes': winner['voteTotal'],
                'winnerPercent': winner['votePercent'],
            })

            # Province aggregation
            if province not in province_data:
                province_data[province] = {'total': 0, 'suspicious': 0}
            province_data[province]['total'] += 1
            if is_suspicious:
                province_data[province]['suspicious'] += 1

        areas.append({
            'areaCode': area_code,
            'areaName': area_name,
            'province': province,
            'mpEntries': mp_entries[:5],  # top 5 only
            'plEntries': pl_entries,
        })

    # Rank distribution for parties 1-5
    rank_distribution = []
    for mp_file in mp_files:
        area_code = os.path.basename(mp_file).replace('.json', '')
        pl_file = os.path.join(PL_DIR, f'{area_code}.json')
        if not os.path.exists(pl_file):
            continue

        with open(mp_file, 'r', encoding='utf-8') as f:
            mp_data = json.load(f)
        with open(pl_file, 'r', encoding='utf-8') as f:
            pl_data = json.load(f)

        winner = next((e for e in mp_data['entries'] if e['rank'] == 1), None)
        if not winner:
            continue
        winner_num = int(winner['candidateCode'][-2:])

        party_ranks = {entry['partyCode']: entry['rank'] for entry in pl_data['entries']}

        for p_num in range(1, 6):
            p_id = f'PARTY-{str(p_num).zfill(4)}'
            if p_id in party_ranks:
                rank_distribution.append({
                    'partyNum': p_num,
                    'partyName': get_party_name(p_id),
                    'rank': party_ranks[p_id],
                    'isSuspicious': winner_num == p_num,
                    'areaCode': area_code,
                })

    # ===== DEEP DIVE: Scatter data (MP winner votes vs target PL votes) =====
    scatter_data = []
    for item in vote_buying_analysis:
        if item['targetPlVotes'] > 0:
            scatter_data.append({
                'areaCode': item['areaCode'],
                'areaName': item['areaName'],
                'province': item['province'],
                'winnerPartyName': item['winnerPartyName'],
                'winnerPartyColor': item['winnerPartyColor'],
                'mpVotes': item['winnerVotes'],
                'mpPercent': item['winnerPercent'],
                'plVotes': item['targetPlVotes'],
                'plPercent': item['targetPlPercent'],
                'plRank': item['targetPlRank'],
                'candidateNum': item['candidateNum'],
                'isSuspicious': item['isSuspicious'],
            })

    # ===== DEEP DIVE: Area detail with MP vs PL side-by-side =====
    area_details = []
    for mp_file in mp_files:
        area_code = os.path.basename(mp_file).replace('.json', '')
        pl_file = os.path.join(PL_DIR, f'{area_code}.json')
        if not os.path.exists(pl_file):
            continue

        with open(mp_file, 'r', encoding='utf-8') as f:
            mp_data = json.load(f)
        with open(pl_file, 'r', encoding='utf-8') as f:
            pl_data = json.load(f)

        area_name = area_name_map.get(area_code, f'เขต {area_code}')

        # Get candidate info for this area
        area_candidates = candidates_by_area.get(area_code, [])
        cand_by_num = {c['number']: c for c in area_candidates}

        # Build MP lookup: candidateNum -> entry
        mp_by_num = {}
        for entry in mp_data['entries']:
            num = int(entry['candidateCode'][-2:])
            cand = cand_by_num.get(num)
            mp_by_num[num] = {
                'rank': entry['rank'],
                'partyName': get_party_name(entry['partyCode']),
                'partyColor': get_party_color(entry['partyCode']),
                'voteTotal': entry['voteTotal'],
                'votePercent': entry['votePercent'],
                'candidateName': f"{cand['prefix']}{cand['firstName']} {cand['lastName']}" if cand else '',
                'is66Winner': cand['is66Winner'] if cand else False,
                'switchedParty': cand['switchedParty'] if cand else None,
                'party66RefCode': cand['party66RefCode'] if cand else None,
            }

        # Build PL lookup: partyNum -> entry
        pl_by_num = {}
        for entry in pl_data['entries']:
            num = get_party_num(entry['partyCode'])
            pl_by_num[num] = {
                'rank': entry['rank'],
                'partyName': get_party_name(entry['partyCode']),
                'partyColor': get_party_color(entry['partyCode']),
                'voteTotal': entry['voteTotal'],
                'votePercent': entry['votePercent'],
            }

        # Combine: for each number, show MP candidate and PL party side by side
        combined = []
        all_nums = sorted(set(list(mp_by_num.keys()) + list(pl_by_num.keys())))
        for num in all_nums:
            mp_entry = mp_by_num.get(num)
            pl_entry = pl_by_num.get(num)
            combined.append({
                'num': num,
                'mp': mp_entry,
                'pl': pl_entry,
            })

        winner = next((e for e in mp_data['entries'] if e['rank'] == 1), None)
        winner_num = int(winner['candidateCode'][-2:]) if winner else None
        winner_cand = cand_by_num.get(winner_num) if winner_num else None

        # Find the vote buying analysis for this area
        area_analysis = next((a for a in vote_buying_analysis if a['areaCode'] == area_code), None)

        area_details.append({
            'areaCode': area_code,
            'areaName': area_name,
            'province': get_province(area_name),
            'winnerNum': winner_num,
            'winnerPartyName': get_party_name(winner['partyCode']) if winner else '',
            'winnerPartyColor': get_party_color(winner['partyCode']) if winner else '',
            'winnerName': f"{winner_cand['prefix']}{winner_cand['firstName']} {winner_cand['lastName']}" if winner_cand else '',
            'winnerIs66Winner': winner_cand['is66Winner'] if winner_cand else False,
            'winnerSwitchedParty': winner_cand['switchedParty'] if winner_cand else None,
            'isSuspicious': area_analysis['isSuspicious'] if area_analysis else False,
            'targetPartyNum': area_analysis['targetPartyNum'] if area_analysis else None,
            'combined': combined,
        })

    # ===== DEEP DIVE: Candidate number frequency per party =====
    candidate_numbers = []
    for mp_file in mp_files:
        with open(mp_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for entry in data['entries']:
            pc = entry['partyCode']
            if pc in ['PARTY-0009', 'PARTY-0027', 'PARTY-0037', 'PARTY-0042', 'PARTY-0046']:
                candidate_numbers.append({
                    'partyCode': pc,
                    'partyName': get_party_name(pc),
                    'partyColor': get_party_color(pc),
                    'number': int(entry['candidateCode'][-2:]),
                    'won': entry['rank'] == 1,
                    'voteTotal': entry['voteTotal'],
                })

    # ===== DEEP DIVE: Regional heatmap (province -> winner party breakdown) =====
    region_map = {
        'กรุงเทพมหานคร': 'กลาง',
        'นนทบุรี': 'กลาง', 'ปทุมธานี': 'กลาง', 'สมุทรปราการ': 'กลาง', 'สมุทรสาคร': 'กลาง',
        'นครปฐม': 'กลาง', 'พระนครศรีอยุธยา': 'กลาง', 'อ่างทอง': 'กลาง', 'ลพบุรี': 'กลาง',
        'สิงห์บุรี': 'กลาง', 'ชัยนาท': 'กลาง', 'สระบุรี': 'กลาง', 'สุพรรณบุรี': 'กลาง',
        'นครนายก': 'กลาง', 'ปราจีนบุรี': 'ตะวันออก', 'สระแก้ว': 'ตะวันออก',
        'ชลบุรี': 'ตะวันออก', 'ระยอง': 'ตะวันออก', 'จันทบุรี': 'ตะวันออก', 'ตราด': 'ตะวันออก',
        'ฉะเชิงเทรา': 'ตะวันออก', 'สมุทรสงคราม': 'กลาง',
        'เพชรบุรี': 'ตะวันตก', 'ประจวบคีรีขันธ์': 'ตะวันตก', 'กาญจนบุรี': 'ตะวันตก',
        'ราชบุรี': 'ตะวันตก', 'ตาก': 'ตะวันตก',
        'เชียงใหม่': 'เหนือ', 'เชียงราย': 'เหนือ', 'ลำปาง': 'เหนือ', 'ลำพูน': 'เหนือ',
        'แม่ฮ่องสอน': 'เหนือ', 'น่าน': 'เหนือ', 'พะเยา': 'เหนือ', 'แพร่': 'เหนือ',
        'อุตรดิตถ์': 'เหนือ', 'สุโขทัย': 'เหนือ', 'พิษณุโลก': 'เหนือ', 'พิจิตร': 'เหนือ',
        'เพชรบูรณ์': 'เหนือ', 'กำแพงเพชร': 'เหนือ', 'นครสวรรค์': 'เหนือ', 'อุทัยธานี': 'เหนือ',
        'นครราชสีมา': 'อีสาน', 'บุรีรัมย์': 'อีสาน', 'สุรินทร์': 'อีสาน', 'ศรีสะเกษ': 'อีสาน',
        'อุบลราชธานี': 'อีสาน', 'ยโสธร': 'อีสาน', 'อำนาจเจริญ': 'อีสาน',
        'ชัยภูมิ': 'อีสาน', 'ขอนแก่น': 'อีสาน', 'มหาสารคาม': 'อีสาน',
        'กาฬสินธุ์': 'อีสาน', 'ร้อยเอ็ด': 'อีสาน',
        'อุดรธานี': 'อีสาน', 'หนองคาย': 'อีสาน', 'หนองบัวลำภู': 'อีสาน',
        'เลย': 'อีสาน', 'สกลนคร': 'อีสาน', 'นครพนม': 'อีสาน', 'มุกดาหาร': 'อีสาน',
        'บึงกาฬ': 'อีสาน',
        'นครศรีธรรมราช': 'ใต้', 'สุราษฎร์ธานี': 'ใต้', 'ชุมพร': 'ใต้', 'ระนอง': 'ใต้',
        'พังงา': 'ใต้', 'ภูเก็ต': 'ใต้', 'กระบี่': 'ใต้', 'ตรัง': 'ใต้', 'พัทลุง': 'ใต้',
        'สงขลา': 'ใต้', 'สตูล': 'ใต้', 'ปัตตานี': 'ใต้', 'ยะลา': 'ใต้', 'นราธิวาส': 'ใต้',
    }

    region_party_breakdown = {}
    for item in vote_buying_analysis:
        province = item['province']
        region = region_map.get(province, 'อื่นๆ')
        wp = item['winnerPartyName']

        if region not in region_party_breakdown:
            region_party_breakdown[region] = {'total': 0, 'suspicious': 0, 'parties': {}}
        region_party_breakdown[region]['total'] += 1
        if item['isSuspicious']:
            region_party_breakdown[region]['suspicious'] += 1

        if wp not in region_party_breakdown[region]['parties']:
            region_party_breakdown[region]['parties'][wp] = {'total': 0, 'suspicious': 0, 'color': item['winnerPartyColor']}
        region_party_breakdown[region]['parties'][wp]['total'] += 1
        if item['isSuspicious']:
            region_party_breakdown[region]['parties'][wp]['suspicious'] += 1

    region_summary = []
    for region, rdata in region_party_breakdown.items():
        parties_list = []
        for pname, pdata in rdata['parties'].items():
            parties_list.append({
                'partyName': pname,
                'color': pdata['color'],
                'total': pdata['total'],
                'suspicious': pdata['suspicious'],
            })
        parties_list.sort(key=lambda x: x['total'], reverse=True)
        region_summary.append({
            'region': region,
            'total': rdata['total'],
            'suspicious': rdata['suspicious'],
            'suspiciousPercent': round(rdata['suspicious'] / rdata['total'] * 100, 1) if rdata['total'] > 0 else 0,
            'parties': parties_list,
        })
    region_summary.sort(key=lambda x: x['total'], reverse=True)

    # ===== DEEP DIVE: Vote correlation (PL target party votes vs median PL votes) =====
    vote_anomaly = []
    for item in vote_buying_analysis:
        if not item['isSuspicious']:
            continue
        area_code = item['areaCode']
        pl_file = os.path.join(PL_DIR, f'{area_code}.json')
        if not os.path.exists(pl_file):
            continue
        with open(pl_file, 'r', encoding='utf-8') as f:
            pl_data = json.load(f)

        # Compute median votes for non-top-4 parties (excluding big 4)
        big_parties = {'PARTY-0046', 'PARTY-0027', 'PARTY-0009', 'PARTY-0037', 'PARTY-0006', 'PARTY-0029'}
        small_party_votes = [e['voteTotal'] for e in pl_data['entries'] if e['partyCode'] not in big_parties and e['voteTotal'] > 0]
        small_party_votes.sort()
        if small_party_votes:
            mid = len(small_party_votes) // 2
            median_small = small_party_votes[mid]
        else:
            median_small = 0

        target_votes = item['targetPlVotes']
        anomaly_ratio = round(target_votes / median_small, 1) if median_small > 0 else 0

        vote_anomaly.append({
            'areaCode': item['areaCode'],
            'areaName': item['areaName'],
            'province': item['province'],
            'winnerPartyName': item['winnerPartyName'],
            'winnerPartyColor': item['winnerPartyColor'],
            'candidateNum': item['candidateNum'],
            'targetPartyName': item['targetPartyName'],
            'targetPlVotes': target_votes,
            'targetPlPercent': item['targetPlPercent'],
            'targetPlRank': item['targetPlRank'],
            'medianSmallPartyVotes': median_small,
            'anomalyRatio': anomaly_ratio,
        })
    vote_anomaly.sort(key=lambda x: x['anomalyRatio'], reverse=True)

    # Suspicious count by winner party
    suspicious_by_party = {}
    for item in vote_buying_analysis:
        wp = item['winnerPartyCode']
        if wp not in suspicious_by_party:
            suspicious_by_party[wp] = {'total': 0, 'suspicious': 0, 'partyCode': wp, 'partyName': item['winnerPartyName'], 'color': item['winnerPartyColor']}
        suspicious_by_party[wp]['total'] += 1
        if item['isSuspicious']:
            suspicious_by_party[wp]['suspicious'] += 1

    # Top benefiting parties
    target_party_counts = {}
    for item in vote_buying_analysis:
        if item['isSuspicious']:
            tp = item['targetPartyCode']
            wp = item['winnerPartyCode']
            key = f"{tp}|{wp}"
            if key not in target_party_counts:
                target_party_counts[key] = {
                    'targetParty': tp,
                    'targetPartyName': item['targetPartyName'],
                    'targetPartyNum': item['targetPartyNum'],
                    'winnerParty': wp,
                    'winnerPartyName': item['winnerPartyName'],
                    'winnerPartyColor': item['winnerPartyColor'],
                    'count': 0
                }
            target_party_counts[key]['count'] += 1

    # Province summary
    province_summary = []
    for prov, data in sorted(province_data.items()):
        province_summary.append({
            'province': prov,
            'totalAreas': data['total'],
            'suspiciousAreas': data['suspicious'],
            'suspiciousPercent': round(data['suspicious'] / data['total'] * 100, 1) if data['total'] > 0 else 0,
        })

    # Summary stats
    total_areas = len(vote_buying_analysis)
    total_suspicious = sum(1 for x in vote_buying_analysis if x['isSuspicious'])

    # ===== CANDIDATE DATA: Party Switcher Analysis =====
    # party66RefCode is the party NUMBER from 2566 election (e.g. "31" means party #31 in 2566)
    # We need the 2566 party name mapping — approximate from known data
    PARTY_66_NAMES = {
        '1': 'ก้าวไกล', '2': 'เพื่อไทย', '3': 'รวมไทยสร้างชาติ', '4': 'ภูมิใจไทย',
        '5': 'พลังประชารัฐ', '6': 'ประชาธิปัตย์', '7': 'ไทยสร้างไทย', '8': 'ชาติไทยพัฒนา',
        '9': 'ประชาชาติ', '10': 'เสรีรวมไทย', '11': 'ชาติพัฒนากล้า',
        '14': 'ไทยภักดี', '21': 'ท้องที่ไทย', '22': 'พลังสังคมใหม่',
        '25': 'ประชาธิปไตยใหม่', '26': 'ไทยศรีวิไลย์',
        '29': 'เพื่อไทรวมพลัง', '31': 'ก้าวไกล (ก้าวไกล/ประชาชน)',
        '32': 'พรรค #32', '37': 'เพื่อชาติ',
    }

    # Build flow: from party66 -> to current party (top flows)
    switcher_flows = {}
    for c in candidate_raw['candidates']:
        if c['switchedParty'] != True:
            continue
        from_code = c.get('party66RefCode', '')
        to_code = c['partyCode']
        if not from_code:
            continue
        from_name = PARTY_66_NAMES.get(from_code, f'พรรค66 #{from_code}')
        to_name = get_party_name(to_code)
        to_color = get_party_color(to_code)
        key = f"{from_code}|{to_code}"
        if key not in switcher_flows:
            switcher_flows[key] = {
                'fromParty66': from_name,
                'fromCode66': from_code,
                'toParty': to_name,
                'toPartyCode': to_code,
                'toColor': to_color,
                'count': 0,
                'names': [],
            }
        switcher_flows[key]['count'] += 1
        if len(switcher_flows[key]['names']) < 3:  # Keep up to 3 example names
            switcher_flows[key]['names'].append(f"{c['prefix']}{c['firstName']} {c['lastName']}")

    party_switcher_data = sorted(switcher_flows.values(), key=lambda x: x['count'], reverse=True)

    # Aggregate: how many candidates each current party received from other parties
    switcher_to_summary = {}
    for flow in party_switcher_data:
        tp = flow['toParty']
        if tp not in switcher_to_summary:
            switcher_to_summary[tp] = {'party': tp, 'color': flow['toColor'], 'received': 0, 'sources': []}
        switcher_to_summary[tp]['received'] += flow['count']
        switcher_to_summary[tp]['sources'].append({
            'fromParty': flow['fromParty66'],
            'count': flow['count'],
        })
    switcher_to_list = sorted(switcher_to_summary.values(), key=lambda x: x['received'], reverse=True)[:15]

    # ===== CANDIDATE DATA: Winner Retention (is66Winner) =====
    # For each area, check if the winner was also a winner in 2566
    winner_retention = []
    retention_by_party = {}

    for mp_file in mp_files:
        area_code = os.path.basename(mp_file).replace('.json', '')
        with open(mp_file, 'r', encoding='utf-8') as f:
            mp_data = json.load(f)
        area_name = area_name_map.get(area_code, f'เขต {area_code}')

        winner = next((e for e in mp_data['entries'] if e['rank'] == 1), None)
        if not winner:
            continue
        winner_num = int(winner['candidateCode'][-2:])
        winner_party = get_party_name(winner['partyCode'])
        winner_color = get_party_color(winner['partyCode'])

        area_cands = candidates_by_area.get(area_code, [])
        winner_cand = next((c for c in area_cands if c['number'] == winner_num), None)

        if not winner_cand:
            continue

        is_66_winner = winner_cand['is66Winner']
        switched = winner_cand['switchedParty']
        party66_ref = winner_cand.get('party66RefCode', '')

        # Determine status
        if is_66_winner and switched == True:
            status = 'ย้ายพรรค+ชนะ'  # Won in 66, switched party, won again
        elif is_66_winner and switched == False:
            status = 'อยู่พรรคเดิม+ชนะ'  # Won in 66, stayed, won again
        elif is_66_winner and switched is None:
            status = 'อยู่พรรคเดิม+ชนะ'  # Won in 66, stayed
        else:
            status = 'หน้าใหม่ชนะ'  # New winner

        winner_retention.append({
            'areaCode': area_code,
            'areaName': area_name,
            'winnerName': f"{winner_cand['prefix']}{winner_cand['firstName']} {winner_cand['lastName']}",
            'partyName': winner_party,
            'partyColor': winner_color,
            'is66Winner': is_66_winner,
            'switchedParty': switched,
            'party66Ref': PARTY_66_NAMES.get(party66_ref, f'#{party66_ref}') if party66_ref else '',
            'status': status,
        })

        # Aggregate by party
        if winner_party not in retention_by_party:
            retention_by_party[winner_party] = {
                'party': winner_party,
                'color': winner_color,
                'total': 0,
                'retained': 0,   # is66Winner + not switched
                'switched': 0,   # is66Winner + switched
                'newFace': 0,    # not is66Winner
            }
        retention_by_party[winner_party]['total'] += 1
        if is_66_winner and switched == True:
            retention_by_party[winner_party]['switched'] += 1
        elif is_66_winner:
            retention_by_party[winner_party]['retained'] += 1
        else:
            retention_by_party[winner_party]['newFace'] += 1

    retention_summary = sorted(retention_by_party.values(), key=lambda x: x['total'], reverse=True)

    # Also find: is66Winner candidates who LOST in 2569
    all_66_winners = [c for c in candidate_raw['candidates'] if c['is66Winner']]
    lost_66_winners = []
    for c in all_66_winners:
        area_code = c['areaCode'].replace('AREA-', '')
        mp_file = os.path.join(MP_DIR, f'{area_code}.json')
        if not os.path.exists(mp_file):
            continue
        with open(mp_file, 'r', encoding='utf-8') as f:
            mp_data = json.load(f)
        # Check if this candidate won
        cand_entry = next((e for e in mp_data['entries'] if int(e['candidateCode'][-2:]) == c['number']), None)
        if cand_entry and cand_entry['rank'] != 1:
            area_name = area_name_map.get(area_code, f'เขต {area_code}')
            lost_66_winners.append({
                'areaCode': area_code,
                'areaName': area_name,
                'name': f"{c['prefix']}{c['firstName']} {c['lastName']}",
                'partyName': get_party_name(c['partyCode']),
                'partyColor': get_party_color(c['partyCode']),
                'rank': cand_entry['rank'],
                'voteTotal': cand_entry['voteTotal'],
                'switchedParty': c['switchedParty'],
                'party66Ref': PARTY_66_NAMES.get(c.get('party66RefCode', ''), '') if c.get('party66RefCode') else '',
            })
    lost_66_winners.sort(key=lambda x: x['rank'])

    # ===== NEW DATA: Constituency, Party-list, Referendum from ThaiPBS API =====
    constituency_data = {}
    partylist_data = {}
    referendum_data = {}

    if os.path.exists(CONSTITUENCY_FILE):
        with open(CONSTITUENCY_FILE, 'r', encoding='utf-8') as f:
            raw = json.load(f)
        for item in raw.get('data', []):
            ac = item['areaCode'].replace('AREA-', '')
            constituency_data[ac] = item

    if os.path.exists(PARTYLIST_FILE):
        with open(PARTYLIST_FILE, 'r', encoding='utf-8') as f:
            raw = json.load(f)
        for item in raw.get('data', []):
            ac = item['areaCode'].replace('AREA-', '')
            partylist_data[ac] = item

    if os.path.exists(REFERENDUM_FILE):
        with open(REFERENDUM_FILE, 'r', encoding='utf-8') as f:
            raw = json.load(f)
        for item in raw.get('data', []):
            ac = item['areaCode'].replace('AREA-', '')
            referendum_data[ac] = item

    # ===== Focus Areas (ThaiPBS editorial groupings) =====
    focus_area_tags = {}  # areaCode -> list of tags
    if os.path.exists(FOCUS_AREAS_FILE):
        with open(FOCUS_AREAS_FILE, 'r', encoding='utf-8') as f:
            fa_raw = json.load(f)
        for group in fa_raw.get('groups', []):
            tag = group.get('tag', '')
            for ac_full in group.get('areaCodes', []):
                ac = ac_full.replace('AREA-', '')
                if ac not in focus_area_tags:
                    focus_area_tags[ac] = []
                focus_area_tags[ac].append(tag)

    # ===== NEW TAB: Turnout Anomaly =====
    turnout_anomaly = []
    all_turnout_pcts = []
    for ac, cd in constituency_data.items():
        if cd.get('totalEligibleVoters', 0) > 0 and cd.get('voteProgressPercent', 0) > 0:
            all_turnout_pcts.append(cd['voteProgressPercent'])
    avg_turnout = sum(all_turnout_pcts) / len(all_turnout_pcts) if all_turnout_pcts else 0

    for ac, cd in constituency_data.items():
        area_name = area_name_map.get(ac, f'เขต {ac}')
        province = get_province(area_name)
        turnout_pct = cd.get('voteProgressPercent', 0)
        eligible = cd.get('totalEligibleVoters', 0)
        if eligible == 0:
            continue
        deviation = round(turnout_pct - avg_turnout, 2)
        winner_code = cd.get('winnerPartyCode', '')
        turnout_anomaly.append({
            'areaCode': ac,
            'areaName': area_name,
            'province': province,
            'turnoutPercent': turnout_pct,
            'eligibleVoters': eligible,
            'deviation': deviation,
            'winnerParty': get_party_name(winner_code),
            'winnerPartyColor': get_party_color(winner_code),
        })
    turnout_anomaly.sort(key=lambda x: abs(x['deviation']), reverse=True)

    # ===== NEW TAB: Vote Splitting (MP winner vs PL winner mismatch) =====
    vote_splitting = []
    for ac in constituency_data:
        cd = constituency_data[ac]
        pd = partylist_data.get(ac)
        if not pd:
            continue
        area_name = area_name_map.get(ac, f'เขต {ac}')
        province = get_province(area_name)
        mp_winner_code = cd.get('winnerPartyCode', '')
        pl_winner_code = pd.get('winnerPartyCode', '')
        is_split = mp_winner_code != pl_winner_code

        # Get top entries for context
        mp_top = cd.get('topEntries', [])
        pl_top = pd.get('topEntries', [])

        mp_winner_pct = mp_top[0]['votePercent'] if mp_top else 0
        pl_winner_pct = pl_top[0]['votePercent'] if pl_top else 0

        vote_splitting.append({
            'areaCode': ac,
            'areaName': area_name,
            'province': province,
            'mpWinnerParty': get_party_name(mp_winner_code),
            'mpWinnerColor': get_party_color(mp_winner_code),
            'mpWinnerPercent': mp_winner_pct,
            'plWinnerParty': get_party_name(pl_winner_code),
            'plWinnerColor': get_party_color(pl_winner_code),
            'plWinnerPercent': pl_winner_pct,
            'isSplit': is_split,
        })
    vote_splitting.sort(key=lambda x: (not x['isSplit'], -abs(x['mpWinnerPercent'] - x['plWinnerPercent'])))

    # ===== NEW TAB: Winning Margin (closest & landslide races) =====
    winning_margins = []
    for ac, cd in constituency_data.items():
        top = cd.get('topEntries', [])
        if len(top) < 2:
            continue
        area_name = area_name_map.get(ac, f'เขต {ac}')
        province = get_province(area_name)
        winner = top[0]
        runner_up = top[1]
        margin = winner['voteTotal'] - runner_up['voteTotal']
        total_votes = winner['voteTotal'] + runner_up['voteTotal']
        margin_pct = round(margin / total_votes * 100, 2) if total_votes > 0 else 0

        winner_code = cd.get('winnerPartyCode', '')
        # Try to get runner-up party code from candidate data
        runner_up_cand_code = runner_up.get('candidateCode', '')
        runner_up_num = int(runner_up_cand_code[-2:]) if runner_up_cand_code else 0
        runner_up_area_cands = candidates_by_area.get(ac, [])
        runner_up_cand = next((c for c in runner_up_area_cands if c['number'] == runner_up_num), None)
        runner_up_party_code = runner_up_cand['partyCode'] if runner_up_cand else ''

        winning_margins.append({
            'areaCode': ac,
            'areaName': area_name,
            'province': province,
            'winnerParty': get_party_name(winner_code),
            'winnerVotes': winner['voteTotal'],
            'winnerPercent': winner['votePercent'],
            'winnerPartyColor': get_party_color(winner_code),
            'runnerUpParty': get_party_name(runner_up_party_code),
            'runnerUpVotes': runner_up['voteTotal'],
            'runnerUpPercent': runner_up['votePercent'],
            'margin': margin,
            'marginPercent': margin_pct,
        })
    winning_margins.sort(key=lambda x: x['marginPercent'])

    # ===== NEW TAB: Referendum Correlation =====
    referendum_correlation = []
    for ac, rd in referendum_data.items():
        area_name = area_name_map.get(ac, f'เขต {ac}')
        province = get_province(area_name)
        entries = rd.get('entries', [])
        agree_entry = next((e for e in entries if e['answerCode'] == 'agree'), None)
        disagree_entry = next((e for e in entries if e['answerCode'] == 'disagree'), None)
        agree_pct = agree_entry['votePercent'] if agree_entry else 0
        disagree_pct = disagree_entry['votePercent'] if disagree_entry else 0
        turnout_pct = rd.get('voteProgressPercent', 0)

        # Match with constituency winner
        cd = constituency_data.get(ac)
        mp_winner_code = cd.get('winnerPartyCode', '') if cd else ''
        mp_top = cd.get('topEntries', []) if cd else []
        mp_winner_pct = mp_top[0]['votePercent'] if mp_top else 0

        referendum_correlation.append({
            'areaCode': ac,
            'areaName': area_name,
            'province': province,
            'agreePercent': agree_pct,
            'disagreePercent': disagree_pct,
            'turnoutPercent': turnout_pct,
            'mpWinnerParty': get_party_name(mp_winner_code),
            'mpWinnerPercent': mp_winner_pct,
            'winnerPartyColor': get_party_color(mp_winner_code),
        })
    referendum_correlation.sort(key=lambda x: x['agreePercent'], reverse=True)

    # ===== ENSEMBLE SUSPICION SCORE V3 =====
    # V3 Improvements over V2:
    # 1. Spoiled Ballot Ratio feature
    # 2. Winner Dominance (HHI-based) feature
    # 3. Entropy Weight Method (data-driven weights instead of hardcoded)
    # 4. Permutation Test (retained from V2)
    # 5. Spatial Analysis (Moran's I) for geographic clustering
    # 6. Semi-supervised pseudo-labels from extreme cases
    import statistics as stat_module
    import random as rng_module
    import math
    import bisect
    rng_module.seed(42)  # Reproducible results

    print("  🧪 Building Ensemble V3...")

    def robust_z_score(value, values_list):
        """Compute Robust Z-Score using Median and IQR instead of Mean/StdDev."""
        if len(values_list) < 5:
            return 0.0
        sorted_vals = sorted(values_list)
        n = len(sorted_vals)
        q1 = sorted_vals[n // 4]
        q3 = sorted_vals[3 * n // 4]
        median = stat_module.median(sorted_vals)
        iqr = q3 - q1
        if iqr == 0:
            return 0.0
        return 0.6745 * (value - median) / (iqr / 2)

    def population_weight(eligible_voters, all_eligible):
        """Areas with very few voters → weight down to reduce false positives."""
        if not all_eligible:
            return 1.0
        median_pop = stat_module.median(all_eligible)
        ratio = eligible_voters / median_pop if median_pop > 0 else 1.0
        return max(0.5, min(1.2, 0.7 + 0.3 * ratio))

    # Collect eligible voters for population weighting
    eligible_by_area = {}
    all_eligible_list = []
    for ac, cd in constituency_data.items():
        ev = cd.get('totalEligibleVoters', 0)
        if ev > 0:
            eligible_by_area[ac] = ev
            all_eligible_list.append(ev)

    # ── Component 1: MP-PL Gap ──
    gap_scores = {}
    all_gap_pcts = []
    for mp_file in mp_files:
        ac = os.path.basename(mp_file).replace('.json', '')
        pl_file_path = os.path.join(PL_DIR, f'{ac}.json')
        if not os.path.exists(pl_file_path):
            continue
        with open(mp_file, 'r', encoding='utf-8') as f:
            mp_raw = json.load(f)
        with open(pl_file_path, 'r', encoding='utf-8') as f:
            pl_raw = json.load(f)

        mp_winner_entry = sorted(mp_raw['entries'], key=lambda x: -x['voteTotal'])[0]
        pl_votes_map = {e['partyCode']: e['voteTotal'] for e in pl_raw['entries']}
        pl_for_winner = pl_votes_map.get(mp_winner_entry['partyCode'], 0)

        if mp_winner_entry['voteTotal'] > 0:
            gap_pct = (mp_winner_entry['voteTotal'] - pl_for_winner) / mp_winner_entry['voteTotal'] * 100
        else:
            gap_pct = 0
        gap_pct = max(0, gap_pct)
        all_gap_pcts.append(gap_pct)
        gap_scores[ac] = {
            'gapPercent': gap_pct,
            'mpVotes': mp_winner_entry['voteTotal'],
            'plVotes': pl_for_winner,
            'winnerPartyCode': mp_winner_entry['partyCode'],
        }

    for ac in gap_scores:
        rz = robust_z_score(gap_scores[ac]['gapPercent'], all_gap_pcts)
        gap_scores[ac]['robustZ'] = rz
        gap_scores[ac]['scaledScore'] = max(0, min(100, rz * 20))

    # ── Component 2: PL Deviation ──
    pl_by_party_all = {}
    pl_by_area_all = {}
    for pl_file_path in sorted(glob.glob(os.path.join(PL_DIR, '*.json'))):
        ac = os.path.basename(pl_file_path).replace('.json', '')
        with open(pl_file_path, 'r', encoding='utf-8') as f:
            pl_raw = json.load(f)
        pl_by_area_all[ac] = {}
        for e in pl_raw['entries']:
            pc = e['partyCode']
            if pc not in pl_by_party_all:
                pl_by_party_all[pc] = []
            pl_by_party_all[pc].append(e['voteTotal'])
            pl_by_area_all[ac][pc] = e['voteTotal']

    pl_baselines = {}
    for pc, votes in pl_by_party_all.items():
        if len(votes) > 10:
            median_v = stat_module.median(votes)
            sorted_v = sorted(votes)
            n = len(sorted_v)
            q1 = sorted_v[n // 4]
            q3 = sorted_v[3 * n // 4]
            iqr = q3 - q1
            pl_baselines[pc] = {'median': median_v, 'iqr': max(iqr, 1)}

    small_party_codes = [pc for pc, b in pl_baselines.items() if b['median'] < 3000]

    dev_scores = {}
    for ac in pl_by_area_all:
        max_robust_z = 0
        top_dev_party = ''
        top_dev_votes = 0
        top_dev_baseline = 0
        for pc in small_party_codes:
            if pc in pl_by_area_all[ac] and pc in pl_baselines:
                rz = robust_z_score(pl_by_area_all[ac][pc], pl_by_party_all[pc])
                if rz > max_robust_z:
                    max_robust_z = rz
                    top_dev_party = pc
                    top_dev_votes = pl_by_area_all[ac][pc]
                    top_dev_baseline = pl_baselines[pc]['median']
        dev_scores[ac] = {
            'robustZScore': max_robust_z,
            'scaledScore': min(max_robust_z * 15, 100),
            'topDevPartyCode': top_dev_party,
            'topDevPartyName': get_party_name(top_dev_party) if top_dev_party else '',
            'topDevVotes': top_dev_votes,
            'topDevBaseline': round(top_dev_baseline),
        }

    # ── Component 3: Turnout anomaly ──
    turnout_scores = {}
    all_turnout_for_robust = [t['deviation'] for t in turnout_anomaly]
    for t in turnout_anomaly:
        rz = abs(robust_z_score(t['deviation'], all_turnout_for_robust))
        turnout_scores[t['areaCode']] = {
            'deviation': t['deviation'],
            'robustZ': rz,
            'scaledScore': min(rz * 20, 100),
        }

    # ── Component 4: Competition / Concentration (Candidate Count) ──
    candidate_counts = {}
    all_candidate_counts = []
    for mp_file in mp_files:
        ac = os.path.basename(mp_file).replace('.json', '')
        with open(mp_file, 'r', encoding='utf-8') as f:
            mp_raw = json.load(f)
        count = len(mp_raw['entries'])
        candidate_counts[ac] = count
        all_candidate_counts.append(count)

    concentration_scores = {}
    all_concentrations = []
    for ac in candidate_counts:
        if ac in gap_scores and candidate_counts[ac] > 0:
            g = gap_scores[ac]
            count = candidate_counts[ac]
            median_count = stat_module.median(all_candidate_counts) if all_candidate_counts else 8
            competition_factor = median_count / max(count, 1)
            concentration = g['gapPercent'] * competition_factor * 0.5
            all_concentrations.append(concentration)
            concentration_scores[ac] = concentration

    for ac in list(concentration_scores.keys()):
        if not isinstance(concentration_scores[ac], dict):
            raw_val = concentration_scores[ac]
            rz = robust_z_score(raw_val, all_concentrations)
            concentration_scores[ac] = {
                'rawScore': raw_val,
                'scaledScore': max(0, min(100, rz * 20)),
                'candidateCount': candidate_counts.get(ac, 0),
            }

    # ── Component 5: Vote Consistency (MP total vs PL total) ──
    consistency_scores = {}
    all_consistency = []
    for mp_file in mp_files:
        ac = os.path.basename(mp_file).replace('.json', '')
        pl_file_path = os.path.join(PL_DIR, f'{ac}.json')
        if not os.path.exists(pl_file_path):
            continue
        with open(mp_file, 'r', encoding='utf-8') as f:
            mp_raw = json.load(f)
        with open(pl_file_path, 'r', encoding='utf-8') as f:
            pl_raw = json.load(f)
        total_mp = sum(e['voteTotal'] for e in mp_raw['entries'])
        total_pl = sum(e['voteTotal'] for e in pl_raw['entries'])
        if total_mp > 0:
            diff_pct = abs(total_mp - total_pl) / total_mp * 100
        else:
            diff_pct = 0
        all_consistency.append(diff_pct)
        consistency_scores[ac] = diff_pct

    for ac in list(consistency_scores.keys()):
        if not isinstance(consistency_scores[ac], dict):
            raw_val = consistency_scores[ac]
            rz = robust_z_score(raw_val, all_consistency)
            consistency_scores[ac] = {
                'diffPercent': raw_val,
                'scaledScore': max(0, min(100, rz * 20)),
            }

    # ── Build all_area_codes early (needed by Components 6, 7, 8) ──
    all_area_codes = sorted(set(gap_scores.keys()) | set(dev_scores.keys()))

    # ── Component 6: Spoiled Ballot Ratio (Official กกต. data from Referendum) ──
    # Uses actual badVotePercent from referendum results instead of proxy estimation
    spoiled_scores = {}
    all_spoiled_ratios = []
    for ac in all_area_codes:
        rd = referendum_data.get(ac)
        if rd and rd.get('totalVotes', 0) > 0:
            bad_pct = rd.get('badVotePercent', 0)
            bad_votes = rd.get('badVotes', 0)
        else:
            # Fallback to proxy if no referendum data
            mp_file_path = os.path.join(MP_DIR, f'{ac}.json')
            if not os.path.exists(mp_file_path) or ac not in eligible_by_area or eligible_by_area[ac] == 0:
                continue
            with open(mp_file_path, 'r', encoding='utf-8') as f:
                mp_raw = json.load(f)
            total_valid = sum(e['voteTotal'] for e in mp_raw['entries'])
            eligible = eligible_by_area[ac]
            turnout_pct = constituency_data.get(ac, {}).get('voteProgressPercent', 0)
            est_voters = eligible * turnout_pct / 100.0 if turnout_pct > 0 else total_valid
            bad_votes = max(0, est_voters - total_valid)
            bad_pct = bad_votes / est_voters * 100 if est_voters > 0 else 0
        all_spoiled_ratios.append(bad_pct)
        spoiled_scores[ac] = {'ratio': round(bad_pct, 2), 'spoiledEstimate': round(bad_votes), 'isOfficial': rd is not None}

    for ac in spoiled_scores:
        rz = robust_z_score(spoiled_scores[ac]['ratio'], all_spoiled_ratios)
        spoiled_scores[ac]['scaledScore'] = max(0, min(100, rz * 20))

    # ── Component 7 (NEW): Winner Dominance (HHI-based) ──
    # HHI = sum of squared vote shares. Higher HHI = less competitive
    dominance_scores = {}
    all_hhi = []
    for mp_file in mp_files:
        ac = os.path.basename(mp_file).replace('.json', '')
        with open(mp_file, 'r', encoding='utf-8') as f:
            mp_raw = json.load(f)
        total = sum(e['voteTotal'] for e in mp_raw['entries'])
        if total == 0:
            continue
        shares = [e['voteTotal'] / total for e in mp_raw['entries']]
        hhi = sum(s * s for s in shares) * 10000  # Normalized HHI (0-10000)
        all_hhi.append(hhi)
        dominance_scores[ac] = {'hhi': hhi, 'winnerShare': max(shares) * 100}

    for ac in dominance_scores:
        rz = robust_z_score(dominance_scores[ac]['hhi'], all_hhi)
        dominance_scores[ac]['scaledScore'] = max(0, min(100, rz * 20))

    # ── Component 8 (NEW V4): No-Vote Ratio (from Referendum) ──
    # Voters who came but did not cast a vote (noVotes/noVotePercent)
    # High no-vote ratio combined with other signals could indicate coercion or confusion
    novote_scores = {}
    all_novote_ratios = []
    for ac in all_area_codes:
        rd = referendum_data.get(ac)
        if rd and rd.get('totalVotes', 0) > 0:
            no_pct = rd.get('noVotePercent', 0)
            no_votes = rd.get('noVotes', 0)
            all_novote_ratios.append(no_pct)
            novote_scores[ac] = {'ratio': round(no_pct, 2), 'noVotes': no_votes}

    for ac in novote_scores:
        rz = robust_z_score(novote_scores[ac]['ratio'], all_novote_ratios)
        novote_scores[ac]['scaledScore'] = max(0, min(100, rz * 20))

    # ── Component 9 (NEW V4): Voters per Station ──
    # Areas with very high voters/station → harder to monitor → easier to cheat
    # Areas with very low voters/station → tiny rural areas with different dynamics
    # Extreme deviation from median is the signal
    vps_scores = {}
    all_vps = []
    for ac in all_area_codes:
        cd = constituency_data.get(ac, {})
        eligible = cd.get('totalEligibleVoters', 0)
        stations = cd.get('totalStations', 0)
        if stations > 0 and eligible > 0:
            vps = eligible / stations
            all_vps.append(vps)
            vps_scores[ac] = {'votersPerStation': round(vps, 1), 'eligible': eligible, 'stations': stations}

    for ac in vps_scores:
        rz = robust_z_score(vps_scores[ac]['votersPerStation'], all_vps)
        # Use absolute z-score: both extremely high AND low are anomalous
        vps_scores[ac]['scaledScore'] = max(0, min(100, abs(rz) * 20))

    # ═══════════════════════════════════════════════════════
    # ── Entropy Weight Method (data-driven feature weights) ──
    # Instead of hardcoded 40/25/15/10/10, compute weights from
    # information entropy: features with more variation get more weight
    # ═══════════════════════════════════════════════════════
    print("  📊 Computing Entropy Weights...")
    all_area_codes = sorted(set(gap_scores.keys()) | set(dev_scores.keys()))

    # Collect all 9 feature vectors (V4: added noVote + vps)
    feature_names = ['gap', 'plDev', 'turnout', 'competition', 'consistency', 'spoiled', 'dominance', 'noVote', 'vps']
    feature_vectors = {fn: [] for fn in feature_names}
    for ac in all_area_codes:
        feature_vectors['gap'].append(gap_scores.get(ac, {}).get('scaledScore', 0))
        feature_vectors['plDev'].append(dev_scores.get(ac, {}).get('scaledScore', 0))
        feature_vectors['turnout'].append(turnout_scores.get(ac, {}).get('scaledScore', 0))
        conc = concentration_scores.get(ac, {})
        feature_vectors['competition'].append(conc.get('scaledScore', 0) if isinstance(conc, dict) else 0)
        cons = consistency_scores.get(ac, {})
        feature_vectors['consistency'].append(cons.get('scaledScore', 0) if isinstance(cons, dict) else 0)
        feature_vectors['spoiled'].append(spoiled_scores.get(ac, {}).get('scaledScore', 0))
        feature_vectors['dominance'].append(dominance_scores.get(ac, {}).get('scaledScore', 0))
        feature_vectors['noVote'].append(novote_scores.get(ac, {}).get('scaledScore', 0))
        feature_vectors['vps'].append(vps_scores.get(ac, {}).get('scaledScore', 0))

    def entropy_weights(feature_dict, feature_names_list):
        """Compute weights via Entropy Weight Method.
        Features with MORE variation (less entropy) get MORE weight."""
        n = len(next(iter(feature_dict.values())))
        if n == 0:
            return {fn: 1.0 / len(feature_names_list) for fn in feature_names_list}

        # Step 1: Normalize each feature to [0, 1]
        normalized = {}
        for fn in feature_names_list:
            vals = feature_dict[fn]
            mn, mx = min(vals), max(vals)
            rng = mx - mn if mx != mn else 1.0
            normalized[fn] = [(v - mn) / rng for v in vals]

        # Step 2: Compute proportion p_ij for each feature
        # Step 3: Compute entropy E_j
        entropies = {}
        k = 1.0 / math.log(max(n, 2))  # Normalization constant
        for fn in feature_names_list:
            total = sum(normalized[fn]) + 1e-10  # Avoid division by zero
            props = [(v + 1e-10) / total for v in normalized[fn]]  # Add small epsilon
            ej = -k * sum(p * math.log(p) for p in props if p > 0)
            entropies[fn] = min(ej, 1.0)  # Clamp to [0, 1]

        # Step 4: Divergence d_j = 1 - E_j (higher = more informative)
        divergences = {fn: 1.0 - entropies[fn] for fn in feature_names_list}
        total_div = sum(divergences.values())

        if total_div == 0:
            return {fn: 1.0 / len(feature_names_list) for fn in feature_names_list}

        # Step 5: Weight = d_j / sum(d_j)
        weights = {fn: divergences[fn] / total_div for fn in feature_names_list}
        return weights

    entropy_w = entropy_weights(feature_vectors, feature_names)
    print(f"  📊 Entropy Weights: {', '.join(f'{fn}={w:.3f}' for fn, w in entropy_w.items())}")

    # Map feature names to weight keys
    W_GAP = entropy_w['gap']
    W_DEV = entropy_w['plDev']
    W_TURNOUT = entropy_w['turnout']
    W_CONC = entropy_w['competition']
    W_CONSIST = entropy_w['consistency']
    W_SPOILED = entropy_w['spoiled']
    W_DOMINANCE = entropy_w['dominance']
    W_NOVOTE = entropy_w['noVote']
    W_VPS = entropy_w['vps']

    # ── Combine 9 components with entropy weights ──
    ensemble_raw_scores = {}
    ensemble_analysis = []

    for ac in all_area_codes:
        g = gap_scores.get(ac, {})
        dv = dev_scores.get(ac, {})
        t = turnout_scores.get(ac, {})
        conc = concentration_scores.get(ac, {}) if isinstance(concentration_scores.get(ac), dict) else {}
        cons = consistency_scores.get(ac, {}) if isinstance(consistency_scores.get(ac), dict) else {}
        sp = spoiled_scores.get(ac, {})
        dom = dominance_scores.get(ac, {})
        nv = novote_scores.get(ac, {})
        vp = vps_scores.get(ac, {})

        gap_s = g.get('scaledScore', 0)
        dev_s = dv.get('scaledScore', 0)
        turnout_s = t.get('scaledScore', 0)
        conc_s = conc.get('scaledScore', 0) if isinstance(conc, dict) else 0
        cons_s = cons.get('scaledScore', 0) if isinstance(cons, dict) else 0
        spoiled_s = sp.get('scaledScore', 0)
        dominance_s = dom.get('scaledScore', 0)
        novote_s = nv.get('scaledScore', 0)
        vps_s = vp.get('scaledScore', 0)

        raw_score = (gap_s * W_GAP + dev_s * W_DEV + turnout_s * W_TURNOUT +
                     conc_s * W_CONC + cons_s * W_CONSIST +
                     spoiled_s * W_SPOILED + dominance_s * W_DOMINANCE +
                     novote_s * W_NOVOTE + vps_s * W_VPS)

        pop_w = population_weight(
            eligible_by_area.get(ac, stat_module.median(all_eligible_list) if all_eligible_list else 130000),
            all_eligible_list
        )
        weighted_score = raw_score * pop_w
        ensemble_raw_scores[ac] = raw_score

        area_name = area_name_map.get(ac, f'เขต {ac}')
        province = get_province(area_name)
        winner_code = g.get('winnerPartyCode', '')

        # V4: focus area tags & win66 party info
        area_focus_tags = focus_area_tags.get(ac, [])
        cd_item = constituency_data.get(ac, {})
        w66_code = cd_item.get('win66PartyCode', '')
        is_official_spoiled = ac in referendum_data

        ensemble_analysis.append({
            'areaCode': ac,
            'areaName': area_name,
            'province': province,
            'suspicionScore': round(weighted_score, 1),
            'rawScore': round(raw_score, 1),
            'riskLevel': 'high' if weighted_score >= 50 else ('medium' if weighted_score >= 30 else 'low'),
            # Components (8 indicators)
            'gapScore': round(g.get('gapPercent', 0), 1),
            'gapScaled': round(gap_s, 1),
            'gapMpVotes': g.get('mpVotes', 0),
            'gapPlVotes': g.get('plVotes', 0),
            'plDeviationScore': round(dev_s, 1),
            'plDeviationZScore': round(dv.get('robustZScore', 0), 2),
            'plDevPartyName': dv.get('topDevPartyName', ''),
            'plDevVotes': dv.get('topDevVotes', 0),
            'plDevBaseline': dv.get('topDevBaseline', 0),
            'turnoutScore': round(turnout_s, 1),
            'turnoutDeviation': round(t.get('deviation', 0), 2),
            'concentrationScore': round(conc_s, 1) if isinstance(conc, dict) else 0,
            'candidateCount': conc.get('candidateCount', candidate_counts.get(ac, 0)) if isinstance(conc, dict) else candidate_counts.get(ac, 0),
            'consistencyScore': round(cons_s, 1) if isinstance(cons, dict) else 0,
            'consistencyDiff': round(cons.get('diffPercent', 0), 1) if isinstance(cons, dict) else 0,
            'spoiledScore': round(spoiled_s, 1),
            'spoiledRatio': round(sp.get('ratio', 0), 2),
            'dominanceScore': round(dominance_s, 1),
            'dominanceHHI': round(dom.get('hhi', 0)),
            'dominanceWinnerShare': round(dom.get('winnerShare', 0), 1),
            # V4: No-Vote indicator
            'noVoteScore': round(novote_s, 1),
            'noVoteRatio': round(nv.get('ratio', 0), 2),
            # V4: Voters per Station
            'votersPerStationScore': round(vps_s, 1),
            'votersPerStation': round(vp.get('votersPerStation', 0), 1),
            # Population
            'eligibleVoters': eligible_by_area.get(ac, 0),
            'populationWeight': round(pop_w, 3),
            # Placeholders (filled below)
            'pValue': 0.0,
            'confidence': 'low',
            'moranI': 0.0,
            'spatialCluster': 'ns',
            'spatialLag': 0.0,
            'semiSupervisedLabel': 'unlabeled',
            'finalScore': round(weighted_score, 1),
            # Entropy weights (same for all areas, stored for frontend display)
            'entropyWeights': {fn: round(entropy_w[fn], 4) for fn in feature_names},
            # Winner info
            'winnerParty': get_party_name(winner_code),
            'winnerPartyCode': winner_code,
            'winnerPartyColor': get_party_color(winner_code),
            # V4: Focus area tags & previous election info
            'focusAreaTags': area_focus_tags,
            'win66PartyCode': w66_code,
            'win66PartyName': get_party_name(w66_code) if w66_code else '',
            'isOfficialSpoiledData': is_official_spoiled,
        })

    # ── Permutation Test (1000 iterations) ──
    print("  ⏳ Running permutation test (1000 iterations)...")
    N_PERMUTATIONS = 1000
    all_scaled_by_feature = {fn: feature_vectors[fn] for fn in feature_names}

    null_scores = []
    for _ in range(N_PERMUTATIONS):
        shuffled = {fn: rng_module.sample(all_scaled_by_feature[fn], len(all_scaled_by_feature[fn]))
                    for fn in feature_names}
        for i in range(len(all_area_codes)):
            s = sum(shuffled[fn][i % len(shuffled[fn])] * entropy_w[fn] for fn in feature_names)
            null_scores.append(s)

    null_scores.sort()
    null_len = len(null_scores)

    for item in ensemble_analysis:
        observed = item['rawScore']
        idx = bisect.bisect_left(null_scores, observed)
        p_value = (null_len - idx) / null_len
        item['pValue'] = round(p_value, 4)
        if p_value < 0.01:
            item['confidence'] = 'very-high'
        elif p_value < 0.05:
            item['confidence'] = 'high'
        elif p_value < 0.10:
            item['confidence'] = 'moderate'
        else:
            item['confidence'] = 'low'

    print(f"  ✅ Permutation test complete. p<0.01: {sum(1 for e in ensemble_analysis if e['pValue'] < 0.01)}, p<0.05: {sum(1 for e in ensemble_analysis if e['pValue'] < 0.05)}")

    # ═══════════════════════════════════════════════════════
    # ── Spatial Analysis: Moran's I ──
    # Build province-based adjacency (same province = neighbors)
    # Then compute Local Moran's I for each area
    # ═══════════════════════════════════════════════════════
    print("  🗺️ Computing Spatial Analysis (Moran's I)...")

    # Thailand province adjacency (2-digit prefix from area code)
    # Build adjacency: areas in the same province are neighbors
    province_by_area = {}
    areas_by_province = {}
    for ac in all_area_codes:
        prov_code = ac[:2]
        province_by_area[ac] = prov_code
        if prov_code not in areas_by_province:
            areas_by_province[prov_code] = []
        areas_by_province[prov_code].append(ac)

    # Also add cross-province adjacency for neighboring provinces
    # Thai province code adjacency (approximate geographic neighbors)
    PROVINCE_NEIGHBORS = {
        '10': ['11', '12', '13'],  # BKK neighbors
        '11': ['10', '13'],  # สมุทรปราการ
        '12': ['10', '13'],  # นนทบุรี
        '13': ['10', '11', '12', '14'],  # ปทุมธานี
        '14': ['13', '15', '16', '17', '18', '19'],  # อยุธยา
        '15': ['14', '16'],  # อ่างทอง
        '16': ['14', '15', '17', '19'],  # ลพบุรี
        '17': ['14', '15', '18'],  # สิงห์บุรี
        '18': ['14', '17', '60'],  # ชัยนาท
        '19': ['14', '16', '30'],  # สระบุรี
        '20': ['21', '24', '25'],  # ชลบุรี
        '21': ['20', '22'],  # ระยอง
        '22': ['21', '23'],  # จันทบุรี
        '23': ['22'],  # ตราด
        '24': ['20', '25', '26'],  # ฉะเชิงเทรา
        '25': ['24', '26', '27'],  # ปราจีนบุรี
        '26': ['13', '24', '25'],  # นครนายก
        '27': ['25'],  # สระแก้ว
        '30': ['19', '31', '32', '33', '36'],  # นครราชสีมา
        '31': ['30', '32', '33'],  # บุรีรัมย์
        '32': ['30', '31', '33', '34'],  # สุรินทร์
        '33': ['30', '31', '32', '34'],  # ศรีสะเกษ
        '34': ['33', '35', '37'],  # อุบลราชธานี
        '35': ['34', '45'],  # ยโสธร
        '36': ['30', '40'],  # ชัยภูมิ
        '37': ['34'],  # อำนาจเจริญ
        '38': ['43', '47'],  # บึงกาฬ
        '39': ['41', '42'],  # หนองบัวลำภู
        '40': ['36', '44', '46'],  # ขอนแก่น
        '41': ['39', '40', '43', '47'],  # อุดรธานี
        '42': ['39', '41'],  # เลย
        '43': ['38', '41', '47'],  # หนองคาย
        '44': ['40', '45', '46'],  # มหาสารคาม
        '45': ['35', '44', '46'],  # ร้อยเอ็ด
        '46': ['40', '44', '45'],  # กาฬสินธุ์
        '47': ['38', '41', '43', '48'],  # สกลนคร
        '48': ['47', '49'],  # นครพนม
        '49': ['48'],  # มุกดาหาร
        '50': ['51', '57', '58'],  # เชียงใหม่
        '51': ['50'],  # ลำพูน
        '52': ['54'],  # ลำปาง
        '53': ['54', '55'],  # อุตรดิตถ์
        '54': ['52', '53', '55'],  # แพร่
        '55': ['53', '54', '57'],  # น่าน
        '56': ['50', '57'],  # พะเยา
        '57': ['50', '55', '56'],  # เชียงราย
        '58': ['50'],  # แม่ฮ่องสอน
        '60': ['18', '61'],  # นครสวรรค์
        '61': ['60'],  # อุทัยธานี
        '62': ['63', '64'],  # กำแพงเพชร
        '63': ['62', '64'],  # ตาก
        '64': ['62', '63', '65'],  # สุโขทัย
        '65': ['64', '66', '67'],  # พิษณุโลก
        '66': ['65', '67'],  # พิจิตร
        '67': ['65', '66'],  # เพชรบูรณ์
        '70': ['71', '73'],  # ราชบุรี
        '71': ['70', '72'],  # กาญจนบุรี
        '72': ['71', '73', '74', '75'],  # สุพรรณบุรี
        '73': ['70', '72', '74'],  # นครปฐม
        '74': ['72', '73', '75'],  # สมุทรสาคร
        '75': ['72', '74'],  # สมุทรสงคราม
        '76': ['70', '77'],  # เพชรบุรี
        '77': ['76', '86'],  # ประจวบคีรีขันธ์
        '80': ['84', '86'],  # นครศรีธรรมราช
        '81': ['82'],  # กระบี่
        '82': ['81', '83'],  # พังงา
        '83': ['82'],  # ภูเก็ต
        '84': ['80', '86'],  # สุราษฎร์ธานี
        '85': ['86'],  # ระนอง
        '86': ['77', '80', '84', '85'],  # ชุมพร
        '90': ['80', '93'],  # สงขลา
        '91': ['90', '92'],  # สตูล
        '92': ['91', '93'],  # ตรัง
        '93': ['80', '90', '92'],  # พัทลุง
        '94': ['90', '95'],  # ปัตตานี
        '95': ['94', '96'],  # ยะลา
        '96': ['94', '95'],  # นราธิวาส
    }

    def get_neighbors(ac_target):
        """Get all neighbor area codes for a given area (same province + adjacent provinces)."""
        prov = province_by_area.get(ac_target, '')
        neighbor_areas = []
        # Same province (other areas in same province)
        for a in areas_by_province.get(prov, []):
            if a != ac_target:
                neighbor_areas.append(a)
        # Adjacent provinces
        for nprov in PROVINCE_NEIGHBORS.get(prov, []):
            for a in areas_by_province.get(nprov, []):
                neighbor_areas.append(a)
        return neighbor_areas

    # Build score vector indexed by area
    score_by_area = {item['areaCode']: item['suspicionScore'] for item in ensemble_analysis}
    all_scores_list = [item['suspicionScore'] for item in ensemble_analysis]
    global_mean = stat_module.mean(all_scores_list) if all_scores_list else 0
    global_var = stat_module.variance(all_scores_list) if len(all_scores_list) > 1 else 1

    # Compute Local Moran's I for each area
    moran_results = {}
    for ac in all_area_codes:
        neighbors = get_neighbors(ac)
        if not neighbors:
            moran_results[ac] = {'moranI': 0.0, 'spatialLag': 0.0, 'cluster': 'ns'}
            continue

        xi = score_by_area.get(ac, 0) - global_mean
        neighbor_scores = [score_by_area.get(n, 0) for n in neighbors if n in score_by_area]
        if not neighbor_scores:
            moran_results[ac] = {'moranI': 0.0, 'spatialLag': 0.0, 'cluster': 'ns'}
            continue

        spatial_lag = stat_module.mean(neighbor_scores) - global_mean
        # Local Moran's I = (x_i - mean) * sum(w_ij * (x_j - mean)) / variance
        local_moran = xi * spatial_lag / global_var if global_var > 0 else 0

        # Classify cluster type
        if local_moran > 0.5 and xi > 0:
            cluster = 'HH'  # High-High hotspot
        elif local_moran > 0.5 and xi < 0:
            cluster = 'LL'  # Low-Low coldspot
        elif local_moran < -0.5 and xi > 0:
            cluster = 'HL'  # High-Low outlier
        elif local_moran < -0.5 and xi < 0:
            cluster = 'LH'  # Low-High outlier
        else:
            cluster = 'ns'  # Not significant

        moran_results[ac] = {
            'moranI': round(local_moran, 3),
            'spatialLag': round(stat_module.mean(neighbor_scores), 1),
            'cluster': cluster,
        }

    # Apply spatial results to ensemble_analysis
    for item in ensemble_analysis:
        ac = item['areaCode']
        mr = moran_results.get(ac, {})
        item['moranI'] = mr.get('moranI', 0.0)
        item['spatialLag'] = mr.get('spatialLag', 0.0)
        item['spatialCluster'] = mr.get('cluster', 'ns')

    hh_count = sum(1 for m in moran_results.values() if m['cluster'] == 'HH')
    ll_count = sum(1 for m in moran_results.values() if m['cluster'] == 'LL')
    print(f"  🗺️ Spatial: HH hotspots={hh_count}, LL coldspots={ll_count}")

    # Global Moran's I
    n_areas = len(all_area_codes)
    numerator = sum(
        (score_by_area.get(ac, 0) - global_mean) *
        sum((score_by_area.get(nb, 0) - global_mean) for nb in get_neighbors(ac) if nb in score_by_area)
        for ac in all_area_codes
    )
    total_w = sum(len([nb for nb in get_neighbors(ac) if nb in score_by_area]) for ac in all_area_codes)
    denominator = sum((score_by_area.get(ac, 0) - global_mean) ** 2 for ac in all_area_codes)
    global_moran_i = (n_areas / max(total_w, 1)) * (numerator / max(denominator, 1))
    print(f"  🗺️ Global Moran's I = {global_moran_i:.4f} (>0 = positive spatial autocorrelation)")

    # ═══════════════════════════════════════════════════════
    # ── Semi-supervised: Pseudo-labels from extreme cases ──
    # Top 5% → "suspect", Bottom 25% → "normal", rest → "unlabeled"
    # Then propagate labels to similar unlabeled areas
    # ═══════════════════════════════════════════════════════
    print("  🏷️ Semi-supervised labeling...")
    sorted_by_score = sorted(ensemble_analysis, key=lambda x: -x['suspicionScore'])
    n_total = len(sorted_by_score)
    top_5pct = max(1, int(n_total * 0.05))
    bottom_25pct = max(1, int(n_total * 0.25))

    # Initial pseudo-labels
    suspect_codes = set(item['areaCode'] for item in sorted_by_score[:top_5pct] if item['pValue'] < 0.10)
    normal_codes = set(item['areaCode'] for item in sorted_by_score[-bottom_25pct:])

    # Label propagation: if an area's spatial neighbors are mostly suspect → elevate
    for item in ensemble_analysis:
        ac = item['areaCode']
        if ac in suspect_codes:
            item['semiSupervisedLabel'] = 'suspect'
        elif ac in normal_codes:
            item['semiSupervisedLabel'] = 'normal'
        else:
            # Check if neighbors are mostly suspect
            neighbors = get_neighbors(ac)
            suspect_neighbors = sum(1 for n in neighbors if n in suspect_codes)
            if len(neighbors) > 0 and suspect_neighbors / len(neighbors) >= 0.3 and item['pValue'] < 0.15:
                item['semiSupervisedLabel'] = 'elevated'
            else:
                item['semiSupervisedLabel'] = 'unlabeled'

    # Compute final score: boost areas that are spatially clustered + semi-supervised suspect
    for item in ensemble_analysis:
        boost = 1.0
        if item['spatialCluster'] == 'HH':
            boost *= 1.1  # 10% boost for hotspot
        if item['semiSupervisedLabel'] == 'suspect':
            boost *= 1.05  # 5% boost for pseudo-labeled suspect
        elif item['semiSupervisedLabel'] == 'elevated':
            boost *= 1.03  # 3% boost for elevated
        item['finalScore'] = round(min(100, item['suspicionScore'] * boost), 1)
        # Update risk level based on final score
        item['riskLevel'] = 'high' if item['finalScore'] >= 50 else ('medium' if item['finalScore'] >= 30 else 'low')

    ensemble_analysis.sort(key=lambda x: -x['finalScore'])

    suspect_count = sum(1 for e in ensemble_analysis if e['semiSupervisedLabel'] == 'suspect')
    elevated_count = sum(1 for e in ensemble_analysis if e['semiSupervisedLabel'] == 'elevated')
    print(f"  🏷️ Labels: suspect={suspect_count}, elevated={elevated_count}, normal={len(normal_codes)}, unlabeled={n_total - suspect_count - elevated_count - len(normal_codes)}")

    # ── Ensemble summary by party ──
    ensemble_party_summary = {}
    for e in ensemble_analysis:
        pc = e['winnerPartyCode']
        if pc not in ensemble_party_summary:
            ensemble_party_summary[pc] = {
                'partyCode': pc,
                'partyName': e['winnerParty'],
                'partyColor': e['winnerPartyColor'],
                'totalAreas': 0,
                'avgScore': 0,
                'highRiskCount': 0,
                'mediumRiskCount': 0,
                'lowRiskCount': 0,
                'scores': [],
                'significantCount': 0,
                'hotspotCount': 0,
            }
        ensemble_party_summary[pc]['totalAreas'] += 1
        ensemble_party_summary[pc]['scores'].append(e['finalScore'])
        if e['riskLevel'] == 'high':
            ensemble_party_summary[pc]['highRiskCount'] += 1
        elif e['riskLevel'] == 'medium':
            ensemble_party_summary[pc]['mediumRiskCount'] += 1
        else:
            ensemble_party_summary[pc]['lowRiskCount'] += 1
        if e['pValue'] < 0.05:
            ensemble_party_summary[pc]['significantCount'] += 1
        if e['spatialCluster'] == 'HH':
            ensemble_party_summary[pc]['hotspotCount'] += 1

    for ps in ensemble_party_summary.values():
        ps['avgScore'] = round(stat_module.mean(ps['scores']), 1) if ps['scores'] else 0
        ps['medianScore'] = round(stat_module.median(ps['scores']), 1) if ps['scores'] else 0
        del ps['scores']

    ensemble_summary_list = sorted(ensemble_party_summary.values(), key=lambda x: -x['avgScore'])
    ensemble_summary_list = [p for p in ensemble_summary_list if p['totalAreas'] >= 5]

    # Store metadata for frontend
    # Count focus area tags
    focus_area_counts = {}
    for item in ensemble_analysis:
        for tag in item.get('focusAreaTags', []):
            focus_area_counts[tag] = focus_area_counts.get(tag, 0) + 1

    ensemble_meta = {
        'version': 'V4',
        'totalAreas': n_total,
        'features': len(feature_names),
        'entropyWeights': {fn: round(entropy_w[fn], 4) for fn in feature_names},
        'globalMoranI': round(global_moran_i, 4),
        'permutationIterations': N_PERMUTATIONS,
        'hotspots': hh_count,
        'coldspots': ll_count,
        'pLt001': sum(1 for e in ensemble_analysis if e['pValue'] < 0.01),
        'pLt005': sum(1 for e in ensemble_analysis if e['pValue'] < 0.05),
        'suspectLabels': suspect_count,
        'elevatedLabels': elevated_count,
        'focusAreaCounts': focus_area_counts,
        'officialSpoiledCount': sum(1 for e in ensemble_analysis if e.get('isOfficialSpoiledData', False)),
    }

    output = {
        'summary': {
            'totalAreas': total_areas,
            'totalSuspicious': total_suspicious,
            'suspiciousPercent': round(total_suspicious / total_areas * 100, 1) if total_areas > 0 else 0,
            'total66Winners': len(all_66_winners),
            'switchedCandidates': sum(1 for c in candidate_raw['candidates'] if c['switchedParty'] == True),
        },
        'partyMeta': {k: {'name': v['name'], 'num': v['num'], 'color': v['color']} for k, v in PARTY_META.items()},
        'voteBuyingAnalysis': vote_buying_analysis,
        'suspiciousByParty': list(suspicious_by_party.values()),
        'targetPartyCounts': list(target_party_counts.values()),
        'rankDistribution': rank_distribution,
        'provinceSummary': province_summary,
        # Deep dive data
        'scatterData': scatter_data,
        'areaDetails': area_details,
        'candidateNumbers': candidate_numbers,
        'regionSummary': region_summary,
        'voteAnomaly': vote_anomaly[:50],
        # Candidate data
        'partySwitcherFlows': party_switcher_data[:40],
        'partySwitcherSummary': switcher_to_list,
        'retentionSummary': retention_summary,
        'winnerRetention': winner_retention,
        'lost66Winners': lost_66_winners[:50],
        # New analysis tabs
        'turnoutAnomaly': turnout_anomaly,
        'voteSplitting': vote_splitting,
        'winningMargins': winning_margins,
        'referendumCorrelation': referendum_correlation,
        # Ensemble model V4
        'ensembleAnalysis': ensemble_analysis,
        'ensemblePartySummary': ensemble_summary_list,
        'ensembleMeta': ensemble_meta,
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Data prepared: {OUTPUT_FILE}")
    print(f"   Total areas: {total_areas}")
    print(f"   Suspicious areas: {total_suspicious} ({output['summary']['suspiciousPercent']}%)")

if __name__ == '__main__':
    main()
