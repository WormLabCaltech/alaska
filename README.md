# Alaska: Automated and friendly RNA-seq analysis

RNA-sequencing (RNA-seq) provides a way to quantify differential gene expression and is used to discover novel gene functions and pathways. Although the molecular biology behind RNA-seq is fully understood, analysis of the data remains a significant bottleneck. Here, we introduce a RNA-seq framework that will allow analysis within hours of an RNA-seq experiment.

## Getting Started
These instructions will install the Alaska server on your local machine for development and testing purposes. Everything has only been tested on Ubuntu 16.04.

### Prerequisites & Dependencies
* [Python 3.6.x](https://www.python.org/)
* [ZeroMQ](http://zeromq.org/)\*
* [Docker](https://www.docker.com/)
* [pyunpack](https://pypi.org/project/pyunpack/)

###### The following Python libraries are also needed.
* [ZeroMQ Python Binding](http://zeromq.org/bindings:python)\*
* [Pandas](https://pandas.pydata.org/)\*
* [Docker SDK for Python](https://docker-py.readthedocs.io/en/stable/)

\*: These are included with [Anaconda 3.6.x](https://www.anaconda.com/)

### Installing
Once you `git pull` or `git clone` Alaska, run `Setup.sh` to get everything set up. The script creates the following containers
* alaska
* alaska_request
* alaska_qc
* alaska_kallisto
* alaska_sleuth

and the following data volumes
* alaska_script_volume
* alaska_data_volume

### Starting the Server
Once you have run `Setup.sh` without any errors, you can start the server by running `Start.sh`. The server will output something like the following:
```
~$ Start.sh
[2018-04-30 14:22:36] INFO: AlaskaServer initialized
[2018-04-30 14:22:36] INFO: starting AlaskaServer dev
[2018-04-30 14:22:36] INFO: checking admin privilages
[2018-04-30 14:22:36] INFO: --force flag detected...bypassing instance check
[2018-04-30 14:22:36] INFO: starting logger
[2018-04-30 14:22:36] INFO: updating organisms
[2018-04-30 14:22:36] INFO: detected new organism - caenorhabditis_elegans_235
[2018-04-30 14:22:36] INFO: starting 1 workers
```

### Adding Model Organisms
Alaska requires the organism's *CDNA*, *DNA*, and *bed* files for it to be used in analyses. To add a new organism to Alaska, simply create the appropriate folders in the `organisms` directory according to the following scheme:
```
organisms/[GENUS]/[SPECIES]/[REFERENCE_VERSRION]/reference
```
Place the three files (they can be archived) in the `reference` folder and either restart the server or manually run an organism update by issuing the following command:
```
Request.sh update_orgs
```

### Loading Previous Server State
Every 5 minutes (may be changed in the future) AND whenever the server is turned off, it saves its state in the `saves` directory. The most recent save can be loaded by first starting the server and then issuing the following command:
```
Request.sh load
```

## The Pipeline
Alaska aims to make RNA-seq analysis as seamless and intuitive as possible by eliminating the need to work with and move data to and from multiple software. Here, we describe the analysis pipeline. All commands to the server are made by running `Request.sh`.

### Creating a new project.
New projects are created by issuing the following command:
```
~$ Request.sh new_proj
INFO: Creating new_proj request
INFO: Connecting to server on port 8888
INFO: Connected successfully
INFO: Waiting for response
------------------------------
APjvz31r: new project created
END
```
The server itself outputs the following:
```
[2018-04-30 14:28:14] b'_lmde': received b'\x00'
[2018-04-30 14:28:14] b'_lmde': received b'\x01'
[2018-04-30 14:28:14] APjvz31r: ./projects/APjvz31r/_temp created
[2018-04-30 14:28:14] APjvz31r: ./projects/APjvz31r/0_raw_reads created
[2018-04-30 14:28:14] APjvz31r: ./projects/APjvz31r/1_qc created
[2018-04-30 14:28:14] APjvz31r: ./projects/APjvz31r/2_alignment created
[2018-04-30 14:28:14] APjvz31r: new project created
```

From here on, every instance of `*APjvz31r*` refers to the project ID.

Once a new project is created, the user should be given FTP access to `projects/*APjvz31r*/0_raw_reads` as the root directory.

### Uploading raw reads
Raw reads are uploaded via FTP to `projects/*APjvz31r*/0_raw_reads`. Every sample *must* be in separate folders. Once the user is finished uploading, they will indicate through the **portal** that they are done. The **portal** runs the following command
```
~$ Request.sh infer_samples --id *APjvz31r*
ID: AP7yrvax
INFO: Creating infer_samples request
INFO: Connecting to server on port 8888
INFO: Connected successfully
INFO: Waiting for response
------------------------------
AP7yrvax: getting raw reads
AP7yrvax: calculating MD5 checksums
AP7yrvax: successfully retrieved raw reads
END
```
The server itself outputs the following:
```
[2018-04-30 14:40:25] b'AP7yrvax': received b'\x00'
[2018-04-30 14:40:25] b'AP7yrvax': received b'\x04'
[2018-04-30 14:40:25] AP7yrvax: getting raw reads
[2018-04-30 14:40:25] AP7yrvax: calculating MD5 checksums
[2018-04-30 14:40:34] AP7yrvax: successfully retrieved raw reads
[2018-04-30 14:40:34] AP7yrvax: inferring samples from raw reads
/alaska/scripts/AlaskaProject.py:131: Warning: AP7yrvax: Alaska is currently unable to infer paired-end samples
  .format(self.id), Warning)
[2018-04-30 14:40:34] AP7yrvax: new sample created with id AS5t8c64
[2018-04-30 14:40:34] AP7yrvax: new sample created with id ASs2o36f
[2018-04-30 14:40:34] AP7yrvax: new sample created with id ASar7qdh
[2018-04-30 14:40:34] AP7yrvax: new sample created with id AS13ub9r
[2018-04-30 14:40:34] AP7yrvax: new sample created with id ASi5km2q
[2018-04-30 14:40:34] AP7yrvax: new sample created with id AStv68sl
[2018-04-30 14:40:34] AP7yrvax: samples successfully inferred
[2018-04-30 14:40:34] AP7yrvax: saved to temp folder
```

### Setting Metadata & Finalizing Project
The user must now fill out metadata for the project. The **portal** reads information from the temporary JSON located at `projects/*APjvz31r*/_temp/*APjvz31r*.json`. Information for which model organism the user is using is fetched from `organisms/jsons`. Once the user indicates that they are done filling out metdata, the **portal** writes all the information in the *same* JSON format to `projects/*APjvz31r*/*APjvz31r*.json` and runs the following command
```
~$ Request.sh set_proj --id *APjvz31r*
ID: AP7yrvax
INFO: Creating set_proj request
INFO: Connecting to server on port 8888
INFO: Connected successfully
INFO: Waiting for response
------------------------------
AP7yrvax: setting project data
AP7yrvax: validating data
AP7yrvax: project data successfully set
END
```
The server itself outputs the following
```
[2018-04-30 14:46:58] b'AP7yrvax': received b'\x00'
[2018-04-30 14:46:58] b'AP7yrvax': received b'\x07'
[2018-04-30 14:46:58] AP7yrvax: setting project data
[2018-04-30 14:46:58] AP7yrvax: validating data
/alaska/scripts/AlaskaProject.py:169: Warning: AP7yrvax: Alaska is currently unable to verify experimental designs
  Warning)
[2018-04-30 14:46:58] AP7yrvax: project data successfully set
```

If the server detects an error in the input data, it responds with a line that contains `ERROR`. *Only if* this did not happen, the **portal** then issues this command
```
~$ Request.sh finalize_proj --id *APjvz31r*
ID: AP7yrvax
INFO: Creating finalize_proj request
INFO: Connecting to server on port 8888
INFO: Connected successfully
INFO: Waiting for response
------------------------------
AP7yrvax: finalizing
AP7yrvax: projects/AP7yrvax/_temp/AP7yrvax.json removed
AP7yrvax: successfully finalized
END
```
The server itself outputs the following
```
[2018-04-30 14:51:42] b'AP7yrvax': received b'\x00'
[2018-04-30 14:51:42] b'AP7yrvax': received b'\x08'
[2018-04-30 14:51:42] AP7yrvax: finalizing
[2018-04-30 14:51:42] AP7yrvax: projects/AP7yrvax/_temp/AP7yrvax.json removed
[2018-04-30 14:51:42] AP7yrvax: successfully finalized
```

**_Note that finalized projects are FINAL -- they can never be changed._**

### Starting Analysis
The analysis pipeline is started with the following command:
```
~$ Request.sh do_all --id *APjvz31r*
ID: AP7yrvax
INFO: Creating do_all request
INFO: Connecting to server on port 8888
INFO: Connected successfully
INFO: Waiting for response
------------------------------
AP7yrvax: performing all analyses
END
```

Alaska automatically runs **quality control**, **read alignment & quantification** and **differential expression analysis**. Once finished, it notifies the user via email that the analysis is complete.

### Visualizing the Results
Data visualization is done via the Sleuth Shiny web application. The Shiny web app can be opened with the following command:
```
~$ Request.sh open_sleuth_server --id *APjvz31r*
ID: APk70uwv
INFO: Creating open_sleuth_server request
INFO: Connecting to server on port 8888
INFO: Connected successfully
INFO: Waiting for response
------------------------------
APk70uwv: starting Sleuth shiny app
APk70uwv: server opened on port 42427
END
```

*This part of the pipeline is still in progress.*












