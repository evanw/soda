var search = {
  _lastQuery: '',
  _matchedCRN: false,
  _queryWordCount: 0,
  _equalsRegex: null,
  _startsWithRegex: null,
  _matchesToBeAdded: [],
  _defaultContent: '<h1>Soda</h1><p id="tagline">A course browser for Brown University</p><p>Soda replaces Banner\'s complex interface with one simple search box, except there\'s no search button because searching is instant. It searches all courses in Spring and Fall 2011, just type something in the orange bar to get started! You can type pretty much anything, including:</p><ul><li>CRNs: <a class="example" href="javascript:search.go(\'10492\')">10492</a></li><li>Places: <a class="example" href="javascript:search.go(\'sayles\')">sayles</a></li><li>Professors: <a class="example" href="javascript:search.go(\'shriram\')">shriram</a></li><li>Semesters: <a class="example" href="javascript:search.go(\'spring\')">spring</a></li><li>Departments: <a class="example" href="javascript:search.go(\'geo\')">geo</a></li><li>Course titles: <a class="example" href="javascript:search.go(\'comp photo\')">comp photo</a></li><li>Days of the week: <a class="example" href="javascript:search.go(\'mwf\')">mwf</a></li><li>Course descriptions: <a class="example" href="javascript:search.go(\'fys\')">fys</a></li><li>Course abbreviations: <a class="example" href="javascript:search.go(\'econ11\')">econ11</a></li></ul><ul><li>Any combination of the above: <a class="example" href="javascript:search.go(\'s/nc engl mwf\')">s/nc engl mwf</a></li></ul><p>Soda runs best in Chrome and Safari (but also works in Firefox) and was made by <a href="http://madebyevan.com/">Evan Wallace</a> in 2010.</p>',

  load: function() {
    function checkForChange() {
      setTimeout(function() {
        search._queryMaybeChanged();
      }, 10);
    }
    $('#search').focus();
    $('#search').val('');
    $('#search').keydown(checkForChange);
    $('#search').focus(checkForChange);
    $('#content').html(this._defaultContent);
    setInterval(function() {
      search._updateResults();
    }, 50);
  },

  // run a query just like the user typed it
  go: function(text) {
    $('#search').focus();
    $('#search').val(text);
    this._queryMaybeChanged();
  },

  // restart the search (useful when a search setting changes)
  startOver: function() {
    this._lastQuery = '';
    this._queryMaybeChanged();
  },

  // call to expand a course from a smaller representation to the full representation
  // (id is the value of the id attribute on the div, which looks like 'csci1230')
  expandCourse: function(id) {
    var course = this._courseFromID(id);
    $('#' + id).attr('title', '');
    $('#' + id).attr('href', 'javascript:search.contractCourse(\'' + id + '\')');
    $('#' + id).html(this._courseToHTML(course, 3));
  },

  // call to contract a course from the full representation to a smaller representation
  // (id is the value of the id attribute on the div, which looks like 'csci1230')
  contractCourse: function(id) {
    var course = this._courseFromID(id);
    $('#' + id).attr('title', 'Click to expand ' + course.name);
    $('#' + id).attr('href', 'javascript:search.expandCourse(\'' + id + '\')');
    $('#' + id).html(this._courseToHTML(course, options.courseDetail));
  },

  // call to expand all collapsed sections in a course, which happens if there are five or more similar sections
  // (id is the value of the id attribute on the div, which looks like 'csci1230')
  expandSections: function(id) {
    $('#' + id + '-sections').html(this._sectionsToHTML(this._courseFromID(id).sections));
  },

  // convert a course name like 'CSCI 1230' to an html id like 'csci1230'
  _nameToID: function(name) {
    return name.toLowerCase().replace(/ /g, '');
  },

  // look up a course object from an html id like 'csci1230'
  _courseFromID: function(id) {
    for (var i = 0; i < courses.length; i++) {
      if (id == this._nameToID(courses[i].name)) {
        return courses[i];
      }
    }
    throw 'could not find course for id ' + id;
  },

  // returns the text for a section, used both for search and display
  _textForSection: function(section) {
    if (section.meetings.length == 0)
      return section.type;
    var text = section.type;
    var instructors = section.meetings[0].instructors;
    var hasDifferentInstructors = false;
    for (var i = 0; i < section.meetings.length; i++) {
      if (section.meetings[i].instructors != instructors) {
        hasDifferentInstructors = true;
      }
    }
    if (!hasDifferentInstructors)
      text += ' ~ ' + instructors;
    for (var i = 0; i < section.meetings.length; i++) {
      var meeting = section.meetings[i];
      var hasDays = (meeting.days != '' && meeting.days != 'TBA');
      var hasTime = (meeting.time != '' && meeting.time != 'TBA');
      var hasPlace = (hasDays || hasTime);
      if (hasDifferentInstructors || hasDays || hasTime || hasPlace) text += ' ~ ';
      if (hasDifferentInstructors) text += meeting.instructors;
      if (hasDays) text += meeting.days;
      if (hasTime) text += ' from ' + meeting.time.replace(' - ', ' to ');
      if (hasPlace) text += ' in ' + meeting.where;
    }
    return text;
  },

  // create a html representation of the given section
  _sectionToHTML: function(section) {
    if (section.type == 'Crosslist') {
      var html = '<span class="xlist">';
      var lines = section.xlist.split('\n');
      for (var i = 0; i < lines.length; i++) {
        lines[i] = textToHTML(lines[i]);

        // if the line has numbers in it it's probably a course
        if (/[0-9]/.test(lines[i])) {
          if (i && lines[i - 1].indexOf('The following') == -1 && !(/[0-9]/.test(lines[i - 1])))
            lines[i - 1] = '<br><b>' + lines[i - 1] + '</b>';

          // link to valid courses
          var words = lines[i].split(' ');
          if (words.length >= 2) {
            lines[i] = '<a href="javascript:search.go(\'' + textToHTML(words[0]) + ' ' + textToHTML(words[1]) + '\')">' + lines[i] + ' (search)</a>';
          }
        }
      }
      for (var i = 0; i < lines.length; i++)
        html += lines[i] + '<br>';
      return html + '</span>';
    }

    var text = this._textForSection(section);
    var html = '<a class="section" href="javascript:cart.addCRN(' + section.crn + ')">';
    html += (options.shouldSearchSections ? this._highlightQuery(text) : textToHTML(text));
    return html + ' (add to cart)</a>';
  },

  // create a html representation of the given list of sections, assuming they all have the same type
  // (if expansionHref is given and there are five or more sections, this will create a
  // collapsed link that points to expansionHref instead of a list of all the sections)
  _sectionTypeToHTML: function(sections, expansionHref) {
    var html = '';
    if (!options.shouldCollapseSimilarSections || expansionHref == undefined || sections.length < 5) {
      for (var i = 0; i < sections.length; i++)
        html += this._sectionToHTML(sections[i]);
    } else {
      // collapse multiple sections into one
      html += '<a class="section" href="' + expansionHref + '">' + sections[0].type;
      html += ' (show all ' + sections.length + ' sections)';

      // show a '...' if stuff matches in the collapsed section
      if (options.shouldSearchSections) {
        for (var i = 0; i < sections.length; i++) {
          var text = this._textForSection(sections[i]);
          if (this._startsWithRegex.test(text)) {
            html += ' <span class="match">&hellip;</span>';
            break;
          }
        }
      }

      html += '</a>';
    }
    return html;
  },

  // return the html representation of all the sections for a course (if expansionHref is given,
  // sections of the same type will be collapsed into links that point to expansionHref as needed)
  _sectionsToHTML: function(semesters, expansionHref) {
    var html = '<table>';
    for (var semester in semesters) {
      html += '<tr><td class="semester">' + (options.shouldSearchSections ? this._highlightQuery(semester) : semester) + '</td><td>';
      var sections = semesters[semester];

      // special case classes so they come out on top
      if ('Class' in sections)
        html += this._sectionTypeToHTML(sections['Class'], expansionHref);
      for (var sectionType in sections) {
        if (sectionType != '' && sectionType != 'Class') {
          html += this._sectionTypeToHTML(sections[sectionType], expansionHref);
        }
      }

      html += '</td></tr><tr><td colspan="2" class="spacer">&nbsp;</td></tr>';
    }
    return html + '</table>';
  },

  // return the html representation for a course at the given detail level where
  // 1 = just title
  // 2 = title and description
  // 3 = everything
  _courseToHTML: function(course, detail) {
    var html = '';
    var name = this._highlightQuery(course.name);
    var title = this._highlightQuery(course.title);
    if (detail == 1) {
      html += '<h4><b>' + name + '</b> ' + title + '</h4>';
    } else {
      var description = (options.shouldSearchDescriptions ? this._highlightQuery(course.description) : textToHTML(course.description));
      if (detail == 2) {
        html += '<h3>' + name + ': ' + title + '</h3>';
        html += '<p>' + description + '</p>';
      } else {
        html += '<h2>' + name + ': ' + title + '</h2>';
        if (options.shouldShowLinks) {
          html += '<p style="text-align:center;">';
          if (course.name.indexOf('CSCI') == 0) html += ' <a href="http://cs.brown.edu/courses/' + course.name.toLowerCase().replace(/ /g, '') + '/" target="_blank" title="Opens in a new window">View course website</a> |';
          html += ' <a href="http://www.thecriticalreview.org/cr_xml.php?action=browse&quicksearch=' + course.name.replace(/ /g, '+') + '" target="_blank" title="Opens in a new window">Search the Critical Review</a>';
          html += '</p>';
        }
        html += '<p>' + description + '</p>';

        // pre-expand the text if we matched a CRN, since it's the only thing there and we don't need to worry about crowding the results
        var id = this._nameToID(course.name);
        html += '<div id="' + id + '-sections">' + this._sectionsToHTML(course.sections, this._matchedCRN ? null : 'javascript:search.expandSections(\'' + id + '\')') + '</div>';
      }
    }
    return html;
  },

  // see if the query has changed and restart the search if it has
  _queryMaybeChanged: function() {
    // don't search again if the user didn't change anything (could happen if the user presses the arrow keys, for example)
    var query = $('#search').val();
    if (query == this._lastQuery) return;
    this._lastQuery = query;

    // just show help if they have an empty query
    if (!this._compileRegexForQuery(query)) {
      this._matchesToBeAdded = [];
      $('#content').html(this._defaultContent);
      return;
    }

    // make sure the best result shows up on top
    window.scrollTo(0, 0);

    // perform the query and sort the results
    this._matchesToBeAdded = this._matchesForQuery();
    this._matchesToBeAdded.sort(function(a, b) {
      if (a.score == b.score) return (a.course.name > b.course.name) - (a.course.name < b.course.name);
      return b.score - a.score;
    });

    // set up result streaming and get the initial batch
    var len = this._matchesToBeAdded.length;
    $('#content').html('<p id="footer">' + (len == 1 ? '1 result' : len + ' results') + '</p>');
    this._updateResults();
  },

  // browsers take a while to update the DOM with a lot of elements, so load the results into
  // the DOM asynchronously (that way stuff shows up instantly, even if it's not all there)
  _updateResults: function() {
    var len = Math.min(50, this._matchesToBeAdded.length);
    if (len == 0) return;
    var html = '';
    for (var i = 0; i < len; i++) {
      var course = this._matchesToBeAdded[i].course;
      var id = this._nameToID(course.name);
      html += (options.courseDetail == 3 ? '<div' : '<a title="Click to expand ' + course.name + '" href="javascript:search.expandCourse(\'' + id + '\')"') + ' class="course" id="' + id + '">';
      html += this._courseToHTML(course, options.courseDetail);
      html += (options.courseDetail == 3 ? '</div>' : '</a>');
    }
    $('<div>' + html + '</div>').insertBefore('#footer');
    this._matchesToBeAdded.splice(0, len);
  },

  // split text into substrings that either match or don't match the stored query (this may look
  // too simple but IE's implementation of String.split() is different and will need to be fixed)
  _splitTextWithQuery: function(text) {
    return text.split(this._startsWithRegex);
  },

  // returns the HTML for highlighting text with query
  _highlightQuery: function(text) {
    var fragments = this._splitTextWithQuery(textToHTML(text));
    var html = '';
    for (var i = 0; i < fragments.length; i++) {
      var fragment = fragments[i];
      if (this._equalsRegex.test(fragment)) html += '<span class="match">' + fragment + '</span>';
      else html += fragment;
    }
    return html;
  },

  // returns a list of matching courses as { course, score } objects
  _matchesForQuery: function() {
    // if the query is a CRN, just return the course
    this._matchedCRN = false;
    var crn = this._lastQuery.replace(/ /g, '');
    var crnInt = parseInt(crn, 10);
    if (crn == crnInt && (crnInt in crnMap)) {
      this._matchedCRN = true;
      return [{ 'course': crnMap[crnInt].course, 'score': 0 }];
    }

    var matches = [];
    for (var i = 0; i < courses.length; i++) {
      // see if we have a match
      var course = courses[i];
      var text = course.name + ': ' + course.title;
      if (options.shouldHideCoursesWithoutSections) {
        var hasSections = false;
        for (var semester in course.sections) {
          hasSections = true;
          break;
        }
        if (!hasSections) continue;
      }
      if (options.shouldSearchDescriptions) text += ' ' + course.description;
      if (options.shouldSearchSections) {
        for (var semester in course.sections) {
          text += ' ' + semester;
          for (var sectionType in course.sections[semester]) {
            var sections = course.sections[semester][sectionType];
            for (var j = 0; j < sections.length; j++)
              text += ' ' + this._textForSection(sections[j]);
          }
        }
      }
      var fragments = this._splitTextWithQuery(text);
      if (fragments.length < 2) continue;

      // score the match
      var wordScores = {}, matchesName = 0, matchesTitle = 0, charIndex = 0;
      for (var j = 0; j < fragments.length; j++) {
        var fragment = fragments[j].toLowerCase();
        if (this._equalsRegex.test(fragment)) {
          // score things higher if they match in the name or title
          if (charIndex < course.name.length) matchesName++;
          else if (charIndex < course.name.length + 2 + course.title.length) matchesTitle = 1;

          // count it twice if fragment matches whole word, three times if fragment matches whole word in course name
          var wordScore = 1 + (j + 1 == fragments.length || fragments[j + 1].length == 0 || fragments[j + 1][0].search(/[ \\\/\.,:;"\)]/) == 0) * (1 + (charIndex < course.name.length));

          // store the maximum score for a word
          var previousWordScore = (fragment in wordScores) ? wordScores[fragment] : 0;
          wordScores[fragment] = Math.max(wordScore, previousWordScore);
        }
        charIndex += fragment.length;
      }

      // accumulate the score and check the word count
      var score = 0, wordCount = 0;
      for (var word in wordScores) {
        score += wordScores[word];
        wordCount++;
      }
      if (wordCount < this._queryWordCount) continue;

      // record the match
      matches.push({ 'course': course, 'score': score * (1 + 1.5 * matchesName + 0.5 * (matchesTitle > matchesName)) });
    }

    return matches;
  },

  // creates regexes for query, returns false on empty query
  _compileRegexForQuery: function(query) {
    // pretend all weird characters are spaces (it would be nice to allow queries like "computer science" with quotes,
    // meaning that the word computer must come right before the word science, but that's not implemented right now)
    // this is an inclusive list because we don't want to pretend characters like &egrave; are spaces)
    var keywords = query.toLowerCase().replace(/[`~!@#$%^&\*\(\)=\[\]{}|;"<>\?,\.]/g, ' ').split(' ');
    var regex = '';

    // remove all keywords that are a substring of another keyword (but be careful about duplicates, we don't want to remove both of them)
    for (var i = 0; i < keywords.length; i++) {
      var keyword = keywords[i];
      var shouldRemove = false;
      if (keyword.length) {
        for (var j = 0; j < keywords.length; j++) {
          if (i == j) continue;
          var otherKeyword = keywords[j];
          if ((keyword.length < otherKeyword.length && otherKeyword.indexOf(keyword) == 0) || (keyword == otherKeyword && i < j))  {
            shouldRemove = true;
            break;
          }
        }
      } else {
        shouldRemove = true;
      }
      if (shouldRemove) {
        keywords.splice(i--, 1);
      }
    }

    // make "cs53" search for "cs 53", "cs 53" search for "cs 053", and "cs195n" search for "cs 1950n"
    // this has the odd side effect of "196s" searching for "1960s" but there's nothing we can do about that
    this._queryWordCount = 0;
    for (var i = 0; i < keywords.length; i++) {
      var keyword = keywords[i];
      this._queryWordCount++;

      if (/^[a-z]+[0-9]+[a-z]?$/.test(keyword)) {
        // turn "cs53" into "cs" and add another keyword "53"
        var index = keyword.search(/[0-9]/);
        keywords[i] = keyword.substring(0, index);
        keywords.push(keyword.substring(index));
      } else if (/^[1-9][0-9]*[a-z]?$/.test(keyword)) {
        // recognize "53" and add another keyword "0530"
        var matches = /^([1-9][0-9]*)([a-z]?)$/.exec(keyword);
        var number = matches[1];
        var letter = matches[2];
        if (number.length == 1) keywords.push('00' + number + '0' + letter);
        else if (number.length == 2) keywords.push('0' + number + '0' + letter);
        else if (number.length == 3) keywords.push(number + '0' + letter);
        else continue;

        // ignore added words for "or" behavior instead of "and" behavior
        this._queryWordCount--;
      }
    }

    // turn the keywords into a regex and count them, also escape text such that it can be
    // inserted into a regex without problems (backslash-escape all special characters)
    for (var i = 0; i < keywords.length; i++) {
      regex += (regex.length ? '|' : '') + keywords[i].replace(/([\^\$\\\*\+\[\]\(\)\.\?\|])/g, '\\$1');
    }
    console.log(this._queryWordCount, regex);
    if (this._queryWordCount == 0) return false;
    regex = '(' + regex + ')';
    this._startsWithRegex = new RegExp('\\b' + regex, 'i');
    this._equalsRegex = new RegExp('^' + regex + '$', 'i');
    return true;
  }
};
