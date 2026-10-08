#!/usr/bin/env python3
"""Generates the Glint blog (static HTML + cover images + RSS + sitemap) from tools/blog_posts.py.
Run from the project root:  python3 tools/build_blog.py   (needs Pillow)."""
import colorsys, datetime, html, json, os, random, re, sys
from email.utils import format_datetime
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from blog_posts import POSTS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'public') + '/'
S = 'https://glintex.vercel.app'
TODAY = datetime.date(2026, 10, 7)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
HUES = {'Guides': .62, 'Features': .46, 'Privacy': .53, 'Tips': .09, 'AI basics': .83, 'Story': .96}
esc = html.escape
os.makedirs(P + 'blog/img', exist_ok=True)

# ---------- data ----------
def words(t): return len(re.findall(r"\w+", t))
posts = []
for i, (slug, title, cat, desc, tags, body, cta) in enumerate(POSTS):
    d = TODAY - datetime.timedelta(days=i * 2)
    posts.append(dict(slug=slug, title=title, cat=cat, desc=desc, tags=tags, body=body, cta=cta, date=d,
                      wc=words(body), rt=max(1, round(words(body) / 200)), url=f'{S}/blog/{slug}', img=f'{S}/blog/img/{slug}.jpg'))
cats = []
for p in posts:
    if p['cat'] not in cats: cats.append(p['cat'])

def related(p):
    same = [q for q in posts if q is not p and q['cat'] == p['cat']]
    rest = [q for q in posts if q is not p and q['cat'] != p['cat']]
    return (same + rest)[:3]

# ---------- cover images ----------
def rgb(h, s, v): return tuple(int(x * 255) for x in colorsys.hsv_to_rgb(h % 1, s, v))
def wrap(d, text, font, maxw):
    out, line = [], ''
    for w in text.split():
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=font) <= maxw: line = t
        else: out.append(line); line = w
    return out + [line]
def cover(p):
    W, H = 1200, 630
    random.seed(p['slug'])
    h = HUES[p['cat']] + random.uniform(-.04, .04)
    im = Image.new('RGB', (W, H), (6, 6, 10))
    glow = Image.new('RGB', (W, H), (0, 0, 0)); g = ImageDraw.Draw(glow)
    for k in range(3):
        cx, cy, r = random.randint(100, 1100), random.randint(60, 560), random.randint(170, 280)
        g.ellipse((cx - r, cy - r, cx + r, cy + r), fill=rgb(h + k * .08, .75, .5))
    im = ImageChops.add(im, glow.filter(ImageFilter.GaussianBlur(110)))
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    cx, cy = random.randint(700, 1050), random.randint(150, 480)
    for r in range(80, 560, 70): d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 255, 255, 22), width=2)
    pts = [(random.randint(0, W), random.randint(0, H)) for _ in range(26)]
    for a in range(len(pts)):
        for b in range(a + 1, len(pts)):
            dist = ((pts[a][0] - pts[b][0]) ** 2 + (pts[a][1] - pts[b][1]) ** 2) ** .5
            if dist < 190: d.line((pts[a], pts[b]), fill=(255, 255, 255, int(60 * (1 - dist / 190))), width=1)
    for x, y in pts: d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(255, 255, 255, 150))
    im = Image.alpha_composite(im.convert('RGBA'), lay); d = ImageDraw.Draw(im)
    icon = Image.open(P + 'icons/icon-512.png').convert('RGBA').resize((64, 64)); im.paste(icon, (64, 56), icon)
    d.text((142, 70), 'GLINT', font=ImageFont.truetype(FONT, 26), fill=(255, 255, 255, 230))
    f = ImageFont.truetype(FONT, 22); cw = int(d.textlength(p['cat'].upper(), font=f)) + 44
    d.rounded_rectangle((W - 64 - cw, H - 78, W - 64, H - 32), radius=23, fill=(255, 255, 255, 235)); d.text((W - 64 - cw + 22, H - 69), p['cat'].upper(), font=f, fill=(0, 0, 0, 255))
    size = 70
    while True:
        tf = ImageFont.truetype(FONT, size); lines = wrap(d, p['title'], tf, 960)
        if len(lines) <= 4 or size <= 48: break
        size -= 4
    y = H - 70 - len(lines) * int(size * 1.18)
    for ln in lines: d.text((64, y), ln, font=tf, fill=(255, 255, 255, 255)); y += int(size * 1.18)
    d.text((64, H - 54), 'by V Yash Raj', font=ImageFont.truetype(FONT, 22), fill=(190, 190, 200, 255))
    im.convert('RGB').save(P + f"blog/img/{p['slug']}.jpg", 'JPEG', quality=84, optimize=True, progressive=True)
    for w in (480, 800): im.convert('RGB').resize((w, round(w * 630 / 1200)), Image.LANCZOS).save(P + f"blog/img/{p['slug']}-{w}.jpg", 'JPEG', quality=80, optimize=True, progressive=True)
for p in posts: cover(p)

# ---------- SEO titles (kept under ~60 characters so they are not truncated in results) ----------
SEO_TITLES = {
    'auto-pick-best-ai-model': 'Auto-Pick: How Glint Chooses the Best AI Model',
    'better-prompts-seven-rules': '7 Rules for Better AI Prompts on Any Model',
    'bring-your-own-key-byok': 'Bring Your Own Key (BYOK): Cheaper, Safer AI',
    'create-images-video-music-gemini': 'Create Images, Video and Music With Gemini',
    'free-gemini-api-key-glint': 'How to Get a Free Gemini API Key for Glint',
    'glint-encryption-explained': 'How Glint Encrypts Your Chats, Explained',
    'openrouter-one-key-hundreds-of-models': 'OpenRouter in Glint: One Key, Hundreds of Models',
    'temporary-chats-privacy': 'Temporary Chats: Private AI Conversations',
    'what-is-glint': 'What Is Glint? Every AI Model in One Workspace',
}
def seo_title(p):
    base = SEO_TITLES.get(p['slug'], p['title'])
    for suf in (' | Glint Blog', ' | Glint', ''):
        if len(base + suf) <= 60: return base + suf
    return base

# ---------- shared html ----------
def fmt(d): return d.strftime('%b %-d, %Y')
def render(body):
    out = []; heads = []; render.heads = heads
    def inline(t): return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', esc(t, quote=False))
    for blk in body.strip().split('\n\n'):
        lines = blk.split('\n')
        if lines[0].startswith('## '):
            hid = re.sub(r'[^a-z0-9]+', '-', lines[0][3:].lower()).strip('-'); heads.append((hid, lines[0][3:])); out.append(f'<h2 id="{hid}">{inline(lines[0][3:])}</h2>'); lines = lines[1:]
            if not lines: continue
        if lines[0].startswith('- '): out.append('<ul>' + ''.join(f'<li>{inline(l[2:])}</li>' for l in lines) + '</ul>')
        else: out.append(f'<p>{inline(" ".join(lines))}</p>')
    return '\n'.join(out)

person = None
m = re.search(r'<script type="application/ld\+json">(.*?)</script>', open(P + 'index.html').read(), re.S)
for n in json.loads(m.group(1))['@graph']:
    if n['@type'] == 'Person': person = n
    if n['@type'] == 'WebSite': website = n
KW = 'Glint, Glint AI, V Yash Raj, AI chat, multi-model AI'
ORG = {"@type": "Organization", "@id": S + '/#org', "name": "Glint", "url": S + '/', "logo": {"@type": "ImageObject", "url": S + '/icons/icon-512.png', "width": 512, "height": 512},
       "founder": {"@id": S + '/#yash'}, "sameAs": ['https://vyashraj.vercel.app']}
NAV = '<a href="/about">About</a><a href="/blog">Blog</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/help">Help</a><a href="/contact">Contact</a><a href="/chat">Open app</a>'
HEADER = f'<header><a href="/"><img src="/icons/icon-192.png" width="26" height="26" alt="">Glint</a><nav>{NAV}</nav></header>'
FOOTER = '<footer><span>© Glint · V Yash Raj</span><span><a href="/">Home</a><a href="/blog">Blog</a><a href="/about">About</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/help">Help</a><a href="/contact">Contact</a></span></footer>'
def head(title, desc, path, image, typ, kw, ld, extra=''):
    u = S + path
    return f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{esc(title)}</title><meta name="description" content="{esc(desc)}"><meta name="theme-color" content="#000000">
<link rel="canonical" href="{u}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><meta name="author" content="V Yash Raj"><link rel="author" href="{S}/about"><link rel="alternate" hreflang="en" href="{u}"><link rel="alternate" hreflang="x-default" href="{u}"><meta property="og:image:type" content="image/jpeg"><meta property="og:locale" content="en_US"><meta name="keywords" content="{esc(kw)}">
<meta property="og:site_name" content="Glint"><meta property="og:type" content="{typ}"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{u}"><meta property="og:image" content="{image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{esc(title)}"><meta property="og:locale" content="en_US">{extra}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)}"><meta name="twitter:description" content="{esc(desc)}"><meta name="twitter:image" content="{image}">
<link rel="icon" href="/icons/icon-192.png"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><link rel="sitemap" type="application/xml" href="/sitemap.xml"><link rel="alternate" type="application/rss+xml" title="Glint Blog" href="/rss.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/legal.css"><link rel="stylesheet" href="/blog.css"><script>document.documentElement.className+=' js'</script>
<script type="application/ld+json">{json.dumps({"@context": "https://schema.org", "@graph": ld}, ensure_ascii=False)}</script></head>'''
SAVE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg>'
def card(p, lazy=True):
    return f'''<article class="bc" data-cat="{esc(p['cat'])}" data-slug="{p['slug']}" data-t="{esc((p['title'] + ' ' + p['desc'] + ' ' + ' '.join(p['tags'])).lower())}"><a class="bc-a" href="/blog/{p['slug']}"><div class="bc-img"><img src="/blog/img/{p['slug']}-800.jpg" srcset="/blog/img/{p['slug']}-480.jpg 480w, /blog/img/{p['slug']}-800.jpg 800w, /blog/img/{p['slug']}.jpg 1200w" sizes="(max-width:700px) 92vw, (max-width:1100px) 46vw, 380px" alt="{esc(p['title'])}" width="1200" height="630"{' loading="lazy" decoding="async"' if lazy else ''}></div><div class="bc-b"><span class="bc-c">{esc(p['cat'])}</span><h3>{esc(p['title'])}</h3><p>{esc(p['desc'])}</p><div class="bc-m"><span>{fmt(p['date'])} · {p['rt']} min read</span><span>♥ <b data-lk="{p['slug']}">0</b> · 💬 <b data-cc="{p['slug']}">0</b></span></div></div></a><button class="bc-save" type="button" data-slug="{p['slug']}" aria-label="Save article" aria-pressed="false">{SAVE_SVG}</button></article>'''

# ---------- article pages ----------
HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.6-9.3-9.1C1 8.500 3 5 6.400 5c2 0 3.500 1.100 5.600 3.300C14.100 6.100 15.600 5 17.600 5 21 5 23 8.500 21.300 11.900 19 16.400 12 21 12 21z"/></svg>'
CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.500 7.200L4 20l1-4.600A8 8 0 1 1 21 12z"/></svg>'
SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.600 10.600l6.800-4M8.600 13.400l6.800 4"/></svg>'
for i, p in enumerate(posts):
    iso = p['date'].isoformat()
    body_html = render(p['body'])
    toc_html = ('<nav class="toc" aria-label="In this article"><b>In this article</b><ol>' + ''.join(f'<li><a href="#{h}">{esc(re.sub(r"^\d+\.\s*", "", x))}</a></li>' for h, x in render.heads) + '</ol></nav>') if len(render.heads) >= 3 else ''
    rel2 = related(p)[:2]
    more_html = '<p class="pmore"><b>Related reading:</b> ' + ' · '.join(f'<a href="/blog/{q["slug"]}">{esc(q["title"])}</a>' for q in rel2) + '</p>'
    author_html = '<aside class="abox"><span class="av">YR</span><div><b><a href="/about" rel="author">V Yash Raj</a></b><p>High school student, poet and author of <i>Indulgent Echoes</i>, and the creator of Glint. <a href="/about">About the author</a> · <a href="https://vyashraj.vercel.app" rel="me noopener" target="_blank">Personal website</a></p></div></aside>'
    srcset = f"/blog/img/{p['slug']}-480.jpg 480w, /blog/img/{p['slug']}-800.jpg 800w, /blog/img/{p['slug']}.jpg 1200w"
    ld = [website, ORG, person,
          {"@type": "BlogPosting", "@id": p['url'] + '#post', "headline": p['title'], "description": p['desc'], "image": {"@type": "ImageObject", "url": p['img'], "width": 1200, "height": 630}, "thumbnailUrl": p['img'], "datePublished": iso, "dateModified": iso,
           "author": {"@type": "Person", "@id": S + '/#yash', "name": "V Yash Raj", "url": S + '/about'}, "publisher": {"@id": S + '/#org'}, "isAccessibleForFree": True, "timeRequired": f"PT{p['rt']}M", "mainEntityOfPage": {"@type": "WebPage", "@id": p['url']}, "url": p['url'],
           "articleSection": p['cat'], "keywords": ', '.join(p['tags']), "wordCount": p['wc'], "inLanguage": "en", "isPartOf": {"@id": S + '/blog#blog'}},
          {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Glint", "item": S + '/'}, {"@type": "ListItem", "position": 2, "name": "Blog", "item": S + '/blog'}, {"@type": "ListItem", "position": 3, "name": p['title'], "item": p['url']}]}]
    extra = f'<meta property="article:published_time" content="{iso}"><meta property="article:modified_time" content="{iso}"><meta property="article:author" content="V Yash Raj"><meta property="article:section" content="{esc(p["cat"])}">' + ''.join(f'<meta property="article:tag" content="{esc(t)}">' for t in p['tags'])
    extra += f'<link rel="preload" as="image" href="/blog/img/{p["slug"]}-800.jpg" imagesrcset="/blog/img/{p["slug"]}-480.jpg 480w, /blog/img/{p["slug"]}-800.jpg 800w, /blog/img/{p["slug"]}.jpg 1200w" imagesizes="(max-width:800px) 100vw, 760px" fetchpriority="high">'
    prev = posts[i + 1] if i + 1 < len(posts) else None; nxt = posts[i - 1] if i > 0 else None
    pn = '<nav class="pn" aria-label="More articles">' + (f'<a href="/blog/{prev["slug"]}"><small>Older</small>{esc(prev["title"])}</a>' if prev else '<span></span>') + (f'<a href="/blog/{nxt["slug"]}"><small>Newer</small>{esc(nxt["title"])}</a>' if nxt else '<span></span>') + '</nav>'
    page = head(seo_title(p), p['desc'], f"/blog/{p['slug']}", p['img'], 'article', ', '.join(p['tags'] + [KW]), ld, extra) + f'''
<body data-pt data-slug="{p['slug']}"><div id="rp" aria-hidden="true"></div>
{HEADER}
<article class="post">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Glint</a><span>/</span><a href="/blog">Blog</a><span>/</span><a href="/blog?c={esc(p['cat'])}">{esc(p['cat'])}</a></nav>
<a class="pcat" href="/blog?c={esc(p['cat'])}">{esc(p['cat'])}</a>
<h1>{esc(p['title'])}</h1><p class="pdesc">{esc(p['desc'])}</p>
<div class="pmeta"><span class="av">YR</span><span><b><a href="/about" rel="author">V Yash Raj</a></b><small><time datetime="{iso}">{fmt(p['date'])}</time> · {p['rt']} min read</small></span></div>
<figure class="pcover"><img src="/blog/img/{p['slug']}-800.jpg" srcset="{srcset}" sizes="(max-width:800px) 100vw, 760px" width="1200" height="630" alt="Cover graphic for the article: {esc(p['title'])}" fetchpriority="high"></figure>
{toc_html}<div class="pbody">{body_html}</div>{more_html}
<aside class="pcta"><div><b>Try it in Glint</b><span>Free, private and built for phones, tablets and desktops.</span></div><a class="bb" href="{p['cta'][1]}">{esc(p['cta'][0])}</a></aside>
{author_html}
<div class="tags">{''.join(f'<span>#{esc(t)}</span>' for t in p['tags'])}</div>
<section id="comments"><h2 class="sh">Comments <small id="cc">0</small></h2>
<form id="cform" novalidate><input name="name" placeholder="Your name (optional)" maxlength="40" autocomplete="nickname" aria-label="Your name"><textarea name="text" placeholder="Share a thought. Links are not allowed." maxlength="600" required aria-label="Comment"></textarea><input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="bb" type="submit">Post comment</button><p id="cs" role="status"></p></form>
<ol id="clist" aria-live="polite"></ol></section>
<section class="rel"><h2 class="sh">Keep reading</h2><div class="bgrid">{''.join(card(q) for q in related(p))}</div></section>
{pn}
</article>
<div class="dock" role="toolbar" aria-label="Article actions"><button class="dk like" id="lk" type="button" aria-label="Like this article" aria-pressed="false">{HEART}<b id="lkn">0</b></button><a class="dk" href="#comments" aria-label="Jump to comments">{CHAT}<b id="ccn">0</b></a><button class="dk sv" id="sv" type="button" aria-label="Save this article" aria-pressed="false">{SAVE_SVG}</button><button class="dk" id="sh" type="button" aria-label="Share this article">{SHARE}</button></div>
{FOOTER}
<script src="/blog.js" defer></script><script src="/site.js" defer></script></body></html>'''
    open(P + f"blog/{p['slug']}.html", 'w').write(page)

# ---------- blog index ----------
T = 'Glint Blog: AI tips, guides and how-tos | V Yash Raj'
D = 'Guides and tips about Glint and AI: free API keys, Auto-pick, Townhall, privacy, study prompts and coding help. Like, save and comment.'
ld = [website, ORG, person,
      {"@type": "Blog", "@id": S + '/blog#blog', "name": "Glint Blog", "description": D, "url": S + '/blog', "inLanguage": "en", "publisher": {"@id": S + '/#org'},
       "blogPost": [{"@type": "BlogPosting", "headline": p['title'], "url": p['url'], "datePublished": p['date'].isoformat(), "image": p['img'], "description": p['desc']} for p in posts]},
      {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": p['url'], "name": p['title']} for i, p in enumerate(posts)]},
      {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Glint", "item": S + '/'}, {"@type": "ListItem", "position": 2, "name": "Blog", "item": S + '/blog'}]}]
chips = '<button class="ch on" type="button" data-c="All">All</button>' + ''.join(f'<button class="ch" type="button" data-c="{esc(c)}">{esc(c)}</button>' for c in cats) + '<button class="ch" type="button" data-c="Saved">Saved <b>0</b></button>'
index = head(T, D, '/blog', S + '/og-image.png', 'website', 'Glint blog, AI guides, AI tips, ' + ', '.join(sorted({t for p in posts for t in p['tags']}))[:300], ld) + f'''
<body data-pt>{HEADER}
<main class="bl"><section class="bh"><span class="tag">The Glint blog</span><h1>Ideas for using AI better.</h1><p>Practical guides, tips and stories about Glint, AI models, privacy and creativity. {len(posts)} articles, written by V Yash Raj.</p></section>
<div class="tools"><input id="bs" type="search" placeholder="Search articles..." aria-label="Search articles" autocomplete="off"><div class="chips" role="group" aria-label="Filter by category">{chips}</div></div>
<div class="bgrid" id="bgrid">{''.join(card(p, i > 1) for i, p in enumerate(posts))}</div><p class="be" id="be" hidden></p></main>
{FOOTER}
<script src="/blog.js" defer></script><script src="/site.js" defer></script></body></html>'''
open(P + 'blog.html', 'w').write(index)

# ---------- RSS ----------
def rfc(d): return format_datetime(datetime.datetime(d.year, d.month, d.day, 9, 0, tzinfo=datetime.timezone.utc))
items = ''.join(f"<item><title>{esc(p['title'])}</title><link>{p['url']}</link><guid isPermaLink=\"true\">{p['url']}</guid><pubDate>{rfc(p['date'])}</pubDate><category>{esc(p['cat'])}</category><description>{esc(p['desc'])}</description><enclosure url=\"{p['img']}\" type=\"image/jpeg\" length=\"0\"/></item>" for p in posts)
open(P + 'rss.xml', 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Glint Blog</title><link>{S}/blog</link><description>{esc(D)}</description><language>en</language><lastBuildDate>{rfc(TODAY)}</lastBuildDate><atom:link href="{S}/rss.xml" rel="self" type="application/rss+xml"/>{items}</channel></rss>\n')

# ---------- sitemap ----------
static = [('/', 1.0, 'weekly'), ('/blog', 0.9, 'daily'), ('/about', 0.8, 'monthly'), ('/help', 0.7, 'monthly'), ('/contact', 0.5, 'yearly'), ('/privacy', 0.4, 'yearly'), ('/terms', 0.4, 'yearly')]
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
sm += ''.join(f'  <url><loc>{S}{u}</loc><lastmod>{TODAY.isoformat()}</lastmod><changefreq>{c}</changefreq><priority>{pr}</priority></url>\n' for u, pr, c in static)
sm += ''.join(f"  <url><loc>{p['url']}</loc><lastmod>{p['date'].isoformat()}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority><image:image><image:loc>{p['img']}</image:loc><image:title>{esc(p['title'])}</image:title></image:image></url>\n" for p in posts)
open(P + 'sitemap.xml', 'w').write(sm + '</urlset>\n')
print(f'built {len(posts)} posts; words: ' + ', '.join(str(p['wc']) for p in posts))

# ---------- richer RSS (full text for aggregators) ----------
def item(p):
    size = os.path.getsize(P + f"blog/img/{p['slug']}.jpg")
    return (f"<item><title>{esc(p['title'])}</title><link>{p['url']}</link><guid isPermaLink=\"true\">{p['url']}</guid><pubDate>{rfc(p['date'])}</pubDate>"
            f"<dc:creator>V Yash Raj</dc:creator><category>{esc(p['cat'])}</category><description>{esc(p['desc'])}</description>"
            f"<content:encoded><![CDATA[<img src=\"{p['img']}\" alt=\"\">{render(p['body'])}<p><a href=\"{p['url']}\">Read on Glint</a></p>]]></content:encoded>"
            f"<enclosure url=\"{p['img']}\" type=\"image/jpeg\" length=\"{size}\"/></item>")
open(P + 'rss.xml', 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>Glint Blog</title><link>{S}/blog</link><description>{esc(D)}</description><language>en</language><lastBuildDate>{rfc(TODAY)}</lastBuildDate><atom:link href="{S}/rss.xml" rel="self" type="application/rss+xml"/><image><url>{S}/icons/icon-512.png</url><title>Glint Blog</title><link>{S}/blog</link></image>' + ''.join(item(p) for p in posts) + '</channel></rss>\n')
