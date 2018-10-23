# Genetic analysis of RNA-seq data

This folder contains our scripts for RNA-seq analysis post-Sleuth. They are all
implemented in Python and require:

* pandas >= 0.23.4
* numpy >= 1.15.1
* scikit-learn >= 0.19.2
* scipy >= 1.1.0
* seaborn >= 0.9.0

There are two classes of scripts:

1. Single factor analysis
1. Two factor interaction analysis

## Single factor analysis
These analyses will:
1. Project samples into a PCA plot.
2. Generate a 'Variance Explained' plot for the components.
3. Generate a 'Beta Distribution' histogram
4. Generate pairwise correlation plots with Orthogonal Regressions if the number of genotypes/strains <= 4
5. Output a summary of the number of diff. exp. genes in all strains.

## Two factor interaction analyses
Are not yet implemented.
