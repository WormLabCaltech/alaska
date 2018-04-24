"""R script to open the Sleuth shiny web app.

"""

# The server opens on 0.0.0.0:42427
# Any connections to the above port will open the Sleuth shiny app.
library('sleuth')

so <- readRDS('so.rds')
sleuth_live(so, options=list(port=42427, host='0.0.0.0',
                                launch.browser=FALSE))
