"""Read-only image/metadata validation and a static local gallery. No pixels edited."""
from pathlib import Path
from PIL import Image
from collections import Counter
import hashlib, html, json, re
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ART = ROOT / "assets/expedition/astra-v1"
errors = []
def read(p):
    return json.loads(p.read_text(encoding="utf-8-sig"))
def relative(p):
    return p.relative_to(ROOT).as_posix()
def title(s):
    return s.replace("_", " ").replace("-", " ").title()
items = []
def add(group, path, label, count=0, kind="painted keys", note=""):
    p = ROOT / path
    if not p.is_file():
        errors.append("Missing selected source: " + str(path))
        return
    if any(x["path"] == str(path) for x in items):
        return
    with Image.open(p) as im:
        size, mode = im.size, im.mode
    items.append(dict(group=group,path=str(path),label=label,count=count,kind=kind,note=note,
                      width=size[0],height=size[1],mode=mode,bytes=p.stat().st_size))

hiro = read(ART / "heroes/hiro/manifest.json")
hb = hiro["basePath"].rstrip("/") + "/"
add("Hiro", hb+hiro["reference"]["file"], "Hiro · identity reference", kind="reference",
    note="Dark skin · purple locs · cyberpunk samurai · katana")
for c in hiro["clips"]:
    add("Hiro",hb+c["file"],title(c["id"]),c["frames"],note=c.get("notes",""))
bram = read(HERE / "bram-clips.json")
bb = bram["basePath"]
add("Bram",bb+bram["goldenReference"],"Bram · starter outfit",kind="reference",
    note="Burgundy duelist coat, straight sword and shield. Plate Harness variants remain.")
for c in bram["clips"]:
    add("Bram",bb+c["file"],title(c["id"]),c["frames"],note=c.get("note",""))
for c in bram["paired"]:
    for i,f in enumerate(c["files"]):
        add("Bram",bb+f["file"],title(c["id"])+(" · "+str(i+1) if len(c["files"])>1 else ""),
            f["frames"],note=c.get("note",""))
for c in bram["finishers"]:
    add("Bram",bb+c["file"],title(c["id"]),c["frames"],note="Paired with "+c["opponent"]+".")
beasts = read(HERE / "beasts-clips.json")
bp = "assets/expedition/astra-v1/beasts/"
add("Beasts",beasts["reference"],"Dire wolf · identity",kind="reference")
for c in beasts["wolfClips"]:
    add("Beasts",bp+c["file"],"Wolf · "+title(c["id"]),c["frames"],note=c.get("note",""))
for c in beasts["secondaryMotionClips"]:
    add("Beasts",bp+c["file"],title(c["creature"])+" · "+title(c["id"]),c["frames"],note=c.get("note",""))
for c in beasts["secondaryProofs"]:
    add("Beasts",bp+c["file"],title(c["id"])+" · action studies",c["frames"],"proof keys",
        "Pose studies; not a continuous clip by themselves.")
humans = read(HERE / "humans-regions.json")
for c in humans["clips"]:
    add("Human",humans["pathsRelativeTo"].rstrip("/")+"/"+c["file"],"Bandit · "+title(c["clip"]),
        len(c["frames"]),note="One painted identity. Other humans require matching outfit/face variants.")
effects = read(HERE / "effects-icons-regions.json")
for s in effects["sheets"]:
    group = "Effects" if "/effects/" in s["file"] else "Icons"
    add(group,s["file"],title(Path(s["file"]).stem.replace("-source","")),
        sum(not r.get("empty",False) for r in s["regions"]),"texture cells")
for file,label in [("bandit-camp","Bandit camp"),("toll-house-alley","Toll-house alley")]:
    add("Backgrounds","assets/expedition/astra-v1/backgrounds/"+file+".webp",label,kind="base plate",
        note="Still environment plate. Runtime atmosphere and scrolling are not embedded.")

inventory = []
for p in sorted(ART.rglob("*")):
    if p.suffix.lower() not in (".png",".webp"):
        continue
    try:
        with Image.open(p) as im:
            im.load()
            a = im.getchannel("A").getextrema() if "A" in im.getbands() else None
            inventory.append(dict(path=relative(p),width=im.width,height=im.height,mode=im.mode,
                                  alphaExtrema=a,bytes=p.stat().st_size,
                                  sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
    except Exception as exc:
        errors.append(str(p)+": "+str(exc))
json_files = list(HERE.glob("*.json"))+[ART/"heroes/hiro/manifest.json"]
for p in json_files:
    try: read(p)
    except Exception as exc: errors.append("JSON: "+str(p)+": "+str(exc))
for p in HERE.glob("*.md"):
    for link in re.findall(r"\]\(([^)]+)\)",p.read_text(encoding="utf-8-sig")):
        link=link.strip("<>").split("#",1)[0]
        if not link or "://" in link or link.startswith("/"): continue
        if not (p.parent/link).exists(): errors.append("Broken documentation link: "+p.name+" -> "+link)

rect_count = 0
for name,key,base in [("bram-source-regions.json","sheets",bb),
                      ("humans-regions.json","clips",humans["pathsRelativeTo"].rstrip("/")+"/"),
                      ("effects-icons-regions.json","sheets","")]:
    data=read(HERE/name)
    for sheet in data[key]:
        p=ROOT/(base+sheet["file"])
        with Image.open(p) as im:
            w,h=im.size
        if sheet.get("width",w)!=w or sheet.get("height",h)!=h:
            errors.append("Dimension metadata mismatch: "+str(p))
        for f in sheet.get("frames",sheet.get("regions",[])):
            x,y,rw,rh=f["rect"]
            rect_count+=1
            if min(x,y)<0 or min(rw,rh)<=0 or x+rw>w or y+rh>h:
                errors.append("Out-of-bounds rect: "+str(p)+" "+str(f["rect"]))

def check_clip(c,one_based=False):
    n=c["frames"]
    ds=c.get("durationsMs")
    if ds is not None and (len(ds)!=n or any(x<=0 for x in ds)):
        errors.append("Timing count/value: "+c["id"])
    for key in ("contact","release"):
        v=c.get(key)
        if v is not None and not (0 <= v < n): errors.append("Invalid "+key+": "+c["id"])
for c in bram["clips"]+bram["paired"]+bram["finishers"]: check_clip(c)
for c in beasts["wolfClips"]+beasts["secondaryMotionClips"]: check_clip(c)
if sum(c["frames"] for c in hiro["clips"]) != hiro["selectedFrameCount"]:
    errors.append("Hiro selected-frame count mismatch")
for c in hiro["clips"]:
    for v in c.get("contactFramesZeroBased",[]):
        if not (0 <= v < c["frames"]): errors.append("Hiro contact index: "+c["id"])
    v=c.get("releaseFrameZeroBased")
    if v is not None and not (0 <= v < c["frames"]): errors.append("Hiro release index: "+c["id"])
    actual=next(x for x in inventory if x["path"] == hb+c["file"])
    if actual["sha256"] != c["sha256"]: errors.append("Hiro source hash mismatch: "+c["id"])
    if (actual["width"],actual["height"]) != (c["width"],c["height"]):
        errors.append("Hiro dimension mismatch: "+c["id"])
if sum(x["count"] for x in items if x["group"]=="Bram") != bram["counts"]["totalSourceDrawings"]:
    errors.append("Bram selected-frame count mismatch")
if sum(x["count"] for x in items if x["group"]=="Beasts") != beasts["selectedDrawingCounts"]["totalMotionAndKeys"]:
    errors.append("Beast selected-frame count mismatch")
summary = dict(selectedFiles=len(items),selectedBytes=sum(x["bytes"] for x in items),
               drawingCountsByGroup=dict(Counter({g:sum(x["count"] for x in items if x["group"]==g)
                                                for g in ["Hiro","Bram","Beasts","Human","Effects","Icons"]})),
               allSourceImages=len(inventory),allSourceBytes=sum(x["bytes"] for x in inventory),
               checkedRectangles=rect_count)
report = dict(date=datetime.now(timezone.utc).isoformat(),status="PASS" if not errors else "FAIL",
              scope="Image decode, selected-path existence, JSON, metadata rectangles and clip counts/timings only.",
              runtimeIntegrated=False,playbackGreenlit=False,summary=summary,errors=errors,
              selected=items,allImages=inventory)
(HERE/"delivery-validation.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
esc = html.escape
cards=[]
for i in items:
    url="../../../"+i["path"]
    info=(str(i["count"])+" "+i["kind"]) if i["count"] else i["kind"]
    cards.append('<article class="card" data-group="'+esc(i["group"])+'" data-search="'+esc((i["label"]+" "+i["group"]).lower())+'">'
        '<a class="art" href="'+esc(url)+'" target="_blank" rel="noopener">'
        '<img loading="lazy" decoding="async" src="'+esc(url)+'" width="'+str(i["width"])+'" height="'+str(i["height"])+'" alt="'+esc(i["label"])+' source art"></a>'
        '<div class="caption"><span class="tag">'+esc(i["group"])+'</span><h2>'+esc(i["label"])+'</h2>'
        '<p class="meta">'+esc(info)+' · '+str(i["width"])+' × '+str(i["height"])+' · '+esc(i["mode"])+'</p>'
        '<p class="note">'+esc(i["note"] or "Painted source; foreground extraction, registration and playback review remain.")+'</p>'
        '<a class="file" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(Path(i["path"]).name)+' ↗</a></div></article>')
buttons=''.join('<button type="button" data-filter="'+g+'" aria-pressed="'+("true" if g=="All" else "false")+'">'+g+'</button>' for g in ["All","Hiro","Bram","Beasts","Human","Effects","Icons","Backgrounds"])
page="""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Expeditions · Astra art review</title>
<style>
:root{color-scheme:dark;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#101017;color:#f1ecf7}
*{box-sizing:border-box}body{margin:0}header,main,footer{max-width:1440px;margin:auto;padding:36px 28px}header{padding-top:48px;padding-bottom:26px}
.eyebrow{letter-spacing:.15em;color:#b8a0ea;font-size:.76rem;font-weight:750}h1{font-size:clamp(2rem,5vw,4rem);letter-spacing:-.035em;margin:12px 0}
.lead{font-size:1.1rem;line-height:1.6;max-width:850px;color:#ccc3d9}.lead strong{color:white}.links{display:flex;gap:20px;flex-wrap:wrap}.links a,a.file{color:#dac5ff}
.stats{display:flex;gap:12px;flex-wrap:wrap;margin:25px 0 0}.stats span{border:1px solid #423548;border-radius:12px;padding:10px 14px;background:#1e1928;font-size:.9rem}
.status{color:#c1e5c9!important}.tools{position:sticky;top:0;background:#101017ed;backdrop-filter:blur(14px);z-index:5;border-block:1px solid #34303e;padding:16px 0}
.tools>div{max-width:1440px;margin:auto;padding:0 28px;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
nav{display:flex;gap:7px;flex-wrap:wrap}button,input{font:inherit;border-radius:8px;border:1px solid #51455e;background:#201a29;color:#eee4fa;min-height:44px;padding:10px 13px}
button{cursor:pointer}button[aria-pressed=true]{background:#c6a4ff;color:#170f23;border-color:#c6a4ff}input{margin-left:auto;width:240px;max-width:100%}
button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #e9bf78;outline-offset:3px}
#counter{font-size:.86rem;color:#aaa0b6;margin-bottom:18px}#grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}
.card{border:1px solid #393143;border-radius:15px;overflow:hidden;background:#1b1821;box-shadow:0 12px 32px #0003}.card[hidden]{display:none}
.art{display:flex;align-items:center;justify-content:center;background:#f0f0f0;padding:8px;height:350px}
.art img{width:100%;height:100%;object-fit:contain}.caption{padding:20px}.tag{text-transform:uppercase;letter-spacing:.13em;font-size:.7rem;color:#c4a1f1}h2{font-size:1.2rem;margin:8px 0}
.meta{font-size:.8rem;color:#b2a6bf}.note{font-size:.88rem;line-height:1.5;color:#d0c8da;min-height:2.7em}.file{font-size:.8rem;overflow-wrap:anywhere}
footer{color:#a99eb4;font-size:.85rem;border-top:1px solid #302a39;line-height:1.6}
@media(max-width:700px){header,main,footer{padding:24px 16px}.tools>div{padding:0 16px}#grid{grid-template-columns:1fr}.art{height:270px}input{width:100%;margin-left:0}.stats{gap:8px}.stats span{font-size:.8rem}nav{gap:6px}button{padding:8px 11px}}
</style>
<header><div class="eyebrow">ADVENTURER: EXPEDITIONS / ASTRA / 19 SEPTEMBER 2026</div><h1>Painted action, character by character.</h1>
<p class="lead"><strong>Hiro is here.</strong> Purple locs, dark skin, cyberpunk samurai armor and a katana — with his own draw, attacks, wolf contact and sheathing victory. Bram, enemies and the supporting world follow below.</p>
<p class="lead">This gallery shows <strong>source artwork for animation intake</strong>. The drawings are saved; transparent extraction, registration and in-game playback approval remain. Click any sheet for the original file.</p>
<div class="links"><a href="README.md">Delivery &amp; next steps</a><a href="hiro.md">Hiro notes</a><a href="ART_INTAKE_NOTES.md">Fable intake</a><a href="delivery-validation.json">File validation</a></div>
<div class="stats"><span>Hiro · __HIRO__ keys</span><span>Bram · __BRAM__ keys</span><span>Beasts · __BEASTS__ keys &amp; studies</span><span>Human · 25 keys</span><span>48 effects / icon cells</span><span class="status">Source delivery · intake pending</span></div></header>
<section class="tools" aria-label="Art filters"><div><nav aria-label="Categories">__BUTTONS__</nav><input id="search" type="search" placeholder="Find a clip…" aria-label="Search artwork"></div></section>
<main><div id="counter" aria-live="polite"></div><div id="grid">__CARDS__</div></main>
<footer>Preferred source revisions only. Opaque mattes and contact-sheet layouts are intentional intake materials, not completed sprite atlases. No runtime code or original Adventurer website files were changed. Built-in image_gen provenance and clip-specific QA are in the linked delivery notes.</footer>
<script>
let active="All";const cards=[...document.querySelectorAll(".card")],q=document.getElementById("search"),counter=document.getElementById("counter");
function filter(){let n=0;for(const card of cards){const show=(active==="All"||card.dataset.group===active)&&card.dataset.search.includes(q.value.toLowerCase().trim());card.hidden=!show;if(show)n++}counter.textContent=n+" source sheets shown";}
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{active=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));filter()}));q.addEventListener("input",filter);filter();
</script></html>"""
for k,v in {"__HIRO__":hiro["selectedFrameCount"],"__BRAM__":bram["counts"]["totalSourceDrawings"],
            "__BEASTS__":beasts["selectedDrawingCounts"]["totalMotionAndKeys"],
            "__BUTTONS__":buttons,"__CARDS__":"".join(cards)}.items():
    page=page.replace(k,str(v))
(HERE/"index.html").write_text(page,encoding="utf-8")
print(json.dumps({"status":report["status"],"summary":summary,"errors":errors},indent=2))
raise SystemExit(bool(errors))
