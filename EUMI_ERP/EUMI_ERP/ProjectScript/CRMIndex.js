// ===== GLOBAL VARIABLES =====
var CRMEnquiryList = [];
var CRMFollowupList = [];
var CRMFollowupListRendered = []; 
var chartEnqApp = null;
var chartSource = null;
var CRMLastSelectedEnquiryId = null; 
// ===== ON PAGE LOAD =====

$(document).ready(function () {
    // Clear any browser-restored search text so it doesn't look "stuck" after refresh
    $('#globalSearch').val('');

    // Set browser tab title based on URL query param
    function getQueryParam(name) {
        var reg = new RegExp('[?&]' + name + '=([^&#]*)');
        var result = reg.exec(window.location.search);
        return result ? decodeURIComponent(result[1]) : null;
    }

    var tab = getQueryParam('tab') || 'dashboard';

    if (tab === 'enquiries') {
        document.title = 'Patient Enquiries';
    } else if (tab === 'followup') {
        document.title = 'CRM Follow-up';
    } else if (tab === 'assignment') {
        document.title = 'Lead Assignment';
    } else {
        document.title = 'CRM Dashboard';
    }
    LoadDashboard();
    LoadEnquiries();
    LoadFollowupBoard();
    LoadBookedAppointments();
    LoadStaffList();
});

// Refresh booked-appointment info whenever staff switch back to this tab
// (e.g. after booking in the Appointment tab that was opened from here)
$(window).on('focus', function () {
    LoadBookedAppointments();
});



// ===== TAB SWITCHING =====
function ShowTab(name, btn) {
    document.querySelectorAll('.page').forEach(function (p) {
        p.classList.remove('active');
    });
    document.querySelectorAll('.crm-tab').forEach(function (t) {
        t.classList.remove('active');
    });
    document.getElementById('tab-' + name).classList.add('active');
    if (btn) btn.classList.add('active');

    // ===== SET BROWSER TAB TITLE =====
    if (name === 'enquiries') {
        document.title = 'Patient Enquiries';
        LoadEnquiries();
        LoadDashboard();
    } else if (name === 'followup') {
        document.title = 'CRM Follow-up';
        LoadFollowupBoard();
        LoadDashboard();
    } else if (name === 'assignment') {
        document.title = 'Lead Assignment';
        LoadLeadAssignment();
    } else {
        document.title = 'CRM Dashboard';
        LoadDashboard();
        LoadEnquiries();
        LoadFollowupBoard();
    }
}

// ===========================
// ===== DASHBOARD =====
// ===========================
function LoadDashboard() {
    var data = {};
    data.DeptId = ERPDeptId;
    data.UserId = ERPUserId;
    data.FromDate = '';
    data.ToDate = '';

    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_DashboardWidgets',
        data: data,
        success: function (result) {
            if (result.oList && result.oList.length > 0) {
                var d = result.oList[0];
                $('#dbTotalEnq').text(d.TotalEnquiries || 0);
                $('#dbTotalApp').text(d.TotalAppointments || 0);
                $('#dbFollowupToday').text(d.FollowupsToday || 0);
                $('#dbGrowthEnq').text('+' + (d.Amount1 || 0) + '%');
                $('#dbGrowthApp').text('+' + (d.Amount2 || 0) + '%');
                $('#lblTotalLeads').text((d.TotalEnquiries || 0) + ' LEADS');
                $('#lblHotLeads').text((d.HotCount || 0) + ' HOT 🔥');
            }
        },
        error: function () {
            console.log('Dashboard load error');
        }
    });

    LoadDashboardGraph();
}

function LoadDashboardGraph() {
    var data = {};
    data.DeptId = ERPDeptId;
    data.FromDate = '';
    data.ToDate = '';
    data.Flag = 1;

    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_DashboardGraph',
        data: data,
        success: function (result) {
            BuildEnqAppChart(result.oList || []);
            BuildSourceChart(result.oList2 || []);
        },
        error: function () {
            BuildEnqAppChart([]);
            BuildSourceChart([]);
        }
    });
}
function BuildEnqAppChart(data) {
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var labels = [];
    var today = new Date();
    for (var d = 6; d >= 0; d--) {
        var day = new Date(today);
        day.setDate(today.getDate() - d);
        labels.push(dayNames[day.getDay()]);
    }
    var enqData = [0, 0, 0, 0, 0, 0, 0];
    var appData = [0, 0, 0, 0, 0, 0, 0];

    if (data && data.length > 0) {
        labels = []; enqData = []; appData = [];
        for (var i = 0; i < data.length; i++) {
            labels.push(data[i].Title || '');
            enqData.push(Number(data[i].Amount1) || 0);
            appData.push(Number(data[i].Amount2) || 0);
        }
    }

    var ctx = document.getElementById('chartEnqApp');
    if (!ctx) return;
    if (chartEnqApp) { chartEnqApp.destroy(); }

    chartEnqApp = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Enquiries',
                    data: enqData,
                    backgroundColor: '#378ADD',
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.5,
                    categoryPercentage: 0.6,
                    maxBarThickness: 50
                },
                {
                    label: 'Appointments',
                    data: appData,
                    backgroundColor: '#1D9E75',
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.5,
                    categoryPercentage: 0.6,
                    maxBarThickness: 50
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#111827',
                    bodyColor: '#374151',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function (items) { return items[0].label; },
                        label: function (ctx) {
                            return ctx.dataset.label + ' : ' + ctx.parsed.y;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    grid: { color: '#f3f4f6', drawBorder: false },
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 11 },
                        stepSize: 1,
                        precision: 0
                    },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 11 } },
                    border: { display: false }
                }
            }
        }
    });
}
function BuildSourceChart(data) {
    var labels = ['Google Ads', 'Facebook', 'Website', 'Other'];
    var values = [45, 25, 20, 10];
    var colors = ['#378ADD', '#534AB7', '#EF9F27', '#888780'];

    if (data && data.length > 0) {
        labels = []; values = [];
        for (var i = 0; i < data.length; i++) {
            labels.push(data[i].Title || '');
            values.push(parseInt(data[i].Amount1 || 0));
        }
        colors = ['#378ADD', '#534AB7', '#EF9F27', '#888780',
            '#D4537E', '#1D9E75', '#E24B4A']
            .slice(0, labels.length);
    }

    var ctx = document.getElementById('chartSource');
    if (!ctx) return;
    if (chartSource) { chartSource.destroy(); }

    chartSource = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111827',
                    titleColor: '#fff',
                    bodyColor: '#d1d5db',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (ctx) {
                            var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                            var pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                            return ' ' + ctx.label + ': ' + pct + '%';
                        }
                    }
                }
            }
        }
    });

    // Rebuild legend as 2-column grid
    var total = values.reduce(function (a, b) { return a + b; }, 0);
    var legend = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-top:14px;">';
    for (var j = 0; j < labels.length; j++) {
        var pct = total > 0 ? Math.round((values[j] / total) * 100) : 0;
        legend += '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
            '<div style="width:10px;height:10px;border-radius:3px;flex-shrink:0;background:' + colors[j] + ';"></div>' +
            '<span style="font-size:12px;color:#374151;">' + labels[j] + '</span></div>' +
            '<span style="font-size:12px;font-weight:700;color:#111827;">' + pct + '%</span>' +
            '</div>';
    }
    legend += '</div>';
    $('#sourceLegend').html(legend);
}

// ===========================
// ===== FILTER BAR =====
// ===========================
var filterBarVisible = false;

function ToggleFilterBar() {
    filterBarVisible = !filterBarVisible;
    if (filterBarVisible) {
        document.getElementById('filterBar').style.display = 'block';
        document.getElementById('btnFilterText').textContent = 'Hide Filters';
        document.getElementById('btnToggleFilter').style.background = '#185FA5';
        document.getElementById('btnToggleFilter').style.color = '#fff';
    } else {
        document.getElementById('filterBar').style.display = 'none';
        document.getElementById('btnFilterText').textContent = 'Filter Sources';
        document.getElementById('btnToggleFilter').style.background = '';
        document.getElementById('btnToggleFilter').style.color = '';
    }
}

function ApplyFilters() {
    var search = (document.getElementById('filterSearch').value || '').toLowerCase();
    var source = (document.getElementById('filterSource').value || '');
    var stage = (document.getElementById('filterStage').value || '');
    var followup = (document.getElementById('filterFollowup').value || '');

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    var weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);

    var filtered = CRMEnquiryList.filter(function (x) {
        // Search filter
        var matchSearch = !search ||
            (x.PatientName || '').toLowerCase().indexOf(search) >= 0 ||
            (x.Mobile || '').toLowerCase().indexOf(search) >= 0 ||
            (x.Email || '').toLowerCase().indexOf(search) >= 0 ||
            (x.Notes || '').toLowerCase().indexOf(search) >= 0;

        // Source filter
        var matchSource = !source || x.Source === source;

        // Stage filter
        var matchStage = !stage || x.Stage === stage;

        // Followup date filter
        var matchFollowup = true;
        if (followup && x.FollowupDate) {
            var parts = x.FollowupDate.split('/');
            if (parts.length === 3) {
                var fDate = new Date(
                    parseInt(parts[2]),
                    parseInt(parts[1]) - 1,
                    parseInt(parts[0])
                );
                fDate.setHours(0, 0, 0, 0);

                if (followup === 'today') {
                    matchFollowup = fDate.getTime() === today.getTime();
                } else if (followup === 'tomorrow') {
                    matchFollowup = fDate.getTime() === tomorrow.getTime();
                } else if (followup === 'thisweek') {
                    matchFollowup = fDate >= today && fDate <= weekEnd;
                } else if (followup === 'overdue') {
                    matchFollowup = fDate < today;
                }
            } else {
                matchFollowup = !followup;
            }
        } else if (followup) {
            matchFollowup = false;
        }

        return matchSearch && matchSource && matchStage && matchFollowup;
    });

    RenderEnquiryList(filtered);
}

function ResetFilters() {
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterSource').value = '';
    document.getElementById('filterStage').value = '';
    document.getElementById('filterFollowup').value = '';
    RenderEnquiryList(CRMEnquiryList);
}

// ===========================
// ===== PATIENT ENQUIRIES =====
// ===========================
function LoadEnquiries() {
    var data = {};
    data.EnquiryId = 0;
    data.FromDate = '';
    data.ToDate = '';
    data.SearchText = '';
    data.FilterSource = '';
    data.DeptId = ERPDeptId;
    data.Flag = 0;

    $('#enqList').html(
        '<div style="text-align:center;padding:40px;color:#9ca3af;">' +
        'Loading...</div>'
    );


    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_EnquiryGetandGets',
        data: data,
        success: function (result) {
            CRMEnquiryList = result.oList || [];
            RenderEnquiryList(CRMEnquiryList);
            LoadTodayFollowups();
            CRMUpdateOverdueUI();
            if (document.getElementById('tab-assignment').classList.contains('active')) {
                RenderAssignmentList();
            }
        },
  
        error: function () {
            $('#enqList').html(
                '<div style="text-align:center;padding:40px;color:#ef4444;">' +
                'Error loading data. Please try again.</div>'
            );
        }
    });
}

function RenderEnquiryList(list) {
    if (!list || list.length === 0) {
        $('#enqList').html(
            '<div style="text-align:center;padding:60px;color:#9ca3af;font-size:14px;">' +
            'No enquiries found.<br/>Click <b>+ Add New Enquiry</b> to get started.</div>'
        );
        $('#enqTotalBadge').text('0 Total');
        $('#enqShowingLabel').text('SHOWING 0 OF 0 RECORDS');
        $('#lblTotalLeads').text('0 LEADS');
        $('#lblHotLeads').text('0 HOT 🔥');
        return;
    }

    var hotCount = list.filter(function (x) {
        return x.Temperature === 'Hot';
    }).length;

    $('#enqTotalBadge').text(list.length + ' Total');
    $('#enqShowingLabel').text(
        'SHOWING ' + list.length + ' OF ' + list.length + ' RECORDS'
    );
    $('#lblTotalLeads').text(list.length + ' LEADS');
    $('#lblHotLeads').text(hotCount + ' HOT 🔥');

    // Group by date
    var groups = {};
    var groupOrder = [];
    for (var i = 0; i < list.length; i++) {
        var d = list[i].EnquiryDate || 'Unknown';
        if (!groups[d]) {
            groups[d] = [];
            groupOrder.push(d);
        }
        groups[d].push(list[i]);
    }

    var html = '';
    var slno = 0;

    for (var g = 0; g < groupOrder.length; g++) {
        var date = groupOrder[g];
        html += '<div style="display:flex;align-items:center;gap:10px;' +
            'margin-bottom:10px;margin-top:' + (g === 0 ? '4' : '22') + 'px;">' +
            '<div style="background:#111827;border-radius:20px;' +
            'padding:5px 14px;font-size:11px;font-weight:700;' +
            'color:#fff;letter-spacing:0.8px;display:inline-flex;' +
            'align-items:center;gap:6px;white-space:nowrap;">' +
            '<i class="ft-calendar" style="font-size:11px;opacity:0.7;"></i> ' +
            FormatDateLabel(date) + '</div>' +
            '<div style="flex:1;height:1px;background:#e5e7eb;"></div></div>';

        var items = groups[date];
        for (var j = 0; j < items.length; j++) {
            slno++;
            html += BuildEnquiryCard(items[j], slno);
        }
    }

    $('#enqList').html(html);
}

function BuildEnquiryCard(item, slno) {
    var initials = GetInitials(item.PatientName || '?');
    var avatarClr = GetAvatarColor(item.Source || 'Direct');
    var srcBadge = GetSourceBadge(item.Source || 'Direct');
    var tempBadge = GetTempBadge(item.Temperature || 'Warm');

    var phoneHtml = item.Mobile
        ? '<span style="display:inline-flex;align-items:center;gap:8px;' +
        'border:1.5px solid #d1d5db;border-radius:20px;padding:8px 16px;' +
        'font-size:17px;font-weight:600;color:#185FA5;background:#fff;">' +
        '<i class="ft-phone" style="font-size:17px;color:#185FA5;"></i> ' +
        item.Mobile + '</span>'
        : '';

    var emailHtml = item.Email
        ? '<span style="display:inline-flex;align-items:center;gap:8px;' +
        'border:1.5px solid #d1d5db;border-radius:20px;padding:8px 16px;' +
        'font-size:17px;font-weight:500;color:#374151;background:#fff;">' +
        '<i class="ft-mail" style="font-size:17px;color:#6b7280;"></i> ' +
        item.Email + '</span>'
        : '';
    var followupHtml = '';
    var enqBookedInfo = CRMBookedInfo[CRMNormalizeMobile(item.Mobile)];

    if (enqBookedInfo && enqBookedInfo.AppointmentDate) {
        followupHtml =
            '<div style="text-align:right;flex-shrink:0;">' +
            '<div style="display:inline-flex;align-items:center;gap:5px;' +
            'font-size:12px;font-weight:700;color:#1D9E75;">' +
            '<span style="width:7px;height:7px;border-radius:50%;' +
            'background:#1D9E75;display:inline-block;"></span> APPOINTMENT</div>' +

            '<div style="font-size:17px;font-weight:800;color:#1D9E75;margin-top:2px;' +
            'display:flex;align-items:center;gap:4px;justify-content:flex-end;">' +
            '<i class="ft-check-circle" style="font-size:17px;color:#1D9E75;"></i> ' +
            enqBookedInfo.AppointmentDate +
            (enqBookedInfo.AppointmentTime ? ' · ' + enqBookedInfo.AppointmentTime : '') +
            '</div></div>';
    } else if (item.FollowupDate) {
        followupHtml =
            '<div style="text-align:right;flex-shrink:0;">' +
            '<div style="display:inline-flex;align-items:center;gap:5px;' +
            'font-size:12px;font-weight:700;color:#D97706;">' +
            '<span style="width:7px;height:7px;border-radius:50%;' +
            'background:#D97706;display:inline-block;"></span> FOLLOW UP</div>' +

            '<div style="font-size:17px;font-weight:800;color:#374151;margin-top:2px;' +
            'display:flex;align-items:center;gap:4px;justify-content:flex-end;">' +
            '<i class="ft-calendar" style="font-size:17px;color:#185FA5;"></i> ' +
            item.FollowupDate + '</div></div>';
    }

    return '<div class="lead-card" style="padding:10px 14px;margin-bottom:7px;">' +
        '<div style="display:flex;align-items:flex-start;gap:10px;">' +

        // Serial
        '<div style="font-size:12px;font-weight:600;color:#9ca3af;' +
        'min-width:16px;padding-top:3px;">' + slno + '</div>' +

        

        // Content
        '<div style="flex:1;min-width:0;">' +

        // Name row
        '<div style="display:flex;align-items:flex-start;' +
        'justify-content:space-between;gap:10px;">' +
        '<div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
        '<span style="font-size:18px;font-weight:800;color:#0f172a;' +
        'letter-spacing:-0.3px;line-height:1.15;">' +
        (item.PatientName || '') + '</span>' +
        srcBadge + tempBadge +
        '</div>' +
      
        '</div>' +
        followupHtml +
        '</div>' +

        // Contact pills
        '<div style="display:flex;flex-direction:row;gap:8px;margin-top:4px;align-items:center;flex-wrap:wrap;">' +
        phoneHtml + emailHtml +
        '</div>' +

        // Buttons
        '<div style="display:flex;gap:6px;margin-top:7px;">' +

        '<button onclick="OpenCallDetails(' + item.EnquiryId + ')" ' +
        'style="padding:9px 18px;border:1px solid #d1d5db;' +
        'border-radius:7px;background:#f9fafb;color:#374151;' +
        'font-size:14px;cursor:pointer;display:inline-flex;' +
        'align-items:center;gap:6px;font-weight:600;">' +
        '<i class="ft-phone-call" style="font-size:14px;"></i> Call Details' +
        '</button>' +

        (item.Stage === 'Appointment Fixed' && !CRMIsAppointmentBooked(item.Mobile)
            ? '<button onclick="CRMBookAppointmentFromEnquiry(' + item.EnquiryId + ')" ' +
            'style="padding:9px 18px;border:1px solid #b7e4d1;' +
            'border-radius:7px;background:#eafaf3;color:#1D9E75;' +
            'font-size:14px;cursor:pointer;display:inline-flex;' +
            'align-items:center;gap:6px;font-weight:600;">' +
            '<i class="ft-calendar" style="font-size:14px;"></i> Book Appointment' +
            '</button>'
            : '') +
        (item.Stage === 'Appointment Fixed' && CRMIsAppointmentBooked(item.Mobile)
            ? '<span style="padding:9px 14px;border:1px solid #b7e4d1;' +
            'border-radius:7px;background:#eafaf3;color:#1D9E75;' +
            'font-size:13px;font-weight:700;display:inline-flex;' +
            'align-items:center;gap:6px;">' +
            '<i class="ft-check-circle" style="font-size:13px;"></i> Appointment Booked' +
            '</span>'
            : '') +

        '<button onclick="DeleteEnquiry(' + item.EnquiryId + ', \'' +
        (item.PatientName || '').replace(/'/g, "\\'") + '\')" ' +
        'style="padding:5px 9px;border:1px solid #fecaca;' +
        'border-radius:6px;background:#fff5f5;color:#ef4444;' +
        'font-size:11px;cursor:pointer;">' +
        '<i class="ft-trash-2" style="font-size:11px;"></i>' +
        '</button>' +
        '</div>' +

        '</div></div></div>';
}

// ===========================
// ===== TODAY FOLLOWUPS =====
// ===========================

function LoadTodayFollowups() {
    var defaultDate = GetTodayDate();
    $('#followupDatePicker').val(defaultDate);
    SetQuickBtn('today');
    LoadFollowupsByDate(defaultDate);
}

function LoadFollowupsByDate(dateStr) {
    var data = {};
    data.FromDate = dateStr;
    data.DeptId = ERPDeptId;
    data.UserId = ERPUserId;

    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_TodayFollowups',
        data: data,
        success: function (result) {
            var list = (result.oList || []).filter(function (x) {
                return x.Stage !== 'Appointment Fixed';
            });
            RenderTodayFollowups(list, dateStr);
        },
        error: function () {
            RenderTodayFollowups([], dateStr);
        }
    });
}

// ===========================
// ===== OVERDUE / MISSED FOLLOW-UPS =====
// ===========================
function CRMGetOverdueList() {
    var today = new Date(); today.setHours(0, 0, 0, 0);

    function parseDate(str) {
        if (!str) return null;
        var p = str.split('/');
        if (p.length === 3) {
            var d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
            d.setHours(0, 0, 0, 0);
            return d;
        }
        return null;
    }

    return CRMEnquiryList.filter(function (x) {
        if (x.Stage === 'Appointment Fixed') return false;
        if (x.AppointmentDate) return false;           // ← already has an appointment fixed
        if (CRMIsAppointmentBooked(x.Mobile)) return false;
        if (x.Temperature === 'Lost') return false;     // Lost patients aren't "overdue"
        var d = parseDate(x.FollowupDate);
        return d && d < today;
    });
}

function LoadOverdueFollowups() {
    var list = CRMGetOverdueList();
    RenderTodayFollowups(list, 'overdue');
}

function GoToOverdueFollowups() {
    ShowTab('enquiries', document.getElementById('tabEnquiries'));
    setTimeout(function () {
        FollowupQuick('overdue');
    }, 300);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
function CRMGoToFollowupPatient(enquiryId) {
    // Remember which patient to auto-select once the Follow-up Board loads
    CRMLastSelectedEnquiryId = enquiryId;

    // Reset any active rank filter to "All" so the patient isn't hidden
    document.querySelectorAll('.rank-filter-btn').forEach(function (b) {
        b.classList.remove('active');
    });
    var allBtn = document.querySelector('.rank-filter-btn');
    if (allBtn) allBtn.classList.add('active');

    ShowTab('followup', document.getElementById('tabFollowup'));
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

function CRMUpdateOverdueUI() {
    var count = CRMGetOverdueList().length;
    $('#fuOverdueCount').text('(' + count + ')');
    $('#dbMissedFollowup').text(count);
}
function SetQuickBtn(active) {
    $('#fuBtnToday, #fuBtnTomorrow, #fuBtnAfter, #fuBtnOverdue').removeClass('fu-qbtn-active');
    if (active === 'today') $('#fuBtnToday').addClass('fu-qbtn-active');
    if (active === 'tomorrow') $('#fuBtnTomorrow').addClass('fu-qbtn-active');
    if (active === 'after') $('#fuBtnAfter').addClass('fu-qbtn-active');
    if (active === 'overdue') $('#fuBtnOverdue').addClass('fu-qbtn-active');
}
function FollowupQuick(which) {
    if (which === 'overdue') {
        // Toggle off: if Overdue is already active, collapse back to Today's view
        var alreadyOverdue = $('#fuBtnOverdue').hasClass('fu-qbtn-active');
        if (alreadyOverdue) {
            FollowupQuick('today');
            return;
        }
        SetQuickBtn('overdue');
        LoadOverdueFollowups();
        CRMUpdateOverdueUI();
        return;
    }

    var d = new Date();
    if (which === 'tomorrow') d.setDate(d.getDate() + 1);
    if (which === 'after') d.setDate(d.getDate() + 2);
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dateStr = dd + '/' + mm + '/' + d.getFullYear();
    $('#followupDatePicker').val(dateStr);
    SetQuickBtn(which);
    LoadFollowupsByDate(dateStr);
    CRMUpdateOverdueUI();
}

function RenderTodayFollowups(list, dateStr) {
    var isOverdueView = (dateStr === 'overdue');

    $('#todayPendingBadge').text(list.length + (isOverdueView ? ' Missed' : ' Pending'));
    $('#todayPendingBadge').css({
        background: isOverdueView ? '#fcebeb' : '#faeeda',
        color: isOverdueView ? '#A32D2D' : '#854F0B'
    });

    var today = GetTodayDate();
    var tomorrow = GetTomorrowDate();
    var label = isOverdueView ? "⚠ OVERDUE FOLLOW-UPS"
        : dateStr === today ? "TODAY'S FOLLOW-UPS"
            : dateStr === tomorrow ? "TOMORROW'S FOLLOW-UPS"
                : "FOLLOW-UPS · " + dateStr;
    $('#followupPanelTitle').text(label);

    if (list.length === 0) {
        $('#todayFollowupList').html(
            '<div class="all-done-box">' +
            '<i class="ft-check-circle" style="font-size:30px;"></i>' +
            '<div style="font-weight:600;color:#374151;">' +
            (isOverdueView ? 'No missed follow-ups!' : 'No follow-ups!') + '</div>' +
            '<div>' + (isOverdueView ? 'You are all caught up.' : 'None scheduled for this date.') + '</div>' +
            '</div>'
        );
        return;
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var isToday = (dateStr === GetTodayDate());
        var borderClr = isOverdueView ? '#A32D2D' : (isToday ? '#EF9F27' : '#378ADD');
        var bgClr = isOverdueView ? '#fff5f5' : (isToday ? '#fffbf0' : '#f0f7ff');
        var dateClr = isOverdueView ? '#A32D2D' : (isToday ? '#D97706' : '#185FA5');

        html += '<div style="border:1px solid ' + borderClr + ';' +
            'border-left:3px solid ' + borderClr + ';border-radius:8px;' +
            'padding:10px;margin-bottom:8px;background:' + bgClr + ';' +
            'cursor:pointer;" ' +
            'onclick="CRMGoToFollowupPatient(' + item.EnquiryId + ')">' +
            '<div style="font-size:13px;font-weight:600;color:#111827;">' +
            (item.PatientName || '') + '</div>' +
            '<div style="font-size:11px;color:#6b7280;margin-top:3px;">' +
            '<i class="ft-phone" style="font-size:11px;"></i> ' +
            (item.Mobile || '') + '</div>' +
            '<div style="font-size:14px;color:' + dateClr + ';' +
            'margin-top:4px;font-weight:800;">' +
            '<i class="ft-calendar" style="font-size:14px;"></i> ' +
            (item.FollowupDate || '') +
            (isOverdueView ? ' 🔥' : '') +
            '</div>' +
            '</div>';
    }
    $('#todayFollowupList').html(html);
}

// ===========================
// ===== ADD ENQUIRY =====
// ===========================

function OpenAddEnquiry() {

    var modal = document.getElementById('addEnquiryModal');

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Scroll to top
    window.scrollTo(0, 0);
    modal.scrollTop = 0;

    document.getElementById('enqEditId').value = '0';
    document.getElementById('enqModalTitle').textContent = 'Add New Enquiry';
    document.getElementById('enqSaveBtnLabel').textContent = 'Save Enquiry';
    document.getElementById('enqPatientName').value = '';
    document.getElementById('enqMobile').value = '';
    document.getElementById('enqEmail').value = '';
    document.getElementById('enqLocation').value = '';
    CRMSetTreatmentTags('');
    document.getElementById('enqRemarks').value = '';
    document.getElementById('enqSource').value = '';
    $('#enqAssignedToInput').val('');
    document.getElementById('enqAssignedTo').value = '';

    $('#enqDate').data('daterangepicker').setStartDate(moment());
    $('#enqDate').data('daterangepicker').setEndDate(moment());

    $('#enqFollowupDate').data('daterangepicker').setStartDate(moment());
    $('#enqFollowupDate').data('daterangepicker').setEndDate(moment());

    ResetOptions('sourceOptions', 0);
    ResetOptions('stageOptions', 0);
    ResetOptions('tempOptions', 1);

    // Force modal scroll to top after render
    setTimeout(function () {
        modal.scrollTop = 0;

        var modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }, 100);
}
function CloseAddEnquiry() {
    document.getElementById('addEnquiryModal').style.display = 'none';
    document.body.style.overflow = '';
}

// ===========================
// ===== CALL DETAILS (opens Add Enquiry modal in Edit mode) =====
// ===========================
function OpenCallDetails(enquiryId) {
    var item = CRMEnquiryList.find(function (x) {
        return x.EnquiryId == enquiryId;
    });
    if (!item) {
        CRMWarningShow('Patient data not found.');
        return;
    }

    document.getElementById('addEnquiryModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('addEnquiryModal').scrollTop = 0;
    document.getElementById('enqEditId').value = item.EnquiryId;
    document.getElementById('enqModalTitle').textContent = item.PatientName || 'Edit Enquiry';
    document.getElementById('enqSaveBtnLabel').textContent = 'Update';

    document.getElementById('enqPatientName').value = item.PatientName || '';
    document.getElementById('enqMobile').value = item.Mobile || '';
    document.getElementById('enqEmail').value = item.Email || '';
    document.getElementById('enqLocation').value = item.Location || '';
    CRMSetTreatmentTags(item.TreatmentInquired || '');
    document.getElementById('enqRemarks').value = item.Notes || '';
    document.getElementById('enqSource').value = item.Source || 'Direct';
    document.getElementById('enqAssignedTo').value = item.AssignedToUserId || '';
    $('#enqAssignedToInput').val(item.AssignedToName || '');

    // Carry forward fields not shown on this modal so Update doesn't reset them
    if (document.getElementById('enqCompany')) {
        document.getElementById('enqCompany').value = item.CompanyName || '';
    }
    if (document.getElementById('enqHandover')) {
        document.getElementById('enqHandover').value = item.HandoverNote || '';
    }
    if (document.getElementById('enqStage')) {
        document.getElementById('enqStage').value = item.Stage || 'New Lead';
    }
    if (document.getElementById('enqTemperature')) {
        document.getElementById('enqTemperature').value = item.Temperature || 'Warm';
    }

    if (item.EnquiryDate) {
        $('#enqDate').data('daterangepicker').setStartDate(moment(item.EnquiryDate, 'DD/MM/YYYY'));
        $('#enqDate').data('daterangepicker').setEndDate(moment(item.EnquiryDate, 'DD/MM/YYYY'));
    }

    if (item.FollowupDate) {
        $('#enqFollowupDate').data('daterangepicker').setStartDate(moment(item.FollowupDate, 'DD/MM/YYYY'));
        $('#enqFollowupDate').data('daterangepicker').setEndDate(moment(item.FollowupDate, 'DD/MM/YYYY'));
        document.getElementById('enqFollowupDate').value = item.FollowupDate;
    } else {
        document.getElementById('enqFollowupDate').value = '';
    }
}



function SelectOption(type, el, value) {
    var containerId = type === 'source' ? 'sourceOptions'
        : type === 'stage' ? 'stageOptions'
            : 'tempOptions';
    var hiddenId = type === 'source' ? 'enqSource'
        : type === 'stage' ? 'enqStage'
            : 'enqTemperature';

    document.querySelectorAll('#' + containerId + ' .modal-option-btn')
        .forEach(function (b) { b.classList.remove('active-opt'); });
    el.classList.add('active-opt');
    document.getElementById(hiddenId).value = value;
}

function ResetOptions(containerId, activeIndex) {
    var btns = document.querySelectorAll(
        '#' + containerId + ' .modal-option-btn'
    );
    btns.forEach(function (b, i) {
        if (i === activeIndex) b.classList.add('active-opt');
        else b.classList.remove('active-opt');
    });
}

function SaveEnquiry() {
    CRMFlushTreatmentInput();

    var patientName = $('#enqPatientName').val().trim();
    var mobile = $('#enqMobile').val().trim();

        
        if (!patientName) {
            CRMWarningShow('Please enter Patient Name', 'enqPatientName');
            return;
        }

        if (!mobile) {
            CRMWarningShow('Please enter Mobile Number', 'enqMobile');
            return;
        }
        if (!$('#enqSource').val()) {
            CRMWarningShow('Please select a Source', 'enqSource');
            return;
        }

        var editId = parseInt($('#enqEditId').val()) || 0;
        var isEdit = editId > 0;

        var data = {};
        data.EnquiryId = editId;
        data.PatientName = patientName;
        data.CompanyName = $('#enqCompany').val();
        data.Mobile = mobile;
        data.Email = $('#enqEmail').val();
        data.Location = $('#enqLocation').val();
        data.EnquiryDate = $('#enqDate').val() || GetTodayDate();
        data.Source = $('#enqSource').val();
        data.Stage = $('#enqStage').val();
        data.Temperature = $('#enqTemperature').val();
    data.TreatmentInquired = $('#enqTreatment').val();
    data.HandoverNote = $('#enqHandover').val();
    data.AssignedToUserId = $('#enqAssignedTo').val() || null;
        data.Notes = $('#enqRemarks').val();
        data.FollowupDate = $('#enqFollowupDate').val();
        data.DelFlag = 0;
        data.UserId = ERPUserId;
        data.DeptId = ERPDeptId;
        data.Flag = isEdit ? 2 : 1;

        $.ajax({
            type: 'POST',
            url: '../CRM/CRM_EnquiryInsertandUpdate',
            data: data,
            success: function (result) {
                if (result.oList && result.oList.length > 0) {
                    var status = result.oList[0].Status;
                    var expected = isEdit ? '2' : '1';
                    if (status == expected) {
                        CloseAddEnquiry();
                        swal('Success', isEdit ? 'Patient details updated successfully!' : 'Enquiry saved successfully!', 'success');
                        LoadEnquiries();
                        LoadDashboard();
                        if (isEdit && typeof LoadFollowupBoard === 'function') {
                            LoadFollowupBoard();
                        }
                    } else {
                        swal('Error', isEdit ? 'Could not update. Please try again.' : 'Could not save. Please try again.', 'error');
                    }
                }
            },
            error: function () {
                swal('Error', 'Server error. Please try again.', 'error');
            }
        });
    }

// ===========================
// ===== SEARCH POPUP =====
// ===========================
var crmSearchMode = 'enquiries'; // 'enquiries' or 'followup'

function OpenEnqSearch() {
    document.body.style.overflow = 'hidden';
    crmSearchMode = 'enquiries';
    $('#srchFromDate').data('daterangepicker').setStartDate(moment());
    $('#srchFromDate').data('daterangepicker').setEndDate(moment());
    $('#srchToDate').data('daterangepicker').setStartDate(moment());
    $('#srchToDate').data('daterangepicker').setEndDate(moment());
    $('#srchSource').val('');
    $('#srchStage').val('');
    $('#srchFollowup').val('');
    document.getElementById('crmSearchModal').style.display = 'flex';
}

function OpenFollowupSearch() {
    document.body.style.overflow = 'hidden';
    crmSearchMode = 'followup';
    $('#srchFromDate').data('daterangepicker').setStartDate(moment());
    $('#srchFromDate').data('daterangepicker').setEndDate(moment());
    $('#srchToDate').data('daterangepicker').setStartDate(moment());
    $('#srchToDate').data('daterangepicker').setEndDate(moment());
    $('#srchSource').val('');
    $('#srchStage').val('');
    $('#srchFollowup').val('');
    document.getElementById('crmSearchModal').style.display = 'flex';
}

function CloseEnqSearch() {
    document.getElementById('crmSearchModal').style.display = 'none';
    document.body.style.overflow = '';
}

function ResetEnqSearch() {
    // Clear date inputs completely instead of defaulting to today
    $('#srchFromDate').val('');
    $('#srchToDate').val('');
    $('#srchSource').val('');
    $('#srchStage').val('');
    $('#srchFollowup').val('');

    if (crmSearchMode === 'enquiries') {
        RenderEnquiryList(CRMEnquiryList);
    } else {
        RenderFollowupBoard(CRMFollowupList);
    }
}

function ApplyEnqSearch() {
    var fromDate = $('#srchFromDate').val();
    var toDate = $('#srchToDate').val();
    var source = $('#srchSource').val();
    var stage = $('#srchStage').val();
    var followup = $('#srchFollowup').val();

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    var weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);

    function parseDate(str) {
        if (!str) return null;
        var p = str.split('/');
        if (p.length === 3) {
            var d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
            d.setHours(0, 0, 0, 0);
            return d;
        }
        return null;
    }

    var fFrom = parseDate(fromDate);
    var fTo = parseDate(toDate);

    // Apply the date range only when the user has actually picked both dates
    var hasDateFilter = !!(fromDate && toDate);

    var sourceList = crmSearchMode === 'enquiries' ? CRMEnquiryList : CRMFollowupList;

    var filtered = sourceList.filter(function (x) {

        // --- DATE RANGE ---
        // For enquiries: filter on EnquiryDate
        // For followup board: filter on FollowupDate (more useful)
        var matchDate = true;
        if (hasDateFilter && fFrom && fTo) {
            var dateField = crmSearchMode === 'followup'
                ? x.FollowupDate    // ← KEY FIX: use FollowupDate for followup board
                : x.EnquiryDate;
            var eDate = parseDate(dateField);
            if (eDate) {
                matchDate = eDate >= fFrom && eDate <= fTo;
            } else {
                matchDate = false; // no date on record — exclude when filter is active
            }
        }

        // --- SOURCE ---
        var matchSource = !source || x.Source === source;

        // --- STAGE ---
        var matchStage = !stage || x.Stage === stage;

        // --- FOLLOW-UP DATE QUICK FILTER ---
        var matchFollowup = true;
        if (followup && x.FollowupDate) {
            var fDate = parseDate(x.FollowupDate);
            if (fDate) {
                if (followup === 'today') {
                    matchFollowup = fDate.getTime() === today.getTime();
                } else if (followup === 'tomorrow') {
                    matchFollowup = fDate.getTime() === tomorrow.getTime();
                } else if (followup === 'thisweek') {
                    matchFollowup = fDate >= today && fDate <= weekEnd;
                } else if (followup === 'overdue') {
                    matchFollowup = fDate < today;
                }
            } else {
                matchFollowup = false;
            }
        } else if (followup) {
            matchFollowup = false;
        }

        return matchDate && matchSource && matchStage && matchFollowup;
    });

    CloseEnqSearch();

    if (crmSearchMode === 'enquiries') {
        RenderEnquiryList(filtered);
    } else {
        RenderFollowupBoard(filtered);
    }
}

// ===========================
// ===== DELETE ENQUIRY =====
// ===========================
var pendingDeleteId = null;

function DeleteEnquiry(enquiryId, patientName) {
    // Get patient name if not passed
    if (!patientName) {
        var enquiry = CRMEnquiryList.find(function (e) { return e.EnquiryId == enquiryId; });
        patientName = enquiry ? enquiry.PatientName : 'this enquiry';
    }

    pendingDeleteId = enquiryId;
    $('#deleteConfirmMessage').html('Do you want to delete enquiry for <strong>' + patientName + '</strong>?');
    $('#confirmDeleteModal').css('display', 'flex');
    $('#confirmDeleteOk').focus();
}

function CloseDeleteModal() {
    $('#confirmDeleteModal').hide();
    pendingDeleteId = null;
}

function ConfirmDelete() {
    if (!pendingDeleteId) return;

    var data = {};
    data.EnquiryId = pendingDeleteId;
    data.UserId = ERPUserId;
    data.DeptId = ERPDeptId;

    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_EnquiryDelete',
        data: data,
        success: function (result) {
            if (result.oList && result.oList.length > 0) {
                var status = result.oList[0].Status;
                if (status == 3 || status == '3') {
                    CloseDeleteModal();
                    swal({
                        title: 'Deleted!',
                        text: 'Enquiry deleted successfully.',
                        type: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    LoadEnquiries();
                    LoadDashboard();
                    if (typeof LoadFollowupBoard === 'function') LoadFollowupBoard();
                } else {
                    swal('Error!', 'Could not delete enquiry.', 'error');
                }
            } else {
                swal('Error!', 'No response from server.', 'error');
            }
        },
        error: function () {
            swal('Error!', 'Server error while deleting.', 'error');
        }
    });
}

// ===========================
// ===== LOG CALL =====
// ===========================
function OpenLogCall(enquiryId) {
    var modal = document.getElementById('logCallModal');

    // Open modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Scroll page to top
    window.scrollTo(0, 0);

    // Scroll modal to top
    modal.scrollTop = 0;

    // Clear fields
    document.getElementById('logEnqId').value = enquiryId;
    document.getElementById('logRemarks').value = '';
    document.getElementById('logNextFollowup').value = '';
    document.getElementById('logAppointmentDate').value = '';
    document.getElementById('logTemperature').value = 'Warm';

    // ===== SHOW TREATMENT ORIGINALLY INQUIRED (FROM ENQUIRY / ADD NEW ENQUIRY FORM) =====
    var item = CRMFollowupList.find(function (x) { return x.EnquiryId == enquiryId; }) ||
        CRMEnquiryList.find(function (x) { return x.EnquiryId == enquiryId; });

    var origBox = document.getElementById('logOriginalTreatmentBox');
    var origText = document.getElementById('logOriginalTreatmentText');
    if (item && item.TreatmentInquired) {
        origText.textContent = item.TreatmentInquired;
        origBox.style.display = 'block';
    } else {
        origBox.style.display = 'none';
    }

    // Pre-fill the editable Treatment Inquired tags with the enquiry's existing treatment
    // so staff can edit/add to it directly during this call
    CRMSetLogTreatmentTags(item ? (item.TreatmentInquired || '') : '');

    // Force scroll to top after rendering
    setTimeout(function () {
        modal.scrollTop = 0;

        var modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }, 100);
}

function CloseLogCall() {
    document.getElementById('logCallModal').style.display = 'none';
    document.body.style.overflow = '';
}

function SaveCallLog() {
    CRMFlushLogTreatmentInput();

    var remarks = $('#logRemarks').val().trim();
    if (!remarks) {
        CRMWarningShow('Please enter call remarks', 'logRemarks');
        return;
    }

    var data = {};
    data.LogId = 0;
    data.EnquiryId = $('#logEnqId').val();
    data.LogRemarks = remarks;
    data.LogDate = GetTodayDate();
    data.NextFollowupDate = $('#logNextFollowup').val();
    data.AppointmentDate = $('#logAppointmentDate').val();
    data.LogTemperature = $('#logTemperature').val();
    data.TreatmentInquired = $('#logTreatment').val();
    data.UserId = ERPUserId;
    data.DeptId = ERPDeptId;

    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_CallLogInsert',
        data: data,
        success: function (result) {
            CloseLogCall();

            var apptDate = data.AppointmentDate;
            var enquiryId = data.EnquiryId;

            if (apptDate) {
                var patient = CRMEnquiryList.find(function (x) { return x.EnquiryId == enquiryId; }) ||
                    CRMFollowupList.find(function (x) { return x.EnquiryId == enquiryId; });

                var patientName = patient ? (patient.PatientName || '') : '';
                var patientMobile = patient ? (patient.Mobile || '') : '';
                var patientEmail = patient ? (patient.Email || '') : '';

                ShowApptConfirmModal(patientName, patientMobile, patientEmail);
            } else {
                swal('Success', 'Call log saved!', 'success');
                LoadEnquiries();
                LoadFollowupBoard();
            }
        },
        error: function () {
            CRMWarningShow('Error saving call log.');
        }
    });
}

// ===========================
// ===== FOLLOW-UP BOARD =====
// ===========================
function LoadFollowupBoard() {
    var data = {};
    data.FilterRank = 'All';
    data.SearchText = '';
    data.FromDate = '';
    data.ToDate = '';
    data.DeptId = ERPDeptId;

    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_FollowupBoard',
        data: data,
        success: function (result) {
            CRMFollowupList = result.oList || [];
            RenderFollowupBoard(CRMFollowupList);
        },
        error: function () {
            RenderFollowupBoard([]);
        }
    });
}

function RenderFollowupBoard(list, hideGroupLabels) {
    CRMFollowupListRendered = list;

    // ===== SORT BY FOLLOWUP DATE (today first, then future asc, then overdue last) =====
    var today = new Date(); today.setHours(0, 0, 0, 0);

    function parseDate(str) {
        if (!str) return null;
        var p = str.split('/');
        if (p.length === 3) {
            var d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
            d.setHours(0, 0, 0, 0);
            return d;
        }
        return null;
    }

    function GetItemDisplayDate(item) {
        // Appointment-fixed patients are grouped/dated by their real booking date first,
        // falling back to CRM's own AppointmentDate field, then FollowupDate.
        if (item.Stage === 'Appointment Fixed') {
            var bookedInfo = CRMBookedInfo[CRMNormalizeMobile(item.Mobile)];
            if (bookedInfo && bookedInfo.AppointmentDate) {
                return bookedInfo.AppointmentDate;
            }
            if (item.AppointmentDate) {
                return item.AppointmentDate;
            }
        }
        return item.FollowupDate;
    }

    // Group: 0 = today, 1 = future, 2 = no date, 3 = overdue
    function getGroup(item) {
        var d = parseDate(GetItemDisplayDate(item));   // ← was item.FollowupDate
        if (!d) return 2;
        var diff = d.getTime() - today.getTime();
        if (diff === 0) return 0;
        if (diff > 0) return 1;
        return 3;
    }
    var sorted = list.slice().sort(function (a, b) {
        var ga = getGroup(a), gb = getGroup(b);
        if (ga !== gb) return ga - gb;

        var da = parseDate(GetItemDisplayDate(a));   // ← was a.FollowupDate
        var db = parseDate(GetItemDisplayDate(b));   // ← was b.FollowupDate
        if (da && db) return da.getTime() - db.getTime();
        return 0;
    });

    // ===== APPOINTMENT FIXED VIEW: show most recently booked patients first =====
    if (hideGroupLabels) {
        sorted = sorted.sort(function (a, b) {
            var infoA = CRMBookedInfo[CRMNormalizeMobile(a.Mobile)];
            var infoB = CRMBookedInfo[CRMNormalizeMobile(b.Mobile)];
            var idA = infoA ? infoA.AppointmentId : -1;
            var idB = infoB ? infoB.AppointmentId : -1;
            return idB - idA; // higher AppointmentId = booked more recently, shown first
        });
    }

    // Use sorted list for rendering, but keep CRMFollowupListRendered = sorted
    CRMFollowupListRendered = sorted;

    // ===== REST OF FUNCTION UNCHANGED — just replace `list` with `sorted` below =====
    var total = sorted.length;
    var hot = sorted.filter(function (x) { return x.Temperature === 'Hot'; }).length;
    var warm = sorted.filter(function (x) { return x.Temperature === 'Warm'; }).length;
    var cold = sorted.filter(function (x) { return x.Temperature === 'Cold'; }).length;

    $('#fuTotal').text(total);
    $('#fuHot').text(hot);
    $('#fuWarm').text(warm);
    $('#fuCold').text(cold);
    $('#patDirTitle').text('PATIENT DIRECTORY (' + total + ')');

    if (sorted.length === 0) {
        $('#patientDirList').html(
            '<div style="text-align:center;padding:20px;' +
            'color:#9ca3af;font-size:13px;">No records</div>'
        );
        $('#detailPanel').html(
            '<div style="text-align:center;padding:40px;' +
            'color:#9ca3af;font-size:13px;">' +
            '<i class="ft-user" style="font-size:30px;"></i>' +
            '<div style="margin-top:8px;">No patients found</div></div>'
        );
        return;
    }

    var html = '';
    var prevGroup = -1;

    var groupLabels = {
        0: { label: "TODAY'S FOLLOW-UPS", color: '#D97706', bg: '#fffbf0', border: '#fde68a' },
        1: { label: 'UPCOMING', color: '#185FA5', bg: '#f0f7ff', border: '#b5d4f4' },
        2: { label: 'NO DATE SET', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
        3: { label: 'OVERDUE', color: '#A32D2D', bg: '#fff5f5', border: '#fecaca' }
    };

    for (var i = 0; i < sorted.length; i++) {
        var item = sorted[i];
        var grp = getGroup(item);
        var rankBadge = GetRankBadge(item.Temperature || 'Warm');
        var isOverdue = (grp === 3);

        // ===== GROUP HEADER =====
        if (!hideGroupLabels && grp !== prevGroup) {
            var gl = groupLabels[grp];
            html += '<div style="margin:' + (prevGroup === -1 ? '0' : '10px') +
                ' 0 6px 0;padding:4px 10px;border-radius:20px;' +
                'background:' + gl.bg + ';border:1px solid ' + gl.border + ';' +
                'font-size:10px;font-weight:700;color:' + gl.color + ';' +
                'letter-spacing:0.6px;display:inline-block;">' +
                gl.label + '</div>';
            prevGroup = grp;
        }

        html += '<div class="patient-item' + (i === 0 ? ' selected' : '') + '" ' +
            'onclick="SelectPatient(this,' + i + ')" id="patItem_' + i + '">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
            '<div>' +
            '<div class="pi-name">' + (item.PatientName || '') + '</div>' +
            '<div class="pi-sub">' + (item.CompanyName || 'Individual') + ' · ' + (item.Source || '') + '</div>' +
            '</div>' + rankBadge + '</div>' +
            '<div style="font-size:11px;color:#6b7280;margin-top:5px;">' +
            '<i class="ft-activity" style="font-size:11px;"></i> ' +
            (item.TreatmentInquired || 'General Inquiry') + '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">' +
            '<span style="font-size:11px;color:#6b7280;">' +
            '<i class="ft-phone" style="font-size:11px;"></i> ' + (item.Mobile || '') + '</span>' +

            // ===== FOLLOW-UP DATE PILL =====
            (function () {
                var isAppt = item.Stage === 'Appointment Fixed';
                var bookedInfo = CRMBookedInfo[CRMNormalizeMobile(item.Mobile)];
                var displayDate = (bookedInfo && bookedInfo.AppointmentDate) || GetItemDisplayDate(item);
                var displayTime = bookedInfo ? bookedInfo.AppointmentTime : '';
                if (!displayDate) return '';
                return '<span style="font-size:' + (isAppt ? '13px' : '13px') + ';font-weight:700;' +
                    'color:' + (isAppt ? '#1D9E75' : (isOverdue ? '#A32D2D' : grp === 0 ? '#D97706' : '#185FA5')) + ';' +
                    'display:inline-flex;align-items:center;gap:3px;">' +
                    '<i class="' + (isAppt ? 'ft-check-circle' : 'ft-calendar') + '" style="font-size:' + (isAppt ? '13px' : '13px') + ';"></i> ' +
                    (isAppt ? 'Appt: ' : '') + displayDate +
                    (displayTime ? ' · ' + displayTime : '') +
                    (!isAppt && isOverdue ? ' 🔥' : '') + '</span>';
            })() +

            '</div></div>';
    }

    $('#patientDirList').html(html);

    if (sorted.length > 0) {
        var toShow = sorted[0];
        if (CRMLastSelectedEnquiryId) {
            var stillThere = sorted.find(function (x) { return x.EnquiryId == CRMLastSelectedEnquiryId; });
            if (stillThere) toShow = stillThere;
        }
        ShowPatientDetail(toShow);

        var idx = sorted.indexOf(toShow);
        var newEl = document.getElementById('patItem_' + idx);
        if (newEl) {
            document.querySelectorAll('.patient-item').forEach(function (p) { p.classList.remove('selected'); });
            newEl.classList.add('selected');
        }
    }
}

  

function SelectPatient(el, index) {
    document.querySelectorAll('.patient-item').forEach(function (p) {
        p.classList.remove('selected');
    });
    el.classList.add('selected');
    var item = CRMFollowupListRendered[index];
    CRMLastSelectedEnquiryId = item.EnquiryId;
    ShowPatientDetail(item);

    var panel = document.getElementById('detailPanel');
    var navbarOffset = 100;
    var top = panel.getBoundingClientRect().top + window.pageYOffset - navbarOffset;
    window.scrollTo({ top: top, behavior: 'smooth' });
}

function ShowPatientDetail(item) {
    var srcBadge = GetSourceBadge(item.Source || 'Direct');

    var isApptFixed = item.Stage === 'Appointment Fixed' || !!item.AppointmentDate;
    var apptBadge = (isApptFixed && item.AppointmentDate)
        ? '<span style="background:#eafaf3;color:#1D9E75;font-size:12px;' +
        'font-weight:700;padding:6px 12px;border-radius:20px;' +
        'display:inline-flex;align-items:center;gap:6px;border:1px solid #b7e4d1;">' +
        '<i class="ft-check-circle" style="font-size:12px;"></i> ' +
        'Appointment Fixed: ' + item.AppointmentDate + '</span>'
        : '';

    var html =
        '<div style="display:flex;justify-content:space-between;' +
        'align-items:flex-start;margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
        '<span class="dp-name">' + (item.PatientName || '') + '</span>' +
        srcBadge + '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
        '<span id="apptBadgeSlot_' + item.EnquiryId + '" data-has-own-date="' + (item.AppointmentDate ? 'true' : 'false') + '">' + apptBadge + '</span>' +


        (isApptFixed && !CRMIsAppointmentBooked(item.Mobile)
            ? '<button onclick="CRMBookAppointmentFromFollowup(' + item.EnquiryId + ')" ' +
            'style="background:#1D9E75;color:#fff;border:none;' +
            'border-radius:7px;padding:8px 14px;font-size:12px;' +
            'font-weight:600;cursor:pointer;display:flex;' +
            'align-items:center;gap:6px;">' +
            '<i class="ft-calendar" style="font-size:12px;"></i> ' +
            'Book Appointment</button>'
            : '') +
        (isApptFixed && CRMIsAppointmentBooked(item.Mobile)
            ? '<span style="background:#eafaf3;color:#1D9E75;font-size:12px;' +
            'font-weight:700;padding:6px 12px;border-radius:20px;' +
            'display:inline-flex;align-items:center;gap:6px;border:1px solid #b7e4d1;">' +
            '<i class="ft-check-circle" style="font-size:12px;"></i> ' +
            'Appointment Booked</span>'
            : '') +
        '<button onclick="OpenLogCall(' + item.EnquiryId + ')" ' +
        'style="background:#185FA5;color:#fff;border:none;' +
        'border-radius:7px;padding:8px 14px;font-size:12px;' +
        'font-weight:600;cursor:pointer;display:flex;' +
        'align-items:center;gap:6px;">' +
        '<i class="ft-phone-call" style="font-size:12px;"></i> ' +
        'Log Call Details</button></div></div>' +

   
        '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">' +
        '<span class="dp-contact-pill">' +
        '<i class="ft-phone" style="font-size:12px;"></i> ' +
        (item.Mobile || 'N/A') + '</span>' +
        '<span class="dp-contact-pill">' +
        '<i class="ft-mail" style="font-size:12px;"></i> ' +
        (item.Email || 'N/A') + '</span>' +
        (item.Mobile
            ? '<button type="button" title="Send Follow-up on WhatsApp" ' +
            'onclick="CRMSendWhatsAppFollowup(\'' + item.Mobile + '\',\'' +
            (item.PatientName || '').replace(/'/g, "\\'") + '\')" ' +
            'style="border:none;border-radius:20px;background:#25D366;' +
            'color:#fff;display:inline-flex;align-items:center;gap:7px;' +
            'padding:9px 16px;cursor:pointer;font-size:13px;font-weight:600;' +
            'flex-shrink:0;">' +
            '<i class="fa fa-whatsapp" style="font-size:16px;"></i> Send WhatsApp Reminder</button>'
            : '') +
        '</div>' +

        // ===== ENQUIRY DETAILS (Treatment + Notes from original enquiry) =====
        '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;' +
        'padding:12px 14px;margin-bottom:16px;">' +
        '<div style="font-size:11px;font-weight:700;color:#185FA5;' +
        'letter-spacing:0.5px;margin-bottom:6px;">' +
        '<i class="ft-activity" style="font-size:11px;"></i> TREATMENT INQUIRED</div>' +
        '<div style="font-size:13px;color:#111827;margin-bottom:' +
        (item.Notes ? '10' : '0') + 'px;">' +
        (item.TreatmentInquired || 'Not specified') + '</div>' +
        (item.Notes
            ? '<div style="font-size:11px;font-weight:700;color:#185FA5;' +
            'letter-spacing:0.5px;margin-bottom:6px;border-top:1px solid #e5e7eb;' +
            'padding-top:10px;">' +
            '<i class="ft-file-text" style="font-size:11px;"></i> ENQUIRY NOTES</div>' +
            '<div style="font-size:13px;color:#374151;">' +
            item.Notes + '</div>'
            : '') +
        (item.HandoverNote
            ? '<div style="font-size:11px;font-weight:700;color:#185FA5;' +
            'letter-spacing:0.5px;margin-bottom:6px;border-top:1px solid #e5e7eb;' +
            'padding-top:10px;margin-top:10px;">' +
            '<i class="ft-corner-down-right" style="font-size:11px;"></i> HANDOVER NOTE</div>' +
            '<div style="font-size:13px;color:#374151;">' +
            item.HandoverNote + '</div>'
            : '') +
        '</div>' +

        '<div style="font-size:12px;font-weight:700;color:#374151;' +
        'margin-bottom:6px;">CRM CLASSIFICATION TEMPERATURE</div>' +
        '<div class="temp-bar">' +
        '<div class="temp-cell ' +
        (item.Temperature === 'Hot' ? 'hot-active' : '') + '" ' +
        'onclick="UpdateTemp(' + item.EnquiryId + ',\'Hot\',this)">🔥 Hot</div>' +
        '<div class="temp-cell ' +
        (item.Temperature === 'Warm' ? 'warm-active' : '') + '" ' +
        'onclick="UpdateTemp(' + item.EnquiryId + ',\'Warm\',this)">🟠 Warm</div>' +
        '<div class="temp-cell ' +
        (item.Temperature === 'Cold' ? 'cold-active' : '') + '" ' +
        'onclick="UpdateTemp(' + item.EnquiryId + ',\'Cold\',this)">❄ Cold</div>' +
        '<div class="temp-cell ' +
        (item.Temperature === 'Lost' ? 'drop-active' : '') + '" ' +
        'onclick="UpdateTemp(' + item.EnquiryId + ',\'Lost\',this)">Drop</div>' +
        '</div>' +
        // CALL LOG HISTORY SECTION
        '<div style="margin-top:16px;">' +
        '<div style="font-size:13px;font-weight:700;color:#6b7280;' +
        'letter-spacing:0.5px;margin-bottom:10px;display:flex;' +
        'align-items:center;gap:6px;border-top:1px solid #e5e7eb;padding-top:14px;">' +
        '<i class="ft-clock" style="font-size:13px;"></i> CALL LOG HISTORY' +
        '</div>' +
        '<div id="callLogHistory_' + item.EnquiryId + '">' +
        '<div style="font-size:13px;color:#9ca3af;text-align:center;' +
        'padding:10px;border:1px dashed #e5e7eb;border-radius:8px;">' +
        'Loading...</div>' +
        '</div>' +
        '</div>';
    $('#detailPanel').html(html);
    // Load call log history after panel is rendered
    LoadCallLogHistory(item.EnquiryId);
}
function UpdateTemp(enquiryId, temperature, el) {
    var bar = el.closest ? el.closest('.temp-bar') : el.parentElement;
    bar.querySelectorAll('.temp-cell').forEach(function (c) {
        c.classList.remove(
            'hot-active', 'warm-active', 'cold-active', 'drop-active'
        );
    });
    var cls = temperature === 'Hot' ? 'hot-active'
        : temperature === 'Warm' ? 'warm-active'
            : temperature === 'Cold' ? 'cold-active'
                : 'drop-active';
    el.classList.add(cls);

    var data = {};
    data.EnquiryId = enquiryId;
    data.Temperature = temperature;
    data.UserId = ERPUserId;
    data.DeptId = ERPDeptId;

    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_UpdateTemperature',
        data: data,
        success: function () { LoadFollowupBoard(); }
    });
}


var CRMBookedMobiles = new Set();
var CRMBookedInfo = {}; // normalizedMobile -> { AppointmentId, AppointmentDate }

function CRMNormalizeMobile(mobile) {
    return (mobile || '').replace(/\D/g, '').slice(-10);
}

function CRMIsAppointmentBooked(mobile) {
    var normalized = CRMNormalizeMobile(mobile);
    return !!normalized && CRMBookedMobiles.has(normalized);
}

function LoadBookedAppointments() {
    $.ajax({
        type: 'POST',
        url: '../Master/AppointmentGetandGets',
        data: { AppointmentId: 0 },
        success: function (result) {
            CRMBookedMobiles = new Set();
            CRMBookedInfo = {};
            var list = result.oList || [];
            for (var i = 0; i < list.length; i++) {
                var norm = CRMNormalizeMobile(list[i].Contact);
                if (!norm) continue;
                CRMBookedMobiles.add(norm);

                var apptId = parseInt(list[i].AppointmentId) || 0;
                var existing = CRMBookedInfo[norm];
                // Keep the HIGHEST AppointmentId per patient = their most recent booking
                if (!existing || apptId > existing.AppointmentId) {
                    CRMBookedInfo[norm] = {
                        AppointmentId: apptId,
                        AppointmentDate: list[i].AppointmentDate || '',
                        AppointmentTime: list[i].AppointmentTime || ''
                    };
                }
            }
            // Re-render with fresh booked info now available
            if (CRMEnquiryList.length) RenderEnquiryList(CRMEnquiryList);
            if (CRMFollowupList.length) RenderFollowupBoard(CRMFollowupList);
            CRMUpdateOverdueUI();
        },
        error: function () {
            // Silent fail — buttons just stay as-is if this can't be reached
        }
    });
}

function FilterRank(rank, btn) {
    document.querySelectorAll('.rank-filter-btn').forEach(function (b) {
        b.classList.remove('active');
    });
    btn.classList.add('active');

    var filtered;
    if (rank === 'All') {
        filtered = CRMFollowupList;
    } else if (rank === 'AppointmentFixed') {
        filtered = CRMFollowupList.filter(function (x) {
            return x.Stage === 'Appointment Fixed';
        });
    } else {
        filtered = CRMFollowupList.filter(function (x) {
            return x.Temperature === rank;
        });
    }
    RenderFollowupBoard(filtered, rank === 'AppointmentFixed');   // ← pass flag
}

function FilterPatientDir() {
    var search = $('#fuSearch').val().toLowerCase().trim();
    if (!search) {
        RenderFollowupBoard(CRMFollowupList);
        return;
    }
    var filtered = CRMFollowupList.filter(function (x) {
        return (x.PatientName || '').toLowerCase().indexOf(search) >= 0 ||
            (x.Mobile || '').toLowerCase().indexOf(search) >= 0 ||
            (x.TreatmentInquired || '').toLowerCase().indexOf(search) >= 0 ||
            (x.Notes || '').toLowerCase().indexOf(search) >= 0 ||
            (x.Source || '').toLowerCase().indexOf(search) >= 0;
    });
    RenderFollowupBoard(filtered);
}

function GlobalSearch() {
    var search = $('#globalSearch').val().toLowerCase();

    // Determine active tab
    var isFollowup = document.getElementById('tab-followup').classList.contains('active');

    if (isFollowup) {
        if (!search) { RenderFollowupBoard(CRMFollowupList); return; }
        var filtered = CRMFollowupList.filter(function (x) {
            return (x.PatientName || '').toLowerCase().indexOf(search) >= 0 ||
                (x.Mobile || '').toLowerCase().indexOf(search) >= 0 ||
                (x.TreatmentInquired || '').toLowerCase().indexOf(search) >= 0;
        });
        RenderFollowupBoard(filtered);
        return;
    }

    if (!search) { RenderEnquiryList(CRMEnquiryList); return; }
    var filtered = CRMEnquiryList.filter(function (x) {
        return (x.PatientName || '').toLowerCase().indexOf(search) >= 0 ||
            (x.Mobile || '').toLowerCase().indexOf(search) >= 0 ||
            (x.Email || '').toLowerCase().indexOf(search) >= 0;
    });
    RenderEnquiryList(filtered);
}



// ===========================
// ===== HELPER FUNCTIONS =====
// ===========================
function GetInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function GetAvatarColor(source) {
    var map = {
        'Direct': { bg: '#e6f1fb', text: '#185FA5' },
        'Google': { bg: '#eaf3de', text: '#3B6D11' },
        'Facebook': { bg: '#EEEDFE', text: '#534AB7' },
        'Instagram': { bg: '#FBEAF0', text: '#993556' },
        'Referral': { bg: '#faeeda', text: '#854F0B' }
    };
    return map[source] || { bg: '#f3f4f6', text: '#374151' };
}

function GetSourceBadge(source) {
    var map = {
        'Direct': 'src-direct',
        'Google': 'src-google',
        'Facebook': 'src-facebook',
        'Instagram': 'src-instagram',
        'Referral': 'src-google'
    };
    var cls = map[source] || 'src-direct';
    return '<span class="src-badge ' + cls + '" style="font-size:12px;padding:4px 10px;">' +
        source.toUpperCase() + '</span>';
}

function GetTempBadge(temp) {
    if (!temp || temp === 'Warm') return '';
    var map = {
        'Hot': { bg: '#faece7', color: '#993C1D', label: '🔥 Hot' },
        'Cold': { bg: '#e6f1fb', color: '#185FA5', label: '❄ Cold' },
        'Lost': { bg: '#f3f4f6', color: '#6b7280', label: 'Lost' }
    };
    var s = map[temp];
    if (!s) return '';
    return '<span style="font-size:10px;font-weight:700;padding:2px 8px;' +
        'border-radius:4px;background:' + s.bg +
        ';color:' + s.color + ';">' + s.label + '</span>';
}

function GetRankBadge(temp) {
    var map = {
        'Hot': '<span class="rank-hot" style="font-size:12px;padding:4px 10px;">🔥 Hot</span>',
        'Warm': '<span class="rank-warm" style="font-size:12px;padding:4px 10px;">🟠 Warm</span>',
        'Cold': '<span class="rank-cold" style="font-size:12px;padding:4px 10px;">❄ Cold</span>',
        'Lost': '<span style="background:#f3f4f6;color:#6b7280;' +
            'font-size:12px;font-weight:700;padding:4px 10px;' +
            'border-radius:20px;">Lost</span>'
    };
    return map[temp] || map['Warm'];
}

function IsOverdue(followupDate) {
    if (!followupDate) return false;
    try {
        var parts = followupDate.split('/');
        if (parts.length === 3) {
            var fDate = new Date(
                parseInt(parts[2]),
                parseInt(parts[1]) - 1,
                parseInt(parts[0])
            );
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            return fDate < today;
        }
    } catch (e) { }
    return false;
}

function FormatDateLabel(dateStr) {
    if (!dateStr || dateStr === 'Unknown') return 'Unknown Date';
    try {
        var parts = dateStr.split('/');
        if (parts.length === 3) {
            var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            return months[parseInt(parts[1]) - 1] + ' ' +
                parseInt(parts[0]) + ', ' + parts[2];
        }
    } catch (e) { }
    return dateStr;
}

function GetTodayDate() {
    var d = new Date();
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
}

function GetTomorrowDate() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + '/' + mm + '/' + d.getFullYear();
}

// Add at the top of CRMIndex.js
function CRMDigitsOnly(evt, inputId) {
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    // Strip non-numeric characters as user types
    var el = document.getElementById(inputId);
    if (el) {
        el.value = el.value.replace(/[^0-9]/g, '');
    }
    // Block non-digit keys (allow backspace=8, delete=46, enter=13, tab=9)
    if (charCode != 8 && charCode != 13 && charCode != 46 && charCode != 9
        && (charCode < 48 || charCode > 57)) {
        evt.preventDefault();
        CRMWarningShow('Digits Only');
        return false;
    }
    return true;
}

function CRMWarningShow(message, Id) {
    if ($('#Warningpopup').length) {
        $('#popupmessage').text(message);
        $('#Warningpopup').show();
        if (Id) { $('#' + Id).focus().select(); }
        window.setTimeout(function () {
            $('#Warningpopup').fadeOut();
        }, 3000);
    } else {
        var existing = document.getElementById('crmWarningToast');
        if (!existing) {
            var toast = document.createElement('div');
            toast.id = 'crmWarningToast';
            toast.style.cssText =
                'position:fixed;top:15px;left:50%;transform:translateX(-50%);' +
                'background:#e74c3c;color:#fff;padding:10px 28px;' +
                'border-radius:6px;font-size:14px;font-weight:600;' +
                'z-index:99999;display:none;';
            document.body.appendChild(toast);
        }
        var el = document.getElementById('crmWarningToast');
        el.textContent = message;
        el.style.display = 'block';
        if (Id) { $('#' + Id).focus().select(); }
        clearTimeout(window._crmWarnTimer);
        window._crmWarnTimer = setTimeout(function () {
            el.style.display = 'none';
        }, 3000);
    }
}

// ===========================
// ===== CALL LOG HISTORY =====
// ===========================
function LoadCallLogHistory(enquiryId) {
    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_CallLogGetByEnquiry',
        data: { EnquiryId: enquiryId, DeptId: ERPDeptId },
        success: function (result) {
            var list = result.oList || [];
            RenderCallLogHistory(enquiryId, list);
            UpdateApptBadgeFromLogs(enquiryId, list);   // ← NEW
        },
        error: function () {
            $('#callLogHistory_' + enquiryId).html(
                '<div style="font-size:12px;color:#ef4444;text-align:center;padding:10px;">Error loading logs.</div>'
            );
        }
    });
}

// ===== NEW: fill in the Appointment Fixed badge using the latest call log if the enquiry record itself has no AppointmentDate =====
function UpdateApptBadgeFromLogs(enquiryId, logs) {
    var badgeSlot = document.getElementById('apptBadgeSlot_' + enquiryId);
    if (!badgeSlot) return;

    // Already showing a badge from the enquiry record itself? Nothing to do.
    if (badgeSlot.dataset.hasOwnDate === 'true') return;

    if (!logs || logs.length === 0) return;

    // Find the most recent log (by CreatedDate) that has an AppointmentDate
    var withAppt = logs.filter(function (l) { return !!l.AppointmentDate; });
    if (withAppt.length === 0) return;

    withAppt.sort(function (a, b) {
        return new Date(b.CreatedDate) - new Date(a.CreatedDate);
    });

    var latestApptDate = withAppt[0].AppointmentDate;

    badgeSlot.innerHTML =
        '<span style="background:#eafaf3;color:#1D9E75;font-size:12px;' +
        'font-weight:700;padding:6px 12px;border-radius:20px;' +
        'display:inline-flex;align-items:center;gap:6px;border:1px solid #b7e4d1;">' +
        '<i class="ft-check-circle" style="font-size:12px;"></i> ' +
        'Appointment Fixed: ' + latestApptDate + '</span>';
}

function RenderCallLogHistory(enquiryId, list) {
    var container = $('#callLogHistory_' + enquiryId);
    if (!list || list.length === 0) {
        container.html(
            '<div style="font-size:13px;color:#9ca3af;text-align:center;' +
            'padding:10px;border:1px dashed #e5e7eb;border-radius:8px;">No call logs yet.</div>'
        );
        return;
    }

    // Sort by CreatedDate descending (latest first)
    list.sort(function (a, b) {
        return new Date(b.CreatedDate) - new Date(a.CreatedDate);
    });

    var html = '';
    for (var i = 0; i < list.length; i++) {
        var log = list[i];
        var tempColor = log.LogTemperature === 'Hot' ? '#D85A30'
            : log.LogTemperature === 'Warm' ? '#EF9F27'
                : log.LogTemperature === 'Cold' ? '#185FA5'
                    : '#6b7280';
        var tempEmoji = log.LogTemperature === 'Hot' ? '🔥'
            : log.LogTemperature === 'Warm' ? '🟠'
                : log.LogTemperature === 'Cold' ? '❄'
                    : '⬜';

        html += '<div style="border:1px solid #e5e7eb;border-left:3px solid ' + tempColor + ';' +
            'border-radius:8px;padding:12px 14px;margin-bottom:10px;background:#fff;">' +

            // Header row: date + temperature
            '<div style="display:flex;justify-content:space-between;' +
            'align-items:center;margin-bottom:8px;">' +
            '<span style="font-size:15px;font-weight:700;color:#6b7280;">' +
            '<i class="ft-clock" style="font-size:15px;"></i> ' +
            (log.LogDate || '') +
            (log.CreatedDate
                ? ' &nbsp;<span style="color:#9ca3af;font-weight:400;font-size:14px;">' +
                FormatDateTime(log.CreatedDate) + '</span>'
                : '') +
            '</span>' +
            '<span style="font-size:12px;font-weight:700;color:' + tempColor + ';">' +
            tempEmoji + ' ' + (log.LogTemperature || '') + '</span>' +
            '</div>' +

            // Call Remarks (labeled)
            (log.LogRemarks
                ? '<div style="font-size:17px;color:#111827;margin-bottom:6px;line-height:1.5;">' +
                '<span style="font-weight:700;color:#111827;font-size:14px;">Call Remarks :</span> ' +
                log.LogRemarks + '</div>'
                : '') +

            // Treatment Inquired (labeled)
            (log.TreatmentInquired
                ? '<div style="font-size:17px;color:#111827;margin-bottom:6px;">' +
                '<span style="font-weight:700;color:#111827;font-size:14px;">Treatment Inquired :</span> ' +
                log.TreatmentInquired + '</div>'
                : '') +

            // Next follow-up + appointment row
            '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px;">' +
            (log.NextFollowupDate
                ? '<span style="font-size:13px;color:#D97706;font-weight:600;">' +
                '<i class="ft-calendar" style="font-size:13px;"></i> Follow-up: ' +
                log.NextFollowupDate + '</span>'
                : '') +
            (log.AppointmentDate
                ? '<span style="font-size:13px;color:#1D9E75;font-weight:600;">' +
                '<i class="ft-check-circle" style="font-size:13px;"></i> Appt: ' +
                log.AppointmentDate + '</span>'
                : '') +
            '</div>' +

            '</div>';
    }
    container.html(html);
}

function FormatDateTime(dtStr) {
    if (!dtStr) return '';
    try {
        var d = new Date(dtStr);
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
    } catch (e) { return ''; }
}

            // ===========================
// ===== EDIT ENQUIRY =====
// ===========================
function OpenEditEnquiry(enquiryId) {
    var item = CRMFollowupList.find(function (x) {
        return x.EnquiryId == enquiryId;
    });
    if (!item) {
        // fallback: try enquiry list
        item = CRMEnquiryList.find(function (x) {
            return x.EnquiryId == enquiryId;
        });
    }
    if (!item) { CRMWarningShow('Patient data not found.'); return; }

    document.getElementById('editEnqId').value        = item.EnquiryId;
    document.getElementById('editPatientName').value  = item.PatientName || '';
    document.getElementById('editCompany').value      = item.CompanyName || '';
    document.getElementById('editMobile').value       = item.Mobile || '';
    document.getElementById('editEmail').value        = item.Email || '';
    document.getElementById('editTreatment').value    = item.TreatmentInquired || '';
    document.getElementById('editHandover').value     = item.HandoverNote || '';
    document.getElementById('editRemarks').value      = item.Notes || '';

    // Source dropdown
    document.getElementById('editSource').value       = item.Source || 'Direct';
    // Stage dropdown
    document.getElementById('editStage').value        = item.Stage || 'New Lead';
    // Temperature dropdown
    document.getElementById('editTemperature').value  = item.Temperature || 'Warm';

    // Enquiry date
    if (item.EnquiryDate) {
        $('#editEnqDate').data('daterangepicker').setStartDate(
            moment(item.EnquiryDate, 'DD/MM/YYYY')
        );
    }

    // Follow-up date
    if (item.FollowupDate) {
        $('#editFollowupDate').data('daterangepicker').setStartDate(
            moment(item.FollowupDate, 'DD/MM/YYYY')
        );
        document.getElementById('editFollowupDate').value = item.FollowupDate;
    } else {
        document.getElementById('editFollowupDate').value = '';
    }

    document.getElementById('editEnquiryModal').style.display = 'flex';
}

function CloseEditEnquiry() {
    document.getElementById('editEnquiryModal').style.display = 'none';
}



// ===========================
// ===== TREATMENT / PROCEDURE MULTI-SELECT (tags + free text) =====
// ===========================

var _procSearchTimer = null;
var enqTreatmentTags = [];
var enqSuggestionList = [];
var enqActiveSuggestIndex = -1;
var enqSearchInFlight = false;
var enqCommitPending = false;
var enqSearchToken = 0;   // ← ADD THIS NEW LINE

function CRMProcedureAutocomplete(term) {
    clearTimeout(_procSearchTimer);
    var box = document.getElementById('enqTreatmentSuggestions');

    if (!term || term.trim() === '') {
        box.style.display = 'none';
        box.innerHTML = '';
        enqSuggestionList = [];
        enqActiveSuggestIndex = -1;
        enqSearchInFlight = false;
        enqCommitPending = false;
        enqSearchToken++;   // invalidate any in-flight requests
        return;
    }

    enqSearchInFlight = true;
    enqSearchToken++;
    var myToken = enqSearchToken;

    _procSearchTimer = setTimeout(function () {
        $.ajax({
            type: 'POST',
            url: '../CRM/CRM_ProcedureSearch',
            data: { searchTerm: term },
            success: function (result) {
                // Ignore this response if a newer search has started since
                if (myToken !== enqSearchToken) return;

                var list = result.oList || [];
                list = list.filter(function (x) {
                    return enqTreatmentTags.indexOf((x.Title || '').toUpperCase()) === -1;
                });

                // ===== RANK: prefix match first, then contains, alphabetical within each =====
                var upperTerm = term.trim().toUpperCase();
                list.sort(function (a, b) {
                    var aTitle = (a.Title || '').toUpperCase();
                    var bTitle = (b.Title || '').toUpperCase();
                    var aRank = aTitle.indexOf(upperTerm) === 0 ? 0 : 1;
                    var bRank = bTitle.indexOf(upperTerm) === 0 ? 0 : 1;
                    if (aRank !== bRank) return aRank - bRank;
                    return aTitle.localeCompare(bTitle);
                });

              enqSuggestionList = list;
                enqActiveSuggestIndex = -1;   // don't auto-pick anything until user navigates/clicks
                enqSearchInFlight = false;

                if (list.length === 0) {
                    box.style.display = 'none';
                    box.innerHTML = '';
                } else {
                    var html = '';
                    for (var i = 0; i < list.length; i++) {
                        var name = list[i].Title || '';
                        html += '<div class="proc-suggest-item' + (i === enqActiveSuggestIndex ? ' proc-suggest-active' : '') + '" ' +
                            'data-index="' + i + '" ' +
                            'onmousedown="event.preventDefault();" ' +   // ← ADD THIS
                            'onclick="CRMAddTreatmentTag(\'' + name.replace(/'/g, "\\'") + '\')" ' +
                            'style="padding:9px 14px;font-size:13px;color:#374151;cursor:pointer;">' +
                            name + '</div>';
                    }
                    box.innerHTML = html;
                    box.style.display = 'block';
                }

                if (enqCommitPending) {
                    enqCommitPending = false;
                    if (list.length > 0) {
                        CRMAddTreatmentTag(list[0].Title || '');
                    } else {
                        CRMAddTreatmentTag(term);
                    }
                }
            },
            error: function () {
                if (myToken !== enqSearchToken) return;
                box.style.display = 'none';
                enqSuggestionList = [];
                enqActiveSuggestIndex = -1;
                enqSearchInFlight = false;
                if (enqCommitPending) {
                    enqCommitPending = false;
                    CRMAddTreatmentTag(term);
                }
            }
        });
    }, 250);
}

function CRMHighlightSuggestion() {
    var items = document.querySelectorAll('#enqTreatmentSuggestions .proc-suggest-item');
    items.forEach(function (el, i) {
        if (i === enqActiveSuggestIndex) el.classList.add('proc-suggest-active');
        else el.classList.remove('proc-suggest-active');
    });
}

function CRMTreatmentKeydown(event) {
    var input = document.getElementById('enqTreatmentInput');
    var box = document.getElementById('enqTreatmentSuggestions');
    var suggestionsOpen = box && box.style.display === 'block' && enqSuggestionList.length > 0;

    if (event.key === 'ArrowDown' && suggestionsOpen) {
        event.preventDefault();
        enqActiveSuggestIndex = (enqActiveSuggestIndex + 1) % enqSuggestionList.length;
        CRMHighlightSuggestion();
        return;
    }
    if (event.key === 'ArrowUp' && suggestionsOpen) {
        event.preventDefault();
        enqActiveSuggestIndex = (enqActiveSuggestIndex - 1 + enqSuggestionList.length) % enqSuggestionList.length;
        CRMHighlightSuggestion();
        return;
    }

    if (event.key === 'Enter')  {
        event.preventDefault();

        if (suggestionsOpen) {
            var chosen = enqSuggestionList[enqActiveSuggestIndex >= 0 ? enqActiveSuggestIndex : 0];
            if (chosen) {
                CRMAddTreatmentTag(chosen.Title || '');
                return;
            }
        }

        // A search is still loading — wait for it instead of committing raw text immediately
        if (enqSearchInFlight) {
            enqCommitPending = true;
            return;
        }

        var val = input.value.trim();
        if (val) {
            CRMAddTreatmentTag(val);
        }
    } else if (event.key === 'Backspace' && input.value === '' && enqTreatmentTags.length > 0) {
        enqTreatmentTags.pop();
        CRMRenderTreatmentTags();
    }
}

function CRMAddTreatmentTag(value) {
    value = (value || '').trim().toUpperCase();
    if (!value) return;
    if (enqTreatmentTags.indexOf(value) === -1) {
        enqTreatmentTags.push(value);
    }
    var input = document.getElementById('enqTreatmentInput');
    input.value = '';
    CRMRenderTreatmentTags();

    var box = document.getElementById('enqTreatmentSuggestions');
    box.style.display = 'none';
    box.innerHTML = '';
    input.focus();
}

function CRMRemoveTreatmentTag(index) {
    enqTreatmentTags.splice(index, 1);
    CRMRenderTreatmentTags();
}

function CRMRenderTreatmentTags() {
    var tagBox = document.getElementById('enqTreatmentTagBox');
    var input = document.getElementById('enqTreatmentInput');

    // Remove existing chips (keep the input element)
    tagBox.querySelectorAll('.treatment-chip').forEach(function (c) { c.remove(); });

    for (var i = 0; i < enqTreatmentTags.length; i++) {
        var chip = document.createElement('span');
        chip.className = 'treatment-chip';
        chip.innerHTML = enqTreatmentTags[i] +
            ' <span class="chip-remove" onclick="event.stopPropagation();CRMRemoveTreatmentTag(' + i + ')">&times;</span>';
        tagBox.insertBefore(chip, input);
    }

    // Sync hidden field used by SaveEnquiry / display logic
    document.getElementById('enqTreatment').value = enqTreatmentTags.join(', ');
}

function CRMFlushTreatmentInput() {
    var input = document.getElementById('enqTreatmentInput');
    if (!input || !input.value.trim()) return;

    var val = input.value.trim();

    // If a suggestion list is currently showing, use the highlighted match
    var box = document.getElementById('enqTreatmentSuggestions');
    var suggestionsOpen = box && box.style.display === 'block' && enqSuggestionList.length > 0;
    if (suggestionsOpen) {
        var chosen = enqSuggestionList[enqActiveSuggestIndex >= 0 ? enqActiveSuggestIndex : 0];
        if (chosen) {
            CRMAddTreatmentTag(chosen.Title || '');
            return;
        }
    }

    // If a search is still loading, wait for it instead of saving partial text
    if (enqSearchInFlight) {
        enqCommitPending = true;
        return;
    }

    CRMAddTreatmentTag(val);
}

function CRMSetTreatmentTags(str) {
    enqTreatmentTags = (str || '')
        .split(',')
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
    CRMRenderTreatmentTags();
}

// Hide suggestions when clicking outside
$(document).on('click', function (e) {
    if (!$(e.target).closest('#enqTreatmentTagBox, #enqTreatmentSuggestions').length) {
        var box = document.getElementById('enqTreatmentSuggestions');
        if (box) { box.style.display = 'none'; }
    }
});

// ===========================
// ===== LOG CALL — TREATMENT MULTI-SELECT (tags + free text) =====
// ===========================
var _logProcSearchTimer = null;
var logTreatmentTags = [];
var logSuggestionList = [];
var logActiveSuggestIndex = -1;
var logSearchInFlight = false;
var logCommitPending = false;
var logSearchToken = 0;   // ← ADD THIS NEW LINE

function CRMLogProcedureAutocomplete(term) {
    clearTimeout(_logProcSearchTimer);
    var box = document.getElementById('logTreatmentSuggestions');

    if (!term || term.trim() === '') {
        box.style.display = 'none';
        box.innerHTML = '';
        logSuggestionList = [];
        logActiveSuggestIndex = -1;
        logSearchInFlight = false;
        logCommitPending = false;
        logSearchToken++;
        return;
    }

    logSearchInFlight = true;
    logSearchToken++;
    var myToken = logSearchToken;

    _logProcSearchTimer = setTimeout(function () {
        $.ajax({
            type: 'POST',
            url: '../CRM/CRM_ProcedureSearch',
            data: { searchTerm: term },
            success: function (result) {
                if (myToken !== logSearchToken) return;

                var list = result.oList || [];
                list = list.filter(function (x) {
                    return logTreatmentTags.indexOf((x.Title || '').toUpperCase()) === -1;
                });

                // ===== RANK: prefix match first, then contains, alphabetical within each =====
                var upperTerm = term.trim().toUpperCase();
                list.sort(function (a, b) {
                    var aTitle = (a.Title || '').toUpperCase();
                    var bTitle = (b.Title || '').toUpperCase();
                    var aRank = aTitle.indexOf(upperTerm) === 0 ? 0 : 1;
                    var bRank = bTitle.indexOf(upperTerm) === 0 ? 0 : 1;
                    if (aRank !== bRank) return aRank - bRank;
                    return aTitle.localeCompare(bTitle);
                });

                logSuggestionList = list;
                logActiveSuggestIndex = list.length > 0 ? 0 : -1;
                logSearchInFlight = false;

                if (list.length === 0) {
                    box.style.display = 'none';
                    box.innerHTML = '';
                } else {
                    var html = '';
                    for (var i = 0; i < list.length; i++) {
                        var name = list[i].Title || '';
                        html += '<div class="proc-suggest-item' + (i === logActiveSuggestIndex ? ' proc-suggest-active' : '') + '" ' +
                            'data-index="' + i + '" ' +
                            'onmousedown="event.preventDefault();" ' +   // ← ADD THIS
                            'onclick="CRMAddLogTreatmentTag(\'' + name.replace(/'/g, "\\'") + '\')" ' +
                            'style="padding:9px 14px;font-size:13px;color:#374151;cursor:pointer;">' +
                            name + '</div>';
                    }
                    box.innerHTML = html;
                    box.style.display = 'block';
                }

                if (logCommitPending) {
                    logCommitPending = false;
                    if (list.length > 0) {
                        CRMAddLogTreatmentTag(list[0].Title || '');
                    } else {
                        CRMAddLogTreatmentTag(term);
                    }
                }
            },
            error: function () {
                if (myToken !== logSearchToken) return;
                box.style.display = 'none';
                logSuggestionList = [];
                logActiveSuggestIndex = -1;
                logSearchInFlight = false;
                if (logCommitPending) {
                    logCommitPending = false;
                    CRMAddLogTreatmentTag(term);
                }
            }
        });
    }, 250);
}

function CRMHighlightLogSuggestion() {
    var items = document.querySelectorAll('#logTreatmentSuggestions .proc-suggest-item');
    items.forEach(function (el, i) {
        if (i === logActiveSuggestIndex) el.classList.add('proc-suggest-active');
        else el.classList.remove('proc-suggest-active');
    });
}

function CRMLogTreatmentKeydown(event) {
    var input = document.getElementById('logTreatmentInput');
    var box = document.getElementById('logTreatmentSuggestions');
    var suggestionsOpen = box && box.style.display === 'block' && logSuggestionList.length > 0;

    if (event.key === 'ArrowDown' && suggestionsOpen) {
        event.preventDefault();
        logActiveSuggestIndex = (logActiveSuggestIndex + 1) % logSuggestionList.length;
        CRMHighlightLogSuggestion();
        return;
    }
    if (event.key === 'ArrowUp' && suggestionsOpen) {
        event.preventDefault();
        logActiveSuggestIndex = (logActiveSuggestIndex - 1 + logSuggestionList.length) % logSuggestionList.length;
        CRMHighlightLogSuggestion();
        return;
    }

    if (event.key === 'Enter') {
        event.preventDefault();

        if (suggestionsOpen) {
            var chosen = logSuggestionList[logActiveSuggestIndex >= 0 ? logActiveSuggestIndex : 0];
            if (chosen) {
                CRMAddLogTreatmentTag(chosen.Title || '');
                return;
            }
        }

        if (logSearchInFlight) {
            logCommitPending = true;
            return;
        }

        var val = input.value.trim();
        if (val) {
            CRMAddLogTreatmentTag(val);
        }
    } else if (event.key === 'Backspace' && input.value === '' && logTreatmentTags.length > 0) {
        logTreatmentTags.pop();
        CRMRenderLogTreatmentTags();
    }
}

function CRMAddLogTreatmentTag(value) {
    value = (value || '').trim().toUpperCase();
    if (!value) return;
    if (logTreatmentTags.indexOf(value) === -1) {
        logTreatmentTags.push(value);
    }
    var input = document.getElementById('logTreatmentInput');
    input.value = '';
    CRMRenderLogTreatmentTags();

    var box = document.getElementById('logTreatmentSuggestions');
    box.style.display = 'none';
    box.innerHTML = '';
    input.focus();
}

function CRMRemoveLogTreatmentTag(index) {
    logTreatmentTags.splice(index, 1);
    CRMRenderLogTreatmentTags();
}

function CRMRenderLogTreatmentTags() {
    var tagBox = document.getElementById('logTreatmentTagBox');
    var input = document.getElementById('logTreatmentInput');

    tagBox.querySelectorAll('.treatment-chip').forEach(function (c) { c.remove(); });

    for (var i = 0; i < logTreatmentTags.length; i++) {
        var chip = document.createElement('span');
        chip.className = 'treatment-chip';
        chip.innerHTML = logTreatmentTags[i] +
            ' <span class="chip-remove" onclick="event.stopPropagation();CRMRemoveLogTreatmentTag(' + i + ')">&times;</span>';
        tagBox.insertBefore(chip, input);
    }

    document.getElementById('logTreatment').value = logTreatmentTags.join(', ');
}

function CRMSetLogTreatmentTags(str) {
    logTreatmentTags = (str || '')
        .split(',')
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
    CRMRenderLogTreatmentTags();
}

function CRMFlushLogTreatmentInput() {
    var input = document.getElementById('logTreatmentInput');
    if (!input || !input.value.trim()) return;

    var val = input.value.trim();

    var box = document.getElementById('logTreatmentSuggestions');
    var suggestionsOpen = box && box.style.display === 'block' && logSuggestionList.length > 0;
    if (suggestionsOpen) {
        var chosen = logSuggestionList[logActiveSuggestIndex >= 0 ? logActiveSuggestIndex : 0];
        if (chosen) {
            CRMAddLogTreatmentTag(chosen.Title || '');
            return;
        }
    }

    if (logSearchInFlight) {
        logCommitPending = true;
        return;
    }

    CRMAddLogTreatmentTag(val);
}

// Hide suggestions when clicking outside
$(document).on('click', function (e) {
    if (!$(e.target).closest('#logTreatmentTagBox, #logTreatmentSuggestions').length) {
        var box = document.getElementById('logTreatmentSuggestions');
        if (box) { box.style.display = 'none'; }
    }
});

function GoToFollowupsToday() {
    // Switch to the Patient Enquiries tab
    ShowTab('enquiries', document.getElementById('tabEnquiries'));

    // Make sure the right-side panel is showing TODAY's follow-ups
    setTimeout(function () {
        FollowupQuick('today');
    }, 300);

    // Scroll to the very top of the page (not into the follow-up panel)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

// ===========================
// ===== LOCATION / AREA AUTOCOMPLETE (Master/Area) =====
// ===========================
var _areaSearchTimer = null;
var enqAreaSuggestionList = [];

function CRMAreaAutocomplete(term) {
    clearTimeout(_areaSearchTimer);
    var box = document.getElementById('enqLocationSuggestions');

    if (!term || term.trim() === '') {
        box.style.display = 'none';
        box.innerHTML = '';
        enqAreaSuggestionList = [];
        return;
    }

    _areaSearchTimer = setTimeout(function () {
        $.ajax({
            type: 'POST',
            url: '../CRM/CRM_AreaSearch',       // <-- backend action, see stub below
            data: { searchTerm: term },
            success: function (result) {
                var list = result.oList || [];
                enqAreaSuggestionList = list;

                if (list.length === 0) {
                    box.style.display = 'none';
                    box.innerHTML = '';
                    return;
                }

                var html = '';
                for (var i = 0; i < list.length; i++) {
                    var name = list[i].Title || '';
                    html += '<div class="proc-suggest-item" ' +
                        'onmousedown="event.preventDefault();" ' +
                        'onclick="CRMSelectArea(\'' + name.replace(/'/g, "\\'") + '\')" ' +
                        'style="padding:9px 14px;font-size:13px;color:#374151;cursor:pointer;">' +
                        name + '</div>';
                }
                box.innerHTML = html;
                box.style.display = 'block';
            },
            error: function () {
                box.style.display = 'none';
                box.innerHTML = '';
            }
        });
    }, 250);
}

function CRMSelectArea(name) {
    document.getElementById('enqLocation').value = name;
    CRMHideAreaSuggestions();
}

function CRMHideAreaSuggestions() {
    var box = document.getElementById('enqLocationSuggestions');
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
}

function CRMOpenAreaMaster() {
    // Opens the Area master screen in a new tab so the enquiry form stays untouched
    window.open('../Master/Area', '_blank');
}

// Hide suggestions when clicking outside
$(document).on('click', function (e) {
    if (!$(e.target).closest('#enqLocation, #enqLocationSuggestions').length) {
        CRMHideAreaSuggestions();
    }
});

function GoToPatientEnquiries() {
    // Switch to the Patient Enquiries tab, showing ALL enquiries (no filter)
    ShowTab('enquiries', document.getElementById('tabEnquiries'));

    // Reset any lingering filters so the full list shows
    setTimeout(function () {
        ResetFilters();
    }, 300);

    // Land at the top of the page, like a normal tab click
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

// ===========================
// ===== OPEN APPOINTMENT BOOKING WITH PREFILL (no changes to Appointment page) =====
// ===========================
function OpenAppointmentWithPrefill(patientName, patientMobile, patientEmail) {
    var apptWin = window.open('../Master/Appointment', '_blank');
    if (!apptWin) {
        CRMWarningShow('Please allow pop-ups to open Appointment Booking.');
        return;
    }

    function applyPrefill() {
        try {
            var doc = apptWin.document;
            var firstEl = doc.getElementById('AppFirst');
            var mobileEl = doc.getElementById('MobileNo');
            var emailEl = doc.getElementById('EmailId');
            if (firstEl) firstEl.value = patientName || '';
            if (mobileEl) mobileEl.value = patientMobile || '';
            if (emailEl) emailEl.value = patientEmail || '';
        } catch (e) {
            // Window not ready yet or was closed — safe to ignore
        }
    }

    function attachModalWatcher() {
        try {
            var modal = apptWin.document.getElementById('patient-modal');
            if (!modal) return false;

            applyPrefill(); // fill once immediately (harmless even while modal is hidden)

            var observer = new apptWin.MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                    if (m.attributeName === 'class') {
                        var isHidden = modal.classList.contains('hidden');
                        if (!isHidden) {
                            // Modal just opened — their own reset() may have just run,
                            // so re-apply our values a moment after
                            setTimeout(applyPrefill, 50);
                        }
                    }
                });
            });
            observer.observe(modal, { attributes: true });
            return true;
        } catch (e) {
            return false;
        }
    }

    // Poll until the new tab has fully loaded and the modal exists in its DOM
    var tries = 0;
    var poller = setInterval(function () {
        tries++;
        if (apptWin.closed) { clearInterval(poller); return; }
        if (tries > 100) { clearInterval(poller); return; } // ~20s safety timeout

        try {
            if (apptWin.document.readyState === 'complete' &&
                apptWin.document.getElementById('patient-modal')) {
                if (attachModalWatcher()) {
                    clearInterval(poller);
                }
            }
        } catch (e) {
            // Not ready yet
        }
    }, 200);
}
// ===========================
// ===== APPOINTMENT CONFIRM MODAL (replaces unreliable swal callback) =====
// ===========================
var _crmApptConfirmData = null;

function ShowApptConfirmModal(patientName, patientMobile, patientEmail) {
    _crmApptConfirmData = { name: patientName, mobile: patientMobile, email: patientEmail };
    $('#crmApptConfirmMessage').text(
        'Appointment date set for ' + (patientName || 'this patient') + '. Open Appointment Booking now?'
    );
    $('#crmApptConfirmModal').css('display', 'flex');
}

function CRMApptConfirmYes() {
    $('#crmApptConfirmModal').hide();
    if (_crmApptConfirmData) {
        OpenAppointmentWithPrefill(_crmApptConfirmData.name, _crmApptConfirmData.mobile, _crmApptConfirmData.email);
    }
    _crmApptConfirmData = null;
    LoadEnquiries();
    LoadFollowupBoard();
}
// ===========================
// ===== BOOK APPOINTMENT TRIGGERS (Enquiry list + Followup board) =====
// ===========================
function CRMBookAppointmentFromEnquiry(enquiryId) {
    var item = CRMEnquiryList.find(function (x) { return x.EnquiryId == enquiryId; });
    if (!item) {
        CRMWarningShow('Patient data not found.');
        return;
    }
    OpenAppointmentWithPrefill(item.PatientName || '', item.Mobile || '', item.Email || '');
}

function CRMBookAppointmentFromFollowup(enquiryId) {
    var item = CRMFollowupListRendered.find(function (x) { return x.EnquiryId == enquiryId; }) ||
        CRMFollowupList.find(function (x) { return x.EnquiryId == enquiryId; });
    if (!item) {
        CRMWarningShow('Patient data not found.');
        return;
    }
    OpenAppointmentWithPrefill(item.PatientName || '', item.Mobile || '', item.Email || '');
}
function CRMApptConfirmNo() {
    $('#crmApptConfirmModal').hide();
    _crmApptConfirmData = null;
    LoadEnquiries();
    LoadFollowupBoard();
}

function CRMClearDate(inputId) {
    var el = $('#' + inputId);
    var picker = el.data('daterangepicker');
    if (picker) {
        picker.setStartDate(moment());
        picker.setEndDate(moment());
    }
    el.val('');
}

// ===========================
// ===== IMPORT FROM EXCEL =====
// ===========================
var ImportExcelRows = [];
var ImportSourceOptions = ['Google', 'Facebook', 'Instagram', 'Direct', 'Referral'];

function OpenImportExcel() {
    document.getElementById('importExcelModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('importExcelFile').value = '';
    document.getElementById('importUploadStep').style.display = 'block';
    document.getElementById('importPreviewStep').style.display = 'none';
    document.getElementById('importSaveAllBtn').style.display = 'none';
    document.getElementById('importSaveStatus').textContent = '';
    ImportExcelRows = [];
}

function CloseImportExcel() {
    document.getElementById('importExcelModal').style.display = 'none';
    document.body.style.overflow = '';
}
function IsValidDateDDMMYYYY(str) {
    if (!str) return true;
    var parts = str.split('/');
    if (parts.length !== 3) return false;
    var dd = parseInt(parts[0], 10), mm = parseInt(parts[1], 10), yyyy = parseInt(parts[2], 10);
    if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return false;
    if (mm < 1 || mm > 12) return false;
    if (dd < 1 || dd > 31) return false;
    if (yyyy < 1900 || yyyy > 2100) return false;
    var d = new Date(yyyy, mm - 1, dd);
    return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

function ValidateImportRow(r) {
    var errors = {};

    if (!r.PatientName) {
        errors.PatientName = 'Patient Name is required';
    }

    if (!r.Mobile) {
        errors.Mobile = 'Mobile number is required';
    } else if (r.Mobile.length < 7 || r.Mobile.length > 15) {
        errors.Mobile = 'Mobile number looks invalid (' + r.Mobile.length + ' digits)';
    }

    if (r.EnquiryDate && !IsValidDateDDMMYYYY(r.EnquiryDate)) {
        errors.EnquiryDate = 'Invalid date - use DD/MM/YYYY';
    }

    if (r.FollowupDate && !IsValidDateDDMMYYYY(r.FollowupDate)) {
        errors.FollowupDate = 'Invalid date - use DD/MM/YYYY';
    }

    return errors;
}


function HandleImportExcelFile(file) {
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array', cellDates: true });
            var sheet = workbook.Sheets[workbook.SheetNames[0]];
            var rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            if (!rows || rows.length === 0) {
                CRMWarningShow('No data found in the uploaded file.');
                return;
            }

            ImportExcelRows = rows.map(MapExcelRowToEnquiry);
            RenderImportPreview();
        } catch (err) {
            CRMWarningShow('Could not read the file. Please upload a valid Excel/CSV file.');
        }
    };
    reader.readAsArrayBuffer(file);
}

function NormalizeHeaderKey(key) {
    return (key || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

var ImportHeaderAliasMap = {
    'PATIENTNAME': 'PatientName', 'NAME': 'PatientName', 'FULLNAME': 'PatientName',
    'MOBILE': 'Mobile', 'MOBILENUMBER': 'Mobile', 'PHONE': 'Mobile', 'PHONENUMBER': 'Mobile', 'CONTACT': 'Mobile',
    'EMAIL': 'Email', 'EMAILID': 'Email',
    'SOURCE': 'Source', 'LEADSOURCE': 'Source',
    'LOCATION': 'Location', 'AREA': 'Location', 'CITY': 'Location',
    'TREATMENTINQUIRED': 'TreatmentInquired', 'TREATMENT': 'TreatmentInquired', 'PROCEDURE': 'TreatmentInquired',
    'ENQUIRYDATE': 'EnquiryDate', 'DATE': 'EnquiryDate',
    'FOLLOWUPDATE': 'FollowupDate', 'NEXTFOLLOWUPDATE': 'FollowupDate',
    'NOTES': 'Notes', 'REMARKS': 'Notes', 'REMARKSNOTES': 'Notes'
};

function FormatExcelDateValue(val) {
    if (!val) return '';
    if (val instanceof Date && !isNaN(val)) {
        var dd = String(val.getDate()).padStart(2, '0');
        var mm = String(val.getMonth() + 1).padStart(2, '0');
        return dd + '/' + mm + '/' + val.getFullYear();
    }
    return val.toString().trim();
}

function MapExcelRowToEnquiry(rawRow) {
    var mapped = {
        PatientName: '', Mobile: '', Email: '', Source: '', Location: '',
        TreatmentInquired: '', EnquiryDate: '', FollowupDate: '', Notes: ''
    };

    Object.keys(rawRow).forEach(function (key) {
        var field = ImportHeaderAliasMap[NormalizeHeaderKey(key)];
        if (!field) return;

        var value = rawRow[key];
        if (field === 'EnquiryDate' || field === 'FollowupDate') {
            mapped[field] = FormatExcelDateValue(value);
        } else if (field === 'Mobile') {
            mapped[field] = (value || '').toString().replace(/[^0-9]/g, '');
        } else {
            mapped[field] = (value || '').toString().trim();
        }
    });

    if (!mapped.EnquiryDate) mapped.EnquiryDate = GetTodayDate();

    var srcMatch = ImportSourceOptions.find(function (s) {
        return s.toUpperCase() === mapped.Source.toUpperCase();
    });
    mapped.Source = srcMatch || 'Direct';

    return mapped;
}

function RenderImportPreview() {
    document.getElementById('importUploadStep').style.display = 'none';
    document.getElementById('importPreviewStep').style.display = 'block';
    document.getElementById('importSaveAllBtn').style.display = 'inline-flex';
    document.getElementById('importRowCountBadge').textContent = ImportExcelRows.length + ' rows';
    document.getElementById('importSaveAllCount').textContent = '(' + ImportExcelRows.length + ')';

    var body = document.getElementById('importPreviewBody');
    var html = '';
    var totalErrorRows = 0;

    for (var i = 0; i < ImportExcelRows.length; i++) {
        var r = ImportExcelRows[i];
        var errors = ValidateImportRow(r);
        var rowHasError = Object.keys(errors).length > 0;
        if (rowHasError) totalErrorRows++;

        html += '<tr data-row="' + i + '" style="border-bottom:1px solid #f3f4f6;' +
            (rowHasError ? 'background:#fffafa;' : '') + '">' +
            '<td style="padding:6px;color:#9ca3af;">' + (i + 1) + '</td>' +
            ImportCellInput(i, 'PatientName', r.PatientName, errors.PatientName) +
            ImportCellInput(i, 'Mobile', r.Mobile, errors.Mobile) +
            ImportCellInput(i, 'Email', r.Email, null) +
            ImportCellSourceSelect(i, r.Source) +
            ImportCellInput(i, 'Location', r.Location, null) +
            ImportCellInput(i, 'TreatmentInquired', r.TreatmentInquired, null) +
            ImportCellInput(i, 'EnquiryDate', r.EnquiryDate, errors.EnquiryDate) +
            ImportCellInput(i, 'FollowupDate', r.FollowupDate, errors.FollowupDate) +
            ImportCellInput(i, 'Notes', r.Notes, null) +
            '<td style="padding:6px;text-align:center;">' +
            '<span onclick="RemoveImportRow(' + i + ')" style="cursor:pointer;color:#ef4444;" title="Remove row"><i class="ft-trash-2"></i></span>' +
            '</td></tr>';
    }
    body.innerHTML = html;

    UpdateImportErrorBanner();
}
// ===========================
// ===== LEAD ASSIGNMENT =====
// ===========================
var AssignStaffList = [];
var AssignSelectedIds = new Set();

function LoadStaffList(callback) {
    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_GetStaffList',
        success: function (result) {
            AssignStaffList = result.oList || [];
            if (callback) callback();
        },
        error: function () {
            if (callback) callback();
        }
    });
}

// ===========================
// ===== STAFF AUTOCOMPLETE (plain list, same pattern as Location/Treatment) =====
// ===========================
function CRMStaffFilter(term, boxId, hiddenFieldId, inputId) {
    var box = document.getElementById(boxId);
    if (!box) return;

    var upperTerm = (term || '').trim().toUpperCase();
    var list = (AssignStaffList || []).filter(function (u) {
        return !upperTerm || (u.Name || '').toUpperCase().indexOf(upperTerm) >= 0;
    });

    if (list.length === 0) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
        html += '<div class="proc-suggest-item" ' +
            'onmousedown="event.preventDefault();" ' +
            'onclick="CRMSelectStaff(' + list[i].UserId + ',\'' +
            (list[i].Name || '').replace(/'/g, "\\'") + '\',\'' +
            hiddenFieldId + '\',\'' + inputId + '\',\'' + boxId + '\')" ' +
            'style="padding:9px 14px;font-size:13px;color:#374151;cursor:pointer;">' +
            list[i].Name + '</div>';
    }
    box.innerHTML = html;
    box.style.display = 'block';
}

function CRMSelectStaff(userId, name, hiddenFieldId, inputId, boxId) {
    document.getElementById(inputId).value = name;
    document.getElementById(hiddenFieldId).value = userId;
    CRMHideStaffSuggestions(boxId);

    if (hiddenFieldId === 'assignFilterStaff' && typeof RenderAssignmentList === 'function') {
        RenderAssignmentList();
    }
}

function CRMHideStaffSuggestions(boxId) {
    var box = document.getElementById(boxId);
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
}

// Hide suggestions when clicking outside any staff input/box pair
$(document).on('click', function (e) {
    if (!$(e.target).closest('#enqAssignedToInput, #enqAssignedToSuggestions').length) {
        CRMHideStaffSuggestions('enqAssignedToSuggestions');
    }
    if (!$(e.target).closest('#assignFilterStaffInput, #assignFilterStaffSuggestions').length) {
        CRMHideStaffSuggestions('assignFilterStaffSuggestions');
    }
    if (!$(e.target).closest('#assignModalStaffInput, #assignModalStaffSuggestions').length) {
        CRMHideStaffSuggestions('assignModalStaffSuggestions');
    }
});



function LoadLeadAssignment() {
    AssignSelectedIds.clear();
    UpdateAssignSelectedButton();

    if (AssignStaffList.length === 0) {
        LoadStaffList(RenderAssignmentList);
    } else {
        RenderAssignmentList();
    }
}

function RenderAssignmentList() {
    var unassignedOnly = document.getElementById('assignUnassignedOnly').checked;
    var staffFilter = document.getElementById('assignFilterStaff').value;
    var search = document.getElementById('assignSearch').value.toLowerCase().trim();

    var list = CRMEnquiryList.filter(function (x) {
        if (unassignedOnly && x.AssignedToUserId) return false;
        if (staffFilter && String(x.AssignedToUserId || '') !== staffFilter) return false;
        if (search) {
            var hay = ((x.PatientName || '') + ' ' + (x.Mobile || '')).toLowerCase();
            if (hay.indexOf(search) < 0) return false;
        }
        return true;
    });

    var body = document.getElementById('assignmentTableBody');
    if (list.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="padding:30px;text-align:center;color:#9ca3af;">No leads found.</td></tr>';
        return;
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var checked = AssignSelectedIds.has(item.EnquiryId) ? 'checked' : '';
        var assignedPill = item.AssignedToUserId && item.AssignedToName
            ? '<span style="background:#e6f1fb;color:#185FA5;font-size:13px;font-weight:700;padding:5px 12px;border-radius:20px;">' + item.AssignedToName + '</span>'
            : '<span style="background:#f3f4f6;color:#9ca3af;font-size:13px;font-weight:700;padding:5px 12px;border-radius:20px;">Unassigned</span>';
        html += '<tr style="border-top:1px solid #f3f4f6;">' +
            '<td style="padding:14px 12px;"><input type="checkbox" class="assign-row-check" data-id="' + item.EnquiryId + '" ' + checked + ' onchange="ToggleAssignRow(' + item.EnquiryId + ', this.checked)" style="width:16px;height:16px;" /></td>' +
            '<td style="padding:14px 12px;font-weight:600;color:#111827;font-size:16px;">' + (item.PatientName || '') + '</td>' +
            '<td style="padding:14px 12px;color:#374151;font-size:15px;">' + (item.Mobile || '') + '</td>' +
            '<td style="padding:14px 12px;">' + GetSourceBadge(item.Source || 'Direct') + '</td>' +
            '<td style="padding:14px 12px;">' + GetRankBadge(item.Temperature || 'Warm') + '</td>' +
            '<td style="padding:14px 12px;">' + assignedPill + '</td>' +
            '</tr>';
    }
    body.innerHTML = html;

    document.getElementById('assignSelectAll').checked =
        list.length > 0 && list.every(function (x) { return AssignSelectedIds.has(x.EnquiryId); });
}

function ToggleAssignRow(enquiryId, checked) {
    if (checked) AssignSelectedIds.add(enquiryId);
    else AssignSelectedIds.delete(enquiryId);
    UpdateAssignSelectedButton();
}

function ToggleSelectAllAssign(checkbox) {
    document.querySelectorAll('.assign-row-check').forEach(function (cb) {
        cb.checked = checkbox.checked;
        var id = parseInt(cb.getAttribute('data-id'));
        if (checkbox.checked) AssignSelectedIds.add(id);
        else AssignSelectedIds.delete(id);
    });
    UpdateAssignSelectedButton();
}

function UpdateAssignSelectedButton() {
    var count = AssignSelectedIds.size;
    document.getElementById('assignSelectedCount').textContent = count;
    document.getElementById('btnAssignSelected').style.display = count > 0 ? 'inline-flex' : 'none';
}

function OpenAssignModal() {
    if (AssignSelectedIds.size === 0) return;
    document.getElementById('assignModalCount').textContent = AssignSelectedIds.size;
    $('#assignModalStaffInput').val('');
    document.getElementById('assignModalStaffSelect').value = '';
    document.getElementById('assignLeadsModal').style.display = 'flex';
}

function CloseAssignModal() {
    document.getElementById('assignLeadsModal').style.display = 'none';
}

function ConfirmAssignLeads() {
    var staffId = document.getElementById('assignModalStaffSelect').value;
    if (!staffId) {
        CRMWarningShow('Please select a staff member.');
        return;
    }

    var data = {
        EnquiryIdList: Array.from(AssignSelectedIds).join('#'),
        AssignedToUserId: staffId,
        UserId: ERPUserId,
        DeptId: ERPDeptId
    };

    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_AssignLeads',
        data: data,
        success: function (result) {
            CloseAssignModal();
            if (result.oList && result.oList.length > 0 && result.oList[0].Status == '1') {
                swal('Success', AssignSelectedIds.size + ' lead(s) assigned successfully!', 'success');
                AssignSelectedIds.clear();
                UpdateAssignSelectedButton();
                LoadEnquiries(); // refreshes CRMEnquiryList, which RenderAssignmentList reads from
            } else {
                swal('Error', 'Could not assign leads. Please try again.', 'error');
            }
        },
        error: function () {
            swal('Error', 'Server error while assigning leads.', 'error');
        }
    });
}

function ImportCellInput(rowIndex, field, value, errorMsg) {
    var hasError = !!errorMsg;
    return '<td style="padding:4px;vertical-align:top;">' +
        '<input type="text" value="' + (value || '').toString().replace(/"/g, '&quot;') + '" ' +
        'oninput="UpdateImportField(' + rowIndex + ',\'' + field + '\',this.value)" ' +
        'title="' + (hasError ? errorMsg.replace(/"/g, '&quot;') : '') + '" ' +
        'style="width:120px;padding:5px 7px;font-size:12px;border:1px solid ' +
        (hasError ? '#ef4444' : '#e5e7eb') + ';border-radius:5px;outline:none;' +
        (hasError ? 'background:#fff5f5;' : '') + '" />' +
        (hasError ? '<div style="font-size:10px;color:#ef4444;margin-top:2px;max-width:120px;line-height:1.3;">' + errorMsg + '</div>' : '') +
        '</td>';
}

function ImportCellSourceSelect(rowIndex, value) {
    var options = ImportSourceOptions.map(function (s) {
        return '<option value="' + s + '"' + (s === value ? ' selected' : '') + '>' + s + '</option>';
    }).join('');
    return '<td style="padding:4px;">' +
        '<select onchange="UpdateImportField(' + rowIndex + ',\'Source\',this.value)" ' +
        'style="width:100px;padding:5px 7px;font-size:12px;border:1px solid #e5e7eb;border-radius:5px;outline:none;">' +
        options + '</select></td>';
}

function UpdateImportField(rowIndex, field, value) {
    if (!ImportExcelRows[rowIndex]) return;
    ImportExcelRows[rowIndex][field] = field === 'Mobile' ? value.replace(/[^0-9]/g, '') : value;
    RevalidateImportRow(rowIndex);
}

var ImportFieldOrder = ['PatientName', 'Mobile', 'Email', 'Source', 'Location', 'TreatmentInquired', 'EnquiryDate', 'FollowupDate', 'Notes'];

function RevalidateImportRow(rowIndex) {
    var r = ImportExcelRows[rowIndex];
    if (!r) return;
    var errors = ValidateImportRow(r);

    var row = document.querySelector('tr[data-row="' + rowIndex + '"]');
    if (!row) return;
    row.style.background = Object.keys(errors).length > 0 ? '#fffafa' : '';

    var cells = row.querySelectorAll('td');
    ImportFieldOrder.forEach(function (field, idx) {
        var td = cells[idx + 1]; // +1 to skip the "#" column
        if (!td) return;
        var errMsg = errors[field];

        var input = td.querySelector('input');
        if (input) {
            input.style.border = '1px solid ' + (errMsg ? '#ef4444' : '#e5e7eb');
            input.style.background = errMsg ? '#fff5f5' : '';
            input.title = errMsg || '';
        }

        var errDiv = td.querySelector('div');
        if (errMsg) {
            if (errDiv) {
                errDiv.textContent = errMsg;
            } else {
                var div = document.createElement('div');
                div.style.cssText = 'font-size:10px;color:#ef4444;margin-top:2px;max-width:120px;line-height:1.3;';
                div.textContent = errMsg;
                td.appendChild(div);
            }
        } else if (errDiv) {
            errDiv.remove();
        }
    });

    UpdateImportErrorBanner();
}

function UpdateImportErrorBanner() {
    var totalErrorRows = ImportExcelRows.filter(function (r) {
        return Object.keys(ValidateImportRow(r)).length > 0;
    }).length;

    var banner = document.getElementById('importErrorBanner');
    if (!banner) return;
    banner.textContent = totalErrorRows > 0
        ? totalErrorRows + ' row(s) have errors — hover over the red fields to see details.'
        : 'All rows look valid.';
    banner.style.color = totalErrorRows > 0 ? '#A32D2D' : '#3B6D11';
    banner.style.fontWeight = '600';
}

function RemoveImportRow(rowIndex) {
    ImportExcelRows.splice(rowIndex, 1);
    RenderImportPreview();
}

function SaveAllImportedEnquiries() {
    if (ImportExcelRows.length === 0) {
        CRMWarningShow('No rows to import.');
        return;
    }

    var errorSummary = [];
    ImportExcelRows.forEach(function (r, idx) {
        var errors = ValidateImportRow(r);
        var msgs = Object.keys(errors).map(function (f) { return errors[f]; });
        if (msgs.length > 0) {
            errorSummary.push('Row ' + (idx + 1) + ' (' + (r.PatientName || 'no name') + '): ' + msgs.join('; '));
        }
    });

    if (errorSummary.length > 0) {
        RenderImportPreview();
        swal('Fix errors before importing', errorSummary.join('\n'), 'error');
        return;
    }

    var statusEl = document.getElementById('importSaveStatus');
    var btn = document.getElementById('importSaveAllBtn');
    btn.disabled = true;
    btn.style.opacity = '0.6';

    var total = ImportExcelRows.length;
    var completed = 0, successCount = 0, failCount = 0;

    function saveNext(index) {
        if (index >= total) {
            btn.disabled = false;
            btn.style.opacity = '1';
            statusEl.textContent = 'Done: ' + successCount + ' imported, ' + failCount + ' failed.';
            swal('Import Complete', successCount + ' enquiries imported' + (failCount > 0 ? ', ' + failCount + ' failed.' : '.'), failCount > 0 ? 'warning' : 'success');
            LoadEnquiries();
            LoadDashboard();
            if (typeof LoadFollowupBoard === 'function') LoadFollowupBoard();
            if (successCount > 0) setTimeout(CloseImportExcel, 1200);
            return;
        }

        var r = ImportExcelRows[index];
        var data = {
            EnquiryId: 0,
            PatientName: r.PatientName,
            Mobile: r.Mobile,
            Email: r.Email,
            Location: r.Location,
            EnquiryDate: r.EnquiryDate || GetTodayDate(),
            Source: r.Source || 'Direct',
            Stage: 'New Lead',
            Temperature: 'Warm',
            TreatmentInquired: r.TreatmentInquired,
            Notes: r.Notes,
            FollowupDate: r.FollowupDate,
            DelFlag: 0,
            UserId: ERPUserId,
            DeptId: ERPDeptId,
            Flag: 1
        };

        $.ajax({
            type: 'POST',
            url: '../CRM/CRM_EnquiryInsertandUpdate',
            data: data,
            success: function (result) {
                if (result.oList && result.oList.length > 0 && result.oList[0].Status == '1') {
                    successCount++;
                } else {
                    failCount++;
                }
            },
            error: function () { failCount++; },
            complete: function () {
                completed++;
                statusEl.textContent = 'Importing ' + completed + ' / ' + total + '...';
                saveNext(index + 1);
            }
        });
    }

    statusEl.textContent = 'Importing 0 / ' + total + '...';
    saveNext(0);
}
function SaveEditEnquiry() {
    var patientName = $('#editPatientName').val().trim();
    var mobile      = $('#editMobile').val().trim();

    if (!patientName) {
        CRMWarningShow('Please Enter Patient Name', 'editPatientName');
        return;
    }
    if (!mobile) {
        CRMWarningShow('Please Enter Mobile Number', 'editMobile');
        return;
    }

    var data = {};
    data.EnquiryId         = $('#editEnqId').val();
    data.PatientName       = patientName;
    data.CompanyName       = $('#editCompany').val();
    data.Mobile            = mobile;
    data.Email             = $('#editEmail').val();
    data.EnquiryDate       = $('#editEnqDate').val() || GetTodayDate();
    data.Source            = $('#editSource').val();
    data.Stage             = $('#editStage').val();
    data.Temperature       = $('#editTemperature').val();
    data.TreatmentInquired = $('#editTreatment').val();
    data.HandoverNote      = $('#editHandover').val();
    data.Notes             = $('#editRemarks').val();
    data.FollowupDate      = $('#editFollowupDate').val();
    data.DelFlag           = 0;
    data.UserId            = ERPUserId;
    data.DeptId            = ERPDeptId;
    data.Flag              = 2;   // UPDATE flag

    $.ajax({
        type: 'POST',
        url: '../CRM/CRM_EnquiryInsertandUpdate',
        data: data,
        success: function (result) {
            if (result.oList && result.oList.length > 0) {
                var status = result.oList[0].Status;
                if (status == 2 || status == '2') {
                    CloseEditEnquiry();
                    swal('Updated!', 'Patient details updated successfully.', 'success');
                    LoadEnquiries();
                    LoadFollowupBoard();
                    LoadDashboard();
                } else {
                    swal('Error', 'Could not update. Please try again.', 'error');
                }
            }
        },
        error: function () {
            swal('Error', 'Server error. Please try again.', 'error');
        }
    });
}