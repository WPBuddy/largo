(function() {
  var $ = jQuery;

  var Navigation = function() {
    this.scrollTop = $(window).scrollTop();
    this.previousScroll = null;
    this.initialLoad = true;
    return this.init();
  };

  /*
   * This is a shim to cover for the case where a browser may or may not have scrollbars
   * @link https://github.com/jquery/jquery/issues/1729
   *
   * In some browsers, having the Inspector Tools docked within the browser in a sidebar
   * configuration may cause abnormal readings for this value.
   */
  Navigation.prototype.windowwidth = function() {
    return Math.max(window.outerWidth, $(window).width());
  }

  Navigation.prototype.init = function() {
    // Dropdowns on touch screens
    this.enableMobileDropdowns();

    // Stick navigation
    this.stickyNavEl = $('.sticky-nav-holder');
    this.stickyNavWrapper = $('.sticky-nav-wrapper');
    this.mainEl = $('#main');
    this.mainNavEl = $('#main-nav');

    if ( this.windowwidth() > 768) {
      this.stickyNavTransition();
    }

    // Bind events
    this.bindEvents();

    // Deal with long/wrapping navs
    setTimeout(this.navOverflow.bind(this), 0);

    // Sticky nav on small viewports
    this.responsiveNavigation();

    return this;
  };

  Navigation.prototype.enableMobileDropdowns = function () {
    // Touch enable the drop-down menus
    if (Modernizr.touch) {
      // iOS Safari works with touchstart, the rest work with click
      var mobileEvent = /Mobile\/.+Safari/.test(navigator.userAgent) ? 'touchstart' : 'click',
      // Open the drop down
      openMenu = false;

      // Call this to close the open menu
      var closeOpenMenu = function() {
        if (openMenu) {
          openMenu.removeClass('open');
          openMenu = false;
        }
      }

      // Close the open menu when the user taps elsewhere
      $('body').on(mobileEvent, closeOpenMenu);
    }
  };

  Navigation.prototype.bindEvents = function() {
    $(window).resize(this.navOverflow.bind(this));
    this.bindStickyNavEvents();
  };

  Navigation.prototype.bindStickyNavEvents = function() {
    var self = this;

    // This is so that we may apply styles to the navbar based on what options are set
    // This is used with some styles in less/inc/navbar-sticky.less
    $.each(Largo.sticky_nav_options, function(idx, opt) {
      if (opt)
        self.stickyNavEl.addClass(idx);
    });

    $(window).on('scroll resize', this.stickyNavScrollCallback.bind(this));

    this.stickyNavResizeCallback();
  };

  Navigation.prototype.stickyNavResizeCallback = function() {
    if (
      this.windowwidth() <= 768
      || (
        Largo.sticky_nav_options.main_nav_hide_article
        && (
          $('body').hasClass('single')
          || $('body').hasClass('page')
        )
      )
    ) {
      this.stickyNavEl.addClass('show');
      this.stickyNavEl.parent().css('height', this.stickyNavEl.outerHeight());
    } else if (
      Largo.sticky_nav_options.sticky_nav_display
    ) {
      this.stickyNavEl.parent().css('height', '');
    } else {
      this.stickyNavEl.parent().css('height', '');
    }
    this.stickyNavTransitionDone();
  };


  /**
   * Determine whether or not to show or hide the sticky nav in response to scrolling
   */
  Navigation.prototype.stickyNavScrollCallback = function(event) {
    if (
      $(window).scrollTop() < 0
      || ( $(window).scrollTop() + $(window).outerHeight() ) >= $(document).outerHeight()
    ) {
      // if we're scrolled past the top of the page
      // or if the window is taller than the document
      // then it doesn't make sense to do the logic in this function.
      return;
    }

    if (
      this.windowwidth() > 768
      && !Largo.sticky_nav_options.sticky_nav_display
    ) {
      // if we're in a non-mobile case and the sticky nav is set to not display
      // then we should not be changing the status of the sticky nav based on height.
      return;
    }

    var self = this,
        direction = this.scrollDirection(),
        callback, wait;

    // this.mainEl (#main) exists in all Largo templates.
    if ( $(window).scrollTop() <= this.mainEl.offset().top ) {
      // we're near the top of the page, so now let's consider whether to hide the sticky nav:
      // if main_nav_hide_article is true, mainNavEl won't exist.
      if ( this.mainNavEl.length && this.mainNavEl.is(':visible') ) {
        // the main nav exists and is visible,
        // so we should hide the sticky nav
        this.stickyNavEl.removeClass('show');
        clearTimeout(this.scrollTimeout);
        return; // don't need to do the other logic; it shouldn't show anyways
      }
    }

    if (
      !this.previousScroll
    ) {
      // if the page has not been scrolled,
      // Update the scroll direction,
      // then continue to the logic that would control whether to show it or not.
      this.previousScroll = direction;
    } else if ( this.previousScroll == direction ) {
      // if we're scrolling in the same direction,
      // update the scroll direction,
      // and end this function because the directional code has nothing to add.
      this.previousScroll = direction;
      return;
    }

    clearTimeout(this.scrollTimeout);

    if (direction == 'up') {
      callback = this.stickyNavEl.addClass.bind(this.stickyNavEl, 'show'),
      wait = 250;
    } else if (direction == 'down') {
      callback = this.stickyNavEl.removeClass.bind(this.stickyNavEl, 'show');
      wait = 500;
    }

    this.scrollTimeout = setTimeout(callback, wait);
    this.previousScroll = direction;
  };

  Navigation.prototype.scrollDirection = function() {
    var scrollTop = $(window).scrollTop(),
        direction;

    if (scrollTop > this.scrollTop)
      direction = 'down';
    else
      direction = 'up';

    this.scrollTop = scrollTop;
    return direction;
  };

  Navigation.prototype.responsiveNavigation = function() {
    var self = this;

    // Responsive navigation
    $('.navbar .toggle-nav-bar').each(function() {
      var toggleButton = $(this),
          navbar = toggleButton.closest('.navbar');

      // Support both touch and click events
      toggleButton.on('touchstart.toggleNav click.toggleNav', function(event) {
        // If it is a touch event, get rid of the click events.
        if (event.type == 'touchstart') {
          toggleButton.off('click.toggleNav');
        }

        navbar.toggleClass('open');
        $('html').addClass('nav-open');
        navbar.find('.nav-shelf').css({
          top: self.stickyNavEl.position().top + self.stickyNavEl.outerHeight()
        });

        if (!navbar.hasClass('open')) {
          navbar.find('.nav-shelf li.open').removeClass('open');
          $('html').removeClass('nav-open');
        }

        return false;
      });

      // Secondary nav
      navbar.on('touchstart.toggleNav click.toggleNav', '.nav-shelf .caret', function(event) {
        if (toggleButton.css('display') == 'none')
          return false;

        if (event.type == 'touchstart') {
          navbar.off('click.toggleNav', '.nav-shelf .dropdown-toggle');
        }

        var li = $( event.target ).closest('li');

        if (!li.hasClass('open')) {
          navbar.find('.nav-shelf li.open').removeClass('open');
        }

        li.toggleClass('open');
        return false;
      });
    });
  };

  /**
   * On window resize, make sure nav doesn't overflow.
   * Put stuff in the overflow nav if it does.
   *
   * Event should fire enough that we can do one at a time
   * and be ok.
   *
   * @since Largo 0.5.1
   */
  Navigation.prototype.navOverflow = function() {
    var nav = $('#sticky-nav');

    if (!nav.is(':visible') || this.windowwidth() <= 768) {
      this.revertOverflow();
      return;
    }

    if ( ! this.windowwidth() <= 768 ) {
      $('html').removeClass('nav-open');
    }

    var shelf = nav.find('.nav-shelf'),
        button = nav.find('.toggle-nav-bar'),
        right = nav.find('.nav-right'),
        shelfWidth = shelf.outerWidth(),
        rightWidth = right.outerWidth(),
        caretWidth = nav.find('.caret').first().outerWidth(),
        windowWidth = this.windowwidth(),
        isMobile = button.is(':visible');

    if (!isMobile) {
      if (!this.stickyNavEl.hasClass('transitioning')) {
        this.stickyNavTransition();
      }

      /*
       * Calculate the width of the nav
       */
      var navWidth = 0;
      shelf.find('ul.nav > li').each( function() {
        if ($(this).is(':visible'))
          navWidth += $(this).outerWidth();
      });

      var overflow = shelf.find('ul.nav > li#menu-overflow.menu-item-has-children').last();

      if (!isMobile && navWidth > shelfWidth - rightWidth - caretWidth) {
        /*
         * If there is no "overflow" menu item, create one
         *
         * This is where you change the word from "More" to something else.
         */
        if (overflow.length == 0) {
          var overflowmenu ='<li id="menu-overflow" class="menu-item-has-children dropdown">' +
            '<a href="#" class="dropdown-toggle">' + Largo.sticky_nav_options.nav_overflow_label + '<b class="caret"></b></a>' +
            '<ul id="sticky-nav-overflow" class="dropdown-menu"></ul></li>';
          overflow = $(overflowmenu);
          overflow.find('a').click(function() { return false; });
          shelf.find('ul.nav > li.menu-item').last().after(overflow);
        }

        var li = shelf.find('ul.nav > li.menu-item').last();

        overflow.find('ul#sticky-nav-overflow').prepend(li);
        li.addClass('overflowed');
        li.data('shelfwidth', shelfWidth);
      } else if (overflow.length) {
        /*
         * Put items back on the main sticky menu and empty out the overflow nav menu if necessary.
         */
        var li = overflow.find('li').first();

        if (li.hasClass('overflowed')) {
          if (li.data('shelfwidth') < shelfWidth) {
            shelf.find('ul.nav > li.menu-item').last().after(li);

            // Remove the "More" menu if there are no items in it.
            if (overflow.find('ul li').length == 0) {
              overflow.remove();
            }
          }
        }
      }

      /*
       * Re-calculate the width of the nav after adding/removing overflow items.
       *
       * If the nav is still wrapping, call navOverflow again.
       */
      var navWidth = 0;
      shelf.find('ul.nav > li').each( function() {
        if ($(this).is(':visible'))
          navWidth += $(this).outerWidth();
      });
      shelfWidth = shelf.outerWidth(),
      rightWidth = right.outerWidth();

      if (!isMobile && navWidth > shelfWidth - rightWidth - caretWidth) {
        if (typeof this.navOverflowTimeout !== 'undefined')
          clearTimeout(this.navOverflowTimeout);
        this.navOverflowTimeout = setTimeout(this.navOverflow.bind(this), 0);
        return;
      }
    }

    this.stickyNavTransitionDone();
  };

  Navigation.prototype.stickyNavTransition = function() {
    if (!this.stickyNavEl.hasClass('transitioning')) {
      this.stickyNavEl.addClass('transitioning');
    }
  };

  Navigation.prototype.stickyNavTransitionDone = function() {
    var self = this;

    if (typeof this.stickyNavTransitionTimeout !== 'undefined')
      clearTimeout(this.stickyNavTransitionTimeout);

    this.stickyNavTransitionTimeout = setTimeout(function() {
      if (self.stickyNavEl.hasClass('transitioning'))
        self.stickyNavEl.removeClass('transitioning');
    }, 500);
  };

  Navigation.prototype.revertOverflow = function() {
    var nav = $('#sticky-nav'),
        self = shelf = nav.find('.nav-shelf'),
        overflow = shelf.find('ul.nav > li#menu-overflow.menu-item-has-children').last();

    overflow.find('li.overflowed').each(function(idx, li) {
      shelf.find('ul.nav > li.menu-item').last().after(li);
    });

    if (overflow.find('ul li').length == 0 ) {
      overflow.remove();
    }
  };

  if (typeof window.Navigation == 'undefined')
    window.Navigation = Navigation;

  $(document).ready(function() {
    new Navigation();
  });

})();
