var options = {
  courseDetail: 2,
  shouldShowLinks: true,
  shouldSearchSections: true,
  shouldSearchDescriptions: true,
  shouldCollapseSimilarSections: true,
  shouldHideCoursesWithoutSections: true,

  refresh: function() {
    this.courseDetail = 1 * $('#result-sm').attr('checked') + 2 * $('#result-med').attr('checked') + 3 * $('#result-big').attr('checked');
    this.shouldShowLinks = 1 * $('#show-links').attr('checked');
    this.shouldSearchSections = 1 * $('#search-sect').attr('checked');
    this.shouldSearchDescriptions = 1 * $('#search-desc').attr('checked');
    this.shouldCollapseSimilarSections = 1 * $('#collapse-sim').attr('checked');
    this.shouldHideCoursesWithoutSections = 1 * $('#hide-no-sections').attr('checked');
    this._saveToCookie();
  },

  load: function() {
    $('#options-button').click(function() {
      options.show();
    });
    $('#options-close').click(function() {
      options.hide();
    });
    $('#search-sect, #search-desc, #result-sm, #result-med, #result-big, #show-links, #collapse-sim, #hide-no-sections').change(function() {
      setTimeout(function() {
        options.refresh();
        search.startOver();
      }, 10);
    });
    this._loadFromCookie();
  },

  show: function() {
    $('#options, #options-spacer').stop().animate({
      'height': 70,
      'paddingTop': 15,
      'paddingBottom': 15
    }, 150);
  },

  hide: function() {
    $('#search').focus();
    $('#options, #options-spacer').stop().animate({
      'height': 0,
      'paddingTop': 0,
      'paddingBottom': 0
    }, 150);
  },

  _loadFromCookie: function() {
    var cD = getCookie('cD');
    var sSL = getCookie('sSL');
    var sSS = getCookie('sSS');
    var sSD = getCookie('sSD');
    var sCSS = getCookie('sCSS');
    var sHCWS = getCookie('sHCWS');

    // try to read the settings from the previous session
    if (cD.length) this.courseDetail = parseInt(cD, 10);
    if (sSL.length) this.shouldShowLinks = parseInt(sSL, 10);
    if (sSS.length) this.shouldSearchSections = parseInt(sSS, 10);
    if (sSD.length) this.shouldSearchDescriptions = parseInt(sSD, 10);
    if (sCSS.length) this.shouldCollapseSimilarSections = parseInt(sCSS, 10);
    if (sHCWS.length) this.shouldHideCoursesWithoutSections = parseInt(sHCWS, 10);

    if (cD + sSL + sSS + sSD + sCSS + sHCWS == '') {
      // read initial states from the html if there was no previous session
      this.refresh();
    } else {
      // set the html to reflect the changes;
      $('#show-links').attr('checked', this.shouldShowLinks);
      $('#search-sect').attr('checked', this.shouldSearchSections);
      $('#search-desc').attr('checked', this.shouldSearchDescriptions);
      $('#collapse-sim').attr('checked', this.shouldCollapseSimilarSections);
      $('#hide-no-sections').attr('checked', this.shouldHideCoursesWithoutSections);
      $(['#result-sm', '#result-med', '#result-big'][this.courseDetail - 1]).attr('checked', true);
    }
  },

  _saveToCookie: function() {
    setCookie('cD', this.courseDetail);
    setCookie('sSL', this.shouldShowLinks);
    setCookie('sSS', this.shouldSearchSections);
    setCookie('sSD', this.shouldSearchDescriptions);
    setCookie('sCSS', this.shouldCollapseSimilarSections);
    setCookie('sHCWS', this.shouldHideCoursesWithoutSections);
  }
};
