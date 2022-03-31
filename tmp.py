import os

dir = os.getcwd() + "/" + "download"

files = os.listdir(dir)

pair = [];

for f in files:
    ff = os.path.splitext(f)
    if ff[1] != '.txt':
        with open(dir + "/" + ff[0] + '.txt', 'r') as rFile:
            data = rFile.read().split('\n')
        with open(dir + "/" + ff[0] + '.txt', 'w') as wFile:
            wFile.write(data[0] + "\n")
            wFile.write(ff[1] + "\n")
            wFile.write(data[1] + "\n")
print(pair)
