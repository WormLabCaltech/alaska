with open('c_elegans_235.bed') as f:
    for line in f:
        replaced = line.replace('chr', '', 1)
        if replaced.startswith('M'):
            replaced = replaced.replace('M', 'MtDNA', 1)
        print(replaced, end='')