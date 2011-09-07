#!/usr/bin/python

input_path = 'src/'
output_path = 'www/soda.js'

import os, sys, time

license = '''/*
Copyright (C) 2011 Evan Wallace

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program. If not, see http://www.gnu.org/licenses/.
*/

'''

def compile(sources):
    return license + '\n'.join(open(f).read() for f in sources)

def sources():
    return [os.path.join(base, f) for base, folders, files in \
        os.walk(input_path) for f in files if f.endswith('.js')]

def build():
    data = compile(sources())
    print 'built %s (%u lines)' % (output_path, len(data.split('\n')))
    open(output_path, 'w').write(data)

def stat():
    return [os.stat(file).st_mtime for file in sources()]

def monitor():
    a = stat()
    while True:
        time.sleep(0.5)
        b = stat()
        if a != b:
            a = b
            build()

if __name__ == '__main__':
    build()
    if 'release' not in sys.argv:
        monitor()
