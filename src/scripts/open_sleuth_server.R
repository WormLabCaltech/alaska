#!/usr/bin/env Rscript

# The server opens on 0.0.0.0:42427
# Any connections to the above port will open the Sleuth shiny app.

# Parse command line arguments.
# We use commandArgs here because we don't want to have to install optparse.
if (require('sleuth')) {
  args <- commandArgs(trailingOnly=TRUE)
  so <- readRDS('so.rds')

  # If the server is opening it, we have to pass it specific options.
  # If the user is opening it, just call sleuth_live with no options.
  if ('alaska' %in% args) {
    sleuth_live(so, options=list(port=42427, host='0.0.0.0',
                                    launch.browser=FALSE))
  } else {
    sleuth_live(so)
  }
} else {
  # If the user doesn't have sleuth, redirect the user to the sleuth manual.
  stop('Sleuth is not installed. Please install Sleuth by following the instructions at https://pachterlab.github.io/sleuth/download')
}
