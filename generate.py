from __future__ import print_function
from distutils import log
log.set_verbosity(log.INFO)
log.set_threshold(log.INFO)
import os, subprocess, argparse, distutils.dir_util, shutil, urllib.request, json, stat, win32api, win32con

def generate():
	parser = argparse.ArgumentParser(description='Generate user-friendly DOTA 2 data files')
	parser.add_argument('steamdir', 
							metavar='SteamDir', 
							type=is_existing_dir, 
							nargs=1,
							help='Your Steam installation directory (probably C:/Program Files/Steam)'
						)
	parser.add_argument('-o',
							metavar='OutputDir',
							type=is_existing_dir, 
							nargs=1,
							default=os.getcwd(),
							help='Existing path you wish to output to (defaults to the location of this script)'
						)

	args = parser.parse_args()

	dotadir = args.steamdir[0] + '\\SteamApps\\common\\dota 2 beta\\dota\\'
	outputdirname = "Output"
	outputdir = args.o + '\\' + outputdirname

	if (not os.path.isdir(dotadir)):
		print("Couldn't verify dota installation at path: '"+dotadir+"'")
		return

	if (os.path.exists(outputdir)):
		print("Removing old "+outputdirname+" folder...")
		subprocess.call(["rm", "-r", outputdir])

	print("Creating Output folder...")
	os.mkdir(outputdir)

	print("Extracting VPK file data...")
	# https://github.com/yaakov-h/VPKExtract
	subprocess.call(["VPKExtract.exe", dotadir + "\\pak01_dir.vpk", 
		"scripts/npc",
		"resource/flash3/images/heroes/selection",
		"resource/flash3/images/spellicons",
		"resource/flash3/images/items",
		"resource/flash3/images/miniheroes",
		"resource/flash3/videos/portraits",
	])

	print("Copying locale files...")
	os.mkdir("locales")
	for file in os.listdir(dotadir + "resource"):
		fullfile = dotadir + "resource\\" + file
		print("Copying "+fullfile)
		if (not os.path.isdir(fullfile)):
			shutil.copy(fullfile, "locales")
	# distutils.dir_util.copy_tree(dotadir + "resource", "locales", verbose=True)
	# if os.path.exists('locales/cursor'): shutil.rmtree('locales/cursor')
	# if os.path.exists('locales/flash3'): shutil.rmtree('locales/flash3')

	#shutil.move("scripts/npc", "npc")

	print("Converting VDF data files to JSON...")
	subprocess.call(["node", "VDF2JSON.js", "-o", outputdir])

	shutil.move("resource/flash3/images", outputdir)
	shutil.move("resource/flash3/videos/portraits", outputdir)
	if os.path.exists('resource'): shutil.rmtree('resource')
	if os.path.exists('scripts'): shutil.rmtree('scripts')
	if os.path.exists('locales'): shutil.rmtree('locales')

	smallHeroImageDir = outputdir + "\\images\\heroes\\selection\\"
	for file in os.listdir(smallHeroImageDir):
		if ("npc_dota_hero_" in file):
			os.rename(smallHeroImageDir + file, smallHeroImageDir + file.replace("npc_dota_hero_", ""))
		else:
			os.remove(smallHeroImageDir + file)

	# webm conversion
	print("Converting Valve .webms to valid .webm types...")
	portraitsdir = outputdir + "\\portraits\\"
	for file in os.listdir(portraitsdir):
		if file.endswith(".webm"):
			print("converting "+file)
			subprocess.call(["sftowebm.exe", portraitsdir + file])
			os.remove(portraitsdir + file)
		else:
			os.remove(portraitsdir + file)

	for file in os.listdir(portraitsdir):
		if file.endswith(".webm"):
			os.rename(portraitsdir + file, portraitsdir + file.replace('.webm.webm', '.webm').replace('npc_dota_hero_', ''))

	os.rename(portraitsdir, outputdir + "\\webms")

	# download hero images
	base = "http://cdn.dota2.com/apps/dota2/images/heroes/"
	end = "_full.png"

	with open(outputdir + '/heroes.json') as data_file:
		heroes = json.load(data_file)

	hdrs = {'User-Agent': 'Python Script'}
	heroimagepath = outputdir + '/images/heroes/full'
	if (not os.path.isdir(heroimagepath)):
		os.mkdir(heroimagepath)

	for hero in heroes:
		herourl = hero["Url"]
		print("Downloading " + herourl + ".png")
		link = base + herourl + end
		imgsrc = urllib.request.Request(link, headers=hdrs)
		img = urllib.request.urlopen(imgsrc).read()
		with open(heroimagepath + "/" + herourl+".png", 'b+w') as f:
			f.write(img)


	print("Done! All DOTA 2 data was extracted successfully - See the " + outputdir + " directory.")

def is_existing_dir(dirname):
	if (dirname[-1] == "\"" or dirname[-1] == "/" or dirname[-1] == "\\"): dirname = dirname[:-1]
	"""Checks if a path is an actual directory"""
	if not os.path.isdir(dirname):
		msg = "\"{0}\" is not a directory. Please specifiy one (see -h)".format(dirname)
		raise argparse.ArgumentTypeError(msg)
	else:
		return dirname

def onerror(func, path, exc_info):
	if not os.access(path, os.W_OK):
		# Is the error an access error ?
		print("ACCESS ERROR")
		os.chmod(path, stat.S_IWUSR)
		func(path)
	else:
		print("WTF ERROR")
		func(path)
		raise

if __name__ == "__main__":
	generate()