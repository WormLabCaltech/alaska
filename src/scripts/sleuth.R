#!/usr/bin/env Rscript
library('sleuth')
library('files')
library('optparse')

# command line arguments
option_list <- list(
  make_option(c('-v', '--verbose'), action='store_true', default=TRUE,
              help='Print extra output [default]'),
  make_option(c('-d', '--directory'), type='character', default=character(0),
              help='Please specify the directory of the matrix'),
  make_option(c('-k', '--kallisto'), type='character', default=character(0),
              help='Please specify the directory of kallisto quantifications'),
  make_option(c('-o', '--output'), type='character', default=character(0),
              help='Please specify the output directory'),
  make_option(c('-ba', '--batch'), action='store_true', default=FALSE,
              help='Batch correction method'),
  make_option(c('-bv', '--batchvar'), type='character', default=character(0),
              help='Please specify the batch variable name'),
  make_option(c('-s', '--shiny'), action='store_true', default=FALSE,
              help='Command to open shiny console')
)

opt = parse_args(OptionParser(option_list=option_list))

if(length(opt$d) == 0) {
  stop('Directory must not be empty')
}

if(!file.exists(opt$d)) {
  stop('Directory must exist')
}

#point to your directory
base_dir <- opt$d

# kallisto outputs
kallisto <- opt$k

# directory to save results
output_dir <- opt$o
dir.create(output_dir, showWarnings=FALSE)

#gene info for sleuth
# print('#Fetching bioMart info (1/2)')
# mart <- biomaRt::useMart('parasite_mart',
#                          dataset = 'wbps_gene',
#                          host = 'parasite.wormbase.org')
#
# print('#Fetching bioMart info (2/2)')
# t2g <- biomaRt::getBM(mart = mart,
#                       filters = c('species_id_1010'),
#                       values = c('elegaprjna13758'),
#                       attributes = c('wbps_transcript_id',
#                                      'wbps_gene_id',
#                                      'external_gene_id',
#                                      'description',
#                                      'transcript_biotype'),
#                       verbose = TRUE)

# Fetch annotations
print('#Fetching annotations')
t2g <- read.table(file.path(base_dir, 'annotations.tsv'),
                  header = FALSE,
                  stringsAsFactors = FALSE,
                  col.names=c('target_id', 'ens_gene', 'ext_gene',
                              'description', 'transcript_biotype'))

# print('#Renaming genes')
# t2g <- dplyr::rename(t2g, target_id = ensembl_transcript_id,
#                           ens_gene = ensembl_gene_id,
#                           ext_gene = external_gene_name)
# t2g <- dplyr::select(t2g, c('target_id', 'ens_gene', 'ext_gene'))

#get ids
print('# Reading analysis matrix')
s2c <- read.table(file.path(base_dir, 'rna_seq_info.txt'),
                  header = TRUE,
                  stringsAsFactors = FALSE)

# Determine the number of factors.
conditions = vector()
for (column_name in colnames(s2c)) {
  if (column_name == 'sample') {
    next
  }

  conditions <- c(conditions, column_name)
}
print(conditions)

# Determine number of names for each condition.
condition_names <- list()
for (i in 1:length(conditions)) {
  condition <- conditions[i]
  vec <- sort(unique(s2c[, condition]))
  condition_names[[i]] <- c(vec)
}
print(condition_names)

print(paste('# ', length(conditions), ' conditions detected', sep=''))
if (length(conditions) > 2) {
  stop('More than 2 conditions detected.')
}

print('# Appending path to kallisto result folders.')
s2c <- dplyr::mutate(s2c, path=file.path(kallisto, sample))

print(s2c)

print('# Creating Sleuth object.')
if (length(conditions) == 1) {
  prep_condition <- paste('~', conditions[1], sep='')
} else {
  # ~condition_1+condition_2+condition_1*condition_2
  prep_condition <- paste('~', conditions[1], '+', conditions[2], '+',
                          conditions[1], '*', conditions[2], sep='')
}
so <- sleuth_prep(s2c, eval(parse(text=prep_condition)),
                  target_mapping = t2g, extra_bootstrap_summary = TRUE)

# Fit reduced model.
# print('# Fitting reduced model.')
# if (length(conditions) == 1) {
#   condition <- '~1'
# } else {
#   condition <- paste('~', conditions[1], sep='')
# }
# so <- sleuth_fit(so, eval(parse(text=condition)), 'reduced')

# Fit model.
print('# Fitting model(s).')
if (length(conditions) == 1) {
  condition <- paste('~', conditions[1], sep='')
} else {
  # Fit interaction model.
  print('# Fitting interaction model.')
  so <- sleuth_fit(so, eval(parse(text=prep_condition)), fit_name='interaction')

  condition <- paste('~', conditions[1], '+', conditions[2], sep='')
}
print('# Fitting full model.')
so <- sleuth_fit(so, eval(parse(text=condition)), fit_name='full')

models(so)

print('# Performing Wald tests on full model.')
for (i in 1:length(conditions)) {
  condition <- conditions[i]
  condition_name <- condition_names[[i]]

  for (name in condition_name) {
    if (startsWith(name, 'a_')) {
      next
    }

    print(paste('# Computing wald test on condition ', condition, ':', name, sep=''))
    beta <- paste(condition, name, sep='')
    so <- sleuth_wt(so, which_beta=beta, which_model='full')

    # Write results.
    results_table <- sleuth_results(so, beta, 'full', test_type='wt')
    output_file <- paste('betas_wt_', condition, '-', name, '.csv', sep='')
    write.csv(results_table, paste(output_dir, output_file, sep='/'))
  }
}

if (length(conditions) > 1) {
  print('# Performing Wald tests on interaction model.')
  for (i in 1:length(conditions)) {
    condition <- conditions[i]
    condition_name <- condition_names[[i]]

    for (name in condition_name) {
      if (startsWith(name, 'a_')) {
        next
      }

      print(paste('# Computing wald test on condition ', condition, ':', name,
                  sep=''))
      beta = paste(condition, name, sep='')
      so <- sleuth_wt(so, which_beta=beta, which_model='interaction')

      # Write results.
      results_table <- sleuth_results(so, beta, 'interaction', test_type='wt')
      output_file = paste('betas_wt_', condition, '-', name, '.csv',
                          sep='')
      write.csv(results_table, paste(output_dir, output_file, sep='/'))
    }
  }

  # Compute pairwise interactions.
  for (i in 1:length(conditions)) {
    condition <- conditions[i]
    condition_name <- condition_names[[i]]

    for (name in condition_name) {
      if (startsWith(name, 'a_') | i+1 > length(conditions)) {
        next
      }

      for (j in (i+1):length(conditions)) {
        condition2 <- conditions[j]
        condition2_name <- condition_names[[j]]

        for (name2 in condition2_name) {
          if (startsWith(name2, 'a_') | name == name2) {
            next
          }

          print(paste('# Computing wald test on condition ', condition, ':', name,
                      ' with ', condition2, ':', name2, sep=''))
          beta = paste(condition, name, ':', condition2, name2, sep='')
          so <- sleuth_wt(so, which_beta=beta, which_model='interaction')

          # Write results.
          results_table <- sleuth_results(so, beta, 'interaction', test_type='wt')
          output_file = paste('betas_wt_', condition, '-', name, '.csv',
                              sep='')
          write.csv(results_table, paste(output_dir, output_file, sep='/'))
        }
      }
    }
  }


  # LRT on full and interaction models
  print('# Performing LRT on full and interaction models.')
  so <- sleuth_lrt(so, 'full', 'interaction')
  results_table <- sleuth_results(so, 'full:interaction', test_type='lrt')
  write.csv(results_table, paste(output_dir, 'lrt.csv', sep='/'))
}



# print('# Writing likelihood ratio test sleuth table.')
# sleuth_table <- sleuth_results(so, 'reduced:full', 'lrt', show_all=FALSE)
# write.csv(sleuth_table, paste(output_dir, 'sleuth_table_lrt.csv', sep='/'))
# for (i in 1:length(conditions)) {
#   condition <- conditions[i]
#   condition_name <- condition_names[[i]]
#
#   for (name in condition_name) {
#     if (startsWith(name, 'a_')) {
#       next
#     }
#
#     print(paste('# Writing Wald test sleuth table for ', condition, ':', name,
#                 sep=''))
#     results_table <- sleuth_results(so, paste(condition, name, sep=''), 'full',
#                                     test_type='wt', show_all=FALSE)
#     output_file = paste('sleuth_table_wt_', condition, '_', name, '.csv',
#                         sep='')
#     write.csv(results_table, paste(output_dir, output_file, sep='/'))
#   }
# }

print('#Writing sleuth object.')
so_file = paste(base_dir, 'so.rds', sep='/')
saveRDS(so, file=so_file)
