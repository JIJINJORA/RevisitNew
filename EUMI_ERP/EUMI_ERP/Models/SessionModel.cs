using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using EUMI_ERP.DataLayer;

namespace EUMI_ERP.Models
{
    public class SessionModel
    {
        // --- HMS_ProcedureScheduleMapping ---
        public long TreatmentId { get; set; }
        public long ProcedureId { get; set; }
        public string TreatmentName { get; set; }
        public int TemplateType { get; set; }
        public int NumberOfSessions { get; set; }
        public decimal DefaultDuration { get; set; }
        public int IsActive { get; set; }
        public int CreatedBy { get; set; }
        public string CreatedDate { get; set; }
        public int ModifiedBy { get; set; }
        public string ModifiedDate { get; set; }

        // --- HMS_SessionTreatmentDay ---
        public long DayId { get; set; }
        public int DayOfWeek { get; set; }
        public decimal Duration { get; set; }
        public int DisplayOrder { get; set; }
        public string Notes { get; set; }
        public int SessionNumber { get; set; }

        // --- HMS_SessionTreatmentForm ---
        public long RecordID { get; set; }
        public string RegNo { get; set; }
        public string PatientName { get; set; }
        public string AgeSex { get; set; }
        public string DoctorName { get; set; }
        public string Contact { get; set; }
        public string OPIPNumber { get; set; }
        public string Age { get; set; }
        public string Sex { get; set; }
        public string ContactNo { get; set; }
        public int DoctorId { get; set; }
        public string OPNo { get; set; }
        public string IPNo { get; set; }
        public int SLNo { get; set; }
        public string SessionDate { get; set; }
        public decimal Hours { get; set; }
        public string Room { get; set; }
        public string TherapistConsultant { get; set; }

        // --- HMS_SessionTreatmentEditor / HMS_SessionTreatmentEditorDetails ---
        public int EditorId { get; set; }
        public int NoOfSessions { get; set; }
        public int DetailId { get; set; }
        public int AfterDays { get; set; }
        public string DetailsXML { get; set; }
        public string ProcedureCode { get; set; }

        // --- Shared ---
        public int DelFlag { get; set; }  // 1=Active / 0=Deleted
        public string ProcedureName { get; set; }
        public string Status { get; set; }
        public string SessionDaysJson { get; set; }  // JSON string for bulk day rows

        DSession oDSession = new DSession();

        // ── Safe parsing helpers — never throw FormatException ──
        // Use InvariantCulture so server locale (comma vs dot decimal separator) can't break parsing

        // SessionModel.cs
        public DataSet HMS_TherapistSearch(string searchText, string dbName)
        {
            return oDSession.HMS_TherapistSearch(searchText, dbName);
        }
        public static long ToSafeLong(object val)
        {
            if (val == null || val == DBNull.Value) return 0;
            long result;
            return long.TryParse(val.ToString().Trim(), out result) ? result : 0;
        }

        public static int ToSafeInt(object val)
        {
            if (val == null || val == DBNull.Value) return 0;
            int result;
            return int.TryParse(val.ToString().Trim(), out result) ? result : 0;
        }

        public static decimal ToSafeDecimal(object val)
        {
            if (val == null || val == DBNull.Value) return 0;
            decimal result;
            return decimal.TryParse(
                val.ToString().Trim(),
                System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture,
                out result) ? result : 0;
        }

        public static string ToSafeString(object val)
        {
            return (val == null || val == DBNull.Value) ? "" : val.ToString();
        }

        public DataSet HMS_ProcedureSearch(SessionModel oModel, string dbName)
        {
            return oDSession.HMS_ProcedureSearch(oModel, dbName);
        }

        public DataSet HMS_SessionTreatmentInsertandUpdate(SessionModel oModel, string dbName)
        {
            return oDSession.HMS_SessionTreatmentInsertandUpdate(oModel, dbName);
        }

        public DataSet HMS_SessionTreatmentGetandGets(SessionModel oModel, string dbName)
        {
            return oDSession.HMS_SessionTreatmentGetandGets(oModel, dbName);
        }

        public DataSet HMS_SessionDayDelete(SessionModel oModel, string dbName)
        {
            return oDSession.HMS_SessionDayDelete(oModel, dbName);
        }
        public DataSet HMS_SessionTreatmentEditorGetbyProcedure(SessionModel oModel, string dbName)
        {
            return oDSession.HMS_SessionTreatmentEditorGetbyProcedure(oModel, dbName);
        }

        public DataSet HMS_SessionTreatmentEditorSave(SessionModel oModel, string dbName)
        {
            return oDSession.HMS_SessionTreatmentEditorSave(oModel, dbName);
        }
        public DataSet HMS_SessionTreatmentListView(string DateFrom, string DateTo, string dbName)
        {
            return oDSession.HMS_SessionTreatmentListView(DateFrom, DateTo, dbName);
        }
    }
}