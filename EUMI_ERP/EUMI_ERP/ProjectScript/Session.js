// Session.js
// Globals
var SessionRowCount = 0;

// -------------------------------------------------------
// Document Ready
// -------------------------------------------------------
$(document).ready(function () {
    $('.form-control').attr('autocomplete', 'off');
    ProcedureAutocomplete();
});

// -------------------------------------------------------
// Procedure Autocomplete (jquery-ui, same as project pattern)
// -------------------------------------------------------
function ProcedureAutocomplete() {
    $("#ProcedureName").autocomplete({
        delay: 200,
        minLength: 1,
        source: function (request, response) {
            var data = {};
            data.ProcedureName = $("#ProcedureName").val();
            $.ajax({
                type: "POST",
                url: "../Session/HMS_ProcedureSearch",
                data: data,
                success: function (result) {
                    if (result.oList.length > 0) {
                        response($.map(result.oList, function (item) {
                            return {
                                label: item.ProcedureName,
                                value: item.ProcedureName,
                                ProcedureId: item.ProcedureId
                            };
                        }));
                    } else {
                        response([]);
                    }
                }
            });
        },
        select: function (event, ui) {
            $("#ProcedureName").val(ui.item.value);
            $("#HidProcedureId").val(ui.item.ProcedureId);
        }
    });
}

// -------------------------------------------------------
// AddProcedure: "+" button - loads existing treatment if any
// -------------------------------------------------------
function AddProcedure() {
    var procName = $.trim($("#ProcedureName").val());
    var procId = $("#HidProcedureId").val();

    if (procName === '' || procId == '0' || procId === '') {
        warningshow('Please select a Procedure from the list', 'ProcedureName');
        return;
    }

    var data = {};
    data.ProcedureId = procId;
    data.TreatmentId = 0;
    $.ajax({
        type: "POST",
        url: "../Session/HMS_SessionTreatmentGetandGets",
        data: data,
        success: function (result) {
            if (result.oHeaderList.length > 0) {
                // Load existing record
                var hdr = result.oHeaderList[0];
                $("#HidTreatmentId").val(hdr.TreatmentId);
                $("#NoOfSessions").val(hdr.NumberOfSessions);
                LoadExistingDays(result.oDayList);
            } else {
                // New procedure - show empty grid with one blank row
                $("#HidTreatmentId").val(0);
                ClearGrid();
                AddSessionRow(0, 0, '');
                $("#divSessionDays").show();
            }
        }
    });
}

// -------------------------------------------------------
// Apply: generate N blank session rows from the spinner
// -------------------------------------------------------
function ApplySessions() {
    var n = parseInt($("#NoOfSessions").val());
    if (isNaN(n) || n <= 0) {
        warningshow('Enter a valid No. of Sessions', 'NoOfSessions');
        return;
    }
    ClearGrid();
    for (var i = 1; i <= n; i++) {
        AddSessionRow(i, 0, '');
    }
    $("#divSessionDays").show();
}

// -------------------------------------------------------
// Load existing day rows returned from GetandGets
// -------------------------------------------------------
function LoadExistingDays(dayList) {
    ClearGrid();
    for (var i = 0; i < dayList.length; i++) {
        AddSessionRow(
            dayList[i].SessionNumber,
            dayList[i].Duration,
            dayList[i].Notes,
            dayList[i].DayId
        );
    }
    $("#divSessionDays").show();
}

// -------------------------------------------------------
// AddSessionRow: appends one editable row to the grid
// DayId = 0 for new (unsaved) rows
// -------------------------------------------------------
function AddSessionRow(sessionNum, duration, notes, dayId) {
    SessionRowCount++;
    var id = SessionRowCount;
    dayId = (dayId !== undefined && dayId !== null) ? dayId : 0;

    var row = "<tr id='SRow_" + id + "'>" +
        "<td class='jsgrid-cell p-1' style='text-align:center; width:5%;'>" + id + "</td>" +
        "<td class='jsgrid-cell p-1' style='width:30%;'>" +
        "<input type='number' id='SessionNum_" + id + "' class='form-control' " +
        "placeholder='Session #' min='0' value='" + (sessionNum || '') + "' />" +
        "<input type='hidden' id='DayId_" + id + "' value='" + dayId + "' />" +
        "</td>" +
        "<td class='jsgrid-cell p-1' style='width:25%;'>" +
        "<input type='number' id='Duration_" + id + "' class='form-control' " +
        "placeholder='Hours' min='0' step='0.5' value='" + (duration || '') + "' />" +
        "</td>" +
        "<td class='jsgrid-cell p-1' style='width:30%;'>" +
        "<input type='text' id='Notes_" + id + "' class='form-control' " +
        "placeholder='Notes' value='" + (notes || '') + "' />" +
        "</td>" +
        "<td class='jsgrid-cell p-1' style='text-align:center; width:10%;'>" +
        "<button class='btn btn-danger btn-sm' onclick='RemoveSessionRow(" + id + ")'>Remove</button>" +
        "</td>" +
        "</tr>";

    $("#tblSessionBody").append(row);
}

// -------------------------------------------------------
// RemoveSessionRow
// Existing DB row → soft-delete via SP then remove DOM
// New row (DayId=0) → remove DOM only
// -------------------------------------------------------
function RemoveSessionRow(id) {
    var dayId = parseInt($("#DayId_" + id).val() || 0);

    if (dayId > 0) {
        var data = {};
        data.DayId = dayId;
        data.CreatedBy = ERPUserId;   // mapped to @UserId in DSession
        $.ajax({
            type: "POST",
            url: "../Session/HMS_SessionDayDelete",
            data: data,
            success: function (result) {
                if (result.oList.length > 0 && result.oList[0].Status == '1') {
                    $("#SRow_" + id).remove();
                    RenumberRows();
                } else {
                    warningshow('Could not delete the session row', '');
                }
            }
        });
    } else {
        $("#SRow_" + id).remove();
        RenumberRows();
    }
}

// -------------------------------------------------------
// RenumberRows: re-index SL# column after a removal
// -------------------------------------------------------
function RenumberRows() {
    var i = 1;
    $("#tblSessionBody tr").each(function () {
        $(this).find("td:first").text(i);
        i++;
    });
}

// -------------------------------------------------------
// SaveSession: validate → build JSON → POST
// -------------------------------------------------------
function SaveSession() {
    var procId = $.trim($("#HidProcedureId").val());
    var procName = $.trim($("#ProcedureName").val());

    if (procId === '' || procId == '0') {
        warningshow('Please select a Procedure', 'ProcedureName');
        return;
    }

    var rows = $("#tblSessionBody tr");
    if (rows.length === 0) {
        warningshow('Please add at least one Session row', 'btnAddSession');
        return;
    }

    // Build day rows JSON array
    var dayRows = [];
    var valid = true;
    rows.each(function () {
        if (!valid) return false;
        var rowId = $(this).attr('id').replace('SRow_', '');
        var dayId = parseInt($("#DayId_" + rowId).val() || 0);
        var sessNum = $.trim($("#SessionNum_" + rowId).val());
        var dur = $.trim($("#Duration_" + rowId).val());
        var note = $("#Notes_" + rowId).val();

        if (sessNum === '' || parseInt(sessNum) < 0) {
            warningshow('Session # is required in all rows', 'SessionNum_' + rowId);
            valid = false;
            return false;
        }

        dayRows.push({
            DayId: dayId,
            SessionNumber: parseInt(sessNum),
            DayOfWeek: parseInt(sessNum),   // DayOfWeek = SessionNumber per table design
            Duration: parseFloat(dur || 0),
            DisplayOrder: parseInt(rowId),
            Notes: note,
            DelFlag: 1
        });
    });

    if (!valid) return;

    var treatmentId = parseInt($("#HidTreatmentId").val() || 0);

    var data = {};
    data.TreatmentId = treatmentId;
    data.ProcedureId = procId;
    data.TreatmentName = procName;
    data.NumberOfSessions = rows.length;
    data.DefaultDuration = 0;
    data.IsActive = 1;
    data.DelFlag = 1;            // 1 = Save/Update
    data.CreatedBy = ERPUserId;
    data.ModifiedBy = ERPUserId;
    data.SessionDaysJson = JSON.stringify(dayRows);

    $.ajax({
        type: "POST",
        url: "../Session/HMS_SessionTreatmentInsertandUpdate",
        data: data,
        success: function (result) {
            if (result.oList.length > 0) {
                var status = result.oList[0].Status;
                if (status == '1') {
                    $("#HidTreatmentId").val(result.oList[0].TreatmentId);
                    swal('Saved Successfully', '', 'success');
                    $('.swal-button--confirm').focus();
                } else if (status == '2') {
                    swal('Updated Successfully', '', 'success');
                    $('.swal-button--confirm').focus();
                } else if (status == '0') {
                    swal('Treatment already exists for this Procedure', '', 'warning');
                    $('.swal-button--confirm').focus();
                } else {
                    swal('Error saving record', '', 'error');
                    $('.swal-button--confirm').focus();
                }
            }
        }
    });
}

// -------------------------------------------------------
// ClearForm: reset entire form
// -------------------------------------------------------
function ClearForm() {
    $("#ProcedureName").val('');
    $("#HidProcedureId").val(0);
    $("#HidTreatmentId").val(0);
    $("#NoOfSessions").val('');
    ClearGrid();
    $("#divSessionDays").hide();
}

function ClearGrid() {
    $("#tblSessionBody").empty();
    SessionRowCount = 0;
}

// -------------------------------------------------------
// Warning popup — matches project pattern from ProcedureBill.js
// -------------------------------------------------------
function warningshow(message, Id) {
    $('#popupmessage').text(message);
    $('#Warningpopup').show();
    if (Id !== '') { try { $('#' + Id).focus().select(); } catch (e) { } }
    window.setTimeout(function () {
        $('#Warningpopup').fadeOut();
    }, 3000);
}