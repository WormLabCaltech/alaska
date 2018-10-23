#!usr/bin/env/python
"""
This script automatically generates a report of the basic statistics for an
RNA-seq analysis. It is written for Python 3.7.0.

author: David Angeles-Albores
contact: davidaalbores@gmail.com

This script operates on single factor contrast experiments. It should NOT be
run if you performed a two-factor analysis.

Files/Folders required:
    genmap: Experimental design matrix fed into sleuth. Reference samples
            should be prefixed by `a_` in their strain name. Experimental
            samples should be prefized by `b_`
    fancy:  File containing the strain-to-fancy genotype mappings.
    sleuth: All the sleuth beta files are expected, and they should be within a
            single folder, sleuth_one_factor
    save:   Folder where all figures and preliminary tables will be stored.
"""
import pandas as pd
import numpy as np

from sklearn.decomposition import PCA

import argparse
import matplotlib as mpl
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib import rc

import sys
import os
sys.path.append('../methods')

# import own libraries
import pretty_table as pretty
import txtome as tx
import epistasis as epi

# plotting settings
rc('text', usetex=True)
rc('text.latex', preamble=r'\usepackage{cmbright}')
rc('font', **{'family': 'sans-serif', 'sans-serif': ['Helvetica']})

# JB's favorite Seaborn settings for notebooks
rc = {'lines.linewidth': 2,
      'axes.labelsize': 18,
      'axes.titlesize': 18,
      'axes.facecolor': 'DFDFE5'}
sns.set_context('notebook', rc=rc)
sns.set_style("dark")

# more parameters
mpl.rcParams['xtick.labelsize'] = 16
mpl.rcParams['ytick.labelsize'] = 16
mpl.rcParams['legend.fontsize'] = 14


# specify script variables:
parser = argparse.ArgumentParser(description='Welcome to the Basic Stats' +
                                 'Script.')
parser.add_argument("-q", "--qval", help="Q-value threshold" +
                    "Default to 0.1",
                    type=float, default=0.1)
parser.add_argument('-rna', '--rna_matrix', help='Specify the path to the ' +
                    'sample metadata matrix', type=str,
                    default='../../r/rna_seq_info.txt')
parser.add_argument('-sl', '--sleuth', help='Path to sleuth dataframes.',
                    type=str, default='../../sleuth_one_factor/')
parser.add_argument('-f', '--fancy', help='Fancy genotype to strain map',
                    type=str, default='fancy.tsv')
parser.add_argument("-S", "--save", help='Directory in which to save graphs.',
                    type=str, default='../../output/read_distribution/')
args = parser.parse_args()


def open_all():
    """
    A wrapper to open all files and concatenate them into a dataframe.

    The only point of this function is to avoid keeping all the files open for
    RAM purposes, though this is not strictly necessary.
    """
    frames = []
    for root, dirs, files in os.walk(args.sleuth):
        for file in files:
            # don't open likelihood ratio test if there is one
            if file == 'lrt.csv':
                continue

            # extract the strain identifier from the filename
            strain = file[:-4].replace('_', '-')

            # open the dataframe, and add strain, genotype and order columns
            df = pd.read_csv(root + '/' + file, sep=',')
            df.sort_values('target_id', inplace=True)

            df['strain'] = strain.replace('b-', '')
            # add the dataframe to the list
            frames += [df]

    # concatenate, dropNAs
    tidy = pd.concat(frames)
    tidy.dropna(subset=['ens_gene', 'b', 'qval'], inplace=True)
    tidy.sort_values(['strain', 'target_id'], ascending=True, inplace=True)
    return tidy


def strain_to_map(names, col='Alleles'):
    """
    A function to generate a dictionary of strain values to another column
    in the `names` dataframe.

    Params:
    -------
    names: pandas DataFrame. Must contain a `Strain` column
    col: string. Column name to associate values with.

    Output:
    strain_to: dictionary of Strain values to `col` values.
    """
    strain_to = {names.Strain.values[i]: names[col].values[i].str.replace('_',
                                                                          '\_')
                 for i in np.arange(len(names))}
    return strain_to


def odr(txtome, strain_x, strain_y):
    """
    Calculate a regression line of the STP between strain_x and strain_y.

    Params:
    -------
    txtome:    txtome object
    strain_x, strain_y: str
                        strains for which to find STP and perform regression.

    Output:
    -------
    res:    ODR object
            Contains list with the parameters of the regression (res.beta[0] is
            the slope)
    """
    # find the STP between strain x and y:
    tmp = txtome.select_from_overlap([strain_x, strain_y])

    # extract the target_ids by strain:
    x = tmp[tmp.strain == strain_x]
    y = tmp[tmp.strain == strain_y]

    # perform an odr regression:
    res = epi.perform_odr(x.b.values, y.b.values,
                          x.se_b.values, y.se_b.values,
                          beta0=[0.5])
    return res


def perform_plot(strain1, strain2, txtome):
    """
    Plot the STP between two strains.

    Params:
    -------
    strain1, strain2:   str
                        Strains to plot
    txtome:             txtome
                        A transcriptome object that contains the data to plot.

    Output:
    -------
    fig, ax:    figure and axis containing the plot
    """
    fig, ax = plt.subplots()
    txtome.plot_STP(strain1, strain2, label=False,
                    density=True, cmap='viridis')

    x = np.linspace(-5, 5, 10)
    # perform regression:
    res = odr(quant, strain1, strain2)

    # plot the regression and annotate to the corner
    plt.plot(x, res.beta[0]*x, color='blue', ls='--', lw=3)
    m = 'slope = {0:.2g} $\pm$ {1:.1g}'.format(res.beta[0],
                                               res.sd_beta[0])
    plt.text(-6, 6, m, fontsize=18)

    # get fancy names and label:
    cond = quant.df.strain.str.contains(strain1)
    xlab = quant.df[cond].fancy.unique()[0]

    cond = quant.df.strain.str.contains(strain2)
    ylab = quant.df[cond].fancy.unique()[0]

    # label:
    plt.xlabel(r'$\beta_{' + xlab + '}$')
    plt.ylabel(r'$\beta_{' + ylab + '}$')

    return fig, ax


###############################################################################
###############################################################################
###############################################################################
# computation begins here:
# get q-value:
q = args.qval

# get files:
# experimental design matrix fed into sleuth
genmap = pd.read_csv(args.rna_matrix, sep='\t', comment='#')
# strain to genotype information:
names = pd.read_csv(args.fancy, comment='#', sep='\t')
# open all beta.csv files, and concatenate them into a single dataframe
tidy = open_all()

# generate a dictionary relating strain to the alleles in that strain:
strain_to_fancy = strain_to_map(names, 'FancyName')
# map fancy genotypes:
tidy['fancy'] = tidy.strain.map(strain_to_fancy)

# fail if fancy mappings are not unique:
if tidy.fancy.nunique() != tidy.strain.nunique():
    raise ValueError('Fancy names and strains are not one-to-one.')

# turn into a quant object for plotting:
quant = tx.fc_transcriptome(df=tidy)

# generate a matrix suitable for PCA cluster
# rows are transcripts, columns are fancified genotypes
mat = quant.make_matrix(col='fancy').fillna(0)

# initialize the object with as many principal components as samples:
pca = PCA(mat.T.shape[0])

# fit the data and transform it to the pca coordinates
x = pca.fit_transform(mat.values.T)


###############################################################################
###############################################################################
# reports begin here:
###############################################################################
###############################################################################

# genes found:
total_genes_id = tidy.target_id.unique().shape[0]
m = "Total isoforms identified in all genotypes: {0}"
print(m.format(total_genes_id))

m = "Total genes identified in all genotypes: {0}"
print(m.format(len(tidy.ens_gene.unique())))
###############################################################################
###############################################################################

###############################################################################
###############################################################################
# DE genes report:
sel = tidy.qval < q
report = tidy[sel].groupby(['fancy', 'strain']).ens_gene.agg('count')
report.to_tsv(args.save + 'diff_exp_gene_summary.csv', index=False)
###############################################################################
###############################################################################


###############################################################################
# Plotting begins here:
###############################################################################
# visualize distribution to make sure it's not terribly crazy
fig, ax = plt.subplots()

sns.distplot(np.squeeze(np.asarray(mat.values.flatten())))
_ = plt.xlabel(r'$\beta$')
_ = plt.ylabel('Density')

plt.savefig(args.save + 'beta_distribution.svg', bbox_inches='tight')
###############################################################################

###############################################################################
# PCA plot
# plot the data, labelling each point:
fig, ax = plt.subplots()

for i, fancy in enumerate(mat.columns):
    # make sure the labels come out in italics:
    fancy = r'\emph{' + fancy + '}'
    # plot the points
    ax.scatter(x[i, 0], x[i, 1], marker=m, label=fancy, s=20)
    ax.text(x[i, 0] + 1, x[i, 1] + 1, fancy, fontsize=15)

# add plot labels
_ = plt.xlabel('PC1, {0:.2g}\%'.format(pca.explained_variance_ratio_[0]*100))
_ = plt.ylabel('PC2, {0:.2g}\%'.format(pca.explained_variance_ratio_[1]*100))

plt.savefig(args.save + 'pca.svg', bbox_inches='tight')
###############################################################################

###############################################################################
# explained variance plot
fig, ax = plt.subplots()

plt.plot(np.arange(1, mat.T.shape[0]), 100*pca.explained_variance_ratio_, 'o')
_ = plt.ylabel('\% Explained Variance')
_ = plt.xlabel('Component')

plt.savefig(args.save + 'explained_variance.svg', bbox_inches='tight')
###############################################################################

###############################################################################
# plot correlations. Only if <= 4 genotypes to compare.
if tidy.fancy.nunique() <= 4:
    for i, strain1 in enumerate(tidy.strain.unique()):
        # don't try to plot the last strain, or you'll break the next loop
        if i + 1 == tidy.fancy.nunique():
            continue
        # second loop:
        for strain2 in tidy.strain.unique()[i+1:]:
            fig, ax = perform_plot(strain1, strain2, quant)

            # calculate STP:
            ov = quant.overlap([strain1, strain2])
            de1 = quant.df[(quant.df.strain == strain1) &
                           (quant.df.qval < q)].target_id.nunique()
            de2 = quant.df[(quant.df.strain == strain1) &
                           (quant.df.qval < q)].target_id.nunique()

            # ind strain with greatest perturbation:
            max_ = np.argmax([de1, de2])
            max_de = np.array([de1, de2])[max_]

            # find fraction:
            stp = 100*len(ov)/max_de

            f1 = tidy[tidy.strain == strain1].fancy.unique()[0]
            f2 = tidy[tidy.strain == strain2].fancy.unique()[1]

            # title formatting:
            if max_ == 0:
                internal = f1
            else:
                internal = f2

            # add figure title:
            fig.suptitle('STP between {0} and {1}'.format(f1, f2))
            title = 'Internalization is {0}\%, {1} is internal'
            ax.set_title(title.format(max_de))

            fig_save = strain1 + '_' + strain2 + '.svg'
            plt.savefig(args.save + fig_save, bbox_inches='tight')
###############################################################################
