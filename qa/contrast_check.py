"""Check the shared palette's main text pairs using WCAG relative luminance."""
from pathlib import Path
import json
import re
import sys
import argparse
sys.stdout.reconfigure(encoding='utf-8')

root = Path(__file__).resolve().parents[1]
css = (root / 'edip_site/assets/css/styles.css').read_text(encoding='utf-8')
colors = dict(re.findall(r'--([\w-]+):(#[\da-fA-F]{6})', css))
def rgb(hex_color): return [int(hex_color[i:i+2], 16)/255 for i in (1, 3, 5)]
def blend(fg, bg, alpha): return [f*alpha+b*(1-alpha) for f, b in zip(fg, bg)]
def luminance(color):
    linear = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in color]
    return sum(v*w for v,w in zip(linear, [.2126,.7152,.0722]))
def ratio(a,b):
    first,second=sorted([luminance(a),luminance(b)])
    return (second+.05)/(first+.05)
dark=rgb(colors['dark-soft']); white=rgb('#ffffff'); footer=rgb('#261e1b')
card=blend(white,dark,.08)
decorated_card=blend(white,blend(rgb(colors['brand-soft']),dark,.12),.08)
pairs=[('Accent sobre fons fosc',rgb(colors['dark-accent']),dark),
       ('Text blanc sobre fons fosc',white,dark),
       ('Text secundari fosc 72%',blend(white,dark,.72),dark),
       ('Subtítol finder 82%',blend(white,card,.82),card),
       ('Subtítol sobre decoració finder',blend(white,decorated_card,.82),decorated_card),
       ('Text secundari sobre crema',rgb(colors['muted']),rgb(colors['cream'])),
       ('Avís mapa sobre paper',rgb(colors['muted']),rgb(colors['paper'])),
       ('Placeholder mapa sobre sorra',rgb(colors['ink']),rgb(colors['sand'])),
       ('Text botó principal',white,rgb(colors['brand-strong'])),
       ('Footer secundari 50%',blend(white,footer,.5),footer)]
widget_css = (root / 'edip_site/assets/css/google-reviews-widget.css').read_text(encoding='utf-8')
def widget_color(selector, property):
    block = re.search(r'^'+re.escape(selector)+r'\{([^}]*)\}', widget_css, re.M).group(1)
    return rgb(re.search(r'(?:^|;)'+property+r':(#[\da-fA-F]{6})(?:;|$)', block).group(1))
review_bg = widget_color('.review-card', 'background')
widget_bg = widget_color(':root', 'background')
pairs.extend([
    ('Ressenya: text sobre targeta', widget_color(':root', 'color'), review_bg),
    ('Ressenya: data sobre targeta', widget_color('.review-date', 'color'), review_bg),
    ('Ressenya: estrelles sobre targeta', widget_color('.review-rating', 'color'), review_bg),
    ('Ressenya: llegir més', widget_color('.review-read-more', 'color'), review_bg),
    ('Ressenya: nota de selecció', widget_color('.reviews-selection-note', 'color'), widget_bg),
    ('Ressenya: fletxa activa', widget_color('.review-nav', 'color'), widget_color('.review-nav', 'background')),
])
report=[{'pair':name,'ratio':round(ratio(fg,bg),2),'passes_normal_text_AA':ratio(fg,bg)>=4.5} for name,fg,bg in pairs]
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=root/'qa/contrast-final.json')
args = parser.parse_args()
args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(any(not p['passes_normal_text_AA'] for p in report))
