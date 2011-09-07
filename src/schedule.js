var schedule = {
  _currentSemester: '',

  load: function() {
    // cart.load() will call this.setSemester(), which will load the schedule
  },

  _timeFromString: function(str) {
    var isPM = (str.substring(str.length - 2) == 'pm');
    var digits = str.substring(0, str.length - 2).split(':');
    var hours = (digits[0] != '12' ? parseInt(digits[0], 10) : 0);
    var minutes = (digits.length > 1 ? parseInt(digits[1], 10) / 60 : 0);
    return hours + minutes + (isPM ? 12 : 0);
  },

  _loadSchedule: function() {
    var crns = cart.crnsForSemester(this._currentSemester);

    // block out the schedule
    var blocks = [];
    var color = 0;
    var previousName = crns.length ? crnMap[crns[0]].course.name : '';
    for (var i = 0; i < crns.length; i++) {
      var info = crnMap[crns[i]];
      if (info.course.name != previousName) {
        previousName = info.course.name;
        color = (color + 1) % colorCount;
      }
      for (var j = 0; j < info.section.meetings.length; j++) {
        var meeting = info.section.meetings[j];
        var times = meeting.time.split(' - ');
        if (times.length < 2) continue;
        var start = this._timeFromString(times[0]);
        var end = this._timeFromString(times[1]);
        if (isNaN(start) || isNaN(end)) continue;
        for (var k = 0; k < meeting.days.length; k++) {
          var block = {
            'html': info.course.name,
            'day': 'SMTWRFU'.indexOf(meeting.days[k]),
            'color': color,
            'start': start,
            'end': end
          };

          // some courses (like ECON 0510) move halfway through the year but keep
          // the same time, and we don't want to add that time more than once
          var alreadyThere = false;
          for (var b = 0; b < blocks.length; b++) {
            var other = blocks[b];
            if (other.html == block.html &&
              other.day == block.day &&
              other.color == block.color &&
              other.start == block.start &&
              other.end == block.end) {
              alreadyThere = true;
              break;
            }
          }

          if (!alreadyThere)
            blocks.push(block);
        }
      }
    }

    // sort blocks in ascending order based on start position, using html
    // as a tiebreaker (necessary because of unstable sort algorithm)
    blocks.sort(function(a, b) {
      return (a.start < b.start) ? -1 : (a.start > b.start) ? 1 : (a.html > b.html) - (a.html < b.html);
    });

    // split each day into columns if there are overlapping blocks
    for (var day = 0; day < 7; day++) {
      var maxOverlap = 0;

      // calculate the maximum number of simultaneously overlapping blocks for this day
      // (the number isn't just count the number of blocks overlapping a given block)
      //
      //  +---+
      //  | A | +---+
      //  +---+ |   |        B overlaps with A, C, and D for an overlap count of three
      //        | B |        but the maximum number of simultaneous overlaps is still two,
      //  +---+ |   | +---+  so we really have to count the overlaps at each start point
      //  | C | +---+ | D |
      //  +---+       +---+

      // first pass: get the start points and blocks for today
      var startPoints = [];
      var blocksForToday = [];
      for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        if (block.day != day) continue;
        startPoints.push(block.start);
        blocksForToday.push(block);
      }

      // second pass: get the maximum overlap over all start points for today
      for (var i = 0; i < startPoints.length; i++) {
        var startPoint = startPoints[i];
        var overlap = 0;
        for (var j = 0; j < blocksForToday.length; j++) {
          if (startPoint >= blocksForToday[j].start && startPoint < blocksForToday[j].end) {
            overlap++;
          }
        }
        maxOverlap = Math.max(maxOverlap, overlap);
      }

      // set that overlap on each block for this day
      for (var i = 0; i < blocksForToday.length; i++)
        blocksForToday[i].numColumns = maxOverlap;

      // assign each block a column in a linear pass from the start of the day to the end
      // (the blocks are already sorted in ascending order from their start position)
      for (var i = 0; i < blocksForToday.length; i++) {
        var a = blocksForToday[i];
        for (a.column = 0; a.column < a.numColumns; a.column++) {
          var blockOverlaps = false;
          for (var j = 0; j < i; j++) {
            var b = blocksForToday[j];
            if (a.column == b.column && a.start < b.end && b.start < a.end) {
              blockOverlaps = true;
              break;
            }
          }
          if (!blockOverlaps) break;
        }
      }
    }

    this._htmlScheduleFromBlocks(blocks);
  },

  _htmlScheduleFromBlocks: function(blocks) {
    var start = 9, end = 16, showWeekend = false;

    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      start = Math.min(start, Math.floor(block.start));
      end = Math.max(end, Math.ceil(block.end));
      if (block.day == 0 || block.day == 6) showWeekend = true;
    }

    // create the row for each hour
    var row = '<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>';
    if (showWeekend) row = '<td class="weekend">&nbsp;</td>' + row + '<td class="weekend">&nbsp;</td>';

    // create the html for hours and schedule
    var hours = '', schedule = '';
    for (var i = start; i < end; i++) {
      hours += '<tr><td>' + (((i - 1) % 12) + 1) + (i >= 12 ? 'pm' : 'am') + '</td></tr>';
      schedule += '<tr>' + row + '</tr>';
    }

    var html = '';
    var daysStart = showWeekend ? 0 : 1;
    var daysEnd = showWeekend ? 7 : 6;
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      var left = (block.day - daysStart + block.column / block.numColumns) / (daysEnd - daysStart);
      var right = (block.day - daysStart + (block.column + 1) / block.numColumns) / (daysEnd - daysStart);
      var top = (block.start - start) / (end - start);
      var bottom = (block.end - start) / (end - start);
      html += '<div style="position:absolute;left:' + (left * 100) + '%;top:' + (top * 100) + '%;right:' + (100 - right * 100) + '%;bottom:' + (100 - bottom * 100) + '%;padding: 0 6px 4px 0;"><div class="color' + block.color + ' block">' + block.html + '</div></div>';
    }

    // update the html
    $('#hours').html('<table>' + hours + '</table>');
    $('#schedule').html('<table>' + schedule + '</table>' + html);
  },

  setSemester: function(currentSemester) {
    this._currentSemester = currentSemester;
    this._loadSchedule();
  }
};
