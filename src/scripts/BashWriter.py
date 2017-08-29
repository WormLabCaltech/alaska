import io
from Alaska import Alaska

class BashWriter(Alaska):
    """
    BashWriter.
    Writes bash scripts.
    """
    SHEBANG = '#!/usr/bin/env bash\n#'
    PREFIX = '# This is where some meaningful message about Alaska and\n \
                # this script is written.\n#'
    SUFFIX = '# end of bash script'

    def __init__(self, fname, folder=None):
        self.fname = fname

        if folder is None:
            path = './'
        else:
            path = './{}'.format(folder)
        self.dir = path
        self.commands = [] # lines of commands

    def add(self, command=''):
        """
        Adds a command.
        """
        self.commands.append(command)

    def write(self):
        """
        Writes bash script.
        """
        if len(self.commands) > 0:
            with io.open('{}/{}.sh'.format(self.dir, self.fname), 'w', newline='\n') as sh:
                # write shebang and prefix
                sh.write(self.SHEBANG + '\n')
                sh.write(self.PREFIX + '\n')

                # write commands
                for command in self.commands:
                    # TODO: linebreak for long lines
                    sh.write(command + '\n')

                # write suffix
                sh.write(self.SUFFIX)