# -*- coding: utf-8 -*-
"""生成软著软件说明书 Word：封面 + 六章图文，嵌入 screenshots/ 下截图"""
import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r"D:\Personal\Muse_QuickAPP"
OUT_DIR = os.path.join(ROOT, "docs", "软著材料")
SCREEN_DIR = os.path.join(OUT_DIR, "screenshots")
OUT = os.path.join(OUT_DIR, "Muse软件说明书_V1.0.docx")
SOFT_NAME = "心屿 Muse 青少年心理健康辅助软件"
VERSION = "V1.0"
AUTHOR = "（待填：著作权人姓名）"
FINISH_DATE = "2026-07-05"

def set_font(run, size=11, bold=False, name="宋体", color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:ascii"), name)
    rfonts.set(qn("w:hAnsi"), name)
    rfonts.set(qn("w:eastAsia"), name)

def add_page_number(par):
    run = par.add_run()
    f1 = OxmlElement("w:fldChar"); f1.set(qn("w:fldCharType"), "begin")
    it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = "PAGE"
    f2 = OxmlElement("w:fldChar"); f2.set(qn("w:fldCharType"), "end")
    run._r.append(f1); run._r.append(it); run._r.append(f2)
    set_font(run, 9)

def h1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(8)
    set_font(p.add_run(text), 14, True, "黑体")
    return p

def h2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(6)
    set_font(p.add_run(text), 12, True, "黑体")
    return p

def body(doc, text, indent=True):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.3
    if indent:
        p.paragraph_format.first_line_indent = Cm(0.74)
    set_font(p.add_run(text), 11)
    return p

def bullet(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.left_indent = Cm(0.6)
    set_font(p.add_run("· " + text), 11)
    return p

def img(doc, name, caption, width=8.5):
    path = os.path.join(SCREEN_DIR, name)
    if not os.path.exists(path):
        body(doc, "［图缺：{}］{}".format(name, caption), indent=False)
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.add_run().add_picture(path, width=Cm(width))
    c = doc.add_paragraph()
    c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    c.paragraph_format.space_after = Pt(8)
    set_font(c.add_run(caption), 9, False, "楷体")

def build():
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
    sec.top_margin = sec.bottom_margin = Cm(2.2)
    sec.left_margin = sec.right_margin = Cm(2.4)

    hdr = sec.header
    hp = hdr.paragraphs[0]
    hp.paragraph_format.tab_stops.add_tab_stop(Cm(16.2), WD_TAB_ALIGNMENT.RIGHT)
    r1 = hp.add_run("{} {}".format(SOFT_NAME, VERSION))
    set_font(r1, 9)
    hp.add_run("\t")
    add_page_number(hp)

    # 封面
    for _ in range(4):
        doc.add_paragraph()
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run("软件说明书"), 26, True, "黑体")
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(18)
    set_font(p.add_run(SOFT_NAME), 18, True, "黑体")
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run("（版本号：{}）".format(VERSION)), 14)
    for _ in range(6):
        doc.add_paragraph()
    for label, val in [("著作权人：", AUTHOR), ("开发完成日期：", FINISH_DATE), ("运行环境：", "浏览器（Chrome / Edge / Safari）")]:
        p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_font(p.add_run(label + val), 12)
    doc.add_page_break()

    # 一、软件概述
    h1(doc, "一、软件概述")
    body(doc, "心屿 Muse 青少年心理健康辅助软件（以下简称“本软件”）是一款面向青少年的心理健康辅助应用。本软件通过情绪日记记录、AI 智能分析、心理疏导对话和呼吸冥想练习四大核心功能，帮助青少年认识、理解并调节自己的情绪，以温柔的方式让技术成为青少年心理健康的守护者。")
    body(doc, "本软件基于 uni-app（Vue 3）框架开发，以网页（H5）形态部署运行，支持主流现代浏览器访问。软件界面采用薰衣草紫色系设计，提供亮色/暗黑双主题和多种可切换背景，兼顾视觉舒适度与青少年审美偏好。")
    h2(doc, "1.1 核心功能一览")
    bullet(doc, "情绪日记：16 种情绪类型记录，1-10 级强度，AI 从优势、改进建议、应对方法三维度分析，自动识别 8 种认知偏差")
    bullet(doc, "AI 心理问答：6 大对话场景，DeepSeek 大模型驱动，温暖专业的心理疏导风格，支持长对话摘要与上下文连贯")
    bullet(doc, "危机预警：中英文关键词与正则双重匹配，实时识别自杀/自残/霸凌信号，自动弹窗引导并一键拨打心理援助热线")
    bullet(doc, "情绪调节：4 种呼吸练习模式（4-7-8 放松法、盒式呼吸、4-4-6 平静法、7-11 深度放松）与 3 分钟正念冥想语音引导")
    bullet(doc, "个性化：亮色/暗黑双主题、6 种页面背景、多账户数据隔离")

    # 二、运行环境
    h1(doc, "二、运行环境")
    table = doc.add_table(rows=4, cols=2)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    rows = [
        ("硬件要求", "能运行现代浏览器的计算机或移动设备"),
        ("操作系统", "Windows / macOS / Android / iOS"),
        ("浏览器", "Chrome 90+ / Edge 90+ / Safari 14+ 等现代浏览器"),
        ("网络", "需联网使用 AI 功能（情绪记录等本地功能可离线使用）"),
    ]
    for i, (k, v) in enumerate(rows):
        c0, c1 = table.rows[i].cells
        c0.width, c1.width = Cm(4), Cm(11.5)
        set_font(c0.paragraphs[0].add_run(k), 11, True)
        set_font(c1.paragraphs[0].add_run(v), 11)
    body(doc, "本软件已部署于 Cloudflare Pages（https://muse-ember-quickapp.pages.dev）及 Surge.sh（https://muse-ember.surge.sh），打开链接即可使用，无需安装。")

    # 三、功能说明
    h1(doc, "三、软件功能说明")
    h2(doc, "3.1 登录与多账户管理")
    body(doc, "用户首次使用进入引导页，可创建本地账户。软件支持多账户隔离，每个账户拥有独立的情绪数据空间，可随时添加、切换或删除账户。")
    img(doc, "01_login.png", "图 3-1 登录与多账户管理界面")
    img(doc, "02_onboarding.png", "图 3-2 新用户引导页")

    h2(doc, "3.2 首页情绪仪表盘")
    body(doc, "首页展示近期情绪趋势可视化折线图（7 天趋势）、情绪分布统计和快捷记录入口，帮助用户快速把握自身情绪状态变化。")
    img(doc, "03_index.png", "图 3-3 首页情绪仪表盘")

    h2(doc, "3.3 情绪日记")
    body(doc, "写日记时选择 16 种情绪类型之一（快乐、焦虑、愤怒、悲伤等），通过滑动设置 1-10 级强度，并可自由记录心情文字。历史日记支持按情绪类型筛选与关键词搜索。")
    img(doc, "04_diary_list.png", "图 3-4 日记列表（情绪筛选）")
    img(doc, "05_diary_edit.png", "图 3-5 写日记（情绪选择与强度）")
    body(doc, "保存日记后，AI 从优势、改进建议、应对方法三个维度生成个性化分析，并自动识别灾难化思维、非黑即白、过度概括等 8 种常见认知偏差，帮助用户建立更健康的思维方式。")
    img(doc, "06_diary_ai.png", "图 3-6 日记详情与 AI 分析结果")

    h2(doc, "3.4 AI 心理问答")
    body(doc, "提供心有困惑、学习压力、人际关系、家庭关系、未来规划、情绪管理 6 大对话场景，由 DeepSeek 大模型驱动，以温暖专业的风格进行心理疏导。对话超过 50 轮后自动生成前序摘要，保持上下文连贯。")
    img(doc, "07_chat_scenes.png", "图 3-7 AI 问答场景选择")
    img(doc, "08_chat.png", "图 3-8 AI 对话界面")
    body(doc, "软件内置实时危机检测：通过中英文关键词与正则双重匹配，精准识别自杀/自残/霸凌等危险信号。检测到危机内容时自动弹出预警，引导用户与 AI 沟通或一键拨打心理援助热线（400-161-9995）。")
    img(doc, "09_crisis.png", "图 3-9 危机预警弹窗")

    h2(doc, "3.5 情绪调节")
    body(doc, "提供 4-7-8 放松法、盒式呼吸、4-4-6 平静法、7-11 深度放松 4 种呼吸练习模式，配合呼吸球动画可视化与震动反馈，引导用户平稳呼吸；另有 3 分钟正念冥想语音引导，帮助放松身心。")
    img(doc, "10_breathing.png", "图 3-10 呼吸练习界面")

    h2(doc, "3.6 个性化设置")
    body(doc, "支持亮色/暗黑双主题一键切换；日记页与对话页可独立选择晨雾森林、海波纹等 6 种背景；所有设置即时生效并本地保存。")
    img(doc, "11_settings.png", "图 3-11 个人中心：账户管理、安全预警、数据隐私、暗黑模式与背景设置")
    body(doc, "除自动危机检测外，软件还提供手动预警入口（见图 3-13），用户可一键呼叫心理援助热线（400-161-9995），适合不便文字表达时主动求助。")
    img(doc, "13_manual_warning.png", "图 3-13 手动预警：确认拨打心理援助热线")

    # 四、技术架构
    h1(doc, "四、技术架构")
    body(doc, "本软件采用前后端分离架构，前端基于 uni-app（Vue 3）开发，使用 Vite 构建，SCSS + CSS 自定义属性实现主题系统；AI 能力由 DeepSeek 大模型提供；为保证 API Key 安全，前端不直接调用 DeepSeek 接口，而是通过 Cloudflare Pages Function 安全代理转发请求，并附加访问令牌验证与 IP 速率限制。")
    body(doc, "数据存储采用本地存储方案，以多账户前缀实现数据隔离，所有用户数据保存在本地设备，不上传服务器。架构层次如下：")
    for line in [
        "前端界面层：uni-app (Vue 3) 页面与组件（情绪日记 / AI 问答 / 情绪调节 / 设置）",
        "数据存储层：本地存储（localStorage，多账户前缀隔离）",
        "服务代理层：Cloudflare Pages Function（访问令牌校验 + IP 速率限制）",
        "AI 能力层：DeepSeek 大模型（聊天 / 分析 / 摘要）",
    ]:
        bullet(doc, line)

    # 五、数据与隐私
    h1(doc, "五、数据与隐私")
    body(doc, "本软件高度重视用户隐私，特别是未成年人数据保护，采取以下措施：")
    bullet(doc, "数据本地化：全部情绪数据存储于用户本地设备，服务端不保存任何用户日记与对话内容")
    bullet(doc, "多账户隔离：不同账户数据通过前缀隔离，互不可见")
    bullet(doc, "API 安全代理：AI 请求经 Cloudflare Function 转发，DeepSeek API Key 不暴露于前端")
    bullet(doc, "速率限制：单 IP 每分钟最多 30 次请求，防止滥用")
    bullet(doc, "危机保护：自动识别危险信号并引导至专业心理援助热线")

    # 六、版本信息
    h1(doc, "六、版本信息")
    for line in [
        "软件名称：{}".format(SOFT_NAME),
        "版本号：{}".format(VERSION),
        "开发完成日期：{}".format(FINISH_DATE),
        "开发团队：灯塔象限",
    ]:
        body(doc, line, indent=False)

    os.makedirs(OUT_DIR, exist_ok=True)
    doc.save(OUT)
    print("已生成:", OUT)
    print("提示：封面著作权人字段待填写；缺失截图会自动标注 [图缺]")

if __name__ == "__main__":
    build()
