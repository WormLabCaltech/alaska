#!/usr/bin/perl

# Form to process Alaska .json
#
# https://github.com/WormLabCaltech/alaska
# https://github.com/WormLabCaltech/alaska/blob/master/README.md
# https://github.com/WormLabCaltech/alaska/blob/master/jsons/JSON-README.md
#
# ftp://alaska.caltech.edu/projects/APmjszi5/
# User: alaska
# PW: Fidopjedd8

# /var/lib/docker/volumes/alaska_data_volume/_data/projects/
# /var/lib/docker/volumes/alaska_data_volume/_data/test_samples/raw/small

# /var/lib/docker/volumes/alaska_data_volume/_data/organisms/jsons/

use lib "/usr/lib/perl/5.14.2/";

# use Jex;			# untaint, getHtmlVar
use strict;
use CGI;
use JSON;
use Tie::IxHash;
# use Fcntl;
# use DBI;
# use LWP::Simple;
# use File::Basename;		# fileparse
# use Mail::Sendmail;
# use Net::Domain qw(hostname hostfqdn hostdomain);


# my $hostfqdn = hostfqdn();

# my $dbh = DBI->connect ( "dbi:Pg:dbname=testdb", "", "") or die "Cannot connect to database!\n";
my $result;
my $json        = JSON->new->allow_nonref;

my %project;
my %sample;

my %organisms;



my $query = new CGI;
my $alaskaDataDir = '/home/azurebrd/public_html/cgi-bin/alaska/data/';

my $projectsDir = '/var/lib/docker/volumes/alaska_data_volume/_data/projects/';

my %template;
&loadTemplates();

my $td = qq(<td style="border-style: dotted;">);
my $amountContributors    = 3;
my $amountCharacteristics = 3;

my $var;
($var, my $action) = &getHtmlVar($query, 'action');
unless ($action) { $action = 'showStart'; }			# by default show the start of the form
if ($action) {
  &initFields();
  if ($action eq 'showStart') {                              &showStart();              }
    elsif ($action eq 'Start a project') {                   &startProjectPage();       }
    elsif ($action eq 'SelectJSON') {                        &selectJsonPage();         }
    elsif ($action eq 'Infer Samples') {                     &inferSamplesPage();       }
    elsif ($action eq 'Load JSON') {                         &loadJsonPage();           }
    elsif ($action eq 'Update JSON Project') {               &updateJsonProjectPage();  }
    elsif ($action eq 'Update JSON Controls') {              &updateJsonControlsPage(); }
    elsif ($action eq 'Submit') {                            &submit('submit');         }
    elsif ($action eq 'Preview') {                           &submit('preview');        }
    else {                                                   &showStart();              }
}

sub loadOrganisms {
  my $organism_json_dir = '/var/lib/docker/volumes/alaska_data_volume/_data/organisms/jsons/';
  my (@files) = <${organism_json_dir}*.json>;
  foreach my $file (@files) {
    my $filename = $file;
    $filename =~ s/$organism_json_dir//;
    $filename =~ s/\.json//;
    $/ = undef;
    open (IN, "<$file") or die "Cannot open $file : $!";
    my $fileData = <IN>;
    close (IN) or die "Cannot close $file : $!";
    $/ = "\n";
    my $perl_scalar = $json->decode( $fileData );
    my %jsonData    = %$perl_scalar;                     # decode the json into a hash
    foreach my $ref (sort keys %{ $jsonData{refs} }) { $organisms{$filename}{$ref}++; }
  }
}

sub loadTemplates {
#   my $filename = 'properties_project.json';
#   my ($jsonDataRef) = &loadJsonFile($filename);
#   %project = %$jsonDataRef;
#   $filename = 'properties_sample.json';
#   ($jsonDataRef) = &loadJsonFile($filename);
#   %sample = %$jsonDataRef;

  $template{label}{id}                    = 'Project ID';

  tie %{ $template{label}{meta} }, "Tie::IxHash";
  $template{label}{meta}{title}           = 'Project Title';
  $template{label}{meta}{summary}         = 'Summary';
  $template{label}{meta}{contributors}    = 'Contributors';
  $template{label}{meta}{SRA_center_code} = 'SRA Center Code';
  $template{label}{meta}{email}           = 'Email';
  $template{label}{design}                = 'Experiment Design';

  $template{type}{id}                     = 'display';
  $template{type}{meta}{title}            = 'text';
  $template{type}{meta}{summary}          = 'text';
  $template{type}{meta}{contributors}     = 'array_text';
  $template{type}{meta}{SRA_center_code}  = 'text';
  $template{type}{meta}{email}            = 'text';
  $template{type}{design}                 = 'radio';

  tie %{ $template{label}{sample} }, "Tie::IxHash";
  tie %{ $template{label}{sample}{meta} }, "Tie::IxHash";
  $template{label}{sample}{meta}{title}            = 'Sample Title';
  $template{label}{sample}{meta}{description}      = 'Description';
  $template{label}{sample}{meta}{contributors}     = 'Contributors';
#   $template{label}{sample}{meta}{organism}         = 'Organism';
  $template{label}{sample}{meta}{source}           = 'Source';
  $template{label}{sample}{meta}{chars}            = 'Characteristics';
  $template{label}{sample}{name}                   = 'Name';
#   $template{label}{sample}{control}                = 'This is my control';
#   $template{label}{sample}{controlchars}           = 'Control Characteristics';
  $template{label}{sample}{type}                   = 'Read Type';
  $template{label}{sample}{organism}               = 'Organism';
  $template{label}{sample}{ref_ver}                = 'ref_ver';
  $template{label}{sample}{idx}                    = 'Index';
  $template{label}{sample}{length}                 = 'Length';
  $template{label}{sample}{stdev}                  = 'Standard Dev';
  $template{label}{sample}{bootstrap_n}            = 'Bootstraps';

  $template{type}{sample}{meta}{title}             = 'text';
  $template{type}{sample}{meta}{description}       = 'text';
  $template{type}{sample}{meta}{contributors}      = 'array_text';
#   $template{type}{sample}{meta}{organism}          = 'text';
  $template{type}{sample}{meta}{source}            = 'text';
  $template{type}{sample}{meta}{chars}             = 'special';
  $template{type}{sample}{name}                    = 'display';
  $template{type}{sample}{control}                 = 'checkbox';
  $template{type}{sample}{controlchars}            = 'dropdown';
  $template{type}{sample}{type}                    = 'radio';
  $template{type}{sample}{organism}                = 'special';
  $template{type}{sample}{ref_ver}                 = 'special';
  $template{type}{sample}{idx}                     = 'dropdown';
  $template{type}{sample}{length}                  = 'text';
  $template{type}{sample}{stdev}                   = 'text';
  $template{type}{sample}{bootstrap_n}             = 'text';

  $template{values}{design}{1}                     = '1-factor';
  $template{values}{design}{2}                     = '2-factor';
  $template{values}{sample}{type}{1}               = 'Single-end';
  $template{values}{sample}{type}{2}               = 'Paired-end';
} # sub loadTemplates


sub loadJsonFile {
  my ($source, $projectId) = @_;
  my $page = '';
  if ($source eq 'dropdown') {
#       my $jsonUrl = '../../data/alaska/' . $projectId;
#       my $jsonUrl = "http://${hostfqdn}/~azurebrd/cgi-bin/data/alaska/" . $projectId;
      my $jsonUrl = "http://wobr2.caltech.edu/~azurebrd/cgi-bin/alaska/data/" . $projectId;
      $page        = get $jsonUrl; }
    elsif ($source eq 'projectId') {
      my $file = $projectsDir . $projectId . '/_temp/' . $projectId . '.json';
      $/ = undef;
      open (IN, "<$file") or die "Cannot open $file : $!";
      $page = <IN>;
      close (IN) or die "Cannot close $file : $!";
      $/ = "\n"; }
  my $perl_scalar = $json->decode( $page );         # get the solr data
  my %jsonData    = %$perl_scalar;                     # decode the solr page into a hash
  return \%jsonData;
} # sub loadJsonFile

sub updateJsonProjectPage {
  &printNormalHeader();

  ($var, my $projectId)  = &getHtmlVar($query, 'projectId');
  ($var, my $filename)   = &getHtmlVar($query, 'jsonFile');

  my $jsonDataHref;
  if ($projectId) {     ($jsonDataHref)     = &loadJsonFile('projectId', $projectId); }
    elsif ($filename) { ($jsonDataHref)     = &loadJsonFile('dropdown', $filename);   }
  my %jsonData = %$jsonDataHref;

  foreach my $field (keys %{ $template{label}{meta} }) {
    if ($template{type}{meta}{$field} eq 'text') {
        my $id = 'meta_' . $field;
        ($var, $jsonData{meta}{$field})   = &getHtmlVar($query, $id); }
      elsif ($field eq 'contributors') {
        for my $i (0 .. $amountContributors) {
          my $id = 'meta_' . $field . '_' . $i;
          ($var, $jsonData{meta}{$field}[$i])   = &getHtmlVar($query, $id); } }
  }
  ($var, $jsonData{design})   = &getHtmlVar($query, 'design');

# don't delete, no longer updating ctrls on this page update
#   delete $jsonData{ctrls};					# need to clear out all old values before loading new values
  foreach my $sample (sort keys %{ $jsonData{samples} }) {
    foreach my $field (keys %{ $template{label}{sample}{meta} }) {
      if ($template{type}{sample}{meta}{$field} eq 'text') {
          my $id = 'samples_' . $sample . '_meta_' . $field;
          ($var, $jsonData{samples}{$sample}{meta}{$field}) =  &getHtmlVar($query, $id); }
        elsif ($field eq 'contributors') {
          for my $i (0 .. $amountContributors) {
            my $id = 'samples_' . $sample . '_meta_' . $field . '_' . $i;
            ($var, $jsonData{samples}{$sample}{meta}{$field}[$i]) =  &getHtmlVar($query, $id); } }
        elsif ($field eq 'chars') {
          delete $jsonData{samples}{$sample}{meta}{chars};
          for (my $i = 0; $i <= $amountCharacteristics; $i++) {
            my $id_key   = 'samples_' . $sample . '_meta_' . $field . '_key_' . $i;
            my $id_value = 'samples_' . $sample . '_meta_' . $field . '_value_' . $i;
            ($var, my $key)   =  &getHtmlVar($query, $id_key);
            ($var, my $value) =  &getHtmlVar($query, $id_value);
            if ($key) {
              $jsonData{samples}{$sample}{meta}{chars}{$key} = $value; } } }
    } # foreach my $field (keys %{ $template{label}{sample}{meta} })

    foreach my $field (keys %{ $template{label}{sample} }) {
      next if ($field eq 'meta');
      my $id = 'samples_' . $sample . '_' . $field;
#       print qq(<tr>${td}$template{label}{sample}{$field}</td>${td});
      if ($template{type}{sample}{$field} eq 'text') {
          ($var, $jsonData{samples}{$sample}{$field})   =  &getHtmlVar($query, $id); }
        elsif ($template{type}{sample}{$field} eq 'radio') {
          ($var, $jsonData{samples}{$sample}{$field})   =  &getHtmlVar($query, $id); }
        elsif ($template{type}{sample}{$field} eq 'dropdown') {
          ($var, $jsonData{samples}{$sample}{$field})   =  &getHtmlVar($query, $id); }

#         elsif ($template{type}{sample}{$field} eq 'checkbox') {
#           ($var, my $is_checked)   =  &getHtmlVar($query, $id);
#           if ($is_checked eq 'checked') {
#             my $id_category = 'samples_' . $sample . '_controlchars';
#             ($var, my $category)   =  &getHtmlVar($query, $id_category);
#             $jsonData{ctrls}{$sample} = $category; } }
    } # foreach my $field (keys %{ $template{label}{sample} })
  } # foreach my $sample (sort keys %{ $jsonData{samples} })

  my $jsonOut = encode_json \%jsonData;
#   my $outfile = '/home/azurebrd/public_html/cgi-bin/alaska/data/temp.json';
  my $outfile = $projectsDir . $projectId . '/_temp/' . $projectId . '.json';

  open (OUT, ">$outfile") or die "Cannot create $outfile : $!";
  print OUT $jsonOut;
  close (OUT) or die "Cannot close $outfile : $!";
#   my $jsonOutUrl = "http://${hostfqdn}/~azurebrd/cgi-bin/alaska/data/temp.json";
#   print qq(<a href="$jsonOutUrl">json out</a><br/>\n);

  &showJsonControlsForm(\%jsonData);

  &printNormalFooter();
} # sub updateJsonProjectPage

sub updateJsonControlsPage {
  &printNormalHeader();

  ($var, my $projectId)  = &getHtmlVar($query, 'projectId');
  ($var, my $filename)   = &getHtmlVar($query, 'jsonFile');

  my $jsonDataHref;
  if ($projectId) {     ($jsonDataHref)     = &loadJsonFile('projectId', $projectId); }
    elsif ($filename) { ($jsonDataHref)     = &loadJsonFile('dropdown', $filename);   }
  my %jsonData = %$jsonDataHref;

  my $designAmount = $jsonData{"design"};
  delete $jsonData{ctrls};					# need to clear out all old values before loading new values
  for my $i (1 .. $designAmount) {
    ($var, my $value)  = &getHtmlVar($query, "control_$i");
#      my ($sample, $type) = split/_/, $value;
#      $jsonData{"ctrls"}{$sample} = $type;
#      $jsonData{"ctrls"}{$sample} = $type;

     my ($form_characteristic, $form_detail) = split/ - /, $value;
#      print qq(FC $form_characteristic, FD $form_detail<br>);
     foreach my $sample (sort keys %{ $jsonData{"samples"} }) {
       foreach my $characteristic (sort keys %{ $jsonData{"samples"}{$sample}{"meta"}{"chars"} }) {
         if ($form_characteristic eq $characteristic) {
           my $detail = $jsonData{"samples"}{$sample}{"meta"}{"chars"}{"$characteristic"};
             if ($form_detail eq $detail) {
#              print qq($i - $sample - $characteristic<br>);
               $jsonData{"ctrls"}{$sample} = $characteristic;
     } } } }

#      print qq($i - $value<br>);
  }

  my $jsonOut = encode_json \%jsonData;
#   my $outfile = '/home/azurebrd/public_html/cgi-bin/alaska/data/temp.json';
  my $outfile = $projectsDir . $projectId . '/_temp/' . $projectId . '.json';

  open (OUT, ">$outfile") or die "Cannot create $outfile : $!";
  print OUT $jsonOut;
  close (OUT) or die "Cannot close $outfile : $!";

  print qq(Thanks for updating !  The projects/ directory is owned by root, and for permissions reasons, we can't link to the edited .json, look at ${projectsDir}${projectId}/_temp/${projectId}.json<br>\n);

  &printNormalFooter();
} # sub updateJsonControlsPage

sub loadJsonPage {
  &printNormalHeader();
  &loadOrganisms();
#   my (@files) = <${alaskaDataDir}*.json>;
  my $jsonDataHref = '';

  ($var, my $projectId)  = &getHtmlVar($query, 'projectId');
  ($var, my $filename)   = &getHtmlVar($query, 'jsonFile');

  if ($projectId) {     ($jsonDataHref)     = &loadJsonFile('projectId', $projectId); }
    elsif ($filename) { ($jsonDataHref)     = &loadJsonFile('dropdown', $filename);   }

  &showJsonProjectForm($jsonDataHref);
} # sub loadJsonPage

sub showJsonProjectForm {
  my ($jsonDataHref) = @_;
  my %jsonData     = %$jsonDataHref;

  ($var, my $filename)   = &getHtmlVar($query, 'jsonFile');
  ($var, my $projectId)  = &getHtmlVar($query, 'projectId');
  print qq(<form method="post" action="alaska.cgi">);

  print qq(<input type="hidden" name="jsonFile" value="$filename">\n);
  print qq(<input type="hidden" name="projectId" value="$projectId">\n);

  my $id = $jsonData{id};
  my $proj_title                = $jsonData{meta}{title};
  my $proj_summary              = $jsonData{meta}{summary};
  my $proj_SRA_center_code      = $jsonData{meta}{SRA_center_code};
  my $proj_email                = $jsonData{meta}{email};
  my @proj_contributors         = $jsonData{meta}{contributors};

  print qq(<table border='1' style="border-style: none; empty-cells: show; ">);
  print qq(<tr>${td}$template{label}{id}</td>${td}$jsonData{id}</td></tr>);
  foreach my $field (keys %{ $template{label}{meta} }) {
    if ($template{type}{meta}{$field} eq 'text') {
        my $id = 'meta_' . $field;
        print qq(<tr>${td}$template{label}{meta}{$field}</td>${td}<input id="$id" name="$id" value="$jsonData{meta}{$field}"/></td></tr>); }
      elsif ($field eq 'contributors') {
        for my $i (0 .. $amountContributors) {
          my $id = 'meta_' . $field . '_' . $i;
          print qq(<tr>${td}$template{label}{meta}{$field}</td>${td}<input id="$id" name="$id" value="$jsonData{meta}{$field}[$i]"/></td></tr>);
        } }
  }

  my $id = 'design';
  print qq(<tr>${td}$template{label}{$id}</td>${td});
  foreach my $value (sort keys %{ $template{values}{$id} }) {
    my $checked = '';
    if ($jsonData{$id} == $value) { $checked = 'checked'; }
    print qq(<input type="radio" id="$id" name="$id" $checked value="$value">$template{values}{$id}{$value}); }
  print qq(</td></tr>\n);

  print qq(</table><br/>);

  foreach my $sample (sort keys %{ $jsonData{samples} }) {
    print qq(Sample ID : $jsonData{samples}{$sample}{id}<br/>);
    print qq(<table border='1' style="border-style: none; empty-cells: show; ">);
    foreach my $field (keys %{ $template{label}{sample}{meta} }) {
      if ($template{type}{sample}{meta}{$field} eq 'text') {
          my $id = 'samples_' . $sample . '_meta_' . $field;
          print qq(<tr>${td}$template{label}{sample}{meta}{$field}</td>${td}<input id="$id" name="$id" value="$jsonData{samples}{$sample}{meta}{$field}"/></td></tr>); }
        elsif ($template{type}{sample}{meta}{$field} eq 'display') {
          my $id = 'samples_' . $sample . '_meta_' . $field;
          print qq(<tr>${td}$template{label}{sample}{meta}{$field}</td>${td}<input type="hidden" id="$id" name="$id" value="$jsonData{samples}{$sample}{meta}{$field}"/></td></tr>); }
        elsif ($field eq 'contributors') {
          for my $i (0 .. $amountContributors) {
            my $id = 'samples_' . $sample . '_meta_' . $field . '_' . $i;
            print qq(<tr>${td}$template{label}{sample}{meta}{$field}</td>${td}<input id="$id" name="$id" value="$jsonData{samples}{$sample}{meta}{$field}[$i]"/></td></tr>);
          } }
        elsif ($field eq 'chars') {
          my $i = -1;
          print qq(<tr>${td}$template{label}{sample}{meta}{$field}</td>${td}Category</td>${td}Details</td></tr>);
          foreach my $key (sort keys %{ $jsonData{samples}{$sample}{meta}{chars} }) {
            $i++;
            my $value = $jsonData{samples}{$sample}{meta}{chars}{$key};
            my $id_key   = 'samples_' . $sample . '_meta_' . $field . '_key_' . $i;
            my $id_value = 'samples_' . $sample . '_meta_' . $field . '_value_' . $i;
            print qq(<tr>${td}</td>${td}<input id="$id_key" name="$id_key" value="$key"/></td>${td}<input id="$id_value" name="$id_value" value="$value"/></td></tr>);
          }
          for ($i .. $amountCharacteristics-1) {
            $i++;
            my $id_key   = 'samples_' . $sample . '_meta_' . $field . '_key_' . $i;
            my $id_value = 'samples_' . $sample . '_meta_' . $field . '_value_' . $i;
            print qq(<tr>${td}</td>${td}<input id="$id_key" name="$id_key" value=""/></td>${td}<input id="$id_value" name="$id_value" value=""/></td></tr>);
          } }
    }
#     print qq(<tr><td><br/></td></tr>);

#   $template{type}{sample}{name}                    = 'text';
    foreach my $field (keys %{ $template{label}{sample} }) {
      next if ($field eq 'meta');
      my $id = 'samples_' . $sample . '_' . $field;
      print qq(<tr>${td}$template{label}{sample}{$field}</td>${td});
      if ($template{type}{sample}{$field} eq 'text') {
          print qq(<input id="$id" name="$id" value="$jsonData{samples}{$sample}{$field}"/>); }
        elsif ($template{type}{sample}{$field} eq 'display') {
          print qq(<input type="hidden" id="$id" name="$id" value="$jsonData{samples}{$sample}{$field}"/>$jsonData{samples}{$sample}{$field}); }
        elsif ($template{type}{sample}{$field} eq 'radio') {
          foreach my $value (sort keys %{ $template{values}{sample}{$field} }) {
            my $checked = ''; if ($jsonData{design} == $value) { $checked = 'checked'; }
            print qq(<input type="radio" id="$id" name="$id" $checked value="$value">$template{values}{sample}{$field}{$value}); } }
        elsif ($template{type}{sample}{$field} eq 'checkbox') {
#           my $checked = ''; foreach my $value (@{ $jsonData{ctrl_ids} }) { if ($value eq $sample) { $checked = 'checked'; } }
          my $checked = ''; if ($jsonData{ctrls}{$sample}) { $checked = 'checked'; }
          print qq(<input type="checkbox" id="$id" name="$id" value="checked" $checked>\n); }
        elsif ($template{type}{sample}{$field} eq 'dropdown') {
          print qq(<select name="$id" id="$id"><option></option></select>\n); }
        elsif ($field eq 'organism') {
          print qq(<select name="$id" id="$id">);
          foreach my $org (sort keys %organisms) {
            print qq(<option>$org</option>\n); }
          print qq(</select>\n); }
        elsif ($field eq 'ref_ver') {
          if (scalar keys %organisms == 1) {
              print qq(<select name="$id" id="$id">);
              foreach my $org (sort keys %organisms) {
                foreach my $ver (sort keys %{ $organisms{$org} }) { print qq(<option>$ver</option>\n); } }
              print qq(</select>\n); }
            else { print qq(need update for multiple organisms); } }
#         elsif ($field eq 'controlchars') {
#           my $id_category = 'samples_' . $sample . '_controlcategory';
#           my $id_details  = 'samples_' . $sample . '_controldetails';
#           print qq(<select name="$id_category" id="$id_category"><option></option>);
#           if ($jsonData{ctrls}{$sample}) { print qq(<option selected="selected">$jsonData{ctrls}{$sample}</option>); }
#           print qq(</select>\n);
#           print qq(</td>$td);
#           print qq(<select name="$id_details"  id="$id_details" ><option></option>);
#           if ($jsonData{ctrls}{$sample}) { print qq(<option selected="selected">$jsonData{samples}{$sample}{meta}{chars}{$jsonData{ctrls}{$sample}}</option>); }
#           print qq(</select>\n); }
      print qq(</td></tr>\n);
    }
    print qq(<tr>${td}Reads + MD5 Checksums</td>${td}Read File</td>${td}MD5 Checksums</td></tr>);
    for (my $i = 0; $i <= $#{ $jsonData{samples}{$sample}{reads} }; $i++) {
      print qq(<tr>$td</td>${td}$jsonData{samples}{$sample}{reads}[$i]</td>${td}$jsonData{samples}{$sample}{chk_md5}[$i]</td></tr>\n); }
    print qq(</table><br/>);
  } # foreach my $sample (sort keys %{ $jsonData{samples} })

  print qq(<input type="submit" name="action" value="Update JSON Project">\n);
  print qq(</form>\n);
} # sub showJsonProjectForm

sub showJsonControlsForm {
  my ($jsonDataHref) = @_;
  my %jsonData     = %$jsonDataHref;

  ($var, my $filename)   = &getHtmlVar($query, 'jsonFile');
  ($var, my $projectId)  = &getHtmlVar($query, 'projectId');
  print qq(<form method="post" action="alaska.cgi">);

  print qq(<input type="hidden" name="jsonFile"  value="$filename">\n);
  print qq(<input type="hidden" name="projectId" value="$projectId">\n);

  my $designAmount = $jsonData{"design"};
  my %possibleControls;
  my $sampleCount = scalar keys %{ $jsonData{"samples"} };
  my %characteristics;
  foreach my $sample (sort keys %{ $jsonData{"samples"} }) {
    my %characteristicInSample;
    foreach my $characteristic (sort keys %{ $jsonData{"samples"}{$sample}{"meta"}{"chars"} }) {
      $characteristicInSample{$characteristic}++;
      $characteristics{$characteristic}{details}{ $jsonData{"samples"}{$sample}{"meta"}{"chars"}{$characteristic} }++;
#       my $possible = $sample . '_' . $characteristic;
#       $possibleControls{$possible}++;
    }
    foreach my $characteristic (sort keys %characteristicInSample) {
      $characteristics{$characteristic}{count}++; }
  }
  my @options;
  foreach my $characteristic (sort keys %characteristics) {
    if ($characteristics{$characteristic}{count} == $sampleCount) {
      foreach my $detail (sort keys %{ $characteristics{$characteristic}{details} }) {
        push @options, qq(<option>$characteristic - $detail</option>); } } }
  my $optionSize = 10;
  if (scalar(@options) < $optionSize) { $optionSize = scalar(@options); }
  for my $i (1 .. $designAmount) {
    print qq(Control $i : <select name="control_$i" size="$optionSize">\n);
    foreach (@options) { print $_; }
#     print qq(<option></option>);
#     foreach my $pos (sort keys %possibleControls) {
#       print qq(<option>$pos</option>); }
    print qq(</select><br/>\n);
  } # for my $i (1 .. $designAmount)

  print qq(<input type="submit" name="action" value="Update JSON Controls">\n);
  print qq(</form>\n);
} # sub showJsonControlsForm

sub showStart {
  &printNormalHeader();
  print qq(You'd pick your name here placeholder<br/>);
  print qq(<form method="post" action="alaska.cgi">);
  print qq(<input type="submit" name="action" value="Start a project">\n);
  print qq(</form>\n);
  &printNormalFooter();
} # sub showStart

sub startProjectPage {
  &printNormalHeader();
  print qq(<form method="post" action="alaska.cgi">);
  my $shelltext = `/alaska/scripts/cgi_request.sh new_proj`;
  my $projectId = '';
  if ($shelltext =~ m/[^\w](\w+?): new project created/ms) { $projectId = $1; }
  print qq(Project ID $projectId created.<br/>);
  print qq(Upload all your files on the ftp server <a target="_blank" href="ftp://alaska.caltech.edu/projects/${projectId}/0_raw_reads/">here</a> and ONLY then, click on the button below to process the files.<br/>);
  print qq(<input type="hidden" name="projectId" value="$projectId">\n);
  print qq(<input type="submit" name="action" value="Infer Samples">\n);
  print qq(</form>\n);
  &printNormalFooter();
} # sub startProjectPage

sub inferSamplesPage {
  &printNormalHeader();
  print qq(<form method="post" action="alaska.cgi">);
  ($var, my $projectId)   = &getHtmlVar($query, 'projectId');
  print qq(Project ID $projectId<br/>\n);
  print qq(<input type="hidden" name="projectId" value="$projectId">\n);
  print qq(Calling : Request.sh infer_samples --id [PROJECT_ID]<br/>\n);
  my $shelltext = `/alaska/scripts/cgi_request.sh infer_samples --id $projectId`;
  print qq(Try to load projects/[PROJECT_ID]/_temp/[PROJECT_ID].json into editor<br/>);
#   Request.sh infer_samples --id [PROJECT_ID]
# This creates a .json file at
#   projects/[PROJECT_ID]/_temp/[PROJECT_ID].json
# (Still not sure what the filesystem root for this is)
  print qq(<input type="submit" name="action" value="Load JSON">\n);
  print qq(</form>\n);
  &printNormalFooter();
} # sub inferSamplesPage

sub selectJsonPage {
  &printNormalHeader();
  my (@dirs) = <${projectsDir}*>;
#   my (@files) = <${alaskaDataDir}*.json>;
  print qq(<form method="post" action="alaska.cgi">);
  print qq(Select a file to load :<br/>\n);
#   print qq(<select name="jsonFile">\n);
  print qq(<select name="projectId">\n);
  print qq(<option></option>);
#   foreach my $file (@files) {
#     my $name = $file;
#     $name =~ s/$alaskaDataDir//g;
# #     print qq(F $file N $name F<br/>);
#     print qq(<option>$name</option>\n);
#   } # foreach my $file (@files)
  foreach my $dir (@dirs) {
    my $name = $dir;
    $name =~ s/$projectsDir//g;
#     print qq(F $dir N $name F<br/>);
    print qq(<option>$name</option>\n);
  } # foreach my $file (@files)
  print qq(</select>\n);
  print qq(<input type="submit" name="action" value="Load JSON">\n);
  print qq(</form>\n);
  &printNormalFooter();
} # sub selectJsonPage

sub initFields {
  1;
} # sub initFields

sub printNormalHeader {
  my $title = 'Alaska';
  print "Content-type: text/html\n\n";
  print qq(<html><head><title>$title</title></head><body>\n);
} # sub printNormalHeader

sub printNormalFooter { print qq(</body></html>\n); }


sub untaint {
  my $tainted = shift;
  my $untainted;
  if ($tainted eq "") {
    $untainted = "";
  } else { # if ($tainted eq "")
    $tainted =~ s/[^\w\-.,;:?\/\\@#\$\%\^&*\>\<(){}[\]+=!~|' \t\n\r\f\"€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•—˜™š›œžŸ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþ]//g;	# added \" for wbpaper_editor's gene evidence data 2005 07 14   added \> and \< for wbpaper_editor's abstract data  2005 12 13
    if ($tainted =~ m/^([\w\-.,;:?\/\\@#\$\%&\^*\>\<(){}[\]+=!~|' \t\n\r\f\"€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•—˜™š›œžŸ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþ]+)$/) {
      $untainted = $1;
    } else {
      die "Bad data Tainted in $tainted";
    }
  } # else # if ($tainted eq "")
  return $untainted;
} # sub untaint

sub getHtmlVar {		# get variables from html form and untaint them
  no strict 'refs';		# need to disable refs to get the values
				# possibly a better way than this
  my ($query, $var, $err) = @_;	# get the CGI query val,
				# get the name of the variable to query->param,
				# get whether to display and error if no such
				# variable found
  unless ($query->param("$var")) {		# if no such variable found
    if ($err) {			# if we want error displayed, display error
      print "<FONT COLOR=blue>ERROR : No such variable : $var</FONT><BR>\n";
    } # if ($err)
  } else { # unless ($query->param("$var"))	# if we got a value
    my $oop = $query->param("$var");		# get the value
    $$var = &untaint($oop);			# untaint and put value under ref
    return ($var, $$var);			# return the variable and value
  } # else # unless ($query->param("$var"))
  # sample use
  # my @vars = qw(locus sequence clone);	# variables to get from html
  # foreach $_ (@vars) { my ($var, $val) = &getHtmlVar("$_"); }
				# get the value and set the variable and value
  # foreach $_ (@vars) { my ($var, $val) = &getHtmlVar("$_", 1); }
				# same, but with error display flag
} # sub getHtmlVar


__END__


sub loadJsonPageTemplates {
  &printNormalHeader();
  my (@files) = <${alaskaDataDir}*.json>;
  print qq(<form method="post" action="alaska.cgi">);

  ($var, my $filename)   = &getHtmlVar($query, 'jsonFile');
  print qq(<input type="hidden" name="jsonFile" value="$filename">\n);
  my ($jsonDataRef) = &loadJsonFile($filename);
  my %jsonData = %$jsonDataRef;
  &loadTemplates();

  print qq(<table>);

  foreach my $field (keys %jsonData) {
    if ($project{$field}{"visible"}) {
      my $label   = $project{$field}{"label"};
      my $tooltip = $project{$field}{"tooltip"};
      my $id      = "project_" . $field;
      my $data    = $jsonData{$field};
      my $type    = ref($data);
      if ($type eq 'HASH') {	# treat all hashes like hashes of arrays
          $data = '';
          foreach my $category (sort keys %{ $jsonData{$field} }) {
            $data .= qq($category<br/>);
            foreach my $entry (@{ $jsonData{$field}{$category} }) {
              $data .= qq( - $entry<br/>); }
            $data .= qq(<br/>\n);
          } }
        else {
          if ($project{$field}{"editable"}) {
            $data = qq(<input id="$id" name="$id" value="$jsonData{$field}"></input>); } }
      print qq(<tr><td>project</td><td>$label</td><td>$data</td></tr>\n);
    } # if ($project{$field}{"visible"})
  } # foreach my $field (sort keys %jsonData)

  foreach my $field (sort keys %{ $jsonData{"meta"} }) {
    if ($project{"meta"}{$field}{"visible"}) {
      my $label   = $project{"meta"}{$field}{"label"};
      my $tooltip = $project{"meta"}{$field}{"tooltip"};
      my $id      = "project_meta_" . $field;
      my $data    = $jsonData{"meta"}{$field};
      if ($project{"meta"}{$field}{"editable"}) {
        $data = qq(<input id="$id" name="$id" value="$jsonData{"meta"}{$field}"></input>); }
      print qq(<tr><td>project meta</td><td>$label</td><td>$data</td></tr>\n);
  } }



#   my $projectId  = $jsonData{'id'};
#   print qq(<tr><td>project</td><td>project id</td><td><input id='projectId' name='projectId' disabled value="$projectId"></input></td></tr>\n);
#   my $dir = $jsonData{'dir'};
#   print qq(<tr><td>project</td><td>dir</td><td><input id='dir' name='dir' disabled value="$dir"></input></td></tr>\n);
#
#   my $date_created = $jsonData{"meta"}{"date created"};
#   my $time_created = $jsonData{"meta"}{"time created"};
#   print qq(<tr><td>project</td><td>date created</td><td><input id='date_created' name='date_created' disabled value="$date_created"></input></td></tr>\n);
#   print qq(<tr><td>project</td><td>time created</td><td><input id='time_created' name='time_created' disabled value="$time_created"></input></td></tr>\n);

  foreach my $sample (sort keys %{ $jsonData{"samples"} }) {
    foreach my $field (sort keys %{ $jsonData{"samples"}{$sample} }) {
      if ($sample{$field}{"visible"}) {
        my $label   = $sample{$field}{"label"};
        my $tooltip = $sample{$field}{"tooltip"};
        my $id      = "sample_" . $sample . "_" . $field;
        my $data    = $jsonData{"samples"}{$sample}{$field};
        my $type    = ref($data);
        if ($type eq 'ARRAY') {	# treat all arrays as plain arrays
            $data = '';
            foreach my $entry (@{ $jsonData{"samples"}{$sample}{$field} }) {
              $data .= qq( - $entry<br/>); } }
          else {
            if ($sample{$field}{"editable"}) {
              $data = qq(<input id="$id" name="$id" value="$jsonData{"samples"}{$sample}{$field}"></input>); } }
        print qq(<tr><td>$sample</td><td>$label</td><td>$data</td></tr>\n);
      }
    }
    foreach my $field (sort keys %{ $jsonData{"samples"}{$sample}{"meta"} }) {
      if ($sample{"meta"}{$field}{"visible"}) {
        my $label   = $sample{"meta"}{$field}{"label"};
        my $tooltip = $sample{"meta"}{$field}{"tooltip"};
        my $id      = "sample_" . $sample . "_meta_" . $field;
        my $data    = $jsonData{"samples"}{$sample}{"meta"}{$field};
        if ($sample{"meta"}{$field}{"editable"}) {
          $data = qq(<input id="$id" name="$id" value="$jsonData{"samples"}{$sample}{"meta"}{$field}"></input>); }
        print qq(<tr><td>$sample meta</td><td>$label</td><td>$data</td></tr>\n);
    } }

#     my $id = $jsonData{"samples"}{$sample}{"id"};
#     my $name = $sample . '_id';
#     print qq(<tr><td>$sample</td><td>id</td><td><input id='$name' name='$name' disabled value="$id"></input></td></tr>\n);
#
#     my $type = $jsonData{"samples"}{$sample}{"type"};
#     $name = $sample . '_type';
#     print qq(<tr><td>$sample</td><td>type</td><td><input id='$name' name='$name' disabled value="$type"></input></td></tr>\n);
#
#     my $singlechecked = 'checked'; my $pairedchecked = '';
#     if ($type == 1) { $singlechecked = ''; $pairedchecked = 'checked'; }
#     my $name = $sample . '_singlepair';
#     print qq(<tr><td>$sample</td><td>single / paired</td><td>);
#     print qq(<input type="radio" id="$name" name="$name" $pairedchecked value="paired">paired<br/>);
#     print qq(<input type="radio" id="$name" name="$name" $singlechecked value="single">single<br/>);
#     print qq(</td></tr>\n);
#
#     my $length = $jsonData{"samples"}{$sample}{"length"};
#     $name = $sample . '_length';
#     print qq(<tr><td>$sample</td><td>length</td><td><input id='$name' name='$name' value="$length"></input></td></tr>\n);
#     my $stdev = $jsonData{"samples"}{$sample}{"stdev"};
#     $name = $sample . '_stdev';
#     print qq(<tr><td>$sample</td><td>stdev</td><td><input id='$name' name='$name' value="$stdev"></input></td></tr>\n);
#     my $date_created = $jsonData{"samples"}{$sample}{"meta"}{"date created"};
#     $name = $sample . '_date_created';
#     print qq(<tr><td>$sample</td><td>date_created</td><td><input id='$name' name='$name' disabled value="$date_created"></input></td></tr>\n);
#     my $time_created = $jsonData{"samples"}{$sample}{"meta"}{"time created"};
#     $name = $sample . '_time_created';
#     print qq(<tr><td>$sample</td><td>time_created</td><td><input id='$name' name='$name' disabled value="$time_created"></input></td></tr>\n);
#     my (@reads) = @{ $jsonData{"samples"}{$sample}{"reads"} };
#     print qq(<tr><td>$sample</td><td>reads</td><td>);
#     foreach my $read (@reads) { print qq(<input size="100" disabled value="$read"><br/>\n); }
#     print qq(</td></tr>\n);

  } # foreach my $sample (sort keys %{ $jsonData{"samples"} })

#   my @rawreads   =
#   print qq(ID $projectId<br/>\n);
#   print qq(Dir $projectDir<br/>\n);

  print qq(</table>\n);

  print qq(<input type="submit" name="action" value="Update JSON">\n);
  print qq(</form>\n);
  &printNormalFooter();
} # sub loadJsonPageTemplates
