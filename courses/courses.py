import os
import re

class Course:
    def __init__(self):
        self.name = ''
        self.title = ''
        self.attributes = ''
        self.description = ''
        self.semesters = [] # list of Semester objects

class Semester:
    def __init__(self):
        self.name = ''
        self.exam_time = ''
        self.exam_date = ''
        self.sections = [] # list of Section objects

class Section:
    def __init__(self):
        self.crn = 0
        self.levels = ''
        self.xlist_data = ''
        self.registration_dates = ''
        self.meetings = [] # list of Meeting objects

class Meeting:
    def __init__(self):
        self.type = ''
        self.days = ''
        self.time = ''
        self.where = ''
        self.date_range = ''
        self.instructors = ''

################################################################################
# using banner library
################################################################################

def generate_js():
    if not os.path.exists('banner.pickle'):
        print 'downloading course info...'
        import urllib
        url = 'https://github.com/downloads/evanw/banner/banner.pickle'
        open('banner.pickle', 'w').write(urllib.urlopen(url).read())

    print 'fixing course info...'
    import pickle
    courses = pickle.load(open('banner.pickle'))
    fix_courses(courses)

    print 'writing javascript...'
    js = courses_to_js(courses)
    open('courses.js', 'w').write(js)

    print 'running output through google closure compiler...'
    small_js = google_closure_compiler(js)
    open('../www/courses.js', 'w').write(small_js)

    print 'running output through gzip...'
    os.system('gzip -c9 ../www/courses.js > ../www/courses.js.gz')

def fix_courses(courses):
    for course in courses:
        for semester in course.semesters:
            for section in semester.sections:
                if section.meetings:
                    if not all(m.type == section.meetings[0].type for m in section.meetings):
                        print 'warning(%s): meeting types are different: %s' % (course.name, ', '.join(m.type for m in section.meetings))
                elif not section.xlist_data:
                    print 'warning(%s): no meetings for section %s, removing section' % (course.name, section.crn)
                    semester.sections.remove(section)
                for meeting in section.meetings:
                    meeting.type = meeting.type \
                        .replace('Laboratory', 'Lab') \
                        .replace('Arranged (Instructor)', 'Arranged') \
                        .replace('Conference/Discussion', 'Conference')
                    meeting.time = meeting.time \
                        .replace(':00', '') \
                        .replace(' am', 'am') \
                        .replace(' pm', 'pm')
                    meeting.where = meeting.where \
                        .replace('Watson (CIT) Center', 'CIT') \
                        .replace('Salomon Center', 'Salomon') \
                        .replace('To Be Determined', 'TBA')
                    meeting.instructors = ', '.join(
                        re.sub(' \w\.|', '', i.replace('(P)', '')).strip()
                        for i in meeting.instructors.split(','))
                section.xlist_data = '\n'.join(x.strip() for x in section.xlist_data.split('\n') if x.strip())
            if not semester.sections:
                print 'warning(%s): semester %s has no sections, removing semester' % (course.name, semester.name)
                course.semesters.remove(semester)

################################################################################
# google closure compiler
################################################################################

def google_closure_compiler(js):
   import subprocess
   p = subprocess.Popen(['java', '-jar', 'compiler.jar', '--compilation_level', \
      'SIMPLE_OPTIMIZATIONS'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
   p.stdin.write(js)
   p.stdin.close()
   return p.stdout.read()

################################################################################
# json export
################################################################################

def courses_to_js(courses):
    import json
    courses_json = courses_to_json(courses)
    return 'var semesters = %s;\nvar courses = %s;\n' % \
        (json.dumps(courses_json['semesters']), json.dumps(courses_json['courses'], indent=1))

def courses_to_json(courses):
    json_courses = []
    all_semesters = []
    for course in courses:
        json_semesters = {}
        for semester in course.semesters:
            if semester.name not in all_semesters:
                all_semesters.append(semester.name)
            json_sections = {}
            for section in semester.sections:
                section_type = section.meetings[0].type if section.meetings else 'Crosslist'
                json_meetings = []
                json_section = {
                    'crn': section.crn,
                    'meetings': json_meetings
                }
                if section_type == 'Crosslist':
                    json_section['xlist'] = section.xlist_data
                json_sections.setdefault(section_type, []).append(json_section)
                for meeting in section.meetings:
                    json_meetings.append({
                        'days': meeting.days,
                        'time': meeting.time,
                        'where': meeting.where,
                        'instructors': meeting.instructors
                    })
            json_semesters[semester.name] = json_sections
        json_courses.append({
            'name': course.name,
            'title': course.title,
            'description': course.description,
            'sections': json_semesters
        })
    return {
        'semesters': all_semesters,
        'courses': json_courses
    }

################################################################################
# unit tests
################################################################################

import unittest

class Tester(unittest.TestCase):
    def test_courses_to_json(self):
        import json

        course = Course()
        course.name = 'CSCI 1230'
        course.title = 'title'
        course.description = 'description'

        semester = Semester()
        semester.name = 'Fall 2009'
        course.semesters.append(semester)

        semester = Semester()
        semester.exam_date = 'exam date'
        semester.exam_time = 'exam time'
        semester.name = 'Spring 2010'
        course.semesters.append(semester)

        section = Section()
        section.crn = 1
        meeting = Meeting()
        meeting.type = 'Class'
        meeting.instructors = 'avd'
        section.meetings.append(meeting)
        semester.sections.append(section)

        section = Section()
        section.crn = 2
        meeting = Meeting()
        meeting.type = 'Class'
        meeting.days = 'days'
        meeting.time = 'time'
        meeting.where = 'where'
        meeting.instructors = 'spr'
        section.meetings.append(meeting)
        semester.sections.append(section)

        section = Section()
        section.crn = 3
        meeting = Meeting()
        meeting.type = 'Lab'
        meeting.instructors = 'avd'
        section.meetings.append(meeting)
        semester.sections.append(section)

        generated_json = courses_to_json([course])
        manual_json = {
            'semesters': [
                'Fall 2009',
                'Spring 2010'
            ],
            'courses': [{
                'name': 'CSCI 1230',
                'title': 'title',
                'description': 'description',
                'sections': {
                    'Fall 2009': {},
                    'Spring 2010': {
                        'Class': [{
                            'crn': 1,
                            'meetings': [{
                                'instructors': 'avd',
                                'where': '',
                                'days': '',
                                'time': ''
                            }]
                        }, {
                            'crn': 2,
                            'meetings': [{
                                'instructors': 'spr',
                                'where': 'where',
                                'days': 'days',
                                'time': 'time'
                            }]
                        }],
                        'Lab': [{
                            'crn': 3,
                            'meetings': [{
                                'instructors': 'avd',
                                'where': '',
                                'days': '',
                                'time': ''
                            }]
                        }]
                    }
                }
            }]
        }
        self.assertEquals(generated_json, manual_json)

if __name__ == '__main__':
    import sys
    if 'test' in sys.argv:
        sys.argv.remove('test')
        unittest.main()
    else:
        generate_js()
