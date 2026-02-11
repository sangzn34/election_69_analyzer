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
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Data prepared: {OUTPUT_FILE}")
    print(f"   Total areas: {total_areas}")
    print(f"   Suspicious areas: {total_suspicious} ({output['summary']['suspiciousPercent']}%)")

if __name__ == '__main__':
    main()
