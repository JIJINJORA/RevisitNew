var Decimal = 2;
var ERPDeptId = 1;      // Change this to your actual department ID
var ERPUserId = 1;      // Change this to your actual user ID
var Editbutton = '<i class="fa fa-edit"></i>';

var gMethodOptions = '<option value="0">--Select--</option>';
var gSampleTypeOptions = '<option value="0">--Select--</option>'; //added

$(document).ready(function () {
    Defaultfocus();
    MedicalDepartmentLoad();

    LoadMethodDropdown();    //added
    LoadSampleTypeDropdown();

    $('#myModal').on('shown.bs.modal', function () {
        $('#NormalValue_0').focus();
    })

    $("#btnsubmit").click(function (e) {
        SaveandUpdateTest(1);
    });
    $("#btnlist").click(function (e) {
        GetRows(0);
        formrefresh();
    });
    $("#btnnew").click(function (e) {
        formrefresh();
    });
    $("#btndelete").click(function (e) {
        SaveandUpdateTest(0);
    });

    $('#HeaderMethod').change(function () {
        var selectedValue = $(this).val();
        var selectedText = $(this).find('option:selected').text();

        // Update all grid row Method dropdowns
        for (var i = 1; i <= $("#GridLength").val(); i++) {
            if ($('#Method_' + i).length) {
                $('#Method_' + i).val(selectedValue);
                // Optional: Also update the display text if needed
                $('#Method_' + i).find('option:selected').text(selectedText);
            }
        }
    });

    $('#HeaderSampleType').change(function () {
        var selectedValue = $(this).val();
        var selectedText = $(this).find('option:selected').text();

        // Update all grid row Sample Type dropdowns
        for (var i = 1; i <= $("#GridLength").val(); i++) {
            if ($('#SampleType_' + i).length) {
                $('#SampleType_' + i).val(selectedValue);
                // Optional: Also update the display text if needed
                $('#SampleType_' + i).find('option:selected').text(selectedText);
            }
        }
    });

    $('#MedDept').keydown(function (e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if (key == 13) {
            e.preventDefault();
            $('#SubDivision').focus();
        }
    });
    $('#SubDivision').keydown(function (e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if (key == 13) {
            e.preventDefault();
            if ($.trim($("#TestName").val()) == '') {
                warningshow('Enter Test Name', 'TestName');
            }
            else if (parseFloat($("#Rate").val() || 0) == 0) {
                warningshow('Enter Rate', 'Rate');
            }
            else if (parseInt($("#MedDept").val() || 0) == 0) {
                warningshow('Select Department', 'MedDept');
            }
           else if ($("#SubDivision").val() == 'NO') {
                $('#SubDiv_1').prop("disabled", true);
                $('#SubDiv_1').val($("#TestName").val());
                $("#StdUnit_1").focus();
                $('#StdUnit_1').select();
            }
            else if ($("#SubDivision").val() == 'YES') {
                $('#SubDiv_1').prop("disabled", false);
                $('#SubDiv_1').focus();
                $('#SubDiv_1').select();
            }
            else {
                warningshow('Select Sub Division', 'SubDivision');
            }
        }
    });

    $('.enterflow').keydown(function (e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if (key == 13) {
            e.preventDefault();
            var inputs = $(this).closest('form').find(':input:enabled');
            inputs.eq(inputs.index(this) + 1).focus();
            inputs.eq(inputs.index(this) + 1).select();
        }

    });
});

function LoadMethodDropdown() {
    $.ajax({
        url: '../Revisit/GetMethodList',
        type: 'GET',
        success: function (data) {
            gMethodOptions = '<option value="0">--Select--</option>';

            $.each(data.oList, function (i, item) {
                gMethodOptions += '<option value="' + item.Value + '">' + item.Text + '</option>';
            });

            $('#HeaderMethod').html(gMethodOptions);
            $('#Method_1').html(gMethodOptions);
        },
        error: function (xhr) {
            alert('Method Error: ' + xhr.status + ' | ' + xhr.responseText);
        }
    });
}

function LoadSampleTypeDropdown() {
    $.ajax({
        url: '../Revisit/GetSampleTypeList',
        type: 'GET',
        success: function (data) {
            gSampleTypeOptions = '<option value="0">--Select--</option>';

            $.each(data.oList, function (i, item) {
                gSampleTypeOptions += '<option value="' + item.Value + '">' + item.Text + '</option>';
            });

            $('#HeaderSampleType').html(gSampleTypeOptions);
            $('#SampleType_1').html(gSampleTypeOptions);
        },
        error: function (xhr) {
            alert('SampleType Error: ' + xhr.status + ' | ' + xhr.responseText);
        }
    });
}
function PopulateRowDropdowns(rowNum) {
    $('#Method_' + rowNum).html(gMethodOptions);
    $('#SampleType_' + rowNum).html(gSampleTypeOptions);
}
function CheckTestType() {
    if ($("#SubDivision").val() == 'NO') {
        $('#SubDiv_1').prop("disabled", true);
        $('#SubDiv_1').val($("#TestName").val())
    }
}

function MedicalDepartmentLoad() {
    var data = {};                                       //dropdownbind
    data.DepId = 0;
    $.ajax({
        type: "POST",
        url: "../Master/MedDeptGetandGets",
        data: data,
        success: function (result) {
            if (result.oList.length > 0) {
                $("#MedDept").empty();
                $("#MedDept").append("<option value='0'>--Select--</option>");
                for (var i = 0; i < result.oList.length; i++) {
                    $("#MedDept").append("<option value='" + result.oList[i].DepId + "'>" + result.oList[i].Department + "</option>");
                }
            }
        }
    });
}

function NextGrid(Pos, Id, e) {

    var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
    if ($.trim($("#TestName").val()) == '') {
        warningshow('Enter Test Name', 'TestName');
    }
    else if (parseFloat($("#Rate").val() || 0) == 0) {
        warningshow('Enter Rate', 'Rate');
    }
    else if (parseInt($("#MedDept").val() || 0) == 0) {
        warningshow('Select Department', 'MedDept');
    }
    else if (parseInt($("#SubDivision").val() || 0) == 0) {
        warningshow('Select Sub Division', 'SubDivision');
    }
    else {

        if (key == 13 || key == 39) {
            e.preventDefault();
            if (Pos == 'SubDiv_') {
                $("#StdUnit_" + Id).focus();
                $("#StdUnit_" + Id).select();
            }
            else if (Pos == 'StdUnit_') {
                $("#NormalValue_" + Id).focus();
                $("#NormalValue_" + Id).select();
            }
            else if (Pos == 'NormalValue_') {
                $("#MinVal_" + Id).focus();
                $("#MinVal_" + Id).select();
            }
            else if (Pos == 'MinVal_') {
                $("#MaxVal_" + Id).focus();
                $("#MaxVal_" + Id).select();
            }
            else if (Pos == 'MaxVal_' && key!=39) {
                if ($.trim($('#SubDiv_' + Id).val()) == '') {
                    warningshow('Enter Sub Division Name', 'SubDiv_'+Id);
                }
                //else if ($.trim($('#StdUnit_'+ Id).val()) == '') {
                //    warningshow('Enter Standard Unit', 'StdUnit_' + Id);
                //}
                //else if ($.trim($('#NormalValue_' + Id).val()) == '') {
                //    warningshow('Enter Normal Value', 'NormalValue_' + Id);
                //}
                else {
                    CheckTypeTest(Id);
                }

            }
        }
        else if (key == 40) {            // Down Arrow
            e.preventDefault();
            $('.GridText').each((i, item) => {
                var $item = $(item);
                var NextId = parseInt($item.attr('id').match(/\d+/)[0]);
                if (NextId > Id) {
                    $('#' + Pos + NextId).focus().select();
                    return false;
                }
            });
        }
        else if (key == 38) {            // Up Arrow
            e.preventDefault();
            $($('.GridText').get().reverse()).each((i, item) => {
                var $item = $(item);
                var NextId = parseInt($item.attr('id').match(/\d+/)[0]);
                if (NextId < Id) {
                    $('#' + Pos + NextId).focus().select();
                    return false;
                }
            });
        }
        else if (key == 37) {            // Left Arrow
            e.preventDefault();
            if (Pos == 'StdUnit_') {
                $("#SubDiv_" + Id).focus();
                $("#SubDiv_" + Id).select();
            }
            else if (Pos == 'NormalValue_') {
                $("#StdUnit_" + Id).focus();
                $("#StdUnit_" + Id).select();
            }
            else if (Pos == 'MinVal_') {
                $("#NormalValue_" + Id).focus();
                $("#NormalValue_" + Id).select();
            }
            else if (Pos == 'MaxVal_') {
                $("#MinVal_" + Id).focus();
                $("#MinVal_" + Id).select();
            }
        }
    }
}

function CheckType() {
    if ($("#SubDivision").val() == 'NO') {
        $('#SubDiv_1').prop("disabled", true);
        $('#SubDiv_1').val($("#TestName").val())
    }
    else if ($("#SubDivision").val() == 'YES') {
        $('#SubDiv_1').prop("disabled", false);
    }
}

function Defaultfocus() {
    $("#TestName").focus();
}

function CheckTypeTest(Id) {
    if ($("#SubDivision").val() == 'YES') {
        if ($.trim($("#TestName").val()) == '') {
            warningshow('Enter Test Name', 'TestName');
        }
        else if (parseFloat($("#Rate").val() || 0) == 0) {
            warningshow('Enter Rate', 'Rate');
        }
        else if (parseInt($("#MedDept").val() || 0) == 0) {
            warningshow('Select Department', 'MedDept');
        }
        else if (parseInt($("#SubDivision").val() || 0) == 0) {
            warningshow('Select Sub Division', 'SubDivision');
        }
        else {
            var NextId;

            try { NextId = ($('#row_' + Id).closest('tr').next('tr').attr('id')).match(/\d+/)[0]; }
            catch (err) { AddToGrid(); return false;}


            if ($('#SubDiv_' + NextId).length) {
                $("#SubDiv_" + NextId).focus();
            }
            else{
            AddToGrid();
            }
        }
    }
}

function AddToGrid() {
    var no = $('#tbl_testsub tr').length + 1;
    if ($('#tbl_testsub tr').length == 1) {
        $("#GridLength").val(1)
    }
    var id = parseInt($("#GridLength").val()) + 1;

    // Get current header selections
    var currentMethodValue = $('#HeaderMethod').val() || '0';
    var currentSampleTypeValue = $('#HeaderSampleType').val() || '0';

    var ProdEditRow = "<tr class='jsgrid-row addedtr' id='row_" + id + "' >" +
        "<td id='edit_" + id + "' class= 'jsgrid-cell p-1 GridBRow  jsgrid-control-field jsgrid-align-center'  style='width:4%;' >" +
        "<input class='jsgrid-button jsgrid-delete-button'  type= button onclick='DeleteRow(" + id + ")'  title= Delete >" +
        "</td>" +
        "<td id='td_" + id + "' class='jsgrid-cell p-1 GridBRow'  style= 'width:6%;text-align:center' >" + no +
        "<input type='hidden' id='SubTestId_" + id + "' value='0' />" +
        "</td>" +
        "<td class='jsgrid-cell p-1 GridBRow'  style= 'width:22%;' >" +
        "<input type='text' class='form-control GridText' id='SubDiv_" + id + "' onkeydown=NextGrid('SubDiv_','" + id + "',event) />" +
        "</td>" +
        "<td class='jsgrid-cell p-1 GridBRow'  style= 'width:20%;display:none;' >" +
        "<input type='text' class='form-control demed GridText' value='" + $("#MedDept").find("option:selected").text() + "' id='Department_" + id + "' disabled style='background-color:white;' />" +
        "</td>" +
        "<td class='jsgrid-cell p-1 GridBRow'  style= 'width:13%;' >" +
        "<input type='text' class='form-control GridText' id='StdUnit_" + id + "' onkeydown=NextGrid('StdUnit_','" + id + "',event) />" +
        "</td>" +
        "<td class='jsgrid-cell p-1 GridBRow'  style= 'width:26%;' >" +
        "<input type='text' class='form-control GridText' id='NormalValue_" + id + "' ondblclick=ShowModal('" + id + "') onkeydown=NextGrid('NormalValue_','" + id + "',event) />" +
        "</td>" +
        "<td class='jsgrid-cell p-1 GridBRow'  style= 'width:13%;' >" +
        "<input type='text' class='form-control GridText' id='MinVal_" + id + "' onkeydown=NextGrid('MinVal_','" + id + "',event) onkeypress='isNumber_Arrow(event,this)' />" +
        "</td>" +
        "<td class='jsgrid-cell p-1 GridBRow'  style= 'width:13%;' >" +
        "<input type='text' class='form-control GridText' id='MaxVal_" + id + "' onkeydown=NextGrid('MaxVal_','" + id + "',event) onkeypress='isNumber_Arrow(event,this)' />" +
        "</td>" +
        "<td class='jsgrid-cell p-1 GridBRow'  style= 'width:13%;' >" +
        "<select class='form-control GridText' id='Method_" + id + "' onchange='NextGrid(\"Method_\",\"" + id + "\",event)'>" + gMethodOptions + "</select>" +
        "</td>" +
        "<td class='jsgrid-cell p-1 GridBRow'  style= 'width:13%;' >" +
        "<select class='form-control GridText' id='SampleType_" + id + "' onchange='NextGrid(\"SampleType_\",\"" + id + "\",event)'>" + gSampleTypeOptions + "</select>" +
        "</td>" +
        "</tr>";

    $('#tbl_testsub').append(ProdEditRow);

    // Set the new row's dropdowns to match header selections
    $('#Method_' + id).val(currentMethodValue);
    $('#SampleType_' + id).val(currentSampleTypeValue);

    $("#GridLength").val(Number($("#GridLength").val()) + Number(1));
    $("#SubDiv_" + id).focus();
}

function formrefresh() {
    $('.addedtr').remove();
    $('.denull,.GridText').val('');
    $('.dezero').val(0);
    $('#btndelete').hide();
    $('#GridLength').val(1);
    $("#SubDiv_1").prop("disabled", false);
}

function SaveandUpdateTest(Flag) {
    if ($.trim($("#TestName").val()) == '') {
        warningshow('Enter Test Name', 'TestName');
    }
    else if (parseFloat($("#Rate").val() || 0) == 0) {
        warningshow('Enter Rate', 'Rate');
    }
    else if (parseInt($("#MedDept").val() || 0) == 0) {
        warningshow('Select Department', 'MedDept');
    }
    else if (parseInt($("#SubDivision").val() || 0) == 0) {
        warningshow('Select Sub Division', 'SubDivision');
    }
    else if ($.trim($('#SubDiv_1').val()) == '') {
        warningshow('Enter Sub Division Name', 'SubDiv_1');
    }
    //else if ($.trim($('#StdUnit_1').val()) == '') {
    //    warningshow('Enter Standard Unit', 'StdUnit_1');
    //}
    //else if ($.trim($('#NormalValue_1').val()) == '') {
    //    warningshow('Enter Normal Value', 'NormalValue_1');
    //}
    else {
        if (parseInt($('#TestId').val() || 0) == 0) {
            $('#confirm').show();
            $('#confirmOk').prop("disabled", false);
            $('#confirmOk').focus();
            $('#Confirmflag').val('Save'); $('#ConfirmRowId').val(Flag);
            $('#confirmmessage').text('Do you want to save this Test?');
        }
        else if (Flag == 1) {
            $('#confirm').show();
            $('#confirmOk').prop("disabled", false);
            $('#confirmOk').focus();
            $('#Confirmflag').val('Update'); $('#ConfirmRowId').val(Flag);
            $('#confirmmessage').text('Do you want to update this Test?');
        }
        else {
            $('#confirm').show();
            $('#confirmOk').prop("disabled", false);
            $('#confirmOk').focus();
            $('#Confirmflag').val('Delete'); $('#ConfirmRowId').val(Flag);
            $('#confirmmessage').text('Do you want to delete this Test?');
        }

    }
}

function OKSaveandUpdateTest(Flag) {
    var oArray = new Array();

    for (var k = 1; k <= $("#GridLength").val(); k++) {

        var TestId = $('#TestId').val();
        var TestName = $.trim($('#TestName').val());
        var Rate = parseFloat($('#Rate').val() || 0).toFixed(Decimal);
        var SpRate = parseFloat($('#SpRate').val() || 0).toFixed(Decimal);
        var VSpRate = parseFloat($('#VSpRate').val() || 0).toFixed(Decimal);
        var OutsideRate = parseFloat($('#OutsideRate').val() || 0).toFixed(Decimal);
        var MedDept = $('#MedDept').val();
        var SubDivision = $('#SubDivision').val();
        var SubTestId = $("#SubTestId_" + k).val();
        var SubDiv = $.trim($('#SubDiv_' + k).val());
        var StdUnit = $.trim($('#StdUnit_' + k).val());
        var NormalValue = $.trim($('#NormalValue_' + k).val());
        var MinValue = parseFloat($("#MinVal_" + k).val() || 0);
        var MaxValue = parseFloat($("#MaxVal_" + k).val() || 0);
        var Notes = $.trim($("#Notes").val());
        var DeptId = ERPDeptId;
        var UserId = ERPUserId;
        var DelFlag = Flag;
        var EXRate = 0;

        // FIXED: Read from each row's own dropdown, NOT the header
        var MethodId = $('#Method_' + k).val() || 0;
        var SampleTypeId = $('#SampleType_' + k).val() || 0;
        var TATime = parseFloat($('#TATime').val() || 0);

        if (!(typeof SubDiv == "undefined") && SubDiv != '') {
            oArray.push({
                'TestId': TestId,
                'TestName': TestName,
                'Rate': Rate,
                'SpRate': SpRate,
                'VSpRate': VSpRate,
                'OutsideRate': OutsideRate,
                'MedDept': MedDept,
                'SubDivision': SubDivision,
                'SubTestId': SubTestId,
                'SubDiv': SubDiv,
                'StdUnit': StdUnit,
                'NormalValue': NormalValue,
                'MinValue': MinValue,
                'MaxValue': MaxValue,
                'Notes': Notes,
                'DeptId': DeptId,
                'UserId': UserId,
                'DelFlag': DelFlag,
                'EXRate': EXRate,
                'MethodId': MethodId,        // Now reads per-row value
                'SampleTypeId': SampleTypeId, // Now reads per-row value
                'TurnAroundTime': TATime 
            })
        }
    }

    if (oArray != "") {

        var data = { 'HMSTest': oArray };
        $.ajax({
            type: "POST",
            url: "../Revisit/Hms_TestInsertandUpdate",
            data: data,
            success: function (result) {
                var status = result.oList[0].Status;
                Showalerts(status);
            }
        });
    }
    else {
        warningshow('Datas are not complete', 'TestName');

    }
}

function GetRows(Flag) {
    var data = {};                                       //dropdownbind
    data.TestId = Flag;
    data.DeptId = ERPDeptId;

    $.ajax({
        type: "POST",
        url: "../Revisit/HMS_TestGetandGets",
        data: data,
        success: function (result) {
            if (Flag == 0) {
                GetList(result.oList);
            } else {
                GetTest(result.oList);
            }
        }
    });
}

function GetList(result) {
    console.log("GetList called with", result.length, "items");

    $("#listing").show();
    $("#Entry").hide();

    disable_datatable('tbl_Test');
    var responseText = "<thead><tr>" +
        "<th style='align=center'>Sl#</th>" +
        "<th>Test Name</th>" +
        "<th>Rate</th>" +
        "<th>Special Rate</th>" +
        "<th>Special Rate-1</th>" +
        "<th>Outside Rate</th>" +
        "<th>Department</th>" +
        "<th>Sub Division</th>" +
        "<th>Edit</th>" +
        "</tr></thead><tbody>";

    for (var i = 0; i < result.length; i++) {
        var slno = i + 1;

        // Use the correct property names from the stored procedure
        var testName = result[i].TestName || '';
        var rate = parseFloat(result[i].TestRate || 0).toFixed(2);  // Changed from Rate to TestRate
        var spRate = parseFloat(result[i].SpecialRate || 0).toFixed(2);  // Changed from SpRate to SpecialRate
        var vSpRate = parseFloat(result[i].VSpecialRate || 0).toFixed(2);  // Changed from VSpRate to VSpecialRate
        var outsideRate = parseFloat(result[i].OutSideRate || 0).toFixed(2);  // Changed from OutsideRate to OutSideRate
        var department = result[i].Department || '';
        var subDivision = result[i].SubDiv || '';  // Changed from SubDivision to SubDiv
        var testId = result[i].TestId || 0;

        responseText += '<tr>' +
            '<td align="center">' + slno + '</td>' +
            '<td>' + testName + '</td>' +
            '<td align="right">' + rate + '</td>' +
            '<td align="right">' + spRate + '</td>' +
            '<td align="right">' + vSpRate + '</td>' +
            '<td align="right">' + outsideRate + '</td>' +
            '<td>' + department + '</td>' +
            '<td>' + subDivision + '</td>' +
            '<td onclick="GetRows(' + testId + ')" align="center"><a>' + Editbutton + '</a></td>' +
            '</tr>';
    }

    responseText += "</tbody>";
    $('#tbl_Test').html(responseText);
    datatableWithsearch('tbl_Test');
    $("#popupdiv").hide();
}
function GetTest(result) {
    console.log("GetTest called with", result.length, "items");

    $("#listing").hide();
    $("#Entry,#btndelete").show();

    if (result.length > 0) {
        // Main test data is in the first row
        var mainTest = result[0];

        $('#TestId').val(mainTest.TestId);
        $('#TestName').val(mainTest.TestName);
        $('#Rate').val(parseFloat(mainTest.Rate || 0).toFixed(2));
        $('#SpRate').val(parseFloat(mainTest.SpRate || 0).toFixed(2));
        $('#VSpRate').val(parseFloat(mainTest.VSpRate || 0).toFixed(2));
        $('#OutsideRate').val(parseFloat(mainTest.OutsideRate || 0).toFixed(2));
        $('#MedDept').val(mainTest.MedDept);
        $('#SubDivision').val(mainTest.SubDivision);
        $('#SubDiv_1').val(mainTest.SubDiv || '');
        $('#Department_1').val($("#MedDept").find("option:selected").text());
        $('#StdUnit_1').val(mainTest.StdUnit || '');
        $('#NormalValue_1').val(mainTest.NormalValue || '');
        $("#SubTestId_1").val(mainTest.SubTestId || 0);
        $('#MinVal_1').val(mainTest.MinValue || 0);
        $("#MaxVal_1").val(mainTest.MaxValue || 0);
        $("#Notes").val(mainTest.Notes || '');

        // Load Method, Sample Type, and TA Time
        $('#HeaderMethod').val(mainTest.MethodId || 0);
        $('#HeaderSampleType').val(mainTest.SampleTypeId || 0);
        $('#TATime').val(mainTest.TurnAroundTime || 0);

        // Set for first row
        $('#Method_1').val(mainTest.MethodId || 0);
        $('#SampleType_1').val(mainTest.SampleTypeId || 0);

        // Clear existing sub rows (except first)
        $('.addedtr').remove();

        // Add sub test rows (starting from index 1)
        for (var i = 1; i < result.length; i++) {
            var subTest = result[i];
            var id = i + 1;

            var ProdEditRow = "<tr class='jsgrid-row addedtr' id='row_" + id + "' >" +
                "<td id='edit_" + id + "' class='jsgrid-cell p-1 GridBRow jsgrid-control-field jsgrid-align-center' style='width:4%;'>" +
                "<input class='jsgrid-button jsgrid-delete-button' type=button onclick='DeleteRow(" + id + ")' title=Delete>" +
                "</td>" +
                "<td id='td_" + id + "' class='jsgrid-cell p-1 GridBRow' style='width:6%;text-align:center'>" + id +
                "<input type='hidden' id='SubTestId_" + id + "' value='" + (subTest.SubTestId || 0) + "' />" +
                "</td>" +
                "<td class='jsgrid-cell p-1 GridBRow' style='width:22%;'>" +
                "<input type='text' class='form-control GridText' id='SubDiv_" + id + "' value='" + (subTest.SubDiv || '') + "' onkeydown='NextGrid(\"SubDiv_\",\"" + id + "\",event)'>" +
                "</td>" +
                "<td class='jsgrid-cell p-1 GridBRow' style='width:20%;display:none;'>" +
                "<input type='text' class='form-control demed GridText' value='" + $("#MedDept").find("option:selected").text() + "' id='Department_" + id + "' disabled style='background-color:white;'>" +
                "</td>" +
                "<td class='jsgrid-cell p-1 GridBRow' style='width:13%;'>" +
                "<input type='text' class='form-control GridText' id='StdUnit_" + id + "' value='" + (subTest.StdUnit || '') + "' onkeydown='NextGrid(\"StdUnit_\",\"" + id + "\",event)'>" +
                "</td>" +
                "<td class='jsgrid-cell p-1 GridBRow' style='width:26%;'>" +
                "<input type='text' class='form-control GridText' id='NormalValue_" + id + "' ondblclick='ShowModal(\"" + id + "\")' value='" + (subTest.NormalValue || '') + "' onkeydown='NextGrid(\"NormalValue_\",\"" + id + "\",event)'>" +
                "</td>" +
                "<td class='jsgrid-cell p-1 GridBRow' style='width:13%;'>" +
                "<input type='text' class='form-control GridText' id='MinVal_" + id + "' value='" + (subTest.MinValue || 0) + "' onkeydown='NextGrid(\"MinVal_\",\"" + id + "\",event)' onkeypress='isNumber_Arrow(event,this)'>" +
                "</td>" +
                "<td class='jsgrid-cell p-1 GridBRow' style='width:13%;'>" +
                "<input type='text' class='form-control GridText' id='MaxVal_" + id + "' value='" + (subTest.MaxValue || 0) + "' onkeydown='NextGrid(\"MaxVal_\",\"" + id + "\",event)' onkeypress='isNumber_Arrow(event,this)'>" +
                "</td>" +
                "<td class='jsgrid-cell p-1 GridBRow' style='width:13%;'>" +
                "<select class='form-control GridText' id='Method_" + id + "'>" + gMethodOptions + "</select>" +
                "</td>" +
                "<td class='jsgrid-cell p-1 GridBRow' style='width:13%;'>" +
                "<select class='form-control GridText' id='SampleType_" + id + "'>" + gSampleTypeOptions + "</select>" +
                "</td>" +
                "</tr>";

            $('#tbl_testsub').append(ProdEditRow);

            // Set dropdown values
            $('#Method_' + id).val(subTest.MethodId || 0);
            $('#SampleType_' + id).val(subTest.SampleTypeId || 0);
        }

        if ($('#SubDivision').val() == 'NO') {
            $("#SubDiv_1").prop("disabled", true);
        }

        $("#GridLength").val(result.length);
        $("#TestName").focus();
    }
}
function closelist() {

    $("#listing").hide();
    $("#Entry").show();
    Defaultfocus();
}

function DeleteRow(RowId){
    $('#confirm').show();
    $('#confirmOk').prop("disabled", false);
    $('#confirmOk').focus();
    $('#Confirmflag').val('DeleteRow'); $('#ConfirmRowId').val(RowId);
    $('#confirmmessage').text('Do you want Delete this record?')
}
function OkDeleteRow(RowId) {
    $('#row_' + RowId).remove();
    var slno = 1;
    for (var j = 1; j <= $("#GridLength").val(); j++) {
        if ($('#SubDiv_' + j).val() != undefined) {
            $('#td_' + j).text(slno);
            slno++;           
        }
    }
}

function ngOnDestroy(Flag) {
    if (Flag == 1) {
        var Id = $("#CrntNormalId").val();
        $("#NormalValue_" + Id).val($("#NormalValue_0").val());
    }
    $("#myModal").modal("hide");
    $("body>#EditModal").remove();
    $("#NormalValue_" + Id).focus();
}

function ShowModal(Id) {
    $("#NormalValue_0").val($("#NormalValue_" + Id).val());
    $("#NormalValue_" + Id).blur()
    $("#CrntNormalId").val(Id);
    $("#myModal").modal("show");
    $("#myModal").appendTo("body");
}

function ConfirmboxResult(Result, status, rowid) {

    if (Result == 'true' && status == 'DeleteRow') {
        OkDeleteRow(rowid)
    }
    else if (Result == 'true' && status == 'Save') {
        OKSaveandUpdateTest(rowid)
    }
    else if (Result == 'true' && status == 'Update') {
        OKSaveandUpdateTest(rowid)
    }
    else if (Result == 'true' && status == 'Delete') {
        OKSaveandUpdateTest(rowid)
    }
    $('#confirm').fadeOut();
}
//Show Window Alert Insert,update delete  Modify
function Showalerts(Status) {
    if (Status == 1) {
        formrefresh();
        swal('Data Saved Successfully', "", "success");
        $('.swal-button swal-button--confirm').focus();
    }
    else if (Status == 2) {
        formrefresh();
        swal('Data Updated Successfully', "", "success");
        $('.swal-button swal-button--confirm').focus();

    }
    else if (Status == 3) {
        formrefresh();
        swal('Data Deleted', "", "error");
        $('.swal-button swal-button--confirm').focus();
    }
    else if (Status == 4) {
        formrefresh();
        swal('Cannot Deleted', "", "error");
        $('.swal-button swal-button--confirm').focus();
    }
    else {
        swal('Data Already Exists', "", "warning");
        $('.swal-button swal-button--confirm').focus();


    }

}

function ChangeMedDept() {
    $('.demed').val($("#MedDept").find("option:selected").text());
}

//Show Warnig Popup right top
function warningshow(message, Id) {
    $('#popupmessage').text(message);
    $('#Warningpopup').show();
    $('#' + Id).focus();
    window.setTimeout(function () {
        $('#Warningpopup').hide();
    }, 3000);
}

//conge Lower Case letter to upper CODE and NAME
function changetoupper(Id) {
    $('#' + Id).val($('#' + Id).val().toUpperCase())
}

function isNumber(evt, selectedvalue) {
    var charCode = (evt.which) ? evt.which : event.keyCode
    $(selectedvalue).val($(selectedvalue).val().replace(/[^0-9\.]/g, ''));
    if (charCode != 8 && charCode != 13 && (charCode < 48 || charCode > 57)) {
        evt.preventDefault();
        warningshow('Digits Only')
        return false;
    }
    return true;

}

function isNumber_Arrow(evt, selectedvalue) {
    //var charCode = (evt.which) ? evt.which : event.keyCode
    //$(selectedvalue).val($(selectedvalue).val().replace(/[^0-9\.]/g, ''));
    //if (charCode != 8 && charCode != 13 && (charCode < 48 || charCode > 57)) {
    //    evt.preventDefault();
    //    warningshow('Digits Only')
    //    return false;
    //}
    //return true;


    var charCode = (evt.which) ? evt.which : event.keyCode
    $(selectedvalue).val($(selectedvalue).val().replace(/[^0-9\.]/g, ''));
    if (charCode != 8 && (charCode != 46 || $(selectedvalue).val().indexOf('.') != -1) && charCode != 13 && (charCode < 48 || charCode > 57)) {
        evt.preventDefault();
        warningshow('Digits Only')
        return false;
    }
    return true;

}
//Numeric Only Text Boxes without Decimal Point

function isNumberInt(evt, selectedvalue) {

    
    var charCode = (evt.which) ? evt.which : event.keyCode
    $(selectedvalue).val($(selectedvalue).val().replace(/[^0-9\.]/g, ''));
    if (charCode != 8 && charCode != 13 && (charCode < 48 || charCode > 57)) {
        evt.preventDefault();
        warningshow('Digits Only')
        return false;
    }
    return true;
}


function disable_datatable(tablename, tableButtonContainerId) {
    $('#Warningpopup').fadeOut();
    if ($.fn.DataTable.isDataTable('#' + tablename)) {
        var table = $('#' + tablename).DataTable();
        table.destroy();
        if (tableButtonContainerId) { $("#" + tableButtonContainerId).empty(); }
        return;
    }
}


function datatableWithsearch(tablename, download, title, tableButtonContainerId) {

    $('#' + tablename).DataTable({
        "pageLength": 3000,
        dom: 'Bfrtip',
        buttons: [
            {
                extend: 'copyHtml5',
                title: 'Lab Test List',
                messageTop: '',
                exportOptions: {
                    columns: [0, ':visible']
                }
            },
             {
                 extend: 'print',
                 title: 'Lab Test List',
                 messageTop: '',
                 
             },

            {
                extend: 'excelHtml5',
                title: 'Lab Test List',
                messageTop: '',
                exportOptions: {
                    columns: [0, ':visible']
                }
               
            },

            {
                extend: 'pdfHtml5',
                title: 'Lab Test List',
                messageTop: '',
                exportOptions: {
                    columns: [0, ':visible']
                }
               
            }
        ]
    });
}
