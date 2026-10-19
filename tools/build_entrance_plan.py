"""Edition-owned entrance direction and dialogue. Original game is read-only."""
import json
from pathlib import Path
GAME=Path(__file__).resolve().parents[1]
SOURCE=GAME.parent/'adventurer-expeditions-source-art/astra-v12/entrances-20261019'
# actor | screen name | movement | personality action | speaker | spoken line
SCRIPT='''story_nib|Nib|walk|Casually roll the dagger once in his palm, catch it safely, shrug, then lower into a knife-fighter stance.|nib|Stand still, friend. You're worth two hundred either way.
story_cobb|Cobb|heavy|Rest the axe on shoulder, roll his neck, bring the axe down into a two-handed guard without striking anything.||
story_merle|Merle|walk|With a lazy half-smile, conjure a small ember above a finger, let it roll over his knuckles, close his fist and take his casting stance.|morwin|Let's finish before Delphine comes outside.
story_lurleen|Lurleen|stalk|Smile with dangerous confidence, slowly reveal her knife from beside her thigh, turn the blade once and settle into a low assassin guard.|lessa|You kept me waiting, sugar. Hold still a moment.
story_snarl|Snarl, Gnoll Warleader|heavy|Plant his polearm, throw his red-maned head back in a savage barking laugh, grip the shaft with both hands and lean into a fighting guard.||
story_bahadir|Bahadır|heavy|Stamp forward in fury, raise his greatsword in a threatening salute, point it left down the road then lower it into guard.|bramm|You took his coin! Now get past me!
story_kobold_chief|Kobold Chief|scurry|Puff up his small chest under the red cape, bang the base of his decorated staff once on the ground, jab a commanding claw left and ready himself.||
story_grukhar|Grukhar|walk|Wearily straighten, clutch his priestly talisman, build a sickly violet light in his palm and curl the hand into a curse.|grukhar|Unpaid since spring. Now you want my letters too?
story_femi|Femi|retreat|Nervously retreat half a step, pat his coat protectively, lift open hands in protest then reluctantly raise a guarded fist. Preserve his merchant clothes.|verlan|Keep your hands off me! These papers are mine!
story_skarn|Skarn Maul|heavy|Lift the heavy maul onto shoulder, scrape one boot forward, swing the maul down into a low two-handed ready pose with its head touching ground.||
story_gorruk|Gorruk|heavy|Square his massive shoulders, lift the huge axe toward the intruder, bare teeth in a roar then brace in a grounded fighting stance.|gorruk|In my own tent. You've got nerve, foundling.
story_thornwise|Mzee Kamau|walk|Lean on his staff, examine the ground sternly, slowly lift his free hand as fine green tendrils curl around the wrist, then command them toward the intruder.|thornwise|Nine graves since that mine opened. Leave this grove.
story_nettle|Wanjiru|stalk|Lower her centre of gravity, plant a gauntleted hand briefly near the soil, straighten with a feral warning gesture and guard the grove.|nettle|You heard us. Stay out of the grove.
story_kestrel|Kestrel|march|Check the edge of his shield with a gauntlet, plant his spear vertically, point the spear left while keeping the shield tight across the chest.||
story_malvane|Olamide|walk|Dust one sleeve with irritated precision, raise a palm and form a sharp blue frost sigil, then bring the other hand into his casting stance.|malvane|Those ledgers stay here. So do you.
story_sewer_ogre_mage|The Ogre Under the Docks|heavy|Hunch forward into view, sniff the air with a suspicious scowl, lift his blue-crystal staff and bellow while the crystal flickers, then settle under its weight.||
story_lantern_master|The Master of Lanterns|walk|Hold the lantern-staff up beside his face, slowly turn it toward the left to examine the intruder, then draw it back as its warm light becomes an ominous violet.||
story_umbral_pair|The Umbral Hand|shadow|Emerge from a low smoky violet silhouette, reveal the blade from the cape, glance left and sink into a deliberate crouched guard.||
story_tower_captain|Captain of the Tower|march|Step into a parade halt, strike the shield rim once with the spear shaft, level the spear left and brace behind the shield.||
story_maddox|Adigun Adeyinka|retreat|Startle, clutch his gold chain, raise his heavy mace with reluctant shaking resolve, steady the weapon with his other hand.|maddox|Wait! Killing us won't stop my foster-son!
story_vask|Bankole|march|Fuss indignantly at his rich robe, point accusingly left, throw up a defensive forearm and finally ready his weapon.|vask|Guards! Get them away from the records!
story_rennick|Rotimi|walk|Quietly smooth the sleeve of his blue robe, bring two fingers together, trace a compact pale-blue ward in front of his hand and take his casting guard.||
story_family_double|A Face You Know|shadow|Lift a hand in a falsely friendly greeting, let the smile freeze unnaturally, purple shadow ripple over one arm, then curl fingers into a hostile guard.||
story_idris|Idris|walk|Hold one hand out like a reassuring physician, let the false smile fall away, turn the palm up to reveal a dark blood-red magical glow and ready the other hand.|idris|The Duke needs his rest. I can arrange yours.
story_amara|Amara|walk|Pause with quiet resolve, draw her twin sabres apart in a controlled cross, exhale, set one blade high and the other low toward the opponent.|amara|Lower your sword. Don't make me stop you here.
story_ravel|Rasheed|swagger|Give an amused half-bow, show off one controlled cutlass flourish, roll his shoulders, then spread his two blades into an aggressive guard.|ravel|A bounty AND an invitation. What a generous evening.
story_kessa|Kemi|walk|Look briefly bored, raise one palm, let fine violet lightning arc between her fingers, flick it away and set both hands for a spell.|kessa|The invitations are worth more than you. Move, Rasheed.
story_hall_doubles|Ducal Guard|march|Give a stiff courtly bow that stops a little too abruptly, straighten behind the ceremonial polearm, then lower its blade across the doorway to bar entry.||
story_jarem|Jelani|walk|Thrust the staff upright like a torch, gather orange flame above his free palm, sweep it to illuminate his face and lower into a casting stance.|jarem|Cultists! Light the street. Leave the ward to me.
story_lucan|Segun Marr|march|Lift his sword in a clipped military salute, dismissively point it toward the left, bring his shield up and step into a disciplined combat guard.|lucan|I signed your poster. This saves us a search.
story_altar_keepers|Keepers of the Altar|ritual|Incline the masked head toward the unseen altar, lift the ritual staff with both hands, turn left and lower it into a threatening ceremonial guard.||
story_your_own_faces|Your Own Faces|shadow|Copy Hiro's poised hand-to-hilt stance, let a purple shadow flicker across the face, draw the blade a short distance and freeze in an unsettling mirrored guard.||
story_korvath|Kolade Adeyinka|walk|With calm regal confidence, spread his empty hand in a courteous invitation, slowly lift the great blade, turn its point left and settle into an imposing steady guard.|korvath|Come closer, brother. You've kept me waiting long enough.
alpha|Alpha Wolf|run|Run left for two frames, brake with all four paws planted, lift the scarred muzzle toward the sky and howl strongly, lower into a threatening ready crouch. Preserve his unique mane and scars.||
hag|Mire Hag|ritual|Hunch over her crooked staff, sniff the air, unfurl a clawed hand dripping with faint swamp-green magic, grin and settle into her crooked ready stance.||
orc|Ironjaw|heavy|Rest the axe on one shoulder, strike his chest with a fist, let out a fierce war bellow, lower the axe into a grounded two-handed ready stance.||
hydra|Wreck Hydra|surf|Rise from a low crouch as though surf is falling away, fan all three necks apart, roar with the centre head while the other heads scan, then plant firmly. No ground or water backdrop painted.||
enchantress|The Enchantress|portal|Step out with composed hauteur, float her violet staff in front of one palm for a moment, catch it and open her free hand in a commanding arcane gesture.||'''
def main():
 cast=json.loads((GAME.parent/'adventurer/tools/voice_casting.json').read_text(encoding='utf-8'))
 inv=json.loads((GAME/'docs/ENTRANCE_REVIEW_20261019/inventory.json').read_text(encoding='utf-8'))
 rows=[]
 for line in SCRIPT.splitlines():
  actor,name,motion,action,who,text=line.split('|');r=next((x for x in inv['story'] if x['actor']==actor),{})
  rows.append(dict(actor=actor,name=name,motion=motion,action=action,who=who or None,text=text or None,voiceId=cast.get(who),identity=r.get('identity'),appearances=r.get('appearances',[]),newArt=True,frames=8))
 for actor,name,motion,action in [('wolf','Road Wolf','run','Run in and howl'),('story_silksa','Silksa, Spider Queen','web','Lower from a strand of silk, spread legs and threaten'),('story_wyvern_matriarch','Wyvern Matriarch','fly','Fly down with a wingbeat, air-brake, plant feet and roar')]:
  r=next(x for x in inv['story'] if x['actor']==actor);rows.append(dict(actor=actor,name=name,motion=motion,action=action,who=None,text=None,voiceId=None,identity=r['identity'],appearances=r['appearances'],newArt=True,frames=12))
 rows.append(dict(actor='story_grell',name='Gbenga',motion='walk',action='Remove hood, settle into the hood-off crossbow stance',who='grell',text="Hold still. Your brother wants this done before breakfast.",voiceId=cast['grell'],identity='named:grell',newArt=False,frames=12,appearances=[{'chapter':10,'encounter':2}]))
 # Ordinary creatures and Citadel sentries use their own approved combat
 # silhouettes, with individually directed entry paths and introductions.
 extras={
  'plant':('Road Blossom','burrow','unfurl'), 'serpent':('Reed Serpent','slither','rear'),
  'beetle':('Iron Beetle','scurry','carapace'), 'moss_giant':('Moss Giant','heavy','treefall'),
  'goblin':('Gutter Goblin','scurry','knife'), 'spider':('Glass Spider','web','threat'),
  'crab':('Tidal Crab','scuttle','claws'), 'toad':('Brine Toad','hop','croak'),
  'vulture':('Carrion Vulture','fly','wings'), 'elven_wizard':('Citadel Wizard','portal','ward'),
  'elven_ranger':('Citadel Ranger','stalk','bow'), 'dark_swordswoman':('Duskblade','stalk','blades'),
  'story_web_spider':('Giant Spider','web','threat'), 'story_phase_spider':('Phase Spider','web','phase'),
  'story_wyvern':('Wyvern','fly','wings')}
 for actor,(name,motion,action) in extras.items():
  r=next((x for x in inv['story'] if x['actor']==actor),{})
  rows.append(dict(actor=actor,name=name,motion=motion,action=action,who=None,text=None,voiceId=None,identity=r.get('identity'),appearances=r.get('appearances',[]),newArt=False))
 monsters=['alpha','story_snarl','story_kobold_chief','story_silksa','story_wyvern_matriarch','story_sewer_ogre_mage','hag','orc','hydra','story_skarn']
 for r in rows:r['monsterReaction']=r['actor'] in monsters
 assert len({r['actor'] for r in rows})==len(rows)
 SOURCE.mkdir(parents=True,exist_ok=True)
 (SOURCE/'plan.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False),encoding='utf-8')
 (GAME/'docs/ENTRANCE_REVIEW_20261019/plan.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False),encoding='utf-8')
 print(len(rows),'entrances;',sum(r['newArt'] for r in rows),'new sheets;',sum(bool(r['voiceId']) for r in rows),'documented speakers')
if __name__=='__main__':main()
