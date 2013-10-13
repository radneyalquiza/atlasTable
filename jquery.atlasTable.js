// ========================================================================================== //
//  Atlas Table (v0.6)
//  by Radney Aaron Alquiza
//  v0.1 - Sept 12, 2013
//  v0.2 - Sept 13, 2013
//  v0.4 - Sept 17, 2013
//  v0.5 - Sept 22, 2013
//  v0.6 - Sept 28, 2013
//  (no changelog available/important until v1.0)
// ========================================================================================== //

// Atlas Table is a table plugin that will be applied to either local JSON data or remotely AJAX'd data
// passed into it. The plugin will enable adding, deleting, editing records onto the data source and
// visually to the table.

// included plugin: AtlasAjaxOverlay for displaying a loading animation while loading data

// the user must initialize a container(div,etc) that will contain the table
// initialization samples will be provided in the README.

// TO BE ADDED:
// -Sorting
// -Search
// -Paging

(function ($) {


    $.fn.atlasTable = function (options_or_method, otherparams) {

        // default settings
        var tablesettings = {
            containerWidth: 90,             // width of the container in % relative to its parent
            defaultData: null,              // JSON data (can be supplied through JS or parsed through AJAX)
            header: 'Default',              // text for the header
            showHeader: true,               // show the top header for the table (not the columns)
            showInlineControls: true,       // show EDIT/DELETE in each record row
            displayAmount: 15,              // TO BE IMPLEMENTED: display number of records per page
            editable: false,                // will enable editing the records (add, edit, delete)
            useRemoteDataSource: true,      // true: will use JSON parsed by AJAX, false: will use user given JSON
            showColumnHeaders: true,        // show the column headers
            hiddenColumns: [],              // this will decide which columns are hidden
            recordSearchItem: '',           // this will be the primary key for database search (defaults to the first column)
            deleteOneUrl: '',               // the web method / service url that will delete a record
            getAllUrl: '',                  // the web method / service url that will get all records
            getOneUrl: '',                  // the web method / service url that will get 1 record
            saveOneUrl: '',                 // the web method / service url that will update 1 record
            addOneUrl: '',                  // the web method / service url that will add 1 record
            ajaxSettings: { dataType: 'json', type: 'GET', async: true },  // ajax settings 
            formFields: {},                 // dynamically generated modal form fields
            onComplete: null                // callback (this)
        };

        var domelement = null;
        if (methods != null) {
            // if the parameter passed is nothing or a javascript object
            if (otherparams == null && options_or_method == null || (typeof options_or_method === 'object' && options_or_method != null)) {
                if (domelement == null) {
                    //tablesettings = $.extend({}, tablesettings, options_or_method);
                    this.data('tablesettings', $.extend({}, tablesettings, options_or_method));
                    domelement = methods['initialize'](this, options_or_method);
                }
                return domelement;
            }
                // if the parameter passed is a string for a method
            else if (typeof options_or_method == "string" && otherparams == null) {
                return methods[options_or_method](this);
            }
            else if (typeof options_or_method == "string" && otherparams != null) {
                domelement = methods[options_or_method](this, otherparams);
                return domelement;
            }
        }

    };

    // =====================================================================
    // INTERNAL METHODS
    // =====================================================================
    
    // initialize the table's interactivity
    function addEvents(settings, row) {
        var table = settings.thisobject.find('table');
        var rows;

        if (row == null) {
            if (settings.showInlineControls == false)
                rows = $(table).find('tr:not(.head):not(.no-data)');
            else
                rows = $(table).find('.edit');
        }
        else
            rows = row;

        if (settings.showHeader == true) {
            settings.thisobject.find('.atlasTableContainer').find('.tableToggle').click(function () {
                settings.thisobject.find('.atlasTable').toggle();
                settings.thisobject.find('.addButton').toggle();
            });
        }

        // if the table isn't showing inline controls, clicking on
        // a record will open its editable view
        if (settings.showInlineControls == false) {
            if (settings.editable) {
                rows.click(function () {
                    settings.thisobject.data('saveMode', 'update');
                    settings.thisobject.find('.atlasModal').find('.modalTitle').children('span').html('Edit Record');
                    var thisob = $(this).parents('table');
                    var rowid = $(this).data('id');
                    //thisob.isLoading({ position: "overlay" });
                    settings.thisobject.atlasAjaxOverlay();
                    settings.thisobject.atlasAjaxOverlay('show');
                    
                    setTimeout(function () {
                        fillForm(getOne(rowid, settings), settings);
                        positionModal(settings.thisobject.find('.atlasModal'));//$(this).attr('id'));
                        $('.cover').fadeIn(100);
                        settings.thisobject.atlasAjaxOverlay('hide');
                    }, 600);
                });
            }
        }
        else {
            rows.click(function () {
                settings.thisobject.data('saveMode', 'update');
                settings.thisobject.find('.atlasModal').find('.modalTitle').children('span').html('Edit Record');
                var thisob = $(this).parents('table');
                var rowid = $(this).parents('tr').data('id');

                settings.thisobject.atlasAjaxOverlay();
                settings.thisobject.atlasAjaxOverlay('show');

                setTimeout(function () {
                    fillForm(getOne(rowid, settings), settings);
                    positionModal(settings.thisobject.find('.atlasModal'));
                    $('.cover').fadeIn(100);
                    settings.thisobject.atlasAjaxOverlay('hide');
                }, 600);
            });
        }

        // delete handler
        settings.thisobject.find('.delete').click(function () {
            var id = $(this).data('id');

            if (confirm('Are you sure you want to delete this record?')) {
                deleteRow(id, settings);
            }
            return false;
        });

        var pagelist = settings.thisobject.find('.atlasTableContainer .page-counter').find('ul').find('li');
        console.log(pagelist.length);
        $.each(pagelist, function () {
            if (!isNaN($(this).html())) {
                $(this).click(function () {
                    var page = parseInt($(this).html()) - 1;
                    if (settings.currentPage != page) {
                        for (var i = 0; i < settings.rows.length; i++)
                            $(settings.rows[i]).hide();
                        $(settings.rows[page]).show();
                        settings.currentPage = page;
                    }
                    else console.log('you re on the same page');
                });
            }
        });


        // add form events if there is no row passed (modify whole table)
        if (row == null) { 
            // adding new record
            settings.thisobject.find('.addButton').click(function () {
                settings.thisobject.data('saveMode', 'add');
                settings.thisobject.find('.atlasModal').find('.modalTitle').children('span').html('Add Record');
                clearForm(settings);
                console.log(settings.thisobject.find('.atlasModal'));
                positionModal(settings.thisobject.find('.atlasModal'));
                $('.cover').fadeIn(100);

            });

            // form interaction
            settings.thisobject.find('.formBtn.close').click(function () {
                removeModal($(this), settings);
            });

            settings.thisobject.find('.formBtn.save').click(function () {
                submitForm(settings);
            });

        }
        // keyboard shortcut for escape (to remove the modal)
        var down = [];
        $(document).keydown(function (e) {
            down[e.keyCode] = true;
        }).keyup(function (e) {
            if (down[27]) {
                removeModal(null, settings);
            }
            down[e.keyCode] = false;
        });

    }

    // hide the modal being shown
    function removeModal(refBtn, settings) {
        if (refBtn != null) {
            $(refBtn).parents('.atlasModal').hide();
        }
        else
            settings.thisobject.find('.atlasModal').hide();
        clearForm(settings);
        $('.cover').hide();
    }
       
    // dynamically position and animate the modal form
    function positionModal(object) {
        var width = object.width();
        var height = object.height();
        object.css('left', '50%').css('margin-left', "-" + width / 2 + "px");
        object.css('top', '50%').css('margin-top', "-" + height / 2 + "px");
        object.css('z-index', '11');
        object.fadeIn(100);
    }

    // clear values in all fields in the modal form
    function clearForm(settings) {
        settings.thisobject.find('.atlasModal').find('input[type="text"]').val("");
        settings.thisobject.find('.atlasModal').find('select').val("");
        settings.thisobject.find('.atlasModal').find('input[type="checkbox"]').prop('checked', false);
        settings.thisobject.find('.atlasModal').find('input[type="hidden"]').val("");
    }

    // call the main GETTER function to get data to populate the table
    function getAll(settings) {
        var tabledata;
            $.ajax({
                url: settings.getAllUrl,
                type: settings.ajaxSettings.type,
                dataType: settings.ajaxSettings.dataType,
                async: false,
                contentType: 'application/json; charset=utf-8',
                success: function (msg) {
                    // if the server is asp.net, the data will contain
                    // a wrapper: d. extract this for the data.
                    if (msg.hasOwnProperty("d"))
                        tabledata = msg.d;
                    else
                        tabledata = msg;
                },
                error: function (msg) {
                    alert("Data wasn't received.");
                    //location.reload(true);
                }
            });
        return tabledata;
    }

    // utility build table
    // receive: array of data objects
    // return: text of table
    function buildTable(settings) {
        
        var table = "<table cellspacing='0' cellpadding='0' border='0'>";
        
        if (settings.showColumnHeaders == true)
            table += "<thead><tr class='head'>";

        if (settings.defaultData.length > 0) {
            var obsample = settings.defaultData[0];
            var thead = new Array();
            for (var o in obsample) {
                if (settings.showColumnHeaders == true) {
                    if (settings.hiddenColumns.indexOf(o) < 0) {
                        table += "<th>" + o + "</th>";
                    }
                }
                thead.push(o);
            }

            if (settings.showColumnHeaders == true) {
                if (settings.showInlineControls == true)
                    table += "<th>Actions</th>";
                else
                    table += "<th></th>";
                table += "</tr></thead>";
            }

            table += "<tbody>";

            settings.columnHeaders = thead; // create the column headers so we can use somewhere else
            var flag = false;
            var primary;

            for (var i = 0; i < (settings.defaultData.length); i++) {
                var ob = settings.defaultData[i];
                if (settings.recordSearchItem != '' )
                    primary = settings.recordSearchItem;
                else
                    primary = thead[0];
                table += "<tr data-id='" + ob[primary] + "'>";
                for (var o = 0; o < thead.length; o++) {
                    if (settings.hiddenColumns.indexOf(thead[o]) < 0) {
                        table += "<td class='" + thead[o] + "'>" + ob[thead[o]];
                        table += "</td>";
                    }
                }
                if (settings.showInlineControls == true)
                    table += "<td class='table-action'><span class='edit'></span><span class='delete' data-id='" + ob[thead[0]] + "'></span></td>";
                else
                    table += "<td><span class='delete' data-id='" + ob[thead[0]] + "'></span></td></tr>";
            }
        }
        else {
            table += "<tbody><tr class='no-data'><td>No data available from the database. Why not add some?</td></tr>";
        }

        table += "</tbody></table><input type='button' class='addButton' />";

        return table;
    }

    // create form for editing/adding
    // receive: form fields object
    // return: text for modal form
    function createForm(data) {

        var form = "<div class='atlasModal'><div class='modalTitle'><span>Edit Record</span></div><div class='cont'>";
        var fields = "";
        $.each(data, function () {
            if ($(this).prop('type') != 'hidden') {
                fields += "<div class='inputholder' >";
                fields += "<label>" + $(this).prop('title') + "</label>";
            }
            if ($(this).prop('type') != 'select') {
                fields += "<input type='" + $(this).prop('type') + "' id='" + $(this).prop('domid') + "' ";
                if ($(this).prop('placeholder'))
                    fields += "placeholder='" + $(this).prop('placeholder') + "' ";
                if ($(this).prop('enabled'))
                    fields += "disabled='" + $(this).prop('enabled') + "' ";
                fields += ">";
            }
            else if ($(this).prop('type') == 'hidden') {
                fields += "<input type='hidden' id='" + $(this).prop('domid') + "' value='' />";
            }
            else {
                fields += "<select id='" + $(this).prop('domid') + "'>";
                var optionlist = $(this).prop('options');
                $.each(optionlist, function (idx, val) {
                    fields += "<option value='" + idx + "'";
                    fields += ">" + val + "</option>";
                });
                fields += "</select>";
            }
            if ($(this).prop('type') != 'hidden')
                fields += "</div>";
        });
        form += fields + "</div>";
        form += "<div class='foot'><input type='button' class='formBtn close' value='Close' />";
        form += "<input type='button' class='formBtn save' value='Save' /></div></div>";
        $('html').append('<div class="cover"></div>');

        return form;
    }

    // get 1 record
    function getOne(id, settings) {
        var singledata;
        settings.currentRow = id;
        $.ajax({
            url: settings.getOneUrl,
            type: 'POST',
            dataType: settings.ajaxSettings.dataType,
            data: "{ 'id' : '" + id + "'}",
            async: false,
            cache: false,
            contentType: 'application/json; charset=utf-8',
            success: function (msg) {
                // if the server is asp.net, the data will contain
                // a wrapper: d. extract this for the data.
                if (msg.hasOwnProperty("d"))
                    singledata = msg.d;
                else
                    singledata = msg;
            },
            error: function (msg) {
                alert("Data wasn't received.");
            }
        });
        return singledata;
    }


    // fill information on edit form
    function fillForm(data, settings) {
        $.each(settings.formFields, function (idx, val) {
            if (val.type == 'checkbox' && val.hasOwnProperty('states')) {
                if (data[idx] == val['states']['checked'])
                    $('#' + val.domid).prop('checked', true);
                else
                    $('#' + val.domid).prop('checked', false);
            }
            $('#' + val.domid).val(data[idx]);
        });
    }

    // collect data according to formFields and save the data
    function submitForm(settings) {
        var data = {};

        $.each(settings.formFields, function (idx, val) {
            if (settings.thisobject.data('saveMode') == 'update') {
                    if ($('#' + val.domid).attr('type') != 'checkbox')
                        data[idx] = $('#' + val.domid).val();
                    else {
                        var chk = $('#' + val.domid).prop('checked');
                        if (chk == true) chk = settings.formFields[idx].states['checked'];
                        else chk = settings.formFields[idx].states['unchecked'];
                        data[idx] = chk;
                    }
            }
            else {
                if (!settings.formFields[idx].hasOwnProperty('notForAdd')) {
                    if ($('#' + val.domid).attr('type') != 'checkbox')
                        data[idx] = $('#' + val.domid).val();
                    else {
                        var chk = $('#' + val.domid).prop('checked');
                        if (chk == true) chk = settings.formFields[idx].states['checked'];
                        else chk = settings.formFields[idx].states['unchecked'];
                        data[idx] = chk;
                    }
                }
            }
        });

        var saveurl;

        if (settings.thisobject.data('saveMode') == 'update')
            saveurl = settings.saveOneUrl;
        else
            saveurl = settings.addOneUrl;
        settings.thisobject.find('.atlasModal .cont').atlasAjaxOverlay();
        settings.thisobject.find('.atlasModal .cont').atlasAjaxOverlay('show');
        setTimeout(function () {
            $.ajax({
                type: 'POST',
                url: saveurl,
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(data),
                dataType: 'json',
                async: false,
                success: function (returndata) {

                    if (returndata.hasOwnProperty('d'))
                        returndata = returndata.d;
                    settings.thisobject.find('.atlasModal .cont').atlasAjaxOverlay('hide');
                    settings.thisobject.find('.atlasModal').fadeOut(200);
                    $(".cover").fadeOut(200);
                    if (settings.thisobject.data('saveMode') == 'update') {
                        setTimeout(function () { updateRow(true, data, settings) }, 800);
                        setTimeout(function () { updateRow(false, data, settings) }, 1600);
                    }
                    else {
                        var newrow;
                        setTimeout(function () { newrow = addRow(true, returndata, settings) }, 900);
                        setTimeout(function () { addRow(false, newrow, settings) }, 1800);
                    }
                }
            });
        }, 100);
    }

    // update the row being displayed that was edited
    function updateRow(state, data, settings) {
        var rows = settings.thisobject.find('.atlasTable').find('tr:not(.head)');
        var updaterow;

        $.each(rows, function() {
            if ($(this).data('id') == settings.currentRow)
                updaterow = $(this);
        });
        
        if (state == true) {
            // this modifies the data with a new data, and shows a orange glow
            // NOTE: update with CSS KEYFRAME ANIMATIONS to not call this method twice
            $.each(updaterow.children('td'), function () {
                if ($(this).attr('class') != 'table-action') {
                    $(this)
                        .css('transition', 'all 0.3s ease-In-Out')
                        .css('background-color', '#ffbc83')
                        .css('pointer-events', 'none')
                        .html(data[$(this).attr('class')]);
                }
            });
        }
        else {
            // this just basically removes the orange glow
            $.each(updaterow.children('td'), function () {
                if ($(this).attr('class') != 'table-action') {
                    $(this).removeAttr('style');
                }
            });
        }
    }

    // add the new row that has been added; to the end
    function addRow(state, data, settings) {
        var samplerow = settings.thisobject.find('.atlasTable').find('tr:not(.head)')[0];
        var newrow = "<tr";
        var first = false;
        if (state == true) {
            if (settings.thisobject.find('.atlasTable').find('tr:not(.head)') > 1) {
                // this modifies the data with a new data, and shows a orange glow
                // NOTE: update with CSS KEYFRAME ANIMATIONS to not call this method twice
                $.each($(samplerow).children('td'), function () {
                    if (!first) {
                        newrow += " data-id='" + data[$(this).attr('class')] + "'>";
                        first = true;
                    }
                    newrow += "<td class='" + $(this).attr('class') + "'>" + data[$(this).attr('class')];
                    if (settings.showInlineControls == true)
                        newrow += "<td class='table-action'><span class='edit'>Edit</span><span class='delete'>Delete</span></td>";
                    newrow += "</td>";
                });
                settings.thisobject.find('.atlasTable').append(newrow);

                var addedrow = settings.thisobject.find('.atlasTable').find('tr:last-child');
                $(addedrow).focus();    // focus on the newly added row
                addEvents(settings, addedrow);
                $.each($(addedrow).children('td'), function () { // animate by adding the orange glow
                    if ($(this).attr('class') != 'table-action') {
                        $(this)
                            .css('transition', 'all 0.3s ease-In-Out')
                            .css('background-color', '#ffbc83')
                            .css('pointer-events', 'none')
                            .html(data[$(this).attr('class')]);
                    }
                });
                return $(addedrow);  // i wont need to do this if im doing keyframes
            }
            else
                location.reload(true);
        }
        else {
            // this just basically removes the orange glow
            $.each($(data).children('td'), function () {
                if ($(this).attr('class') != 'table-action') {
                    $(this).removeAttr('style');
                }
            });
        }
    }

    // delete a record
    function deleteRow(id, settings) {
        $.ajax({
            url: settings.deleteOneUrl,
            type: 'POST',
            dataType: settings.ajaxSettings.dataType,
            data: '{ "ID":"' + id + '"}',
            contentType: 'application/json; charset=utf-8',
            success: function (msg) {
                var rows = settings.thisobject.find('.atlasTable').find('tr:not(.head)');
                $.each(rows, function () {
                    if ($(this).data('id') == id) { $(this).remove(); }
                });
                var rows = settings.thisobject.find('.atlasTable').find('tr:not(.head)');
                if (rows.length < 1) {
                    settings.thisobject.find('.atlasTable').find('tr').remove();
                    settings.thisobject.find('.atlasTable').append("<tr class='no-data'><td>No data available from the database.</td></tr>");
                }
                style(settings, true);
            },
            error: function (msg) {
                alert("Error: Delete record");
            }
        });
    }

    // load data to table
    function loadTable(settings) {
        var table;
        table = "<div class='atlasTableContainer'>";
        if (settings.showHeader == true)
            table += "<div class='header'>" + settings.header + "<span class='tableToggle'></span></div>";
        table += "</div>";

        settings.thisobject.append(table);

        settings.thisobject.atlasAjaxOverlay();
        settings.thisobject.atlasAjaxOverlay('show');

        table = "";

        setTimeout(function () { 
            if (settings.getAllUrl != "" && settings.useRemoteDataSource == true) {
                settings.defaultData = getAll(settings);
            }
            table = buildTable(settings);
            settings.thisobject.find('.atlasTableContainer').append(table);
            table = settings.thisobject.find('.atlasTableContainer').find('table');

            style(settings, false);

            if (settings.editable && settings.formFields != null)
                settings.thisobject.append(createForm(settings.formFields));
            if (settings.editable && settings.formFields != null)
                addEvents(settings, null);

            
            console.log($("#area"));

            settings.thisobject.atlasAjaxOverlay('hide');
            if ($.isFunction(settings.onComplete))
                settings.onComplete.call(settings.thisobject);

            settings.thisobject.find('.atlasTable').fadeIn(300);
            activatEvents(settings);
        }, 300);
    }

    function activatEvents(settings) {
        $.each(settings.formFields, function () {
            var field = $(this).prop('domid');
            console.log(field);
            var dom = $(field);
            if ($(this).prop('callback') != null && $.isFunction($(this).prop('callback'))) {
                $(this).prop('callback');
            }
        });
    }

    function style(settings, deleted) {
        settings.thisobject.find('.atlasTableContainer').find('table').addClass('atlasTable');
        settings.thisobject.find('.atlasTable').find('tr:odd').addClass('odd');
        settings.thisobject.find('.atlasTable').find('tr:even').addClass('even');
        var width = settings.thisobject.find('.atlasTable').css('width');
        width = parseInt(width.replace('px', ''));
        console.log(width);
        if (width < 500) {
            console.log(settings.thisobject.find('.atlasTable').find('tr:first-child').children('th'));
            if (settings.thisobject.find('.atlasTable').find('tr:first-child').children('th').length > 4) {
                settings.thisobject.find('.atlasTable').css('font-size', '0.9em');
            }
        }
        if (!deleted)
            page(settings);
    }

    function page(settings) {
        var dsp = settings.displayAmount;
        var rows = settings.thisobject.find('.atlasTable').find('tr:not(.head)');

        settings.currentPage = 0;

        // get the number of pages that contain the displayamounts per page
        var pagecount = parseInt(rows.length / settings.displayAmount);
        var dec = rows.length % settings.displayAmount;
        if (dec > 0) pagecount++;
        settings.rows = new Array(pagecount);

        // initialize the arrays into arrays
        for (var i = 0; i < pagecount; i++) settings.rows[i] = new Array();

        // arbitrary counter
        var rowct = 0;

        // divide the rows array into the number of pages (the remaining extra will be on the last)
        for (var i = 0; i < pagecount; i++)
            for (var o = 0; o < dsp; o++)
                if (rows[rowct] != null)
                    settings.rows[i].push(rows[rowct++]);

        // hide everything
        for (var i = 0; i < pagecount; i++) {
            $(settings.rows[i]).hide();
        }

        $(settings.rows[0]).fadeIn(300);

        var pagecounter = "<div class='page-counter'><ul><li><</li>";

        for (var i = 0; i < pagecount; i++) pagecounter += "<li>" + (i + 1) + "</li>";

        pagecounter += "<li>></li></div>";
        settings.thisobject.find('.atlasTableContainer').append('<div class="entry-count">1-10 of 10 entries</div>');
        settings.thisobject.find('.atlasTableContainer').append(pagecounter);
    }
        
    var methods = {
        // =============================================================================
        // INITIALIZE - attach the plugin, attach events, attach css
        // =============================================================================
        initialize: function (object, options) {

            return object.each(function () {
                var settings = $(this).data('tablesettings');
                settings.thisobject = $(this);
                console.log(settings);
                $(this).css('width', settings.containerWidth + "%");
                if (settings.containerWidth < 100)
                    $(this).css('margin', 'auto');
                loadTable(settings);

                // bind the jquery reference to the element (the div or any container)
                $(this).data('data', settings.thisobject);
                
            });
        },

        // =============================================================================
        // DESTROY THE TABLE
        // =============================================================================
        destroy: function (object) {

        }

    }

})(jQuery);