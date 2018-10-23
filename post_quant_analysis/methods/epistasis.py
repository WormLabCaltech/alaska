"""A script that contains useful functions to do RNA-seq epistasis analysis."""
# important stuff:
import pandas as pd
import numpy as np

# Graphics
import scipy.odr as odr
import warnings


def find_overlap(df, genotypes=[], q=0.1, col='strain', tx_col='target_id'):
    """
    Given a list of genotypes, df and a q-value, find DEG common to all.

    Params:
    genotypes: list-like, names of the strains or genotypes to search within
    df: pandas DataFrame, dataframe to extract data from
    q: float, q-value cutoff
    col: string, must be a column name in the dataframe. This column must
         contain the entries in the `genotypes` variable
    tx_col: string, a column name in the dataframe. This column must contain
            the unique isoform names that will be returned.

    Output:
    np.array of transcripts that were commonly differentially expressed in all
    genotypes provided
    """
    # check for uniqueness in the isoform column:
    for genotype in genotypes:
        for name, group in df.groupby(col):
            unique = len(group[tx_col].unique())
            if unique != len(group):
                raise ValueError('tx_col does not contain unique identifiers')

    # limit search to desired strains:
    genos = (df[col].isin(genotypes))
    # set the q-value cutoff and remove anything above it:
    qcutoff = (df.qval < q)
    # count the number of times each isoform occurs:
    sig = df[genos & qcutoff].groupby(tx_col)[col].agg('count')
    # find the isoforms that are in both genotypes
    sig = sig[sig.values == len(genotypes)]
    return sig.index.values


def f(B, x):
    """A linear function for the ODR."""
    return B*(x)


def perform_odr(add, dev, wadd, wdev, beta0=[0]):
    """
    A wrapper to calculate an ODR regression.

    params:
    -------
    add, dev - x and y axis of the regression
    wadd, wdev - standard deviations

    returns:
    an ODR object
    """
    linear = odr.Model(f)
    mydata = odr.RealData(add, dev, sx=wadd, sy=wdev)
    myodr = odr.ODR(mydata, linear, beta0=beta0)
    myoutput = myodr.run()

    if myoutput.stopreason[0] == 'Numerical error detected':
        print('Warning: Numerical error detected, ODR failed.')

    return myoutput
