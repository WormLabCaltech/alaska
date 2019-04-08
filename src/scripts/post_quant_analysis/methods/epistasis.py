"""
A script that contains useful functions to do RNA-seq epistasis analysis.

author: David Angeles-Albores
contact: davidaalbores@gmail.com
"""
import pandas as pd
import numpy as np
import copy

import scipy.odr as odr

# Graphics
import matplotlib as mpl
import matplotlib.pyplot as plt
import seaborn as sns

# labeller:
from scipy.stats import gaussian_kde
from matplotlib import rc

rc('text', usetex=True)
rc('text.latex', preamble=r'\usepackage{cmbright}')
rc('font', **{'family': 'sans-serif', 'sans-serif': ['Helvetica']})

# JB's favorite Seaborn settings for notebooks
rc = {'lines.linewidth': 2,
      'axes.labelsize': 18,
      'axes.titlesize': 18,
      'axes.facecolor': 'DFDFE5'}
sns.set_context('paper', rc=rc)
sns.set_style("dark")

mpl.rcParams['xtick.labelsize'] = 16
mpl.rcParams['ytick.labelsize'] = 16
mpl.rcParams['legend.fontsize'] = 16


def perform_odr(add, dev, wadd, wdev, beta0=[0.]):
    """
    A wrapper around scipy.ODR.

    Params:
    -------
    add, dev:   np.array
                x and y coordinates of the regression
    wadd, wdev: np.array
                standard deviations
    beta0:      float
                initialization for ODR

    Output:
    -------
    an ODR object
    """

    def f(B, x):
        """A linear function for the ODR."""
        return B*(x)

    linear = odr.Model(f)
    mydata = odr.RealData(add, dev, sx=wadd, sy=wdev)
    myodr = odr.ODR(mydata, linear, beta0=beta0)
    myoutput = myodr.run()

    if myoutput.stopreason[0] == 'Numerical error detected':
        print('Warning: Numerical error detected, ODR failed.')

    return myoutput


def draw_bs_sample(n):
    """Draw a bootstrap sample from a 1D data set."""
    ind = np.arange(0, n)
    return np.random.choice(ind, size=n)


class epistasis:
    """
    A class to perform epistasis analysis with.

    Public Variables:
    -----------------
        txome:                  txtome object
                                Contains all the data to use.
        xname, yname, xyname:   string
                                Names of the single and double mutants.
        q:                      float
                                Significance threshold.
        col, tx_col:            string
                                DataFrame column names containing the strain
                                and transcript log(FC) information. Defaults
                                are `strain` and `target_id`, respectively.
        nsim:                   int
                                Number of bootstraps to perform. Defaults to
                                1000
        xb, yb, xyb:            np.arrays
                                Arrays with the log(FC) values of the mutants.
        xseb, yseb, xyseb:      np.arrays
                                Arrays with the standard error of the log(FC)
                                values of the mutants
        H0, D:                  np.arrays
                                Expected double mutant value under null
                                hypothesis and deviation from the expectation
                                for each transcript in the triple overlap.
        se_H0, se_D:            np.arrays
                                Standard error of the mean for the H0
                                and standard error of the mean for D
        tx_wide_epi:            Transcriptome-wide epistasis for the mutants.
        epicoef:                Dictionary containing the bootstraps for
                                various models.

    Functions:
    ----------
        ODR:                        Orthogonal Distance Regression.
        bootstrap:                  Runs the epistasis simulations
        epiplot:                    Make an epistasis plot
        plot_bootstraps:            Plot the boostrap histograms

    Example:
    --------
    epi = epistasis(txome, ['hif-1', 'egl-9'], 'hif-1;egl-9', col='genotype')
    epi.epiplot()
    epi.plot_boostraps()
    """
    def __init__(self, txome, singles=[], double='',
                 q=0.1, col='strain', tx_col='target_id', nsim=1000,
                 fancy='fancy'):
        """Initialization function."""
        self.txome = txome
        self.xname = singles[0]
        self.yname = singles[1]
        self.xyname = double
        self.q = q
        self.col = col
        self.tx_col = tx_col
        self.fancy = fancy
        self.nsim = nsim

        all = singles + [double]
        overlap = self.txome.overlap(all)
        sel = self.txome.df.target_id.isin(overlap)
        self.txome.df = self.txome.df[sel]

        x = self.txome.df[self.txome.df[self.col] == self.xname]
        y = self.txome.df[self.txome.df[self.col] == self.yname]
        xy = self.txome.df[self.txome.df[self.col] == self.xyname]

        self.xb = x.b.values
        self.yb = y.b.values
        self.xyb = xy.b.values

        self.xseb = x.se_b.values
        self.yseb = y.se_b.values
        self.xyseb = xy.se_b.values

        self.H0 = self.xb + self.yb
        self.D = self.xyb - self.X

        self.se_H0 = np.sqrt(self.xseb**2 + self.yseb**2)
        self.se_D = np.sqrt(self.xyseb**2 + self.se_X**2)

        self.tx_wide_epi = self.odr().beta[0]

        self._modes = ['actual', 'xy=x', 'xy=y', 'xy=x=y', 'xy=x+y',
                       'suppress']
        self.epicoef = {i: self.bootstrap(i) for i in self._modes}

    def ODR(self):
        """
        Find the ODR in epistasis plot between single muts and a double mut.

        This function does a bit more than it implies, and will be re-factored.

        Output:
        -------
        output: ODR object
        """
        # calculate deviation standard error:
        output = perform_odr(self.H0, self.D, wadd=self.se_H0,
                             wdev=self.se_D)

        return output

    def bootstrap(self, epistasis='actual'):
        """
        Perform non-parametric bootstrapping for an epistasis ODR.

        Given a list of three numpy vectors containing betas and a separate
        list of vectors containing their standard errors, fit a model according
        to the `epistasis` parameter indicated and bootstrap it. The vectors
        MUST be provided in the order [X, Y, XY], where X is the first
        genotype, Y is the second genotype and XY is the double mutant.

        Params:
        -------
        epistasis:  string
                    kind of model to simulate. One of: 'actual', 'suppress',
                    'xy=x+y', 'xy=x', 'xy=y','xy=x=y'.
        nsim:       number of iterations to be performed. Must be > 0

        Output:
        -------
        s:  np.ndarray
            Array of ODR slopes.
        """
        s = np.zeros(self.nsim)

        # draw bootstrap repetitions
        for i in range(self.nsim):
            # sample data, keeping tuples paired:
            ind = draw_bs_sample(len(self.xb))

            currx = copy.deepcopy(self.xb[ind])
            curry = copy.deepcopy(self.yb[ind])
            currxy = copy.deepcopy(self.xyb[ind])

            currsex = copy.deepcopy(self.xseb[ind])
            currsey = copy.deepcopy(self.yseb[ind])
            currsexy = copy.deepcopy(self.xyseb[ind])

            # non parametric (batesonian) bootstraps
            self.H0 = currx + curry
            self.se_H0 = np.sqrt(currsex**2 + currsey**2)

            if epistasis == 'actual':
                self.D = currxy - self.H0
                self.se_D = np.sqrt(self.se_H0**2 + currsexy**2)
            elif epistasis == 'xy=x':
                self.D = -curry
                self.se_D = currsey
            elif epistasis == 'xy=y':
                self.D = -currx
                self.se_D = currsex

            # for linear, inhibitory and additive models, do parametric
            # bootstrap because Non-parametric will always make perfeect lines.
            elif epistasis == 'xy=x+y':
                self.H0 = currx + curry
                self.D = np.random.normal(0, self.se_H0, len(self.H0))
                self.se_D = self.se_H0

            elif epistasis == 'xy=x=y':
                # flip a coin:
                coin = np.random.randint(0, 1)

                # half the time use the X data
                if coin == 0:
                    self.se_H0 = np.sqrt(2)*currsex
                    self.se_D = currsex
                    self.H0 = currx + np.random.normal(0, self.se_H0,
                                                       len(self.se_H0))
                    self.D = -1/2*currx + np.random.normal(0, self.se_D,
                                                           len(self.se_D))
                else:
                    self.se_H0 = np.sqrt(2)*currsey
                    self.se_D = currsey
                    self.H0 = curry + np.random.normal(0, self.se_H0,
                                                       len(self.se_H0))
                    self.D = -1/2*curry + np.random.normal(0, self.se_D,
                                                           len(self.se_D))
            elif epistasis == 'suppress':
                # flip a coin:
                coin = np.random.randint(0, 2)

                # half the time use the X data
                if coin == 0:
                    self.se_H0 = np.sqrt(2)*currsex
                    self.se_D = currsey
                    self.H0 = curry + np.random.normal(0, self.se_H0,
                                                       len(self.se_H0))
                    self.D = -curry + np.random.normal(0, self.se_D,
                                                       len(self.se_H0))
                else:
                    self.se_H0 = np.sqrt(2)*currsex
                    self.se_D = currsex
                    self.H0 = currx + np.random.normal(0, self.se_H0,
                                                       len(self.se_H0))
                    self.D = -currx + np.random.normal(0, self.se_D,
                                                       len(self.se_D))

            # do calcs and store in vectors
            output = perform_odr()

            # extract the slope and standard error from the output and store
            s[i] = output.beta[0]

        # restore H0 and D to their respective real values:
        self.H0 = self.xb + self.yb
        self.D = self.xyb - self.X

        self.se_H0 = np.sqrt(self.xseb**2 + self.yseb**2)
        self.se_D = np.sqrt(self.xyseb**2 + self.se_X**2)

        return s

    def epiplot(self, beta=True, plot_linear=True, ax=None, **kwargs):
        """
        Make an epistasis plot.

        Params:
        -------
        beta:   Boolean
                Whether to plot the ODR fit, defaults to True
        plot_linear:    Boolean
                        Whether to plot the line y=-1/2x, defaults to True
        ax:             matplotlib.pyplot.axis
                        If provided, axis to put plot on
        kwargs:         kwargs for matplotlib.pyplot.axis.scatter

        Output:
        -------
        matplotlib.pyplot.axis with scatterplot on it.
        """
        s0 = kwargs.pop('s0', 15)

        # Calculate the point density
        points = np.vstack([self.H0, self.D])
        z = gaussian_kde(points)(points)

        # plot:
        if ax is None:
            fig, ax = plt.subplots()

        if len(self.D) > 50:
            ax.scatter(self.H0, self.D, c=z, s=s0/self.se_D,
                       edgecolor='', **kwargs)
        else:
            ax.scatter(self.H0, self.D, s=s0/np.sqrt(self.se_D),
                       color='#33a02c', alpha=.9, **kwargs)

        if plot_linear:
            smoothX = np.linspace(self.H0.min() - 0.5, self.H0.max() + 0.5,
                                  1000)
            plt.plot(smoothX, -1/2*smoothX, color='#1f78b4', ls='--',
                     label='Unbranched Pathway')
        if beta:
            # find the xmin and xmax:
            xmin = self.H0.min()
            xmax = self.H0.max()
            x = np.linspace(xmin - 0.1, xmax + 0.1, 10)
            y0 = x*self.tx_wide_epi
            # plot the models
            plt.plot(x, y0, ls='-', lw=2.3, color='#33a02c',
                     label='Tx-wide Epistasis: {0:2g}'.format(self.tx_wide_epi)
                     )

        plt.xlabel(r'Predicted log-Additive Effect')
        plt.ylabel(r'Deviation from log-Additive Effect')

        plt.legend()
        return ax

    def plot_bootstraps(self, **kwargs):
        """
        Make KDE plots of the bootstrapped epistasis coefficients.

        Params:
        -------
        kwargs: kwargs for seaborn kdeplot.

        Output:
        -------
        axis with sns.kdeplot
        """
        # make dictionaries for plotting
        fancy_x = self.txome[self.txome[self.col] == self.xname][self.fancy]
        fancy_x = fancy_x.unique()[0]
        fancy_y = self.txome[self.txome[self.col] == self.yname][self.fancy]
        fancy_y = fancy_y.unique()[0]
        fancy_xy = self.txome[self.txome[self.col] == self.xyname][self.fancy]
        fancy_xy = fancy_xy.unique()[0]

        def label(a, b):
            """Epistasis label for the plot."""
            if type(a) is not str:
                a = str(a)
            if type(b) is not str:
                b = str(b)
            a + ' > ' + b

        colors = {'actual': 'k', 'xy=x': 'blue', 'xy=y': '#33a02c',
                  'xy=x=y': '#1f78b4', 'xy=x+y': '#ff7f00',
                  'suppress': '#e31a1c'
                  }
        labels = {'actual': 'data', 'xy=x': label(fancy_x, fancy_y),
                  'xy=y': label(fancy_y, fancy_x), 'xy=x=y': 'Unbranched',
                  'xy=x+y': 'log-Additive', 'suppress': 'Suppression'
                  }

        fig, ax = plt.subplots()
        for model, s in self.epicoef.items():
            sns.kdeplot(data=s, label=labels[model],
                        color=colors[model], **kwargs)

        # plot a horizontal line wherever the actual data mean is
        plt.gca().axvline(self.epicoef['actual'].mean(),
                          color='#33a02c', ls='--', lw=3)

        plt.xlabel('Epistasis Coefficient')
        plt.ylabel('Cumulative Density Function')

        return ax
