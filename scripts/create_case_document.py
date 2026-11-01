"""Create the editable case handout from the site's single content source."""
from pathlib import Path
import json
from datetime import datetime, timezone
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'src/data/content.json').read_text())
SOURCES = {s['id']: s for s in DATA['sources']}
OUT = ROOT / 'output/documents/思想常青_当代案例资料包.docx'
OUT.parent.mkdir(parents=True, exist_ok=True)

doc = Document()
for style in doc.styles:
    for border in list(style.element.iter(qn('w:pBdr'))):
        border.getparent().remove(border)
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.top_margin, sec.bottom_margin = Cm(2.1), Cm(1.9)
sec.left_margin, sec.right_margin = Cm(2.25), Cm(2.25)
sec.header_distance, sec.footer_distance = Cm(.8), Cm(.8)

def font_of(style, name, size, bold=False, color='000000'):
    style.font.name = name
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.color.rgb = RGBColor.from_string(color)
    rpr = style.element.get_or_add_rPr()
    rf = rpr.find(qn('w:rFonts'))
    if rf is None:
        rf = OxmlElement('w:rFonts'); rpr.insert(0, rf)
    for k in ['ascii', 'hAnsi', 'eastAsia', 'cs']:
        rf.set(qn('w:' + k), name)
    for k in ['asciiTheme', 'hAnsiTheme', 'eastAsiaTheme', 'cstheme', 'csTheme']:
        rf.attrib.pop(qn('w:' + k), None)
    lang = OxmlElement('w:lang'); lang.set(qn('w:eastAsia'), 'zh-CN'); rpr.append(lang)

for name in ['Normal', 'Body Text', 'List Bullet', 'List Number']:
    font_of(doc.styles[name], 'Songti SC', 11)
    pf = doc.styles[name].paragraph_format
    pf.line_spacing = Pt(17); pf.space_after = Pt(5)
    pf.widow_control = True
font_of(doc.styles['Title'], 'Heiti SC', 23, True)
doc.styles['Title'].paragraph_format.space_after = Pt(12)
doc.styles['Title'].paragraph_format.line_spacing = Pt(30)
font_of(doc.styles['Subtitle'], 'Heiti SC', 12)
doc.styles['Subtitle'].paragraph_format.space_after = Pt(12)
for name, size in [('Heading 1', 18), ('Heading 2', 12), ('Heading 3', 11)]:
    font_of(doc.styles[name], 'Heiti SC', size, True)
    pf = doc.styles[name].paragraph_format
    pf.space_before = Pt(8 if name != 'Heading 1' else 0)
    pf.space_after = Pt(4)
    pf.keep_with_next = True
    pf.line_spacing = Pt(24 if name == 'Heading 1' else 18)
for name in ['Header', 'Footer']:
    font_of(doc.styles[name], 'Heiti SC', 8.5)
    doc.styles[name].paragraph_format.space_after = Pt(0)

def paragraph(text='', style=None, *, size=None, before=0, after=None):
    p = doc.add_paragraph(style=style)
    p.add_run(text)
    if size:
        for r in p.runs: r.font.size = Pt(size)
        if size <= 10.5: p.paragraph_format.line_spacing = Pt(15)
    if before: p.paragraph_format.space_before = Pt(before)
    if after is not None: p.paragraph_format.space_after = Pt(after)
    return p

def heading(text, level=2):
    return doc.add_heading(text, level)

def link(p, label, url, size=10):
    rel = p.part.relate_to(url, RT.HYPERLINK, is_external=True)
    h = OxmlElement('w:hyperlink'); h.set(qn('r:id'), rel)
    run = OxmlElement('w:r'); props = OxmlElement('w:rPr')
    fonts = OxmlElement('w:rFonts')
    for k in ['ascii', 'hAnsi', 'eastAsia']: fonts.set(qn('w:' + k), 'Songti SC')
    props.append(fonts)
    c = OxmlElement('w:color'); c.set(qn('w:val'), '224A70'); props.append(c)
    u = OxmlElement('w:u'); u.set(qn('w:val'), 'single'); props.append(u)
    sz = OxmlElement('w:sz'); sz.set(qn('w:val'), str(int(size * 2))); props.append(sz)
    run.append(props); t = OxmlElement('w:t'); t.text = label; run.append(t)
    h.append(run); p._p.append(h)

def refs(ids, short=True):
    p = paragraph('文献依据  ', size=9.5, before=5, after=0)
    for n, ident in enumerate(ids):
        s = SOURCES[ident]
        if n: p.add_run('； ')
        label = f"[{ident}] {s['publisher']} {s['date']}" if short else f"[{ident}] {s['title']}"
        link(p, label, s['url'], 9.5)
    return p

header = sec.header.paragraphs[0]
header.add_run('同济大学毛概课程  当代案例资料')
footer = sec.footer.paragraphs[0]; footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer.add_run('第 ')
f = OxmlElement('w:fldSimple'); f.set(qn('w:instr'), 'PAGE'); footer._p.append(f)
footer.add_run(' 页')

# Page 1 is a working overview rather than an empty decorative cover.
paragraph('毛泽东思想活的灵魂\n当代案例资料包', 'Title')
paragraph('同济大学毛概课程小组展示  思想常青', 'Subtitle')
paragraph('整理日期  2026年11月1日    资料核验日期  2026年10月29日', size=9.5)
heading('课程讨论主题')
paragraph('毛泽东思想活的灵魂在今天是否仍具有现实意义？')
heading('整体判断')
paragraph(DATA['conclusion']['text'])
paragraph(DATA['conclusion']['boundary'])
heading('三个案例与讨论重点')
table = doc.add_table(rows=1, cols=3)
table.alignment = WD_TABLE_ALIGNMENT.CENTER; table.autofit = False
widths = [2.8, 5.0, 8.7]
for i, width in enumerate(widths):
    table.columns[i].width = Cm(width)
for i, text in enumerate(['思想方法', '当代案例', '讨论重点']):
    table.rows[0].cells[i].text = text
rows = [
    ['实事求是', '浙江千万工程', '先调查条件，再分类施策，并在实践中调整'],
    ['群众路线', '浙江浦江经验', '主动倾听诉求，以办理和反馈检验工作'],
    ['独立自主', '北斗卫星导航系统', '积累关键能力，同时开展开放交流与合作']
]
for row in rows:
    cells = table.add_row().cells
    for i, text in enumerate(row): cells[i].text = text
for row_i, row in enumerate(table.rows):
    for i, cell in enumerate(row.cells):
        cell.width = Cm(widths[i]); cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        tcpr = cell._tc.get_or_add_tcPr()
        borders = OxmlElement('w:tcBorders')
        for edge in ['top', 'bottom', 'left', 'right']:
            e = OxmlElement('w:' + edge); e.set(qn('w:val'), 'single'); e.set(qn('w:sz'), '5'); e.set(qn('w:color'), 'D9D9D9'); borders.append(e)
        tcpr.append(borders)
        margins = OxmlElement('w:tcMar')
        for edge in ['top', 'bottom', 'left', 'right']:
            e = OxmlElement('w:' + edge); e.set(qn('w:w'), '100'); e.set(qn('w:type'), 'dxa'); margins.append(e)
        tcpr.append(margins)
        if row_i == 0:
            sh = OxmlElement('w:shd'); sh.set(qn('w:fill'), 'EDEDED'); tcpr.append(sh)
        for p in cell.paragraphs:
            p.paragraph_format.line_spacing = Pt(15); p.paragraph_format.space_after = Pt(0)
            if i == 0: p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs: r.font.size = Pt(10); r.font.bold = row_i == 0
repeat = OxmlElement('w:tblHeader'); table.rows[0]._tr.get_or_add_trPr().append(repeat)
heading('使用方式')
for t in [
    '事实摘要用于PPT背景页，并保留相应的来源编号。',
    '理论联系、现实启示和教师追问回答中的判断属于本组分析。',
    '课堂口播为本组原创表达，可直接调整后使用，不是历史人物讲话原文。'
]: paragraph(t, 'List Bullet')
paragraph('第2至4页为三个案例，第5页为教师追问，第6页为参考文献。', size=10, before=6)

# One case per page makes copying into group slides straightforward.
case_names = ['案例一 浙江千万工程与实事求是', '案例二 浙江浦江经验与群众路线', '案例三 北斗系统与独立自主']
for i, case in enumerate(DATA['cases']):
    doc.add_page_break()
    heading(case_names[i], 1)
    paragraph(case['time'] + '  |  ' + case['place'], size=10, after=8)
    for label, field in [
        ('事实摘要', 'factSummary'),
        ('理论联系与意义分析', 'theoryAnalysis'),
        ('现实启示', 'practicalImplication'),
        ('课堂口播', 'oral')
    ]:
        heading(label)
        paragraph(case[field])
    heading('PPT提要与讨论问题')
    paragraph('方法过程：' + case['method'] + '。', size=10.5, after=3)
    paragraph('讨论问题：' + case['reflection'], size=10.5)
    heading('论证边界')
    paragraph(case['limit'], size=10.5)
    refs(case['sourceIds'])

doc.add_page_break()
heading('教师可能追问的问题与回答', 1)
paragraph('回答时先说明材料能够支持的事实，再说明本组的解释与判断。')
for i, question in enumerate(DATA['teacherQuestions']):
    # The actual question remains body text so headings stay descriptive.
    heading(['当代案例与历史理论的联系', '群众诉求与工作成效的判断', '自主能力与国际合作的关系'][i])
    p = paragraph(f"问题{i + 1}  {question['question']}")
    p.runs[0].bold = True
    paragraph(question['answer'])
    refs(question['sourceIds'])
heading('课堂总结口播')
paragraph('本组认为，毛泽东思想活的灵魂在今天仍具有方法论启示。三个案例分别说明，认识问题要尊重事实，组织实践要回应人民，探索发展要掌握主动。同时，今天的制度、技术和社会条件已经变化，运用这些方法应结合新的实际，在实践中不断检验和完善。')

doc.add_page_break()
heading('参考文献与核验说明', 1)
paragraph('下列文献核验日期为2026年10月29日。本次整理沿用已有核验记录，未将其标为2026年11月1日重新核验。文献题名和各案来源编号均可点击打开原文。', size=10.5)
for ident in ['S7', 'S6', 'S9', 'S3', 'S11', 'S4', 'S5']:
    s = SOURCES[ident]
    p = paragraph('', before=7, after=3)
    p.add_run(f'[{ident}] ').bold = True
    link(p, s['title'], s['url'], 10.5)
    paragraph(f"{s['publisher']}  {s['date']}。{s['dateNote']}。", size=9.5, after=2)
    paragraph('来源说明：' + s['origin'] + '。', size=9.5, after=2)
heading('待复核的原始链接')
paragraph('以下仅保留为线索，不承载正文关键事实。已有可读取的替代依据。', size=10)
for ident in ['S1', 'S2', 'S10']:
    s = SOURCES[ident]
    p = paragraph('', before=4, after=2)
    link(p, f"[{ident}] {s['publisher']}  {s['date']}", s['url'], 9.5)
    status = {'S1': '原链接返回404，题名与日期未核实；采用S6、S7、S9支持相关事实。',
              'S2': '原链接出现重定向循环；采用S3、S11支持浦江经验核心事实。',
              'S10': '原链接读取超时，发布日期未核实；北斗事实采用S4白皮书。'}[ident]
    paragraph(status, size=9.5, after=2)

doc.core_properties.title = '毛泽东思想活的灵魂当代案例资料包'
doc.core_properties.subject = '同济大学毛概课程小组展示案例资料'
doc.core_properties.author = '课程资料整理'
doc.core_properties.keywords = '实事求是 群众路线 独立自主 千万工程 浦江经验 北斗'
doc.core_properties.created = datetime.now(timezone.utc)
doc.core_properties.modified = datetime.now(timezone.utc)
doc.save(OUT)
print(OUT)
