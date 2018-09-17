#!/usr/bin/env Rscript

library('sleuth')
library('optparse')
library('files')

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

#if(lenght(opt$o) == 0) {
#  stop('Output directory cannot be empty')
#}

if(!file.exists(opt$d)) {
  stop('Directory must exist')
}

#gene info for sleuth
print('#Fetching bioMart info (1/2)')
mart <- biomaRt::useMart(host = 'metazoa.ensembl.org',
                         biomart = 'metazoa_mart',
                         dataset = 'celegans_eg_gene')
print('#Fetching bioMart info (2/2)')
t2g <- biomaRt::getBM(attributes = c('ensembl_transcript_id', 'transcript_version',
                            'ensembl_gene_id', 'external_gene_name', 'description',
                            'transcript_biotype'), mart = mart)
print('#Renaming genes')
t2g <- dplyr::rename(t2g, target_id = ensembl_transcript_id,
                     ens_gene = ensembl_gene_id, ext_gene = external_gene_name)
ttg <- dplyr::select(ttg, c('target_id', 'ens_gene', 'ext_gene'))

#point to your directory
base_dir <- opt$d

# kallisto outputs
kallisto <- opt$k

# directory to save results
output_dir <- opt$o


#get ids
print('# Reading analysis matrix')
s2c <- read.table(file.path(base_dir, 'rna_seq_info.txt'), header = TRUE, stringsAsFactors= FALSE)

# Determine the number of factors.
conditions = vector()
for (column_name in colnames(metadata)) {
  if (strcmp(column_name, 'sample')) {
    next
  }

  conditions <- c(conditions, column_name)
}
print(paste('# ', length(conditions), ' conditions detected'))
if (length(conditions) > 2) {
  stop('More than 2 conditions detected.')
}

print('# Appending path to kallisto result folders.')
s2c <- dplyr::mutate(s2c, path=file.path(kallisto, sample))

print('# Creating Sleuth object.')
so <- sleuth_prep(metadata, target_mapping = t2g, extra_bootstrap_summary = TRUE)

# Fit reduced model.
print('# Fitting reduced model.')
if (length(conditions) == 1) {
  condition <- '~1'
} else {
  condition <- paste('~', conditions[1])
}
so <- sleuth_fit(so, eval(parse(text=condition)), 'reduced')

# Fit full model.
print('# Fitting full model.')
if (length(conditions) == 1) {
  condition <- paste('~', conditions[1])
} else {
  condition <- paste('~', conditions[1], '+', conditions[2])
}
so <- sleuth_fit(so, eval(parse(text=condition)), 'full')

models(so)



# print(sample_id)
# print(kal_dirs)
# print(s2c)

# Unique, sorted genotype list
genotypes <- sort(unique(s2c[, 'condition']))
# print(genotypes)

print('#Reading Kallisto results')
s2c <- dplyr::select(s2c, sample= sample, condition)
# print(s2c)
s2c <- dplyr::arrange(s2c, sample)
# print(s2c)
s2c <- dplyr::mutate(s2c, path = kal_dirs)
print(s2c)
# so <- sleuth_prep(s2c, extra_bootstrap_summary = TRUE)
# so <- sleuth_fit(so, ~genotype+batch, 'full')
# so <- sleuth_fit(so, ~batch, 'reduced')
# so <- sleuth_lrt(so, 'reduced', 'full')
so <- sleuth_prep(s2c, ~ condition, target_mapping= t2g)
so <- sleuth_fit(so, ~ condition, fit_name = 'full')
so <- sleuth_fit(so, ~1, 'reduced')
so <- sleuth_lrt(so, 'reduced', 'full')
# print(so)
#print(s2c)

models(so)


#prepend and make object, state maximum model here
#so <- sleuth_prep(s2c, ~ genotype, target_mapping= t2g)

#fit the model
#so <- sleuth_fit(so,~ genotype, fit_name = 'full')

#Wald test implementations
#no interactions
for (genotype in genotypes) {
  # Ignore WT geneotype
  if (!grepl(genotypes[1], genotype)) {
    # String for current progress
    progress <- paste('(', match(genotype, genotypes)-1, '/', length(genotypes)-1, ')')
    print(paste('#Computing Wald test on ', genotype, progress))
    so <- sleuth_wt(so, which_beta = paste('condition', genotype, sep=''), which_model = 'full')
  }
}


#write results to csv
for (genotype in genotypes) {
  if(!grepl(genotypes[1], genotype)) {
    # '(current index/total length)'
    progress <- paste('(', match(genotype, genotypes)-1, '/', length(genotypes)-1, ')')

    # 'betasX.csv'
    output_file <- paste(substring(genotype, 3), '.csv', sep='')

    print(paste('#Writing ', genotype, 'results to', output_file, progress))
    results_table <- sleuth_results(so, paste('condition', genotype, sep=''), 'full', test_type='wt')
    write.csv(results_table, paste(output_dir, output_file, sep='/'))
  }
}

if (opt$batch) {
  sr <- sleuth_results(so, 'reduced:full', 'lrt')
  write.csv(sr, paste(output_dir, 'batch_lrt.csv', sep='/'))
}

so_file = paste(output_dir, 'so.rds', sep='/')
print(paste('#Writing sleuth object to', so_file))
saveRDS(so, file=so_file)

if (opt$shiny) {
  print('#Starting shiny web server')
  sleuth_live(so, options=list(port=42427, launch.browser=FALSE, host='0.0.0.0'))
}
