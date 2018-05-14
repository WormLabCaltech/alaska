# Specifications for Project Data Input and Project JSON

This README details the specifications for how users provide Alaska with their experiment data/information via the **portal**. All user-input data, along with all project metadata, are saved in JSON format. An example JSON can be found here: [example.json](example.json). The contents of this JSON will be used as examples to describe each field and their functions. Every project has its own JSON file in its corresponding project directory. From here on, everything is described in relation to the metadata collection form, which the **portal** asks the users to complete after uploading their raw reads.

## JSON Field Descriptions
This section describes each field in the JSON: its purpose, its use and how it should be shown on the **portal**.

### id
* Every project is assigned a unique identifier (ID) by the server when the project is created via the `Request.sh new_proj` command.
* The project ID is the only way the server differentiates projects.
* The ID itself is not very relevant to the user, but the user should be able to see it (not edit it).

### dir, qc_dir, raw_dir, align_dir, diff_dir, temp_dir
* Specify the paths to directories that are relevant to the analyses. All of these paths are relative from the root folder of the server. Specifically, *dir* is the path to the project directory, *qc_dir* the path to the quality control directory, *raw_dir* to the raw reads directory, *align_dir* to the read alignment & quantification directory, *diff_dir* to the differential expression analysis directory and *temp_dir* to the temporary directory.
* All of these paths are purely for internal use. The **portal** should not display these fields.

### jobs
* Contains a list of *job* ID's that are linked to this project. A *job* is created for each step of the analysis. A project that has been completely analyzed will most likely have four jobs.
* Internal use. Should not be displayed on the **portal**.

### raw_reads
* Dictionary of raw read files with the folder name as the keys and a list of the files in those folders as values.
* Not displayed on the **portal**.

### chk_md5
* Dictionary of MD5 hashes corresponding to the read files in the previous field. The folder names as the keys and list of hashes as values.
* Not displayed on the **portal**.

### samples
* Dictionary of objects, with the sample ID as the keys and encodings of AlaskaSample objects as the values.
* Each sample is independent of the other and should be displayed on the **portal** as such.
* An explanation of the fields of every sample object is below.

###### Sample Object Field Descriptions
* **id**: Unique identifier (ID) for the sample. Primarily for internal use, but the user should still be able to see it (but not edit it).
* **name**: The name for this sample. More human-friendly than the ID. Taken from the folder name that the user uploaded the sample in. Not editable.
* **type**: Specifies whether the reads are single- or paired-end. Single-end reads have an integer 1 in this field and paired-end read have an integer 2. Radio buttons to choose between the two.
* **organism**: The model organism of the sample. The user selects the organism from a drop down menu. The selections are fetched from `organisms/jsons`. This folder contains JSON files for each organism. The drop down selections are simply the list of JSON files in this folder without the `.json` extension.
* **ref_ver**: The model organism reference version. The user selects the version from a drop down menu. The possible selections change depending on what model organism the user chose previously. The list of possible reference versions for a given organism is fetched from the `refs` field of the organism JSON itself, in `organisms/jsons`. An example organism JSON is here: [caenorhabditis_elegans.json](caenorhabditis_elegans.json).
* **length**: The read length. The user is able to input an integer between 50 and 400.
* **stdef**: The standard deviation of the read lengths. The user able to input an integer between 20 and 100.
* **boostrap_n**: The number of bootstraps to perform. Always set to 200.
* **reads**: The raw reads corresponding to this sample. List of strings that are the paths to each read file.
* **chk_md5**: The MD5 checksums corresponding to the read files.
* **projects**: List of project IDs that are linked to this sample. Internal use only.
* **meta**: Other relevant metadata about this sample.


