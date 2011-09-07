// a map of CRNs to { course, section } objects
var crnMap = {};

// how many different colors before we need to wrap back around
var colorCount = 21;

function textToHTML(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace('"', '&quot;').replace('\'', '&#39;');
}

function setCookie(name, value) {
  // attempt to use localStorage first because 'file://' urls don't work with cookies
  if (typeof(localStorage) != 'undefined') {
    localStorage[name] = value;
  } else {
    var date = new Date();
    date.setTime(date.getTime() + 5*365*24*60*60*1000);
    document.cookie = name + '=' + value + '; expires=' + date.toGMTString() + '; path=/';
  }
}

function getCookie(name) {
  // attempt to use localStorage first because 'file://' urls don't work with cookies
  if (typeof(localStorage) != 'undefined') {
    return (name in localStorage ? localStorage[name] : '');
  } else {
    var pairs = document.cookie.split(';');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i], equals = pair.indexOf('=');
      if (equals != -1 && pair.substring(0, equals).replace(/ /g, '') == name)
        return pair.substring(equals + 1);
    }
    return '';
  }
}

// initialize the components
window.onload = function() {
  // create a map from CRN to course and section, and add semesters and types to all sections
  for (var i = 0; i < courses.length; i++) {
    var course = courses[i];
    for (var semester in course.sections) {
      for (var sectionType in course.sections[semester]) {
        var sections = course.sections[semester][sectionType];
        for (var j = 0; j < sections.length; j++) {
          var section = sections[j];
          section.type = sectionType;
          section.semester = semester;
          crnMap[section.crn] = { 'section': section, 'course': course };
        }
      }
    }
  }

  cart.load();
  schedule.load();
  options.load();
  search.load();

  // preload the notification image
  var img = new Image;
  img.style.display = 'none';
  img.src = 'notify.png';
  document.body.appendChild(img);
};
