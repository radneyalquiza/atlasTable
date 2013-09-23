// ========================================================================================== //
//  Atlas Table (v0.1)
//  by Radney Aaron Alquiza
//  Sept 20, 2013
// ========================================================================================== //

// a table plugin that will be applied to either JSON data or a table element
// passed into it


// the user must initialize a container(div,etc) that will contain the table

(function ($) {

    // default settings
    var tablesettings = {
        containerWidth: '300',
        defaultData: null,
        header: 'Default',
        showHeader: true,
        showInlineControls: true,
        displayAmount: 10,
        editable: true,
        showColumnHeaders: true,
        addFcn: null,
        editFcn: null,
        deleteUrl: '',
        getAllUrl: '',
        getOneUrl: '',
        saveOneUrl: '',
        addOneUrl: '',
        ajaxSettings: { dataType:'json', type:'GET', async:false },
        formFields: {},
        thisobject: null,
        currentRow: "",
        modalCover: '<div class="cover"></div>'
    };

    $.fn.atlasTable = function (options_or_method, otherparams) {

        if (tablesettings.editable == true)
            $('body').append(tablesettings.modalCover);  // to cover the modal

        var domelement = null;
        if (methods != null) {
            // if the parameter passed is nothing or a javascript object
            if (otherparams == null && options_or_method == null || (typeof options_or_method === 'object' && options_or_method != null)) {
                if (domelement == null) {
                    tablesettings = $.extend(tablesettings, options_or_method);
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
    function addEvents(object) {
        var table = $(object).find('table');
        table.addClass('atlasTable');
        table.find('tr:odd').addClass('odd');

        // if the table isn't showing inline controls, clicking on
        // a record will open its editable view
        if (tablesettings.showInlineControls == false) {
            if (tablesettings.editable) {
                $(table).find('tr:not(.head)').click(function () {
                    tablesettings.thisobject.data('saveMode', 'update');
                    var thisob = $(this).parents('table');
                    var rowid = $(this).attr('id');

                    thisob.isLoading({ position: "overlay" });
                    
                    setTimeout(function () {
                        fillForm(getOne(rowid));
                        positionModal($('.atlasModal'));//$(this).attr('id'));
                        $('.cover').fadeIn(100);
                        thisob.isLoading("hide");
                    }, 600);
                });
            }
        }
        else {
            $(table).find('.edit').click(function () {
                tablesettings.thisobject.data('saveMode', 'update');
                var thisob = $(this).parents('table');
                var rowid = $(this).parents('tr').attr('id');

                thisob.isLoading({ position: "overlay" });

                setTimeout(function () {
                    fillForm(getOne(rowid));
                    positionModal($('.atlasModal'));//$(this).attr('id'));
                    $('.cover').fadeIn(100);
                    thisob.isLoading("hide");
                }, 600);
            });
        }

        // adding new record
        $('.addButton').click(function () {
            tablesettings.thisobject.data('saveMode', 'add');
            clearForm();
            positionModal($('.atlasModal'));
            $('.cover').fadeIn(100);
        });

        // form interaction
        $('.formBtn.close').click(function () {
            $(this).parents('.atlasModal').hide();
            clearForm();
            $('.cover').hide();
        });

        $('.formBtn.save').click(function () {
            submitForm();
        });
    }
   
    // dynamically position and animate the modal form
    function positionModal(object) {
        var width = object.width();
        var height = object.height();
        object.css('left', '50%').css('margin-left', "-" + width / 2 + "px");
        object.css('top', '50%').css('margin-top', "-" + height / 2 + "px");
        object.fadeIn(100);
    }

    // clear values in all fields in the modal form
    function clearForm() {
        $('.atlasModal').find('input[type="text"]').val("");
        $('.atlasModal').find('select').val("");
        $('.atlasModal').find('input[type="checkbox"]').prop('checked', false);
        $('.atlasModal').find('input[type="hidden"]').val("");
    }

    // call the main GETTER function to get data to populate the table
    function getAll() {
        var tabledata;
            $.ajax({
                url: tablesettings.getAllUrl,
                type: tablesettings.ajaxSettings.type,
                dataType: tablesettings.ajaxSettings.dataType,
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
                }
            });
        return tabledata;
    }

    // utility build table
    // receive: array of data objects
    // return: text of table
    function buildTable(data) {

        var table = "<div class='atlasTableContainer'>";
        if (tablesettings.showHeader == true)
            table += "<div class='header'>" + tablesettings.header + "</div>";
        
        table+="<table cellspacing='0' cellpadding='0' border='0'><thead>";
        
        if (tablesettings.showColumnHeaders == true)
            table += "<tr class='head'>";
        var obsample = tablesettings.defaultData[0];
        var thead = new Array();
        for (var o in obsample) {
            if (tablesettings.showColumnHeaders == true)
                table += "<th>" + o + "</th>";
            thead.push(o);
        }

        if (tablesettings.showColumnHeaders == true) {
            if (tablesettings.showInlineControls == true)
                table += "<th>Actions</th>";
            table += "</tr></thead>";
        }

        table += "<tbody>";

        for (var i = 0; i < tablesettings.defaultData.length; i++) {
            var ob = tablesettings.defaultData[i];
            table += "<tr id='" + ob[thead[0]] + "'>";
            for (var o = 0; o < thead.length; o++)
                table += "<td class='" + thead[o] + "'>" + ob[thead[o]] + "</td>";
            if (tablesettings.showInlineControls == true)
                table += "<td class='table-action'><span class='edit'>Edit</span><span class='delete'>Delete</span></td>";
            table += "</tr>";
        }

        table += "</tbody></table><input type='button' class='addButton' value='Add Record'/>";

        table += "</div>";
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
        form += "<input type='button' class='formBtn save' value='Save' /></div></div><div class='cover'></div>";
        return form;
    }

    // get 1 record
    function getOne(id) {
        var singledata;
        tablesettings.currentRow = id;
        $.ajax({
            url: tablesettings.getOneUrl,
            type: 'POST',
            dataType: tablesettings.ajaxSettings.dataType,
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
    function fillForm(data) {
        $.each(tablesettings.formFields, function (idx, val) {
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
    function submitForm() {
        var data = {};
        $.each(tablesettings.formFields, function (idx, val) {
            if (tablesettings.thisobject.data('saveMode') == 'update') {
                    if ($('#' + val.domid).attr('type') != 'checkbox')
                        data[idx] = $('#' + val.domid).val();
                    else {
                        var chk = $('#' + val.domid).prop('checked');
                        if (chk == true) chk = tablesettings.formFields[idx].states['checked'];
                        else chk = tablesettings.formFields[idx].states['unchecked'];
                        data[idx] = chk;
                    }
            }
            else {
                if (!tablesettings.formFields[idx].hasOwnProperty('notForAdd')) {
                    if ($('#' + val.domid).attr('type') != 'checkbox')
                        data[idx] = $('#' + val.domid).val();
                    else {
                        var chk = $('#' + val.domid).prop('checked');
                        if (chk == true) chk = tablesettings.formFields[idx].states['checked'];
                        else chk = tablesettings.formFields[idx].states['unchecked'];
                        data[idx] = chk;
                    }
                }
            }
        });

        var saveurl;

        if (tablesettings.thisobject.data('saveMode') == 'update')
            saveurl = tablesettings.saveOneUrl;
        else
            saveurl = tablesettings.addOneUrl;

        setTimeout(function () {
            $.ajax({
                type: 'POST',
                url: saveurl,
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(data),
                dataType: 'json',
                async: false,
                success: function (msg1) {
                    tablesettings.thisobject.find('.atlasModal').fadeOut(200);
                    $(".cover").fadeOut(200);
                    setTimeout(function () {updateRow(true, data)}, 800);
                    setTimeout(function () {updateRow(false, data)}, 1600);
                }
            });
        }, 100);
    }

    // update the row being displayed that was edited
    function updateRow(state, data) {
        var updaterow = tablesettings.thisobject.find('.atlasTable').find('tr#' + tablesettings.currentRow);
        if (state == true) {
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
            $.each(updaterow.children('td'), function () {
                if ($(this).attr('class') != 'table-action') {
                    $(this).removeAttr('style');
                }
            });
        }
    }

    // load data to table
    function loadTable() {
        var table;
        tablesettings.thisobject.isLoading({
            position: "overlay"
        });
        setTimeout(function () { 
            if (tablesettings.getAllUrl != "") {
                tablesettings.defaultData = getAll();
            }
            table = buildTable(tablesettings.defaultData);
            tablesettings.thisobject.append(table);
            if (tablesettings.editable)
                tablesettings.thisobject.append(createForm(tablesettings.formFields));
            addEvents(tablesettings.thisobject);
            tablesettings.thisobject.isLoading("hide");
        }, 800);
    }
    
    var methods = {
        // =============================================================================
        // INITIALIZE - attach the plugin, attach events, attach css
        // =============================================================================
        initialize: function (object, options) {

            return object.each(function () {
                // this is the container element
                tablesettings.thisobject = $(this);
                loadTable();

                // bind the jquery reference to the element (the div or any container)
                $(this).data('data', tablesettings.thisobject);
            });
        },

        // =============================================================================
        // DESTROY THE TABLE
        // =============================================================================
        destroy: function (object) {

        }

    }

})(jQuery);