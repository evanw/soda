#!/usr/bin/python

input_path = 'src/'
output_path = 'www/soda.js'

import re, os, sys, time, tempfile

header = '''/*
Copyright (C) 2011 Evan Wallace
Source code: https://github.com/evanw/soda

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

def sources():
    return [os.path.join(base, f) for base, folders, files in \
        os.walk(input_path) for f in files if f.endswith('.js')]

def compile(sources):
    return '\n'.join('// %s\n%s' % (path, open(path).read()) for path in sources)

def build():
    data = compile(sources())
    if 'release' in sys.argv:
        f1, temp1_path = tempfile.mkstemp()
        f2, temp2_path = tempfile.mkstemp()
        os.write(f1, data)
        os.close(f1)
        os.close(f2)
        os.system('java -jar courses/compiler.jar --js %s --js_output_file %s' % (temp1_path, temp2_path))
        os.remove(temp1_path)
        data = open(temp2_path).read()
        os.remove(temp2_path)
    data = header + data
    open(output_path, 'w').write(data)
    print 'built %s (%u lines)' % (output_path, len(data.split('\n')))

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
    if 'debug' in sys.argv:
        monitor()
