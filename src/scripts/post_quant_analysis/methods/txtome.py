"""
A module to deal more easily with dataframes containing transcriptome data.

Author: David Angeles-Albores
Date: October 22, 2018
"""
import pandas as pd
import numpy as np
import warnings
import matplotlib.pyplot as plt
from scipy.stats import gaussian_kde


class fc_transcriptome:
    """
    An fc_transcriptome object with which to perform genetic analyses.

    This class is optimized to work with the dataframes output by Sleuth, the
    RNA-seq software from the Pachter lab.

    Attributes:
    -----------
    df:                             DataFrame
                                    Tidy dataframe containing RNA-seq data.
    tx_col, strain, b, se_b, qval:  names of the columns containing the unique
                                    transcript identifiers, strain identifiers,
                                    log-fold change estimates, standard error
                                    of the log-fold-change, and q-values
                                    respectively.
    q:                              float
                                    Significance threshold. Defaults to 0.1

    Functions:
    ----------
    overlap: Given a list of strain names (strings), find the transcripts that
             are differentially expresed in all strains.
    make_matrix:
    plot_STP:
    select_sample:
    select_from_overlap:
    subset_sig:
    """

    def __init__(self, df, tx_col='target_id',
                 strain='strain', b='b', se_b='se_b', qval='qval'):
        """
        Initialize the object with a pandas dataframe.

        Params:
        -------
        df:     pandas.DataFrame
                RNA-seq data in tidy format.
        tx_col: string
                Name of the column that contains the unique transcript or gene
                name information.
        strain: string
                Name of the column that contains the strain IDs of the
                genotypes that were studied.
        b:      string
                Name of the column that contains the fold-change or log-fold
                change estimates for each transcript/gene for each strain
                studied relative to the control sample.
        se_b:   string
                Name of the column that contains the standard error estimates
                of the 'b' column.
        qval:   string
                Name of the column that contains the FDR adjusted q-values
                associated with each transcript/gene.
        """
        self.df = df
        self.tx_col = tx_col
        self.strain = strain
        self.b = b
        self.se_b = se_b
        self.qval = qval
        self.q = 0.1  # default value

        # check for uniqueness in the isoform column:
        for strain in self.df[self.strain].unique():
            for name, group in df.groupby(self.strain):
                unique = len(group[tx_col].unique())
                if unique != len(group):
                    raise ValueError('tx_col does not contain unique' +
                                     'identifiers')
        # dropnan in the 'b' column:
        prev = self.df.shape[0]
        self.df.dropna(subset=[self.b], inplace=True)
        curr = self.df.shape[0]
        print('Dropped {0} rows with NaNs in the {1} column'.format(prev-curr,
                                                                    self.b))

    def overlap(self, strains=[]):
        """
        Find overlapping DE transcripts in a dataframe amongst some strains.

        Params:
        -------
        strains:    list of strings
                    Strains to overlap (strings)

        Output:
        -------
        np.array of transcripts that were commonly differentially expressed in
        all genotypes provided
        """
        check_strains = (strain_i not in self.df[self.strain].unique()
                         for strain_i in strains)
        if any(check_strains is True):
            raise ValueError('Some strains are not in the DataFrame')

        # limit search to desired strains:
        cond_strains = (self.df[self.strain].isin(strains))
        # set the q-value cutoff and remove anything above it:
        cond_thresh = (self.df[self.qval] < self.q)
        # count the number of times each isoform occurs:
        conds = cond_strains & cond_thresh
        sig = self.df[conds].groupby(self.tx_col)[self.strain].agg('count')
        # find the isoforms that are in both genotypes
        sig = sig[sig.values == len(strains)]

        return sig.index.values

    def make_matrix(self, col=None, exclude=[], include=[],
                    subset_tx=True, norm=True):
        """
        Generate a matrix of `self.b` and a dictionary of columns.

        Generate a numpy matrix that has the strain values as columns, the
        tx_col values as rows and the b values as entries.

        Params:
        -------
        col:        string
                    The column to pivot on. If not specified, the strain column
                    will be used to pivot.
        exclude:    list-like
                    List of strains to be excluded from the matrix. Defaults to
                    empty if not specified.
        include:    list-like
                    List of strains to be included in the matrix. If not
                    specified, all strains not specifically excluded are
                    included
        subset_tx:  Boolean
                    If True, includes only transcripts that are differentially
                    expressed in at least one of the included strains. If
                    False, all transcripts are included.
        norm:       Boolean
                    If True, normalizes the rows of the matrix by their mean
                    and standard deviation.

        Output:
        -------
        mat:    np.ndarray
                Matrix of extracted values
        """
        if len(self.df[self.strain].unique()) < 2:
            m = 'The provided dataframe does not contain multiple strains'
            raise ValueError(m)

        if col is None:
            col = self.strain

        temp = self.df
        # exclude desired strains:
        temp = temp[(~temp[self.strain].isin(exclude))]

        # include desired strains only if 2 or more strains were specified
        if len(include) >= 2:
            temp = temp[(temp[self.strain].isin(include))]
        else:
            raise ValueError('Please specify at least 2 strains to include')

        # restrict transcripts to those that are diff. exp. in at least one
        # strain
        if subset_tx:
            # filter the dataframe to show only transcripts with non-sig
            # q-values, then group the remaining rows by transcript ID
            grouped = temp[temp[self.qval] > self.q].groupby(self.tx_col)
            # count the number of strains any given transcript shows up in
            ns = grouped[self.tx_col].agg('count')
            # keep only those transcripts that change in at least one strain
            ns = ns[ns != len(temp[self.strain].unique())].index.values
            # go back to the original dataframe and subset using these IDs
            temp = temp[temp[self.tx_col].isin(ns)]

        if (np.isnan(temp.b)).any() or (np.isinf(temp.b)).any():
            warnings.warn('Matrix contains NaN or Inf values.')

        # turn df into a matrix
        mat = temp.pivot(index=self.tx_col, columns=col,
                         values=self.b)

        # briefly transpose for easy normalization:
        mat = mat.T
        if norm:
            mat = (mat - mat.mean(axis=0))/mat.std(axis=0)

        mat = mat.T

        return mat

    def plot_STP(self, strain_x, strain_y, density=False, s0=5, s_var=True,
                 rank=False, subset_tx=np.array([]), subset_cond=None,
                 label=True, ax=None, n_min=100, **kwargs):
        """
        Plot the STP between two strains.

        Params:
        ------
        strain_x, strain_y: Strains to plot
        density:
        s0:
        s_var:
        rank:
        subset_tx:
        label:
        ax:
        **kwargs

        Output:
        -------
        ax:
        """
        if ax is None:
            fig, ax = plt.subplots()

        # find the STP, then subset further if required:
        subset = self.overlap([strain_x, strain_y])

        # only subset with the desired subset_tx list if the list contains
        # enough targets:
        if len(subset_tx) > n_min:
            subset = np.intersect1d(subset, subset_tx)

        if len(subset) == 0:
            raise ValueError('subset is empty after slicing is finished.')

        # extract the subset
        if subset_cond is None:
            temp = self.df[self.df[self.tx_col].isin(subset)]
        else:
            temp = self.df[(self.df[self.tx_col].isin(subset)) & (subset_cond)]

        if len(temp) == 0:
            raise ValueError('subset is empty after slicing is finished.')

        # for convenience, split the dataframe into two, x and y
        x = temp[temp[self.strain] == strain_x]
        y = temp[temp[self.strain] == strain_y]

        # set the point size:
        s = s0
        # rank the points
        if rank:
            X = x.b.rank().values
            Y = y.b.rank().values
        else:
            X = x.b.values
            Y = y.b.values
            # if we want point size to be proportional to the error of the
            # mean, calculate the size:
            if s_var:
                se_both = np.sqrt(x.se_b.values**2 + y.se_b.values**2)
                s = s0/se_both

        # if points will be colored by density, calculate the density:
        if density:
            points = np.vstack([X, Y])
            z = gaussian_kde(points)(points)
            ax.scatter(X, Y, s=s, c=z, edgecolor='', **kwargs)
        else:
            ax.scatter(X, Y, s=s, **kwargs)

        # if labels are desired, label:
        if label:
            plt.xlabel(strain_x)
            plt.ylabel(strain_y)

        return ax

    def select_sample(self, selection, col='strain', sig=False):
        """
        Slice the dataframe associated with this object using a selection.

        This function takes a selection, usually a genotype or a strain, and
        returns a sliced dataframe containing only the rows that have the
        selection value at the column `col`. If only differentially expressed
        (DE) genes are desired, then the dataframe is further sliced at the
        preset q-value.

        Params:
        -------
        selection:  string
                    slice selection.
        col:        string
                    column to perform slicing on.
        sig:        Boolean
                    limit selection to differentially expressed genes at the
                    predetermined significance value for this object.

        Output:
        -------
        a sliced pandas.DataFrame
        """
        cond = (self.df[col] == selection)

        if sig:
            cond = cond & (self.df[self.qval] <= self.q)

        return self.df[cond]

    def select_from_overlap(self, array):
        """
        Find DE transcripts in all strains in `array` and slice the dataframe.

        Params:
        -------
        array:  list-like
                A list of strains to overlap

        Output:
        -------
        a sliced pandas.DataFrame
        """
        overlap = self.overlap(array)
        return self.df[self.df[self.tx_col].isin(overlap)]

    def subset_sig(self):
        """A wrapper function to return all DE transcripts."""
        return self.df[self.df[self.qval] <= self.q]
