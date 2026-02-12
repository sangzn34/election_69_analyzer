'use client'

import { useState, useMemo } from 'react'
import {
  Newspaper, ExternalLink, Calendar, Tag, Filter,
  AlertTriangle, Scale, FileWarning, Users, Building2,
  Search, X, ChevronDown,
} from 'lucide-react'

/* ─── Types ─── */
type NewsCategory =
  | 'recount'      // นับคะแนนใหม่ / เลือกตั้งใหม่
  | 'fraud'        // ทุจริต / ซื้อเสียง
  | 'irregularity' // ความผิดปกติ / ข้อร้องเรียน
  | 'ect'          // กกต. / หน่วยงาน
  | 'analysis'     // การวิเคราะห์ / ข้อมูล

interface NewsItem {
  id: number
  title: string
  summary: string
  date: string          // DD/MM/YYYY
  source: string
  sourceUrl: string
  category: NewsCategory
  province?: string     // จังหวัดที่เกี่ยวข้อง
  area?: string         // เขตเลือกตั้ง
  tags: string[]
}

/* ─── Category config ─── */
const CATEGORY_CONFIG: Record<NewsCategory, { label: string; color: string; icon: typeof AlertTriangle }> = {
  recount:      { label: 'นับใหม่ / เลือกใหม่', color: '#ef4444', icon: Scale },
  fraud:        { label: 'ทุจริต / ซื้อเสียง', color: '#f97316', icon: AlertTriangle },
  irregularity: { label: 'ข้อร้องเรียน', color: '#eab308', icon: FileWarning },
  ect:          { label: 'กกต.', color: '#60a5fa', icon: Building2 },
  analysis:     { label: 'วิเคราะห์', color: '#a78bfa', icon: Users },
}

/* ─── Curated News Data ─── */
const NEWS_DATA: NewsItem[] = [
  // ── ชลบุรี เขต 1 ──
  {
    id: 1,
    title: 'กกต. มีมติไม่นับคะแนนใหม่ "ชลบุรี เขต 1"',
    summary: 'กกต. มีมติว่าการเลือกตั้ง ส.ส. ชลบุรี เขต 1 ไม่เข้าข่ายทุจริต ตรวจสอบทุกมิติแล้ว ผู้ยื่นคำร้องไม่ได้เห็นเหตุการณ์ด้วยตนเอง',
    date: '12/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/news/politic/2913895',
    category: 'recount',
    province: 'ชลบุรี',
    area: 'เขต 1',
    tags: ['ชลบุรี', 'นับคะแนนใหม่', 'กกต.'],
  },
  {
    id: 2,
    title: 'มวลชนไม่พอใจ ส่งเสียงโห่ร้องหลัง กกต. สั่งไม่นับคะแนนใหม่ "ชลบุรี เขต 1"',
    summary: 'ประชาชนที่มาชุมนุมหน้า กกต. ไม่พอใจผลมติ แสดงความไม่เห็นด้วยอย่างรุนแรงกับการที่ กกต. ไม่สั่งนับคะแนนใหม่ในชลบุรี เขต 1',
    date: '12/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/news/politic/2913910',
    category: 'irregularity',
    province: 'ชลบุรี',
    area: 'เขต 1',
    tags: ['ชลบุรี', 'ประท้วง', 'นับคะแนนใหม่'],
  },
  {
    id: 3,
    title: '"วิโรจน์" ฟ้องรัว ม.157 กกต.ชลบุรี โดนด้วย',
    summary: 'วิโรจน์ ลักขณาอดิศร ผู้สมัคร ส.ส. ชลบุรี เขต 1 ยื่นฟ้องเจ้าหน้าที่ตามมาตรา 157 โดยระบุว่า กกต. ชลบุรีมีส่วนเกี่ยวข้อง',
    date: '12/02/2569',
    source: 'Thai PBS',
    sourceUrl: 'https://www.thaipbs.or.th/program/PoliticalView/watch/vn5tjps63wiy',
    category: 'irregularity',
    province: 'ชลบุรี',
    area: 'เขต 1',
    tags: ['ชลบุรี', 'ฟ้องร้อง', 'วิโรจน์'],
  },
  {
    id: 4,
    title: '"ชลบุรี" ชาวบ้านร้องนับคะแนนใหม่',
    summary: 'ชาวบ้านในพื้นที่เขตเลือกตั้งที่ 1 ชลบุรี รวมตัวกันร้องขอให้ กกต. สั่งนับคะแนนใหม่ เนื่องจากพบเห็นความผิดปกติหลายจุด',
    date: '11/02/2569',
    source: 'Thai PBS',
    sourceUrl: 'https://www.thaipbs.or.th/program/PoliticalView/watch/ohavuqqhn1r6',
    category: 'irregularity',
    province: 'ชลบุรี',
    area: 'เขต 1',
    tags: ['ชลบุรี', 'ชาวบ้านร้อง', 'นับคะแนนใหม่'],
  },
  {
    id: 5,
    title: '"สุชาติ" ยินดีให้นับคะแนนใหม่ เพื่อความโปร่งใสและเป็นธรรม',
    summary: 'สุชาติ ชมกลิ่น ผู้สมัคร ส.ส. ฝั่งตรงข้าม ยินดีให้นับคะแนนใหม่ เพื่อความโปร่งใส เป็นธรรมต่อทุกฝ่าย และสร้างความมั่นใจให้ประชาชน',
    date: '11/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/video/news-update/1180582',
    category: 'recount',
    province: 'ชลบุรี',
    area: 'เขต 1',
    tags: ['ชลบุรี', 'นับคะแนนใหม่', 'สุชาติ'],
  },

  // ── กกต. สั่งเลือกตั้งใหม่ ──
  {
    id: 6,
    title: 'กกต. สั่งเลือกตั้งใหม่ 3 หน่วยใน กทม.-น่าน-อุดรฯ วันที่ 22 ก.พ.',
    summary: 'กกต. มีมติให้จัดเลือกตั้งใหม่ 3 หน่วย: กทม.คันนายาว เขต 15 หน่วยที่ 9, น่าน, อุดรธานี บางหน่วย กำหนดวันที่ 22 ก.พ. 2569 ส่วนปทุมธานี ให้นับคะแนนใหม่',
    date: '12/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/news/politic/2913905',
    category: 'recount',
    province: 'กรุงเทพมหานคร',
    tags: ['กทม.', 'น่าน', 'อุดรธานี', 'ปทุมธานี', 'เลือกตั้งใหม่'],
  },

  // ── กกต. ชี้แจง ──
  {
    id: 7,
    title: 'กกต. ขออย่านำคะแนนเลือกตั้งบนเว็บไปอ้างอิง ย้ำยังไม่เป็นทางการ',
    summary: 'กกต. ออกแถลงการณ์ขอให้สื่อและประชาชนอย่านำคะแนนที่แสดงบนเว็บไซต์ไปอ้างอิง เนื่องจากยังไม่ใช่ผลอย่างเป็นทางการ',
    date: '12/02/2569',
    source: 'Thai PBS',
    sourceUrl: 'https://www.thaipbs.or.th/news/content/502148',
    category: 'ect',
    tags: ['กกต.', 'คะแนนไม่เป็นทางการ'],
  },
  {
    id: 8,
    title: 'กกต. กางกฎหมาย เหตุแห่งการนับคะแนนใหม่-สั่งให้มีการออกเสียงลงคะแนนใหม่',
    summary: 'กกต. อธิบายกรอบกฎหมายเกี่ยวกับเหตุที่ต้องนับคะแนนใหม่และเงื่อนไขการสั่งเลือกตั้งใหม่ในบางหน่วย',
    date: '12/02/2569',
    source: 'Thai PBS',
    sourceUrl: 'https://www.thaipbs.or.th/news/content/502116',
    category: 'ect',
    tags: ['กกต.', 'กฎหมาย', 'นับคะแนนใหม่'],
  },
  {
    id: 9,
    title: 'กกต. ย้ำมาตรการเก็บรักษาบัตรเลือกตั้งที่นับคะแนนแล้วและเอกสารเกี่ยวกับการเลือกตั้ง',
    summary: 'กกต. ชี้แจงมาตรการรักษาความปลอดภัยของบัตรเลือกตั้งหลังนับคะแนน และเอกสารที่เกี่ยวข้อง เพื่อให้สามารถตรวจสอบย้อนหลังได้',
    date: '12/02/2569',
    source: 'Thai PBS',
    sourceUrl: 'https://www.thaipbs.or.th/news/content/502112',
    category: 'ect',
    tags: ['กกต.', 'บัตรเลือกตั้ง', 'เก็บรักษา'],
  },

  // ── หีบบัตร / ปาปลาร้า ──
  {
    id: 10,
    title: '"ภาสกร" รองเลขาฯ กกต. แจงปมร้อน "หีบบัตรเลือกตั้ง" มีขายในออนไลน์',
    summary: 'รองเลขาธิการ กกต. ชี้แจงกรณีพบหีบบัตรเลือกตั้งมีขายในออนไลน์ ว่าเป็นหีบที่ผลิตสำหรับการเลือกตั้งท้องถิ่น ไม่ใช่ของ กกต. ส่วนกลาง',
    date: '11/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/video/news-update/1180591',
    category: 'irregularity',
    tags: ['หีบบัตร', 'ออนไลน์', 'กกต.'],
  },
  {
    id: 11,
    title: 'อดีตครูสอนเทนนิส บุกปาปลาร้า กกต. ไม่พอใจจัดเลือกตั้ง',
    summary: 'ชายอ้างตัวเป็นอดีตครูสอนเทนนิส บุกเข้า กกต. ปาปลาร้าใส่เจ้าหน้าที่ แสดงความไม่พอใจต่อการจัดการเลือกตั้ง ถูกคุมตัวไป สน.ทุ่งสองห้อง',
    date: '12/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/news/politic/2913789',
    category: 'irregularity',
    tags: ['กกต.', 'ปาปลาร้า', 'ประท้วง'],
  },

  // ── ผู้สมัครได้ 0 คะแนน ──
  {
    id: 12,
    title: '"ครูเยาว์" คาใจ เข้าคูหากาเองกับมือ แต่คะแนนได้แค่ 0',
    summary: 'ผู้สมัครรายหนึ่งตั้งข้อสังเกตว่าตนเองเข้าคูหากาบัตรให้ตัวเอง แต่ผลคะแนนกลับเป็น 0 ไม่ติดใจ กกต.ผิดหรือถูก แต่สงสัยว่า กปน. นับคะแนนอย่างไร',
    date: '11/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/video/news-update/1180590',
    category: 'fraud',
    tags: ['0 คะแนน', 'นับคะแนน', 'กปน.'],
  },

  // ── สุพรรณบุรี ──
  {
    id: 13,
    title: '"วราวุธ" โยน กกต. ตัดสินนับคะแนนใหม่สุพรรณบุรี',
    summary: 'วราวุธ ศิลปอาชา เผยว่ายังไม่มีการแบ่งเก้าอี้ รมต. โยนให้ กกต. เป็นผู้ตัดสินเรื่องการนับคะแนนใหม่ที่สุพรรณบุรี',
    date: '12/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/news/politic/2913815',
    category: 'recount',
    province: 'สุพรรณบุรี',
    tags: ['สุพรรณบุรี', 'นับคะแนนใหม่', 'วราวุธ'],
  },

  // ── อนุทิน / ระบบ ──
  {
    id: 14,
    title: '"อนุทิน" มั่นใจ กกต. จัดเลือกตั้งสุจริต ยันไม่เคยใช้อำนาจ มท.1 แทรกแซง กปน.',
    summary: 'อนุทิน ชาญวีรกูล หัวหน้าพรรคภูมิใจไทย ย้ำว่ามั่นใจในการจัดการเลือกตั้งของ กกต. ว่าสุจริต ยืนยันว่าไม่เคยใช้อำนาจในฐานะรัฐมนตรีว่าการกระทรวงมหาดไทยแทรกแซง กปน.',
    date: '12/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/news/politic/2913798',
    category: 'ect',
    tags: ['อนุทิน', 'กกต.', 'กปน.', 'มหาดไทย'],
  },

  // ── สนธิญา ──
  {
    id: 15,
    title: '"สนธิญา" เตือนพรรคประชาชน อย่ายุ่งเกี่ยวเหตุวุ่นวายหลังเลือกตั้ง',
    summary: 'สนธิญา สวัสดิ์อธิคม เตือนพรรคประชาชนอย่าเข้ามายุ่งเกี่ยวหรือสนับสนุนเหตุวุ่นวายหลังเลือกตั้ง 69 และขู่ว่าอาจมีคำร้องยุบพรรคเร็ว ๆ นี้',
    date: '11/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/video/news-update/1180592',
    category: 'irregularity',
    tags: ['สนธิญา', 'พรรคประชาชน', 'ยุบพรรค'],
  },

  // ── ศรีสุวรรณ ──
  {
    id: 16,
    title: '"ศรีสุวรรณ" ฟันเพจดัง-นศ. ปั่นเฟกนิวส์จน กกต. โดนด่า',
    summary: 'ศรีสุวรรณ จรรยา ดำเนินการทางกฎหมายกับเพจดังและนักศึกษาที่เผยแพร่ข้อมูลเท็จเกี่ยวกับการเลือกตั้ง จนทำให้ กกต. ถูกวิพากษ์วิจารณ์อย่างหนัก',
    date: '11/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/video/news-update/1180642',
    category: 'irregularity',
    tags: ['เฟกนิวส์', 'ศรีสุวรรณ', 'กกต.'],
  },

  // ── ลุงเทวา ──
  {
    id: 17,
    title: 'ปรับ 500 บาท "ลุงเทวา" มือปาปลาร้า กกต.',
    summary: 'กกต. ขู่หน่วยงานรัฐที่ไม่ดำเนินการอย่างสะอาดจะเจอเสิร์ฟถึงที่ หลังจาก "ลุงเทวา" บุกปาปลาร้าเจ้าหน้าที่ กกต. และถูกปรับ 500 บาท',
    date: '12/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/news/politic/2913877',
    category: 'irregularity',
    tags: ['ปาปลาร้า', 'กกต.', 'ลุงเทวา'],
  },

  // ── แพร่ (บัตรเขย่ง) ──
  {
    id: 18,
    title: 'ผู้สมัคร สส.แพร่ โพสต์ประชด "บัตรเขย่ง" ลั่นที่แพร่ทำได้แล้ว #กกตทำได้เสมอ',
    summary: 'นายวรวัจน์ เอื้อภิญญกุล ผู้สมัคร สส.แพร่ เขต 3 เพื่อไทย โพสต์ตั้งข้อสังเกตว่า บัตรเลือกเขต (สีเขียว) มี 84,246 ใบ มากกว่าบัตรบัญชีรายชื่อ (สีชมพู) 84,245 ใบ ทั้งที่ตามทฤษฎีบัตรปาร์ตี้ลิสต์ต้องมากกว่าเสมอ',
    date: '12/02/2569',
    source: 'ข่าวสด',
    sourceUrl: 'https://www.khaosod.co.th/politics/news_10135846',
    category: 'irregularity',
    province: 'แพร่',
    area: 'เขต 3',
    tags: ['แพร่', 'บัตรเขย่ง', 'กกต.', 'เพื่อไทย'],
  },

  // ── ราชบุรี (คะแนนพลาด 90 → 0) ──
  {
    id: 19,
    title: 'กกต.ราชบุรี แจงแก้ไขแล้ว หลังเจ้าหน้าที่ลงคะแนน ปชน. พลาดจาก 90 เป็น 0',
    summary: 'ผอ.กกต.ราชบุรี ชี้แจงกรณีหน่วยเลือกตั้งที่ 2 เขต 2 ราชบุรี แบบขีดคะแนนได้ 90 คะแนน แต่ใบรายงานผลเป็น 0 คะแนน ยืนยันเป็นความผิดพลาดของการกรอก ไม่ใช่ทุจริต และแก้ไขแล้ว ผลคะแนนไม่ได้หายไป',
    date: '12/02/2569',
    source: 'มติชน',
    sourceUrl: 'https://www.matichon.co.th/politics/election69/news_5594327',
    category: 'irregularity',
    province: 'ราชบุรี',
    area: 'เขต 2',
    tags: ['ราชบุรี', 'กรอกผิด', 'กกต.', 'ปชน.', 'คะแนนพลาด'],
  },

  // ── ปราจีนบุรี (นับคะแนนใหม่) ──
  {
    id: 20,
    title: 'ผู้สมัคร ปชน. ปราจีนบุรี เขต 1 ยื่น กกต. นับคะแนนใหม่ ชี้มีหลักฐานผลเลือกตั้งคลาดเคลื่อน',
    summary: 'นายชนกานต์ ศรีเอียด ผู้สมัคร สส.เขต 1 ปราจีนบุรี พรรคประชาชน ยื่นคำร้องนับคะแนนใหม่ ยืนยันน้อมรับผลแพ้ แต่ไม่ยอมรับกระบวนการนับคะแนน เนื่องจากพบหลักฐานอาจมีการจงใจนับคะแนนไม่ถูกต้อง',
    date: '12/02/2569',
    source: 'มติชน',
    sourceUrl: 'https://www.matichon.co.th/politics/election69/news/news_5594200',
    category: 'recount',
    province: 'ปราจีนบุรี',
    area: 'เขต 1',
    tags: ['ปราจีนบุรี', 'นับคะแนนใหม่', 'ปชน.', 'ภูมิใจไทย'],
  },

  // ── บุรีรัมย์ (นับคะแนนใหม่ 2 เขต) ──
  {
    id: 21,
    title: 'ผู้สมัคร ปชน. ยื่น กกต. บุรีรัมย์ นับคะแนนใหม่ 2 เขต หลังพบพฤติการณ์ไม่โปร่งใส',
    summary: 'ผู้สมัคร ปชน. เขต 7 และ เขต 10 บุรีรัมย์ ยื่นร้อง กกต. นับคะแนนใหม่ พบคูหานับคะแนนจัดห่างจากผู้สังเกตการณ์ การขานคะแนนพร้อมกันหลายหน่วย ป้ายประกาศไม่แสดงรายละเอียดผู้มาใช้สิทธิ และผลปาร์ตี้ลิสต์',
    date: '12/02/2569',
    source: 'มติชน',
    sourceUrl: 'https://www.matichon.co.th/politics/election69/news_5594108',
    category: 'recount',
    province: 'บุรีรัมย์',
    area: 'เขต 7, เขต 10',
    tags: ['บุรีรัมย์', 'นับคะแนนใหม่', 'ปชน.', 'ผู้สังเกตการณ์'],
  },

  // ── ชลบุรี (เพิ่มเติม) ──
  {
    id: 22,
    title: 'ปชน. ผิดหวัง กกต. ไม่ให้นับใหม่ ชลบุรี เขต 1 จี้เปิดใบขีดคะแนนรายหน่วย',
    summary: 'พรรคประชาชนแสดงความผิดหวังต่อมติ กกต. ที่ไม่ให้นับคะแนนใหม่ชลบุรี เขต 1 เรียกร้องให้เปิดเผยใบขีดคะแนนรายหน่วยเลือกตั้ง เพื่อให้ประชาชนตรวจสอบได้',
    date: '12/02/2569',
    source: 'ข่าวสด',
    sourceUrl: 'https://www.khaosod.co.th/politics/news_10135797',
    category: 'recount',
    province: 'ชลบุรี',
    area: 'เขต 1',
    tags: ['ชลบุรี', 'ปชน.', 'กกต.', 'ใบขีดคะแนน'],
  },
  {
    id: 23,
    title: 'มวลชนยอมเปิดทาง ให้เจ้าหน้าที่ขนหีบบัตร ชลบุรี เขต 1 ออกจากพื้นที่',
    summary: 'ประชาชนที่ชุมนุมหน้าสถานที่นับคะแนน ชลบุรี เขต 1 ยอมเปิดทางให้เจ้าหน้าที่ขนหีบบัตรออก แต่ยังคงจับตาใกล้ชิดเพื่อความโปร่งใส',
    date: '12/02/2569',
    source: 'มติชน',
    sourceUrl: 'https://www.matichon.co.th/politics/election69/news_5594289',
    category: 'irregularity',
    province: 'ชลบุรี',
    area: 'เขต 1',
    tags: ['ชลบุรี', 'หีบบัตร', 'ประท้วง', 'โปร่งใส'],
  },

  // ── กกต. แจงบัตรเขย่ง (ระดับชาติ) ──
  {
    id: 24,
    title: 'กกต. แจงยอดผู้ใช้สิทธิ สส.เขต-ปาร์ตี้ลิสต์ ไม่ตรงกัน ชี้เจ้าหน้าที่แข่งเวลา กรอกผิดบ้าง',
    summary: 'ประธาน กกต. และรองเลขาฯ แถลงว่ายอดผู้ใช้สิทธิ สส.เขต กับปาร์ตี้ลิสต์ที่ไม่ตรงกัน เกิดจากเจ้าหน้าที่ต้องแข่งเวลา กรอกข้อมูลสลับกันบ้าง ย้ำยังเป็นผลไม่เป็นทางการ และชี้แจงเรื่องบาร์โค้ดบัตรเลือกตั้งเป็นมาตรการรักษาความปลอดภัย',
    date: '12/02/2569',
    source: 'ข่าวสด',
    sourceUrl: 'https://www.khaosod.co.th/politics/news_10135641',
    category: 'ect',
    tags: ['กกต.', 'บัตรเขย่ง', 'ปาร์ตี้ลิสต์', 'บาร์โค้ด'],
  },

  // ── ซื้อเสียง 2 หมื่นล้าน ──
  {
    id: 25,
    title: 'สมคิด ชี้เลือกตั้ง 69 ล้มเหลว ไม่โปร่งใสหลายที่ แฉซื้อเสียงพุ่ง 2 หมื่นล้าน',
    summary: 'นายสมคิด เชื้อคง อดีตรองเลขาฯ นายกฯ ชี้การเลือกตั้ง 69 ล้มเหลว พบซื้อสิทธิ์ขายเสียงโจ๋งครึ่ม ประเมินใช้เงินไม่น้อยกว่า 20,000 ล้านบาท บางจังหวัดคะแนนหาย บางจังหวัดเพิ่ม กกต. เลือกนิ่งเฉย ลั่นรอรับหมายศาล',
    date: '12/02/2569',
    source: 'ข่าวสด',
    sourceUrl: 'https://www.khaosod.co.th/politics/news_10135159',
    category: 'fraud',
    tags: ['ซื้อเสียง', 'สมคิด', '2 หมื่นล้าน', 'กกต.', 'ทุจริต'],
  },

  // ── วิกฤตเชื่อมั่น กกต. ──
  {
    id: 26,
    title: 'ร้องนับคะแนนเลือกตั้งใหม่ วิกฤตเชื่อมั่น กกต.',
    summary: 'บทวิเคราะห์เจาะลึกกระแสเรียกร้องนับคะแนนใหม่จากหลายจังหวัด สะท้อนวิกฤตความเชื่อมั่นต่อ กกต. ในการจัดการเลือกตั้ง 2569 ครั้งนี้',
    date: '12/02/2569',
    source: 'มติชน',
    sourceUrl: 'https://www.matichon.co.th/politics/politics-in-depth/news_5592525',
    category: 'analysis',
    tags: ['วิกฤตเชื่อมั่น', 'กกต.', 'นับคะแนนใหม่', 'บทวิเคราะห์'],
  },

  // ── น่าน (เลือกตั้งใหม่) ──
  {
    id: 27,
    title: 'กกต. สั่งเลือกตั้งใหม่ น่าน หน่วยที่มีปัญหานับคะแนน',
    summary: 'กกต. มีมติให้จัดเลือกตั้งใหม่ในหน่วยเลือกตั้งที่มีปัญหาใน จ.น่าน หลังพบว่าการนับคะแนนมีข้อผิดพลาด กำหนดวันที่ 22 ก.พ. 2569',
    date: '12/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/news/politic/2913905',
    category: 'recount',
    province: 'น่าน',
    tags: ['น่าน', 'เลือกตั้งใหม่', 'กกต.'],
  },

  // ── อุดรธานี (เลือกตั้งใหม่) ──
  {
    id: 28,
    title: 'กกต. สั่งเลือกตั้งใหม่ อุดรธานี บางหน่วย วันที่ 22 ก.พ.',
    summary: 'กกต. มีมติให้จัดเลือกตั้งใหม่ในหน่วยเลือกตั้งที่มีปัญหาใน จ.อุดรธานี หลังพบข้อผิดพลาดในการนับคะแนน พร้อมกับ กทม. และ น่าน กำหนดวันที่ 22 ก.พ. 2569',
    date: '12/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/news/politic/2913905',
    category: 'recount',
    province: 'อุดรธานี',
    tags: ['อุดรธานี', 'เลือกตั้งใหม่', 'กกต.'],
  },

  // ── ปทุมธานี (นับคะแนนใหม่) ──
  {
    id: 29,
    title: 'กกต. สั่งนับคะแนนใหม่ ปทุมธานี หลังพบข้อผิดพลาด',
    summary: 'กกต. มีมติให้นับคะแนนใหม่ในหน่วยเลือกตั้งที่มีปัญหาใน จ.ปทุมธานี เนื่องจากพบข้อผิดพลาดในการรายงานผลคะแนน',
    date: '12/02/2569',
    source: 'ไทยรัฐ',
    sourceUrl: 'https://www.thairath.co.th/news/politic/2913905',
    category: 'recount',
    province: 'ปทุมธานี',
    tags: ['ปทุมธานี', 'นับคะแนนใหม่', 'กกต.'],
  },

  // ── ยศชนัน ขอตรวจสอบ ──
  {
    id: 30,
    title: 'ยศชนัน ลั่นไม่เสียใจ ขอตรวจสอบผลเลือกตั้งให้สุจริต',
    summary: 'ยศชนัน วิริยะกุลนันท์ หัวหน้าพรรคประชาชน ยืนยันไม่เสียใจกับผลเลือกตั้ง ปัดตอบเรื่องร่วมรัฐบาล รอมติพรรค แต่ขอตรวจสอบผลเลือกตั้งทุกพื้นที่ให้สุจริตเที่ยงธรรม',
    date: '12/02/2569',
    source: 'ข่าวสด',
    sourceUrl: 'https://www.khaosod.co.th/politics/news_10135299',
    category: 'analysis',
    tags: ['ยศชนัน', 'ปชน.', 'ตรวจสอบ', 'ผลเลือกตั้ง'],
  },

  // ── ประธาน กกต. สวนกลับ ──
  {
    id: 31,
    title: 'ประธาน กกต. สุดอัดอั้น สวนกลับ "ช้าตรงไหน" ทำงานทุกวัน มีเวลารับรอง 60 วัน',
    summary: 'ประธาน กกต. ตอบโต้เสียงวิจารณ์ว่าทำงานช้า ยืนยันว่า กกต. ทำงานทุกวัน มีกรอบเวลารับรองผลเลือกตั้ง 60 วันตามกฎหมาย',
    date: '12/02/2569',
    source: 'มติชน',
    sourceUrl: 'https://www.matichon.co.th/politics/election69/news_5594143',
    category: 'ect',
    tags: ['กกต.', 'ประธาน กกต.', 'รับรองผล', '60 วัน'],
  },

  // ── จันทบุรี: ร้อง ECT Report คะแนนผิดปกติ ──
  {
    id: 32,
    title: 'เครือข่ายประชาชนจันทบุรี ร้อง กกต. พบยอดคะแนนสูงกว่าบัตรดี ใน ECT Report',
    summary: 'กลุ่มเครือข่ายภาคประชาชน นำโดย นายกฤษฎา ดาราศร ยื่นหนังสือร้องเรียน ผอ.กกต.จันทบุรี กรณีพบความผิดปกติระบบ ECT Report 69 เขต 1 และ 2 ยอดคะแนนสูงกว่าจำนวนบัตรดี และมีการปรับลดคะแนนผู้สมัครบางรายในภายหลัง เรียกร้องระงับประกาศผลและนับคะแนนใหม่',
    date: '10/02/2569',
    source: 'ข่าวสด',
    sourceUrl: 'https://www.khaosod.co.th/around-thailand/news_10133453',
    category: 'irregularity',
    province: 'จันทบุรี',
    tags: ['จันทบุรี', 'ECT Report', 'คะแนนผิดปกติ', 'นับคะแนนใหม่', 'บัตรดี'],
  },

  // ── จันทบุรี: ประชาชนติดกล้องวงจรปิดเอง ──
  {
    id: 33,
    title: 'ประชาชนทำเอง! ติดกล้องวงจรปิด 8 ตัว เฝ้าโกดังเก็บหีบเลือกตั้ง จันทบุรี',
    summary: 'ประชาชนจันทบุรีติดตั้งกล้องวงจรปิด 8 ตัวทั้งในและนอกโกดังเก็บหีบเลือกตั้งด้วยตนเอง เตรียมกระจายสัญญาณผ่านโมเดมและซิมรายปีให้ประชาชนรับชมผ่านแอป ยืนยันไม่เกี่ยวข้องกับไวไฟ กกต.',
    date: '11/02/2569',
    source: 'ข่าวสด',
    sourceUrl: 'https://www.khaosod.co.th/around-thailand/news_10133453',
    category: 'irregularity',
    province: 'จันทบุรี',
    tags: ['จันทบุรี', 'กล้องวงจรปิด', 'หีบเลือกตั้ง', 'เฝ้าระวัง', 'ประชาชน'],
  },

  // ── ราชบุรี: กกต. แจงคะแนน ปชน. จาก 90 เป็น 0 ──
  {
    id: 34,
    title: 'กกต.ราชบุรี แจง ลงคะแนน ปชน. ผิดพลาด จาก 90 เป็น 0 ยันแก้ไขแล้ว',
    summary: 'ผอ.กกต.ราชบุรี ชี้แจงกรณีหน่วยเลือกตั้งที่ 2 เขต 2 ขีดคะแนนพรรคประชาชนได้ 90 แต่ใบรายงานผลกลับเป็น 0 เป็นความผิดพลาดในการกรอก ไม่ใช่ทุจริต ตรวจสอบหลายชั้นก่อนรายงาน ผู้สมัครรับทราบแล้วไม่ติดใจ',
    date: '12/02/2569',
    source: 'ข่าวสด',
    sourceUrl: 'https://www.khaosod.co.th/around-thailand/news_10135224',
    category: 'irregularity',
    province: 'ราชบุรี',
    area: 'เขต 2',
    tags: ['ราชบุรี', 'กกต.', 'ปชน.', 'คะแนนผิดพลาด', '90 เป็น 0'],
  },

  // ── อุดรธานี: คนถ่ายคลิปหัวคะแนนแจกเงิน ──
  {
    id: 35,
    title: 'คนถ่ายคลิปหัวคะแนนแจกเงินอุดรฯ เข้าพบ กกต. ขอเป็นพยาน ถูกขับรถติดตามถึงบ้าน',
    summary: 'เจ้าของเพจ "เฮียเปี๊ยกช่วยด้วย" พาชาวบ้านผู้ถ่ายคลิปหัวคะแนนแจกเงิน สส.เขต 5 อุดรธานี เข้าพบ กกต.จังหวัดให้ถ้อยคำเป็นพยาน มอบมือถือเป็นหลักฐาน ยืนยันไม่ได้รับเงิน หวั่นความปลอดภัยหลังพบรถขับวนเวียนหน้าบ้าน',
    date: '11/02/2569',
    source: 'ข่าวสด',
    sourceUrl: 'https://www.khaosod.co.th/around-thailand/news_10134520',
    category: 'fraud',
    province: 'อุดรธานี',
    area: 'เขต 5',
    tags: ['อุดรธานี', 'ซื้อเสียง', 'หัวคะแนน', 'แจกเงิน', 'พยาน', 'ข่มขู่'],
  },

  // ── 9 งูเห่าสอบตก ──
  {
    id: 36,
    title: 'เปิดคะแนน 9 งูเห่าสอบตก คนดัง-ตระกูลดัง หลังย้ายพรรคลงเลือกตั้ง 69',
    summary: 'สส. ที่ถูกขนานนามว่า "งูเห่า" จำนวน 9 คน สอบตกเลือกตั้ง 69 หลังย้ายพรรคไปลงสมัครใหม่ รวมถึงคนดังและตระกูลการเมืองหลายราย สะท้อนว่าประชาชนไม่เอาด้วยกับพฤติกรรมย้ายพรรค',
    date: '11/02/2569',
    source: 'ข่าวสด',
    sourceUrl: 'https://www.khaosod.co.th/politics/news_10130884',
    category: 'analysis',
    tags: ['งูเห่า', 'สอบตก', 'ย้ายพรรค', 'เลือกตั้ง 69'],
  },

  // ── บาร์โค้ดบัตรเลือกตั้ง: สืบย้อนผู้ลงคะแนนได้? ──
  {
    id: 37,
    title: 'PPTV ทดลองสแกนบาร์โค้ดบัตรลงคะแนน พบชุดตัวเลขเฉพาะแต่ละใบ อาจสืบย้อนผู้ลงคะแนนได้',
    summary: 'ผู้สื่อข่าว PPTV ทดลองสแกนบาร์โค้ดจากภาพบัตรเลือกตั้ง ส.ส. บัญชีรายชื่อ 4 ใบ (หน่วยเดียวกัน กาพรรคต่างกัน) พบเลขเฉพาะไม่ซ้ำกัน — A37805049 (เพื่อไทย), A37805050 (ไทยสร้างไทย), A37805055 (ประชาชน), A37804930 (ภูมิใจไทย) ทำให้เกิดข้อกังวลว่าหากบาร์โค้ดตรงกับต้นขั้วบัตร อาจตรวจสอบย้อนกลับได้ว่าใครกาพรรคใด ขัดหลักการเลือกตั้งโดยลับตาม รธน.',
    date: '13/02/2569',
    source: 'PPTV HD36',
    sourceUrl: 'https://www.pptvhd36.com/news/การเมือง/243591',
    category: 'irregularity',
    tags: ['บาร์โค้ด', 'บัตรเลือกตั้ง', 'เลือกตั้งลับ', 'รัฐธรรมนูญ', 'PPTV'],
  },
  {
    id: 38,
    title: 'กกต. ชี้แจง บาร์โค้ดเป็นมาตรการ รปภ. ยืนยันไม่ใช่ข้อมูลของพรรคการเมือง',
    summary: 'ว่าที่ ร.ต.ภาสกร สิริภคยาพร รองเลขาธิการ กกต. แถลงว่าบาร์โค้ดบนบัตรเลือกตั้งเป็นข้อมูลล็อตจัดพิมพ์ ใช้ควบคุมที่ไปที่มา — พิมพ์เมื่อไหร่ ที่ไหน แจกจ่ายเขตไหน ยืนยันไม่มีใครรู้ได้ว่าเป็นข้อมูลหน่วยไหน แต่ยังไม่ได้ตอบประเด็นที่ว่าเลขเฉพาะแต่ละใบสามารถใช้คำนวณย้อนกลับหาเล่มที่ได้ด้วยสูตร M = ⌊N/20⌋ + 1',
    date: '13/02/2569',
    source: 'PPTV HD36',
    sourceUrl: 'https://www.pptvhd36.com/news/การเมือง/243591',
    category: 'ect',
    tags: ['บาร์โค้ด', 'กกต.', 'ชี้แจง', 'มาตรการ รปภ.'],
  },
  {
    id: 39,
    title: 'นักพัฒนาพิสูจน์: จากบาร์โค้ดอย่างเดียว สามารถคำนวณย้อนหาเล่มที่บัตรเลือกตั้งได้',
    summary: 'มีผู้พบความสัมพันธ์ของเลข "เล่มที่" (M) และ "เลขที่" (N) ว่า M = ⌊N/20⌋ + 1 เนื่องจากบัตรเลือกตั้ง 1 เล่มมี 20 ใบ แต่ละใบมีเลขที่ไม่ซ้ำกัน ทำให้ลำพังแค่บาร์โค้ดก็สืบย้อนไปหาเล่มที่ ต้นขั้ว ลายเซ็น และข้อมูลผู้ลงคะแนนได้ ขัดหลักการเลือกตั้งโดยลับ',
    date: '13/02/2569',
    source: 'earthchie (CodePen)',
    sourceUrl: 'https://codepen.io/earthchie/pen/vEKbZBb?editors=1010',
    category: 'analysis',
    tags: ['บาร์โค้ด', 'คณิตศาสตร์', 'สูตร', 'เล่มที่', 'เลขที่', 'ต้นขั้ว'],
  },
]

/* ─── Sort by date descending ─── */
const sortedNews = [...NEWS_DATA].sort((a, b) => {
  const [da, ma, ya] = a.date.split('/').map(Number)
  const [db, mb, yb] = b.date.split('/').map(Number)
  return (yb - ya) || (mb - ma) || (db - da)
})

/* ─── Component ─── */
export default function ElectionNews() {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showCount, setShowCount] = useState(10)

  const filtered = useMemo(() => {
    let items = sortedNews
    if (selectedCategory !== 'all') {
      items = items.filter(n => n.category === selectedCategory)
    }
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(n =>
        n.title.includes(q) || n.summary.includes(q) ||
        n.tags.some(t => t.includes(q)) ||
        (n.province && n.province.includes(q)) ||
        (n.area && n.area.includes(q))
      )
    }
    return items
  }, [selectedCategory, search])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sortedNews.length }
    sortedNews.forEach(n => { counts[n.category] = (counts[n.category] || 0) + 1 })
    return counts
  }, [])

  return (
    <div className="section">
      <div className="section-title">
        <Newspaper size={20} /> รวบรวมข่าวความผิดปกติ — เลือกตั้ง 2569
      </div>
      <div className="section-desc">
        รวบรวมข่าวสาร ข้อร้องเรียน และเหตุการณ์ผิดปกติที่เกี่ยวข้องกับการเลือกตั้ง ส.ส. ปี 2569
        จากสื่อหลายสำนัก
      </div>

      {/* Disclaimer */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 10, padding: 14,
        border: '1px solid var(--border)', marginBottom: 20,
        display: 'flex', gap: 8, alignItems: 'start',
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2, color: '#eab308' }} />
        <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          ข่าวเหล่านี้รวบรวมจากสื่อสาธารณะ เพื่อให้ผู้ใช้ได้ติดตามสถานการณ์ความผิดปกติในการเลือกตั้ง
          <strong> ไม่ได้ตัดสินว่ามีการทุจริตจริง</strong> กรุณาตรวจสอบข้อมูลจากแหล่งข่าวต้นทางเสมอ
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="overview-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-number">{sortedNews.length}</div>
          <div className="stat-label">ข่าวทั้งหมด</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#ef4444' }}>
            {categoryCounts['recount'] || 0}
          </div>
          <div className="stat-label">นับ/เลือกใหม่</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#eab308' }}>
            {categoryCounts['irregularity'] || 0}
          </div>
          <div className="stat-label">ข้อร้องเรียน</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#60a5fa' }}>
            {new Set(sortedNews.filter(n => n.province).map(n => n.province)).size}
          </div>
          <div className="stat-label">จังหวัดที่เกี่ยวข้อง</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="ค้นหาข่าว / จังหวัด / tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '7px 30px 7px 30px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-primary)',
              color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          <Filter size={12} style={{ verticalAlign: -1 }} /> {filtered.length} รายการ
        </span>
      </div>

      {/* ── Category pills ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: selectedCategory === 'all' ? '2px solid var(--accent)' : '1px solid var(--border)',
            background: selectedCategory === 'all' ? 'var(--accent)' : 'var(--bg-secondary)',
            color: selectedCategory === 'all' ? '#fff' : 'var(--text-secondary)',
            fontWeight: selectedCategory === 'all' ? 700 : 400,
          }}
        >
          ทั้งหมด ({categoryCounts['all']})
        </button>
        {(Object.keys(CATEGORY_CONFIG) as NewsCategory[]).map(cat => {
          const cfg = CATEGORY_CONFIG[cat]
          const cnt = categoryCounts[cat] || 0
          if (cnt === 0) return null
          const active = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: active ? `2px solid ${cfg.color}` : '1px solid var(--border)',
                background: active ? `${cfg.color}22` : 'var(--bg-secondary)',
                color: active ? cfg.color : 'var(--text-secondary)',
                fontWeight: active ? 700 : 400,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <cfg.icon size={12} /> {cfg.label} ({cnt})
            </button>
          )
        })}
      </div>

      {/* ── News cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.slice(0, showCount).map(news => {
          const cfg = CATEGORY_CONFIG[news.category]
          return (
            <article
              key={news.id}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 12,
                padding: 16,
                border: `1px solid var(--border)`,
                borderLeft: `4px solid ${cfg.color}`,
                transition: 'border-color 0.2s',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                      background: `${cfg.color}22`, color: cfg.color,
                    }}>
                      <cfg.icon size={10} /> {cfg.label}
                    </span>
                    {news.province && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10,
                        background: 'var(--bg-primary)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }}>
                        📍 {news.province}{news.area ? ` ${news.area}` : ''}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, margin: 0, color: 'var(--text-primary)' }}>
                    {news.title}
                  </h3>
                </div>
                <a
                  href={news.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flexShrink: 0, padding: '6px 10px', borderRadius: 8, fontSize: 11,
                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                    color: 'var(--accent)', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ExternalLink size={12} /> อ่านเพิ่ม
                </a>
              </div>

              {/* Summary */}
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 10px' }}>
                {news.summary}
              </p>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Calendar size={11} /> {news.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    📰 {news.source}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {news.tags.map(tag => (
                    <span
                      key={tag}
                      onClick={() => setSearch(tag)}
                      style={{
                        padding: '1px 6px', borderRadius: 6, fontSize: 10,
                        background: 'var(--bg-primary)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 2,
                      }}
                    >
                      <Tag size={8} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Load more */}
      {filtered.length > showCount && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            onClick={() => setShowCount(s => s + 10)}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <ChevronDown size={14} /> แสดงเพิ่ม ({filtered.length - showCount} รายการ)
          </button>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 14,
        }}>
          ไม่พบข่าวที่ตรงกับคำค้น
        </div>
      )}
    </div>
  )
}
