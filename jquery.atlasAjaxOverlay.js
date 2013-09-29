// ========================================================================================== //
//  Atlas AJAX Overlay (v0.7)
//  by Radney Aaron Alquiza
//  Sept 28, 2013
// ========================================================================================== //

// a jquery plugin for displaying a loader image/text while something loads
// the user will initialize a DOM element which the overlay will "cover"

(function ($) {

    // default settings
    var oversettings = {
        display: 'image',   // to display the loader as text or image
        overlayimage: '',   // image file path
        coveroverlay: true,
        coverOpacity: '0.4',
        coverColor: '#dbdbdb',
    };

    $.fn.atlasAjaxOverlay = function (options_or_method, otherparams) {

        var domelement = null;
        if (methods != null) {
            // if the parameter passed is nothing or a javascript object
            if (otherparams == null && options_or_method == null || (typeof options_or_method === 'object' && options_or_method != null)) {
                if (domelement == null) {
                    this.data('oversettings', $.extend({}, oversettings, options_or_method));
                    domelement = methods['initialize'](this, options_or_method);
                }
                return domelement;
            }
                // if the parameter passed is a string for a method
            else if (typeof options_or_method == "string" && otherparams == null) {
                return methods[options_or_method](this.data('oversettings'));
            }
            else if (typeof options_or_method == "string" && otherparams != null) {
                domelement = methods[options_or_method](this.data('oversettings'), otherparams);
                return domelement;
            }
        }
    }

    // create the cover
    function addCover(settings) {
        console.log('addcover');
        if (settings.cover == null) {
            settings.thisobject.append('<div class="atlas-cover"></div>');
            settings.cover = settings.thisobject.find('.atlas-cover');
        }
    }

    // create the overlay
    function addOverlay(settings) {
        console.log('addoverlay');
        if (settings.overlayimage == '') {
            settings.thisobject.append('<div class="atlas-overlay"><span></span></div>');
            settings.overlay = settings.thisobject.find('.atlas-overlay');
        }
    }

    // set the cover
    function setupCover(settings) {
        console.log('setupcover');
        settings.cover.css('background-color', settings.coverColor);
        settings.cover.css('opacity', settings.coverOpacity);
        // setup dimensions of cover
        settings.cover.css('width', settings.thisobject.width() + "px");
        settings.cover.css('height', settings.thisobject.height() + "px");

        var pos = settings.thisobject.position();
        if (settings.thisobject.css('position') != "relative") {
            settings.cover.css('top', pos.top + "px");
            settings.cover.css('left', pos.left + "px");
        }
        else {
            settings.cover.css('top', 0 + "px");
            settings.cover.css('left', 0 + "px");
        }

    }

    // set the overlay
    function setupOverlay(settings) {
        console.log('setupoverlay');
        var pos = settings.thisobject.position();
        var width = settings.thisobject.width();
        var height = settings.thisobject.height();
        var reftop = $(window).scrollTop();

        if (reftop < pos.top) {
            if ((pos.top + height) < $(window).height()) {
                settings.overlay.css('top', ((pos.top + (height / 2)) - settings.overlay.height() / 2) + "px");
            }
            else {
                settings.overlay.css('top', ((pos.top + (($(window).height() - pos.top) / 2)) - settings.overlay.height() / 2) + "px");
            }
        }
        else {
            settings.overlay.css('top', (((pos.top+(reftop-pos.top))+(((height+pos.top)-reftop)/2)) - settings.overlay.height() / 2) + "px");
        }
        settings.overlay.css('left', ((pos.left + (width / 2)) - settings.overlay.width() / 2) + "px");
    }



    var methods = {
        // =============================================================================
        // INITIALIZE - attach the plugin, attach events, attach css
        // =============================================================================
        initialize: function (object, options) {
            

            return object.each(function () {
                var settings = $(this).data('oversettings');
                settings.thisobject = $(this);
                if (settings.coveroverlay) {
                    if (settings.cover == null) {
                        addCover(settings);
                    }
                }

                if (settings.overlay == null) {
                    addOverlay(settings);
                }

                // bind the jquery reference to the element (the div or any container)
                $(this).data('data', $(this));
            });
        },
        show: function (settings) {
            setupCover(settings);
            settings.cover.show();
            setupOverlay(settings);
            settings.overlay.show();
        },
        hide: function (settings) {
            settings.cover.removeAttr('style');
            settings.cover.hide();
            settings.overlay.hide();
            settings.cover.remove();
            settings.overlay.remove();
        },
        destroy: function () {

        }
    }
})(jQuery);