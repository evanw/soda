var cart = {
  _newCRN: null,
  _semesterCRNs: {},
  _currentSemester: '',

  // when someone adds a course to a semester they are not currently viewing, it is a bad user experience to
  // switch to that semester, so instead we pop up a notification above the other semester indicating that
  // a course has been added there
  _semesterToUnseenCRNs: {},

  load: function() {
    // insert all the semesters now so we don't need to worry about them not being there
    for (var i = 0; i < semesters.length; i++)
      this._semesterCRNs[semesters[i]] = {};

    var crns = getCookie('cart').split(',');
    for (var i = 0; i < crns.length; i++) {
      var crn = parseInt(crns[i], 10);
      if (crn == crns[i] && (crn in crnMap))
        this._addCRN(crn);
    }

    // update the interface with the loaded courses and current semester
    var semester = getCookie('semester');
    this.setSemester(semester.length ? semester : semesters[0]);
  },

  setSemester: function(currentSemester) {
    // clear the unseen CRN list for the semester we are about to view
    this._semesterToUnseenCRNs[currentSemester] = [];

    var html = '';
    for (var i = 0; i < semesters.length; i++) {
      var semester = semesters[i];
      var count = 0;
      for (var name in this._semesterCRNs[semester])
        count++;
      count = count ? ' (' + count + ')' : '';
      if (i > 0) html += ' ~ ';
      
      html += '<div class="semester">';
      if (semester == currentSemester) html += '<b>' + semester + count + '</b>';
      else html += '<a href="javascript:cart.setSemester(\'' + semester + '\')">' + semester + count + '</a>';
      if (semester in this._semesterToUnseenCRNs && this._semesterToUnseenCRNs[semester].length > 0) {
        html += '<div class="notification">' + this._semesterToUnseenCRNs[semester].length + '</div>';
      }
      html += '</div>';
    }
    $('#semesters').html(html);
    this._currentSemester = currentSemester;
    this._updateList();
    schedule.setSemester(currentSemester);
    setCookie('semester', currentSemester);
  },

  crnsForSemester: function(semester) {
    var crns = [];

    // iterate over course names in alphabetical order
    var names = [];
    for (var name in this._semesterCRNs[semester])
      names.push(name);
    names.sort();

    for (var i = 0; i < names.length; i++) {
      var semesterCRNs = this._semesterCRNs[semester][names[i]];
      for (var j = 0; j < semesterCRNs.length; j++)
        crns.push(semesterCRNs[j]);
    }
    return crns;
  },

  // sort the given CRNs according to original order in course
  _sortCRNsForCourse: function(crns, course) {
    var newCRNs = [];
    function addFromSections(sections) {
      for (var i = 0; i < sections.length; i++) {
        for (var j = 0; j < crns.length; j++) {
          if (sections[i].crn == crns[j]) {
            newCRNs.push(crns[j]);
          }
        }
      }
    }
    for (var semester in course.sections) {
      // special case classes so they come out on top
      if ('Class' in course.sections[semester])
        addFromSections(course.sections[semester]['Class']);

      // add everything else
      for (var sectionType in course.sections[semester]) {
        if (sectionType != 'Class') {
          addFromSections(course.sections[semester][sectionType]);
        }
      }
    }
    return newCRNs;
  },

  // helper function to add a CRN without updating stuff
  _addCRN: function(crn) {
    // try to look up the crn
    var info = crnMap[crn];
    var semesterCRN = this._semesterCRNs[info.section.semester];
    var crns = semesterCRN[info.course.name] || [];

    // don't add the same CRN twice
    var alreadyExists = false;
    for (var i = 0; i < crns.length; i++) {
      if (crns[i] == crn) {
        alreadyExists = true;
      }
    }

    // add the CRN
    if (!alreadyExists) {
      crns.push(crn);
      semesterCRN[info.course.name] = this._sortCRNsForCourse(crns, info.course);
      this._semesterCRNs[info.section.semester] = semesterCRN;
    }
  },

  _removeCRN: function(crn) {
    // try to look up the crn
    var info = crnMap[crn];
    var semesterCRNs = this._semesterCRNs[info.section.semester];
    var crns = semesterCRNs[info.course.name] || [];

    // remove the CRN
    for (var i = 0; i < crns.length; i++) {
      if (crns[i] == crn) {
        crns.splice(i, 1);
      }
    }
    if (crns.length == 0) delete semesterCRNs[info.course.name];
    else semesterCRNs[info.course.name] = crns;
    this._semesterCRNs[info.section.semester] = semesterCRNs;
  },

  _saveToCookie: function() {
    var crns = [];
    for (var semester in this._semesterCRNs) {
      for (var name in this._semesterCRNs[semester]) {
        var semesterCRNs = this._semesterCRNs[semester][name];
        for (var i = 0; i < semesterCRNs.length; i++)
          crns.push(semesterCRNs[i]);
      }
    }
    setCookie('cart', crns);
  },

  addCRN: function(crn) {
    this._addCRN(crn);
    this._saveToCookie();

    // if we're adding a crn to a non-current semester, add crn to _semesterToUnseenCRNs[crnSemester]
    // while making sure it's only there once
    var crnSemester = crnMap[crn].section.semester;
    if (this._currentSemester != crnSemester) {
      var unseenCRNs = this._semesterToUnseenCRNs[crnSemester] || [];
      for (var i = 0; i < unseenCRNs.length; i++) {
        if (unseenCRNs[i] == crn) {
          unseenCRNs.splice(i, 1);
          break;
        }
      }
      unseenCRNs.push(crn);
      this._semesterToUnseenCRNs[crnSemester] = unseenCRNs;
    }

    // update the current semester with the new course count and refresh the list,
    // even if the crn isn't acutally new because it will still flash
    // (temporarily store the CRN in _newCRN so _updateList() knows to flash the new row)
    this._newCRN = crn;
    this.setSemester(this._currentSemester);
    this._newCRN = null;

    // make the notification 'pop' every time an add is attempted on a semester other than the current one
    if (this._currentSemester != crnSemester) {
      $('.notification').stop().css({
        'top': -11
      }).animate({
        'top': -16
      }, 100).animate({
        'top': -11
      }, 100);
    }
    
    $('#search').focus();
  },

  removeCRN: function(crn) {
    this._removeCRN(crn);
    this._saveToCookie();

    // update the current semester with the new course count and refresh the list
    this.setSemester(this._currentSemester);
    
    $('#search').focus();
  },

  _updateList: function() {
    var html = '';
    var flashID = '';

    // iterate over course names in alphabetical order
    var names = [];
    for (var name in this._semesterCRNs[this._currentSemester])
      names.push(name);
    names.sort();

    var crnsHTML = '';
    var idToCRNs = {};
    for (var i = 0; i < names.length; i++) {
      var crns = this._semesterCRNs[this._currentSemester][names[i]];
      var info = crnMap[crns[0]];
      var id = info.course.name.toLowerCase().replace(/ /g, '') + '-cart';
      html += '<div id="' + id + '" class="cart-course">';
      html += '<div class="color color' + (i % colorCount) + '"></div>';
      html += '<b>' + info.course.name + ': ' + info.course.title + '</b>';
      for (var j = 0; j < crns.length; j++) {
        var crn = crns[j], info = crnMap[crn];
        html += '<div class="section"><div>(<a id="' + id + '-' + crn + '-link" href="#">remove</a>)</div>' + this._textForSection(info.section) + '</div>';
        if (crn == this._newCRN)
          flashID = id;
        crnsHTML += (crnsHTML != '' ? ', ' : '') + crn;
      }
      html += '</div>';
      idToCRNs[id] = crns;
    }

    if (crnsHTML == '') {
      html += '<div class="info">No saved courses for ' + this._currentSemester + '</div>';
    } else {
      html += '<div class="info">CRNs: ' + crnsHTML + '</div>';
    }

    $('#cart').html(html);
    $.each(idToCRNs, function(id, crns) {
      $('#' + id).click(function(e) {
        search.go(crns[0]);
        e.preventDefault();
      });
      $.each(crns, function(index, crn) {
        $('#' + id + '-' + crn + '-link').click(function(e) {
          cart.removeCRN(crn);
          e.preventDefault();
        });
      });
    });

    // flash any new courses
    if (flashID != '') {
      $('#' + flashID).stop().css({
        'backgroundColor': '#FFFFDF'
      }).delay(750).animate({
        'backgroundColor': '#FFFFFF'
      }, 500);
    }
  },

  // returns the text for a section
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
    if (!hasDifferentInstructors) {
      text += ' ~ ' + instructors;
    }

    // remove duplicate places (SOC 1060, I'm looking at you)
    var previousPlaces = {};
    for (var i = 0; i < section.meetings.length; i++) {
      var meeting = section.meetings[i];
      var hasPlace = (meeting.where != '' && !(meeting.where in previousPlaces));
      if (hasDifferentInstructors || hasPlace) text += ' ~ ';
      if (hasDifferentInstructors) text += meeting.instructors;
      if (hasPlace) {
        text += ' in ' + meeting.where;
        previousPlaces[meeting.where] = 1;
      }
    }
    return text;
  }
};
