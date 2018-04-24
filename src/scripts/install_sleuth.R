"""Script to install all R dependencis for Sleuth.

"""

# install dependencies
install.packages("stringr", repos="http://cran.us.r-project.org")
install.packages("htmltools", repos="http://cran.us.r-project.org")
install.packages("httpuv", repos="http://cran.us.r-project.org")
install.packages("shiny", repos="http://cran.us.r-project.org")
install.packages("devtools", repos="http://cran.us.r-project.org")
install.packages("ggplot2", repos="http://cran.us.r-project.org")
install.packages("dplyr", repos="http://cran.us.r-project.org")
install.packages("optparse", repos="http://cran.us.r-project.org")
install.packages("files", repos="http://cran.us.r-project.org")

# biomart
source("http://bioconductor.org/biocLite.R")
biocLite("rhdf5")
biocLite("biomaRt")

# install sleuth
devtools::install_github("pachterlab/sleuth")