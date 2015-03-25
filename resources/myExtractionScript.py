#!C:\Python34\python.exe

from __future__ import print_function
import os, subprocess, distutils.dir_util, shutil

thisdir = os.path.dirname(__file__)
steamdir = "G:\\Games\\Steam\\"
dotadir = steamdir + "SteamApps\\common\\dota 2 beta\\dota\\"

print("Removing old files...")
try:
	if os.path.exists('images'): shutil.rmtree('images')
	if os.path.exists('webm'): shutil.rmtree('webm')
	if os.path.exists('npc'): shutil.rmtree('npc')
except(Exception, e):
	print("Aghr")

print("Extracting VPK file data...")
# https://github.com/yaakov-h/VPKExtract
subprocess.call(["VPKExtract.exe", dotadir + "\\pak01_dir.vpk", 
	"scripts/npc",
	"resource/flash3/images/heroes",
	"resource/flash3/images/spellicons",
	"resource/flash3/images/items",
	"resource/flash3/images/miniheroes",
	"resource/flash3/videos/portraits",
])

shutil.move("scripts/npc", "npc")
shutil.move("resource/flash3/images", "images")
shutil.move("resource/flash3/videos/portraits", "webm")
if os.path.exists('resource'): shutil.rmtree('resource')
if os.path.exists('scripts'): shutil.rmtree('scripts')

print("Copying locale files...")
distutils.dir_util.copy_tree(dotadir + "\\resource", "locales")
try:
	if os.path.exists('locales/cursor'): shutil.rmtree('locales/cursor')
	if os.path.exists('locales/flash3'): shutil.rmtree('locales/flash3')
except(Exception, e):
	print("AGHR2")

# webm conversion
for file in os.listdir(thisdir + "\\webm"):
    if file.endswith(".webm"):
        subprocess.call(["sftowebm.exe", "webm\\" + file])
        os.remove("webm\\" + file)
    else:
    	os.remove("webm\\" + file)

for file in os.listdir(thisdir + "\\webm"):
	if file.endswith(".webm"):
	    os.rename("webm\\" + file, "webm\\" + file.replace('.webm.webm', '.webm'))

print("Done!")